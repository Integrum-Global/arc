# ARC Web Frontend - Implementation Instructions

## Overview

This worktree contains the React web dashboard. You are implementing a responsive investment management dashboard that connects to the ARC backend API.

**Working Directory**: `apps/web/`
**Stack**: React 19, TypeScript, Vite, TanStack Query, TailwindCSS, Shadcn/ui, Recharts

---

## Prerequisites

Before starting frontend development:
1. **Backend API must be running** on `http://localhost:8000`
2. Read `docs/03-design/` for design system specifications
3. Ensure you understand the API contract from backend

---

## Implementation Phases

### Phase 1: Foundation (TODO-WEB-001 to TODO-WEB-002)

#### 1.1 Project Setup
```
Read: todos/active/TODO-WEB-001-project-setup.md

Tasks:
- Initialize Vite + React + TypeScript project
- Install dependencies (tanstack-query, tailwindcss, recharts, etc.)
- Configure path aliases (@/)
- Set up environment variables
- Create directory structure
```

#### 1.2 Design System
```
Read: todos/active/TODO-WEB-002-design-system.md

Tasks:
- Configure Tailwind with design tokens
- Set up Shadcn/ui components
- Create theme provider (light/dark mode)
- Define color palette, typography, spacing
```

### Phase 2: Core Components (TODO-WEB-003 to TODO-WEB-005)

#### 2.1 Layout Components
```
Read: todos/active/TODO-WEB-003-layout-components.md

Components to build:
- AppShell (sidebar + header + main)
- Sidebar with navigation
- Header with user menu
- PageContainer
- ErrorBoundary
```

#### 2.2 Data Display Components
```
Read: todos/active/TODO-WEB-004-data-components.md

Components to build:
- StatCard (value, trend, format)
- DataTable (sorting, filtering, pagination)
- PortfolioCard
- HoldingRow
- AlertItem
```

#### 2.3 Chart Components
```
Read: todos/active/TODO-WEB-005-chart-components.md

Components to build:
- AllocationPieChart
- PerformanceLineChart
- TrendSparkline
- PeerComparisonBar
```

### Phase 3: API Integration (TODO-WEB-006)

```
Read: todos/active/TODO-WEB-006-api-client.md

Tasks:
- Set up Axios client with interceptors
- Configure TanStack Query
- Create typed API hooks (usePortfolios, useHoldings, etc.)
- Handle authentication tokens
- Implement error handling
```

### Phase 4: Pages (TODO-WEB-007 to TODO-WEB-011)

```
Read: todos/active/TODO-WEB-007-dashboard-page.md
Read: todos/active/TODO-WEB-008-portfolio-pages.md
Read: todos/active/TODO-WEB-009-analytics-pages.md
Read: todos/active/TODO-WEB-010-intelligence-pages.md
Read: todos/active/TODO-WEB-011-settings-pages.md
```

---

## Directory Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── layout/          # AppShell, Sidebar, etc.
│   │   ├── data/            # StatCard, DataTable, etc.
│   │   └── charts/          # Recharts wrappers
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── portfolios/
│   │   ├── analytics/
│   │   ├── intelligence/
│   │   └── settings/
│   ├── hooks/
│   │   ├── usePortfolios.ts
│   │   ├── useHoldings.ts
│   │   └── useAnalytics.ts
│   ├── lib/
│   │   ├── api.ts           # Axios client
│   │   ├── formatters.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Design System Tokens

From `docs/03-design/01-design-tokens.md`:

### Colors
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#EFF6FF',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
}
```

### Typography
```css
/* Headings */
.heading-1 { @apply text-3xl font-bold; }
.heading-2 { @apply text-2xl font-semibold; }
.heading-3 { @apply text-xl font-semibold; }

/* Body */
.body-lg { @apply text-base; }
.body-md { @apply text-sm; }
.body-sm { @apply text-xs; }
```

---

## API Integration Pattern

### API Client Setup
```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### TanStack Query Hooks
```typescript
// src/hooks/usePortfolios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Portfolio, PaginatedResponse } from '@/types';

export function usePortfolios(page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<Portfolio>>({
    queryKey: ['portfolios', page, pageSize],
    queryFn: () => api.get('/portfolios', { params: { page, page_size: pageSize } })
      .then(res => res.data),
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePortfolioInput) =>
      api.post('/portfolios', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
```

---

## Component Patterns

### StatCard Component
```typescript
// src/components/data/StatCard.tsx
interface StatCardProps {
  label: string;
  value: number;
  format: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  isLoading?: boolean;
}

export function StatCard({ label, value, format, trend, trendValue, isLoading }: StatCardProps) {
  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{formatValue(value, format)}</p>
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm", trendColors[trend])}>
            <TrendIcon trend={trend} />
            {trendValue && formatPercentage(trendValue)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Page Layout Pattern
```typescript
// src/features/dashboard/DashboardPage.tsx
export function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: alerts } = useRecentAlerts();

  return (
    <PageContainer title="Dashboard">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total AUM"
          value={summary?.totalValue}
          format="currency"
          trend={summary?.dayChangeTrend}
          trendValue={summary?.dayChangePercent}
          isLoading={isLoading}
        />
        {/* More stats... */}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <AllocationChart data={summary?.allocation} />
        <PerformanceChart portfolioId="all" />
      </div>

      {/* Alerts */}
      <AlertsList alerts={alerts} />
    </PageContainer>
  );
}
```

---

## Testing

```
Read: todos/active/TODO-TEST-003-web-tests.md

- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright
```

```bash
# Run unit/component tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

---

## Running the Frontend

### Development
```bash
cd apps/web

# Install dependencies
npm install

# Start dev server (ensure backend is running on :8000)
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

---

## Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

---

## Checklist Before Integration Testing

- [ ] All TODO-WEB-* complete
- [ ] Design system configured
- [ ] All pages render correctly
- [ ] API integration works
- [ ] Authentication flow works
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Dark mode works
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] No console errors/warnings

---

## Integration with Backend

The frontend expects the backend API at `VITE_API_URL`. Ensure:

1. Backend is running: `curl http://localhost:8000/health`
2. CORS is configured in backend for `http://localhost:5173`
3. API responses match expected types in `src/types/`

### API Response Types
```typescript
// src/types/index.ts
interface Portfolio {
  id: string;
  name: string;
  code: string;
  portfolio_type: 'managed' | 'advisory' | 'execution_only';
  base_currency: string;
  total_value: number;
  day_change_percent: number;
  active: boolean;
}

interface Holding {
  id: string;
  portfolio_id: string;
  security_id: string;
  quantity: number;
  cost_basis: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
```
