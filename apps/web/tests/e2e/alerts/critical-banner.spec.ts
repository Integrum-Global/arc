/**
 * E2E Tests for CriticalAlertBanner Component
 * Tests real-world scenarios with alert store integration
 */

import { test, expect } from "@playwright/test";

test.describe("CriticalAlertBanner E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
  });

  test("should not display banner when no critical alerts exist", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Banner should not be visible
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).not.toBeVisible();
  });

  test("should display banner when critical alert is added", async ({ page }) => {
    // Add a critical alert through store manipulation
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-1",
        message: "Test critical alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner to appear
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Verify content
    await expect(banner.locator("text=CRITICAL")).toBeVisible();
    await expect(banner.locator("text=Test critical alert")).toBeVisible();
  });

  test("should persist banner across page navigation", async ({ page }) => {
    // Add critical alert
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-2",
        message: "Persistent alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        portfolio_name: "Test Portfolio",
        created_at: new Date().toISOString(),
      });
    });

    // Verify banner is visible on dashboard
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();
    await expect(banner.locator("text=Persistent alert")).toBeVisible();

    // Navigate to analytics page
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Banner should still be visible
    await expect(banner).toBeVisible();
    await expect(banner.locator("text=Persistent alert")).toBeVisible();

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Banner should still be visible
    await expect(banner).toBeVisible();
    await expect(banner.locator("text=Persistent alert")).toBeVisible();
  });

  test("should acknowledge alert and remove from banner", async ({ page }) => {
    // Add critical alert
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-3",
        message: "Acknowledgeable alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Click acknowledge button
    const acknowledgeButton = banner.locator('button:has-text("Acknowledge")');
    await acknowledgeButton.click();

    // Banner should disappear (with animation)
    await expect(banner).not.toBeVisible({ timeout: 2000 });
  });

  test("should navigate to alert details on View Details click", async ({ page }) => {
    // Add critical alert
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-4",
        message: "Detailed alert",
        severity: "critical",
        alert_type: "margin_call",
        status: "active",
        portfolio_name: "Growth Fund",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Click View Details button
    const viewDetailsButton = banner.locator('button:has-text("View Details")');
    await viewDetailsButton.click();

    // Should navigate to alert details page
    await expect(page).toHaveURL(/\/alerts\/e2e-critical-4/);
  });

  test("should display multiple alerts in collapsed mode", async ({ page }) => {
    // Add multiple critical alerts
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-5a",
        message: "First critical alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
      store.addAlert({
        id: "e2e-critical-5b",
        message: "Second critical alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
      store.addAlert({
        id: "e2e-critical-5c",
        message: "Third critical alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Should show collapsed summary
    await expect(banner.locator("text=3 CRITICAL ALERTS")).toBeVisible();
  });

  test("should expand multiple alerts when clicked", async ({ page }) => {
    // Add multiple critical alerts
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-6a",
        message: "First expandable alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
      store.addAlert({
        id: "e2e-critical-6b",
        message: "Second expandable alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Click to expand
    const expandButton = banner.locator('button:has-text("2 CRITICAL ALERTS")');
    await expandButton.click();

    // All alerts should be visible
    await expect(banner.locator("text=First expandable alert")).toBeVisible();
    await expect(banner.locator("text=Second expandable alert")).toBeVisible();
  });

  test("should acknowledge all alerts when Acknowledge All is clicked", async ({ page }) => {
    // Add multiple critical alerts
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-7a",
        message: "First alert to acknowledge",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
      store.addAlert({
        id: "e2e-critical-7b",
        message: "Second alert to acknowledge",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Click Acknowledge All button
    const acknowledgeAllButton = banner.locator('button:has-text("Acknowledge All")');
    await acknowledgeAllButton.click();

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 2000 });
  });

  test("should be accessible with screen readers", async ({ page }) => {
    // Add critical alert
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-8",
        message: "Accessibility test alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Check ARIA attributes
    await expect(banner).toHaveAttribute("role", "alert");
    await expect(banner).toHaveAttribute("aria-live", "assertive");

    // Check that buttons are focusable and have proper labels
    const acknowledgeButton = banner.locator('button:has-text("Acknowledge")');
    await acknowledgeButton.focus();
    await expect(acknowledgeButton).toBeFocused();

    const viewDetailsButton = banner.locator('button:has-text("View Details")');
    await viewDetailsButton.focus();
    await expect(viewDetailsButton).toBeFocused();
  });

  test("should display relative time for alerts", async ({ page }) => {
    // Add critical alert with specific timestamp
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await page.evaluate((timestamp) => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-9",
        message: "Timed alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        created_at: timestamp,
      });
    }, fiveMinutesAgo);

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Should show relative time
    await expect(banner.locator("text=/min ago/i")).toBeVisible();
  });

  test("should handle banner on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Add critical alert
    await page.evaluate(() => {
      const { useAlertStore } = require("@/stores/alertStore");
      const store = useAlertStore.getState();
      store.addAlert({
        id: "e2e-critical-10",
        message: "Mobile test alert",
        severity: "critical",
        alert_type: "test",
        status: "active",
        portfolio_name: "Mobile Portfolio",
        created_at: new Date().toISOString(),
      });
    });

    // Wait for banner
    const banner = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(banner).toBeVisible();

    // Verify content is visible on mobile
    await expect(banner.locator("text=CRITICAL")).toBeVisible();
    await expect(banner.locator("text=Mobile test alert")).toBeVisible();

    // Buttons should be stacked on mobile (verify they're visible)
    const acknowledgeButton = banner.locator('button:has-text("Acknowledge")');
    const viewDetailsButton = banner.locator('button:has-text("View Details")');
    await expect(acknowledgeButton).toBeVisible();
    await expect(viewDetailsButton).toBeVisible();
  });
});
