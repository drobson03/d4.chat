import { useAuthActions } from "@convex-dev/auth/react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "~/convex/_generated/api";

export const Route = createFileRoute("/auth/sign-in")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { signIn } = useAuthActions();
  const { data: user } = useQuery(convexQuery(api.users.current, {}));

  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  return (
    <main>
      <button type="button" onClick={() => void signIn("github")}>
        Sign in
      </button>
    </main>
  );
}
