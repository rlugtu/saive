import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getChatMessages, getChatUnreadCount } from "@/lib/list-chat";
import * as core from "@/lib/core/list-chat";

export const listChatRouter = router({
  // A page of a list's chatroom, oldest→newest, with a cursor for loading older history.
  messages: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      getChatMessages(ctx.user.id, input.listId, input.cursor, input.limit),
    ),

  // Unread chat messages in a list — powers the chat-icon attention badge.
  unread: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .query(({ ctx, input }) => getChatUnreadCount(ctx.user.id, input.listId)),

  send: protectedProcedure
    .input(z.object({ listId: z.string(), body: z.string() }))
    .mutation(({ ctx, input }) =>
      core.sendChatMessage(ctx.user.id, input.listId, input.body),
    ),

  // Clear the whole chatroom — owner only (hard delete).
  clear: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(({ ctx, input }) => core.clearChat(ctx.user.id, input.listId)),

  markRead: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(({ ctx, input }) => core.markChatRead(ctx.user.id, input.listId)),
});
