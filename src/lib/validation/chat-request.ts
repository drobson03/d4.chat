import { Schema } from "effect";
import { ModelSchema } from "../server/models";

const TextUIPartSchema = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
});

const ReasoningUIPartSchema = Schema.Struct({
  type: Schema.Literal("reasoning"),
  reasoning: Schema.String,
});

const ToolInvocationSchema = Schema.Union(
  Schema.Struct({
    state: Schema.Literal("partial-call"),
    toolCallId: Schema.String,
    toolName: Schema.String,
    args: Schema.Unknown,
  }),
  Schema.Struct({
    state: Schema.Literal("call"),
    toolCallId: Schema.String,
    toolName: Schema.String,
    args: Schema.Unknown,
  }),
  Schema.Struct({
    state: Schema.Literal("result"),
    toolCallId: Schema.String,
    toolName: Schema.String,
    args: Schema.Unknown,
    result: Schema.Unknown,
  }),
);

const ToolInvocationUIPartSchema = Schema.Struct({
  type: Schema.Literal("tool-invocation"),
  toolInvocation: ToolInvocationSchema,
});

const SourceSchema = Schema.Struct({
  sourceType: Schema.Literal("url"),
  id: Schema.String,
  url: Schema.String,
  title: Schema.optional(Schema.String),
});

const SourceUIPartSchema = Schema.Struct({
  type: Schema.Literal("source"),
  source: SourceSchema,
});

const StepStartUIPartSchema = Schema.Struct({
  type: Schema.Literal("step-start"),
});

const AttachmentSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  contentType: Schema.optional(Schema.String),
  url: Schema.String,
});

const UIMessageSchema = Schema.Struct({
  role: Schema.Union(
    Schema.Literal("system"),
    Schema.Literal("user"),
    Schema.Literal("assistant"),
    Schema.Literal("data"),
  ),
  createdAt: Schema.optional(Schema.Number),
  content: Schema.String,
  annotations: Schema.optional(Schema.Array(Schema.Unknown)),
  parts: Schema.Array(
    Schema.Union(
      TextUIPartSchema,
      ReasoningUIPartSchema,
      ToolInvocationUIPartSchema,
      SourceUIPartSchema,
      StepStartUIPartSchema,
    ),
  ),
  experimental_attachements: Schema.optional(Schema.Array(AttachmentSchema)),
});

export const ChatRequestBodySchema = Schema.Struct({
  id: Schema.String,
  convexSessionId: Schema.String,
  model: ModelSchema,
  messages: Schema.Array(UIMessageSchema),
});
