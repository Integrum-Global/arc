/**
 * Alert Store - Global state management for alerts
 * Based on docs/02-plans/09-alert-strategy/01-architecture.md
 *
 * Features:
 * - Tier-based filtering (critical, actionable, informational)
 * - Real-time computed properties
 * - Unread count tracking
 * - Connection state management
 * - Optimized selectors with subscribeWithSelector middleware
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Alert, AlertState, AlertSeverity } from "@/types/alert";

/**
 * Determine tier from severity
 * Tier 1 (Critical): severity = "critical"
 * Tier 2 (Actionable): severity = "high" | "medium"
 * Tier 3 (Informational): severity = "low"
 */
function getAlertTier(severity: AlertSeverity): 1 | 2 | 3 {
  if (severity === "critical") return 1;
  if (severity === "high" || severity === "medium") return 2;
  return 3;
}

/**
 * Filter alerts by tier
 */
function filterAlertsByTier(alerts: Alert[], tier: 1 | 2 | 3): Alert[] {
  return alerts.filter((alert) => getAlertTier(alert.severity) === tier);
}

/**
 * Recalculate all computed properties from alerts array
 */
function recalculateComputedProperties(alerts: Alert[]) {
  return {
    criticalAlerts: filterAlertsByTier(alerts, 1),
    actionableAlerts: filterAlertsByTier(alerts, 2),
    informationalAlerts: filterAlertsByTier(alerts, 3),
  };
}

/**
 * Alert Store
 */
export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    alerts: [],
    isConnected: false,
    criticalAlerts: [],
    actionableAlerts: [],
    informationalAlerts: [],
    unreadCount: 0,

    // Actions
    addAlert: (alert: Alert) => {
      set((state) => {
        const newAlerts = [alert, ...state.alerts]; // Prepend for reverse chronological order
        const computed = recalculateComputedProperties(newAlerts);

        return {
          alerts: newAlerts,
          ...computed,
          unreadCount: state.unreadCount + 1,
        };
      });
    },

    updateAlert: (id: string, updates: Partial<Alert>) => {
      set((state) => {
        const newAlerts = state.alerts.map((alert) =>
          alert.id === id ? { ...alert, ...updates } : alert
        );
        const computed = recalculateComputedProperties(newAlerts);

        return {
          alerts: newAlerts,
          ...computed,
        };
      });
    },

    removeAlert: (id: string) => {
      set((state) => {
        const alertExists = state.alerts.some((a) => a.id === id);
        if (!alertExists) {
          return state; // No change if alert doesn't exist
        }

        const newAlerts = state.alerts.filter((alert) => alert.id !== id);
        const computed = recalculateComputedProperties(newAlerts);

        return {
          alerts: newAlerts,
          ...computed,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    },

    acknowledgeAlert: (id: string) => {
      set((state) => {
        const newAlerts = state.alerts.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                status: "acknowledged" as const,
                acknowledged_at: new Date().toISOString(),
              }
            : alert
        );
        const computed = recalculateComputedProperties(newAlerts);

        return {
          alerts: newAlerts,
          ...computed,
        };
      });
    },

    dismissAlert: (id: string) => {
      // Dismiss = remove from store
      get().removeAlert(id);
    },

    resolveAlert: (id: string) => {
      set((state) => {
        const newAlerts = state.alerts.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                status: "resolved" as const,
              }
            : alert
        );
        const computed = recalculateComputedProperties(newAlerts);

        return {
          alerts: newAlerts,
          ...computed,
        };
      });
    },

    markAllRead: () => {
      set(() => ({
        unreadCount: 0,
      }));
    },

    setConnected: (connected: boolean) => {
      set({ isConnected: connected });
    },
  }))
);

// ============================================================================
// Selector Hooks (Optimized with subscribeWithSelector)
// ============================================================================

/**
 * Get critical alerts (Tier 1: severity = "critical")
 */
export const useCriticalAlerts = () =>
  useAlertStore((state) => state.criticalAlerts);

/**
 * Get unread count
 */
export const useUnreadCount = () => useAlertStore((state) => state.unreadCount);

/**
 * Get critical alert count
 */
export const useCriticalCount = () =>
  useAlertStore((state) => state.criticalAlerts.length);

/**
 * Get actionable alerts (Tier 2: severity = "high" | "medium")
 */
export const useActionableAlerts = () =>
  useAlertStore((state) => state.actionableAlerts);

/**
 * Get informational alerts (Tier 3: severity = "low")
 */
export const useInformationalAlerts = () =>
  useAlertStore((state) => state.informationalAlerts);

/**
 * Get connection status
 */
export const useIsConnected = () => useAlertStore((state) => state.isConnected);
