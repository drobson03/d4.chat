import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  type RegisteredRouter,
  type ValidateLinkOptions,
} from "@tanstack/react-router";
import { isAfter, isToday, isYesterday, subDays } from "date-fns";
import { PinIcon } from "lucide-react";
import type React from "react";
// import { SearchForm } from "~/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { api } from "~/convex/_generated/api";
import { Doc } from "~/convex/_generated/dataModel";

type Chat = Doc<"chats">;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: chats } = useQuery({
    ...convexQuery(api.chats.my, {}),
    select: (chats) =>
      chats.reduce(
        (acc, chat) => {
          const sevenDaysAgo = subDays(new Date(), 7);
          const thirtyDaysAgo = subDays(new Date(), 30);

          if (chat.pinned) {
            acc.pinned.push(chat);
          } else if (isToday(chat.updatedAt)) {
            acc.today.push(chat);
          } else if (isYesterday(chat.updatedAt)) {
            acc.yesterday.push(chat);
          } else if (isAfter(chat.updatedAt, sevenDaysAgo)) {
            acc.last7Days.push(chat);
          } else if (isAfter(chat.updatedAt, thirtyDaysAgo)) {
            acc.last30Days.push(chat);
          } else {
            acc.older.push(chat);
          }

          return acc;
        },
        {
          pinned: [] as Chat[],
          today: [] as Chat[],
          yesterday: [] as Chat[],
          last7Days: [] as Chat[],
          last30Days: [] as Chat[],
          older: [] as Chat[],
        },
      ),
  });

  const { data: user } = useQuery(convexQuery(api.users.current, {}));

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link className="mx-auto text-lg font-bold tracking-wide" to="/chat">
          d4
        </Link>
        <p>{user?.name}</p>
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent>
        {chats?.pinned.length && chats.pinned.length > 0 ? (
          <AppSidebarChatGroup
            title={
              <>
                <PinIcon className="mt-px mr-1 !size-3.5" />
                Pinned
              </>
            }
            chats={chats.pinned}
          />
        ) : null}

        {chats?.today.length && chats.today.length > 0 ? (
          <AppSidebarChatGroup title="Today" chats={chats.today} />
        ) : null}

        {chats?.yesterday.length && chats.yesterday.length > 0 ? (
          <AppSidebarChatGroup title="Yesterday" chats={chats.yesterday} />
        ) : null}

        {chats?.last7Days.length && chats.last7Days.length > 0 ? (
          <AppSidebarChatGroup title="Last 7 days" chats={chats.last7Days} />
        ) : null}

        {chats?.last30Days.length && chats.last30Days.length > 0 ? (
          <AppSidebarChatGroup title="Last 30 days" chats={chats.last30Days} />
        ) : null}

        {chats?.older.length && chats.older.length > 0 ? (
          <AppSidebarChatGroup title="Older" chats={chats.older} />
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}

export interface AppSidebarMenuButtonProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
> {
  title: string;
  linkOptions: ValidateLinkOptions<TRouter, TOptions>;
}

function AppSidebarMenuButton<TRouter extends RegisteredRouter, TOptions>(
  props: AppSidebarMenuButtonProps<TRouter, TOptions>,
): React.ReactNode {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link {...props.linkOptions}>{props.title}</Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebarChatGroup({
  chats,
  title,
}: {
  chats: Chat[];
  title: React.ReactNode;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-primary">{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {chats.map((item, i) => (
            <AppSidebarMenuButton
              title={item.name}
              linkOptions={{
                to: "/",
                // to: "/chat/$chatId",
                params: { chatId: item.id },
                activeProps: {
                  "data-active": "true",
                },
              }}
              key={i}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
