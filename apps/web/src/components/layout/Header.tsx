/**
 * Header Component
 *
 * Application header with search, notifications, user profile, and theme toggle.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Menu, Search, Bell, User, Settings, LogOut, HelpCircle } from "lucide-react";

/**
 * Header Props
 */
export interface HeaderProps {
  /** Callback when menu button is clicked (for mobile) */
  onMenuToggle?: () => void;
  /** Whether to show the search input */
  showSearch?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Mock notifications for demo
 */
const notifications = [
  {
    id: "1",
    title: "Portfolio Alert",
    message: "AAPL has increased by 5%",
    time: "5 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Report Ready",
    message: "Q4 performance report is ready",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Market Update",
    message: "Markets closed higher today",
    time: "3 hours ago",
    unread: false,
  },
];

/**
 * Notifications dropdown component
 */
function NotificationsDropdown() {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className={cn(
              "flex flex-col items-start gap-1 p-3 cursor-pointer",
              notification.unread && "bg-accent/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{notification.title}</span>
              {notification.unread && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {notification.message}
            </span>
            <span className="text-xs text-muted-foreground">
              {notification.time}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm font-medium">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * User profile dropdown component
 */
function UserDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/user.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              john.doe@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Search input component
 */
function SearchInput() {
  const [focused, setFocused] = React.useState(false);

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        focused ? "w-80" : "w-64"
      )}
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-9 h-9"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </div>
  );
}

/**
 * Header Component
 *
 * @example
 * ```tsx
 * <Header
 *   onMenuToggle={() => setSidebarOpen(true)}
 *   showSearch
 * />
 * ```
 */
export function Header({
  onMenuToggle,
  showSearch = true,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6",
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search */}
      {showSearch && (
        <div className="hidden md:flex flex-1">
          <SearchInput />
        </div>
      )}

      {/* Mobile search button */}
      {showSearch && (
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1 md:flex-none" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </header>
  );
}

Header.displayName = "Header";
