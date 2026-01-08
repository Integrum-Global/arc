"use client";

/**
 * AllocationSection Component
 *
 * Displays sector allocation as a donut chart with a list of top 5 holdings.
 */

import { Section, Grid, GridItem } from "@/components/layout";
import { AllocationChart, CHART_COLORS } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import { TrendIndicator } from "@/components/data-display";
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
function HoldingItem({ holding }: { holding: TopHolding }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Ticker avatar */}
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
          {holding.ticker.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {holding.ticker}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {holding.name}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-sm font-mono tabular-nums">
          {formatCurrency(holding.value, { compact: true })}
        </p>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            {formatPercent(holding.weight, { showSign: false })}
          </span>
          <TrendIndicator
            value={holding.change}
            variant="compact"
            size="sm"
            showIcon={false}
          />
        </div>
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
 * AllocationSection component showing donut chart and top holdings
 */
export function AllocationSection({
  allocations,
  topHoldings,
  loading = false,
}: AllocationSectionProps) {
  // Convert allocations to chart data format
  const chartData = allocations.map((item, index) => ({
    name: item.sector,
    value: item.value,
    color: CHART_COLORS.sectors[index % CHART_COLORS.sectors.length],
  }));

  return (
    <Section title="Portfolio Allocation" subtitle="Sector breakdown and top holdings">
      <Grid cols={{ default: 1, lg: 2 }} gap="lg">
        {/* Donut Chart */}
        <GridItem>
          <Card className="p-4">
            {loading ? (
              <AllocationChartSkeleton />
            ) : (
              <AllocationChart
                data={chartData}
                type="donut"
                height={280}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Top 5 Holdings</h3>
              <span className="text-xs text-muted-foreground">
                by market value
              </span>
            </div>
            {loading ? (
              <TopHoldingsListSkeleton />
            ) : (
              <div className="space-y-0">
                {topHoldings.map((holding) => (
                  <HoldingItem key={holding.id} holding={holding} />
                ))}
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
