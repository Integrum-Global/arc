/**
 * Tests for useDashboardData hook
 *
 * Tests cover:
 * - Combined loading state from multiple queries
 * - Successful data aggregation
 * - Error handling
 * - Summary calculation
 * - Mock data generation
 * - Refetch functionality
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardData } from "../useDashboardData";
import {
  createWrapper,
  createMockPortfolio,
  createMockAlert,
  createMockMarketBrief,
  createMockPortfolioHealth,
  createMockPaginatedResponse,
} from "./test-utils";
import { portfoliosApi, alertsApi, intelligenceApi } from "@/api/endpoints";

// Mock the API modules
vi.mock("@/api/endpoints", () => ({
  portfoliosApi: {
    list: vi.fn(),
    health: vi.fn(),
  },
  alertsApi: {
    list: vi.fn(),
  },
  intelligenceApi: {
    brief: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Loading States
  // ==========================================================================

  describe("loading states", () => {
    it("should return initial loading state", () => {
      // Make all APIs return pending promises
      vi.mocked(portfoliosApi.list).mockReturnValue(new Promise(() => {}));
      vi.mocked(alertsApi.list).mockReturnValue(new Promise(() => {}));
      vi.mocked(intelligenceApi.brief).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingStates.portfolios).toBe(true);
      expect(result.current.loadingStates.alerts).toBe(true);
      expect(result.current.loadingStates.brief).toBe(true);
    });

    it("should track individual loading states", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      // Portfolios resolves first
      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      // Alerts pending
      vi.mocked(alertsApi.list).mockReturnValue(new Promise(() => {}));
      // Brief pending
      vi.mocked(intelligenceApi.brief).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      // Wait for portfolios to load
      await waitFor(() => {
        expect(result.current.loadingStates.portfolios).toBe(false);
      });

      // Other states should still be loading
      expect(result.current.loadingStates.alerts).toBe(true);
      expect(result.current.loadingStates.brief).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });

    it("should show not loading when all data is loaded", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.loadingStates.portfolios).toBe(false);
      expect(result.current.loadingStates.alerts).toBe(false);
      expect(result.current.loadingStates.brief).toBe(false);
    });
  });

  // ==========================================================================
  // Data Aggregation
  // ==========================================================================

  describe("data aggregation", () => {
    it("should aggregate data from multiple sources", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio({ id: "1", total_value: 100000, ytd_return: 0.12 }),
        createMockPortfolio({ id: "2", total_value: 200000, ytd_return: 0.15 }),
      ]);
      const mockAlerts = createMockPaginatedResponse([
        createMockAlert({ id: "a1" }),
        createMockAlert({ id: "a2" }),
        createMockAlert({ id: "a3" }),
      ]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth({ overall_score: 85 });

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check summary
      expect(result.current.summary).not.toBeNull();
      expect(result.current.summary?.totalValue).toBe(300000);

      // Check alerts
      expect(result.current.activeAlerts).toHaveLength(3);

      // Check brief
      expect(result.current.brief).toEqual(mockBrief);
    });

    it("should return mock data when no portfolios exist", async () => {
      const mockPortfolios = createMockPaginatedResponse<typeof createMockPortfolio>(
        []
      );
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);
      const mockBrief = createMockMarketBrief();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return mock summary data
      expect(result.current.summary).not.toBeNull();
      expect(result.current.summary?.totalValue).toBe(1287500); // Mock value
    });

    it("should limit active alerts to 5", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([
        createMockAlert({ id: "a1" }),
        createMockAlert({ id: "a2" }),
        createMockAlert({ id: "a3" }),
        createMockAlert({ id: "a4" }),
        createMockAlert({ id: "a5" }),
        createMockAlert({ id: "a6" }),
        createMockAlert({ id: "a7" }),
      ]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeAlerts).toHaveLength(5);
    });
  });

  // ==========================================================================
  // Summary Calculation
  // ==========================================================================

  describe("summary calculation", () => {
    it("should calculate total value from portfolios", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio({ total_value: 50000 }),
        createMockPortfolio({ total_value: 75000 }),
        createMockPortfolio({ total_value: 25000 }),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary?.totalValue).toBe(150000);
    });

    it("should calculate average YTD return", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio({ id: "1", ytd_return: 0.1 }),
        createMockPortfolio({ id: "2", ytd_return: 0.2 }),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Average of 0.1 and 0.2 = 0.15
      expect(result.current.summary?.ytdReturn).toBeCloseTo(0.15, 2);
    });

    it("should include health score in summary", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio({ id: "portfolio-1" }),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth({
        overall_score: 92,
        overall_status: "healthy",
      });

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary?.healthScore).toBe(92);
      expect(result.current.summary?.healthStatus).toBe("healthy");
    });
  });

  // ==========================================================================
  // Mock Data Generation
  // ==========================================================================

  describe("mock data generation", () => {
    it("should generate mock allocations", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check allocations are generated
      expect(result.current.allocations).toBeDefined();
      expect(result.current.allocations.length).toBeGreaterThan(0);
      expect(result.current.allocations[0]).toHaveProperty("sector");
      expect(result.current.allocations[0]).toHaveProperty("value");
      expect(result.current.allocations[0]).toHaveProperty("weight");
    });

    it("should generate mock top holdings", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check top holdings are generated
      expect(result.current.topHoldings).toBeDefined();
      expect(result.current.topHoldings).toHaveLength(5);
      expect(result.current.topHoldings[0]).toHaveProperty("name");
      expect(result.current.topHoldings[0]).toHaveProperty("ticker");
      expect(result.current.topHoldings[0]).toHaveProperty("value");
    });

    it("should generate mock performance history", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check performance history is generated
      expect(result.current.performanceHistory).toBeDefined();
      expect(result.current.performanceHistory.length).toBeGreaterThan(0);
      expect(result.current.performanceHistory[0]).toHaveProperty("date");
      expect(result.current.performanceHistory[0]).toHaveProperty("value");
      expect(result.current.performanceHistory[0]).toHaveProperty("benchmark");
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe("error handling", () => {
    it("should return error when portfolios fetch fails", async () => {
      vi.mocked(portfoliosApi.list).mockRejectedValue(
        new Error("Portfolio fetch failed")
      );
      vi.mocked(alertsApi.list).mockResolvedValue(
        createMockPaginatedResponse([])
      );
      vi.mocked(intelligenceApi.brief).mockResolvedValue(createMockMarketBrief());

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe("Portfolio fetch failed");
    });

    it("should return error when alerts fetch fails", async () => {
      vi.mocked(portfoliosApi.list).mockResolvedValue(
        createMockPaginatedResponse([createMockPortfolio()])
      );
      vi.mocked(portfoliosApi.health).mockResolvedValue(
        createMockPortfolioHealth()
      );
      vi.mocked(alertsApi.list).mockRejectedValue(
        new Error("Alerts fetch failed")
      );
      vi.mocked(intelligenceApi.brief).mockResolvedValue(createMockMarketBrief());

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it("should return error when brief fetch fails", async () => {
      vi.mocked(portfoliosApi.list).mockResolvedValue(
        createMockPaginatedResponse([createMockPortfolio()])
      );
      vi.mocked(portfoliosApi.health).mockResolvedValue(
        createMockPortfolioHealth()
      );
      vi.mocked(alertsApi.list).mockResolvedValue(
        createMockPaginatedResponse([])
      );
      vi.mocked(intelligenceApi.brief).mockRejectedValue(
        new Error("Brief fetch failed")
      );

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  // ==========================================================================
  // Refetch Functionality
  // ==========================================================================

  describe("refetch functionality", () => {
    it("should refetch all data when refetch is called", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial calls
      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);
      expect(alertsApi.list).toHaveBeenCalledTimes(1);
      expect(intelligenceApi.brief).toHaveBeenCalledTimes(1);

      // Refetch
      act(() => {
        result.current.refetch();
      });

      // Wait for refetch to complete
      await waitFor(() => {
        expect(portfoliosApi.list).toHaveBeenCalledTimes(2);
      });

      expect(alertsApi.list).toHaveBeenCalledTimes(2);
      expect(intelligenceApi.brief).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // API Call Configuration
  // ==========================================================================

  describe("API call configuration", () => {
    it("should fetch active portfolios", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(portfoliosApi.list).toHaveBeenCalledWith({ status: "active" });
      });
    });

    it("should fetch active alerts with page_size of 5", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(alertsApi.list).toHaveBeenCalledWith({
          status: "active",
          page_size: 5,
        });
      });
    });

    it("should fetch morning brief", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio(),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(intelligenceApi.brief).toHaveBeenCalledWith("morning", undefined);
      });
    });

    it("should fetch health for first portfolio", async () => {
      const mockPortfolios = createMockPaginatedResponse([
        createMockPortfolio({ id: "first-portfolio" }),
        createMockPortfolio({ id: "second-portfolio" }),
      ]);
      const mockAlerts = createMockPaginatedResponse([]);
      const mockBrief = createMockMarketBrief();
      const mockHealth = createMockPortfolioHealth();

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockPortfolios);
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(portfoliosApi.health).toHaveBeenCalledWith("first-portfolio");
      });
    });
  });
});
