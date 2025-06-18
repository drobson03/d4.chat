import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import type { ModelName } from "~/lib/server/ai/models";
import TextareaAutosize from "react-textarea-autosize";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { textareaClassName } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ChevronRightIcon, Loader2Icon, SendIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { modelMetadata } from "~/lib/client/models";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import type { Doc, Id } from "~/convex/_generated/dataModel";

export function Chat({ id }: { id?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useRouteContext({ from: "/_authed" });

  const createChatMutation = useMutation({
    mutationFn: useConvexMutation(
      api.chats.setChatMessages,
    ).withOptimisticUpdate((localStore, args) => {
      const newChat: Doc<"chats"> = {
        _id: crypto.randomUUID() as Id<"chats">,
        _creationTime: Date.now(),
        id: args.id,
        model: args.model,
        name: "New Chat",
        pinned: false,
        updatedAt: Date.now(),
        user: token,
        messages: args.messages.map((message) => ({
          message,
          meta: {
            model: args.model,
            user: token,
          },
        })),
      };

      localStore.setQuery(api.chats.byId, { id: args.id }, newChat);

      const currentValue = localStore.getQuery(api.chats.my);

      if (currentValue) {
        localStore.setQuery(api.chats.my, {}, [...currentValue, newChat]);
      }
    }),
  });

  const [input, setInput] = useState("");

  const [model, setModel] = useState<ModelName>(
    (Object.keys(modelMetadata ?? {}).at(0) ??
      "gemini-2.5-flash-preview-05-20") as ModelName,
  );

  const { data: chat } = useQuery({
    ...convexQuery(api.chats.byId, id ? { id } : "skip"),
    initialData: {
      _id: "" as Id<"chats">,
      _creationTime: 0,
      id: nanoid(),
      model: model,
      name: "New Chat",
      pinned: false,
      updatedAt: 0,
      user: token,
      messages: [],
    },
  });

  const messages = useMemo(() => chat?.messages ?? [], [chat]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      id,
      messages,
    }: {
      id: string;
      messages: unknown[];
    }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: id,
          model,
          messages,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return [id, response.body.pipeThrough(new TextDecoderStream())] as const;
    },
    onSuccess: async ([id, stream]) => {
      const queryKey = convexQuery(api.chats.byId, { id }).queryKey;
      console.log(queryKey);
      const reader = stream.getReader();
      while (true) {
        const { done, value: values } = await reader.read();
        for (const value of values?.split("\n\n").filter(Boolean) ?? []) {
          if (done || value.startsWith("data: [DONE]")) break;

          if (value.startsWith("data: ") && !value.startsWith("data: [DONE]")) {
            try {
              const json = JSON.parse(value.slice(5));

              if ("error" in json) {
                throw new Error(json.error);
              }

              // queryClient.setQueryData(queryKey, (oldData: Doc<"chats">) => ({
              //   ...oldData,
              //   messages: [
              //     ...oldData.messages.slice(0, -1),
              //     {
              //       message: {
              //         ...oldData.messages[oldData.messages.length - 1]!.message,
              //         parts: [
              //           ...oldData.messages[oldData.messages.length - 1]!
              //             .message.parts,
              //           json,
              //         ],
              //       },
              //       meta: oldData.messages[oldData.messages.length - 1]!.meta,
              //     },
              //   ],
              // }));
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    },
  });

  function handleSubmit(
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    e.preventDefault();
    const chatId = nanoid();

    const sendMessages = [
      ...messages.map((message) => message.message),
      {
        _tag: "UserMessage" as const,
        parts: [
          {
            _tag: "TextPart" as const,
            text: input,
          },
        ],
      },
      {
        _tag: "AssistantMessage" as const,
        parts: [
          {
            _tag: "TextPart" as const,
            text: "",
          },
        ],
      },
    ];

    void createChatMutation.mutateAsync({
      id: chatId,
      model,
      messages: sendMessages,
    });

    void sendMessageMutation.mutateAsync({
      id: chatId,
      messages: sendMessages.slice(0, -1),
    });
    // sendMessage(input, {
    //   body: {
    //     chatId,
    //     model,
    //   },
    // });

    void navigate({
      from: "/chat/",
      to: "/chat/$chatId",
      params: { chatId },
    });
  }

  return (
    <>
      <div className="absolute inset-0 flex w-full flex-col gap-4 overflow-y-scroll px-[30%] pt-4 pb-48">
        {messages.map((message, i) => (
          <div
            key={i}
            className="data-[tag=UserMessage]:bg-card group flex flex-col gap-2 rounded p-4 data-[tag=UserMessage]:ml-auto data-[tag=UserMessage]:w-4/5 data-[tag=UserMessage]:border"
            data-tag={message.message._tag}
          >
            {message.message.parts.some(
              (part) => part._tag === "ReasoningPart",
            ) ? (
              <Collapsible className="flex flex-col gap-2">
                <CollapsibleTrigger className="group flex items-center gap-1">
                  <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                  Reasoning
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose bg-accent text-accent-foreground rounded p-4">
                    <Markdown>
                      {message.message.parts
                        .filter((part) => part._tag === "ReasoningPart")
                        .map((part) => part.reasoningText)
                        .join("\n")
                        .replaceAll("\\n", "")
                        .trim()}
                    </Markdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
            <div className="prose dark:prose-invert">
              <Markdown>
                {message.message.parts.find((part) => part._tag === "TextPart")
                  ?.text ?? ""}
              </Markdown>
            </div>
            {message.meta.model && message.message._tag !== "UserMessage" && (
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                {modelMetadata[message.meta.model as ModelName].icon({
                  className: "size-4",
                })}
                <span className="text-muted-foreground text-sm">
                  {message.meta.model
                    ? modelMetadata[message.meta.model as ModelName].label
                    : ""}
                </span>
              </div>
            )}
          </div>
        ))}
        {/* {status === "submitted" ? (
          <Loader2Icon className="animate-spin" />
        ) : null} */}
      </div>

      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-card flex w-[40%] flex-col gap-2 rounded-t border-x border-t p-2"
        >
          <div className="flex flex-row gap-x-2">
            <TextareaAutosize
              name="prompt"
              value={input}
              // TODO: Why are these types not working
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setInput(e.target.value)
              }
              className={cn(textareaClassName, "w-full resize-none")}
              minRows={4}
              onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.ctrlKey && e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />

            <Button type="submit" aria-label="Send message" size="icon">
              <SendIcon fill="currentColor" />
            </Button>
          </div>
          <Select
            value={model}
            onValueChange={(value) => setModel(value as ModelName)}
          >
            <SelectTrigger className="max-w-min">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modelMetadata).map(([name, meta]) => (
                <SelectItem key={name} value={name}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      </div>
    </>
  );
}
