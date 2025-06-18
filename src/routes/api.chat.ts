import { createServerFileRoute } from "@tanstack/react-start/server";
import { convertToModelMessages, smoothStream, streamText } from "ai";
import { Effect, pipe, Schema } from "effect";
import { api } from "~/convex/_generated/api";
import { ChatGenerationError } from "~/lib/server/ai/error";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { createEffectApiHandler, RequestTag } from "~/lib/server/api-runtime";
import { ConvexConfig, ConvexHttpClient } from "~/lib/server/convex";
import {
  ChatRequestBodySchema,
  MessagesSchema,
} from "~/lib/validation/chat-request";

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: createEffectApiHandler(
    pipe(
      RequestTag,
      Effect.andThen((request) => request.json()),
      Effect.andThen((body) =>
        Schema.decodeUnknown(ChatRequestBodySchema)(body),
      ),
      Effect.zip(ConvexHttpClient),
      // TODO: fix auth
      Effect.andThen(([{ messages, model, id }, convex]) =>
        pipe(
          Effect.try(() => convertToModelMessages(messages)),
          Effect.andThen((messages) =>
            Effect.try({
              try: () =>
                streamText({
                  model: openrouter(model),
                  system: "You are a helpful assistant.",
                  messages,
                  experimental_transform: smoothStream({ chunking: "word" }),
                }),
              catch: (error) => new ChatGenerationError({ cause: error }),
            }),
          ),
          Effect.andThen((stream) =>
            stream.toUIMessageStreamResponse({
              sendReasoning: true,
              sendSources: true,
              messageMetadata: () => ({
                model,
              }),
              onFinish: async ({ messages: _messages }) => {
                const messages =
                  Schema.decodeUnknownSync(MessagesSchema)(_messages);

                await convex.mutation(api.chats.appendMessagesToChat, {
                  id,
                  model,
                  messages: messages.map((message) => ({
                    ...message,
                    metadata: {
                      model,
                    },
                  })),
                });
              },
            }),
          ),
        ),
      ),
      Effect.catchTags({
        // UnauthorizedError: () =>
        //   Effect.succeed(new Response("Unauthorized", { status: 401 })),
        ParseError: () =>
          Effect.succeed(new Response("Bad Request", { status: 400 })),
        ChatGenerationError: () =>
          Effect.succeed(
            new Response("Chat Generation Error", { status: 500 }),
          ),
      }),
      Effect.provide(ConvexHttpClient.Default),
      Effect.provide(ConvexConfig.Default),
    ),
  ),
});
