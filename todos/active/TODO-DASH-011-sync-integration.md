# TODO-DASH-011: Integrate Backend Sync in Dashboard Store

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 3 - Backend Sync)
**Est. Effort**: 3 hours

## Description

Connect the dashboard store's sync methods to the backend API for cross-device persistence.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Section 6.1: Multi-Layer Persistence)

## Acceptance Criteria

- [ ] Implement `syncWithBackend()` in dashboard store
- [ ] Implement `loadFromBackend()` in dashboard store
- [ ] Call `loadFromBackend()` on app initialization
- [ ] Call `syncWithBackend()` when exiting edit mode with save=true
- [ ] Auto-save every 60 seconds while editing (optional)
- [ ] Handle network errors gracefully
- [ ] Show toast on sync success/failure
- [ ] Use React Query for API calls
- [ ] Conflict resolution: last-write-wins

## Dependencies

- TODO-DASH-002 (dashboard store)
- TODO-DASH-010 (backend API)

## Files to Modify

- `/apps/web/src/stores/dashboardStore.ts`

## Files to Create

- `/apps/web/src/hooks/useDashboardSync.ts` (React Query hook)

## Testing Requirements

### Unit Tests
- [ ] Test syncWithBackend calls API
- [ ] Test loadFromBackend updates store
- [ ] Test network error handled
- [ ] Test isDirty flag cleared after sync

### Integration Tests (`tests/integration/dashboard/sync.test.ts`)
- [ ] Test save → load roundtrip
- [ ] Test localStorage + backend both updated
- [ ] Test backend newer than localStorage (loads backend)
- [ ] Test localStorage newer than backend (syncs up)

## Implementation Notes

```typescript
// In dashboardStore.ts
syncWithBackend: async () => {
  const state = get();
  if (!state.isDirty) return;

  try {
    await fetch("/api/users/me/dashboard-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        layouts: state.layouts,
        activeLayoutId: state.activeLayoutId,
      }),
    });

    set((s) => { s.isDirty = false; });
    toast.success("Layout saved");
  } catch (error) {
    toast.error("Failed to save layout");
  }
},

loadFromBackend: async () => {
  try {
    const response = await fetch("/api/users/me/dashboard-layout");
    if (!response.ok) return;

    const data = await response.json();
    set((state) => {
      state.layouts = data.layouts || [DEFAULT_LAYOUT];
      state.activeLayoutId = data.activeLayoutId || "default";
    });
  } catch (error) {
    console.error("Failed to load layout:", error);
  }
}
```

## Sync Strategy

- **On page load**: `loadFromBackend()` (backend = source of truth)
- **On exit edit mode (save)**: `syncWithBackend()`
- **Every 60s while editing**: Auto-save (optional)
- **Conflict resolution**: Last write wins (no merge)

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Sync works cross-device
- [ ] Network errors handled gracefully
- [ ] User feedback via toasts
