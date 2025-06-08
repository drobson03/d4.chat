import { createFileRoute } from "@tanstack/react-router";
import { useAuthToken, useAuthActions } from "@convex-dev/auth/react";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signIn } = useAuthActions();
  const { data: user } = useQuery(convexQuery(api.users.current, {}));

  return (
    <main>
      <h1 className="text-3xl text-blue-500 mb-5">D4 Chat</h1>

      <button onClick={() => void signIn("github")}>Sign in with GitHub</button>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </main>
  );
}
