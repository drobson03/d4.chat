import { getAuth } from "@clerk/tanstack-react-start/server";
import { ConvexHttpClient as BrowserConvexHttpClient } from "convex/browser";
import { Config, Effect, Option, pipe } from "effect";
import { RequestTag } from "./api-runtime";

export class ConvexConfig extends Effect.Service<ConvexConfig>()(
  "app/convex:Config",
  {
    effect: Config.all({
      url: Config.string("CONVEX_URL"),
    }),
  },
) {}

export class ConvexClerkAuth extends Effect.Service<ConvexClerkAuth>()(
  "app/convex:ClerkAuth",
  {
    succeed: {
      getToken: () =>
        pipe(
          RequestTag,
          Effect.andThen((request) =>
            Effect.tryPromise(() => getAuth(request)),
          ),
          Effect.andThen((auth) =>
            Effect.tryPromise(() => auth.getToken({ template: "convex" })),
          ),
          Effect.andThen((token) => Effect.succeed(Option.fromNullable(token))),
        ),
    } as const,
  },
) {}

export class ConvexHttpClient extends Effect.Service<ConvexHttpClient>()(
  "app/convex:HttpClient",
  {
    effect: pipe(
      ConvexConfig,
      Effect.zip(ConvexClerkAuth),
      Effect.andThen(([config, clerkAuth]) =>
        Effect.all([Effect.succeed(config), clerkAuth.getToken()]),
      ),
      Effect.andThen(([config, token]) => {
        const client = new BrowserConvexHttpClient(
          config.url,
        ) as BrowserConvexHttpClient satisfies BrowserConvexHttpClient;

        if (Option.isSome(token)) {
          client.setAuth(token.value);
        }

        return client;
      }),
    ),
    dependencies: [ConvexConfig.Default, ConvexClerkAuth.Default],
  },
) {}
