"use client";

/**
 * PerformanceSection Component
 *
 * Displays a line chart showing portfolio performance over time
 * with a period selector (1M, 3M, YTD, 1Y).
 */

import { useState, useMemo } from "react";
import { Section } from "@/components/layout";
import { PerformanceChart, type PerformancePeriod } from "@/components/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PerformanceDataPoint } from "@/hooks/useDashboardData";

export interface PerformanceSectionProps {
  /** Performance history data */
  data: PerformanceDataPoint[];
  /** Loading state */
  loading?: boolean;
}

type PeriodOption = {
  value: PerformancePeriod;
  label: string;
  days: number;
};

const periodOptions: PeriodOption[] = [
  { value: "1M", label: "1M", days: 30 },
  { value: "3M", label: "3M", days: 90 },
  { value: "YTD", label: "YTD", days: 0 }, // Special case: from Jan 1
  { value: "1Y", label: "1Y", days: 365 },
];

/**
 * Get YTD days count
 */
function getYtdDays(): number {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const diffTime = Math.abs(now.getTime() - yearStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Filter data based on selected period
 */
function filterDataByPeriod(
  data: PerformanceDataPoint[],
  period: PerformancePeriod
): PerformanceDataPoint[] {
  if (data.length === 0) return [];

  const days = period === "YTD"
    ? getYtdDays()
    : periodOptions.find(p => p.value === period)?.days ?? 365;

  // Filter to only include data within the period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return data.filter((point) => {
    const pointDate = new Date(point.date);
    return pointDate >= cutoffDate;
  });
}

/**
 * Performance chart skeleton
 */
function PerformanceChartSkeleton() {
  return (
    <div className="space-y-4">
      {/* Period selector skeleton */}
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-12" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="relative h-[300px]">
        <Skeleton className="absolute inset-0" />
      </div>
    </div>
  );
}

/**
 * Period selector component
 */
function PeriodSelector({
  selected,
  onChange,
}: {
  selected: PerformancePeriod;
  onChange: (period: PerformancePeriod) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
      {periodOptions.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 px-3 text-xs",
            selected === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * PerformanceSection component showing performance chart with period selector
 */
export function PerformanceSection({
  data,
  loading = false,
}: PerformanceSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>("YTD");

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    return filterDataByPeriod(data, selectedPeriod);
  }, [data, selectedPeriod]);

  // Convert to chart format
  const chartData = useMemo(() => {
    return filteredData.map((point) => ({
      date: point.date,
      value: point.value,
      benchmark: point.benchmark,
    }));
  }, [filteredData]);

  return (
    <Section
      title="Performance"
      subtitle="Portfolio returns vs benchmark"
      actions={
        !loading && (
          <PeriodSelector
            selected={selectedPeriod}
            onChange={setSelectedPeriod}
          />
        )
      }
    >
      <Card className="p-4">
        {loading ? (
          <PerformanceChartSkeleton />
        ) : (
          <PerformanceChart
            data={chartData}
            period={selectedPeriod}
            showBenchmark={true}
            benchmarkLabel="S&P 500"
            portfolioLabel="Portfolio"
            showArea={true}
            height={300}
            valueFormat="percent"
            showZeroLine={true}
            showGrid={true}
            showLegend={true}
            interactive={true}
          />
        )}
      </Card>
    </Section>
  );
}

PerformanceSection.displayName = "PerformanceSection";

export default PerformanceSection;
