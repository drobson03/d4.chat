import { Schema } from "effect";
import { ModelSchema } from "../server/ai/models";
import { AiInput, AiResponse } from "@effect/ai";

/**
 * [Nano ID](https://github.com/ai/nanoid) regex.
 */
export const NANO_ID_REGEX: RegExp = /^[\w-]+$/u;

export const ChatRequestBodySchema = Schema.Struct({
  chatId: Schema.String.pipe(Schema.pattern(NANO_ID_REGEX)),
  model: ModelSchema,
  messages: Schema.NonEmptyArray(AiInput.Message),
});
