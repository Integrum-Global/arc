/**
 * Mock Data for Tests
 *
 * Provides consistent mock data for testing page components.
 */

import type {
  Portfolio,
  Alert,
  MarketBrief,
  SectorAllocation,
  PaginatedResponse,
} from "@/types/api";
import type {
  DashboardSummary,
  TopHolding,
  PerformanceDataPoint,
} from "@/hooks/useDashboardData";

// =============================================================================
// Dashboard Mock Data
// =============================================================================

export const mockDashboardSummary: DashboardSummary = {
  totalValue: 1287500,
  dayChange: 12450,
  dayChangePct: 0.0097,
  ytdReturn: 0.1234,
  benchmarkYtdReturn: 0.0987,
  healthScore: 78,
  healthStatus: "healthy",
};

export const mockAllocations: SectorAllocation[] = [
  { sector: "Technology", value: 450000, weight: 0.35, holdings_count: 12 },
  { sector: "Healthcare", value: 250000, weight: 0.19, holdings_count: 8 },
  { sector: "Financials", value: 200000, weight: 0.15, holdings_count: 6 },
  { sector: "Consumer", value: 180000, weight: 0.14, holdings_count: 5 },
  { sector: "Energy", value: 120000, weight: 0.09, holdings_count: 4 },
  { sector: "Other", value: 100000, weight: 0.08, holdings_count: 3 },
];

export const mockTopHoldings: TopHolding[] = [
  {
    id: "1",
    name: "Apple Inc",
    ticker: "AAPL",
    value: 125000,
    weight: 0.097,
    change: 0.0245,
  },
  {
    id: "2",
    name: "Microsoft Corp",
    ticker: "MSFT",
    value: 98000,
    weight: 0.076,
    change: 0.0156,
  },
  {
    id: "3",
    name: "Amazon.com Inc",
    ticker: "AMZN",
    value: 87000,
    weight: 0.067,
    change: -0.0089,
  },
];

export const mockPerformanceHistory: PerformanceDataPoint[] = [
  { date: "2024-01-01", value: 0, benchmark: 0 },
  { date: "2024-02-01", value: 2.5, benchmark: 2.1 },
  { date: "2024-03-01", value: 5.2, benchmark: 4.3 },
  { date: "2024-04-01", value: 8.1, benchmark: 6.8 },
  { date: "2024-05-01", value: 10.5, benchmark: 8.5 },
];

export const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    type: "price_alert",
    severity: "high",
    status: "active",
    title: "AAPL Price Drop",
    message: "Apple stock dropped 5% below target",
    portfolio_id: "portfolio-1",
    portfolio_name: "Growth Portfolio",
    security_id: "security-1",
    security_symbol: "AAPL",
    current_value: 178.5,
    threshold_value: 188.0,
    triggered_at: "2024-01-15T10:30:00Z",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "alert-2",
    type: "portfolio_drift",
    severity: "medium",
    status: "active",
    title: "Portfolio Rebalancing Needed",
    message: "Technology sector allocation exceeds target by 5%",
    portfolio_id: "portfolio-1",
    portfolio_name: "Growth Portfolio",
    triggered_at: "2024-01-14T14:00:00Z",
    created_at: "2024-01-14T14:00:00Z",
    updated_at: "2024-01-14T14:00:00Z",
  },
];

export const mockBrief: MarketBrief = {
  id: "brief-1",
  type: "morning",
  title: "Morning Market Brief",
  summary: "Markets are showing positive momentum with tech leading gains.",
  generated_at: "2024-01-15T08:00:00Z",
  sections: [
    {
      title: "Market Overview",
      content: "S&P 500 futures up 0.5% ahead of earnings reports.",
      order: 1,
      type: "text",
    },
  ],
  insights: [
    {
      category: "Market",
      insight: "Technology sector continues to outperform",
      confidence: 0.85,
      impact: "positive",
    },
  ],
  action_items: [
    {
      id: "action-1",
      title: "Review Tech Holdings",
      description: "Consider rebalancing due to sector concentration",
      priority: "medium",
      category: "portfolio",
      completed: false,
    },
  ],
};

// =============================================================================
// Portfolio Mock Data
// =============================================================================

export const mockPortfolios: Portfolio[] = [
  {
    id: "portfolio-1",
    name: "Growth Portfolio",
    description: "Long-term growth focused investments",
    type: "equity",
    status: "active",
    benchmark_id: "SPY",
    benchmark_name: "S&P 500",
    currency: "USD",
    inception_date: "2023-01-01",
    total_value: 500000,
    total_cost: 420000,
    unrealized_pnl: 80000,
    realized_pnl: 15000,
    ytd_return: 0.12,
    holdings_count: 25,
    owner_id: "user-1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "portfolio-2",
    name: "Income Portfolio",
    description: "Dividend and income focused",
    type: "balanced",
    status: "active",
    benchmark_id: "SCHD",
    benchmark_name: "Dividend ETF",
    currency: "USD",
    inception_date: "2022-06-01",
    total_value: 350000,
    total_cost: 310000,
    unrealized_pnl: 40000,
    realized_pnl: 25000,
    ytd_return: 0.08,
    holdings_count: 15,
    owner_id: "user-1",
    created_at: "2022-06-01T00:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
  },
  {
    id: "portfolio-3",
    name: "Fixed Income",
    description: "Bond portfolio for stability",
    type: "fixed_income",
    status: "active",
    currency: "USD",
    inception_date: "2023-03-01",
    total_value: 200000,
    total_cost: 195000,
    unrealized_pnl: 5000,
    realized_pnl: 8000,
    ytd_return: 0.04,
    holdings_count: 10,
    owner_id: "user-1",
    created_at: "2023-03-01T00:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
];

export const mockPaginatedPortfolios: PaginatedResponse<Portfolio> = {
  items: mockPortfolios,
  total: 3,
  page: 1,
  page_size: 10,
  total_pages: 1,
  has_next: false,
  has_prev: false,
};

export const mockEmptyPortfolios: PaginatedResponse<Portfolio> = {
  items: [],
  total: 0,
  page: 1,
  page_size: 10,
  total_pages: 0,
  has_next: false,
  has_prev: false,
};

export const mockSinglePortfolio: Portfolio = mockPortfolios[0]!;

// =============================================================================
// Alert Mock Data
// =============================================================================

export const mockPaginatedAlerts: PaginatedResponse<Alert> = {
  items: mockAlerts,
  total: 2,
  page: 1,
  page_size: 10,
  total_pages: 1,
  has_next: false,
  has_prev: false,
};
