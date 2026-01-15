# ARC Dashboard Customization Component Specifications

## Overview

This document provides detailed specifications for all UI components in the dashboard customization system. Each component includes wireframes, props, behavior, and implementation code.

---

## 1. DashboardGrid

### Purpose
Main grid container that renders widgets using dnd-kit for drag-and-drop functionality.

### Wireframe (Edit Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                      [+ Add Widget] [✓ Done] [✗]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⋮⋮ Portfolio Summary                                           [⚙] [×] │ │
│ │ ═══════════════════════════════════════════════════════════════════════ │ │
│ │                         [ Summary Cards Content ]                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌──────────────────────────────────┐ ┌──────────────────────────────────┐  │
│ │ ⋮⋮ Asset Allocation      [⚙] [×]│ │ ⋮⋮ Performance           [⚙] [×]│  │
│ │ ═══════════════════════════════  │ │ ═══════════════════════════════  │  │
│ │                                  │ │                                  │  │
│ │     [ Allocation Chart ]         │ │     [ Performance Chart ]        │  │
│ │                                  │ │                                  │  │
│ │                                  │ │                                  │  │
│ └──────────────────────────────────┘ └──────────────────────────────────┘  │
│                                                                              │
│ ┌──────────────────────────────────┐ ┌──────────────────────────────────┐  │
│ │ ⋮⋮ Active Alerts         [⚙] [×]│ │ ⋮⋮ Market Brief          [⚙] [×]│  │
│ │ ═══════════════════════════════  │ │ ═══════════════════════════════  │  │
│ │                                  │ │                                  │  │
│ │     [ Alerts Content ]           │ │     [ Brief Content ]            │  │
│ │                                  │ │                                  │  │
│ └──────────────────────────────────┘ └──────────────────────────────────┘  │
│                                                                              │
│ ╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮ │
│ ╎                        Drop zone (dashed outline)                      ╎ │
│ ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/features/dashboard/components/DashboardGrid.tsx
"use client";

import { useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WIDGETS, SIZE_TO_SPAN, GRID_CONFIG } from "../widgets/registry";
import { WidgetContainer } from "./WidgetContainer";
import { cn } from "@/lib/utils";
import type { WidgetInstance } from "../types";

export interface DashboardGridProps {
  className?: string;
}

export function DashboardGrid({ className }: DashboardGridProps) {
  const {
    activeLayout,
    isEditMode,
    moveWidget,
  } = useDashboardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const layout = activeLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Find the over widget's position
      const overWidget = layout.widgets.find(w => w.id === over.id);
      if (overWidget) {
        moveWidget(active.id as string, overWidget.position);
      }
    }
  }, [layout.widgets, moveWidget]);

  // Calculate grid positions
  const gridItems = useMemo(() => {
    return layout.widgets.map((widget) => {
      const span = SIZE_TO_SPAN[widget.size];
      return {
        ...widget,
        gridColumn: `${widget.position.x + 1} / span ${span.cols}`,
        gridRow: `${widget.position.y + 1} / span ${span.rows}`,
      };
    });
  }, [layout.widgets]);

  const activeWidget = activeId
    ? layout.widgets.find(w => w.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={layout.widgets.map(w => w.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={cn(
            "grid gap-4",
            "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
            className
          )}
          style={{
            gridAutoRows: `${GRID_CONFIG.rowHeight}px`,
          }}
        >
          {gridItems.map((item) => {
            const definition = WIDGETS[item.widgetId];
            if (!definition) return null;

            return (
              <WidgetContainer
                key={item.id}
                instance={item}
                definition={definition}
                style={{
                  gridColumn: item.gridColumn,
                  gridRow: item.gridRow,
                }}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag overlay for smooth animation */}
      <DragOverlay>
        {activeWidget && (
          <WidgetContainer
            instance={activeWidget}
            definition={WIDGETS[activeWidget.widgetId]!}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

---

## 2. WidgetContainer

### Purpose
Wrapper component that provides edit mode controls (drag handle, settings, remove) and category theming.

### Props

```typescript
interface WidgetContainerProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  style?: React.CSSProperties;
  isDragging?: boolean;
}
```

### Implementation

```typescript
// src/features/dashboard/components/WidgetContainer.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WIDGET_CATEGORIES } from "../widgets/registry";
import { WidgetSettingsModal } from "./WidgetSettingsModal";
import type { WidgetInstance, WidgetDefinition } from "../types";

interface WidgetContainerProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export function WidgetContainer({
  instance,
  definition,
  style,
  isDragging,
}: WidgetContainerProps) {
  const { isEditMode, removeWidget, updateWidgetConfig } = useDashboardStore();
  const [showSettings, setShowSettings] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: instance.id });

  const category = WIDGET_CATEGORIES[definition.category];
  const Component = definition.component;

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={sortableStyle}
        className={cn(
          "relative overflow-hidden transition-shadow",
          isEditMode && "ring-2 ring-dashed ring-muted-foreground/30",
          isEditMode && category.borderColor,
          (isDragging || isSorting) && "opacity-50 shadow-2xl",
        )}
      >
        {/* Category accent bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            category.color.replace("text-", "bg-")
          )}
        />

        {/* Edit mode controls */}
        {isEditMode && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {/* Drag handle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Drag to reorder</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Settings button */}
            {definition.configurable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Widget settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Remove button */}
            {definition.removable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeWidget(instance.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove widget</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Widget header */}
        <div className="flex items-center gap-2 p-4 pb-2">
          <definition.icon className={cn("h-5 w-5", category.color)} />
          <h3 className="font-semibold text-sm">{definition.name}</h3>
        </div>

        {/* Widget content */}
        <div className="p-4 pt-0">
          <Component config={instance.config} />
        </div>
      </Card>

      {/* Settings modal */}
      {definition.configurable && definition.settingsComponent && (
        <WidgetSettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
          title={`${definition.name} Settings`}
          config={instance.config}
          onConfigChange={(config) => {
            updateWidgetConfig(instance.id, config);
            setShowSettings(false);
          }}
          SettingsComponent={definition.settingsComponent}
        />
      )}
    </>
  );
}
```

---

## 3. WidgetPicker

### Purpose
Sidebar panel for browsing and adding widgets to the dashboard.

### Wireframe

```
┌────────────────────────────────────────┐
│ Add Widget                          [×]│
├────────────────────────────────────────┤
│                                        │
│ 🔍 Search widgets...                   │
│                                        │
│ ─────────────────────────────────────  │
│ PORTFOLIO                              │
│ ─────────────────────────────────────  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📊 Asset Allocation                │ │
│ │ Sector/asset class breakdown       │ │
│ │                            [+ Add] │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📈 Top Holdings                    │ │
│ │ Largest positions by value         │ │
│ │                            [+ Add] │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ─────────────────────────────────────  │
│ ANALYTICS                              │
│ ─────────────────────────────────────  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 💹 Performance                     │ │
│ │ Historical performance vs benchmark│ │
│ │                            [+ Add] │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ❤️ Health Score                    │ │
│ │ Portfolio health indicator         │ │
│ │                      [Already added]│ │
│ └────────────────────────────────────┘ │
│                                        │
│ ─────────────────────────────────────  │
│ INTELLIGENCE                           │
│ ─────────────────────────────────────  │
│                                        │
│ ...                                    │
└────────────────────────────────────────┘
```

### Implementation

```typescript
// src/features/dashboard/components/WidgetPicker.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WIDGETS, WIDGET_CATEGORIES, WidgetCategory } from "../widgets/registry";

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetPicker({ open, onOpenChange }: WidgetPickerProps) {
  const { activeLayout, addWidget } = useDashboardStore();
  const [search, setSearch] = useState("");

  const layout = activeLayout();

  // Group widgets by category
  const groupedWidgets = useMemo(() => {
    const groups: Record<WidgetCategory, typeof WIDGETS[keyof typeof WIDGETS][]> = {
      portfolio: [],
      analytics: [],
      intelligence: [],
      actions: [],
    };

    Object.values(WIDGETS).forEach((widget) => {
      const matchesSearch = !search ||
        widget.name.toLowerCase().includes(search.toLowerCase()) ||
        widget.description.toLowerCase().includes(search.toLowerCase());

      if (matchesSearch) {
        groups[widget.category].push(widget);
      }
    });

    return groups;
  }, [search]);

  // Check if widget is already added (and at max instances)
  const isWidgetAtMax = (widgetId: string) => {
    const definition = WIDGETS[widgetId];
    if (!definition) return false;

    const count = layout.widgets.filter(w => w.widgetId === widgetId).length;
    return count >= (definition.maxInstances || 1);
  };

  const handleAdd = (widgetId: string) => {
    addWidget(widgetId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Add Widget</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Widget list */}
        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          <div className="space-y-6">
            {(Object.entries(groupedWidgets) as [WidgetCategory, typeof WIDGETS[keyof typeof WIDGETS][]][])
              .filter(([, widgets]) => widgets.length > 0)
              .map(([category, widgets]) => {
                const categoryMeta = WIDGET_CATEGORIES[category];

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          categoryMeta.color.replace("text-", "bg-")
                        )}
                      />
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {categoryMeta.name}
                      </span>
                    </div>

                    {/* Widgets in category */}
                    <div className="space-y-2">
                      {widgets.map((widget) => {
                        const Icon = widget.icon;
                        const isAtMax = isWidgetAtMax(widget.id);

                        return (
                          <div
                            key={widget.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border",
                              categoryMeta.bgColor,
                              categoryMeta.borderColor
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                "bg-background"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", categoryMeta.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {widget.name}
                                </span>
                                {!widget.removable && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {widget.description}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant={isAtMax ? "secondary" : "outline"}
                              disabled={isAtMax}
                              onClick={() => handleAdd(widget.id)}
                              className="shrink-0"
                            >
                              {isAtMax ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 4. WidgetSettingsModal

### Purpose
Modal for configuring widget-specific settings.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ Performance Settings                                         [×]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Time Period                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [1M] [3M] [6M] [YTD] [●1Y] [3Y] [5Y] [All]                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Show Benchmark                                                   │
│ ┌──────────────────────────────┐                                │
│ │ [✓] S&P 500            ▼    │                                │
│ └──────────────────────────────┘                                │
│                                                                  │
│ Chart Type                                                       │
│ ○ Area Chart                                                    │
│ ● Line Chart                                                    │
│ ○ Bar Chart                                                     │
│                                                                  │
│                                                                  │
│                                    [Cancel]  [Save Changes]     │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/features/dashboard/components/WidgetSettingsModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WidgetSettingsProps } from "../types";

interface WidgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  SettingsComponent: React.ComponentType<WidgetSettingsProps>;
}

export function WidgetSettingsModal({
  open,
  onOpenChange,
  title,
  config,
  onConfigChange,
  SettingsComponent,
}: WidgetSettingsModalProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);  // Reset to original
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <SettingsComponent
            config={localConfig}
            onConfigChange={setLocalConfig}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Widget Settings Components

### 5.1 Performance Settings

```typescript
// src/features/dashboard/widgets/settings/PerformanceSettings.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WidgetSettingsProps } from "../../types";

const PERIODS = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "All"];
const BENCHMARKS = [
  { value: "sp500", label: "S&P 500" },
  { value: "nasdaq", label: "NASDAQ" },
  { value: "djia", label: "Dow Jones" },
  { value: "custom", label: "Custom..." },
];

export function PerformanceSettings({ config, onConfigChange }: WidgetSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Time Period */}
      <div className="space-y-2">
        <Label>Time Period</Label>
        <ToggleGroup
          type="single"
          value={config.period as string}
          onValueChange={(value) => {
            if (value) onConfigChange({ ...config, period: value });
          }}
          className="flex-wrap"
        >
          {PERIODS.map((period) => (
            <ToggleGroupItem key={period} value={period} size="sm">
              {period}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Benchmark */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="benchmark-toggle">Show Benchmark</Label>
          <Switch
            id="benchmark-toggle"
            checked={config.showBenchmark as boolean}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, showBenchmark: checked })
            }
          />
        </div>

        {config.showBenchmark && (
          <Select
            value={config.benchmark as string}
            onValueChange={(value) =>
              onConfigChange({ ...config, benchmark: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select benchmark" />
            </SelectTrigger>
            <SelectContent>
              {BENCHMARKS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
```

### 5.2 Top Holdings Settings

```typescript
// src/features/dashboard/widgets/settings/TopHoldingsSettings.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { WidgetSettingsProps } from "../../types";

export function TopHoldingsSettings({ config, onConfigChange }: WidgetSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Number of holdings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Number of Holdings</Label>
          <span className="text-sm font-medium">{config.limit as number}</span>
        </div>
        <Slider
          value={[config.limit as number]}
          min={3}
          max={15}
          step={1}
          onValueChange={([value]) =>
            onConfigChange({ ...config, limit: value })
          }
        />
        <p className="text-xs text-muted-foreground">
          Show top {config.limit as number} holdings by value
        </p>
      </div>

      {/* Show change */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-change">Show Daily Change</Label>
          <p className="text-xs text-muted-foreground">
            Display percentage change for each holding
          </p>
        </div>
        <Switch
          id="show-change"
          checked={config.showChange as boolean}
          onCheckedChange={(checked) =>
            onConfigChange({ ...config, showChange: checked })
          }
        />
      </div>

      {/* Show value */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-value">Show Market Value</Label>
          <p className="text-xs text-muted-foreground">
            Display dollar value for each holding
          </p>
        </div>
        <Switch
          id="show-value"
          checked={config.showValue as boolean ?? true}
          onCheckedChange={(checked) =>
            onConfigChange({ ...config, showValue: checked })
          }
        />
      </div>
    </div>
  );
}
```

---

## 6. Dashboard Edit Mode Header

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│ VIEW MODE:                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Dashboard                                          [↗ Export] [⚙ Edit] │ │
│ │ Overview of your portfolio performance                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ EDIT MODE:                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Editing Dashboard                    [+ Add Widget] [Cancel] [✓ Done]  │ │
│ │ Drag widgets to rearrange • Click ⚙ to configure • Click × to remove   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/app/(dashboard)/dashboard/components/DashboardHeader.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, Plus, X, Check, Download } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WidgetPicker } from "@/features/dashboard/components/WidgetPicker";

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

  const handleDiscard = () => {
    exitEditMode(false);
    setShowDiscardDialog(false);
  };

  const handleSave = () => {
    exitEditMode(true);
  };

  if (isEditMode) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Editing Dashboard</h1>
              {isDirty && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Drag widgets to rearrange • Click ⚙ to configure • Click × to remove
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPicker(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>

        <WidgetPicker open={showPicker} onOpenChange={setShowPicker} />

        <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes to your dashboard layout.
                Are you sure you want to discard them?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscard}>
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your portfolio performance
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={enterEditMode}>
          <Settings className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Responsive Behavior

### Breakpoint Adaptation

| Breakpoint | Grid Columns | Behavior |
|------------|--------------|----------|
| **xl** (≥1280px) | 4 | Full layout, all sizes |
| **lg** (≥1024px) | 4 | Full layout |
| **md** (≥768px) | 2 | 4x1 → 2x1, 2x2 → 2x2 |
| **sm** (<768px) | 1 | All widgets stack, full width |

### Mobile Edit Mode

```typescript
// On mobile, edit mode uses bottom sheet instead of inline controls
{isMobile && isEditMode && (
  <Sheet open={true}>
    <SheetContent side="bottom" className="h-auto">
      <div className="flex items-center justify-between py-4">
        <span className="font-medium">Editing Dashboard</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Done
          </Button>
        </div>
      </div>
      <div className="flex gap-2 pb-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowPicker(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </div>
    </SheetContent>
  </Sheet>
)}
```

---

## 8. Implementation Checklist

### Components

- [ ] `DashboardGrid.tsx` - dnd-kit powered grid
- [ ] `WidgetContainer.tsx` - Wrapper with edit controls
- [ ] `WidgetPicker.tsx` - Sidebar for adding widgets
- [ ] `WidgetSettingsModal.tsx` - Per-widget configuration
- [ ] `DashboardHeader.tsx` - Edit mode header
- [ ] Widget settings components (Performance, Holdings, etc.)

### Integration

- [ ] Refactor dashboard page to use `DashboardGrid`
- [ ] Connect to `dashboardStore` for state
- [ ] Add keyboard shortcuts (Escape to cancel)
- [ ] Implement undo/redo stack

### Testing

- [ ] Unit tests for store actions
- [ ] Integration tests for drag-and-drop
- [ ] E2E tests for full edit flow
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit (keyboard navigation, screen reader)

### Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
