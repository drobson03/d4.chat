import { OpenAiClient } from "@effect/ai-openai";
import { Config } from "effect";

export const GoogleOpenAiClientLive = OpenAiClient.layerConfig({
  apiKey: Config.redacted("GOOGLE_GENERATIVE_AI_API_KEY"),
  apiUrl: Config.withDefault(
    Config.string("GOOGLE_GENERATIVE_AI_API_URL"),
    "https://generativelanguage.googleapis.com/v1beta/openai/",
  ),
});
