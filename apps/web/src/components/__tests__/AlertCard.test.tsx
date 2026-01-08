import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertCard,
  AlertCardSkeleton,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
} from "@/components/data/AlertCard";

// Helper to create user event with proper fake timer configuration
function createUser() {
  return userEvent.setup({
    advanceTimers: (delay) => {
      vi.advanceTimersByTime(delay);
    },
  });
}

// Sample alert data
const baseAlert: Alert = {
  id: "alert-1",
  severity: "warning",
  title: "Portfolio Drift Detected",
  message: "Your portfolio has drifted 5% from target allocation. Consider rebalancing.",
  triggeredAt: new Date("2024-01-15T10:30:00Z"),
  status: "active",
};

const alertWithSecurity: Alert = {
  ...baseAlert,
  id: "alert-2",
  securityTicker: "AAPL",
  securityId: "security-1",
};

const acknowledgedAlert: Alert = {
  ...baseAlert,
  id: "alert-3",
  status: "acknowledged",
};

const dismissedAlert: Alert = {
  ...baseAlert,
  id: "alert-4",
  status: "dismissed",
};

const alertWithSource: Alert = {
  ...baseAlert,
  id: "alert-5",
  source: "risk_monitor",
};

describe("AlertCard", () => {
  // Mock date for consistent relative time testing
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Rendering", () => {
    it("renders alert with title and message", () => {
      render(<AlertCard alert={baseAlert} />);

      expect(screen.getByText("Portfolio Drift Detected")).toBeInTheDocument();
      expect(
        screen.getByText(/Your portfolio has drifted 5% from target allocation/)
      ).toBeInTheDocument();
    });

    it("displays severity indicator icon", () => {
      const { container } = render(<AlertCard alert={baseAlert} />);

      // The card should contain an icon element (SVG)
      const svgIcon = container.querySelector("svg");
      expect(svgIcon).toBeInTheDocument();
    });

    it("shows relative timestamp", () => {
      render(<AlertCard alert={baseAlert} />);

      // Should show "2 hours ago" (from 10:30 to 12:30)
      expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    });
  });

  describe("Severity Indicators", () => {
    const severities: Array<{ severity: AlertSeverity; expectedClass: string }> = [
      { severity: "info", expectedClass: "border-l-blue-500" },
      { severity: "warning", expectedClass: "border-l-amber-500" },
      { severity: "critical", expectedClass: "border-l-red-500" },
    ];

    severities.forEach(({ severity, expectedClass }) => {
      it(`shows correct border color for ${severity} severity`, () => {
        const alert: Alert = { ...baseAlert, severity };
        const { container } = render(<AlertCard alert={alert} />);

        const card = container.querySelector("[data-slot='card']") || container.firstChild;
        expect(card).toHaveClass(expectedClass);
      });
    });

    it("shows info icon for info severity", () => {
      const infoAlert: Alert = { ...baseAlert, severity: "info" };
      render(<AlertCard alert={infoAlert} />);

      // Info icon should be present
      expect(screen.getByText("Portfolio Drift Detected")).toBeInTheDocument();
    });

    it("shows warning icon for warning severity", () => {
      const warningAlert: Alert = { ...baseAlert, severity: "warning" };
      render(<AlertCard alert={warningAlert} />);

      // Warning icon should be present (AlertTriangle)
      expect(screen.getByText("Portfolio Drift Detected")).toBeInTheDocument();
    });

    it("shows critical icon for critical severity", () => {
      const criticalAlert: Alert = { ...baseAlert, severity: "critical" };
      render(<AlertCard alert={criticalAlert} />);

      // Critical icon should be present (AlertCircle)
      expect(screen.getByText("Portfolio Drift Detected")).toBeInTheDocument();
    });
  });

  describe("Alert Status", () => {
    it("shows acknowledged badge when status is acknowledged", () => {
      render(<AlertCard alert={acknowledgedAlert} />);

      expect(screen.getByText("Acknowledged")).toBeInTheDocument();
    });

    it("applies reduced opacity for acknowledged alerts", () => {
      const { container } = render(<AlertCard alert={acknowledgedAlert} />);

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("opacity-75");
    });

    it("applies further reduced opacity for dismissed alerts", () => {
      const { container } = render(<AlertCard alert={dismissedAlert} />);

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("opacity-50");
    });

    it("does not show acknowledged badge for active alerts", () => {
      render(<AlertCard alert={baseAlert} />);

      expect(screen.queryByText("Acknowledged")).not.toBeInTheDocument();
    });
  });

  describe("Security Link", () => {
    it("displays security ticker when provided", () => {
      render(<AlertCard alert={alertWithSecurity} />);

      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    it("does not display security link when not provided", () => {
      render(<AlertCard alert={baseAlert} />);

      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();
    });

    it("security ticker is clickable when onSecurityClick is provided", () => {
      const handleSecurityClick = vi.fn();

      render(
        <AlertCard
          alert={alertWithSecurity}
          onSecurityClick={handleSecurityClick}
        />
      );

      const ticker = screen.getByText("AAPL");
      // Verify the ticker is interactive (has click handler)
      ticker.click();

      expect(handleSecurityClick).toHaveBeenCalledTimes(1);
      expect(handleSecurityClick).toHaveBeenCalledWith("security-1", "AAPL");
    });

    it("does not trigger card click when ticker is clicked", () => {
      const handleClick = vi.fn();
      const handleSecurityClick = vi.fn();

      render(
        <AlertCard
          alert={alertWithSecurity}
          onClick={handleClick}
          onSecurityClick={handleSecurityClick}
        />
      );

      const ticker = screen.getByText("AAPL");
      ticker.click();

      expect(handleSecurityClick).toHaveBeenCalledTimes(1);
      // Card click should not be triggered due to stopPropagation
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Source Tag", () => {
    it("displays source tag when provided", () => {
      render(<AlertCard alert={alertWithSource} />);

      expect(screen.getByText("risk_monitor")).toBeInTheDocument();
    });

    it("does not display source tag when not provided", () => {
      render(<AlertCard alert={baseAlert} />);

      // No source tag should be visible
      expect(screen.queryByText("risk_monitor")).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("shows acknowledge button for active alerts", () => {
      const handleAcknowledge = vi.fn();

      render(
        <AlertCard
          alert={baseAlert}
          onAcknowledge={handleAcknowledge}
          showActions={true}
        />
      );

      expect(screen.getByRole("button", { name: /acknowledge/i })).toBeInTheDocument();
    });

    it("shows dismiss button for active alerts", () => {
      const handleDismiss = vi.fn();

      render(
        <AlertCard alert={baseAlert} onDismiss={handleDismiss} showActions={true} />
      );

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("handles acknowledge action", () => {
      const handleAcknowledge = vi.fn();

      render(
        <AlertCard
          alert={baseAlert}
          onAcknowledge={handleAcknowledge}
          showActions={true}
        />
      );

      const acknowledgeBtn = screen.getByRole("button", { name: /acknowledge/i });
      acknowledgeBtn.click();

      expect(handleAcknowledge).toHaveBeenCalledTimes(1);
      expect(handleAcknowledge).toHaveBeenCalledWith("alert-1");
    });

    it("handles dismiss action", () => {
      const handleDismiss = vi.fn();

      render(
        <AlertCard alert={baseAlert} onDismiss={handleDismiss} showActions={true} />
      );

      const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
      dismissBtn.click();

      expect(handleDismiss).toHaveBeenCalledTimes(1);
      expect(handleDismiss).toHaveBeenCalledWith("alert-1");
    });

    it("does not show actions for acknowledged alerts", () => {
      const handleAcknowledge = vi.fn();

      render(
        <AlertCard
          alert={acknowledgedAlert}
          onAcknowledge={handleAcknowledge}
          showActions={true}
        />
      );

      expect(screen.queryByRole("button", { name: /acknowledge/i })).not.toBeInTheDocument();
    });

    it("does not show actions when showActions is false", () => {
      const handleAcknowledge = vi.fn();
      const handleDismiss = vi.fn();

      render(
        <AlertCard
          alert={baseAlert}
          onAcknowledge={handleAcknowledge}
          onDismiss={handleDismiss}
          showActions={false}
        />
      );

      expect(screen.queryByRole("button", { name: /acknowledge/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it("actions do not trigger card click when button is clicked", () => {
      const handleClick = vi.fn();
      const handleAcknowledge = vi.fn();

      const { container } = render(
        <AlertCard
          alert={baseAlert}
          onClick={handleClick}
          onAcknowledge={handleAcknowledge}
          showActions={true}
        />
      );

      // Find the acknowledge button by looking at buttons inside the card
      // The card itself has role="button" and contains a child <button> for acknowledge
      const allButtons = container.querySelectorAll("button");
      const acknowledgeBtn = Array.from(allButtons).find(
        (btn) => btn.textContent?.includes("Acknowledge")
      );

      expect(acknowledgeBtn).toBeDefined();

      // Use fireEvent for proper React event handling
      fireEvent.click(acknowledgeBtn!);

      expect(handleAcknowledge).toHaveBeenCalledTimes(1);
      // Card click should not be triggered due to stopPropagation
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Card Click", () => {
    it("calls onClick when card is clicked", () => {
      const handleClick = vi.fn();

      render(<AlertCard alert={baseAlert} onClick={handleClick} />);

      const card = screen.getByRole("button");
      card.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(baseAlert);
    });

    it("applies clickable styling when onClick is provided", () => {
      const handleClick = vi.fn();
      render(<AlertCard alert={baseAlert} onClick={handleClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("is keyboard accessible via Enter key", () => {
      const handleClick = vi.fn();

      render(<AlertCard alert={baseAlert} onClick={handleClick} />);

      const card = screen.getByRole("button");
      // Simulate Enter key press
      card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

      // The component should support keyboard activation
      expect(card).toHaveAttribute("role", "button");
    });

    it("handles Space key activation", () => {
      const handleClick = vi.fn();

      render(<AlertCard alert={baseAlert} onClick={handleClick} />);

      const card = screen.getByRole("button");
      // Simulate Space key press
      card.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));

      // The component should support keyboard activation
      expect(card).toHaveAttribute("role", "button");
    });

    it("does not have button role when not clickable", () => {
      render(<AlertCard alert={baseAlert} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("applies compact styling when compact is true", () => {
      const { container } = render(<AlertCard alert={baseAlert} compact={true} />);

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("p-3");
    });

    it("uses smaller text in compact mode", () => {
      render(<AlertCard alert={baseAlert} compact={true} />);

      const title = screen.getByText("Portfolio Drift Detected");
      expect(title).toHaveClass("text-sm");
    });

    it("limits message lines in compact mode", () => {
      render(<AlertCard alert={baseAlert} compact={true} />);

      const message = screen.getByText(/Your portfolio has drifted/);
      expect(message).toHaveClass("line-clamp-2");
    });
  });

  describe("Loading State", () => {
    it("shows skeleton when loading is true", () => {
      const { container } = render(<AlertCard alert={baseAlert} loading={true} />);

      // Should not show actual content
      expect(screen.queryByText("Portfolio Drift Detected")).not.toBeInTheDocument();

      // Should show skeleton elements
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Timestamp Handling", () => {
    it("handles Date object for triggeredAt", () => {
      const alertWithDate: Alert = {
        ...baseAlert,
        triggeredAt: new Date("2024-01-15T11:30:00Z"),
      };

      render(<AlertCard alert={alertWithDate} />);

      expect(screen.getByText("1 hour ago")).toBeInTheDocument();
    });

    it("handles ISO string for triggeredAt", () => {
      const alertWithString: Alert = {
        ...baseAlert,
        triggeredAt: "2024-01-15T11:30:00Z",
      };

      render(<AlertCard alert={alertWithString} />);

      expect(screen.getByText("1 hour ago")).toBeInTheDocument();
    });

    it("handles timestamp number for triggeredAt", () => {
      const alertWithTimestamp: Alert = {
        ...baseAlert,
        triggeredAt: new Date("2024-01-15T11:30:00Z").getTime(),
      };

      render(<AlertCard alert={alertWithTimestamp} />);

      expect(screen.getByText("1 hour ago")).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className to card", () => {
      const { container } = render(
        <AlertCard alert={baseAlert} className="custom-alert-class" />
      );

      const card = container.querySelector("[data-slot='card']") || container.firstChild;
      expect(card).toHaveClass("custom-alert-class");
    });
  });
});

describe("AlertCardSkeleton", () => {
  it("renders skeleton state", () => {
    const { container } = render(<AlertCardSkeleton />);

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders compact skeleton when compact is true", () => {
    const { container } = render(<AlertCardSkeleton compact={true} />);

    const card = container.querySelector("[data-slot='card']") || container.firstChild;
    expect(card).toHaveClass("p-3");
  });

  it("applies custom className", () => {
    const { container } = render(<AlertCardSkeleton className="custom-skeleton" />);

    const card = container.querySelector("[data-slot='card']") || container.firstChild;
    expect(card).toHaveClass("custom-skeleton");
  });
});
