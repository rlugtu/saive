"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import * as core from "@/lib/core/dms";
import {
  getConversations,
  getMessages,
  getUnreadConversationCount,
} from "@/lib/dms";

export type { ConversationSummary as DmConversation, MessagesPage } from "@/lib/dms";

// Mutations
export async function startConversation(otherUserId: string) {
  const user = await requireUser();
  return core.startConversation(user.id, otherUserId);
}

export async function sendMessage(conversationId: string, body: string) {
  const user = await requireUser();
  return core.sendMessage(user.id, conversationId, body);
}

export async function clearConversation(conversationId: string) {
  const user = await requireUser();
  await core.clearConversation(user.id, conversationId);
  revalidatePath("/friends/dms");
}

export async function markRead(conversationId: string) {
  const user = await requireUser();
  await core.markRead(user.id, conversationId);
}

// Client-callable data loaders (web has no browser tRPC client, so the interactive DM
// islands read through these server actions — same core/data-access as the tRPC procedures).
export async function loadConversations() {
  const user = await requireUser();
  return getConversations(user.id);
}

export async function loadMessages(conversationId: string, cursor?: string) {
  const user = await requireUser();
  return getMessages(user.id, conversationId, cursor);
}

export async function loadUnreadCount() {
  const user = await requireUser();
  return getUnreadConversationCount(user.id);
}
