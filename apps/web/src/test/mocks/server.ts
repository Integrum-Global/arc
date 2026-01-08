/**
 * MSW Server Setup
 *
 * Sets up the Mock Service Worker server for Node.js testing environments.
 * Used by Vitest for mocking API requests during tests.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server instance for Node.js testing
 */
export const server = setupServer(...handlers);

/**
 * Reset handlers to default state
 */
export function resetHandlers() {
  server.resetHandlers();
}

/**
 * Add custom handlers for specific test cases
 */
export function addHandlers(...customHandlers: Parameters<typeof server.use>) {
  server.use(...customHandlers);
}

// Re-export handlers and mock data for convenience
export * from "./handlers";
