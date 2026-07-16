import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  getConversations,
  getMessages,
  getUnreadConversationCount,
} from "@/lib/dms";
import * as core from "@/lib/core/dms";

export const dmsRouter = router({
  // The current user's conversation inbox (newest activity first, cleared-empty omitted).
  conversations: protectedProcedure.query(({ ctx }) =>
    getConversations(ctx.user.id),
  ),

  // A page of messages, oldest→newest, with a cursor for loading older history.
  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      getMessages(ctx.user.id, input.conversationId, input.cursor, input.limit),
    ),

  // Count of conversations with an unread message — powers the DMs tab attention badge.
  unreadCount: protectedProcedure.query(({ ctx }) =>
    getUnreadConversationCount(ctx.user.id),
  ),

  // Get-or-create the 1:1 conversation with a friend (friends-only).
  start: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) =>
      core.startConversation(ctx.user.id, input.userId),
    ),

  send: protectedProcedure
    .input(z.object({ conversationId: z.string(), body: z.string() }))
    .mutation(({ ctx, input }) =>
      core.sendMessage(ctx.user.id, input.conversationId, input.body),
    ),

  // Clear/delete a conversation for the current user only.
  clear: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) =>
      core.clearConversation(ctx.user.id, input.conversationId),
    ),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) =>
      core.markRead(ctx.user.id, input.conversationId),
    ),
});
