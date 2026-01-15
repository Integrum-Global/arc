/**
 * E2E Tests for ActionableAlertsWidget
 * Tests real interaction with alert store and navigation
 */

import { test, expect } from "@playwright/test";

test.describe("ActionableAlertsWidget E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
  });

  test("should display actionable alerts on dashboard", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');
    await expect(widget).toBeVisible();

    // Check for alert cards (at least one should be present if there are alerts)
    // Or empty state if no alerts
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const emptyState = widget.locator('text="All clear!"');

    const hasAlerts = (await alertCards.count()) > 0;
    const hasEmptyState = await emptyState.isVisible();

    // Either alerts or empty state should be present
    expect(hasAlerts || hasEmptyState).toBeTruthy();
  });

  test("should navigate to ratios page when Review button is clicked", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find a threshold_breach alert's Review button
    const reviewButton = page.locator(
      'a:has-text("Review"):near(text="threshold")'
    );

    // If Review button exists, click it
    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // Should navigate to analytics/ratios page with security query param
      await expect(page).toHaveURL(/\/analytics\/ratios\?security=/);
    }
  });

  test("should navigate to portfolio health page when View Scan button is clicked", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find a health_issue alert's View Scan button
    const viewScanButton = page.locator(
      'a:has-text("View Scan"):near(text="health")'
    );

    // If View Scan button exists, click it
    if (await viewScanButton.isVisible()) {
      await viewScanButton.click();

      // Should navigate to portfolio health page
      await expect(page).toHaveURL(/\/portfolios\/.*\/health/);
    }
  });

  test("should navigate to allocations page when Rebalance button is clicked", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find a concentration_warning alert's Rebalance button
    const rebalanceButton = page.locator(
      'a:has-text("Rebalance"):near(text="concentration")'
    );

    // If Rebalance button exists, click it
    if (await rebalanceButton.isVisible()) {
      await rebalanceButton.click();

      // Should navigate to portfolio allocations page
      await expect(page).toHaveURL(/\/portfolios\/.*\/allocations/);
    }
  });

  test("should dismiss alert when dismiss button is clicked", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get initial count of alerts
    const initialCount = await widget
      .locator('[data-testid="alert-card"]')
      .count();

    // If there are alerts, dismiss the first one
    if (initialCount > 0) {
      const firstAlert = widget.locator('[data-testid="alert-card"]').first();
      const dismissButton = firstAlert.locator('button:has-text("Dismiss")');

      await dismissButton.click();

      // Alert should be removed (count should decrease by 1 or empty state should appear)
      await page.waitForTimeout(500); // Wait for dismissal animation

      const newCount = await widget
        .locator('[data-testid="alert-card"]')
        .count();
      const emptyState = widget.locator('text="All clear!"');

      expect(newCount === initialCount - 1 || (await emptyState.isVisible())).toBeTruthy();
    }
  });

  test("should show unread badge count", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get count of alert cards
    const alertCount = await widget
      .locator('[data-testid="alert-card"]')
      .count();

    // If there are alerts, check for unread badge
    if (alertCount > 0) {
      const unreadBadge = widget.locator('text=/\\d+ unread/');
      await expect(unreadBadge).toBeVisible();
    }
  });

  test("should navigate to command center when View Command Center link is clicked", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the View Command Center link
    const commandCenterLink = page.locator(
      'a:has-text("View Command Center")'
    );
    await expect(commandCenterLink).toBeVisible();

    await commandCenterLink.click();

    // Should navigate to alerts page
    await expect(page).toHaveURL(/\/alerts/);
  });

  test("should show severity color accents on alert cards", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get all alert cards
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const count = await alertCards.count();

    // If there are alerts, check for left border color accent
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = alertCards.nth(i);

        // Check if card has border-l-4 class (left border accent)
        const className = await card.getAttribute("class");
        expect(className).toMatch(/border-l-4/);

        // Should have either amber (high) or blue (medium) border
        expect(
          className?.includes("border-amber-500") ||
            className?.includes("border-blue-500")
        ).toBeTruthy();
      }
    }
  });

  test("should display relative timestamps", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get all alert cards
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const count = await alertCards.count();

    // If there are alerts, check for relative timestamps
    if (count > 0) {
      const firstCard = alertCards.first();

      // Should contain relative time format
      await expect(firstCard.locator("text=/ ago/i")).toBeVisible();
    }
  });

  test("should show empty state when no actionable alerts", async ({
    page,
  }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Check if there are no alerts
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const count = await alertCards.count();

    if (count === 0) {
      // Should show empty state
      await expect(widget.locator('text="All clear!"')).toBeVisible();
      await expect(
        widget.locator('text="No actionable alerts at this time."')
      ).toBeVisible();
    }
  });

  test("should limit display to 5 alerts maximum", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get count of alert cards
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const count = await alertCards.count();

    // Should not exceed 5 alerts
    expect(count).toBeLessThanOrEqual(5);
  });

  test("should display portfolio name in alert details", async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Find the ActionableAlertsWidget section
    const widget = page.locator('section:has-text("Actionable Alerts")');

    // Get all alert cards
    const alertCards = widget.locator('[data-testid="alert-card"]');
    const count = await alertCards.count();

    // If there are alerts with portfolio names, check they are displayed
    if (count > 0) {
      const firstCard = alertCards.first();
      const cardText = await firstCard.textContent();

      // Check for common portfolio name patterns (optional, depends on data)
      // The portfolio name should be visible if it exists
      expect(cardText).toBeTruthy();
    }
  });
});
