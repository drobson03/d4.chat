import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const current = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId !== null ? ctx.db.get(userId) : null;
  },
});
