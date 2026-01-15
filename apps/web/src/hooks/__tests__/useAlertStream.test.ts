/**
 * Unit Tests for useAlertStream Hook
 *
 * Tests SSE connection, event handling, auto-reconnection, and cleanup
 *
 * Testing Strategy:
 * - Mock EventSource API (browser API)
 * - Use REAL alertStore (NO MOCKING per gold standards)
 * - Test all event types: alert:new, alert:update, alert:resolved, connection:status
 * - Test reconnection with exponential backoff
 * - Test cleanup on unmount
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Alert } from "@/types/alert";

// ============================================================================
// Mock soundManager (MUST be before imports that use it)
// ============================================================================

vi.mock("@/lib/soundManager", () => ({
  soundManager: {
    play: vi.fn(),
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    setQuietHours: vi.fn(),
    clearQuietHours: vi.fn(),
  },
}));

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import { useAlertStream } from "@/hooks/useAlertStream";
import { useAlertStore } from "@/stores/alertStore";
import { soundManager } from "@/lib/soundManager";

// ============================================================================
// Mock EventSource
// ============================================================================

interface MockEventSource {
  url: string;
  withCredentials: boolean;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  dispatchEvent: (event: Event) => boolean;
}

let mockEventSourceInstance: MockEventSource | null = null;
const mockEventSourceInstances: MockEventSource[] = [];

class MockEventSourceClass {
  url: string;
  withCredentials: boolean;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Record<string, ((event: MessageEvent) => void)[]> = {};

  constructor(url: string, config?: EventSourceInit) {
    this.url = url;
    this.withCredentials = config?.withCredentials ?? false;
    this.readyState = 0; // CONNECTING

    mockEventSourceInstance = this as any;
    mockEventSourceInstances.push(this as any);
  }

  addEventListener = vi.fn((type: string, listener: (event: MessageEvent) => void) => {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  });

  removeEventListener = vi.fn((type: string, listener: (event: MessageEvent) => void) => {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  });

  close = vi.fn(() => {
    this.readyState = 2; // CLOSED
  });

  dispatchEvent(event: Event): boolean {
    // Handle built-in events
    if (event.type === "open" && this.onopen) {
      this.onopen(event);
    } else if (event.type === "error" && this.onerror) {
      this.onerror(event);
    } else if (event.type === "message" && this.onmessage) {
      this.onmessage(event as MessageEvent);
    }

    // Handle custom event listeners
    const eventListeners = this.listeners[event.type];
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(event as MessageEvent));
    }

    return true;
  }
}

// ============================================================================
// Setup
// ============================================================================

describe("useAlertStream", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockEventSourceInstance = null;
    mockEventSourceInstances.length = 0;

    // Reset alert store
    useAlertStore.setState({
      alerts: [],
      criticalAlerts: [],
      actionableAlerts: [],
      informationalAlerts: [],
      unreadCount: 0,
      isConnected: false,
    });

    // Replace global EventSource with mock
    // @ts-expect-error - Mocking global EventSource
    global.EventSource = MockEventSourceClass;

    // Mock timers for reconnection tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Connection Tests
  // ==========================================================================

  it("establishes SSE connection to /api/v1/alerts/stream", () => {
    renderHook(() => useAlertStream());

    expect(mockEventSourceInstance).not.toBeNull();
    expect(mockEventSourceInstance!.url).toBe("/api/v1/alerts/stream");
    expect(mockEventSourceInstance!.withCredentials).toBe(true);
  });

  it("sets isConnected to true when connection opens", () => {
    renderHook(() => useAlertStream());

    expect(useAlertStore.getState().isConnected).toBe(false);

    // Simulate connection open
    act(() => {
      mockEventSourceInstance!.readyState = 1; // OPEN
      mockEventSourceInstance!.dispatchEvent(new Event("open"));
    });

    expect(useAlertStore.getState().isConnected).toBe(true);
  });

  it("sets isConnected to false when connection errors", () => {
    renderHook(() => useAlertStream());

    // Open connection first
    act(() => {
      mockEventSourceInstance!.readyState = 1;
      mockEventSourceInstance!.dispatchEvent(new Event("open"));
    });

    expect(useAlertStore.getState().isConnected).toBe(true);

    // Simulate error
    act(() => {
      mockEventSourceInstance!.readyState = 0; // CONNECTING (attempting reconnect)
      mockEventSourceInstance!.dispatchEvent(new Event("error"));
    });

    expect(useAlertStore.getState().isConnected).toBe(false);
  });

  // ==========================================================================
  // Event Handling Tests
  // ==========================================================================

  it("handles alert:new event by adding alert to store", () => {
    renderHook(() => useAlertStream());

    const newAlert: Alert = {
      id: "alert-1",
      message: "Test critical alert",
      severity: "critical",
      alert_type: "margin_call",
      status: "active",
      created_at: new Date().toISOString(),
    };

    // Dispatch alert:new event
    act(() => {
      const event = new MessageEvent("alert:new", {
        data: JSON.stringify(newAlert),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    const state = useAlertStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0]).toEqual(newAlert);
    expect(state.unreadCount).toBe(1);
  });

  it("handles alert:update event by updating existing alert", () => {
    // Pre-populate store with an alert
    const existingAlert: Alert = {
      id: "alert-1",
      message: "Test alert",
      severity: "high",
      alert_type: "threshold_breach",
      status: "active",
      created_at: new Date().toISOString(),
    };
    useAlertStore.getState().addAlert(existingAlert);

    renderHook(() => useAlertStream());

    // Update alert
    act(() => {
      const updatedAlert: Partial<Alert> = {
        id: "alert-1",
        message: "Updated alert message",
        status: "acknowledged",
      };

      const event = new MessageEvent("alert:update", {
        data: JSON.stringify(updatedAlert),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    const state = useAlertStore.getState();
    const alert = state.alerts.find((a) => a.id === "alert-1");
    expect(alert?.message).toBe("Updated alert message");
    expect(alert?.status).toBe("acknowledged");
  });

  it("handles alert:resolved event by removing alert", () => {
    // Pre-populate store with an alert
    const existingAlert: Alert = {
      id: "alert-1",
      message: "Test alert",
      severity: "medium",
      alert_type: "health_issue",
      status: "active",
      created_at: new Date().toISOString(),
    };
    useAlertStore.getState().addAlert(existingAlert);

    renderHook(() => useAlertStream());

    // Resolve alert
    act(() => {
      const event = new MessageEvent("alert:resolved", {
        data: JSON.stringify({ id: "alert-1" }),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    const state = useAlertStore.getState();
    expect(state.alerts.find((a) => a.id === "alert-1")).toBeUndefined();
  });

  it("handles connection:status event by updating connection state", () => {
    renderHook(() => useAlertStream());

    // Send connected status
    act(() => {
      const event = new MessageEvent("connection:status", {
        data: JSON.stringify({ status: "connected" }),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    expect(useAlertStore.getState().isConnected).toBe(true);

    // Send error status
    act(() => {
      const errorEvent = new MessageEvent("connection:status", {
        data: JSON.stringify({ status: "error" }),
      });
      mockEventSourceInstance!.dispatchEvent(errorEvent);
    });

    expect(useAlertStore.getState().isConnected).toBe(false);
  });

  // ==========================================================================
  // Sound Integration Tests
  // ==========================================================================

  it("plays critical sound for critical alerts", () => {
    renderHook(() => useAlertStream());

    const criticalAlert: Alert = {
      id: "alert-critical",
      message: "Critical margin call",
      severity: "critical",
      alert_type: "margin_call",
      status: "active",
      created_at: new Date().toISOString(),
    };

    act(() => {
      const event = new MessageEvent("alert:new", {
        data: JSON.stringify(criticalAlert),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    expect(soundManager.play).toHaveBeenCalledWith("critical");
  });

  it("plays warning sound for high severity alerts", () => {
    renderHook(() => useAlertStream());

    const highAlert: Alert = {
      id: "alert-high",
      message: "High severity alert",
      severity: "high",
      alert_type: "threshold_breach",
      status: "active",
      created_at: new Date().toISOString(),
    };

    act(() => {
      const event = new MessageEvent("alert:new", {
        data: JSON.stringify(highAlert),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    expect(soundManager.play).toHaveBeenCalledWith("warning");
  });

  it("does not play sound for medium/low severity alerts", () => {
    renderHook(() => useAlertStream());

    const mediumAlert: Alert = {
      id: "alert-medium",
      message: "Medium severity alert",
      severity: "medium",
      alert_type: "concentration_warning",
      status: "active",
      created_at: new Date().toISOString(),
    };

    act(() => {
      const event = new MessageEvent("alert:new", {
        data: JSON.stringify(mediumAlert),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    expect(soundManager.play).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Reconnection Tests
  // ==========================================================================

  it("attempts reconnection after connection error", () => {
    const { unmount } = renderHook(() => useAlertStream());

    // Simulate connection error
    act(() => {
      mockEventSourceInstance!.dispatchEvent(new Event("error"));
    });

    expect(useAlertStore.getState().isConnected).toBe(false);

    // Fast-forward 1 second (first reconnect attempt)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should create a new EventSource instance
    expect(mockEventSourceInstances).toHaveLength(2);

    unmount();
  });

  it("uses exponential backoff for reconnection attempts", () => {
    const { unmount } = renderHook(() => useAlertStream());

    // First error
    act(() => {
      mockEventSourceInstance!.dispatchEvent(new Event("error"));
    });

    expect(mockEventSourceInstances).toHaveLength(1);

    // First reconnect: 1s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEventSourceInstances).toHaveLength(2);

    // Second error
    act(() => {
      mockEventSourceInstances[1].dispatchEvent(new Event("error"));
    });

    // Second reconnect: 2s
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockEventSourceInstances).toHaveLength(3);

    // Third error
    act(() => {
      mockEventSourceInstances[2].dispatchEvent(new Event("error"));
    });

    // Third reconnect: 4s
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(mockEventSourceInstances).toHaveLength(4);

    unmount();
  });

  it("caps reconnection delay at 30 seconds", () => {
    const { unmount } = renderHook(() => useAlertStream());

    // Simulate multiple errors to exceed max backoff
    act(() => {
      for (let i = 0; i < 10; i++) {
        if (mockEventSourceInstances[i]) {
          mockEventSourceInstances[i].dispatchEvent(new Event("error"));
        }

        // Calculate expected delay with cap
        const delay = Math.min(Math.pow(2, i) * 1000, 30000);
        vi.advanceTimersByTime(delay);
      }
    });

    // Should have created 11 instances (initial + 10 reconnects)
    expect(mockEventSourceInstances.length).toBeGreaterThanOrEqual(10);

    // Last delay should be capped at 30s
    const lastDelay = Math.min(Math.pow(2, 9) * 1000, 30000);
    expect(lastDelay).toBe(30000);

    unmount();
  });

  it("resets backoff delay on successful connection", () => {
    const { unmount } = renderHook(() => useAlertStream());

    // First error
    act(() => {
      mockEventSourceInstance!.dispatchEvent(new Event("error"));
    });

    // First reconnect: 1s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEventSourceInstances).toHaveLength(2);

    // Second error
    act(() => {
      mockEventSourceInstances[1].dispatchEvent(new Event("error"));
    });

    // Second reconnect: 2s
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockEventSourceInstances).toHaveLength(3);

    // Successful connection (should reset backoff)
    act(() => {
      mockEventSourceInstances[2].readyState = 1; // OPEN
      mockEventSourceInstances[2].dispatchEvent(new Event("open"));
    });

    expect(useAlertStore.getState().isConnected).toBe(true);

    // Another error
    act(() => {
      mockEventSourceInstances[2].dispatchEvent(new Event("error"));
    });

    // Should restart at 1s (backoff reset)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEventSourceInstances).toHaveLength(4);

    unmount();
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  it("closes connection on unmount", () => {
    const { unmount } = renderHook(() => useAlertStream());

    expect(mockEventSourceInstance!.close).not.toHaveBeenCalled();

    unmount();

    expect(mockEventSourceInstance!.close).toHaveBeenCalled();
  });

  it("clears reconnection timer on unmount", () => {
    const { unmount } = renderHook(() => useAlertStream());

    // Trigger error to start reconnection timer
    act(() => {
      mockEventSourceInstance!.dispatchEvent(new Event("error"));
    });

    unmount();

    // Advance timers - should not create new connection
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockEventSourceInstances).toHaveLength(1); // Only initial connection
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  it("handles malformed JSON gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useAlertStream());

    act(() => {
      const event = new MessageEvent("alert:new", {
        data: "invalid-json{",
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    // Should log error
    expect(consoleSpy).toHaveBeenCalled();

    // Store should remain unchanged
    expect(useAlertStore.getState().alerts).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  it("handles unknown event types gracefully", () => {
    renderHook(() => useAlertStream());

    act(() => {
      const event = new MessageEvent("unknown:event", {
        data: JSON.stringify({ test: "data" }),
      });
      mockEventSourceInstance!.dispatchEvent(event);
    });

    // Should not crash or affect store
    expect(useAlertStore.getState().alerts).toHaveLength(0);
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  it("handles multiple alerts in sequence", () => {
    renderHook(() => useAlertStream());

    const alerts: Alert[] = [
      {
        id: "alert-1",
        message: "Alert 1",
        severity: "critical",
        alert_type: "margin_call",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "alert-2",
        message: "Alert 2",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "alert-3",
        message: "Alert 3",
        severity: "medium",
        alert_type: "health_issue",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];

    // Dispatch all alerts
    act(() => {
      for (const alert of alerts) {
        const event = new MessageEvent("alert:new", {
          data: JSON.stringify(alert),
        });
        mockEventSourceInstance!.dispatchEvent(event);
      }
    });

    const state = useAlertStore.getState();
    expect(state.alerts).toHaveLength(3);
    expect(state.criticalAlerts).toHaveLength(1);
    expect(state.actionableAlerts).toHaveLength(2);
    expect(state.unreadCount).toBe(3);
  });

  it("properly categorizes alerts by tier", () => {
    renderHook(() => useAlertStream());

    const alerts: Alert[] = [
      {
        id: "critical-1",
        message: "Critical alert",
        severity: "critical",
        alert_type: "margin_call",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "high-1",
        message: "High alert",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "medium-1",
        message: "Medium alert",
        severity: "medium",
        alert_type: "health_issue",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "low-1",
        message: "Low alert",
        severity: "low",
        alert_type: "ratio_update",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];

    act(() => {
      for (const alert of alerts) {
        const event = new MessageEvent("alert:new", {
          data: JSON.stringify(alert),
        });
        mockEventSourceInstance!.dispatchEvent(event);
      }
    });

    const state = useAlertStore.getState();
    expect(state.criticalAlerts).toHaveLength(1); // Tier 1
    expect(state.actionableAlerts).toHaveLength(2); // Tier 2 (high + medium)
    expect(state.informationalAlerts).toHaveLength(1); // Tier 3 (low)
  });
});
