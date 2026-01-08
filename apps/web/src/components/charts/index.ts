/**
 * Chart Components
 *
 * Export all chart components and utilities for the ARC Investment Platform.
 */

// Chart Components
export { AllocationChart } from "./AllocationChart";
export type {
  AllocationChartProps,
  AllocationDataPoint,
} from "./AllocationChart";

export { PerformanceChart } from "./PerformanceChart";
export type {
  PerformanceChartProps,
  PerformanceDataPoint,
  PerformancePeriod,
} from "./PerformanceChart";

export { RatioTrendChart } from "./RatioTrendChart";
export type {
  RatioTrendChartProps,
  RatioDataPoint,
  RatioThresholds,
} from "./RatioTrendChart";

export { BarChart } from "./BarChart";
export type {
  BarChartProps,
  BarDataPoint,
  BarSortBy,
} from "./BarChart";

export { SparklineChart } from "./SparklineChart";
export type {
  SparklineChartProps,
  SparklineDataPoint,
} from "./SparklineChart";

export { GaugeChart } from "./GaugeChart";
export type {
  GaugeChartProps,
  GaugeThreshold,
} from "./GaugeChart";

export { Heatmap } from "./Heatmap";
export type {
  HeatmapProps,
  HeatmapData,
  HeatmapColorScale,
} from "./Heatmap";

export { ChartContainer } from "./ChartContainer";
export type { ChartContainerProps } from "./ChartContainer";

// Re-export chart utilities
export {
  CHART_COLORS,
  getSectorColor,
  getPerformanceColor,
  getThresholdColor,
  formatChartValue,
  formatChartDate,
  calculateAxisTicks,
  getAreaGradientDef,
  getHeatmapColor,
  interpolateColor,
  calculateTrend,
  chartColors,
} from "@/lib/chartUtils";
