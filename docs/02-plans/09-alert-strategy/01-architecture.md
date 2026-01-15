# ARC Alert Strategy Architecture

## Overview

This document defines the complete alert system architecture for the ARC investment management platform. The architecture transforms the current scattered alert approach into a cohesive, tiered intervention system that prioritizes user action over notification noise.

---

## 1. Problem Statement

### Current State
- Alerts appear in multiple locations: Dashboard widget, Analytics page, header notifications
- No clear prioritization - all alerts treated equally
- Users report "alert fatigue" and "alerts everywhere without knowing what to do"
- No self-service configuration for alert preferences
- No distinction between critical issues requiring immediate action vs informational updates

### Pain Points

| Issue | Impact | User Quote |
|-------|--------|------------|
| No prioritization | Users miss critical alerts buried in noise | "I didn't see the margin call alert until too late" |
| Scattered placement | Inconsistent mental model | "I never know where to look for alerts" |
| No actionable guidance | Alerts inform but don't guide | "It tells me P/E is high, but what should I do?" |
| No customization | One-size-fits-all doesn't work | "I don't care about low-severity alerts at all" |

---

## 2. Tiered Alert Architecture

### 2.1 Tier System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 1: CRITICAL                                     │
│                                                                              │
│  Severity: critical                Response Time: < 5 minutes               │
│  Examples: Margin calls, Position limit breaches, System failures           │
│                                                                              │
│  Display: Global banner (fixed top) + Toast + Sound + Browser notification  │
│  Persistence: Until acknowledged                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 2: ACTIONABLE                                   │
│                                                                              │
│  Severity: high, medium            Response Time: Same business day         │
│  Examples: Threshold breaches, Health scan issues, Concentration warnings   │
│                                                                              │
│  Display: Dashboard widget + Nav badge count + Notification dropdown        │
│  Persistence: Until addressed or 7 days                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 3: INFORMATIONAL                                │
│                                                                              │
│  Severity: low                     Response Time: At leisure                 │
│  Examples: Ratio changes, Market updates, Performance notifications         │
│                                                                              │
│  Display: Alert Command Center only (opt-in via settings)                   │
│  Persistence: 30 days then archive                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Alert Type Classification

| Alert Type | Category | Default Tier | Configurable |
|------------|----------|--------------|--------------|
| `margin_call` | Risk | Tier 1 | No (always critical) |
| `position_limit` | Risk | Tier 1 | Yes → Tier 2 |
| `system_failure` | System | Tier 1 | No |
| `threshold_breach` | Analytics | Tier 2 | Yes |
| `health_issue` | Portfolio | Tier 2 | Yes |
| `concentration_warning` | Risk | Tier 2 | Yes |
| `price_change` | Market | Tier 3 | Yes |
| `ratio_update` | Analytics | Tier 3 | Yes |
| `performance_milestone` | Portfolio | Tier 3 | Yes |

---

## 3. Priority Calculation Algorithm

### 3.1 Priority Score Formula

```typescript
// src/lib/alertPriority.ts

interface AlertPriorityInput {
  severity: 'critical' | 'high' | 'medium' | 'low';
  alertType: string;
  createdAt: Date;
  portfolioValue: number;
  impactPercentage?: number;
  isAcknowledged: boolean;
}

interface AlertPriorityOutput {
  tier: 1 | 2 | 3;
  score: number;  // 0-100, higher = more urgent
  displayChannels: ('banner' | 'toast' | 'sound' | 'badge' | 'widget' | 'center')[];
}

export function calculateAlertPriority(input: AlertPriorityInput): AlertPriorityOutput {
  // Base score from severity
  const severityScores = {
    critical: 90,
    high: 70,
    medium: 50,
    low: 20
  };

  let score = severityScores[input.severity];

  // Time decay: reduce score for older alerts
  const hoursOld = (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60);
  score -= Math.min(hoursOld * 0.5, 20);  // Max 20 point reduction

  // Impact boost: higher impact = higher priority
  if (input.impactPercentage) {
    score += Math.min(input.impactPercentage * 2, 15);  // Max 15 point boost
  }

  // Portfolio value factor: larger portfolios = slightly higher priority
  if (input.portfolioValue > 10000000) {
    score += 5;
  }

  // Acknowledgement reduces score significantly
  if (input.isAcknowledged) {
    score -= 30;
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine tier and channels
  if (score >= 80) {
    return {
      tier: 1,
      score,
      displayChannels: ['banner', 'toast', 'sound', 'badge', 'widget', 'center']
    };
  } else if (score >= 40) {
    return {
      tier: 2,
      score,
      displayChannels: ['badge', 'widget', 'center']
    };
  } else {
    return {
      tier: 3,
      score,
      displayChannels: ['center']
    };
  }
}
```

### 3.2 Priority Recalculation Triggers

| Trigger | Action |
|---------|--------|
| New alert created | Calculate initial priority |
| Alert acknowledged | Recalculate (reduces score) |
| 1 hour elapsed | Recalculate (time decay) |
| User preference changed | Recalculate all active alerts |

---

## 4. Notification Channels

### 4.1 Channel Matrix

| Channel | Tier 1 | Tier 2 | Tier 3 | User Configurable |
|---------|--------|--------|--------|-------------------|
| **CriticalAlertBanner** | ✓ | - | - | No |
| **Toast Notification** | ✓ | Optional | - | Yes |
| **Sound Alert** | ✓ | Optional | - | Yes |
| **Browser Notification** | ✓ | Optional | - | Yes |
| **Nav Badge Count** | ✓ | ✓ | - | No |
| **Dashboard Widget** | - | ✓ | - | No |
| **Notification Dropdown** | ✓ | ✓ | - | No |
| **Alert Command Center** | ✓ | ✓ | ✓ | N/A |
| **Email Digest** | ✓ | Optional | - | Yes |

### 4.2 Sound Manager

```typescript
// src/lib/soundManager.ts

type SoundType = 'critical' | 'warning' | 'info';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.7;

  private sounds: Record<SoundType, string> = {
    critical: '/sounds/alert-critical.mp3',
    warning: '/sounds/alert-warning.mp3',
    info: '/sounds/alert-info.mp3'
  };

  play(type: SoundType): void {
    if (!this.enabled) return;
    if (this.isQuietHours()) return;

    const audio = new Audio(this.sounds[type]);
    audio.volume = this.volume;
    audio.play().catch(() => {
      // User hasn't interacted with page yet, sound blocked
      console.debug('Sound blocked by browser autoplay policy');
    });
  }

  private isQuietHours(): boolean {
    const prefs = getUserPreferences();
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = prefs.quietHours.start;
    const endMinutes = prefs.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

export const soundManager = new SoundManager();
```

---

## 5. Data Flow

### 5.1 Alert Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Backend    │────▶│   SSE/WS     │────▶│  AlertStore  │────▶│  Components  │
│  (Creates)   │     │  (Streams)   │     │   (State)    │     │  (Display)   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │   Priority   │
                                         │  Calculator  │
                                         └──────────────┘
```

### 5.2 Real-Time Updates via SSE

```typescript
// Alert events streamed from backend
interface AlertEvent {
  type: 'alert.created' | 'alert.updated' | 'alert.resolved';
  data: Alert;
  timestamp: string;
}

// SSE endpoint: /api/v1/stream/alerts
// Filters by user's tenant and permission level
```

---

## 6. State Management

### 6.1 Alert Store (Zustand)

```typescript
// src/stores/alertStore.ts

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Alert } from '@/types/api';

interface AlertState {
  // State
  alerts: Alert[];
  criticalAlerts: Alert[];
  actionableAlerts: Alert[];
  informationalAlerts: Alert[];
  unreadCount: number;
  isConnected: boolean;

  // Actions
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  markAllRead: () => void;

  // Computed (using selectors)
  getCriticalCount: () => number;
  getActionableCount: () => number;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    alerts: [],
    criticalAlerts: [],
    actionableAlerts: [],
    informationalAlerts: [],
    unreadCount: 0,
    isConnected: false,

    addAlert: (alert) => {
      const priority = calculateAlertPriority({
        severity: alert.severity,
        alertType: alert.alert_type,
        createdAt: new Date(alert.created_at),
        portfolioValue: 0, // TODO: Get from context
        isAcknowledged: false
      });

      set((state) => {
        const newAlerts = [alert, ...state.alerts];
        return {
          alerts: newAlerts,
          criticalAlerts: newAlerts.filter(a =>
            calculateAlertPriority({...}).tier === 1
          ),
          actionableAlerts: newAlerts.filter(a =>
            calculateAlertPriority({...}).tier === 2
          ),
          informationalAlerts: newAlerts.filter(a =>
            calculateAlertPriority({...}).tier === 3
          ),
          unreadCount: state.unreadCount + 1
        };
      });

      // Trigger display channels
      if (priority.tier === 1) {
        soundManager.play('critical');
        showBrowserNotification(alert);
      }
    },

    acknowledgeAlert: (id) => {
      set((state) => ({
        alerts: state.alerts.map(a =>
          a.id === id ? { ...a, status: 'acknowledged' } : a
        )
      }));
    },

    // ... other actions
  }))
);

// Selector hooks for optimized re-renders
export const useCriticalAlerts = () =>
  useAlertStore((state) => state.criticalAlerts);

export const useUnreadCount = () =>
  useAlertStore((state) => state.unreadCount);

export const useCriticalCount = () =>
  useAlertStore((state) => state.criticalAlerts.length);
```

### 6.2 SSE Integration

```typescript
// src/hooks/useAlertStream.ts

export function useAlertStream() {
  const addAlert = useAlertStore((state) => state.addAlert);
  const updateAlert = useAlertStore((state) => state.updateAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);

  useEventSource({
    url: '/api/v1/stream/alerts',
    eventTypes: ['alert.created', 'alert.updated', 'alert.resolved'],
    onMessage: (event) => {
      const payload = JSON.parse(event.data) as AlertEvent;

      switch (payload.type) {
        case 'alert.created':
          addAlert(payload.data);
          break;
        case 'alert.updated':
          updateAlert(payload.data.id, payload.data);
          break;
        case 'alert.resolved':
          removeAlert(payload.data.id);
          break;
      }
    }
  });
}
```

---

## 7. Implementation Checklist

### Phase 1: Foundation

- [ ] **ALERT-001**: Create `alertStore.ts` with Zustand
- [ ] **ALERT-002**: Implement `calculateAlertPriority()` utility
- [ ] **ALERT-003**: Create `soundManager.ts` with quiet hours
- [ ] **ALERT-004**: Set up SSE connection in `useAlertStream`
- [ ] **ALERT-005**: Add alert-related TypeScript types

### Phase 2: Critical Tier

- [ ] **ALERT-006**: Build `CriticalAlertBanner` component
- [ ] **ALERT-007**: Integrate banner into `AppShell.tsx`
- [ ] **ALERT-008**: Add toast integration for Tier 1 alerts
- [ ] **ALERT-009**: Implement browser notification support
- [ ] **ALERT-010**: Add sound effects for critical alerts

### Phase 3: Actionable Tier

- [ ] **ALERT-011**: Refactor `AlertsSection` → `ActionableAlertsWidget`
- [ ] **ALERT-012**: Build `NotificationCenter` dropdown in header
- [ ] **ALERT-013**: Add nav badge for unread count
- [ ] **ALERT-014**: Create Alert Command Center page (`/alerts`)

### Phase 4: Configuration

- [ ] **ALERT-015**: Build notification preferences UI
- [ ] **ALERT-016**: Implement quiet hours configuration
- [ ] **ALERT-017**: Add per-alert-type channel preferences
- [ ] **ALERT-018**: Connect preferences to backend API

---

## 8. Acceptance Criteria

### Functional Requirements

- [ ] Critical alerts display immediately in fixed banner
- [ ] Acknowledging an alert removes it from banner but keeps in center
- [ ] Sound plays for Tier 1 alerts (respects quiet hours)
- [ ] Badge count updates in real-time via SSE
- [ ] Alert Command Center shows all alerts with filtering
- [ ] Users can configure notification preferences per alert type

### Performance Requirements

- [ ] SSE connection reconnects automatically on failure
- [ ] Alert store updates don't cause unnecessary re-renders
- [ ] Sound files are small (<100KB) and cached
- [ ] Priority calculation runs in <1ms

### Accessibility Requirements

- [ ] Critical banner has ARIA live region for screen readers
- [ ] Sound alerts have visual alternatives
- [ ] All alerts keyboard navigable
- [ ] Color not sole indicator of severity
