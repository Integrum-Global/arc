# TODO-TEST-003: Web Frontend Tests

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-WEB-001 to TODO-WEB-011

---

## Objective

Implement comprehensive frontend tests for the React web application including unit tests, component tests, integration tests, and E2E tests.

---

## Tasks

### 1. Test Infrastructure Setup
- [ ] Configure Vitest for unit/component testing
- [ ] Configure React Testing Library
- [ ] Configure MSW (Mock Service Worker) for API mocking
- [ ] Configure Playwright for E2E tests
- [ ] Set up test coverage reporting

### 2. Unit Tests - Utilities
- [ ] Create `src/lib/__tests__/formatters.test.ts`:
  - formatCurrency tests
  - formatPercentage tests
  - formatDate tests
  - formatNumber tests
  - formatRatio tests
- [ ] Create `src/lib/__tests__/validators.test.ts`:
  - validateEmail tests
  - validateTicker tests
  - validateQuantity tests
  - validatePrice tests
- [ ] Create `src/lib/__tests__/calculations.test.ts`:
  - calculateGainLoss tests
  - calculateAllocation tests
  - calculatePerformance tests

### 3. Component Tests - Common
- [ ] Create `src/components/ui/__tests__/Button.test.tsx`:
  - renders correctly
  - handles click events
  - shows loading state
  - disabled state works
  - variants render correctly
- [ ] Create `src/components/ui/__tests__/Input.test.tsx`:
  - renders with label
  - handles onChange
  - shows error state
  - handles focus/blur
- [ ] Create `src/components/ui/__tests__/Card.test.tsx`:
  - renders children
  - applies className
  - renders header and footer

### 4. Component Tests - Data Display
- [ ] Create `src/components/__tests__/StatCard.test.tsx`:
  - renders value and label
  - formats currency correctly
  - shows trend indicator
  - handles loading state
- [ ] Create `src/components/__tests__/DataTable.test.tsx`:
  - renders columns
  - handles sorting
  - handles pagination
  - shows empty state
  - handles row selection
- [ ] Create `src/components/__tests__/PortfolioCard.test.tsx`:
  - displays portfolio name
  - shows value with currency
  - shows performance percentage
  - handles click navigation

### 5. Component Tests - Charts
- [ ] Create `src/components/__tests__/AllocationChart.test.tsx`:
  - renders pie chart
  - shows legend
  - handles empty data
  - responds to hover
- [ ] Create `src/components/__tests__/PerformanceChart.test.tsx`:
  - renders line chart
  - handles time range selection
  - shows correct tooltips
  - handles loading state

### 6. Component Tests - Forms
- [ ] Create `src/components/__tests__/PortfolioForm.test.tsx`:
  - renders all fields
  - validates required fields
  - submits form data
  - handles API errors
  - shows loading during submit
- [ ] Create `src/components/__tests__/TransactionForm.test.tsx`:
  - renders transaction types
  - calculates total amount
  - validates quantity > 0
  - validates price > 0
  - handles submit

### 7. Hook Tests
- [ ] Create `src/hooks/__tests__/usePortfolios.test.ts`:
  - fetches portfolios
  - handles loading state
  - handles error state
  - caches data correctly
- [ ] Create `src/hooks/__tests__/useAnalytics.test.ts`:
  - fetches security ratios
  - handles refetch
  - invalidates on mutation
- [ ] Create `src/hooks/__tests__/useAuth.test.ts`:
  - handles login
  - handles logout
  - stores token
  - handles token refresh

### 8. Page Tests
- [ ] Create `src/pages/__tests__/Dashboard.test.tsx`:
  - renders summary cards
  - renders allocation chart
  - renders recent alerts
  - handles loading state
- [ ] Create `src/pages/__tests__/PortfolioList.test.tsx`:
  - renders portfolio grid
  - handles create button
  - handles search filter
  - handles pagination
- [ ] Create `src/pages/__tests__/PortfolioDetail.test.tsx`:
  - renders all tabs
  - switches between tabs
  - shows holdings table
  - shows transactions table

### 9. Integration Tests
- [ ] Create `src/__tests__/integration/auth-flow.test.tsx`:
  - complete login flow
  - complete logout flow
  - token refresh flow
  - unauthorized redirect
- [ ] Create `src/__tests__/integration/portfolio-crud.test.tsx`:
  - create portfolio flow
  - edit portfolio flow
  - delete portfolio flow
  - add holding flow
- [ ] Create `src/__tests__/integration/navigation.test.tsx`:
  - sidebar navigation
  - breadcrumb navigation
  - back button behavior

### 10. E2E Tests (Playwright)
- [ ] Create `e2e/auth.spec.ts`:
  - login with valid credentials
  - login with invalid credentials
  - logout flow
  - session persistence
- [ ] Create `e2e/portfolio.spec.ts`:
  - create new portfolio
  - view portfolio details
  - add transaction
  - edit portfolio
- [ ] Create `e2e/analytics.spec.ts`:
  - view security ratios
  - configure threshold
  - view alerts
- [ ] Create `e2e/intelligence.spec.ts`:
  - execute query
  - view brief
  - navigate chat

---

## Acceptance Criteria

- [ ] Unit test coverage >= 80%
- [ ] All component tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No accessibility errors (a11y tests)
- [ ] Tests run in CI pipeline

---

## Test Directory Structure

```
apps/web/
├── src/
│   ├── lib/__tests__/
│   │   ├── formatters.test.ts
│   │   ├── validators.test.ts
│   │   └── calculations.test.ts
│   ├── components/
│   │   └── __tests__/
│   │       ├── StatCard.test.tsx
│   │       ├── DataTable.test.tsx
│   │       └── ...
│   ├── hooks/__tests__/
│   │   ├── usePortfolios.test.ts
│   │   └── useAuth.test.ts
│   ├── pages/__tests__/
│   │   ├── Dashboard.test.tsx
│   │   └── PortfolioList.test.tsx
│   └── __tests__/
│       └── integration/
│           ├── auth-flow.test.tsx
│           └── portfolio-crud.test.tsx
├── e2e/
│   ├── auth.spec.ts
│   ├── portfolio.spec.ts
│   ├── analytics.spec.ts
│   └── intelligence.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test/**/*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

---

## Example Component Test

```typescript
// src/components/__tests__/StatCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(
      <StatCard
        label="Total Value"
        value={1500000}
        format="currency"
      />
    );

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$1,500,000')).toBeInTheDocument();
  });

  it('shows positive trend indicator', () => {
    render(
      <StatCard
        label="Performance"
        value={0.15}
        format="percentage"
        trend="up"
        trendValue={0.05}
      />
    );

    expect(screen.getByText('15.00%')).toBeInTheDocument();
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
    expect(screen.getByTestId('trend-up')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <StatCard
        label="Loading"
        value={0}
        isLoading
      />
    );

    expect(screen.getByTestId('stat-skeleton')).toBeInTheDocument();
  });
});
```

---

## Example E2E Test

```typescript
// e2e/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('create new portfolio', async ({ page }) => {
    await page.goto('/portfolios');
    await page.click('button:has-text("New Portfolio")');

    // Fill form
    await page.fill('[name="name"]', 'E2E Test Portfolio');
    await page.fill('[name="code"]', 'E2E001');
    await page.selectOption('[name="portfolio_type"]', 'managed');
    await page.selectOption('[name="base_currency"]', 'USD');

    // Submit
    await page.click('button:has-text("Create")');

    // Verify redirect and display
    await page.waitForURL(/\/portfolios\/.+/);
    await expect(page.locator('h1')).toHaveText('E2E Test Portfolio');
  });

  test('add transaction to portfolio', async ({ page }) => {
    await page.goto('/portfolios/test-portfolio');
    await page.click('button:has-text("Add Transaction")');

    // Fill transaction form
    await page.fill('[name="security"]', 'AAPL');
    await page.click('[data-value="AAPL"]'); // Select from autocomplete
    await page.selectOption('[name="type"]', 'buy');
    await page.fill('[name="quantity"]', '100');
    await page.fill('[name="price"]', '150.00');

    // Submit
    await page.click('button:has-text("Submit")');

    // Verify transaction appears
    await expect(page.locator('table')).toContainText('AAPL');
    await expect(page.locator('table')).toContainText('100');
  });
});
```

---

## Running Tests

```bash
# Run unit and component tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests
npm run test:all
```

---

## Technical Notes

- Use Vitest for fast unit/component testing
- Use React Testing Library for component tests
- Use MSW for mocking API calls in integration tests
- Use Playwright for E2E tests (cross-browser)
- Test accessibility with @testing-library/jest-dom matchers
- Use data-testid for E2E selectors
- Mock external services (API) but not React components
