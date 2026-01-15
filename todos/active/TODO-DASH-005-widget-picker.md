# TODO-DASH-005: Build WidgetPicker Sidebar

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 2 - Core Components)
**Est. Effort**: 4 hours

## Description

Create a sidebar sheet component for browsing and adding widgets to the dashboard, organized by category.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 3: WidgetPicker)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/components/WidgetPicker.tsx`
- [ ] Sheet component (right side, 384px width)
- [ ] Search input with icon
- [ ] Filter widgets by search term
- [ ] Group widgets by category
- [ ] Category headers with color dots
- [ ] Widget cards with icon, name, description
- [ ] "Add" button (disabled if at maxInstances)
- [ ] "Already added" badge for maxed widgets
- [ ] "Required" badge for non-removable widgets
- [ ] Scrollable content
- [ ] Close button

## Dependencies

- TODO-DASH-001 (widget registry)
- TODO-DASH-002 (dashboard store)

## Files to Create

- `/apps/web/src/features/dashboard/components/WidgetPicker.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test search filters widgets
- [ ] Test widgets grouped by category
- [ ] Test Add button calls store.addWidget
- [ ] Test Add button disabled at maxInstances
- [ ] Test Required badge shows correctly

### E2E Tests
- [ ] Test adding widget via picker
- [ ] Test search functionality
- [ ] Test maxInstances prevents adding

## Implementation Notes

```typescript
interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Check if widget at max instances
const isWidgetAtMax = (widgetId: string) => {
  const definition = WIDGETS[widgetId];
  const count = layout.widgets.filter(w => w.widgetId === widgetId).length;
  return count >= (definition.maxInstances || 1);
};
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Search debounced (300ms)
- [ ] Category colors match registry
- [ ] Smooth open/close animation
