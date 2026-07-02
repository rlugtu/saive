"use client";

import { useState } from "react";
import Link from "next/link";
import { updateBookmark } from "@/lib/actions/bookmarks";
import { BookmarkForm, type BookmarkDefaults } from "./BookmarkForm";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

/**
 * Bookmark page header: back-to-list link (left) + Edit trigger (top right).
 * The edit form expands full-width right below the header.
 */
export function BookmarkHeader({
  listId,
  listIcon,
  listName,
  canEdit,
  bookmarkId,
  defaults,
  tagSuggestions,
}: {
  listId: string;
  listIcon: string;
  listName: string;
  canEdit: boolean;
  bookmarkId: string;
  defaults: BookmarkDefaults;
  tagSuggestions: string[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/lists/${listId}`}>
          <PixelButton variant="ghost" size="sm">
            ← {listIcon} {listName}
          </PixelButton>
        </Link>
        {canEdit && (
          <PixelButton
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen((o) => !o)}
          >
            {editOpen ? "Close" : "Edit"}
          </PixelButton>
        )}
      </div>

      {editOpen && canEdit && (
        <PixelCard className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm">Edit bookmark</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setEditOpen(false)}
              className="text-muted hover:text-danger cursor-pointer text-lg leading-none"
            >
              ×
            </button>
          </div>
          <BookmarkForm
            action={updateBookmark.bind(null, bookmarkId)}
            defaults={defaults}
            submitLabel="Save"
            tagSuggestions={tagSuggestions}
          />
        </PixelCard>
      )}
    </div>
  );
}
