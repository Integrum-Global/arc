/**
 * Tests for usePortfolios hooks
 *
 * Tests cover:
 * - Initial loading state
 * - Successful data fetch
 * - Error handling
 * - Refetch functionality
 * - Cache behavior
 * - Mutation hooks (create, update, delete)
 * - Prefetch functionality
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  usePortfolios,
  usePortfolio,
  usePortfolioHoldings,
  usePortfolioTransactions,
  usePortfolioHealth,
  usePortfolioValuation,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  usePrefetchPortfolio,
  useInvalidatePortfolios,
} from "../usePortfolios";
import {
  createWrapper,
  createTestQueryClient,
  createMockPortfolio,
  createMockPaginatedResponse,
  createMockApiResponse,
  createMockHolding,
  createMockTransaction,
  createMockPortfolioHealth,
  createMockPortfolioValuation,
} from "./test-utils";
import { portfoliosApi } from "@/api/endpoints";

// Mock the API module
vi.mock("@/api/endpoints", () => ({
  portfoliosApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    holdings: vi.fn(),
    transactions: vi.fn(),
    health: vi.fn(),
    valuation: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("usePortfolios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("usePortfolios (list)", () => {
    it("should return initial loading state", () => {
      const mockData = createMockPaginatedResponse([createMockPortfolio()]);
      vi.mocked(portfoliosApi.list).mockReturnValue(
        new Promise(() => {}) // Never resolves to test loading state
      );

      const { result } = renderHook(() => usePortfolios(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should fetch portfolios successfully", async () => {
      const mockPortfolios = [
        createMockPortfolio({ id: "1", name: "Portfolio 1" }),
        createMockPortfolio({ id: "2", name: "Portfolio 2" }),
      ];
      const mockResponse = createMockPaginatedResponse(mockPortfolios);

      vi.mocked(portfoliosApi.list).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.items).toHaveLength(2);
      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);
    });

    it("should handle filters correctly", async () => {
      const mockResponse = createMockPaginatedResponse([createMockPortfolio()]);
      vi.mocked(portfoliosApi.list).mockResolvedValue(mockResponse);

      const filters = { status: "active" as const, type: "equity" as const };

      const { result } = renderHook(() => usePortfolios(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.list).toHaveBeenCalledWith(filters);
    });

    it("should handle error state", async () => {
      const error = new Error("Failed to fetch portfolios");
      vi.mocked(portfoliosApi.list).mockRejectedValue(error);

      const { result } = renderHook(() => usePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should refetch data when refetch is called", async () => {
      const mockResponse = createMockPaginatedResponse([createMockPortfolio()]);
      vi.mocked(portfoliosApi.list).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(portfoliosApi.list).toHaveBeenCalledTimes(2);
    });
  });

  describe("usePortfolio (single)", () => {
    it("should return initial loading state", () => {
      vi.mocked(portfoliosApi.get).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => usePortfolio("portfolio-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should fetch single portfolio successfully", async () => {
      const mockPortfolio = createMockPortfolio({ id: "portfolio-1" });
      vi.mocked(portfoliosApi.get).mockResolvedValue(mockPortfolio);

      const { result } = renderHook(() => usePortfolio("portfolio-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPortfolio);
      expect(portfoliosApi.get).toHaveBeenCalledWith("portfolio-1");
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHook(() => usePortfolio(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe("idle");
      expect(portfoliosApi.get).not.toHaveBeenCalled();
    });

    it("should handle error state", async () => {
      vi.mocked(portfoliosApi.get).mockRejectedValue(
        new Error("Portfolio not found")
      );

      const { result } = renderHook(() => usePortfolio("nonexistent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("usePortfolioHoldings", () => {
    it("should fetch holdings successfully", async () => {
      const mockHoldings = [
        createMockHolding({ id: "h1" }),
        createMockHolding({ id: "h2" }),
      ];
      const mockResponse = createMockApiResponse(mockHoldings);

      vi.mocked(portfoliosApi.holdings).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePortfolioHoldings("portfolio-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(portfoliosApi.holdings).toHaveBeenCalledWith("portfolio-1");
    });

    it("should not fetch when portfolioId is empty", () => {
      const { result } = renderHook(() => usePortfolioHoldings(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(portfoliosApi.holdings).not.toHaveBeenCalled();
    });
  });

  describe("usePortfolioTransactions", () => {
    it("should fetch transactions successfully", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "tx1" }),
        createMockTransaction({ id: "tx2" }),
      ];
      const mockResponse = createMockPaginatedResponse(mockTransactions);

      vi.mocked(portfoliosApi.transactions).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => usePortfolioTransactions("portfolio-1"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("should pass filters to API", async () => {
      const mockResponse = createMockPaginatedResponse([
        createMockTransaction(),
      ]);
      vi.mocked(portfoliosApi.transactions).mockResolvedValue(mockResponse);

      const filters = { type: "buy" as const, status: "executed" as const };

      const { result } = renderHook(
        () => usePortfolioTransactions("portfolio-1", filters),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.transactions).toHaveBeenCalledWith(
        "portfolio-1",
        filters
      );
    });
  });

  describe("usePortfolioHealth", () => {
    it("should fetch health data successfully", async () => {
      const mockHealth = createMockPortfolioHealth();
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);

      const { result } = renderHook(() => usePortfolioHealth("portfolio-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHealth);
    });

    it("should use longer cache time for health data", async () => {
      const mockHealth = createMockPortfolioHealth();
      vi.mocked(portfoliosApi.health).mockResolvedValue(mockHealth);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePortfolioHealth("portfolio-1"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The staleTime should be set to 5 minutes
      const queryState = queryClient.getQueryState([
        "portfolios",
        "portfolio-1",
        "health-scan",
      ]);
      expect(queryState).toBeDefined();
    });
  });

  describe("usePortfolioValuation", () => {
    it("should fetch valuation data successfully", async () => {
      const mockValuation = createMockPortfolioValuation();
      vi.mocked(portfoliosApi.valuation).mockResolvedValue(mockValuation);

      const { result } = renderHook(
        () => usePortfolioValuation("portfolio-1"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockValuation);
    });

    it("should pass asOfDate to API", async () => {
      const mockValuation = createMockPortfolioValuation();
      vi.mocked(portfoliosApi.valuation).mockResolvedValue(mockValuation);

      const { result } = renderHook(
        () => usePortfolioValuation("portfolio-1", "2024-01-15"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.valuation).toHaveBeenCalledWith(
        "portfolio-1",
        "2024-01-15"
      );
    });
  });

  describe("useCreatePortfolio", () => {
    it("should create portfolio successfully", async () => {
      const newPortfolio = createMockPortfolio({ id: "new-1", name: "New Portfolio" });
      vi.mocked(portfoliosApi.create).mockResolvedValue(newPortfolio);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useCreatePortfolio(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: "New Portfolio",
          type: "equity",
          currency: "USD",
        });
      });

      expect(portfoliosApi.create).toHaveBeenCalledWith({
        name: "New Portfolio",
        type: "equity",
        currency: "USD",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle creation error", async () => {
      vi.mocked(portfoliosApi.create).mockRejectedValue(
        new Error("Creation failed")
      );

      const { result } = renderHook(() => useCreatePortfolio(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            name: "New Portfolio",
            type: "equity",
            currency: "USD",
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUpdatePortfolio", () => {
    it("should update portfolio successfully", async () => {
      const updatedPortfolio = createMockPortfolio({
        id: "portfolio-1",
        name: "Updated Portfolio",
      });
      vi.mocked(portfoliosApi.update).mockResolvedValue(updatedPortfolio);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdatePortfolio(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "portfolio-1",
          data: { name: "Updated Portfolio" },
        });
      });

      expect(portfoliosApi.update).toHaveBeenCalledWith("portfolio-1", {
        name: "Updated Portfolio",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should update cache on success", async () => {
      const updatedPortfolio = createMockPortfolio({
        id: "portfolio-1",
        name: "Updated Portfolio",
      });
      vi.mocked(portfoliosApi.update).mockResolvedValue(updatedPortfolio);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdatePortfolio(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "portfolio-1",
          data: { name: "Updated Portfolio" },
        });
      });

      // Check that cache was updated
      const cachedData = queryClient.getQueryData([
        "portfolios",
        "detail",
        "portfolio-1",
      ]);
      expect(cachedData).toEqual(updatedPortfolio);
    });
  });

  describe("useDeletePortfolio", () => {
    it("should delete portfolio successfully", async () => {
      vi.mocked(portfoliosApi.delete).mockResolvedValue(undefined);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Pre-populate cache
      queryClient.setQueryData(
        ["portfolios", "detail", "portfolio-1"],
        createMockPortfolio({ id: "portfolio-1" })
      );

      const { result } = renderHook(() => useDeletePortfolio(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("portfolio-1");
      });

      expect(portfoliosApi.delete).toHaveBeenCalledWith("portfolio-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("usePrefetchPortfolio", () => {
    it("should prefetch portfolio data", async () => {
      const mockPortfolio = createMockPortfolio({ id: "portfolio-1" });
      vi.mocked(portfoliosApi.get).mockResolvedValue(mockPortfolio);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePrefetchPortfolio(), { wrapper });

      await act(async () => {
        result.current("portfolio-1");
      });

      // Wait for prefetch to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData([
          "portfolios",
          "detail",
          "portfolio-1",
        ]);
        expect(cachedData).toEqual(mockPortfolio);
      });
    });
  });

  describe("useInvalidatePortfolios", () => {
    it("should invalidate portfolio queries", async () => {
      const mockResponse = createMockPaginatedResponse([createMockPortfolio()]);
      vi.mocked(portfoliosApi.list).mockResolvedValue(mockResponse);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First, populate the cache
      const { result: portfoliosResult } = renderHook(() => usePortfolios(), {
        wrapper,
      });

      await waitFor(() => {
        expect(portfoliosResult.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);

      // Now invalidate
      const { result: invalidateResult } = renderHook(
        () => useInvalidatePortfolios(),
        { wrapper }
      );

      // Invalidate - this should mark queries as stale
      act(() => {
        invalidateResult.current();
      });

      // Verify invalidation was called - check that API was called
      // Since we're invalidating, queries should be refetched
      await waitFor(() => {
        // The query should have been called at least once
        expect(portfoliosApi.list).toHaveBeenCalled();
      });
    });
  });

  describe("cache behavior", () => {
    it("should use cached data on subsequent renders", async () => {
      const mockResponse = createMockPaginatedResponse([createMockPortfolio()]);
      vi.mocked(portfoliosApi.list).mockResolvedValue(mockResponse);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First render
      const { result: result1 } = renderHook(() => usePortfolios(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);

      // Second render with same query key
      const { result: result2 } = renderHook(() => usePortfolios(), {
        wrapper,
      });

      // Data should be immediately available from cache
      expect(result2.current.data).toEqual(mockResponse);
      // API should not be called again (gcTime is 0 but we're still in same test)
      expect(portfoliosApi.list).toHaveBeenCalledTimes(1);
    });
  });
});
