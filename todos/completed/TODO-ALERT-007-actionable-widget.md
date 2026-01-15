# TODO-ALERT-007: Build ActionableAlertsWidget for Dashboard

**Status**: COMPLETE
**Priority**: HIGH (Phase 3 - Actionable Tier)
**Est. Effort**: 4 hours
**Actual Effort**: 3 hours

## Description

Create a dashboard widget showing Tier 2 actionable alerts with contextual CTAs (Review, View Scan, Approve, etc.).

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/02-components.md` (Section 3: ActionableAlertsWidget)

## Acceptance Criteria

- [x] Create `/apps/web/src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx`
- [x] Display up to 5 actionable alerts (configurable via maxAlerts prop)
- [x] Card layout with severity color accent
- [x] Context-aware action buttons based on alert_type
- [x] Empty state when no actionable alerts
- [x] Unread badge count
- [x] View Command Center link
- [x] Alert details truncated with expand
- [x] Relative timestamps (5 min ago, 2 hours ago)

## Dependencies

- TODO-ALERT-001 (alert store) ✅
- TODO-ALERT-002 (priority calculator) ✅

## Files Created

- `/apps/web/src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx` ✅
- `/apps/web/tests/unit/components/dashboard/ActionableAlertsWidget.test.tsx` ✅
- `/apps/web/tests/e2e/dashboard/actionable-alerts.spec.ts` ✅

## Files Modified

- `/apps/web/src/app/(dashboard)/dashboard/components/index.ts` - Added export ✅
- `/apps/web/src/app/(dashboard)/dashboard/page.tsx` - Replaced AlertsSection with ActionableAlertsWidget ✅
- `/apps/web/src/components/layout/PageContainer.tsx` - Added data-testid support ✅
- `/apps/web/vitest.config.ts` - Added tests/ directory to include paths ✅

## Action Button Mapping

| Alert Type | Primary Button | Action | Status |
|------------|----------------|--------|--------|
| threshold_breach | Review | `/analytics/ratios?security={id}` | ✅ |
| health_issue | View Scan | `/portfolios/{id}/health` | ✅ |
| concentration_warning | Rebalance | `/portfolios/{id}/allocations` | ✅ |
| default (fallback) | View | `/alerts/{id}` | ✅ |

## Testing Requirements

### Unit Tests (16 tests, all passing ✅)
- [x] Test renders actionable alerts only
- [x] Test max alerts limit respected (default 5)
- [x] Test custom maxAlerts prop respected
- [x] Test empty state shown correctly
- [x] Test action buttons for each alert type (threshold_breach, health_issue, concentration_warning)
- [x] Test unread badge count
- [x] Test dismiss functionality
- [x] Test loading state with skeletons
- [x] Test View Command Center link
- [x] Test severity color accents (amber for high, blue for medium)
- [x] Test relative timestamps
- [x] Test alert details truncation

### E2E Tests (12 tests ✅)
- [x] Test widget shows alerts on dashboard
- [x] Test action buttons navigate correctly (Review, View Scan, Rebalance)
- [x] Test dismiss functionality
- [x] Test unread badge display
- [x] Test View Command Center navigation
- [x] Test severity color accents
- [x] Test relative timestamps
- [x] Test empty state
- [x] Test 5 alert maximum limit
- [x] Test portfolio name display

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests passing (16/16 ✅)
- [x] E2E tests created
- [x] Replaces old AlertsSection on dashboard
- [x] Real-time updates working (via alertStore)
- [x] Actions navigate to correct pages
- [x] Build successful (Next.js + TypeScript)

## Implementation Notes

### Component Features
- **Severity Color Coding**: 4px left border (amber-500 for high, blue-500 for medium)
- **Context-Aware Actions**: Dynamic button labels and hrefs based on alert_type
- **Empty State**: Friendly "All clear!" message with checkmark icon
- **Loading State**: 3 skeleton cards for smooth UX
- **Responsive Design**: Mobile-first with proper spacing and truncation
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

### Integration
- Uses `useAlertStore` hook with Zustand for state management
- Automatically filters to Tier 2 alerts (severity: high | medium)
- Integrates with existing Section layout component
- Uses Next.js Link for client-side navigation
- Follows existing design patterns (Button, Card, Badge components)

### Testing Strategy
- **TDD Approach**: Tests written first, then implementation
- **Real Infrastructure**: Uses actual alertStore, no mocking (Tier 2 testing)
- **Comprehensive Coverage**: 16 unit tests covering all features
- **E2E Validation**: 12 E2E tests for real user flows

### Additional Fixes
While implementing, fixed pre-existing TypeScript errors:
- `/apps/web/src/components/alerts/CriticalAlertBanner.tsx` - Added non-null assertion for firstAlert
- `/apps/web/src/components/layout/NotificationCenter.tsx` - Added non-null assertion for groups array
- `/apps/web/src/lib/soundManager.ts` - Added default values for time parsing

### Dependencies Added
- `framer-motion` - Required by CriticalAlertBanner (peer dependency)

## Success Metrics

✅ **100% Test Pass Rate** - All 16 unit tests passing
✅ **Build Success** - Next.js production build with no TypeScript errors
✅ **Feature Complete** - All acceptance criteria met
✅ **Production Ready** - Follows React 19 + Next.js 15 best practices
