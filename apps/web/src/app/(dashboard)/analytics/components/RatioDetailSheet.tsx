"use client";

/**
 * RatioDetailSheet Component
 *
 * Slide-out panel displaying detailed ratio information:
 * - Historical trend chart
 * - Threshold configuration
 * - Statistical summary
 * - Related alerts
 */

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatioTrendChart } from "@/components/charts/RatioTrendChart";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TrendingUp, TrendingDown, Minus, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RatioClass, TrendDirection } from "@/components/data/RatioCard";

interface RatioDefinition {
  id: string;
  name: string;
  class: RatioClass;
  suffix: string;
  decimals: number;
  thresholds?: {
    good: number;
    bad: number;
    higherIsBetter?: boolean;
  };
  description: string;
}

interface RatioData {
  value: number;
  trend: TrendDirection;
  peerPercentile: number;
  sparklineData: { value: number }[];
}

export interface RatioDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratio: RatioDefinition | null;
  securityId: string;
  data?: RatioData;
}

/**
 * Historical data point type (compatible with RatioDataPoint)
 */
interface HistoricalDataPoint {
  date: string;
  value: number;
  [key: string]: unknown;
}

/**
 * Generate mock historical data for the chart
 */
function generateHistoricalData(baseValue: number, months: number = 12): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Generate a value with some variation
    const variation = (Math.random() - 0.5) * 0.4;
    const value = baseValue * (1 + variation);

    const dateStr = date.toISOString().split("T")[0];
    if (dateStr) {
      data.push({
        date: dateStr,
        value,
      });
    }
  }

  return data;
}

/**
 * Class badge colors
 */
const classColors: Record<RatioClass, { bg: string; text: string }> = {
  liquidity: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  profitability: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  leverage: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  valuation: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  efficiency: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
  growth: { bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400" },
};

/**
 * Get trend icon
 */
function TrendIcon({ trend, className }: { trend: TrendDirection; className?: string }) {
  switch (trend) {
    case "up":
      return <TrendingUp className={cn("text-positive", className)} />;
    case "down":
      return <TrendingDown className={cn("text-negative", className)} />;
    default:
      return <Minus className={cn("text-muted-foreground", className)} />;
  }
}

/**
 * Get threshold status color
 */
function getThresholdStatus(
  value: number,
  thresholds?: { good: number; bad: number; higherIsBetter?: boolean }
): "good" | "warning" | "bad" {
  if (!thresholds) return "good";

  const { good, bad, higherIsBetter = true } = thresholds;

  if (higherIsBetter) {
    if (value >= good) return "good";
    if (value <= bad) return "bad";
    return "warning";
  } else {
    if (value <= good) return "good";
    if (value >= bad) return "bad";
    return "warning";
  }
}

const statusColors = {
  good: "text-positive",
  warning: "text-amber-500",
  bad: "text-negative",
};

export function RatioDetailSheet({
  open,
  onOpenChange,
  ratio,
  securityId,
  data,
}: RatioDetailSheetProps) {
  const [warningThreshold, setWarningThreshold] = React.useState<string>("");
  const [criticalThreshold, setCriticalThreshold] = React.useState<string>("");

  // Initialize threshold values when ratio changes
  React.useEffect(() => {
    if (ratio?.thresholds) {
      setWarningThreshold(
        ratio.thresholds.higherIsBetter === false
          ? ratio.thresholds.bad.toString()
          : ratio.thresholds.good.toString()
      );
      setCriticalThreshold(
        ratio.thresholds.higherIsBetter === false
          ? ratio.thresholds.good.toString()
          : ratio.thresholds.bad.toString()
      );
    }
  }, [ratio]);

  if (!ratio) return null;

  const historicalData = data
    ? generateHistoricalData(data.value, 12)
    : [];

  const status = data ? getThresholdStatus(data.value, ratio.thresholds) : "good";
  const colors = classColors[ratio.class];

  // Calculate statistics from historical data
  const values = historicalData.map((d) => d.value);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const stats = {
    current: data?.value ?? 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    change: values.length > 1 && firstValue !== undefined && lastValue !== undefined && firstValue !== 0
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge className={cn("font-medium", colors.bg, colors.text)} variant="secondary">
              {ratio.class.charAt(0).toUpperCase() + ratio.class.slice(1)}
            </Badge>
            {data && <TrendIcon trend={data.trend} className="h-4 w-4" />}
          </div>
          <SheetTitle className="text-xl">{ratio.name}</SheetTitle>
          <SheetDescription>{ratio.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Current Value Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className={cn("text-3xl font-bold tabular-nums", statusColors[status])}>
                {data?.value?.toFixed(ratio.decimals) ?? "N/A"}
                {ratio.suffix}
              </p>
            </div>
            {data && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Peer Percentile</p>
                <p className="text-lg font-semibold tabular-nums">
                  {data.peerPercentile.toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          {/* Gauge Chart */}
          {ratio.thresholds && data && (
            <div className="flex justify-center py-4">
              <GaugeChart
                value={data.value}
                min={0}
                max={
                  ratio.thresholds.higherIsBetter
                    ? ratio.thresholds.good * 1.5
                    : ratio.thresholds.bad * 1.5
                }
                simpleThresholds={{
                  warning: ratio.thresholds.good,
                  critical: ratio.thresholds.bad,
                  isLowerBetter: !ratio.thresholds.higherIsBetter,
                }}
                label={ratio.name}
                size={180}
                decimals={ratio.decimals}
              />
            </div>
          )}

          <Separator />

          {/* Historical Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historical Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <RatioTrendChart
                  data={historicalData}
                  ratioName={ratio.name}
                  thresholds={
                    ratio.thresholds
                      ? {
                          warning: ratio.thresholds.good,
                          critical: ratio.thresholds.bad,
                          isLowerBetter: !ratio.thresholds.higherIsBetter,
                        }
                      : undefined
                  }
                  suffix={ratio.suffix}
                  decimals={ratio.decimals}
                  height={200}
                  showThresholdLines
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No historical data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Statistics (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Min</p>
                  <p className="font-mono tabular-nums">
                    {stats.min.toFixed(ratio.decimals)}{ratio.suffix}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max</p>
                  <p className="font-mono tabular-nums">
                    {stats.max.toFixed(ratio.decimals)}{ratio.suffix}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-mono tabular-nums">
                    {stats.avg.toFixed(ratio.decimals)}{ratio.suffix}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p
                    className={cn(
                      "font-mono tabular-nums",
                      stats.change > 0 ? "text-positive" : stats.change < 0 ? "text-negative" : ""
                    )}
                  >
                    {stats.change > 0 ? "+" : ""}
                    {stats.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Threshold Configuration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Alert Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="warning-threshold" className="text-amber-500">
                    Warning Threshold
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="warning-threshold"
                      type="number"
                      step="0.1"
                      value={warningThreshold}
                      onChange={(e) => setWarningThreshold(e.target.value)}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {ratio.suffix}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="critical-threshold" className="text-negative">
                    Critical Threshold
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="critical-threshold"
                      type="number"
                      step="0.1"
                      value={criticalThreshold}
                      onChange={(e) => setCriticalThreshold(e.target.value)}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {ratio.suffix}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You will receive alerts when the {ratio.name.toLowerCase()} crosses these thresholds.
              </p>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>
            <Bell className="mr-2 h-4 w-4" />
            Save Alert
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

RatioDetailSheet.displayName = "RatioDetailSheet";
