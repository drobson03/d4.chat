import { Schema } from "effect";

export const models = [
  "google/gemini-2.5-flash-preview-05-20",
  "google/gemini-2.5-pro-preview-06-05",
] as const;

export const ModelSchema = Schema.Literal(...models);

export type ModelName = Schema.Schema.Type<typeof ModelSchema>;
