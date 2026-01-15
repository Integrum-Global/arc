/**
 * Sidebar Component
 *
 * Navigation sidebar with collapsible support.
 * Shows full labels when expanded, icons only when collapsed.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  navigationConfig,
  isNavItemActive,
  type NavItem,
  type NavSection,
} from "@/config/navigation";

/**
 * Sidebar Props
 */
export interface SidebarProps {
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onToggle?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Single navigation item component
 */
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavItemComponent({ item, isActive, collapsed }: NavItemComponentProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", collapsed && "h-5 w-5")} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  // Wrap with tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

/**
 * Navigation section component
 */
interface NavSectionComponentProps {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  isLast: boolean;
}

function NavSectionComponent({
  section,
  pathname,
  collapsed,
  isLast,
}: NavSectionComponentProps) {
  return (
    <div className="space-y-1">
      {section.title && !collapsed && (
        <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {section.title}
        </h4>
      )}
      <nav className="space-y-1">
        {section.items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={isNavItemActive(pathname, item)}
            collapsed={collapsed}
          />
        ))}
      </nav>
      {!isLast && <Separator className="my-4" />}
    </div>
  );
}

/**
 * Sidebar Component
 *
 * @example
 * ```tsx
 * <Sidebar
 *   collapsed={isCollapsed}
 *   onToggle={() => setCollapsed(!isCollapsed)}
 * />
 * ```
 */
export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo/Brand */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              A
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                A
              </div>
              <span className="text-lg font-semibold tracking-tight">ARC</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {navigationConfig.map((section, index) => (
            <NavSectionComponent
              key={section.title || index}
              section={section}
              pathname={pathname}
              collapsed={collapsed}
              isLast={index === navigationConfig.length - 1}
            />
          ))}
        </div>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="w-full h-9 hover:bg-accent"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="w-full justify-between px-3 h-9 text-muted-foreground hover:text-foreground hover:bg-accent group"
              aria-label="Collapse sidebar"
            >
              <span className="text-xs">Collapse</span>
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

Sidebar.displayName = "Sidebar";
