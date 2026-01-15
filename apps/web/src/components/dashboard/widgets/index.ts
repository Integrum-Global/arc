/**
 * Dashboard Widgets Module
 *
 * Exports the widget registry system including:
 * - Types for widget definitions and layouts
 * - Widget registry with all available widgets
 * - Category and grid configuration
 * - Helper functions for widget management
 */

// Types
export type {
  WidgetCategory,
  WidgetSize,
  WidgetProps,
  WidgetSettingsProps,
  WidgetDefinition,
  CategoryConfig,
  GridSpan,
  GridConfig,
  WidgetPosition,
  WidgetInstance,
  DashboardLayout,
  BreakpointConfig,
} from "./types";

// Registry
export {
  WIDGETS,
  WIDGET_CATEGORIES,
  SIZE_TO_SPAN,
  VALID_SIZES,
  GRID_CONFIG,
  DEFAULT_LAYOUT,
  getWidget,
  getWidgetsByCategory,
  getAllWidgets,
  getCategoryConfig,
  isValidSize,
  getDefaultConfig,
  getGridSpan,
  canAddWidget,
  getAllCategories,
} from "./registry";
