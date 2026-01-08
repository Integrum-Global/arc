/**
 * Portfolio Hooks
 * React Query hooks for portfolio-related operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { portfoliosApi } from "@/api/endpoints";
import {
  createMutationErrorHandler,
  shouldRetryQuery,
} from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import type {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioListFilters,
  Holding,
  Transaction,
  TransactionListFilters,
  PortfolioHealth,
  PortfolioValuation,
  PaginatedResponse,
  ApiResponse,
} from "@/types/api";
import { toast } from "sonner";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch paginated list of portfolios
 */
export function usePortfolios(
  filters?: PortfolioListFilters,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Portfolio>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.portfolios.list((filters || {}) as Record<string, unknown>),
    queryFn: () => portfoliosApi.list(filters),
    retry: shouldRetryQuery,
    ...options,
  });
}

/**
 * Hook to fetch a single portfolio by ID
 */
export function usePortfolio(
  id: string,
  options?: Omit<UseQueryOptions<Portfolio>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.portfolios.detail(id),
    queryFn: () => portfoliosApi.get(id),
    enabled: !!id,
    retry: shouldRetryQuery,
    ...options,
  });
}

/**
 * Hook to fetch portfolio holdings
 */
export function usePortfolioHoldings(
  portfolioId: string,
  options?: Omit<UseQueryOptions<ApiResponse<Holding[]>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.portfolios.holdings(portfolioId),
    queryFn: () => portfoliosApi.holdings(portfolioId),
    enabled: !!portfolioId,
    retry: shouldRetryQuery,
    ...options,
  });
}

/**
 * Hook to fetch portfolio transactions with filters
 */
export function usePortfolioTransactions(
  portfolioId: string,
  filters?: TransactionListFilters,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Transaction>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.portfolios.transactions(portfolioId, (filters || {}) as Record<string, unknown>),
    queryFn: () => portfoliosApi.transactions(portfolioId, filters),
    enabled: !!portfolioId,
    retry: shouldRetryQuery,
    ...options,
  });
}

/**
 * Hook to fetch portfolio health scan
 */
export function usePortfolioHealth(
  portfolioId: string,
  options?: Omit<UseQueryOptions<PortfolioHealth>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.portfolios.healthScan(portfolioId),
    queryFn: () => portfoliosApi.health(portfolioId),
    enabled: !!portfolioId,
    retry: shouldRetryQuery,
    // Health scans can be expensive, so we cache longer
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch portfolio valuation
 */
export function usePortfolioValuation(
  portfolioId: string,
  asOfDate?: string,
  options?: Omit<UseQueryOptions<PortfolioValuation>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.portfolios.valuation(portfolioId),
    queryFn: () => portfoliosApi.valuation(portfolioId, asOfDate),
    enabled: !!portfolioId,
    retry: shouldRetryQuery,
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new portfolio
 */
export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioRequest) => portfoliosApi.create(data),
    onSuccess: (portfolio) => {
      // Invalidate portfolios list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.all });
      toast.success("Portfolio created", {
        description: `${portfolio.name} has been created successfully.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to create portfolio",
    }),
  });
}

/**
 * Hook to update an existing portfolio
 */
export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePortfolioRequest;
    }) => portfoliosApi.update(id, data),
    onSuccess: (portfolio) => {
      // Update the specific portfolio in cache
      queryClient.setQueryData(
        queryKeys.portfolios.detail(portfolio.id),
        portfolio
      );
      // Invalidate list to refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.all,
        exact: false,
      });
      toast.success("Portfolio updated", {
        description: `${portfolio.name} has been updated successfully.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to update portfolio",
    }),
  });
}

/**
 * Hook to delete a portfolio
 */
export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portfoliosApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.portfolios.detail(id),
      });
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.all,
        exact: false,
      });
      toast.success("Portfolio deleted", {
        description: "The portfolio has been deleted successfully.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to delete portfolio",
    }),
  });
}

// =============================================================================
// Prefetch Functions
// =============================================================================

/**
 * Prefetch a portfolio for navigation optimization
 */
export function usePrefetchPortfolio() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.portfolios.detail(id),
      queryFn: () => portfoliosApi.get(id),
      staleTime: 30 * 1000, // Consider fresh for 30 seconds
    });
  };
}

/**
 * Prefetch portfolio holdings
 */
export function usePrefetchPortfolioHoldings() {
  const queryClient = useQueryClient();

  return (portfolioId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.portfolios.holdings(portfolioId),
      queryFn: () => portfoliosApi.holdings(portfolioId),
      staleTime: 30 * 1000,
    });
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to invalidate all portfolio-related queries
 */
export function useInvalidatePortfolios() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.all });
  };
}

/**
 * Hook to reset portfolio cache
 */
export function useResetPortfolioCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.resetQueries({ queryKey: queryKeys.portfolios.all });
  };
}
