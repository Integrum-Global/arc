"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  getValueColor,
  getValueSentiment,
  type ValueSentiment,
} from "@/lib/formatting";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * ValueDisplay Component
 *
 * A flexible component for displaying numeric values with automatic
 * color coding based on positive/negative values. Supports currency,
 * percentage, and plain number formats.
 */

export type ValueDisplayFormat = "number" | "currency" | "percent";

export interface ValueDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** The numeric value to display */
  value: number | null | undefined;
  /** Display format type */
  format?: ValueDisplayFormat;
  /** Number of decimal places */
  decimals?: number;
  /** Show plus sign for positive values (for percent format) */
  showSign?: boolean;
  /** Show trend icon alongside value */
  showTrend?: boolean;
  /** Use compact notation for large numbers */
  compact?: boolean;
  /** Currency code (for currency format) */
  currency?: string;
  /** Invert color logic (negative = good) */
  inverted?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Disable color coding */
  neutral?: boolean;
  /** Additional label to show before value */
  prefix?: string;
  /** Additional label to show after value */
  suffix?: string;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg font-semibold",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
};

/**
 * Get the trend icon component based on sentiment
 */
function getTrendIcon(sentiment: ValueSentiment, className: string) {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className={className} />;
    case "negative":
      return <TrendingDown className={className} />;
    default:
      return <Minus className={className} />;
  }
}

/**
 * Format value based on format type
 */
function formatValue(
  value: number | null | undefined,
  format: ValueDisplayFormat,
  options: {
    decimals?: number;
    showSign?: boolean;
    compact?: boolean;
    currency?: string;
  }
): string {
  const { decimals, showSign, compact, currency } = options;

  switch (format) {
    case "currency":
      return formatCurrency(value, {
        decimals,
        compact,
        currency,
      });
    case "percent":
      return formatPercent(value, {
        decimals,
        showSign,
        isPercentage: false,
      });
    default:
      return formatNumber(value, {
        decimals,
        compact,
        showSign,
      });
  }
}

export function ValueDisplay({
  value,
  format = "number",
  decimals = 2,
  showSign = false,
  showTrend = false,
  compact = false,
  currency = "USD",
  inverted = false,
  size = "md",
  neutral = false,
  prefix,
  suffix,
  className,
  ...props
}: ValueDisplayProps) {
  const formattedValue = formatValue(value, format, {
    decimals,
    showSign: format === "percent" ? showSign : showSign,
    compact,
    currency,
  });

  const colorClass = neutral
    ? "text-foreground"
    : getValueColor(value, { inverted });

  const sentiment = getValueSentiment(value, { inverted });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono tabular-nums",
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    >
      {showTrend && getTrendIcon(sentiment, iconSizes[size])}
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      {formattedValue}
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}

ValueDisplay.displayName = "ValueDisplay";
