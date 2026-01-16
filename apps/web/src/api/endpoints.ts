/**
 * API Endpoints for ARC Web Frontend
 * Defines all endpoint functions organized by domain
 */

import { get, post, put, del } from "./client";
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
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
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
    put<User>("/users/me", data),

  /**
   * Get user preferences
   */
  preferences: () => get<UserPreference>("/users/me/preferences"),

  /**
   * Update user preferences
   */
  updatePreferences: (data: UpdateUserPreferencesRequest) =>
    put<UserPreference>("/users/me/preferences", data),

  /**
   * Get notification preferences
   */
  notificationPreferences: () => get<NotificationPreferences>("/users/me/notification-preferences"),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: (data: UpdateNotificationPreferencesRequest) =>
    put<NotificationPreferences>("/users/me/notification-preferences", data),

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
    put<Portfolio>(`/portfolios/${id}`, data),

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
   * Get portfolio valuations history
   */
  valuations: (id: string, startDate?: string, limit?: number) =>
    get<PortfolioValuation[]>(`/portfolios/${id}/valuations`, {
      params: { start_date: startDate, limit },
    }),

  /**
   * Get portfolio valuation (single snapshot)
   */
  valuation: (id: string, asOfDate?: string) =>
    get<PortfolioValuation>(`/portfolios/${id}/valuation`, {
      params: asOfDate ? { as_of_date: asOfDate } : undefined,
    }),

  /**
   * Get sector allocation
   */
  sectorAllocation: (id: string) =>
    get<Record<string, unknown>>(`/portfolios/${id}/allocation/sector`),

  /**
   * Get asset allocation
   */
  assetAllocation: (id: string) =>
    get<Record<string, unknown>>(`/portfolios/${id}/allocation/asset`),

  /**
   * Get top holdings
   */
  topHoldings: (id: string, limit?: number) =>
    get<Holding[]>(`/portfolios/${id}/top-holdings`, {
      params: limit ? { limit } : undefined,
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
    get<SecurityRatios>(`/securities/${securityId}/ratios`, {
      params: asOfDate ? { as_of_date: asOfDate } : undefined,
    }),

  /**
   * Get ratio history for a security
   */
  ratioHistory: (
    securityId: string,
    ratioName: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ) =>
    get<RatioHistory>(`/securities/${securityId}/ratios/history`, {
      params: { ratio_name: ratioName, start_date: startDate, end_date: endDate, limit },
    }),

  /**
   * Get benchmark comparison for a security
   */
  benchmark: (securityId: string, peerGroupId?: string) =>
    get<BenchmarkComparison>(`/securities/${securityId}/benchmark`, {
      params: peerGroupId ? { peer_group_id: peerGroupId } : undefined,
    }),

  /**
   * Get ratio trend analysis
   */
  ratioTrend: (securityId: string, ratioName: string, periods?: number) =>
    get<Record<string, unknown>>(`/securities/${securityId}/trend`, {
      params: { ratio_name: ratioName, periods },
    }),

  /**
   * Calculate ratios for securities
   */
  calculateRatios: (securityIds?: string[], ratioNames?: string[], forceRecalculate?: boolean) =>
    post<Record<string, unknown>>("/analytics/ratios/calculate", {
      security_ids: securityIds,
      ratio_names: ratioNames,
      force_recalculate: forceRecalculate,
    }),

  /**
   * Check thresholds and generate alerts
   */
  checkThresholds: () => post<Record<string, unknown>>("/analytics/thresholds/check"),
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
  acknowledge: (id: string) => put<Alert>(`/alerts/${id}/acknowledge`),

  /**
   * Dismiss an alert
   */
  dismiss: (id: string, reason?: string) =>
    put<Alert>(`/alerts/${id}/dismiss`, { reason }),

  /**
   * Resolve an alert
   */
  resolve: (id: string, resolutionNotes?: string) =>
    put<Alert>(`/alerts/${id}/resolve`, { resolution_notes: resolutionNotes }),

  /**
   * Get alert thresholds
   */
  thresholds: (ratioName?: string, portfolioId?: string, enabledOnly?: boolean) =>
    get<AlertThreshold[]>("/thresholds", {
      params: { ratio_name: ratioName, portfolio_id: portfolioId, enabled_only: enabledOnly },
    }),

  /**
   * Get a single alert threshold by ID
   */
  getThreshold: (id: string) => get<AlertThreshold>(`/thresholds/${id}`),

  /**
   * Create an alert threshold
   */
  createThreshold: (data: CreateAlertThresholdRequest) =>
    post<AlertThreshold>("/thresholds", data),

  /**
   * Update an alert threshold
   */
  updateThreshold: (id: string, data: UpdateAlertThresholdRequest) =>
    put<AlertThreshold>(`/thresholds/${id}`, data),

  /**
   * Delete an alert threshold
   */
  deleteThreshold: (id: string) => del<void>(`/thresholds/${id}`),
};

// =============================================================================
// Intelligence Endpoints
// =============================================================================

// Intelligence endpoints are not yet implemented in backend
// TODO: Implement intelligence endpoints when AI features are ready
export const intelligenceApi = {
  /**
   * Get market brief (placeholder - not yet implemented)
   */
  brief: (_type: BriefType, _portfolioId?: string) =>
    Promise.resolve({} as MarketBrief),

  /**
   * Query portfolio with natural language (placeholder - not yet implemented)
   */
  query: (_data: PortfolioQuery) =>
    Promise.resolve({ answer: "Intelligence features coming soon" } as PortfolioQueryResponse),

  /**
   * Get query suggestions (placeholder - not yet implemented)
   */
  suggestions: (_portfolioId?: string) =>
    Promise.resolve([] as QuerySuggestion[]),

  /**
   * Get AI analysis for a security (placeholder - not yet implemented)
   */
  securityAnalysis: (_securityId: string) =>
    Promise.resolve({} as Record<string, unknown>),
};

// =============================================================================
// Peer Group Endpoints
// =============================================================================

export const peerGroupsApi = {
  /**
   * List peer groups
   */
  list: (includeSystem?: boolean, groupType?: string) =>
    get<Record<string, unknown>[]>("/peer-groups", {
      params: { include_system: includeSystem, group_type: groupType },
    }),

  /**
   * Create a peer group
   */
  create: (data: { name: string; security_ids: string[]; description?: string; group_type?: string }) =>
    post<Record<string, unknown>>("/peer-groups", data),

  /**
   * Update a peer group
   */
  update: (id: string, data: { name?: string; description?: string; security_ids?: string[] }) =>
    put<Record<string, unknown>>(`/peer-groups/${id}`, data),

  /**
   * Delete a peer group
   */
  delete: (id: string) => del<void>(`/peer-groups/${id}`),
};

// =============================================================================
// Admin Endpoints
// =============================================================================

export const adminApi = {
  /**
   * Get tenant information
   */
  tenant: () => get<Record<string, unknown>>("/admin/tenant"),

  /**
   * Update tenant settings
   */
  updateTenant: (data: { name?: string; settings?: Record<string, unknown> }) =>
    put<Record<string, unknown>>("/admin/tenant", data),

  /**
   * Get audit logs
   */
  auditLogs: (params?: {
    start_date?: string;
    end_date?: string;
    action?: string;
    user_id?: string;
    entity_type?: string;
    limit?: number;
  }) => get<Record<string, unknown>[]>("/admin/audit", { params }),

  /**
   * Get usage metrics
   */
  metrics: () => get<Record<string, unknown>>("/admin/metrics"),
};

// =============================================================================
// Dashboard Layout Endpoints
// =============================================================================

/**
 * Dashboard layout types for API communication
 */
export interface DashboardLayoutWidget {
  id: string;
  widgetId: string;
  position: { x: number; y: number };
  size: { cols: number; rows: number };
  settings?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardLayoutWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDashboardLayoutRequest {
  name: string;
  widgets: DashboardLayoutWidget[];
  isDefault?: boolean;
}

export interface UpdateDashboardLayoutRequest {
  name?: string;
  widgets?: DashboardLayoutWidget[];
  isDefault?: boolean;
}

export const dashboardApi = {
  /**
   * Get all dashboard layouts for current user
   */
  getAllLayouts: () => get<DashboardLayout[]>("/users/me/dashboard-layouts"),

  /**
   * Get the active dashboard layout for current user
   */
  getActiveLayout: () => get<DashboardLayout>("/users/me/dashboard-layout"),

  /**
   * Create a new dashboard layout
   */
  createLayout: (data: CreateDashboardLayoutRequest) =>
    post<DashboardLayout>("/users/me/dashboard-layouts", data),

  /**
   * Update an existing dashboard layout
   */
  updateLayout: (id: string, data: UpdateDashboardLayoutRequest) =>
    put<DashboardLayout>(`/users/me/dashboard-layouts/${id}`, data),

  /**
   * Delete a dashboard layout
   */
  deleteLayout: (id: string) => del<void>(`/users/me/dashboard-layouts/${id}`),

  /**
   * Activate a dashboard layout (make it the active layout)
   */
  activateLayout: (id: string) =>
    post<DashboardLayout>(`/users/me/dashboard-layouts/${id}/activate`),
};
