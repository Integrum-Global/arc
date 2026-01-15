/**
 * WidgetSettingsModal Component
 *
 * Modal dialog for configuring individual widget settings.
 * Provides a generic interface for widget-specific configuration.
 *
 * Features:
 * - Renders settings component passed as prop
 * - Local state buffering (changes don't commit until Save)
 * - Cancel reverts to original config
 * - Graceful handling when no settings component is provided
 * - Accessible: Escape to close, focus management
 * - Max width: sm:max-w-md (448px)
 *
 * @see TODO-DASH-006 for acceptance criteria
 * @see docs/02-plans/11-dashboard-customization/02-components.md Section 4
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WidgetSettingsProps } from "@/features/dashboard/types";

// =============================================================================
// Types
// =============================================================================

export interface WidgetSettingsModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback to control modal open state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Title displayed in the modal header
   */
  title: string;

  /**
   * Current widget configuration
   */
  config: Record<string, unknown>;

  /**
   * Callback called when user saves changes
   * @param config - Updated configuration object
   */
  onConfigChange: (config: Record<string, unknown>) => void;

  /**
   * Optional settings component to render
   * If undefined, displays a "no settings" message
   */
  SettingsComponent?: React.ComponentType<WidgetSettingsProps>;
}

// =============================================================================
// Component
// =============================================================================

export function WidgetSettingsModal({
  open,
  onOpenChange,
  title,
  config,
  onConfigChange,
  SettingsComponent,
}: WidgetSettingsModalProps) {
  // Local state to buffer changes until save
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(config);

  // Reset local config when modal opens or config prop changes
  useEffect(() => {
    if (open) {
      setLocalConfig(config);
    }
  }, [open, config]);

  /**
   * Handle save button click
   * Commits local changes to parent and closes modal
   */
  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  /**
   * Handle cancel button click
   * Discards local changes and closes modal
   */
  const handleCancel = () => {
    setLocalConfig(config); // Reset to original
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {SettingsComponent ? (
            <SettingsComponent
              config={localConfig}
              onConfigChange={setLocalConfig}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No configurable settings for this widget.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
