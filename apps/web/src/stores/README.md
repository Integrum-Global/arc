# Alert Store Implementation

## Overview

The Alert Store is a Zustand-based global state management solution for the ARC alert system, implementing the three-tier alert architecture defined in the Alert Strategy (see `docs/02-plans/09-alert-strategy/01-architecture.md`).

## Architecture

### Three-Tier System

The store automatically filters alerts into three tiers based on severity:

| Tier | Severity | Use Case | Response Time |
|------|----------|----------|---------------|
| **Tier 1 - Critical** | `critical` | Margin calls, system failures, position breaches | < 5 minutes |
| **Tier 2 - Actionable** | `high`, `medium` | Threshold breaches, health issues, concentration warnings | Same business day |
| **Tier 3 - Informational** | `low` | Price changes, ratio updates, performance milestones | At leisure |

## Files

- **`alertStore.ts`** - Main Zustand store with all state and actions
- **`__tests__/alertStore.test.ts`** - Comprehensive test suite (39 tests, 100% pass rate)
- **`../types/alert.ts`** - TypeScript types for alerts and store state

## Usage

### Basic Usage

```typescript
import { useAlertStore } from '@/stores/alertStore';

function MyComponent() {
  const alerts = useAlertStore((state) => state.alerts);
  const addAlert = useAlertStore((state) => state.addAlert);

  // Add a critical alert
  addAlert({
    id: "alert-001",
    message: "Margin call triggered on Portfolio A",
    severity: "critical",
    alert_type: "margin_call",
    status: "active",
    portfolio_id: "portfolio-a",
    created_at: new Date().toISOString(),
  });
}
```

### Optimized Selectors

Use the provided selector hooks for better performance:

```typescript
import {
  useCriticalAlerts,
  useActionableAlerts,
  useInformationalAlerts,
  useUnreadCount,
  useCriticalCount,
  useIsConnected,
} from '@/stores/alertStore';

function CriticalAlertsPanel() {
  // Only re-renders when critical alerts change
  const criticalAlerts = useCriticalAlerts();
  const criticalCount = useCriticalCount();

  return (
    <div>
      <h2>Critical Alerts ({criticalCount})</h2>
      {criticalAlerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function NotificationBadge() {
  // Only re-renders when unread count changes
  const unreadCount = useUnreadCount();

  return <Badge count={unreadCount} />;
}
```

## State Structure

```typescript
interface AlertState {
  // Raw state
  alerts: Alert[];              // All alerts
  isConnected: boolean;         // SSE connection status

  // Computed properties (automatically updated)
  criticalAlerts: Alert[];      // Tier 1 (severity: critical)
  actionableAlerts: Alert[];    // Tier 2 (severity: high, medium)
  informationalAlerts: Alert[]; // Tier 3 (severity: low)

  // Counters
  unreadCount: number;          // Total unread alerts

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

## Actions

### `addAlert(alert: Alert)`

Adds a new alert to the store. Automatically:
- Prepends to alerts array (reverse chronological order)
- Updates tier-specific arrays based on severity
- Increments unread count

**Example:**
```typescript
const addAlert = useAlertStore((state) => state.addAlert);

addAlert({
  id: crypto.randomUUID(),
  message: "Portfolio exceeded risk threshold",
  severity: "high",
  alert_type: "threshold_breach",
  status: "active",
  portfolio_id: "port-123",
  portfolio_name: "Growth Portfolio",
  created_at: new Date().toISOString(),
});
```

### `acknowledgeAlert(id: string)`

Marks alert as acknowledged. Sets:
- `status` → `"acknowledged"`
- `acknowledged_at` → current timestamp

Alert remains in store but can be filtered out from critical displays.

### `dismissAlert(id: string)`

Removes alert from store entirely. Decrements unread count.

### `resolveAlert(id: string)`

Marks alert as resolved (`status` → `"resolved"`). Alert remains in store for audit trail.

### `updateAlert(id: string, updates: Partial<Alert>)`

Updates specific alert properties. Automatically recalculates tier-specific arrays if severity changes.

### `removeAlert(id: string)`

Removes alert from store. Decrements unread count.

### `markAllRead()`

Resets unread count to 0. Keeps all alerts in store.

### `setConnected(connected: boolean)`

Updates SSE connection status.

## Computed Properties

All tier-specific arrays are automatically recalculated whenever alerts change:

```typescript
// Internal tier calculation
function getAlertTier(severity: AlertSeverity): 1 | 2 | 3 {
  if (severity === "critical") return 1;
  if (severity === "high" || severity === "medium") return 2;
  return 3;
}
```

### `criticalAlerts`
Filters alerts with `severity === "critical"`

### `actionableAlerts`
Filters alerts with `severity === "high" || severity === "medium"`

### `informationalAlerts`
Filters alerts with `severity === "low"`

## Integration with SSE

The alert store is designed to work with Server-Sent Events (SSE) for real-time updates:

```typescript
// In useAlertStream hook
function useAlertStream() {
  const addAlert = useAlertStore((state) => state.addAlert);
  const updateAlert = useAlertStore((state) => state.updateAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);
  const setConnected = useAlertStore((state) => state.setConnected);

  useEffect(() => {
    const eventSource = new EventSource('/api/v1/stream/alerts');

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.addEventListener('alert.created', (e) => {
      const alert = JSON.parse(e.data);
      addAlert(alert);
    });

    eventSource.addEventListener('alert.updated', (e) => {
      const alert = JSON.parse(e.data);
      updateAlert(alert.id, alert);
    });

    eventSource.addEventListener('alert.resolved', (e) => {
      const alert = JSON.parse(e.data);
      resolveAlert(alert.id);
    });

    return () => eventSource.close();
  }, []);
}
```

## Testing

### Test Coverage

- **39 tests** with **100% pass rate**
- **NO MOCKING** - uses real Zustand store
- Tests all actions, computed properties, and edge cases

### Test Categories

1. **Initial State** - Verifies empty initialization
2. **addAlert** - Tests alert addition and tier filtering
3. **updateAlert** - Tests alert property updates
4. **removeAlert** - Tests alert removal and count decrement
5. **acknowledgeAlert** - Tests acknowledgement with timestamps
6. **dismissAlert** - Tests dismissal (remove + count decrement)
7. **resolveAlert** - Tests resolution status
8. **markAllRead** - Tests unread count reset
9. **setConnected** - Tests connection state
10. **Tier Filtering Logic** - Tests severity-based filtering
11. **Computed Properties** - Tests automatic recalculation
12. **Edge Cases** - Tests rapid additions, mixed operations

### Running Tests

```bash
# Run alert store tests
npm test -- alertStore

# Run with coverage
npm run test:coverage -- alertStore

# Watch mode
npm test -- --watch alertStore
```

## Performance Optimizations

### subscribeWithSelector Middleware

The store uses Zustand's `subscribeWithSelector` middleware, enabling fine-grained subscriptions:

```typescript
// Only re-renders when criticalAlerts changes
const criticalAlerts = useAlertStore((state) => state.criticalAlerts);

// NOT when other parts of state change
```

### Computed Properties

Tier-specific arrays are computed in a single pass whenever alerts change, avoiding redundant filtering:

```typescript
function recalculateComputedProperties(alerts: Alert[]) {
  return {
    criticalAlerts: filterAlertsByTier(alerts, 1),
    actionableAlerts: filterAlertsByTier(alerts, 2),
    informationalAlerts: filterAlertsByTier(alerts, 3),
  };
}
```

### Selector Hooks

Exported selector hooks provide optimized access patterns:

```typescript
export const useCriticalAlerts = () =>
  useAlertStore((state) => state.criticalAlerts);

export const useUnreadCount = () =>
  useAlertStore((state) => state.unreadCount);
```

## Best Practices

### ✅ DO

- Use selector hooks for specific data (`useCriticalAlerts`, `useUnreadCount`)
- Check `isConnected` before displaying real-time status
- Set unique `id` for each alert (use `crypto.randomUUID()`)
- Provide meaningful `alert_type` for categorization
- Include `portfolio_id` and `portfolio_name` for context

### ❌ DON'T

- Don't select entire state if you only need part: `useAlertStore((state) => state)`
- Don't manually filter alerts by tier - use computed properties
- Don't modify alerts directly - use provided actions
- Don't forget to handle connection failures in SSE integration

## Next Steps

This store is foundation for:

1. **TODO-ALERT-002**: Priority calculator utility
2. **TODO-ALERT-003**: Sound manager with quiet hours
3. **TODO-ALERT-004**: SSE connection hook
4. **TODO-ALERT-006**: Critical alert banner component
5. **TODO-ALERT-011**: Actionable alerts widget

## References

- **Architecture**: `docs/02-plans/09-alert-strategy/01-architecture.md`
- **Components**: `docs/02-plans/09-alert-strategy/02-components.md`
- **TODO**: `todos/active/TODO-ALERT-001-alert-store-foundation.md`
- **Zustand Docs**: https://docs.pmnd.rs/zustand
