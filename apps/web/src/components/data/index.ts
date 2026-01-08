/**
 * Data Display Components Index
 *
 * Central export point for all data display components used
 * in the ARC Investment Platform.
 *
 * Import from "@/components/data" for a clean API.
 */

// Card Components
export {
  StatCard,
  StatCardSkeleton,
  type StatCardProps,
  type StatCardFormat,
} from "./StatCard";

export {
  RatioCard,
  RatioCardSkeleton,
  type RatioCardProps,
  type RatioClass,
  type RatioThresholds,
  type SparklinePoint,
  type TrendDirection as RatioTrendDirection,
} from "./RatioCard";

export {
  AlertCard,
  AlertCardSkeleton,
  type AlertCardProps,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
} from "./AlertCard";

export {
  PortfolioCard,
  PortfolioCardSkeleton,
  PortfolioCardList,
  type PortfolioCardProps,
  type PortfolioCardListProps,
  type Portfolio,
  type PortfolioType,
  type AllocationItem,
} from "./PortfolioCard";

// Row Components
export {
  HoldingRow,
  HoldingRowSkeleton,
  HoldingRowHeader,
  type HoldingRowProps,
  type HoldingRowHeaderProps,
  type Holding,
} from "./HoldingRow";

export {
  MetricRow,
  MetricRowSkeleton,
  MetricRowGroup,
  type MetricRowProps,
  type MetricRowGroupProps,
  type MetricFormat,
  type TrendDirection as MetricTrendDirection,
} from "./MetricRow";

// Table Components
export {
  DataTable,
  createSortableColumn,
  createCurrencyColumn,
  createPercentColumn,
  type DataTableProps,
} from "./DataTable";

// Badge Components
export {
  SeverityBadge,
  TrendBadge,
  RatioClassBadge,
  StatusBadge,
  AssetTypeBadge,
  type SeverityBadgeProps,
  type SeverityLevel,
  type TrendBadgeProps,
  type TrendDirection,
  type RatioClassBadgeProps,
  type RatioClass as BadgeRatioClass,
  type StatusBadgeProps,
  type StatusType,
  type AssetTypeBadgeProps,
  type AssetType,
} from "./badges";
