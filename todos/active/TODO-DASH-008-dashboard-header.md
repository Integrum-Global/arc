# TODO-DASH-008: Create Dashboard Edit Mode Header

**Status**: ACTIVE
**Priority**: HIGH (Phase 2 - Core Components)
**Est. Effort**: 3 hours

## Description

Build the dashboard header component that toggles between view and edit modes with appropriate actions.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 6: Dashboard Edit Mode Header)

## Acceptance Criteria

- [ ] Create `/apps/web/src/app/(dashboard)/dashboard/components/DashboardHeader.tsx`
- [ ] View mode: "Dashboard" title, "Export" and "Edit" buttons
- [ ] Edit mode: "Editing Dashboard" title with "Unsaved changes" badge
- [ ] Edit mode: "Add Widget", "Cancel", "Done" buttons
- [ ] Add Widget button opens WidgetPicker
- [ ] Cancel button shows discard dialog if isDirty
- [ ] Done button calls exitEditMode(true) and syncs
- [ ] Unsaved changes badge shown when isDirty=true
- [ ] Helper text in edit mode: "Drag widgets to rearrange • Click ⚙ to configure • Click × to remove"

## Dependencies

- TODO-DASH-002 (dashboard store)
- TODO-DASH-005 (WidgetPicker)

## Files to Create

- `/apps/web/src/app/(dashboard)/dashboard/components/DashboardHeader.tsx`

## Files to Modify

- `/apps/web/src/app/(dashboard)/dashboard/page.tsx` - Use DashboardHeader

## Testing Requirements

### Unit Tests
- [ ] Test view mode renders correctly
- [ ] Test edit mode renders correctly
- [ ] Test Edit button calls enterEditMode
- [ ] Test Done button calls exitEditMode(true)
- [ ] Test Cancel shows dialog if dirty
- [ ] Test Cancel exits directly if not dirty

### E2E Tests
- [ ] Test enter edit mode
- [ ] Test exit edit mode with save
- [ ] Test cancel with unsaved changes

## Implementation Notes

```typescript
export function DashboardHeader() {
  const { isEditMode, isDirty, enterEditMode, exitEditMode } = useDashboardStore();
  const [showPicker, setShowPicker] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      exitEditMode(false);
    }
  };

  // ... render logic
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Integrated in dashboard page
- [ ] Edit mode toggles correctly
- [ ] Unsaved changes warning works
