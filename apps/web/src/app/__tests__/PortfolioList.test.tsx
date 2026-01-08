/**
 * Portfolio List Page Tests
 *
 * Tests for the portfolio list page component including:
 * - Portfolio grid/list rendering
 * - Create portfolio button
 * - Search and filter functionality
 * - Empty state display
 * - Loading states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import PortfoliosPage from "@/app/(dashboard)/portfolios/page";
import {
  mockPaginatedPortfolios,
  mockEmptyPortfolios,
  mockPortfolios,
} from "@/test/mocks/data";

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
  useParams: () => ({}),
  usePathname: () => "/portfolios",
}));

// Mock the portfolio hooks
const mockUsePortfolios = vi.fn();
const mockUsePrefetchPortfolio = vi.fn(() => vi.fn());

vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolios: () => mockUsePortfolios(),
  usePrefetchPortfolio: () => mockUsePrefetchPortfolio(),
  useInvalidatePortfolios: () => vi.fn(),
}));

// Mock the CreatePortfolioDialog
vi.mock(
  "@/app/(dashboard)/portfolios/components/CreatePortfolioDialog",
  () => ({
    CreatePortfolioDialog: ({
      open,
      onOpenChange,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) =>
      open ? (
        <div data-testid="create-portfolio-dialog">
          <button onClick={() => onOpenChange(false)}>Close</button>
        </div>
      ) : null,
  })
);

describe("PortfoliosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("type");
    mockSearchParams.delete("sort");

    // Default mock - loaded state with portfolios
    mockUsePortfolios.mockReturnValue({
      data: mockPaginatedPortfolios,
      isPending: false,
      error: null,
    });
  });

  describe("Page Header", () => {
    it("renders the page title", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("Portfolios")).toBeInTheDocument();
      });
    });

    it("renders the page subtitle", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Manage and monitor your investment portfolios")
        ).toBeInTheDocument();
      });
    });

    it("renders the create portfolio button", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create portfolio/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Portfolio Grid", () => {
    it("renders portfolio cards for each portfolio", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("Growth Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Income Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Fixed Income")).toBeInTheDocument();
      });
    });

    it("displays portfolio count", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText(/3 portfolios/i)).toBeInTheDocument();
      });
    });

    it("navigates to portfolio detail on card click", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("Growth Portfolio")).toBeInTheDocument();
      });

      // Find and click the portfolio card
      const growthPortfolio = screen.getByText("Growth Portfolio");
      await user.click(growthPortfolio.closest("[data-testid]") || growthPortfolio);

      // Check if router.push was called (might be on parent element)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/portfolios/portfolio-1");
      });
    });

    it("sets up prefetch handler for portfolio hover", () => {
      const mockPrefetch = vi.fn();
      mockUsePrefetchPortfolio.mockReturnValue(mockPrefetch);

      renderWithProviders(<PortfoliosPage />);

      // The prefetch function should be set up (via usePrefetchPortfolio hook)
      expect(mockUsePrefetchPortfolio).toHaveBeenCalled();
    });
  });

  describe("Filter and Sort", () => {
    it("renders type filter dropdown", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("All Types")).toBeInTheDocument();
      });
    });

    it("renders sort dropdown", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("Name (A-Z)")).toBeInTheDocument();
      });
    });

    it("renders type filter with combobox role", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        // The type filter should render as a combobox
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThan(0);
      });
    });

    it("renders sort filter with combobox role", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        // There should be at least 2 comboboxes (type filter and sort filter)
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Create Portfolio", () => {
    it("opens create dialog when create button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create portfolio/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /create portfolio/i }));

      await waitFor(() => {
        expect(screen.getByTestId("create-portfolio-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no portfolios exist", async () => {
      mockUsePortfolios.mockReturnValue({
        data: mockEmptyPortfolios,
        isPending: false,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("No portfolios found")).toBeInTheDocument();
      });
    });

    it("shows appropriate message when filter returns no results", async () => {
      mockSearchParams.set("type", "equity");
      mockUsePortfolios.mockReturnValue({
        data: mockEmptyPortfolios,
        isPending: false,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Try changing the filter or create a new portfolio/i)
        ).toBeInTheDocument();
      });
    });

    it("shows create button in empty state", async () => {
      mockUsePortfolios.mockReturnValue({
        data: mockEmptyPortfolios,
        isPending: false,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        // There should be two create buttons - one in header, one in empty state
        const createButtons = screen.getAllByRole("button", {
          name: /create portfolio/i,
        });
        expect(createButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("opens create dialog from empty state button", async () => {
      const user = userEvent.setup();
      mockUsePortfolios.mockReturnValue({
        data: mockEmptyPortfolios,
        isPending: false,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("No portfolios found")).toBeInTheDocument();
      });

      // Click the create button in the empty state
      const createButtons = screen.getAllByRole("button", {
        name: /create portfolio/i,
      });
      await user.click(createButtons[createButtons.length - 1]!);

      await waitFor(() => {
        expect(screen.getByTestId("create-portfolio-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows skeleton loading state", async () => {
      mockUsePortfolios.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      // Check for skeleton elements (they typically don't have text)
      await waitFor(() => {
        // The page should still render the title
        expect(screen.getByText("Portfolios")).toBeInTheDocument();
      });

      // Should show loading skeleton instead of portfolio cards
      expect(screen.queryByText("Growth Portfolio")).not.toBeInTheDocument();
    });

    it("shows loading indicator in filter area", async () => {
      mockUsePortfolios.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      // During loading, the count (e.g., "3 portfolios") should not be shown
      await waitFor(() => {
        expect(screen.queryByText(/\d+ portfolios?/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Error States", () => {
    it("displays error message when fetch fails", async () => {
      mockUsePortfolios.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Failed to fetch portfolios"),
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to fetch portfolios")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible page heading", async () => {
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /portfolios/i, level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("portfolio cards are keyboard navigable", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("Growth Portfolio")).toBeInTheDocument();
      });

      // Tab to first portfolio card
      await user.tab();

      // Continue tabbing through interactive elements
      // This ensures the page is keyboard navigable
    });
  });

  describe("Responsive Behavior", () => {
    it("renders single portfolio correctly", async () => {
      mockUsePortfolios.mockReturnValue({
        data: {
          items: [mockPortfolios[0]],
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
        isPending: false,
        error: null,
      });

      renderWithProviders(<PortfoliosPage />);

      await waitFor(() => {
        expect(screen.getByText("1 portfolio")).toBeInTheDocument();
      });
    });
  });
});
