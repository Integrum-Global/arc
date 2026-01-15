# TODO-DASH-009: Refactor Dashboard Page with DashboardGrid

**Status**: ACTIVE
**Priority**: HIGH (Phase 2 - Core Components)
**Est. Effort**: 3 hours

## Description

Refactor the main dashboard page to use the new DashboardGrid component and DashboardHeader.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Implementation Checklist)

## Acceptance Criteria

- [ ] Modify `/apps/web/src/app/(dashboard)/dashboard/page.tsx`
- [ ] Replace existing sections with DashboardGrid
- [ ] Add DashboardHeader at top
- [ ] Remove old section components from page
- [ ] Keep sections as widget components in registry
- [ ] Load initial layout from store
- [ ] Integrate useAlertStream for real-time updates
- [ ] Responsive layout working

## Dependencies

- TODO-DASH-004 (DashboardGrid)
- TODO-DASH-008 (DashboardHeader)

## Files to Modify

- `/apps/web/src/app/(dashboard)/dashboard/page.tsx`

## Files to Keep (as widget components)

- `/apps/web/src/app/(dashboard)/dashboard/components/SummaryCards.tsx`
- `/apps/web/src/app/(dashboard)/dashboard/components/AllocationSection.tsx`
- `/apps/web/src/app/(dashboard)/dashboard/components/PerformanceSection.tsx`
- `/apps/web/src/app/(dashboard)/dashboard/components/QuickActions.tsx`
- `/apps/web/src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx` (from TODO-ALERT-007)
- `/apps/web/src/app/(dashboard)/dashboard/components/BriefSection.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test page renders DashboardGrid
- [ ] Test page renders DashboardHeader
- [ ] Test initial layout loaded

### E2E Tests
- [ ] Test full dashboard page loads
- [ ] Test all widgets render
- [ ] Test edit mode workflow
- [ ] Test drag-and-drop on page

## Implementation Notes

```typescript
export default function DashboardPage() {
  const { activeLayout } = useDashboardStore();

  return (
    <PageContainer>
      <DashboardHeader />
      <DashboardGrid />
    </PageContainer>
  );
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Dashboard page functional
- [ ] All widgets render correctly
- [ ] Edit mode fully working
- [ ] No layout regressions
