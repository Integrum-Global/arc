# TODO-DASH-003: Build WidgetContainer Component

**Status**: ACTIVE
**Priority**: HIGH (Phase 2 - Core Components)
**Est. Effort**: 4 hours

## Description

Create the WidgetContainer wrapper component that provides edit mode controls (drag handle, settings, remove) and category theming.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 2: WidgetContainer)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/components/WidgetContainer.tsx`
- [ ] Integrate with @dnd-kit/sortable for drag-and-drop
- [ ] Show edit controls only in edit mode
- [ ] Drag handle (GripVertical icon)
- [ ] Settings button (opens modal) - only if configurable
- [ ] Remove button (X icon) - only if removable
- [ ] Category accent bar at top (1px height)
- [ ] Category border in edit mode
- [ ] Widget header with icon and name
- [ ] Render actual widget component in content area
- [ ] Opacity 50% while dragging
- [ ] Tooltips on control buttons

## Dependencies

- TODO-DASH-001 (widget registry)
- TODO-DASH-002 (dashboard store)
- Package: @dnd-kit/sortable

## Files to Create

- `/apps/web/src/features/dashboard/components/WidgetContainer.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test renders widget component
- [ ] Test edit controls hidden in view mode
- [ ] Test edit controls shown in edit mode
- [ ] Test drag handle only in edit mode
- [ ] Test settings button only if configurable
- [ ] Test remove button only if removable
- [ ] Test category theming applied
- [ ] Test remove calls store action

### E2E Tests
- [ ] Test drag handle starts drag operation
- [ ] Test settings button opens modal
- [ ] Test remove button removes widget

## Implementation Notes

```typescript
interface WidgetContainerProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

// Use useSortable hook from @dnd-kit/sortable
// Apply category colors from WIDGET_CATEGORIES
// Render definition.component with instance.config
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Category theming works
- [ ] Edit controls functional
- [ ] Drag-and-drop integrated
- [ ] Accessible (keyboard navigation)
