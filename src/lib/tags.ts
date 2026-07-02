import "server-only";
import { prisma } from "@/lib/db";

/** All tag names the user has created (for suggestions + search). */
export async function getUserTagNames(userId: string): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return tags.map((t) => t.name);
}
