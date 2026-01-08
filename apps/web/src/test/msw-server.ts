/**
 * MSW Server Configuration
 *
 * IMPORTANT: MSW is ONLY for UNIT TESTS (Tier 1).
 * Integration and E2E tests MUST use real infrastructure - NO MOCKING.
 *
 * This file sets up the MSW server for Node.js environment (vitest).
 * For browser-based mocking, use setupWorker instead.
 */

import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";

// Create the MSW server with default handlers
export const server = setupServer(...handlers);

/**
 * Server lifecycle helpers for test setup
 *
 * Add these to your test files or setup file:
 *
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */

// Export types and utilities for convenience
export { http, HttpResponse } from "msw";
export { handlers };
