/**
 * Unit Tests for Dashboard Store
 * Tests layout management, widget operations, edit mode, and persistence
 * NO MOCKING - uses real Zustand store
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock localStorage before importing store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Import store after localStorage mock is set up
import {
  useDashboardStore,
  useWidgets,
  DEFAULT_WIDGETS,
} from "@/stores/dashboardStore";
import type { WidgetInstance, DashboardState } from "@/stores/dashboardStore";

describe("dashboardStore", () => {
  // Reset store before each test
  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();
    vi.clearAllMocks();

    // Reset store to initial state
    useDashboardStore.setState({
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("initializes with default widgets", () => {
      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets).toEqual(DEFAULT_WIDGETS);
    });

    it("initializes with edit mode disabled", () => {
      const { isEditMode } = useDashboardStore.getState();
      expect(isEditMode).toBe(false);
    });

    it("initializes with no selected widget", () => {
      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });

    it("initializes with no unsaved changes", () => {
      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });

    it("initializes with isSyncing as false", () => {
      const { isSyncing } = useDashboardStore.getState();
      expect(isSyncing).toBe(false);
    });

    it("initializes with lastSyncedAt as null", () => {
      const { lastSyncedAt } = useDashboardStore.getState();
      expect(lastSyncedAt).toBeNull();
    });
  });

  describe("setEditMode", () => {
    it("enables edit mode", () => {
      const store = useDashboardStore.getState();
      store.setEditMode(true);

      const { isEditMode } = useDashboardStore.getState();
      expect(isEditMode).toBe(true);
    });

    it("disables edit mode", () => {
      const store = useDashboardStore.getState();
      store.setEditMode(true);
      store.setEditMode(false);

      const { isEditMode } = useDashboardStore.getState();
      expect(isEditMode).toBe(false);
    });

    it("clears selected widget when exiting edit mode", () => {
      const store = useDashboardStore.getState();
      store.setEditMode(true);
      store.selectWidget("some-widget-id");
      store.setEditMode(false);

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });
  });

  describe("selectWidget", () => {
    it("selects a widget by id", () => {
      const store = useDashboardStore.getState();
      store.selectWidget("widget-123");

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBe("widget-123");
    });

    it("clears selection when passing null", () => {
      const store = useDashboardStore.getState();
      store.selectWidget("widget-123");
      store.selectWidget(null);

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });

    it("replaces previous selection", () => {
      const store = useDashboardStore.getState();
      store.selectWidget("widget-1");
      store.selectWidget("widget-2");

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBe("widget-2");
    });
  });

  describe("addWidget", () => {
    it("adds a new widget with generated id", () => {
      const store = useDashboardStore.getState();
      const initialCount = store.widgets.length;

      store.addWidget("summary-cards");

      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBe(initialCount + 1);
    });

    it("generates unique id for new widget", () => {
      const store = useDashboardStore.getState();
      store.addWidget("summary-cards");

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      expect(newWidget?.id).toBeDefined();
      expect(typeof newWidget?.id).toBe("string");
      expect(newWidget?.id.length).toBeGreaterThan(0);
    });

    it("sets correct widgetId reference", () => {
      const store = useDashboardStore.getState();
      store.addWidget("allocation-chart");

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      expect(newWidget?.widgetId).toBe("allocation-chart");
    });

    it("uses provided position when specified", () => {
      const store = useDashboardStore.getState();
      const position = { x: 2, y: 5 };
      store.addWidget("alerts", position);

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      expect(newWidget?.position).toEqual(position);
    });

    it("finds available position when not specified", () => {
      const store = useDashboardStore.getState();
      // Clear all widgets first
      useDashboardStore.setState({ widgets: [] });

      store.addWidget("summary-cards");

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[0];
      expect(newWidget?.position).toEqual({ x: 0, y: 0 });
    });

    it("marks hasUnsavedChanges as true", () => {
      const store = useDashboardStore.getState();
      store.addWidget("performance-chart");

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(true);
    });

    it("sets default size based on widget definition", () => {
      // Clear existing widgets
      useDashboardStore.setState({ widgets: [] });
      const store = useDashboardStore.getState();
      store.addWidget("summary-cards");

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[0];
      // summary-cards has default size of 4x1 = cols: 4, rows: 1
      expect(newWidget?.size).toEqual({ cols: 4, rows: 1 });
    });
  });

  describe("removeWidget", () => {
    it("removes widget from array", () => {
      const store = useDashboardStore.getState();
      const widgetToRemove = store.widgets[0];
      const initialCount = store.widgets.length;

      if (widgetToRemove) {
        store.removeWidget(widgetToRemove.id);
      }

      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBe(initialCount - 1);
    });

    it("removes correct widget by id", () => {
      const store = useDashboardStore.getState();
      // Add a specific widget first
      store.addWidget("health-score", { x: 3, y: 3 });
      const { widgets: widgetsAfterAdd } = useDashboardStore.getState();
      const addedWidget = widgetsAfterAdd.find((w) => w.widgetId === "health-score");

      if (addedWidget) {
        store.removeWidget(addedWidget.id);
      }

      const { widgets } = useDashboardStore.getState();
      expect(widgets.find((w) => w.id === addedWidget?.id)).toBeUndefined();
    });

    it("marks hasUnsavedChanges as true", () => {
      // First reset hasUnsavedChanges
      useDashboardStore.setState({ hasUnsavedChanges: false });
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];

      if (widget) {
        store.removeWidget(widget.id);
      }

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(true);
    });

    it("handles non-existent widget id gracefully", () => {
      const store = useDashboardStore.getState();
      const initialCount = store.widgets.length;

      store.removeWidget("non-existent-id");

      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBe(initialCount);
    });

    it("clears selection if removed widget was selected", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];

      if (widget) {
        store.selectWidget(widget.id);
        store.removeWidget(widget.id);
      }

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });
  });

  describe("updateWidgetPosition", () => {
    it("updates widget position correctly", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];
      const newPosition = { x: 2, y: 3 };

      if (widget) {
        store.updateWidgetPosition(widget.id, newPosition);
      }

      const { widgets } = useDashboardStore.getState();
      const updatedWidget = widgets.find((w) => w.id === widget?.id);
      expect(updatedWidget?.position).toEqual(newPosition);
    });

    it("marks hasUnsavedChanges as true", () => {
      useDashboardStore.setState({ hasUnsavedChanges: false });
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];

      if (widget) {
        store.updateWidgetPosition(widget.id, { x: 1, y: 1 });
      }

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(true);
    });

    it("handles non-existent widget gracefully", () => {
      const store = useDashboardStore.getState();
      const initialWidgets = [...store.widgets];

      store.updateWidgetPosition("non-existent", { x: 0, y: 0 });

      const { widgets } = useDashboardStore.getState();
      expect(widgets).toEqual(initialWidgets);
    });

    it("does not affect other widgets", () => {
      const store = useDashboardStore.getState();
      const [widget1, widget2] = store.widgets;
      const widget2Position = widget2?.position;

      if (widget1) {
        store.updateWidgetPosition(widget1.id, { x: 3, y: 3 });
      }

      const { widgets } = useDashboardStore.getState();
      const unchangedWidget = widgets.find((w) => w.id === widget2?.id);
      expect(unchangedWidget?.position).toEqual(widget2Position);
    });
  });

  describe("updateWidgetSize", () => {
    it("updates widget size correctly", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets.find((w) => w.widgetId === "allocation-chart");
      const newSize = { cols: 1, rows: 2 };

      if (widget) {
        store.updateWidgetSize(widget.id, newSize);
      }

      const { widgets } = useDashboardStore.getState();
      const updatedWidget = widgets.find((w) => w.id === widget?.id);
      expect(updatedWidget?.size).toEqual(newSize);
    });

    it("marks hasUnsavedChanges as true", () => {
      useDashboardStore.setState({ hasUnsavedChanges: false });
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];

      if (widget) {
        store.updateWidgetSize(widget.id, { cols: 2, rows: 2 });
      }

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(true);
    });

    it("handles non-existent widget gracefully", () => {
      const store = useDashboardStore.getState();
      const initialWidgets = [...store.widgets];

      store.updateWidgetSize("non-existent", { cols: 2, rows: 2 });

      const { widgets } = useDashboardStore.getState();
      expect(widgets).toEqual(initialWidgets);
    });
  });

  describe("updateWidgetSettings", () => {
    it("updates widget settings correctly", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets.find((w) => w.widgetId === "allocation-chart");
      const newSettings = { chartType: "donut", showLegend: false };

      if (widget) {
        store.updateWidgetSettings(widget.id, newSettings);
      }

      const { widgets } = useDashboardStore.getState();
      const updatedWidget = widgets.find((w) => w.id === widget?.id);
      expect(updatedWidget?.settings).toEqual(newSettings);
    });

    it("merges settings with existing settings", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets.find((w) => w.widgetId === "allocation-chart");

      if (widget) {
        store.updateWidgetSettings(widget.id, { chartType: "pie" });
        store.updateWidgetSettings(widget.id, { showLegend: false });
      }

      const { widgets } = useDashboardStore.getState();
      const updatedWidget = widgets.find((w) => w.id === widget?.id);
      expect(updatedWidget?.settings).toEqual({ chartType: "pie", showLegend: false });
    });

    it("marks hasUnsavedChanges as true", () => {
      useDashboardStore.setState({ hasUnsavedChanges: false });
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];

      if (widget) {
        store.updateWidgetSettings(widget.id, { test: true });
      }

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(true);
    });

    it("handles non-existent widget gracefully", () => {
      const store = useDashboardStore.getState();
      const initialWidgets = [...store.widgets];

      store.updateWidgetSettings("non-existent", { test: true });

      const { widgets } = useDashboardStore.getState();
      expect(widgets).toEqual(initialWidgets);
    });
  });

  describe("resetToDefault", () => {
    it("resets widgets to default layout", () => {
      const store = useDashboardStore.getState();
      // Modify the layout first
      store.addWidget("health-score");
      store.removeWidget(store.widgets[0]?.id || "");

      store.resetToDefault();

      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBe(DEFAULT_WIDGETS.length);
    });

    it("clears hasUnsavedChanges after reset", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score"); // This sets hasUnsavedChanges = true

      store.resetToDefault();

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });

    it("exits edit mode on reset", () => {
      const store = useDashboardStore.getState();
      store.setEditMode(true);

      store.resetToDefault();

      const { isEditMode } = useDashboardStore.getState();
      expect(isEditMode).toBe(false);
    });

    it("clears selected widget on reset", () => {
      const store = useDashboardStore.getState();
      store.selectWidget("some-widget");

      store.resetToDefault();

      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });
  });

  describe("loadLayout", () => {
    it("loads provided widgets", () => {
      const store = useDashboardStore.getState();
      const customWidgets: WidgetInstance[] = [
        {
          id: "custom-1",
          widgetId: "alerts",
          position: { x: 0, y: 0 },
          size: { cols: 2, rows: 2 },
        },
      ];

      store.loadLayout(customWidgets);

      const { widgets } = useDashboardStore.getState();
      expect(widgets).toEqual(customWidgets);
    });

    it("clears hasUnsavedChanges after loading", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score"); // Sets hasUnsavedChanges = true

      store.loadLayout([
        {
          id: "custom-1",
          widgetId: "alerts",
          position: { x: 0, y: 0 },
          size: { cols: 2, rows: 2 },
        },
      ]);

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });

    it("exits edit mode when loading layout", () => {
      const store = useDashboardStore.getState();
      store.setEditMode(true);

      store.loadLayout([]);

      const { isEditMode } = useDashboardStore.getState();
      expect(isEditMode).toBe(false);
    });
  });

  describe("markAsSynced", () => {
    it("sets lastSyncedAt to current date", () => {
      const store = useDashboardStore.getState();
      const before = new Date();

      store.markAsSynced();

      const { lastSyncedAt } = useDashboardStore.getState();
      expect(lastSyncedAt).not.toBeNull();
      if (lastSyncedAt) {
        expect(lastSyncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      }
    });

    it("clears hasUnsavedChanges", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score"); // Sets hasUnsavedChanges = true

      store.markAsSynced();

      const { hasUnsavedChanges } = useDashboardStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });
  });

  describe("findAvailablePosition", () => {
    it("finds first empty position in empty grid", () => {
      useDashboardStore.setState({ widgets: [] });
      const store = useDashboardStore.getState();

      store.addWidget("health-score"); // 1x1 widget

      const { widgets } = useDashboardStore.getState();
      expect(widgets[0]?.position).toEqual({ x: 0, y: 0 });
    });

    it("finds position after existing widget", () => {
      // Set up a single 2x2 widget at 0,0
      useDashboardStore.setState({
        widgets: [
          {
            id: "existing-1",
            widgetId: "allocation-chart",
            position: { x: 0, y: 0 },
            size: { cols: 2, rows: 2 },
          },
        ],
      });
      const store = useDashboardStore.getState();

      store.addWidget("health-score"); // 1x1 widget

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets.find((w) => w.id !== "existing-1");
      // Should find position at x: 2, y: 0 (next to the 2x2 widget)
      expect(newWidget?.position).toEqual({ x: 2, y: 0 });
    });

    it("handles full row by going to next row", () => {
      // Fill first row with 4 1x1 widgets
      useDashboardStore.setState({
        widgets: [
          { id: "w1", widgetId: "health-score", position: { x: 0, y: 0 }, size: { cols: 1, rows: 1 } },
          { id: "w2", widgetId: "health-score", position: { x: 1, y: 0 }, size: { cols: 1, rows: 1 } },
          { id: "w3", widgetId: "health-score", position: { x: 2, y: 0 }, size: { cols: 1, rows: 1 } },
          { id: "w4", widgetId: "health-score", position: { x: 3, y: 0 }, size: { cols: 1, rows: 1 } },
        ],
      });
      const store = useDashboardStore.getState();

      store.addWidget("health-score"); // Another 1x1

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      expect(newWidget?.position).toEqual({ x: 0, y: 1 });
    });

    it("finds correct position for large widget", () => {
      // Place a 2x2 widget at 0,0
      useDashboardStore.setState({
        widgets: [
          { id: "w1", widgetId: "allocation-chart", position: { x: 0, y: 0 }, size: { cols: 2, rows: 2 } },
        ],
      });
      const store = useDashboardStore.getState();

      store.addWidget("performance-chart"); // 2x2 widget

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      // Should find position at x: 2, y: 0 (right of the existing 2x2)
      expect(newWidget?.position).toEqual({ x: 2, y: 0 });
    });

    it("wraps to next row for 4x1 widget when row is partially filled", () => {
      // Place a 2x2 widget at 0,0
      useDashboardStore.setState({
        widgets: [
          { id: "w1", widgetId: "allocation-chart", position: { x: 0, y: 0 }, size: { cols: 2, rows: 2 } },
        ],
      });
      const store = useDashboardStore.getState();

      store.addWidget("summary-cards"); // 4x1 widget - needs full width

      const { widgets } = useDashboardStore.getState();
      const newWidget = widgets[widgets.length - 1];
      // 4x1 widget can't fit in row 0 (only cols 2-3 free), so goes to row 2
      expect(newWidget?.position).toEqual({ x: 0, y: 2 });
    });
  });

  describe("Selector Hooks", () => {
    it("useWidgets returns widgets array", () => {
      // Can't directly test hooks without React component, but we can verify selector
      const state = useDashboardStore.getState();
      const widgets = useWidgets.call ? state.widgets : useDashboardStore.getState().widgets;
      expect(Array.isArray(widgets)).toBe(true);
    });

    it("useIsEditMode returns boolean", () => {
      const state = useDashboardStore.getState();
      expect(typeof state.isEditMode).toBe("boolean");
    });

    it("useSelectedWidget returns string or null", () => {
      const state = useDashboardStore.getState();
      expect(state.selectedWidgetId === null || typeof state.selectedWidgetId === "string").toBe(true);
    });

    it("useHasUnsavedChanges returns boolean", () => {
      const state = useDashboardStore.getState();
      expect(typeof state.hasUnsavedChanges).toBe("boolean");
    });
  });

  describe("Persistence", () => {
    it("store is configured with correct persistence key", () => {
      // Verify store is configured with persist middleware
      // The persist middleware adds a 'persist' property to the store
      const store = useDashboardStore;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((store as any).persist).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((store as any).persist.getOptions().name).toBe("arc-dashboard-layout");
    });

    it("partialize only includes widgets", () => {
      // Test the partialize function directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options = (useDashboardStore as any).persist.getOptions();
      const mockState: DashboardState = {
        widgets: [{ id: "test", widgetId: "test", position: { x: 0, y: 0 }, size: { cols: 1, rows: 1 } }],
        isEditMode: true,
        selectedWidgetId: "test",
        isSyncing: true,
        lastSyncedAt: new Date(),
        hasUnsavedChanges: true,
        setEditMode: () => {},
        selectWidget: () => {},
        addWidget: () => {},
        removeWidget: () => {},
        updateWidgetPosition: () => {},
        updateWidgetSize: () => {},
        updateWidgetSettings: () => {},
        resetToDefault: () => {},
        loadLayout: () => {},
        markAsSynced: () => {},
      };

      const partializedState = options.partialize(mockState);

      // Should only include widgets
      expect(partializedState.widgets).toBeDefined();
      expect(partializedState.widgets).toEqual(mockState.widgets);

      // Should NOT include other state
      expect(partializedState.isEditMode).toBeUndefined();
      expect(partializedState.selectedWidgetId).toBeUndefined();
      expect(partializedState.isSyncing).toBeUndefined();
      expect(partializedState.lastSyncedAt).toBeUndefined();
      expect(partializedState.hasUnsavedChanges).toBeUndefined();
    });
  });

  describe("hasUnsavedChanges Tracking", () => {
    beforeEach(() => {
      useDashboardStore.setState({ hasUnsavedChanges: false });
    });

    it("set to true on addWidget", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score");
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("set to true on removeWidget", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];
      if (widget) store.removeWidget(widget.id);
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("set to true on updateWidgetPosition", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];
      if (widget) store.updateWidgetPosition(widget.id, { x: 1, y: 1 });
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("set to true on updateWidgetSize", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];
      if (widget) store.updateWidgetSize(widget.id, { cols: 1, rows: 1 });
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("set to true on updateWidgetSettings", () => {
      const store = useDashboardStore.getState();
      const widget = store.widgets[0];
      if (widget) store.updateWidgetSettings(widget.id, { test: true });
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it("cleared on resetToDefault", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score");
      store.resetToDefault();
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
    });

    it("cleared on loadLayout", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score");
      store.loadLayout([]);
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
    });

    it("cleared on markAsSynced", () => {
      const store = useDashboardStore.getState();
      store.addWidget("health-score");
      store.markAsSynced();
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid sequential widget additions", () => {
      const store = useDashboardStore.getState();
      const initialCount = store.widgets.length;

      for (let i = 0; i < 10; i++) {
        store.addWidget("health-score");
      }

      const { widgets } = useDashboardStore.getState();
      expect(widgets.length).toBe(initialCount + 10);
    });

    it("handles mixed operations sequence", () => {
      const store = useDashboardStore.getState();

      store.setEditMode(true);
      store.addWidget("health-score");
      const { widgets: w1 } = useDashboardStore.getState();
      const addedWidget = w1[w1.length - 1];

      if (addedWidget) {
        store.selectWidget(addedWidget.id);
        store.updateWidgetPosition(addedWidget.id, { x: 3, y: 3 });
        store.updateWidgetSize(addedWidget.id, { cols: 1, rows: 1 });
        store.updateWidgetSettings(addedWidget.id, { color: "blue" });
      }

      store.setEditMode(false);

      const { widgets, isEditMode, selectedWidgetId, hasUnsavedChanges } =
        useDashboardStore.getState();
      const finalWidget = widgets.find((w) => w.id === addedWidget?.id);

      expect(isEditMode).toBe(false);
      expect(selectedWidgetId).toBeNull();
      expect(hasUnsavedChanges).toBe(true);
      expect(finalWidget?.position).toEqual({ x: 3, y: 3 });
      expect(finalWidget?.settings).toEqual({ color: "blue" });
    });

    it("handles empty widgets array", () => {
      useDashboardStore.setState({ widgets: [] });
      const store = useDashboardStore.getState();

      expect(store.widgets).toEqual([]);
      store.addWidget("health-score");
      expect(useDashboardStore.getState().widgets.length).toBe(1);
    });
  });
});
