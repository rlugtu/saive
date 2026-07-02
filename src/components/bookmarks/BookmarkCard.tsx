import Link from "next/link";
import type { BookmarkCardData } from "@/lib/types";
import { StarRating } from "./StarRating";
import { PixelBadge } from "@/components/ui/PixelBadge";

/** Compact bookmark card shown on the list page and in search results. */
export function BookmarkCard({
  listId,
  bookmark,
  listLabel,
}: {
  listId: string;
  bookmark: BookmarkCardData;
  /** Optional "in <list>" context, shown in cross-list search results. */
  listLabel?: { icon: string; name: string };
}) {
  return (
    <Link
      href={`/lists/${listId}/bookmarks/${bookmark.id}`}
      className="pixel-box bg-panel flex flex-col gap-3 p-4"
    >
      {listLabel && (
        <span className="text-muted text-xs truncate">
          in {listLabel.icon} {listLabel.name}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs truncate">{bookmark.name}</span>
            {bookmark.visited && (
              <PixelBadge tone="success" className="shrink-0">
                ✔
              </PixelBadge>
            )}
          </div>
          {bookmark.description && (
            <p className="text-muted text-sm truncate mt-1">
              {bookmark.description}
            </p>
          )}
        </div>
        {bookmark.rating > 0 && (
          <StarRating value={bookmark.rating} className="shrink-0 text-sm" />
        )}
      </div>

      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bookmark.tags.map((t) => (
            <PixelBadge key={t.id}>{t.name}</PixelBadge>
          ))}
        </div>
      )}

      {bookmark.commentCount > 0 && (
        <span className="text-muted text-xs">
          💬 {bookmark.commentCount}
        </span>
      )}
    </Link>
  );
}
