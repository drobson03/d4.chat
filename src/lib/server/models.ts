import { Schema } from "effect";
import { google } from "@ai-sdk/google";

export const ModelSchema = Schema.Union(
  Schema.Literal("gemini-2.5-flash-preview-05-20"),
  Schema.Literal("gemini-2.5-pro-preview-06-05"),
);

export type ModelName = Schema.Schema.Type<typeof ModelSchema>;

export const models: Record<
  ModelName,
  Parameters<(typeof import("ai"))["streamText"]>[0]["model"]
> = {
  "gemini-2.5-flash-preview-05-20": google("gemini-2.5-flash-preview-05-20"),
  "gemini-2.5-pro-preview-06-05": google("gemini-2.5-pro-preview-06-05"),
};
