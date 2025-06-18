import { type UIMessage, useChat } from "@ai-sdk/react";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  GlobeIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SendIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import Markdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { textareaClassName } from "~/components/ui/textarea";
import { api } from "~/convex/_generated/api";
import type { Doc, Id } from "~/convex/_generated/dataModel";
import { getOpenRouterModelsQueryOptions } from "~/lib/models";
import { cn } from "~/lib/utils";
import { Toggle } from "./ui/toggle";

export type UIMessageWithMetadata = UIMessage<{
  user?: string;
  model: string;
}>;

export function Chat({
  chatId,
  initialMessages,
}: {
  chatId?: string;
  initialMessages?: UIMessageWithMetadata[];
}) {
  const navigate = useNavigate();
  const { token } = useRouteContext({ from: "/_authed" });

  const createChatMutation = useMutation({
    mutationFn: useConvexMutation(
      api.chats.appendMessagesToChat,
    ).withOptimisticUpdate((localStore, args) => {
      const currentChats = localStore.getQuery(api.chats.my);

      const currentChat = localStore.getQuery(api.chats.byId, {
        id: args.id,
      });

      if (currentChat) {
        localStore.setQuery(
          api.chats.byId,
          { id: args.id },
          {
            ...currentChat,
            messages: [
              ...currentChat.messages,
              ...args.messages.map((message) => ({
                ...message,
                _id: crypto.randomUUID() as Id<"messages">,
                _creationTime: Date.now(),
                chat: currentChat._id,
              })),
            ],
          },
        );
      }

      if (currentChats && !currentChats.some((chat) => chat.id === args.id)) {
        const newChat: Doc<"chats"> = {
          _id: crypto.randomUUID() as Id<"chats">,
          _creationTime: Date.now(),
          id: args.id,
          model: args.model,
          name: "New Chat",
          pinned: false,
          updatedAt: Date.now(),
          user: token,
        };

        localStore.setQuery(api.chats.my, {}, [...currentChats, newChat]);

        localStore.setQuery(
          api.chats.byId,
          { id: args.id },
          {
            ...newChat,
            messages: args.messages.map((message) => ({
              ...message,
              _id: crypto.randomUUID() as Id<"messages">,
              _creationTime: Date.now(),
              chat: newChat._id,
              model: args.model,
              user: token,
            })),
          },
        );
      }
    }),
  });

  const [input, setInput] = useState("");

  const { data: models } = useQuery(getOpenRouterModelsQueryOptions);

  const [model, setModel] = useState(models?.at(0)?.id ?? "qwen/qwen3-8b:free");

  const {
    messages,
    status,
    sendMessage,
    error,
    reload,
    id: internalId,
  } = useChat({
    id: chatId,
    generateId: () => nanoid(),
    messages: (initialMessages ??
      []) as UIMessageWithMetadata[] satisfies UIMessageWithMetadata[],
  });

  function handleSubmit(
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    e.preventDefault();
    setInput("");

    const newMessage = {
      id: nanoid(),
      role: "user" as const,
      parts: [
        {
          type: "text",
          text: input,
        },
      ],
      metadata: {
        user: token,
        model,
      },
    } satisfies UIMessage;

    void createChatMutation.mutateAsync({
      id: internalId,
      model,
      messages: [newMessage],
    });

    sendMessage(newMessage, {
      body: {
        model,
      },
    });

    void navigate({
      from: "/chat/$",
      to: "/chat/$",
      params: { _splat: internalId },
    });
  }

  return (
    <>
      <div className="absolute inset-0 flex w-full flex-col gap-4 overflow-y-scroll px-[30%] mt-4 mb-48">
        {messages.map((message) => (
          <div
            key={message.id}
            className="data-[role=user]:bg-card group flex flex-col gap-2 rounded p-4 data-[role=user]:ml-auto data-[role=user]:w-4/5 data-[role=user]:border"
            data-role={message.role}
          >
            {message.parts.some((part) => part.type === "reasoning") ? (
              <Collapsible className="flex flex-col gap-2">
                <CollapsibleTrigger className="group flex items-center gap-1">
                  <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                  Reasoning
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose bg-accent text-accent-foreground rounded p-4 space-y-2 dark:prose-invert">
                    <Markdown>
                      {message.parts
                        .filter((part) => part.type === "reasoning")
                        .map((part) => part.text)
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
                {message.parts.find((part) => part.type === "text")?.text ?? ""}
              </Markdown>
            </div>
            {message.metadata?.model && message.role !== "user" && (
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-muted-foreground text-sm">
                  {message.metadata?.model}
                </span>
              </div>
            )}
          </div>
        ))}
        {error ? (
          <div className="flex items-center gap-2 px-4">
            <AlertTriangleIcon className="size-4" />
            <p className="text-sm">{error.message}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                void reload();
              }}
            >
              <RefreshCcwIcon className="size-4" />
            </Button>
          </div>
        ) : null}
        {status === "submitted" ? (
          <div className="flex px-4">
            <Loader2Icon className="animate-spin size-8" />
          </div>
        ) : null}
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
              onChange={(e) => setInput(e.target.value)}
              className={cn(textareaClassName, "w-full resize-none")}
              minRows={4}
              onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.ctrlKey && e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
              placeholder="Ask me anything..."
            />
          </div>
          <div className="flex flex-row gap-x-2 items-center">
            <Select value={model} onValueChange={(value) => setModel(value)}>
              <SelectTrigger className="max-w-min">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Toggle aria-label="Enable search" variant="outline">
              <GlobeIcon className="size-4" />
              Search
            </Toggle>
            <Button
              type="submit"
              aria-label="Send message"
              size="icon"
              className="ml-auto"
            >
              <SendIcon fill="currentColor" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
