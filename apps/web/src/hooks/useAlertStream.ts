/**
 * useAlertStream Hook
 *
 * Establishes SSE connection to backend for real-time alert updates
 *
 * Features:
 * - EventSource-based SSE connection to /api/v1/alerts/stream
 * - Auto-reconnection with exponential backoff (1s, 2s, 4s, ..., max 30s)
 * - Integration with alertStore (add/update/remove alerts)
 * - Connection state tracking (connected/disconnected/error)
 * - Cleanup on component unmount
 * - Sound notifications for critical/high severity alerts
 *
 * Event Types:
 * - alert:new - New alert created
 * - alert:update - Existing alert updated
 * - alert:resolved - Alert resolved (removed)
 * - connection:status - Connection status update
 *
 * Based on: docs/02-plans/09-alert-strategy/01-architecture.md (Section 5.2)
 */

import { useEffect, useRef } from "react";
import { useAlertStore } from "@/stores/alertStore";
import { soundManager } from "@/lib/soundManager";
import type { Alert } from "@/types/alert";

/**
 * SSE Event Types
 */
type AlertEventType = "alert:new" | "alert:update" | "alert:resolved" | "connection:status";

/**
 * Event payload structures
 */
interface AlertNewEvent {
  type: "alert:new";
  data: Alert;
}

interface AlertUpdateEvent {
  type: "alert:update";
  data: Partial<Alert> & { id: string };
}

interface AlertResolvedEvent {
  type: "alert:resolved";
  data: { id: string };
}

interface ConnectionStatusEvent {
  type: "connection:status";
  data: { status: "connected" | "error" };
}

type AlertEvent = AlertNewEvent | AlertUpdateEvent | AlertResolvedEvent | ConnectionStatusEvent;

/**
 * Reconnection configuration
 */
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 2;

/**
 * useAlertStream Hook
 *
 * Establishes SSE connection and manages real-time alert updates
 *
 * @example
 * function App() {
 *   useAlertStream(); // Connection established automatically
 *   return <AppContent />;
 * }
 */
export function useAlertStream(): void {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const addAlert = useAlertStore((state) => state.addAlert);
  const updateAlert = useAlertStore((state) => state.updateAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);
  const setConnected = useAlertStore((state) => state.setConnected);

  useEffect(() => {
    /**
     * Connect to SSE endpoint
     */
    function connect(): void {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource connection
      const eventSource = new EventSource("/api/v1/alerts/stream", {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0; // Reset backoff on successful connection
      };

      // Connection error
      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();

        // Attempt reconnection with exponential backoff
        scheduleReconnect();
      };

      // Handle alert:new event
      eventSource.addEventListener("alert:new", (event: MessageEvent) => {
        try {
          const alert = JSON.parse(event.data) as Alert;
          addAlert(alert);

          // Play sound for critical/high severity alerts
          if (alert.severity === "critical") {
            soundManager.play("critical");
          } else if (alert.severity === "high") {
            soundManager.play("warning");
          }
        } catch (error) {
          console.error("Failed to parse alert:new event:", error);
        }
      });

      // Handle alert:update event
      eventSource.addEventListener("alert:update", (event: MessageEvent) => {
        try {
          const updates = JSON.parse(event.data) as Partial<Alert> & { id: string };
          updateAlert(updates.id, updates);
        } catch (error) {
          console.error("Failed to parse alert:update event:", error);
        }
      });

      // Handle alert:resolved event
      eventSource.addEventListener("alert:resolved", (event: MessageEvent) => {
        try {
          const { id } = JSON.parse(event.data) as { id: string };
          removeAlert(id);
        } catch (error) {
          console.error("Failed to parse alert:resolved event:", error);
        }
      });

      // Handle connection:status event
      eventSource.addEventListener("connection:status", (event: MessageEvent) => {
        try {
          const { status } = JSON.parse(event.data) as { status: "connected" | "error" };
          setConnected(status === "connected");
        } catch (error) {
          console.error("Failed to parse connection:status event:", error);
        }
      });
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    function scheduleReconnect(): void {
      // Calculate delay with exponential backoff
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(BACKOFF_MULTIPLIER, reconnectAttemptsRef.current),
        MAX_RECONNECT_DELAY
      );

      reconnectAttemptsRef.current += 1;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Schedule reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    }

    /**
     * Cleanup function
     */
    function cleanup(): void {
      // Close EventSource connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear reconnection timer
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Update connection state
      setConnected(false);
    }

    // Establish initial connection
    connect();

    // Cleanup on unmount
    return cleanup;
  }, [addAlert, updateAlert, removeAlert, setConnected]);
}
