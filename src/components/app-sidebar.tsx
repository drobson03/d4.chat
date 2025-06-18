import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { isAfter, isToday, isYesterday, subDays } from "date-fns";
import { PinIcon, PinOffIcon, TrashIcon } from "lucide-react";
import type React from "react";
// import { SearchForm } from "~/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { api } from "~/convex/_generated/api";
import type { Doc } from "~/convex/_generated/dataModel";
import { SidebarUser } from "./sidebar-user";
import { Button } from "./ui/button";

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

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link className="mx-auto text-lg font-bold tracking-wide" to="/chat">
          d4
        </Link>
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
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function AppSidebarChatMenuButton({ chat }: { chat: Chat }): React.ReactNode {
  const pinChatMutation = useMutation({
    mutationFn: useConvexMutation(api.chats.togglePinChat).withOptimisticUpdate(
      (localStore, args) => {
        const currentValue = localStore.getQuery(api.chats.my);

        if (currentValue) {
          localStore.setQuery(
            api.chats.my,
            {},
            currentValue.map((c) =>
              c._id === args.id ? { ...c, pinned: !c.pinned } : c,
            ),
          );
        }
      },
    ),
  });

  const deleteChatMutation = useMutation({
    mutationFn: useConvexMutation(api.chats.deleteChat).withOptimisticUpdate(
      (localStore, args) => {
        const currentValue = localStore.getQuery(api.chats.my);

        if (currentValue) {
          localStore.setQuery(
            api.chats.my,
            {},
            currentValue.filter((c) => c._id !== args.id),
          );
        }

        const byIdValue = localStore.getQuery(api.chats.byId, { id: args.id });

        if (byIdValue) {
          localStore.setQuery(api.chats.byId, { id: args.id }, null);
        }
      },
    ),
  });

  return (
    <SidebarMenuItem className="relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground">
      <SidebarMenuButton asChild>
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          activeProps={{
            "data-active": "true",
          }}
        >
          {chat.name}
        </Link>
      </SidebarMenuButton>
      <div className="absolute right-0 inset-y-0 items-center hidden group-hover/menu-item:flex h-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-full aspect-square hover:bg-sidebar-primary hover:text-sidebar-primary-foreground dark:hover:bg-sidebar-primary dark:hover:text-sidebar-primary-foreground"
          onClick={() => pinChatMutation.mutate({ id: chat._id })}
        >
          {chat.pinned ? <PinOffIcon /> : <PinIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full aspect-square hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground"
          onClick={() => deleteChatMutation.mutate({ id: chat._id })}
        >
          <TrashIcon />
        </Button>
      </div>
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
          {chats.map((chat, i) => (
            <AppSidebarChatMenuButton chat={chat} key={i} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
