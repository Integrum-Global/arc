"use client";

/**
 * Heatmap Component
 *
 * A grid-based heatmap for displaying correlation matrices,
 * performance grids, and other two-dimensional data visualizations.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  interpolateColor,
  formatChartValue,
} from "@/lib/chartUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Heatmap data structure - 2D array of values
 */
export type HeatmapData = number[][];

/**
 * Color scale configuration
 */
export interface HeatmapColorScale {
  /** Minimum color (for lowest values) */
  min: string;
  /** Middle/neutral color (for zero or middle values) */
  mid?: string;
  /** Maximum color (for highest values) */
  max: string;
}

/**
 * Heatmap props
 */
export interface HeatmapProps {
  /** 2D array of values */
  data: HeatmapData;
  /** Labels for X axis (columns) */
  xLabels?: string[];
  /** Labels for Y axis (rows) */
  yLabels?: string[];
  /** Custom color scale */
  colorScale?: HeatmapColorScale;
  /** Value format type */
  valueFormat?: "currency" | "percent" | "number" | "correlation";
  /** Currency for formatting */
  currency?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Show values in cells */
  showValues?: boolean;
  /** Cell size (width and height) */
  cellSize?: number;
  /** Gap between cells */
  gap?: number;
  /** Show color legend */
  showLegend?: boolean;
  /** Minimum value for color scale (auto-calculated if not provided) */
  minValue?: number;
  /** Maximum value for color scale (auto-calculated if not provided) */
  maxValue?: number;
  /** Enable interactive features (tooltips) */
  interactive?: boolean;
  /** Additional class name */
  className?: string;
  /** Callback when cell is clicked */
  onCellClick?: (row: number, col: number, value: number) => void;
}

/**
 * Default color scales
 */
const defaultColorScales = {
  correlation: {
    min: "#ef4444", // Red for negative
    mid: "#f4f4f5", // Gray for zero
    max: "#22c55e", // Green for positive
  },
  diverging: {
    min: "#3b82f6", // Blue
    mid: "#f4f4f5", // Gray
    max: "#ef4444", // Red
  },
  sequential: {
    min: "#dbeafe", // Light blue
    max: "#1d4ed8", // Dark blue
  },
  performance: {
    min: "#ef4444", // Red for negative
    mid: "#f4f4f5", // Gray for zero
    max: "#22c55e", // Green for positive
  },
} as const satisfies Record<string, HeatmapColorScale>;

/**
 * Get cell color based on value and scale
 */
function getCellColor(
  value: number,
  min: number,
  max: number,
  colorScale: HeatmapColorScale
): string {
  // Handle edge cases
  if (isNaN(value)) return colorScale.mid || "#f4f4f5";
  if (min === max) return colorScale.mid || colorScale.max;

  // Normalize value to 0-1 range
  const normalized = (value - min) / (max - min);

  if (colorScale.mid) {
    // Diverging scale (negative -> neutral -> positive)
    const midPoint = -min / (max - min);

    if (normalized < midPoint) {
      // Interpolate from min to mid
      const factor = normalized / midPoint;
      return interpolateColor(colorScale.min, colorScale.mid, factor);
    } else {
      // Interpolate from mid to max
      const factor = (normalized - midPoint) / (1 - midPoint);
      return interpolateColor(colorScale.mid, colorScale.max, factor);
    }
  }

  // Sequential scale
  return interpolateColor(colorScale.min, colorScale.max, normalized);
}

/**
 * Format cell value for display
 */
function formatCellValue(
  value: number,
  format: "currency" | "percent" | "number" | "correlation",
  decimals: number,
  currency: string
): string {
  if (isNaN(value)) return "-";

  switch (format) {
    case "correlation":
      return value.toFixed(decimals);
    case "percent":
      return formatChartValue(value * 100, "percent", { decimals });
    case "currency":
      return formatChartValue(value, "currency", { currency, compact: true });
    default:
      return formatChartValue(value, "number", { decimals });
  }
}

/**
 * Truncate label for display
 */
function truncateLabel(label: string, maxLength: number = 8): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}...`;
}

/**
 * Heatmap cell component
 */
interface HeatmapCellProps {
  value: number;
  row: number;
  col: number;
  color: string;
  cellSize: number;
  showValue: boolean;
  valueFormat: "currency" | "percent" | "number" | "correlation";
  decimals: number;
  currency: string;
  interactive: boolean;
  xLabel?: string;
  yLabel?: string;
  onClick?: (row: number, col: number, value: number) => void;
}

function HeatmapCell({
  value,
  row,
  col,
  color,
  cellSize,
  showValue,
  valueFormat,
  decimals,
  currency,
  interactive,
  onClick,
}: HeatmapCellProps) {
  const formattedValue = formatCellValue(value, valueFormat, decimals, currency);

  // Determine text color based on background brightness
  const isLightBackground =
    color.startsWith("#f") || color.startsWith("#e") || color.startsWith("#d");
  const textColor = isLightBackground ? "#18181b" : "#fafafa";

  const handleClick = () => {
    if (onClick) {
      onClick(row, col, value);
    }
  };

  const cell = (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm transition-opacity",
        interactive && onClick && "cursor-pointer hover:opacity-80"
      )}
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: color,
      }}
      onClick={handleClick}
    >
      {showValue && (
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: textColor }}
        >
          {formattedValue}
        </span>
      )}
    </div>
  );

  if (!interactive) {
    return cell;
  }

  return (
    <TooltipTrigger asChild>
      {cell}
    </TooltipTrigger>
  );
}

/**
 * Color legend component
 */
interface ColorLegendProps {
  min: number;
  max: number;
  colorScale: HeatmapColorScale;
  valueFormat: "currency" | "percent" | "number" | "correlation";
  decimals: number;
  currency: string;
  width?: number;
}

function ColorLegend({
  min,
  max,
  colorScale,
  valueFormat,
  decimals,
  currency,
  width = 200,
}: ColorLegendProps) {
  const steps = 20;
  const gradientColors = Array.from({ length: steps }, (_, i) => {
    const value = min + (max - min) * (i / (steps - 1));
    return getCellColor(value, min, max, colorScale);
  });

  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-4 rounded-sm"
        style={{
          width,
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCellValue(min, valueFormat, decimals, currency)}</span>
        {colorScale.mid && (
          <span>
            {formatCellValue((min + max) / 2, valueFormat, decimals, currency)}
          </span>
        )}
        <span>{formatCellValue(max, valueFormat, decimals, currency)}</span>
      </div>
    </div>
  );
}

/**
 * Heatmap component for 2D data visualization
 */
export function Heatmap({
  data,
  xLabels,
  yLabels,
  colorScale,
  valueFormat = "number",
  currency = "USD",
  decimals = 2,
  showValues = true,
  cellSize = 40,
  gap = 2,
  showLegend = true,
  minValue,
  maxValue,
  interactive = true,
  className,
  onCellClick,
}: HeatmapProps) {
  // Calculate min/max values
  const flatData = data.flat().filter((v) => !isNaN(v));
  const calculatedMin = minValue ?? Math.min(...flatData);
  const calculatedMax = maxValue ?? Math.max(...flatData);

  // Determine color scale
  const scale = React.useMemo((): HeatmapColorScale => {
    if (colorScale) return colorScale;

    // Auto-select based on format
    if (valueFormat === "correlation") {
      return defaultColorScales.correlation;
    }
    if (calculatedMin < 0 && calculatedMax > 0) {
      return defaultColorScales.performance;
    }
    return defaultColorScales.sequential;
  }, [colorScale, valueFormat, calculatedMin, calculatedMax]);

  // Calculate label width
  const labelWidth = yLabels
    ? Math.max(...yLabels.map((l) => l.length)) * 6 + 10
    : 0;
  const labelWidthPx = Math.min(Math.max(labelWidth, 60), 120);

  // Render cell with appropriate wrapper for tooltips
  const renderCell = (rowIdx: number, colIdx: number, value: number) => {
    const color = getCellColor(value, calculatedMin, calculatedMax, scale);
    const xLabel = xLabels?.[colIdx];
    const yLabel = yLabels?.[rowIdx];

    const tooltipContent = (
      <div className="text-sm">
        {yLabel && xLabel && (
          <p className="font-medium">
            {yLabel} / {xLabel}
          </p>
        )}
        <p className="tabular-nums">
          {formatCellValue(value, valueFormat, decimals, currency)}
        </p>
      </div>
    );

    return (
      <Tooltip key={`${rowIdx}-${colIdx}`}>
        <HeatmapCell
          value={value}
          row={rowIdx}
          col={colIdx}
          color={color}
          cellSize={cellSize}
          showValue={showValues && cellSize >= 30}
          valueFormat={valueFormat}
          decimals={decimals}
          currency={currency}
          interactive={interactive}
          xLabel={xLabel}
          yLabel={yLabel}
          onClick={onCellClick}
        />
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn("inline-flex flex-col gap-4", className)}>
        {/* Main grid area */}
        <div className="flex">
          {/* Y-axis labels */}
          {yLabels && (
            <div
              className="flex flex-col justify-end pr-2"
              style={{ gap, paddingBottom: xLabels ? cellSize + gap : 0 }}
            >
              {yLabels.map((label, idx) => (
                <div
                  key={`y-${idx}`}
                  className="flex items-center justify-end text-xs text-muted-foreground"
                  style={{ height: cellSize, width: labelWidthPx }}
                  title={label}
                >
                  {truncateLabel(label)}
                </div>
              ))}
            </div>
          )}

          {/* Grid and X-axis labels */}
          <div className="flex flex-col">
            {/* Data grid */}
            <div className="flex flex-col" style={{ gap }}>
              {data.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="flex" style={{ gap }}>
                  {row.map((value, colIdx) => renderCell(rowIdx, colIdx, value))}
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            {xLabels && (
              <div
                className="flex pt-2"
                style={{ gap, paddingLeft: yLabels ? 0 : 0 }}
              >
                {xLabels.map((label, idx) => (
                  <div
                    key={`x-${idx}`}
                    className="flex items-start justify-center text-xs text-muted-foreground"
                    style={{
                      width: cellSize,
                      transform: "rotate(-45deg)",
                      transformOrigin: "top left",
                      height: cellSize,
                    }}
                    title={label}
                  >
                    {truncateLabel(label, 6)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color legend */}
        {showLegend && (
          <div className="flex justify-center pt-2">
            <ColorLegend
              min={calculatedMin}
              max={calculatedMax}
              colorScale={scale}
              valueFormat={valueFormat}
              decimals={decimals}
              currency={currency}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

Heatmap.displayName = "Heatmap";

export default Heatmap;
