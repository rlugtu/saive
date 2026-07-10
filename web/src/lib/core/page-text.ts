import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Best-effort server-side fetch of a page's readable text, for the comprehension
 * layer. Unlike LinkPreview/Microlink (which fetch the target on their side,
 * avoiding SSRF), this fetches from our server — so it is guarded:
 *   - http(s) only
 *   - the host must not resolve to a loopback/private/link-local/reserved address
 *   - redirects are followed manually (max 3), re-validating each hop's host
 *   - a request timeout, an html-only content-type check, and a byte cap
 * Any guard trip or failure returns `null` so the caller falls back to metadata.
 */

const TIMEOUT_MS = 5000;
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const MAX_TEXT_CHARS = 8000;

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

/** Loopback / private / link-local / reserved ranges we must never fetch. */
function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) {
    const n = ipToInt(ip);
    const inRange = (base: string, bits: number) =>
      (n >>> (32 - bits)) === (ipToInt(base) >>> (32 - bits));
    return (
      inRange("10.0.0.0", 8) ||
      inRange("172.16.0.0", 12) ||
      inRange("192.168.0.0", 16) ||
      inRange("127.0.0.0", 8) ||
      inRange("169.254.0.0", 16) || // link-local (incl. cloud metadata 169.254.169.254)
      inRange("0.0.0.0", 8) ||
      inRange("100.64.0.0", 10) || // CGNAT
      n === 0xffffffff // 255.255.255.255
    );
  }
  if (kind === 6) {
    const addr = ip.toLowerCase();
    // IPv4-mapped (::ffff:a.b.c.d) — check the embedded v4.
    const mapped = addr.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return (
      addr === "::1" ||
      addr === "::" ||
      addr.startsWith("fc") || // fc00::/7 unique-local
      addr.startsWith("fd") ||
      addr.startsWith("fe8") || // fe80::/10 link-local
      addr.startsWith("fe9") ||
      addr.startsWith("fea") ||
      addr.startsWith("feb")
    );
  }
  return true; // unparseable → treat as unsafe
}

/** True only for a public http(s) URL whose host resolves to public address(es). */
async function isSafePublicUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname;
  // If the host is a literal IP, check it directly; otherwise resolve every A/AAAA.
  if (isIP(host)) {
    return isPrivateIp(host) ? null : url;
  }
  try {
    const addrs = await lookup(host, { all: true });
    if (!addrs.length) return null;
    if (addrs.some((a) => isPrivateIp(a.address))) return null;
    return url;
  } catch {
    return null;
  }
}

/** Strip HTML to plain-ish text without pulling in jsdom/readability. */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|head|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

/** Read a Response body as text, aborting once MAX_BYTES is exceeded. */
async function readCappedText(res: Response): Promise<string | null> {
  const body = res.body;
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          break; // keep what we have — enough for comprehension
        }
        chunks.push(value);
      }
    }
  } catch {
    return null;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(
    concatChunks(chunks, Math.min(total, MAX_BYTES)),
  );
}

function concatChunks(chunks: Uint8Array[], size: number): Uint8Array {
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    if (offset + c.byteLength > size) {
      out.set(c.subarray(0, size - offset), offset);
      break;
    }
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function fetchReadableText(startUrl: string): Promise<string | null> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = await isSafePublicUrl(current);
    if (!safe) {
      console.warn(`[page-text] blocked non-public/invalid url: ${current}`);
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(safe.href, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "KlectBot/1.0 (+bookmark autofill)",
        },
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[page-text] fetch failed for ${safe.href}: ${(err as Error).message}`);
      return null;
    }
    clearTimeout(timer);

    // Manual redirect handling — re-validate the next hop's host.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      current = new URL(loc, safe.href).href;
      continue;
    }

    if (!res.ok) {
      console.warn(`[page-text] ${safe.href} returned ${res.status}.`);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      console.warn(`[page-text] ${safe.href} is not html (${contentType}).`);
      return null;
    }

    const html = await readCappedText(res);
    if (!html) return null;
    const text = htmlToText(html);
    console.log(`[page-text] extracted ${text.length} chars from ${safe.href}`);
    return text || null;
  }

  console.warn(`[page-text] too many redirects from ${startUrl}`);
  return null;
}
