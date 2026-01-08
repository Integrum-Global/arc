/**
 * Breadcrumb Component
 *
 * Auto-generates breadcrumb navigation from the current route.
 * Uses Next.js usePathname for route detection.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { getBreadcrumbItems } from "@/config/navigation";

/**
 * Breadcrumb item definition
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** URL path */
  href: string;
  /** Whether this is the current page */
  isCurrent?: boolean;
  /** Whether this is an ellipsis placeholder (internal use) */
  isEllipsis?: boolean;
}

/**
 * Breadcrumb Props
 */
export interface BreadcrumbProps {
  /** Override auto-generated items with custom items */
  items?: BreadcrumbItem[];
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Additional class names */
  className?: string;
  /** Maximum number of items to show (rest will be collapsed) */
  maxItems?: number;
}

/**
 * Breadcrumb Component
 *
 * Automatically generates breadcrumb navigation from the current route,
 * or accepts custom items for manual control.
 *
 * @example
 * ```tsx
 * // Auto-generated from route
 * <Breadcrumb />
 *
 * // Custom items
 * <Breadcrumb
 *   items={[
 *     { label: "Dashboard", href: "/dashboard" },
 *     { label: "Settings", href: "/settings", isCurrent: true },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items: customItems,
  showHomeIcon = true,
  className,
  maxItems,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Use custom items or generate from pathname
  const allItems = React.useMemo(() => {
    if (customItems) {
      return customItems;
    }

    const generatedItems = getBreadcrumbItems(pathname);
    return generatedItems.map((item, index, arr) => ({
      ...item,
      isCurrent: index === arr.length - 1,
    }));
  }, [customItems, pathname]);

  // Handle collapsed items if maxItems is set
  const displayItems = React.useMemo((): BreadcrumbItem[] => {
    if (!maxItems || allItems.length <= maxItems) {
      return allItems;
    }

    // Keep first item, last (maxItems - 2) items, with ellipsis in between
    const first = allItems[0];
    const last = allItems.slice(-(maxItems - 2));
    if (!first) return last;
    return [first, { label: "...", href: "#", isEllipsis: true }, ...last];
  }, [allItems, maxItems]);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {displayItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === displayItems.length - 1;
          const isCurrent =
            "isCurrent" in item ? item.isCurrent : isLast;
          const isEllipsis = "isEllipsis" in item && item.isEllipsis;

          return (
            <li key={item.href + index} className="flex items-center gap-1.5">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}

              {/* Item content */}
              {isEllipsis ? (
                <span className="text-muted-foreground px-1">...</span>
              ) : isCurrent ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {isFirst && showHomeIcon ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-muted-foreground transition-colors hover:text-foreground",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  )}
                >
                  {isFirst && showHomeIcon ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumb.displayName = "Breadcrumb";

/**
 * BreadcrumbSeparator Props
 */
export interface BreadcrumbSeparatorProps {
  /** Custom separator content */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * BreadcrumbSeparator Component
 *
 * A standalone separator for custom breadcrumb layouts.
 */
export function BreadcrumbSeparator({
  children,
  className,
}: BreadcrumbSeparatorProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("text-muted-foreground", className)}
    >
      {children ?? <ChevronRight className="h-3.5 w-3.5" />}
    </span>
  );
}

BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
