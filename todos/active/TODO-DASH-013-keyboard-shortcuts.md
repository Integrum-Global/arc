# TODO-DASH-013: Add Keyboard Shortcuts for Edit Mode

**Status**: ACTIVE
**Priority**: LOW (Phase 5 - Polish)
**Est. Effort**: 2 hours

## Description

Implement keyboard shortcuts for common dashboard editing actions (Escape to cancel, Ctrl/Cmd+S to save, etc.).

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Implementation Checklist - Phase 5)

## Acceptance Criteria

- [ ] Escape key: Exit edit mode (prompt if dirty)
- [ ] Ctrl/Cmd+S: Save changes (in edit mode only)
- [ ] Ctrl/Cmd+Z: Undo last action (future)
- [ ] Ctrl/Cmd+Shift+Z: Redo action (future)
- [ ] Arrow keys: Navigate widgets (view mode)
- [ ] Show keyboard shortcuts in help tooltip
- [ ] Prevent shortcuts when input focused
- [ ] Cross-platform (Windows/Mac) support

## Dependencies

- TODO-DASH-008 (DashboardHeader for save/cancel)
- TODO-DASH-002 (dashboard store)

## Files to Create

- `/apps/web/src/hooks/useDashboardKeyboardShortcuts.ts`

## Files to Modify

- `/apps/web/src/app/(dashboard)/dashboard/page.tsx` - Add hook

## Testing Requirements

### Unit Tests
- [ ] Test Escape calls cancel
- [ ] Test Ctrl+S calls save
- [ ] Test shortcuts ignored when input focused
- [ ] Test Mac Cmd key vs Windows Ctrl

### E2E Tests
- [ ] Test Escape exits edit mode
- [ ] Test Ctrl+S saves in edit mode

## Implementation Notes

```typescript
export function useDashboardKeyboardShortcuts() {
  const { isEditMode, isDirty, exitEditMode, syncWithBackend } = useDashboardStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape: Cancel edit mode
      if (e.key === 'Escape' && isEditMode) {
        e.preventDefault();
        if (isDirty) {
          // Show confirmation
        } else {
          exitEditMode(false);
        }
      }

      // Ctrl/Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditMode) {
        e.preventDefault();
        exitEditMode(true);
        syncWithBackend();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, isDirty]);
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Works on Windows and Mac
- [ ] Shortcuts documented in UI
