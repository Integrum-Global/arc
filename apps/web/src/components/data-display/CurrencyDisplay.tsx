"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, getValueColor } from "@/lib/formatting";

/**
 * CurrencyDisplay Component
 *
 * A specialized component for displaying currency values with
 * automatic formatting and optional color coding.
 */

export interface CurrencyDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** The numeric value to display */
  value: number | null | undefined;
  /** Currency code (default: USD) */
  currency?: string;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Use compact notation for large numbers */
  compact?: boolean;
  /** Show currency symbol */
  showSymbol?: boolean;
  /** Apply positive/negative coloring */
  colored?: boolean;
  /** Invert color logic */
  inverted?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Locale for formatting */
  locale?: string;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-medium",
  xl: "text-lg font-semibold",
};

export function CurrencyDisplay({
  value,
  currency = "USD",
  decimals = 2,
  compact = false,
  showSymbol = true,
  colored = false,
  inverted = false,
  size = "md",
  locale = "en-US",
  className,
  ...props
}: CurrencyDisplayProps) {
  const formattedValue = formatCurrency(value, {
    currency,
    decimals,
    compact,
    showSymbol,
    locale,
  });

  const colorClass = colored ? getValueColor(value, { inverted }) : "";

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    >
      {formattedValue}
    </span>
  );
}

CurrencyDisplay.displayName = "CurrencyDisplay";

/**
 * Convenience component for displaying gains/losses
 */
export interface GainLossDisplayProps
  extends Omit<CurrencyDisplayProps, "colored"> {
  /** Show as inline badge style */
  badge?: boolean;
}

export function GainLossDisplay({
  value,
  badge = false,
  className,
  ...props
}: GainLossDisplayProps) {
  const isPositive = value !== null && value !== undefined && value > 0;
  const isNegative = value !== null && value !== undefined && value < 0;

  const badgeClasses = badge
    ? cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        isPositive && "bg-positive/10 text-positive",
        isNegative && "bg-negative/10 text-negative",
        !isPositive && !isNegative && "bg-muted text-muted-foreground"
      )
    : "";

  return (
    <CurrencyDisplay
      value={value}
      colored={!badge}
      className={cn(badgeClasses, className)}
      {...props}
    />
  );
}

GainLossDisplay.displayName = "GainLossDisplay";
