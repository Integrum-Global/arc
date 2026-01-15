"use client";

/**
 * AllocationSection Component
 *
 * Displays sector allocation as a donut chart with a list of top N holdings.
 */

import { useState } from "react";
import { Section, Grid, GridItem } from "@/components/layout";
import { AllocationChart, CHART_COLORS, getSectorColor } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import { TrendIndicator } from "@/components/data-display";
import { cn } from "@/lib/utils";
import type { SectorAllocation } from "@/types/api";
import type { TopHolding } from "@/hooks/useDashboardData";

export interface AllocationSectionProps {
  /** Sector allocations for chart */
  allocations: SectorAllocation[];
  /** Top holdings list */
  topHoldings: TopHolding[];
  /** Loading state */
  loading?: boolean;
}

const TOP_N_OPTIONS = [5, 10] as const;
type TopNOption = (typeof TOP_N_OPTIONS)[number];

/**
 * Top holdings list skeleton
 */
function TopHoldingsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-5 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single holding row in the top holdings list
 */
function HoldingItem({ holding, rank }: { holding: TopHolding; rank: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Rank badge */}
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
          {rank}
        </div>
        {/* Ticker info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground">
              {holding.ticker}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatPercent(holding.weight, { showSign: false })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
            {holding.name}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-sm font-mono tabular-nums font-medium">
          {formatCurrency(holding.value, { compact: true })}
        </p>
        <TrendIndicator
          value={holding.change}
          variant="compact"
          size="sm"
        />
      </div>
    </div>
  );
}

/**
 * Chart skeleton
 */
function AllocationChartSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px]">
      <Skeleton className="h-40 w-40 rounded-full" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * Top-N selector component
 */
function TopNSelector({
  selected,
  onChange,
}: {
  selected: TopNOption;
  onChange: (value: TopNOption) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
      {TOP_N_OPTIONS.map((option) => (
        <Button
          key={option}
          variant="ghost"
          size="sm"
          onClick={() => onChange(option)}
          className={cn(
            "h-6 px-2 text-xs min-w-0",
            selected === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
          )}
        >
          Top {option}
        </Button>
      ))}
    </div>
  );
}

/**
 * AllocationSection component showing donut chart and top holdings
 */
export function AllocationSection({
  allocations,
  topHoldings,
  loading = false,
}: AllocationSectionProps) {
  const [topN, setTopN] = useState<TopNOption>(5);

  // Convert allocations to chart data format with consistent colors
  const chartData = allocations.map((item, index) => ({
    name: item.sector,
    value: item.value,
    color: getSectorColor(item.sector) || CHART_COLORS.categories[index % CHART_COLORS.categories.length],
  }));

  // Slice holdings based on selected top-N
  const displayedHoldings = topHoldings.slice(0, topN);

  return (
    <Section title="Portfolio Allocation" subtitle="Sector breakdown and top holdings">
      <Grid cols={{ default: 1, lg: 2 }} gap="lg">
        {/* Donut Chart */}
        <GridItem>
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">Sector Allocation</h3>
              <p className="text-xs text-muted-foreground">Distribution by sector</p>
            </div>
            {loading ? (
              <AllocationChartSkeleton />
            ) : (
              <AllocationChart
                data={chartData}
                type="donut"
                height={260}
                showLegend={true}
                legendPosition="bottom"
                valueFormat="currency"
                interactive
              />
            )}
          </Card>
        </GridItem>

        {/* Top Holdings List */}
        <GridItem>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Top Holdings</h3>
                <p className="text-xs text-muted-foreground">Sorted by market value</p>
              </div>
              {!loading && (
                <TopNSelector selected={topN} onChange={setTopN} />
              )}
            </div>
            {loading ? (
              <TopHoldingsListSkeleton />
            ) : (
              <div className="space-y-0">
                {displayedHoldings.map((holding, index) => (
                  <HoldingItem
                    key={holding.id}
                    holding={holding}
                    rank={index + 1}
                  />
                ))}
                {displayedHoldings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No holdings data available
                  </p>
                )}
              </div>
            )}
          </Card>
        </GridItem>
      </Grid>
    </Section>
  );
}

AllocationSection.displayName = "AllocationSection";

export default AllocationSection;
