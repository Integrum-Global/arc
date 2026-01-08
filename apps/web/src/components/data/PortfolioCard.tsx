"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendIndicator } from "@/components/data-display";
import { Briefcase, ChevronRight } from "lucide-react";

/**
 * PortfolioCard Component
 *
 * A card component for displaying portfolio summary information
 * including name, type, total value, day change, and allocation mini-chart.
 */

export type PortfolioType =
  | "individual"
  | "joint"
  | "ira"
  | "401k"
  | "trust"
  | "corporate"
  | "other";

export interface AllocationItem {
  /** Asset class/type name */
  name: string;
  /** Percentage allocation (decimal, e.g., 0.4 = 40%) */
  percentage: number;
  /** Color for the allocation segment */
  color: string;
}

export interface Portfolio {
  /** Portfolio identifier */
  id: string;
  /** Portfolio name */
  name: string;
  /** Portfolio type */
  type: PortfolioType;
  /** Total market value */
  totalValue: number;
  /** Day change in currency */
  dayChange: number;
  /** Day change as percentage (decimal) */
  dayChangePct: number;
  /** Asset allocation breakdown */
  allocation?: AllocationItem[];
  /** Account number (masked) */
  accountNumber?: string;
  /** Last updated timestamp */
  lastUpdated?: Date | string;
}

export interface PortfolioCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Portfolio data */
  portfolio: Portfolio;
  /** Click handler */
  onClick?: (portfolio: Portfolio) => void;
  /** Selected state */
  selected?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Show allocation chart */
  showAllocation?: boolean;
  /** Currency code */
  currency?: string;
}

const portfolioTypeConfig: Record<
  PortfolioType,
  { label: string; className: string }
> = {
  individual: {
    label: "Individual",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  joint: {
    label: "Joint",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  ira: {
    label: "IRA",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  "401k": {
    label: "401(k)",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  trust: {
    label: "Trust",
    className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  corporate: {
    label: "Corporate",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  other: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
};

/**
 * Mini allocation bar chart
 */
function AllocationMiniChart({
  allocation,
  className,
}: {
  allocation: AllocationItem[];
  className?: string;
}) {
  if (!allocation || allocation.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Bar */}
      <div className="h-2 w-full rounded-full overflow-hidden flex">
        {allocation.map((item) => (
          <div
            key={item.name}
            className="h-full transition-all"
            style={{
              width: `${item.percentage * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.name}: ${formatPercent(item.percentage, { showSign: false })}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {allocation.slice(0, 4).map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate max-w-[80px]">
              {item.name}
            </span>
            <span className="font-mono tabular-nums">
              {formatPercent(item.percentage, { showSign: false })}
            </span>
          </div>
        ))}
        {allocation.length > 4 && (
          <span className="text-xs text-muted-foreground">
            +{allocation.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for PortfolioCard
 */
export function PortfolioCardSkeleton({
  compact = false,
  showAllocation = true,
  className,
}: {
  compact?: boolean;
  showAllocation?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0", compact ? "p-4" : "p-5", className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          {showAllocation && (
            <div className="space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PortfolioCard({
  portfolio,
  onClick,
  selected = false,
  loading = false,
  compact = false,
  showAllocation = true,
  currency = "USD",
  className,
  ...props
}: PortfolioCardProps) {
  if (loading) {
    return (
      <PortfolioCardSkeleton
        compact={compact}
        showAllocation={showAllocation}
        className={className}
      />
    );
  }

  const isClickable = !!onClick;
  const typeConfig = portfolioTypeConfig[portfolio.type];

  const handleClick = () => {
    if (onClick) {
      onClick(portfolio);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        "gap-0 transition-all",
        compact ? "p-4" : "p-5",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary/20",
        selected && "border-primary bg-primary/5",
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-selected={selected}
      {...props}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-lg shrink-0",
            compact ? "h-9 w-9" : "h-11 w-11",
            "bg-primary/10 text-primary"
          )}
        >
          <Briefcase className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold text-foreground truncate",
                  compact ? "text-sm" : "text-base"
                )}
              >
                {portfolio.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    typeConfig.className
                  )}
                >
                  {typeConfig.label}
                </span>
                {portfolio.accountNumber && (
                  <span className="text-xs text-muted-foreground">
                    {portfolio.accountNumber}
                  </span>
                )}
              </div>
            </div>
            {isClickable && (
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </div>

          {/* Value and Change */}
          <div className="space-y-1">
            <p
              className={cn(
                "font-bold font-mono tabular-nums",
                compact ? "text-lg" : "text-xl"
              )}
            >
              {formatCurrency(portfolio.totalValue, { currency, compact: true })}
            </p>
            <TrendIndicator
              value={portfolio.dayChangePct}
              variant="pill"
              iconStyle="arrow"
              size="sm"
              showValue={true}
              showIcon={true}
              label="today"
            />
          </div>

          {/* Allocation Chart */}
          {showAllocation &&
            portfolio.allocation &&
            portfolio.allocation.length > 0 && (
              <AllocationMiniChart allocation={portfolio.allocation} />
            )}
        </div>
      </div>
    </Card>
  );
}

PortfolioCard.displayName = "PortfolioCard";
PortfolioCard.Skeleton = PortfolioCardSkeleton;

/**
 * PortfolioCardList - Container for multiple PortfolioCards
 */
export interface PortfolioCardListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Grid layout */
  layout?: "list" | "grid";
}

export function PortfolioCardList({
  children,
  layout = "list",
  className,
  ...props
}: PortfolioCardListProps) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PortfolioCardList.displayName = "PortfolioCardList";
