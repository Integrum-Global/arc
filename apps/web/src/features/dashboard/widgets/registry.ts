/**
 * Widget Registry
 *
 * Central registry for all dashboard widgets with definitions,
 * category theming, and grid configuration.
 *
 * Note: This is a minimal implementation for WidgetContainer.
 * Full widget definitions will be added in TODO-DASH-001.
 */

import type {
  WidgetCategory,
  WidgetSize,
  WidgetDefinition,
  CategoryConfig,
  GridSpan,
  GridConfig,
} from "../types";

// =============================================================================
// Widget Categories
// =============================================================================

/**
 * Category configuration with theming colors
 */
export const WIDGET_CATEGORIES: Record<WidgetCategory, CategoryConfig> = {
  portfolio: {
    name: "Portfolio",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  analytics: {
    name: "Analytics",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  intelligence: {
    name: "Intelligence",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  actions: {
    name: "Actions",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
};

// =============================================================================
// Size to Grid Span Mapping
// =============================================================================

/**
 * Maps widget sizes to grid column/row spans
 */
export const SIZE_TO_SPAN: Record<WidgetSize, GridSpan> = {
  "1x1": { cols: 1, rows: 1 },
  "2x1": { cols: 2, rows: 1 },
  "1x2": { cols: 1, rows: 2 },
  "2x2": { cols: 2, rows: 2 },
  "4x1": { cols: 4, rows: 1 },
  "4x2": { cols: 4, rows: 2 },
};

// =============================================================================
// Grid Configuration
// =============================================================================

/**
 * Grid system configuration with breakpoints
 */
export const GRID_CONFIG: GridConfig = {
  rowHeight: 180,
  gap: 16,
  breakpoints: {
    sm: { minWidth: 0, cols: 1 },
    md: { minWidth: 768, cols: 2 },
    lg: { minWidth: 1024, cols: 4 },
    xl: { minWidth: 1280, cols: 4 },
  },
};

// =============================================================================
// Widget Definitions
// =============================================================================

/**
 * All available widget definitions
 * Note: Components will be added in TODO-DASH-001
 */
export const WIDGETS: Record<string, WidgetDefinition> = {};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get widget definition by ID
 */
export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return WIDGETS[widgetId];
}

/**
 * Get category config
 */
export function getCategoryConfig(category: WidgetCategory): CategoryConfig {
  return WIDGET_CATEGORIES[category];
}

/**
 * Get grid span for size
 */
export function getSizeSpan(size: WidgetSize): GridSpan {
  return SIZE_TO_SPAN[size];
}

// Re-export types for convenience
export type { WidgetCategory, WidgetSize, WidgetDefinition, CategoryConfig };
