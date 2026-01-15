# Alert Components

## Purpose

The alert system provides four main components for displaying alerts across different tiers and contexts:

1. **CriticalAlertBanner** - Tier 1 (critical) alerts at top of viewport
2. **ActionableAlertsWidget** - Tier 2 (high/medium) alerts on dashboard
3. **NotificationCenter** - Header dropdown for all alerts
4. **Alert Command Center** - Full-page alert management interface

## CriticalAlertBanner

### Purpose

Fixed banner at the top of viewport showing Tier 1 critical alerts. Provides immediate visibility and action buttons for the most urgent alerts.

### Location

```
src/components/alerts/CriticalAlertBanner.tsx
```

### Usage

```typescript
import { CriticalAlertBanner } from "@/components/alerts/CriticalAlertBanner";

// In root layout (app/layout.tsx)
export default function RootLayout({ children }) {
  return (
    <>
      <CriticalAlertBanner />
      {children}
    </>
  );
}
```

### Behavior

**Single Alert Mode:**
- Full banner with alert message, details, and metadata
- Two action buttons: "View Details" and "Acknowledge"
- Shows portfolio name and relative timestamp

**Multiple Alerts Mode:**
- Collapsed summary: "X CRITICAL ALERTS"
- Expandable list showing all critical alerts
- "Acknowledge All" button

**Display:**
- Only renders when `criticalAlerts.length > 0`
- Animates in/out with framer-motion
- Sticky positioning (`top-0, z-50`)
- ARIA live region (`role="alert"`, `aria-live="assertive"`)

### Props

None - component reads directly from `useCriticalAlerts()` store selector.

### Examples

```typescript
// Single critical alert
{
  id: "alert-1",
  message: "Margin call triggered",
  severity: "critical",
  portfolio_name: "Tech Portfolio",
  created_at: "2026-01-15T10:30:00Z"
}

// Renders:
// ┌────────────────────────────────────────────────────────┐
// │ ⚠️  CRITICAL | Margin call triggered                   │
// │ Portfolio: Tech Portfolio • Triggered 2 minutes ago    │
// │                   [View Details] [Acknowledge]         │
// └────────────────────────────────────────────────────────┘
```

```typescript
// Multiple critical alerts
criticalAlerts = [alert1, alert2, alert3]

// Renders (collapsed):
// ┌────────────────────────────────────────────────────────┐
// │ ⚠️  3 CRITICAL ALERTS ▼         [Acknowledge All]     │
// └────────────────────────────────────────────────────────┘

// Renders (expanded):
// ┌────────────────────────────────────────────────────────┐
// │ ⚠️  3 CRITICAL ALERTS ▲         [Acknowledge All]     │
// │ • Margin call triggered (2 minutes ago)                │
// │ • System failure detected (5 minutes ago)              │
// │ • Portfolio threshold exceeded (10 minutes ago)        │
// └────────────────────────────────────────────────────────┘
```

### Responsive Design

**Mobile (<640px):**
- Stacked layout (vertical buttons)
- Full-width action buttons
- Truncated long messages

**Desktop (≥640px):**
- Horizontal layout
- Inline action buttons
- Full message display

### Customization

```typescript
// To customize styling, edit severity colors in component:
const bannerStyle = {
  backgroundColor: "bg-red-600",  // Critical color
  textColor: "text-white",
};

// To customize actions:
function SingleAlertContent({ alert }: SingleAlertContentProps) {
  const handleViewDetails = () => {
    router.push(`/alerts/${alert.id}`);  // Customize route
  };

  const handleAcknowledge = () => {
    acknowledgeAlert(alert.id);  // Or custom action
  };
}
```

### Testing

```typescript
import { render, screen } from "@testing-library/react";
import { CriticalAlertBanner } from "@/components/alerts/CriticalAlertBanner";
import { useAlertStore } from "@/stores/alertStore";

it("renders single critical alert", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "test-1",
    message: "Test critical alert",
    severity: "critical",
    alert_type: "test",
    status: "active",
    created_at: new Date().toISOString(),
  });

  render(<CriticalAlertBanner />);

  expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  expect(screen.getByText("Test critical alert")).toBeInTheDocument();
});
```

---

## ActionableAlertsWidget

### Purpose

Dashboard widget showing Tier 2 actionable alerts (severity: high | medium) with context-aware action buttons.

### Location

```
src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx
```

### Usage

```typescript
import { ActionableAlertsWidget } from "@/app/(dashboard)/dashboard/components/ActionableAlertsWidget";

// In dashboard page
function DashboardPage() {
  return (
    <div>
      <ActionableAlertsWidget maxAlerts={5} loading={false} />
    </div>
  );
}
```

### Props

```typescript
interface ActionableAlertsWidgetProps {
  /** Loading state */
  loading?: boolean;

  /** Maximum number of alerts to display */
  maxAlerts?: number;
}
```

**Default values:**
- `loading`: `false`
- `maxAlerts`: `5`

### Behavior

**Alert Display:**
- Shows up to `maxAlerts` actionable alerts (severity: high | medium)
- Each alert has:
  - Left border accent (color-coded by severity)
  - Alert icon
  - Message and optional details
  - Portfolio name and relative timestamp
  - Context-aware action button
  - Dismiss button

**Context-Aware Actions:**

| Alert Type | Action Button | Link |
|------------|---------------|------|
| `threshold_breach` | "Review" | `/analytics/ratios?security=${security_id}` |
| `health_issue` | "View Scan" | `/portfolios/${portfolio_id}/health` |
| `concentration_warning` | "Rebalance" | `/portfolios/${portfolio_id}/allocations` |
| Other | None | - |

**Empty State:**
- Shows when no actionable alerts exist
- Green checkmark icon
- "All clear! No actionable alerts at this time."

**Loading State:**
- Shows 3 skeleton loaders

### Examples

```typescript
// High severity alert with "Review" action
{
  id: "alert-1",
  message: "Price threshold exceeded",
  details: "AAPL dropped 5% below your alert threshold",
  severity: "high",
  alert_type: "threshold_breach",
  security_id: "AAPL",
  portfolio_name: "Tech Portfolio",
  created_at: "2026-01-15T10:30:00Z"
}

// Renders:
// ┌────────────────────────────────────────────────────────┐
// │ │⚠️  Price threshold exceeded                          │
// │ │   AAPL dropped 5% below your alert threshold         │
// │ │   Tech Portfolio • 5 minutes ago                     │
// │ │                           [Review] [Dismiss]         │
// └────────────────────────────────────────────────────────┘
//  ↑ Orange left border (high severity)
```

```typescript
// Medium severity alert with "View Scan" action
{
  id: "alert-2",
  message: "Portfolio health scan completed",
  details: "3 issues detected requiring attention",
  severity: "medium",
  alert_type: "health_issue",
  portfolio_id: "portfolio-123",
  portfolio_name: "Balanced Fund",
  created_at: "2026-01-15T09:00:00Z"
}

// Renders:
// ┌────────────────────────────────────────────────────────┐
// │ │ℹ️  Portfolio health scan completed                   │
// │ │   3 issues detected requiring attention              │
// │ │   Balanced Fund • 1 hour ago                         │
// │ │                      [View Scan] [Dismiss]           │
// └────────────────────────────────────────────────────────┘
//  ↑ Blue left border (medium severity)
```

### Styling

```typescript
const SEVERITY_STYLES = {
  high: {
    border: "border-amber-500",
    bg: "bg-amber-500/10",
    icon: "text-amber-500",
  },
  medium: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
  },
};
```

### Customization

**Add new alert type action:**

```typescript
function getAlertAction(alert: Alert): { label: string; href: string } | null {
  switch (alert.alert_type) {
    case "threshold_breach":
      return { label: "Review", href: `/analytics/ratios?security=${alert.security_id}` };

    case "health_issue":
      return { label: "View Scan", href: `/portfolios/${alert.portfolio_id}/health` };

    // Add new custom action
    case "dividend_announcement":
      return { label: "View Dividend", href: `/securities/${alert.security_id}/dividends` };

    default:
      return null;
  }
}
```

### Testing

```typescript
it("renders actionable alerts with context buttons", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "test-1",
    message: "Threshold breach",
    severity: "high",
    alert_type: "threshold_breach",
    security_id: "AAPL",
    status: "active",
    created_at: new Date().toISOString(),
  });

  render(<ActionableAlertsWidget />);

  expect(screen.getByText("Threshold breach")).toBeInTheDocument();
  expect(screen.getByText("Review")).toBeInTheDocument();
});
```

---

## NotificationCenter

### Purpose

Header dropdown providing quick access to recent alerts across all tiers.

### Location

```
src/components/layout/NotificationCenter.tsx
```

### Usage

```typescript
import { NotificationCenter } from "@/components/layout/NotificationCenter";

// In header component
function Header() {
  return (
    <header>
      <nav>
        {/* ... */}
        <NotificationCenter />
      </nav>
    </header>
  );
}
```

### Behavior

**Trigger Button:**
- Bell icon with unread badge
- Badge shows unread count (max "99+")
- Accessible with screen reader label

**Dropdown Content:**
- Latest 20 alerts (all tiers)
- Grouped by time: "TODAY", "YESTERDAY", "EARLIER"
- Critical section (if any critical alerts exist)
- "Mark all read" button
- "View all alerts" link to command center

**Alert Sections:**

```
┌─────────────────────────────────────┐
│ Notifications    [Mark all read]   │
├─────────────────────────────────────┤
│ CRITICAL                            │
│ • Margin call triggered (2m ago)   │
├─────────────────────────────────────┤
│ TODAY                               │
│ • Threshold breach (1h ago)        │
│ • Health scan completed (3h ago)   │
├─────────────────────────────────────┤
│ YESTERDAY                           │
│ • Price change notification         │
├─────────────────────────────────────┤
│              [View all alerts →]    │
└─────────────────────────────────────┘
```

### Props

None - reads directly from `useAlertStore()`.

### Examples

```typescript
// Empty state
alerts = []

// Renders:
// ┌─────────────────────────────────────┐
// │ Notifications                       │
// ├─────────────────────────────────────┤
// │         🔔                          │
// │   No notifications                  │
// └─────────────────────────────────────┘
```

```typescript
// With unread alerts
unreadCount = 5

// Renders bell with badge:
// 🔔 (5)
```

### Customization

**Adjust time grouping:**

```typescript
function groupAlertsByTime(alerts: Alert[]): Record<string, Alert[]> {
  const groups: Record<string, Alert[]> = {};
  const now = new Date();

  for (const alert of alerts) {
    const date = new Date(alert.created_at);
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    let label: string;
    if (diffHours < 24) {
      label = "TODAY";
    } else if (diffHours < 48) {
      label = "YESTERDAY";
    } else if (diffHours < 168) {
      label = "THIS WEEK";  // Custom: add weekly group
    } else {
      label = "EARLIER";
    }

    if (!groups[label]) groups[label] = [];
    groups[label]!.push(alert);
  }

  return groups;
}
```

### Testing

```typescript
it("shows unread badge when alerts exist", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "test-1",
    message: "Test",
    severity: "high",
    alert_type: "test",
    status: "active",
    created_at: new Date().toISOString(),
  });

  render(<NotificationCenter />);

  expect(screen.getByText("1")).toBeInTheDocument(); // Badge count
});
```

---

## Alert Command Center

### Purpose

Full-page interface for comprehensive alert management with filtering, sorting, and bulk actions.

### Location

```
src/app/(dashboard)/alerts/page.tsx
src/app/(dashboard)/alerts/components/AlertTable.tsx
src/app/(dashboard)/alerts/components/AlertRow.tsx
```

### Usage

```typescript
// Route: /alerts
// Accessed via link from NotificationCenter or ActionableAlertsWidget
```

### Features

**Alert Table:**
- All alerts across all tiers
- Columns: Severity, Message, Type, Portfolio, Status, Timestamp
- Actions per row: Acknowledge, Resolve, Dismiss

**Filtering:**
- By severity: All | Critical | High | Medium | Low
- By status: All | Active | Acknowledged | Resolved
- By portfolio (if applicable)

**Sorting:**
- By timestamp (default: newest first)
- By severity (critical → low)
- By status

**Bulk Actions:**
- Select multiple alerts
- Acknowledge all selected
- Dismiss all selected

### Examples

See the full implementation in `/apps/web/src/app/(dashboard)/alerts/` for:
- Table rendering
- Row actions
- Filtering logic
- Sorting logic

---

## Next Steps

- **[03-alert-hooks.md](./03-alert-hooks.md)** - Hook usage patterns
- **[04-alert-utilities.md](./04-alert-utilities.md)** - Priority calculator and sound manager
- **[05-alert-customization.md](./05-alert-customization.md)** - Extending the system
