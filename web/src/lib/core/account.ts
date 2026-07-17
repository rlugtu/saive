import "server-only";
import { prisma } from "@/lib/db";

/**
 * Permanently delete a user's account and everything they own.
 *
 * Every relation on the `User` model uses `onDelete: Cascade` (sessions, accounts, owned
 * lists → their bookmarks/comments/polls/chat, memberships, invites, tags, comments, polls,
 * poll votes, friendships in both directions, DM conversations + messages, list-chat messages),
 * so a single `user.delete` removes all of it in one transaction. There is no separate cleanup.
 *
 * Idempotent: a missing row (P2025) is treated as already-deleted so a retried request succeeds.
 */
export async function deleteAccount(userId: string): Promise<void> {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2025"
    ) {
      return;
    }
    throw e;
  }
}
