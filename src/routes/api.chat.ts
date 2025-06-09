import { createAPIFileRoute } from "@tanstack/react-start/api";
import { type UIMessage, smoothStream, streamText } from "ai";
import { Effect, pipe, Predicate, Schema } from "effect";
import { api } from "~/convex/_generated/api";
import {
  createEffectApiHandler,
  RequestTag,
  UnauthorizedError,
} from "~/lib/server/api-runtime";
import { ConvexHttpClient } from "~/lib/server/convex";
import { models, type ModelName } from "~/lib/server/models";
import { ChatRequestBodySchema } from "~/lib/validation/chat-request";

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
      Effect.andThen(Schema.decodeUnknown(ChatRequestBodySchema)),
      Effect.andThen((body) =>
        Effect.all([
          Effect.succeed(body),
          pipe(
            ConvexHttpClient,
            Effect.andThen((convex) =>
              Effect.tryPromise(() => convex.query(api.users.current, {})),
            ),
            Effect.filterOrFail(
              Predicate.isNotNull,
              () => new UnauthorizedError(),
            ),
          ),
        ]),
      ),
      Effect.andThen(([{ messages, model }]) =>
        Effect.try(() =>
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
        ),
      ),
      Effect.provide(ConvexHttpClient.Default),
      Effect.andThen((stream) =>
        Effect.try(() =>
          stream.toUIMessageStreamResponse({
            sendReasoning: true,
          }),
        ),
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
