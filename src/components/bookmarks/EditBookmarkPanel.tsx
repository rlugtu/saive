"use client";

import { useState } from "react";
import { updateBookmark } from "@/lib/actions/bookmarks";
import { BookmarkForm, type BookmarkDefaults } from "./BookmarkForm";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

export function EditBookmarkPanel({
  bookmarkId,
  defaults,
  tagSuggestions,
}: {
  bookmarkId: string;
  defaults: BookmarkDefaults;
  tagSuggestions: string[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <PixelButton variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Edit
      </PixelButton>
    );
  }

  return (
    <PixelCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm">Edit bookmark</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
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
  );
}
