"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";

/**
 * Badge Components for Financial Data Display
 *
 * Specialized badge components for displaying severity levels,
 * trend directions, and ratio classifications.
 */

// =============================================================================
// SEVERITY BADGE
// =============================================================================

export type SeverityLevel = "info" | "warning" | "critical";

export interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Severity level */
  severity: SeverityLevel;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show label text */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
}

const severityConfig: Record<
  SeverityLevel,
  {
    icon: LucideIcon;
    label: string;
    className: string;
  }
> = {
  info: {
    icon: Info,
    label: "Info",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  critical: {
    icon: AlertCircle,
    label: "Critical",
    className:
      "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

const severitySizes = {
  sm: { badge: "px-1.5 py-0.5 text-xs", icon: "h-3 w-3" },
  md: { badge: "px-2 py-0.5 text-xs", icon: "h-3.5 w-3.5" },
  lg: { badge: "px-2.5 py-1 text-sm", icon: "h-4 w-4" },
};

export function SeverityBadge({
  severity,
  showIcon = true,
  size = "md",
  showLabel = true,
  label,
  className,
  ...props
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizeConfig = severitySizes[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        sizeConfig.badge,
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {showLabel && <span>{label ?? config.label}</span>}
    </span>
  );
}

SeverityBadge.displayName = "SeverityBadge";

// =============================================================================
// TREND BADGE
// =============================================================================

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Trend direction */
  trend: TrendDirection;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Value to display (optional) */
  value?: string;
  /** Invert colors (down = good) */
  inverted?: boolean;
}

const trendConfig: Record<
  TrendDirection,
  {
    icon: LucideIcon;
    label: string;
  }
> = {
  up: {
    icon: TrendingUp,
    label: "Up",
  },
  down: {
    icon: TrendingDown,
    label: "Down",
  },
  neutral: {
    icon: Minus,
    label: "Neutral",
  },
};

function getTrendColors(trend: TrendDirection, inverted: boolean) {
  if (trend === "neutral") {
    return "bg-neutral/10 text-neutral border-neutral/20";
  }

  const isPositive = inverted ? trend === "down" : trend === "up";

  if (isPositive) {
    return "bg-positive/10 text-positive border-positive/20";
  }

  return "bg-negative/10 text-negative border-negative/20";
}

const trendSizes = {
  sm: { badge: "px-1.5 py-0.5 text-xs", icon: "h-3 w-3" },
  md: { badge: "px-2 py-0.5 text-xs", icon: "h-3.5 w-3.5" },
  lg: { badge: "px-2.5 py-1 text-sm", icon: "h-4 w-4" },
};

export function TrendBadge({
  trend,
  showIcon = true,
  size = "md",
  value,
  inverted = false,
  className,
  ...props
}: TrendBadgeProps) {
  const config = trendConfig[trend];
  const sizeConfig = trendSizes[size];
  const colors = getTrendColors(trend, inverted);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium font-mono tabular-nums",
        sizeConfig.badge,
        colors,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {value && <span>{value}</span>}
    </span>
  );
}

TrendBadge.displayName = "TrendBadge";

// =============================================================================
// RATIO CLASS BADGE
// =============================================================================

export type RatioClass =
  | "liquidity"
  | "profitability"
  | "leverage"
  | "valuation"
  | "efficiency"
  | "growth";

export interface RatioClassBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Ratio class/category */
  ratioClass: RatioClass;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show full label or abbreviated */
  abbreviated?: boolean;
}

const ratioClassConfig: Record<
  RatioClass,
  {
    label: string;
    abbr: string;
    className: string;
  }
> = {
  liquidity: {
    label: "Liquidity",
    abbr: "LIQ",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  profitability: {
    label: "Profitability",
    abbr: "PROF",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  leverage: {
    label: "Leverage",
    abbr: "LEV",
    className:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  valuation: {
    label: "Valuation",
    abbr: "VAL",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  efficiency: {
    label: "Efficiency",
    abbr: "EFF",
    className:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  growth: {
    label: "Growth",
    abbr: "GRW",
    className:
      "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
};

const ratioClassSizes = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

export function RatioClassBadge({
  ratioClass,
  size = "md",
  abbreviated = false,
  className,
  ...props
}: RatioClassBadgeProps) {
  const config = ratioClassConfig[ratioClass];
  const sizeClass = ratioClassSizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sizeClass,
        config.className,
        className
      )}
      {...props}
    >
      {abbreviated ? config.abbr : config.label}
    </span>
  );
}

RatioClassBadge.displayName = "RatioClassBadge";

// =============================================================================
// STATUS BADGE
// =============================================================================

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "error"
  | "draft";

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status type */
  status: StatusType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom label */
  label?: string;
  /** Show dot indicator */
  showDot?: boolean;
}

const statusConfig: Record<
  StatusType,
  {
    label: string;
    className: string;
    dotClass: string;
  }
> = {
  active: {
    label: "Active",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    dotClass: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    dotClass: "bg-gray-500",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  error: {
    label: "Error",
    className:
      "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dotClass: "bg-red-500",
  },
  draft: {
    label: "Draft",
    className:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dotClass: "bg-slate-500",
  },
};

const statusSizes = {
  sm: { badge: "px-1.5 py-0.5 text-xs", dot: "h-1.5 w-1.5" },
  md: { badge: "px-2 py-0.5 text-xs", dot: "h-2 w-2" },
  lg: { badge: "px-2.5 py-1 text-sm", dot: "h-2.5 w-2.5" },
};

export function StatusBadge({
  status,
  size = "md",
  label,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeConfig = statusSizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        sizeConfig.badge,
        config.className,
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("rounded-full", sizeConfig.dot, config.dotClass)} />
      )}
      <span>{label ?? config.label}</span>
    </span>
  );
}

StatusBadge.displayName = "StatusBadge";

// =============================================================================
// ASSET TYPE BADGE
// =============================================================================

export type AssetType =
  | "equity"
  | "fixed_income"
  | "real_estate"
  | "commodities"
  | "cash"
  | "alternatives"
  | "crypto";

export interface AssetTypeBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Asset type */
  assetType: AssetType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const assetTypeConfig: Record<
  AssetType,
  {
    label: string;
    className: string;
  }
> = {
  equity: {
    label: "Equity",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  fixed_income: {
    label: "Fixed Income",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  real_estate: {
    label: "Real Estate",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  commodities: {
    label: "Commodities",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  cash: {
    label: "Cash",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
  alternatives: {
    label: "Alternatives",
    className:
      "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  crypto: {
    label: "Crypto",
    className:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
};

const assetTypeSizes = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

export function AssetTypeBadge({
  assetType,
  size = "md",
  className,
  ...props
}: AssetTypeBadgeProps) {
  const config = assetTypeConfig[assetType];
  const sizeClass = assetTypeSizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sizeClass,
        config.className,
        className
      )}
      {...props}
    >
      {config.label}
    </span>
  );
}

AssetTypeBadge.displayName = "AssetTypeBadge";
