import "server-only";

/**
 * Fire-and-forget realtime "something changed, refetch" ping for a list chatroom.
 *
 * Same design as {@link ./dm-realtime.ts}: we never put message content on the wire — only the
 * list id. Clients treat the ping purely as a trigger to refetch over authenticated tRPC/server
 * actions (which re-check membership), so a spoofed or missed ping is harmless (worst case: an
 * unnecessary refetch, or none — clients also poll as a fallback). Uses Supabase Realtime's
 * server-side broadcast REST endpoint, so no socket or extra dependency is needed on the server.
 *
 * No-ops silently when `SUPABASE_URL` / `SUPABASE_ANON_KEY` are unset — the feature still works
 * end-to-end via the clients' polling fallback.
 */
export async function broadcastListChatActivity(listId: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `chat:list:${listId}`,
            event: "chat",
            payload: { listId },
            private: false,
          },
        ],
      }),
    });
  } catch {
    // Best-effort; clients poll as a fallback so delivery never depends on this.
  }
}
