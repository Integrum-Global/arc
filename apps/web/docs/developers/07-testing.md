# Testing Guide

## Overview

ARC follows a 3-tier testing strategy:

| Tier | Type | Purpose | Mock Policy |
|------|------|---------|-------------|
| 1 | Unit | Component logic | Mocks allowed |
| 2 | Integration | Feature flows | **NO MOCKING** |
| 3 | E2E | User journeys | **NO MOCKING** |

## Test Stack

- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking (Tier 1 only)
- **Playwright** - E2E testing

## Project Structure

```
apps/web/
├── src/
│   └── components/
│       └── data/
│           ├── StatCard.tsx
│           └── StatCard.test.tsx  # Co-located unit tests
├── tests/
│   ├── integration/              # Integration tests
│   │   ├── dashboard.test.tsx
│   │   └── portfolio-flow.test.tsx
│   └── e2e/                      # E2E tests
│       ├── auth.spec.ts
│       └── portfolio.spec.ts
└── vitest.config.ts
```

## Tier 1: Unit Tests

Unit tests verify individual component behavior in isolation.

### Setup

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Example: Component Test

```typescript
// src/components/data/StatCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(
      <StatCard
        title="Total Value"
        value={1234567.89}
        format="currency"
      />
    );

    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
  });

  it("shows positive trend indicator for gains", () => {
    render(
      <StatCard
        title="Change"
        value={5.25}
        format="percent"
        trend="up"
      />
    );

    expect(screen.getByTestId("trend-up")).toBeInTheDocument();
    expect(screen.getByText("+5.25%")).toHaveClass("text-green-600");
  });

  it("shows negative trend indicator for losses", () => {
    render(
      <StatCard
        title="Change"
        value={-3.5}
        format="percent"
        trend="down"
      />
    );

    expect(screen.getByTestId("trend-down")).toBeInTheDocument();
    expect(screen.getByText("-3.50%")).toHaveClass("text-red-600");
  });
});
```

### Mocking (Tier 1 Only)

```typescript
// Mock API calls for unit tests
import { vi } from "vitest";

vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolios: vi.fn(() => ({
    data: mockPortfolios,
    isLoading: false,
    error: null,
  })),
}));
```

## Tier 2: Integration Tests

Integration tests verify feature flows with real API calls.

### Key Rules

1. **NO MOCKING** of API responses
2. Use test database with seed data
3. Clean up after each test

### Example: Dashboard Integration

```typescript
// tests/integration/dashboard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

describe("Dashboard Integration", () => {
  let queryClient: QueryClient;

  beforeAll(async () => {
    // Seed test data via API
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("loads and displays portfolio summary", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Wait for real API data
    await waitFor(() => {
      expect(screen.getByText("Total Value")).toBeInTheDocument();
    });

    // Verify real data is displayed
    expect(screen.getByTestId("total-value")).toHaveTextContent("$");
    expect(screen.getByTestId("day-change")).toBeInTheDocument();
  });

  it("displays active alerts from API", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Active Alerts")).toBeInTheDocument();
    });

    // Should show real alerts from test data
    const alerts = screen.getAllByTestId("alert-card");
    expect(alerts.length).toBeGreaterThan(0);
  });
});
```

## Tier 3: E2E Tests

End-to-end tests verify complete user journeys.

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example: Portfolio Flow E2E

```typescript
// tests/e2e/portfolio.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Portfolio Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "testpassword");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("user can view portfolio list", async ({ page }) => {
    await page.goto("/portfolios");

    // Wait for portfolios to load
    await expect(page.getByRole("heading", { name: "Portfolios" })).toBeVisible();

    // Should show portfolio cards
    const portfolioCards = page.getByTestId("portfolio-card");
    await expect(portfolioCards).toHaveCount(await portfolioCards.count());
  });

  test("user can view portfolio detail", async ({ page }) => {
    await page.goto("/portfolios");

    // Click first portfolio
    await page.getByTestId("portfolio-card").first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/portfolios\/[\w-]+/);

    // Should show tabs
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Holdings" })).toBeVisible();
  });

  test("user can add transaction", async ({ page }) => {
    await page.goto("/portfolios");
    await page.getByTestId("portfolio-card").first().click();

    // Click add transaction
    await page.getByRole("button", { name: "Add Transaction" }).click();

    // Fill form
    await page.selectOption('[name="type"]', "buy");
    await page.fill('[name="ticker"]', "AAPL");
    await page.fill('[name="quantity"]', "10");
    await page.fill('[name="price"]', "150.00");

    // Submit
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.getByText("Transaction recorded")).toBeVisible();
  });
});
```

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

## Test Utilities

### Custom Render

```typescript
// tests/utils.tsx
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see
2. **Use data-testid sparingly** - Prefer accessible queries
3. **Keep tests independent** - No shared state between tests
4. **Clean up after tests** - Reset database state
5. **Test edge cases** - Empty states, errors, loading
6. **Run tests in CI** - Catch regressions early
