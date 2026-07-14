import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

/** Base URL of the web app, which hosts the better-auth server + tRPC API. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Bearer session token for authenticating API calls.
 *
 * We can't rely on the session **cookie** for the tRPC client: in an iOS release build over
 * HTTPS the native networking layer intercepts `Secure` Set-Cookie headers into its own store,
 * so `@better-auth/expo` never captures them and `authClient.getCookie()` comes back empty —
 * which is why TestFlight requests were rejected as "Sign in required". Instead the web server
 * runs better-auth's `bearer()` plugin, which emits the session token in a plain `set-auth-token`
 * response header (not swallowed by the cookie machinery) and accepts `Authorization: Bearer`.
 *
 * We mirror the token in memory (sync reads for request headers) and in SecureStore (survives
 * restarts). `fetchOptions.onSuccess` below refreshes it whenever better-auth rotates it.
 *
 * The `set-auth-token` header only rides on **fetch** responses (email/password sign-in), so it
 * never fires for the Google OAuth flow — there the session arrives as a `cookie` query param on
 * the `klect://` deep-link redirect, which `@better-auth/expo` stores but our client never sees as
 * a response. `resolveBearerToken` therefore falls back to the stored session cookie, whose
 * session-token value the server's `bearer()` plugin accepts as a bearer token.
 */
const BEARER_KEY = "klect_bearer";
let cachedToken: string | null = null;

/**
 * App Group shared with the iOS Share Extension (`group.com.klect.app`, wired into both targets'
 * entitlements by the expo-share-extension config plugin). On iOS an app group listed under
 * `com.apple.security.application-groups` is also treated as a keychain access group, so storing the
 * bearer token under it lets the extension's **separate process** read it (the extension has no
 * access to `cachedToken` or the better-auth cookie). Keeping every `klect_bearer` read/write scoped
 * to this group keeps the app and the extension pointed at the same keychain item.
 */
export const SHARED_KEYCHAIN_ACCESS_GROUP = "group.com.klect.app";
const SHARED_OPTS = { accessGroup: SHARED_KEYCHAIN_ACCESS_GROUP } as const;

// Avoid redundant keychain writes when the resolved token hasn't changed (notably the OAuth path,
// which re-derives the same cookie token on every request — see resolveBearerToken).
let lastPersistedToken: string | null = null;

/** Persist the token in memory (sync request reads) + the shared keychain (survives restarts, and
 *  is the only copy the Share Extension can see). */
function persistBearer(token: string) {
  cachedToken = token;
  if (token === lastPersistedToken) return;
  lastPersistedToken = token;
  SecureStore.setItemAsync(BEARER_KEY, token, SHARED_OPTS).catch(() => {});
}

/** Read the persisted token from the shared keychain. Used by the tRPC client's cold-start fallback
 *  (before `cachedToken` hydrates) and — since it needs no in-memory/cookie state — by the Share
 *  Extension, whose fresh process only ever has this stored copy to go on. */
export function readStoredBearerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(BEARER_KEY, SHARED_OPTS);
}

// Hydrate the in-memory token on startup (async; the tRPC client falls back to a direct
// SecureStore read for the cold-start race before this resolves).
readStoredBearerToken()
  .then((t) => {
    if (t) cachedToken = t;
  })
  .catch(() => {});

/** Drop the stored bearer token (call on sign-out). */
export function clearBearerToken() {
  cachedToken = null;
  lastPersistedToken = null;
  SecureStore.deleteItemAsync(BEARER_KEY, SHARED_OPTS).catch(() => {});
}

/**
 * better-auth client for the native app — same auth server web uses, but with the
 * Expo plugin (tokens in expo-secure-store, deep-link `scheme` for OAuth). Web uses
 * better-auth/react against this same server.
 *
 * `inferAdditionalFields` mirrors the `user.additionalFields` web declares in
 * `web/src/lib/auth.ts`, so the session user is typed with the profile fields —
 * notably `displayName`, which the root layout reads as the "onboarded" signal.
 * (Kept as an explicit schema rather than `inferAdditionalFields<typeof auth>()`:
 * the type-only cross-app inference collapses to `{}` here, so we restate the fields.)
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    // Capture (and refresh) the bearer token whenever the server rotates the session — it
    // rides on every sign-in / sign-up / get-session response via the `bearer()` plugin.
    onSuccess(ctx) {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) persistBearer(token);
    },
    // Authenticate the auth client's own requests (e.g. /get-session, the onboarding gate in
    // app/_layout.tsx) with the bearer token too, so useSession reflects live server state in
    // production rather than only the cached session blob.
    auth: {
      type: "Bearer",
      token: () => cachedToken ?? "",
    },
  },
  plugins: [
    inferAdditionalFields({
      user: {
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        displayName: { type: "string", required: false },
        birthday: { type: "date", required: false },
        icon: { type: "string", required: false },
        theme: { type: "string", required: false },
      },
    }),
    expoClient({
      scheme: "klect",
      storagePrefix: "klect",
      storage: SecureStore,
    }),
  ],
});

/**
 * Pull the session-token value out of the stored better-auth cookie
 * (`<...>session_token=<value>; ...`). Populated by the Google OAuth deep-link flow even when
 * `set-auth-token` never fired. The value is a signed cookie token the `bearer()` plugin accepts.
 */
function sessionTokenFromCookie(): string | null {
  const cookie = authClient.getCookie();
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name.endsWith("session_token")) return rest.join("=") || null;
  }
  return null;
}

/**
 * Best available bearer token for authenticating API calls, covering both sign-in paths:
 * the `set-auth-token` header (email/password) and the stored session cookie (Google OAuth).
 */
export function resolveBearerToken(): string | null {
  if (cachedToken) return cachedToken;
  const cookieToken = sessionTokenFromCookie();
  // OAuth never populates `cachedToken` (its token arrives only via the stored cookie), so the
  // Share Extension would have nothing in the shared keychain to read. Mirror it there on resolve —
  // `persistBearer` de-dupes, so this is a no-op after the first request of a session.
  if (cookieToken) persistBearer(cookieToken);
  return cookieToken;
}
