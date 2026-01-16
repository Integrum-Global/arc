/**
 * Hooks Index
 * Central export for all custom hooks
 */

// =============================================================================
// Portfolio Hooks
// =============================================================================
export {
  // Query hooks
  usePortfolios,
  usePortfolio,
  usePortfolioHoldings,
  usePortfolioTransactions,
  usePortfolioHealth,
  usePortfolioValuation,
  // Mutation hooks
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  // Prefetch hooks
  usePrefetchPortfolio,
  usePrefetchPortfolioHoldings,
  // Utility hooks
  useInvalidatePortfolios,
  useResetPortfolioCache,
} from "./usePortfolios";

// =============================================================================
// Analytics Hooks
// =============================================================================
export {
  // Security analytics
  useSecurityRatios,
  useRatioHistory,
  useBenchmark,
  // Alert queries
  useAlerts,
  useAlert,
  useAlertThresholds,
  useAlertThreshold,
  // Alert mutations
  useAcknowledgeAlert,
  useDismissAlert,
  useResolveAlert,
  // Threshold mutations
  useCreateAlertThreshold,
  useUpdateAlertThreshold,
  useDeleteAlertThreshold,
  // Utility hooks
  useActiveAlertsCount,
  useInvalidateAnalytics,
} from "./useAnalytics";

// =============================================================================
// Intelligence Hooks
// =============================================================================
export {
  // Query hooks
  useMarketBrief,
  useQuerySuggestions,
  useSecurityAnalysis,
  // Mutation hooks
  usePortfolioQuery,
  useCachedQueryResponse,
  // Convenience hooks
  useMorningBrief,
  useMiddayBrief,
  useClosingBrief,
  useWeeklySummary,
  useMonthlySummary,
  // Utility hooks
  usePrefetchMarketBrief,
  useInvalidateIntelligence,
  useClearIntelligenceCache,
} from "./useIntelligence";

// =============================================================================
// Auth Hooks
// =============================================================================
export {
  // Query hooks
  useCurrentUser,
  useUserPreferences,
  // Mutation hooks
  useLogin,
  useLogout,
  useUpdateProfile,
  useUpdatePreferences,
  // Combined hooks
  useAuth,
  // Role hooks
  useHasRole,
  useIsAdmin,
  useCanManagePortfolios,
  // Utility hooks
  useInvalidateUser,
  useCheckAuthToken,
} from "./useAuth";

// =============================================================================
// UI Hooks
// =============================================================================
export {
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useMediaQuery,
  useWindowSize,
  breakpoints,
  type Breakpoint,
  type BreakpointKey,
} from "./useBreakpoint";

// =============================================================================
// Dashboard Hooks
// =============================================================================
export {
  useDashboardData,
  type DashboardData,
  type DashboardSummary,
  type DataFreshness,
  type TopHolding,
  type PerformanceDataPoint,
} from "./useDashboardData";

// =============================================================================
// Alert Stream Hooks
// =============================================================================
export { useAlertStream } from "./useAlertStream";

// =============================================================================
// Notification Preferences Hooks
// =============================================================================
export {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "./useNotificationPreferences";

// =============================================================================
// SSO Linked Accounts Hooks
// =============================================================================
export {
  useLinkedAccounts,
  useAuthMethods,
  useCanUnlink,
  useLinkAccount,
  useUnlinkAccount,
  type LinkedAccount,
  type AuthMethodsResponse,
} from "./useLinkedAccounts";

// =============================================================================
// Dashboard Shortcuts Hooks
// =============================================================================
export {
  useDashboardShortcuts,
  type ShortcutDefinition,
  type UseDashboardShortcutsOptions,
  type UseDashboardShortcutsConfig,
  type UseDashboardShortcutsReturn,
} from "./useDashboardShortcuts";

// =============================================================================
// Dashboard Sync Hooks
// =============================================================================
export {
  // Main sync hook
  useDashboardSync,
  // Query hooks
  useLoadLayout,
  useAllLayouts,
  // Mutation hooks
  useSaveLayout,
  useCreateLayout,
  useDeleteLayout,
  useActivateLayout,
  // Utility hooks
  useInvalidateDashboardLayouts,
  usePrefetchLayout,
} from "./useDashboardSync";
