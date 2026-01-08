"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  getValueColor,
} from "@/lib/formatting";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendIndicator } from "@/components/data-display";

/**
 * HoldingRow Component
 *
 * A row component for displaying portfolio holdings with all relevant
 * financial information including ticker, quantity, prices, P&L, and weight.
 */

export interface Holding {
  /** Security identifier */
  securityId: string;
  /** Ticker symbol */
  ticker: string;
  /** Security name */
  name: string;
  /** Number of shares/units held */
  quantity: number;
  /** Average cost basis per share */
  costBasis: number;
  /** Current market price per share */
  currentPrice: number;
  /** Total market value (quantity * currentPrice) */
  marketValue: number;
  /** Unrealized P&L in currency */
  unrealizedPnl: number;
  /** Unrealized P&L as percentage (decimal) */
  unrealizedPnlPct: number;
  /** Portfolio weight as percentage (decimal) */
  weight: number;
  /** Day change in currency */
  dayChange?: number;
  /** Day change as percentage (decimal) */
  dayChangePct?: number;
  /** Asset type/sector (optional) */
  assetType?: string;
  /** Security logo URL (optional) */
  logoUrl?: string;
}

export interface HoldingRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** The holding data */
  holding: Holding;
  /** Click handler */
  onClick?: (holding: Holding) => void;
  /** Whether the row is selected */
  selected?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Which columns to show */
  columns?: Array<
    | "ticker"
    | "quantity"
    | "costBasis"
    | "currentPrice"
    | "marketValue"
    | "unrealizedPnl"
    | "weight"
    | "dayChange"
  >;
  /** Currency code */
  currency?: string;
}

const defaultColumns: NonNullable<HoldingRowProps["columns"]> = [
  "ticker",
  "quantity",
  "costBasis",
  "currentPrice",
  "marketValue",
  "unrealizedPnl",
  "weight",
  "dayChange",
];

/**
 * Loading skeleton for HoldingRow
 */
export function HoldingRowSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_repeat(7,_minmax(80px,_100px))] gap-4 items-center border-b border-border",
        compact ? "py-2 px-3" : "py-3 px-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-12 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
      <Skeleton className="h-4 w-20 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
      <Skeleton className="h-4 w-12 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
    </div>
  );
}

export function HoldingRow({
  holding,
  onClick,
  selected = false,
  loading = false,
  compact = false,
  columns = defaultColumns,
  currency = "USD",
  className,
  ...props
}: HoldingRowProps) {
  if (loading) {
    return <HoldingRowSkeleton compact={compact} className={className} />;
  }

  const isClickable = !!onClick;
  const activeColumns: NonNullable<HoldingRowProps["columns"]> = columns ?? defaultColumns;
  const showColumn = (col: string) => activeColumns.includes(col as typeof activeColumns[number]);

  // Calculate number of value columns (excluding ticker)
  const valueColumnCount = activeColumns.filter((c) => c !== "ticker").length;

  const handleClick = () => {
    if (onClick) {
      onClick(holding);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "grid items-center border-b border-border transition-colors",
        compact ? "py-2 px-3 text-sm" : "py-3 px-4",
        isClickable && "cursor-pointer hover:bg-muted/50",
        selected && "bg-primary/5 border-primary/20",
        className
      )}
      style={{
        gridTemplateColumns: `1fr repeat(${valueColumnCount}, minmax(80px, 100px))`,
        gap: compact ? "0.75rem" : "1rem",
      }}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : "row"}
      tabIndex={isClickable ? 0 : undefined}
      aria-selected={selected}
      {...props}
    >
      {/* Ticker & Name */}
      {showColumn("ticker") && (
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo/Avatar */}
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold shrink-0",
              compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
            )}
          >
            {holding.logoUrl ? (
              <img
                src={holding.logoUrl}
                alt={holding.ticker}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              holding.ticker.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {holding.ticker}
            </p>
            <p
              className={cn(
                "text-muted-foreground truncate",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {holding.name}
            </p>
          </div>
        </div>
      )}

      {/* Quantity */}
      {showColumn("quantity") && (
        <div className="text-right font-mono tabular-nums">
          {formatNumber(holding.quantity, { decimals: 0 })}
        </div>
      )}

      {/* Cost Basis */}
      {showColumn("costBasis") && (
        <div className="text-right font-mono tabular-nums text-muted-foreground">
          {formatCurrency(holding.costBasis, { currency, decimals: 2 })}
        </div>
      )}

      {/* Current Price */}
      {showColumn("currentPrice") && (
        <div className="text-right font-mono tabular-nums">
          {formatCurrency(holding.currentPrice, { currency, decimals: 2 })}
        </div>
      )}

      {/* Market Value */}
      {showColumn("marketValue") && (
        <div className="text-right font-mono tabular-nums font-medium">
          {formatCurrency(holding.marketValue, { currency, compact: true })}
        </div>
      )}

      {/* Unrealized P&L */}
      {showColumn("unrealizedPnl") && (
        <div className="text-right">
          <div
            className={cn(
              "font-mono tabular-nums font-medium",
              getValueColor(holding.unrealizedPnl)
            )}
          >
            {formatCurrency(holding.unrealizedPnl, {
              currency,
              compact: true,
            })}
          </div>
          <TrendIndicator
            value={holding.unrealizedPnlPct}
            variant="compact"
            iconStyle="arrow"
            size="sm"
            showIcon={false}
            className="justify-end"
          />
        </div>
      )}

      {/* Weight */}
      {showColumn("weight") && (
        <div className="text-right">
          <div className="font-mono tabular-nums">
            {formatPercent(holding.weight, { showSign: false })}
          </div>
          {/* Visual weight bar */}
          <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all"
              style={{ width: `${Math.min(holding.weight * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Day Change */}
      {showColumn("dayChange") && holding.dayChangePct !== undefined && (
        <div className="text-right">
          <TrendIndicator
            value={holding.dayChangePct}
            variant="pill"
            iconStyle="arrow"
            size="sm"
            showValue={true}
            showIcon={true}
          />
        </div>
      )}
    </div>
  );
}

HoldingRow.displayName = "HoldingRow";
HoldingRow.Skeleton = HoldingRowSkeleton;

/**
 * Header row for HoldingRow list
 */
export interface HoldingRowHeaderProps {
  columns?: HoldingRowProps["columns"];
  compact?: boolean;
  className?: string;
}

export function HoldingRowHeader({
  columns = defaultColumns,
  compact = false,
  className,
}: HoldingRowHeaderProps) {
  const showColumn = (col: string) => columns?.includes(col as typeof columns[number]);
  const valueColumnCount = columns.filter((c) => c !== "ticker").length;

  const headers: Record<string, string> = {
    ticker: "Security",
    quantity: "Qty",
    costBasis: "Cost",
    currentPrice: "Price",
    marketValue: "Value",
    unrealizedPnl: "P&L",
    weight: "Weight",
    dayChange: "Day",
  };

  return (
    <div
      className={cn(
        "grid items-center border-b-2 border-border text-muted-foreground font-medium",
        compact ? "py-2 px-3 text-xs" : "py-2.5 px-4 text-sm",
        className
      )}
      style={{
        gridTemplateColumns: `1fr repeat(${valueColumnCount}, minmax(80px, 100px))`,
        gap: compact ? "0.75rem" : "1rem",
      }}
      role="row"
    >
      {columns.map((col) =>
        showColumn(col) ? (
          <div
            key={col}
            className={cn(col !== "ticker" && "text-right")}
            role="columnheader"
          >
            {headers[col]}
          </div>
        ) : null
      )}
    </div>
  );
}

HoldingRowHeader.displayName = "HoldingRowHeader";
