import { useChat } from "@ai-sdk/react";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { ChevronRightIcon, Loader2Icon, SendIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
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
import { modelMetadata } from "~/lib/client/models";
import type { ModelName } from "~/lib/server/models";
import { cn } from "~/lib/utils";

export function Chat({
  id,
  onFinish,
}: {
  id?: string;
  onFinish?: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const { token } = useRouteContext({ from: "__root__" });

  const createChatMutation = useMutation({
    mutationFn: useConvexMutation(
      api.chats.appendMessagesToChat,
    ).withOptimisticUpdate((localStore, args) => {
      const currentValue = localStore.getQuery(api.chats.my);

      if (currentValue && token) {
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

        localStore.setQuery(api.chats.my, {}, [...currentValue, newChat]);

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

  const [model, setModel] = useState<ModelName>(
    (Object.keys(modelMetadata ?? {}).at(0) ??
      "gemini-2.5-flash-preview-05-20") as ModelName,
  );
  const { messages, status, sendMessage, setMessages } = useChat({
    onFinish: () => {
      onFinish?.();
    },
  });

  const { data: chat } = useQuery({
    ...convexQuery(api.chats.byId, { id: id! }),
    enabled: () => Boolean(id),
  });

  const chatMessages = useMemo(() => {
    return chat?.messages.map((message) => ({
      id: message._id,
      ...message,
    }));
  }, [chat?.messages]);

  useEffect(() => {
    if (chatMessages) {
      // TODO: fix messages type
      // biome-ignore lint/suspicious/noExplicitAny: needs fixing
      setMessages(chatMessages as any);
    }
  }, [
    chatMessages, // TODO: fix messages type
    setMessages,
  ]);

  function handleSubmit(
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    e.preventDefault();
    const chatId = nanoid();

    void createChatMutation.mutateAsync({
      id: chatId,
      model,
      messages: [
        {
          role: "user",
          parts: [{ type: "text", text: input }],
        },
      ],
    });

    sendMessage(
      {
        role: "user",
        parts: [
          {
            type: "text",
            text: input,
          },
        ],
        metadata: {
          chatId,
        },
      },
      {
        body: {
          chatId,
          model,
        },
      },
    );

    void navigate({
      from: "/chat/",
      to: "/chat/$chatId",
      params: { chatId },
    });
  }

  return (
    <>
      <div className="absolute inset-0 flex w-full flex-col gap-4 overflow-y-scroll px-[30%] pt-4 pb-48">
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
                  <div className="prose bg-accent text-accent-foreground rounded p-4">
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
            {chat?.messages.find((m) => m._id === message.id)?.model &&
              message.role !== "user" && (
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {modelMetadata[
                    chat?.messages.find((m) => m._id === message.id)
                      ?.model as ModelName
                  ].icon({
                    className: "size-4",
                  })}
                  <span className="text-muted-foreground text-sm">
                    {
                      modelMetadata[
                        chat?.messages.find((m) => m._id === message.id)
                          ?.model as ModelName
                      ].label
                    }
                  </span>
                </div>
              )}
          </div>
        ))}
        {status === "submitted" ? (
          <Loader2Icon className="animate-spin" />
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
