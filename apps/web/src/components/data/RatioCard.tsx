"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatting";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * RatioCard Component
 *
 * A specialized card for displaying financial ratios with class badges,
 * threshold-based coloring, trend indicators, peer percentile bars,
 * and optional sparkline data visualization.
 */

export type RatioClass =
  | "liquidity"
  | "profitability"
  | "leverage"
  | "valuation"
  | "efficiency"
  | "growth";

export type TrendDirection = "up" | "down" | "neutral";

export interface RatioThresholds {
  /** Values above this are considered good (green) */
  good: number;
  /** Values below this are considered bad (red), between bad and good is neutral */
  bad: number;
  /** Whether higher values are better (default: true) */
  higherIsBetter?: boolean;
}

export interface SparklinePoint {
  value: number;
  date?: string;
}

export interface RatioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the ratio (e.g., "Current Ratio", "Debt-to-Equity") */
  ratioName: string;
  /** Category/class of the ratio */
  ratioClass: RatioClass;
  /** The ratio value */
  value: number | null | undefined;
  /** Trend direction */
  trend?: TrendDirection;
  /** Peer percentile (0-100) */
  peerPercentile?: number | null;
  /** Thresholds for value coloring */
  thresholds?: RatioThresholds;
  /** Historical sparkline data */
  sparklineData?: SparklinePoint[];
  /** Click handler */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Suffix for the value (e.g., "x", "%") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
}

const ratioClassConfig: Record<
  RatioClass,
  { label: string; colorClass: string; bgClass: string }
> = {
  liquidity: {
    label: "Liquidity",
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
  },
  profitability: {
    label: "Profitability",
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
  },
  leverage: {
    label: "Leverage",
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
  },
  valuation: {
    label: "Valuation",
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
  },
  efficiency: {
    label: "Efficiency",
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10",
  },
  growth: {
    label: "Growth",
    colorClass: "text-pink-600 dark:text-pink-400",
    bgClass: "bg-pink-500/10",
  },
};

/**
 * Determine value color based on thresholds
 */
function getThresholdColor(
  value: number | null | undefined,
  thresholds?: RatioThresholds
): string {
  if (value === null || value === undefined || !thresholds) {
    return "text-foreground";
  }

  const { good, bad, higherIsBetter = true } = thresholds;

  if (higherIsBetter) {
    if (value >= good) return "text-positive";
    if (value <= bad) return "text-negative";
    return "text-amber-500";
  } else {
    if (value <= good) return "text-positive";
    if (value >= bad) return "text-negative";
    return "text-amber-500";
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
      return <TrendingUp className={cn("text-positive", className)} />;
    case "down":
      return <TrendingDown className={cn("text-negative", className)} />;
    default:
      return <Minus className={cn("text-neutral", className)} />;
  }
}

/**
 * Simple sparkline SVG component
 */
function Sparkline({
  data,
  className,
}: {
  data: SparklinePoint[];
  className?: string;
}) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 80;
  const height = 24;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const isPositive = firstValue !== undefined && lastValue !== undefined && lastValue >= firstValue;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={isPositive ? "hsl(var(--positive))" : "hsl(var(--negative))"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Loading skeleton for RatioCard
 */
export function RatioCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4 gap-0", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function RatioCard({
  ratioName,
  ratioClass,
  value,
  trend,
  peerPercentile,
  thresholds,
  sparklineData,
  onClick,
  loading = false,
  suffix = "",
  decimals = 2,
  className,
  ...props
}: RatioCardProps) {
  if (loading) {
    return <RatioCardSkeleton className={className} />;
  }

  const classConfig = ratioClassConfig[ratioClass];
  const valueColor = getThresholdColor(value, thresholds);
  const formattedValue = formatRatio(value, { decimals, suffix });

  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "p-4 gap-0 transition-all",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary/20",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      {...props}
    >
      <div className="space-y-3">
        {/* Header: Class badge and trend */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {/* Ratio Class Badge */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                classConfig.bgClass,
                classConfig.colorClass
              )}
            >
              {classConfig.label}
            </span>
            {/* Ratio Name */}
            <h3 className="text-sm font-medium text-foreground">{ratioName}</h3>
          </div>

          {/* Trend Icon */}
          {trend && <TrendIcon trend={trend} className="h-5 w-5" />}
        </div>

        {/* Value and Sparkline */}
        <div className="flex items-end justify-between gap-4">
          {/* Main Value */}
          <span
            className={cn(
              "text-2xl font-bold font-mono tabular-nums",
              valueColor
            )}
          >
            {formattedValue}
          </span>

          {/* Sparkline */}
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline data={sparklineData} className="h-6 w-20 shrink-0" />
          )}
        </div>

        {/* Peer Percentile Bar */}
        {peerPercentile !== null && peerPercentile !== undefined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Peer Percentile</span>
              <span className="font-medium tabular-nums">
                {Math.round(peerPercentile)}%
              </span>
            </div>
            <Progress value={peerPercentile} className="h-1.5" />
          </div>
        )}
      </div>
    </Card>
  );
}

RatioCard.displayName = "RatioCard";
RatioCard.Skeleton = RatioCardSkeleton;
