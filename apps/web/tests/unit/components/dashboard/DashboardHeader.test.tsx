/**
 * Unit Tests for DashboardHeader
 *
 * Tests the dashboard header component that toggles between view and edit modes
 * with appropriate actions for each mode.
 *
 * TDD: Tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

// =============================================================================
// Mock Dashboard Store
// =============================================================================

const mockSetEditMode = vi.fn();
const mockMarkAsSynced = vi.fn();
const mockResetToDefault = vi.fn();
const mockIsEditMode = vi.fn(() => false);
const mockIsDirty = vi.fn(() => false);

vi.mock("@/stores/dashboardStore", () => ({
  useDashboardStore: (selector: (state: unknown) => unknown) => {
    const state = {
      isEditMode: mockIsEditMode(),
      hasUnsavedChanges: mockIsDirty(),
      setEditMode: mockSetEditMode,
      markAsSynced: mockMarkAsSynced,
      resetToDefault: mockResetToDefault,
    };
    return selector(state);
  },
  useIsEditMode: () => mockIsEditMode(),
  useHasUnsavedChanges: () => mockIsDirty(),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe("DashboardHeader", () => {
  const defaultProps = {
    onOpenWidgetPicker: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEditMode.mockReturnValue(false);
    mockIsDirty.mockReturnValue(false);
  });

  // ===========================================================================
  // View Mode Rendering
  // ===========================================================================

  describe("View Mode Rendering", () => {
    it("should render Dashboard title in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });

    it("should render description text in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByText("Overview of your portfolio performance")).toBeInTheDocument();
    });

    it("should render Export button in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
    });

    it("should render Edit button in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("should NOT render Add Widget button in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /add widget/i })).not.toBeInTheDocument();
    });

    it("should NOT render Cancel button in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("should NOT render Done button in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /done/i })).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edit Mode Rendering
  // ===========================================================================

  describe("Edit Mode Rendering", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
    });

    it("should render Editing Dashboard title in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("heading", { name: "Editing Dashboard" })).toBeInTheDocument();
    });

    it("should render helper text in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(
        screen.getByText(/drag widgets to rearrange/i)
      ).toBeInTheDocument();
    });

    it("should render Add Widget button in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("button", { name: /add widget/i })).toBeInTheDocument();
    });

    it("should render Cancel button in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should render Done button in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
    });

    it("should NOT render Export button in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    });

    it("should NOT render Edit button in edit mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      // Edit button should not be present - "Edit" won't match because we're looking for an Edit button
      expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Unsaved Changes Badge
  // ===========================================================================

  describe("Unsaved Changes Badge", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
    });

    it("should show Unsaved changes badge when isDirty is true", () => {
      mockIsDirty.mockReturnValue(true);
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    });

    it("should NOT show Unsaved changes badge when isDirty is false", () => {
      mockIsDirty.mockReturnValue(false);
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edit Button Interaction
  // ===========================================================================

  describe("Edit Button Interaction", () => {
    it("should call setEditMode(true) when Edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(mockSetEditMode).toHaveBeenCalledWith(true);
    });
  });

  // ===========================================================================
  // Add Widget Button Interaction
  // ===========================================================================

  describe("Add Widget Button Interaction", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
    });

    it("should call onOpenWidgetPicker when Add Widget button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenWidgetPicker = vi.fn();
      render(<DashboardHeader onOpenWidgetPicker={onOpenWidgetPicker} />);

      const addWidgetButton = screen.getByRole("button", { name: /add widget/i });
      await user.click(addWidgetButton);

      expect(onOpenWidgetPicker).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Done Button Interaction
  // ===========================================================================

  describe("Done Button Interaction", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
    });

    it("should call markAsSynced and setEditMode(false) when Done button is clicked", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const doneButton = screen.getByRole("button", { name: /done/i });
      await user.click(doneButton);

      expect(mockMarkAsSynced).toHaveBeenCalled();
      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // Cancel Button Interaction (No Unsaved Changes)
  // ===========================================================================

  describe("Cancel Button Interaction (No Unsaved Changes)", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
      mockIsDirty.mockReturnValue(false);
    });

    it("should call setEditMode(false) directly when not dirty", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });

    it("should NOT show discard dialog when not dirty", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Cancel Button Interaction (With Unsaved Changes)
  // ===========================================================================

  describe("Cancel Button Interaction (With Unsaved Changes)", () => {
    beforeEach(() => {
      mockIsEditMode.mockReturnValue(true);
      mockIsDirty.mockReturnValue(true);
    });

    it("should show discard dialog when dirty", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("should show correct dialog title", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText("Discard changes?")).toBeInTheDocument();
    });

    it("should show correct dialog description", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(
        screen.getByText(/you have unsaved changes to your dashboard layout/i)
      ).toBeInTheDocument();
    });

    it("should have Keep editing button in dialog", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByRole("button", { name: /keep editing/i })).toBeInTheDocument();
    });

    it("should have Discard changes button in dialog", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByRole("button", { name: /discard changes/i })).toBeInTheDocument();
    });

    it("should close dialog when Keep editing is clicked", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      // Open dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Click Keep editing
      const keepEditingButton = screen.getByRole("button", { name: /keep editing/i });
      await user.click(keepEditingButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });

      // setEditMode should NOT have been called for exit
      expect(mockSetEditMode).not.toHaveBeenCalledWith(false);
    });

    it("should call setEditMode(false) and close dialog when Discard changes is clicked", async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} />);

      // Open dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Click Discard changes
      const discardButton = screen.getByRole("button", { name: /discard changes/i });
      await user.click(discardButton);

      expect(mockSetEditMode).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible heading in view mode", () => {
      render(<DashboardHeader {...defaultProps} />);

      expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    });

    it("should have accessible heading in edit mode", () => {
      mockIsEditMode.mockReturnValue(true);
      render(<DashboardHeader {...defaultProps} />);

      expect(
        screen.getByRole("heading", { level: 1, name: "Editing Dashboard" })
      ).toBeInTheDocument();
    });

    it("should have accessible buttons with icons and text", () => {
      mockIsEditMode.mockReturnValue(true);
      render(<DashboardHeader {...defaultProps} />);

      // All buttons should have accessible names
      expect(screen.getByRole("button", { name: /add widget/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Icon Rendering
  // ===========================================================================

  describe("Icon Rendering", () => {
    it("should render Settings icon in Edit button", () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      const icon = editButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render Plus icon in Add Widget button", () => {
      mockIsEditMode.mockReturnValue(true);
      const { container } = render(<DashboardHeader {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: /add widget/i });
      const icon = addButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render X icon in Cancel button", () => {
      mockIsEditMode.mockReturnValue(true);
      const { container } = render(<DashboardHeader {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const icon = cancelButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render Check icon in Done button", () => {
      mockIsEditMode.mockReturnValue(true);
      const { container } = render(<DashboardHeader {...defaultProps} />);

      const doneButton = screen.getByRole("button", { name: /done/i });
      const icon = doneButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render Download icon in Export button", () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /export/i });
      const icon = exportButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });
});
