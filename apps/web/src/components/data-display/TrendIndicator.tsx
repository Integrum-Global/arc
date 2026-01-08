"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  getValueSentiment,
  type ValueSentiment,
} from "@/lib/formatting";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/**
 * TrendIndicator Component
 *
 * A versatile component for displaying trend information with
 * icons and percentage changes. Supports multiple visual variants.
 */

export type TrendVariant = "default" | "compact" | "pill" | "icon-only";
export type TrendIconStyle = "trending" | "arrow" | "chevron";

export interface TrendIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The percentage change value (as decimal, e.g., 0.15 = 15%) */
  value: number | null | undefined;
  /** Display variant */
  variant?: TrendVariant;
  /** Icon style */
  iconStyle?: TrendIconStyle;
  /** Number of decimal places for percentage */
  decimals?: number;
  /** Show the percentage value */
  showValue?: boolean;
  /** Show the trend icon */
  showIcon?: boolean;
  /** Invert sentiment (negative = good) */
  inverted?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional label */
  label?: string;
  /** Input is already a percentage (not decimal) */
  isPercentage?: boolean;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const pillSizes = {
  sm: "px-1.5 py-0.5",
  md: "px-2 py-1",
  lg: "px-3 py-1.5",
};

/**
 * Get sentiment colors for backgrounds and text
 */
function getSentimentColors(sentiment: ValueSentiment) {
  switch (sentiment) {
    case "positive":
      return {
        text: "text-positive",
        bg: "bg-positive/10",
        border: "border-positive/20",
      };
    case "negative":
      return {
        text: "text-negative",
        bg: "bg-negative/10",
        border: "border-negative/20",
      };
    default:
      return {
        text: "text-neutral",
        bg: "bg-neutral/10",
        border: "border-neutral/20",
      };
  }
}

/**
 * Get the appropriate icon component based on style and sentiment
 */
function getIcon(
  style: TrendIconStyle,
  sentiment: ValueSentiment,
  className: string
) {
  const icons = {
    trending: {
      positive: TrendingUp,
      negative: TrendingDown,
      neutral: Minus,
    },
    arrow: {
      positive: ArrowUp,
      negative: ArrowDown,
      neutral: ArrowRight,
    },
    chevron: {
      positive: ChevronUp,
      negative: ChevronDown,
      neutral: Minus,
    },
  };

  const IconComponent = icons[style][sentiment];
  return <IconComponent className={className} />;
}

export function TrendIndicator({
  value,
  variant = "default",
  iconStyle = "trending",
  decimals = 2,
  showValue = true,
  showIcon = true,
  inverted = false,
  size = "md",
  label,
  isPercentage = false,
  className,
  ...props
}: TrendIndicatorProps) {
  const sentiment = getValueSentiment(value, { inverted });
  const colors = getSentimentColors(sentiment);

  const formattedValue = formatPercent(value, {
    decimals,
    showSign: true,
    isPercentage,
  });

  // Icon-only variant
  if (variant === "icon-only") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center",
          colors.text,
          className
        )}
        title={formattedValue}
        {...props}
      >
        {getIcon(iconStyle, sentiment, iconSizes[size])}
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 font-mono tabular-nums",
          sizeClasses[size],
          colors.text,
          className
        )}
        {...props}
      >
        {showIcon && getIcon(iconStyle, sentiment, iconSizes[size])}
        {showValue && <span>{formattedValue}</span>}
      </div>
    );
  }

  // Pill variant
  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          sizeClasses[size],
          pillSizes[size],
          colors.bg,
          colors.text,
          className
        )}
        {...props}
      >
        {showIcon && getIcon(iconStyle, sentiment, iconSizes[size])}
        {showValue && <span className="font-mono tabular-nums">{formattedValue}</span>}
        {label && <span className="font-normal">{label}</span>}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && (
        <span className={colors.text}>
          {getIcon(iconStyle, sentiment, iconSizes[size])}
        </span>
      )}
      <span className={cn("font-mono tabular-nums", colors.text)}>
        {showValue && formattedValue}
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}

TrendIndicator.displayName = "TrendIndicator";

/**
 * Simplified TrendBadge component for common use cases
 */
export interface TrendBadgeProps {
  /** The percentage change value */
  value: number | null | undefined;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

export function TrendBadge({ value, size = "md", className }: TrendBadgeProps) {
  return (
    <TrendIndicator
      value={value}
      variant="pill"
      iconStyle="arrow"
      size={size}
      showValue={true}
      showIcon={true}
      className={className}
    />
  );
}

TrendBadge.displayName = "TrendBadge";
