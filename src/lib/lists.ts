import "server-only";
import { prisma } from "@/lib/db";

/** All lists the user participates in, in their personal order. */
export function getUserLists(userId: string) {
  return prisma.listMembership.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    include: {
      list: {
        include: {
          _count: { select: { bookmarks: true, memberships: true } },
        },
      },
    },
  });
}

/** A single list plus the user's membership (role), or null if no access. */
export function getListForUser(userId: string, listId: string) {
  return prisma.listMembership.findUnique({
    where: { listId_userId: { listId, userId } },
    include: {
      list: {
        include: {
          owner: { select: { displayName: true, name: true, icon: true } },
          _count: { select: { bookmarks: true, memberships: true } },
        },
      },
    },
  });
}
