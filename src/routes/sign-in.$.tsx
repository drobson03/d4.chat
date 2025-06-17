import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  beforeLoad: async ({ context }) => {
    if (context.userId) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main>
      <SignIn />
    </main>
  );
}
