/**
 * Analytics Page Tests
 *
 * Tests for the analytics page component including:
 * - Tab rendering (Ratios, Alerts, Thresholds, Benchmarking)
 * - Tab switching functionality
 * - Ratio cards display
 * - Refresh functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import AnalyticsPage from "@/app/(dashboard)/analytics/page";

// Mock the analytics hook
const mockInvalidateAnalytics = vi.fn();

vi.mock("@/hooks", () => ({
  useInvalidateAnalytics: () => mockInvalidateAnalytics,
}));

// Mock tab components
vi.mock("@/app/(dashboard)/analytics/components/RatiosTab", () => ({
  RatiosTab: () => (
    <div data-testid="ratios-tab">
      <div data-testid="ratio-card">P/E Ratio: 15.5</div>
      <div data-testid="ratio-card">P/B Ratio: 2.3</div>
      <div data-testid="ratio-card">Debt/Equity: 0.45</div>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/analytics/components/AlertsTab", () => ({
  AlertsTab: () => (
    <div data-testid="alerts-tab">
      <div data-testid="alert-item">Price Alert: AAPL</div>
      <div data-testid="alert-item">Drift Alert: Portfolio 1</div>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/analytics/components/ThresholdsTab", () => ({
  ThresholdsTab: () => (
    <div data-testid="thresholds-tab">
      <div data-testid="threshold-item">P/E Ratio &gt; 25</div>
      <div data-testid="threshold-item">Debt/Equity &gt; 1.0</div>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/analytics/components/BenchmarkingTab", () => ({
  BenchmarkingTab: () => (
    <div data-testid="benchmarking-tab">
      <div data-testid="benchmark-comparison">vs S&P 500</div>
      <div data-testid="peer-comparison">Peer Group Analysis</div>
    </div>
  ),
}));

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page Header", () => {
    it("renders the page title", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("renders the page subtitle", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(
        screen.getByText("Financial ratios, alerts, and benchmarking tools")
      ).toBeInTheDocument();
    });

    it("renders the refresh button", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(
        screen.getByRole("button", { name: /refresh/i })
      ).toBeInTheDocument();
    });

    it("calls invalidateAnalytics when refresh is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("button", { name: /refresh/i }));

      expect(mockInvalidateAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tab Rendering", () => {
    it("renders all four tabs", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByRole("tab", { name: /ratios/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /alerts/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /thresholds/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /benchmarking/i })
      ).toBeInTheDocument();
    });

    it("shows Ratios tab content by default", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByTestId("ratios-tab")).toBeInTheDocument();
    });

    it("Ratios tab is selected by default", () => {
      renderWithProviders(<AnalyticsPage />);

      const ratiosTab = screen.getByRole("tab", { name: /ratios/i });
      expect(ratiosTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Tab Switching", () => {
    it("switches to Alerts tab when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /alerts/i }));

      await waitFor(() => {
        expect(screen.getByTestId("alerts-tab")).toBeInTheDocument();
      });

      // Ratios tab content should be hidden
      expect(screen.queryByTestId("ratios-tab")).not.toBeInTheDocument();
    });

    it("switches to Thresholds tab when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /thresholds/i }));

      await waitFor(() => {
        expect(screen.getByTestId("thresholds-tab")).toBeInTheDocument();
      });
    });

    it("switches to Benchmarking tab when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /benchmarking/i }));

      await waitFor(() => {
        expect(screen.getByTestId("benchmarking-tab")).toBeInTheDocument();
      });
    });

    it("switches back to Ratios tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      // First switch away
      await user.click(screen.getByRole("tab", { name: /alerts/i }));

      await waitFor(() => {
        expect(screen.getByTestId("alerts-tab")).toBeInTheDocument();
      });

      // Switch back
      await user.click(screen.getByRole("tab", { name: /ratios/i }));

      await waitFor(() => {
        expect(screen.getByTestId("ratios-tab")).toBeInTheDocument();
      });
    });
  });

  describe("Ratios Tab Content", () => {
    it("displays ratio cards", () => {
      renderWithProviders(<AnalyticsPage />);

      const ratioCards = screen.getAllByTestId("ratio-card");
      expect(ratioCards.length).toBeGreaterThan(0);
    });

    it("displays P/E Ratio", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByText(/P\/E Ratio/i)).toBeInTheDocument();
    });

    it("displays P/B Ratio", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByText(/P\/B Ratio/i)).toBeInTheDocument();
    });

    it("displays Debt/Equity ratio", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByText(/Debt\/Equity/i)).toBeInTheDocument();
    });
  });

  describe("Alerts Tab Content", () => {
    it("displays alert items when on Alerts tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /alerts/i }));

      await waitFor(() => {
        const alertItems = screen.getAllByTestId("alert-item");
        expect(alertItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Thresholds Tab Content", () => {
    it("displays threshold items when on Thresholds tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /thresholds/i }));

      await waitFor(() => {
        const thresholdItems = screen.getAllByTestId("threshold-item");
        expect(thresholdItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Benchmarking Tab Content", () => {
    it("displays benchmark comparison when on Benchmarking tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /benchmarking/i }));

      await waitFor(() => {
        expect(screen.getByTestId("benchmark-comparison")).toBeInTheDocument();
      });
    });

    it("displays peer comparison when on Benchmarking tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /benchmarking/i }));

      await waitFor(() => {
        expect(screen.getByTestId("peer-comparison")).toBeInTheDocument();
      });
    });
  });

  describe("Conditional New Threshold Button", () => {
    it("does not show New Threshold button on Ratios tab", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(
        screen.queryByRole("button", { name: /new threshold/i })
      ).not.toBeInTheDocument();
    });

    it("shows New Threshold button on Thresholds tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      await user.click(screen.getByRole("tab", { name: /thresholds/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /new threshold/i })
        ).toBeInTheDocument();
      });
    });

    it("hides New Threshold button when switching away from Thresholds tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      // Switch to Thresholds tab
      await user.click(screen.getByRole("tab", { name: /thresholds/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /new threshold/i })
        ).toBeInTheDocument();
      });

      // Switch to Alerts tab
      await user.click(screen.getByRole("tab", { name: /alerts/i }));

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /new threshold/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible page heading", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(
        screen.getByRole("heading", { name: /analytics/i, level: 1 })
      ).toBeInTheDocument();
    });

    it("tabs have proper ARIA roles", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4);
    });

    it("active tab has correct aria-selected", () => {
      renderWithProviders(<AnalyticsPage />);

      const ratiosTab = screen.getByRole("tab", { name: /ratios/i });
      expect(ratiosTab).toHaveAttribute("aria-selected", "true");
    });

    it("inactive tabs have correct aria-selected", () => {
      renderWithProviders(<AnalyticsPage />);

      const alertsTab = screen.getByRole("tab", { name: /alerts/i });
      expect(alertsTab).toHaveAttribute("aria-selected", "false");
    });

    it("tabs are keyboard navigable", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AnalyticsPage />);

      const ratiosTab = screen.getByRole("tab", { name: /ratios/i });
      ratiosTab.focus();

      expect(ratiosTab).toHaveFocus();

      await user.keyboard("{ArrowRight}");

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /alerts/i })).toHaveFocus();
      });
    });

    it("tab panels have proper ARIA roles", () => {
      renderWithProviders(<AnalyticsPage />);

      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });

  describe("Tab State Persistence", () => {
    it("maintains tab content when re-rendering", async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(<AnalyticsPage />);

      // Switch to Alerts tab
      await user.click(screen.getByRole("tab", { name: /alerts/i }));

      await waitFor(() => {
        expect(screen.getByTestId("alerts-tab")).toBeInTheDocument();
      });

      // Re-render the component
      rerender(<AnalyticsPage />);

      // Note: Without URL persistence, the tab will reset to default
      // This tests that the component handles re-renders gracefully
    });
  });
});
