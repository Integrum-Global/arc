/**
 * Analytics Hooks
 * React Query hooks for analytics and alert operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { analyticsApi, alertsApi } from "@/api/endpoints";
import {
  createMutationErrorHandler,
  shouldRetryQuery,
} from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import type {
  SecurityRatios,
  RatioHistory,
  BenchmarkComparison,
  Alert,
  AlertListFilters,
  AlertThreshold,
  CreateAlertThresholdRequest,
  UpdateAlertThresholdRequest,
  PaginatedResponse,
} from "@/types/api";
import { toast } from "sonner";

// =============================================================================
// Security Analytics Hooks
// =============================================================================

/**
 * Hook to fetch security ratios
 */
export function useSecurityRatios(
  securityId: string,
  asOfDate?: string,
  options?: Omit<UseQueryOptions<SecurityRatios>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.analytics.securityRatios(securityId, asOfDate),
    queryFn: () => analyticsApi.securityRatios(securityId, asOfDate),
    enabled: !!securityId,
    retry: shouldRetryQuery,
    // Analytics data can be cached longer
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch ratio history for a security
 */
export function useRatioHistory(
  securityId: string,
  ratioName: string,
  period?: "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "MAX",
  options?: Omit<UseQueryOptions<RatioHistory>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [
      ...queryKeys.analytics.securityRatios(securityId),
      ratioName,
      "history",
      period,
    ],
    queryFn: () => analyticsApi.ratioHistory(securityId, ratioName, period),
    enabled: !!securityId && !!ratioName,
    retry: shouldRetryQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch benchmark comparison for a security
 */
export function useBenchmark(
  securityId: string,
  peerGroupId?: string,
  options?: Omit<UseQueryOptions<BenchmarkComparison>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.analytics.benchmark(securityId, peerGroupId),
    queryFn: () => analyticsApi.benchmark(securityId, peerGroupId),
    enabled: !!securityId,
    retry: shouldRetryQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// =============================================================================
// Alert Query Hooks
// =============================================================================

/**
 * Hook to fetch paginated list of alerts
 */
export function useAlerts(
  filters?: AlertListFilters,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Alert>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.alerts.list((filters || {}) as Record<string, unknown>),
    queryFn: () => alertsApi.list(filters),
    retry: shouldRetryQuery,
    // Alerts should refresh more frequently
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single alert by ID
 */
export function useAlert(
  id: string,
  options?: Omit<UseQueryOptions<Alert>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, "detail", id],
    queryFn: () => alertsApi.get(id),
    enabled: !!id,
    retry: shouldRetryQuery,
    ...options,
  });
}

/**
 * Hook to fetch alert thresholds
 */
export function useAlertThresholds(
  options?: Omit<UseQueryOptions<AlertThreshold[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.alerts.thresholds(),
    queryFn: () => alertsApi.thresholds(),
    retry: shouldRetryQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single alert threshold
 */
export function useAlertThreshold(
  id: string,
  options?: Omit<UseQueryOptions<AlertThreshold>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.alerts.thresholds(), id],
    queryFn: () => alertsApi.getThreshold(id),
    enabled: !!id,
    retry: shouldRetryQuery,
    ...options,
  });
}

// =============================================================================
// Alert Mutation Hooks
// =============================================================================

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: (alert) => {
      // Update alert in cache
      queryClient.setQueryData(
        [...queryKeys.alerts.all, "detail", alert.id],
        alert
      );
      // Invalidate alerts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.all,
        exact: false,
      });
      toast.success("Alert acknowledged", {
        description: `Alert "${alert.title}" has been acknowledged.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to acknowledge alert",
    }),
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.dismiss(id),
    onSuccess: (alert) => {
      // Update alert in cache
      queryClient.setQueryData(
        [...queryKeys.alerts.all, "detail", alert.id],
        alert
      );
      // Invalidate alerts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.all,
        exact: false,
      });
      toast.success("Alert dismissed", {
        description: `Alert "${alert.title}" has been dismissed.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to dismiss alert",
    }),
  });
}

/**
 * Hook to resolve an alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: (alert) => {
      // Update alert in cache
      queryClient.setQueryData(
        [...queryKeys.alerts.all, "detail", alert.id],
        alert
      );
      // Invalidate alerts list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.all,
        exact: false,
      });
      toast.success("Alert resolved", {
        description: `Alert "${alert.title}" has been resolved.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to resolve alert",
    }),
  });
}

// =============================================================================
// Alert Threshold Mutation Hooks
// =============================================================================

/**
 * Hook to create an alert threshold
 */
export function useCreateAlertThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlertThresholdRequest) =>
      alertsApi.createThreshold(data),
    onSuccess: (threshold) => {
      // Invalidate thresholds list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.thresholds(),
      });
      toast.success("Threshold created", {
        description: `Alert threshold "${threshold.name}" has been created.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to create threshold",
    }),
  });
}

/**
 * Hook to update an alert threshold
 */
export function useUpdateAlertThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAlertThresholdRequest;
    }) => alertsApi.updateThreshold(id, data),
    onSuccess: (threshold) => {
      // Update threshold in cache
      queryClient.setQueryData(
        [...queryKeys.alerts.thresholds(), threshold.id],
        threshold
      );
      // Invalidate thresholds list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.thresholds(),
      });
      toast.success("Threshold updated", {
        description: `Alert threshold "${threshold.name}" has been updated.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to update threshold",
    }),
  });
}

/**
 * Hook to delete an alert threshold
 */
export function useDeleteAlertThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.deleteThreshold(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: [...queryKeys.alerts.thresholds(), id],
      });
      // Invalidate thresholds list
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.thresholds(),
      });
      toast.success("Threshold deleted", {
        description: "The alert threshold has been deleted.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to delete threshold",
    }),
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to get count of active alerts
 */
export function useActiveAlertsCount() {
  const { data } = useAlerts({ status: "active", page_size: 1 });
  return data?.total ?? 0;
}

/**
 * Hook to invalidate all analytics-related queries
 */
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
  };
}
