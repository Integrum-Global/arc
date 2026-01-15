# TODO-ALERT-001: Create Alert Store with Zustand

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 3 hours

## Description

Create the global alert state management store using Zustand with subscribeWithSelector middleware. This store will manage all alert state including critical, actionable, and informational alerts with real-time updates.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/01-architecture.md` (Section 6: State Management)
- **Component Spec**: `/docs/02-plans/09-alert-strategy/02-components.md`

## Acceptance Criteria

- [ ] Create `/apps/web/src/stores/alertStore.ts` with Zustand
- [ ] Implement alert state interface with computed selectors
- [ ] Add actions: addAlert, updateAlert, removeAlert, acknowledgeAlert, dismissAlert, resolveAlert, markAllRead
- [ ] Implement tier-based filtering (critical, actionable, informational)
- [ ] Add unread count tracking
- [ ] Create selector hooks: useCriticalAlerts, useUnreadCount, useCriticalCount
- [ ] Add connection state tracking (isConnected)
- [ ] All TypeScript types properly defined

## Dependencies

- None (foundation task)

## Files to Create

- `/apps/web/src/stores/alertStore.ts`
- `/apps/web/src/types/alert.ts` (if not exists)

## Testing Requirements

### Unit Tests (`tests/unit/stores/alertStore.test.ts`)

- [ ] Test addAlert adds alert and updates computed arrays
- [ ] Test acknowledgeAlert updates status
- [ ] Test tier filtering logic
- [ ] Test unread count increments/decrements
- [ ] Test markAllRead resets unread count
- [ ] Test selector functions return correct subsets

### Integration Tests

- [ ] Test store integration with priority calculator
- [ ] Test multiple alert updates in sequence

## Implementation Notes

```typescript
// Key interfaces to implement
interface Alert {
  id: string;
  message: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alert_type: string;
  status: 'active' | 'acknowledged' | 'resolved';
  portfolio_id?: string;
  portfolio_name?: string;
  security_id?: string;
  created_at: string;
  acknowledged_at?: string;
}

interface AlertState {
  alerts: Alert[];
  criticalAlerts: Alert[];
  actionableAlerts: Alert[];
  informationalAlerts: Alert[];
  unreadCount: number;
  isConnected: boolean;
  // ... actions
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing with >90% coverage
- [ ] TypeScript compiles with no errors
- [ ] Store integrated with priority calculator utility
- [ ] Code reviewed for Zustand best practices
