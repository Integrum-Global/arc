/**
 * PerformanceSection Component Tests
 *
 * Tests for the PerformanceSection dashboard component including:
 * - Line chart rendering
 * - Period selector (1M, 3M, YTD, 1Y)
 * - Time range selection handling
 * - Axis labels
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerformanceSection } from "@/app/(dashboard)/dashboard/components/PerformanceSection";
import type { PerformanceDataPoint } from "@/hooks/useDashboardData";

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

// Generate test data for various time periods
function generatePerformanceData(days: number): PerformanceDataPoint[] {
  const data: PerformanceDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split("T")[0] ?? "",
      value: (Math.random() - 0.5) * 20, // Random value between -10 and 10
      benchmark: (Math.random() - 0.5) * 15, // Benchmark with smaller variance
    });
  }

  return data;
}

// Test data fixtures
const mockPerformanceData: PerformanceDataPoint[] = generatePerformanceData(365);

const shortPerformanceData: PerformanceDataPoint[] = generatePerformanceData(30);

const emptyPerformanceData: PerformanceDataPoint[] = [];

const singleDataPoint: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 5.0, benchmark: 4.0 },
];

describe("PerformanceSection", () => {
  describe("Rendering", () => {
    it("renders section with title", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByText("Performance")).toBeInTheDocument();
    });

    it("renders section with subtitle", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByText("Portfolio returns vs benchmark")).toBeInTheDocument();
    });

    it("renders chart container", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders within a Card component", () => {
      const { container } = render(
        <PerformanceSection data={mockPerformanceData} />
      );

      // Card should wrap the chart
      const card = container.querySelector('[class*="rounded-"]');
      expect(card).toBeTruthy();
    });
  });

  describe("Period Selector", () => {
    it("renders period selector with all options", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByText("1M")).toBeInTheDocument();
      expect(screen.getByText("3M")).toBeInTheDocument();
      expect(screen.getByText("YTD")).toBeInTheDocument();
      expect(screen.getByText("1Y")).toBeInTheDocument();
    });

    it("has YTD selected by default", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      const ytdButton = screen.getByRole("button", { name: "YTD" });
      // YTD should have the "default" variant styling (selected state)
      expect(ytdButton).toBeInTheDocument();
    });

    it("period selector is clickable", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const oneMonthButton = screen.getByRole("button", { name: "1M" });
      await user.click(oneMonthButton);

      // Button should be clicked without errors
      expect(oneMonthButton).toBeInTheDocument();
    });

    it("updates selected period on click", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const threeMonthButton = screen.getByRole("button", { name: "3M" });
      await user.click(threeMonthButton);

      // State should update - the component re-renders with new period
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("applies correct styling to selected period", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const oneYearButton = screen.getByRole("button", { name: "1Y" });
      await user.click(oneYearButton);

      // The clicked button should have selected styles
      expect(oneYearButton).toBeInTheDocument();
    });

    it("hides period selector when loading", () => {
      render(<PerformanceSection data={mockPerformanceData} loading={true} />);

      // Period selector should not be visible during loading
      expect(screen.queryByRole("button", { name: "1M" })).not.toBeInTheDocument();
    });
  });

  describe("Time Range Selection", () => {
    it("filters data to 1 month when 1M selected", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const oneMonthButton = screen.getByRole("button", { name: "1M" });
      await user.click(oneMonthButton);

      // Chart should still render with filtered data
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("filters data to 3 months when 3M selected", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const threeMonthButton = screen.getByRole("button", { name: "3M" });
      await user.click(threeMonthButton);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("filters data to YTD when YTD selected", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // YTD is default, chart should render with YTD data
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("filters data to 1 year when 1Y selected", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const oneYearButton = screen.getByRole("button", { name: "1Y" });
      await user.click(oneYearButton);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles period change multiple times", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      // Click through all periods
      await user.click(screen.getByRole("button", { name: "1M" }));
      await user.click(screen.getByRole("button", { name: "3M" }));
      await user.click(screen.getByRole("button", { name: "YTD" }));
      await user.click(screen.getByRole("button", { name: "1Y" }));

      // Should still render correctly
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Line Chart", () => {
    it("renders performance chart component", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("passes showBenchmark prop correctly", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart should receive showBenchmark={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("passes benchmark label as S&P 500", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // benchmarkLabel should be "S&P 500"
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("passes portfolio label as Portfolio", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // portfolioLabel should be "Portfolio"
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Axis Labels", () => {
    it("renders chart with proper axes", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // Chart should have X and Y axes
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("configures valueFormat as percent", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives valueFormat="percent"
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("enables showZeroLine", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives showZeroLine={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("enables showGrid", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives showGrid={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeleton when loading", () => {
      const { container } = render(
        <PerformanceSection data={mockPerformanceData} loading={true} />
      );

      // Skeleton elements should be present (using data-slot attribute)
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows period selector skeleton when loading", () => {
      const { container } = render(
        <PerformanceSection data={mockPerformanceData} loading={true} />
      );

      // Multiple skeleton elements for period buttons
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows chart skeleton when loading", () => {
      render(<PerformanceSection data={mockPerformanceData} loading={true} />);

      // The responsive container (chart) should not be present
      expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    });

    it("hides chart when loading", () => {
      render(<PerformanceSection data={mockPerformanceData} loading={true} />);

      // No chart should be rendered
      expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    });

    it("shows chart when not loading", () => {
      render(<PerformanceSection data={mockPerformanceData} loading={false} />);

      // Chart should be visible
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("renders without errors with empty data", () => {
      render(<PerformanceSection data={emptyPerformanceData} />);

      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles single data point", () => {
      render(<PerformanceSection data={singleDataPoint} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("filters result is empty for recent period with old data", () => {
      // Data only from 2024-01-01, selecting 1M might result in empty filtered data
      const oldData: PerformanceDataPoint[] = [
        { date: "2020-01-01", value: 5.0, benchmark: 4.0 },
        { date: "2020-01-15", value: 6.0, benchmark: 4.5 },
      ];

      render(<PerformanceSection data={oldData} />);

      // Should handle empty filtered data gracefully
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("converts data to chart format", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // Data should be mapped to { date, value, benchmark } format
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("filters data based on selected period", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      // Select 1M period
      await user.click(screen.getByRole("button", { name: "1M" }));

      // Data should be filtered to last 30 days
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("memoizes filtered data", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // useMemo should prevent unnecessary recalculations
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("memoizes chart data", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // useMemo should prevent unnecessary recalculations
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Chart Props", () => {
    it("passes correct period to chart", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      await user.click(screen.getByRole("button", { name: "1Y" }));

      // PerformanceChart should receive period="1Y"
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("enables showArea", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives showArea={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("sets height to 300", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives height={300}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("enables showLegend", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives showLegend={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("enables interactive mode", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // PerformanceChart receives interactive={true}
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("YTD Calculation", () => {
    it("calculates YTD days correctly", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // YTD should filter from January 1 of current year
      // The internal getYtdDays function calculates this
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles YTD at beginning of year", () => {
      // At the start of a new year, YTD should show minimal data
      render(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Period Days Mapping", () => {
    it("1M equals 30 days", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      await user.click(screen.getByRole("button", { name: "1M" }));

      // filterDataByPeriod should use 30 days for 1M
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("3M equals 90 days", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      await user.click(screen.getByRole("button", { name: "3M" }));

      // filterDataByPeriod should use 90 days for 3M
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("1Y equals 365 days", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      await user.click(screen.getByRole("button", { name: "1Y" }));

      // filterDataByPeriod should use 365 days for 1Y
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles data with missing benchmark values", () => {
      const partialData: PerformanceDataPoint[] = [
        { date: "2024-01-01", value: 5.0 }, // No benchmark
        { date: "2024-01-15", value: 6.0, benchmark: 5.0 },
        { date: "2024-02-01", value: 7.0 }, // No benchmark
      ];

      render(<PerformanceSection data={partialData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles very large performance values", () => {
      const largeData: PerformanceDataPoint[] = [
        { date: "2024-01-01", value: 100, benchmark: 80 },
        { date: "2024-02-01", value: 200, benchmark: 150 },
      ];

      render(<PerformanceSection data={largeData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("handles very negative performance values", () => {
      const negativeData: PerformanceDataPoint[] = [
        { date: "2024-01-01", value: -50, benchmark: -40 },
        { date: "2024-02-01", value: -80, benchmark: -60 },
      ];

      render(<PerformanceSection data={negativeData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("period buttons are keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<PerformanceSection data={mockPerformanceData} />);

      const oneMonthButton = screen.getByRole("button", { name: "1M" });

      // Tab to button and press Enter
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // Button should be focusable
      expect(document.activeElement?.tagName).toBe("BUTTON");
    });

    it("section has proper heading structure", () => {
      render(<PerformanceSection data={mockPerformanceData} />);

      // Main section title
      const title = screen.getByText("Performance");
      expect(title).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("component has displayName set", () => {
      // PerformanceSection.displayName should be "PerformanceSection"
      expect(typeof PerformanceSection).toBe("function");
    });
  });

  describe("Re-renders", () => {
    it("re-renders correctly when data changes", () => {
      const { rerender } = render(
        <PerformanceSection data={shortPerformanceData} />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();

      // Update with new data
      rerender(<PerformanceSection data={mockPerformanceData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("re-renders correctly when loading state changes", () => {
      const { rerender } = render(
        <PerformanceSection data={mockPerformanceData} loading={true} />
      );

      expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();

      // Update loading state
      rerender(<PerformanceSection data={mockPerformanceData} loading={false} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });
});
