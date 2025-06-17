import { createServerFileRoute } from "@tanstack/react-start/server";
import { convertToModelMessages, smoothStream, streamText } from "ai";
import { Console, Effect, pipe, Predicate, Schema, Option } from "effect";
import { api } from "~/convex/_generated/api";
import {
  createEffectApiHandler,
  RequestTag,
  UnauthorizedError,
} from "~/lib/server/api-runtime";
import {
  ConvexAuth,
  ConvexConfig,
  ConvexHttpClient,
} from "~/lib/server/convex";
import { models } from "~/lib/server/models";
import { ChatRequestBodySchema } from "~/lib/validation/chat-request";
import { ChatGenerationError } from "~/lib/server/ai/error";
import { nanoid } from "nanoid";

// async function saveChat(
//   publicId: string,
//   userId: string,
//   messages: UIMessage[],
//   model: ModelName,
// ) {
//   let chat = await db.query.chat.findFirst({
//     where: and(eq(chatTable.publicId, publicId), eq(chatTable.userId, userId)),
//   });

//   if (!chat) {
//     const [_chat] = await db
//       .insert(chatTable)
//       .values({
//         publicId,
//         userId: userId,
//         name: "New Thread",
//       })
//       .returning();
//     chat = _chat;
//   }

//   await db
//     .insert(messageTable)
//     .values(
//       messages.map((message) => ({
//         id: message.id,
//         chatId: chat.id,
//         content: message.content,
//         role: message.role,
//         parts: message.parts,
//         model: message.role !== "user" ? model : undefined,
//       })),
//     )
//     .onConflictDoNothing({
//       target: [messageTable.id],
//     });
// }

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: createEffectApiHandler(
    pipe(
      RequestTag,
      Effect.andThen((request) => request.json()),
      Effect.andThen((body) =>
        Schema.decodeUnknown(ChatRequestBodySchema)(body),
      ),
      Effect.andThen((body) =>
        Effect.all([
          Effect.succeed(body),
          pipe(
            ConvexHttpClient,
            Effect.tap((convex) => {
              console.log("convex", convex);
            }),
            Effect.filterOrFail(
              Predicate.isNotNull,
              () => new UnauthorizedError(),
            ),
            Effect.zip(ConvexHttpClient),
            Effect.andThen(([convex]) =>
              Effect.tryPromise(() =>
                convex.mutation(api.chats.create, {
                  id: nanoid(),
                  model: body.model,
                  // TODO: fix messages type
                  messages: body.messages as any,
                }),
              ),
            ),
          ),
        ]),
      ),
      Effect.andThen(([{ messages, model }, chatId]) =>
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
                }),
              catch: (error) => new ChatGenerationError({ cause: error }),
            }),
          ),
        ),
      ),
      Effect.catchTags({
        UnauthorizedError: () =>
          Effect.succeed(new Response("Unauthorized", { status: 401 })),
        ParseError: () =>
          Effect.succeed(new Response("Bad Request", { status: 400 })),
        ChatGenerationError: () =>
          Effect.succeed(
            new Response("Chat Generation Error", { status: 500 }),
          ),
      }),
      Effect.provide(ConvexHttpClient.DefaultWithoutDependencies),
      Effect.provide(ConvexConfig.Default),
      Effect.provideServiceEffect(
        ConvexAuth,
        pipe(
          RequestTag,
          Effect.andThen((request) =>
            ConvexAuth.make({
              token: Option.fromNullable(request.headers.get("X-Convex-Token")),
            }),
          ),
        ),
      ),
    ),
  ),
});
