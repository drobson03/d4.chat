import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main>
      <h1 className="text-3xl text-blue-500 mb-5">D4 Chat</h1>
    </main>
  );
}
