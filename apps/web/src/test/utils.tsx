/**
 * Test Utilities
 *
 * Custom render function that wraps components with necessary providers
 * for testing React Query, routing, and other context dependencies.
 */

import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Create a new QueryClient for each test to ensure isolation
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster feedback
        retry: false,
        // Disable refetch on window focus in tests
        refetchOnWindowFocus: false,
        // Keep cache time low for tests
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Props for the AllProviders wrapper
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers
 */
function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Custom render options extending RTL options
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps component with all providers
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from "@/test/utils";
 *
 * test("renders component", () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText("Hello")).toBeInTheDocument();
 * });
 * ```
 */
function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient ?? createTestQueryClient(),
  };
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Export custom utilities
export { renderWithProviders, createTestQueryClient, AllProviders };
