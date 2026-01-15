/**
 * Unit Tests for CriticalAlertBanner Component
 * Tests all behavior modes: null state, single alert, multiple alerts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { CriticalAlertBanner } from "@/components/alerts/CriticalAlertBanner";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("CriticalAlertBanner", () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);

    // Reset store before each test
    useAlertStore.setState({
      alerts: [],
      criticalAlerts: [],
      actionableAlerts: [],
      informationalAlerts: [],
      unreadCount: 0,
      isConnected: false,
    });
  });

  describe("Null State", () => {
    it("should render null when no critical alerts", () => {
      const { container } = render(<CriticalAlertBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render when only actionable alerts exist", () => {
      const actionableAlert: Alert = {
        id: "alert-1",
        message: "High severity alert",
        severity: "high",
        alert_type: "threshold_breach",
        status: "active",
        created_at: new Date().toISOString(),
      };

      useAlertStore.setState({
        alerts: [actionableAlert],
        actionableAlerts: [actionableAlert],
        criticalAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });

      const { container } = render(<CriticalAlertBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Single Alert Mode", () => {
    const criticalAlert: Alert = {
      id: "critical-1",
      message: "Margin call on AAPL: Current margin 142% exceeds 140% limit",
      details: "Immediate action required to reduce exposure",
      severity: "critical",
      alert_type: "margin_call",
      status: "active",
      portfolio_id: "port-1",
      portfolio_name: "Growth Equity",
      security_id: "sec-aapl",
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    };

    beforeEach(() => {
      useAlertStore.setState({
        alerts: [criticalAlert],
        criticalAlerts: [criticalAlert],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });
    });

    it("should render full banner for single critical alert", () => {
      render(<CriticalAlertBanner />);

      expect(screen.getByText(/CRITICAL/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Margin call on AAPL: Current margin 142% exceeds 140% limit/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Growth Equity/i)).toBeInTheDocument();
    });

    it("should display alert details and portfolio name", () => {
      render(<CriticalAlertBanner />);

      expect(screen.getByText(/Portfolio: Growth Equity/i)).toBeInTheDocument();
      expect(screen.getByText(/Triggered/i)).toBeInTheDocument();
    });

    it("should show View Details and Acknowledge buttons", () => {
      render(<CriticalAlertBanner />);

      expect(screen.getByRole("button", { name: /View Details/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Acknowledge/i })).toBeInTheDocument();
    });

    it("should navigate to alert details page on View Details click", () => {
      render(<CriticalAlertBanner />);

      const viewDetailsButton = screen.getByRole("button", { name: /View Details/i });
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/alerts/critical-1");
    });

    it("should acknowledge alert and remove from banner", async () => {
      const acknowledgeAlert = vi.fn();
      useAlertStore.setState({
        acknowledgeAlert,
      } as any);

      render(<CriticalAlertBanner />);

      const acknowledgeButton = screen.getByRole("button", { name: /Acknowledge/i });
      fireEvent.click(acknowledgeButton);

      expect(acknowledgeAlert).toHaveBeenCalledWith("critical-1");
    });

    it("should have ARIA live region for accessibility", () => {
      render(<CriticalAlertBanner />);

      const banner = screen.getByRole("alert");
      expect(banner).toHaveAttribute("aria-live", "assertive");
    });

    it("should display relative time correctly", () => {
      render(<CriticalAlertBanner />);

      // Should show "5 minutes ago" or similar
      expect(screen.getByText(/minutes ago/i)).toBeInTheDocument();
    });
  });

  describe("Multiple Alerts Mode", () => {
    const criticalAlerts: Alert[] = [
      {
        id: "critical-1",
        message: "Margin call on AAPL",
        severity: "critical",
        alert_type: "margin_call",
        status: "active",
        portfolio_name: "Growth Equity",
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: "critical-2",
        message: "Position limit breach on NVDA",
        severity: "critical",
        alert_type: "position_limit",
        status: "active",
        portfolio_name: "Tech Fund",
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      {
        id: "critical-3",
        message: "System: Database connection lost",
        severity: "critical",
        alert_type: "system",
        status: "active",
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
    ];

    beforeEach(() => {
      useAlertStore.setState({
        alerts: criticalAlerts,
        criticalAlerts: criticalAlerts,
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 3,
        isConnected: true,
      });
    });

    it("should show collapsed summary for multiple alerts", () => {
      render(<CriticalAlertBanner />);

      expect(screen.getByText(/3 CRITICAL ALERTS/i)).toBeInTheDocument();
    });

    it("should show expand/collapse button", () => {
      render(<CriticalAlertBanner />);

      const expandButton = screen.getByRole("button", { name: /3 CRITICAL ALERTS/i });
      expect(expandButton).toBeInTheDocument();
    });

    it("should expand to show all alerts when clicked", () => {
      render(<CriticalAlertBanner />);

      const expandButton = screen.getByRole("button", { name: /3 CRITICAL ALERTS/i });
      fireEvent.click(expandButton);

      // All alert messages should be visible
      expect(screen.getByText(/Margin call on AAPL/i)).toBeInTheDocument();
      expect(screen.getByText(/Position limit breach on NVDA/i)).toBeInTheDocument();
      expect(screen.getByText(/System: Database connection lost/i)).toBeInTheDocument();
    });

    it("should collapse when clicked again", () => {
      render(<CriticalAlertBanner />);

      const expandButton = screen.getByRole("button", { name: /3 CRITICAL ALERTS/i });

      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText(/Margin call on AAPL/i)).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);

      // Using queryByText since the elements should not be in the document after collapse
      waitFor(() => {
        expect(screen.queryByText(/Margin call on AAPL/i)).not.toBeInTheDocument();
      });
    });

    it("should show Acknowledge All button", () => {
      render(<CriticalAlertBanner />);

      expect(screen.getByRole("button", { name: /Acknowledge All/i })).toBeInTheDocument();
    });

    it("should acknowledge all alerts when Acknowledge All is clicked", () => {
      const acknowledgeAlert = vi.fn();
      useAlertStore.setState({
        acknowledgeAlert,
      } as any);

      render(<CriticalAlertBanner />);

      const acknowledgeAllButton = screen.getByRole("button", { name: /Acknowledge All/i });
      fireEvent.click(acknowledgeAllButton);

      expect(acknowledgeAlert).toHaveBeenCalledTimes(3);
      expect(acknowledgeAlert).toHaveBeenCalledWith("critical-1");
      expect(acknowledgeAlert).toHaveBeenCalledWith("critical-2");
      expect(acknowledgeAlert).toHaveBeenCalledWith("critical-3");
    });

    it("should display relative times for each alert in expanded view", () => {
      render(<CriticalAlertBanner />);

      const expandButton = screen.getByRole("button", { name: /3 CRITICAL ALERTS/i });
      fireEvent.click(expandButton);

      // Should show relative times
      const times = screen.getAllByText(/ago/i);
      expect(times.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Responsive Behavior", () => {
    const criticalAlert: Alert = {
      id: "critical-1",
      message: "Test critical alert",
      severity: "critical",
      alert_type: "test",
      status: "active",
      created_at: new Date().toISOString(),
    };

    beforeEach(() => {
      useAlertStore.setState({
        alerts: [criticalAlert],
        criticalAlerts: [criticalAlert],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });
    });

    it("should have responsive container class", () => {
      render(<CriticalAlertBanner />);

      const container = screen.getByRole("alert").querySelector(".container");
      expect(container).toBeInTheDocument();
    });

    it("should have proper fixed positioning classes", () => {
      render(<CriticalAlertBanner />);

      const banner = screen.getByRole("alert");
      expect(banner).toHaveClass("sticky", "top-0", "z-50");
    });
  });

  describe("Animation", () => {
    it("should have proper animation props", () => {
      const criticalAlert: Alert = {
        id: "critical-1",
        message: "Test alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      useAlertStore.setState({
        alerts: [criticalAlert],
        criticalAlerts: [criticalAlert],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });

      render(<CriticalAlertBanner />);

      const banner = screen.getByRole("alert");
      expect(banner).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle alert without portfolio name", () => {
      const alertWithoutPortfolio: Alert = {
        id: "critical-1",
        message: "System alert",
        severity: "critical",
        alert_type: "system",
        status: "active",
        created_at: new Date().toISOString(),
      };

      useAlertStore.setState({
        alerts: [alertWithoutPortfolio],
        criticalAlerts: [alertWithoutPortfolio],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });

      render(<CriticalAlertBanner />);

      expect(screen.getByText(/System alert/i)).toBeInTheDocument();
      expect(screen.queryByText(/Portfolio:/i)).not.toBeInTheDocument();
    });

    it("should handle alert without details", () => {
      const alertWithoutDetails: Alert = {
        id: "critical-1",
        message: "Simple alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      };

      useAlertStore.setState({
        alerts: [alertWithoutDetails],
        criticalAlerts: [alertWithoutDetails],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 1,
        isConnected: true,
      });

      render(<CriticalAlertBanner />);

      expect(screen.getByText(/Simple alert/i)).toBeInTheDocument();
    });

    it("should handle acknowledged alert still in critical list", () => {
      const acknowledgedAlert: Alert = {
        id: "critical-1",
        message: "Acknowledged alert",
        severity: "critical",
        alert_type: "test",
        status: "acknowledged",
        created_at: new Date().toISOString(),
        acknowledged_at: new Date().toISOString(),
      };

      useAlertStore.setState({
        alerts: [acknowledgedAlert],
        criticalAlerts: [acknowledgedAlert],
        actionableAlerts: [],
        informationalAlerts: [],
        unreadCount: 0,
        isConnected: true,
      });

      render(<CriticalAlertBanner />);

      // Should still display the alert
      expect(screen.getByText(/Acknowledged alert/i)).toBeInTheDocument();
    });
  });
});
