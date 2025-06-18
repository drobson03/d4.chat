import { Schema } from "effect";

const TextUIPartSchema = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
});

const ReasoningUIPartSchema = Schema.Struct({
  type: Schema.Literal("reasoning"),
  text: Schema.String,
  providerMetadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});

const SourceUrlUIPartSchema = Schema.Struct({
  type: Schema.Literal("source-url"),
  sourceId: Schema.String,
  url: Schema.String,
  title: Schema.optional(Schema.String),
  providerMetadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});

const SourceDocumentUIPartSchema = Schema.Struct({
  type: Schema.Literal("source-document"),
  sourceId: Schema.String,
  mediaType: Schema.String,
  title: Schema.String,
  filename: Schema.optional(Schema.String),
  providerMetadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});

const FileUIPartSchema = Schema.Struct({
  type: Schema.Literal("file"),
  mediaType: Schema.String,
  filename: Schema.optional(Schema.String),
  url: Schema.String,
});

const StepStartUIPartSchema = Schema.Struct({
  type: Schema.Literal("step-start"),
});

const UIMessagePartSchema = Schema.Union(
  TextUIPartSchema,
  ReasoningUIPartSchema,
  SourceUrlUIPartSchema,
  SourceDocumentUIPartSchema,
  FileUIPartSchema,
  StepStartUIPartSchema,
);

const ReasoningEffortSchema = Schema.Literal("low", "medium", "high");

const UIMessageSchema = Schema.Struct({
  id: Schema.String,
  role: Schema.Union(
    Schema.Literal("system"),
    Schema.Literal("user"),
    Schema.Literal("assistant"),
  ),
  metadata: Schema.optional(
    Schema.Struct({
      user: Schema.optional(Schema.NonEmptyString),
      model: Schema.NonEmptyString,
      reasoning: Schema.optional(ReasoningEffortSchema),
    }),
  ),
  parts: Schema.mutable(Schema.Array(UIMessagePartSchema)),
});

export const MessagesSchema = Schema.mutable(Schema.Array(UIMessageSchema));

/**
 * [Nano ID](https://github.com/ai/nanoid) regex.
 */
export const NANO_ID_REGEX: RegExp = /^[\w-]+$/u;

export const ChatRequestBodySchema = Schema.Struct({
  id: Schema.NonEmptyString.pipe(Schema.pattern(NANO_ID_REGEX)),
  model: Schema.NonEmptyString.pipe(
    Schema.filter((model) => model.endsWith(":free")),
  ),
  messages: MessagesSchema,
  reasoning: Schema.optional(ReasoningEffortSchema),
  search: Schema.optional(Schema.Boolean),
});
