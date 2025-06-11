import { Config, Context, Effect, Option, pipe } from "effect";
import { ConvexHttpClient as BrowserConvexHttpClient } from "convex/browser";

export class ConvexConfig extends Effect.Service<ConvexConfig>()(
  "app/convex:Config",
  {
    effect: Config.all({
      url: Config.string("CONVEX_URL"),
    }),
  },
) {}

export class ConvexAuth extends Effect.Service<ConvexAuth>()(
  "app/convex:Auth",
  {
    succeed: {
      token: Option.none<string>(),
    },
  },
) {}

export class ConvexHttpClient extends Effect.Service<ConvexHttpClient>()(
  "app/convex:HttpClient",
  {
    effect: pipe(
      ConvexConfig,
      Effect.zip(ConvexAuth),
      Effect.andThen(([config, auth]) => {
        const client = new BrowserConvexHttpClient(
          config.url,
        ) as BrowserConvexHttpClient satisfies BrowserConvexHttpClient;

        if (Option.isSome(auth.token)) {
          client.setAuth(auth.token.value);
        }

        return client;
      }),
    ),
    dependencies: [ConvexConfig.Default, ConvexAuth.Default],
  },
) {}
