# ARC Dashboard Customization Architecture

## Overview

This document defines the widget-based dashboard customization system for the ARC investment management platform. Users can arrange, configure, and personalize their dashboard layout with drag-and-drop functionality.

---

## 1. Problem Statement

### Current State
- Fixed dashboard layout with no customization
- All users see the same widgets in the same positions
- No way to hide unwanted sections
- No widget-level configuration options

### User Requirements

| Requirement | Priority | User Quote |
|-------------|----------|------------|
| Rearrange widgets | High | "I want alerts at the top, not the bottom" |
| Hide/show widgets | High | "I never use the brief section" |
| Widget configuration | Medium | "I want to see top 10 holdings, not top 5" |
| Visual themes | Medium | "I want my sections color-coded" |
| Save layouts | High | "My preferences should persist" |
| Multiple layouts | Low | "Different views for different tasks" |

---

## 2. Widget System Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WIDGET SYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Widget Registry │    │  Dashboard Store │    │  Layout Engine   │       │
│  │                  │    │    (Zustand)     │    │   (dnd-kit)      │       │
│  │  - Definitions   │    │                  │    │                  │       │
│  │  - Categories    │───▶│  - Active layout │───▶│  - Grid system   │       │
│  │  - Constraints   │    │  - Widget states │    │  - Drag/drop     │       │
│  │  - Defaults      │    │  - Persistence   │    │  - Collision     │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                        DASHBOARD GRID                               │     │
│  │  ┌─────────────────────────────────────────────────────────────┐   │     │
│  │  │  WidgetContainer (wraps each widget)                        │   │     │
│  │  │  - Edit mode controls (drag handle, settings, remove)       │   │     │
│  │  │  - Category theme styling                                   │   │     │
│  │  │  - Render actual widget component                           │   │     │
│  │  └─────────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Widget Registry** | Widget definitions, metadata, constraints | `features/dashboard/widgets/registry.ts` |
| **Dashboard Store** | Layout state, persistence, user preferences | `stores/dashboardStore.ts` |
| **DashboardGrid** | dnd-kit powered responsive grid | `features/dashboard/components/DashboardGrid.tsx` |
| **WidgetContainer** | Wrapper with edit mode controls | `features/dashboard/components/WidgetContainer.tsx` |
| **WidgetPicker** | Sidebar for adding widgets | `features/dashboard/components/WidgetPicker.tsx` |
| **WidgetSettings** | Per-widget configuration modal | `features/dashboard/components/WidgetSettings.tsx` |

---

## 3. Widget Registry

### 3.1 Widget Definitions

```typescript
// src/features/dashboard/widgets/registry.ts

export type WidgetCategory = "portfolio" | "analytics" | "intelligence" | "actions";
export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2" | "4x1" | "4x2";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: LucideIcon;

  // Layout
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  resizable: boolean;

  // Behavior
  configurable: boolean;
  removable: boolean;
  defaultConfig?: Record<string, unknown>;

  // Constraints
  maxInstances?: number;  // Default 1
  requiredPermission?: string;

  // Component
  component: React.ComponentType<WidgetProps>;
  settingsComponent?: React.ComponentType<WidgetSettingsProps>;
}

export interface WidgetProps {
  config: Record<string, unknown>;
  isLoading?: boolean;
}

export interface WidgetSettingsProps {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}
```

### 3.2 Widget Catalog

```typescript
// Widget definitions
export const WIDGETS: Record<string, WidgetDefinition> = {
  "summary-cards": {
    id: "summary-cards",
    name: "Portfolio Summary",
    description: "Key metrics: Total AUM, daily change, YTD return",
    category: "portfolio",
    icon: LayoutDashboard,
    defaultSize: "4x1",
    resizable: false,
    configurable: false,
    removable: false,  // Required widget
    component: SummaryCards,
  },

  "allocation-chart": {
    id: "allocation-chart",
    name: "Asset Allocation",
    description: "Sector/asset class breakdown",
    category: "portfolio",
    icon: PieChart,
    defaultSize: "2x2",
    minSize: "1x2",
    maxSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: { chartType: "pie", showLegend: true },
    component: AllocationSection,
    settingsComponent: AllocationSettings,
  },

  "top-holdings": {
    id: "top-holdings",
    name: "Top Holdings",
    description: "Largest positions by value",
    category: "portfolio",
    icon: BarChart3,
    defaultSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: { limit: 5, showChange: true },
    component: TopHoldingsWidget,
    settingsComponent: TopHoldingsSettings,
  },

  "performance-chart": {
    id: "performance-chart",
    name: "Performance",
    description: "Historical performance vs benchmark",
    category: "analytics",
    icon: TrendingUp,
    defaultSize: "2x2",
    minSize: "2x1",
    maxSize: "4x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: { period: "1Y", showBenchmark: true },
    component: PerformanceSection,
    settingsComponent: PerformanceSettings,
  },

  "alerts": {
    id: "alerts",
    name: "Active Alerts",
    description: "Actionable alerts requiring attention",
    category: "actions",
    icon: AlertCircle,
    defaultSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: { maxAlerts: 5 },
    component: ActionableAlertsWidget,
    settingsComponent: AlertsSettings,
  },

  "market-brief": {
    id: "market-brief",
    name: "Market Brief",
    description: "AI-generated market summary",
    category: "intelligence",
    icon: Newspaper,
    defaultSize: "2x2",
    resizable: true,
    configurable: true,
    removable: true,
    defaultConfig: { briefType: "morning" },
    component: BriefSection,
    settingsComponent: BriefSettings,
  },

  "quick-actions": {
    id: "quick-actions",
    name: "Quick Actions",
    description: "Common actions and data freshness",
    category: "actions",
    icon: Zap,
    defaultSize: "4x1",
    resizable: false,
    configurable: false,
    removable: true,
    component: QuickActions,
  },

  "health-score": {
    id: "health-score",
    name: "Health Score",
    description: "Portfolio health indicator",
    category: "analytics",
    icon: Activity,
    defaultSize: "1x1",
    resizable: false,
    configurable: false,
    removable: true,
    component: HealthScoreWidget,
  },
};

// Category metadata
export const WIDGET_CATEGORIES: Record<WidgetCategory, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  portfolio: {
    name: "Portfolio",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  analytics: {
    name: "Analytics",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  intelligence: {
    name: "Intelligence",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  actions: {
    name: "Actions",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
};
```

---

## 4. Layout System

### 4.1 Grid Configuration

```typescript
// Grid system based on 4-column layout
export const GRID_CONFIG = {
  columns: 4,
  rowHeight: 180,  // px
  gap: 16,         // px

  breakpoints: {
    xl: { columns: 4, gap: 24 },   // >= 1280px
    lg: { columns: 4, gap: 16 },   // >= 1024px
    md: { columns: 2, gap: 16 },   // >= 768px
    sm: { columns: 1, gap: 12 },   // < 768px
  },
};

// Size to grid span mapping
export const SIZE_TO_SPAN: Record<WidgetSize, { cols: number; rows: number }> = {
  "1x1": { cols: 1, rows: 1 },
  "2x1": { cols: 2, rows: 1 },
  "1x2": { cols: 1, rows: 2 },
  "2x2": { cols: 2, rows: 2 },
  "4x1": { cols: 4, rows: 1 },
  "4x2": { cols: 4, rows: 2 },
};
```

### 4.2 Layout State

```typescript
export interface WidgetInstance {
  id: string;              // Unique instance ID
  widgetId: string;        // Reference to WIDGETS registry
  position: {
    x: number;             // Column (0-3)
    y: number;             // Row
  };
  size: WidgetSize;
  config: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Default Layout

```typescript
export const DEFAULT_LAYOUT: DashboardLayout = {
  id: "default",
  name: "Default",
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  widgets: [
    // Row 1: Summary cards (full width)
    {
      id: "inst-1",
      widgetId: "summary-cards",
      position: { x: 0, y: 0 },
      size: "4x1",
      config: {},
    },

    // Row 2: Allocation + Performance
    {
      id: "inst-2",
      widgetId: "allocation-chart",
      position: { x: 0, y: 1 },
      size: "2x2",
      config: { chartType: "pie", showLegend: true },
    },
    {
      id: "inst-3",
      widgetId: "performance-chart",
      position: { x: 2, y: 1 },
      size: "2x2",
      config: { period: "1Y", showBenchmark: true },
    },

    // Row 3: Alerts + Brief
    {
      id: "inst-4",
      widgetId: "alerts",
      position: { x: 0, y: 3 },
      size: "2x2",
      config: { maxAlerts: 5 },
    },
    {
      id: "inst-5",
      widgetId: "market-brief",
      position: { x: 2, y: 3 },
      size: "2x2",
      config: { briefType: "morning" },
    },

    // Row 4: Quick actions
    {
      id: "inst-6",
      widgetId: "quick-actions",
      position: { x: 0, y: 5 },
      size: "4x1",
      config: {},
    },
  ],
};
```

---

## 5. State Management

### 5.1 Dashboard Store

```typescript
// src/stores/dashboardStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { DashboardLayout, WidgetInstance, WidgetSize } from "@/features/dashboard/types";
import { DEFAULT_LAYOUT, WIDGETS } from "@/features/dashboard/widgets/registry";

interface DashboardState {
  // State
  layouts: DashboardLayout[];
  activeLayoutId: string;
  isEditMode: boolean;
  isDirty: boolean;

  // Computed
  activeLayout: () => DashboardLayout;

  // Layout Actions
  setActiveLayout: (layoutId: string) => void;
  createLayout: (name: string) => void;
  deleteLayout: (layoutId: string) => void;
  duplicateLayout: (layoutId: string, newName: string) => void;
  renameLayout: (layoutId: string, name: string) => void;

  // Widget Actions
  addWidget: (widgetId: string) => void;
  removeWidget: (instanceId: string) => void;
  moveWidget: (instanceId: string, position: { x: number; y: number }) => void;
  resizeWidget: (instanceId: string, size: WidgetSize) => void;
  updateWidgetConfig: (instanceId: string, config: Record<string, unknown>) => void;

  // Edit Mode
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;

  // Sync
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    immer((set, get) => ({
      layouts: [DEFAULT_LAYOUT],
      activeLayoutId: "default",
      isEditMode: false,
      isDirty: false,

      activeLayout: () => {
        const state = get();
        return state.layouts.find(l => l.id === state.activeLayoutId) || DEFAULT_LAYOUT;
      },

      setActiveLayout: (layoutId) => set((state) => {
        state.activeLayoutId = layoutId;
      }),

      createLayout: (name) => set((state) => {
        const newLayout: DashboardLayout = {
          id: crypto.randomUUID(),
          name,
          widgets: [...DEFAULT_LAYOUT.widgets],
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.layouts.push(newLayout);
        state.activeLayoutId = newLayout.id;
        state.isDirty = true;
      }),

      addWidget: (widgetId) => set((state) => {
        const definition = WIDGETS[widgetId];
        if (!definition) return;

        // Check max instances
        const layout = state.layouts.find(l => l.id === state.activeLayoutId);
        if (!layout) return;

        const existingCount = layout.widgets.filter(w => w.widgetId === widgetId).length;
        if (definition.maxInstances && existingCount >= definition.maxInstances) {
          return;
        }

        // Find next available position
        const position = findNextPosition(layout.widgets, definition.defaultSize);

        const instance: WidgetInstance = {
          id: crypto.randomUUID(),
          widgetId,
          position,
          size: definition.defaultSize,
          config: { ...definition.defaultConfig },
        };

        layout.widgets.push(instance);
        layout.updatedAt = new Date().toISOString();
        state.isDirty = true;
      }),

      removeWidget: (instanceId) => set((state) => {
        const layout = state.layouts.find(l => l.id === state.activeLayoutId);
        if (!layout) return;

        const widget = layout.widgets.find(w => w.id === instanceId);
        if (!widget) return;

        const definition = WIDGETS[widget.widgetId];
        if (!definition?.removable) return;

        layout.widgets = layout.widgets.filter(w => w.id !== instanceId);
        layout.updatedAt = new Date().toISOString();
        state.isDirty = true;
      }),

      moveWidget: (instanceId, position) => set((state) => {
        const layout = state.layouts.find(l => l.id === state.activeLayoutId);
        if (!layout) return;

        const widget = layout.widgets.find(w => w.id === instanceId);
        if (widget) {
          widget.position = position;
          layout.updatedAt = new Date().toISOString();
          state.isDirty = true;
        }
      }),

      resizeWidget: (instanceId, size) => set((state) => {
        const layout = state.layouts.find(l => l.id === state.activeLayoutId);
        if (!layout) return;

        const widget = layout.widgets.find(w => w.id === instanceId);
        if (!widget) return;

        const definition = WIDGETS[widget.widgetId];
        if (!definition?.resizable) return;

        widget.size = size;
        layout.updatedAt = new Date().toISOString();
        state.isDirty = true;
      }),

      updateWidgetConfig: (instanceId, config) => set((state) => {
        const layout = state.layouts.find(l => l.id === state.activeLayoutId);
        if (!layout) return;

        const widget = layout.widgets.find(w => w.id === instanceId);
        if (widget) {
          widget.config = { ...widget.config, ...config };
          layout.updatedAt = new Date().toISOString();
          state.isDirty = true;
        }
      }),

      enterEditMode: () => set((state) => {
        state.isEditMode = true;
      }),

      exitEditMode: (save) => set((state) => {
        state.isEditMode = false;
        if (!save) {
          // Revert changes - reload from persisted state
          // This would require storing a snapshot before entering edit mode
        }
        state.isDirty = false;
      }),

      syncWithBackend: async () => {
        const state = get();
        if (!state.isDirty) return;

        await fetch("/api/users/me/dashboard-layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layouts: state.layouts,
            activeLayoutId: state.activeLayoutId,
          }),
        });

        set((s) => { s.isDirty = false; });
      },

      loadFromBackend: async () => {
        const response = await fetch("/api/users/me/dashboard-layout");
        if (!response.ok) return;

        const data = await response.json();
        set((state) => {
          state.layouts = data.layouts || [DEFAULT_LAYOUT];
          state.activeLayoutId = data.activeLayoutId || "default";
        });
      },
    })),
    {
      name: "arc-dashboard-layout",
      partialize: (state) => ({
        layouts: state.layouts,
        activeLayoutId: state.activeLayoutId,
      }),
    }
  )
);

// Helper: Find next available grid position
function findNextPosition(widgets: WidgetInstance[], size: WidgetSize): { x: number; y: number } {
  const span = SIZE_TO_SPAN[size];
  const occupied = new Set<string>();

  // Mark occupied cells
  for (const widget of widgets) {
    const widgetSpan = SIZE_TO_SPAN[widget.size];
    for (let dy = 0; dy < widgetSpan.rows; dy++) {
      for (let dx = 0; dx < widgetSpan.cols; dx++) {
        occupied.add(`${widget.position.x + dx},${widget.position.y + dy}`);
      }
    }
  }

  // Find first position that fits
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= 4 - span.cols; x++) {
      let fits = true;
      for (let dy = 0; dy < span.rows; dy++) {
        for (let dx = 0; dx < span.cols; dx++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            fits = false;
            break;
          }
        }
        if (!fits) break;
      }
      if (fits) return { x, y };
    }
  }

  return { x: 0, y: widgets.length };
}
```

---

## 6. Persistence Strategy

### 6.1 Multi-Layer Persistence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERSISTENCE STRATEGY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Layer 1: localStorage (Zustand persist)                                   │
│   ─────────────────────────────────────────                                 │
│   • Immediate persistence                                                   │
│   • Works offline                                                           │
│   • Device-specific                                                         │
│                                                                              │
│   Layer 2: Backend API (sync on save)                                       │
│   ────────────────────────────────────                                      │
│   • Cross-device sync                                                       │
│   • Server-side backup                                                      │
│   • Auditable                                                               │
│                                                                              │
│   Sync Strategy:                                                            │
│   • On page load: Backend → Store (if newer)                                │
│   • On exit edit mode (save): Store → Backend                               │
│   • Every 60 seconds while editing: Auto-save to backend                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Backend API

```python
# src/arc/api/routes/dashboard_layout.py

from nexus import Nexus
from kailash.workflow.builder import WorkflowBuilder

def create_get_layout_workflow():
    """Get user's dashboard layout."""
    workflow = WorkflowBuilder(
        name="get_dashboard_layout",
        description="Retrieve user's saved dashboard layout"
    )

    workflow.add_node("UserDashboardLayoutReadNode", "read", {
        "filter_template": "user_id == '{{user_id}}'"
    })

    return workflow


def create_save_layout_workflow():
    """Save user's dashboard layout."""
    workflow = WorkflowBuilder(
        name="save_dashboard_layout",
        description="Save user's dashboard layout"
    )

    workflow.add_node("UserDashboardLayoutUpsertNode", "upsert", {
        "fields_template": {
            "user_id": "{{user_id}}",
            "layouts": "{{layouts}}",
            "active_layout_id": "{{active_layout_id}}"
        }
    })

    return workflow
```

---

## 7. Edit Mode State Machine

```
                                 ┌─────────────────┐
                                 │   VIEW MODE     │
                                 │  (isEditMode:   │
                                 │     false)      │
                                 └────────┬────────┘
                                          │
                                          │ enterEditMode()
                                          ▼
                                 ┌─────────────────┐
                                 │   EDIT MODE     │
                                 │  (isEditMode:   │◀──────────────┐
                                 │     true)       │               │
                                 └────────┬────────┘               │
                                          │                        │
                      ┌───────────────────┼───────────────────┐    │
                      │                   │                   │    │
                      ▼                   ▼                   ▼    │
              ┌───────────┐       ┌───────────┐       ┌───────────┐│
              │  addWidget│       │moveWidget │       │ configure ││
              │           │       │(drag/drop)│       │  widget   ││
              └─────┬─────┘       └─────┬─────┘       └─────┬─────┘│
                    │                   │                   │      │
                    └───────────────────┴───────────────────┘      │
                                          │                        │
                                          │ isDirty = true         │
                                          └────────────────────────┘
                                          │
                      ┌───────────────────┴───────────────────┐
                      │                                       │
                      ▼                                       ▼
              ┌───────────────┐                       ┌───────────────┐
              │ exitEditMode  │                       │ exitEditMode  │
              │ (save: true)  │                       │ (save: false) │
              └───────┬───────┘                       └───────┬───────┘
                      │                                       │
                      │ syncWithBackend()                     │ revert()
                      │                                       │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   VIEW MODE     │
                                 └─────────────────┘
```

---

## 8. Implementation Checklist

### Phase 1: Foundation

- [ ] **DASH-001**: Create widget registry with definitions
- [ ] **DASH-002**: Build `dashboardStore` with Zustand
- [ ] **DASH-003**: Implement default layout configuration
- [ ] **DASH-004**: Add localStorage persistence
- [ ] **DASH-005**: Create TypeScript types for all entities

### Phase 2: Core Components

- [ ] **DASH-006**: Build `WidgetContainer` component
- [ ] **DASH-007**: Create `DashboardGrid` with dnd-kit
- [ ] **DASH-008**: Implement drag-and-drop behavior
- [ ] **DASH-009**: Add collision detection and position snapping
- [ ] **DASH-010**: Build `WidgetPicker` sidebar

### Phase 3: Edit Mode

- [ ] **DASH-011**: Add edit mode toggle to dashboard header
- [ ] **DASH-012**: Create `WidgetSettingsModal`
- [ ] **DASH-013**: Implement widget removal with confirmation
- [ ] **DASH-014**: Add save/cancel buttons in edit mode
- [ ] **DASH-015**: Show unsaved changes warning

### Phase 4: Backend Sync

- [ ] **DASH-016**: Create `UserDashboardLayout` DataFlow model
- [ ] **DASH-017**: Implement GET/PUT API endpoints
- [ ] **DASH-018**: Add sync logic to dashboard store
- [ ] **DASH-019**: Handle conflict resolution (last-write-wins)

### Phase 5: Polish

- [ ] **DASH-020**: Add keyboard shortcuts (Escape to cancel)
- [ ] **DASH-021**: Implement undo/redo in edit mode
- [ ] **DASH-022**: Add layout presets/templates
- [ ] **DASH-023**: Create mobile-specific layout handling

---

## 9. Acceptance Criteria

### Functional Requirements

- [ ] Users can enter edit mode from dashboard header
- [ ] Widgets can be dragged to new positions
- [ ] Widgets snap to grid on drop
- [ ] Widget picker shows available widgets by category
- [ ] Widgets can be added from picker
- [ ] Removable widgets can be deleted
- [ ] Widget settings modal shows configurable options
- [ ] Layout persists across sessions
- [ ] Changes sync to backend

### Performance Requirements

- [ ] Drag-and-drop is smooth (60fps)
- [ ] Initial dashboard load <200ms
- [ ] Edit mode toggle <50ms
- [ ] Widget picker opens <100ms

### UX Requirements

- [ ] Clear visual distinction between view and edit modes
- [ ] Obvious drag handles on widgets
- [ ] Category colors visible but not overwhelming
- [ ] Confirmation before discarding unsaved changes
- [ ] Responsive behavior on tablet/mobile
