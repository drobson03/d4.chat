import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const TextUIPart = v.object({
  type: v.literal("text"),
  text: v.string(),
});

const ReasoningUIPart = v.object({
  type: v.literal("reasoning"),
  reasoning: v.string(),
});

const ToolInvocation = v.union(
  v.object({
    state: v.literal("partial-call"),
    toolCallId: v.string(),
    toolName: v.string(),
    args: v.any(),
  }),
  v.object({
    state: v.literal("call"),
    toolCallId: v.string(),
    toolName: v.string(),
    args: v.any(),
  }),
  v.object({
    state: v.literal("result"),
    toolCallId: v.string(),
    toolName: v.string(),
    args: v.any(),
    result: v.any(),
  }),
);

const ToolInvocationUIPart = v.object({
  type: v.literal("tool-invocation"),
  toolInvocation: ToolInvocation,
});

const Source = v.object({
  sourceType: v.literal("url"),
  id: v.string(),
  url: v.string(),
  title: v.optional(v.string()),
});

const SourceUIPart = v.object({
  type: v.literal("source"),
  source: Source,
});

const StepStartUIPart = v.object({
  type: v.literal("step-start"),
});

const Attachment = v.object({
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  url: v.string(),
});

export const UIMessage = v.object({
  role: v.union(
    v.literal("system"),
    v.literal("user"),
    v.literal("assistant"),
    v.literal("data"),
  ),
  createdAt: v.optional(v.number()),
  annotations: v.optional(v.array(v.any())),
  parts: v.array(
    v.union(
      TextUIPart,
      ReasoningUIPart,
      ToolInvocationUIPart,
      SourceUIPart,
      StepStartUIPart,
    ),
  ),
  experimental_attachements: v.optional(v.array(Attachment)),
});

const schema = defineSchema({
  chats: defineTable({
    id: v.string(),
    name: v.string(),
    pinned: v.boolean(),
    updatedAt: v.number(),
    model: v.string(),
    branchedFrom: v.optional(v.id("chats")),
    user: v.string(),
  }).index("by_user", ["user"]),
  messages: defineTable({
    ...UIMessage.fields,
    model: v.optional(v.string()),
    chat: v.id("chats"),
    user: v.optional(v.string()),
  })
    .index("by_chat", ["chat"])
    .index("by_user", ["user"]),
});

export default schema;
