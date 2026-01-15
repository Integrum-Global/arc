# TODO-ALERT-004: Set Up SSE Connection for Real-Time Alerts

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 3 hours

## Description

Create a custom hook that establishes a Server-Sent Events (SSE) connection to the backend for real-time alert streaming and integrates with the alert store.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/01-architecture.md` (Section 5.2: SSE Integration)

## Acceptance Criteria

- [ ] Create `/apps/web/src/hooks/useAlertStream.ts` hook
- [ ] Establish SSE connection to `/api/v1/stream/alerts`
- [ ] Handle event types: 'alert.created', 'alert.updated', 'alert.resolved'
- [ ] Dispatch events to alert store actions
- [ ] Automatic reconnection on connection loss
- [ ] Update store's `isConnected` status
- [ ] Cleanup connection on unmount
- [ ] Handle authentication token in request

## Dependencies

- TODO-ALERT-001 (alert store)
- Backend: `/api/v1/stream/alerts` endpoint (must exist)

## Files to Create

- `/apps/web/src/hooks/useAlertStream.ts`

## Files to Modify

- `/apps/web/src/app/layout.tsx` - Add `<AlertStreamProvider>` or call hook

## Testing Requirements

### Unit Tests (`tests/unit/hooks/useAlertStream.test.ts`)

- [ ] Test SSE connection established
- [ ] Test 'alert.created' adds alert to store
- [ ] Test 'alert.updated' updates alert in store
- [ ] Test 'alert.resolved' removes alert from store
- [ ] Test reconnection logic on error
- [ ] Test cleanup on unmount
- [ ] Test isConnected updates correctly

### Integration Tests (`tests/integration/alerts/sse.test.ts`)

- [ ] Test with mock SSE server
- [ ] Test multiple events in sequence
- [ ] Test network disconnect/reconnect

## Implementation Notes

```typescript
export function useAlertStream() {
  const addAlert = useAlertStore((state) => state.addAlert);
  const updateAlert = useAlertStore((state) => state.updateAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);
  const setConnected = useAlertStore((state) => state.setConnected);

  useEffect(() => {
    const eventSource = new EventSource('/api/v1/stream/alerts', {
      withCredentials: true
    });

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.addEventListener('alert.created', (event) => {
      const alert = JSON.parse(event.data);
      addAlert(alert);
    });

    // ... other event listeners

    return () => eventSource.close();
  }, []);
}
```

## Risk Assessment

- **HIGH**: Backend SSE endpoint must be implemented first
- **MEDIUM**: SSE connection stability across network changes
- **LOW**: JSON parsing errors from malformed events

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests with mock SSE server passing
- [ ] Hook called in app layout
- [ ] Connection status visible in UI (dev mode)
- [ ] Reconnection works after network loss
- [ ] No memory leaks on unmount
