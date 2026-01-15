"use client";

/**
 * SummaryCards Component
 *
 * Displays 4 key statistics cards in the dashboard:
 * - Total Portfolio Value with trend
 * - Day Change ($ and %)
 * - YTD Return vs benchmark
 * - Health Score gauge (0-100)
 */

import { Grid } from "@/components/layout";
import { StatCard, StatCardSkeleton } from "@/components/data";
import { GaugeChart } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  Target,
} from "lucide-react";
import type { DashboardSummary } from "@/hooks/useDashboardData";

export interface SummaryCardsProps {
  /** Summary data */
  summary: DashboardSummary | null;
  /** Loading state */
  loading?: boolean;
}

/**
 * Health score card with gauge
 */
function HealthScoreCard({
  score,
  status,
  loading = false,
}: {
  score: number;
  status: "healthy" | "warning" | "critical";
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="p-5 gap-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </Card>
    );
  }

  const statusColors = {
    healthy: "text-positive",
    warning: "text-amber-500",
    critical: "text-destructive",
  };

  const statusLabels = {
    healthy: "Healthy",
    warning: "Needs Attention",
    critical: "Critical",
  };

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            Health Score
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono tabular-nums tracking-tight">
              {score}
            </p>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <p className={`text-sm font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </p>
        </div>
        <div className="flex items-center justify-center shrink-0">
          <GaugeChart
            value={score}
            min={0}
            max={100}
            size={56}
            strokeWidth={6}
            showValue={false}
            showMinMax={false}
            simpleThresholds={{
              warning: 70,
              critical: 50,
              isLowerBetter: false,
            }}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * YTD Return card with benchmark comparison
 */
function YtdReturnCard({
  ytdReturn,
  benchmarkReturn,
  loading = false,
}: {
  ytdReturn: number;
  benchmarkReturn: number;
  loading?: boolean;
}) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  const outperformance = ytdReturn - benchmarkReturn;

  return (
    <StatCard
      title="YTD Return"
      value={ytdReturn}
      format="percent"
      change={outperformance}
      changeLabel="vs S&P 500"
      icon={Target}
      iconVariant={outperformance >= 0 ? "success" : "destructive"}
    />
  );
}

/**
 * SummaryCards component showing 4 key metrics
 */
export function SummaryCards({ summary, loading = false }: SummaryCardsProps) {
  if (loading || !summary) {
    return (
      <Grid
        cols={{ default: 1, sm: 2, lg: 4 }}
        gap="md"
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </Grid>
    );
  }

  return (
    <Grid
      cols={{ default: 1, sm: 2, lg: 4 }}
      gap="md"
    >
      {/* Total Portfolio Value */}
      <StatCard
        title="Total Portfolio Value"
        value={summary.totalValue}
        format="currency"
        compact
        change={summary.dayChangePct}
        changeLabel="today"
        icon={Wallet}
        iconVariant="primary"
      />

      {/* Day Change */}
      <StatCard
        title="Day Change"
        value={summary.dayChange}
        format="currency"
        change={summary.dayChangePct}
        changeLabel="today"
        icon={TrendingUp}
        iconVariant={summary.dayChange >= 0 ? "success" : "destructive"}
      />

      {/* YTD Return */}
      <YtdReturnCard
        ytdReturn={summary.ytdReturn}
        benchmarkReturn={summary.benchmarkYtdReturn}
        loading={loading}
      />

      {/* Health Score */}
      <HealthScoreCard
        score={summary.healthScore}
        status={summary.healthStatus}
        loading={loading}
      />
    </Grid>
  );
}

SummaryCards.displayName = "SummaryCards";

export default SummaryCards;
