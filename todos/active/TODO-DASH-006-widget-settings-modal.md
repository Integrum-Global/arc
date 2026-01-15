# TODO-DASH-006: Create WidgetSettingsModal Component

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 2 - Core Components)
**Est. Effort**: 3 hours

## Description

Build a generic modal component for widget-specific configuration settings.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 4: WidgetSettingsModal)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/components/WidgetSettingsModal.tsx`
- [ ] Dialog component with title prop
- [ ] Render dynamic SettingsComponent passed as prop
- [ ] Local state for config changes (don't mutate until save)
- [ ] Cancel button (revert changes)
- [ ] Save Changes button (commit to store)
- [ ] Modal closes on save/cancel
- [ ] Max width: 448px (sm:max-w-md)

## Dependencies

- TODO-DASH-002 (dashboard store)

## Files to Create

- `/apps/web/src/features/dashboard/components/WidgetSettingsModal.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test renders SettingsComponent
- [ ] Test Cancel reverts changes
- [ ] Test Save commits changes
- [ ] Test modal closes on save
- [ ] Test local state isolated from store

### E2E Tests
- [ ] Test save changes workflow
- [ ] Test cancel discards changes

## Implementation Notes

```typescript
interface WidgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  SettingsComponent: React.ComponentType<WidgetSettingsProps>;
}

// Use local state to buffer changes
const [localConfig, setLocalConfig] = useState(config);
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Modal accessible (Escape to close)
- [ ] Config changes isolated until save
