import { createAPIFileRoute } from "@tanstack/react-start/api";
import { smoothStream, streamText } from "ai";
import { Effect, pipe, Predicate, Schema, Option } from "effect";
import { api } from "~/convex/_generated/api";
import {
  createEffectApiHandler,
  RequestTag,
  UnauthorizedError,
} from "~/lib/server/api-runtime";
import { ConvexHttpClient } from "~/lib/server/convex";
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

export const APIRoute = createAPIFileRoute("/api/chat")({
  POST: createEffectApiHandler(
    pipe(
      RequestTag,
      Effect.andThen((request) => request.json()),
      Effect.andThen((body) =>
        Schema.decodeUnknown(ChatRequestBodySchema)(body),
      ),
      Effect.zip(RequestTag),
      Effect.andThen(([body, request]) =>
        Effect.all([
          Effect.succeed(body),
          pipe(
            ConvexHttpClient,
            Effect.zip(
              Effect.succeed(
                Option.fromNullable(request.headers.get("X-Convex-Token")),
              ),
            ),
            Effect.andThen(([convex, token]) => {
              if (Option.isSome(token)) {
                convex.setAuth(token.value);
              }
              return convex;
            }),
            Effect.andThen((convex) =>
              Effect.tryPromise(() => convex.query(api.users.current, {})),
            ),
            Effect.filterOrFail(
              Predicate.isNotNull,
              () => new UnauthorizedError(),
            ),
            Effect.zip(ConvexHttpClient),
            Effect.andThen(([user, convex]) =>
              Effect.all([
                Effect.succeed(user),
                Effect.tryPromise(() =>
                  convex.mutation(api.chats.create, {
                    id: nanoid(),
                    model: body.model,
                  }),
                ),
              ]),
            ),
          ),
        ]),
      ),
      Effect.andThen(([{ messages, model }, [user, chatId]]) =>
        Effect.try({
          try: () =>
            streamText({
              model: models[model],
              system: "You are a helpful assistant.",
              // TODO: fix this
              messages: messages as any,
              experimental_transform: smoothStream({ chunking: "word" }),
              onError: (error) => {
                throw error;
              },
            }),
          catch: (cause) => {
            throw new ChatGenerationError({ cause });
          },
        }),
      ),
      Effect.provide(ConvexHttpClient.Default),
      Effect.andThen((stream) =>
        Effect.try({
          try: () =>
            stream.toUIMessageStreamResponse({
              sendReasoning: true,
            }),
          catch: (cause) => {
            throw new ChatGenerationError({ cause });
          },
        }),
      ),
    ),
  ),
  // POST: async ({ request, params }) => {
  //   const { id, messages, model } = parseResult.output;

  //   const result = streamText({
  //     model: models[model],
  //     system: "You are a helpful assistant.",
  //     messages: messages as Array<Omit<UIMessage, "id">>,
  //     experimental_transform: smoothStream({ chunking: "word" }),
  //     experimental_generateMessageId: () => generateNanoid(),
  //     onError: (error) => {
  //       console.error(error);
  //     },
  //     onFinish: async ({ response }) => {
  //       try {
  //         await saveChat(
  //           id,
  //           session.user.id,
  //           appendResponseMessages({
  //             messages,
  //             responseMessages: response.messages,
  //           }) as UIMessage[],
  //           model,
  //         );
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     },
  //   });

  //   return result.toUIMessageStreamResponse({
  //     sendReasoning: true,
  //   });
  // },
});
