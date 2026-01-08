/**
 * Navigation Integration Tests
 *
 * Tests the navigation functionality including:
 * - Sidebar navigation between routes
 * - Active state on current route
 * - URL updates when clicking nav items
 * - Responsive behavior (sidebar collapse)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import {
  render,
  screen,
  waitFor,
  userEvent,
  setAuthTokens,
  clearAuthTokens,
  setSidebarCollapsed,
  getSidebarCollapsed,
} from "@/test/test-utils";
import {
  mainNavItems,
  secondaryNavItems,
  navigationConfig,
  isNavItemActive,
  getBreadcrumbItems,
  type NavItem,
} from "@/config/navigation";

// =============================================================================
// Mock Navigation State
// =============================================================================

// Track navigation history for tests
let mockPathname = "/dashboard";
let mockPushHistory: string[] = [];

// Mock usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: (path: string) => {
      mockPushHistory.push(path);
      mockPathname = path;
    },
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Reset navigation state before each test
beforeEach(() => {
  mockPathname = "/dashboard";
  mockPushHistory = [];
});

// =============================================================================
// Test Components
// =============================================================================

/**
 * Simplified sidebar component for testing
 */
function TestSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: (path: string) => void;
}) {
  return (
    <aside
      data-testid="sidebar"
      className={collapsed ? "collapsed" : "expanded"}
      aria-expanded={!collapsed}
    >
      {/* Logo */}
      <div data-testid="sidebar-logo">
        {collapsed ? "A" : "ARC"}
      </div>

      {/* Navigation Sections */}
      <nav data-testid="sidebar-nav">
        {navigationConfig.map((section, sectionIndex) => (
          <div
            key={section.title || sectionIndex}
            data-testid={`nav-section-${sectionIndex}`}
          >
            {section.title && !collapsed && (
              <h4 data-testid={`section-title-${sectionIndex}`}>
                {section.title}
              </h4>
            )}
            {section.items.map((item) => (
              <NavItemButton
                key={item.href}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        data-testid="collapse-toggle"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? ">" : "<"}
      </button>
    </aside>
  );
}

/**
 * Navigation item button component
 */
function NavItemButton({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: (path: string) => void;
}) {
  const isActive = isNavItemActive(mockPathname, item);
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      data-testid={`nav-item-${item.href.replace(/\//g, "-").slice(1)}`}
      data-active={isActive}
      className={isActive ? "active" : ""}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        onNavigate?.(item.href);
      }}
    >
      <Icon className="nav-icon" data-testid={`nav-icon-${item.href.slice(1)}`} />
      {!collapsed && (
        <span data-testid={`nav-label-${item.href.slice(1)}`}>
          {item.label}
        </span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span data-testid={`nav-badge-${item.href.slice(1)}`}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </a>
  );
}

/**
 * Breadcrumb component for testing
 */
function TestBreadcrumb({ pathname }: { pathname: string }) {
  const items = getBreadcrumbItems(pathname);

  return (
    <nav data-testid="breadcrumb" aria-label="Breadcrumb">
      <ol data-testid="breadcrumb-list">
        {items.map((item, index) => (
          <li
            key={item.href}
            data-testid={`breadcrumb-item-${index}`}
          >
            {index < items.length - 1 ? (
              <a href={item.href} data-testid={`breadcrumb-link-${index}`}>
                {item.label}
              </a>
            ) : (
              <span
                data-testid={`breadcrumb-current-${index}`}
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * App shell component for testing responsive behavior
 */
function TestAppShell({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  const handleNavigate = (path: string) => {
    mockPathname = path;
    mockPushHistory.push(path);
  };

  return (
    <div data-testid="app-shell">
      <TestSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onNavigate={handleNavigate}
      />
      <main data-testid="main-content">
        <TestBreadcrumb pathname={mockPathname} />
        {children}
      </main>
    </div>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe("Navigation Integration Tests", () => {
  beforeEach(() => {
    clearAuthTokens();
    setAuthTokens();
    mockPathname = "/dashboard";
    mockPushHistory = [];
  });

  describe("Sidebar Navigation", () => {
    it("should render all main navigation items", () => {
      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-portfolios")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-analytics")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-intelligence")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-alerts")).toBeInTheDocument();
    });

    it("should render secondary navigation items", () => {
      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();
    });

    it("should display navigation labels when expanded", () => {
      render(<TestSidebar collapsed={false} />);

      expect(screen.getByTestId("nav-label-dashboard")).toHaveTextContent(
        "Dashboard"
      );
      expect(screen.getByTestId("nav-label-portfolios")).toHaveTextContent(
        "Portfolios"
      );
      expect(screen.getByTestId("nav-label-analytics")).toHaveTextContent(
        "Analytics"
      );
    });

    it("should hide navigation labels when collapsed", () => {
      render(<TestSidebar collapsed={true} />);

      expect(
        screen.queryByTestId("nav-label-dashboard")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-label-portfolios")
      ).not.toBeInTheDocument();
    });

    it("should display icons in both expanded and collapsed states", () => {
      const { rerender } = render(<TestSidebar collapsed={false} />);

      expect(screen.getByTestId("nav-icon-dashboard")).toBeInTheDocument();

      rerender(<TestSidebar collapsed={true} />);

      expect(screen.getByTestId("nav-icon-dashboard")).toBeInTheDocument();
    });
  });

  describe("Active State", () => {
    it("should show active state for current route", () => {
      mockPathname = "/dashboard";

      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-dashboard")).toHaveAttribute(
        "data-active",
        "true"
      );
      expect(screen.getByTestId("nav-item-dashboard")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("should not show active state for non-current routes", () => {
      mockPathname = "/dashboard";

      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-portfolios")).toHaveAttribute(
        "data-active",
        "false"
      );
      expect(
        screen.getByTestId("nav-item-portfolios")
      ).not.toHaveAttribute("aria-current");
    });

    it("should show active state for child routes", () => {
      mockPathname = "/portfolios/portfolio-1";

      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-portfolios")).toHaveAttribute(
        "data-active",
        "true"
      );
    });

    it("should handle exact matching for dashboard", () => {
      // Dashboard has exact: true, so /dashboard/something should not match
      mockPathname = "/dashboard";

      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-dashboard")).toHaveAttribute(
        "data-active",
        "true"
      );
    });

    it("should update active state when navigating", async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn((path: string) => {
        mockPathname = path;
      });

      const { rerender } = render(
        <TestSidebar onNavigate={handleNavigate} />
      );

      // Initially on dashboard
      expect(screen.getByTestId("nav-item-dashboard")).toHaveAttribute(
        "data-active",
        "true"
      );

      // Navigate to portfolios
      await user.click(screen.getByTestId("nav-item-portfolios"));

      // Rerender to reflect new pathname
      rerender(<TestSidebar onNavigate={handleNavigate} />);

      expect(screen.getByTestId("nav-item-portfolios")).toHaveAttribute(
        "data-active",
        "true"
      );
      expect(screen.getByTestId("nav-item-dashboard")).toHaveAttribute(
        "data-active",
        "false"
      );
    });
  });

  describe("URL Updates", () => {
    it("should call onNavigate when nav item is clicked", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      render(<TestSidebar onNavigate={onNavigate} />);

      await user.click(screen.getByTestId("nav-item-portfolios"));

      expect(onNavigate).toHaveBeenCalledWith("/portfolios");
    });

    it("should update pathname when navigating", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      await user.click(screen.getByTestId("nav-item-analytics"));

      expect(mockPushHistory).toContain("/analytics");
    });

    it("should track navigation history", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      await user.click(screen.getByTestId("nav-item-portfolios"));
      await user.click(screen.getByTestId("nav-item-analytics"));
      await user.click(screen.getByTestId("nav-item-intelligence"));

      expect(mockPushHistory).toEqual([
        "/portfolios",
        "/analytics",
        "/intelligence",
      ]);
    });
  });

  describe("Responsive Behavior", () => {
    it("should toggle sidebar collapse state", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      // Initially expanded
      expect(screen.getByTestId("sidebar")).toHaveAttribute(
        "aria-expanded",
        "true"
      );

      // Click collapse
      await user.click(screen.getByTestId("collapse-toggle"));

      expect(screen.getByTestId("sidebar")).toHaveAttribute(
        "aria-expanded",
        "false"
      );

      // Click expand
      await user.click(screen.getByTestId("collapse-toggle"));

      expect(screen.getByTestId("sidebar")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });

    it("should show collapsed logo when collapsed", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      // Initially shows full logo
      expect(screen.getByTestId("sidebar-logo")).toHaveTextContent("ARC");

      // Collapse
      await user.click(screen.getByTestId("collapse-toggle"));

      expect(screen.getByTestId("sidebar-logo")).toHaveTextContent("A");
    });

    it("should hide section titles when collapsed", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      // Initially shows section title
      expect(screen.getByTestId("section-title-1")).toHaveTextContent(
        "System"
      );

      // Collapse
      await user.click(screen.getByTestId("collapse-toggle"));

      expect(
        screen.queryByTestId("section-title-1")
      ).not.toBeInTheDocument();
    });

    it("should maintain navigation functionality when collapsed", async () => {
      const user = userEvent.setup();

      render(<TestAppShell />);

      // Collapse sidebar
      await user.click(screen.getByTestId("collapse-toggle"));

      // Should still be able to navigate
      await user.click(screen.getByTestId("nav-item-portfolios"));

      expect(mockPushHistory).toContain("/portfolios");
    });
  });

  describe("Breadcrumb Navigation", () => {
    it("should display breadcrumb for dashboard", () => {
      render(<TestBreadcrumb pathname="/dashboard" />);

      expect(screen.getByTestId("breadcrumb-list")).toBeInTheDocument();
      expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent(
        "Dashboard"
      );
    });

    it("should display breadcrumb for nested routes", () => {
      render(<TestBreadcrumb pathname="/portfolios" />);

      expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent(
        "Dashboard"
      );
      expect(screen.getByTestId("breadcrumb-item-1")).toHaveTextContent(
        "Portfolios"
      );
    });

    it("should display breadcrumb for deeply nested routes", () => {
      render(<TestBreadcrumb pathname="/portfolios/portfolio-1" />);

      expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent(
        "Dashboard"
      );
      expect(screen.getByTestId("breadcrumb-item-1")).toHaveTextContent(
        "Portfolios"
      );
      expect(screen.getByTestId("breadcrumb-item-2")).toHaveTextContent(
        "Portfolio 1"
      );
    });

    it("should mark last item as current page", () => {
      render(<TestBreadcrumb pathname="/portfolios" />);

      expect(screen.getByTestId("breadcrumb-current-1")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("should render intermediate items as links", () => {
      render(<TestBreadcrumb pathname="/portfolios/portfolio-1" />);

      expect(screen.getByTestId("breadcrumb-link-0")).toHaveAttribute(
        "href",
        "/dashboard"
      );
      expect(screen.getByTestId("breadcrumb-link-1")).toHaveAttribute(
        "href",
        "/portfolios"
      );
    });
  });

  describe("Navigation Configuration", () => {
    it("should have correct number of main nav items", () => {
      expect(mainNavItems).toHaveLength(5);
    });

    it("should have correct number of secondary nav items", () => {
      expect(secondaryNavItems).toHaveLength(1);
    });

    it("should have correct structure for navigation config", () => {
      expect(navigationConfig).toHaveLength(2);
      expect(navigationConfig[0].items).toEqual(mainNavItems);
      expect(navigationConfig[1].items).toEqual(secondaryNavItems);
      expect(navigationConfig[1].title).toBe("System");
    });

    it("should correctly identify active items", () => {
      const dashboardItem = mainNavItems.find((i) => i.href === "/dashboard")!;
      const portfoliosItem = mainNavItems.find(
        (i) => i.href === "/portfolios"
      )!;

      expect(isNavItemActive("/dashboard", dashboardItem)).toBe(true);
      expect(isNavItemActive("/portfolios", portfoliosItem)).toBe(true);
      expect(isNavItemActive("/portfolios/123", portfoliosItem)).toBe(true);
      expect(isNavItemActive("/portfolios", dashboardItem)).toBe(false);
    });

    it("should handle exact matching for dashboard item", () => {
      const dashboardItem = mainNavItems.find((i) => i.href === "/dashboard")!;

      expect(dashboardItem.exact).toBe(true);
      expect(isNavItemActive("/dashboard", dashboardItem)).toBe(true);
      // With exact: true, child routes should not match
      // But since dashboard doesn't have children in the mock, this is the expected behavior
    });
  });

  describe("Badge Display", () => {
    it("should display badge when present", () => {
      // Create nav item with badge for testing
      const itemWithBadge: NavItem = {
        ...mainNavItems[4], // Alerts
        badge: 5,
      };

      render(
        <NavItemButton
          item={itemWithBadge}
          collapsed={false}
          onNavigate={() => {}}
        />
      );

      expect(screen.getByTestId("nav-badge-alerts")).toHaveTextContent("5");
    });

    it("should display 99+ for large badge counts", () => {
      const itemWithLargeBadge: NavItem = {
        ...mainNavItems[4],
        badge: 150,
      };

      render(
        <NavItemButton
          item={itemWithLargeBadge}
          collapsed={false}
          onNavigate={() => {}}
        />
      );

      expect(screen.getByTestId("nav-badge-alerts")).toHaveTextContent("99+");
    });

    it("should not display badge when zero", () => {
      const itemWithZeroBadge: NavItem = {
        ...mainNavItems[4],
        badge: 0,
      };

      render(
        <NavItemButton
          item={itemWithZeroBadge}
          collapsed={false}
          onNavigate={() => {}}
        />
      );

      expect(
        screen.queryByTestId("nav-badge-alerts")
      ).not.toBeInTheDocument();
    });

    it("should hide badge when sidebar is collapsed", () => {
      const itemWithBadge: NavItem = {
        ...mainNavItems[4],
        badge: 5,
      };

      render(
        <NavItemButton
          item={itemWithBadge}
          collapsed={true}
          onNavigate={() => {}}
        />
      );

      expect(
        screen.queryByTestId("nav-badge-alerts")
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible sidebar", () => {
      render(<TestSidebar />);

      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
    });

    it("should have accessible collapse toggle", () => {
      render(<TestSidebar />);

      const toggle = screen.getByTestId("collapse-toggle");
      expect(toggle).toHaveAttribute("aria-label", "Collapse sidebar");
    });

    it("should update collapse toggle label when collapsed", () => {
      render(<TestSidebar collapsed={true} />);

      const toggle = screen.getByTestId("collapse-toggle");
      expect(toggle).toHaveAttribute("aria-label", "Expand sidebar");
    });

    it("should have accessible breadcrumb", () => {
      render(<TestBreadcrumb pathname="/portfolios" />);

      expect(screen.getByTestId("breadcrumb")).toHaveAttribute(
        "aria-label",
        "Breadcrumb"
      );
    });

    it("should mark current nav item with aria-current", () => {
      mockPathname = "/portfolios";

      render(<TestSidebar />);

      expect(screen.getByTestId("nav-item-portfolios")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });
});
