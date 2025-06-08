import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "~/convex/_generated/api";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context }) => {
    if (context.user === null) {
      throw redirect({ to: "/auth/sign-in" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { data: user } = useQuery(convexQuery(api.users.current, {}));

  useEffect(() => {
    if (user === null) {
      navigate({ to: "/auth/sign-in" });
    }
  }, [user, navigate]);

  return <Outlet />;
}
