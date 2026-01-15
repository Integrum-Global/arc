# Alert System Documentation

## Overview

Comprehensive developer documentation for the ARC Investment Platform Alert System - a real-time, tier-based notification infrastructure for financial alerts.

## Documentation Structure

### [00-alert-system-overview.md](./00-alert-system-overview.md)
**Architecture, tier system, and data flow**

Learn about the three-tier alert system, how data flows from backend to frontend, alert lifecycle, priority calculation, sound management, and connection handling.

**Key Topics:**
- Core components and architecture diagram
- Three-tier system (Critical, Actionable, Informational)
- Data flow from SSE to components
- Alert lifecycle (creation → display → user actions)
- Priority calculation overview
- Sound management overview
- Connection management with auto-reconnection

**Start here** if you're new to the alert system.

---

### [01-alert-store.md](./01-alert-store.md)
**How to use the alert store**

Complete API reference for the Zustand-based alert store, including state properties, actions, computed properties, and performance optimizations.

**Key Topics:**
- State properties (alerts, tier-filtered arrays, counters)
- Actions (add, update, remove, acknowledge, dismiss, resolve)
- Optimized selectors (useCriticalAlerts, useUnreadCount, etc.)
- Computed properties (automatic tier filtering)
- Testing patterns
- Performance optimizations

**Use this** when you need to read or modify alert state.

---

### [02-alert-components.md](./02-alert-components.md)
**How to use alert components**

Usage patterns for all alert display components: CriticalAlertBanner, ActionableAlertsWidget, NotificationCenter, and Alert Command Center.

**Key Topics:**
- CriticalAlertBanner (Tier 1 banner at top of viewport)
- ActionableAlertsWidget (Tier 2 dashboard widget)
- NotificationCenter (header dropdown)
- Alert Command Center (full-page management interface)
- Props, behavior, examples, responsive design
- Customization patterns
- Testing strategies

**Use this** when integrating alert components into your UI.

---

### [03-alert-hooks.md](./03-alert-hooks.md)
**How to use alert hooks**

Complete guide to useAlertStream for SSE connection management and store selector hooks for reading alert state.

**Key Topics:**
- useAlertStream (SSE connection, auto-reconnection, sound integration)
- Event types (alert:new, alert:update, alert:resolved, connection:status)
- Store selector hooks (useCriticalAlerts, useUnreadCount, etc.)
- Connection lifecycle and error handling
- Custom hooks for specific use cases
- Testing patterns

**Use this** when establishing SSE connections or reading alert state in components.

---

### [04-alert-utilities.md](./04-alert-utilities.md)
**How to use alert utilities**

API reference for calculateAlertPriority and soundManager utilities.

**Key Topics:**
- calculateAlertPriority (tier, score, display channels)
- Algorithm details (base severity, time decay, impact boost, etc.)
- soundManager (volume control, quiet hours, autoplay handling)
- Integration with components and hooks
- Testing patterns
- Sound file setup

**Use this** when customizing alert priority logic or sound behavior.

---

### [05-alert-customization.md](./05-alert-customization.md)
**How to extend the alert system**

Patterns for extending the alert system with new alert types, display channels, tier logic, and backend integrations.

**Key Topics:**
- Adding new alert types
- Customizing display behavior (tier thresholds, time decay)
- Adding new display channels (desktop notifications, email, Slack)
- Custom tier logic (portfolio-specific, time-of-day, user preferences)
- Backend integration patterns (SSE format, deduplication, auto-resolution)
- Testing custom features

**Use this** when extending the alert system for specific use cases.

---

## Quick Reference

### Common Tasks

| Task | Reference |
|------|-----------|
| Set up SSE connection | [03-alert-hooks.md](./03-alert-hooks.md#usealertstream) |
| Display critical alerts | [02-alert-components.md](./02-alert-components.md#criticalalertbanner) |
| Read alert state | [01-alert-store.md](./01-alert-store.md#store-selector-hooks) |
| Calculate alert priority | [04-alert-utilities.md](./04-alert-utilities.md#calculatealertpriority) |
| Configure sounds | [04-alert-utilities.md](./04-alert-utilities.md#soundmanager) |
| Add new alert type | [05-alert-customization.md](./05-alert-customization.md#adding-new-alert-types) |
| Customize tier logic | [05-alert-customization.md](./05-alert-customization.md#custom-tier-logic) |

### Code Examples

**Establish SSE Connection:**
```typescript
import { useAlertStream } from "@/hooks/useAlertStream";

export default function RootLayout({ children }) {
  useAlertStream(); // Establish connection once
  return <>{children}</>;
}
```

**Display Critical Alerts:**
```typescript
import { CriticalAlertBanner } from "@/components/alerts/CriticalAlertBanner";

<CriticalAlertBanner />
```

**Read Alert State:**
```typescript
import { useCriticalAlerts, useUnreadCount } from "@/stores/alertStore";

const criticalAlerts = useCriticalAlerts();
const unreadCount = useUnreadCount();
```

**Calculate Priority:**
```typescript
import { calculateAlertPriority } from "@/lib/alertPriority";

const priority = calculateAlertPriority({
  severity: "critical",
  alertType: "margin_call",
  createdAt: new Date(),
  portfolioValue: 5000000,
  isAcknowledged: false,
});
```

**Configure Sounds:**
```typescript
import { soundManager } from "@/lib/soundManager";

soundManager.setVolume(0.7);
soundManager.setQuietHours("22:00", "07:00");
soundManager.play("critical");
```

## Architecture at a Glance

```
Backend SSE Stream (/api/v1/alerts/stream)
         ↓
useAlertStream Hook (SSE connection + auto-reconnect)
         ↓
Alert Store (Zustand state management)
         ↓
Components (CriticalAlertBanner, ActionableAlertsWidget, NotificationCenter)
```

## Three-Tier System

| Tier | Severity | Display Channels | Use Case |
|------|----------|------------------|----------|
| **1** | critical | Banner + Toast + Sound + Badge + Widget + Center | Margin calls, system failures |
| **2** | high, medium | Badge + Widget + Center | Threshold breaches, health issues |
| **3** | low | Center only | Price changes, informational updates |

## Key Files

```
src/
├── types/alert.ts                      # TypeScript types
├── stores/alertStore.ts                # Zustand store + selectors
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

## Testing

All components, hooks, and utilities have comprehensive test coverage:

```
src/
├── stores/__tests__/alertStore.test.ts
├── lib/__tests__/alertPriority.test.ts
├── lib/__tests__/soundManager.test.ts
├── hooks/__tests__/useAlertStream.test.ts
└── components/alerts/__tests__/CriticalAlertBanner.test.tsx
```

Run tests:
```bash
npm test
```

## Related Documentation

- **[API Integration](../05-api-integration.md)** - Backend API patterns
- **[State Management](../04-state-management.md)** - Zustand patterns
- **[Testing](../07-testing.md)** - Testing strategies

## Support

For questions or issues with the alert system:

1. Check the relevant documentation section above
2. Review code examples in the docs
3. Examine test files for usage patterns
4. Consult the implementation files listed in "Key Files"

## Contributing

When extending the alert system:

1. Follow patterns in [05-alert-customization.md](./05-alert-customization.md)
2. Add tests for new features
3. Update documentation with examples
4. Ensure backward compatibility
