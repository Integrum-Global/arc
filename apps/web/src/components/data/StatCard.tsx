"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatCompactNumber,
} from "@/lib/formatting";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendIndicator } from "@/components/data-display";
import { type LucideIcon } from "lucide-react";

/**
 * StatCard Component
 *
 * A card component for displaying key statistics with title, value,
 * change indicators, and optional icons. Supports loading states
 * and various value formats.
 */

export type StatCardFormat = "number" | "currency" | "percent" | "compact";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title/label for the stat */
  title: string;
  /** The main value to display */
  value: number | null | undefined;
  /** Change value (as decimal for percent, e.g., 0.15 = 15%) */
  change?: number | null;
  /** Label for the change (e.g., "vs last month") */
  changeLabel?: string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Trend direction override (auto-detected from change if not provided) */
  trend?: "up" | "down" | "neutral";
  /** Loading state */
  loading?: boolean;
  /** Value format type */
  format?: StatCardFormat;
  /** Currency code (for currency format) */
  currency?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Compact large numbers (e.g., 1.5M instead of 1,500,000) */
  compact?: boolean;
  /** Icon background color variant */
  iconVariant?: "default" | "primary" | "success" | "warning" | "destructive";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    card: "p-4",
    title: "text-xs",
    value: "text-xl",
    icon: "h-8 w-8",
    iconWrapper: "h-10 w-10",
  },
  md: {
    card: "p-5",
    title: "text-sm",
    value: "text-2xl",
    icon: "h-5 w-5",
    iconWrapper: "h-12 w-12",
  },
  lg: {
    card: "p-6",
    title: "text-base",
    value: "text-3xl",
    icon: "h-6 w-6",
    iconWrapper: "h-14 w-14",
  },
};

const iconVariantClasses = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-positive/10 text-positive",
  warning: "bg-amber-500/10 text-amber-500",
  destructive: "bg-destructive/10 text-destructive",
};

/**
 * Format the value based on format type
 */
function formatStatValue(
  value: number | null | undefined,
  format: StatCardFormat,
  options: { currency?: string; decimals?: number; compact?: boolean }
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const { currency = "USD", decimals = 2, compact = false } = options;

  switch (format) {
    case "currency":
      return formatCurrency(value, { currency, decimals, compact });
    case "percent":
      return formatPercent(value, {
        decimals,
        showSign: false,
        isPercentage: false,
      });
    case "compact":
      return formatCompactNumber(value, { decimals });
    default:
      return compact
        ? formatCompactNumber(value, { decimals })
        : formatNumber(value, { decimals });
  }
}

/**
 * Loading skeleton for StatCard
 */
export function StatCardSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = sizeClasses[size];

  return (
    <Card className={cn(sizes.card, "gap-0", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className={cn("rounded-lg", sizes.iconWrapper)} />
      </div>
    </Card>
  );
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  loading = false,
  format = "number",
  currency = "USD",
  decimals = 2,
  compact = false,
  iconVariant = "default",
  size = "md",
  className,
  ...props
}: StatCardProps) {
  const sizes = sizeClasses[size];

  if (loading) {
    return <StatCardSkeleton size={size} className={className} />;
  }

  const formattedValue = formatStatValue(value, format, {
    currency,
    decimals,
    compact,
  });

  return (
    <Card className={cn(sizes.card, "gap-0", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          {/* Title */}
          <p
            className={cn(
              "font-medium text-muted-foreground",
              sizes.title
            )}
          >
            {title}
          </p>

          {/* Main Value */}
          <p
            className={cn(
              "font-bold font-mono tabular-nums tracking-tight",
              sizes.value
            )}
          >
            {formattedValue}
          </p>

          {/* Change Indicator */}
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-1.5">
              <TrendIndicator
                value={change}
                variant="pill"
                iconStyle="arrow"
                size="sm"
                showValue={true}
                showIcon={true}
              />
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg shrink-0",
              sizes.iconWrapper,
              iconVariantClasses[iconVariant]
            )}
          >
            <Icon className={sizes.icon} />
          </div>
        )}
      </div>
    </Card>
  );
}

StatCard.displayName = "StatCard";
StatCard.Skeleton = StatCardSkeleton;
