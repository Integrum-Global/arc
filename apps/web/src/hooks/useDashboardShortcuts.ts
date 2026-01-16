/**
 * useDashboardShortcuts Hook
 *
 * Provides keyboard shortcuts for dashboard customization.
 * Handles cross-platform modifier keys (Cmd on Mac, Ctrl on Windows/Linux).
 *
 * Shortcuts:
 * - e: Toggle edit mode (global)
 * - Escape: Exit edit mode (edit mode only)
 * - a: Open widget picker (edit mode only)
 * - Cmd/Ctrl+S: Save layout (edit mode only)
 * - Delete/Backspace: Remove selected widget (edit mode only, with selection)
 * - ?: Show keyboard shortcuts help (global)
 */

import { useEffect, useCallback, useMemo } from "react";
import {
  useIsEditMode,
  useSelectedWidget,
} from "@/stores/dashboardStore";

// =============================================================================
// Types
// =============================================================================

/**
 * Shortcut definition for display in help dialog
 */
export interface ShortcutDefinition {
  /** Display key label */
  key: string;
  /** Human-readable description */
  description: string;
  /** Scope: global (always active) or edit-mode (only in edit mode) */
  scope: "global" | "edit-mode";
}

/**
 * Callbacks for shortcut actions
 */
export interface UseDashboardShortcutsOptions {
  /** Called when 'e' is pressed to toggle edit mode */
  onToggleEditMode: () => void;
  /** Called when Escape is pressed in edit mode */
  onExitEditMode: () => void;
  /** Called when 'a' is pressed in edit mode to add widget */
  onOpenWidgetPicker: () => void;
  /** Called when Cmd/Ctrl+S is pressed in edit mode */
  onSaveLayout: () => void;
  /** Called when Delete/Backspace is pressed with widget selected in edit mode */
  onRemoveSelectedWidget: () => void;
  /** Called when '?' is pressed to show shortcuts help */
  onShowShortcutsHelp: () => void;
}

/**
 * Hook configuration options
 */
export interface UseDashboardShortcutsConfig {
  /** Disable all shortcuts */
  disabled?: boolean;
}

/**
 * Hook return value
 */
export interface UseDashboardShortcutsReturn {
  /** List of available shortcuts for display */
  shortcuts: ShortcutDefinition[];
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Shortcut definitions for help dialog
 */
const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    key: "e",
    description: "Toggle edit mode",
    scope: "global",
  },
  {
    key: "Escape",
    description: "Exit edit mode",
    scope: "edit-mode",
  },
  {
    key: "a",
    description: "Add widget",
    scope: "edit-mode",
  },
  {
    key: "Cmd/Ctrl+S",
    description: "Save layout",
    scope: "edit-mode",
  },
  {
    key: "Delete",
    description: "Remove selected widget",
    scope: "edit-mode",
  },
  {
    key: "?",
    description: "Show keyboard shortcuts",
    scope: "global",
  },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if the event target is an editable element
 * (input, textarea, or contenteditable)
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  // Check for input and textarea
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }

  // Check for contenteditable
  // Use both isContentEditable property and getAttribute for better compatibility
  if (
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true" ||
    target.getAttribute("contenteditable") === ""
  ) {
    return true;
  }

  return false;
}

/**
 * Check if modifier key is pressed (Cmd on Mac, Ctrl on Windows/Linux)
 */
function hasModifierKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

/**
 * Normalize key to handle case sensitivity
 */
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Dashboard keyboard shortcuts hook
 *
 * @param options - Callback functions for each shortcut action
 * @param config - Optional configuration (e.g., disabled)
 * @returns Shortcut definitions for display
 *
 * @example
 * ```tsx
 * useDashboardShortcuts({
 *   onToggleEditMode: () => setEditMode(!isEditMode),
 *   onExitEditMode: () => setEditMode(false),
 *   onOpenWidgetPicker: () => setWidgetPickerOpen(true),
 *   onSaveLayout: handleSave,
 *   onRemoveSelectedWidget: handleRemove,
 *   onShowShortcutsHelp: () => setShowShortcuts(true),
 * });
 * ```
 */
export function useDashboardShortcuts(
  options: UseDashboardShortcutsOptions,
  config: UseDashboardShortcutsConfig = {}
): UseDashboardShortcutsReturn {
  const { disabled = false } = config;

  // Get state from store
  const isEditMode = useIsEditMode();
  const selectedWidgetId = useSelectedWidget();

  // Memoize callbacks to avoid unnecessary effect re-runs
  const callbacks = useMemo(
    () => ({
      onToggleEditMode: options.onToggleEditMode,
      onExitEditMode: options.onExitEditMode,
      onOpenWidgetPicker: options.onOpenWidgetPicker,
      onSaveLayout: options.onSaveLayout,
      onRemoveSelectedWidget: options.onRemoveSelectedWidget,
      onShowShortcutsHelp: options.onShowShortcutsHelp,
    }),
    [
      options.onToggleEditMode,
      options.onExitEditMode,
      options.onOpenWidgetPicker,
      options.onSaveLayout,
      options.onRemoveSelectedWidget,
      options.onShowShortcutsHelp,
    ]
  );

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (disabled) {
        return;
      }

      // Skip if typing in an editable element
      if (isEditableElement(event.target)) {
        return;
      }

      const key = normalizeKey(event.key);
      const modKey = hasModifierKey(event);

      // -----------------------------------------------------------------------
      // Global Shortcuts (always active)
      // -----------------------------------------------------------------------

      // Toggle edit mode: 'e' (without modifier)
      if (key === "e" && !modKey) {
        event.preventDefault();
        callbacks.onToggleEditMode();
        return;
      }

      // Show shortcuts help: '?'
      if (event.key === "?") {
        event.preventDefault();
        callbacks.onShowShortcutsHelp();
        return;
      }

      // -----------------------------------------------------------------------
      // Edit Mode Only Shortcuts
      // -----------------------------------------------------------------------

      if (!isEditMode) {
        return;
      }

      // Exit edit mode: Escape
      if (event.key === "Escape") {
        event.preventDefault();
        callbacks.onExitEditMode();
        return;
      }

      // Open widget picker: 'a' (without modifier)
      if (key === "a" && !modKey) {
        event.preventDefault();
        callbacks.onOpenWidgetPicker();
        return;
      }

      // Save layout: Cmd/Ctrl+S
      if (key === "s" && modKey) {
        event.preventDefault();
        callbacks.onSaveLayout();
        return;
      }

      // Remove selected widget: Delete or Backspace (with widget selected)
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedWidgetId
      ) {
        event.preventDefault();
        callbacks.onRemoveSelectedWidget();
        return;
      }
    },
    [disabled, isEditMode, selectedWidgetId, callbacks]
  );

  // Set up event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return shortcut definitions for display
  return {
    shortcuts: SHORTCUT_DEFINITIONS,
  };
}
