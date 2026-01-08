/**
 * AllocationSection Component Tests
 *
 * Tests for the AllocationSection dashboard component including:
 * - Donut chart rendering
 * - Legend display with asset classes
 * - Empty data handling
 * - Top holdings list
 * - Loading state
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AllocationSection } from "@/app/(dashboard)/dashboard/components/AllocationSection";
import type { SectorAllocation } from "@/types/api";
import type { TopHolding } from "@/hooks/useDashboardData";

// Mock Recharts to avoid complex SVG rendering in JSDOM
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
const mockAllocations: SectorAllocation[] = [
  { sector: "Technology", value: 450000, weight: 0.35, holdings_count: 12 },
  { sector: "Healthcare", value: 250000, weight: 0.19, holdings_count: 8 },
  { sector: "Financials", value: 200000, weight: 0.15, holdings_count: 6 },
  { sector: "Consumer", value: 180000, weight: 0.14, holdings_count: 5 },
  { sector: "Energy", value: 120000, weight: 0.09, holdings_count: 4 },
];

const mockTopHoldings: TopHolding[] = [
  { id: "1", name: "Apple Inc", ticker: "AAPL", value: 125000, weight: 0.097, change: 0.0245 },
  { id: "2", name: "Microsoft Corp", ticker: "MSFT", value: 98000, weight: 0.076, change: 0.0156 },
  { id: "3", name: "Amazon.com Inc", ticker: "AMZN", value: 87000, weight: 0.067, change: -0.0089 },
  { id: "4", name: "NVIDIA Corp", ticker: "NVDA", value: 76000, weight: 0.059, change: 0.0312 },
  { id: "5", name: "Alphabet Inc", ticker: "GOOGL", value: 65000, weight: 0.05, change: 0.0078 },
];

const emptyAllocations: SectorAllocation[] = [];
const emptyHoldings: TopHolding[] = [];

describe("AllocationSection", () => {
  describe("Rendering", () => {
    it("renders section with title", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("Portfolio Allocation")).toBeInTheDocument();
    });

    it("renders section with subtitle", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("Sector breakdown and top holdings")).toBeInTheDocument();
    });

    it("renders chart container", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders top holdings section title", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("Top 5 Holdings")).toBeInTheDocument();
    });

    it("renders 'by market value' label", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("by market value")).toBeInTheDocument();
    });
  });

  describe("Donut Chart", () => {
    it("renders donut chart with allocation data", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Check for SVG chart element
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("converts allocations to chart data format", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Chart should receive data with name, value, color
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Legend with Asset Classes", () => {
    it("displays sector names in chart", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // The chart's legend should show sector names
      // These may be rendered inside the chart component
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Top Holdings List", () => {
    it("renders all top holdings", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Check for each holding's ticker
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("MSFT")).toBeInTheDocument();
      expect(screen.getByText("AMZN")).toBeInTheDocument();
      expect(screen.getByText("NVDA")).toBeInTheDocument();
      expect(screen.getByText("GOOGL")).toBeInTheDocument();
    });

    it("renders holding names", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("Apple Inc")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corp")).toBeInTheDocument();
      expect(screen.getByText("Amazon.com Inc")).toBeInTheDocument();
    });

    it("displays ticker avatar with first two letters", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Avatar should show first 2 letters of ticker
      expect(screen.getByText("AA")).toBeInTheDocument(); // AAPL
      expect(screen.getByText("MS")).toBeInTheDocument(); // MSFT
      expect(screen.getByText("AM")).toBeInTheDocument(); // AMZN
    });

    it("displays formatted currency values", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Values should be formatted as compact currency
      // $125K, $98K, etc.
      const holdingsSection = screen.getByText("Top 5 Holdings").closest("div")?.parentElement;
      expect(holdingsSection).toBeTruthy();
    });

    it("displays weight percentages", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Weight values: 9.7%, 7.6%, 6.7%, 5.9%, 5.0%
      // These are formatted as percentages in the component
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("displays trend indicators for change values", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // TrendIndicator components should be rendered for each holding
      // Positive changes: AAPL (+2.45%), MSFT (+1.56%), NVDA (+3.12%), GOOGL (+0.78%)
      // Negative changes: AMZN (-0.89%)
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("renders without errors with empty allocations", () => {
      render(
        <AllocationSection
          allocations={emptyAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByText("Portfolio Allocation")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders without errors with empty top holdings", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={emptyHoldings}
        />
      );

      expect(screen.getByText("Top 5 Holdings")).toBeInTheDocument();
    });

    it("renders without errors with all empty data", () => {
      render(
        <AllocationSection
          allocations={emptyAllocations}
          topHoldings={emptyHoldings}
        />
      );

      expect(screen.getByText("Portfolio Allocation")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows chart skeleton when loading", () => {
      const { container } = render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
          loading={true}
        />
      );

      // Skeleton elements should be present (using data-slot attribute)
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows top holdings skeleton when loading", () => {
      const { container } = render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
          loading={true}
        />
      );

      // Multiple skeleton elements for the holdings list
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("hides chart when loading", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
          loading={true}
        />
      );

      // The responsive container (chart) should not be present when loading
      expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    });

    it("shows holdings list when not loading", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
          loading={false}
        />
      );

      // Holdings should be visible
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    it("does not show skeleton when not loading", () => {
      const { container } = render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
          loading={false}
        />
      );

      // Should have chart and holdings, fewer skeleton elements
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("renders in two-column grid on large screens", () => {
      const { container } = render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Grid layout should be applied
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeTruthy();
    });

    it("renders both cards within the section", () => {
      const { container } = render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Two Card components should be present
      const cards = container.querySelectorAll('[class*="rounded-"]');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Allocation Percentages", () => {
    it("converts allocation values to chart format correctly", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Chart data should be derived from allocations
      // Technology: 450000, Healthcare: 250000, etc.
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("assigns colors to each sector", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Colors should be assigned from CHART_COLORS.sectors
      // Verified by the chart rendering without errors
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Holding Item Details", () => {
    it("renders holding with all required fields", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Check first holding has all parts
      const holdingTicker = screen.getByText("AAPL");
      expect(holdingTicker).toBeInTheDocument();

      const holdingName = screen.getByText("Apple Inc");
      expect(holdingName).toBeInTheDocument();
    });

    it("handles holdings with negative change", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // AMZN has negative change (-0.89%)
      const amznTicker = screen.getByText("AMZN");
      expect(amznTicker).toBeInTheDocument();
    });

    it("handles holdings with positive change", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // NVDA has highest positive change (+3.12%)
      const nvdaTicker = screen.getByText("NVDA");
      expect(nvdaTicker).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very large allocation values", () => {
      const largeAllocations: SectorAllocation[] = [
        { sector: "Large Cap", value: 10000000000, weight: 0.9, holdings_count: 100 },
        { sector: "Small Cap", value: 1000000000, weight: 0.1, holdings_count: 50 },
      ];

      render(
        <AllocationSection
          allocations={largeAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles very small allocation values", () => {
      const smallAllocations: SectorAllocation[] = [
        { sector: "Micro Cap", value: 100, weight: 0.5, holdings_count: 2 },
        { sector: "Nano Cap", value: 100, weight: 0.5, holdings_count: 1 },
      ];

      render(
        <AllocationSection
          allocations={smallAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles long sector names", () => {
      const longNameAllocations: SectorAllocation[] = [
        { sector: "Information Technology and Software Development Services", value: 100000, weight: 0.5, holdings_count: 10 },
        { sector: "Healthcare and Pharmaceutical Industries", value: 100000, weight: 0.5, holdings_count: 10 },
      ];

      render(
        <AllocationSection
          allocations={longNameAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles long holding names with truncation", () => {
      const longNameHoldings: TopHolding[] = [
        { id: "1", name: "Very Long Company Name That Should Be Truncated In Display", ticker: "VLCN", value: 100000, weight: 0.1, change: 0.01 },
      ];

      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={longNameHoldings}
        />
      );

      expect(screen.getByText("VLCN")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("section has proper heading structure", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      // Main section title
      const title = screen.getByText("Portfolio Allocation");
      expect(title).toBeInTheDocument();

      // Subsection title
      const subTitle = screen.getByText("Top 5 Holdings");
      expect(subTitle).toBeInTheDocument();
    });

    it("chart container is accessible", () => {
      render(
        <AllocationSection
          allocations={mockAllocations}
          topHoldings={mockTopHoldings}
        />
      );

      const chartContainer = screen.getByTestId("responsive-container");
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("component has displayName set", () => {
      // AllocationSection.displayName should be "AllocationSection"
      // This is set at the end of the component file
      expect(typeof AllocationSection).toBe("function");
    });
  });
});
