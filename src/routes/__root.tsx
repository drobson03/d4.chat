/// <reference types="vite/client" />

import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ConvexReactClient } from "convex/react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { fetchClerkAuth } from "~/lib/server/auth";
import styles from "~/styles/app.css?url";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  beforeLoad: async (ctx) => {
    const auth = await fetchClerkAuth();
    const { userId, token } = auth;

    // During SSR only (the only time serverHttpClient exists),
    // set the Clerk auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return {
      userId,
      token,
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackRouterDevtools position="bottom-right" />

        <ReactQueryDevtools initialIsOpen={false} />
        <Scripts />
      </body>
    </html>
  );
}
