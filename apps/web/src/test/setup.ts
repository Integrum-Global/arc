/**
 * Vitest Test Setup
 *
 * This file runs before each test file and sets up the testing environment.
 * It includes:
 * - @testing-library/jest-dom matchers
 * - Automatic cleanup after each test
 * - Browser API mocks (matchMedia, ResizeObserver, IntersectionObserver)
 * - MSW server for API mocking
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// =============================================================================
// localStorage Mock
// =============================================================================

/**
 * Create a proper localStorage mock since jsdom's implementation may be incomplete
 */
const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = String(value); },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { store = {}; },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
    get length(): number { return Object.keys(store).length; },
  };
};

// Install mock localStorage and sessionStorage
const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

// Also define on global for Node.js context
if (typeof global !== "undefined") {
  Object.defineProperty(global, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });
  Object.defineProperty(global, "sessionStorage", {
    value: mockSessionStorage,
    writable: true,
  });
}

// =============================================================================
// MSW Setup
// =============================================================================

/**
 * Start MSW server before all tests
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "warn",
  });
});

/**
 * Reset handlers after each test to ensure test isolation
 */
afterEach(() => {
  server.resetHandlers();
  cleanup();

  // Clear localStorage and sessionStorage safely
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch {
      // Ignore if localStorage is not available
    }
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.clear();
    } catch {
      // Ignore if sessionStorage is not available
    }
  }
});

/**
 * Close MSW server after all tests
 */
afterAll(() => {
  server.close();
});

// =============================================================================
// Browser API Mocks
// =============================================================================

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but still used by some libraries
    removeListener: vi.fn(), // Deprecated but still used by some libraries
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for components that observe element size changes
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

// Mock IntersectionObserver for components that use intersection detection
// (e.g., lazy loading, infinite scroll, visibility detection)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock scrollTo for components that programmatically scroll
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock requestAnimationFrame for animation-related tests
Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 0);
  }),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  value: vi.fn((id: number) => clearTimeout(id)),
});

/**
 * Mock crypto.randomUUID for request IDs
 */
Object.defineProperty(window, "crypto", {
  value: {
    ...window.crypto,
    randomUUID: () => "test-uuid-12345",
  },
});

// =============================================================================
// Console Configuration
// =============================================================================

/**
 * Suppress expected console warnings during tests
 */
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React 18 act() warnings and other expected errors
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Warning: ReactDOM.render is no longer supported") ||
        message.includes("Warning: An update to") ||
        message.includes("act(...)"))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    // Suppress expected warnings
    const message = args[0];
    if (
      typeof message === "string" &&
      message.includes("Retrying request")
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Set auth token in localStorage for authenticated tests
 */
export function setAuthToken(token: string = "mock-access-token-12345") {
  localStorage.setItem("arcToken", token);
}

/**
 * Set refresh token in localStorage
 */
export function setRefreshToken(token: string = "mock-refresh-token-67890") {
  localStorage.setItem("arcRefreshToken", token);
}

/**
 * Clear all auth tokens
 */
export function clearAuthTokens() {
  localStorage.removeItem("arcToken");
  localStorage.removeItem("arcRefreshToken");
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
