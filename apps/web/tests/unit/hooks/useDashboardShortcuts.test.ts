/**
 * Unit Tests for useDashboardShortcuts Hook
 *
 * Tests keyboard shortcuts for dashboard customization:
 * - Toggle edit mode (e)
 * - Exit edit mode (Escape)
 * - Open widget picker (a) - edit mode only
 * - Save layout (Cmd/Ctrl+S) - edit mode only
 * - Remove selected widget (Delete/Backspace) - edit mode only
 * - Show shortcuts help (?)
 *
 * TDD approach: Tests written FIRST before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardShortcuts } from "@/hooks/useDashboardShortcuts";
import { useDashboardStore, DEFAULT_WIDGETS } from "@/stores/dashboardStore";

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Fire a keydown event on the window
 */
function fireKeyDown(
  key: string,
  options: Partial<KeyboardEventInit> = {}
): void {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  window.dispatchEvent(event);
}

/**
 * Fire a keydown event with Cmd key (Mac)
 */
function fireKeyDownWithMeta(key: string): void {
  fireKeyDown(key, { metaKey: true });
}

/**
 * Fire a keydown event with Ctrl key (Windows/Linux)
 */
function fireKeyDownWithCtrl(key: string): void {
  fireKeyDown(key, { ctrlKey: true });
}

/**
 * Create mock callbacks for the hook
 */
function createMockCallbacks() {
  return {
    onToggleEditMode: vi.fn(),
    onExitEditMode: vi.fn(),
    onOpenWidgetPicker: vi.fn(),
    onSaveLayout: vi.fn(),
    onRemoveSelectedWidget: vi.fn(),
    onShowShortcutsHelp: vi.fn(),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("useDashboardShortcuts", () => {
  let callbacks: ReturnType<typeof createMockCallbacks>;

  beforeEach(() => {
    callbacks = createMockCallbacks();

    // Reset store to initial state
    useDashboardStore.setState({
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Basic Hook Behavior
  // ---------------------------------------------------------------------------

  describe("Basic Hook Behavior", () => {
    it("sets up event listener on mount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      renderHook(() => useDashboardShortcuts(callbacks));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it("removes event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useDashboardShortcuts(callbacks));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it("returns shortcut definitions", () => {
      const { result } = renderHook(() => useDashboardShortcuts(callbacks));

      expect(result.current.shortcuts).toBeDefined();
      expect(Array.isArray(result.current.shortcuts)).toBe(true);
      expect(result.current.shortcuts.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Toggle Edit Mode ('e' key)
  // ---------------------------------------------------------------------------

  describe("Toggle Edit Mode ('e' key)", () => {
    it("calls onToggleEditMode when 'e' is pressed", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("e");
      });

      expect(callbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
    });

    it("does not call onToggleEditMode when 'e' is pressed with modifier", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDownWithCtrl("e");
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();

      act(() => {
        fireKeyDownWithMeta("e");
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();
    });

    it("works when already in edit mode (toggle off)", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("e");
      });

      expect(callbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Exit Edit Mode (Escape key)
  // ---------------------------------------------------------------------------

  describe("Exit Edit Mode (Escape key)", () => {
    it("calls onExitEditMode when Escape is pressed in edit mode", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Escape");
      });

      expect(callbacks.onExitEditMode).toHaveBeenCalledTimes(1);
    });

    it("does not call onExitEditMode when Escape is pressed outside edit mode", () => {
      useDashboardStore.setState({ isEditMode: false });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Escape");
      });

      expect(callbacks.onExitEditMode).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Open Widget Picker ('a' key)
  // ---------------------------------------------------------------------------

  describe("Open Widget Picker ('a' key)", () => {
    it("calls onOpenWidgetPicker when 'a' is pressed in edit mode", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("a");
      });

      expect(callbacks.onOpenWidgetPicker).toHaveBeenCalledTimes(1);
    });

    it("does not call onOpenWidgetPicker when 'a' is pressed outside edit mode", () => {
      useDashboardStore.setState({ isEditMode: false });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("a");
      });

      expect(callbacks.onOpenWidgetPicker).not.toHaveBeenCalled();
    });

    it("does not call onOpenWidgetPicker when 'a' is pressed with modifier", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDownWithCtrl("a");
      });

      expect(callbacks.onOpenWidgetPicker).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Save Layout (Cmd/Ctrl+S)
  // ---------------------------------------------------------------------------

  describe("Save Layout (Cmd/Ctrl+S)", () => {
    it("calls onSaveLayout when Cmd+S is pressed in edit mode (Mac)", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDownWithMeta("s");
      });

      expect(callbacks.onSaveLayout).toHaveBeenCalledTimes(1);
    });

    it("calls onSaveLayout when Ctrl+S is pressed in edit mode (Windows)", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDownWithCtrl("s");
      });

      expect(callbacks.onSaveLayout).toHaveBeenCalledTimes(1);
    });

    it("does not call onSaveLayout when Cmd/Ctrl+S is pressed outside edit mode", () => {
      useDashboardStore.setState({ isEditMode: false });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDownWithMeta("s");
      });

      expect(callbacks.onSaveLayout).not.toHaveBeenCalled();
    });

    it("does not call onSaveLayout when 's' is pressed without modifier in edit mode", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("s");
      });

      expect(callbacks.onSaveLayout).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Remove Selected Widget (Delete/Backspace)
  // ---------------------------------------------------------------------------

  describe("Remove Selected Widget (Delete/Backspace)", () => {
    it("calls onRemoveSelectedWidget when Delete is pressed with widget selected in edit mode", () => {
      useDashboardStore.setState({
        isEditMode: true,
        selectedWidgetId: "widget-123",
      });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Delete");
      });

      expect(callbacks.onRemoveSelectedWidget).toHaveBeenCalledTimes(1);
    });

    it("calls onRemoveSelectedWidget when Backspace is pressed with widget selected in edit mode", () => {
      useDashboardStore.setState({
        isEditMode: true,
        selectedWidgetId: "widget-123",
      });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Backspace");
      });

      expect(callbacks.onRemoveSelectedWidget).toHaveBeenCalledTimes(1);
    });

    it("does not call onRemoveSelectedWidget when no widget is selected", () => {
      useDashboardStore.setState({
        isEditMode: true,
        selectedWidgetId: null,
      });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Delete");
      });

      expect(callbacks.onRemoveSelectedWidget).not.toHaveBeenCalled();
    });

    it("does not call onRemoveSelectedWidget outside edit mode", () => {
      useDashboardStore.setState({
        isEditMode: false,
        selectedWidgetId: "widget-123",
      });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("Delete");
      });

      expect(callbacks.onRemoveSelectedWidget).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Show Shortcuts Help ('?' key)
  // ---------------------------------------------------------------------------

  describe("Show Shortcuts Help ('?' key)", () => {
    it("calls onShowShortcutsHelp when '?' is pressed", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("?");
      });

      expect(callbacks.onShowShortcutsHelp).toHaveBeenCalledTimes(1);
    });

    it("calls onShowShortcutsHelp in both view and edit mode", () => {
      // View mode
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("?");
      });

      expect(callbacks.onShowShortcutsHelp).toHaveBeenCalledTimes(1);

      // Reset and test edit mode
      vi.clearAllMocks();
      useDashboardStore.setState({ isEditMode: true });

      act(() => {
        fireKeyDown("?");
      });

      expect(callbacks.onShowShortcutsHelp).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Field Handling
  // ---------------------------------------------------------------------------

  describe("Input Field Handling", () => {
    it("ignores shortcuts when typing in an input element", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      // Create a fake input element as the event target
      const inputElement = document.createElement("input");
      document.body.appendChild(inputElement);

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "e",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: inputElement });
        window.dispatchEvent(event);
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();

      document.body.removeChild(inputElement);
    });

    it("ignores shortcuts when typing in a textarea element", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      const textareaElement = document.createElement("textarea");
      document.body.appendChild(textareaElement);

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "e",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: textareaElement });
        window.dispatchEvent(event);
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();

      document.body.removeChild(textareaElement);
    });

    it("ignores shortcuts when typing in a contenteditable element", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      const editableDiv = document.createElement("div");
      // Use setAttribute for better jsdom compatibility
      editableDiv.setAttribute("contenteditable", "true");
      document.body.appendChild(editableDiv);

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "e",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: editableDiv });
        window.dispatchEvent(event);
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();

      document.body.removeChild(editableDiv);
    });
  });

  // ---------------------------------------------------------------------------
  // Event Prevention
  // ---------------------------------------------------------------------------

  describe("Event Prevention", () => {
    it("prevents default for Cmd/Ctrl+S to avoid browser save dialog", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      const preventDefaultSpy = vi.fn();

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "s",
          metaKey: true,
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "preventDefault", {
          value: preventDefaultSpy,
        });
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("prevents default for Delete/Backspace to avoid browser back navigation", () => {
      useDashboardStore.setState({
        isEditMode: true,
        selectedWidgetId: "widget-123",
      });

      renderHook(() => useDashboardShortcuts(callbacks));

      const preventDefaultSpy = vi.fn();

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Backspace",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "preventDefault", {
          value: preventDefaultSpy,
        });
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // State Change Reactivity
  // ---------------------------------------------------------------------------

  describe("State Change Reactivity", () => {
    it("responds to edit mode changes from the store", () => {
      const { rerender } = renderHook(() => useDashboardShortcuts(callbacks));

      // Initially not in edit mode
      act(() => {
        fireKeyDown("Escape");
      });
      expect(callbacks.onExitEditMode).not.toHaveBeenCalled();

      // Enter edit mode via store
      act(() => {
        useDashboardStore.setState({ isEditMode: true });
      });

      rerender();

      // Now Escape should work
      act(() => {
        fireKeyDown("Escape");
      });
      expect(callbacks.onExitEditMode).toHaveBeenCalledTimes(1);
    });

    it("responds to selected widget changes from the store", () => {
      useDashboardStore.setState({ isEditMode: true, selectedWidgetId: null });

      const { rerender } = renderHook(() => useDashboardShortcuts(callbacks));

      // No widget selected - Delete should not trigger
      act(() => {
        fireKeyDown("Delete");
      });
      expect(callbacks.onRemoveSelectedWidget).not.toHaveBeenCalled();

      // Select a widget via store
      act(() => {
        useDashboardStore.setState({ selectedWidgetId: "widget-456" });
      });

      rerender();

      // Now Delete should work
      act(() => {
        fireKeyDown("Delete");
      });
      expect(callbacks.onRemoveSelectedWidget).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State
  // ---------------------------------------------------------------------------

  describe("Disabled State", () => {
    it("does not trigger shortcuts when disabled", () => {
      const { rerender } = renderHook(
        ({ disabled }) => useDashboardShortcuts(callbacks, { disabled }),
        { initialProps: { disabled: true } }
      );

      act(() => {
        fireKeyDown("e");
      });

      expect(callbacks.onToggleEditMode).not.toHaveBeenCalled();

      // Enable and test again
      rerender({ disabled: false });

      act(() => {
        fireKeyDown("e");
      });

      expect(callbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Shortcut Definitions
  // ---------------------------------------------------------------------------

  describe("Shortcut Definitions", () => {
    it("returns correct shortcut definitions", () => {
      const { result } = renderHook(() => useDashboardShortcuts(callbacks));

      const shortcuts = result.current.shortcuts;

      // Check for expected shortcuts
      const shortcutKeys = shortcuts.map((s) => s.key);
      expect(shortcutKeys).toContain("e");
      expect(shortcutKeys).toContain("Escape");
      expect(shortcutKeys).toContain("a");
      expect(shortcutKeys).toContain("Cmd/Ctrl+S");
      expect(shortcutKeys).toContain("Delete");
      expect(shortcutKeys).toContain("?");
    });

    it("includes descriptions for all shortcuts", () => {
      const { result } = renderHook(() => useDashboardShortcuts(callbacks));

      result.current.shortcuts.forEach((shortcut) => {
        expect(shortcut.description).toBeDefined();
        expect(typeof shortcut.description).toBe("string");
        expect(shortcut.description.length).toBeGreaterThan(0);
      });
    });

    it("includes scope information (global vs edit mode)", () => {
      const { result } = renderHook(() => useDashboardShortcuts(callbacks));

      result.current.shortcuts.forEach((shortcut) => {
        expect(shortcut.scope).toBeDefined();
        expect(["global", "edit-mode"]).toContain(shortcut.scope);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Case Sensitivity
  // ---------------------------------------------------------------------------

  describe("Case Sensitivity", () => {
    it("handles lowercase key presses", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("e");
      });

      expect(callbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
    });

    it("handles uppercase key presses (caps lock)", () => {
      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("E");
      });

      expect(callbacks.onToggleEditMode).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Rapid Keypresses
  // ---------------------------------------------------------------------------

  describe("Multiple Rapid Keypresses", () => {
    it("handles rapid sequential keypresses", () => {
      useDashboardStore.setState({ isEditMode: true });

      renderHook(() => useDashboardShortcuts(callbacks));

      act(() => {
        fireKeyDown("a");
        fireKeyDown("a");
        fireKeyDown("a");
      });

      expect(callbacks.onOpenWidgetPicker).toHaveBeenCalledTimes(3);
    });
  });
});
