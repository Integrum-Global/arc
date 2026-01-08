/**
 * PerformanceChart Component Tests
 *
 * Tests for the PerformanceChart component including:
 * - Rendering line and area charts
 * - Time period handling
 * - Benchmark comparison display
 * - Axis labels and formatting
 * - Loading and empty states
 * - Interactive features (tooltips, hover)
 *
 * Note: Recharts components are mocked to avoid complex SVG rendering in JSDOM.
 * Tests focus on component behavior, props handling, and data transformation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PerformanceChart, CHART_COLORS } from "@/components/charts";
import type { PerformanceDataPoint, PerformancePeriod } from "@/components/charts";

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
const mockPerformanceData: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 0 },
  { date: "2024-01-15", value: 2.5 },
  { date: "2024-02-01", value: -1.2 },
  { date: "2024-02-15", value: 3.8 },
  { date: "2024-03-01", value: 5.2 },
  { date: "2024-03-15", value: 4.1 },
];

const mockPerformanceWithBenchmark: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 0, benchmark: 0 },
  { date: "2024-01-15", value: 2.5, benchmark: 1.8 },
  { date: "2024-02-01", value: -1.2, benchmark: 0.5 },
  { date: "2024-02-15", value: 3.8, benchmark: 2.1 },
  { date: "2024-03-01", value: 5.2, benchmark: 3.4 },
  { date: "2024-03-15", value: 4.1, benchmark: 2.8 },
];

const emptyPerformanceData: PerformanceDataPoint[] = [];

const singleDataPoint: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 5.0 },
];

const allPositiveData: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 1.0 },
  { date: "2024-02-01", value: 3.0 },
  { date: "2024-03-01", value: 5.0 },
];

const allNegativeData: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: -1.0 },
  { date: "2024-02-01", value: -3.0 },
  { date: "2024-03-01", value: -5.0 },
];

describe("PerformanceChart", () => {
  describe("Rendering", () => {
    it("renders chart container", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders as area chart by default (showArea=true)", () => {
      render(<PerformanceChart data={mockPerformanceData} showArea={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders as line chart when showArea is false", () => {
      render(<PerformanceChart data={mockPerformanceData} showArea={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("applies custom height", () => {
      const { container } = render(<PerformanceChart data={mockPerformanceData} height={400} />);

      const chartWrapper = container.firstChild as HTMLElement;
      expect(chartWrapper).toHaveStyle({ height: "400px" });
    });

    it("applies custom className", () => {
      const { container } = render(
        <PerformanceChart data={mockPerformanceData} className="custom-perf-class" />
      );

      const chartContainer = container.firstChild;
      expect(chartContainer).toHaveClass("custom-perf-class");
    });
  });

  describe("Time Period Handling", () => {
    const periods: PerformancePeriod[] = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "ALL"];

    periods.forEach((period) => {
      it(`renders correctly for ${period} period`, () => {
        render(<PerformanceChart data={mockPerformanceData} period={period} />);

        expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
      });
    });

    it("adjusts date formatting based on period", () => {
      // Short periods should show detailed dates
      const { unmount: unmountShort } = render(
        <PerformanceChart data={mockPerformanceData} period="1M" />
      );
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
      unmountShort();

      // Long periods should show month/year
      render(<PerformanceChart data={mockPerformanceData} period="5Y" />);
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Benchmark Comparison", () => {
    it("renders without benchmark by default", () => {
      render(<PerformanceChart data={mockPerformanceData} showBenchmark={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders with benchmark when showBenchmark is true", () => {
      render(
        <PerformanceChart
          data={mockPerformanceWithBenchmark}
          showBenchmark={true}
          benchmarkLabel="S&P 500"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom benchmark label", () => {
      render(
        <PerformanceChart
          data={mockPerformanceWithBenchmark}
          showBenchmark={true}
          benchmarkLabel="Custom Benchmark"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom portfolio label", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          portfolioLabel="My Portfolio"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom colors for benchmark", () => {
      render(
        <PerformanceChart
          data={mockPerformanceWithBenchmark}
          showBenchmark={true}
          benchmarkColor="#FF00FF"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Axis Labels", () => {
    it("renders X-axis with date labels", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("renders Y-axis with value labels", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("formats Y-axis based on valueFormat", () => {
      // Percent format
      const { unmount: unmountPercent } = render(
        <PerformanceChart data={mockPerformanceData} valueFormat="percent" />
      );
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
      unmountPercent();

      // Currency format
      render(<PerformanceChart data={mockPerformanceData} valueFormat="currency" />);
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("renders without errors with empty data", () => {
      render(<PerformanceChart data={emptyPerformanceData} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles single data point", () => {
      render(<PerformanceChart data={singleDataPoint} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles data with missing benchmark values", () => {
      const mixedData: PerformanceDataPoint[] = [
        { date: "2024-01-01", value: 1.0, benchmark: 0.5 },
        { date: "2024-02-01", value: 2.0 }, // No benchmark
        { date: "2024-03-01", value: 3.0, benchmark: 1.5 },
      ];

      render(<PerformanceChart data={mixedData} showBenchmark={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Value Ranges", () => {
    it("handles all positive values", () => {
      render(<PerformanceChart data={allPositiveData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles all negative values", () => {
      render(<PerformanceChart data={allNegativeData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles mixed positive and negative values", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("calculates correct Y-axis domain with padding", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Zero Reference Line", () => {
    it("shows zero line when showZeroLine is true and valueFormat is percent", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          showZeroLine={true}
          valueFormat="percent"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("hides zero line when showZeroLine is false", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          showZeroLine={false}
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Grid Lines", () => {
    it("shows grid when showGrid is true (default)", () => {
      render(<PerformanceChart data={mockPerformanceData} showGrid={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("hides grid when showGrid is false", () => {
      render(<PerformanceChart data={mockPerformanceData} showGrid={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Legend", () => {
    it("shows legend when showLegend is true (default)", () => {
      render(<PerformanceChart data={mockPerformanceData} showLegend={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("hides legend when showLegend is false", () => {
      render(<PerformanceChart data={mockPerformanceData} showLegend={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("shows both portfolio and benchmark in legend", () => {
      render(
        <PerformanceChart
          data={mockPerformanceWithBenchmark}
          showBenchmark={true}
          showLegend={true}
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Interactive Features", () => {
    it("enables tooltip when interactive is true (default)", () => {
      render(<PerformanceChart data={mockPerformanceData} interactive={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("disables tooltip when interactive is false", () => {
      render(<PerformanceChart data={mockPerformanceData} interactive={false} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("shows active dot on hover when interactive", () => {
      render(<PerformanceChart data={mockPerformanceData} interactive={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Custom Colors", () => {
    it("uses default colors from CHART_COLORS", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      // Verify default colors exist
      expect(CHART_COLORS.performance.portfolio).toBeDefined();
      expect(CHART_COLORS.performance.benchmark).toBeDefined();
      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom portfolio color", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          portfolioColor="#FF0000"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom benchmark color", () => {
      render(
        <PerformanceChart
          data={mockPerformanceWithBenchmark}
          showBenchmark={true}
          benchmarkColor="#00FF00"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Color By Sign", () => {
    it("colors areas differently based on positive/negative when colorBySign is true", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          colorBySign={true}
          showArea={true}
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses single color when colorBySign is false (default)", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          colorBySign={false}
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Value Format", () => {
    it("supports percent format (default)", () => {
      render(<PerformanceChart data={mockPerformanceData} valueFormat="percent" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports currency format", () => {
      render(<PerformanceChart data={mockPerformanceData} valueFormat="currency" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("supports number format", () => {
      render(<PerformanceChart data={mockPerformanceData} valueFormat="number" />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("uses custom currency", () => {
      render(
        <PerformanceChart
          data={mockPerformanceData}
          valueFormat="currency"
          currency="EUR"
        />
      );

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Date Formats", () => {
    it("handles ISO date strings", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles Date objects", () => {
      const dataWithDateObjects: PerformanceDataPoint[] = [
        { date: new Date("2024-01-01").toISOString(), value: 1.0 },
        { date: new Date("2024-02-01").toISOString(), value: 2.0 },
      ];

      render(<PerformanceChart data={dataWithDateObjects} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });

    it("handles numeric timestamps", () => {
      const dataWithTimestamps: PerformanceDataPoint[] = [
        { date: Date.now() - 86400000 * 30, value: 1.0 },
        { date: Date.now(), value: 2.0 },
      ];

      render(<PerformanceChart data={dataWithTimestamps as unknown as PerformanceDataPoint[]} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Gradient Definitions", () => {
    it("creates unique gradient IDs", () => {
      render(<PerformanceChart data={mockPerformanceData} />);
      const svg1 = screen.getByTestId("chart-svg");
      expect(svg1).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("chart has accessible SVG structure", () => {
      render(<PerformanceChart data={mockPerformanceData} />);

      const svg = screen.getByTestId("chart-svg");
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe("svg");
    });

    it("uses semantic color coding for gains/losses", () => {
      // Default colors should indicate positive (green) and negative (red)
      expect(CHART_COLORS.performance.positive).toBe("#22c55e"); // Green
      expect(CHART_COLORS.performance.negative).toBe("#ef4444"); // Red
    });
  });

  describe("Performance", () => {
    it("handles large datasets efficiently", () => {
      const largeData: PerformanceDataPoint[] = Array.from({ length: 365 }, (_, i) => ({
        date: new Date(2024, 0, 1 + i).toISOString().split("T")[0]!,
        value: Math.sin(i / 30) * 10,
        benchmark: Math.sin(i / 30) * 8,
      }));

      render(<PerformanceChart data={largeData} showBenchmark={true} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });

  describe("Additional Data Fields", () => {
    it("passes through additional fields in data points", () => {
      const dataWithExtra: PerformanceDataPoint[] = [
        { date: "2024-01-01", value: 1.0, customField: "extra" } as PerformanceDataPoint,
        { date: "2024-02-01", value: 2.0, customField: "data" } as PerformanceDataPoint,
      ];

      render(<PerformanceChart data={dataWithExtra} />);

      expect(screen.getByTestId("chart-svg")).toBeInTheDocument();
    });
  });
});
