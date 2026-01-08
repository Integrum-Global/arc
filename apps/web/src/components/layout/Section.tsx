/**
 * Section Component
 *
 * A collapsible section with title, subtitle, and optional actions.
 * Useful for organizing content into logical groups.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Section Props
 */
export interface SectionProps {
  /** Section title */
  title?: string;
  /** Section subtitle/description */
  subtitle?: string;
  /** Actions to display in the header (e.g., buttons) */
  actions?: React.ReactNode;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Whether the section is collapsed by default */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Section content */
  children: React.ReactNode;
  /** Additional class names for the container */
  className?: string;
  /** Additional class names for the content area */
  contentClassName?: string;
  /** Whether to add a border around the section */
  bordered?: boolean;
  /** Whether to add padding to the content area */
  padded?: boolean;
}

/**
 * Section Component
 *
 * @example
 * ```tsx
 * // Basic section
 * <Section title="Portfolio Summary">
 *   <PortfolioContent />
 * </Section>
 *
 * // Collapsible section with actions
 * <Section
 *   title="Recent Transactions"
 *   subtitle="Last 30 days"
 *   actions={<Button size="sm">View All</Button>}
 *   collapsible
 *   defaultCollapsed={false}
 * >
 *   <TransactionsList />
 * </Section>
 * ```
 */
export function Section({
  title,
  subtitle,
  actions,
  collapsible = false,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  children,
  className,
  contentClassName,
  bordered = false,
  padded = true,
}: SectionProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalCollapsed, setInternalCollapsed] =
    React.useState(defaultCollapsed);

  const isControlled = controlledCollapsed !== undefined;
  const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    const newValue = !isCollapsed;
    if (!isControlled) {
      setInternalCollapsed(newValue);
    }
    onCollapsedChange?.(newValue);
  };

  const hasHeader = title || subtitle || actions || collapsible;

  return (
    <section
      className={cn(
        "rounded-lg",
        bordered && "border bg-card",
        className
      )}
    >
      {/* Header */}
      {hasHeader && (
        <header
          className={cn(
            "flex items-center gap-4",
            bordered && padded && "px-4 py-3 border-b",
            !bordered && "pb-4",
            collapsible && "cursor-pointer select-none",
            isCollapsed && bordered && "border-b-0"
          )}
          onClick={collapsible ? handleToggle : undefined}
          role={collapsible ? "button" : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggle();
                  }
                }
              : undefined
          }
        >
          {/* Collapse indicator */}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </header>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div
          className={cn(
            "transition-all duration-200",
            bordered && padded && "p-4",
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}

Section.displayName = "Section";

/**
 * SectionGroup Props
 */
export interface SectionGroupProps {
  /** Section children */
  children: React.ReactNode;
  /** Gap between sections */
  gap?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

/**
 * Gap size classes
 */
const gapClasses = {
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
};

/**
 * SectionGroup Component
 *
 * A container for grouping multiple sections with consistent spacing.
 *
 * @example
 * ```tsx
 * <SectionGroup gap="lg">
 *   <Section title="Overview">...</Section>
 *   <Section title="Details">...</Section>
 *   <Section title="Actions">...</Section>
 * </SectionGroup>
 * ```
 */
export function SectionGroup({
  children,
  gap = "md",
  className,
}: SectionGroupProps) {
  return (
    <div className={cn(gapClasses[gap], className)}>{children}</div>
  );
}

SectionGroup.displayName = "SectionGroup";
