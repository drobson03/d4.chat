import { Data } from "effect";

export class RequestJsonParseError extends Data.TaggedError(
  "RequestJsonError",
)<{
  cause: unknown;
}> {}
