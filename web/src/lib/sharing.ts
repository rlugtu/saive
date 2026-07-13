import "server-only";
import { prisma } from "@/lib/db";

/** Members of a list with their user info (owner first). */
export async function getListMembers(listId: string) {
  const members = await prisma.listMembership.findMany({
    where: { listId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, displayName: true, name: true, email: true, icon: true },
      },
    },
  });
  // Owner first, then by join time.
  return members.sort((a, b) =>
    a.role === "OWNER" ? -1 : b.role === "OWNER" ? 1 : 0,
  );
}

/** Pending (not-yet-decided) join requests for a list. */
export function getPendingInvites(listId: string) {
  return prisma.listInvite.findMany({
    where: { listId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Pending list-join requests addressed to this email — the incoming "collab requests"
 * shown on the home page. Newest first; includes list + inviter context.
 */
export function getIncomingRequests(email: string) {
  return prisma.listInvite.findMany({
    where: { email: email.toLowerCase(), status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      list: { select: { id: true, name: true, description: true, icon: true } },
      invitedBy: { select: { displayName: true, name: true } },
    },
  });
}

/** An invite by its token, with list + inviter context (for the accept page). */
export function getInviteByToken(token: string) {
  return prisma.listInvite.findUnique({
    where: { token },
    include: {
      list: { select: { id: true, name: true, icon: true, description: true } },
      invitedBy: { select: { displayName: true, name: true } },
    },
  });
}
