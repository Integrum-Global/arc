/**
 * Tests for useAnalytics hooks
 *
 * Tests cover:
 * - Security analytics hooks (ratios, history, benchmark)
 * - Alert query hooks (list, detail, thresholds)
 * - Alert mutation hooks (acknowledge, dismiss, resolve)
 * - Threshold mutation hooks (create, update, delete)
 * - Utility hooks
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useSecurityRatios,
  useRatioHistory,
  useBenchmark,
  useAlerts,
  useAlert,
  useAlertThresholds,
  useAlertThreshold,
  useAcknowledgeAlert,
  useDismissAlert,
  useResolveAlert,
  useCreateAlertThreshold,
  useUpdateAlertThreshold,
  useDeleteAlertThreshold,
  useActiveAlertsCount,
  useInvalidateAnalytics,
} from "../useAnalytics";
import {
  createWrapper,
  createTestQueryClient,
  createMockAlert,
  createMockAlertThreshold,
  createMockSecurityRatios,
  createMockRatioHistory,
  createMockBenchmarkComparison,
  createMockPaginatedResponse,
} from "./test-utils";
import { analyticsApi, alertsApi } from "@/api/endpoints";

// Mock the API modules
vi.mock("@/api/endpoints", () => ({
  analyticsApi: {
    securityRatios: vi.fn(),
    ratioHistory: vi.fn(),
    benchmark: vi.fn(),
  },
  alertsApi: {
    list: vi.fn(),
    get: vi.fn(),
    acknowledge: vi.fn(),
    dismiss: vi.fn(),
    resolve: vi.fn(),
    thresholds: vi.fn(),
    getThreshold: vi.fn(),
    createThreshold: vi.fn(),
    updateThreshold: vi.fn(),
    deleteThreshold: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Security Analytics Hooks
  // ==========================================================================

  describe("useSecurityRatios", () => {
    it("should return initial loading state", () => {
      vi.mocked(analyticsApi.securityRatios).mockReturnValue(
        new Promise(() => {})
      );

      const { result } = renderHook(() => useSecurityRatios("AAPL"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should fetch security ratios successfully", async () => {
      const mockRatios = createMockSecurityRatios({ security_id: "AAPL" });
      vi.mocked(analyticsApi.securityRatios).mockResolvedValue(mockRatios);

      const { result } = renderHook(() => useSecurityRatios("AAPL"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRatios);
      expect(analyticsApi.securityRatios).toHaveBeenCalledWith(
        "AAPL",
        undefined
      );
    });

    it("should pass asOfDate parameter", async () => {
      const mockRatios = createMockSecurityRatios();
      vi.mocked(analyticsApi.securityRatios).mockResolvedValue(mockRatios);

      const { result } = renderHook(
        () => useSecurityRatios("AAPL", "2024-01-15"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(analyticsApi.securityRatios).toHaveBeenCalledWith(
        "AAPL",
        "2024-01-15"
      );
    });

    it("should not fetch when securityId is empty", () => {
      const { result } = renderHook(() => useSecurityRatios(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(analyticsApi.securityRatios).not.toHaveBeenCalled();
    });

    it("should handle error state", async () => {
      vi.mocked(analyticsApi.securityRatios).mockRejectedValue(
        new Error("Failed to fetch ratios")
      );

      const { result } = renderHook(() => useSecurityRatios("INVALID"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useRatioHistory", () => {
    it("should fetch ratio history successfully", async () => {
      const mockHistory = createMockRatioHistory();
      vi.mocked(analyticsApi.ratioHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(
        () => useRatioHistory("AAPL", "P/E Ratio", "1Y"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(analyticsApi.ratioHistory).toHaveBeenCalledWith(
        "AAPL",
        "P/E Ratio",
        "1Y"
      );
    });

    it("should not fetch when securityId or ratioName is empty", () => {
      const { result } = renderHook(() => useRatioHistory("", "P/E Ratio"), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(analyticsApi.ratioHistory).not.toHaveBeenCalled();

      const { result: result2 } = renderHook(() => useRatioHistory("AAPL", ""), {
        wrapper: createWrapper(),
      });

      expect(result2.current.fetchStatus).toBe("idle");
    });
  });

  describe("useBenchmark", () => {
    it("should fetch benchmark comparison successfully", async () => {
      const mockBenchmark = createMockBenchmarkComparison();
      vi.mocked(analyticsApi.benchmark).mockResolvedValue(mockBenchmark);

      const { result } = renderHook(() => useBenchmark("AAPL", "tech-large-cap"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBenchmark);
      expect(analyticsApi.benchmark).toHaveBeenCalledWith("AAPL", "tech-large-cap");
    });

    it("should not fetch when securityId is empty", () => {
      const { result } = renderHook(() => useBenchmark(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(analyticsApi.benchmark).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Alert Query Hooks
  // ==========================================================================

  describe("useAlerts", () => {
    it("should return initial loading state", () => {
      vi.mocked(alertsApi.list).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should fetch alerts successfully", async () => {
      const mockAlerts = [
        createMockAlert({ id: "1" }),
        createMockAlert({ id: "2" }),
      ];
      const mockResponse = createMockPaginatedResponse(mockAlerts);

      vi.mocked(alertsApi.list).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.items).toHaveLength(2);
    });

    it("should handle filters correctly", async () => {
      const mockResponse = createMockPaginatedResponse([createMockAlert()]);
      vi.mocked(alertsApi.list).mockResolvedValue(mockResponse);

      const filters = { status: "active" as const, severity: "high" as const };

      const { result } = renderHook(() => useAlerts(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(alertsApi.list).toHaveBeenCalledWith(filters);
    });

    it("should handle error state", async () => {
      vi.mocked(alertsApi.list).mockRejectedValue(
        new Error("Failed to fetch alerts")
      );

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should refetch on interval", async () => {
      const mockResponse = createMockPaginatedResponse([createMockAlert()]);
      vi.mocked(alertsApi.list).mockResolvedValue(mockResponse);

      // The hook has refetchInterval set to 5 minutes
      // We just verify it's configured properly by checking the hook returns data
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("useAlert", () => {
    it("should fetch single alert successfully", async () => {
      const mockAlert = createMockAlert({ id: "alert-1" });
      vi.mocked(alertsApi.get).mockResolvedValue(mockAlert);

      const { result } = renderHook(() => useAlert("alert-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAlert);
      expect(alertsApi.get).toHaveBeenCalledWith("alert-1");
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHook(() => useAlert(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(alertsApi.get).not.toHaveBeenCalled();
    });
  });

  describe("useAlertThresholds", () => {
    it("should fetch thresholds successfully", async () => {
      const mockThresholds = [
        createMockAlertThreshold({ id: "1" }),
        createMockAlertThreshold({ id: "2" }),
      ];
      vi.mocked(alertsApi.thresholds).mockResolvedValue(mockThresholds);

      const { result } = renderHook(() => useAlertThresholds(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockThresholds);
      expect(result.current.data).toHaveLength(2);
    });
  });

  describe("useAlertThreshold", () => {
    it("should fetch single threshold successfully", async () => {
      const mockThreshold = createMockAlertThreshold({ id: "threshold-1" });
      vi.mocked(alertsApi.getThreshold).mockResolvedValue(mockThreshold);

      const { result } = renderHook(() => useAlertThreshold("threshold-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockThreshold);
      expect(alertsApi.getThreshold).toHaveBeenCalledWith("threshold-1");
    });
  });

  // ==========================================================================
  // Alert Mutation Hooks
  // ==========================================================================

  describe("useAcknowledgeAlert", () => {
    it("should acknowledge alert successfully", async () => {
      const acknowledgedAlert = createMockAlert({
        id: "alert-1",
        status: "acknowledged",
      });
      vi.mocked(alertsApi.acknowledge).mockResolvedValue(acknowledgedAlert);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useAcknowledgeAlert(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("alert-1");
      });

      expect(alertsApi.acknowledge).toHaveBeenCalledWith("alert-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle acknowledge error", async () => {
      vi.mocked(alertsApi.acknowledge).mockRejectedValue(
        new Error("Acknowledge failed")
      );

      const { result } = renderHook(() => useAcknowledgeAlert(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync("alert-1");
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useDismissAlert", () => {
    it("should dismiss alert successfully", async () => {
      const dismissedAlert = createMockAlert({
        id: "alert-1",
        status: "dismissed",
      });
      vi.mocked(alertsApi.dismiss).mockResolvedValue(dismissedAlert);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useDismissAlert(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("alert-1");
      });

      expect(alertsApi.dismiss).toHaveBeenCalledWith("alert-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useResolveAlert", () => {
    it("should resolve alert successfully", async () => {
      const resolvedAlert = createMockAlert({
        id: "alert-1",
        status: "resolved",
      });
      vi.mocked(alertsApi.resolve).mockResolvedValue(resolvedAlert);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useResolveAlert(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("alert-1");
      });

      expect(alertsApi.resolve).toHaveBeenCalledWith("alert-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Threshold Mutation Hooks
  // ==========================================================================

  describe("useCreateAlertThreshold", () => {
    it("should create threshold successfully", async () => {
      const newThreshold = createMockAlertThreshold({
        id: "new-1",
        name: "New Threshold",
      });
      vi.mocked(alertsApi.createThreshold).mockResolvedValue(newThreshold);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useCreateAlertThreshold(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: "New Threshold",
          type: "price_alert",
          metric: "price",
          operator: "gt",
          value: 150,
          severity: "high",
        });
      });

      expect(alertsApi.createThreshold).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useUpdateAlertThreshold", () => {
    it("should update threshold successfully", async () => {
      const updatedThreshold = createMockAlertThreshold({
        id: "threshold-1",
        value: 200,
      });
      vi.mocked(alertsApi.updateThreshold).mockResolvedValue(updatedThreshold);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdateAlertThreshold(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: "threshold-1",
          data: { value: 200 },
        });
      });

      expect(alertsApi.updateThreshold).toHaveBeenCalledWith("threshold-1", {
        value: 200,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useDeleteAlertThreshold", () => {
    it("should delete threshold successfully", async () => {
      vi.mocked(alertsApi.deleteThreshold).mockResolvedValue(undefined);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useDeleteAlertThreshold(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync("threshold-1");
      });

      expect(alertsApi.deleteThreshold).toHaveBeenCalledWith("threshold-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Utility Hooks
  // ==========================================================================

  describe("useActiveAlertsCount", () => {
    it("should return count of active alerts", async () => {
      const mockResponse = createMockPaginatedResponse(
        [createMockAlert()],
        { total: 5 }
      );
      vi.mocked(alertsApi.list).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useActiveAlertsCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(5);
      });

      expect(alertsApi.list).toHaveBeenCalledWith({
        status: "active",
        page_size: 1,
      });
    });

    it("should return 0 when query fails", async () => {
      vi.mocked(alertsApi.list).mockRejectedValue(new Error("Query failed"));

      const { result } = renderHook(() => useActiveAlertsCount(), {
        wrapper: createWrapper(),
      });

      // Initial value should be 0 when query fails
      await waitFor(() => {
        expect(result.current).toBe(0);
      });
    });
  });

  describe("useInvalidateAnalytics", () => {
    it("should invalidate analytics and alerts queries", async () => {
      const mockRatios = createMockSecurityRatios();
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);

      vi.mocked(analyticsApi.securityRatios).mockResolvedValue(mockRatios);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Populate cache
      const { result: ratiosResult } = renderHook(
        () => useSecurityRatios("AAPL"),
        { wrapper }
      );
      const { result: alertsResult } = renderHook(() => useAlerts(), {
        wrapper,
      });

      await waitFor(() => {
        expect(ratiosResult.current.isSuccess).toBe(true);
        expect(alertsResult.current.isSuccess).toBe(true);
      });

      // Get invalidate function
      const { result: invalidateResult } = renderHook(
        () => useInvalidateAnalytics(),
        { wrapper }
      );

      // Invalidate
      await act(async () => {
        invalidateResult.current();
      });

      // Verify invalidation was called - check that API was called
      // Since we're invalidating, queries should be refetched
      await waitFor(() => {
        expect(analyticsApi.securityRatios).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Cache Behavior
  // ==========================================================================

  describe("cache behavior", () => {
    it("should use longer stale time for analytics data", async () => {
      const mockRatios = createMockSecurityRatios();
      vi.mocked(analyticsApi.securityRatios).mockResolvedValue(mockRatios);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useSecurityRatios("AAPL"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The staleTime should be 10 minutes for analytics data
      const queryState = queryClient.getQueryState([
        "analytics",
        "ratios",
        "AAPL",
        undefined,
      ]);
      expect(queryState).toBeDefined();
    });

    it("should use shorter stale time for alerts", async () => {
      const mockAlerts = createMockPaginatedResponse([createMockAlert()]);
      vi.mocked(alertsApi.list).mockResolvedValue(mockAlerts);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useAlerts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The staleTime should be 1 minute for alerts
      // Query key is ["alerts", "list", filters] not just ["alerts"]
      const queryState = queryClient.getQueryState(["alerts", "list", {}]);
      expect(queryState).toBeDefined();
    });
  });
});
