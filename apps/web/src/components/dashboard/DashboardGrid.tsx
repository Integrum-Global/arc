/**
 * DashboardGrid Component
 *
 * Main grid container that renders widgets using dnd-kit for drag-and-drop
 * functionality with responsive breakpoints.
 *
 * Features:
 * - CSS Grid layout with responsive columns (4/2/1)
 * - Drag-and-drop widget reordering via @dnd-kit
 * - DragOverlay for smooth drag animation
 * - Keyboard sensor support for accessibility
 * - Pointer sensor with 8px activation distance
 * - Integration with dashboardStore for state management
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDashboardStore, type WidgetInstance as StoreWidgetInstance } from "@/stores/dashboardStore";
import { WIDGETS, GRID_CONFIG, SIZE_TO_SPAN } from "@/features/dashboard/widgets/registry";
import { WidgetContainer } from "./WidgetContainer";
import { cn } from "@/lib/utils";
import type { WidgetInstance, WidgetSize } from "@/features/dashboard/types";

// =============================================================================
// Types
// =============================================================================

export interface DashboardGridProps {
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert store widget size { cols, rows } to WidgetSize string
 */
function sizeToString(size: { cols: number; rows: number }): WidgetSize {
  return `${size.cols}x${size.rows}` as WidgetSize;
}

/**
 * Convert store WidgetInstance to types WidgetInstance format
 * Store uses: size: { cols, rows }, settings
 * Types use: size: WidgetSize (string), config
 */
function adaptStoreWidget(storeWidget: StoreWidgetInstance): WidgetInstance {
  return {
    id: storeWidget.id,
    widgetId: storeWidget.widgetId,
    position: storeWidget.position,
    size: sizeToString(storeWidget.size),
    config: storeWidget.settings || {},
  };
}

// =============================================================================
// DashboardGrid Component
// =============================================================================

export function DashboardGrid({ className }: DashboardGridProps) {
  // Store selectors
  const widgets = useDashboardStore((state) => state.widgets);
  const isEditMode = useDashboardStore((state) => state.isEditMode);

  // We need a function to reorder widgets - using loadLayout with reordered array
  const loadLayout = useDashboardStore((state) => state.loadLayout);

  // Track active drag item
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      // Only reorder if dropped on a different widget
      if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Use arrayMove to reorder widgets
          const newWidgets = arrayMove(widgets, oldIndex, newIndex);

          // Update positions based on new order
          const updatedWidgets = newWidgets.map((widget, index) => ({
            ...widget,
            position: { x: 0, y: index }, // Simple linear positioning
          }));

          loadLayout(updatedWidgets);
        }
      }
    },
    [widgets, loadLayout]
  );

  // Calculate grid styles for each widget
  const gridItems = useMemo(() => {
    return widgets.map((storeWidget) => {
      const definition = WIDGETS[storeWidget.widgetId];
      if (!definition) return null;

      // Adapt store widget to types format for WidgetContainer
      const instance = adaptStoreWidget(storeWidget);

      return {
        storeWidget,
        instance,
        definition,
        style: {
          gridColumn: `${storeWidget.position.x + 1} / span ${storeWidget.size.cols}`,
          gridRow: `${storeWidget.position.y + 1} / span ${storeWidget.size.rows}`,
        },
      };
    });
  }, [widgets]);

  // Find active widget for drag overlay
  const activeWidget = useMemo(() => {
    if (!activeId) return null;
    const storeWidget = widgets.find((w) => w.id === activeId);
    if (!storeWidget) return null;
    const definition = WIDGETS[storeWidget.widgetId];
    if (!definition) return null;
    const instance = adaptStoreWidget(storeWidget);
    return { instance, definition };
  }, [activeId, widgets]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={widgets.map((w) => w.id)}
        strategy={rectSortingStrategy}
      >
        <div
          data-testid="dashboard-grid"
          className={cn(
            "grid gap-4",
            "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
            "xl:gap-6",
            className
          )}
          style={{
            gridAutoRows: `${GRID_CONFIG.rowHeight}px`,
          }}
        >
          {gridItems.map((item) => {
            if (!item) return null;

            return (
              <WidgetContainer
                key={item.storeWidget.id}
                instance={item.instance}
                definition={item.definition}
                style={item.style}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag overlay for smooth animation */}
      <DragOverlay>
        {activeWidget && (
          <WidgetContainer
            instance={activeWidget.instance}
            definition={activeWidget.definition}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DashboardGrid;
