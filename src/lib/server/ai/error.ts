import { Data } from "effect";

export class ChatGenerationError extends Data.TaggedError(
  "ChatGenerationError",
)<{
  cause?: unknown;
}> {}
