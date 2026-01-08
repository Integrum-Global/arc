"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatRatio,
  getValueColor,
} from "@/lib/formatting";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * MetricRow Component
 *
 * A simple key-value display component for showing metrics
 * with optional trend indicators and formatting.
 */

export type MetricFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "ratio"
  | "compact";

export type TrendDirection = "up" | "down" | "neutral";

export interface MetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label for the metric */
  label: string;
  /** The value to display (number for formatted types, string for text) */
  value: number | string | null | undefined;
  /** Secondary/sub value */
  subValue?: string;
  /** Trend direction */
  trend?: TrendDirection;
  /** Value format type */
  format?: MetricFormat;
  /** Number of decimal places */
  decimals?: number;
  /** Currency code (for currency format) */
  currency?: string;
  /** Suffix (for ratio format) */
  suffix?: string;
  /** Show trend colors on value */
  colorValue?: boolean;
  /** Invert trend colors (down is good) */
  invertColors?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Layout variant */
  layout?: "horizontal" | "stacked";
  /** Icon component to show with label */
  icon?: React.ReactNode;
  /** Description/tooltip text */
  description?: string;
}

const sizeClasses = {
  sm: {
    label: "text-xs",
    value: "text-sm font-medium",
    subValue: "text-xs",
    icon: "h-3.5 w-3.5",
    row: "py-1.5",
  },
  md: {
    label: "text-sm",
    value: "text-base font-medium",
    subValue: "text-xs",
    icon: "h-4 w-4",
    row: "py-2",
  },
  lg: {
    label: "text-base",
    value: "text-lg font-semibold",
    subValue: "text-sm",
    icon: "h-5 w-5",
    row: "py-2.5",
  },
};

/**
 * Format the value based on format type
 */
function formatMetricValue(
  value: number | string | null | undefined,
  format: MetricFormat,
  options: { decimals?: number; currency?: string; suffix?: string }
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  const { decimals = 2, currency = "USD", suffix = "" } = options;

  switch (format) {
    case "currency":
      return formatCurrency(value, { currency, decimals });
    case "percent":
      return formatPercent(value, { decimals, showSign: false });
    case "ratio":
      return formatRatio(value, { decimals, suffix });
    case "compact":
      return formatNumber(value, { decimals, compact: true });
    case "number":
      return formatNumber(value, { decimals });
    default:
      return String(value);
  }
}

/**
 * Get trend icon component
 */
function TrendIcon({
  trend,
  className,
}: {
  trend: TrendDirection;
  className?: string;
}) {
  switch (trend) {
    case "up":
      return <TrendingUp className={className} />;
    case "down":
      return <TrendingDown className={className} />;
    default:
      return <Minus className={className} />;
  }
}

/**
 * Get trend color class
 */
function getTrendColor(
  trend: TrendDirection,
  inverted: boolean = false
): string {
  if (trend === "neutral") return "text-neutral";

  const isPositive = inverted ? trend === "down" : trend === "up";
  return isPositive ? "text-positive" : "text-negative";
}

/**
 * Loading skeleton for MetricRow
 */
export function MetricRowSkeleton({
  size = "md",
  layout = "horizontal",
  className,
}: {
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "stacked";
  className?: string;
}) {
  const sizes = sizeClasses[size];

  if (layout === "stacked") {
    return (
      <div className={cn("space-y-1", sizes.row, className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        sizes.row,
        className
      )}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function MetricRow({
  label,
  value,
  subValue,
  trend,
  format = "text",
  decimals = 2,
  currency = "USD",
  suffix = "",
  colorValue = false,
  invertColors = false,
  loading = false,
  size = "md",
  layout = "horizontal",
  icon,
  description,
  className,
  ...props
}: MetricRowProps) {
  if (loading) {
    return <MetricRowSkeleton size={size} layout={layout} className={className} />;
  }

  const sizes = sizeClasses[size];
  const formattedValue = formatMetricValue(value, format, {
    decimals,
    currency,
    suffix,
  });

  // Determine value color
  let valueColorClass = "";
  if (colorValue && typeof value === "number") {
    if (trend) {
      valueColorClass = getTrendColor(trend, invertColors);
    } else {
      valueColorClass = getValueColor(value, { inverted: invertColors });
    }
  }

  // Stacked layout
  if (layout === "stacked") {
    return (
      <div
        className={cn("space-y-0.5", sizes.row, className)}
        title={description}
        {...props}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className={sizes.label}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono tabular-nums",
              sizes.value,
              valueColorClass || "text-foreground"
            )}
          >
            {formattedValue}
          </span>
          {trend && (
            <TrendIcon
              trend={trend}
              className={cn(sizes.icon, getTrendColor(trend, invertColors))}
            />
          )}
        </div>
        {subValue && (
          <span className={cn("text-muted-foreground", sizes.subValue)}>
            {subValue}
          </span>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        sizes.row,
        className
      )}
      title={description}
      {...props}
    >
      {/* Label */}
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        {icon}
        <span className={cn(sizes.label, "truncate")}>{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <span
            className={cn(
              "font-mono tabular-nums",
              sizes.value,
              valueColorClass || "text-foreground"
            )}
          >
            {formattedValue}
          </span>
          {subValue && (
            <span
              className={cn(
                "block text-muted-foreground",
                sizes.subValue
              )}
            >
              {subValue}
            </span>
          )}
        </div>
        {trend && (
          <TrendIcon
            trend={trend}
            className={cn(sizes.icon, getTrendColor(trend, invertColors))}
          />
        )}
      </div>
    </div>
  );
}

MetricRow.displayName = "MetricRow";
MetricRow.Skeleton = MetricRowSkeleton;

/**
 * MetricRowGroup - Container for multiple MetricRows with dividers
 */
export interface MetricRowGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Show dividers between rows */
  dividers?: boolean;
  /** Children (MetricRow components) */
  children: React.ReactNode;
}

export function MetricRowGroup({
  dividers = true,
  children,
  className,
  ...props
}: MetricRowGroupProps) {
  return (
    <div
      className={cn(
        dividers && "divide-y divide-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

MetricRowGroup.displayName = "MetricRowGroup";
