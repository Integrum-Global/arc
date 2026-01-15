# Alert Hooks

## Purpose

Alert hooks provide React integration for the alert system:

1. **useAlertStream** - Establishes SSE connection for real-time updates
2. **Store Selectors** - Optimized hooks for reading alert state

## useAlertStream

### Purpose

Establishes a persistent Server-Sent Events (SSE) connection to the backend for real-time alert updates. Handles connection lifecycle, auto-reconnection, and store integration.

### Location

```
src/hooks/useAlertStream.ts
```

### Usage

```typescript
import { useAlertStream } from "@/hooks/useAlertStream";

// In root layout (establish once for entire app)
export default function RootLayout({ children }) {
  useAlertStream(); // Automatically connects and manages lifecycle

  return <>{children}</>;
}
```

### Behavior

**Connection Lifecycle:**

```
1. Initial Connection
   └─ new EventSource("/api/v1/alerts/stream")

2. Connection Opened
   └─ setConnected(true)
   └─ Reset reconnection attempts

3. Events Received
   ├─ alert:new → addAlert() + play sound
   ├─ alert:update → updateAlert()
   ├─ alert:resolved → removeAlert()
   └─ connection:status → setConnected()

4. Connection Error
   └─ setConnected(false)
   └─ Close connection
   └─ Schedule reconnection with exponential backoff

5. Component Unmount
   └─ Close connection
   └─ Clear timers
   └─ setConnected(false)
```

**Auto-Reconnection:**
- Initial delay: 1 second
- Maximum delay: 30 seconds
- Backoff multiplier: 2x
- Example: 1s → 2s → 4s → 8s → 16s → 30s (capped)

**Sound Integration:**
- Critical alerts → `soundManager.play("critical")`
- High alerts → `soundManager.play("warning")`
- Medium/Low alerts → No sound

### API Reference

```typescript
function useAlertStream(): void
```

**Parameters:** None

**Returns:** `void` (side effects only)

**Side Effects:**
- Establishes EventSource connection
- Updates alert store via actions
- Plays sounds for critical/high alerts
- Manages connection state
- Schedules auto-reconnection on error

### Event Types

```typescript
type AlertEventType =
  | "alert:new"        // New alert created
  | "alert:update"     // Existing alert updated
  | "alert:resolved"   // Alert resolved (removed)
  | "connection:status"; // Connection status update
```

**Event Payloads:**

```typescript
// alert:new
{
  type: "alert:new",
  data: {
    id: "alert-123",
    message: "Margin call triggered",
    severity: "critical",
    alert_type: "margin_call",
    status: "active",
    created_at: "2026-01-15T10:30:00Z"
  }
}

// alert:update
{
  type: "alert:update",
  data: {
    id: "alert-123",
    message: "Margin call updated: 10 minutes remaining"
  }
}

// alert:resolved
{
  type: "alert:resolved",
  data: {
    id: "alert-123"
  }
}

// connection:status
{
  type: "connection:status",
  data: {
    status: "connected" | "error"
  }
}
```

### Examples

**Basic Usage:**

```typescript
// app/layout.tsx
import { useAlertStream } from "@/hooks/useAlertStream";

export default function RootLayout({ children }) {
  useAlertStream(); // Establish connection once at root

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Connection Status Indicator:**

```typescript
import { useAlertStream } from "@/hooks/useAlertStream";
import { useIsConnected } from "@/stores/alertStore";

function App() {
  useAlertStream(); // Establish connection
  const isConnected = useIsConnected(); // Read connection state

  return (
    <div>
      <ConnectionIndicator connected={isConnected} />
      {/* ... */}
    </div>
  );
}
```

**Custom Event Handling:**

If you need custom logic on specific events, you can subscribe to the store:

```typescript
import { useAlertStream } from "@/hooks/useAlertStream";
import { useAlertStore } from "@/stores/alertStore";
import { useEffect } from "react";

function CustomAlertHandler() {
  useAlertStream(); // Establish connection

  useEffect(() => {
    // Subscribe to critical alerts changes
    const unsubscribe = useAlertStore.subscribe(
      (state) => state.criticalAlerts,
      (criticalAlerts) => {
        if (criticalAlerts.length > 0) {
          // Custom logic: e.g., send desktop notification
          if (Notification.permission === "granted") {
            new Notification("Critical Alert", {
              body: criticalAlerts[0]!.message,
            });
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  return null;
}
```

### Error Handling

**Parse Errors:**
```typescript
// If event data is invalid JSON, logs error but doesn't crash
eventSource.addEventListener("alert:new", (event: MessageEvent) => {
  try {
    const alert = JSON.parse(event.data);
    addAlert(alert);
  } catch (error) {
    console.error("Failed to parse alert:new event:", error);
    // Connection remains active
  }
});
```

**Connection Errors:**
```typescript
// Automatically attempts reconnection
eventSource.onerror = () => {
  setConnected(false);
  eventSource.close();
  scheduleReconnect(); // Exponential backoff
};
```

### Testing

**Unit Tests:**

```typescript
import { renderHook } from "@testing-library/react";
import { useAlertStream } from "@/hooks/useAlertStream";
import { useAlertStore } from "@/stores/alertStore";

it("establishes EventSource connection", () => {
  const { result } = renderHook(() => useAlertStream());

  // Check connection state
  const { isConnected } = useAlertStore.getState();
  expect(isConnected).toBe(true); // Or false initially, depending on mock
});
```

**Integration Tests:**

```typescript
// Mock EventSource for testing
class MockEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  addEventListener = vi.fn();

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  close = vi.fn();
}

global.EventSource = MockEventSource as any;

it("handles alert:new event", async () => {
  const { result } = renderHook(() => useAlertStream());

  // Simulate SSE event
  const eventHandler = global.EventSource.prototype.addEventListener.mock.calls.find(
    (call) => call[0] === "alert:new"
  )?.[1];

  const event = new MessageEvent("alert:new", {
    data: JSON.stringify({
      id: "test-1",
      message: "Test alert",
      severity: "critical",
      alert_type: "test",
      status: "active",
      created_at: new Date().toISOString(),
    }),
  });

  eventHandler?.(event);

  // Verify alert added to store
  const { alerts } = useAlertStore.getState();
  expect(alerts).toHaveLength(1);
  expect(alerts[0]!.id).toBe("test-1");
});
```

---

## Store Selector Hooks

### Purpose

Optimized hooks for reading specific slices of alert state without causing unnecessary re-renders.

### Location

```
src/stores/alertStore.ts (exported alongside useAlertStore)
```

### API Reference

```typescript
// Critical alerts (Tier 1)
function useCriticalAlerts(): Alert[]

// Unread count
function useUnreadCount(): number

// Critical alert count
function useCriticalCount(): number

// Actionable alerts (Tier 2)
function useActionableAlerts(): Alert[]

// Informational alerts (Tier 3)
function useInformationalAlerts(): Alert[]

// Connection status
function useIsConnected(): boolean
```

### Usage

**useCriticalAlerts:**

```typescript
import { useCriticalAlerts } from "@/stores/alertStore";

function CriticalAlertBanner() {
  const criticalAlerts = useCriticalAlerts();

  if (criticalAlerts.length === 0) return null;

  return (
    <div>
      {criticalAlerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

**useUnreadCount:**

```typescript
import { useUnreadCount } from "@/stores/alertStore";

function NotificationBadge() {
  const unreadCount = useUnreadCount();

  if (unreadCount === 0) return null;

  return <Badge>{unreadCount > 99 ? "99+" : unreadCount}</Badge>;
}
```

**useCriticalCount:**

```typescript
import { useCriticalCount } from "@/stores/alertStore";

function CriticalAlertSummary() {
  const criticalCount = useCriticalCount();

  return (
    <div>
      {criticalCount > 0 ? (
        <span className="text-red-600">{criticalCount} critical alerts</span>
      ) : (
        <span className="text-green-600">No critical alerts</span>
      )}
    </div>
  );
}
```

**useActionableAlerts:**

```typescript
import { useActionableAlerts } from "@/stores/alertStore";

function ActionableAlertsWidget() {
  const actionableAlerts = useActionableAlerts();

  return (
    <div>
      {actionableAlerts.slice(0, 5).map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

**useInformationalAlerts:**

```typescript
import { useInformationalAlerts } from "@/stores/alertStore";

function InformationalAlertsList() {
  const informationalAlerts = useInformationalAlerts();

  return (
    <div>
      {informationalAlerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

**useIsConnected:**

```typescript
import { useIsConnected } from "@/stores/alertStore";

function ConnectionIndicator() {
  const isConnected = useIsConnected();

  return (
    <div className={isConnected ? "bg-green-500" : "bg-red-500"}>
      {isConnected ? "Connected" : "Reconnecting..."}
    </div>
  );
}
```

### Performance Benefits

**Selective Re-rendering:**

```typescript
// ❌ BAD: Re-renders on ANY store change
function Component() {
  const { alerts, criticalAlerts, unreadCount } = useAlertStore();
  // Component re-renders whenever ANY property changes
}

// ✅ GOOD: Re-renders only when unreadCount changes
function Component() {
  const unreadCount = useUnreadCount();
  // Component re-renders ONLY when unreadCount changes
}
```

**Example:**

```typescript
// Store updates:
1. addAlert() → criticalAlerts changes
   - useCriticalAlerts() → Re-renders ✓
   - useUnreadCount() → Re-renders ✓
   - useActionableAlerts() → No re-render ✗

2. markAllRead() → unreadCount changes
   - useUnreadCount() → Re-renders ✓
   - useCriticalAlerts() → No re-render ✗
   - useActionableAlerts() → No re-render ✗
```

### Testing

```typescript
import { renderHook } from "@testing-library/react";
import { useCriticalAlerts, useUnreadCount } from "@/stores/alertStore";
import { useAlertStore } from "@/stores/alertStore";

it("useCriticalAlerts returns only critical alerts", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "1",
    severity: "critical",
    /* ... */
  });
  store.addAlert({
    id: "2",
    severity: "high",
    /* ... */
  });

  const { result } = renderHook(() => useCriticalAlerts());

  expect(result.current).toHaveLength(1);
  expect(result.current[0]!.severity).toBe("critical");
});

it("useUnreadCount returns total unread count", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "1",
    /* ... */
  });
  store.addAlert({
    id: "2",
    /* ... */
  });

  const { result } = renderHook(() => useUnreadCount());

  expect(result.current).toBe(2);
});
```

---

## Custom Hooks

### Creating Custom Alert Hooks

You can create custom hooks for specific use cases:

**useRecentAlerts:**

```typescript
import { useAlertStore } from "@/stores/alertStore";

export function useRecentAlerts(limit: number = 10) {
  return useAlertStore((state) => state.alerts.slice(0, limit));
}

// Usage
const recentAlerts = useRecentAlerts(5);
```

**useAlertsByPortfolio:**

```typescript
import { useAlertStore } from "@/stores/alertStore";

export function useAlertsByPortfolio(portfolioId: string) {
  return useAlertStore((state) =>
    state.alerts.filter((alert) => alert.portfolio_id === portfolioId)
  );
}

// Usage
const portfolioAlerts = useAlertsByPortfolio("portfolio-123");
```

**useActiveAlerts:**

```typescript
import { useAlertStore } from "@/stores/alertStore";

export function useActiveAlerts() {
  return useAlertStore((state) =>
    state.alerts.filter((alert) => alert.status === "active")
  );
}

// Usage
const activeAlerts = useActiveAlerts();
```

---

## Next Steps

- **[04-alert-utilities.md](./04-alert-utilities.md)** - Priority calculator and sound manager
- **[05-alert-customization.md](./05-alert-customization.md)** - Extending the system
