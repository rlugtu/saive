import { router, protectedProcedure } from "../trpc";
import { deleteAccount } from "@/lib/core/account";

export const accountRouter = router({
  /** Permanently delete the signed-in user's account and all data they own. */
  delete: protectedProcedure.mutation(({ ctx }) => deleteAccount(ctx.user.id)),
});
