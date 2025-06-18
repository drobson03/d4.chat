import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { UIMessage } from "./schema";

export const my = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("user", user.tokenIdentifier))
      .order("desc")
      .collect();
  },
});

export const byId = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return null;
    }

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("user", user.tokenIdentifier))
      .filter((q) => q.eq(q.field("id"), args.id))
      .unique();

    if (!chat) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat", chat._id))
      .collect();

    return { ...chat, messages };
  },
});

export const appendMessagesToChat = mutation({
  args: {
    id: v.string(),
    model: v.string(),
    messages: v.array(UIMessage),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return null;
    }

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("user", user.tokenIdentifier))
      .filter((q) => q.eq(q.field("id"), args.id))
      .unique();

    const chatId =
      chat?._id ??
      (await ctx.db.insert("chats", {
        id: args.id,
        model: args.model,
        name: "New Chat",
        pinned: false,
        updatedAt: Date.now(),
        user: user.tokenIdentifier,
      }));

    for (const message of args.messages) {
      await ctx.db.insert("messages", {
        ...message,
        chat: chatId,
        model: args.model,
        user: user.tokenIdentifier,
      });
    }

    return chatId;
  },
});

export const deleteChat = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return null;
    }

    const chat = await ctx.db.get(args.id);

    if (!chat || chat.user !== user.tokenIdentifier) {
      return;
    }

    await ctx.db.delete(args.id);
  },
});

export const togglePinChat = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return;
    }

    const chat = await ctx.db.get(args.id);

    if (!chat || chat.user !== user.tokenIdentifier) {
      return;
    }

    await ctx.db.patch(args.id, {
      pinned: !chat.pinned,
    });
  },
});
