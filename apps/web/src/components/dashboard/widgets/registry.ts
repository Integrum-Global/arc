/**
 * Widget Registry
 *
 * Centralized registry for all dashboard widgets including:
 * - Widget definitions with metadata and constraints
 * - Category configuration with theming
 * - Grid configuration for layout
 * - Default dashboard layout
 * - Helper functions for widget management
 */

import {
  LayoutDashboard,
  PieChart,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Newspaper,
  Zap,
  Activity,
  Briefcase,
  Brain,
} from "lucide-react";

import type {
  WidgetCategory,
  WidgetSize,
  WidgetDefinition,
  WidgetProps,
  CategoryConfig,
  GridSpan,
  GridConfig,
  DashboardLayout,
} from "./types";

// Import existing dashboard components
import { SummaryCards } from "@/app/(dashboard)/dashboard/components/SummaryCards";
import { AllocationSection } from "@/app/(dashboard)/dashboard/components/AllocationSection";
import { PerformanceSection } from "@/app/(dashboard)/dashboard/components/PerformanceSection";
import { AlertsSection } from "@/app/(dashboard)/dashboard/components/AlertsSection";
import { BriefSection } from "@/app/(dashboard)/dashboard/components/BriefSection";
import { QuickActions } from "@/app/(dashboard)/dashboard/components/QuickActions";
import { ActionableAlertsWidget } from "@/app/(dashboard)/dashboard/components/ActionableAlertsWidget";

// Import widget settings components
import {
  AllocationChartSettings,
  PerformanceChartSettings,
  AlertsWidgetSettings,
  TopHoldingsSettings,
  BriefSettings,
} from "./settings";

// =============================================================================
// Placeholder Widgets (to be implemented)
// =============================================================================

/**
 * Top Holdings Widget - placeholder until full implementation
 * Displays largest positions by value
 */
function TopHoldingsWidget(_props: WidgetProps) {
  return null;
}

/**
 * Health Score Widget - placeholder until full implementation
 * Displays portfolio health indicator
 */
function HealthScoreWidget(_props: WidgetProps) {
  return null;
}

// =============================================================================
// Widget Definitions
// =============================================================================

/**
 * Complete widget registry with all available dashboard widgets
 */
export const WIDGETS: Record<string, WidgetDefinition> = {
  "summary-cards": {
    id: "summary-cards",
    name: "Portfolio Summary",
    description: "Key metrics: Total AUM, daily change, YTD return, health score",
    category: "portfolio",
    icon: LayoutDashboard,
    defaultSize: "4x1",
    resizable: false,
    configurable: false,
    removable: false, // Required widget - cannot be removed
    maxInstances: 1,
    component: SummaryCards as unknown as React.ComponentType<WidgetProps>,
  },

  "allocation-chart": {
    id: "allocation-chart",
    name: "Asset Allocation",
    description: "Sector and asset class breakdown with interactive donut chart",
    category: "portfolio",
    icon: PieChart,
    defaultSize: "2x2",
    minSize: "1x2",
    maxSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: {
      showLegend: true,
      colorScheme: "default",
      maxItems: 10,
      showPercentages: true,
    },
    component: AllocationSection as unknown as React.ComponentType<WidgetProps>,
    settingsComponent: AllocationChartSettings,
  },

  "top-holdings": {
    id: "top-holdings",
    name: "Top Holdings",
    description: "Largest positions sorted by market value",
    category: "portfolio",
    icon: BarChart3,
    defaultSize: "2x2",
    minSize: "2x1",
    maxSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: {
      limit: 5,
      showChange: true,
      showValue: true,
    },
    component: TopHoldingsWidget,
    settingsComponent: TopHoldingsSettings,
  },

  "performance-chart": {
    id: "performance-chart",
    name: "Performance",
    description: "Historical portfolio performance vs benchmark",
    category: "analytics",
    icon: TrendingUp,
    defaultSize: "2x2",
    minSize: "2x1",
    maxSize: "4x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: {
      timeRange: "YTD",
      showBenchmark: true,
      benchmarkSymbol: "SPY",
      chartType: "line",
    },
    component: PerformanceSection as unknown as React.ComponentType<WidgetProps>,
    settingsComponent: PerformanceChartSettings,
  },

  "alerts": {
    id: "alerts",
    name: "Active Alerts",
    description: "Actionable alerts requiring attention",
    category: "actions",
    icon: AlertCircle,
    defaultSize: "2x2",
    minSize: "2x1",
    maxSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: {
      maxAlerts: 5,
      showCriticalOnly: false,
      autoRefresh: true,
      refreshInterval: 30,
    },
    component: ActionableAlertsWidget as unknown as React.ComponentType<WidgetProps>,
    settingsComponent: AlertsWidgetSettings,
  },

  "market-brief": {
    id: "market-brief",
    name: "Market Brief",
    description: "AI-generated market summary and insights",
    category: "intelligence",
    icon: Newspaper,
    defaultSize: "2x2",
    minSize: "2x1",
    maxSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: {
      briefType: "morning",
      showInsights: true,
      showActions: true,
      updateFrequency: "daily",
    },
    component: BriefSection as unknown as React.ComponentType<WidgetProps>,
    settingsComponent: BriefSettings,
  },

  "quick-actions": {
    id: "quick-actions",
    name: "Quick Actions",
    description: "Common actions and data freshness indicator",
    category: "actions",
    icon: Zap,
    defaultSize: "4x1",
    resizable: false,
    configurable: false,
    removable: true,
    maxInstances: 1,
    component: QuickActions as unknown as React.ComponentType<WidgetProps>,
  },

  "health-score": {
    id: "health-score",
    name: "Health Score",
    description: "Portfolio health indicator with gauge visualization",
    category: "analytics",
    icon: Activity,
    defaultSize: "1x1",
    resizable: false,
    configurable: false,
    removable: true,
    maxInstances: 1,
    component: HealthScoreWidget,
  },
};

// =============================================================================
// Category Configuration
// =============================================================================

/**
 * Category configuration with theming colors and metadata
 */
export const WIDGET_CATEGORIES: Record<WidgetCategory, CategoryConfig> = {
  portfolio: {
    name: "Portfolio",
    icon: Briefcase,
    description: "Portfolio performance and holdings",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  analytics: {
    name: "Analytics",
    icon: BarChart3,
    description: "Financial ratios and metrics",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  intelligence: {
    name: "Intelligence",
    icon: Brain,
    description: "AI insights and recommendations",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  actions: {
    name: "Actions",
    icon: Zap,
    description: "Quick actions and alerts",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
};

// =============================================================================
// Size to Grid Span Mapping
// =============================================================================

/**
 * Maps widget size notation to grid span values
 */
export const SIZE_TO_SPAN: Record<WidgetSize, GridSpan> = {
  "1x1": { cols: 1, rows: 1 },
  "2x1": { cols: 2, rows: 1 },
  "1x2": { cols: 1, rows: 2 },
  "2x2": { cols: 2, rows: 2 },
  "4x1": { cols: 4, rows: 1 },
  "4x2": { cols: 4, rows: 2 },
};

/**
 * All valid widget sizes
 */
export const VALID_SIZES: WidgetSize[] = ["1x1", "2x1", "1x2", "2x2", "4x1", "4x2"];

// =============================================================================
// Grid Configuration
// =============================================================================

/**
 * Grid system configuration for dashboard layout
 */
export const GRID_CONFIG: GridConfig = {
  columns: 4,
  rowHeight: 180, // px
  gap: 16, // px

  breakpoints: {
    xl: { columns: 4, gap: 24 }, // >= 1280px
    lg: { columns: 4, gap: 16 }, // >= 1024px
    md: { columns: 2, gap: 16 }, // >= 768px
    sm: { columns: 1, gap: 12 }, // < 768px
  },
};

// =============================================================================
// Default Layout
// =============================================================================

/**
 * Default dashboard layout with standard widget arrangement
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  id: "default",
  name: "Default",
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  widgets: [
    // Row 1: Summary cards (full width)
    {
      id: "inst-1",
      widgetId: "summary-cards",
      position: { x: 0, y: 0 },
      size: "4x1",
      config: {},
    },

    // Row 2: Allocation + Performance
    {
      id: "inst-2",
      widgetId: "allocation-chart",
      position: { x: 0, y: 1 },
      size: "2x2",
      config: { chartType: "donut", showLegend: true },
    },
    {
      id: "inst-3",
      widgetId: "performance-chart",
      position: { x: 2, y: 1 },
      size: "2x2",
      config: { period: "YTD", showBenchmark: true },
    },

    // Row 3-4: Alerts + Brief
    {
      id: "inst-4",
      widgetId: "alerts",
      position: { x: 0, y: 3 },
      size: "2x2",
      config: { maxAlerts: 5 },
    },
    {
      id: "inst-5",
      widgetId: "market-brief",
      position: { x: 2, y: 3 },
      size: "2x2",
      config: { briefType: "morning" },
    },

    // Row 5: Quick actions (full width)
    {
      id: "inst-6",
      widgetId: "quick-actions",
      position: { x: 0, y: 5 },
      size: "4x1",
      config: {},
    },
  ],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get widget definition by ID
 */
export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGETS[id];
}

/**
 * Get all widgets in a category
 */
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return Object.values(WIDGETS).filter((widget) => widget.category === category);
}

/**
 * Get all widget definitions as an array
 */
export function getAllWidgets(): WidgetDefinition[] {
  return Object.values(WIDGETS);
}

/**
 * Get category configuration
 */
export function getCategoryConfig(category: WidgetCategory): CategoryConfig | undefined {
  return WIDGET_CATEGORIES[category];
}

/**
 * Check if a size string is valid
 */
export function isValidSize(size: string): size is WidgetSize {
  return VALID_SIZES.includes(size as WidgetSize);
}

/**
 * Get default configuration for a widget
 */
export function getDefaultConfig(widgetId: string): Record<string, unknown> {
  const widget = getWidget(widgetId);
  return widget?.defaultConfig ?? {};
}

/**
 * Get grid span for a widget size
 */
export function getGridSpan(size: WidgetSize): GridSpan {
  return SIZE_TO_SPAN[size];
}

/**
 * Check if a widget can have more instances
 */
export function canAddWidget(
  widgetId: string,
  currentInstances: { widgetId: string }[]
): boolean {
  const widget = getWidget(widgetId);
  if (!widget) return false;

  const maxInstances = widget.maxInstances ?? Infinity;
  const currentCount = currentInstances.filter((w) => w.widgetId === widgetId).length;

  return currentCount < maxInstances;
}

/**
 * Get all categories
 */
export function getAllCategories(): WidgetCategory[] {
  return Object.keys(WIDGET_CATEGORIES) as WidgetCategory[];
}
