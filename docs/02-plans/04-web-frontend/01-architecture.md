# ARC Web Frontend Architecture

## Overview

This document defines the complete frontend architecture for the ARC investment management platform's React web application. The architecture prioritizes:

- **Performance**: Optimistic updates, lazy loading, intelligent caching
- **Type Safety**: End-to-end TypeScript with strict mode
- **Scalability**: Feature-based organization, code splitting
- **Maintainability**: Clear separation of concerns, consistent patterns
- **Accessibility**: WCAG 2.1 AA compliance

---

## 1. Technology Stack

### 1.1 Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.x | UI library with Server Components |
| **Meta-Framework** | Next.js | 15.x | App Router, SSR, API routes |
| **Language** | TypeScript | 5.x | Static typing, better DX |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Accessible, customizable components |

### 1.2 State Management & Data Fetching

| Category | Technology | Purpose |
|----------|------------|---------|
| **Server State** | @tanstack/react-query v5 | API data caching, synchronization |
| **Client State** | Zustand | Global UI state (theme, preferences) |
| **Form State** | React Hook Form + Zod | Form handling with validation |
| **URL State** | Next.js searchParams | Filters, pagination, tab state |

### 1.3 Visualization & Charts

| Category | Technology | Purpose |
|----------|------------|---------|
| **Charts** | Recharts | Portfolio performance, allocations |
| **Tables** | @tanstack/react-table | Holdings, transactions, alerts |
| **Data Grid** | AG Grid (optional) | Advanced data manipulation |

### 1.4 Build & Development

| Category | Technology | Purpose |
|----------|------------|---------|
| **Bundler** | Turbopack | Fast builds (Next.js 15 default) |
| **Linting** | ESLint + Prettier | Code quality |
| **Testing** | Vitest + Testing Library | Unit and integration tests |
| **E2E Testing** | Playwright | End-to-end testing |

---

## 2. Project Structure

```
apps/web/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.local                    # Environment variables
├── .env.example                  # Environment template
│
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   └── illustrations/
│   │   └── fonts/
│   └── favicon.ico
│
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing/redirect page
│   │   ├── globals.css           # Global styles
│   │   ├── loading.tsx           # Root loading state
│   │   ├── error.tsx             # Root error boundary
│   │   ├── not-found.tsx         # 404 page
│   │   │
│   │   ├── (auth)/               # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── oauth/
│   │   │       └── callback/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (dashboard)/          # Dashboard route group
│   │   │   ├── layout.tsx        # Dashboard layout (sidebar, header)
│   │   │   │
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── PortfolioSummaryCard.tsx
│   │   │   │       ├── AlertsWidget.tsx
│   │   │   │       ├── QuickMetrics.tsx
│   │   │   │       └── RecentActivity.tsx
│   │   │   │
│   │   │   ├── portfolios/       # Portfolio management
│   │   │   │   ├── page.tsx      # Portfolio list
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx  # Portfolio detail
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── holdings/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── transactions/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── analytics/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── PortfolioCard.tsx
│   │   │   │       ├── PortfolioTable.tsx
│   │   │   │       ├── HoldingsTable.tsx
│   │   │   │       ├── TransactionForm.tsx
│   │   │   │       └── AllocationChart.tsx
│   │   │   │
│   │   │   ├── analytics/        # Analytics screens
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── ratios/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── benchmarks/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── health-scan/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── RatioCard.tsx
│   │   │   │       ├── RatioTrendChart.tsx
│   │   │   │       ├── PeerComparisonChart.tsx
│   │   │   │       ├── HealthScoreGauge.tsx
│   │   │   │       └── IssuesTable.tsx
│   │   │   │
│   │   │   ├── intelligence/     # AI Intelligence screens
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── briefs/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── query/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── MarketBrief.tsx
│   │   │   │       ├── BriefSection.tsx
│   │   │   │       ├── QueryInput.tsx
│   │   │   │       ├── QueryResponse.tsx
│   │   │   │       └── InsightCard.tsx
│   │   │   │
│   │   │   ├── alerts/           # Alerts management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── AlertCard.tsx
│   │   │   │       ├── AlertFilters.tsx
│   │   │   │       └── ThresholdForm.tsx
│   │   │   │
│   │   │   ├── settings/         # User settings
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── preferences/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── integrations/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── elements/
│   │   │   │       ├── ProfileForm.tsx
│   │   │   │       ├── PreferencesForm.tsx
│   │   │   │       └── IntegrationCard.tsx
│   │   │   │
│   │   │   └── admin/            # Admin screens (role-protected)
│   │   │       ├── page.tsx
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       ├── tenant/
│   │   │       │   └── page.tsx
│   │   │       ├── audit/
│   │   │       │   └── page.tsx
│   │   │       └── elements/
│   │   │           ├── UserTable.tsx
│   │   │           ├── InviteUserForm.tsx
│   │   │           ├── TenantSettings.tsx
│   │   │           └── AuditLogTable.tsx
│   │   │
│   │   └── api/                  # API route handlers (if needed)
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   │
│   ├── components/               # Shared reusable components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ... (other shadcn components)
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── charts/               # Chart components
│   │   │   ├── AreaChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── GaugeChart.tsx
│   │   │   └── SparklineChart.tsx
│   │   │
│   │   ├── data-display/         # Data display components
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── MetricDisplay.tsx
│   │   │   ├── TrendIndicator.tsx
│   │   │   ├── PercentageChange.tsx
│   │   │   └── CurrencyDisplay.tsx
│   │   │
│   │   ├── feedback/             # Feedback components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── NotificationToast.tsx
│   │   │
│   │   └── forms/                # Form components
│   │       ├── FormField.tsx
│   │       ├── SearchInput.tsx
│   │       ├── DateRangePicker.tsx
│   │       ├── CurrencyInput.tsx
│   │       ├── PercentageInput.tsx
│   │       └── SecuritySearch.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePortfolio.ts       # Portfolio data hooks
│   │   ├── useHoldings.ts        # Holdings data hooks
│   │   ├── useAnalytics.ts       # Analytics data hooks
│   │   ├── useIntelligence.ts    # AI intelligence hooks
│   │   ├── useAlerts.ts          # Alerts data hooks
│   │   ├── useAuth.ts            # Authentication hooks
│   │   ├── useUser.ts            # User data hooks
│   │   ├── useMediaQuery.ts      # Responsive design hooks
│   │   ├── useLocalStorage.ts    # Local storage hooks
│   │   ├── useDebounce.ts        # Debounce utility hook
│   │   └── useEventSource.ts     # SSE connection hook
│   │
│   ├── api/                      # API client layer
│   │   ├── client.ts             # Base Axios/fetch client
│   │   ├── interceptors.ts       # Request/response interceptors
│   │   ├── portfolios.ts         # Portfolio API functions
│   │   ├── holdings.ts           # Holdings API functions
│   │   ├── transactions.ts       # Transactions API functions
│   │   ├── analytics.ts          # Analytics API functions
│   │   ├── intelligence.ts       # Intelligence API functions
│   │   ├── alerts.ts             # Alerts API functions
│   │   ├── users.ts              # User management API functions
│   │   ├── integrations.ts       # Integrations API functions
│   │   └── admin.ts              # Admin API functions
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── authStore.ts          # Authentication state
│   │   ├── uiStore.ts            # UI state (sidebar, theme)
│   │   ├── preferencesStore.ts   # User preferences
│   │   └── realtimeStore.ts      # Real-time updates state
│   │
│   ├── providers/                # React context providers
│   │   ├── QueryProvider.tsx     # React Query provider
│   │   ├── AuthProvider.tsx      # Authentication provider
│   │   ├── ThemeProvider.tsx     # Theme provider
│   │   └── ToastProvider.tsx     # Toast notifications provider
│   │
│   ├── lib/                      # Utility functions
│   │   ├── utils.ts              # General utilities (cn, etc.)
│   │   ├── formatting.ts         # Number, currency, date formatting
│   │   ├── calculations.ts       # Financial calculations
│   │   ├── validation.ts         # Validation schemas (Zod)
│   │   └── constants.ts          # Application constants
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── portfolio.ts          # Portfolio types
│   │   ├── security.ts           # Security types
│   │   ├── analytics.ts          # Analytics types
│   │   ├── intelligence.ts       # Intelligence types
│   │   ├── user.ts               # User types
│   │   ├── api.ts                # API response types
│   │   └── index.ts              # Type exports
│   │
│   └── config/                   # Configuration
│       ├── navigation.ts         # Navigation configuration
│       ├── permissions.ts        # Permission definitions
│       └── theme.ts              # Theme configuration
│
└── tests/
    ├── unit/                     # Unit tests
    ├── integration/              # Integration tests
    └── e2e/                      # End-to-end tests
```

---

## 3. State Management Architecture

### 3.1 State Categories

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT LAYERS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    SERVER STATE (React Query)                    │   │
│   │                                                                  │   │
│   │   • Portfolio data          • Holdings data                     │   │
│   │   • Transaction history     • Analytics/Ratios                  │   │
│   │   • Market briefs           • Alerts                            │   │
│   │   • User data               • Tenant data                       │   │
│   │                                                                  │   │
│   │   Features: Caching, Background Refetch, Optimistic Updates     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                   GLOBAL CLIENT STATE (Zustand)                  │   │
│   │                                                                  │   │
│   │   • Auth state (isAuthenticated, user, token)                   │   │
│   │   • UI state (sidebarOpen, theme, locale)                       │   │
│   │   • Preferences (number format, date format)                    │   │
│   │   • Real-time subscriptions                                     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     URL STATE (searchParams)                     │   │
│   │                                                                  │   │
│   │   • Filters (portfolio type, date range, status)                │   │
│   │   • Pagination (page, limit, offset)                            │   │
│   │   • Sorting (sortBy, sortOrder)                                 │   │
│   │   • Tab selection                                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                  LOCAL COMPONENT STATE (useState)                │   │
│   │                                                                  │   │
│   │   • Form inputs             • Modal open/close                  │   │
│   │   • Hover states            • Temporary UI state                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    FORM STATE (React Hook Form)                  │   │
│   │                                                                  │   │
│   │   • Form values             • Validation errors                 │   │
│   │   • Submit status           • Dirty/touched state               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 React Query Configuration

```typescript
// src/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh
            staleTime: 5 * 60 * 1000, // 5 minutes

            // Cache time: How long inactive data stays in cache
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)

            // Retry configuration
            retry: 3,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch configuration
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 3.3 Query Key Structure

```typescript
// src/lib/queryKeys.ts

export const queryKeys = {
  // Portfolios
  portfolios: {
    all: ["portfolios"] as const,
    list: (filters: PortfolioFilters) =>
      [...queryKeys.portfolios.all, "list", filters] as const,
    detail: (id: string) =>
      [...queryKeys.portfolios.all, "detail", id] as const,
    holdings: (id: string) =>
      [...queryKeys.portfolios.all, id, "holdings"] as const,
    transactions: (id: string, filters: TransactionFilters) =>
      [...queryKeys.portfolios.all, id, "transactions", filters] as const,
    valuation: (id: string) =>
      [...queryKeys.portfolios.all, id, "valuation"] as const,
    healthScan: (id: string) =>
      [...queryKeys.portfolios.all, id, "health-scan"] as const,
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    securityRatios: (securityId: string, asOfDate?: string) =>
      [...queryKeys.analytics.all, "ratios", securityId, asOfDate] as const,
    benchmark: (securityId: string, peerGroupId?: string) =>
      [
        ...queryKeys.analytics.all,
        "benchmark",
        securityId,
        peerGroupId,
      ] as const,
  },

  // Alerts
  alerts: {
    all: ["alerts"] as const,
    list: (filters: AlertFilters) =>
      [...queryKeys.alerts.all, "list", filters] as const,
    thresholds: () => [...queryKeys.alerts.all, "thresholds"] as const,
  },

  // Intelligence
  intelligence: {
    all: ["intelligence"] as const,
    brief: (type: string, portfolioId?: string) =>
      [...queryKeys.intelligence.all, "brief", type, portfolioId] as const,
    query: (question: string, portfolioId?: string) =>
      [...queryKeys.intelligence.all, "query", question, portfolioId] as const,
    analysis: (securityId: string) =>
      [...queryKeys.intelligence.all, "analysis", securityId] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
    preferences: () => [...queryKeys.users.all, "preferences"] as const,
    list: (filters: UserFilters) =>
      [...queryKeys.users.all, "list", filters] as const,
  },

  // Integrations
  integrations: {
    all: ["integrations"] as const,
    providers: () => [...queryKeys.integrations.all, "providers"] as const,
    syncJobs: (filters: SyncJobFilters) =>
      [...queryKeys.integrations.all, "sync-jobs", filters] as const,
  },
};
```

### 3.4 Zustand Store Example

```typescript
// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "admin") return true;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: "arc-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// src/stores/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Theme
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modal, data = null) =>
        set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: "arc-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
```

---

## 4. API Client Architecture

### 4.1 Base Client Configuration

```typescript
// src/api/client.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    config.headers["X-Request-ID"] = crypto.randomUUID();

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;

          // Update tokens
          localStorage.setItem("refreshToken", refresh_token);
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token
          );

          // Retry original request
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${access_token}`,
          };

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      console.warn(`Rate limited. Retry after ${retryAfter} seconds.`);
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// Type-safe API response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}
```

### 4.2 API Functions Example

```typescript
// src/api/portfolios.ts
import { apiClient, ApiResponse } from "./client";
import type {
  Portfolio,
  PortfolioListResponse,
  PortfolioFilters,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  HealthScanResult,
} from "@/types/portfolio";

// List portfolios
export async function getPortfolios(
  filters: PortfolioFilters = {}
): Promise<PortfolioListResponse> {
  const params = new URLSearchParams();

  if (filters.type) params.append("type", filters.type);
  if (filters.managerId) params.append("manager_id", filters.managerId);
  if (filters.active !== undefined)
    params.append("active", String(filters.active));
  if (filters.limit) params.append("limit", String(filters.limit));
  if (filters.offset) params.append("offset", String(filters.offset));
  if (filters.sort) params.append("sort", filters.sort);

  const response = await apiClient.get<PortfolioListResponse>(
    `/portfolios?${params.toString()}`
  );
  return response.data;
}

// Get single portfolio
export async function getPortfolio(
  id: string,
  options: {
    includeHoldings?: boolean;
    includeValuation?: boolean;
    includePerformance?: boolean;
  } = {}
): Promise<Portfolio> {
  const params = new URLSearchParams();

  if (options.includeHoldings)
    params.append("include_holdings", "true");
  if (options.includeValuation)
    params.append("include_valuation", "true");
  if (options.includePerformance)
    params.append("include_performance", "true");

  const response = await apiClient.get<Portfolio>(
    `/portfolios/${id}?${params.toString()}`
  );
  return response.data;
}

// Create portfolio
export async function createPortfolio(
  data: CreatePortfolioRequest
): Promise<Portfolio> {
  const response = await apiClient.post<Portfolio>("/portfolios", data);
  return response.data;
}

// Update portfolio
export async function updatePortfolio(
  id: string,
  data: UpdatePortfolioRequest
): Promise<Portfolio> {
  const response = await apiClient.patch<Portfolio>(`/portfolios/${id}`, data);
  return response.data;
}

// Delete portfolio
export async function deletePortfolio(id: string): Promise<void> {
  await apiClient.delete(`/portfolios/${id}`);
}

// Run health scan
export async function runHealthScan(
  portfolioId: string,
  options: {
    includeAiExplanation?: boolean;
    ratioClasses?: string[];
  } = {}
): Promise<HealthScanResult> {
  const response = await apiClient.post<HealthScanResult>(
    `/portfolios/${portfolioId}/health-scan`,
    options
  );
  return response.data;
}
```

### 4.3 Custom Hooks with React Query

```typescript
// src/hooks/usePortfolio.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  runHealthScan,
} from "@/api/portfolios";
import type {
  PortfolioFilters,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from "@/types/portfolio";
import { toast } from "sonner";

// List portfolios hook
export function usePortfolios(filters: PortfolioFilters = {}) {
  return useQuery({
    queryKey: queryKeys.portfolios.list(filters),
    queryFn: () => getPortfolios(filters),
  });
}

// Single portfolio hook
export function usePortfolio(
  id: string,
  options: {
    includeHoldings?: boolean;
    includeValuation?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.portfolios.detail(id),
    queryFn: () => getPortfolio(id, options),
    enabled: !!id,
  });
}

// Create portfolio mutation
export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioRequest) => createPortfolio(data),

    onSuccess: (newPortfolio) => {
      // Invalidate portfolio list
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.all,
      });

      toast.success(`Portfolio "${newPortfolio.name}" created successfully`);
    },

    onError: (error: Error) => {
      toast.error(`Failed to create portfolio: ${error.message}`);
    },
  });
}

// Update portfolio mutation with optimistic updates
export function useUpdatePortfolio(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePortfolioRequest) =>
      updatePortfolio(portfolioId, data),

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.portfolios.detail(portfolioId),
      });

      // Snapshot current value
      const previousPortfolio = queryClient.getQueryData(
        queryKeys.portfolios.detail(portfolioId)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.portfolios.detail(portfolioId),
        (old: Portfolio) => ({ ...old, ...newData })
      );

      // Return context for rollback
      return { previousPortfolio };
    },

    // Rollback on error
    onError: (error, _, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolios.detail(portfolioId),
          context.previousPortfolio
        );
      }
      toast.error(`Failed to update portfolio: ${error.message}`);
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.detail(portfolioId),
      });
      toast.success("Portfolio updated successfully");
    },
  });
}

// Delete portfolio mutation
export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePortfolio(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.all,
      });
      toast.success("Portfolio deleted successfully");
    },

    onError: (error: Error) => {
      toast.error(`Failed to delete portfolio: ${error.message}`);
    },
  });
}

// Health scan hook
export function useHealthScan(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.healthScan(portfolioId),
    queryFn: () => runHealthScan(portfolioId, { includeAiExplanation: true }),
    enabled: !!portfolioId,
    staleTime: 10 * 60 * 1000, // 10 minutes - health scans don't change often
  });
}
```

---

## 5. Real-Time Updates Architecture

### 5.1 Server-Sent Events (SSE) Hook

```typescript
// src/hooks/useEventSource.ts
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

interface EventSourceOptions {
  url: string;
  onMessage: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  eventTypes?: string[];
  enabled?: boolean;
}

export function useEventSource({
  url,
  onMessage,
  onError,
  eventTypes = [],
  enabled = true,
}: EventSourceOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const token = useAuthStore((state) => state.token);

  const connect = useCallback(() => {
    if (!enabled || !token) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const fullUrl = `${API_BASE_URL}${url}`;

    // Create EventSource with auth (using URL params since EventSource doesn't support headers)
    const urlWithAuth = `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}token=${token}`;
    const eventSource = new EventSource(urlWithAuth);

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    // Handle generic messages
    eventSource.onmessage = onMessage;

    // Handle specific event types
    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, onMessage);
    });

    eventSource.onerror = (event) => {
      console.error("SSE error:", event);
      onError?.(event);

      // Reconnect after 5 seconds
      if (eventSource.readyState === EventSource.CLOSED) {
        setTimeout(connect, 5000);
      }
    };

    eventSourceRef.current = eventSource;
  }, [url, token, enabled, onMessage, onError, eventTypes]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return {
    close: () => eventSourceRef.current?.close(),
    reconnect: connect,
  };
}
```

### 5.2 Real-Time Portfolio Updates

```typescript
// src/hooks/useRealtimePortfolio.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEventSource } from "./useEventSource";
import { queryKeys } from "@/lib/queryKeys";
import { useRealtimeStore } from "@/stores/realtimeStore";

interface PortfolioUpdateEvent {
  type: "valuation" | "alert" | "price";
  data: Record<string, unknown>;
}

export function useRealtimePortfolio(portfolioId: string) {
  const queryClient = useQueryClient();
  const { addUpdate, setConnectionStatus } = useRealtimeStore();

  useEventSource({
    url: `/api/v1/stream/portfolio/${portfolioId}`,
    enabled: !!portfolioId,
    eventTypes: ["valuation", "alert", "price"],

    onMessage: (event) => {
      try {
        const update: PortfolioUpdateEvent = {
          type: event.type as "valuation" | "alert" | "price",
          data: JSON.parse(event.data),
        };

        // Add to real-time store
        addUpdate(update);

        // Update React Query cache based on event type
        switch (update.type) {
          case "valuation":
            queryClient.setQueryData(
              queryKeys.portfolios.valuation(portfolioId),
              update.data
            );
            break;

          case "alert":
            // Invalidate alerts to trigger refetch
            queryClient.invalidateQueries({
              queryKey: queryKeys.alerts.all,
            });
            break;

          case "price":
            // Update holding prices in cache
            queryClient.setQueryData(
              queryKeys.portfolios.holdings(portfolioId),
              (old: Holding[]) =>
                old?.map((holding) =>
                  holding.security_id === update.data.security_id
                    ? { ...holding, current_price: update.data.price }
                    : holding
                )
            );
            break;
        }
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    },

    onError: () => {
      setConnectionStatus("disconnected");
    },
  });
}
```

---

## 6. Authentication Flow

### 6.1 Auth Provider

```typescript
// src/providers/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getCurrentUser } from "@/api/auth";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/oauth/callback",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("arcToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token and get user data
        const user = await getCurrentUser();
        setAuth(user, token);
      } catch (error) {
        // Token invalid, clear auth
        clearAuth();
        localStorage.removeItem("arcToken");
        localStorage.removeItem("refreshToken");
      }
    };

    checkAuth();
  }, [setAuth, clearAuth, setLoading]);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

    if (!isAuthenticated && !isPublicPath) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname || "/dashboard");
      router.push(`/login?returnUrl=${returnUrl}`);
    }

    if (isAuthenticated && isPublicPath) {
      // Redirect authenticated users away from auth pages
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading for protected routes while redirecting
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return children;
}
```

### 6.2 Protected Route Wrapper

```typescript
// src/components/auth/ProtectedRoute.tsx
"use client";

import { useAuthStore } from "@/stores/authStore";
import { ErrorState } from "@/components/feedback/ErrorState";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
}

export function ProtectedRoute({
  children,
  permission,
  role,
}: ProtectedRouteProps) {
  const { user, hasPermission } = useAuthStore();

  // Check role if specified
  if (role && user?.role !== role && user?.role !== "admin") {
    return (
      <ErrorState
        title="Access Denied"
        message="You do not have permission to access this page."
        action={{
          label: "Go to Dashboard",
          href: "/dashboard",
        }}
      />
    );
  }

  // Check permission if specified
  if (permission && !hasPermission(permission)) {
    return (
      <ErrorState
        title="Access Denied"
        message="You do not have the required permission to access this page."
        action={{
          label: "Go to Dashboard",
          href: "/dashboard",
        }}
      />
    );
  }

  return children;
}
```

---

## 7. Error Handling Strategy

### 7.1 Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);

    // Send to monitoring (Sentry, etc.)
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorState
            title="Something went wrong"
            message={this.state.error?.message || "An unexpected error occurred"}
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        )
      );
    }

    return this.props.children;
  }
}
```

### 7.2 Global Error Handler

```typescript
// src/lib/errorHandler.ts
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { ApiError } from "@/api/client";

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;

    switch (error.response?.status) {
      case 400:
        return apiError?.message || "Invalid request. Please check your input.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return apiError?.message || "The requested resource was not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "An unexpected error occurred. Please try again later.";
      default:
        return apiError?.message || "An error occurred. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export function showErrorToast(error: unknown) {
  const message = handleApiError(error);
  toast.error(message);
}
```

---

## 8. Performance Optimization

### 8.1 Code Splitting Strategy

```typescript
// Dynamic imports for heavy components
import dynamic from "next/dynamic";

// Heavy chart components
export const PerformanceChart = dynamic(
  () => import("@/components/charts/PerformanceChart"),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts don't need SSR
  }
);

// Large data tables
export const HoldingsTable = dynamic(
  () => import("@/app/(dashboard)/portfolios/elements/HoldingsTable"),
  {
    loading: () => <TableSkeleton />,
  }
);

// Intelligence components (heavy AI dependencies)
export const MarketBrief = dynamic(
  () => import("@/app/(dashboard)/intelligence/elements/MarketBrief"),
  {
    loading: () => <BriefSkeleton />,
  }
);
```

### 8.2 Image Optimization

```typescript
// src/components/OptimizedImage.tsx
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      loading={priority ? "eager" : "lazy"}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwST4xMCY+PDY6Q0RGSkNOUVNVYWNhb1plc3V1fI+EgZaPjoR0dHv/2wBDAR..."
    />
  );
}
```

### 8.3 Bundle Size Optimization

```javascript
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.arc-invest.com",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable partial prerendering
    ppr: true,

    // Optimize packages
    optimizePackageImports: [
      "@tanstack/react-query",
      "recharts",
      "date-fns",
      "lodash-es",
    ],
  },

  // Compiler options
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Webpack customization
  webpack: (config, { isServer }) => {
    // Tree shake lodash
    config.resolve.alias = {
      ...config.resolve.alias,
      lodash: "lodash-es",
    };

    return config;
  },
};

export default config;
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
                    ┌───────────────┐
                    │     E2E       │  5-10%
                    │  (Playwright) │
                    └───────────────┘
               ┌─────────────────────────┐
               │     Integration         │  20-30%
               │  (React Testing Lib)    │
               └─────────────────────────┘
          ┌───────────────────────────────────┐
          │           Unit Tests              │  60-70%
          │         (Vitest)                  │
          └───────────────────────────────────┘
```

### 9.2 Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// tests/setup.ts
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 9.3 Test Examples

```typescript
// tests/unit/hooks/usePortfolio.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePortfolios } from "@/hooks/usePortfolio";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePortfolios", () => {
  it("should fetch portfolios successfully", async () => {
    const { result } = renderHook(() => usePortfolios(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.portfolios).toHaveLength(2);
    expect(result.current.data?.portfolios[0].name).toBe("Growth Portfolio");
  });

  it("should handle API errors", async () => {
    server.use(
      http.get("*/portfolios", () => {
        return HttpResponse.json(
          { error: "server_error", message: "Internal error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => usePortfolios(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("500");
  });
});
```

---

## 10. Deployment Configuration

### 10.1 Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# Auth
NEXT_PUBLIC_OAUTH_CLIENT_ID=your-oauth-client-id
NEXT_PUBLIC_OAUTH_ISSUER=https://auth.arc-invest.com

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

### 10.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 11. Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] **ARCH-001**: Initialize Next.js 15 project with TypeScript
- [ ] **ARCH-002**: Configure Tailwind CSS and shadcn/ui
- [ ] **ARCH-003**: Set up project folder structure
- [ ] **ARCH-004**: Configure React Query provider
- [ ] **ARCH-005**: Create base API client with interceptors
- [ ] **ARCH-006**: Set up Zustand stores (auth, UI)
- [ ] **ARCH-007**: Create AuthProvider and ProtectedRoute
- [ ] **ARCH-008**: Configure ESLint, Prettier, TypeScript strict mode

### Phase 2: Core Components (Week 3-4)

- [ ] **ARCH-009**: Build layout components (Sidebar, Header)
- [ ] **ARCH-010**: Create chart components (Area, Bar, Pie, Line)
- [ ] **ARCH-011**: Build data display components (DataTable, StatCard)
- [ ] **ARCH-012**: Create feedback components (Loading, Error, Empty states)
- [ ] **ARCH-013**: Build form components (FormField, DateRangePicker)
- [ ] **ARCH-014**: Implement theme provider (dark/light mode)

### Phase 3: API Integration (Week 5-6)

- [ ] **ARCH-015**: Create API functions for all endpoints
- [ ] **ARCH-016**: Build custom hooks with React Query
- [ ] **ARCH-017**: Implement query key factory
- [ ] **ARCH-018**: Add optimistic updates for mutations
- [ ] **ARCH-019**: Set up SSE connection for real-time updates
- [ ] **ARCH-020**: Implement error handling utilities

### Phase 4: Testing & Optimization (Week 7-8)

- [ ] **ARCH-021**: Configure Vitest and Testing Library
- [ ] **ARCH-022**: Set up MSW for API mocking
- [ ] **ARCH-023**: Write unit tests for hooks and utilities
- [ ] **ARCH-024**: Write integration tests for key flows
- [ ] **ARCH-025**: Configure Playwright for E2E tests
- [ ] **ARCH-026**: Optimize bundle size and performance

---

## 12. Acceptance Criteria

### Architecture Requirements

- [ ] TypeScript strict mode enabled with no `any` types
- [ ] All API calls go through React Query with proper caching
- [ ] State management clearly separated (server vs client state)
- [ ] Real-time updates working via SSE
- [ ] Error boundaries catching component errors
- [ ] Loading states for all async operations

### Performance Requirements

- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 200KB (gzipped, first load)
- [ ] No layout shift (CLS < 0.1)

### Security Requirements

- [ ] JWT tokens stored securely
- [ ] Automatic token refresh on expiry
- [ ] Role-based access control enforced
- [ ] XSS prevention in all user inputs
- [ ] CSRF protection enabled

### Accessibility Requirements

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader compatible
- [ ] Color contrast ratios met
- [ ] Focus indicators visible
