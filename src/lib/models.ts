import { queryOptions } from "@tanstack/react-query";

import * as Schema from "effect/Schema";

const OpenRouterModelsResponseSchema = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.NonEmptyString,
      name: Schema.NonEmptyString,
      created: Schema.Number,
      description: Schema.NonEmptyString,
      architecture: Schema.Struct({
        input_modalities: Schema.Array(Schema.NonEmptyString),
        output_modalities: Schema.Array(Schema.NonEmptyString),
        tokenizer: Schema.NonEmptyString,
        instruct_type: Schema.NullOr(Schema.NonEmptyString),
      }),
      top_provider: Schema.Struct({
        is_moderated: Schema.Boolean,
        context_length: Schema.NullOr(Schema.Number),
        max_completion_tokens: Schema.NullOr(Schema.Number),
      }),
      pricing: Schema.Struct({
        prompt: Schema.NumberFromString,
        completion: Schema.NumberFromString,
        image: Schema.optional(Schema.NumberFromString),
        request: Schema.optional(Schema.NumberFromString),
        input_cache_read: Schema.optional(Schema.NumberFromString),
        input_cache_write: Schema.optional(Schema.NumberFromString),
        web_search: Schema.optional(Schema.NumberFromString),
        internal_reasoning: Schema.optional(Schema.NumberFromString),
      }),
      context_length: Schema.NullOr(Schema.Number),
      hugging_face_id: Schema.NullOr(Schema.String),
      per_request_limits: Schema.NullOr(
        Schema.Record({ key: Schema.NonEmptyString, value: Schema.Unknown }),
      ),
      supported_parameters: Schema.optional(
        Schema.Array(Schema.NonEmptyString),
      ),
    }),
  ),
});

async function getModels() {
  const response = await fetch("https://openrouter.ai/api/v1/models");
  const data = await response.json();
  const models = await Schema.decodeUnknownPromise(
    OpenRouterModelsResponseSchema,
  )(data);

  return models.data
    .filter(
      (model) =>
        model.id.endsWith(":free") &&
        model.architecture.input_modalities.includes("text") &&
        model.architecture.output_modalities.includes("text"),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const getOpenRouterModelsQueryOptions = queryOptions({
  queryKey: ["openrouter", "models"],
  queryFn: getModels,
});
