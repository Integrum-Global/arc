/**
 * API Types for ARC Web Frontend
 * Defines all domain types for API communication
 */

// =============================================================================
// Generic API Response Types
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  request_id?: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// =============================================================================
// Authentication Types
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

// =============================================================================
// User Types
// =============================================================================

export type UserRole = "admin" | "analyst" | "viewer" | "portfolio_manager";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
}

export interface UserPreference {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  avatar_url?: string;
}

export interface UpdateUserPreferencesRequest {
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  dashboard_layout?: Record<string, unknown>;
}

// =============================================================================
// Portfolio Types
// =============================================================================

export type PortfolioType =
  | "equity"
  | "fixed_income"
  | "balanced"
  | "money_market"
  | "alternative"
  | "custom";

export type PortfolioStatus = "active" | "inactive" | "closed" | "pending";

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  type: PortfolioType;
  status: PortfolioStatus;
  benchmark_id?: string;
  benchmark_name?: string;
  currency: string;
  inception_date: string;
  total_value: number;
  total_cost: number;
  unrealized_pnl: number;
  realized_pnl: number;
  ytd_return: number;
  holdings_count: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  type: PortfolioType;
  benchmark_id?: string;
  currency: string;
  inception_date?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  type?: PortfolioType;
  status?: PortfolioStatus;
  benchmark_id?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface PortfolioListFilters extends PaginationParams {
  status?: PortfolioStatus;
  type?: PortfolioType;
  search?: string;
  owner_id?: string;
}

// =============================================================================
// Holding Types
// =============================================================================

export interface Holding {
  id: string;
  portfolio_id: string;
  security_id: string;
  security: Security;
  quantity: number;
  average_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  weight: number;
  currency: string;
  as_of_date: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingSummary {
  total_holdings: number;
  total_market_value: number;
  total_cost: number;
  total_unrealized_pnl: number;
  by_sector: SectorAllocation[];
  by_asset_class: AssetClassAllocation[];
}

export interface SectorAllocation {
  sector: string;
  value: number;
  weight: number;
  holdings_count: number;
}

export interface AssetClassAllocation {
  asset_class: string;
  value: number;
  weight: number;
  holdings_count: number;
}

// =============================================================================
// Transaction Types
// =============================================================================

export type TransactionType =
  | "buy"
  | "sell"
  | "dividend"
  | "interest"
  | "fee"
  | "transfer_in"
  | "transfer_out"
  | "adjustment";

export type TransactionStatus = "pending" | "executed" | "cancelled" | "failed";

export interface Transaction {
  id: string;
  portfolio_id: string;
  security_id?: string;
  security?: Security;
  type: TransactionType;
  status: TransactionStatus;
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  currency: string;
  trade_date: string;
  settlement_date?: string;
  description?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListFilters extends PaginationParams {
  type?: TransactionType;
  status?: TransactionStatus;
  security_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

// =============================================================================
// Security Types
// =============================================================================

export type SecurityType =
  | "stock"
  | "bond"
  | "etf"
  | "mutual_fund"
  | "option"
  | "future"
  | "forex"
  | "crypto"
  | "cash";

export interface Security {
  id: string;
  symbol: string;
  name: string;
  type: SecurityType;
  exchange?: string;
  currency: string;
  sector?: string;
  industry?: string;
  country?: string;
  isin?: string;
  cusip?: string;
  current_price?: number;
  price_change?: number;
  price_change_percent?: number;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface SecurityRatio {
  ratio_name: string;
  value: number;
  formatted_value: string;
  category: string;
  description?: string;
  as_of_date: string;
}

export interface SecurityRatios {
  security_id: string;
  security_name: string;
  as_of_date: string;
  ratios: SecurityRatio[];
  valuation: RatioCategory;
  profitability: RatioCategory;
  liquidity: RatioCategory;
  leverage: RatioCategory;
  efficiency: RatioCategory;
}

export interface RatioCategory {
  ratios: SecurityRatio[];
  score?: number;
  trend?: "improving" | "stable" | "declining";
}

export interface RatioHistory {
  security_id: string;
  ratio_name: string;
  data_points: RatioDataPoint[];
  statistics: RatioStatistics;
}

export interface RatioDataPoint {
  date: string;
  value: number;
}

export interface RatioStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  std_dev: number;
  trend: "up" | "down" | "stable";
  change_percent: number;
}

export interface BenchmarkComparison {
  security_id: string;
  security_name: string;
  peer_group_id?: string;
  peer_group_name?: string;
  as_of_date: string;
  metrics: BenchmarkMetric[];
}

export interface BenchmarkMetric {
  metric_name: string;
  security_value: number;
  benchmark_value: number;
  peer_average?: number;
  peer_median?: number;
  percentile_rank?: number;
  difference: number;
  difference_percent: number;
}

// =============================================================================
// Alert Types
// =============================================================================

export type AlertType =
  | "price_alert"
  | "threshold_breach"
  | "portfolio_drift"
  | "rebalance_needed"
  | "risk_warning"
  | "compliance"
  | "news"
  | "custom";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus =
  | "active"
  | "acknowledged"
  | "dismissed"
  | "resolved"
  | "expired";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  portfolio_id?: string;
  portfolio_name?: string;
  security_id?: string;
  security_symbol?: string;
  threshold_id?: string;
  current_value?: number;
  threshold_value?: number;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  dismissed_at?: string;
  dismissed_by?: string;
  resolved_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AlertListFilters extends PaginationParams {
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  portfolio_id?: string;
  security_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AlertThreshold {
  id: string;
  name: string;
  type: AlertType;
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value: number;
  severity: AlertSeverity;
  portfolio_id?: string;
  security_id?: string;
  is_active: boolean;
  cooldown_minutes: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertThresholdRequest {
  name: string;
  type: AlertType;
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value: number;
  severity: AlertSeverity;
  portfolio_id?: string;
  security_id?: string;
  cooldown_minutes?: number;
}

export interface UpdateAlertThresholdRequest {
  name?: string;
  operator?: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value?: number;
  severity?: AlertSeverity;
  is_active?: boolean;
  cooldown_minutes?: number;
}

// =============================================================================
// Notification Preferences Types
// =============================================================================

export type NotificationChannel = "sound" | "toast" | "email" | "badge";

export interface QuietHoursConfig {
  enabled: boolean;
  start: number; // Minutes since midnight (e.g., 1320 = 22:00)
  end: number; // Minutes since midnight (e.g., 420 = 07:00)
}

export interface AlertTypeNotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  quietHours: QuietHoursConfig;
  alertTypeSettings: Record<string, AlertTypeNotificationSettings>;
}

export interface UpdateNotificationPreferencesRequest {
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
  quietHours?: QuietHoursConfig;
  alertTypeSettings?: Record<string, AlertTypeNotificationSettings>;
}

// =============================================================================
// Intelligence Types
// =============================================================================

export type BriefType =
  | "morning"
  | "midday"
  | "closing"
  | "weekly"
  | "monthly"
  | "custom";

export interface MarketBrief {
  id: string;
  type: BriefType;
  title: string;
  summary: string;
  generated_at: string;
  portfolio_id?: string;
  sections: BriefSection[];
  insights: BriefInsight[];
  action_items: ActionItem[];
  metadata?: Record<string, unknown>;
}

export interface BriefSection {
  title: string;
  content: string;
  order: number;
  type: "text" | "metrics" | "chart" | "table";
  data?: Record<string, unknown>;
}

export interface BriefInsight {
  category: string;
  insight: string;
  confidence: number;
  impact: "positive" | "negative" | "neutral";
  security_id?: string;
  security_symbol?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  portfolio_id?: string;
  security_id?: string;
  due_date?: string;
  completed: boolean;
}

export interface PortfolioQuery {
  question: string;
  portfolio_id?: string;
  context?: Record<string, unknown>;
}

export interface PortfolioQueryResponse {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  sources: QuerySource[];
  follow_up_questions: string[];
  generated_at: string;
  processing_time_ms: number;
}

export interface QuerySource {
  type: "portfolio" | "security" | "market" | "news" | "analysis";
  title: string;
  reference?: string;
  relevance: number;
}

export interface QuerySuggestion {
  question: string;
  category: string;
  description?: string;
}

// =============================================================================
// Portfolio Health Types
// =============================================================================

export interface PortfolioHealth {
  portfolio_id: string;
  portfolio_name: string;
  scan_date: string;
  overall_score: number;
  overall_status: "healthy" | "warning" | "critical";
  categories: HealthCategory[];
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
}

export interface HealthCategory {
  name: string;
  score: number;
  status: "healthy" | "warning" | "critical";
  metrics: HealthMetric[];
}

export interface HealthMetric {
  name: string;
  value: number;
  target?: number;
  unit?: string;
  status: "good" | "warning" | "critical";
}

export interface HealthIssue {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affected_holdings?: string[];
  recommended_action?: string;
}

export interface HealthRecommendation {
  id: string;
  category: string;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  expected_impact?: string;
  action_type?: string;
}

// =============================================================================
// Valuation Types
// =============================================================================

export interface PortfolioValuation {
  portfolio_id: string;
  as_of_date: string;
  total_value: number;
  total_cost: number;
  cash_balance: number;
  invested_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  realized_pnl_ytd: number;
  dividend_income_ytd: number;
  interest_income_ytd: number;
  fees_ytd: number;
  nav: number;
  nav_per_share?: number;
  currency: string;
  history: ValuationHistory[];
}

export interface ValuationHistory {
  date: string;
  total_value: number;
  nav: number;
  daily_return: number;
  cumulative_return: number;
}
