import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard, StatCardSkeleton } from "@/components/data/StatCard";
import { DollarSign, Users, TrendingUp, Package } from "lucide-react";

describe("StatCard", () => {
  describe("Basic Rendering", () => {
    it("renders with title and value", () => {
      render(<StatCard title="Total Revenue" value={1234.56} />);

      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("1,234.56")).toBeInTheDocument();
    });

    it("renders null value as dash", () => {
      render(<StatCard title="Empty Value" value={null} />);

      expect(screen.getByText("Empty Value")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders undefined value as dash", () => {
      render(<StatCard title="Undefined Value" value={undefined} />);

      expect(screen.getByText("Undefined Value")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders zero value correctly", () => {
      render(<StatCard title="Zero Value" value={0} />);

      expect(screen.getByText("0.00")).toBeInTheDocument();
    });

    it("renders negative values correctly", () => {
      render(<StatCard title="Negative Value" value={-500.25} />);

      expect(screen.getByText("-500.25")).toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("formats value as currency", () => {
      render(<StatCard title="Revenue" value={1234.56} format="currency" />);

      expect(screen.getByText("$1,234.56")).toBeInTheDocument();
    });

    it("formats large currency values", () => {
      render(<StatCard title="Revenue" value={1234567.89} format="currency" />);

      expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
    });

    it("formats currency with custom decimals", () => {
      render(
        <StatCard title="Revenue" value={1234.5} format="currency" decimals={0} />
      );

      expect(screen.getByText("$1,235")).toBeInTheDocument();
    });

    it("formats currency with compact notation", () => {
      render(
        <StatCard
          title="Revenue"
          value={1500000}
          format="currency"
          compact={true}
        />
      );

      expect(screen.getByText("$1.50M")).toBeInTheDocument();
    });

    it("formats small currency values without compact", () => {
      render(
        <StatCard
          title="Revenue"
          value={500}
          format="currency"
          compact={true}
        />
      );

      // Values under 1000 should not be compacted
      expect(screen.getByText("$500.00")).toBeInTheDocument();
    });
  });

  describe("Percent Formatting", () => {
    it("formats value as percentage", () => {
      render(<StatCard title="Growth Rate" value={0.1523} format="percent" />);

      expect(screen.getByText("15.23%")).toBeInTheDocument();
    });

    it("formats negative percentage", () => {
      render(<StatCard title="Decline" value={-0.05} format="percent" />);

      expect(screen.getByText("-5.00%")).toBeInTheDocument();
    });

    it("formats percentage with custom decimals", () => {
      render(
        <StatCard
          title="Rate"
          value={0.12345}
          format="percent"
          decimals={1}
        />
      );

      expect(screen.getByText("12.3%")).toBeInTheDocument();
    });
  });

  describe("Compact Number Formatting", () => {
    it("formats numbers in compact notation", () => {
      render(<StatCard title="Users" value={1500000} format="compact" />);

      expect(screen.getByText("1.50M")).toBeInTheDocument();
    });

    it("formats thousands in compact notation", () => {
      render(<StatCard title="Orders" value={5400} format="compact" />);

      expect(screen.getByText("5.40K")).toBeInTheDocument();
    });

    it("formats billions in compact notation", () => {
      render(<StatCard title="Market Cap" value={2500000000} format="compact" />);

      expect(screen.getByText("2.50B")).toBeInTheDocument();
    });

    it("formats small numbers without abbreviation", () => {
      render(<StatCard title="Items" value={500} format="compact" />);

      expect(screen.getByText("500.00")).toBeInTheDocument();
    });
  });

  describe("Number Formatting", () => {
    it("formats number with default decimals", () => {
      render(<StatCard title="Count" value={1234.5678} format="number" />);

      expect(screen.getByText("1,234.57")).toBeInTheDocument();
    });

    it("formats number with custom decimals", () => {
      render(
        <StatCard title="Count" value={1234.5678} format="number" decimals={3} />
      );

      expect(screen.getByText("1,234.568")).toBeInTheDocument();
    });

    it("formats number with compact option", () => {
      render(
        <StatCard
          title="Count"
          value={1500000}
          format="number"
          compact={true}
        />
      );

      expect(screen.getByText("1.50M")).toBeInTheDocument();
    });
  });

  describe("Trend Indicator", () => {
    it("shows positive trend indicator", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          change={0.15}
          format="currency"
        />
      );

      // The TrendIndicator should show +15.00%
      expect(screen.getByText("+15.00%")).toBeInTheDocument();
    });

    it("shows negative trend indicator", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          change={-0.05}
          format="currency"
        />
      );

      expect(screen.getByText("-5.00%")).toBeInTheDocument();
    });

    it("shows change label when provided", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          change={0.15}
          changeLabel="vs last month"
          format="currency"
        />
      );

      expect(screen.getByText("vs last month")).toBeInTheDocument();
    });

    it("does not show trend when change is null", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          change={null}
          format="currency"
        />
      );

      // Should not find any percentage text
      expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });

    it("does not show trend when change is undefined", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          change={undefined}
          format="currency"
        />
      );

      expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });

    it("shows zero change correctly", () => {
      render(
        <StatCard title="Revenue" value={10000} change={0} format="currency" />
      );

      expect(screen.getByText("0.00%")).toBeInTheDocument();
    });
  });

  describe("Icon Rendering", () => {
    it("renders icon when provided", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          icon={DollarSign}
          format="currency"
        />
      );

      // The icon wrapper should be present
      const iconWrapper = document.querySelector(
        "[class*='flex'][class*='items-center'][class*='rounded-lg']"
      );
      expect(iconWrapper).toBeInTheDocument();
    });

    it("renders without icon when not provided", () => {
      render(<StatCard title="Revenue" value={10000} format="currency" />);

      // Should not have icon wrapper with specific classes
      const iconWrappers = document.querySelectorAll(
        "[class*='h-12'][class*='w-12']"
      );
      expect(iconWrappers.length).toBe(0);
    });

    it("applies default icon variant", () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value={10000}
          icon={DollarSign}
          iconVariant="default"
        />
      );

      const iconWrapper = container.querySelector("[class*='bg-muted']");
      expect(iconWrapper).toBeInTheDocument();
    });

    it("applies primary icon variant", () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value={10000}
          icon={DollarSign}
          iconVariant="primary"
        />
      );

      const iconWrapper = container.querySelector("[class*='bg-primary']");
      expect(iconWrapper).toBeInTheDocument();
    });

    it("applies success icon variant", () => {
      const { container } = render(
        <StatCard
          title="Revenue"
          value={10000}
          icon={TrendingUp}
          iconVariant="success"
        />
      );

      const iconWrapper = container.querySelector("[class*='bg-positive']");
      expect(iconWrapper).toBeInTheDocument();
    });

    it("applies destructive icon variant", () => {
      const { container } = render(
        <StatCard
          title="Losses"
          value={-5000}
          icon={TrendingUp}
          iconVariant="destructive"
        />
      );

      const iconWrapper = container.querySelector("[class*='bg-destructive']");
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("renders with small size", () => {
      const { container } = render(
        <StatCard title="Small Card" value={100} size="sm" />
      );

      const card = container.querySelector("[class*='p-4']");
      expect(card).toBeInTheDocument();
    });

    it("renders with medium size (default)", () => {
      const { container } = render(
        <StatCard title="Medium Card" value={100} size="md" />
      );

      const card = container.querySelector("[class*='p-5']");
      expect(card).toBeInTheDocument();
    });

    it("renders with large size", () => {
      const { container } = render(
        <StatCard title="Large Card" value={100} size="lg" />
      );

      const card = container.querySelector("[class*='p-6']");
      expect(card).toBeInTheDocument();
    });

    it("applies correct text size for small variant", () => {
      const { container } = render(
        <StatCard title="Small" value={100} size="sm" />
      );

      const title = container.querySelector("[class*='text-xs']");
      expect(title).toBeInTheDocument();
    });

    it("applies correct text size for large variant", () => {
      const { container } = render(
        <StatCard title="Large" value={100} size="lg" />
      );

      const value = container.querySelector("[class*='text-3xl']");
      expect(value).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeleton when loading is true", () => {
      const { container } = render(
        <StatCard title="Loading Card" value={1000} loading={true} />
      );

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not show value when loading", () => {
      render(<StatCard title="Loading Card" value={1000} loading={true} />);

      expect(screen.queryByText("1,000.00")).not.toBeInTheDocument();
    });

    it("does not show title when loading", () => {
      render(<StatCard title="Loading Card" value={1000} loading={true} />);

      expect(screen.queryByText("Loading Card")).not.toBeInTheDocument();
    });

    it("shows content when loading is false", () => {
      render(<StatCard title="Loaded Card" value={1000} loading={false} />);

      expect(screen.getByText("Loaded Card")).toBeInTheDocument();
      expect(screen.getByText("1,000.00")).toBeInTheDocument();
    });
  });

  describe("StatCardSkeleton", () => {
    it("renders skeleton component directly", () => {
      const { container } = render(<StatCardSkeleton />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders skeleton with small size", () => {
      const { container } = render(<StatCardSkeleton size="sm" />);

      const card = container.querySelector("[class*='p-4']");
      expect(card).toBeInTheDocument();
    });

    it("renders skeleton with large size", () => {
      const { container } = render(<StatCardSkeleton size="lg" />);

      const card = container.querySelector("[class*='p-6']");
      expect(card).toBeInTheDocument();
    });

    it("applies custom className to skeleton", () => {
      const { container } = render(
        <StatCardSkeleton className="custom-skeleton" />
      );

      const card = container.querySelector(".custom-skeleton");
      expect(card).toBeInTheDocument();
    });

    it("renders multiple skeleton placeholders", () => {
      const { container } = render(<StatCardSkeleton />);

      // Should have skeleton for title, value, and change
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className to card", () => {
      const { container } = render(
        <StatCard
          title="Custom Card"
          value={100}
          className="custom-stat-card"
        />
      );

      const card = container.querySelector(".custom-stat-card");
      expect(card).toBeInTheDocument();
    });

    it("merges custom className with default styles", () => {
      const { container } = render(
        <StatCard title="Custom Card" value={100} className="my-custom-class" />
      );

      const card = container.querySelector(".my-custom-class");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border");
    });
  });

  describe("HTML Attributes", () => {
    it("passes through HTML attributes", () => {
      render(
        <StatCard
          title="Test Card"
          value={100}
          data-testid="stat-card"
          id="my-stat-card"
        />
      );

      const card = screen.getByTestId("stat-card");
      expect(card).toHaveAttribute("id", "my-stat-card");
    });

    it("supports role attribute for accessibility", () => {
      render(
        <StatCard
          title="Revenue"
          value={10000}
          role="region"
          aria-label="Revenue statistics"
        />
      );

      const card = screen.getByRole("region", { name: "Revenue statistics" });
      expect(card).toBeInTheDocument();
    });
  });

  describe("Component Composition", () => {
    it("has displayName set", () => {
      expect(StatCard.displayName).toBe("StatCard");
    });

    it("exports Skeleton as static property", () => {
      expect(StatCard.Skeleton).toBe(StatCardSkeleton);
    });

    it("can use StatCard.Skeleton directly", () => {
      const { container } = render(<StatCard.Skeleton size="md" />);

      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Real-World Usage Scenarios", () => {
    it("renders dashboard revenue card", () => {
      render(
        <StatCard
          title="Total Revenue"
          value={1250000}
          change={0.12}
          changeLabel="vs last month"
          icon={DollarSign}
          iconVariant="primary"
          format="currency"
          compact={true}
        />
      );

      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("$1.25M")).toBeInTheDocument();
      expect(screen.getByText("+12.00%")).toBeInTheDocument();
      expect(screen.getByText("vs last month")).toBeInTheDocument();
    });

    it("renders user count card", () => {
      render(
        <StatCard
          title="Active Users"
          value={24500}
          change={0.08}
          icon={Users}
          iconVariant="success"
          format="compact"
        />
      );

      expect(screen.getByText("Active Users")).toBeInTheDocument();
      expect(screen.getByText("24.50K")).toBeInTheDocument();
      expect(screen.getByText("+8.00%")).toBeInTheDocument();
    });

    it("renders negative trend card", () => {
      render(
        <StatCard
          title="Churn Rate"
          value={0.032}
          change={-0.15}
          changeLabel="improvement"
          format="percent"
          iconVariant="warning"
        />
      );

      expect(screen.getByText("Churn Rate")).toBeInTheDocument();
      expect(screen.getByText("3.20%")).toBeInTheDocument();
      expect(screen.getByText("-15.00%")).toBeInTheDocument();
      expect(screen.getByText("improvement")).toBeInTheDocument();
    });

    it("renders inventory card with icon", () => {
      render(
        <StatCard
          title="Products in Stock"
          value={1847}
          icon={Package}
          iconVariant="default"
          format="number"
          decimals={0}
        />
      );

      expect(screen.getByText("Products in Stock")).toBeInTheDocument();
      expect(screen.getByText("1,847")).toBeInTheDocument();
    });
  });
});
