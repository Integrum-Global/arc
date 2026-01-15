# TODO-DASH-001: Create Widget Registry with Definitions

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 4 hours

## Description

Create the widget registry system that defines all available dashboard widgets with metadata, constraints, and category theming.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Section 3: Widget Registry)

## Acceptance Criteria

- [ ] Create `/apps/web/src/features/dashboard/widgets/registry.ts`
- [ ] Define TypeScript types: WidgetDefinition, WidgetCategory, WidgetSize, WidgetProps, WidgetSettingsProps
- [ ] Create WIDGETS constant with 8+ widget definitions
- [ ] Define WIDGET_CATEGORIES with theming (colors, borders)
- [ ] Define SIZE_TO_SPAN mapping (grid cols/rows)
- [ ] Define GRID_CONFIG with breakpoints
- [ ] Widget categories: portfolio (blue), analytics (green), intelligence (purple), actions (amber)
- [ ] Widget sizes: 1x1, 2x1, 1x2, 2x2, 4x1, 4x2

## Dependencies

- None (foundation)

## Widgets to Define

1. **summary-cards**: Portfolio Summary (4x1, required, non-configurable)
2. **allocation-chart**: Asset Allocation (2x2, configurable, removable)
3. **top-holdings**: Top Holdings (2x2, configurable, removable)
4. **performance-chart**: Performance (2x2, configurable, removable)
5. **alerts**: Active Alerts (2x2, configurable, removable)
6. **market-brief**: Market Brief (2x2, configurable, removable)
7. **quick-actions**: Quick Actions (4x1, non-configurable, removable)
8. **health-score**: Health Score (1x1, non-configurable, removable)

## Files to Create

- `/apps/web/src/features/dashboard/widgets/registry.ts`
- `/apps/web/src/features/dashboard/types.ts`

## Testing Requirements

### Unit Tests (`tests/unit/features/dashboard/registry.test.ts`)
- [ ] Test all widgets have required fields
- [ ] Test SIZE_TO_SPAN mapping correct
- [ ] Test GRID_CONFIG valid
- [ ] Test category theme colors defined
- [ ] Test widget constraints (maxInstances, removable)

## Implementation Notes

```typescript
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  resizable: boolean;
  configurable: boolean;
  removable: boolean;
  defaultConfig?: Record<string, unknown>;
  maxInstances?: number;
  requiredPermission?: string;
  component: React.ComponentType<WidgetProps>;
  settingsComponent?: React.ComponentType<WidgetSettingsProps>;
}
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] TypeScript types exported
- [ ] All 8 widgets defined
- [ ] Category theming complete
- [ ] Grid configuration validated
