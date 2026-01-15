# TODO-DASH-007: Build Widget-Specific Settings Components

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 2 - Core Components)
**Est. Effort**: 5 hours

## Description

Create individual settings components for configurable widgets (Performance, Top Holdings, Alerts, Market Brief, Allocation).

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/02-components.md` (Section 5: Widget Settings Components)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/widgets/settings/PerformanceSettings.tsx`
- [ ] Create `/apps/web/src/features/dashboard/widgets/settings/TopHoldingsSettings.tsx`
- [ ] Create `/apps/web/src/features/dashboard/widgets/settings/AlertsSettings.tsx`
- [ ] Create `/apps/web/src/features/dashboard/widgets/settings/AllocationSettings.tsx`
- [ ] Create `/apps/web/src/features/dashboard/widgets/settings/BriefSettings.tsx`

## Settings Per Widget

### PerformanceSettings
- Time period toggle group: 1M, 3M, 6M, YTD, 1Y, 3Y, 5Y, All
- Show benchmark switch
- Benchmark select dropdown (S&P 500, NASDAQ, DJIA, Custom)

### TopHoldingsSettings
- Number of holdings slider (3-15)
- Show daily change switch
- Show market value switch

### AlertsSettings
- Max alerts slider (3-10)
- Alert types multi-select

### AllocationSettings
- Chart type radio: Pie, Donut, Bar
- Show legend switch
- Show percentages switch

### BriefSettings
- Brief type select: Morning, Midday, Evening, Custom
- Update frequency dropdown

## Dependencies

- TODO-DASH-006 (WidgetSettingsModal)

## Files to Create

- `/apps/web/src/features/dashboard/widgets/settings/PerformanceSettings.tsx`
- `/apps/web/src/features/dashboard/widgets/settings/TopHoldingsSettings.tsx`
- `/apps/web/src/features/dashboard/widgets/settings/AlertsSettings.tsx`
- `/apps/web/src/features/dashboard/widgets/settings/AllocationSettings.tsx`
- `/apps/web/src/features/dashboard/widgets/settings/BriefSettings.tsx`

## Testing Requirements

### Unit Tests (per component)
- [ ] Test renders with default config
- [ ] Test onChange called on setting change
- [ ] Test slider updates value
- [ ] Test switch toggles correctly
- [ ] Test select changes value

## Implementation Notes

```typescript
interface WidgetSettingsProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

// Example: TopHoldingsSettings
export function TopHoldingsSettings({ config, onConfigChange }: WidgetSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Number of Holdings</Label>
        <Slider
          value={[config.limit as number]}
          min={3}
          max={15}
          step={1}
          onValueChange={([value]) =>
            onConfigChange({ ...config, limit: value })
          }
        />
      </div>
      {/* ... more settings */}
    </div>
  );
}
```

## Definition of Done

- [ ] All 5 settings components created
- [ ] Unit tests passing for each
- [ ] Settings integrate with WidgetSettingsModal
- [ ] All form controls accessible
