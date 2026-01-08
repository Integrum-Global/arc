"use client";

/**
 * RatioTrendChart Component
 *
 * Displays financial ratio trends over time with threshold reference lines.
 * Used for visualizing metrics like P/E ratio, debt-to-equity, current ratio, etc.
 */

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  formatChartDate,
  getThresholdColor,
} from "@/lib/chartUtils";

/**
 * Data point for ratio trend chart
 */
export interface RatioDataPoint {
  /** Date/time for the data point */
  date: string | Date | number;
  /** Ratio value */
  value: number;
  /** Optional additional data */
  [key: string]: unknown;
}

/**
 * Threshold configuration
 */
export interface RatioThresholds {
  /** Warning threshold */
  warning: number;
  /** Critical threshold */
  critical: number;
  /** Is lower value better? (e.g., debt-to-equity) */
  isLowerBetter?: boolean;
}

/**
 * RatioTrendChart props
 */
export interface RatioTrendChartProps {
  /** Data to display */
  data: RatioDataPoint[];
  /** Threshold configuration */
  thresholds?: RatioThresholds;
  /** Ratio name for display */
  ratioName?: string;
  /** Show threshold reference lines */
  showThresholdLines?: boolean;
  /** Show threshold zone coloring */
  showThresholdZones?: boolean;
  /** Show data points */
  showPoints?: boolean;
  /** Enable interactive features */
  interactive?: boolean;
  /** Chart height */
  height?: number;
  /** Additional class name */
  className?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Suffix for ratio display (e.g., "x" for multiples) */
  suffix?: string;
  /** Line color override */
  lineColor?: string;
  /** Show grid lines */
  showGrid?: boolean;
  /** Target value reference line */
  targetValue?: number;
  /** Target label */
  targetLabel?: string;
}

/**
 * Custom tooltip component
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
  ratioName: string;
  decimals: number;
  suffix: string;
  thresholds?: RatioThresholds;
}

function CustomTooltip({
  active,
  payload,
  label,
  ratioName,
  decimals,
  suffix,
  thresholds,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const firstPayload = payload[0];
  if (!firstPayload) {
    return null;
  }
  const value = firstPayload.value;
  const statusColor = thresholds
    ? getThresholdColor(value, thresholds, false, thresholds.isLowerBetter)
    : undefined;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-foreground">
        {formatChartDate(label, "medium")}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{ratioName}</span>
        <span
          className="font-medium tabular-nums"
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value.toFixed(decimals)}
          {suffix}
        </span>
      </div>
      {thresholds && (
        <div className="mt-1 text-xs text-muted-foreground">
          {value >= thresholds.warning ? (
            <span className="text-positive">Good</span>
          ) : value >= thresholds.critical ? (
            <span className="text-warning" style={{ color: CHART_COLORS.thresholds.warning }}>
              Warning
            </span>
          ) : (
            <span className="text-negative">Critical</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * RatioTrendChart component for displaying ratio trends with thresholds
 */
export function RatioTrendChart({
  data,
  thresholds,
  ratioName = "Ratio",
  showThresholdLines = true,
  showThresholdZones = false,
  showPoints = false,
  interactive = true,
  height = 250,
  className,
  decimals = 2,
  suffix = "",
  lineColor,
  showGrid = true,
  targetValue,
  targetLabel = "Target",
}: RatioTrendChartProps) {
  // Calculate Y axis domain
  const allValues = data.map((d) => d.value);
  const minDataValue = Math.min(...allValues);
  const maxDataValue = Math.max(...allValues);

  // Include thresholds in domain calculation
  let minDomain = minDataValue;
  let maxDomain = maxDataValue;

  if (thresholds) {
    minDomain = Math.min(minDomain, thresholds.critical * 0.8);
    maxDomain = Math.max(maxDomain, thresholds.warning * 1.2);
  }

  if (targetValue !== undefined) {
    minDomain = Math.min(minDomain, targetValue * 0.8);
    maxDomain = Math.max(maxDomain, targetValue * 1.2);
  }

  const padding = (maxDomain - minDomain) * 0.1;
  const domain: [number, number] = [minDomain - padding, maxDomain + padding];

  // Determine line color based on current value and thresholds
  const lastDataPoint = data.length > 0 ? data[data.length - 1] : undefined;
  const currentValue = lastDataPoint?.value ?? 0;
  const defaultLineColor = thresholds
    ? getThresholdColor(currentValue, thresholds, false, thresholds.isLowerBetter)
    : CHART_COLORS.performance.portfolio;
  const strokeColor = lineColor || defaultLineColor;

  // Format axis tick
  const formatYTick = (value: number) => {
    return `${value.toFixed(decimals >= 2 ? 1 : decimals)}${suffix}`;
  };

  const formatXTick = (value: string) => {
    return formatChartDate(value, "short");
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Threshold zone areas */}
          {showThresholdZones && thresholds && (
            <>
              {/* Good zone */}
              <ReferenceArea
                y1={thresholds.warning}
                y2={domain[1]}
                fill={CHART_COLORS.thresholds.good}
                fillOpacity={0.1}
              />
              {/* Warning zone */}
              <ReferenceArea
                y1={thresholds.critical}
                y2={thresholds.warning}
                fill={CHART_COLORS.thresholds.warning}
                fillOpacity={0.1}
              />
              {/* Critical zone */}
              <ReferenceArea
                y1={domain[0]}
                y2={thresholds.critical}
                fill={CHART_COLORS.thresholds.critical}
                fillOpacity={0.1}
              />
            </>
          )}

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
          )}

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatXTick}
            tickMargin={8}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatYTick}
            tickMargin={8}
            domain={domain}
            width={50}
          />

          {/* Threshold reference lines */}
          {showThresholdLines && thresholds && (
            <>
              <ReferenceLine
                y={thresholds.warning}
                stroke={CHART_COLORS.thresholds.warning}
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{
                  value: `Warning (${thresholds.warning}${suffix})`,
                  fill: CHART_COLORS.thresholds.warning,
                  fontSize: 10,
                  position: "right",
                }}
              />
              <ReferenceLine
                y={thresholds.critical}
                stroke={CHART_COLORS.thresholds.critical}
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{
                  value: `Critical (${thresholds.critical}${suffix})`,
                  fill: CHART_COLORS.thresholds.critical,
                  fontSize: 10,
                  position: "right",
                }}
              />
            </>
          )}

          {/* Target reference line */}
          {targetValue !== undefined && (
            <ReferenceLine
              y={targetValue}
              stroke={CHART_COLORS.performance.benchmark}
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: `${targetLabel} (${targetValue}${suffix})`,
                fill: CHART_COLORS.performance.benchmark,
                fontSize: 10,
                position: "right",
              }}
            />
          )}

          {/* Data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={
              showPoints
                ? {
                    r: 3,
                    fill: strokeColor,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }
                : false
            }
            activeDot={
              interactive
                ? {
                    r: 5,
                    stroke: strokeColor,
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                  }
                : false
            }
          />

          {/* Tooltip */}
          {interactive && (
            <Tooltip
              content={
                <CustomTooltip
                  ratioName={ratioName}
                  decimals={decimals}
                  suffix={suffix}
                  thresholds={thresholds}
                />
              }
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

RatioTrendChart.displayName = "RatioTrendChart";

export default RatioTrendChart;
