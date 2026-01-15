/**
 * Unit Tests for WidgetSettingsModal
 *
 * Tests the modal dialog for configuring individual widget settings.
 * TDD: Tests written before implementation.
 *
 * Test coverage:
 * - Renders widget name and icon in title
 * - Renders settings component if available
 * - Renders "no settings" message if settingsComponent is not provided
 * - Save button calls updateWidgetSettings with correct data
 * - Cancel button closes modal without saving
 * - Local state is isolated from store until save
 * - Modal is accessible (Escape to close)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WidgetSettingsModal } from "@/components/dashboard/WidgetSettingsModal";
import type { WidgetSettingsProps } from "@/features/dashboard/types";

// =============================================================================
// Test Fixtures
// =============================================================================

// Simple settings component for testing
function TestSettingsComponent({ config, onConfigChange }: WidgetSettingsProps) {
  return (
    <div data-testid="settings-form">
      <label htmlFor="test-input">Test Setting</label>
      <input
        id="test-input"
        data-testid="test-input"
        type="text"
        value={(config.testValue as string) || ""}
        onChange={(e) => onConfigChange({ ...config, testValue: e.target.value })}
      />
      <span data-testid="config-display">{JSON.stringify(config)}</span>
    </div>
  );
}

// Default props for tests
const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Performance Widget Settings",
  config: { period: "1Y", showBenchmark: true },
  onConfigChange: vi.fn(),
  SettingsComponent: TestSettingsComponent,
};

describe("WidgetSettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Basic Rendering
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render modal when open is true", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should not render modal when open is false", () => {
      render(<WidgetSettingsModal {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render title in dialog header", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByText("Performance Widget Settings")).toBeInTheDocument();
    });

    it("should render settings component when provided", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByTestId("settings-form")).toBeInTheDocument();
    });

    it("should render 'no settings' message when SettingsComponent is undefined", () => {
      render(
        <WidgetSettingsModal
          {...defaultProps}
          SettingsComponent={undefined}
        />
      );

      expect(
        screen.getByText(/no configurable settings/i)
      ).toBeInTheDocument();
    });

    it("should render Save Changes button", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("should render Cancel button", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Settings Component Integration
  // ===========================================================================

  describe("Settings Component Integration", () => {
    it("should pass initial config to settings component", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      const configDisplay = screen.getByTestId("config-display");
      expect(configDisplay.textContent).toContain("1Y");
      expect(configDisplay.textContent).toContain("showBenchmark");
    });

    it("should update local config when settings component changes", async () => {
      const user = userEvent.setup();
      render(<WidgetSettingsModal {...defaultProps} />);

      const input = screen.getByTestId("test-input");
      await user.type(input, "new value");

      const configDisplay = screen.getByTestId("config-display");
      expect(configDisplay.textContent).toContain("new value");
    });

    it("should not call onConfigChange while editing (local state isolation)", async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      const input = screen.getByTestId("test-input");
      await user.type(input, "new value");

      // Should not have been called yet - changes are local
      expect(onConfigChange).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Save Button Behavior
  // ===========================================================================

  describe("Save Button Behavior", () => {
    it("should call onConfigChange with updated config when Save is clicked", async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      // Make a change
      const input = screen.getByTestId("test-input");
      await user.type(input, "updated");

      // Click save
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(onConfigChange).toHaveBeenCalledTimes(1);
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ testValue: "updated" })
      );
    });

    it("should call onOpenChange(false) when Save is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should save even if no changes were made", async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      // Click save without making changes
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(onConfigChange).toHaveBeenCalledWith(defaultProps.config);
    });
  });

  // ===========================================================================
  // Cancel Button Behavior
  // ===========================================================================

  describe("Cancel Button Behavior", () => {
    it("should call onOpenChange(false) when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should NOT call onConfigChange when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      // Make a change
      const input = screen.getByTestId("test-input");
      await user.type(input, "changed");

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // onConfigChange should NOT be called
      expect(onConfigChange).not.toHaveBeenCalled();
    });

    it("should discard local changes when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      // Make a change
      const input = screen.getByTestId("test-input");
      await user.type(input, "changed");

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen modal
      rerender(
        <WidgetSettingsModal
          {...defaultProps}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Config should be reset to original (no "changed" value)
      const configDisplay = screen.getByTestId("config-display");
      expect(configDisplay.textContent).not.toContain("changed");
    });
  });

  // ===========================================================================
  // Modal Close Behavior
  // ===========================================================================

  describe("Modal Close Behavior", () => {
    it("should call onOpenChange when clicking close button (X)", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      // Find and click the close button (X icon in dialog)
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalled();
    });

    it("should call onOpenChange when pressing Escape key", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      // Press Escape
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalled();
    });

    it("should call onOpenChange when clicking overlay", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      // Click on the overlay (background)
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      if (overlay) {
        await user.click(overlay);
        expect(onOpenChange).toHaveBeenCalled();
      }
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible dialog role", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have accessible title", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      // Dialog should have aria-labelledby pointing to title
      const dialog = screen.getByRole("dialog");
      const title = screen.getByText("Performance Widget Settings");

      // The dialog should be labelled by the title
      expect(dialog).toHaveAccessibleName("Performance Widget Settings");
    });

    it("should focus first focusable element when opened", async () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      // Wait for focus to be set
      await waitFor(() => {
        // Dialog content should contain focused element
        const dialog = screen.getByRole("dialog");
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // No Settings Component
  // ===========================================================================

  describe("No Settings Component", () => {
    it("should display helpful message when no settings available", () => {
      render(
        <WidgetSettingsModal
          {...defaultProps}
          SettingsComponent={undefined}
        />
      );

      expect(
        screen.getByText(/no configurable settings for this widget/i)
      ).toBeInTheDocument();
    });

    it("should still show Save and Cancel buttons even with no settings", () => {
      render(
        <WidgetSettingsModal
          {...defaultProps}
          SettingsComponent={undefined}
        />
      );

      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should close on Save even with no settings component", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WidgetSettingsModal
          {...defaultProps}
          SettingsComponent={undefined}
          onOpenChange={onOpenChange}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // Styling
  // ===========================================================================

  describe("Styling", () => {
    it("should have max-width of sm:max-w-md", () => {
      render(<WidgetSettingsModal {...defaultProps} />);

      const dialogContent = document.querySelector('[data-slot="dialog-content"]');
      expect(dialogContent?.className).toMatch(/sm:max-w-md/);
    });
  });

  // ===========================================================================
  // Config Reset on Reopen
  // ===========================================================================

  describe("Config Reset on Reopen", () => {
    it("should reset to original config when modal reopens after cancel", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <WidgetSettingsModal
          {...defaultProps}
          config={{ testValue: "original" }}
          onOpenChange={onOpenChange}
        />
      );

      // Make a change
      const input = screen.getByTestId("test-input");
      await user.clear(input);
      await user.type(input, "modified");

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Close modal
      rerender(
        <WidgetSettingsModal
          {...defaultProps}
          config={{ testValue: "original" }}
          open={false}
          onOpenChange={onOpenChange}
        />
      );

      // Reopen modal
      rerender(
        <WidgetSettingsModal
          {...defaultProps}
          config={{ testValue: "original" }}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Should show original value, not modified
      const configDisplay = screen.getByTestId("config-display");
      expect(configDisplay.textContent).toContain("original");
      expect(configDisplay.textContent).not.toContain("modified");
    });

    it("should reflect new config when prop changes", () => {
      const { rerender } = render(
        <WidgetSettingsModal
          {...defaultProps}
          config={{ testValue: "initial" }}
        />
      );

      // Verify initial value
      expect(screen.getByTestId("config-display").textContent).toContain("initial");

      // Close and reopen with new config
      rerender(
        <WidgetSettingsModal
          {...defaultProps}
          open={false}
          config={{ testValue: "updated" }}
        />
      );

      rerender(
        <WidgetSettingsModal
          {...defaultProps}
          open={true}
          config={{ testValue: "updated" }}
        />
      );

      // Should show new value
      expect(screen.getByTestId("config-display").textContent).toContain("updated");
    });
  });
});
