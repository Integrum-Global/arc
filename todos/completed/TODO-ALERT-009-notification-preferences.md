# TODO-ALERT-009: Build Notification Preferences UI

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 4 - Configuration)
**Est. Effort**: 5 hours

## Description

Create a settings page for users to configure notification channels, quiet hours, and per-alert-type preferences.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/02-components.md` (Section 5: Notification Preferences)

## Acceptance Criteria

- [ ] Create `/apps/web/src/app/(dashboard)/settings/notifications/page.tsx`
- [ ] Global settings section: Sound toggle, Browser notifications toggle, Quiet hours
- [ ] Quiet hours: Start time, End time pickers (handle overnight ranges)
- [ ] Alert type settings table with columns: Type, Enabled, Sound, Toast, Email, Badge
- [ ] Lock icon for non-configurable settings (e.g., margin_call always critical)
- [ ] Save Changes button
- [ ] Form validation
- [ ] Success/error toasts on save

## Dependencies

- TODO-ALERT-003 (sound manager)
- Backend: `/api/v1/users/me/notification-preferences` endpoint

## Files to Create

- `/apps/web/src/app/(dashboard)/settings/notifications/page.tsx`
- `/apps/web/src/hooks/useNotificationPreferences.ts` (React Query)

## API Integration

```typescript
// GET /api/v1/users/me/notification-preferences
interface NotificationPreferences {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: number;  // Minutes since midnight (e.g., 1320 = 22:00)
    end: number;    // Minutes since midnight (e.g., 420 = 07:00)
  };
  alertTypeSettings: {
    [alertType: string]: {
      enabled: boolean;
      channels: ('sound' | 'toast' | 'email' | 'badge')[];
    };
  };
}

// PUT /api/v1/users/me/notification-preferences
```

## Alert Types to Configure

- margin_call (locked - always all channels)
- position_limit
- system_failure (locked)
- threshold_breach
- health_issue
- concentration_warning
- price_change
- ratio_update
- performance_milestone

## Testing Requirements

### Unit Tests
- [ ] Test form validation
- [ ] Test quiet hours time picker
- [ ] Test overnight quiet hours (start > end)
- [ ] Test per-type toggle
- [ ] Test locked settings cannot be changed

### E2E Tests
- [ ] Test save preferences workflow
- [ ] Test preferences persist after reload

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Page accessible at `/settings/notifications`
- [ ] API integration working
- [ ] Preferences apply to sound manager
- [ ] Form validation prevents invalid ranges
