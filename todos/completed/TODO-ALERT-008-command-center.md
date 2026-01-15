# TODO-ALERT-008: Create Alert Command Center Page

**Status**: COMPLETED ✅
**Priority**: MEDIUM (Phase 3 - Actionable Tier)
**Est. Effort**: 6 hours
**Actual Effort**: ~4 hours

## Description

Build a dedicated page at `/alerts` for comprehensive alert management with filtering, sorting, search, and bulk actions.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/02-components.md` (Section 2: Alert Command Center)

## Acceptance Criteria

- [x] Create `/apps/web/src/app/(dashboard)/alerts/page.tsx`
- [x] Create `/apps/web/src/app/(dashboard)/alerts/components/AlertTable.tsx`
- [x] Tab filters: All, Critical, Actionable, Informational, Resolved
- [x] Badge counts per tab
- [x] Search input with debouncing (300ms)
- [x] Alert type dropdown filter
- [x] Sort dropdown: Recent, Severity, Portfolio
- [x] Paginated table (20 items per page)
- [x] Checkbox selection for bulk actions
- [x] Mark All Read button
- [x] Settings button links to `/settings/notifications`
- [x] Row actions: View, Acknowledge, Dismiss, More (...)

## Files Created

- `/apps/web/src/app/(dashboard)/alerts/page.tsx` - Main page component
- `/apps/web/src/app/(dashboard)/alerts/components/AlertTable.tsx` - Table component with responsive layout
- `/apps/web/src/app/(dashboard)/alerts/components/AlertRow.tsx` - Row component with actions
- `/apps/web/src/app/(dashboard)/alerts/components/index.ts` - Component exports
- `/apps/web/tests/unit/app/alerts/page.test.tsx` - Unit tests (26 tests, all passing)
- `/apps/web/tests/e2e/alerts/command-center.spec.ts` - E2E tests

## Implementation Notes

### Key Features Implemented
1. **Tab Filters**: All, Critical (Tier 1), Actionable (Tier 2), Informational (Tier 3), Resolved
2. **Search**: Debounced search input (300ms delay) for filtering by message/title
3. **Filters**: Alert type dropdown with 10+ alert types
4. **Sorting**: Recent (default), Severity, Portfolio
5. **Pagination**: 20 items per page with Previous/Next navigation
6. **Bulk Actions**: Checkbox selection with Acknowledge/Dismiss selected
7. **Row Actions**: View (link), Acknowledge, Dismiss, More dropdown menu
8. **Responsive**: Desktop table → Mobile cards (breakpoint: 768px)
9. **Loading States**: Skeleton components for all data fetching
10. **Empty States**: Different messages for each tab

### API Integration
Uses existing `useAlerts` hook from `@/hooks/useAnalytics` which:
- Fetches from `/api/v1/alerts` endpoint
- Supports filtering by status, severity, type, search
- Supports pagination (page, page_size)
- Supports sorting (sort_by, sort_order)
- Auto-refetches every 5 minutes

### Testing
**Unit Tests**: 26/26 passing ✅
- Tab filtering (5 tests)
- Search functionality (3 tests)
- Alert type filter (2 tests)
- Sort functionality (2 tests)
- Table display (3 tests)
- Pagination (2 tests)
- Bulk actions (2 tests)
- Row actions (4 tests)
- Responsive behavior (2 tests)
- Empty states (1 test)

**E2E Tests**: Comprehensive Playwright tests covering:
- Full page workflow
- Tab filtering
- Search with debouncing
- Alert type filtering
- Sort order changes
- Pagination navigation
- Responsive mobile layout
- Empty states

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests passing (26/26)
- [x] E2E tests created and documented
- [x] Page accessible at `/alerts`
- [x] API integration working
- [x] Responsive on tablet/mobile
- [x] Loading states implemented
- [x] Empty states implemented
- [x] Accessibility attributes added (aria-label, role)

## Notes
- Used existing `useAlerts`, `useAcknowledgeAlert`, `useDismissAlert` hooks from `@/hooks`
- Integrated with existing alertStore for state management
- Follows existing component patterns (PageContainer, Section, Card)
- All shadcn/ui components used (Tabs, Select, Input, Button, Table, etc.)
- TDD approach: Tests written first, then implementation
