import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import type { ModelName } from "~/lib/server/models";
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
import { convexQuery } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import { DefaultChatTransport } from "ai";
import { useAuthToken } from "@convex-dev/auth/react";

export function Chat({
  id,
  onFinish,
}: {
  id?: string;
  onFinish?: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const authToken = useAuthToken();

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
    enabled: Boolean(id),
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
      setMessages(chatMessages as any);
    }
  }, [chatMessages]);

  function handleSubmit(
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    e.preventDefault();
    const chatId = nanoid();

    void navigate({
      from: "/chat/",
      to: "/chat/$chatId",
      params: { chatId },
    });

    if (authToken) {
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
            model,
            chatId,
          },
        },
        {
          headers: {
            "X-Convex-Token": authToken,
          },
          body: {
            chatId,
            model,
          },
        },
      );
    }
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
            {chat?.messages.find((m) => m._id === message.id)?.model && (
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
