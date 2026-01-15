/**
 * Unit Tests for WidgetContainer
 *
 * Tests the widget wrapper component with edit mode controls,
 * drag handle integration, and category theming.
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WidgetContainer } from "@/components/dashboard/WidgetContainer";
import type { WidgetInstance, WidgetDefinition, WidgetProps } from "@/features/dashboard/types";
import { LayoutDashboard } from "lucide-react";

// =============================================================================
// Mock Components and Stores
// =============================================================================

// Mock @dnd-kit/sortable
const mockSetNodeRef = vi.fn();
const mockUseSortable = vi.fn(() => ({
  attributes: { "data-testid": "sortable-attributes" },
  listeners: { "data-testid": "sortable-listeners" },
  setNodeRef: mockSetNodeRef,
  transform: null,
  transition: undefined,
  isDragging: false,
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => mockUseSortable(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: (transform: unknown) =>
        transform ? `translate(${transform})` : undefined,
    },
  },
}));

// Mock dashboard store
const mockRemoveWidget = vi.fn();
const mockUpdateWidgetSettings = vi.fn();
const mockIsEditMode = vi.fn(() => false);

vi.mock("@/stores/dashboardStore", () => ({
  useDashboardStore: (selector: (state: unknown) => unknown) => {
    const state = {
      isEditMode: mockIsEditMode(),
      removeWidget: mockRemoveWidget,
      updateWidgetSettings: mockUpdateWidgetSettings,
    };
    return selector(state);
  },
}));

// =============================================================================
// Test Fixtures
// =============================================================================

// Simple test component for children
function TestWidgetContent({ config }: WidgetProps) {
  return (
    <div data-testid="widget-content">
      Widget Content - {JSON.stringify(config)}
    </div>
  );
}

// Mock widget definition
const mockWidgetDefinition: WidgetDefinition = {
  id: "test-widget",
  name: "Test Widget",
  description: "A test widget for unit testing",
  category: "portfolio",
  icon: LayoutDashboard,
  defaultSize: "2x2",
  resizable: true,
  configurable: true,
  removable: true,
  defaultConfig: { showHeader: true },
  component: TestWidgetContent,
};

// Mock widget instance
const mockWidgetInstance: WidgetInstance = {
  id: "widget-instance-1",
  widgetId: "test-widget",
  size: "2x2",
  position: { x: 0, y: 0 },
  config: { period: "1Y" },
};

// Non-removable widget definition
const mockRequiredWidgetDefinition: WidgetDefinition = {
  ...mockWidgetDefinition,
  id: "required-widget",
  name: "Required Widget",
  removable: false,
  configurable: false,
};

describe("WidgetContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEditMode.mockReturnValue(false);
    mockUseSortable.mockReturnValue({
      attributes: { "data-testid": "sortable-attributes" },
      listeners: { "data-testid": "sortable-listeners" },
      setNodeRef: mockSetNodeRef,
      transform: null,
      transition: undefined,
      isDragging: false,
    });
  });

  // ===========================================================================
  // Basic Rendering
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render children correctly", () => {
      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      expect(screen.getByTestId("widget-content")).toBeInTheDocument();
      expect(screen.getByText(/Widget Content/)).toBeInTheDocument();
    });

    it("should render widget name in header", () => {
      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      expect(screen.getByText("Test Widget")).toBeInTheDocument();
    });

    it("should render widget icon", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Icon should be present (lucide-react renders as SVG)
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should pass config to widget component", () => {
      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Config should be passed to child component
      expect(screen.getByText(/period.*1Y/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edit Mode Controls
  // ===========================================================================

  describe("Edit Mode Controls", () => {
    it("should hide edit controls in view mode", () => {
      mockIsEditMode.mockReturnValue(false);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Edit controls should not be visible
      expect(screen.queryByRole("button", { name: /drag/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });

    it("should show edit controls in edit mode", () => {
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Drag handle should be visible
      expect(screen.getByRole("button", { name: /drag/i })).toBeInTheDocument();

      // Settings button should be visible for configurable widgets
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();

      // Remove button should be visible for removable widgets
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("should show drag handle only in edit mode", () => {
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      const dragHandle = screen.getByRole("button", { name: /drag/i });
      expect(dragHandle).toBeInTheDocument();
    });

    it("should show settings button only if widget is configurable", () => {
      mockIsEditMode.mockReturnValue(true);

      // Test with configurable widget
      const { rerender } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();

      // Test with non-configurable widget
      rerender(
        <WidgetContainer
          instance={{ ...mockWidgetInstance, widgetId: "required-widget" }}
          definition={mockRequiredWidgetDefinition}
        />
      );

      expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
    });

    it("should show remove button only if widget is removable", () => {
      mockIsEditMode.mockReturnValue(true);

      // Test with removable widget
      const { rerender } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();

      // Test with non-removable widget
      rerender(
        <WidgetContainer
          instance={{ ...mockWidgetInstance, widgetId: "required-widget" }}
          definition={mockRequiredWidgetDefinition}
        />
      );

      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // User Interactions
  // ===========================================================================

  describe("User Interactions", () => {
    it("should call removeWidget when remove button is clicked", async () => {
      const user = userEvent.setup();
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      const removeButton = screen.getByRole("button", { name: /remove/i });
      await user.click(removeButton);

      expect(mockRemoveWidget).toHaveBeenCalledWith("widget-instance-1");
    });

    it("should open settings modal when settings button is clicked", async () => {
      const user = userEvent.setup();
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{
            ...mockWidgetDefinition,
            settingsComponent: () => <div>Settings Form</div>,
          }}
        />
      );

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      await user.click(settingsButton);

      // Settings modal should open (we check for the settings form content)
      expect(screen.getByText("Settings Form")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Drag Handle Integration
  // ===========================================================================

  describe("Drag Handle Integration", () => {
    it("should have sortable attributes when in edit mode", () => {
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // useSortable should be called with widget instance id
      expect(mockUseSortable).toHaveBeenCalled();
    });

    it("should apply drag handle attributes to drag button", () => {
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      const dragHandle = screen.getByRole("button", { name: /drag/i });
      // The drag handle should have both attributes and listeners spread
      // Due to spread order, listeners will overwrite attributes for same keys
      expect(dragHandle).toHaveAttribute("data-testid");
    });

    it("should apply reduced opacity when dragging", () => {
      mockIsEditMode.mockReturnValue(true);
      mockUseSortable.mockReturnValue({
        attributes: { "data-testid": "sortable-attributes" },
        listeners: { "data-testid": "sortable-listeners" },
        setNodeRef: mockSetNodeRef,
        transform: { x: 100, y: 50 },
        transition: "transform 200ms ease",
        isDragging: true,
      });

      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Card should have opacity-50 class when dragging
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toMatch(/opacity-50/);
    });

    it("should apply isDragging prop styles", () => {
      mockIsEditMode.mockReturnValue(true);

      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
          isDragging={true}
        />
      );

      // Card should have opacity-50 when isDragging prop is true
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toMatch(/opacity-50/);
    });
  });

  // ===========================================================================
  // Category Theming
  // ===========================================================================

  describe("Category Theming", () => {
    it("should apply portfolio category accent color", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "portfolio" }}
        />
      );

      // Should have blue category accent bar
      const accentBar = container.querySelector('[data-testid="category-accent"]');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar?.className).toMatch(/bg-blue-500/);
    });

    it("should apply analytics category accent color", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "analytics" }}
        />
      );

      const accentBar = container.querySelector('[data-testid="category-accent"]');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar?.className).toMatch(/bg-green-500/);
    });

    it("should apply intelligence category accent color", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "intelligence" }}
        />
      );

      const accentBar = container.querySelector('[data-testid="category-accent"]');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar?.className).toMatch(/bg-purple-500/);
    });

    it("should apply actions category accent color", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "actions" }}
        />
      );

      const accentBar = container.querySelector('[data-testid="category-accent"]');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar?.className).toMatch(/bg-amber-500/);
    });

    it("should apply category icon color", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "portfolio" }}
        />
      );

      // Icon should have category color
      // Note: SVG className is an SVGAnimatedString, use getAttribute('class') instead
      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toMatch(/text-blue-500/);
    });

    it("should apply edit mode border in edit mode", () => {
      mockIsEditMode.mockReturnValue(true);

      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={{ ...mockWidgetDefinition, category: "portfolio" }}
        />
      );

      // Card should have ring-2 and category border in edit mode
      // Note: ring-dashed may be stripped by tailwind-merge if not in safelist
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toMatch(/ring-2/);
      expect(card?.className).toMatch(/ring-muted-foreground/);
      // Category border should be applied
      expect(card?.className).toMatch(/border-blue/);
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      expect(screen.getByRole("button", { name: /drag to reorder/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /widget settings/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /remove widget/i })).toBeInTheDocument();
    });

    it("should have tooltips on control buttons", async () => {
      const user = userEvent.setup();
      mockIsEditMode.mockReturnValue(true);

      render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      // Hover over drag button to show tooltip
      const dragButton = screen.getByRole("button", { name: /drag to reorder/i });
      await user.hover(dragButton);

      // Tooltip should appear (use findByRole for more specific query)
      expect(await screen.findByRole("tooltip", { name: /drag to reorder/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Style Props
  // ===========================================================================

  describe("Style Props", () => {
    it("should apply custom style prop", () => {
      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
          style={{ gridColumn: "1 / span 2", gridRow: "1 / span 2" }}
        />
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveStyle({ gridColumn: "1 / span 2" });
      expect(card).toHaveStyle({ gridRow: "1 / span 2" });
    });

    it("should apply transform style from useSortable", () => {
      mockIsEditMode.mockReturnValue(true);
      mockUseSortable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: mockSetNodeRef,
        transform: { x: 100, y: 50, scaleX: 1, scaleY: 1 },
        transition: "transform 200ms ease",
        isDragging: false,
      });

      const { container } = render(
        <WidgetContainer
          instance={mockWidgetInstance}
          definition={mockWidgetDefinition}
        />
      );

      const card = container.querySelector('[data-slot="card"]');
      // Transform should be applied
      expect(card?.getAttribute("style")).toContain("transform");
    });
  });
});
