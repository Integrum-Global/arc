"use client";

/**
 * BarChart Component
 *
 * Displays categorical data as vertical or horizontal bars.
 * Supports value-based coloring, sorting, and value labels.
 */

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  formatChartValue,
  getPerformanceColor,
} from "@/lib/chartUtils";

/**
 * Data point for bar chart
 */
export interface BarDataPoint {
  /** Category name/label */
  name: string;
  /** Numeric value */
  value: number;
  /** Optional custom color */
  color?: string;
  /** Optional additional data */
  [key: string]: unknown;
}

/**
 * Sort options for bar chart
 */
export type BarSortBy = "none" | "value-asc" | "value-desc" | "name-asc" | "name-desc";

/**
 * BarChart props
 */
export interface BarChartProps {
  /** Data to display */
  data: BarDataPoint[];
  /** Chart orientation */
  orientation?: "vertical" | "horizontal";
  /** Show value labels on bars */
  showValues?: boolean;
  /** Color bars by value (green positive, red negative) */
  colorByValue?: boolean;
  /** Sort bars */
  sortBy?: BarSortBy;
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
  /** Custom colors array */
  colors?: readonly string[];
  /** Show grid lines */
  showGrid?: boolean;
  /** Bar corner radius */
  radius?: number;
  /** Maximum number of bars to display */
  maxBars?: number;
  /** Callback when bar is clicked */
  onBarClick?: (data: BarDataPoint, index: number) => void;
}

/**
 * Custom tooltip component
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: BarDataPoint;
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

  const data = payload[0];
  if (!data) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{data.payload.name}</p>
      <p
        className={cn(
          "mt-1 font-medium tabular-nums",
          data.value >= 0 ? "text-positive" : "text-negative"
        )}
      >
        {formatChartValue(data.value, valueFormat, {
          currency,
          showSign: valueFormat === "percent",
        })}
      </p>
    </div>
  );
}

/**
 * Sort data based on sortBy option
 */
function sortData(data: BarDataPoint[], sortBy: BarSortBy): BarDataPoint[] {
  if (sortBy === "none") {
    return data;
  }

  const sorted = [...data];

  switch (sortBy) {
    case "value-asc":
      return sorted.sort((a, b) => a.value - b.value);
    case "value-desc":
      return sorted.sort((a, b) => b.value - a.value);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}

/**
 * Custom label renderer for bar values
 */
function renderValueLabel(
  props: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    value?: number;
  },
  orientation: "vertical" | "horizontal",
  valueFormat: "currency" | "percent" | "number",
  currency: string
) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;

  if (value === undefined || value === null) {
    return null;
  }

  const formattedValue = formatChartValue(value, valueFormat, {
    currency,
    compact: true,
    showSign: valueFormat === "percent",
  });

  if (orientation === "vertical") {
    // Position above the bar
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={11}
        className="fill-foreground"
      >
        {formattedValue}
      </text>
    );
  }

  // Horizontal: position to the right of the bar
  return (
    <text
      x={x + width + 5}
      y={y + height / 2}
      fill="hsl(var(--foreground))"
      textAnchor="start"
      dominantBaseline="middle"
      fontSize={11}
      className="fill-foreground"
    >
      {formattedValue}
    </text>
  );
}

/**
 * BarChart component for displaying categorical data
 */
export function BarChart({
  data,
  orientation = "vertical",
  showValues = false,
  colorByValue = false,
  sortBy = "none",
  interactive = true,
  height = 300,
  className,
  valueFormat = "number",
  currency = "USD",
  colors = CHART_COLORS.categories,
  showGrid = true,
  radius = 4,
  maxBars,
  onBarClick,
}: BarChartProps) {
  // Sort and limit data
  const processedData = React.useMemo(() => {
    let sorted = sortData(data, sortBy);
    if (maxBars && sorted.length > maxBars) {
      sorted = sorted.slice(0, maxBars);
    }
    return sorted;
  }, [data, sortBy, maxBars]);

  // Get color for a bar
  const getBarColor = (entry: BarDataPoint, index: number): string => {
    if (entry.color) {
      return entry.color;
    }
    if (colorByValue) {
      return getPerformanceColor(entry.value);
    }
    return colors[index % colors.length] ?? "#3b82f6";
  };

  // Handle bar click
  const handleClick = (data: BarDataPoint, index: number) => {
    if (interactive && onBarClick) {
      onBarClick(data, index);
    }
  };

  // Calculate domain with padding
  const values = processedData.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const padding = (maxValue - minValue) * 0.1;
  const domain: [number, number] = [
    minValue < 0 ? minValue - padding : 0,
    maxValue + padding,
  ];

  // Format value tick
  const formatValueTick = (value: number) => {
    return formatChartValue(value, valueFormat, {
      currency,
      compact: true,
    });
  };

  // Truncate long labels
  const truncateLabel = (label: string, maxLength: number = 15) => {
    if (label.length <= maxLength) return label;
    return `${label.slice(0, maxLength)}...`;
  };

  const isHorizontal = orientation === "horizontal";

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={processedData}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{
            top: showValues ? 20 : 10,
            right: showValues && isHorizontal ? 60 : 10,
            left: isHorizontal ? 10 : 0,
            bottom: 0,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={isHorizontal}
              vertical={!isHorizontal}
              stroke="hsl(var(--border))"
            />
          )}

          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                domain={domain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatValueTick}
                tickMargin={8}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => truncateLabel(value, 12)}
                width={100}
                tickMargin={8}
              />
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => truncateLabel(value, 10)}
                tickMargin={8}
                interval={0}
                angle={processedData.length > 6 ? -45 : 0}
                textAnchor={processedData.length > 6 ? "end" : "middle"}
              />
              <YAxis
                type="number"
                domain={domain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatValueTick}
                tickMargin={8}
                width={60}
              />
            </>
          )}

          {interactive && (
            <Tooltip
              content={
                <CustomTooltip valueFormat={valueFormat} currency={currency} />
              }
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
          )}

          <Bar
            dataKey="value"
            radius={[radius, radius, radius, radius]}
            onClick={(data, index) => handleClick(data as unknown as BarDataPoint, index)}
            cursor={interactive && onBarClick ? "pointer" : "default"}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry, index)}
                className="transition-opacity hover:opacity-80"
              />
            ))}
            {showValues && (
              <LabelList
                dataKey="value"
                content={(props) =>
                  renderValueLabel(
                    props as {
                      x?: number;
                      y?: number;
                      width?: number;
                      height?: number;
                      value?: number;
                    },
                    orientation,
                    valueFormat,
                    currency
                  )
                }
              />
            )}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

BarChart.displayName = "BarChart";

export default BarChart;
