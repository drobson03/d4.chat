import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Chat } from "~/components/chat";
import { api } from "~/convex/_generated/api";

export const Route = createFileRoute("/_authed/chat/$chatId")({
  loader: async ({ context, params }) => {
    const chat = await context.queryClient.ensureQueryData(
      convexQuery(api.chats.byId, { id: params.chatId }),
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
        title: loaderData?.crumb ?? "New Chat",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  return <Chat id={params.chatId} />;
}
