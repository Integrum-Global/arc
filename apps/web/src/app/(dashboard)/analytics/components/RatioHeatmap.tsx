"use client";

/**
 * RatioHeatmap Component
 *
 * Displays a Securities x Ratios heatmap view for visual comparison
 * of financial ratios across multiple securities.
 */

import * as React from "react";
import { Heatmap } from "@/components/charts/Heatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SecurityComparison {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  currentRatio: number;
  quickRatio: number;
  debtEquity: number;
  roe: number;
  roa: number;
  grossMargin: number;
  netMargin: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
}

export interface RatioHeatmapProps {
  securities: SecurityComparison[];
  className?: string;
}

type RatioGroup = "liquidity" | "profitability" | "leverage" | "valuation" | "all";

/**
 * Ratio definitions with normalization info
 */
const RATIO_DEFINITIONS: Record<
  string,
  {
    key: keyof SecurityComparison;
    label: string;
    group: RatioGroup;
    higherIsBetter: boolean;
    format: "ratio" | "percent";
  }
> = {
  currentRatio: {
    key: "currentRatio",
    label: "Current",
    group: "liquidity",
    higherIsBetter: true,
    format: "ratio",
  },
  quickRatio: {
    key: "quickRatio",
    label: "Quick",
    group: "liquidity",
    higherIsBetter: true,
    format: "ratio",
  },
  debtEquity: {
    key: "debtEquity",
    label: "D/E",
    group: "leverage",
    higherIsBetter: false,
    format: "ratio",
  },
  roe: {
    key: "roe",
    label: "ROE",
    group: "profitability",
    higherIsBetter: true,
    format: "percent",
  },
  roa: {
    key: "roa",
    label: "ROA",
    group: "profitability",
    higherIsBetter: true,
    format: "percent",
  },
  grossMargin: {
    key: "grossMargin",
    label: "Gross Mgn",
    group: "profitability",
    higherIsBetter: true,
    format: "percent",
  },
  netMargin: {
    key: "netMargin",
    label: "Net Mgn",
    group: "profitability",
    higherIsBetter: true,
    format: "percent",
  },
  peRatio: {
    key: "peRatio",
    label: "P/E",
    group: "valuation",
    higherIsBetter: false,
    format: "ratio",
  },
  pbRatio: {
    key: "pbRatio",
    label: "P/B",
    group: "valuation",
    higherIsBetter: false,
    format: "ratio",
  },
  dividendYield: {
    key: "dividendYield",
    label: "Div Yield",
    group: "valuation",
    higherIsBetter: true,
    format: "percent",
  },
};

/**
 * Normalize value to percentile rank (0-100)
 */
function normalizeToPercentile(
  value: number,
  allValues: number[],
  higherIsBetter: boolean
): number {
  const sorted = [...allValues].sort((a, b) => (higherIsBetter ? a - b : b - a));
  const rank = sorted.findIndex((v) => v >= value);
  if (rank === -1) return 100;
  return ((rank + 1) / sorted.length) * 100;
}

/**
 * Group options
 */
const GROUP_OPTIONS = [
  { value: "all", label: "All Ratios" },
  { value: "liquidity", label: "Liquidity" },
  { value: "profitability", label: "Profitability" },
  { value: "leverage", label: "Leverage" },
  { value: "valuation", label: "Valuation" },
];

export function RatioHeatmap({ securities, className }: RatioHeatmapProps) {
  const [selectedGroup, setSelectedGroup] = React.useState<RatioGroup>("all");

  // Filter ratios by group
  const filteredRatios = React.useMemo(() => {
    return Object.values(RATIO_DEFINITIONS).filter(
      (r) => selectedGroup === "all" || r.group === selectedGroup
    );
  }, [selectedGroup]);

  // Prepare heatmap data
  const heatmapData = React.useMemo(() => {
    // For each security (row), calculate normalized percentile for each ratio (column)
    return securities.map((security) => {
      return filteredRatios.map((ratioDef) => {
        const rawValue = security[ratioDef.key] as number;
        const allValues = securities.map((s) => s[ratioDef.key] as number);

        // Normalize to percentile (0-100 where higher is better)
        return normalizeToPercentile(rawValue, allValues, ratioDef.higherIsBetter);
      });
    });
  }, [securities, filteredRatios]);

  // Labels
  const yLabels = securities.map((s) => s.ticker);
  const xLabels = filteredRatios.map((r) => r.label);

  // Custom color scale (red -> yellow -> green for percentiles)
  const colorScale = {
    min: "#ef4444", // Red for low percentile
    mid: "#fbbf24", // Amber for middle
    max: "#22c55e", // Green for high percentile
  };

  const handleCellClick = (row: number, col: number, value: number) => {
    const security = securities[row];
    const ratio = filteredRatios[col];
    if (security && ratio) {
      console.log(
        `${security.ticker} - ${ratio.label}: ${value.toFixed(0)} percentile`
      );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Group Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground">Show:</label>
        <Select
          value={selectedGroup}
          onValueChange={(v) => setSelectedGroup(v as RatioGroup)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <Heatmap
          data={heatmapData}
          xLabels={xLabels}
          yLabels={yLabels}
          colorScale={colorScale}
          valueFormat="number"
          decimals={0}
          showValues
          cellSize={45}
          gap={2}
          showLegend
          minValue={0}
          maxValue={100}
          interactive
          onCellClick={handleCellClick}
        />
      </div>

      {/* Legend explanation */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500" />
          <span>Low (0-25%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-500" />
          <span>Medium (25-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500" />
          <span>High (75-100%)</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Values show percentile ranking within the peer group. Higher percentile means better
        performance relative to peers.
      </p>
    </div>
  );
}

RatioHeatmap.displayName = "RatioHeatmap";
