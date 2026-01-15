/**
 * MSW Request Handlers
 *
 * Mock API handlers for integration testing.
 * Provides realistic mock responses for all API endpoints.
 */

import { http, HttpResponse, delay } from "msw";

// =============================================================================
// Mock Data
// =============================================================================

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "analyst" as const,
  avatar_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  last_login_at: "2024-01-15T10:00:00Z",
  is_active: true,
};

export const mockAdminUser = {
  ...mockUser,
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "admin" as const,
};

export const mockPortfolios = [
  {
    id: "portfolio-1",
    name: "Growth Portfolio",
    description: "High growth equity portfolio",
    type: "equity" as const,
    status: "active" as const,
    benchmark_id: "SPX",
    benchmark_name: "S&P 500",
    currency: "USD",
    inception_date: "2023-01-01",
    total_value: 1500000,
    total_cost: 1200000,
    unrealized_pnl: 300000,
    realized_pnl: 50000,
    ytd_return: 12.5,
    holdings_count: 25,
    owner_id: "user-1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    metadata: {},
  },
  {
    id: "portfolio-2",
    name: "Income Portfolio",
    description: "Fixed income focused portfolio",
    type: "fixed_income" as const,
    status: "active" as const,
    benchmark_id: "AGG",
    benchmark_name: "Bloomberg Aggregate Bond",
    currency: "USD",
    inception_date: "2023-06-01",
    total_value: 800000,
    total_cost: 750000,
    unrealized_pnl: 50000,
    realized_pnl: 20000,
    ytd_return: 4.2,
    holdings_count: 15,
    owner_id: "user-1",
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    metadata: {},
  },
  {
    id: "portfolio-3",
    name: "Balanced Portfolio",
    description: "60/40 balanced portfolio",
    type: "balanced" as const,
    status: "active" as const,
    benchmark_id: null,
    benchmark_name: null,
    currency: "USD",
    inception_date: "2022-01-01",
    total_value: 2500000,
    total_cost: 2000000,
    unrealized_pnl: 500000,
    realized_pnl: 100000,
    ytd_return: 8.5,
    holdings_count: 40,
    owner_id: "user-1",
    created_at: "2022-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    metadata: {},
  },
];

export const mockHoldings = [
  {
    id: "holding-1",
    portfolio_id: "portfolio-1",
    security_id: "AAPL",
    security: {
      id: "AAPL",
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock" as const,
      exchange: "NASDAQ",
      currency: "USD",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      current_price: 185.5,
      price_change: 2.3,
      price_change_percent: 1.25,
      market_cap: 2850000000000,
      pe_ratio: 28.5,
      dividend_yield: 0.5,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
    quantity: 500,
    average_cost: 150.0,
    current_price: 185.5,
    market_value: 92750,
    unrealized_pnl: 17750,
    unrealized_pnl_percent: 23.67,
    weight: 6.18,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "holding-2",
    portfolio_id: "portfolio-1",
    security_id: "MSFT",
    security: {
      id: "MSFT",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      type: "stock" as const,
      exchange: "NASDAQ",
      currency: "USD",
      sector: "Technology",
      industry: "Software",
      country: "US",
      current_price: 390.0,
      price_change: 5.0,
      price_change_percent: 1.3,
      market_cap: 2900000000000,
      pe_ratio: 35.0,
      dividend_yield: 0.8,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    },
    quantity: 300,
    average_cost: 320.0,
    current_price: 390.0,
    market_value: 117000,
    unrealized_pnl: 21000,
    unrealized_pnl_percent: 21.88,
    weight: 7.8,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
];

export const mockTransactions = [
  {
    id: "txn-1",
    portfolio_id: "portfolio-1",
    security_id: "AAPL",
    security: mockHoldings[0]!.security,
    type: "buy" as const,
    status: "executed" as const,
    quantity: 100,
    price: 150.0,
    amount: 15000,
    fees: 9.99,
    currency: "USD",
    trade_date: "2024-01-10",
    settlement_date: "2024-01-12",
    description: "Regular investment",
    reference_id: "REF-001",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z",
  },
  {
    id: "txn-2",
    portfolio_id: "portfolio-1",
    security_id: "MSFT",
    security: mockHoldings[1]!.security,
    type: "sell" as const,
    status: "executed" as const,
    quantity: 50,
    price: 385.0,
    amount: 19250,
    fees: 9.99,
    currency: "USD",
    trade_date: "2024-01-12",
    settlement_date: "2024-01-14",
    description: "Profit taking",
    reference_id: "REF-002",
    created_at: "2024-01-12T10:00:00Z",
    updated_at: "2024-01-12T10:00:00Z",
  },
];

export const mockPortfolioHealth = {
  portfolio_id: "portfolio-1",
  portfolio_name: "Growth Portfolio",
  scan_date: "2024-01-15",
  overall_score: 85,
  overall_status: "healthy" as const,
  categories: [
    {
      name: "Diversification",
      score: 80,
      status: "healthy" as const,
      metrics: [
        { name: "Sector Concentration", value: 35, target: 40, unit: "%", status: "good" as const },
        { name: "Single Stock Limit", value: 8, target: 10, unit: "%", status: "good" as const },
      ],
    },
  ],
  issues: [],
  recommendations: [
    {
      id: "rec-1",
      category: "Diversification",
      priority: "medium" as const,
      title: "Consider adding international exposure",
      description: "Portfolio is heavily weighted towards US equities",
      expected_impact: "Better risk-adjusted returns",
    },
  ],
};

export const mockUserPreferences = {
  id: "pref-1",
  user_id: "user-1",
  theme: "system" as const,
  language: "en",
  timezone: "America/New_York",
  date_format: "MM/DD/YYYY",
  currency: "USD",
  notifications_enabled: true,
  email_notifications: true,
  dashboard_layout: {},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
};

// =============================================================================
// Request Handlers
// =============================================================================

const API_BASE = "http://localhost:8000/api/v1";

export const handlers = [
  // ==========================================================================
  // Auth Endpoints
  // ==========================================================================

  // Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(100); // Simulate network delay

    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Simulate invalid credentials
    if (email === "invalid@example.com" || password === "wrong") {
      return HttpResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Return successful login response
    return HttpResponse.json({
      access_token: "mock-access-token-12345",
      refresh_token: "mock-refresh-token-67890",
      token_type: "Bearer",
      expires_in: 3600,
      user: email === "admin@example.com" ? mockAdminUser : mockUser,
    });
  }),

  // Logout
  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(50);
    return new HttpResponse(null, { status: 204 });
  }),

  // Get current user
  http.get(`${API_BASE}/auth/me`, async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // Check if token is the admin token
    const token = authHeader.replace("Bearer ", "");
    if (token === "admin-token") {
      return HttpResponse.json(mockAdminUser);
    }

    return HttpResponse.json(mockUser);
  }),

  // Refresh token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    await delay(50);

    const body = await request.json() as { refresh_token: string };
    const { refresh_token } = body;

    if (!refresh_token || refresh_token === "expired-token") {
      return HttpResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid refresh token",
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      access_token: "new-mock-access-token-12345",
      refresh_token: "new-mock-refresh-token-67890",
      expires_in: 3600,
    });
  }),

  // ==========================================================================
  // User Endpoints
  // ==========================================================================

  // Get user preferences
  http.get(`${API_BASE}/users/me/preferences`, async () => {
    await delay(50);
    return HttpResponse.json(mockUserPreferences);
  }),

  // Update user preferences
  http.patch(`${API_BASE}/users/me/preferences`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockUserPreferences,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  // Update user profile
  http.patch(`${API_BASE}/users/me`, async ({ request }) => {
    await delay(100);

    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockUser,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  // ==========================================================================
  // Portfolio Endpoints
  // ==========================================================================

  // List portfolios
  http.get(`${API_BASE}/portfolios`, async ({ request }) => {
    await delay(100);

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sort_by") || "name";
    const sortOrder = url.searchParams.get("sort_order") || "asc";

    let filtered = [...mockPortfolios];

    // Apply filters
    if (type) {
      filtered = filtered.filter((p) => p.type === type);
    }
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return HttpResponse.json({
      items: filtered,
      total: filtered.length,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    });
  }),

  // Get single portfolio
  http.get(`${API_BASE}/portfolios/:id`, async ({ params }) => {
    await delay(50);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(portfolio);
  }),

  // Create portfolio
  http.post(`${API_BASE}/portfolios`, async ({ request }) => {
    await delay(150);

    const body = await request.json() as Record<string, unknown>;
    const newPortfolio = {
      id: `portfolio-${Date.now()}`,
      ...body,
      status: "active",
      total_value: 0,
      total_cost: 0,
      unrealized_pnl: 0,
      realized_pnl: 0,
      ytd_return: 0,
      holdings_count: 0,
      owner_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
    };

    return HttpResponse.json(newPortfolio, { status: 201 });
  }),

  // Update portfolio
  http.patch(`${API_BASE}/portfolios/:id`, async ({ params, request }) => {
    await delay(100);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...portfolio,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  // Delete portfolio
  http.delete(`${API_BASE}/portfolios/:id`, async ({ params }) => {
    await delay(100);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Get portfolio holdings
  http.get(`${API_BASE}/portfolios/:id/holdings`, async ({ params }) => {
    await delay(100);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    const holdings = mockHoldings.filter((h) => h.portfolio_id === params.id);

    return HttpResponse.json({
      data: holdings,
    });
  }),

  // Get portfolio transactions
  http.get(`${API_BASE}/portfolios/:id/transactions`, async ({ params, request }) => {
    await delay(100);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    let transactions = mockTransactions.filter((t) => t.portfolio_id === params.id);

    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    return HttpResponse.json({
      items: transactions,
      total: transactions.length,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    });
  }),

  // Get portfolio health
  http.get(`${API_BASE}/portfolios/:id/health`, async ({ params }) => {
    await delay(200);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockPortfolioHealth,
      portfolio_id: params.id,
      portfolio_name: portfolio.name,
    });
  }),

  // Get portfolio valuation
  http.get(`${API_BASE}/portfolios/:id/valuation`, async ({ params }) => {
    await delay(100);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      portfolio_id: params.id,
      as_of_date: "2024-01-15",
      total_value: portfolio.total_value,
      total_cost: portfolio.total_cost,
      cash_balance: 50000,
      invested_value: portfolio.total_value - 50000,
      unrealized_pnl: portfolio.unrealized_pnl,
      unrealized_pnl_percent: (portfolio.unrealized_pnl / portfolio.total_cost) * 100,
      realized_pnl_ytd: portfolio.realized_pnl,
      dividend_income_ytd: 5000,
      interest_income_ytd: 1000,
      fees_ytd: 500,
      nav: portfolio.total_value,
      nav_per_share: 100,
      currency: portfolio.currency,
      history: [
        { date: "2024-01-01", total_value: portfolio.total_value * 0.95, nav: 95, daily_return: 0, cumulative_return: 0 },
        { date: "2024-01-08", total_value: portfolio.total_value * 0.98, nav: 98, daily_return: 0.5, cumulative_return: 3.16 },
        { date: "2024-01-15", total_value: portfolio.total_value, nav: 100, daily_return: 0.2, cumulative_return: 5.26 },
      ],
    });
  }),

  // ==========================================================================
  // Analytics Endpoints
  // ==========================================================================

  http.get(`${API_BASE}/analytics/portfolios/:id`, async ({ params }) => {
    await delay(150);

    const portfolio = mockPortfolios.find((p) => p.id === params.id);

    if (!portfolio) {
      return HttpResponse.json(
        {
          error: "NOT_FOUND",
          message: "Portfolio not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      portfolio_id: params.id,
      metrics: {
        sharpe_ratio: 1.25,
        sortino_ratio: 1.45,
        max_drawdown: -8.5,
        volatility: 12.3,
        beta: 0.95,
        alpha: 2.1,
      },
    });
  }),

  // ==========================================================================
  // Alerts Endpoints
  // ==========================================================================

  http.get(`${API_BASE}/alerts`, async () => {
    await delay(100);

    return HttpResponse.json({
      items: [
        {
          id: "alert-1",
          type: "price_alert",
          severity: "medium",
          status: "active",
          title: "AAPL price target reached",
          message: "Apple Inc. has reached your price target of $185",
          portfolio_id: "portfolio-1",
          portfolio_name: "Growth Portfolio",
          security_id: "AAPL",
          security_symbol: "AAPL",
          current_value: 185.5,
          threshold_value: 185,
          triggered_at: "2024-01-15T10:00:00Z",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    });
  }),

  // ==========================================================================
  // Intelligence Endpoints
  // ==========================================================================

  http.get(`${API_BASE}/intelligence/brief`, async () => {
    await delay(200);

    return HttpResponse.json({
      id: "brief-1",
      type: "morning",
      title: "Morning Market Brief",
      summary: "Markets opened mixed today with tech leading gains.",
      generated_at: new Date().toISOString(),
      sections: [
        {
          title: "Market Overview",
          content: "US markets are trading higher on positive earnings reports.",
          order: 1,
          type: "text",
        },
      ],
      insights: [
        {
          category: "Portfolio",
          insight: "Your portfolio is outperforming the benchmark by 2.5%",
          confidence: 0.95,
          impact: "positive",
        },
      ],
      action_items: [],
    });
  }),

  http.get(`${API_BASE}/intelligence/suggestions`, async () => {
    await delay(100);

    return HttpResponse.json([
      {
        question: "What is my portfolio performance this month?",
        category: "performance",
        description: "View portfolio returns for the current month",
      },
      {
        question: "Which holdings have the highest concentration?",
        category: "risk",
        description: "Identify potential concentration risks",
      },
    ]);
  }),

  // ==========================================================================
  // SSO / Linked Accounts Endpoints
  // ==========================================================================

  // Get linked accounts (absolute URL)
  http.get(`${API_BASE}/auth/linked-accounts`, async () => {
    await delay(50);

    return HttpResponse.json([
      {
        id: "link-1",
        provider_type: "azure",
        provider_email: "user@company.com",
        provider_name: "John Doe",
        linked_at: "2024-01-01T00:00:00Z",
        last_login_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "link-2",
        provider_type: "google",
        provider_email: "user@gmail.com",
        provider_name: "John Doe",
        linked_at: "2024-01-02T00:00:00Z",
        last_login_at: "2024-01-09T00:00:00Z",
      },
    ]);
  }),

  // Get linked accounts (relative URL for test environment)
  http.get("/api/v1/auth/linked-accounts", async () => {
    await delay(50);

    return HttpResponse.json([
      {
        id: "link-1",
        provider_type: "azure",
        provider_email: "user@company.com",
        provider_name: "John Doe",
        linked_at: "2024-01-01T00:00:00Z",
        last_login_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "link-2",
        provider_type: "google",
        provider_email: "user@gmail.com",
        provider_name: "John Doe",
        linked_at: "2024-01-02T00:00:00Z",
        last_login_at: "2024-01-09T00:00:00Z",
      },
    ]);
  }),

  // Get auth methods (absolute URL)
  http.get(`${API_BASE}/auth/methods`, async () => {
    await delay(50);

    return HttpResponse.json({
      linked_accounts: [
        {
          id: "link-1",
          provider_type: "azure",
          provider_email: "user@company.com",
          provider_name: "John Doe",
          linked_at: "2024-01-01T00:00:00Z",
          last_login_at: "2024-01-10T00:00:00Z",
        },
        {
          id: "link-2",
          provider_type: "google",
          provider_email: "user@gmail.com",
          provider_name: "John Doe",
          linked_at: "2024-01-02T00:00:00Z",
          last_login_at: "2024-01-09T00:00:00Z",
        },
      ],
      has_password: true,
    });
  }),

  // Get auth methods (relative URL for test environment)
  http.get("/api/v1/auth/methods", async () => {
    await delay(50);

    return HttpResponse.json({
      linked_accounts: [
        {
          id: "link-1",
          provider_type: "azure",
          provider_email: "user@company.com",
          provider_name: "John Doe",
          linked_at: "2024-01-01T00:00:00Z",
          last_login_at: "2024-01-10T00:00:00Z",
        },
        {
          id: "link-2",
          provider_type: "google",
          provider_email: "user@gmail.com",
          provider_name: "John Doe",
          linked_at: "2024-01-02T00:00:00Z",
          last_login_at: "2024-01-09T00:00:00Z",
        },
      ],
      has_password: true,
    });
  }),

  // Start OAuth flow (absolute URL)
  http.post(`${API_BASE}/auth/oauth/:provider`, async ({ params }) => {
    await delay(50);

    return HttpResponse.json({
      auth_url: `https://oauth.${params.provider}.com/authorize?client_id=test`,
      state: `test-state-${params.provider}`,
      code_verifier: `test-verifier-${params.provider}`,
    });
  }),

  // Start OAuth flow (relative URL for test environment)
  http.post("/api/v1/auth/oauth/:provider", async ({ params }) => {
    await delay(50);

    return HttpResponse.json({
      auth_url: `https://oauth.${params.provider}.com/authorize?client_id=test`,
      state: `test-state-${params.provider}`,
      code_verifier: `test-verifier-${params.provider}`,
    });
  }),

  // Unlink account (absolute URL)
  http.delete(`${API_BASE}/auth/link/:provider`, async () => {
    await delay(50);

    return HttpResponse.json({ success: true });
  }),

  // Unlink account (relative URL for test environment)
  http.delete("/api/v1/auth/link/:provider", async () => {
    await delay(50);

    return HttpResponse.json({ success: true });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  networkError: http.get(`${API_BASE}/portfolios`, () => {
    return HttpResponse.error();
  }),

  serverError: http.get(`${API_BASE}/portfolios`, () => {
    return HttpResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }),

  unauthorized: http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "Not authenticated",
      },
      { status: 401 }
    );
  }),
};
