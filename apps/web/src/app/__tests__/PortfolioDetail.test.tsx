/**
 * Portfolio Detail Page Tests
 *
 * Tests for the portfolio detail page component including:
 * - Tab rendering (Overview, Holdings, Transactions, Performance, Health)
 * - Tab switching functionality
 * - Portfolio header with name and value
 * - Loading and error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import PortfolioDetailPage from "@/app/(dashboard)/portfolios/[id]/page";
import { mockSinglePortfolio } from "@/test/mocks/data";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  useParams: () => ({ id: "portfolio-1" }),
  usePathname: () => "/portfolios/portfolio-1",
}));

// Mock portfolio hooks
const mockUsePortfolio = vi.fn();
const mockRefetch = vi.fn();
const mockInvalidatePortfolios = vi.fn();

vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolio: () => mockUsePortfolio(),
  useInvalidatePortfolios: () => mockInvalidatePortfolios,
  usePrefetchPortfolio: () => vi.fn(),
}));

// Mock tab components
vi.mock("@/app/(dashboard)/portfolios/components/OverviewTab", () => ({
  OverviewTab: ({ portfolioId }: { portfolioId: string }) => (
    <div data-testid="overview-tab">Overview Tab for {portfolioId}</div>
  ),
}));

vi.mock("@/app/(dashboard)/portfolios/components/HoldingsTab", () => ({
  HoldingsTab: ({ portfolioId }: { portfolioId: string }) => (
    <div data-testid="holdings-tab">Holdings Tab for {portfolioId}</div>
  ),
}));

vi.mock("@/app/(dashboard)/portfolios/components/TransactionsTab", () => ({
  TransactionsTab: ({
    portfolioId,
    onAddTransaction,
  }: {
    portfolioId: string;
    onAddTransaction: () => void;
  }) => (
    <div data-testid="transactions-tab">
      Transactions Tab for {portfolioId}
      <button onClick={onAddTransaction}>Add Transaction</button>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/portfolios/components/PerformanceTab", () => ({
  PerformanceTab: ({ portfolioId }: { portfolioId: string }) => (
    <div data-testid="performance-tab">Performance Tab for {portfolioId}</div>
  ),
}));

vi.mock("@/app/(dashboard)/portfolios/components/HealthTab", () => ({
  HealthTab: ({ portfolioId }: { portfolioId: string }) => (
    <div data-testid="health-tab">Health Tab for {portfolioId}</div>
  ),
}));

// Mock AddTransactionDialog
vi.mock("@/app/(dashboard)/portfolios/components/AddTransactionDialog", () => ({
  AddTransactionDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="add-transaction-dialog">
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    ) : null,
}));

describe("PortfolioDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("tab");

    // Default mock - loaded state with portfolio data
    mockUsePortfolio.mockReturnValue({
      data: mockSinglePortfolio,
      isPending: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe("Portfolio Header", () => {
    it("renders portfolio name as page title", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Growth Portfolio")).toBeInTheDocument();
      });
    });

    it("renders portfolio description as subtitle", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Long-term growth focused investments")
        ).toBeInTheDocument();
      });
    });

    it("renders back to portfolios button", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back to portfolios/i })
        ).toBeInTheDocument();
      });
    });

    it("navigates back to portfolios list when back button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back to portfolios/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /back to portfolios/i }));

      expect(mockPush).toHaveBeenCalledWith("/portfolios");
    });

    it("renders refresh button", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        // Find refresh button by the icon (it's an icon-only button)
        const buttons = screen.getAllByRole("button");
        const refreshButton = buttons.find((btn) =>
          btn.querySelector('svg[class*="h-4 w-4"]')
        );
        expect(refreshButton).toBeTruthy();
      });
    });

    it("renders add transaction button", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        // There may be multiple Add Transaction buttons
        const addButtons = screen.getAllByRole("button", { name: /add transaction/i });
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Tab Rendering", () => {
    it("renders all five tabs", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /holdings/i })).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /transactions/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /performance/i })
        ).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /health/i })).toBeInTheDocument();
      });
    });

    it("shows Overview tab content by default", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
      });
    });

    it("Overview tab is selected by default", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        const overviewTab = screen.getByRole("tab", { name: /overview/i });
        expect(overviewTab).toHaveAttribute("data-state", "active");
      });
    });
  });

  describe("Tab Switching", () => {
    it("navigates to Holdings tab URL when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /holdings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: /holdings/i }));

      expect(mockPush).toHaveBeenCalledWith("/portfolios/portfolio-1?tab=holdings");
    });

    it("navigates to Transactions tab URL when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /transactions/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: /transactions/i }));

      expect(mockPush).toHaveBeenCalledWith(
        "/portfolios/portfolio-1?tab=transactions"
      );
    });

    it("navigates to Performance tab URL when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /performance/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: /performance/i }));

      expect(mockPush).toHaveBeenCalledWith(
        "/portfolios/portfolio-1?tab=performance"
      );
    });

    it("navigates to Health tab URL when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /health/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: /health/i }));

      expect(mockPush).toHaveBeenCalledWith("/portfolios/portfolio-1?tab=health");
    });

    it("removes tab param when switching back to Overview", async () => {
      mockSearchParams.set("tab", "holdings");
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: /overview/i }));

      expect(mockPush).toHaveBeenCalledWith("/portfolios/portfolio-1");
    });
  });

  describe("URL Tab State", () => {
    it("shows Holdings tab when URL has tab=holdings", async () => {
      mockSearchParams.set("tab", "holdings");
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("holdings-tab")).toBeInTheDocument();
      });
    });

    it("shows Transactions tab when URL has tab=transactions", async () => {
      mockSearchParams.set("tab", "transactions");
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("transactions-tab")).toBeInTheDocument();
      });
    });

    it("shows Performance tab when URL has tab=performance", async () => {
      mockSearchParams.set("tab", "performance");
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("performance-tab")).toBeInTheDocument();
      });
    });

    it("shows Health tab when URL has tab=health", async () => {
      mockSearchParams.set("tab", "health");
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("health-tab")).toBeInTheDocument();
      });
    });
  });

  describe("Add Transaction Dialog", () => {
    it("opens add transaction dialog when header button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        // There may be multiple "Add Transaction" buttons (header + tabs)
        const addButtons = screen.getAllByRole("button", { name: /add transaction/i });
        expect(addButtons.length).toBeGreaterThan(0);
      });

      // Click the first Add Transaction button (header)
      const addButtons = screen.getAllByRole("button", { name: /add transaction/i });
      await user.click(addButtons[0]!);

      await waitFor(() => {
        expect(
          screen.getByTestId("add-transaction-dialog")
        ).toBeInTheDocument();
      });
    });

    it("opens dialog from transactions tab callback", async () => {
      mockSearchParams.set("tab", "transactions");
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId("transactions-tab")).toBeInTheDocument();
      });

      // Click any Add Transaction button (there may be multiple)
      const addButtons = screen.getAllByRole("button", { name: /add transaction/i });
      await user.click(addButtons[addButtons.length - 1]!);

      await waitFor(() => {
        expect(
          screen.getByTestId("add-transaction-dialog")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows skeleton loading state when fetching portfolio", async () => {
      mockUsePortfolio.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      // During loading, the portfolio name should not be visible
      expect(screen.queryByText("Growth Portfolio")).not.toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("shows error message when portfolio fetch fails", async () => {
      mockUsePortfolio.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Failed to load portfolio"),
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Portfolio Not Found")).toBeInTheDocument();
      });
    });

    it("shows back button in error state", async () => {
      mockUsePortfolio.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Failed to load portfolio"),
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back to portfolios/i })
        ).toBeInTheDocument();
      });
    });

    it("navigates back from error state", async () => {
      const user = userEvent.setup();
      mockUsePortfolio.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Failed to load portfolio"),
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back to portfolios/i })
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /back to portfolios/i })
      );

      expect(mockPush).toHaveBeenCalledWith("/portfolios");
    });

    it("shows error message text", async () => {
      mockUsePortfolio.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Network error"),
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("Portfolio Without Description", () => {
    it("shows type-based subtitle when no description", async () => {
      mockUsePortfolio.mockReturnValue({
        data: {
          ...mockSinglePortfolio,
          description: undefined,
        },
        isPending: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/equity portfolio/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible page heading with portfolio name", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /growth portfolio/i, level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("tabs have proper ARIA roles", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
        expect(screen.getAllByRole("tab")).toHaveLength(5);
      });
    });

    it("tab panels have proper ARIA roles", async () => {
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tabpanel")).toBeInTheDocument();
      });
    });

    it("tabs are keyboard navigable", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfolioDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
      });

      // Focus on the tab list
      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      overviewTab.focus();

      expect(overviewTab).toHaveFocus();

      // Arrow right to next tab
      await user.keyboard("{ArrowRight}");

      // Holdings tab should now be focused
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /holdings/i })).toHaveFocus();
      });
    });
  });
});
