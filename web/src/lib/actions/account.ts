"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { deleteAccount } from "@/lib/core/account";

/**
 * Permanently delete the signed-in user's account and everything they own, then send them to
 * the landing page. Deleting the user cascade-deletes their `Session` rows, so the browser's
 * now-orphaned session cookie no longer authenticates and they land logged out.
 */
export async function deleteAccountAction() {
  const user = await requireUser();
  await deleteAccount(user.id);
  redirect("/");
}
