/**
 * MSW (Mock Service Worker) Handlers
 *
 * IMPORTANT: MSW is ONLY for UNIT TESTS (Tier 1).
 * Integration and E2E tests MUST use real infrastructure - NO MOCKING.
 *
 * These handlers intercept network requests during unit tests to provide
 * predictable responses without requiring a running backend.
 *
 * Usage in unit tests:
 *   import { server } from '@/test/msw-server';
 *   import { http, HttpResponse } from 'msw';
 *
 *   // Override a handler for a specific test
 *   server.use(
 *     http.get('/api/users', () => HttpResponse.json({ users: [] }))
 *   );
 */

import { http, HttpResponse } from "msw";

// Base API URL (adjust based on your API configuration)
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Default handlers for common API endpoints.
 * Add your API handlers here as you build features.
 */
export const handlers = [
  // Example: Health check endpoint
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  }),

  // Example: User endpoint
  http.get(`${API_BASE}/api/user`, () => {
    return HttpResponse.json({
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    });
  }),

  // Example: Generic error handler (useful for testing error states)
  // Uncomment and modify as needed:
  // http.get(`${API_BASE}/api/error`, () => {
  //   return HttpResponse.json(
  //     { error: 'Something went wrong' },
  //     { status: 500 }
  //   );
  // }),
];

/**
 * Factory functions for creating handlers with specific responses.
 * Use these in tests to customize behavior.
 */
export const handlerFactories = {
  /**
   * Create a handler that returns an error response.
   * @example
   * server.use(handlerFactories.errorResponse('/api/users', 404, 'Not Found'));
   */
  errorResponse: (path: string, status: number, message: string) =>
    http.get(`${API_BASE}${path}`, () => {
      return HttpResponse.json({ error: message }, { status });
    }),

  /**
   * Create a handler that delays the response.
   * Useful for testing loading states.
   * @example
   * server.use(handlerFactories.delayedResponse('/api/data', 2000, { data: [] }));
   */
  delayedResponse: <T extends Record<string, unknown> | unknown[],>(path: string, delayMs: number, data: T) =>
    http.get(`${API_BASE}${path}`, async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return HttpResponse.json(data);
    }),

  /**
   * Create a handler that fails on the first N requests then succeeds.
   * Useful for testing retry logic.
   * @example
   * server.use(handlerFactories.failThenSucceed('/api/data', 2, { data: [] }));
   */
  failThenSucceed: <T extends Record<string, unknown> | unknown[],>(path: string, failCount: number, successData: T) => {
    let attempts = 0;
    return http.get(`${API_BASE}${path}`, () => {
      attempts++;
      if (attempts <= failCount) {
        return HttpResponse.json({ error: "Temporary failure" }, { status: 500 });
      }
      return HttpResponse.json(successData);
    });
  },
};
