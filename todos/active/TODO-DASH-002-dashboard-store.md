# TODO-DASH-002: Build Dashboard Store with Zustand

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 5 hours

## Description

Create the dashboard state management store using Zustand with persist middleware for layout management and localStorage persistence.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Section 5: State Management)

## Acceptance Criteria

- [ ] Create `/apps/web/src/stores/dashboardStore.ts`
- [ ] Implement DashboardState interface with layouts, activeLayoutId, isEditMode, isDirty
- [ ] Layout actions: setActiveLayout, createLayout, deleteLayout, duplicateLayout, renameLayout
- [ ] Widget actions: addWidget, removeWidget, moveWidget, resizeWidget, updateWidgetConfig
- [ ] Edit mode actions: enterEditMode, exitEditMode
- [ ] Sync actions: syncWithBackend, loadFromBackend
- [ ] Zustand persist middleware with localStorage
- [ ] Immer middleware for immutable updates
- [ ] Helper function: findNextPosition() for auto-placement
- [ ] Default layout with 6 widgets pre-configured

## Dependencies

- TODO-DASH-001 (widget registry)

## Files to Create

- `/apps/web/src/stores/dashboardStore.ts`

## Testing Requirements

### Unit Tests (`tests/unit/stores/dashboardStore.test.ts`)
- [ ] Test addWidget adds to layout
- [ ] Test addWidget respects maxInstances
- [ ] Test removeWidget only removes removable widgets
- [ ] Test moveWidget updates position
- [ ] Test resizeWidget only resizes resizable widgets
- [ ] Test updateWidgetConfig merges config
- [ ] Test enterEditMode sets flag
- [ ] Test exitEditMode with save=true marks clean
- [ ] Test exitEditMode with save=false reverts (future)
- [ ] Test findNextPosition finds empty spot
- [ ] Test createLayout duplicates default
- [ ] Test deleteLayout removes layout

### Integration Tests
- [ ] Test localStorage persistence
- [ ] Test layout survives page reload

## Implementation Notes

```typescript
interface DashboardState {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  isEditMode: boolean;
  isDirty: boolean;
  // ... actions
}

// Helper: Find next available grid position
function findNextPosition(
  widgets: WidgetInstance[],
  size: WidgetSize
): { x: number; y: number } {
  // Scan grid for first available position
  // Mark occupied cells
  // Return first position that fits widget size
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] localStorage persistence working
- [ ] Default layout loads on first use
- [ ] TypeScript types complete
