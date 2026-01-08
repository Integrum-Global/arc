/**
 * Dashboard Page Tests
 *
 * Tests for the main dashboard page component including:
 * - Summary cards rendering
 * - Allocation chart
 * - Performance section
 * - Alerts section
 * - Quick actions
 * - Loading states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import {
  mockDashboardSummary,
  mockAllocations,
  mockTopHoldings,
  mockPerformanceHistory,
  mockAlerts,
  mockBrief,
} from "@/test/mocks/data";

// Mock the useDashboardData hook
const mockRefetch = vi.fn();
const mockUseDashboardData = vi.fn();

vi.mock("@/hooks", () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

// Mock the dashboard sub-components to isolate page-level testing
vi.mock("@/app/(dashboard)/dashboard/components", () => ({
  SummaryCards: ({
    summary,
    loading,
  }: {
    summary: typeof mockDashboardSummary | null;
    loading: boolean;
  }) =>
    loading ? (
      <div data-testid="summary-cards-loading">Loading...</div>
    ) : (
      <div data-testid="summary-cards">
        <span data-testid="total-value">
          ${summary?.totalValue?.toLocaleString()}
        </span>
        <span data-testid="day-change-pct">
          {(summary?.dayChangePct ?? 0 * 100).toFixed(2)}%
        </span>
        <span data-testid="ytd-return">
          {((summary?.ytdReturn ?? 0) * 100).toFixed(2)}%
        </span>
        <span data-testid="health-score">{summary?.healthScore}</span>
      </div>
    ),
  AllocationSection: ({
    allocations,
    topHoldings,
    loading,
  }: {
    allocations: typeof mockAllocations;
    topHoldings: typeof mockTopHoldings;
    loading: boolean;
  }) =>
    loading ? (
      <div data-testid="allocation-loading">Loading...</div>
    ) : (
      <div data-testid="allocation-section">
        <h3>Allocation</h3>
        {allocations.map((a) => (
          <div key={a.sector} data-testid="sector-item">
            {a.sector}
          </div>
        ))}
        {topHoldings.map((h) => (
          <div key={h.id} data-testid="holding-item">
            {h.name}
          </div>
        ))}
      </div>
    ),
  PerformanceSection: ({
    data,
    loading,
  }: {
    data: typeof mockPerformanceHistory;
    loading: boolean;
  }) =>
    loading ? (
      <div data-testid="performance-loading">Loading...</div>
    ) : (
      <div data-testid="performance-section">
        <h3>Performance</h3>
        <span>Data points: {data.length}</span>
      </div>
    ),
  AlertsSection: ({
    alerts,
    loading,
  }: {
    alerts: typeof mockAlerts;
    loading: boolean;
  }) =>
    loading ? (
      <div data-testid="alerts-loading">Loading...</div>
    ) : (
      <div data-testid="alerts-section">
        <h3>Alerts</h3>
        {alerts.map((alert) => (
          <div key={alert.id} data-testid="alert-item">
            <span data-testid="alert-title">{alert.title}</span>
            <span data-testid="alert-message">{alert.message}</span>
            <span data-testid="alert-severity">{alert.severity}</span>
          </div>
        ))}
      </div>
    ),
  BriefSection: ({
    brief,
    loading,
  }: {
    brief: typeof mockBrief | null;
    loading: boolean;
  }) =>
    loading ? (
      <div data-testid="brief-loading">Loading...</div>
    ) : brief ? (
      <div data-testid="brief-section">
        <h3>Brief</h3>
        <span data-testid="brief-title">{brief.title}</span>
        <span data-testid="brief-summary">{brief.summary}</span>
      </div>
    ) : (
      <div data-testid="brief-empty">No brief available</div>
    ),
  QuickActions: ({
    onRefresh,
    isRefreshing,
  }: {
    onRefresh: () => void;
    isRefreshing: boolean;
  }) => (
    <div data-testid="quick-actions">
      <h3>Quick Actions</h3>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        data-testid="quick-refresh-btn"
      >
        {isRefreshing ? "Refreshing..." : "Quick Refresh"}
      </button>
    </div>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation - loaded state with data
    mockUseDashboardData.mockReturnValue({
      summary: mockDashboardSummary,
      allocations: mockAllocations,
      topHoldings: mockTopHoldings,
      performanceHistory: mockPerformanceHistory,
      activeAlerts: mockAlerts,
      brief: mockBrief,
      isLoading: false,
      error: null,
      loadingStates: {
        portfolios: false,
        alerts: false,
        brief: false,
        health: false,
      },
      refetch: mockRefetch,
    });
  });

  describe("Page Header", () => {
    it("renders the page title", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders the page subtitle", () => {
      renderWithProviders(<DashboardPage />);

      expect(
        screen.getByText("Overview of your portfolio performance")
      ).toBeInTheDocument();
    });

    it("renders the refresh button", () => {
      renderWithProviders(<DashboardPage />);

      // There are multiple refresh buttons (header and quick actions)
      const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
      expect(refreshButtons.length).toBeGreaterThan(0);
    });

    it("renders the new report button", () => {
      renderWithProviders(<DashboardPage />);

      expect(
        screen.getByRole("button", { name: /new report/i })
      ).toBeInTheDocument();
    });

    it("calls refetch when refresh button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Click the first refresh button (header)
      const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
      await user.click(refreshButtons[0]!);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Summary Cards Section", () => {
    it("renders SummaryCards component", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
    });

    it("displays total portfolio value", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("$1,287,500");
    });

    it("displays YTD return", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("ytd-return")).toHaveTextContent("12.34%");
    });

    it("displays health score", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("health-score")).toHaveTextContent("78");
    });
  });

  describe("Allocation Section", () => {
    it("renders allocation section", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("allocation-section")).toBeInTheDocument();
    });

    it("displays sector allocations", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("Technology")).toBeInTheDocument();
      expect(screen.getByText("Healthcare")).toBeInTheDocument();
    });

    it("displays top holdings", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("Apple Inc")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corp")).toBeInTheDocument();
    });
  });

  describe("Performance Section", () => {
    it("renders performance section", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("performance-section")).toBeInTheDocument();
    });
  });

  describe("Alerts Section", () => {
    it("renders alerts section", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("alerts-section")).toBeInTheDocument();
    });

    it("displays active alerts", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("AAPL Price Drop")).toBeInTheDocument();
    });

    it("displays alert messages", () => {
      renderWithProviders(<DashboardPage />);

      expect(
        screen.getByText("Apple stock dropped 5% below target")
      ).toBeInTheDocument();
    });
  });

  describe("Brief Section", () => {
    it("renders brief section", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("brief-section")).toBeInTheDocument();
    });

    it("displays morning brief title", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText("Morning Market Brief")).toBeInTheDocument();
    });

    it("displays brief summary", () => {
      renderWithProviders(<DashboardPage />);

      expect(
        screen.getByText(
          "Markets are showing positive momentum with tech leading gains."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("renders quick actions section", () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    });

    it("allows refreshing from quick actions", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      await user.click(screen.getByTestId("quick-refresh-btn"));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("shows loading state when portfolios are loading", () => {
      mockUseDashboardData.mockReturnValue({
        summary: null,
        allocations: [],
        topHoldings: [],
        performanceHistory: [],
        activeAlerts: [],
        brief: null,
        isLoading: true,
        error: null,
        loadingStates: {
          portfolios: true,
          alerts: true,
          brief: true,
          health: true,
        },
        refetch: mockRefetch,
      });

      renderWithProviders(<DashboardPage />);

      // Header refresh button should be disabled during loading
      const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
      expect(refreshButtons[0]).toBeDisabled();
    });

    it("shows spinning icon when refreshing", () => {
      mockUseDashboardData.mockReturnValue({
        summary: mockDashboardSummary,
        allocations: mockAllocations,
        topHoldings: mockTopHoldings,
        performanceHistory: mockPerformanceHistory,
        activeAlerts: mockAlerts,
        brief: mockBrief,
        isLoading: true,
        error: null,
        loadingStates: {
          portfolios: false,
          alerts: false,
          brief: false,
          health: false,
        },
        refetch: mockRefetch,
      });

      renderWithProviders(<DashboardPage />);

      // The refresh icon should have animate-spin class
      const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
      const icon = refreshButtons[0]?.querySelector("svg");
      expect(icon).toHaveClass("animate-spin");
    });

    it("shows loading skeleton in summary cards", () => {
      mockUseDashboardData.mockReturnValue({
        summary: null,
        allocations: [],
        topHoldings: [],
        performanceHistory: [],
        activeAlerts: [],
        brief: null,
        isLoading: false,
        error: null,
        loadingStates: {
          portfolios: true,
          alerts: false,
          brief: false,
          health: false,
        },
        refetch: mockRefetch,
      });

      renderWithProviders(<DashboardPage />);

      expect(screen.getByTestId("summary-cards-loading")).toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("handles null summary gracefully", () => {
      mockUseDashboardData.mockReturnValue({
        summary: null,
        allocations: [],
        topHoldings: [],
        performanceHistory: [],
        activeAlerts: [],
        brief: null,
        isLoading: false,
        error: null,
        loadingStates: {
          portfolios: false,
          alerts: false,
          brief: false,
          health: false,
        },
        refetch: mockRefetch,
      });

      // Should not throw
      expect(() => renderWithProviders(<DashboardPage />)).not.toThrow();
    });

    it("handles empty alerts array", () => {
      mockUseDashboardData.mockReturnValue({
        summary: mockDashboardSummary,
        allocations: mockAllocations,
        topHoldings: mockTopHoldings,
        performanceHistory: mockPerformanceHistory,
        activeAlerts: [],
        brief: mockBrief,
        isLoading: false,
        error: null,
        loadingStates: {
          portfolios: false,
          alerts: false,
          brief: false,
          health: false,
        },
        refetch: mockRefetch,
      });

      expect(() => renderWithProviders(<DashboardPage />)).not.toThrow();
    });

    it("handles null brief", () => {
      mockUseDashboardData.mockReturnValue({
        summary: mockDashboardSummary,
        allocations: mockAllocations,
        topHoldings: mockTopHoldings,
        performanceHistory: mockPerformanceHistory,
        activeAlerts: mockAlerts,
        brief: null,
        isLoading: false,
        error: null,
        loadingStates: {
          portfolios: false,
          alerts: false,
          brief: false,
          health: false,
        },
        refetch: mockRefetch,
      });

      expect(() => renderWithProviders(<DashboardPage />)).not.toThrow();
      expect(screen.getByTestId("brief-empty")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible page heading", () => {
      renderWithProviders(<DashboardPage />);

      expect(
        screen.getByRole("heading", { name: /dashboard/i, level: 1 })
      ).toBeInTheDocument();
    });

    it("action buttons are keyboard accessible", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
      refreshButtons[0]?.focus();

      expect(refreshButtons[0]).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
