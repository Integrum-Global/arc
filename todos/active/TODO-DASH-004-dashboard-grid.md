# TODO-DASH-004: Create DashboardGrid with dnd-kit

**Status**: ACTIVE
**Priority**: HIGH (Phase 2 - Core Components)
**Est. Effort**: 6 hours

## Description

Build the main dashboard grid component using dnd-kit for drag-and-drop functionality with responsive breakpoints.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 1: DashboardGrid)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/components/DashboardGrid.tsx`
- [ ] Use DndContext from @dnd-kit/core
- [ ] Use SortableContext with rectSortingStrategy
- [ ] Implement onDragStart, onDragEnd handlers
- [ ] Update widget positions in store on drop
- [ ] CSS Grid layout with responsive columns (4/2/1)
- [ ] Grid auto-rows at 180px
- [ ] Grid gap: 16px (24px on xl breakpoint)
- [ ] DragOverlay for smooth drag animation
- [ ] Collision detection: closestCenter
- [ ] Keyboard sensor support
- [ ] Pointer sensor with 8px activation distance

## Dependencies

- TODO-DASH-002 (dashboard store)
- TODO-DASH-003 (WidgetContainer)
- Packages: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Files to Create

- `/apps/web/src/features/dashboard/components/DashboardGrid.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test renders all widgets
- [ ] Test grid columns responsive
- [ ] Test drag updates position in store

### E2E Tests
- [ ] Test drag-and-drop reorders widgets
- [ ] Test widgets snap to grid
- [ ] Test responsive layout changes
- [ ] Test keyboard navigation works

## Implementation Notes

```typescript
// Grid CSS classes
className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
style={{ gridAutoRows: `${GRID_CONFIG.rowHeight}px` }}

// Widget positioning
gridColumn: `${x + 1} / span ${cols}`
gridRow: `${y + 1} / span ${rows}`

// Drag end handler
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const overWidget = widgets.find(w => w.id === over.id);
    if (overWidget) {
      moveWidget(active.id, overWidget.position);
    }
  }
};
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Drag-and-drop smooth (60fps)
- [ ] Responsive breakpoints work
- [ ] Keyboard navigation functional
- [ ] Accessibility audit passed
