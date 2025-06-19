import { useAuth, useUser } from "@clerk/tanstack-react-start";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useContext } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { ThemeContext } from "./theme";
import { Toggle } from "./ui/toggle";

export function SidebarUser() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user?.imageUrl ? (
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName ?? ""}
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.fullName}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "top"}
          >
            <DropdownMenuGroup className="flex flex-row gap-1 justify-stretch items-center">
              <DropdownMenuLabel className="text-sm font-medium grow-0">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Toggle
                  onClick={(e) => {
                    e.preventDefault();
                    setTheme("system");
                  }}
                  pressed={theme === "system"}
                  className="focus-visible:ring-0 grow"
                >
                  <MonitorIcon />
                </Toggle>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Toggle
                  onClick={(e) => {
                    e.preventDefault();
                    setTheme("light");
                  }}
                  pressed={theme === "light"}
                  className="focus-visible:ring-0 grow"
                >
                  <SunIcon />
                </Toggle>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Toggle
                  onClick={(e) => {
                    e.preventDefault();
                    setTheme("dark");
                  }}
                  pressed={theme === "dark"}
                  className="focus-visible:ring-0 grow"
                >
                  <MoonIcon />
                </Toggle>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="w-full" asChild>
              <button type="button" onClick={() => signOut()}>
                <LogOutIcon />
                Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
