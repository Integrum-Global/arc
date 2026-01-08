"use client";

/**
 * HoldingsTab Component
 *
 * Displays full holdings table with sorting capabilities.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/DataTable";
import { TrendIndicator } from "@/components/data-display";
import { usePortfolioHoldings } from "@/hooks/usePortfolios";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Holding } from "@/types/api";

interface HoldingsTabProps {
  portfolioId: string;
  currency?: string;
}

// Transform API holding to table row
interface HoldingRow {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  weight: number;
  dayChange: number | undefined;
  sector: string | undefined;
}

function transformHolding(holding: Holding): HoldingRow {
  return {
    id: holding.id,
    symbol: holding.security?.symbol || "N/A",
    name: holding.security?.name || "Unknown",
    quantity: holding.quantity,
    averageCost: holding.average_cost,
    currentPrice: holding.current_price,
    marketValue: holding.market_value,
    unrealizedPnl: holding.unrealized_pnl,
    unrealizedPnlPercent: holding.unrealized_pnl_percent,
    weight: holding.weight,
    dayChange: holding.security?.price_change_percent,
    sector: holding.security?.sector,
  };
}

export function HoldingsTab({ portfolioId, currency = "USD" }: HoldingsTabProps) {
  // Fetch holdings
  const { data: holdingsData, isPending } = usePortfolioHoldings(portfolioId);

  // Search state
  const [search, setSearch] = React.useState("");

  // Transform and filter holdings
  const holdings = React.useMemo(() => {
    if (!holdingsData?.data) return [];

    const transformed = holdingsData.data.map(transformHolding);

    if (!search) return transformed;

    const searchLower = search.toLowerCase();
    return transformed.filter(
      (h) =>
        h.symbol.toLowerCase().includes(searchLower) ||
        h.name.toLowerCase().includes(searchLower) ||
        h.sector?.toLowerCase().includes(searchLower)
    );
  }, [holdingsData, search]);

  // Column definitions
  const columns: ColumnDef<HoldingRow>[] = React.useMemo(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold">{row.original.symbol}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {row.original.name}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums">
            {formatNumber(getValue() as number, { decimals: 0 })}
          </span>
        ),
      },
      {
        accessorKey: "averageCost",
        header: "Avg Cost",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums text-muted-foreground">
            {formatCurrency(getValue() as number, { currency, decimals: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "currentPrice",
        header: "Price",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(getValue() as number, { currency, decimals: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "marketValue",
        header: "Market Value",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums font-medium">
            {formatCurrency(getValue() as number, { currency, compact: true })}
          </span>
        ),
      },
      {
        accessorKey: "unrealizedPnl",
        header: "Unrealized P&L",
        cell: ({ row }) => (
          <div className="text-right">
            <p
              className={cn(
                "font-mono tabular-nums font-medium",
                row.original.unrealizedPnl >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {formatCurrency(row.original.unrealizedPnl, { currency, compact: true })}
            </p>
            <TrendIndicator
              value={row.original.unrealizedPnlPercent}
              variant="compact"
              size="sm"
              showIcon={false}
              className="justify-end"
            />
          </div>
        ),
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ getValue }) => (
          <div>
            <span className="font-mono tabular-nums">
              {formatPercent(getValue() as number, { showSign: false })}
            </span>
            <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full"
                style={{ width: `${Math.min((getValue() as number) * 100, 100)}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        accessorKey: "dayChange",
        header: "Day Change",
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined;
          if (value === undefined) return "-";
          return (
            <TrendIndicator
              value={value}
              variant="pill"
              iconStyle="arrow"
              size="sm"
              showValue
              showIcon
            />
          );
        },
      },
    ],
    [currency]
  );

  // Calculate totals
  const totals = React.useMemo(() => {
    const data = holdings;
    return {
      marketValue: data.reduce((sum, h) => sum + h.marketValue, 0),
      unrealizedPnl: data.reduce((sum, h) => sum + h.unrealizedPnl, 0),
      count: data.length,
    };
  }, [holdings]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Holdings</p>
          <p className="text-2xl font-bold font-mono tabular-nums">{totals.count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Market Value</p>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {formatCurrency(totals.marketValue, { currency, compact: true })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Unrealized P&L</p>
          <p
            className={cn(
              "text-2xl font-bold font-mono tabular-nums",
              totals.unrealizedPnl >= 0 ? "text-positive" : "text-negative"
            )}
          >
            {formatCurrency(totals.unrealizedPnl, { currency, compact: true })}
          </p>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base">All Holdings</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holdings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={holdings}
            columns={columns}
            loading={isPending}
            pagination
            pageSize={10}
            sortable
            emptyMessage="No holdings found"
            skeletonRows={5}
          />
        </CardContent>
      </Card>
    </div>
  );
}
