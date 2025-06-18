import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const TextUIPart = v.object({
  type: v.literal("text"),
  text: v.string(),
});

const ReasoningUIPart = v.object({
  type: v.literal("reasoning"),
  text: v.string(),
  providerMetadata: v.optional(v.any()),
});

const SourceUrlUIPart = v.object({
  type: v.literal("source-url"),
  sourceId: v.string(),
  url: v.string(),
  title: v.optional(v.string()),
  providerMetadata: v.optional(v.any()),
});

const SourceDocumentUIPart = v.object({
  type: v.literal("source-document"),
  sourceId: v.string(),
  mediaType: v.string(),
  title: v.string(),
  filename: v.optional(v.string()),
  providerMetadata: v.optional(v.any()),
});

const FileUIPart = v.object({
  type: v.literal("file"),
  mediaType: v.string(),
  filename: v.optional(v.string()),
  url: v.string(),
});

const StepStartUIPart = v.object({
  type: v.literal("step-start"),
});

// const ToolUIPart = v.object({
//   type: v.string(),
//   toolCallId: v.string(),
//   state: v.union(
//     v.literal("input-streaming"),
//     v.literal("input-available"),
//     v.literal("output-available"),
//   ),
//   input: v.optional(v.any()),
//   output: v.optional(v.any()),
// });

export const UIMessage = v.object({
  id: v.string(),
  role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
  metadata: v.optional(
    v.object({
      user: v.optional(v.string()),
      model: v.string(),
    }),
  ),
  parts: v.array(
    v.union(
      TextUIPart,
      ReasoningUIPart,
      SourceUrlUIPart,
      SourceDocumentUIPart,
      FileUIPart,
      StepStartUIPart,
      // ToolUIPart,
    ),
  ),
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
