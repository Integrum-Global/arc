/**
 * API Endpoints for ARC Web Frontend
 * Defines all endpoint functions organized by domain
 */

import { get, post, patch, del } from "./client";
import type {
  // Generic types
  ApiResponse,
  PaginatedResponse,
  // Auth types
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  // User types
  User,
  UserPreference,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  // Portfolio types
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioListFilters,
  Holding,
  HoldingSummary,
  Transaction,
  TransactionListFilters,
  PortfolioHealth,
  PortfolioValuation,
  // Analytics types
  SecurityRatios,
  RatioHistory,
  BenchmarkComparison,
  // Alert types
  Alert,
  AlertListFilters,
  AlertThreshold,
  CreateAlertThresholdRequest,
  UpdateAlertThresholdRequest,
  // Intelligence types
  MarketBrief,
  BriefType,
  PortfolioQuery,
  PortfolioQueryResponse,
  QuerySuggestion,
} from "@/types/api";

// =============================================================================
// Auth Endpoints
// =============================================================================

export const authApi = {
  /**
   * Login with email and password
   */
  login: (credentials: LoginCredentials) =>
    post<LoginResponse>("/auth/login", credentials),

  /**
   * Refresh access token
   */
  refresh: (data: RefreshTokenRequest) =>
    post<RefreshTokenResponse>("/auth/refresh", data),

  /**
   * Get current authenticated user
   */
  me: () => get<User>("/auth/me"),

  /**
   * Logout current user
   */
  logout: () => post<void>("/auth/logout"),
};

// =============================================================================
// User Endpoints
// =============================================================================

export const usersApi = {
  /**
   * Get current user profile
   */
  me: () => get<User>("/users/me"),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateUserProfileRequest) =>
    patch<User>("/users/me", data),

  /**
   * Get user preferences
   */
  preferences: () => get<UserPreference>("/users/me/preferences"),

  /**
   * Update user preferences
   */
  updatePreferences: (data: UpdateUserPreferencesRequest) =>
    patch<UserPreference>("/users/me/preferences", data),

  /**
   * List users (admin only)
   */
  list: (params?: Record<string, unknown>) =>
    get<PaginatedResponse<User>>("/users", { params }),
};

// =============================================================================
// Portfolio Endpoints
// =============================================================================

export const portfoliosApi = {
  /**
   * List portfolios with optional filters
   */
  list: (filters?: PortfolioListFilters) =>
    get<PaginatedResponse<Portfolio>>("/portfolios", { params: filters }),

  /**
   * Get a single portfolio by ID
   */
  get: (id: string) => get<Portfolio>(`/portfolios/${id}`),

  /**
   * Create a new portfolio
   */
  create: (data: CreatePortfolioRequest) =>
    post<Portfolio>("/portfolios", data),

  /**
   * Update an existing portfolio
   */
  update: (id: string, data: UpdatePortfolioRequest) =>
    patch<Portfolio>(`/portfolios/${id}`, data),

  /**
   * Delete a portfolio
   */
  delete: (id: string) => del<void>(`/portfolios/${id}`),

  /**
   * Get portfolio holdings
   */
  holdings: (id: string) =>
    get<ApiResponse<Holding[]>>(`/portfolios/${id}/holdings`),

  /**
   * Get portfolio holdings summary
   */
  holdingsSummary: (id: string) =>
    get<HoldingSummary>(`/portfolios/${id}/holdings/summary`),

  /**
   * Get portfolio transactions
   */
  transactions: (id: string, filters?: TransactionListFilters) =>
    get<PaginatedResponse<Transaction>>(`/portfolios/${id}/transactions`, {
      params: filters,
    }),

  /**
   * Get portfolio health scan
   */
  health: (id: string) => get<PortfolioHealth>(`/portfolios/${id}/health`),

  /**
   * Get portfolio valuation
   */
  valuation: (id: string, asOfDate?: string) =>
    get<PortfolioValuation>(`/portfolios/${id}/valuation`, {
      params: asOfDate ? { as_of_date: asOfDate } : undefined,
    }),
};

// =============================================================================
// Analytics Endpoints
// =============================================================================

export const analyticsApi = {
  /**
   * Get security ratios
   */
  securityRatios: (securityId: string, asOfDate?: string) =>
    get<SecurityRatios>(`/analytics/securities/${securityId}/ratios`, {
      params: asOfDate ? { as_of_date: asOfDate } : undefined,
    }),

  /**
   * Get ratio history for a security
   */
  ratioHistory: (
    securityId: string,
    ratioName: string,
    period?: "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "MAX"
  ) =>
    get<RatioHistory>(
      `/analytics/securities/${securityId}/ratios/${ratioName}/history`,
      {
        params: period ? { period } : undefined,
      }
    ),

  /**
   * Get benchmark comparison for a security
   */
  benchmark: (securityId: string, peerGroupId?: string) =>
    get<BenchmarkComparison>(`/analytics/securities/${securityId}/benchmark`, {
      params: peerGroupId ? { peer_group_id: peerGroupId } : undefined,
    }),

  /**
   * Get portfolio analytics
   */
  portfolioAnalytics: (portfolioId: string) =>
    get<Record<string, unknown>>(`/analytics/portfolios/${portfolioId}`),
};

// =============================================================================
// Alert Endpoints
// =============================================================================

export const alertsApi = {
  /**
   * List alerts with optional filters
   */
  list: (filters?: AlertListFilters) =>
    get<PaginatedResponse<Alert>>("/alerts", { params: filters }),

  /**
   * Get a single alert by ID
   */
  get: (id: string) => get<Alert>(`/alerts/${id}`),

  /**
   * Acknowledge an alert
   */
  acknowledge: (id: string) => post<Alert>(`/alerts/${id}/acknowledge`),

  /**
   * Dismiss an alert
   */
  dismiss: (id: string) => post<Alert>(`/alerts/${id}/dismiss`),

  /**
   * Resolve an alert
   */
  resolve: (id: string) => post<Alert>(`/alerts/${id}/resolve`),

  /**
   * Get alert thresholds
   */
  thresholds: () => get<AlertThreshold[]>("/alerts/thresholds"),

  /**
   * Get a single alert threshold
   */
  getThreshold: (id: string) => get<AlertThreshold>(`/alerts/thresholds/${id}`),

  /**
   * Create an alert threshold
   */
  createThreshold: (data: CreateAlertThresholdRequest) =>
    post<AlertThreshold>("/alerts/thresholds", data),

  /**
   * Update an alert threshold
   */
  updateThreshold: (id: string, data: UpdateAlertThresholdRequest) =>
    patch<AlertThreshold>(`/alerts/thresholds/${id}`, data),

  /**
   * Delete an alert threshold
   */
  deleteThreshold: (id: string) => del<void>(`/alerts/thresholds/${id}`),
};

// =============================================================================
// Intelligence Endpoints
// =============================================================================

export const intelligenceApi = {
  /**
   * Get market brief
   */
  brief: (type: BriefType, portfolioId?: string) =>
    get<MarketBrief>("/intelligence/brief", {
      params: { type, portfolio_id: portfolioId },
    }),

  /**
   * Query portfolio with natural language
   */
  query: (data: PortfolioQuery) =>
    post<PortfolioQueryResponse>("/intelligence/query", data),

  /**
   * Get query suggestions
   */
  suggestions: (portfolioId?: string) =>
    get<QuerySuggestion[]>("/intelligence/suggestions", {
      params: portfolioId ? { portfolio_id: portfolioId } : undefined,
    }),

  /**
   * Get AI analysis for a security
   */
  securityAnalysis: (securityId: string) =>
    get<Record<string, unknown>>(`/intelligence/securities/${securityId}`),
};
