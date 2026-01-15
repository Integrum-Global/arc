# TODO-ALERT-006: Create NotificationCenter Dropdown

**Status**: ACTIVE
**Priority**: HIGH (Phase 3 - Actionable Tier)
**Est. Effort**: 4 hours

## Description

Build a header dropdown component showing recent alerts across all tiers with badge count and grouped by time.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/02-components.md` (Section 4: NotificationCenter)

## Acceptance Criteria

- [ ] Create `/apps/web/src/components/layout/NotificationCenter.tsx`
- [ ] Bell icon with badge count (unread alerts)
- [ ] Popover dropdown on click
- [ ] Group alerts: CRITICAL, TODAY, YESTERDAY, EARLIER
- [ ] Show latest 20 alerts
- [ ] Mark All Read button
- [ ] View All button links to `/alerts`
- [ ] Clicking alert navigates to detail
- [ ] Color-coded severity indicators
- [ ] Scrollable content (max-height: 384px)

## Dependencies

- TODO-ALERT-001 (alert store)

## Files to Create

- `/apps/web/src/components/layout/NotificationCenter.tsx`

## Files to Modify

- `/apps/web/src/components/layout/Header.tsx` - Add NotificationCenter

## Testing Requirements

### Unit Tests
- [ ] Test badge shows correct unread count
- [ ] Test badge shows "99+" for count >99
- [ ] Test dropdown opens on click
- [ ] Test alerts grouped correctly
- [ ] Test Mark All Read clears unread
- [ ] Test View All navigates
- [ ] Test clicking alert item navigates

### E2E Tests
- [ ] Test dropdown interaction
- [ ] Test mark all read functionality

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Integrated in Header
- [ ] Real-time updates via SSE
- [ ] Smooth animations
