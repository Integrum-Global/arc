"use client";

/**
 * Dashboard Page
 *
 * Main dashboard view for the ARC Investment Platform.
 * Refactored to use the new widget-based layout system with:
 * - DashboardHeader for view/edit mode controls
 * - DashboardGrid for drag-and-drop widget layout
 * - WidgetPicker for adding new widgets
 * - Keyboard shortcuts for quick actions
 *
 * Keyboard Shortcuts:
 * - e: Toggle edit mode
 * - Escape: Exit edit mode
 * - a: Add widget (edit mode)
 * - Cmd/Ctrl+S: Save layout (edit mode)
 * - Delete/Backspace: Remove selected widget (edit mode)
 * - ?: Show keyboard shortcuts help
 *
 * Backward compatible: Uses existing widget components (SummaryCards,
 * AllocationSection, etc.) wrapped in the new widget container system.
 */

import { useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { WidgetPicker } from "@/components/dashboard/WidgetPicker";
import {
  useDashboardStore,
  useIsEditMode,
  useSelectedWidget,
} from "@/stores/dashboardStore";
import { useDashboardShortcuts } from "@/hooks/useDashboardShortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

// =============================================================================
// Keyboard Shortcuts Help Dialog
// =============================================================================

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Array<{
    key: string;
    description: string;
    scope: "global" | "edit-mode";
  }>;
}

function ShortcutsHelpDialog({
  open,
  onOpenChange,
  shortcuts,
}: ShortcutsHelpDialogProps) {
  const globalShortcuts = shortcuts.filter((s) => s.scope === "global");
  const editModeShortcuts = shortcuts.filter((s) => s.scope === "edit-mode");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to quickly navigate and edit your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Global Shortcuts */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Global
            </h4>
            <div className="space-y-1">
              {globalShortcuts.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.key}
                  keyLabel={shortcut.key}
                  description={shortcut.description}
                />
              ))}
            </div>
          </div>

          {/* Edit Mode Shortcuts */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Edit Mode Only
            </h4>
            <div className="space-y-1">
              {editModeShortcuts.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.key}
                  keyLabel={shortcut.key}
                  description={shortcut.description}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutRowProps {
  keyLabel: string;
  description: string;
}

function ShortcutRow({ keyLabel, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
        {keyLabel}
      </kbd>
    </div>
  );
}

// =============================================================================
// Dashboard Page Component
// =============================================================================

export default function DashboardPage() {
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const isEditMode = useIsEditMode();
  const selectedWidgetId = useSelectedWidget();

  // Get store actions
  const setEditMode = useDashboardStore((state) => state.setEditMode);
  const markAsSynced = useDashboardStore((state) => state.markAsSynced);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const selectWidget = useDashboardStore((state) => state.selectWidget);

  // ---------------------------------------------------------------------------
  // Keyboard Shortcut Handlers
  // ---------------------------------------------------------------------------

  const handleToggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  const handleExitEditMode = useCallback(() => {
    setEditMode(false);
  }, [setEditMode]);

  const handleOpenWidgetPicker = useCallback(() => {
    setWidgetPickerOpen(true);
  }, []);

  const handleSaveLayout = useCallback(() => {
    markAsSynced();
    setEditMode(false);
  }, [markAsSynced, setEditMode]);

  const handleRemoveSelectedWidget = useCallback(() => {
    if (selectedWidgetId) {
      removeWidget(selectedWidgetId);
      selectWidget(null);
    }
  }, [selectedWidgetId, removeWidget, selectWidget]);

  const handleShowShortcutsHelp = useCallback(() => {
    setShortcutsHelpOpen(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Initialize Keyboard Shortcuts
  // ---------------------------------------------------------------------------

  const { shortcuts } = useDashboardShortcuts({
    onToggleEditMode: handleToggleEditMode,
    onExitEditMode: handleExitEditMode,
    onOpenWidgetPicker: handleOpenWidgetPicker,
    onSaveLayout: handleSaveLayout,
    onRemoveSelectedWidget: handleRemoveSelectedWidget,
    onShowShortcutsHelp: handleShowShortcutsHelp,
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6" data-testid="dashboard-page">
        {/* Dashboard Header - toggles between view/edit mode */}
        <DashboardHeader onOpenWidgetPicker={handleOpenWidgetPicker} />

        {/* Main widget grid with drag-and-drop support */}
        <DashboardGrid />

        {/* Widget picker sidebar for adding new widgets */}
        <WidgetPicker
          open={widgetPickerOpen}
          onOpenChange={setWidgetPickerOpen}
        />

        {/* Keyboard shortcuts help dialog */}
        <ShortcutsHelpDialog
          open={shortcutsHelpOpen}
          onOpenChange={setShortcutsHelpOpen}
          shortcuts={shortcuts}
        />

        {/* Edit mode hint - floating at bottom of page */}
        {isEditMode && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm z-50">
            Drag widgets to reorder - Press{" "}
            <kbd className="px-1.5 py-0.5 mx-1 text-xs font-mono bg-primary-foreground/20 rounded">
              ?
            </kbd>{" "}
            for shortcuts
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
