/**
 * Alert Types for ARC Alert System
 * Based on docs/02-plans/09-alert-strategy/01-architecture.md
 */

// =============================================================================
// Core Alert Types
// =============================================================================

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AlertStatus = "active" | "acknowledged" | "resolved";

export type AlertType = string; // Flexible string for all alert types

export interface Alert {
  id: string;
  message: string;
  details?: string;
  severity: AlertSeverity;
  alert_type: AlertType;
  status: AlertStatus;
  portfolio_id?: string;
  portfolio_name?: string;
  security_id?: string;
  created_at: string;
  acknowledged_at?: string;
}

// =============================================================================
// Priority Calculation Types
// =============================================================================

export type AlertTier = 1 | 2 | 3;

export type DisplayChannel =
  | "banner"
  | "toast"
  | "sound"
  | "badge"
  | "widget"
  | "center";

export interface AlertPriorityInput {
  severity: AlertSeverity;
  alertType: string;
  createdAt: Date;
  portfolioValue?: number;
  impactPercentage?: number;
  isAcknowledged: boolean;
}

export interface AlertPriorityOutput {
  tier: AlertTier;
  score: number; // 0-100, higher = more urgent
  displayChannels: DisplayChannel[];
}

// =============================================================================
// Store State Types
// =============================================================================

export interface AlertState {
  // Raw state
  alerts: Alert[];
  isConnected: boolean;

  // Computed properties (tier-filtered arrays)
  criticalAlerts: Alert[];
  actionableAlerts: Alert[];
  informationalAlerts: Alert[];

  // Counters
  unreadCount: number;

  // Actions
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  markAllRead: () => void;
  setConnected: (connected: boolean) => void;
}
