# Alert System Overview

## Purpose

The ARC Alert System is a comprehensive real-time notification infrastructure that manages financial alerts across multiple severity tiers and display channels. It provides immediate visibility into critical portfolio events while avoiding alert fatigue through intelligent tiering and prioritization.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Backend (SSE)                        │
│                   /api/v1/alerts/stream                     │
└─────────────────┬───────────────────────────────────────────┘
                  │ Server-Sent Events
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   useAlertStream Hook                       │
│            (SSE Connection + Auto-reconnect)                │
└─────────────────┬───────────────────────────────────────────┘
                  │ Add/Update/Remove Actions
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                     Alert Store (Zustand)                   │
│    - Tier-filtered arrays (critical, actionable, info)     │
│    - Unread count tracking                                  │
│    - Connection state                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ Subscriptions
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    Display Components                       │
│  - CriticalAlertBanner  (Tier 1)                           │
│  - ActionableAlertsWidget (Tier 2)                         │
│  - NotificationCenter   (All tiers)                        │
│  - Alert Command Center (All tiers)                        │
└─────────────────────────────────────────────────────────────┘
```

### Three-Tier System

The alert system uses a severity-based tier classification:

| Tier | Severity | Display Channels | Use Case |
|------|----------|------------------|----------|
| **Tier 1** | `critical` | Banner + Toast + Sound + Badge + Widget + Center | Margin calls, system failures, urgent actions |
| **Tier 2** | `high`, `medium` | Badge + Widget + Center | Threshold breaches, health issues, warnings |
| **Tier 3** | `low` | Center only | Price changes, informational updates |

### Data Flow

```
1. Backend Event → SSE Stream
   ├─ Event: alert:new      → addAlert()
   ├─ Event: alert:update   → updateAlert()
   ├─ Event: alert:resolved → removeAlert()
   └─ Event: connection:status → setConnected()

2. Alert Store → Tier Filtering
   ├─ severity === "critical" → criticalAlerts[]
   ├─ severity === "high"|"medium" → actionableAlerts[]
   └─ severity === "low" → informationalAlerts[]

3. Components Subscribe → Render
   ├─ CriticalAlertBanner → useCriticalAlerts()
   ├─ ActionableAlertsWidget → useActionableAlerts()
   ├─ NotificationCenter → useAlertStore()
   └─ Badge → useUnreadCount()
```

## Alert Lifecycle

### 1. Creation
```typescript
// Backend sends SSE event
event: alert:new
data: {
  "id": "alert-123",
  "message": "Margin call triggered",
  "severity": "critical",
  "alert_type": "margin_call",
  "status": "active",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### 2. Store Processing
```typescript
// useAlertStream receives event → calls addAlert()
addAlert(alert) {
  // 1. Prepend to alerts array (reverse chronological)
  // 2. Recalculate tier-filtered arrays
  // 3. Increment unreadCount
  // 4. Play sound if critical/high
}
```

### 3. Display
```typescript
// Components render based on tier
- CriticalAlertBanner: Shows if criticalAlerts.length > 0
- ActionableAlertsWidget: Shows top 5 actionableAlerts
- NotificationCenter: Shows latest 20 alerts (all tiers)
```

### 4. User Actions
```typescript
// User interactions update alert state
acknowledgeAlert(id) → status: "acknowledged"
dismissAlert(id)     → Removed from store
resolveAlert(id)     → status: "resolved"
markAllRead()        → unreadCount: 0
```

## Priority Calculation

Alerts are prioritized using a scoring algorithm:

```typescript
Score = Base Severity
      - Time Decay
      + Impact Boost
      + Portfolio Value
      - Acknowledgement Penalty
```

**Algorithm Details:**
- **Base Severity**: critical=90, high=70, medium=50, low=20
- **Time Decay**: -0.5 points/hour (max -20)
- **Impact Boost**: +2 points per % impact (max +15)
- **Portfolio Value**: +5 for portfolios >$10M
- **Acknowledgement Penalty**: -30 points

**Tier Thresholds:**
- Score ≥80 → Tier 1 (critical)
- Score ≥40 → Tier 2 (actionable)
- Score <40 → Tier 3 (informational)

## Sound Management

Sounds are played automatically for Tier 1 and high-severity Tier 2 alerts:

```typescript
// Critical alerts → critical sound
if (alert.severity === "critical") {
  soundManager.play("critical");
}

// High severity alerts → warning sound
if (alert.severity === "high") {
  soundManager.play("warning");
}
```

**Features:**
- Volume control (0.0 - 1.0)
- Quiet hours support (overnight ranges)
- Graceful autoplay blocking handling
- Three sound types: critical, warning, info

## Connection Management

The system maintains a persistent SSE connection with automatic reconnection:

```typescript
// Exponential backoff reconnection
Initial delay: 1 second
Maximum delay: 30 seconds
Backoff multiplier: 2x

// Connection states
isConnected: true  → Green indicator
isConnected: false → Red indicator, attempting reconnect
```

## Integration Points

### 1. Root Layout (`app/layout.tsx`)
```typescript
import { useAlertStream } from "@/hooks/useAlertStream";

export default function RootLayout({ children }) {
  useAlertStream(); // Establish SSE connection
  return (
    <>
      <CriticalAlertBanner />
      {children}
    </>
  );
}
```

### 2. Dashboard Components
```typescript
import { ActionableAlertsWidget } from "@/app/(dashboard)/dashboard/components/ActionableAlertsWidget";

<ActionableAlertsWidget maxAlerts={5} />
```

### 3. Header Navigation
```typescript
import { NotificationCenter } from "@/components/layout/NotificationCenter";

<NotificationCenter />
```

### 4. Command Center Page
```typescript
// /alerts route shows full alert management interface
import AlertCommandCenter from "@/app/(dashboard)/alerts/page";
```

## Testing Strategy

### Unit Tests
- Alert store actions (add, update, remove, acknowledge, dismiss)
- Tier filtering logic
- Computed properties
- Priority calculator algorithm
- Sound manager features

### Integration Tests
- SSE connection and reconnection
- Real-time store updates
- Component rendering with live data
- User action flows

### E2E Tests
- Complete user journey: alert creation → display → acknowledgement
- Multi-tier alert handling
- Sound playback
- Notification preferences

## Key Files

```
src/
├── types/alert.ts                      # TypeScript types
├── stores/alertStore.ts                # Zustand store
├── lib/
│   ├── alertPriority.ts                # Priority calculator
│   └── soundManager.ts                 # Sound management
├── hooks/useAlertStream.ts             # SSE connection
├── components/
│   ├── alerts/CriticalAlertBanner.tsx  # Tier 1 banner
│   └── layout/NotificationCenter.tsx   # Header dropdown
└── app/(dashboard)/
    ├── dashboard/components/
    │   └── ActionableAlertsWidget.tsx  # Tier 2 widget
    └── alerts/
        ├── page.tsx                    # Command center
        └── components/
            ├── AlertTable.tsx          # Full table
            └── AlertRow.tsx            # Individual row
```

## Performance Considerations

### 1. Optimized Selectors
```typescript
// Uses subscribeWithSelector middleware
// Only re-renders when specific slice changes
const criticalAlerts = useCriticalAlerts();
const unreadCount = useUnreadCount();
```

### 2. Computed Properties
```typescript
// Tier-filtered arrays computed once on update
// No filtering on every component render
criticalAlerts: Alert[]       // Pre-filtered
actionableAlerts: Alert[]     // Pre-filtered
informationalAlerts: Alert[]  // Pre-filtered
```

### 3. Connection Efficiency
```typescript
// Single SSE connection shared across app
// Automatic cleanup on unmount
// Exponential backoff prevents server overload
```

## Next Steps

- **[01-alert-store.md](./01-alert-store.md)** - How to use the alert store
- **[02-alert-components.md](./02-alert-components.md)** - Component usage patterns
- **[03-alert-hooks.md](./03-alert-hooks.md)** - Hook APIs and examples
- **[04-alert-utilities.md](./04-alert-utilities.md)** - Utilities reference
- **[05-alert-customization.md](./05-alert-customization.md)** - Extending the system
