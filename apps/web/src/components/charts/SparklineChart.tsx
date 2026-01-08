"use client";

/**
 * SparklineChart Component
 *
 * A minimal inline chart for showing trends without axes or labels.
 * Ideal for compact displays like table cells, cards, or inline metrics.
 */

import * as React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  calculateTrend,
  formatChartValue,
} from "@/lib/chartUtils";

/**
 * Data point for sparkline (can be simple array of numbers or objects)
 */
export type SparklineDataPoint = number | { value: number; [key: string]: unknown };

/**
 * SparklineChart props
 */
export interface SparklineChartProps {
  /** Data to display - array of numbers or objects with value property */
  data: SparklineDataPoint[];
  /** Chart width */
  width?: number | string;
  /** Chart height */
  height?: number;
  /** Line color override */
  color?: string;
  /** Show endpoint dot */
  showEndPoint?: boolean;
  /** Auto-color by trend (green up, red down) */
  autoColorByTrend?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Value format type (for tooltip) */
  valueFormat?: "currency" | "percent" | "number";
  /** Currency for formatting */
  currency?: string;
  /** Line stroke width */
  strokeWidth?: number;
  /** Animation duration (0 to disable) */
  animationDuration?: number;
  /** Additional class name */
  className?: string;
}

/**
 * Normalize data to array of objects with value property
 */
function normalizeData(data: SparklineDataPoint[]): Array<{ value: number; index: number }> {
  return data.map((item, index) => ({
    value: typeof item === "number" ? item : item.value,
    index,
  }));
}

/**
 * Custom tooltip for sparkline
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  valueFormat: "currency" | "percent" | "number";
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  valueFormat,
  currency,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const firstPayload = payload[0];
  if (!firstPayload) {
    return null;
  }
  const value = firstPayload.value;

  return (
    <div className="rounded border bg-popover px-2 py-1 text-xs shadow-sm">
      <span
        className={cn(
          "font-medium tabular-nums",
          value >= 0 ? "text-positive" : "text-negative"
        )}
      >
        {formatChartValue(value, valueFormat, {
          currency,
          showSign: valueFormat === "percent",
        })}
      </span>
    </div>
  );
}

/**
 * Custom dot component for endpoint
 */
interface EndPointDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  color: string;
}

function EndPointDot({ cx, cy, index, dataLength, color }: EndPointDotProps) {
  // Only show for the last point
  if (index !== dataLength - 1) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke="hsl(var(--background))"
      strokeWidth={1}
    />
  );
}

/**
 * SparklineChart component for minimal inline trend visualization
 */
export function SparklineChart({
  data,
  width = "100%",
  height = 32,
  color,
  showEndPoint = true,
  autoColorByTrend = true,
  showTooltip = false,
  valueFormat = "number",
  currency = "USD",
  strokeWidth = 1.5,
  animationDuration = 300,
  className,
}: SparklineChartProps) {
  // Normalize data and calculate derived values
  const { chartData, values, trend, minValue, maxValue } = React.useMemo(() => {
    const normalized = normalizeData(data);
    const vals = normalized.map((d) => d.value);
    return {
      chartData: normalized,
      values: vals,
      trend: calculateTrend(vals),
      minValue: Math.min(...vals, 0),
      maxValue: Math.max(...vals, 0),
    };
  }, [data]);

  // Determine line color based on trend
  const lineColor = React.useMemo(() => {
    if (color) {
      return color;
    }
    if (autoColorByTrend) {
      switch (trend) {
        case "up":
          return CHART_COLORS.performance.positive;
        case "down":
          return CHART_COLORS.performance.negative;
        default:
          return CHART_COLORS.text.light;
      }
    }
    return CHART_COLORS.performance.portfolio;
  }, [color, autoColorByTrend, trend]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-muted-foreground text-xs", className)}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={cn("sparkline-chart", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={
              showEndPoint
                ? (props) => (
                    <EndPointDot
                      {...props}
                      dataLength={chartData.length}
                      color={lineColor}
                    />
                  )
                : false
            }
            activeDot={
              showTooltip
                ? {
                    r: 3,
                    stroke: lineColor,
                    strokeWidth: 1,
                    fill: "hsl(var(--background))",
                  }
                : false
            }
            isAnimationActive={animationDuration > 0}
            animationDuration={animationDuration}
          />
          {showTooltip && (
            <Tooltip
              content={
                <CustomTooltip valueFormat={valueFormat} currency={currency} />
              }
              cursor={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

SparklineChart.displayName = "SparklineChart";

export default SparklineChart;
