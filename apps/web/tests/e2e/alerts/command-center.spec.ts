/**
 * E2E Tests for Alert Command Center
 *
 * Test Strategy:
 * - Test full page workflow
 * - Test filtering and sorting with real API responses
 * - Test pagination navigation
 * - Test search functionality
 * - Test bulk actions
 * - Test responsive behavior
 * - Mock API responses but use real components
 */

import { test, expect, type Page } from "@playwright/test";

// Mock alert data
const mockAlerts = [
  {
    id: "alert-1",
    type: "threshold_breach",
    severity: "critical",
    status: "active",
    title: "Margin Call Alert",
    message: "Margin call on AAPL: Current margin 142% exceeds 140% limit",
    portfolio_id: "portfolio-1",
    portfolio_name: "Growth Equity",
    security_id: "security-1",
    triggered_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-2",
    type: "threshold_breach",
    severity: "high",
    status: "active",
    title: "P/E Ratio Exceeded",
    message: "P/E ratio exceeds threshold: MSFT at 32.5 (limit: 30)",
    portfolio_id: "portfolio-1",
    portfolio_name: "Tech Fund",
    security_id: "security-2",
    triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-3",
    type: "health_issue",
    severity: "medium",
    status: "active",
    title: "Health Scan Issues",
    message: "Health scan found 3 issues",
    portfolio_id: "portfolio-2",
    portfolio_name: "Balanced Portfolio",
    triggered_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-4",
    type: "news",
    severity: "low",
    status: "active",
    title: "Weekly Report",
    message: "Weekly performance summary available",
    triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-5",
    type: "threshold_breach",
    severity: "high",
    status: "resolved",
    title: "Resolved Alert",
    message: "This alert has been resolved",
    portfolio_id: "portfolio-1",
    portfolio_name: "Growth Equity",
    triggered_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Mock API response helper
 */
async function mockAlertsAPI(page: Page, alerts: typeof mockAlerts) {
  await page.route("**/api/v1/alerts*", async (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    let filtered = [...alerts];

    // Apply filters
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    if (severity) {
      const severities = severity.split(",");
      filtered = filtered.filter((a) => severities.includes(a.severity));
    }

    if (type) {
      filtered = filtered.filter((a) => a.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.message.toLowerCase().includes(searchLower) ||
          a.title.toLowerCase().includes(searchLower)
      );
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: filtered,
        total: filtered.length,
        page: 1,
        page_size: 20,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }),
    });
  });
}

test.describe("Alert Command Center", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await mockAlertsAPI(page, mockAlerts);
  });

  test("should display alert command center page", async ({ page }) => {
    await page.goto("/alerts");

    // Check page title
    await expect(page.getByRole("heading", { name: /alerts/i })).toBeVisible();

    // Check subtitle
    await expect(
      page.getByText(/manage and review all portfolio alerts/i)
    ).toBeVisible();

    // Check action buttons
    await expect(
      page.getByRole("button", { name: /mark all read/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /settings/i })
    ).toBeVisible();
  });

  test("should display all tabs with badge counts", async ({ page }) => {
    await page.goto("/alerts");

    // All tabs should be visible
    await expect(page.getByRole("tab", { name: /^all$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /critical/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /actionable/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /informational/i })
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /resolved/i })).toBeVisible();

    // Badge counts should be present
    await expect(page.getByRole("tab", { name: /critical \(1\)/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /actionable \(2\)/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /informational \(1\)/i })
    ).toBeVisible();
  });

  test("should filter alerts by clicking Critical tab", async ({ page }) => {
    await page.goto("/alerts");

    // Click Critical tab
    await page.getByRole("tab", { name: /critical/i }).click();

    // Should only show critical alert
    await expect(page.getByText(/margin call on aapl/i)).toBeVisible();

    // Should not show other alerts
    await expect(page.getByText(/p\/e ratio exceeds/i)).not.toBeVisible();
  });

  test("should filter alerts by clicking Actionable tab", async ({ page }) => {
    await page.goto("/alerts");

    // Click Actionable tab
    await page.getByRole("tab", { name: /actionable/i }).click();

    // Should show high and medium severity alerts
    await expect(page.getByText(/p\/e ratio exceeds/i)).toBeVisible();
    await expect(page.getByText(/health scan found/i)).toBeVisible();

    // Should not show critical or low alerts
    await expect(page.getByText(/margin call on aapl/i)).not.toBeVisible();
    await expect(page.getByText(/weekly performance/i)).not.toBeVisible();
  });

  test("should filter alerts by clicking Informational tab", async ({
    page,
  }) => {
    await page.goto("/alerts");

    // Click Informational tab
    await page.getByRole("tab", { name: /informational/i }).click();

    // Should only show low severity alerts
    await expect(page.getByText(/weekly performance/i)).toBeVisible();

    // Should not show other alerts
    await expect(page.getByText(/margin call on aapl/i)).not.toBeVisible();
  });

  test("should show resolved alerts when clicking Resolved tab", async ({
    page,
  }) => {
    await page.goto("/alerts");

    // Click Resolved tab
    await page.getByRole("tab", { name: /resolved/i }).click();

    // Should show resolved alert
    await expect(page.getByText(/this alert has been resolved/i)).toBeVisible();

    // Should not show active alerts
    await expect(page.getByText(/margin call on aapl/i)).not.toBeVisible();
  });

  test("should search alerts with debouncing", async ({ page }) => {
    await page.goto("/alerts");

    // Type in search box
    const searchInput = page.getByPlaceholder(/search alerts/i);
    await searchInput.fill("margin");

    // Wait for debounce (300ms)
    await page.waitForTimeout(400);

    // Should show matching alerts
    await expect(page.getByText(/margin call on aapl/i)).toBeVisible();

    // Should not show non-matching alerts
    await expect(page.getByText(/weekly performance/i)).not.toBeVisible();
  });

  test("should filter by alert type", async ({ page }) => {
    await page.goto("/alerts");

    // Click type dropdown
    await page.getByRole("combobox", { name: /type/i }).click();

    // Select threshold breach
    await page.getByRole("option", { name: /threshold breach/i }).click();

    // Should show only threshold breach alerts
    await expect(page.getByText(/margin call on aapl/i)).toBeVisible();
    await expect(page.getByText(/p\/e ratio exceeds/i)).toBeVisible();

    // Should not show health issue
    await expect(page.getByText(/health scan found/i)).not.toBeVisible();
  });

  test("should change sort order", async ({ page }) => {
    await page.goto("/alerts");

    // Click sort dropdown
    await page.getByRole("combobox", { name: /sort/i }).click();

    // Select severity
    await page.getByRole("option", { name: /severity/i }).click();

    // Wait for re-sort
    await page.waitForTimeout(200);

    // Critical alert should be first
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toContainText(/margin call/i);
  });

  test("should display table with correct columns", async ({ page }) => {
    await page.goto("/alerts");

    // Check table headers
    await expect(page.getByRole("columnheader", { name: /severity/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /message/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /portfolio/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /type/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /time/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /actions/i })).toBeVisible();
  });

  test("should display alert rows with actions", async ({ page }) => {
    await page.goto("/alerts");

    // Check first alert row has actions
    const firstRow = page.locator("table tbody tr").first();

    await expect(firstRow.getByRole("button", { name: /view/i })).toBeVisible();
    await expect(
      firstRow.getByRole("button", { name: /acknowledge/i })
    ).toBeVisible();
    await expect(
      firstRow.getByRole("button", { name: /dismiss/i })
    ).toBeVisible();
    await expect(firstRow.getByRole("button", { name: /more/i })).toBeVisible();
  });

  test("should navigate to settings from Settings button", async ({ page }) => {
    await page.goto("/alerts");

    // Click settings button
    const settingsButton = page.getByRole("link", { name: /settings/i });
    await expect(settingsButton).toHaveAttribute(
      "href",
      "/settings/notifications"
    );
  });

  test("should handle empty state", async ({ page }) => {
    // Mock empty response
    await page.route("**/api/v1/alerts*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }),
      });
    });

    await page.goto("/alerts");

    // Should show empty state
    await expect(page.getByText(/no alerts found/i)).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/alerts");

    // Should switch to card layout (no table)
    await expect(page.locator("table")).not.toBeVisible();

    // Should show cards
    const cards = page.locator('[data-testid="alert-card"]');
    await expect(cards.first()).toBeVisible();
  });
});
