/**
 * Intelligence Hooks
 * React Query hooks for AI-powered intelligence features
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { intelligenceApi } from "@/api/endpoints";
import {
  createMutationErrorHandler,
  shouldRetryQuery,
} from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import type {
  MarketBrief,
  BriefType,
  PortfolioQuery,
  PortfolioQueryResponse,
  QuerySuggestion,
} from "@/types/api";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch market brief
 */
export function useMarketBrief(
  type: BriefType,
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.intelligence.brief(type, portfolioId),
    queryFn: () => intelligenceApi.brief(type, portfolioId),
    retry: shouldRetryQuery,
    // Briefs are generated content, cache appropriately based on type
    staleTime: getBriefStaleTime(type),
    ...options,
  });
}

/**
 * Get appropriate stale time based on brief type
 */
function getBriefStaleTime(type: BriefType): number {
  switch (type) {
    case "morning":
    case "closing":
      // Morning and closing briefs are time-sensitive
      return 30 * 60 * 1000; // 30 minutes
    case "midday":
      // Midday updates more frequently
      return 15 * 60 * 1000; // 15 minutes
    case "weekly":
      return 24 * 60 * 60 * 1000; // 24 hours
    case "monthly":
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return 60 * 60 * 1000; // 1 hour
  }
}

/**
 * Hook to fetch query suggestions
 */
export function useQuerySuggestions(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<QuerySuggestion[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.intelligence.all, "suggestions", portfolioId],
    queryFn: () => intelligenceApi.suggestions(portfolioId),
    retry: shouldRetryQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch AI analysis for a security
 */
export function useSecurityAnalysis(
  securityId: string,
  options?: Omit<
    UseQueryOptions<Record<string, unknown>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.intelligence.analysis(securityId),
    queryFn: () => intelligenceApi.securityAnalysis(securityId),
    enabled: !!securityId,
    retry: shouldRetryQuery,
    // AI analysis is expensive, cache longer
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to query portfolio with natural language
 * Returns a mutation since queries are conversational and not cacheable in the same way
 */
export function usePortfolioQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PortfolioQuery) => intelligenceApi.query(data),
    onSuccess: (response, variables) => {
      // Cache the response for this specific question
      queryClient.setQueryData(
        queryKeys.intelligence.query(
          variables.question,
          variables.portfolio_id
        ),
        response
      );
    },
    onError: createMutationErrorHandler({
      title: "Query failed",
    }),
  });
}

/**
 * Hook to get cached query response if available
 */
export function useCachedQueryResponse(
  question: string,
  portfolioId?: string,
  options?: Omit<
    UseQueryOptions<PortfolioQueryResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.intelligence.query(question, portfolioId),
    queryFn: () =>
      intelligenceApi.query({ question, portfolio_id: portfolioId }),
    enabled: false, // Only use cached data, don't fetch automatically
    ...options,
  });
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Hook for morning market brief
 */
export function useMorningBrief(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useMarketBrief("morning", portfolioId, options);
}

/**
 * Hook for midday market brief
 */
export function useMiddayBrief(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useMarketBrief("midday", portfolioId, options);
}

/**
 * Hook for closing market brief
 */
export function useClosingBrief(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useMarketBrief("closing", portfolioId, options);
}

/**
 * Hook for weekly summary
 */
export function useWeeklySummary(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useMarketBrief("weekly", portfolioId, options);
}

/**
 * Hook for monthly summary
 */
export function useMonthlySummary(
  portfolioId?: string,
  options?: Omit<UseQueryOptions<MarketBrief>, "queryKey" | "queryFn">
) {
  return useMarketBrief("monthly", portfolioId, options);
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to prefetch market brief
 */
export function usePrefetchMarketBrief() {
  const queryClient = useQueryClient();

  return (type: BriefType, portfolioId?: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.intelligence.brief(type, portfolioId),
      queryFn: () => intelligenceApi.brief(type, portfolioId),
      staleTime: getBriefStaleTime(type),
    });
  };
}

/**
 * Hook to invalidate all intelligence-related queries
 */
export function useInvalidateIntelligence() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.intelligence.all });
  };
}

/**
 * Hook to clear intelligence cache
 */
export function useClearIntelligenceCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: queryKeys.intelligence.all });
  };
}
