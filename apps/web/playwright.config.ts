import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * This configuration sets up end-to-end testing for the Next.js application.
 *
 * IMPORTANT: E2E tests use real infrastructure - NO MOCKING allowed.
 * All tests should interact with actual services and APIs.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
  testDir: "./e2e",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for more stable results
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: process.env.CI
    ? [["list"], ["html", { outputFolder: "playwright-report" }], ["github"]]
    : [["list"], ["html", { outputFolder: "playwright-report" }]],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Record video on failure
    video: "on-first-retry",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile viewports for responsive testing
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },

    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start the server
  },

  // Test timeout
  timeout: 30 * 1000, // 30 seconds per test

  // Expect timeout
  expect: {
    timeout: 5 * 1000, // 5 seconds for assertions
  },

  // Output folder for test artifacts
  outputDir: "test-results/",
});
