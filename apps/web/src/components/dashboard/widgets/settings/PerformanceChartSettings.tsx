"use client";

/**
 * PerformanceChartSettings
 *
 * Settings component for the Performance Chart widget.
 * Allows configuration of:
 * - Time range selection (1W, 1M, 3M, 6M, 1Y, YTD, ALL)
 * - Show benchmark toggle
 * - Benchmark symbol selection
 * - Chart type (line or area)
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WidgetSettingsProps } from "@/components/dashboard/widgets/types";

/**
 * Configuration interface for Performance Chart widget
 */
export interface PerformanceChartConfig {
  timeRange: "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";
  showBenchmark: boolean;
  benchmarkSymbol: string;
  chartType: "line" | "area";
}

const TIME_RANGES = ["1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"] as const;

const BENCHMARKS = [
  { value: "SPY", label: "S&P 500 (SPY)" },
  { value: "QQQ", label: "NASDAQ (QQQ)" },
  { value: "DIA", label: "Dow Jones (DIA)" },
  { value: "IWM", label: "Russell 2000 (IWM)" },
] as const;

const CHART_TYPES = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
] as const;

export function PerformanceChartSettings({
  config,
  onConfigChange,
}: WidgetSettingsProps) {
  const typedConfig = config as unknown as PerformanceChartConfig;

  const handleTimeRangeChange = (value: string) => {
    onConfigChange({ ...config, timeRange: value });
  };

  const handleShowBenchmarkChange = (checked: boolean) => {
    onConfigChange({ ...config, showBenchmark: checked });
  };

  const handleBenchmarkSymbolChange = (value: string) => {
    onConfigChange({ ...config, benchmarkSymbol: value });
  };

  const handleChartTypeChange = (value: string) => {
    onConfigChange({ ...config, chartType: value });
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selection */}
      <div className="space-y-3">
        <Label>Time Range</Label>
        <RadioGroup
          value={typedConfig.timeRange ?? "YTD"}
          onValueChange={handleTimeRangeChange}
          className="flex flex-wrap gap-2"
        >
          {TIME_RANGES.map((range) => (
            <div key={range} className="flex items-center">
              <RadioGroupItem
                value={range}
                id={`time-${range}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`time-${range}`}
                className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
              >
                {range}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Show Benchmark Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showBenchmark">Show Benchmark</Label>
          <p className="text-xs text-muted-foreground">
            Compare performance against benchmark
          </p>
        </div>
        <Switch
          id="showBenchmark"
          checked={typedConfig.showBenchmark ?? true}
          onCheckedChange={handleShowBenchmarkChange}
        />
      </div>

      {/* Benchmark Symbol Select (conditional) */}
      {typedConfig.showBenchmark && (
        <div className="space-y-2">
          <Label htmlFor="benchmarkSymbol">Benchmark</Label>
          <Select
            value={typedConfig.benchmarkSymbol ?? "SPY"}
            onValueChange={handleBenchmarkSymbolChange}
          >
            <SelectTrigger id="benchmarkSymbol">
              <SelectValue placeholder="Select benchmark" />
            </SelectTrigger>
            <SelectContent>
              {BENCHMARKS.map((benchmark) => (
                <SelectItem key={benchmark.value} value={benchmark.value}>
                  {benchmark.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chart Type Selection */}
      <div className="space-y-3">
        <Label>Chart Type</Label>
        <RadioGroup
          value={typedConfig.chartType ?? "line"}
          onValueChange={handleChartTypeChange}
          className="flex gap-4"
        >
          {CHART_TYPES.map((type) => (
            <div key={type.value} className="flex items-center">
              <RadioGroupItem
                value={type.value}
                id={`chart-${type.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`chart-${type.value}`}
                className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
