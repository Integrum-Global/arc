/**
 * Dashboard Store - Global state management for dashboard layout customization
 * Based on docs/02-plans/11-dashboard-customization/01-architecture.md
 *
 * Features:
 * - Widget layout management (add, remove, move, resize)
 * - Edit mode state
 * - localStorage persistence via Zustand persist middleware
 * - hasUnsavedChanges tracking for sync status
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

/**
 * Widget instance placed on the dashboard
 */
export interface WidgetInstance {
  id: string; // Unique instance ID (UUID)
  widgetId: string; // Reference to widget definition
  position: { x: number; y: number }; // Grid position (column, row)
  size: { cols: number; rows: number }; // Grid span
  settings?: Record<string, unknown>; // Widget-specific configuration
}

/**
 * Dashboard state interface
 */
export interface DashboardState {
  // Layout
  widgets: WidgetInstance[];

  // Edit mode
  isEditMode: boolean;
  selectedWidgetId: string | null;

  // Sync state
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasUnsavedChanges: boolean;

  // Actions
  setEditMode: (enabled: boolean) => void;
  selectWidget: (id: string | null) => void;

  // Widget management
  addWidget: (widgetId: string, position?: { x: number; y: number }) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, size: { cols: number; rows: number }) => void;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void;

  // Layout management
  resetToDefault: () => void;
  loadLayout: (widgets: WidgetInstance[]) => void;

  // Sync
  markAsSynced: () => void;
}

// ============================================================================
// Widget Size Configuration
// ============================================================================

/**
 * Size to grid span mapping
 * Based on docs/02-plans/11-dashboard-customization/01-architecture.md Section 4
 */
type WidgetSizeKey = "1x1" | "2x1" | "1x2" | "2x2" | "4x1" | "4x2";

const SIZE_TO_SPAN: Record<WidgetSizeKey, { cols: number; rows: number }> = {
  "1x1": { cols: 1, rows: 1 },
  "2x1": { cols: 2, rows: 1 },
  "1x2": { cols: 1, rows: 2 },
  "2x2": { cols: 2, rows: 2 },
  "4x1": { cols: 4, rows: 1 },
  "4x2": { cols: 4, rows: 2 },
};

/**
 * Widget default sizes by widget ID
 * From docs/02-plans/11-dashboard-customization/01-architecture.md Section 3
 */
const WIDGET_DEFAULT_SIZES: Record<string, WidgetSizeKey> = {
  "summary-cards": "4x1",
  "allocation-chart": "2x2",
  "top-holdings": "2x2",
  "performance-chart": "2x2",
  alerts: "2x2",
  "market-brief": "2x2",
  "quick-actions": "4x1",
  "health-score": "1x1",
};

/**
 * Grid configuration
 */
const GRID_COLUMNS = 4;

// ============================================================================
// Default Layout
// ============================================================================

/**
 * Default dashboard layout from architecture docs
 * Based on docs/02-plans/11-dashboard-customization/01-architecture.md Section 4.3
 */
export const DEFAULT_WIDGETS: WidgetInstance[] = [
  // Row 1: Summary cards (full width)
  {
    id: "inst-1",
    widgetId: "summary-cards",
    position: { x: 0, y: 0 },
    size: { cols: 4, rows: 1 },
  },

  // Row 2: Allocation + Performance
  {
    id: "inst-2",
    widgetId: "allocation-chart",
    position: { x: 0, y: 1 },
    size: { cols: 2, rows: 2 },
    settings: { chartType: "pie", showLegend: true },
  },
  {
    id: "inst-3",
    widgetId: "performance-chart",
    position: { x: 2, y: 1 },
    size: { cols: 2, rows: 2 },
    settings: { period: "1Y", showBenchmark: true },
  },

  // Row 3: Alerts + Brief
  {
    id: "inst-4",
    widgetId: "alerts",
    position: { x: 0, y: 3 },
    size: { cols: 2, rows: 2 },
    settings: { maxAlerts: 5 },
  },
  {
    id: "inst-5",
    widgetId: "market-brief",
    position: { x: 2, y: 3 },
    size: { cols: 2, rows: 2 },
    settings: { briefType: "morning" },
  },

  // Row 4: Quick actions
  {
    id: "inst-6",
    widgetId: "quick-actions",
    position: { x: 0, y: 5 },
    size: { cols: 4, rows: 1 },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for widget instances
 */
function generateId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get default size for a widget type
 */
function getDefaultSize(widgetId: string): { cols: number; rows: number } {
  const sizeKey = WIDGET_DEFAULT_SIZES[widgetId] || "2x2";
  return SIZE_TO_SPAN[sizeKey];
}

/**
 * Find the first available position in the grid for a widget of given size
 * Scans the grid row by row, column by column to find a free spot
 *
 * @param widgets - Current widgets on the grid
 * @param size - Size of the widget to place
 * @returns Position where the widget can be placed
 */
function findAvailablePosition(
  widgets: WidgetInstance[],
  size: { cols: number; rows: number }
): { x: number; y: number } {
  // Build a set of occupied cells
  const occupied = new Set<string>();

  for (const widget of widgets) {
    for (let dy = 0; dy < widget.size.rows; dy++) {
      for (let dx = 0; dx < widget.size.cols; dx++) {
        occupied.add(`${widget.position.x + dx},${widget.position.y + dy}`);
      }
    }
  }

  // Scan grid to find first position that fits
  for (let y = 0; y < 100; y++) {
    // Limit scan to 100 rows
    for (let x = 0; x <= GRID_COLUMNS - size.cols; x++) {
      let fits = true;

      // Check if all cells for the widget size are free
      for (let dy = 0; dy < size.rows && fits; dy++) {
        for (let dx = 0; dx < size.cols && fits; dx++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            fits = false;
          }
        }
      }

      if (fits) {
        return { x, y };
      }
    }
  }

  // Fallback: place at bottom
  return { x: 0, y: widgets.length };
}

// ============================================================================
// Store Creation
// ============================================================================

/**
 * Dashboard Store with Zustand persist middleware
 * Persists only widgets to localStorage
 */
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial State
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,

      // Edit Mode Actions
      setEditMode: (enabled: boolean) => {
        set({
          isEditMode: enabled,
          // Clear selection when exiting edit mode
          selectedWidgetId: enabled ? get().selectedWidgetId : null,
        });
      },

      selectWidget: (id: string | null) => {
        set({ selectedWidgetId: id });
      },

      // Widget Management Actions
      addWidget: (widgetId: string, position?: { x: number; y: number }) => {
        const size = getDefaultSize(widgetId);
        const actualPosition = position ?? findAvailablePosition(get().widgets, size);

        const newWidget: WidgetInstance = {
          id: generateId(),
          widgetId,
          position: actualPosition,
          size,
        };

        set((state) => ({
          widgets: [...state.widgets, newWidget],
          hasUnsavedChanges: true,
        }));
      },

      removeWidget: (id: string) => {
        const state = get();
        const widgetExists = state.widgets.some((w) => w.id === id);

        if (!widgetExists) {
          return; // No change if widget doesn't exist
        }

        set({
          widgets: state.widgets.filter((w) => w.id !== id),
          hasUnsavedChanges: true,
          // Clear selection if removed widget was selected
          selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
        });
      },

      updateWidgetPosition: (id: string, position: { x: number; y: number }) => {
        const state = get();
        const widgetExists = state.widgets.some((w) => w.id === id);

        if (!widgetExists) {
          return; // No change if widget doesn't exist
        }

        set({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, position } : w
          ),
          hasUnsavedChanges: true,
        });
      },

      updateWidgetSize: (id: string, size: { cols: number; rows: number }) => {
        const state = get();
        const widgetExists = state.widgets.some((w) => w.id === id);

        if (!widgetExists) {
          return; // No change if widget doesn't exist
        }

        set({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, size } : w)),
          hasUnsavedChanges: true,
        });
      },

      updateWidgetSettings: (id: string, settings: Record<string, unknown>) => {
        const state = get();
        const widgetExists = state.widgets.some((w) => w.id === id);

        if (!widgetExists) {
          return; // No change if widget doesn't exist
        }

        set({
          widgets: state.widgets.map((w) =>
            w.id === id
              ? { ...w, settings: { ...w.settings, ...settings } }
              : w
          ),
          hasUnsavedChanges: true,
        });
      },

      // Layout Management Actions
      resetToDefault: () => {
        set({
          widgets: [...DEFAULT_WIDGETS],
          isEditMode: false,
          selectedWidgetId: null,
          hasUnsavedChanges: false,
        });
      },

      loadLayout: (widgets: WidgetInstance[]) => {
        set({
          widgets,
          isEditMode: false,
          selectedWidgetId: null,
          hasUnsavedChanges: false,
        });
      },

      // Sync Actions
      markAsSynced: () => {
        set({
          lastSyncedAt: new Date(),
          hasUnsavedChanges: false,
        });
      },
    }),
    {
      name: "arc-dashboard-layout",
      // Only persist widgets array, not UI state
      partialize: (state) => ({ widgets: state.widgets }),
    }
  )
);

// ============================================================================
// Selector Hooks (Optimized)
// ============================================================================

/**
 * Get all widgets
 */
export const useWidgets = () => useDashboardStore((state) => state.widgets);

/**
 * Get edit mode status
 */
export const useIsEditMode = () => useDashboardStore((state) => state.isEditMode);

/**
 * Get selected widget ID
 */
export const useSelectedWidget = () => useDashboardStore((state) => state.selectedWidgetId);

/**
 * Get unsaved changes status
 */
export const useHasUnsavedChanges = () => useDashboardStore((state) => state.hasUnsavedChanges);

/**
 * Get syncing status
 */
export const useIsSyncing = () => useDashboardStore((state) => state.isSyncing);

/**
 * Get last synced timestamp
 */
export const useLastSyncedAt = () => useDashboardStore((state) => state.lastSyncedAt);
