# Alert Customization

## Purpose

This guide shows how to extend and customize the alert system for specific use cases:

1. Adding new alert types
2. Customizing display behavior
3. Adding new display channels
4. Custom tier logic
5. Backend integration patterns

---

## Adding New Alert Types

### 1. Define Alert Type

Alert types are flexible strings, so no code changes are required to add new types. However, you may want to add context-aware actions.

**Example: Adding "dividend_announcement" alert type**

```typescript
// src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx

function getAlertAction(alert: Alert): { label: string; href: string } | null {
  switch (alert.alert_type) {
    case "threshold_breach":
      return { label: "Review", href: `/analytics/ratios?security=${alert.security_id}` };

    case "health_issue":
      return { label: "View Scan", href: `/portfolios/${alert.portfolio_id}/health` };

    case "concentration_warning":
      return { label: "Rebalance", href: `/portfolios/${alert.portfolio_id}/allocations` };

    // NEW: Add dividend announcement action
    case "dividend_announcement":
      return {
        label: "View Dividend",
        href: `/securities/${alert.security_id}/dividends`,
      };

    default:
      return null;
  }
}
```

### 2. Backend Integration

```python
# Backend: src/arc/services/alert_service.py

def create_dividend_announcement_alert(
    security_id: str,
    security_name: str,
    dividend_amount: float,
    payment_date: str
):
    """Create dividend announcement alert"""
    alert = {
        "id": generate_alert_id(),
        "message": f"{security_name} dividend announced",
        "details": f"Dividend: ${dividend_amount:.2f} per share, payable {payment_date}",
        "severity": "low",  # Informational
        "alert_type": "dividend_announcement",  # NEW TYPE
        "status": "active",
        "security_id": security_id,
        "created_at": datetime.now(UTC).isoformat(),
    }

    # Send via SSE
    alert_stream.send_event("alert:new", alert)

    return alert
```

### 3. Custom Styling (Optional)

```typescript
// Add custom icon or color for new alert type
function getAlertIcon(alertType: string) {
  switch (alertType) {
    case "margin_call":
      return <AlertTriangle className="text-red-500" />;
    case "threshold_breach":
      return <TrendingDown className="text-orange-500" />;
    case "dividend_announcement":
      return <DollarSign className="text-green-500" />; // NEW
    default:
      return <Bell />;
  }
}
```

---

## Customizing Display Behavior

### 1. Change Tier Thresholds

Adjust the score thresholds for tier classification:

```typescript
// src/lib/alertPriority.ts

// Current thresholds
const TIER_1_THRESHOLD = 80;
const TIER_2_THRESHOLD = 40;

// Modified thresholds (more sensitive Tier 1)
const TIER_1_THRESHOLD = 70; // Lower threshold = more alerts in Tier 1
const TIER_2_THRESHOLD = 40;

// Modified thresholds (stricter Tier 1)
const TIER_1_THRESHOLD = 90; // Higher threshold = fewer alerts in Tier 1
const TIER_2_THRESHOLD = 50;
```

### 2. Adjust Time Decay Rate

Control how quickly alerts lose priority over time:

```typescript
// src/lib/alertPriority.ts

// Current: -0.5 points per hour (max -20)
const TIME_DECAY_RATE = 0.5;
const MAX_TIME_DECAY = 20;

// Faster decay (alerts age more quickly)
const TIME_DECAY_RATE = 1.0; // -1 point per hour
const MAX_TIME_DECAY = 30;

// Slower decay (alerts stay relevant longer)
const TIME_DECAY_RATE = 0.25; // -0.25 points per hour
const MAX_TIME_DECAY = 10;
```

### 3. Custom Store Logic

Add custom computed properties to the alert store:

```typescript
// src/stores/alertStore.ts

// Add custom computed property
export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    // ... existing state

    // NEW: Unacknowledged critical alerts
    unacknowledgedCriticalAlerts: [],

    // Recalculate on updates
    addAlert: (alert: Alert) => {
      set((state) => {
        const newAlerts = [alert, ...state.alerts];
        const computed = recalculateComputedProperties(newAlerts);

        // NEW: Calculate unacknowledged critical
        const unacknowledgedCritical = newAlerts.filter(
          (a) => a.severity === "critical" && a.status === "active"
        );

        return {
          alerts: newAlerts,
          ...computed,
          unacknowledgedCriticalAlerts: unacknowledgedCritical,
          unreadCount: state.unreadCount + 1,
        };
      });
    },
    // ... other actions
  }))
);

// Export custom selector
export const useUnacknowledgedCriticalAlerts = () =>
  useAlertStore((state) => state.unacknowledgedCriticalAlerts);
```

---

## Adding New Display Channels

### 1. Desktop Notifications

Add browser desktop notifications as a display channel:

```typescript
// src/hooks/useDesktopNotifications.ts

import { useEffect } from "react";
import { useAlertStore } from "@/stores/alertStore";

export function useDesktopNotifications() {
  useEffect(() => {
    // Request permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Subscribe to critical alerts
    const unsubscribe = useAlertStore.subscribe(
      (state) => state.criticalAlerts,
      (criticalAlerts, prevCriticalAlerts) => {
        // New critical alert added
        const newAlerts = criticalAlerts.filter(
          (alert) => !prevCriticalAlerts.some((prev) => prev.id === alert.id)
        );

        newAlerts.forEach((alert) => {
          if (Notification.permission === "granted") {
            new Notification("Critical Alert", {
              body: alert.message,
              icon: "/icons/alert-critical.png",
              tag: alert.id, // Prevent duplicates
              requireInteraction: true, // Stay visible
            });
          }
        });
      }
    );

    return unsubscribe;
  }, []);
}
```

**Usage:**

```typescript
// app/layout.tsx
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";

export default function RootLayout({ children }) {
  useAlertStream();
  useDesktopNotifications(); // Enable desktop notifications

  return <>{children}</>;
}
```

### 2. Email Digest

Send daily email digest of unresolved alerts:

```typescript
// Backend: src/arc/services/alert_email_service.py

async def send_daily_alert_digest(user_id: str):
    """Send daily email digest of unresolved alerts"""
    alerts = await get_unresolved_alerts(user_id)

    if not alerts:
        return  # No alerts to send

    # Group by tier
    critical = [a for a in alerts if a["severity"] == "critical"]
    actionable = [a for a in alerts if a["severity"] in ["high", "medium"]]
    informational = [a for a in alerts if a["severity"] == "low"]

    # Send email
    await send_email(
        to=user.email,
        subject=f"ARC Alert Digest: {len(critical)} Critical, {len(actionable)} Actionable",
        template="alert_digest",
        context={
            "critical_alerts": critical,
            "actionable_alerts": actionable,
            "informational_alerts": informational,
        },
    )
```

### 3. Slack Integration

Send critical alerts to Slack channel:

```typescript
// Backend: src/arc/integrations/slack_alerts.py

async def send_slack_alert(alert: dict):
    """Send alert to Slack channel"""
    if alert["severity"] != "critical":
        return  # Only send critical alerts

    webhook_url = os.getenv("SLACK_WEBHOOK_URL")

    payload = {
        "text": f"🚨 Critical Alert: {alert['message']}",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{alert['message']}*\n{alert.get('details', '')}",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Portfolio: {alert.get('portfolio_name', 'N/A')} | Type: {alert['alert_type']}",
                    }
                ],
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View Details"},
                        "url": f"https://arc.example.com/alerts/{alert['id']}",
                    }
                ],
            },
        ],
    }

    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)
```

---

## Custom Tier Logic

### 1. Portfolio-Specific Tiers

Adjust tier logic based on portfolio characteristics:

```typescript
// src/lib/alertPriority.ts

export function calculateAlertPriority(
  input: AlertPriorityInput,
  portfolioContext?: {
    isRetirement: boolean;
    riskTolerance: "conservative" | "moderate" | "aggressive";
  }
): AlertPriorityOutput {
  let score = SEVERITY_SCORES[input.severity];

  // ... existing logic

  // NEW: Boost score for conservative retirement portfolios
  if (portfolioContext?.isRetirement && portfolioContext?.riskTolerance === "conservative") {
    score += 10; // More sensitive to alerts
  }

  // ... tier mapping
}
```

### 2. Time-of-Day Tier Adjustment

Reduce alert noise during non-trading hours:

```typescript
// src/lib/alertPriority.ts

function isMarketHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Monday-Friday, 9:30am - 4:00pm ET
  const isWeekday = day >= 1 && day <= 5;
  const isTradingHours = hour >= 9 && hour < 16;

  return isWeekday && isTradingHours;
}

export function calculateAlertPriority(input: AlertPriorityInput): AlertPriorityOutput {
  let score = SEVERITY_SCORES[input.severity];

  // ... existing logic

  // NEW: Reduce non-critical alerts outside market hours
  if (!isMarketHours() && input.severity !== "critical") {
    score -= 15; // Less urgent outside trading hours
  }

  // ... tier mapping
}
```

### 3. User Preference-Based Tiers

Allow users to customize tier thresholds:

```typescript
// src/stores/userPreferencesStore.ts

interface UserAlertPreferences {
  tier1Threshold: number; // Default: 80
  tier2Threshold: number; // Default: 40
  muteInformationalAlerts: boolean;
  criticalAlertsOnly: boolean;
}

export const useUserPreferencesStore = create<UserAlertPreferences>(() => ({
  tier1Threshold: 80,
  tier2Threshold: 40,
  muteInformationalAlerts: false,
  criticalAlertsOnly: false,
}));

// Updated priority calculator
export function calculateAlertPriority(
  input: AlertPriorityInput,
  preferences?: UserAlertPreferences
): AlertPriorityOutput {
  let score = SEVERITY_SCORES[input.severity];

  // ... calculate score

  const tier1Threshold = preferences?.tier1Threshold ?? 80;
  const tier2Threshold = preferences?.tier2Threshold ?? 40;

  if (score >= tier1Threshold) {
    return { tier: 1, score, displayChannels: ["banner", "toast", "sound", "badge", "widget", "center"] };
  } else if (score >= tier2Threshold) {
    return { tier: 2, score, displayChannels: ["badge", "widget", "center"] };
  } else {
    return { tier: 3, score, displayChannels: ["center"] };
  }
}
```

---

## Backend Integration Patterns

### 1. SSE Event Format

Standardize backend SSE event structure:

```python
# Backend: src/arc/api/alert_stream.py

from sse_starlette.sse import EventSourceResponse
from fastapi import APIRouter

router = APIRouter()

@router.get("/alerts/stream")
async def alert_stream(request: Request):
    """SSE endpoint for real-time alert updates"""

    async def event_generator():
        # Send initial connection status
        yield {
            "event": "connection:status",
            "data": json.dumps({"status": "connected"}),
        }

        # Subscribe to alert updates
        async for alert_event in alert_subscription:
            if alert_event["type"] == "new":
                yield {
                    "event": "alert:new",
                    "data": json.dumps(alert_event["alert"]),
                }
            elif alert_event["type"] == "update":
                yield {
                    "event": "alert:update",
                    "data": json.dumps(alert_event["updates"]),
                }
            elif alert_event["type"] == "resolved":
                yield {
                    "event": "alert:resolved",
                    "data": json.dumps({"id": alert_event["alert_id"]}),
                }

    return EventSourceResponse(event_generator())
```

### 2. Alert Deduplication

Prevent duplicate alerts for the same condition:

```python
# Backend: src/arc/services/alert_service.py

from datetime import datetime, timedelta

async def create_alert_with_deduplication(
    alert_type: str,
    severity: str,
    message: str,
    dedup_key: str,  # Unique key for this condition
    dedup_window: timedelta = timedelta(hours=1),
    **kwargs
):
    """Create alert only if similar alert doesn't exist"""

    # Check for recent duplicate
    recent_cutoff = datetime.now(UTC) - dedup_window
    existing = await db.alerts.find_one({
        "dedup_key": dedup_key,
        "created_at": {"$gte": recent_cutoff.isoformat()},
        "status": {"$in": ["active", "acknowledged"]},
    })

    if existing:
        # Update existing alert instead of creating new one
        await update_alert(existing["id"], {
            "message": message,
            "updated_at": datetime.now(UTC).isoformat(),
        })
        return existing

    # Create new alert
    alert = {
        "id": generate_alert_id(),
        "message": message,
        "severity": severity,
        "alert_type": alert_type,
        "status": "active",
        "dedup_key": dedup_key,
        "created_at": datetime.now(UTC).isoformat(),
        **kwargs,
    }

    await db.alerts.insert_one(alert)
    alert_stream.send_event("alert:new", alert)

    return alert
```

**Usage:**

```python
# Example: Threshold breach alert
await create_alert_with_deduplication(
    alert_type="threshold_breach",
    severity="high",
    message=f"{security_name} breached threshold",
    dedup_key=f"threshold_breach:{security_id}:{threshold_type}",
    dedup_window=timedelta(hours=4),  # Max one alert per 4 hours
    security_id=security_id,
)
```

### 3. Alert Auto-Resolution

Automatically resolve alerts when condition clears:

```python
# Backend: src/arc/services/alert_service.py

async def auto_resolve_alerts(
    alert_type: str,
    condition_key: str,
    resolution_message: str = "Condition resolved"
):
    """Auto-resolve active alerts when condition clears"""

    # Find active alerts for this condition
    active_alerts = await db.alerts.find({
        "alert_type": alert_type,
        "dedup_key": condition_key,
        "status": {"$in": ["active", "acknowledged"]},
    }).to_list(length=None)

    for alert in active_alerts:
        # Update to resolved
        await update_alert(alert["id"], {
            "status": "resolved",
            "details": f"{alert.get('details', '')} | {resolution_message}",
            "resolved_at": datetime.now(UTC).isoformat(),
        })

        # Send resolution event
        alert_stream.send_event("alert:resolved", {"id": alert["id"]})
```

**Usage:**

```python
# Example: Auto-resolve threshold breach when price recovers
if current_price > threshold:
    await auto_resolve_alerts(
        alert_type="threshold_breach",
        condition_key=f"threshold_breach:{security_id}:{threshold_type}",
        resolution_message="Price recovered above threshold",
    )
```

---

## Testing Custom Features

### 1. Test Custom Alert Types

```typescript
import { render, screen } from "@testing-library/react";
import { ActionableAlertsWidget } from "@/app/(dashboard)/dashboard/components/ActionableAlertsWidget";
import { useAlertStore } from "@/stores/alertStore";

it("shows custom action for dividend_announcement", () => {
  const store = useAlertStore.getState();

  store.addAlert({
    id: "test-1",
    message: "AAPL dividend announced",
    severity: "low",
    alert_type: "dividend_announcement",
    security_id: "AAPL",
    status: "active",
    created_at: new Date().toISOString(),
  });

  render(<ActionableAlertsWidget />);

  expect(screen.getByText("View Dividend")).toBeInTheDocument();
});
```

### 2. Test Custom Tier Logic

```typescript
import { calculateAlertPriority } from "@/lib/alertPriority";

it("boosts score for retirement portfolios", () => {
  const result = calculateAlertPriority(
    {
      severity: "high",
      alertType: "test",
      createdAt: new Date(),
      portfolioValue: 5000000,
      isAcknowledged: false,
    },
    {
      isRetirement: true,
      riskTolerance: "conservative",
    }
  );

  // high = 70, retirement boost = +10
  expect(result.score).toBe(80);
  expect(result.tier).toBe(1); // Promoted to Tier 1
});
```

---

## Next Steps

- **[00-alert-system-overview.md](./00-alert-system-overview.md)** - Review system architecture
- **[01-alert-store.md](./01-alert-store.md)** - Store API reference
- **[02-alert-components.md](./02-alert-components.md)** - Component usage
- **[03-alert-hooks.md](./03-alert-hooks.md)** - Hook patterns
- **[04-alert-utilities.md](./04-alert-utilities.md)** - Utilities reference
