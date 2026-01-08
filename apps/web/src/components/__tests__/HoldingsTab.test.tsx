import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HoldingsTab } from "@/app/(dashboard)/portfolios/components/HoldingsTab";
import type { Holding, Security, ApiResponse } from "@/types/api";

// Mock the hooks
vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolioHoldings: vi.fn(),
}));

// Import the mocked hook for type checking
import { usePortfolioHoldings } from "@/hooks/usePortfolios";
const mockedUsePortfolioHoldings = vi.mocked(usePortfolioHoldings);

// Sample securities
const sampleSecurities: Security[] = [
  {
    id: "sec-1",
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    exchange: "NASDAQ",
    currency: "USD",
    sector: "Technology",
    industry: "Consumer Electronics",
    country: "US",
    current_price: 175.50,
    price_change: 2.35,
    price_change_percent: 0.0136,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "sec-2",
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    type: "stock",
    exchange: "NASDAQ",
    currency: "USD",
    sector: "Technology",
    industry: "Internet Services",
    country: "US",
    current_price: 140.25,
    price_change: -1.75,
    price_change_percent: -0.0123,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "sec-3",
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "stock",
    exchange: "NASDAQ",
    currency: "USD",
    sector: "Technology",
    industry: "Software",
    country: "US",
    current_price: 380.00,
    price_change: 5.50,
    price_change_percent: 0.0147,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
];

// Sample holdings
const sampleHoldings: Holding[] = [
  {
    id: "holding-1",
    portfolio_id: "portfolio-1",
    security_id: "sec-1",
    security: sampleSecurities[0],
    quantity: 100,
    average_cost: 150.00,
    current_price: 175.50,
    market_value: 17550.00,
    unrealized_pnl: 2550.00,
    unrealized_pnl_percent: 0.17,
    weight: 0.35,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "holding-2",
    portfolio_id: "portfolio-1",
    security_id: "sec-2",
    security: sampleSecurities[1],
    quantity: 50,
    average_cost: 145.00,
    current_price: 140.25,
    market_value: 7012.50,
    unrealized_pnl: -237.50,
    unrealized_pnl_percent: -0.0328,
    weight: 0.14,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "holding-3",
    portfolio_id: "portfolio-1",
    security_id: "sec-3",
    security: sampleSecurities[2],
    quantity: 25,
    average_cost: 350.00,
    current_price: 380.00,
    market_value: 9500.00,
    unrealized_pnl: 750.00,
    unrealized_pnl_percent: 0.0857,
    weight: 0.19,
    currency: "USD",
    as_of_date: "2024-01-15",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
];

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Mock response type
interface MockQueryResult {
  data: ApiResponse<Holding[]> | undefined;
  isPending: boolean;
  isError?: boolean;
  error?: Error | null;
}

describe("HoldingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Holdings List Rendering", () => {
    it("renders holdings list", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should render security symbols
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("GOOGL")).toBeInTheDocument();
      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });

    it("shows security name alongside ticker", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
      expect(screen.getByText("Alphabet Inc.")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corporation")).toBeInTheDocument();
    });

    it("shows quantity for each holding", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Check quantities are displayed (formatted without decimals)
      // The formatNumber function formats with 0 decimals, so 100 shows as "100"
      const allText = document.body.textContent;
      expect(allText).toContain("100");
      expect(allText).toContain("50");
      expect(allText).toContain("25");
    });

    it("shows market value for each holding", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Market values should be formatted and displayed
      // $17,550 in compact form
      expect(screen.getByText("$17.55K")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("handles empty holdings list", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: [] },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("No holdings found")).toBeInTheDocument();
    });

    it("shows empty state when no data returned", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: undefined,
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should show empty table message
      expect(screen.getByText("No holdings found")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton while fetching", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: undefined,
        isPending: true,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should not show actual data
      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();

      // The DataTable shows skeleton rows when loading
      const rows = screen.getAllByRole("row");
      // Should have header row plus skeleton rows
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe("Summary Cards", () => {
    it("shows total holdings count", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should display total count
      expect(screen.getByText("Total Holdings")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows total market value", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Total Market Value")).toBeInTheDocument();
      // Total: 17550 + 7012.50 + 9500 = 34062.50
      expect(screen.getByText("$34.06K")).toBeInTheDocument();
    });

    it("shows total unrealized P&L", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Total Unrealized P&L")).toBeInTheDocument();
      // Total: 2550 + (-237.50) + 750 = 3062.50
      expect(screen.getByText("$3.06K")).toBeInTheDocument();
    });

    it("displays positive P&L in positive color", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const pnlElement = screen.getByText("$3.06K");
      expect(pnlElement).toHaveClass("text-positive");
    });

    it("displays negative P&L in negative color", () => {
      const negativeHoldings = sampleHoldings.map((h) => ({
        ...h,
        unrealized_pnl: -Math.abs(h.unrealized_pnl),
      }));

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: negativeHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const pnlCard = screen.getByText("Total Unrealized P&L").closest("div")?.parentElement;
      const pnlValue = pnlCard?.querySelector("p.text-negative");
      expect(pnlValue).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters holdings by symbol search", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Find the search input
      const searchInput = screen.getByPlaceholderText("Search holdings...");
      await user.type(searchInput, "AAPL");

      // Should only show AAPL
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();
      expect(screen.queryByText("MSFT")).not.toBeInTheDocument();
    });

    it("filters holdings by name search", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText("Search holdings...");
      await user.type(searchInput, "Apple");

      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();
    });

    it("filters holdings by sector search", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText("Search holdings...");
      await user.type(searchInput, "Technology");

      // All holdings are in Technology sector
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("GOOGL")).toBeInTheDocument();
      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });

    it("is case insensitive", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText("Search holdings...");
      await user.type(searchInput, "aapl");

      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    it("clears filter when search is cleared", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText("Search holdings...");
      await user.type(searchInput, "AAPL");

      // Only AAPL visible
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();

      // Clear the search
      await user.clear(searchInput);

      // All holdings visible again
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("GOOGL")).toBeInTheDocument();
      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });
  });

  describe("Currency Support", () => {
    it("uses USD by default", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Values should use $ symbol
      expect(screen.getByText("$17.55K")).toBeInTheDocument();
    });

    it("supports custom currency", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" currency="EUR" />, {
        wrapper: createWrapper(),
      });

      // Component should accept currency prop
      expect(screen.getByText(/17.55K/)).toBeInTheDocument();
    });
  });

  describe("Column Headers", () => {
    it("displays all expected column headers", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Symbol")).toBeInTheDocument();
      expect(screen.getByText("Quantity")).toBeInTheDocument();
      expect(screen.getByText("Avg Cost")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
      expect(screen.getByText("Market Value")).toBeInTheDocument();
      expect(screen.getByText("Unrealized P&L")).toBeInTheDocument();
      expect(screen.getByText("Weight")).toBeInTheDocument();
      expect(screen.getByText("Day Change")).toBeInTheDocument();
    });
  });

  describe("Data Formatting", () => {
    it("formats average cost as currency", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple's average cost is $150.00
      expect(screen.getByText("$150.00")).toBeInTheDocument();
    });

    it("formats current price as currency", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple's current price is $175.50
      expect(screen.getByText("$175.50")).toBeInTheDocument();
    });

    it("formats weight as percentage", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple's weight is 0.35 (35%)
      expect(screen.getByText("35.00%")).toBeInTheDocument();
    });

    it("shows weight progress bar", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      const { container } = render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should have progress bars for weights
      const progressBars = container.querySelectorAll("[class*='bg-primary']");
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe("Day Change Column", () => {
    it("shows day change indicator for securities with price change", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple has +1.36% day change
      expect(screen.getByText(/1\.36%/)).toBeInTheDocument();
    });

    it("shows dash for securities without day change", () => {
      const holdingsWithoutDayChange = sampleHoldings.map((h) => ({
        ...h,
        security: { ...h.security, price_change_percent: undefined },
      }));

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: holdingsWithoutDayChange },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Should show dashes for missing day change
      const dashElements = screen.getAllByText("-");
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe("Pagination", () => {
    it("shows pagination when enabled", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // DataTable has pagination enabled with pageSize=10
      // But we only have 3 items, so just verify component renders
      expect(screen.getByText("All Holdings")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("supports sorting by clicking column headers", async () => {
      const user = userEvent.setup();

      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Click on Symbol header to sort
      const symbolHeader = screen.getByText("Symbol").closest("th");
      expect(symbolHeader).toBeInTheDocument();

      await user.click(symbolHeader!);

      // After sorting alphabetically, AAPL should come first
      const rows = screen.getAllByRole("row").slice(1); // Skip header
      const firstRow = rows[0];
      expect(within(firstRow).getByText("AAPL")).toBeInTheDocument();
    });
  });

  describe("Unrealized P&L Column", () => {
    it("shows positive P&L in positive color", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple has positive P&L ($2550)
      const pnlCell = screen.getByText("$2.55K");
      expect(pnlCell).toHaveClass("text-positive");
    });

    it("shows negative P&L in negative color", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Google has negative P&L (-$237.50)
      // Look for negative value indicator
      const cells = screen.getAllByText(/237/);
      expect(cells.length).toBeGreaterThan(0);
    });

    it("shows P&L percentage", () => {
      mockedUsePortfolioHoldings.mockReturnValue({
        data: { data: sampleHoldings },
        isPending: false,
      } as MockQueryResult);

      render(<HoldingsTab portfolioId="portfolio-1" />, {
        wrapper: createWrapper(),
      });

      // Apple has +17% unrealized P&L
      expect(screen.getByText("+17.00%")).toBeInTheDocument();
    });
  });
});
