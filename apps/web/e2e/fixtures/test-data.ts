/**
 * E2E Test Fixtures and Data
 *
 * This file contains shared test data and fixtures for E2E tests.
 * Use real data structures that match your application's expected formats.
 *
 * IMPORTANT: E2E tests use real infrastructure - NO MOCKING allowed.
 * This file should contain real test data, not mocked responses.
 */

// Example user data for authentication tests
export const testUsers = {
  validUser: {
    email: "test@example.com",
    password: "TestPassword123!",
  },
  adminUser: {
    email: "admin@example.com",
    password: "AdminPassword123!",
  },
} as const;

// Example form data for testing
export const testFormData = {
  contactForm: {
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message for E2E testing.",
  },
} as const;

// Common test timeouts
export const timeouts = {
  short: 5000, // 5 seconds
  medium: 10000, // 10 seconds
  long: 30000, // 30 seconds
  pageLoad: 60000, // 1 minute for slow page loads
} as const;

// Common selectors (update these based on your app)
export const selectors = {
  // Navigation
  nav: {
    main: 'nav, [role="navigation"]',
    links: "nav a",
  },

  // Forms
  forms: {
    input: 'input:not([type="hidden"])',
    submit: 'button[type="submit"]',
    error: '[role="alert"], .error, .error-message',
  },

  // Layout
  layout: {
    main: 'main, [role="main"]',
    header: 'header, [role="banner"]',
    footer: 'footer, [role="contentinfo"]',
  },

  // Loading states
  loading: {
    spinner: '[role="progressbar"], .loading, .spinner',
    skeleton: ".skeleton, [data-loading]",
  },
} as const;

// Helper to generate unique test IDs
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
