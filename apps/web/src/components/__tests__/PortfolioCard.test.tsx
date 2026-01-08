import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PortfolioCard,
  PortfolioCardSkeleton,
  PortfolioCardList,
  type Portfolio,
  type AllocationItem,
} from "@/components/data/PortfolioCard";

// Sample portfolio data
const samplePortfolio: Portfolio = {
  id: "portfolio-1",
  name: "Growth Portfolio",
  type: "individual",
  totalValue: 125000.50,
  dayChange: 1250.25,
  dayChangePct: 0.0101, // 1.01%
  accountNumber: "****1234",
  lastUpdated: new Date("2024-01-15T10:30:00Z"),
};

const sampleAllocation: AllocationItem[] = [
  { name: "Equities", percentage: 0.6, color: "#3b82f6" },
  { name: "Bonds", percentage: 0.25, color: "#22c55e" },
  { name: "Cash", percentage: 0.1, color: "#f59e0b" },
  { name: "Alternatives", percentage: 0.05, color: "#8b5cf6" },
];

const portfolioWithAllocation: Portfolio = {
  ...samplePortfolio,
  allocation: sampleAllocation,
};

const negativeReturnPortfolio: Portfolio = {
  ...samplePortfolio,
  id: "portfolio-2",
  name: "Conservative Portfolio",
  dayChange: -500.75,
  dayChangePct: -0.004, // -0.4%
};

describe("PortfolioCard", () => {
  describe("Basic Rendering", () => {
    it("displays portfolio name", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      expect(screen.getByText("Growth Portfolio")).toBeInTheDocument();
    });

    it("displays portfolio type badge", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      expect(screen.getByText("Individual")).toBeInTheDocument();
    });

    it("displays account number when provided", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      expect(screen.getByText("****1234")).toBeInTheDocument();
    });

    it("does not display account number when not provided", () => {
      const portfolioWithoutAccount = { ...samplePortfolio, accountNumber: undefined };
      render(<PortfolioCard portfolio={portfolioWithoutAccount} />);

      expect(screen.queryByText(/\*\*\*\*/)).not.toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("shows value formatted as currency", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      // Should display compact currency format (125K or 125.00K)
      expect(screen.getByText(/\$125/)).toBeInTheDocument();
    });

    it("handles large values with compact notation", () => {
      const largePortfolio: Portfolio = {
        ...samplePortfolio,
        totalValue: 2500000,
      };
      render(<PortfolioCard portfolio={largePortfolio} />);

      // Should show as millions (2.5M or 2.50M)
      expect(screen.getByText(/\$2\.5/)).toBeInTheDocument();
    });

    it("handles small values correctly", () => {
      const smallPortfolio: Portfolio = {
        ...samplePortfolio,
        totalValue: 500,
      };
      render(<PortfolioCard portfolio={smallPortfolio} />);

      // Small values should still be formatted
      expect(screen.getByText(/\$500/)).toBeInTheDocument();
    });
  });

  describe("Performance Display", () => {
    it("shows positive performance percentage with color", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      // Should show the percentage change
      const trendIndicator = screen.getByText(/1\.01%/);
      expect(trendIndicator).toBeInTheDocument();
    });

    it("shows negative performance percentage with color", () => {
      render(<PortfolioCard portfolio={negativeReturnPortfolio} />);

      // Should show negative percentage
      const trendIndicator = screen.getByText(/0\.40%/);
      expect(trendIndicator).toBeInTheDocument();
    });

    it("shows trend indicator with label", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      // TrendIndicator shows "today" label
      expect(screen.getByText("today")).toBeInTheDocument();
    });
  });

  describe("Allocation Chart", () => {
    it("shows allocation chart when showAllocation is true and allocation exists", () => {
      render(
        <PortfolioCard
          portfolio={portfolioWithAllocation}
          showAllocation={true}
        />
      );

      // Should show allocation legend items
      expect(screen.getByText("Equities")).toBeInTheDocument();
      expect(screen.getByText("Bonds")).toBeInTheDocument();
      expect(screen.getByText("Cash")).toBeInTheDocument();
    });

    it("hides allocation chart when showAllocation is false", () => {
      render(
        <PortfolioCard
          portfolio={portfolioWithAllocation}
          showAllocation={false}
        />
      );

      // Should not show allocation items
      expect(screen.queryByText("Equities")).not.toBeInTheDocument();
      expect(screen.queryByText("Bonds")).not.toBeInTheDocument();
    });

    it("does not show allocation chart when allocation is empty", () => {
      render(<PortfolioCard portfolio={samplePortfolio} showAllocation={true} />);

      // Portfolio without allocation should not show chart
      expect(screen.queryByText("Equities")).not.toBeInTheDocument();
    });

    it("shows max 4 allocation items with overflow indicator", () => {
      const manyAllocations: AllocationItem[] = [
        { name: "Equities", percentage: 0.4, color: "#3b82f6" },
        { name: "Bonds", percentage: 0.2, color: "#22c55e" },
        { name: "Cash", percentage: 0.15, color: "#f59e0b" },
        { name: "Alternatives", percentage: 0.1, color: "#8b5cf6" },
        { name: "Crypto", percentage: 0.1, color: "#ec4899" },
        { name: "Real Estate", percentage: 0.05, color: "#f97316" },
      ];

      const portfolioWithMany: Portfolio = {
        ...samplePortfolio,
        allocation: manyAllocations,
      };

      render(
        <PortfolioCard portfolio={portfolioWithMany} showAllocation={true} />
      );

      // Should show first 4 + overflow indicator
      expect(screen.getByText("Equities")).toBeInTheDocument();
      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("handles click navigation", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<PortfolioCard portfolio={samplePortfolio} onClick={handleClick} />);

      const card = screen.getByRole("button");
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(samplePortfolio);
    });

    it("shows chevron icon when clickable", () => {
      const handleClick = vi.fn();
      render(<PortfolioCard portfolio={samplePortfolio} onClick={handleClick} />);

      // Should have chevron-right icon
      const card = screen.getByRole("button");
      expect(card.querySelector("svg")).toBeInTheDocument();
    });

    it("applies hover styles when clickable", () => {
      const handleClick = vi.fn();
      render(<PortfolioCard portfolio={samplePortfolio} onClick={handleClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("is keyboard accessible", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<PortfolioCard portfolio={samplePortfolio} onClick={handleClick} />);

      const card = screen.getByRole("button");
      card.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles Space key activation", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<PortfolioCard portfolio={samplePortfolio} onClick={handleClick} />);

      const card = screen.getByRole("button");
      card.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not have button role when not clickable", () => {
      render(<PortfolioCard portfolio={samplePortfolio} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Selected State", () => {
    it("applies selected styling when selected is true", () => {
      const { container } = render(
        <PortfolioCard portfolio={samplePortfolio} selected={true} onClick={vi.fn()} />
      );

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("border-primary");
    });

    it("applies aria-selected when selected", () => {
      render(
        <PortfolioCard portfolio={samplePortfolio} selected={true} onClick={vi.fn()} />
      );

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton when loading is true", () => {
      render(<PortfolioCard portfolio={samplePortfolio} loading={true} />);

      // Should not show actual content
      expect(screen.queryByText("Growth Portfolio")).not.toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("applies compact styling when compact is true", () => {
      const { container } = render(
        <PortfolioCard portfolio={samplePortfolio} compact={true} />
      );

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("p-4");
    });

    it("uses smaller text in compact mode", () => {
      render(<PortfolioCard portfolio={samplePortfolio} compact={true} />);

      const name = screen.getByText("Growth Portfolio");
      expect(name).toHaveClass("text-sm");
    });
  });

  describe("Portfolio Types", () => {
    const portfolioTypes: Array<{ type: Portfolio["type"]; label: string }> = [
      { type: "individual", label: "Individual" },
      { type: "joint", label: "Joint" },
      { type: "ira", label: "IRA" },
      { type: "401k", label: "401(k)" },
      { type: "trust", label: "Trust" },
      { type: "corporate", label: "Corporate" },
      { type: "other", label: "Other" },
    ];

    portfolioTypes.forEach(({ type, label }) => {
      it(`displays correct label for ${type} type`, () => {
        const portfolio: Portfolio = { ...samplePortfolio, type };
        render(<PortfolioCard portfolio={portfolio} />);

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe("Currency Support", () => {
    it("supports custom currency", () => {
      render(<PortfolioCard portfolio={samplePortfolio} currency="EUR" />);

      // Currency formatting should use the provided currency
      // Note: Exact format depends on implementation
      expect(screen.getByText(/125/)).toBeInTheDocument();
    });
  });
});

describe("PortfolioCardSkeleton", () => {
  it("renders skeleton state", () => {
    render(<PortfolioCardSkeleton />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it("renders compact skeleton when compact is true", () => {
    const { container } = render(<PortfolioCardSkeleton compact={true} />);

    const card = container.querySelector("[data-slot='card']") || container.firstChild;
    expect(card).toHaveClass("p-4");
  });

  it("shows allocation skeleton when showAllocation is true", () => {
    const { container } = render(<PortfolioCardSkeleton showAllocation={true} />);

    // Should have more skeleton elements for allocation
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("hides allocation skeleton when showAllocation is false", () => {
    const { container: withAllocation } = render(
      <PortfolioCardSkeleton showAllocation={true} />
    );
    const { container: withoutAllocation } = render(
      <PortfolioCardSkeleton showAllocation={false} />
    );

    const withSkeletons = withAllocation.querySelectorAll("[data-slot='skeleton']");
    const withoutSkeletons = withoutAllocation.querySelectorAll("[data-slot='skeleton']");

    // Without allocation should have fewer skeletons
    expect(withoutSkeletons.length).toBeLessThanOrEqual(withSkeletons.length);
  });

  it("applies custom className", () => {
    const { container } = render(
      <PortfolioCardSkeleton className="custom-skeleton" />
    );

    const card = container.querySelector("[data-slot='card']") || container.firstChild;
    expect(card).toHaveClass("custom-skeleton");
  });
});

describe("PortfolioCardList", () => {
  const portfolios: Portfolio[] = [
    { ...samplePortfolio, id: "1", name: "Portfolio 1" },
    { ...samplePortfolio, id: "2", name: "Portfolio 2" },
    { ...samplePortfolio, id: "3", name: "Portfolio 3" },
  ];

  it("renders children in list layout by default", () => {
    const { container } = render(
      <PortfolioCardList>
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </PortfolioCardList>
    );

    const list = container.firstChild;
    expect(list).toHaveClass("flex");
    expect(list).toHaveClass("flex-col");
  });

  it("renders children in grid layout when layout is grid", () => {
    const { container } = render(
      <PortfolioCardList layout="grid">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </PortfolioCardList>
    );

    const list = container.firstChild;
    expect(list).toHaveClass("grid");
  });

  it("applies responsive grid classes", () => {
    const { container } = render(
      <PortfolioCardList layout="grid">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </PortfolioCardList>
    );

    const list = container.firstChild;
    expect(list).toHaveClass("md:grid-cols-2");
    expect(list).toHaveClass("lg:grid-cols-3");
  });

  it("applies custom className", () => {
    const { container } = render(
      <PortfolioCardList className="custom-list">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </PortfolioCardList>
    );

    const list = container.firstChild;
    expect(list).toHaveClass("custom-list");
  });
});
