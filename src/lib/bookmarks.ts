import "server-only";
import { prisma } from "@/lib/db";
import { getMembership } from "@/lib/permissions";

/** Bookmarks in a list, newest first, with their tags + comment counts. */
export function getBookmarksForList(listId: string) {
  return prisma.bookmark.findMany({
    where: { listId },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: { select: { id: true, name: true } } } },
      _count: { select: { comments: true } },
    },
  });
}

/**
 * Bookmarks across all of the user's lists that carry ANY of the given tags
 * (OR match). Tags are user-scoped, so we match the user's own tags by name.
 */
export function getBookmarksByTags(userId: string, tagNames: string[]) {
  return prisma.bookmark.findMany({
    where: {
      list: { memberships: { some: { userId } } },
      tags: { some: { tag: { userId, name: { in: tagNames } } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      list: { select: { id: true, name: true, icon: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      _count: { select: { comments: true } },
    },
  });
}

/**
 * A bookmark plus the requesting user's role on its list, or null if the
 * bookmark doesn't exist or the user isn't a member of its list.
 */
export async function getBookmarkForUser(userId: string, bookmarkId: string) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    include: {
      list: { select: { id: true, name: true, icon: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });
  if (!bookmark) return null;

  const membership = await getMembership(userId, bookmark.listId);
  if (!membership) return null;

  return { bookmark, role: membership.role };
}
