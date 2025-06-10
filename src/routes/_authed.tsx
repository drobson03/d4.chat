import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "~/convex/_generated/api";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { Breadcrumbs } from "~/components/breadcrumbs";

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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-y-hidden border md:peer-data-[variant=inset]:shadow-none">
        <header className="flex h-16 shrink-0 items-center gap-2 rounded-t-xl border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumbs />
        </header>
        <div className="absolute top-16 bottom-0 flex w-full flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
