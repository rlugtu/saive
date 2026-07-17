"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { deleteAccountAction } from "@/lib/actions/account";

/**
 * "Danger zone" account-deletion card. Deleting is permanent and irreversible, so we gate the
 * button behind a type-to-confirm step: the user must type their exact @handle before the delete
 * button enables. This makes an accidental one-click deletion effectively impossible.
 */
export function DeleteAccountSection({ handle }: { handle: string }) {
  const [value, setValue] = useState("");
  const confirmed = value.trim().toLowerCase() === handle.toLowerCase();

  return (
    <PixelCard className="border-danger">
      <h2 className="text-danger text-sm mb-1">Danger zone</h2>
      <p className="text-muted mb-4 text-sm">
        Permanently delete your account and everything you own — your profile, lists, bookmarks,
        comments, polls, tags, friends, and messages. This <span className="text-ink">cannot</span>{" "}
        be undone.
      </p>
      <form action={deleteAccountAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-xs">
            Type your handle <span className="text-ink">@{handle}</span> to confirm.
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted text-lg" aria-hidden>
              @
            </span>
            <PixelInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={handle}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1"
            />
          </div>
        </label>
        <DeleteSubmit disabled={!confirmed} />
      </form>
    </PixelCard>
  );
}

/** Delete button that stays disabled until the handle matches, and while the action runs. */
function DeleteSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <PixelButton
      type="submit"
      variant="danger"
      size="sm"
      disabled={disabled || pending}
      className="self-start"
    >
      {pending ? "Deleting…" : "Delete my account"}
    </PixelButton>
  );
}
