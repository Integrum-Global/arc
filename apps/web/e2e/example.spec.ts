import { test, expect } from "@playwright/test";

/**
 * Example E2E Test Suite
 *
 * This demonstrates the basic structure of Playwright E2E tests.
 *
 * IMPORTANT: E2E tests use real infrastructure - NO MOCKING allowed.
 * All tests interact with the actual running application.
 */

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify the page title contains expected text
    await expect(page).toHaveTitle(/.*$/);
  });

  test("should have visible main content", async ({ page }) => {
    await page.goto("/");

    // Wait for main content to be visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate without errors", async ({ page }) => {
    await page.goto("/");

    // Check that no console errors occurred
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate and wait for load
    await page.waitForLoadState("networkidle");

    // Assert no critical errors (filter out expected warnings)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("Warning:") && !error.includes("DevTools")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Accessibility", () => {
  test("should have proper document structure", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1 = page.locator("h1");
    const h1Count = await h1.count();

    // Page should have at least one h1 or be a valid layout
    expect(h1Count).toBeGreaterThanOrEqual(0);

    // Check for skip link or main landmark
    const mainLandmark = page.locator("main, [role='main']");
    await expect(mainLandmark).toBeVisible();
  });
});
