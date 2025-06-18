import { OpenAiClient } from "@effect/ai-openai";
import { Config } from "effect";

export const OpenRouterOpenAiClientLive = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENROUTER_API_KEY"),
  apiUrl: Config.withDefault(
    Config.string("OPENROUTER_API_URL"),
    "https://openrouter.ai/api/v1",
  ),
});
