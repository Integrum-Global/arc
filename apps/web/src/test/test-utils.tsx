/**
 * Test Utilities for Unit and Integration Tests
 *
 * This file provides custom render functions and utilities for testing
 * React components with common providers (React Query, etc.).
 *
 * Usage:
 *   import { render, screen } from '@/test/test-utils';
 *   render(<MyComponent />);
 */

import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";

// =============================================================================
// Query Client Setup
// =============================================================================

// Create a fresh QueryClient for each test to prevent state leakage
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster failures
        retry: false,
        // Disable refetching on window focus in tests
        refetchOnWindowFocus: false,
        // Set a reasonable stale time for tests
        staleTime: 0,
        // Disable garbage collection time for tests
        gcTime: 0,
      },
      mutations: {
        // Disable retries in tests
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that includes all necessary providers for testing.
 * Add additional providers here as needed (ThemeProvider, AuthProvider, etc.)
 */
function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with all providers.
 * Use this instead of @testing-library/react's render for most tests.
 */
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// =============================================================================
// Auth Utilities
// =============================================================================

const AUTH_TOKEN_KEY = "arcToken";
const REFRESH_TOKEN_KEY = "arcRefreshToken";

/**
 * Safe localStorage access helper
 * Returns a mock storage if localStorage is not properly available
 */
function getLocalStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") {
    return window.localStorage;
  }
  // Fallback to a simple in-memory storage for testing
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

/**
 * Set auth token in localStorage for authenticated tests
 */
export function setAuthToken(token: string = "mock-access-token-12345"): void {
  getLocalStorage().setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Set refresh token in localStorage
 */
export function setRefreshToken(token: string = "mock-refresh-token-67890"): void {
  getLocalStorage().setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Set both auth tokens
 */
export function setAuthTokens(
  accessToken: string = "mock-access-token-12345",
  refreshToken: string = "mock-refresh-token-67890"
): void {
  setAuthToken(accessToken);
  setRefreshToken(refreshToken);
}

/**
 * Clear all auth tokens
 */
export function clearAuthTokens(): void {
  const storage = getLocalStorage();
  storage.removeItem(AUTH_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Get current auth token
 */
export function getAuthToken(): string | null {
  return getLocalStorage().getItem(AUTH_TOKEN_KEY);
}

/**
 * Get current refresh token
 */
export function getRefreshToken(): string | null {
  return getLocalStorage().getItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated (has token)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// =============================================================================
// UI State Utilities
// =============================================================================

/**
 * Set sidebar collapsed state
 */
export function setSidebarCollapsed(collapsed: boolean): void {
  getLocalStorage().setItem(
    "arc-ui",
    JSON.stringify({ state: { sidebarCollapsed: collapsed }, version: 0 })
  );
}

/**
 * Get sidebar collapsed state
 */
export function getSidebarCollapsed(): boolean {
  const stored = getLocalStorage().getItem("arc-ui");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.state?.sidebarCollapsed ?? false;
    } catch {
      return false;
    }
  }
  return false;
}

// =============================================================================
// Loading State Utilities
// =============================================================================

/**
 * Helper to wait for loading states to resolve.
 * Use when testing async data fetching.
 */
export async function waitForLoadingToFinish() {
  const { waitFor, screen } = await import("@testing-library/react");

  await waitFor(
    () => {
      const loaders = screen.queryAllByRole("progressbar");
      const skeletons = screen.queryAllByTestId(/skeleton/i);
      const loadingTexts = screen.queryAllByText(/loading/i);

      expect([...loaders, ...skeletons, ...loadingTexts]).toHaveLength(0);
    },
    { timeout: 5000 }
  );
}

// =============================================================================
// Navigation Utilities
// =============================================================================

/**
 * Helper to create a mock router for testing navigation.
 * Note: This is only for unit tests. E2E tests use real navigation.
 */
export function createMockRouter(overrides = {}) {
  return {
    basePath: "",
    pathname: "/",
    route: "/",
    query: {},
    asPath: "/",
    back: vi.fn(),
    beforePopState: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    replace: vi.fn().mockResolvedValue(true),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: "en",
    domainLocales: [],
    isPreview: false,
    ...overrides,
  };
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Re-exports
// =============================================================================

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Override the render function with our custom version
export { customRender as render };

// Export utilities
export { createTestQueryClient };
