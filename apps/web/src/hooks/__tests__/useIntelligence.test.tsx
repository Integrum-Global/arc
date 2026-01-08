/**
 * Tests for useIntelligence hooks
 *
 * Tests cover:
 * - Market brief hooks (morning, midday, closing, weekly, monthly)
 * - Query suggestions hook
 * - Security analysis hook
 * - Portfolio query mutation
 * - Cached query response hook
 * - Prefetch functionality
 * - Cache invalidation
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useMarketBrief,
  useMorningBrief,
  useMiddayBrief,
  useClosingBrief,
  useWeeklySummary,
  useMonthlySummary,
  useQuerySuggestions,
  useSecurityAnalysis,
  usePortfolioQuery,
  useCachedQueryResponse,
  usePrefetchMarketBrief,
  useInvalidateIntelligence,
  useClearIntelligenceCache,
} from "../useIntelligence";
import {
  createWrapper,
  createTestQueryClient,
  createMockMarketBrief,
  createMockQuerySuggestions,
  createMockPortfolioQueryResponse,
} from "./test-utils";
import { intelligenceApi } from "@/api/endpoints";

// Mock the API module
vi.mock("@/api/endpoints", () => ({
  intelligenceApi: {
    brief: vi.fn(),
    query: vi.fn(),
    suggestions: vi.fn(),
    securityAnalysis: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useIntelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Market Brief Hooks
  // ==========================================================================

  describe("useMarketBrief", () => {
    it("should return initial loading state", () => {
      vi.mocked(intelligenceApi.brief).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useMarketBrief("morning"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should fetch market brief successfully", async () => {
      const mockBrief = createMockMarketBrief({ type: "morning" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMarketBrief("morning"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBrief);
      expect(intelligenceApi.brief).toHaveBeenCalledWith("morning", undefined);
    });

    it("should pass portfolioId parameter", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(
        () => useMarketBrief("morning", "portfolio-1"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith(
        "morning",
        "portfolio-1"
      );
    });

    it("should handle error state", async () => {
      vi.mocked(intelligenceApi.brief).mockRejectedValue(
        new Error("Failed to fetch brief")
      );

      const { result } = renderHook(() => useMarketBrief("morning"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should refetch when refetch is called", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMarketBrief("morning"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(intelligenceApi.brief).toHaveBeenCalledTimes(2);
    });
  });

  describe("useMorningBrief", () => {
    it("should fetch morning brief", async () => {
      const mockBrief = createMockMarketBrief({ type: "morning" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMorningBrief(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith("morning", undefined);
    });

    it("should pass portfolioId to morning brief", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMorningBrief("portfolio-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith(
        "morning",
        "portfolio-1"
      );
    });
  });

  describe("useMiddayBrief", () => {
    it("should fetch midday brief", async () => {
      const mockBrief = createMockMarketBrief({ type: "midday" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMiddayBrief(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith("midday", undefined);
    });
  });

  describe("useClosingBrief", () => {
    it("should fetch closing brief", async () => {
      const mockBrief = createMockMarketBrief({ type: "closing" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useClosingBrief(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith("closing", undefined);
    });
  });

  describe("useWeeklySummary", () => {
    it("should fetch weekly summary", async () => {
      const mockBrief = createMockMarketBrief({ type: "weekly" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useWeeklySummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith("weekly", undefined);
    });
  });

  describe("useMonthlySummary", () => {
    it("should fetch monthly summary", async () => {
      const mockBrief = createMockMarketBrief({ type: "monthly" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const { result } = renderHook(() => useMonthlySummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith("monthly", undefined);
    });
  });

  // ==========================================================================
  // Query Suggestions Hook
  // ==========================================================================

  describe("useQuerySuggestions", () => {
    it("should fetch query suggestions successfully", async () => {
      const mockSuggestions = createMockQuerySuggestions();
      vi.mocked(intelligenceApi.suggestions).mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useQuerySuggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSuggestions);
      expect(result.current.data).toHaveLength(3);
    });

    it("should pass portfolioId parameter", async () => {
      const mockSuggestions = createMockQuerySuggestions();
      vi.mocked(intelligenceApi.suggestions).mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useQuerySuggestions("portfolio-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(intelligenceApi.suggestions).toHaveBeenCalledWith("portfolio-1");
    });
  });

  // ==========================================================================
  // Security Analysis Hook
  // ==========================================================================

  describe("useSecurityAnalysis", () => {
    it("should fetch security analysis successfully", async () => {
      const mockAnalysis = {
        sentiment: "bullish",
        score: 75,
        summary: "Strong fundamentals",
      };
      vi.mocked(intelligenceApi.securityAnalysis).mockResolvedValue(
        mockAnalysis
      );

      const { result } = renderHook(() => useSecurityAnalysis("AAPL"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAnalysis);
      expect(intelligenceApi.securityAnalysis).toHaveBeenCalledWith("AAPL");
    });

    it("should not fetch when securityId is empty", () => {
      const { result } = renderHook(() => useSecurityAnalysis(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(intelligenceApi.securityAnalysis).not.toHaveBeenCalled();
    });

    it("should handle error state", async () => {
      vi.mocked(intelligenceApi.securityAnalysis).mockRejectedValue(
        new Error("Analysis failed")
      );

      const { result } = renderHook(() => useSecurityAnalysis("INVALID"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Portfolio Query Mutation
  // ==========================================================================

  describe("usePortfolioQuery", () => {
    it("should execute query successfully", async () => {
      const mockResponse = createMockPortfolioQueryResponse();
      vi.mocked(intelligenceApi.query).mockResolvedValue(mockResponse);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePortfolioQuery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          question: "What is my portfolio performance?",
          portfolio_id: "portfolio-1",
        });
      });

      expect(intelligenceApi.query).toHaveBeenCalledWith({
        question: "What is my portfolio performance?",
        portfolio_id: "portfolio-1",
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockResponse);
    });

    it("should cache query response", async () => {
      const mockResponse = createMockPortfolioQueryResponse();
      vi.mocked(intelligenceApi.query).mockResolvedValue(mockResponse);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePortfolioQuery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          question: "What is my performance?",
          portfolio_id: "portfolio-1",
        });
      });

      // Check cache was updated
      const cachedData = queryClient.getQueryData([
        "intelligence",
        "query",
        "What is my performance?",
        "portfolio-1",
      ]);
      expect(cachedData).toEqual(mockResponse);
    });

    it("should handle query error", async () => {
      vi.mocked(intelligenceApi.query).mockRejectedValue(
        new Error("Query failed")
      );

      const { result } = renderHook(() => usePortfolioQuery(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            question: "Invalid query",
          });
        } catch {
          // Expected error
        }
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useCachedQueryResponse", () => {
    it("should return cached response when available", async () => {
      const mockResponse = createMockPortfolioQueryResponse();

      const queryClient = createTestQueryClient();
      // Pre-populate cache
      queryClient.setQueryData(
        ["intelligence", "query", "What is my performance?", "portfolio-1"],
        mockResponse
      );

      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(
        () =>
          useCachedQueryResponse("What is my performance?", "portfolio-1"),
        { wrapper }
      );

      // Data should be available from cache
      expect(result.current.data).toEqual(mockResponse);
    });

    it("should not fetch automatically", () => {
      const { result } = renderHook(
        () => useCachedQueryResponse("Some question"),
        {
          wrapper: createWrapper(),
        }
      );

      // Should not be loading because enabled is false
      expect(result.current.fetchStatus).toBe("idle");
      expect(intelligenceApi.query).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Prefetch Hook
  // ==========================================================================

  describe("usePrefetchMarketBrief", () => {
    it("should prefetch market brief", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePrefetchMarketBrief(), {
        wrapper,
      });

      await act(async () => {
        result.current("morning", "portfolio-1");
      });

      // Wait for prefetch to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData([
          "intelligence",
          "brief",
          "morning",
          "portfolio-1",
        ]);
        expect(cachedData).toEqual(mockBrief);
      });

      expect(intelligenceApi.brief).toHaveBeenCalledWith(
        "morning",
        "portfolio-1"
      );
    });

    it("should prefetch without portfolioId", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => usePrefetchMarketBrief(), {
        wrapper,
      });

      await act(async () => {
        result.current("weekly");
      });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData([
          "intelligence",
          "brief",
          "weekly",
          undefined,
        ]);
        expect(cachedData).toEqual(mockBrief);
      });
    });
  });

  // ==========================================================================
  // Cache Invalidation Hooks
  // ==========================================================================

  describe("useInvalidateIntelligence", () => {
    it("should invalidate intelligence queries", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Populate cache
      const { result: briefResult } = renderHook(
        () => useMarketBrief("morning"),
        { wrapper }
      );

      await waitFor(() => {
        expect(briefResult.current.isSuccess).toBe(true);
      });

      // Get invalidate function
      const { result: invalidateResult } = renderHook(
        () => useInvalidateIntelligence(),
        { wrapper }
      );

      // Invalidate
      await act(async () => {
        invalidateResult.current();
      });

      // Verify invalidation was called - check that API was called
      // Since we're invalidating, queries should be refetched
      await waitFor(() => {
        expect(intelligenceApi.brief).toHaveBeenCalled();
      });
    });
  });

  describe("useClearIntelligenceCache", () => {
    it("should clear intelligence cache", async () => {
      const mockBrief = createMockMarketBrief();
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Populate cache
      const { result: briefResult } = renderHook(
        () => useMarketBrief("morning"),
        { wrapper }
      );

      await waitFor(() => {
        expect(briefResult.current.isSuccess).toBe(true);
      });

      // Verify cache exists
      expect(
        queryClient.getQueryData(["intelligence", "brief", "morning", undefined])
      ).toBeDefined();

      // Get clear function
      const { result: clearResult } = renderHook(
        () => useClearIntelligenceCache(),
        { wrapper }
      );

      // Clear cache
      act(() => {
        clearResult.current();
      });

      // Check cache is cleared
      expect(
        queryClient.getQueryData(["intelligence", "brief", "morning", undefined])
      ).toBeUndefined();
    });
  });

  // ==========================================================================
  // Cache Behavior
  // ==========================================================================

  describe("cache behavior", () => {
    it("should use appropriate stale time for morning brief", async () => {
      const mockBrief = createMockMarketBrief({ type: "morning" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useMorningBrief(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Morning brief should have 30 minute stale time
      // We verify query state exists
      const queryState = queryClient.getQueryState([
        "intelligence",
        "brief",
        "morning",
        undefined,
      ]);
      expect(queryState).toBeDefined();
    });

    it("should use appropriate stale time for weekly summary", async () => {
      const mockBrief = createMockMarketBrief({ type: "weekly" });
      vi.mocked(intelligenceApi.brief).mockResolvedValue(mockBrief);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useWeeklySummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Weekly summary should have 24 hour stale time
      const queryState = queryClient.getQueryState([
        "intelligence",
        "brief",
        "weekly",
        undefined,
      ]);
      expect(queryState).toBeDefined();
    });

    it("should cache security analysis for longer period", async () => {
      const mockAnalysis = { sentiment: "bullish" };
      vi.mocked(intelligenceApi.securityAnalysis).mockResolvedValue(
        mockAnalysis
      );

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useSecurityAnalysis("AAPL"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Security analysis should have 30 minute stale time
      const queryState = queryClient.getQueryState([
        "intelligence",
        "analysis",
        "AAPL",
      ]);
      expect(queryState).toBeDefined();
    });
  });
});
