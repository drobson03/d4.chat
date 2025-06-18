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
    <main className="flex min-h-dvh min-w-dvw items-center justify-center">
      <SignIn />
    </main>
  );
}
