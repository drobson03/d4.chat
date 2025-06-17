import { createServerFileRoute } from "@tanstack/react-start/server";
import { convertToModelMessages, smoothStream, streamText } from "ai";
import { Effect, pipe, Predicate, Schema } from "effect";
import { api } from "~/convex/_generated/api";
import {
  createEffectApiHandler,
  RequestTag,
  UnauthorizedError,
} from "~/lib/server/api-runtime";
import { ConvexConfig, ConvexHttpClient } from "~/lib/server/convex";
import { models } from "~/lib/server/models";
import { ChatRequestBodySchema } from "~/lib/validation/chat-request";
import { ChatGenerationError } from "~/lib/server/ai/error";

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
      Effect.andThen(([{ messages, model, chatId }, convex]) =>
        pipe(
          // TODO: fix messages type
          Effect.try(() => convertToModelMessages(messages as any)),
          Effect.andThen((messages) =>
            Effect.try({
              try: () =>
                streamText({
                  model: models[model],
                  system: "You are a helpful assistant.",
                  messages,
                  experimental_transform: smoothStream({ chunking: "word" }),
                }),
              catch: (error) => new ChatGenerationError({ cause: error }),
            }),
          ),
          Effect.andThen((stream) =>
            Effect.try({
              try: () =>
                stream.toUIMessageStreamResponse({
                  sendReasoning: true,
                  onFinish: async ({ messages }) => {
                    await convex.mutation(api.chats.appendMessagesToChat, {
                      id: chatId,
                      model,
                      // TODO: fix messages type
                      messages: messages.map((messages) => ({
                        ...messages,
                        id: undefined,
                      })) as any,
                    });
                  },
                }),
              catch: (error) => new ChatGenerationError({ cause: error }),
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
