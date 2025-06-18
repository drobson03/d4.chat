import { createServerFileRoute } from "@tanstack/react-start/server";
import { Chunk, Console, Context, Effect, pipe, Schema, Stream } from "effect";
import { createEffectApiHandler, RequestTag } from "~/lib/server/api/runtime";
import { AiChat } from "@effect/ai";
import { OpenRouterOpenAiClientLive } from "~/lib/server/ai/openrouter";
import { OpenAiLanguageModel } from "@effect/ai-openai";
import { FetchHttpClient } from "@effect/platform";
import { ChatRequestBodySchema } from "~/lib/validation/chat-request";
import { RequestJsonParseError } from "~/lib/server/api/error";

class ChatRequestBody extends Context.Tag("ChatRequestBody")<
  ChatRequestBody,
  Schema.Schema.Type<typeof ChatRequestBodySchema>
>() {}

const getBodyEffect = pipe(
  RequestTag,
  Effect.andThen((request) =>
    Effect.tryPromise({
      try: () => request.json(),
      catch: (cause) => new RequestJsonParseError({ cause }),
    }),
  ),
  Effect.andThen((body) => Schema.decodeUnknown(ChatRequestBodySchema)(body)),
);

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: createEffectApiHandler(
    pipe(
      ChatRequestBody,
      Effect.zip(AiChat.AiChat),
      Effect.andThen(([body, chat]) =>
        Effect.succeed(
          chat.streamText({
            system: "You are a helpful assistant.",
            prompt: body.messages,
          }),
        ),
      ),
      Effect.andThen((stream) =>
        pipe(
          stream,
          Stream.throttle({
            cost: Chunk.size,
            duration: "10 millis",
            units: 1,
          }),
          Stream.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
          Stream.catchAll((error) =>
            Stream.make(
              `data: ${JSON.stringify({ error: error.message })}\n\n`,
            ),
          ),
          Stream.concat(Stream.make("data: [DONE]\n\n")),
          Stream.encodeText,
          Stream.onEnd(
            pipe(
              AiChat.AiChat,
              Effect.andThen((chat) => chat.export),
              Effect.andThen((history) =>
                Console.dir(history, { depth: Number.POSITIVE_INFINITY }),
              ),
            ),
          ),
          Stream.toReadableStreamEffect(),
        ),
      ),
      Effect.andThen(
        (stream) =>
          new Response(stream, {
            headers: {
              "Cache-Control": "no-cache",
              "Content-Type": "text/event-stream",
            },
          }),
      ),
      Effect.provideServiceEffect(
        AiChat.AiChat,
        // AiChat.empty,
        pipe(
          ChatRequestBody,
          Effect.andThen((body) =>
            AiChat.fromPrompt({ prompt: body.messages }),
          ),
        ),
      ),
      Effect.provideServiceEffect(ChatRequestBody, getBodyEffect),
      Effect.provide(OpenAiLanguageModel.model("google/gemma-3n-e4b-it:free")),
      Effect.provide(OpenRouterOpenAiClientLive),
      Effect.provide(FetchHttpClient.layer),
      Effect.catchTags({
        ConfigError: () =>
          Effect.succeed(new Response("Config Error", { status: 500 })),
        ParseError: (e) =>
          Effect.succeed(
            new Response(`Bad Request: ${e.message}`, { status: 400 }),
          ),
        RequestJsonError: (e) =>
          Effect.succeed(
            new Response(`Bad Request: Invalid JSON Input`, { status: 400 }),
          ),
      }),
    ),
  ),
  // POST: createEffectApiHandler(
  //   pipe(
  //     // RequestTag,
  //     // Effect.andThen((request) => request.json()),
  //     // Effect.andThen((body) =>
  //     //   Schema.decodeUnknown(ChatRequestBodySchema)(body),
  //     // ),
  //     // TODO: fix auth
  //     // Effect.zip(ConvexHttpClient),
  //     // AiChat,
  //     // Effect.andThen((chat) => chat.streamText({})),
  //     // Effect.provide(ConvexHttpClient.Default),
  //     // Effect.provide(ConvexConfig.Default),
  //     Effect.suspend(() => Effect.succeed(new Response("Hello, world!"))),
  //   ),
  // ),
});
