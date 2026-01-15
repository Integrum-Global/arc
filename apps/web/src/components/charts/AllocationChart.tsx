"use client";

/**
 * AllocationChart Component
 *
 * Displays allocation/distribution data as pie chart, donut chart, or treemap.
 * Used for showing portfolio allocation, sector breakdown, asset type distribution, etc.
 */

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Treemap,
} from "recharts";
import { cn } from "@/lib/utils";
import { CHART_COLORS, formatChartValue } from "@/lib/chartUtils";

/**
 * Data point for allocation chart
 */
export interface AllocationDataPoint {
  /** Segment name/label */
  name: string;
  /** Numeric value */
  value: number;
  /** Optional custom color */
  color?: string;
  /** Optional additional data */
  metadata?: Record<string, unknown>;
}

/**
 * AllocationChart props
 */
export interface AllocationChartProps {
  /** Data to display */
  data: AllocationDataPoint[];
  /** Chart type */
  type?: "pie" | "donut" | "treemap";
  /** Show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: "bottom" | "right";
  /** Show labels on segments */
  showLabels?: boolean;
  /** Label type */
  labelType?: "percent" | "value" | "name";
  /** Enable interactive features */
  interactive?: boolean;
  /** Callback when segment is clicked */
  onSegmentClick?: (data: AllocationDataPoint, index: number) => void;
  /** Custom colors array (overrides default) */
  colors?: readonly string[];
  /** Inner radius for donut chart (0-1) */
  innerRadius?: number;
  /** Chart height */
  height?: number;
  /** Additional class name */
  className?: string;
  /** Value format type */
  valueFormat?: "currency" | "percent" | "number";
  /** Currency for formatting */
  currency?: string;
}

/**
 * Custom tooltip component for allocation chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: AllocationDataPoint;
  }>;
  total: number;
  valueFormat: "currency" | "percent" | "number";
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  total,
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
  const percentage = ((data.value / total) * 100).toFixed(1);

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{data.name}</p>
      <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
        <span>
          Value:{" "}
          <span className="font-medium text-foreground">
            {formatChartValue(data.value, valueFormat, { currency })}
          </span>
        </span>
        <span>
          Allocation:{" "}
          <span className="font-medium text-foreground">{percentage}%</span>
        </span>
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
    payload: {
      value: number;
      name: string;
    };
  }>;
  total: number;
}

function CustomLegend({ payload, total }: CustomLegendProps) {
  if (!payload) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
      {payload.map((entry, index) => {
        const percentage = ((entry.payload.value / total) * 100).toFixed(1);
        return (
          <li key={`legend-${index}`} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
            <span className="font-medium text-foreground">{percentage}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Custom treemap content
 */
interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  index: number;
  colors: readonly string[];
  total: number;
}

function TreemapContent({
  x,
  y,
  width,
  height,
  name,
  value,
  index,
  colors,
  total,
}: TreemapContentProps) {
  const percentage = ((value / total) * 100).toFixed(1);
  const color = colors[index % colors.length];
  const showLabel = width > 60 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        rx={4}
        className="transition-opacity hover:opacity-80"
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight={500}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={11}
          >
            {percentage}%
          </text>
        </>
      )}
    </g>
  );
}

/**
 * Custom label renderer for pie/donut chart
 */
function renderCustomLabel(
  props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
    value: number;
  },
  labelType: "percent" | "value" | "name",
  valueFormat: "currency" | "percent" | "number",
  currency: string
) {
  const { cx, cy, midAngle, outerRadius, percent, name, value } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if segment is large enough
  if (percent < 0.05) {
    return null;
  }

  let label: string;
  switch (labelType) {
    case "percent":
      label = `${(percent * 100).toFixed(0)}%`;
      break;
    case "value":
      label = formatChartValue(value, valueFormat, { currency, compact: true });
      break;
    case "name":
    default:
      label = name;
      break;
  }

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      className="fill-foreground"
    >
      {label}
    </text>
  );
}

/**
 * AllocationChart component for displaying distribution data
 */
export function AllocationChart({
  data,
  type = "donut",
  showLegend = true,
  legendPosition = "bottom",
  showLabels = false,
  labelType = "percent",
  interactive = true,
  onSegmentClick,
  colors = CHART_COLORS.categories,
  innerRadius = 0.6,
  height = 300,
  className,
  valueFormat = "currency",
  currency = "USD",
}: AllocationChartProps) {
  const total = React.useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const chartData = React.useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        fill: item.color ?? colors[index % colors.length] ?? "#3b82f6",
      })),
    [data, colors]
  );

  const handleClick = React.useCallback(
    (data: AllocationDataPoint, index: number) => {
      if (interactive && onSegmentClick) {
        onSegmentClick(data, index);
      }
    },
    [interactive, onSegmentClick]
  );

  // Treemap chart
  if (type === "treemap") {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
            content={({ x, y, width, height, name, value, index }) => (
              <TreemapContent
                x={x as number}
                y={y as number}
                width={width as number}
                height={height as number}
                name={name as string}
                value={value as number}
                index={index as number}
                colors={colors}
                total={total}
              />
            )}
          />
        </ResponsiveContainer>
        {showLegend && (
          <div className="mt-4">
            <CustomLegend
              payload={chartData.map((item) => ({
                value: item.name,
                color: item.fill,
                payload: { value: item.value, name: item.name },
              }))}
              total={total}
            />
          </div>
        )}
      </div>
    );
  }

  // Pie/Donut chart
  const actualInnerRadius = type === "pie" ? 0 : innerRadius;
  const outerRadius = 0.8;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={actualInnerRadius * 100}
            outerRadius={outerRadius * 100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={(data, index) => handleClick(data as AllocationDataPoint, index)}
            cursor={interactive && onSegmentClick ? "pointer" : "default"}
            label={
              showLabels
                ? (props) =>
                    renderCustomLabel(
                      props as {
                        cx: number;
                        cy: number;
                        midAngle: number;
                        innerRadius: number;
                        outerRadius: number;
                        percent: number;
                        name: string;
                        value: number;
                      },
                      labelType,
                      valueFormat,
                      currency
                    )
                : false
            }
            labelLine={showLabels}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          {interactive && (
            <Tooltip
              content={
                <CustomTooltip
                  total={total}
                  valueFormat={valueFormat}
                  currency={currency}
                />
              }
            />
          )}
          {showLegend && (
            <Legend
              content={<CustomLegend total={total} />}
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

AllocationChart.displayName = "AllocationChart";

export default AllocationChart;
