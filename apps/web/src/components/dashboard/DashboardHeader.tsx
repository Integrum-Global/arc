/**
 * DashboardHeader Component
 *
 * Header component for the dashboard that toggles between view and edit modes.
 * Provides appropriate actions for each mode:
 *
 * View Mode:
 * - "Dashboard" title with description
 * - "Export" button for data export
 * - "Edit" button to enter edit mode
 *
 * Edit Mode:
 * - "Editing Dashboard" title with helper text
 * - "Unsaved changes" badge when dirty
 * - "Add Widget" button to open WidgetPicker
 * - "Cancel" button (shows discard dialog if dirty)
 * - "Done" button to save and exit edit mode
 */

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

// =============================================================================
// Types
// =============================================================================

export interface DashboardHeaderProps {
  /** Callback to open the WidgetPicker sidebar */
  onOpenWidgetPicker: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function DashboardHeader({ onOpenWidgetPicker }: DashboardHeaderProps) {
  const isEditMode = useDashboardStore((state) => state.isEditMode);
  const isDirty = useDashboardStore((state) => state.hasUnsavedChanges);
  const setEditMode = useDashboardStore((state) => state.setEditMode);
  const markAsSynced = useDashboardStore((state) => state.markAsSynced);
  const resetToDefault = useDashboardStore((state) => state.resetToDefault);

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  /**
   * Enter edit mode
   */
  const enterEditMode = () => {
    setEditMode(true);
  };

  /**
   * Exit edit mode
   * @param save - Whether to save changes
   */
  const exitEditMode = (save: boolean) => {
    if (save) {
      // Mark as synced when saving (clears hasUnsavedChanges)
      markAsSynced();
    }
    setEditMode(false);
  };

  /**
   * Handle Cancel button click
   * - If dirty, show discard confirmation dialog
   * - If not dirty, exit edit mode directly
   */
  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      exitEditMode(false);
    }
  };

  /**
   * Handle Discard changes confirmation
   * - Exit edit mode without saving
   * - Close the dialog
   */
  const handleDiscard = () => {
    exitEditMode(false);
    setShowDiscardDialog(false);
  };

  /**
   * Handle Done button click
   * - Exit edit mode with save
   */
  const handleSave = () => {
    exitEditMode(true);
  };

  // ---------------------------------------------------------------------------
  // Edit Mode Render
  // ---------------------------------------------------------------------------

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
              Drag widgets to rearrange - Click settings to configure - Click X to remove
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onOpenWidgetPicker}
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

        {/* Discard Changes Dialog */}
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

  // ---------------------------------------------------------------------------
  // View Mode Render
  // ---------------------------------------------------------------------------

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
