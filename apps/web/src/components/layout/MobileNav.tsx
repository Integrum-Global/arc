/**
 * MobileNav Component
 *
 * Mobile navigation drawer using Sheet component.
 * Slides in from the left with the same navigation items as Sidebar.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  navigationConfig,
  isNavItemActive,
  type NavItem,
  type NavSection,
} from "@/config/navigation";

/**
 * MobileNav Props
 */
export interface MobileNavProps {
  /** Whether the navigation sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Single navigation item component for mobile
 */
interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
  onSelect: () => void;
}

function MobileNavItem({ item, isActive, onSelect }: MobileNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Navigation section component for mobile
 */
interface MobileNavSectionProps {
  section: NavSection;
  pathname: string;
  onSelect: () => void;
  isLast: boolean;
}

function MobileNavSection({
  section,
  pathname,
  onSelect,
  isLast,
}: MobileNavSectionProps) {
  return (
    <div className="space-y-1">
      {section.title && (
        <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {section.title}
        </h4>
      )}
      <nav className="space-y-1">
        {section.items.map((item) => (
          <MobileNavItem
            key={item.href}
            item={item}
            isActive={isNavItemActive(pathname, item)}
            onSelect={onSelect}
          />
        ))}
      </nav>
      {!isLast && <Separator className="my-4" />}
    </div>
  );
}

/**
 * MobileNav Component
 *
 * A sheet-based mobile navigation that slides in from the left.
 * Uses the same navigation configuration as the desktop Sidebar.
 *
 * @example
 * ```tsx
 * function Layout() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Menu</Button>
 *       <MobileNav open={open} onOpenChange={setOpen} />
 *     </>
 *   );
 * }
 * ```
 */
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  const handleSelect = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        {/* Header */}
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              A
            </div>
            <span className="text-lg font-semibold tracking-tight">ARC</span>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {navigationConfig.map((section, index) => (
            <MobileNavSection
              key={section.title || index}
              section={section}
              pathname={pathname}
              onSelect={handleSelect}
              isLast={index === navigationConfig.length - 1}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            ARC Investment Platform
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

MobileNav.displayName = "MobileNav";
