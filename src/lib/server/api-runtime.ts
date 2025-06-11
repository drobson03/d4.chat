import {
  Cause,
  Console,
  Context,
  Data,
  Effect,
  Layer,
  ManagedRuntime,
} from "effect";

export class RequestTag extends Context.Tag("app:RequestTag")<
  RequestTag,
  Request
>() {}

function createApiRuntime(request: Request) {
  return ManagedRuntime.make(Layer.succeed(RequestTag, request));
}

type ApiRuntime = ReturnType<typeof createApiRuntime>;

type ApiHandlerEffect<E extends Error | unknown> = Effect.Effect<
  Response,
  E | ManagedRuntime.ManagedRuntime.Error<ApiRuntime>,
  ManagedRuntime.ManagedRuntime.Context<ApiRuntime>
>;

export function createEffectApiHandler<E extends Error | unknown>(
  effect: ApiHandlerEffect<E>,
) {
  return async ({ request }: { request: Request }) => {
    const runtime = createApiRuntime(request);

    const effectWithFallback = effect.pipe(
      Effect.catchAll((error) => {
        Console.error(
          "[Effect via Services] Execution failed:",
          Cause.isCause(error)
            ? Cause.pretty(error)
            : error instanceof Error
              ? error.message
              : error,
        );

        return Effect.succeed(
          new Response("Internal Server Error", { status: 500 }),
        );
      }),
    );

    return await runtime.runPromise(effectWithFallback);
  };
}

export class UnauthorizedError extends Data.TaggedError(
  "UnauthorizedError",
)<{}> {}
