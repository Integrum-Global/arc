"use client";

/**
 * PerformanceTab Component
 *
 * Displays performance chart with period selector and performance metrics.
 */

import * as React from "react";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { Grid, Section } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart, type PerformancePeriod } from "@/components/charts/PerformanceChart";
import { StatCard } from "@/components/data/StatCard";
import { usePortfolioValuation } from "@/hooks/usePortfolios";
import { formatPercent, formatCurrency, formatDate } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { Portfolio } from "@/types/api";

interface PerformanceTabProps {
  portfolioId: string;
  portfolio: Portfolio;
}

// Period options
const periodOptions: Array<{ value: PerformancePeriod; label: string }> = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "3Y", label: "3Y" },
  { value: "5Y", label: "5Y" },
  { value: "ALL", label: "All" },
];

export function PerformanceTab({ portfolioId, portfolio }: PerformanceTabProps) {
  // Period state
  const [period, setPeriod] = React.useState<PerformancePeriod>("1Y");

  // Fetch valuation data
  const { data: valuationData, isPending } = usePortfolioValuation(portfolioId);

  // Transform valuation history for chart
  const chartData = React.useMemo(() => {
    if (!valuationData?.history) return [];

    // Filter based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "3Y":
        startDate.setFullYear(now.getFullYear() - 3);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case "ALL":
        startDate = new Date(0);
        break;
    }

    return valuationData.history
      .filter((item) => new Date(item.date) >= startDate)
      .map((item) => ({
        date: item.date,
        value: item.cumulative_return,
        // Mock benchmark data - in real app, fetch from API
        benchmark: item.cumulative_return * 0.85 + Math.random() * 0.05,
      }));
  }, [valuationData, period]);

  // Calculate performance metrics
  const metrics = React.useMemo(() => {
    if (!chartData.length) {
      return {
        periodReturn: 0,
        totalReturn: portfolio.ytd_return,
        bestDay: 0,
        worstDay: 0,
        volatility: 0,
      };
    }

    const returns = chartData.map((d) => d.value);
    const lastReturn = returns[returns.length - 1] ?? 0;
    const firstReturn = returns[0] ?? 0;
    const periodReturn = lastReturn - firstReturn;

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < returns.length; i++) {
      const prev = returns[i - 1];
      const curr = returns[i];
      if (prev !== undefined && curr !== undefined) {
        dailyReturns.push((curr - prev) / (1 + prev));
      }
    }

    const bestDay = dailyReturns.length > 0 ? Math.max(...dailyReturns) : 0;
    const worstDay = dailyReturns.length > 0 ? Math.min(...dailyReturns) : 0;

    // Calculate volatility (standard deviation of daily returns)
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
    const variance =
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (dailyReturns.length || 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    return {
      periodReturn,
      totalReturn: portfolio.ytd_return,
      bestDay,
      worstDay,
      volatility,
    };
  }, [chartData, portfolio.ytd_return]);

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <Grid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
        <StatCard
          title={`${period} Return`}
          value={metrics.periodReturn}
          format="percent"
          icon={metrics.periodReturn >= 0 ? TrendingUp : TrendingDown}
          iconVariant={metrics.periodReturn >= 0 ? "success" : "destructive"}
          loading={isPending}
        />
        <StatCard
          title="YTD Return"
          value={metrics.totalReturn}
          format="percent"
          icon={metrics.totalReturn >= 0 ? TrendingUp : TrendingDown}
          iconVariant={metrics.totalReturn >= 0 ? "success" : "destructive"}
          loading={isPending}
        />
        <StatCard
          title="Inception Date"
          value={null}
          format="number"
          icon={Calendar}
          iconVariant="default"
          loading={isPending}
        />
        <StatCard
          title="Benchmark"
          value={null}
          format="number"
          icon={Target}
          iconVariant="default"
          loading={isPending}
        />
      </Grid>

      {/* Performance Chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base">Performance Over Time</CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {periodOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={period === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(option.value)}
                  className="h-7 px-3"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length > 0 ? (
            <PerformanceChart
              data={chartData}
              period={period}
              showBenchmark
              benchmarkLabel={portfolio.benchmark_name || "S&P 500"}
              portfolioLabel={portfolio.name}
              showArea
              height={350}
              valueFormat="percent"
              showZeroLine
              showGrid
              showLegend
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No performance data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Section title="Performance Metrics" bordered padded>
        <Grid cols={{ default: 2, md: 4 }} gap="lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Best Day</p>
            <p
              className={cn(
                "text-lg font-semibold font-mono tabular-nums",
                metrics.bestDay >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {formatPercent(metrics.bestDay, { showSign: true })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Worst Day</p>
            <p
              className={cn(
                "text-lg font-semibold font-mono tabular-nums",
                metrics.worstDay >= 0 ? "text-positive" : "text-negative"
              )}
            >
              {formatPercent(metrics.worstDay, { showSign: true })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Volatility (Ann.)</p>
            <p className="text-lg font-semibold font-mono tabular-nums">
              {formatPercent(metrics.volatility, { showSign: false })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
            <p className="text-lg font-semibold font-mono tabular-nums">
              {metrics.volatility > 0
                ? (metrics.periodReturn / metrics.volatility).toFixed(2)
                : "-"}
            </p>
          </div>
        </Grid>
      </Section>

      {/* Value History */}
      {valuationData && (
        <Section title="Portfolio Value" bordered padded>
          <Grid cols={{ default: 2, md: 4 }} gap="lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuationData.total_value, {
                  currency: portfolio.currency,
                  compact: true,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(valuationData.total_cost, {
                  currency: portfolio.currency,
                  compact: true,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unrealized P&L</p>
              <p
                className={cn(
                  "text-lg font-semibold font-mono tabular-nums",
                  valuationData.unrealized_pnl >= 0 ? "text-positive" : "text-negative"
                )}
              >
                {formatCurrency(valuationData.unrealized_pnl, {
                  currency: portfolio.currency,
                  compact: true,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">As of Date</p>
              <p className="text-lg font-semibold">
                {formatDate(valuationData.as_of_date, "short")}
              </p>
            </div>
          </Grid>
        </Section>
      )}
    </div>
  );
}
