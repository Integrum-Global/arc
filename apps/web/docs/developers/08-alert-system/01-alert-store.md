# Alert Store

## Purpose

The alert store (`alertStore.ts`) is a Zustand-based global state manager that provides:
- Centralized alert state management
- Tier-based filtering (critical, actionable, informational)
- Real-time computed properties
- Optimized selectors with `subscribeWithSelector` middleware
- Unread count tracking
- Connection state management

## API Reference

### State Properties

```typescript
interface AlertState {
  // Raw state
  alerts: Alert[];                    // All alerts (reverse chronological)
  isConnected: boolean;                // SSE connection status

  // Computed properties (tier-filtered)
  criticalAlerts: Alert[];             // Tier 1: severity = "critical"
  actionableAlerts: Alert[];           // Tier 2: severity = "high" | "medium"
  informationalAlerts: Alert[];        // Tier 3: severity = "low"

  // Counters
  unreadCount: number;                 // Total unread alerts

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
```

### Alert Type

```typescript
interface Alert {
  id: string;                          // Unique identifier
  message: string;                     // Primary message
  details?: string;                    // Optional details
  severity: "critical" | "high" | "medium" | "low";
  alert_type: string;                  // e.g., "margin_call", "threshold_breach"
  status: "active" | "acknowledged" | "resolved";
  portfolio_id?: string;
  portfolio_name?: string;
  security_id?: string;
  created_at: string;                  // ISO 8601 timestamp
  acknowledged_at?: string;            // ISO 8601 timestamp
}
```

## Usage Patterns

### 1. Direct Store Access

Use when you need multiple properties or actions:

```typescript
import { useAlertStore } from "@/stores/alertStore";

function MyComponent() {
  const { alerts, addAlert, removeAlert } = useAlertStore();

  // Access all alerts
  console.log(alerts);

  // Add a new alert
  addAlert({
    id: "alert-123",
    message: "Portfolio threshold exceeded",
    severity: "high",
    alert_type: "threshold_breach",
    status: "active",
    created_at: new Date().toISOString(),
  });

  // Remove an alert
  removeAlert("alert-123");
}
```

### 2. Optimized Selectors

Use when you only need specific computed properties:

```typescript
import {
  useCriticalAlerts,
  useUnreadCount,
  useCriticalCount,
  useActionableAlerts,
  useInformationalAlerts,
  useIsConnected
} from "@/stores/alertStore";

function Header() {
  // Only re-renders when unreadCount changes
  const unreadCount = useUnreadCount();

  return <Badge>{unreadCount}</Badge>;
}

function CriticalBanner() {
  // Only re-renders when criticalAlerts changes
  const criticalAlerts = useCriticalAlerts();

  if (criticalAlerts.length === 0) return null;

  return <Banner alerts={criticalAlerts} />;
}
```

### 3. Connection Status

```typescript
import { useIsConnected } from "@/stores/alertStore";

function ConnectionIndicator() {
  const isConnected = useIsConnected();

  return (
    <div className={isConnected ? "bg-green-500" : "bg-red-500"}>
      {isConnected ? "Connected" : "Disconnected"}
    </div>
  );
}
```

## Actions

### addAlert

Adds a new alert to the store. Automatically:
- Prepends alert to `alerts` array (reverse chronological order)
- Updates tier-filtered arrays (`criticalAlerts`, `actionableAlerts`, `informationalAlerts`)
- Increments `unreadCount`

```typescript
const addAlert = useAlertStore((state) => state.addAlert);

addAlert({
  id: "alert-456",
  message: "Margin call triggered for Tech Portfolio",
  details: "Current margin ratio: 0.25, required: 0.30",
  severity: "critical",
  alert_type: "margin_call",
  status: "active",
  portfolio_id: "portfolio-789",
  portfolio_name: "Tech Portfolio",
  created_at: new Date().toISOString(),
});
```

**Effect:**
- `alerts` → Prepended to array
- `criticalAlerts` → Added (severity = "critical")
- `unreadCount` → Incremented by 1

### updateAlert

Updates specific properties of an existing alert:

```typescript
const updateAlert = useAlertStore((state) => state.updateAlert);

// Update message
updateAlert("alert-456", {
  message: "Margin call updated: 15 minutes remaining",
});

// Update status
updateAlert("alert-456", {
  status: "acknowledged",
  acknowledged_at: new Date().toISOString(),
});
```

**Effect:**
- Merges updates with existing alert
- Recalculates tier-filtered arrays (if severity changed)

### removeAlert

Removes an alert from the store completely:

```typescript
const removeAlert = useAlertStore((state) => state.removeAlert);

removeAlert("alert-456");
```

**Effect:**
- Removed from `alerts` array
- Removed from tier-specific arrays
- `unreadCount` decremented by 1

### acknowledgeAlert

Marks an alert as acknowledged (status = "acknowledged", sets `acknowledged_at`):

```typescript
const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);

acknowledgeAlert("alert-456");
```

**Effect:**
- `status` → "acknowledged"
- `acknowledged_at` → Current timestamp
- Alert remains in store (not removed)

**Use Case:** User has seen the alert but hasn't resolved the underlying issue.

### dismissAlert

Removes an alert from the store (calls `removeAlert` internally):

```typescript
const dismissAlert = useAlertStore((state) => state.dismissAlert);

dismissAlert("alert-456");
```

**Effect:** Same as `removeAlert()`

**Use Case:** User wants to hide the alert permanently (e.g., not relevant).

### resolveAlert

Marks an alert as resolved (status = "resolved"):

```typescript
const resolveAlert = useAlertStore((state) => state.resolveAlert);

resolveAlert("alert-456");
```

**Effect:**
- `status` → "resolved"
- Alert remains in store (for history)

**Use Case:** User has addressed the underlying issue, but wants to keep the alert for audit trail.

### markAllRead

Resets unread count to 0 (does not modify alerts):

```typescript
const markAllRead = useAlertStore((state) => state.markAllRead);

markAllRead();
```

**Effect:**
- `unreadCount` → 0
- All alerts remain unchanged

**Use Case:** User has reviewed all alerts in NotificationCenter.

### setConnected

Updates SSE connection status:

```typescript
const setConnected = useAlertStore((state) => state.setConnected);

// Called by useAlertStream hook
setConnected(true);  // Connected
setConnected(false); // Disconnected
```

## Computed Properties

All computed properties are **automatically recalculated** when alerts are added, updated, or removed.

### criticalAlerts

```typescript
const criticalAlerts = useCriticalAlerts();

// Contains only alerts where severity === "critical"
criticalAlerts.forEach((alert) => {
  console.log(alert.severity); // Always "critical"
});
```

**Filtering Logic:**
```typescript
alerts.filter((alert) => alert.severity === "critical")
```

### actionableAlerts

```typescript
const actionableAlerts = useActionableAlerts();

// Contains alerts where severity === "high" OR "medium"
actionableAlerts.forEach((alert) => {
  console.log(alert.severity); // "high" or "medium"
});
```

**Filtering Logic:**
```typescript
alerts.filter((alert) =>
  alert.severity === "high" || alert.severity === "medium"
)
```

### informationalAlerts

```typescript
const informationalAlerts = useInformationalAlerts();

// Contains only alerts where severity === "low"
informationalAlerts.forEach((alert) => {
  console.log(alert.severity); // Always "low"
});
```

**Filtering Logic:**
```typescript
alerts.filter((alert) => alert.severity === "low")
```

## Testing

### Setup

```typescript
import { useAlertStore } from "@/stores/alertStore";

beforeEach(() => {
  const store = useAlertStore.getState();

  // Clear all alerts
  store.alerts.forEach((alert) => store.removeAlert(alert.id));

  // Reset connection state
  store.setConnected(false);
});
```

### Testing Actions

```typescript
it("adds alert and updates tier arrays", () => {
  const store = useAlertStore.getState();

  const alert: Alert = {
    id: "test-1",
    message: "Test alert",
    severity: "critical",
    alert_type: "test",
    status: "active",
    created_at: new Date().toISOString(),
  };

  store.addAlert(alert);

  const { alerts, criticalAlerts, unreadCount } = useAlertStore.getState();

  expect(alerts).toHaveLength(1);
  expect(criticalAlerts).toHaveLength(1);
  expect(unreadCount).toBe(1);
});
```

### Testing Computed Properties

```typescript
it("filters alerts by tier correctly", () => {
  const store = useAlertStore.getState();

  // Add one of each severity
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
  store.addAlert({
    id: "3",
    severity: "medium",
    /* ... */
  });
  store.addAlert({
    id: "4",
    severity: "low",
    /* ... */
  });

  const { criticalAlerts, actionableAlerts, informationalAlerts } =
    useAlertStore.getState();

  expect(criticalAlerts).toHaveLength(1);      // Tier 1
  expect(actionableAlerts).toHaveLength(2);    // Tier 2
  expect(informationalAlerts).toHaveLength(1); // Tier 3
});
```

## Performance Optimizations

### 1. subscribeWithSelector Middleware

Prevents unnecessary re-renders by subscribing only to specific slices:

```typescript
// Only re-renders when unreadCount changes
const unreadCount = useUnreadCount();

// NOT affected by changes to alerts, criticalAlerts, etc.
```

### 2. Pre-computed Tier Arrays

Tier filtering happens once per update, not on every component render:

```typescript
// ❌ BAD: Filtering on every render
function Component() {
  const alerts = useAlertStore((state) => state.alerts);
  const critical = alerts.filter((a) => a.severity === "critical");
  // Re-filters on EVERY render!
}

// ✅ GOOD: Use pre-computed array
function Component() {
  const criticalAlerts = useCriticalAlerts();
  // Already filtered, no computation on render
}
```

### 3. Reverse Chronological Order

Alerts are prepended (not appended) for instant access to latest alerts:

```typescript
// Latest alerts always at index 0
const latestAlert = alerts[0];

// Efficient slicing for "recent N alerts"
const recentFive = alerts.slice(0, 5);
```

## Next Steps

- **[02-alert-components.md](./02-alert-components.md)** - How to use alert components
- **[03-alert-hooks.md](./03-alert-hooks.md)** - Hook usage patterns
- **[04-alert-utilities.md](./04-alert-utilities.md)** - Priority calculator and sound manager
