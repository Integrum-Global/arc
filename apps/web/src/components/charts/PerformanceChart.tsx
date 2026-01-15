"use client";

/**
 * PerformanceChart Component
 *
 * Displays performance data over time with optional benchmark comparison.
 * Supports area chart, line chart, and positive/negative area coloring.
 */

import * as React from "react";
import {
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  formatChartValue,
  formatChartDate,
} from "@/lib/chartUtils";

/**
 * Data point for performance chart
 */
export interface PerformanceDataPoint {
  /** Date/time for the data point */
  date: string | Date | number;
  /** Portfolio value/return */
  value: number;
  /** Optional benchmark value/return */
  benchmark?: number;
  /** Optional additional series */
  [key: string]: unknown;
}

/**
 * Time period options
 */
export type PerformancePeriod =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "3Y"
  | "5Y"
  | "ALL";

/**
 * PerformanceChart props
 */
export interface PerformanceChartProps {
  /** Data to display */
  data: PerformanceDataPoint[];
  /** Time period (for axis formatting) */
  period?: PerformancePeriod;
  /** Show benchmark line */
  showBenchmark?: boolean;
  /** Benchmark label */
  benchmarkLabel?: string;
  /** Show as area chart (vs line) */
  showArea?: boolean;
  /** Enable interactive features */
  interactive?: boolean;
  /** Chart height */
  height?: number;
  /** Additional class name */
  className?: string;
  /** Value format type */
  valueFormat?: "currency" | "percent" | "number";
  /** Currency for formatting */
  currency?: string;
  /** Show zero reference line */
  showZeroLine?: boolean;
  /** Color positive/negative areas differently */
  colorBySign?: boolean;
  /** Portfolio color override */
  portfolioColor?: string;
  /** Benchmark color override */
  benchmarkColor?: string;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Portfolio label */
  portfolioLabel?: string;
  /** Animation duration in ms (0 to disable) */
  animationDuration?: number;
  /** Enable animation on data changes */
  animateOnDataChange?: boolean;
}

/**
 * Custom tooltip component
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  valueFormat: "currency" | "percent" | "number";
  currency: string;
  portfolioLabel: string;
  benchmarkLabel: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  valueFormat,
  currency,
  portfolioLabel,
  benchmarkLabel,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-2 font-medium text-foreground">
        {label ? formatChartDate(label, "medium") : "Unknown"}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const label =
            entry.dataKey === "value"
              ? portfolioLabel
              : entry.dataKey === "benchmark"
                ? benchmarkLabel
                : entry.name;

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  entry.value >= 0 ? "text-positive" : "text-negative"
                )}
              >
                {formatChartValue(entry.value, valueFormat, {
                  currency,
                  showSign: valueFormat === "percent",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Custom legend component
 */
interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    dataKey: string;
  }>;
  portfolioLabel: string;
  benchmarkLabel: string;
}

function CustomLegend({
  payload,
  portfolioLabel,
  benchmarkLabel,
}: CustomLegendProps) {
  if (!payload) {
    return null;
  }

  return (
    <div className="flex justify-center gap-6 pt-2">
      {payload.map((entry, index) => {
        const label =
          entry.dataKey === "value"
            ? portfolioLabel
            : entry.dataKey === "benchmark"
              ? benchmarkLabel
              : entry.value;

        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get date format based on period
 */
function getDateFormat(
  period: PerformancePeriod
): "short" | "medium" | "month" | "year" {
  switch (period) {
    case "1D":
    case "1W":
      return "short";
    case "1M":
    case "3M":
    case "6M":
    case "YTD":
      return "short";
    case "1Y":
      return "month";
    case "3Y":
    case "5Y":
    case "ALL":
      return "month";
    default:
      return "short";
  }
}

/**
 * PerformanceChart component for displaying time-series performance data
 */
export function PerformanceChart({
  data,
  period = "1Y",
  showBenchmark = false,
  benchmarkLabel = "Benchmark",
  showArea = true,
  interactive = true,
  height = 300,
  className,
  valueFormat = "percent",
  currency = "USD",
  showZeroLine = true,
  colorBySign = false,
  portfolioColor,
  benchmarkColor,
  showGrid = true,
  showLegend = true,
  portfolioLabel = "Portfolio",
  animationDuration = 300,
  animateOnDataChange = false,
}: PerformanceChartProps) {
  const dateFormat = getDateFormat(period);

  // Track if this is the initial render for animation control
  const isInitialRender = React.useRef(true);
  React.useEffect(() => {
    isInitialRender.current = false;
  }, []);

  // Determine if animation should be active
  // Only animate on initial render, not on data changes (to prevent jarring transitions)
  const shouldAnimate = animateOnDataChange || isInitialRender.current;

  // Determine colors
  const pColor = portfolioColor || CHART_COLORS.performance.portfolio;
  const bColor = benchmarkColor || CHART_COLORS.performance.benchmark;

  // Calculate domain for Y axis
  const allValues = React.useMemo(() => {
    const values = data.map((d) => d.value);
    if (showBenchmark) {
      values.push(...data.filter((d) => d.benchmark !== undefined).map((d) => d.benchmark as number));
    }
    return values;
  }, [data, showBenchmark]);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  // Format axis tick
  const formatYTick = (value: number) => {
    return formatChartValue(value, valueFormat, {
      currency,
      compact: true,
      showSign: valueFormat === "percent",
    });
  };

  const formatXTick = (value: string) => {
    return formatChartDate(value, dateFormat);
  };

  // Common chart props
  const chartProps = {
    data,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  };

  // Common axis props
  const xAxisProps = {
    dataKey: "date",
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
    tickFormatter: formatXTick,
    tickMargin: 8,
  };

  const yAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
    tickFormatter: formatYTick,
    tickMargin: 8,
    domain: [minValue - padding, maxValue + padding] as [number, number],
    width: 60,
  };

  const gridProps = showGrid
    ? {
        strokeDasharray: "3 3",
        vertical: false,
        stroke: "hsl(var(--border))",
      }
    : undefined;

  // Gradient definitions
  const gradientId = React.useId();

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent {...chartProps}>
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`gradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={pColor} stopOpacity={0.05} />
            </linearGradient>
            {colorBySign && (
              <>
                <linearGradient
                  id={`gradient-positive-${gradientId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={CHART_COLORS.performance.positive}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={CHART_COLORS.performance.positive}
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id={`gradient-negative-${gradientId}`}
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={CHART_COLORS.performance.negative}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={CHART_COLORS.performance.negative}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </>
            )}
          </defs>

          {gridProps && <CartesianGrid {...gridProps} />}
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />

          {/* Zero reference line */}
          {showZeroLine && valueFormat === "percent" && (
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          )}

          {/* Portfolio line/area */}
          {showArea ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={colorBySign ? undefined : pColor}
              fill={
                colorBySign
                  ? undefined
                  : `url(#gradient-${gradientId})`
              }
              strokeWidth={2}
              dot={false}
              activeDot={
                interactive
                  ? {
                      r: 4,
                      stroke: pColor,
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                    }
                  : false
              }
              isAnimationActive={shouldAnimate && animationDuration > 0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={pColor}
              strokeWidth={2}
              dot={false}
              activeDot={
                interactive
                  ? {
                      r: 4,
                      stroke: pColor,
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                    }
                  : false
              }
              isAnimationActive={shouldAnimate && animationDuration > 0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          )}

          {/* Benchmark line */}
          {showBenchmark && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke={bColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={
                interactive
                  ? {
                      r: 4,
                      stroke: bColor,
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                    }
                  : false
              }
              isAnimationActive={shouldAnimate && animationDuration > 0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          )}

          {/* Tooltip */}
          {interactive && (
            <Tooltip
              content={
                <CustomTooltip
                  valueFormat={valueFormat}
                  currency={currency}
                  portfolioLabel={portfolioLabel}
                  benchmarkLabel={benchmarkLabel}
                />
              }
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
          )}

          {/* Legend */}
          {showLegend && (showBenchmark || true) && (
            <Legend
              content={
                <CustomLegend
                  portfolioLabel={portfolioLabel}
                  benchmarkLabel={benchmarkLabel}
                />
              }
              verticalAlign="bottom"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

PerformanceChart.displayName = "PerformanceChart";

export default PerformanceChart;
