/**
 * Unit Tests for WidgetPicker
 *
 * Tests the widget picker sidebar component for browsing and adding widgets
 * to the dashboard, organized by category.
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WidgetPicker } from "@/components/dashboard/WidgetPicker";

// =============================================================================
// Mock Dashboard Store
// =============================================================================

const mockAddWidget = vi.fn();
const mockWidgets = [
  { id: "inst-1", widgetId: "summary-cards", position: { x: 0, y: 0 }, size: { cols: 4, rows: 1 } },
  { id: "inst-2", widgetId: "allocation-chart", position: { x: 0, y: 1 }, size: { cols: 2, rows: 2 } },
];

vi.mock("@/stores/dashboardStore", () => ({
  useDashboardStore: (selector: (state: unknown) => unknown) => {
    const state = {
      widgets: mockWidgets,
      addWidget: mockAddWidget,
    };
    return selector(state);
  },
  useWidgets: () => mockWidgets,
}));

// =============================================================================
// Mock Widget Registry
// =============================================================================

vi.mock("@/components/dashboard/widgets/registry", () => {
  const { LayoutDashboard, PieChart, TrendingUp, AlertCircle, Newspaper, Zap, Activity, BarChart3, Briefcase, Brain } = require("lucide-react");

  const WIDGETS: Record<string, unknown> = {
    "summary-cards": {
      id: "summary-cards",
      name: "Portfolio Summary",
      description: "Key metrics: Total AUM, daily change, YTD return, health score",
      category: "portfolio",
      icon: LayoutDashboard,
      defaultSize: "4x1",
      resizable: false,
      configurable: false,
      removable: false,
      maxInstances: 1,
    },
    "allocation-chart": {
      id: "allocation-chart",
      name: "Asset Allocation",
      description: "Sector and asset class breakdown with interactive donut chart",
      category: "portfolio",
      icon: PieChart,
      defaultSize: "2x2",
      resizable: true,
      configurable: true,
      removable: true,
    },
    "performance-chart": {
      id: "performance-chart",
      name: "Performance",
      description: "Historical portfolio performance vs benchmark",
      category: "analytics",
      icon: TrendingUp,
      defaultSize: "2x2",
      resizable: true,
      configurable: true,
      removable: true,
    },
    "alerts": {
      id: "alerts",
      name: "Active Alerts",
      description: "Actionable alerts requiring attention",
      category: "actions",
      icon: AlertCircle,
      defaultSize: "2x2",
      resizable: true,
      configurable: true,
      removable: true,
    },
    "market-brief": {
      id: "market-brief",
      name: "Market Brief",
      description: "AI-generated market summary and insights",
      category: "intelligence",
      icon: Newspaper,
      defaultSize: "2x2",
      resizable: true,
      configurable: true,
      removable: true,
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
    },
  };

  const WIDGET_CATEGORIES: Record<string, unknown> = {
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

  return {
    WIDGETS,
    WIDGET_CATEGORIES,
    getAllCategories: () => ["portfolio", "analytics", "intelligence", "actions"],
    getWidgetsByCategory: (category: string) =>
      Object.values(WIDGETS).filter((w: { category: string }) => w.category === category),
    getAllWidgets: () => Object.values(WIDGETS),
    canAddWidget: (widgetId: string, instances: { widgetId: string }[]) => {
      const widget = WIDGETS[widgetId] as { maxInstances?: number };
      if (!widget) return false;
      const maxInstances = widget.maxInstances ?? Infinity;
      const count = instances.filter((w) => w.widgetId === widgetId).length;
      return count < maxInstances;
    },
  };
});

// =============================================================================
// Test Suite
// =============================================================================

describe("WidgetPicker", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Basic Rendering
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render when open is true", () => {
      render(<WidgetPicker {...defaultProps} />);

      expect(screen.getByText("Add Widget")).toBeInTheDocument();
    });

    it("should not render content when open is false", () => {
      render(<WidgetPicker {...defaultProps} open={false} />);

      // Sheet content should not be visible
      expect(screen.queryByText("Add Widget")).not.toBeInTheDocument();
    });

    it("should render search input", () => {
      render(<WidgetPicker {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search widgets/i)).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Sheet has a close button with sr-only text "Close"
      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Category Rendering
  // ===========================================================================

  describe("Category Rendering", () => {
    it("should render all categories", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Categories are rendered with uppercase text via CSS (uppercase class)
      expect(screen.getByText("Portfolio")).toBeInTheDocument();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.getByText("Intelligence")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should render category color indicators", () => {
      const { baseElement } = render(<WidgetPicker {...defaultProps} />);

      // Each category should have a color dot (sheet is in portal so use baseElement)
      const colorDots = baseElement.querySelectorAll('[data-testid="category-dot"]');
      expect(colorDots.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ===========================================================================
  // Widget Rendering
  // ===========================================================================

  describe("Widget Rendering", () => {
    it("should render widgets grouped by category", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Portfolio category widgets
      expect(screen.getByText("Portfolio Summary")).toBeInTheDocument();
      expect(screen.getByText("Asset Allocation")).toBeInTheDocument();

      // Analytics category widgets
      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.getByText("Health Score")).toBeInTheDocument();

      // Intelligence category widgets
      expect(screen.getByText("Market Brief")).toBeInTheDocument();

      // Actions category widgets
      expect(screen.getByText("Active Alerts")).toBeInTheDocument();
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should render widget descriptions", () => {
      render(<WidgetPicker {...defaultProps} />);

      expect(screen.getByText(/Sector and asset class breakdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Historical portfolio performance/i)).toBeInTheDocument();
    });

    it("should render widget icons", () => {
      const { container } = render(<WidgetPicker {...defaultProps} />);

      // Each widget card should have an icon (SVG)
      const widgetCards = container.querySelectorAll('[data-testid="widget-card"]');
      widgetCards.forEach((card) => {
        expect(card.querySelector("svg")).toBeInTheDocument();
      });
    });

    it("should show Required badge for non-removable widgets", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Portfolio Summary is not removable
      const requiredBadges = screen.getAllByText("Required");
      expect(requiredBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // Add Widget Functionality
  // ===========================================================================

  describe("Add Widget Functionality", () => {
    it("should show Add button for widgets that can be added", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Performance chart is not yet added (not in mockWidgets)
      const performanceCard = screen.getByText("Performance").closest('[data-testid="widget-card"]');
      const addButton = within(performanceCard!).getByRole("button", { name: /add/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toBeDisabled();
    });

    it("should call addWidget when Add button is clicked", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      // Find a widget that's not yet added
      const performanceCard = screen.getByText("Performance").closest('[data-testid="widget-card"]');
      const addButton = within(performanceCard!).getByRole("button", { name: /add/i });

      await user.click(addButton);

      expect(mockAddWidget).toHaveBeenCalledWith("performance-chart");
    });

    it("should show Added state for widgets at max instances", () => {
      render(<WidgetPicker {...defaultProps} />);

      // summary-cards is already added and has maxInstances: 1
      const summaryCard = screen.getByText("Portfolio Summary").closest('[data-testid="widget-card"]');
      const addedButton = within(summaryCard!).getByRole("button", { name: /added/i });
      expect(addedButton).toBeDisabled();
    });

    it("should disable Add button for widgets at max instances", () => {
      render(<WidgetPicker {...defaultProps} />);

      // summary-cards is already added and has maxInstances: 1
      const summaryCard = screen.getByText("Portfolio Summary").closest('[data-testid="widget-card"]');
      const button = within(summaryCard!).getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should show check icon for already added widgets", () => {
      const { container } = render(<WidgetPicker {...defaultProps} />);

      // summary-cards is already added
      const summaryCard = screen.getByText("Portfolio Summary").closest('[data-testid="widget-card"]');
      const checkIcon = summaryCard?.querySelector('[data-testid="check-icon"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Search Functionality
  // ===========================================================================

  describe("Search Functionality", () => {
    it("should filter widgets by name when searching", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      await user.type(searchInput, "Performance");

      // Only Performance widget should be visible
      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.queryByText("Asset Allocation")).not.toBeInTheDocument();
      expect(screen.queryByText("Portfolio Summary")).not.toBeInTheDocument();
    });

    it("should filter widgets by description when searching", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      await user.type(searchInput, "benchmark");

      // Performance widget has "benchmark" in description
      expect(screen.getByText("Performance")).toBeInTheDocument();
    });

    it("should be case-insensitive when searching", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      await user.type(searchInput, "ALERTS");

      expect(screen.getByText("Active Alerts")).toBeInTheDocument();
    });

    it("should hide empty categories when search filters out all widgets", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      await user.type(searchInput, "Performance");

      // Only Analytics category should be visible (Performance is in analytics)
      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.queryByText("Portfolio")).not.toBeInTheDocument();
      expect(screen.queryByText("Intelligence")).not.toBeInTheDocument();
      expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    });

    it("should show all widgets when search is cleared", async () => {
      const user = userEvent.setup();
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      await user.type(searchInput, "Performance");
      await user.clear(searchInput);

      // All widgets should be visible again
      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.getByText("Asset Allocation")).toBeInTheDocument();
      expect(screen.getByText("Portfolio Summary")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Sheet Behavior
  // ===========================================================================

  describe("Sheet Behavior", () => {
    it("should call onOpenChange when close button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<WidgetPicker open={true} onOpenChange={onOpenChange} />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should have correct width (w-96)", () => {
      const { baseElement } = render(<WidgetPicker {...defaultProps} />);

      // Sheet content should have w-96 class (384px)
      const sheetContent = baseElement.querySelector('[data-slot="sheet-content"]');
      expect(sheetContent).toBeInTheDocument();
      expect(sheetContent?.getAttribute("class")).toMatch(/w-96/);
    });

    it("should be positioned on the right side", () => {
      const { baseElement } = render(<WidgetPicker {...defaultProps} />);

      // Sheet should slide in from right
      const sheetContent = baseElement.querySelector('[data-slot="sheet-content"]');
      expect(sheetContent).toBeInTheDocument();
      expect(sheetContent?.getAttribute("class")).toMatch(/right-0/);
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible sheet title", () => {
      render(<WidgetPicker {...defaultProps} />);

      expect(screen.getByRole("heading", { name: "Add Widget" })).toBeInTheDocument();
    });

    it("should have accessible search input", () => {
      render(<WidgetPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search widgets/i);
      expect(searchInput).toHaveAttribute("type", "text");
    });

    it("should have accessible Add buttons with widget name context", () => {
      render(<WidgetPicker {...defaultProps} />);

      // Each widget should have an accessible add button
      const addButtons = screen.getAllByRole("button", { name: /add/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Category Styling
  // ===========================================================================

  describe("Category Styling", () => {
    it("should apply category background color to widget cards", () => {
      const { container } = render(<WidgetPicker {...defaultProps} />);

      // Find a portfolio widget card
      const portfolioCard = screen.getByText("Asset Allocation").closest('[data-testid="widget-card"]');
      expect(portfolioCard?.className).toMatch(/bg-blue/);
    });

    it("should apply category border color to widget cards", () => {
      const { container } = render(<WidgetPicker {...defaultProps} />);

      // Find a portfolio widget card
      const portfolioCard = screen.getByText("Asset Allocation").closest('[data-testid="widget-card"]');
      expect(portfolioCard?.className).toMatch(/border-blue/);
    });

    it("should apply category icon color", () => {
      const { container } = render(<WidgetPicker {...defaultProps} />);

      // Find an icon container with category color
      const portfolioCard = screen.getByText("Asset Allocation").closest('[data-testid="widget-card"]');
      const iconContainer = portfolioCard?.querySelector('[data-testid="widget-icon"]');
      expect(iconContainer?.className).toMatch(/text-blue/);
    });
  });
});
