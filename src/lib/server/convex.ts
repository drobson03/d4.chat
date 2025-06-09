import { Config, Effect, pipe } from "effect";
import { ConvexHttpClient as BrowserConvexHttpClient } from "convex/browser";

export class ConvexConfig extends Effect.Service<ConvexConfig>()(
  "app/convex:Config",
  {
    effect: Config.all({
      url: Config.string("CONVEX_URL"),
    }),
  },
) {}

export class ConvexHttpClient extends Effect.Service<ConvexHttpClient>()(
  "app/convex:HttpClient",
  {
    effect: pipe(
      ConvexConfig,
      Effect.andThen(
        (config) =>
          new BrowserConvexHttpClient(
            config.url,
          ) as BrowserConvexHttpClient satisfies BrowserConvexHttpClient,
      ),
    ),
    dependencies: [ConvexConfig.Default],
  },
) {}
