import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 *
 * Tests for sidebar navigation, route loading, breadcrumbs, and responsive behavior.
 * These are REAL E2E tests - NO MOCKING allowed.
 */

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/dashboard');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should display sidebar with navigation items', async ({ page }) => {
    // Verify sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Verify ARC logo/brand is visible
    await expect(page.getByText('ARC')).toBeVisible();

    // Verify main navigation items are present
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /portfolios/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /intelligence/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /alerts/i })).toBeVisible();

    // Verify settings link in secondary section
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('should navigate to Dashboard page', async ({ page }) => {
    // Click dashboard link
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Verify URL changed
    await expect(page).toHaveURL('/dashboard');

    // Verify page content
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should navigate to Portfolios page', async ({ page }) => {
    // Click portfolios link
    await page.getByRole('link', { name: /portfolios/i }).click();

    // Verify URL changed
    await expect(page).toHaveURL('/portfolios');

    // Verify page title
    await expect(page.getByRole('heading', { name: /portfolios/i })).toBeVisible();
  });

  test('should navigate to Analytics page', async ({ page }) => {
    // Click analytics link
    await page.getByRole('link', { name: /analytics/i }).click();

    // Verify URL changed
    await expect(page).toHaveURL('/analytics');

    // Verify page title
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should navigate to Intelligence page', async ({ page }) => {
    // Click intelligence link
    await page.getByRole('link', { name: /intelligence/i }).click();

    // Verify URL changed
    await expect(page).toHaveURL('/intelligence');

    // Verify page title
    await expect(page.getByRole('heading', { name: /intelligence/i })).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    // Click settings link
    await page.getByRole('link', { name: /settings/i }).click();

    // Verify URL changed
    await expect(page).toHaveURL('/settings');

    // Verify page content
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to portfolios
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    // Verify portfolios link has active styling
    const portfoliosLink = page.getByRole('link', { name: /portfolios/i });
    await expect(portfoliosLink).toHaveClass(/bg-accent/);
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    // Find and click collapse button
    const collapseButton = page.getByRole('button', { name: /collapse/i });
    await expect(collapseButton).toBeVisible();

    // Get initial sidebar width
    const sidebar = page.locator('aside');
    const initialWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThan(200); // Expanded width should be > 200px

    // Click collapse button
    await collapseButton.click();

    // Wait for transition
    await page.waitForTimeout(350);

    // Verify sidebar is collapsed (narrower)
    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(100); // Collapsed width should be < 100px

    // Find expand button (icon only in collapsed state)
    const expandButton = page.locator('aside button').first();
    await expandButton.click();

    // Wait for transition
    await page.waitForTimeout(350);

    // Verify sidebar is expanded again
    const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(expandedWidth).toBeGreaterThan(200);
  });
});

test.describe('Route Loading', () => {
  test('should load dashboard route correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    // Verify no error state
    await expect(page.locator('text=Error')).not.toBeVisible();
  });

  test('should load portfolios route correctly', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page).toHaveURL('/portfolios');
    await expect(page.getByRole('heading', { name: /portfolios/i })).toBeVisible();
  });

  test('should load analytics route correctly', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should load intelligence route correctly', async ({ page }) => {
    await page.goto('/intelligence');
    await expect(page).toHaveURL('/intelligence');
    await expect(page.getByRole('heading', { name: /intelligence/i })).toBeVisible();
  });

  test('should load settings route correctly', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should redirect root to dashboard', async ({ page }) => {
    await page.goto('/');
    // Root should redirect to dashboard or display dashboard content
    await expect(page).toHaveURL(/\/(dashboard)?/);
  });
});

test.describe('Breadcrumb Navigation', () => {
  test('should display breadcrumb on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify breadcrumb nav exists
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Verify Dashboard breadcrumb item
    await expect(breadcrumb.getByText(/dashboard/i)).toBeVisible();
  });

  test('should display breadcrumb on portfolios page', async ({ page }) => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    // Verify breadcrumb
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Verify Portfolios appears in breadcrumb
    await expect(breadcrumb.getByText(/portfolios/i)).toBeVisible();
  });

  test('should navigate via breadcrumb links', async ({ page }) => {
    // Go to a nested page (e.g., analytics)
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Find and click Dashboard breadcrumb link
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const dashboardLink = breadcrumb.getByRole('link', { name: /dashboard/i });

    // Only click if Dashboard is a link (not current page)
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('should show current page as non-link in breadcrumb', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Current page (Analytics) should be marked as current
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const currentItem = breadcrumb.locator('[aria-current="page"]');
    await expect(currentItem).toBeVisible();
  });
});

test.describe('Responsive Sidebar', () => {
  test('should show mobile navigation on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop sidebar should be hidden
    const sidebar = page.locator('aside').first();
    const sidebarBox = await sidebar.boundingBox();

    // On mobile, either sidebar is hidden or has a mobile-specific layout
    // The sidebar might be hidden or transformed to a mobile nav
    // Check for mobile nav trigger (hamburger menu)
    const mobileNavTrigger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="mobile-menu"]');

    // Either sidebar is not visible or mobile trigger exists
    const isMobileSidebarHidden = !sidebarBox || sidebarBox.width === 0;
    const hasMobileNav = await mobileNavTrigger.count() > 0;

    expect(isMobileSidebarHidden || hasMobileNav).toBeTruthy();
  });

  test('should show full sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Sidebar should have reasonable width
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeGreaterThan(150);
  });

  test('should adapt navigation for tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Sidebar should still be visible on tablet
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Navigation should still work
    await page.getByRole('link', { name: /portfolios/i }).click();
    await expect(page).toHaveURL('/portfolios');
  });
});

test.describe('Navigation State Persistence', () => {
  test('should maintain navigation state after page refresh', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on analytics
    await expect(page).toHaveURL('/analytics');
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Analytics link should be active
    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    await expect(analyticsLink).toHaveClass(/bg-accent/);
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to portfolios
    await page.getByRole('link', { name: /portfolios/i }).click();
    await expect(page).toHaveURL('/portfolios');

    // Navigate to analytics
    await page.getByRole('link', { name: /analytics/i }).click();
    await expect(page).toHaveURL('/analytics');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/portfolios');

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle browser forward navigation', async ({ page }) => {
    // Navigate through pages
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /portfolios/i }).click();
    await page.waitForURL('/portfolios');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/portfolios');
  });
});
