"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Settings2, X } from "lucide-react";

/**
 * List-level actions (open from the Edit/Members/Polls row). Rendered for any
 * member: everyone can Duplicate the list into a fresh independent copy they own
 * (bookmarks + tags only); only the owner (`canClear`) can Clear all bookmarks.
 * Mirrors {@link ListControls}: a trigger button + an expanding panel below.
 */
export function ListActions({
  sourceName,
  canClear,
  duplicateAction,
  clearAction,
}: {
  sourceName: string;
  canClear: boolean;
  duplicateAction: (formData: FormData) => void | Promise<void>;
  clearAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const defaultName = `Copy of ${sourceName}`.slice(0, 30);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <PixelButton
          variant="secondary"
          size="xs"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={14} aria-hidden /> : <Settings2 size={14} aria-hidden />}
          {open ? "Close" : "Actions"}
        </PixelButton>
      </div>

      {open && (
        <PixelCard className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm">Actions</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-danger cursor-pointer text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form action={duplicateAction} className="flex flex-col gap-2">
            <FieldLabel>Duplicate list</FieldLabel>
            <p className="text-muted text-xs">
              Makes a private copy you own with all the bookmarks — members,
              polls, and comments are not carried over.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="sr-only">New list name</span>
              <PixelInput
                name="name"
                defaultValue={defaultName}
                placeholder="Copy of…"
                required
                maxLength={30}
              />
            </label>
            <SubmitButton label="Duplicate list" pendingLabel="Duplicating…" />
          </form>

          {canClear && (
            <div className="border-border flex flex-col gap-2 border-t-2 pt-4">
              <span className="font-pixel text-muted text-sm uppercase">
                Danger zone
              </span>
              <p className="text-muted text-xs">
                Removes every bookmark in this list. The list itself stays.
              </p>
              <ConfirmDeleteButton
                action={clearAction}
                label="Clear all bookmarks"
                confirmText="Delete all bookmarks in this list?"
              />
            </div>
          )}
        </PixelCard>
      )}
    </div>
  );
}
