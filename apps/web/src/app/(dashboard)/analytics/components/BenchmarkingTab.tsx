"use client";

/**
 * BenchmarkingTab Component
 *
 * Peer comparison view with table and charts for benchmarking
 * financial ratios across securities.
 */

import * as React from "react";
import { Section, Grid } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, createPercentColumn } from "@/components/data/DataTable";
import { BarChart, type BarDataPoint } from "@/components/charts/BarChart";
import { RatioHeatmap } from "./RatioHeatmap";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Security comparison data
 */
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

/**
 * Mock peer comparison data
 */
const MOCK_PEERS: SecurityComparison[] = [
  {
    id: "1",
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    currentRatio: 0.94,
    quickRatio: 0.85,
    debtEquity: 1.87,
    roe: 0.147,
    roa: 0.287,
    grossMargin: 0.439,
    netMargin: 0.257,
    peRatio: 29.2,
    pbRatio: 47.5,
    dividendYield: 0.005,
  },
  {
    id: "2",
    ticker: "MSFT",
    name: "Microsoft Corp.",
    sector: "Technology",
    currentRatio: 1.77,
    quickRatio: 1.56,
    debtEquity: 0.42,
    roe: 0.388,
    roa: 0.195,
    grossMargin: 0.699,
    netMargin: 0.363,
    peRatio: 35.8,
    pbRatio: 12.3,
    dividendYield: 0.007,
  },
  {
    id: "3",
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology",
    currentRatio: 2.17,
    quickRatio: 2.05,
    debtEquity: 0.11,
    roe: 0.279,
    roa: 0.189,
    grossMargin: 0.565,
    netMargin: 0.244,
    peRatio: 24.1,
    pbRatio: 6.2,
    dividendYield: 0.0,
  },
  {
    id: "4",
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    currentRatio: 1.05,
    quickRatio: 0.79,
    debtEquity: 0.77,
    roe: 0.209,
    roa: 0.067,
    grossMargin: 0.474,
    netMargin: 0.066,
    peRatio: 63.5,
    pbRatio: 8.4,
    dividendYield: 0.0,
  },
  {
    id: "5",
    ticker: "META",
    name: "Meta Platforms",
    sector: "Technology",
    currentRatio: 2.68,
    quickRatio: 2.56,
    debtEquity: 0.36,
    roe: 0.246,
    roa: 0.167,
    grossMargin: 0.808,
    netMargin: 0.29,
    peRatio: 25.3,
    pbRatio: 6.8,
    dividendYield: 0.004,
  },
  {
    id: "6",
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    sector: "Technology",
    currentRatio: 4.17,
    quickRatio: 3.69,
    debtEquity: 0.41,
    roe: 0.914,
    roa: 0.551,
    grossMargin: 0.761,
    netMargin: 0.553,
    peRatio: 68.2,
    pbRatio: 52.4,
    dividendYield: 0.0003,
  },
];

/**
 * Ratio categories for selection
 */
const RATIO_CATEGORIES = [
  { value: "liquidity", label: "Liquidity" },
  { value: "profitability", label: "Profitability" },
  { value: "leverage", label: "Leverage" },
  { value: "valuation", label: "Valuation" },
];

/**
 * Calculate percentile ranking
 */
function calculatePercentile(value: number, values: number[], higherIsBetter = true): number {
  const sorted = [...values].sort((a, b) => (higherIsBetter ? a - b : b - a));
  const rank = sorted.findIndex((v) => v >= value);
  return ((rank + 1) / sorted.length) * 100;
}

/**
 * Get color based on percentile
 */
function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return "text-positive";
  if (percentile >= 50) return "text-amber-500";
  if (percentile >= 25) return "text-orange-500";
  return "text-negative";
}

/**
 * Table columns
 */
const columns: ColumnDef<SecurityComparison>[] = [
  {
    accessorKey: "ticker",
    header: "Ticker",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.ticker}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
          {row.original.name}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "currentRatio",
    header: "Current",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.currentRatio.toFixed(2)}x</span>
    ),
  },
  {
    accessorKey: "debtEquity",
    header: "D/E",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.debtEquity.toFixed(2)}x</span>
    ),
  },
  {
    accessorKey: "roe",
    header: "ROE",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-mono tabular-nums",
          row.original.roe > 0.2 ? "text-positive" : row.original.roe < 0.1 ? "text-negative" : ""
        )}
      >
        {(row.original.roe * 100).toFixed(1)}%
      </span>
    ),
  },
  {
    accessorKey: "grossMargin",
    header: "Gross Margin",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{(row.original.grossMargin * 100).toFixed(1)}%</span>
    ),
  },
  {
    accessorKey: "netMargin",
    header: "Net Margin",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-mono tabular-nums",
          row.original.netMargin > 0.2
            ? "text-positive"
            : row.original.netMargin < 0.1
            ? "text-amber-500"
            : ""
        )}
      >
        {(row.original.netMargin * 100).toFixed(1)}%
      </span>
    ),
  },
  {
    accessorKey: "peRatio",
    header: "P/E",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-mono tabular-nums",
          row.original.peRatio > 50 ? "text-amber-500" : row.original.peRatio < 20 ? "text-positive" : ""
        )}
      >
        {row.original.peRatio.toFixed(1)}x
      </span>
    ),
  },
  {
    accessorKey: "dividendYield",
    header: "Div Yield",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.dividendYield > 0
          ? `${(row.original.dividendYield * 100).toFixed(2)}%`
          : "-"}
      </span>
    ),
  },
];

/**
 * Loading skeleton
 */
function BenchmarkingTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export function BenchmarkingTab() {
  const [loading, setLoading] = React.useState(true);
  const [peers, setPeers] = React.useState<SecurityComparison[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState("profitability");
  const [viewMode, setViewMode] = React.useState("table");

  // Load mock data
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setPeers(MOCK_PEERS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Prepare bar chart data based on selected category and metric
  const [selectedMetric, setSelectedMetric] = React.useState("roe");

  const getBarChartData = (): BarDataPoint[] => {
    switch (selectedCategory) {
      case "liquidity":
        return peers.map((p) => ({
          name: p.ticker,
          value: selectedMetric === "currentRatio" ? p.currentRatio : p.quickRatio,
        }));
      case "profitability":
        return peers.map((p) => {
          let value = p.roe * 100;
          if (selectedMetric === "roa") value = p.roa * 100;
          if (selectedMetric === "grossMargin") value = p.grossMargin * 100;
          if (selectedMetric === "netMargin") value = p.netMargin * 100;
          return { name: p.ticker, value };
        });
      case "leverage":
        return peers.map((p) => ({
          name: p.ticker,
          value: p.debtEquity,
        }));
      case "valuation":
        return peers.map((p) => ({
          name: p.ticker,
          value: selectedMetric === "peRatio" ? p.peRatio : p.pbRatio,
        }));
      default:
        return [];
    }
  };

  const getMetricOptions = () => {
    switch (selectedCategory) {
      case "liquidity":
        return [
          { value: "currentRatio", label: "Current Ratio" },
          { value: "quickRatio", label: "Quick Ratio" },
        ];
      case "profitability":
        return [
          { value: "roe", label: "ROE" },
          { value: "roa", label: "ROA" },
          { value: "grossMargin", label: "Gross Margin" },
          { value: "netMargin", label: "Net Margin" },
        ];
      case "leverage":
        return [{ value: "debtEquity", label: "Debt/Equity" }];
      case "valuation":
        return [
          { value: "peRatio", label: "P/E Ratio" },
          { value: "pbRatio", label: "P/B Ratio" },
        ];
      default:
        return [];
    }
  };

  // Update selected metric when category changes
  React.useEffect(() => {
    const options = getMetricOptions();
    if (options.length > 0 && options[0]) {
      setSelectedMetric(options[0].value);
    }
  }, [selectedCategory]);

  if (loading) {
    return <BenchmarkingTabSkeleton />;
  }

  // Calculate averages for summary
  const avgRoe = peers.reduce((sum, p) => sum + p.roe, 0) / peers.length;
  const avgPE = peers.reduce((sum, p) => sum + p.peRatio, 0) / peers.length;
  const avgGrossMargin = peers.reduce((sum, p) => sum + p.grossMargin, 0) / peers.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Grid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. ROE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-positive">
              {(avgRoe * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. P/E Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgPE.toFixed(1)}x</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Gross Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(avgGrossMargin * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Peers Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{peers.length}</p>
          </CardContent>
        </Card>
      </Grid>

      {/* View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {RATIO_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Views */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={peers}
              columns={columns}
              pagination={false}
              sortable
              compact
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "chart" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {RATIO_CATEGORIES.find((c) => c.value === selectedCategory)?.label} Comparison
            </CardTitle>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMetricOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <BarChart
              data={getBarChartData()}
              height={400}
              showGrid
              showValues
              sortBy="value-desc"
              valueFormat={
                selectedCategory === "profitability" ? "percent" : "number"
              }
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "heatmap" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ratio Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <RatioHeatmap securities={peers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

BenchmarkingTab.displayName = "BenchmarkingTab";
