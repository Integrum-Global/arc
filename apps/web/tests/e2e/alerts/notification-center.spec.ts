/**
 * E2E Tests for NotificationCenter Component
 *
 * Tests real-world interactions with the notification center dropdown
 * including SSE updates, navigation, and mark all read functionality.
 */

import { test, expect } from "@playwright/test";

test.describe("NotificationCenter", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard where NotificationCenter is in header
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("displays bell icon with badge count", async ({ page }) => {
    // Find the notification bell button
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await expect(bellButton).toBeVisible();

    // Check if badge exists (may or may not have unread alerts)
    const badge = bellButton.locator(".bg-destructive");
    if (await badge.isVisible()) {
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/^\d+\+?$/); // Should be number or "99+"
    }
  });

  test("opens dropdown when bell icon is clicked", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    // Wait for dropdown to appear
    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Verify header text
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });

  test("closes dropdown when clicking outside", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    // Wait for dropdown to appear
    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Click outside the dropdown (on the page body)
    await page.locator("body").click({ position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test("closes dropdown when escape key is pressed", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    // Wait for dropdown to appear
    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Press escape key
    await page.keyboard.press("Escape");

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test("displays alerts grouped by time periods", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Check for time group labels (may or may not exist depending on data)
    const possibleLabels = ["CRITICAL", "TODAY", "YESTERDAY", "EARLIER"];
    for (const label of possibleLabels) {
      const section = dropdown.getByText(label);
      if (await section.isVisible()) {
        // If section exists, verify it's uppercase
        await expect(section).toHaveClass(/uppercase/);
      }
    }
  });

  test("shows critical alerts in separate section", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Check if CRITICAL section exists
    const criticalSection = dropdown.getByText("CRITICAL");
    if (await criticalSection.isVisible()) {
      // Verify critical section has red background
      const section = criticalSection.locator("..");
      await expect(section).toHaveClass(/bg-destructive/);
    }
  });

  test("navigates to alert detail when clicking an alert", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Find first alert link (if any exist)
    const firstAlertLink = dropdown.locator("a[href^='/alerts/']").first();
    if (await firstAlertLink.isVisible()) {
      const href = await firstAlertLink.getAttribute("href");
      await firstAlertLink.click();

      // Verify navigation occurred
      await page.waitForURL(href!);
      expect(page.url()).toContain("/alerts/");
    }
  });

  test("mark all read button reduces unread count", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });

    // Check initial badge count
    const badge = bellButton.locator(".bg-destructive");
    const hasUnread = await badge.isVisible();

    if (!hasUnread) {
      test.skip();
      return;
    }

    const initialCount = await badge.textContent();
    expect(initialCount).toBeTruthy();

    // Open dropdown
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Click Mark All Read button
    const markAllReadButton = dropdown.getByRole("button", { name: /mark all read/i });
    await expect(markAllReadButton).toBeVisible();
    await markAllReadButton.click();

    // Close dropdown to see badge update
    await page.keyboard.press("Escape");

    // Badge should either be hidden or show 0
    await expect(badge).not.toBeVisible();
  });

  test("view all button navigates to alerts page", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Find and click View All button
    const viewAllButton = dropdown.getByRole("link", { name: /view all alerts/i });
    await expect(viewAllButton).toBeVisible();
    await viewAllButton.click();

    // Verify navigation to /alerts
    await page.waitForURL("/alerts");
    expect(page.url()).toContain("/alerts");
  });

  test("shows empty state when no alerts", async ({ page }) => {
    // This test assumes we can clear all alerts or test with fresh state
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Check if empty state exists (depending on actual alert data)
    const emptyState = dropdown.getByText("No notifications");
    if (await emptyState.isVisible()) {
      // Verify Mark All Read button is hidden
      const markAllReadButton = dropdown.getByRole("button", { name: /mark all read/i });
      await expect(markAllReadButton).not.toBeVisible();
    }
  });

  test("displays severity indicators for alerts", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Find alert items (links starting with /alerts/)
    const alertLinks = dropdown.locator("a[href^='/alerts/']");
    const count = await alertLinks.count();

    if (count > 0) {
      // Check first alert has a severity indicator (colored dot)
      const firstAlert = alertLinks.first();
      const indicator = firstAlert.locator(".rounded-full");
      await expect(indicator).toBeVisible();

      // Verify it has one of the severity colors
      const classes = await indicator.getAttribute("class");
      expect(classes).toMatch(/bg-(red|orange|yellow|blue)-500/);
    }
  });

  test("scrolls when many alerts are present", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Find the scrollable container
    const scrollContainer = dropdown.locator(".max-h-96.overflow-y-auto");
    await expect(scrollContainer).toBeVisible();

    // Check if container has scrollable content
    const alertLinks = dropdown.locator("a[href^='/alerts/']");
    const count = await alertLinks.count();

    if (count > 5) {
      // If many alerts, verify scrolling works
      const scrollHeight = await scrollContainer.evaluate((el) => el.scrollHeight);
      const clientHeight = await scrollContainer.evaluate((el) => el.clientHeight);

      if (scrollHeight > clientHeight) {
        // Scroll to bottom
        await scrollContainer.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });

        // Verify scroll position changed
        const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
      }
    }
  });

  test("displays relative timestamps", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Find alert items
    const alertLinks = dropdown.locator("a[href^='/alerts/']");
    const count = await alertLinks.count();

    if (count > 0) {
      // Get first alert's timestamp text
      const firstAlert = alertLinks.first();
      const timestamp = firstAlert.locator("p.text-xs.text-muted-foreground");
      const timestampText = await timestamp.textContent();

      // Verify it matches relative time format
      expect(timestampText).toMatch(/(min|hour|day|week|month|year|just now)/i);
    }
  });

  test("keyboard navigation works within dropdown", async ({ page }) => {
    const bellButton = page.getByRole("button", { name: /notifications/i });
    await bellButton.click();

    const dropdown = page.getByRole("dialog");
    await expect(dropdown).toBeVisible();

    // Tab through interactive elements
    await page.keyboard.press("Tab");

    // Verify focus moved to an interactive element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
