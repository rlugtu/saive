"use server";

import { requireUser } from "@/lib/session";

export type PlaceSuggestion = {
  label: string; // primary line, e.g. business/POI name or street ("address_line1")
  address: string; // full formatted address
  lat: number;
  lon: number;
};

export type PlacesResult =
  | { ok: true; data: PlaceSuggestion[] }
  | { ok: false; error: string };

const MIN_QUERY_LENGTH = 3;
const LIMIT = 6;

// Geoapify autocomplete result (format=json flattens lat/lon/formatted onto each row).
type GeoapifyResult = {
  formatted?: string;
  address_line1?: string;
  lat?: number;
  lon?: number;
};

/**
 * Geoapify Geocoding Autocomplete, proxied so the API key stays server-side.
 * Matches both addresses and business/POI names (no `type` restriction), soft-biased
 * to the US so local results rank first while international places still appear.
 */
export async function searchPlaces(text: string): Promise<PlacesResult> {
  await requireUser();

  const query = text.trim();
  if (query.length < MIN_QUERY_LENGTH) return { ok: true, data: [] };

  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) {
    console.warn("[places] GEOAPIFY_API_KEY not set — location search disabled.");
    return { ok: false, error: "Location search is not configured." };
  }

  const endpoint =
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}` +
    `&format=json&limit=${LIMIT}&lang=en&bias=countrycode:us&apiKey=${key}`;

  try {
    const res = await fetch(endpoint, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[places] geoapify returned ${res.status} for "${query}"`);
      return {
        ok: false,
        error:
          res.status === 429
            ? "Location search rate limit reached. Try again shortly."
            : `Location search failed (${res.status}).`,
      };
    }

    const json = (await res.json()) as { results?: GeoapifyResult[] };
    const data: PlaceSuggestion[] = (json.results ?? [])
      .filter(
        (r): r is GeoapifyResult & { lat: number; lon: number } =>
          typeof r.lat === "number" && typeof r.lon === "number",
      )
      .map((r) => ({
        label: r.address_line1 || r.formatted || "",
        address: r.formatted || r.address_line1 || "",
        lat: r.lat,
        lon: r.lon,
      }));

    console.log(`[places] "${query}" → ${data.length} suggestion(s)`);
    return { ok: true, data };
  } catch (err) {
    console.warn(`[places] request failed for "${query}":`, (err as Error).message);
    return { ok: false, error: `Location search failed: ${(err as Error).message}` };
  }
}
