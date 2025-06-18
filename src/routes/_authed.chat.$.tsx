import type { UIMessage } from "@ai-sdk/react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { useEffect, useMemo } from "react";
import { Chat } from "~/components/chat";
import { api } from "~/convex/_generated/api";
import { getOpenRouterModelsQueryOptions } from "~/lib/models";

export type UIMessageWithMetadata = UIMessage<{
  user?: string;
  model: string;
}>;

export const Route = createFileRoute("/_authed/chat/$")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(getOpenRouterModelsQueryOptions);

    if (!params._splat) {
      return {
        crumb: "New Chat",
      };
    }

    const chat = await context.queryClient.ensureQueryData(
      convexQuery(
        api.chats.byId,
        params._splat ? { id: params._splat } : "skip",
      ),
    );

    if (!chat) {
      throw notFound();
    }

    return {
      crumb: chat.name,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.crumb,
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const { _splat } = Route.useParams({
    select: (params) => ({
      _splat: params._splat,
    }),
  });

  const chatId = useMemo(() => (!_splat ? nanoid() : _splat), [_splat]);

  const { data: chat } = useQuery(
    convexQuery(api.chats.byId, chatId ? { id: chatId } : "skip"),
  );

  useEffect(() => {
    if (_splat && _splat.length > 0 && !chat) {
      navigate({ to: ".", params: { _splat: "" } });
    }
  }, [_splat, chat, navigate]);

  return (
    <Chat
      key={chatId}
      chatId={chatId}
      initialMessages={
        chat?.messages as UIMessageWithMetadata[] | undefined satisfies
          | UIMessageWithMetadata[]
          | undefined
      }
    />
  );
}
