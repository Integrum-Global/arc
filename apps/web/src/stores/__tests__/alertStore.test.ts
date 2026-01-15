/**
 * Unit Tests for Alert Store
 * Tests all actions, computed properties, and tier filtering logic
 * NO MOCKING - uses real Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

describe("alertStore", () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useAlertStore.getState();
    // Clear all alerts
    store.alerts.forEach((alert) => store.removeAlert(alert.id));
    // Reset connection state
    store.setConnected(false);
  });

  describe("Initial State", () => {
    it("initializes with empty alerts array", () => {
      const { alerts } = useAlertStore.getState();
      expect(alerts).toEqual([]);
    });

    it("initializes with empty computed arrays", () => {
      const { criticalAlerts, actionableAlerts, informationalAlerts } =
        useAlertStore.getState();
      expect(criticalAlerts).toEqual([]);
      expect(actionableAlerts).toEqual([]);
      expect(informationalAlerts).toEqual([]);
    });

    it("initializes with zero unread count", () => {
      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(0);
    });

    it("initializes with isConnected as false", () => {
      const { isConnected } = useAlertStore.getState();
      expect(isConnected).toBe(false);
    });
  });

  describe("addAlert", () => {
    it("adds critical alert to alerts array", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Margin call triggered",
        severity: "critical",
        alert_type: "margin_call",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]!).toEqual(alert);
    });

    it("adds alert to criticalAlerts when severity is critical", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "System failure",
        severity: "critical",
        alert_type: "system_failure",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { criticalAlerts } = useAlertStore.getState();
      expect(criticalAlerts).toHaveLength(1);
      expect(criticalAlerts[0]!.id).toBe("alert-1");
    });

    it("adds alert to actionableAlerts when severity is high", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-2",
        message: "Threshold breach",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { actionableAlerts } = useAlertStore.getState();
      expect(actionableAlerts).toHaveLength(1);
      expect(actionableAlerts[0]!.id).toBe("alert-2");
    });

    it("adds alert to actionableAlerts when severity is medium", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-3",
        message: "Health scan issue",
        severity: "medium",
        alert_type: "health_issue",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { actionableAlerts } = useAlertStore.getState();
      expect(actionableAlerts).toHaveLength(1);
      expect(actionableAlerts[0]!.id).toBe("alert-3");
    });

    it("adds alert to informationalAlerts when severity is low", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-4",
        message: "Price change notification",
        severity: "low",
        alert_type: "price_change",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { informationalAlerts } = useAlertStore.getState();
      expect(informationalAlerts).toHaveLength(1);
      expect(informationalAlerts[0]!.id).toBe("alert-4");
    });

    it("increments unreadCount when adding alert", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test alert",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);

      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(1);
    });

    it("adds multiple alerts correctly", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "Critical alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "High alert",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1);
      store.addAlert(alert2);

      const { alerts, criticalAlerts, actionableAlerts, unreadCount } =
        useAlertStore.getState();
      expect(alerts).toHaveLength(2);
      expect(criticalAlerts).toHaveLength(1);
      expect(actionableAlerts).toHaveLength(1);
      expect(unreadCount).toBe(2);
    });

    it("prepends new alerts to maintain reverse chronological order", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "First alert",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "Second alert",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1);
      store.addAlert(alert2);

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.id).toBe("alert-2"); // Most recent first
      expect(alerts[1]!.id).toBe("alert-1");
    });
  });

  describe("updateAlert", () => {
    it("updates alert properties", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Original message",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.updateAlert("alert-1", { message: "Updated message" });

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.message).toBe("Updated message");
    });

    it("does not affect other alerts when updating", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "Alert 1",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "Alert 2",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1);
      store.addAlert(alert2);
      store.updateAlert("alert-1", { message: "Updated" });

      const { alerts } = useAlertStore.getState();
      expect(alerts.find((a) => a.id === "alert-1")?.message).toBe("Updated");
      expect(alerts.find((a) => a.id === "alert-2")?.message).toBe("Alert 2");
    });

    it("handles non-existent alert gracefully", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.updateAlert("non-existent", { message: "Updated" });

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.message).toBe("Test"); // Unchanged
    });
  });

  describe("removeAlert", () => {
    it("removes alert from alerts array", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.removeAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(0);
    });

    it("removes alert from tier-specific arrays", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Critical",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.removeAlert("alert-1");

      const { criticalAlerts } = useAlertStore.getState();
      expect(criticalAlerts).toHaveLength(0);
    });

    it("decrements unreadCount when removing alert", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      const { unreadCount: before } = useAlertStore.getState();
      store.removeAlert("alert-1");
      const { unreadCount: after } = useAlertStore.getState();

      expect(before).toBe(1);
      expect(after).toBe(0);
    });

    it("handles non-existent alert gracefully", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.removeAlert("non-existent");

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1); // Original alert remains
    });
  });

  describe("acknowledgeAlert", () => {
    it("updates status to acknowledged", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.acknowledgeAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.status).toBe("acknowledged");
    });

    it("sets acknowledged_at timestamp", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.acknowledgeAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.acknowledged_at).toBeDefined();
      expect(new Date(alerts[0]!.acknowledged_at!).getTime()).toBeGreaterThanOrEqual(
        new Date(alerts[0]!.created_at).getTime()
      );
    });

    it("keeps alert in alerts array after acknowledgement", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.acknowledgeAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1);
    });

    it("handles non-existent alert gracefully", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.acknowledgeAlert("non-existent");

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.status).toBe("active"); // Unchanged
    });
  });

  describe("dismissAlert", () => {
    it("removes alert from store", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.dismissAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(0);
    });

    it("decrements unreadCount", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.dismissAlert("alert-1");

      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(0);
    });
  });

  describe("resolveAlert", () => {
    it("updates status to resolved", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.resolveAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts[0]!.status).toBe("resolved");
    });

    it("keeps alert in alerts array after resolution", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Test",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      store.resolveAlert("alert-1");

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1);
    });
  });

  describe("markAllRead", () => {
    it("sets unreadCount to 0", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "Test 1",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "Test 2",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1);
      store.addAlert(alert2);
      expect(useAlertStore.getState().unreadCount).toBe(2);

      store.markAllRead();

      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(0);
    });

    it("keeps all alerts in alerts array", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "Test 1",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "Test 2",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1);
      store.addAlert(alert2);
      store.markAllRead();

      const { alerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(2);
    });

    it("handles empty alerts array gracefully", () => {
      const store = useAlertStore.getState();
      store.markAllRead();

      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(0);
    });
  });

  describe("setConnected", () => {
    it("updates isConnected state", () => {
      const store = useAlertStore.getState();
      store.setConnected(true);

      const { isConnected } = useAlertStore.getState();
      expect(isConnected).toBe(true);
    });

    it("can toggle connection state", () => {
      const store = useAlertStore.getState();
      store.setConnected(true);
      expect(useAlertStore.getState().isConnected).toBe(true);

      store.setConnected(false);
      expect(useAlertStore.getState().isConnected).toBe(false);
    });
  });

  describe("Tier Filtering Logic", () => {
    it("correctly filters critical tier (severity = critical)", () => {
      const store = useAlertStore.getState();
      const criticalAlert: Alert = {
        id: "alert-1",
        message: "Critical",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const highAlert: Alert = {
        id: "alert-2",
        message: "High",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const lowAlert: Alert = {
        id: "alert-3",
        message: "Low",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(criticalAlert);
      store.addAlert(highAlert);
      store.addAlert(lowAlert);

      const { criticalAlerts } = useAlertStore.getState();
      expect(criticalAlerts).toHaveLength(1);
      expect(criticalAlerts[0]!.severity).toBe("critical");
    });

    it("correctly filters actionable tier (severity = high or medium)", () => {
      const store = useAlertStore.getState();
      const criticalAlert: Alert = {
        id: "alert-1",
        message: "Critical",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const highAlert: Alert = {
        id: "alert-2",
        message: "High",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const mediumAlert: Alert = {
        id: "alert-3",
        message: "Medium",
        severity: "medium",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const lowAlert: Alert = {
        id: "alert-4",
        message: "Low",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(criticalAlert);
      store.addAlert(highAlert);
      store.addAlert(mediumAlert);
      store.addAlert(lowAlert);

      const { actionableAlerts } = useAlertStore.getState();
      expect(actionableAlerts).toHaveLength(2);
      expect(actionableAlerts.every((a) => ["high", "medium"].includes(a.severity))).toBe(
        true
      );
    });

    it("correctly filters informational tier (severity = low)", () => {
      const store = useAlertStore.getState();
      const criticalAlert: Alert = {
        id: "alert-1",
        message: "Critical",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const lowAlert1: Alert = {
        id: "alert-2",
        message: "Low 1",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const lowAlert2: Alert = {
        id: "alert-3",
        message: "Low 2",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(criticalAlert);
      store.addAlert(lowAlert1);
      store.addAlert(lowAlert2);

      const { informationalAlerts } = useAlertStore.getState();
      expect(informationalAlerts).toHaveLength(2);
      expect(informationalAlerts.every((a) => a.severity === "low")).toBe(true);
    });
  });

  describe("Computed Properties", () => {
    it("updates criticalAlerts when critical alert is acknowledged", () => {
      const store = useAlertStore.getState();
      const alert: Alert = {
        id: "alert-1",
        message: "Critical",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert);
      expect(useAlertStore.getState().criticalAlerts).toHaveLength(1);

      store.acknowledgeAlert("alert-1");

      // Alert still in alerts array but computed filter might change
      const { alerts, criticalAlerts } = useAlertStore.getState();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.status).toBe("acknowledged");
    });

    it("unreadCount matches total alerts added", () => {
      const store = useAlertStore.getState();
      const alerts: Alert[] = [
        {
          id: "alert-1",
          message: "Critical",
          severity: "critical",
          alert_type: "test",
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: "alert-2",
          message: "High",
          severity: "high",
          alert_type: "test",
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: "alert-3",
          message: "Low",
          severity: "low",
          alert_type: "test",
          status: "active",
          created_at: new Date().toISOString(),
        },
      ];

      alerts.forEach((alert) => store.addAlert(alert));

      const { unreadCount } = useAlertStore.getState();
      expect(unreadCount).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid sequential additions", () => {
      const store = useAlertStore.getState();
      const alerts: Alert[] = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        message: `Alert ${i}`,
        severity: i % 2 === 0 ? "critical" : "high",
        alert_type: "test",
        status: "active" as const,
        created_at: new Date().toISOString(),
      }));

      alerts.forEach((alert) => store.addAlert(alert));

      const {
        alerts: allAlerts,
        criticalAlerts,
        actionableAlerts,
        unreadCount,
      } = useAlertStore.getState();
      expect(allAlerts).toHaveLength(10);
      expect(criticalAlerts).toHaveLength(5);
      expect(actionableAlerts).toHaveLength(5);
      expect(unreadCount).toBe(10);
    });

    it("handles mixed operations sequence", () => {
      const store = useAlertStore.getState();
      const alert1: Alert = {
        id: "alert-1",
        message: "Alert 1",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert2: Alert = {
        id: "alert-2",
        message: "Alert 2",
        severity: "high",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };
      const alert3: Alert = {
        id: "alert-3",
        message: "Alert 3",
        severity: "low",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      store.addAlert(alert1); // unreadCount = 1
      store.addAlert(alert2); // unreadCount = 2
      store.acknowledgeAlert("alert-1"); // unreadCount = 2 (no change)
      store.addAlert(alert3); // unreadCount = 3
      store.dismissAlert("alert-3"); // unreadCount = 2 (removed)
      store.resolveAlert("alert-2"); // unreadCount = 2 (no change)

      const { alerts, unreadCount } = useAlertStore.getState();
      expect(alerts).toHaveLength(2); // alert1 (acknowledged), alert2 (resolved)
      expect(alerts[0]!.status).toBe("resolved"); // alert2 (most recent remaining)
      expect(alerts[1]!.status).toBe("acknowledged"); // alert1
      expect(unreadCount).toBe(2); // 3 alerts added, 1 dismissed = 2 remaining in count
    });
  });
});
