/**
 * Unit Tests for ActionableAlertsWidget
 * Tests rendering of Tier 2 actionable alerts with contextual CTAs
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionableAlertsWidget } from "@/app/(dashboard)/dashboard/components/ActionableAlertsWidget";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

// Mock the alert store
vi.mock("@/stores/alertStore", () => ({
  useAlertStore: vi.fn(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("ActionableAlertsWidget", () => {
  const mockActionableAlerts: Alert[] = [
    {
      id: "alert-1",
      message: "P/E ratio exceeds threshold",
      details: "MSFT at 32.5 (limit: 30)",
      severity: "high",
      alert_type: "threshold_breach",
      status: "active",
      portfolio_id: "port-1",
      portfolio_name: "Growth Equity",
      security_id: "sec-msft",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: "alert-2",
      message: "Health scan found 3 issues",
      details: "Sector concentration, Liquidity warning",
      severity: "medium",
      alert_type: "health_issue",
      status: "active",
      portfolio_id: "port-2",
      portfolio_name: "Tech Fund",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: "alert-3",
      message: "Concentration warning",
      details: "Tech sector exceeds 40% threshold",
      severity: "medium",
      alert_type: "concentration_warning",
      status: "active",
      portfolio_id: "port-1",
      portfolio_name: "Growth Equity",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render actionable alerts only", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: mockActionableAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      expect(screen.getByText("Actionable Alerts")).toBeInTheDocument();
      expect(
        screen.getByText("P/E ratio exceeds threshold")
      ).toBeInTheDocument();
      expect(screen.getByText("Health scan found 3 issues")).toBeInTheDocument();
      expect(screen.getByText("Concentration warning")).toBeInTheDocument();
    });

    it("should display a maximum of 5 alerts by default", () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        message: `Alert ${i}`,
        severity: "high" as const,
        alert_type: "threshold_breach",
        status: "active" as const,
        created_at: new Date().toISOString(),
      }));

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: manyAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      // Should only render first 5 alerts
      for (let i = 0; i < 5; i++) {
        expect(screen.getByText(`Alert ${i}`)).toBeInTheDocument();
      }

      // Should not render alerts 6-10
      for (let i = 5; i < 10; i++) {
        expect(screen.queryByText(`Alert ${i}`)).not.toBeInTheDocument();
      }
    });

    it("should respect custom maxAlerts prop", () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        message: `Alert ${i}`,
        severity: "high" as const,
        alert_type: "threshold_breach",
        status: "active" as const,
        created_at: new Date().toISOString(),
      }));

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: manyAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget maxAlerts={3} />);

      // Should only render first 3 alerts
      for (let i = 0; i < 3; i++) {
        expect(screen.getByText(`Alert ${i}`)).toBeInTheDocument();
      }

      // Should not render alerts 4-10
      for (let i = 3; i < 10; i++) {
        expect(screen.queryByText(`Alert ${i}`)).not.toBeInTheDocument();
      }
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no actionable alerts", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      expect(screen.getByText("All clear!")).toBeInTheDocument();
      expect(
        screen.getByText("No actionable alerts at this time.")
      ).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should render correct action button for threshold_breach", () => {
      const alert: Alert = {
        id: "alert-1",
        message: "P/E ratio exceeds threshold",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        security_id: "sec-msft",
        created_at: new Date().toISOString(),
      };

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [alert],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      const reviewButton = screen.getByRole("link", { name: /review/i });
      expect(reviewButton).toBeInTheDocument();
      expect(reviewButton).toHaveAttribute(
        "href",
        "/analytics/ratios?security=sec-msft"
      );
    });

    it("should render correct action button for health_issue", () => {
      const alert: Alert = {
        id: "alert-2",
        message: "Health scan found issues",
        severity: "medium",
        alert_type: "health_issue",
        status: "active",
        portfolio_id: "port-1",
        created_at: new Date().toISOString(),
      };

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [alert],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      const viewScanButton = screen.getByRole("link", { name: /view scan/i });
      expect(viewScanButton).toBeInTheDocument();
      expect(viewScanButton).toHaveAttribute(
        "href",
        "/portfolios/port-1/health"
      );
    });

    it("should render correct action button for concentration_warning", () => {
      const alert: Alert = {
        id: "alert-3",
        message: "Concentration warning",
        severity: "medium",
        alert_type: "concentration_warning",
        status: "active",
        portfolio_id: "port-1",
        created_at: new Date().toISOString(),
      };

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [alert],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      const rebalanceButton = screen.getByRole("link", { name: /rebalance/i });
      expect(rebalanceButton).toBeInTheDocument();
      expect(rebalanceButton).toHaveAttribute(
        "href",
        "/portfolios/port-1/allocations"
      );
    });
  });

  describe("Unread Badge", () => {
    it("should show unread badge count when there are active alerts", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: mockActionableAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      expect(screen.getByText("3 unread")).toBeInTheDocument();
    });

    it("should not show unread badge when all alerts are acknowledged", () => {
      const acknowledgedAlerts = mockActionableAlerts.map((alert) => ({
        ...alert,
        status: "acknowledged" as const,
      }));

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: acknowledgedAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
    });
  });

  describe("Dismiss Functionality", () => {
    it("should call dismissAlert when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [mockActionableAlerts[0]],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(dismissButton);

      expect(dismissAlert).toHaveBeenCalledWith("alert-1");
    });
  });

  describe("Loading State", () => {
    it("should show skeleton when loading is true", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      const { container } = render(<ActionableAlertsWidget loading />);

      // Check for skeleton components
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("View Command Center Link", () => {
    it("should render link to alerts command center", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: mockActionableAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      const commandCenterLink = screen.getByRole("link", {
        name: /view command center/i,
      });
      expect(commandCenterLink).toBeInTheDocument();
      expect(commandCenterLink).toHaveAttribute("href", "/alerts");
    });
  });

  describe("Severity Color Accent", () => {
    it("should apply correct border color for high severity", () => {
      const highAlert: Alert = {
        id: "alert-1",
        message: "High severity alert",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        created_at: new Date().toISOString(),
      };

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [highAlert],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      const { container } = render(<ActionableAlertsWidget />);

      // Find the alert card (has border-l-4)
      const alertCard = container.querySelector('[class*="border-l-4"]');
      expect(alertCard).toBeInTheDocument();
      expect(alertCard?.className).toMatch(/border-amber-500/);
    });

    it("should apply correct border color for medium severity", () => {
      const mediumAlert: Alert = {
        id: "alert-2",
        message: "Medium severity alert",
        severity: "medium",
        alert_type: "health_issue",
        status: "active",
        created_at: new Date().toISOString(),
      };

      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [mediumAlert],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      const { container } = render(<ActionableAlertsWidget />);

      // Find the alert card (has border-l-4)
      const alertCard = container.querySelector('[class*="border-l-4"]');
      expect(alertCard).toBeInTheDocument();
      expect(alertCard?.className).toMatch(/border-blue-500/);
    });
  });

  describe("Relative Timestamps", () => {
    it("should display relative timestamps for alerts", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: mockActionableAlerts,
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      // Check for relative time format
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
      expect(screen.getByText(/1 day ago/i)).toBeInTheDocument();
    });
  });

  describe("Alert Details Truncation", () => {
    it("should display alert message and details", () => {
      const acknowledgeAlert = vi.fn();
      const dismissAlert = vi.fn();

      vi.mocked(useAlertStore).mockImplementation((selector) => {
        const state = {
          actionableAlerts: [mockActionableAlerts[0]],
          acknowledgeAlert,
          dismissAlert,
        };
        return selector(state as any);
      });

      render(<ActionableAlertsWidget />);

      expect(
        screen.getByText("P/E ratio exceeds threshold")
      ).toBeInTheDocument();
      expect(screen.getByText("MSFT at 32.5 (limit: 30)")).toBeInTheDocument();
    });
  });
});
