/**
 * Dashboard Widget Types
 *
 * Core type definitions for the dashboard customization system.
 * These types define widget structures, layout configurations,
 * and settings interfaces.
 */

import type { LucideIcon } from "lucide-react";

// =============================================================================
// Widget Categories
// =============================================================================

/**
 * Widget category for grouping and theming
 */
export type WidgetCategory = "portfolio" | "analytics" | "intelligence" | "actions";

/**
 * Category configuration with theming
 */
export interface CategoryConfig {
  name: string;
  color: string;      // Text color class (e.g., "text-blue-500")
  bgColor: string;    // Background color class (e.g., "bg-blue-50")
  borderColor: string; // Border color class (e.g., "border-blue-200")
}

// =============================================================================
// Widget Sizes
// =============================================================================

/**
 * Available widget sizes in grid units (cols x rows)
 */
export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2" | "4x1" | "4x2";

/**
 * Grid span configuration
 */
export interface GridSpan {
  cols: number;
  rows: number;
}

// =============================================================================
// Widget Definition
// =============================================================================

/**
 * Props passed to widget components
 */
export interface WidgetProps {
  config: Record<string, unknown>;
}

/**
 * Props passed to widget settings components
 */
export interface WidgetSettingsProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

/**
 * Complete widget definition with metadata and component references
 */
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  resizable: boolean;
  configurable: boolean;
  removable: boolean;
  defaultConfig?: Record<string, unknown>;
  maxInstances?: number;
  requiredPermission?: string;
  component: React.ComponentType<WidgetProps>;
  settingsComponent?: React.ComponentType<WidgetSettingsProps>;
}

// =============================================================================
// Widget Instance
// =============================================================================

/**
 * Grid position
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * A specific instance of a widget in a layout
 */
export interface WidgetInstance {
  id: string;
  widgetId: string;
  size: WidgetSize;
  position: GridPosition;
  config: Record<string, unknown>;
}

// =============================================================================
// Dashboard Layout
// =============================================================================

/**
 * A complete dashboard layout containing widget instances
 */
export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: WidgetInstance[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Grid Configuration
// =============================================================================

/**
 * Responsive breakpoint configuration
 */
export interface Breakpoint {
  minWidth: number;
  cols: number;
}

/**
 * Grid system configuration
 */
export interface GridConfig {
  rowHeight: number;
  gap: number;
  breakpoints: Record<string, Breakpoint>;
}
