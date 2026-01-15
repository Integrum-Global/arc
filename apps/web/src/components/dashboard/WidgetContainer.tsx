/**
 * WidgetContainer Component
 *
 * Wrapper component that provides edit mode controls (drag handle, settings, remove)
 * and category theming for dashboard widgets.
 *
 * Features:
 * - Drag handle visible in edit mode only
 * - Settings button opens WidgetSettingsModal (if widget is configurable)
 * - Remove button with store action (if widget is removable)
 * - Category color accent on top border
 * - Smooth transitions for all state changes
 * - Integration with @dnd-kit/sortable for drag-and-drop
 */

"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WIDGET_CATEGORIES } from "@/features/dashboard/widgets/registry";
import { WidgetSettingsModal } from "@/components/dashboard/WidgetSettingsModal";
import type { WidgetInstance, WidgetDefinition } from "@/features/dashboard/types";

// =============================================================================
// Types
// =============================================================================

interface WidgetContainerProps {
  instance: WidgetInstance;
  definition: WidgetDefinition;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

// =============================================================================
// Category Accent Colors
// =============================================================================

const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  portfolio: "bg-blue-500",
  analytics: "bg-green-500",
  intelligence: "bg-purple-500",
  actions: "bg-amber-500",
};

// =============================================================================
// Widget Container
// =============================================================================

export function WidgetContainer({
  instance,
  definition,
  style,
  isDragging: isDraggingProp,
}: WidgetContainerProps) {
  const isEditMode = useDashboardStore((state) => state.isEditMode);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const updateWidgetSettings = useDashboardStore((state) => state.updateWidgetSettings);
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
  const accentColor = CATEGORY_ACCENT_COLORS[definition.category] || "bg-gray-500";

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  const isCurrentlyDragging = isDraggingProp || isSorting;

  const handleRemove = () => {
    removeWidget(instance.id);
  };

  const handleConfigChange = (newConfig: Record<string, unknown>) => {
    updateWidgetSettings(instance.id, newConfig);
    setShowSettings(false);
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
          isCurrentlyDragging && "opacity-50 shadow-2xl"
        )}
      >
        {/* Category accent bar */}
        <div
          data-testid="category-accent"
          className={cn("absolute top-0 left-0 right-0 h-1", accentColor)}
        />

        {/* Edit mode controls */}
        {isEditMode && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {/* Drag handle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-grab active:cursor-grabbing"
                  aria-label="Drag to reorder"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Drag to reorder</TooltipContent>
            </Tooltip>

            {/* Settings button (only if configurable) */}
            {definition.configurable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Widget settings"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Widget settings</TooltipContent>
              </Tooltip>
            )}

            {/* Remove button (only if removable) */}
            {definition.removable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    aria-label="Remove widget"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove widget</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Widget header */}
        <div className="flex items-center gap-2 p-4 pb-2 pt-3">
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
          onConfigChange={handleConfigChange}
          SettingsComponent={definition.settingsComponent}
        />
      )}
    </>
  );
}
