import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/")({
  beforeLoad: async () => {
    throw redirect({ to: "/chat" });
  },
});
