import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/chat")({
  loader: async () => {
    return {
      crumb: { title: "Chats", navigate: false },
    };
  },
});
