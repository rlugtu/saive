"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily-built singleton browser client. `undefined` = not yet resolved, `null` = realtime
// is not configured (env unset) so callers should fall back to polling.
let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

/** Whether Supabase Realtime is configured; when false, callers poll instead. */
export function realtimeEnabled() {
  return getClient() !== null;
}

/**
 * Subscribe to a DM broadcast topic. The payload is ignored on purpose — a ping just means
 * "refetch via tRPC/server action". Returns an unsubscribe fn; a no-op when realtime is off.
 */
export function subscribeDm(topic: string, onPing: () => void): () => void {
  const c = getClient();
  if (!c) return () => {};
  const channel = c
    .channel(topic, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "dm" }, () => onPing())
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}

/**
 * Subscribe to a list chatroom's broadcast topic. Same content-free-ping contract as
 * {@link subscribeDm}: a ping just means "refetch via server action". Returns an unsubscribe
 * fn; a no-op when realtime is off.
 */
export function subscribeListChat(
  listId: string,
  onPing: () => void,
): () => void {
  const c = getClient();
  if (!c) return () => {};
  const channel = c
    .channel(`chat:list:${listId}`, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "chat" }, () => onPing())
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
