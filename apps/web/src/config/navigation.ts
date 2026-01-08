/**
 * Navigation Configuration
 *
 * Centralized navigation item definitions for the application.
 * Used by Sidebar and MobileNav components.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Brain,
  Bell,
  Settings,
} from "lucide-react";

/**
 * Navigation item definition
 */
export interface NavItem {
  /** Display label */
  label: string;
  /** URL path */
  href: string;
  /** Icon component */
  icon: LucideIcon;
  /** Optional badge count */
  badge?: number;
  /** Sub-navigation items */
  children?: NavItem[];
  /** Whether to match exact path or include children */
  exact?: boolean;
}

/**
 * Navigation section definition
 */
export interface NavSection {
  /** Section title (optional) */
  title?: string;
  /** Navigation items in this section */
  items: NavItem[];
}

/**
 * Main navigation items
 */
export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Portfolios",
    href: "/portfolios",
    icon: Briefcase,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Intelligence",
    href: "/intelligence",
    icon: Brain,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
  },
];

/**
 * Secondary/utility navigation items
 */
export const secondaryNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

/**
 * Complete navigation configuration
 */
export const navigationConfig: NavSection[] = [
  {
    items: mainNavItems,
  },
  {
    title: "System",
    items: secondaryNavItems,
  },
];

/**
 * Check if a path matches a navigation item
 * @param pathname Current pathname
 * @param item Navigation item
 * @returns Whether the path matches
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Get breadcrumb items from pathname
 * @param pathname Current pathname
 * @returns Array of breadcrumb items
 */
export function getBreadcrumbItems(
  pathname: string
): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: { label: string; href: string }[] = [];

  // Always start with dashboard
  items.push({ label: "Dashboard", href: "/dashboard" });

  // Build breadcrumb from path segments
  let currentPath = "";
  for (const segment of segments) {
    if (segment === "dashboard") continue; // Skip dashboard in breadcrumb path

    currentPath += `/${segment}`;

    // Find matching nav item for label
    const navItem = [...mainNavItems, ...secondaryNavItems].find(
      (item) => item.href === currentPath
    );

    // Format segment for display (capitalize, replace hyphens)
    const label = navItem
      ? navItem.label
      : segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

    items.push({ label, href: currentPath });
  }

  return items;
}
