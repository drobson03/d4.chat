import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const TextPart = v.object({
  text: v.string(),
  _tag: v.literal("TextPart"),
});

const ImagePart = v.object({
  data: v.string(),
  mediaType: v.optional(v.string()),
  _tag: v.literal("ImagePart"),
});

const ImageUrlPart = v.object({
  url: v.string(),
  _tag: v.literal("ImageUrlPart"),
});

const FilePart = v.object({
  data: v.string(),
  name: v.optional(v.string()),
  mediaType: v.optional(v.string()),
  _tag: v.literal("FilePart"),
});

const FileUrlPart = v.object({
  url: v.string(),
  _tag: v.literal("FileUrlPart"),
});

const ReasoningPart = v.object({
  reasoningText: v.string(),
  signature: v.optional(v.string()),
  _tag: v.literal("ReasoningPart"),
});

const RedactedReasoningPart = v.object({
  redactedText: v.string(),
  _tag: v.literal("RedactedReasoningPart"),
});

const ToolCallPart = v.object({
  id: v.string(),
  name: v.string(),
  params: v.any(),
  _tag: v.literal("ToolCallPart"),
});

const ToolCallResultPart = v.object({
  id: v.string(),
  result: v.any(),
  _tag: v.literal("ToolCallResultPart"),
});

// const Usage = v.object({
//   inputTokens: v.number(),
//   outputTokens: v.number(),
//   totalTokens: v.number(),
//   reasoningTokens: v.number(),
//   cacheReadInputTokens: v.number(),
//   cacheWriteInputTokens: v.number(),
// });

// const FinishReason = v.union(
//   v.literal("stop"),
//   v.literal("length"),
//   v.literal("content-filter"),
//   v.literal("tool-calls"),
//   v.literal("error"),
//   v.literal("other"),
//   v.literal("unknown"),
// );

// const FinishPart = v.object({
//   usage: Usage,
//   finishReason: FinishReason,
//   providerMetadata: v.optional(
//     v.record(v.string(), v.record(v.string(), v.any())),
//   ),
//   _tag: v.literal("FinishPart"),
// });

const UserMessagePart = v.union(
  TextPart,
  ImagePart,
  ImageUrlPart,
  FilePart,
  FileUrlPart,
  ReasoningPart,
  RedactedReasoningPart,
);

const AssistantMessagePart = v.union(
  TextPart,
  ReasoningPart,
  RedactedReasoningPart,
  ToolCallPart,
);

const ToolMessagePart = ToolCallResultPart;

const UserMessage = v.object({
  parts: v.array(UserMessagePart),
  userName: v.optional(v.string()),
  _tag: v.literal("UserMessage"),
});

const AssistantMessage = v.object({
  parts: v.array(AssistantMessagePart),
  _tag: v.literal("AssistantMessage"),
});

const ToolMessage = v.object({
  parts: v.array(ToolMessagePart),
  _tag: v.literal("ToolMessage"),
});

export const Message = v.union(UserMessage, AssistantMessage, ToolMessage);

const schema = defineSchema({
  chats: defineTable({
    id: v.string(),
    name: v.string(),
    pinned: v.boolean(),
    updatedAt: v.number(),
    model: v.string(),
    branchedFrom: v.optional(v.id("chats")),
    messages: v.array(
      v.object({
        message: Message,
        meta: v.object({
          model: v.optional(v.string()),
          user: v.optional(v.string()),
        }),
      }),
    ),
    user: v.string(),
  }).index("by_user", ["user"]),
});

export default schema;
