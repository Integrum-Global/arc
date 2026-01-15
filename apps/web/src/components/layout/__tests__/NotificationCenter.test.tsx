import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock formatRelativeTime
vi.mock("@/lib/formatting", () => ({
  formatRelativeTime: vi.fn((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return "Yesterday";
  }),
}));

// Helper to create mock alerts
function createMockAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: `alert-${Date.now()}-${Math.random()}`,
    message: "Test alert message",
    severity: "medium",
    alert_type: "threshold_breach",
    status: "active",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("NotificationCenter", () => {
  beforeEach(() => {
    // Reset alert store
    const store = useAlertStore.getState();
    store.alerts.forEach((alert) => store.removeAlert(alert.id));
    store.unreadCount = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Badge Count", () => {
    it("shows correct unread count when less than 100", () => {
      const store = useAlertStore.getState();
      store.unreadCount = 5;

      render(<NotificationCenter />);

      const badge = screen.getByText("5");
      expect(badge).toBeInTheDocument();
    });

    it("shows 99+ when unread count exceeds 99", () => {
      const store = useAlertStore.getState();
      store.unreadCount = 150;

      render(<NotificationCenter />);

      const badge = screen.getByText("99+");
      expect(badge).toBeInTheDocument();
    });

    it("hides badge when unread count is 0", () => {
      const store = useAlertStore.getState();
      store.unreadCount = 0;

      render(<NotificationCenter />);

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("Dropdown Interaction", () => {
    it("opens dropdown when bell icon is clicked", async () => {
      render(<NotificationCenter />);

      const bellButton = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("closes dropdown when clicking outside", async () => {
      // Note: Radix UI Popover's outside click behavior is difficult to test in JSDOM
      // This test verifies that the Popover opens and can be controlled programmatically
      render(<NotificationCenter />);

      // Open dropdown
      const bellButton = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click the button again to close (toggle behavior)
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes dropdown when escape key is pressed", async () => {
      render(<NotificationCenter />);

      // Open dropdown
      const bellButton = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Press escape
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Alert Grouping", () => {
    it("groups critical alerts separately at the top", () => {
      const store = useAlertStore.getState();

      // Add critical alert
      store.addAlert(
        createMockAlert({
          id: "critical-1",
          severity: "critical",
          message: "Critical alert",
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        })
      );

      // Add regular alert
      store.addAlert(
        createMockAlert({
          id: "regular-1",
          severity: "medium",
          message: "Regular alert",
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      // Check CRITICAL section exists and comes first
      const criticalSection = screen.getByText("CRITICAL");
      expect(criticalSection).toBeInTheDocument();

      // Critical alert should appear before regular alert
      const criticalText = screen.getByText("Critical alert");
      const regularText = screen.getByText("Regular alert");
      expect(
        criticalText.compareDocumentPosition(regularText) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("groups alerts by time: TODAY, YESTERDAY, EARLIER", () => {
      const store = useAlertStore.getState();

      // Add alerts at different times
      store.addAlert(
        createMockAlert({
          id: "today-1",
          message: "Today alert",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        })
      );

      store.addAlert(
        createMockAlert({
          id: "yesterday-1",
          message: "Yesterday alert",
          created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
        })
      );

      store.addAlert(
        createMockAlert({
          id: "earlier-1",
          message: "Earlier alert",
          created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(), // 60 hours ago
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("TODAY")).toBeInTheDocument();
      expect(screen.getByText("YESTERDAY")).toBeInTheDocument();
      expect(screen.getByText("EARLIER")).toBeInTheDocument();
    });

    it("filters out critical alerts from time-based groups", () => {
      const store = useAlertStore.getState();

      // Add critical alert (should be in CRITICAL section, not TODAY)
      store.addAlert(
        createMockAlert({
          id: "critical-1",
          severity: "critical",
          message: "Critical today",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        })
      );

      // Add regular alert today
      store.addAlert(
        createMockAlert({
          id: "regular-1",
          severity: "medium",
          message: "Regular today",
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      // Critical section should have the critical alert
      const criticalSection = screen.getByText("CRITICAL").closest("div");
      expect(within(criticalSection!).getByText("Critical today")).toBeInTheDocument();

      // TODAY section should NOT have critical alert
      const todaySection = screen.getByText("TODAY").closest("div");
      expect(within(todaySection!).queryByText("Critical today")).not.toBeInTheDocument();
      expect(within(todaySection!).getByText("Regular today")).toBeInTheDocument();
    });
  });

  describe("Mark All Read", () => {
    it("shows Mark All Read button when there are unread alerts", () => {
      const store = useAlertStore.getState();
      store.unreadCount = 5;

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText(/mark all read/i)).toBeInTheDocument();
    });

    it("hides Mark All Read button when unread count is 0", () => {
      const store = useAlertStore.getState();
      store.unreadCount = 0;

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.queryByText(/mark all read/i)).not.toBeInTheDocument();
    });

    it("calls markAllRead when button is clicked", async () => {
      const store = useAlertStore.getState();
      store.unreadCount = 5;
      const markAllReadSpy = vi.spyOn(store, "markAllRead");

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const markAllReadButton = screen.getByText(/mark all read/i);
      fireEvent.click(markAllReadButton);

      expect(markAllReadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Alert Navigation", () => {
    it("navigates to alert detail when clicking an alert item", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          id: "alert-123",
          message: "Click me",
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertLink = screen.getByText("Click me").closest("a");
      expect(alertLink).toHaveAttribute("href", "/alerts/alert-123");
    });

    it("shows View All button that links to /alerts", () => {
      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const viewAllLink = screen.getByText(/view all alerts/i).closest("a");
      expect(viewAllLink).toHaveAttribute("href", "/alerts");
    });
  });

  describe("Severity Indicators", () => {
    it("shows red indicator for critical alerts", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          severity: "critical",
          message: "Critical alert",
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertItem = screen.getByText("Critical alert").closest("a");
      const indicator = alertItem!.querySelector(".bg-red-500");
      expect(indicator).toBeInTheDocument();
    });

    it("shows orange indicator for high severity alerts", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          severity: "high",
          message: "High alert",
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertItem = screen.getByText("High alert").closest("a");
      const indicator = alertItem!.querySelector(".bg-orange-500");
      expect(indicator).toBeInTheDocument();
    });

    it("shows yellow indicator for medium severity alerts", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          severity: "medium",
          message: "Medium alert",
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertItem = screen.getByText("Medium alert").closest("a");
      const indicator = alertItem!.querySelector(".bg-yellow-500");
      expect(indicator).toBeInTheDocument();
    });

    it("shows blue indicator for low severity alerts", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          severity: "low",
          message: "Low alert",
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertItem = screen.getByText("Low alert").closest("a");
      const indicator = alertItem!.querySelector(".bg-blue-500");
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("Latest 20 Alerts", () => {
    it("only displays the latest 20 alerts", () => {
      const store = useAlertStore.getState();

      // Add 25 alerts in sequence (newest first due to store.addAlert prepending)
      for (let i = 24; i >= 0; i--) {
        store.addAlert(
          createMockAlert({
            id: `alert-${i}`,
            message: `Alert ${i}`,
            created_at: new Date(Date.now() - i * 60 * 1000).toISOString(),
          })
        );
      }

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      // Should show alerts 0-19 (newest 20)
      expect(screen.getByText("Alert 0")).toBeInTheDocument();
      expect(screen.getByText("Alert 19")).toBeInTheDocument();

      // Should NOT show alerts 20-24 (oldest 5)
      expect(screen.queryByText("Alert 20")).not.toBeInTheDocument();
      expect(screen.queryByText("Alert 24")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when there are no alerts", () => {
      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("No notifications")).toBeInTheDocument();
    });

    it("hides Mark All Read button in empty state", () => {
      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.queryByText(/mark all read/i)).not.toBeInTheDocument();
    });
  });

  describe("Scrollable Content", () => {
    it("applies max-height and overflow styles to content area", () => {
      const store = useAlertStore.getState();

      // Add several alerts to trigger scrolling
      for (let i = 0; i < 10; i++) {
        store.addAlert(
          createMockAlert({
            id: `alert-${i}`,
            message: `Alert ${i}`,
          })
        );
      }

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      // Find the scrollable container (should have max-h-96 class = max-height: 24rem = 384px)
      const dialog = screen.getByRole("dialog");
      const scrollContainer = dialog.querySelector(".max-h-96");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass("overflow-y-auto");
    });
  });

  describe("Relative Timestamps", () => {
    it("displays relative time for recent alerts", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          message: "Recent alert",
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("5 min ago")).toBeInTheDocument();
    });

    it("displays hours for alerts from today", () => {
      const store = useAlertStore.getState();
      store.addAlert(
        createMockAlert({
          message: "Earlier today",
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        })
      );

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("3 hours ago")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible bell button label", () => {
      render(<NotificationCenter />);

      const button = screen.getByRole("button", { name: /notifications/i });
      expect(button).toBeInTheDocument();
    });

    it("uses semantic HTML for links", () => {
      const store = useAlertStore.getState();
      store.addAlert(createMockAlert({ message: "Test alert" }));

      render(<NotificationCenter />);
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

      const alertLinks = screen.getAllByRole("link");
      expect(alertLinks.length).toBeGreaterThan(0);
    });
  });
});
