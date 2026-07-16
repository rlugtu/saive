import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Lightweight Supabase Realtime client used *only* to receive DM "refetch now" pings — no
 * message content ever rides the socket, and there's no Supabase auth here (public broadcast
 * channels). All real data still flows over authenticated tRPC. `null` = realtime unconfigured
 * (env unset), so callers fall back to focus/interval polling.
 */
let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && key
      ? createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        })
      : null;
  return client;
}

/** Whether realtime is configured; when false, screens poll instead. */
export function realtimeEnabled() {
  return getClient() !== null;
}

/** Subscribe to a DM broadcast topic; returns an unsubscribe fn (no-op when realtime is off). */
export function subscribeDm(topic: string, onPing: () => void): () => void {
  const c = getClient();
  if (!c) return () => {};
  const channel = c
    .channel(topic, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'dm' }, () => onPing())
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}

/**
 * Subscribe to a list chatroom's broadcast topic (`chat:list:<id>`). Same content-free-ping
 * contract as {@link subscribeDm}: a ping just means "refetch via tRPC". No-op when realtime is off.
 */
export function subscribeListChat(listId: string, onPing: () => void): () => void {
  const c = getClient();
  if (!c) return () => {};
  const channel = c
    .channel(`chat:list:${listId}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'chat' }, () => onPing())
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
