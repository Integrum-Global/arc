"use client";

/**
 * OverviewTab Component
 *
 * Displays portfolio overview with summary stats, allocation chart, and top holdings.
 */

import * as React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { Grid, Section } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/data/StatCard";
import { HoldingRow, HoldingRowHeader } from "@/components/data/HoldingRow";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { usePortfolioHoldings, usePortfolioValuation } from "@/hooks/usePortfolios";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import type { Portfolio } from "@/types/api";

// Color palette for allocation chart
const ALLOCATION_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

interface OverviewTabProps {
  portfolioId: string;
  portfolio: Portfolio;
}

export function OverviewTab({ portfolioId, portfolio }: OverviewTabProps) {
  // Fetch holdings for allocation
  const { data: holdingsData, isPending: holdingsLoading } =
    usePortfolioHoldings(portfolioId);

  // Fetch valuation data
  const { data: valuationData, isPending: valuationLoading } =
    usePortfolioValuation(portfolioId);

  // Calculate allocation from holdings
  const allocationData = React.useMemo(() => {
    if (!holdingsData?.data) return [];

    const holdingsByType = holdingsData.data.reduce(
      (acc, holding) => {
        const type = holding.security?.sector || "Other";
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += holding.market_value;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(holdingsByType)
      .map(([name, value], index) => ({
        name,
        value,
        color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdingsData]);

  // Get top holdings (sorted by weight)
  const topHoldings = React.useMemo(() => {
    if (!holdingsData?.data) return [];

    return [...holdingsData.data]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((h) => ({
        securityId: h.security_id,
        ticker: h.security?.symbol || "N/A",
        name: h.security?.name || "Unknown",
        quantity: h.quantity,
        costBasis: h.average_cost,
        currentPrice: h.current_price,
        marketValue: h.market_value,
        unrealizedPnl: h.unrealized_pnl,
        unrealizedPnlPct: h.unrealized_pnl_percent,
        weight: h.weight,
        dayChangePct: h.security?.price_change_percent,
      }));
  }, [holdingsData]);

  const valuation = valuationData;
  const isLoading = holdingsLoading || valuationLoading;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Grid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
        <StatCard
          title="Total Value"
          value={portfolio.total_value}
          format="currency"
          currency={portfolio.currency}
          icon={DollarSign}
          iconVariant="primary"
          loading={isLoading}
        />
        <StatCard
          title="Unrealized P&L"
          value={portfolio.unrealized_pnl}
          change={portfolio.unrealized_pnl / (portfolio.total_cost || 1)}
          format="currency"
          currency={portfolio.currency}
          icon={portfolio.unrealized_pnl >= 0 ? TrendingUp : TrendingDown}
          iconVariant={portfolio.unrealized_pnl >= 0 ? "success" : "destructive"}
          loading={isLoading}
        />
        <StatCard
          title="YTD Return"
          value={portfolio.ytd_return}
          format="percent"
          icon={BarChart3}
          iconVariant={portfolio.ytd_return >= 0 ? "success" : "destructive"}
          loading={isLoading}
        />
        <StatCard
          title="Holdings"
          value={portfolio.holdings_count}
          format="number"
          decimals={0}
          icon={Briefcase}
          iconVariant="default"
          loading={isLoading}
        />
      </Grid>

      {/* Valuation Details */}
      {valuation && (
        <Section title="Valuation Details" bordered padded>
          <Grid cols={{ default: 2, md: 4 }} gap="md">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cash Balance</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuation.cash_balance, {
                  currency: portfolio.currency,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Invested Value</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuation.invested_value, {
                  currency: portfolio.currency,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Realized P&L YTD</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuation.realized_pnl_ytd, {
                  currency: portfolio.currency,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dividends YTD</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuation.dividend_income_ytd, {
                  currency: portfolio.currency,
                })}
              </p>
            </div>
          </Grid>
        </Section>
      )}

      {/* Allocation and Top Holdings */}
      <Grid cols={{ default: 1, lg: 2 }} gap="md">
        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {holdingsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : allocationData.length > 0 ? (
              <AllocationChart
                data={allocationData}
                type="donut"
                height={300}
                valueFormat="currency"
                currency={portfolio.currency}
                showLegend
                legendPosition="bottom"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No holdings to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Holdings</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {holdingsLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topHoldings.length > 0 ? (
              <div className="divide-y">
                <HoldingRowHeader
                  columns={["ticker", "marketValue", "weight"]}
                  compact
                  className="px-6"
                />
                {topHoldings.map((holding) => (
                  <HoldingRow
                    key={holding.securityId}
                    holding={holding}
                    columns={["ticker", "marketValue", "weight"]}
                    compact
                    currency={portfolio.currency}
                    className="px-6"
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No holdings found
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
    </div>
  );
}
