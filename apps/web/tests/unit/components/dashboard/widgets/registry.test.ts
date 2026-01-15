/**
 * Unit Tests for Widget Registry
 *
 * Tests the widget registry system including:
 * - Widget definitions and metadata
 * - Category configuration
 * - Grid configuration
 * - Registry helper functions
 * - Default layout
 */

import { describe, it, expect } from "vitest";
import {
  WIDGETS,
  WIDGET_CATEGORIES,
  SIZE_TO_SPAN,
  GRID_CONFIG,
  DEFAULT_LAYOUT,
  getWidget,
  getWidgetsByCategory,
  getAllWidgets,
  getCategoryConfig,
  isValidSize,
  getDefaultConfig,
} from "@/components/dashboard/widgets/registry";
import type {
  WidgetCategory,
  WidgetSize,
  WidgetDefinition,
} from "@/components/dashboard/widgets/types";

// =============================================================================
// Widget Definitions Tests
// =============================================================================

describe("WIDGETS registry", () => {
  describe("Widget definitions", () => {
    it("should have at least 8 widget definitions", () => {
      const widgetCount = Object.keys(WIDGETS).length;
      expect(widgetCount).toBeGreaterThanOrEqual(8);
    });

    it("should have all required widgets defined", () => {
      const requiredWidgets = [
        "summary-cards",
        "allocation-chart",
        "top-holdings",
        "performance-chart",
        "alerts",
        "market-brief",
        "quick-actions",
        "health-score",
      ];

      for (const widgetId of requiredWidgets) {
        const widget = WIDGETS[widgetId];
        expect(widget).toBeDefined();
        expect(widget!.id).toBe(widgetId);
      }
    });

    it("should have all required fields for each widget", () => {
      const requiredFields: (keyof WidgetDefinition)[] = [
        "id",
        "name",
        "description",
        "category",
        "icon",
        "defaultSize",
        "resizable",
        "configurable",
        "removable",
        "component",
      ];

      for (const [widgetId, widget] of Object.entries(WIDGETS)) {
        for (const field of requiredFields) {
          expect(widget[field], `${widgetId} missing ${field}`).toBeDefined();
        }
      }
    });

    it("should have valid widget IDs matching registry keys", () => {
      for (const [key, widget] of Object.entries(WIDGETS)) {
        expect(widget.id).toBe(key);
      }
    });

    it("should have valid categories for all widgets", () => {
      const validCategories: WidgetCategory[] = [
        "portfolio",
        "analytics",
        "intelligence",
        "actions",
      ];

      for (const widget of Object.values(WIDGETS)) {
        expect(validCategories).toContain(widget.category);
      }
    });

    it("should have valid sizes for all widgets", () => {
      const validSizes: WidgetSize[] = [
        "1x1",
        "2x1",
        "1x2",
        "2x2",
        "4x1",
        "4x2",
      ];

      for (const widget of Object.values(WIDGETS)) {
        expect(validSizes).toContain(widget.defaultSize);
        if (widget.minSize) {
          expect(validSizes).toContain(widget.minSize);
        }
        if (widget.maxSize) {
          expect(validSizes).toContain(widget.maxSize);
        }
      }
    });

    it("should have non-empty name and description for all widgets", () => {
      for (const widget of Object.values(WIDGETS)) {
        expect(widget.name.length).toBeGreaterThan(0);
        expect(widget.description.length).toBeGreaterThan(0);
      }
    });

    it("should have icon defined for all widgets", () => {
      for (const widget of Object.values(WIDGETS)) {
        expect(widget.icon).toBeDefined();
        // Lucide icons can be functions or objects (React components)
        expect(["function", "object"]).toContain(typeof widget.icon);
      }
    });

    it("should have component defined for all widgets", () => {
      for (const widget of Object.values(WIDGETS)) {
        expect(widget.component).toBeDefined();
        expect(typeof widget.component).toBe("function");
      }
    });
  });

  describe("Specific widget configurations", () => {
    it("summary-cards should be required (not removable)", () => {
      expect(WIDGETS["summary-cards"]!.removable).toBe(false);
    });

    it("summary-cards should not be configurable", () => {
      expect(WIDGETS["summary-cards"]!.configurable).toBe(false);
    });

    it("summary-cards should have size 4x1", () => {
      expect(WIDGETS["summary-cards"]!.defaultSize).toBe("4x1");
    });

    it("allocation-chart should be configurable", () => {
      expect(WIDGETS["allocation-chart"]!.configurable).toBe(true);
    });

    it("allocation-chart should have default config", () => {
      expect(WIDGETS["allocation-chart"]!.defaultConfig).toBeDefined();
    });

    it("quick-actions should have size 4x1", () => {
      expect(WIDGETS["quick-actions"]!.defaultSize).toBe("4x1");
    });

    it("health-score should have size 1x1", () => {
      expect(WIDGETS["health-score"]!.defaultSize).toBe("1x1");
    });
  });
});

// =============================================================================
// Widget Categories Tests
// =============================================================================

describe("WIDGET_CATEGORIES", () => {
  it("should have all 4 categories defined", () => {
    const categories: WidgetCategory[] = [
      "portfolio",
      "analytics",
      "intelligence",
      "actions",
    ];

    for (const category of categories) {
      expect(WIDGET_CATEGORIES[category]).toBeDefined();
    }
  });

  it("should have required fields for each category", () => {
    const requiredFields = ["name", "icon", "description", "color", "bgColor", "borderColor"];

    for (const [categoryId, config] of Object.entries(WIDGET_CATEGORIES)) {
      for (const field of requiredFields) {
        expect(
          config[field as keyof typeof config],
          `${categoryId} missing ${field}`
        ).toBeDefined();
      }
    }
  });

  it("should have portfolio category with blue theme", () => {
    expect(WIDGET_CATEGORIES.portfolio.color).toContain("blue");
    expect(WIDGET_CATEGORIES.portfolio.bgColor).toContain("blue");
    expect(WIDGET_CATEGORIES.portfolio.borderColor).toContain("blue");
  });

  it("should have analytics category with green theme", () => {
    expect(WIDGET_CATEGORIES.analytics.color).toContain("green");
    expect(WIDGET_CATEGORIES.analytics.bgColor).toContain("green");
    expect(WIDGET_CATEGORIES.analytics.borderColor).toContain("green");
  });

  it("should have intelligence category with purple theme", () => {
    expect(WIDGET_CATEGORIES.intelligence.color).toContain("purple");
    expect(WIDGET_CATEGORIES.intelligence.bgColor).toContain("purple");
    expect(WIDGET_CATEGORIES.intelligence.borderColor).toContain("purple");
  });

  it("should have actions category with amber theme", () => {
    expect(WIDGET_CATEGORIES.actions.color).toContain("amber");
    expect(WIDGET_CATEGORIES.actions.bgColor).toContain("amber");
    expect(WIDGET_CATEGORIES.actions.borderColor).toContain("amber");
  });

  it("should have icon defined for each category", () => {
    for (const config of Object.values(WIDGET_CATEGORIES)) {
      expect(config.icon).toBeDefined();
      // Lucide icons can be functions or objects (React components)
      expect(["function", "object"]).toContain(typeof config.icon);
    }
  });
});

// =============================================================================
// SIZE_TO_SPAN Tests
// =============================================================================

describe("SIZE_TO_SPAN mapping", () => {
  it("should have all valid sizes mapped", () => {
    const sizes: WidgetSize[] = ["1x1", "2x1", "1x2", "2x2", "4x1", "4x2"];

    for (const size of sizes) {
      expect(SIZE_TO_SPAN[size]).toBeDefined();
      expect(SIZE_TO_SPAN[size].cols).toBeGreaterThan(0);
      expect(SIZE_TO_SPAN[size].rows).toBeGreaterThan(0);
    }
  });

  it("should correctly map 1x1", () => {
    expect(SIZE_TO_SPAN["1x1"]).toEqual({ cols: 1, rows: 1 });
  });

  it("should correctly map 2x1", () => {
    expect(SIZE_TO_SPAN["2x1"]).toEqual({ cols: 2, rows: 1 });
  });

  it("should correctly map 1x2", () => {
    expect(SIZE_TO_SPAN["1x2"]).toEqual({ cols: 1, rows: 2 });
  });

  it("should correctly map 2x2", () => {
    expect(SIZE_TO_SPAN["2x2"]).toEqual({ cols: 2, rows: 2 });
  });

  it("should correctly map 4x1", () => {
    expect(SIZE_TO_SPAN["4x1"]).toEqual({ cols: 4, rows: 1 });
  });

  it("should correctly map 4x2", () => {
    expect(SIZE_TO_SPAN["4x2"]).toEqual({ cols: 4, rows: 2 });
  });
});

// =============================================================================
// GRID_CONFIG Tests
// =============================================================================

describe("GRID_CONFIG", () => {
  it("should have 4 columns by default", () => {
    expect(GRID_CONFIG.columns).toBe(4);
  });

  it("should have positive row height", () => {
    expect(GRID_CONFIG.rowHeight).toBeGreaterThan(0);
  });

  it("should have positive gap", () => {
    expect(GRID_CONFIG.gap).toBeGreaterThan(0);
  });

  it("should have all breakpoints defined", () => {
    expect(GRID_CONFIG.breakpoints.xl).toBeDefined();
    expect(GRID_CONFIG.breakpoints.lg).toBeDefined();
    expect(GRID_CONFIG.breakpoints.md).toBeDefined();
    expect(GRID_CONFIG.breakpoints.sm).toBeDefined();
  });

  it("should have valid columns for each breakpoint", () => {
    for (const breakpoint of Object.values(GRID_CONFIG.breakpoints)) {
      expect(breakpoint.columns).toBeGreaterThan(0);
      expect(breakpoint.columns).toBeLessThanOrEqual(4);
    }
  });

  it("should have sm breakpoint with 1 column", () => {
    expect(GRID_CONFIG.breakpoints.sm.columns).toBe(1);
  });

  it("should have md breakpoint with 2 columns", () => {
    expect(GRID_CONFIG.breakpoints.md.columns).toBe(2);
  });

  it("should have lg/xl breakpoints with 4 columns", () => {
    expect(GRID_CONFIG.breakpoints.lg.columns).toBe(4);
    expect(GRID_CONFIG.breakpoints.xl.columns).toBe(4);
  });
});

// =============================================================================
// DEFAULT_LAYOUT Tests
// =============================================================================

describe("DEFAULT_LAYOUT", () => {
  it("should have a valid id", () => {
    expect(DEFAULT_LAYOUT.id).toBe("default");
  });

  it("should have a name", () => {
    expect(DEFAULT_LAYOUT.name).toBe("Default");
  });

  it("should be marked as default", () => {
    expect(DEFAULT_LAYOUT.isDefault).toBe(true);
  });

  it("should have createdAt and updatedAt timestamps", () => {
    expect(DEFAULT_LAYOUT.createdAt).toBeDefined();
    expect(DEFAULT_LAYOUT.updatedAt).toBeDefined();
  });

  it("should have at least one widget", () => {
    expect(DEFAULT_LAYOUT.widgets.length).toBeGreaterThan(0);
  });

  it("should have unique widget instance IDs", () => {
    const ids = DEFAULT_LAYOUT.widgets.map((w) => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should reference valid widget definitions", () => {
    for (const instance of DEFAULT_LAYOUT.widgets) {
      expect(WIDGETS[instance.widgetId]).toBeDefined();
    }
  });

  it("should have summary-cards as the first widget", () => {
    expect(DEFAULT_LAYOUT.widgets[0]!.widgetId).toBe("summary-cards");
  });

  it("should have valid positions for all widgets", () => {
    for (const instance of DEFAULT_LAYOUT.widgets) {
      expect(instance.position.x).toBeGreaterThanOrEqual(0);
      expect(instance.position.y).toBeGreaterThanOrEqual(0);
      expect(instance.position.x).toBeLessThan(4);
    }
  });

  it("should have valid sizes for all widget instances", () => {
    const validSizes: WidgetSize[] = [
      "1x1",
      "2x1",
      "1x2",
      "2x2",
      "4x1",
      "4x2",
    ];

    for (const instance of DEFAULT_LAYOUT.widgets) {
      expect(validSizes).toContain(instance.size);
    }
  });
});

// =============================================================================
// Registry Helper Functions Tests
// =============================================================================

describe("getWidget", () => {
  it("should return widget definition for valid ID", () => {
    const widget = getWidget("summary-cards");
    expect(widget).toBeDefined();
    expect(widget?.id).toBe("summary-cards");
  });

  it("should return undefined for invalid ID", () => {
    const widget = getWidget("non-existent-widget");
    expect(widget).toBeUndefined();
  });
});

describe("getWidgetsByCategory", () => {
  it("should return widgets for portfolio category", () => {
    const widgets = getWidgetsByCategory("portfolio");
    expect(widgets.length).toBeGreaterThan(0);
    for (const widget of widgets) {
      expect(widget.category).toBe("portfolio");
    }
  });

  it("should return widgets for analytics category", () => {
    const widgets = getWidgetsByCategory("analytics");
    expect(widgets.length).toBeGreaterThan(0);
    for (const widget of widgets) {
      expect(widget.category).toBe("analytics");
    }
  });

  it("should return widgets for intelligence category", () => {
    const widgets = getWidgetsByCategory("intelligence");
    expect(widgets.length).toBeGreaterThan(0);
    for (const widget of widgets) {
      expect(widget.category).toBe("intelligence");
    }
  });

  it("should return widgets for actions category", () => {
    const widgets = getWidgetsByCategory("actions");
    expect(widgets.length).toBeGreaterThan(0);
    for (const widget of widgets) {
      expect(widget.category).toBe("actions");
    }
  });

  it("should return empty array for invalid category", () => {
    // @ts-expect-error Testing invalid input
    const widgets = getWidgetsByCategory("invalid");
    expect(widgets).toEqual([]);
  });
});

describe("getAllWidgets", () => {
  it("should return all widget definitions", () => {
    const widgets = getAllWidgets();
    expect(widgets.length).toBe(Object.keys(WIDGETS).length);
  });

  it("should return widgets as an array", () => {
    const widgets = getAllWidgets();
    expect(Array.isArray(widgets)).toBe(true);
  });
});

describe("getCategoryConfig", () => {
  it("should return config for valid category", () => {
    const config = getCategoryConfig("portfolio");
    expect(config).toBeDefined();
    expect(config?.name).toBe("Portfolio");
  });

  it("should return undefined for invalid category", () => {
    // @ts-expect-error Testing invalid input
    const config = getCategoryConfig("invalid");
    expect(config).toBeUndefined();
  });
});

describe("isValidSize", () => {
  it("should return true for valid sizes", () => {
    expect(isValidSize("1x1")).toBe(true);
    expect(isValidSize("2x1")).toBe(true);
    expect(isValidSize("1x2")).toBe(true);
    expect(isValidSize("2x2")).toBe(true);
    expect(isValidSize("4x1")).toBe(true);
    expect(isValidSize("4x2")).toBe(true);
  });

  it("should return false for invalid sizes", () => {
    expect(isValidSize("3x3")).toBe(false);
    expect(isValidSize("invalid")).toBe(false);
    expect(isValidSize("")).toBe(false);
  });
});

describe("getDefaultConfig", () => {
  it("should return default config for configurable widget", () => {
    const config = getDefaultConfig("allocation-chart");
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  it("should return empty object for non-configurable widget", () => {
    const config = getDefaultConfig("summary-cards");
    expect(config).toEqual({});
  });

  it("should return empty object for invalid widget ID", () => {
    const config = getDefaultConfig("non-existent");
    expect(config).toEqual({});
  });
});
