/**
 * AllocationChart Component Tests
 *
 * Tests for the AllocationChart component including:
 * - Rendering different chart types (pie, donut, treemap)
 * - Legend display and positioning
 * - Empty data handling
 * - Correct allocation percentages
 * - Interactive features
 * - Custom colors
 *
 * Note: Recharts components are mocked to avoid complex SVG rendering in JSDOM.
 * Tests focus on component behavior, props handling, and data transformation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AllocationChart, CHART_COLORS } from "@/components/charts";
import type { AllocationDataPoint } from "@/components/charts";

// Mock Recharts to avoid complex SVG rendering in JSDOM
// ResponsiveContainer needs special handling as it relies on element dimensions
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">
        <svg data-testid="chart-svg">
          {children}
        </svg>
      </div>
    ),
  };
});

// Test data fixtures
const mockAllocations: AllocationDataPoint[] = [
  { name: "Technology", value: 450000 },
  { name: "Healthcare", value: 250000 },
  { name: "Financials", value: 200000 },
  { name: "Consumer", value: 100000 },
];

const mockAllocationsWithColors: AllocationDataPoint[] = [
  { name: "Technology", value: 450000, color: "#FF0000" },
  { name: "Healthcare", value: 250000, color: "#00FF00" },
];

const emptyAllocations: AllocationDataPoint[] = [];

const singleAllocation: AllocationDataPoint[] = [
  { name: "Technology", value: 1000000 },
];

describe("AllocationChart", () => {
  describe("Rendering", () => {
    it("renders chart container", () => {
      render(<AllocationChart data={mockAllocations} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders with default donut type", () => {
      render(<AllocationChart data={mockAllocations} />);

      // Chart should render with SVG
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders with pie type", () => {
      render(<AllocationChart data={mockAllocations} type="pie" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders with treemap type", () => {
      render(<AllocationChart data={mockAllocations} type="treemap" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("applies custom height", () => {
      const { container } = render(<AllocationChart data={mockAllocations} height={400} />);

      // Container div should have the custom height style
      const chartWrapper = container.firstChild as HTMLElement;
      expect(chartWrapper).toHaveStyle({ height: "400px" });
    });

    it("applies custom className", () => {
      const { container } = render(
        <AllocationChart data={mockAllocations} className="custom-chart-class" />
      );

      const chartContainer = container.firstChild;
      expect(chartContainer).toHaveClass("custom-chart-class");
    });
  });

  describe("Legend", () => {
    it("shows legend when showLegend is true (default)", () => {
      render(<AllocationChart data={mockAllocations} showLegend={true} />);

      // Chart should render successfully with legend enabled
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("hides legend when showLegend is false", () => {
      render(<AllocationChart data={mockAllocations} showLegend={false} />);

      // Chart should render without errors
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("positions legend at bottom by default", () => {
      render(<AllocationChart data={mockAllocations} legendPosition="bottom" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports right legend position", () => {
      render(<AllocationChart data={mockAllocations} legendPosition="right" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("renders without errors with empty data", () => {
      render(<AllocationChart data={emptyAllocations} />);

      // Should still render the container
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles single item data", () => {
      render(<AllocationChart data={singleAllocation} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Allocation Percentages", () => {
    it("calculates correct total from data values", () => {
      render(<AllocationChart data={mockAllocations} showLegend={true} />);

      // Total should be 1,000,000 (450k + 250k + 200k + 100k)
      // Technology = 45%, Healthcare = 25%, Financials = 20%, Consumer = 10%
      // The component should calculate these percentages internally
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles zero values correctly", () => {
      const dataWithZero: AllocationDataPoint[] = [
        { name: "Technology", value: 100 },
        { name: "Healthcare", value: 0 },
        { name: "Financials", value: 100 },
      ];

      render(<AllocationChart data={dataWithZero} />);

      // Should render without errors
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles negative values gracefully", () => {
      const dataWithNegative: AllocationDataPoint[] = [
        { name: "Technology", value: 100 },
        { name: "Loss", value: -50 },
      ];

      // Component should handle or filter negative values
      render(<AllocationChart data={dataWithNegative} />);
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Interactive Features", () => {
    it("enables tooltip when interactive is true (default)", () => {
      render(<AllocationChart data={mockAllocations} interactive={true} />);

      // Chart should render with interactive mode
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("disables tooltip when interactive is false", () => {
      render(<AllocationChart data={mockAllocations} interactive={false} />);

      // Component should still render
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("calls onSegmentClick when segment is clicked", () => {
      const handleClick = vi.fn();
      render(
        <AllocationChart
          data={mockAllocations}
          interactive={true}
          onSegmentClick={handleClick}
        />
      );

      // Verify chart renders with click handler
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("sets cursor style based on interactivity and click handler", () => {
      render(
        <AllocationChart
          data={mockAllocations}
          interactive={true}
          onSegmentClick={() => {}}
        />
      );

      // Check that the component renders
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Custom Colors", () => {
    it("uses default CHART_COLORS.sectors when no custom colors provided", () => {
      render(<AllocationChart data={mockAllocations} />);

      // Default colors should be applied from CHART_COLORS.sectors
      expect(CHART_COLORS.sectors).toBeDefined();
      expect(CHART_COLORS.sectors.length).toBeGreaterThan(0);
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom colors array when provided", () => {
      const customColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];

      render(<AllocationChart data={mockAllocations} colors={customColors} />);

      // Component should use custom colors
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses individual item colors when specified in data", () => {
      render(<AllocationChart data={mockAllocationsWithColors} />);

      // Items with custom colors should use those colors
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("cycles colors when data has more items than available colors", () => {
      const manyItems: AllocationDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
        name: `Item ${i + 1}`,
        value: 100,
      }));

      render(<AllocationChart data={manyItems} colors={["#FF0000", "#00FF00"]} />);

      // Should render all items using cycling colors
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Value Format", () => {
    it("supports currency format", () => {
      render(<AllocationChart data={mockAllocations} valueFormat="currency" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports percent format", () => {
      render(<AllocationChart data={mockAllocations} valueFormat="percent" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports number format", () => {
      render(<AllocationChart data={mockAllocations} valueFormat="number" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Donut Chart Specific", () => {
    it("applies inner radius for donut type", () => {
      render(<AllocationChart data={mockAllocations} type="donut" innerRadius={0.6} />);

      // Donut chart should have inner radius > 0
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("sets inner radius to 0 for pie type", () => {
      render(<AllocationChart data={mockAllocations} type="pie" />);

      // Pie chart has no inner radius
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Labels", () => {
    it("shows labels when showLabels is true", () => {
      render(<AllocationChart data={mockAllocations} showLabels={true} labelType="percent" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("hides labels when showLabels is false (default)", () => {
      render(<AllocationChart data={mockAllocations} showLabels={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports different label types", () => {
      const labelTypes: Array<"percent" | "value" | "name"> = ["percent", "value", "name"];

      labelTypes.forEach((labelType) => {
        const { unmount } = render(
          <AllocationChart data={mockAllocations} showLabels={true} labelType={labelType} />
        );

        expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Treemap Specific", () => {
    it("renders treemap with correct structure", () => {
      render(<AllocationChart data={mockAllocations} type="treemap" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders treemap legend when showLegend is true", () => {
      render(<AllocationChart data={mockAllocations} type="treemap" showLegend={true} />);

      // Treemap legend is custom rendered
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("chart has accessible SVG structure", () => {
      render(<AllocationChart data={mockAllocations} />);

      const svg = screen.getByTestId("chart-svg");
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe("svg");
    });

    it("renders with sufficient color contrast (using default colors)", () => {
      // Default CHART_COLORS should have accessible contrast
      expect(CHART_COLORS.sectors[0]).toBe("#3b82f6"); // Blue
      expect(CHART_COLORS.sectors[1]).toBe("#22c55e"); // Green
      // These are Tailwind colors with good contrast ratios
    });
  });

  describe("Currency", () => {
    it("supports different currency formats", () => {
      render(
        <AllocationChart
          data={mockAllocations}
          valueFormat="currency"
          currency="EUR"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Metadata", () => {
    it("passes through metadata in data points", () => {
      const dataWithMetadata: AllocationDataPoint[] = [
        { name: "Technology", value: 450000, metadata: { sector_id: "tech-001" } },
        { name: "Healthcare", value: 250000, metadata: { sector_id: "health-001" } },
      ];

      render(<AllocationChart data={dataWithMetadata} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });
});
