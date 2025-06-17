import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "~/components/chat";

export const Route = createFileRoute("/_authed/chat/")({
  loader: () => {
    return {
      crumb: { title: "New Chat", navigate: false },
    };
  },
  component: Chat,
});
