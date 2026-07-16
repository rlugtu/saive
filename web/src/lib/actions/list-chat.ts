"use server";

import { requireUser } from "@/lib/session";
import * as core from "@/lib/core/list-chat";
import { getChatMessages, getChatUnreadCount } from "@/lib/list-chat";

export type { ChatMessagesPage, ChatMessage } from "@/lib/list-chat";

// Mutations
export async function sendChatMessage(listId: string, body: string) {
  const user = await requireUser();
  return core.sendChatMessage(user.id, listId, body);
}

export async function clearChat(listId: string) {
  const user = await requireUser();
  await core.clearChat(user.id, listId);
}

export async function markChatRead(listId: string) {
  const user = await requireUser();
  await core.markChatRead(user.id, listId);
}

// Client-callable data loaders (web has no browser tRPC client, so the interactive chat
// drawer reads through these server actions — same core/data-access as the tRPC procedures).
export async function loadChatMessages(listId: string, cursor?: string) {
  const user = await requireUser();
  return getChatMessages(user.id, listId, cursor);
}

export async function loadChatUnread(listId: string) {
  const user = await requireUser();
  return getChatUnreadCount(user.id, listId);
}
