/**
 * WidgetPicker Component
 *
 * Sidebar sheet component for browsing and adding widgets to the dashboard.
 * Widgets are organized by category with search functionality.
 *
 * Features:
 * - Sheet component (right side, 384px width)
 * - Search input for filtering widgets by name/description
 * - Widgets grouped by category with color-coded headers
 * - Widget cards showing icon, name, description
 * - Add button (disabled if at maxInstances)
 * - "Added" state for widgets at max instances
 * - "Required" badge for non-removable widgets
 */

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
import { Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  WIDGETS,
  WIDGET_CATEGORIES,
  getAllCategories,
  getWidgetsByCategory,
  canAddWidget,
} from "@/components/dashboard/widgets/registry";
import type { WidgetCategory, WidgetDefinition } from "@/components/dashboard/widgets/types";

// =============================================================================
// Types
// =============================================================================

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// Widget Picker Item
// =============================================================================

interface WidgetPickerItemProps {
  widget: WidgetDefinition;
  isAtMax: boolean;
  categoryConfig: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
  onAdd: () => void;
}

function WidgetPickerItem({
  widget,
  isAtMax,
  categoryConfig,
  onAdd,
}: WidgetPickerItemProps) {
  const Icon = widget.icon;

  return (
    <div
      data-testid="widget-card"
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        categoryConfig.bgColor,
        categoryConfig.borderColor
      )}
    >
      {/* Widget icon */}
      <div
        data-testid="widget-icon"
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          "bg-background",
          categoryConfig.color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Widget info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{widget.name}</span>
          {!widget.removable && (
            <Badge variant="outline" className="text-[10px]">
              Required
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {widget.description}
        </p>
      </div>

      {/* Add button */}
      <Button
        size="sm"
        variant={isAtMax ? "secondary" : "outline"}
        disabled={isAtMax}
        onClick={onAdd}
        className="shrink-0"
        aria-label={isAtMax ? `${widget.name} added` : `Add ${widget.name}`}
      >
        {isAtMax ? (
          <>
            <Check data-testid="check-icon" className="h-3 w-3 mr-1" />
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
}

// =============================================================================
// Widget Picker
// =============================================================================

export function WidgetPicker({ open, onOpenChange }: WidgetPickerProps) {
  const widgets = useDashboardStore((state) => state.widgets);
  const addWidget = useDashboardStore((state) => state.addWidget);
  const [search, setSearch] = useState("");

  // Group widgets by category and filter by search
  const groupedWidgets = useMemo(() => {
    const categories = getAllCategories();
    const groups: Record<WidgetCategory, WidgetDefinition[]> = {
      portfolio: [],
      analytics: [],
      intelligence: [],
      actions: [],
    };

    categories.forEach((category) => {
      const categoryWidgets = getWidgetsByCategory(category);

      const filteredWidgets = categoryWidgets.filter((widget) => {
        if (!search) return true;

        const searchLower = search.toLowerCase();
        const nameMatch = widget.name.toLowerCase().includes(searchLower);
        const descMatch = widget.description.toLowerCase().includes(searchLower);

        return nameMatch || descMatch;
      });

      groups[category] = filteredWidgets;
    });

    return groups;
  }, [search]);

  // Check if widget is at max instances
  const isWidgetAtMax = (widgetId: string) => {
    return !canAddWidget(widgetId, widgets);
  };

  // Handle adding a widget
  const handleAddWidget = (widgetId: string) => {
    addWidget(widgetId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Widget</SheetTitle>
        </SheetHeader>

        {/* Search input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Widget list - scrollable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          <div className="space-y-6">
            {(Object.entries(groupedWidgets) as [WidgetCategory, WidgetDefinition[]][])
              .filter(([, categoryWidgets]) => categoryWidgets.length > 0)
              .map(([category, categoryWidgets]) => {
                const categoryConfig = WIDGET_CATEGORIES[category];

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        data-testid="category-dot"
                        className={cn(
                          "w-2 h-2 rounded-full",
                          categoryConfig.color.replace("text-", "bg-").split(" ")[0]
                        )}
                      />
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {categoryConfig.name}
                      </span>
                    </div>

                    {/* Widgets in category */}
                    <div className="space-y-2">
                      {categoryWidgets.map((widget) => (
                        <WidgetPickerItem
                          key={widget.id}
                          widget={widget}
                          isAtMax={isWidgetAtMax(widget.id)}
                          categoryConfig={categoryConfig}
                          onAdd={() => handleAddWidget(widget.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
