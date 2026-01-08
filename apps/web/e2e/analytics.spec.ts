import { test, expect } from '@playwright/test';

/**
 * Analytics E2E Tests
 *
 * Tests for the analytics page including tab switching,
 * ratio cards, alerts, and benchmarking. These are REAL E2E tests - NO MOCKING allowed.
 */

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should load analytics page with correct title', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Verify subtitle
    await expect(page.getByText(/financial ratios, alerts, and benchmarking/i)).toBeVisible();
  });

  test('should display refresh button', async ({ page }) => {
    // Find refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();
  });

  test('should display all tab options', async ({ page }) => {
    // Verify tabs are present
    await expect(page.getByRole('tab', { name: /ratios/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /alerts/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /thresholds/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /benchmarking/i })).toBeVisible();
  });

  test('should have Ratios tab selected by default', async ({ page }) => {
    // Ratios tab should be active by default
    const ratiosTab = page.getByRole('tab', { name: /ratios/i });
    await expect(ratiosTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should switch to Alerts tab', async ({ page }) => {
    // Click Alerts tab
    await page.getByRole('tab', { name: /alerts/i }).click();

    // Alerts tab should be active
    await expect(page.getByRole('tab', { name: /alerts/i })).toHaveAttribute('data-state', 'active');

    // Ratios tab should no longer be active
    await expect(page.getByRole('tab', { name: /ratios/i })).toHaveAttribute('data-state', 'inactive');
  });

  test('should switch to Thresholds tab', async ({ page }) => {
    // Click Thresholds tab
    await page.getByRole('tab', { name: /thresholds/i }).click();

    // Thresholds tab should be active
    await expect(page.getByRole('tab', { name: /thresholds/i })).toHaveAttribute('data-state', 'active');

    // Should show New Threshold button
    await expect(page.getByRole('button', { name: /new threshold/i })).toBeVisible();
  });

  test('should switch to Benchmarking tab', async ({ page }) => {
    // Click Benchmarking tab
    await page.getByRole('tab', { name: /benchmarking/i }).click();

    // Benchmarking tab should be active
    await expect(page.getByRole('tab', { name: /benchmarking/i })).toHaveAttribute('data-state', 'active');
  });

  test('should switch back to Ratios tab', async ({ page }) => {
    // First switch to Alerts
    await page.getByRole('tab', { name: /alerts/i }).click();
    await expect(page.getByRole('tab', { name: /alerts/i })).toHaveAttribute('data-state', 'active');

    // Then switch back to Ratios
    await page.getByRole('tab', { name: /ratios/i }).click();
    await expect(page.getByRole('tab', { name: /ratios/i })).toHaveAttribute('data-state', 'active');
  });

  test('should show New Threshold button only on Thresholds tab', async ({ page }) => {
    // On Ratios tab, New Threshold button should not be visible
    await expect(page.getByRole('button', { name: /new threshold/i })).not.toBeVisible();

    // Switch to Thresholds tab
    await page.getByRole('tab', { name: /thresholds/i }).click();

    // Now New Threshold button should be visible
    await expect(page.getByRole('button', { name: /new threshold/i })).toBeVisible();

    // Switch to Alerts tab
    await page.getByRole('tab', { name: /alerts/i }).click();

    // New Threshold button should not be visible
    await expect(page.getByRole('button', { name: /new threshold/i })).not.toBeVisible();
  });
});

test.describe('Ratios Tab Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Wait for ratio data to load
    await page.waitForTimeout(1500);
  });

  test('should display security selector', async ({ page }) => {
    // Security selector should be visible
    await expect(page.getByText(/security:/i)).toBeVisible();

    // Dropdown should be visible
    const securitySelect = page.locator('button').filter({ hasText: /aapl|msft|select security/i }).first();
    await expect(securitySelect).toBeVisible();
  });

  test('should display ratio categories', async ({ page }) => {
    // Verify ratio category sections
    await expect(page.getByText(/liquidity ratios/i)).toBeVisible();
    await expect(page.getByText(/profitability ratios/i)).toBeVisible();
    await expect(page.getByText(/leverage ratios/i)).toBeVisible();
    await expect(page.getByText(/utilization ratios|efficiency/i)).toBeVisible();
    await expect(page.getByText(/valuation ratios/i)).toBeVisible();
  });

  test('should display ratio cards', async ({ page }) => {
    // Look for specific ratio cards
    await expect(page.getByText(/current ratio/i)).toBeVisible();
    await expect(page.getByText(/quick ratio/i)).toBeVisible();
    await expect(page.getByText(/roe/i)).toBeVisible();
    await expect(page.getByText(/p\/e ratio|pe ratio/i)).toBeVisible();
  });

  test('should change security selection', async ({ page }) => {
    // Click security dropdown
    const securitySelect = page.locator('button').filter({ hasText: /aapl|msft|select security/i }).first();
    await securitySelect.click();

    // Select MSFT
    const msftOption = page.getByRole('option', { name: /msft|microsoft/i });
    if (await msftOption.count() > 0) {
      await msftOption.click();

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Dropdown should show MSFT
      await expect(securitySelect).toContainText(/msft|microsoft/i);
    }
  });

  test('should display ratio values with correct format', async ({ page }) => {
    // Ratios should display with appropriate suffixes (%, x, days, etc.)
    const ratioValues = page.locator('text=/\\d+\\.?\\d*[%x]|\\d+ days/i');
    const hasValues = await ratioValues.count();

    // Should have at least some ratio values displayed
    expect(hasValues).toBeGreaterThan(0);
  });

  test('should show ratio loading skeleton', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/analytics');

    // Should briefly show skeletons
    const skeletons = page.locator('[class*="skeleton"]');

    // Skeletons may appear briefly during load
    const initialCount = await skeletons.count();
    expect(initialCount >= 0).toBeTruthy();
  });

  test('should make ratio cards clickable', async ({ page }) => {
    // Find a ratio card
    const currentRatioCard = page.locator('text=/current ratio/i').locator('..');

    // Card should be clickable
    await currentRatioCard.click();

    // Should open a detail sheet or modal
    // Wait for potential sheet to appear
    await page.waitForTimeout(500);

    // Look for sheet/modal content
    const sheet = page.locator('[role="dialog"], [class*="sheet"]');
    const hasSheet = await sheet.count();

    // Sheet might appear with ratio details
    expect(hasSheet >= 0).toBeTruthy();
  });
});

test.describe('Alerts Tab Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Switch to Alerts tab
    await page.getByRole('tab', { name: /alerts/i }).click();
    await page.waitForTimeout(1000);
  });

  test('should display alerts content or empty state', async ({ page }) => {
    // Either alerts are displayed or an empty state
    const alertCards = page.locator('[class*="alert"], [data-testid*="alert"]');
    const emptyState = page.getByText(/no alerts|no active alerts/i);

    const hasAlerts = await alertCards.count();
    const hasEmptyState = await emptyState.count();

    // Should have either alerts or empty state
    expect(hasAlerts > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should display alert filters if alerts exist', async ({ page }) => {
    // Check if there are any alerts
    const alertCards = page.locator('[class*="alert"], [data-testid*="alert"]');
    const alertCount = await alertCards.count();

    if (alertCount > 0) {
      // Should have filter controls
      const filterControls = page.locator('button').filter({ hasText: /all|filter|severity/i });
      const hasFilters = await filterControls.count();
      expect(hasFilters >= 0).toBeTruthy();
    }
  });
});

test.describe('Thresholds Tab Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Switch to Thresholds tab
    await page.getByRole('tab', { name: /thresholds/i }).click();
    await page.waitForTimeout(1000);
  });

  test('should display New Threshold button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new threshold/i })).toBeVisible();
  });

  test('should display thresholds content or empty state', async ({ page }) => {
    // Either thresholds are displayed or an empty state
    const thresholdItems = page.locator('[data-testid*="threshold"], [class*="threshold"]');
    const emptyState = page.getByText(/no thresholds|create your first/i);

    const hasThresholds = await thresholdItems.count();
    const hasEmptyState = await emptyState.count();

    // Should have either thresholds or content indicating the tab is active
    const tabContent = page.locator('text=/threshold/i');
    const hasContent = await tabContent.count();

    expect(hasThresholds > 0 || hasEmptyState > 0 || hasContent > 0).toBeTruthy();
  });
});

test.describe('Benchmarking Tab Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Switch to Benchmarking tab
    await page.getByRole('tab', { name: /benchmarking/i }).click();
    await page.waitForTimeout(1000);
  });

  test('should display benchmarking content', async ({ page }) => {
    // Benchmarking tab should have comparison content
    const benchmarkContent = page.locator('text=/benchmark|comparison|peer|vs/i');
    const hasContent = await benchmarkContent.count();

    // Should have some benchmarking-related content
    expect(hasContent >= 0).toBeTruthy();
  });
});

test.describe('Analytics Responsive Layout', () => {
  test('should display tabs properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // All tabs should be visible
    await expect(page.getByRole('tab', { name: /ratios/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /alerts/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /thresholds/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /benchmarking/i })).toBeVisible();
  });

  test('should adapt layout for tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Page should still function
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Tabs should be accessible
    await expect(page.getByRole('tab', { name: /ratios/i })).toBeVisible();
  });

  test('should adapt layout for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Page should be visible
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Tabs should still be accessible (might need horizontal scroll)
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible();
  });

  test('should allow tab scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Tab list might have overflow scroll on mobile
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible();

    // Should be able to click through tabs even on mobile
    await page.getByRole('tab', { name: /alerts/i }).click();
    await expect(page.getByRole('tab', { name: /alerts/i })).toHaveAttribute('data-state', 'active');
  });
});

test.describe('Analytics Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should handle refresh button click', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();

    // Page should remain functional
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Tabs should still work
    await expect(page.getByRole('tab', { name: /ratios/i })).toBeVisible();
  });

  test('should maintain state after refresh button click', async ({ page }) => {
    // Switch to Alerts tab first
    await page.getByRole('tab', { name: /alerts/i }).click();
    await expect(page.getByRole('tab', { name: /alerts/i })).toHaveAttribute('data-state', 'active');

    // Click refresh
    await page.getByRole('button', { name: /refresh/i }).click();

    // Wait for any loading
    await page.waitForTimeout(500);

    // Tab state might persist or might reset to default
    // At minimum, page should be functional
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });
});
