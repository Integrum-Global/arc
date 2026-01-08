# Project Structure

## Directory Layout

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/       # Dashboard route group (with sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── portfolios/
│   │   │   ├── analytics/
│   │   │   ├── intelligence/
│   │   │   ├── settings/
│   │   │   └── layout.tsx     # Shared dashboard layout
│   │   ├── api/               # API routes (if needed)
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/               # Shadcn/ui primitives
│   │   ├── layout/           # Layout components
│   │   ├── data/             # Data display components
│   │   ├── data-display/     # Value formatting components
│   │   └── charts/           # Chart components
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── usePortfolios.ts
│   │   ├── useAnalytics.ts
│   │   ├── useIntelligence.ts
│   │   ├── useAuth.ts
│   │   └── index.ts
│   │
│   ├── lib/                   # Utility functions
│   │   ├── api/              # API client
│   │   ├── utils.ts          # General utilities
│   │   ├── formatters.ts     # Value formatters
│   │   └── chartUtils.ts     # Chart utilities
│   │
│   ├── providers/            # React context providers
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   └── types/                # TypeScript types
│       ├── api.ts
│       └── index.ts
│
├── public/                    # Static assets
├── docs/                      # Documentation
└── tests/                     # Test files
```

## Route Groups

### (auth) Group
Routes for authentication without the main app layout:
- `/login` - Sign in page
- `/register` - Registration page
- `/forgot-password` - Password recovery

### (dashboard) Group
Main application routes with sidebar and header:
- `/dashboard` - Overview page
- `/portfolios` - Portfolio management
- `/portfolios/[id]` - Portfolio detail
- `/analytics` - Financial analytics
- `/intelligence` - AI features
- `/settings` - User settings

## Component Organization

### UI Components (`components/ui/`)
Base UI primitives from Shadcn/ui. Don't modify these directly.

### Layout Components (`components/layout/`)
Application-specific layout patterns:
- `AppShell` - Main app wrapper with sidebar
- `PageContainer` - Page wrapper with title/actions
- `Grid` - Responsive grid system
- `Section` - Collapsible content sections

### Data Components (`components/data/`)
Business-specific data display:
- `StatCard` - Metric display card
- `RatioCard` - Financial ratio display
- `AlertCard` - Alert/notification display
- `HoldingRow` - Portfolio holding row
- `DataTable` - Generic data table

### Chart Components (`components/charts/`)
Recharts wrappers with consistent styling:
- `PerformanceChart` - Line chart for performance
- `AllocationChart` - Pie/donut chart
- `RatioTrendChart` - Trend line with thresholds
- `GaugeChart` - Gauge for scores
- `Heatmap` - Correlation matrix

## Page Component Pattern

Each page follows this pattern:

```typescript
// src/app/(dashboard)/example/page.tsx
"use client";

import { PageContainer } from "@/components/layout";
import { useData } from "@/hooks";

export default function ExamplePage() {
  const { data, isLoading } = useData();

  return (
    <PageContainer
      title="Example"
      subtitle="Description"
      isLoading={isLoading}
    >
      {/* Page content */}
    </PageContainer>
  );
}
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `use-portfolios.ts` |
| Components | PascalCase | `StatCard.tsx` |
| Hooks | camelCase with "use" prefix | `usePortfolios` |
| Types | PascalCase | `Portfolio`, `ApiResponse` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
