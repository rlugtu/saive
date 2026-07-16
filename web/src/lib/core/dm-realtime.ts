import "server-only";

/**
 * Fire-and-forget realtime "something changed, refetch" ping for direct messages.
 *
 * We never put message content on the wire — only the conversation id. Clients treat the
 * ping purely as a trigger to refetch over authenticated tRPC/server actions, so a spoofed
 * or missed ping is harmless (worst case: an unnecessary refetch, or none — the clients also
 * poll as a fallback). This uses Supabase Realtime's server-side broadcast REST endpoint, so
 * no socket or extra dependency is needed on the server.
 *
 * No-ops silently when `SUPABASE_URL` / `SUPABASE_ANON_KEY` are unset — the feature still
 * works end-to-end via the clients' polling fallback.
 */
export async function broadcastDmActivity(
  conversationId: string,
  recipientId: string,
) {
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
          // The recipient's inbox/badge channel and the open-thread channel.
          {
            topic: `dm:user:${recipientId}`,
            event: "dm",
            payload: { conversationId },
            private: false,
          },
          {
            topic: `dm:conv:${conversationId}`,
            event: "dm",
            payload: { conversationId },
            private: false,
          },
        ],
      }),
    });
  } catch {
    // Best-effort; clients poll as a fallback so delivery never depends on this.
  }
}
