/**
 * Widget System Type Definitions
 *
 * Defines the core types for the dashboard widget system including:
 * - Widget definitions and metadata
 * - Widget categories and theming
 * - Widget size constraints
 * - Widget instance state
 * - Dashboard layout configuration
 */

import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

// =============================================================================
// Core Widget Types
// =============================================================================

/**
 * Widget category for grouping and theming
 */
export type WidgetCategory = "portfolio" | "analytics" | "intelligence" | "actions";

/**
 * Standard widget size formats (cols x rows)
 */
export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2" | "4x1" | "4x2";

/**
 * Props passed to all widget components
 */
export interface WidgetProps {
  /** Widget instance configuration */
  config: Record<string, unknown>;
  /** Loading state indicator */
  isLoading?: boolean;
}

/**
 * Props for widget settings component
 */
export interface WidgetSettingsProps {
  /** Current widget configuration */
  config: Record<string, unknown>;
  /** Callback when configuration changes */
  onConfigChange: (config: Record<string, unknown>) => void;
}

/**
 * Widget definition - the blueprint for a widget type
 */
export interface WidgetDefinition {
  /** Unique widget identifier (e.g., "summary-cards", "allocation-chart") */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Brief description of the widget's purpose */
  description: string;
  /** Category for grouping and theming */
  category: WidgetCategory;
  /** Icon component from lucide-react */
  icon: LucideIcon;

  // Layout constraints
  /** Default size when adding to dashboard */
  defaultSize: WidgetSize;
  /** Minimum allowed size (optional) */
  minSize?: WidgetSize;
  /** Maximum allowed size (optional) */
  maxSize?: WidgetSize;
  /** Whether the widget can be resized */
  resizable: boolean;

  // Behavior flags
  /** Whether the widget has configurable settings */
  configurable: boolean;
  /** Whether the widget can be removed from dashboard */
  removable: boolean;
  /** Default configuration values */
  defaultConfig?: Record<string, unknown>;

  // Constraints
  /** Maximum number of instances allowed (default: 1) */
  maxInstances?: number;
  /** Required permission to view/add this widget */
  requiredPermission?: string;

  // Components
  /** The widget component to render */
  component: ComponentType<WidgetProps>;
  /** Optional settings component for configuration modal */
  settingsComponent?: ComponentType<WidgetSettingsProps>;
}

// =============================================================================
// Category Configuration
// =============================================================================

/**
 * Category configuration for theming
 */
export interface CategoryConfig {
  /** Display name for the category */
  name: string;
  /** Icon component */
  icon: LucideIcon;
  /** Brief description */
  description: string;
  /** Text color class (Tailwind) */
  color: string;
  /** Background color class (Tailwind) */
  bgColor: string;
  /** Border color class (Tailwind) */
  borderColor: string;
}

// =============================================================================
// Grid Configuration
// =============================================================================

/**
 * Grid span values for a size
 */
export interface GridSpan {
  cols: number;
  rows: number;
}

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  columns: number;
  gap: number;
}

/**
 * Grid system configuration
 */
export interface GridConfig {
  /** Default number of columns */
  columns: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Default gap between widgets in pixels */
  gap: number;
  /** Responsive breakpoint configurations */
  breakpoints: {
    xl: BreakpointConfig;
    lg: BreakpointConfig;
    md: BreakpointConfig;
    sm: BreakpointConfig;
  };
}

// =============================================================================
// Widget Instance Types
// =============================================================================

/**
 * Widget position on the grid
 */
export interface WidgetPosition {
  /** Column index (0-based) */
  x: number;
  /** Row index (0-based) */
  y: number;
}

/**
 * Widget instance - a placed widget on the dashboard
 */
export interface WidgetInstance {
  /** Unique instance ID */
  id: string;
  /** Reference to widget definition ID */
  widgetId: string;
  /** Grid position */
  position: WidgetPosition;
  /** Current size (may differ from default) */
  size: WidgetSize;
  /** Instance-specific configuration */
  config: Record<string, unknown>;
}

// =============================================================================
// Dashboard Layout Types
// =============================================================================

/**
 * Complete dashboard layout definition
 */
export interface DashboardLayout {
  /** Unique layout ID */
  id: string;
  /** User-defined layout name */
  name: string;
  /** Widget instances in this layout */
  widgets: WidgetInstance[];
  /** Whether this is the default layout */
  isDefault: boolean;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}
