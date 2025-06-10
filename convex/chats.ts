import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const my = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();
  },
});

export const byId = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .filter((q) => q.eq(q.field("id"), args.id))
      .unique();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat", chat._id))
      .collect();

    return { ...chat, messages };
  },
});

export const create = mutation({
  args: {
    id: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("chats", {
      id: args.id,
      model: args.model,
      name: "New Chat",
      pinned: false,
      updatedAt: Date.now(),
      user: userId,
    });
  },
});
