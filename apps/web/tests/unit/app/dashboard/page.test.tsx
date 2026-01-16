/**
 * Unit Tests for Dashboard Page Refactor
 *
 * Test Strategy:
 * - Test page renders with new widget system components
 * - Test DashboardHeader presence and functionality
 * - Test DashboardGrid presence
 * - Test WidgetPicker opens/closes correctly
 * - Test edit mode hint visibility
 * - Test backward compatibility with default layout
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import { useDashboardStore } from "@/stores/dashboardStore";

// =============================================================================
// Mocks
// =============================================================================

// Mock the dashboard data hook
vi.mock("@/hooks", () => ({
  useDashboardData: vi.fn(() => ({
    summary: {
      totalValue: 1250000,
      dailyChange: 12500,
      dailyChangePercent: 1.01,
      ytdReturn: 8.5,
      healthScore: 85,
    },
    allocations: [],
    topHoldings: [],
    performanceHistory: [],
    activeAlerts: [],
    brief: null,
    isLoading: false,
    loadingStates: {
      portfolios: false,
      alerts: false,
      brief: false,
    },
    freshness: {
      isRefreshing: false,
      lastRefresh: new Date().toISOString(),
    },
    refetch: vi.fn(),
  })),
  useMediaQuery: vi.fn(() => false),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/dashboard"),
}));

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Render with QueryClient provider
 */
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe("DashboardPage", () => {
  beforeEach(() => {
    // Reset dashboard store to initial state before each test
    useDashboardStore.setState({
      widgets: useDashboardStore.getState().widgets,
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

  describe("Page Rendering", () => {
    it("renders without errors", () => {
      renderWithProviders(<DashboardPage />);

      // Page should render with main container
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders DashboardHeader component", () => {
      renderWithProviders(<DashboardPage />);

      // Header should be present with title
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders DashboardGrid component", () => {
      renderWithProviders(<DashboardPage />);

      // Grid container should be present
      expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
    });

    it("renders Edit button in view mode", () => {
      renderWithProviders(<DashboardPage />);

      // Edit button should be visible in header
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("enters edit mode when Edit button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      // Should show edit mode header
      await waitFor(() => {
        expect(screen.getByText("Editing Dashboard")).toBeInTheDocument();
      });
    });

    it("shows Add Widget button in edit mode", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add widget/i })
        ).toBeInTheDocument();
      });
    });

    it("shows Cancel and Done buttons in edit mode", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /done/i })
        ).toBeInTheDocument();
      });
    });

    it("shows edit mode hint at bottom of page", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByText(/drag widgets to reorder/i)
        ).toBeInTheDocument();
      });
    });

    it("exits edit mode when Done button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Editing Dashboard")).toBeInTheDocument();
      });

      // Exit edit mode
      const doneButton = screen.getByRole("button", { name: /done/i });
      await user.click(doneButton);

      await waitFor(() => {
        expect(screen.queryByText("Editing Dashboard")).not.toBeInTheDocument();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });
    });

    it("exits edit mode when Cancel button is clicked (no changes)", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Editing Dashboard")).toBeInTheDocument();
      });

      // Exit via cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Editing Dashboard")).not.toBeInTheDocument();
      });
    });
  });

  describe("WidgetPicker", () => {
    it("opens WidgetPicker when Add Widget button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add widget/i })
        ).toBeInTheDocument();
      });

      // Click Add Widget button (use getByRole to specifically target the button)
      const addButton = screen.getByRole("button", { name: /add widget/i });
      await user.click(addButton);

      await waitFor(() => {
        // Sheet should be open - check for the sheet dialog
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        // Sheet title should appear (there will be two "Add Widget" texts - button and title)
        const titles = screen.getAllByText("Add Widget");
        expect(titles.length).toBe(2); // Button and sheet title
      });
    });

    it("closes WidgetPicker when close button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add widget/i })
        ).toBeInTheDocument();
      });

      // Open widget picker
      const addButton = screen.getByRole("button", { name: /add widget/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close the sheet (find close button in sheet)
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        // Sheet should close - dialog should not be visible
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("shows widget categories in WidgetPicker", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      // Open widget picker
      const addButton = screen.getByRole("button", { name: /add widget/i });
      await user.click(addButton);

      await waitFor(() => {
        // Categories should be visible - text is "Portfolio" but CSS makes it uppercase
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
      });
    });
  });

  describe("Unsaved Changes", () => {
    it("shows Unsaved changes badge when changes are made", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      // Simulate making a change by updating store directly
      useDashboardStore.setState({ hasUnsavedChanges: true });

      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });
  });

  describe("Backward Compatibility", () => {
    it("uses default layout when no custom layout saved", () => {
      renderWithProviders(<DashboardPage />);

      // Default widgets should be rendered
      const store = useDashboardStore.getState();
      expect(store.widgets.length).toBeGreaterThan(0);
    });

    it("renders existing widget components as widget content", () => {
      renderWithProviders(<DashboardPage />);

      // The grid should contain widget containers
      const grid = screen.getByTestId("dashboard-grid");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("renders properly on desktop", () => {
      renderWithProviders(<DashboardPage />);

      // Page should render with full layout
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
    });
  });
});
