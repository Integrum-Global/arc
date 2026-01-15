/**
 * Central export for all stores
 */

export { useAuthStore } from "./authStore";
export { useUIStore } from "./uiStore";
export {
  useAlertStore,
  useCriticalAlerts,
  useUnreadCount,
  useCriticalCount,
  useActionableAlerts,
  useInformationalAlerts,
  useIsConnected,
} from "./alertStore";
export {
  useDashboardStore,
  useWidgets,
  useIsEditMode,
  useSelectedWidget,
  useHasUnsavedChanges,
  useIsSyncing,
  useLastSyncedAt,
  DEFAULT_WIDGETS,
} from "./dashboardStore";
export type { WidgetInstance, DashboardState } from "./dashboardStore";
