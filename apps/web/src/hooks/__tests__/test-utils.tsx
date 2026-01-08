/**
 * Test Utilities for Hook Tests
 *
 * Provides common test utilities including:
 * - QueryClient wrapper for React Query hooks
 * - Mock factories for API responses
 * - Custom render functions
 */

import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  Portfolio,
  PaginatedResponse,
  User,
  UserPreference,
  LoginResponse,
  Alert,
  AlertThreshold,
  MarketBrief,
  PortfolioQueryResponse,
  QuerySuggestion,
  SecurityRatios,
  RatioHistory,
  BenchmarkComparison,
  PortfolioHealth,
  PortfolioValuation,
  Holding,
  Transaction,
  ApiResponse,
} from "@/types/api";

// =============================================================================
// Query Client Factory
// =============================================================================

/**
 * Creates a new QueryClient configured for testing
 * - Disables retries to fail fast
 * - Disables refetch on window focus
 * - Sets stale time to 0 for predictable testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a wrapper component with QueryClientProvider for testing hooks
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// =============================================================================
// Mock Data Factories
// =============================================================================

/**
 * Creates a mock Portfolio object
 */
export function createMockPortfolio(overrides?: Partial<Portfolio>): Portfolio {
  return {
    id: "portfolio-1",
    name: "Test Portfolio",
    description: "A test portfolio",
    type: "equity",
    status: "active",
    benchmark_id: "SPY",
    benchmark_name: "S&P 500",
    currency: "USD",
    inception_date: "2023-01-01",
    total_value: 100000,
    total_cost: 90000,
    unrealized_pnl: 10000,
    realized_pnl: 5000,
    ytd_return: 0.12,
    holdings_count: 10,
    owner_id: "user-1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock User object
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "analyst",
    avatar_url: "https://example.com/avatar.jpg",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    last_login_at: "2024-01-15T00:00:00Z",
    is_active: true,
    ...overrides,
  };
}

/**
 * Creates a mock UserPreference object
 */
export function createMockUserPreference(
  overrides?: Partial<UserPreference>
): UserPreference {
  return {
    id: "pref-1",
    user_id: "user-1",
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    date_format: "MM/DD/YYYY",
    currency: "USD",
    notifications_enabled: true,
    email_notifications: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock LoginResponse object
 */
export function createMockLoginResponse(
  overrides?: Partial<LoginResponse>
): LoginResponse {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "Bearer",
    expires_in: 3600,
    user: createMockUser(),
    ...overrides,
  };
}

/**
 * Creates a mock Alert object
 */
export function createMockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: "alert-1",
    type: "price_alert",
    severity: "medium",
    status: "active",
    title: "Test Alert",
    message: "Test alert message",
    portfolio_id: "portfolio-1",
    portfolio_name: "Test Portfolio",
    security_id: "AAPL",
    security_symbol: "AAPL",
    current_value: 150,
    threshold_value: 145,
    triggered_at: "2024-01-15T00:00:00Z",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock AlertThreshold object
 */
export function createMockAlertThreshold(
  overrides?: Partial<AlertThreshold>
): AlertThreshold {
  return {
    id: "threshold-1",
    name: "Test Threshold",
    type: "price_alert",
    metric: "price",
    operator: "gt",
    value: 150,
    severity: "high",
    portfolio_id: "portfolio-1",
    is_active: true,
    cooldown_minutes: 60,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock MarketBrief object
 */
export function createMockMarketBrief(
  overrides?: Partial<MarketBrief>
): MarketBrief {
  return {
    id: "brief-1",
    type: "morning",
    title: "Morning Market Brief",
    summary: "Markets are up today",
    generated_at: "2024-01-15T08:00:00Z",
    sections: [
      {
        title: "Market Overview",
        content: "Markets opened higher",
        order: 1,
        type: "text",
      },
    ],
    insights: [
      {
        category: "Market",
        insight: "Tech sector leading gains",
        confidence: 0.85,
        impact: "positive",
      },
    ],
    action_items: [
      {
        id: "action-1",
        title: "Review tech positions",
        description: "Consider rebalancing",
        priority: "medium",
        category: "portfolio",
        completed: false,
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock PortfolioQueryResponse object
 */
export function createMockPortfolioQueryResponse(
  overrides?: Partial<PortfolioQueryResponse>
): PortfolioQueryResponse {
  return {
    id: "query-1",
    question: "What is my portfolio performance?",
    answer: "Your portfolio has gained 12% year-to-date.",
    confidence: 0.92,
    sources: [
      {
        type: "portfolio",
        title: "Portfolio Performance Data",
        relevance: 0.95,
      },
    ],
    follow_up_questions: [
      "How does this compare to the benchmark?",
      "What are my top performers?",
    ],
    generated_at: "2024-01-15T10:00:00Z",
    processing_time_ms: 250,
    ...overrides,
  };
}

/**
 * Creates a mock QuerySuggestion array
 */
export function createMockQuerySuggestions(): QuerySuggestion[] {
  return [
    {
      question: "What is my portfolio performance?",
      category: "performance",
      description: "Get an overview of your portfolio returns",
    },
    {
      question: "What are my top holdings?",
      category: "holdings",
      description: "See your largest positions",
    },
    {
      question: "How diversified is my portfolio?",
      category: "risk",
      description: "Analyze your portfolio diversification",
    },
  ];
}

/**
 * Creates a mock SecurityRatios object
 */
export function createMockSecurityRatios(
  overrides?: Partial<SecurityRatios>
): SecurityRatios {
  return {
    security_id: "AAPL",
    security_name: "Apple Inc.",
    as_of_date: "2024-01-15",
    ratios: [
      {
        ratio_name: "P/E Ratio",
        value: 28.5,
        formatted_value: "28.5x",
        category: "valuation",
        description: "Price to Earnings Ratio",
        as_of_date: "2024-01-15",
      },
    ],
    valuation: {
      ratios: [],
      score: 75,
      trend: "stable",
    },
    profitability: {
      ratios: [],
      score: 85,
      trend: "improving",
    },
    liquidity: {
      ratios: [],
      score: 90,
      trend: "stable",
    },
    leverage: {
      ratios: [],
      score: 70,
      trend: "stable",
    },
    efficiency: {
      ratios: [],
      score: 80,
      trend: "improving",
    },
    ...overrides,
  };
}

/**
 * Creates a mock RatioHistory object
 */
export function createMockRatioHistory(
  overrides?: Partial<RatioHistory>
): RatioHistory {
  return {
    security_id: "AAPL",
    ratio_name: "P/E Ratio",
    data_points: [
      { date: "2024-01-01", value: 27.0 },
      { date: "2024-01-08", value: 27.5 },
      { date: "2024-01-15", value: 28.5 },
    ],
    statistics: {
      min: 25.0,
      max: 30.0,
      mean: 27.5,
      median: 27.5,
      std_dev: 1.5,
      trend: "up",
      change_percent: 5.5,
    },
    ...overrides,
  };
}

/**
 * Creates a mock BenchmarkComparison object
 */
export function createMockBenchmarkComparison(
  overrides?: Partial<BenchmarkComparison>
): BenchmarkComparison {
  return {
    security_id: "AAPL",
    security_name: "Apple Inc.",
    peer_group_id: "tech-large-cap",
    peer_group_name: "Technology Large Cap",
    as_of_date: "2024-01-15",
    metrics: [
      {
        metric_name: "P/E Ratio",
        security_value: 28.5,
        benchmark_value: 25.0,
        peer_average: 26.5,
        peer_median: 25.5,
        percentile_rank: 75,
        difference: 3.5,
        difference_percent: 14.0,
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock PortfolioHealth object
 */
export function createMockPortfolioHealth(
  overrides?: Partial<PortfolioHealth>
): PortfolioHealth {
  return {
    portfolio_id: "portfolio-1",
    portfolio_name: "Test Portfolio",
    scan_date: "2024-01-15",
    overall_score: 78,
    overall_status: "healthy",
    categories: [
      {
        name: "Diversification",
        score: 80,
        status: "healthy",
        metrics: [],
      },
    ],
    issues: [],
    recommendations: [
      {
        id: "rec-1",
        category: "diversification",
        priority: "medium",
        title: "Consider adding international exposure",
        description: "Your portfolio is heavily weighted in US equities",
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock PortfolioValuation object
 */
export function createMockPortfolioValuation(
  overrides?: Partial<PortfolioValuation>
): PortfolioValuation {
  return {
    portfolio_id: "portfolio-1",
    as_of_date: "2024-01-15",
    total_value: 100000,
    total_cost: 90000,
    cash_balance: 5000,
    invested_value: 95000,
    unrealized_pnl: 10000,
    unrealized_pnl_percent: 11.11,
    realized_pnl_ytd: 5000,
    dividend_income_ytd: 1000,
    interest_income_ytd: 200,
    fees_ytd: 100,
    nav: 100000,
    nav_per_share: 100,
    currency: "USD",
    history: [
      {
        date: "2024-01-01",
        total_value: 95000,
        nav: 95000,
        daily_return: 0,
        cumulative_return: 0,
      },
      {
        date: "2024-01-15",
        total_value: 100000,
        nav: 100000,
        daily_return: 0.01,
        cumulative_return: 0.0526,
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock Holding object
 */
export function createMockHolding(overrides?: Partial<Holding>): Holding {
  return {
    id: "holding-1",
    portfolio_id: "portfolio-1",
    security_id: "AAPL",
    security: {
      id: "AAPL",
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      exchange: "NASDAQ",
      currency: "USD",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      current_price: 185,
      price_change: 2.5,
      price_change_percent: 1.37,
      market_cap: 2900000000000,
      pe_ratio: 28.5,
      dividend_yield: 0.005,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
    quantity: 100,
    average_cost: 150,
    current_price: 185,
    market_value: 18500,
    unrealized_pnl: 3500,
    unrealized_pnl_percent: 23.33,
    weight: 0.185,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock Transaction object
 */
export function createMockTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return {
    id: "tx-1",
    portfolio_id: "portfolio-1",
    security_id: "AAPL",
    type: "buy",
    status: "executed",
    quantity: 10,
    price: 180,
    amount: 1800,
    fees: 5,
    currency: "USD",
    trade_date: "2024-01-10",
    settlement_date: "2024-01-12",
    description: "Buy AAPL",
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-10T10:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock PaginatedResponse
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  overrides?: Partial<Omit<PaginatedResponse<T>, "items">>
): PaginatedResponse<T> {
  return {
    items,
    total: items.length,
    page: 1,
    page_size: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    ...overrides,
  };
}

/**
 * Creates a mock ApiResponse
 */
export function createMockApiResponse<T>(
  data: T,
  overrides?: Partial<Omit<ApiResponse<T>, "data">>
): ApiResponse<T> {
  return {
    data,
    message: "Success",
    request_id: "req-123",
    ...overrides,
  };
}

// =============================================================================
// Mock LocalStorage
// =============================================================================

export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return { ...store };
    },
  };
})();

/**
 * Sets up localStorage mock
 */
export function setupLocalStorageMock() {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });
  mockLocalStorage.clear();
}
