# State Management

## Overview

ARC uses a hybrid state management approach:

| State Type | Solution | Use Case |
|------------|----------|----------|
| Server State | TanStack Query | API data, caching |
| Client State | Zustand | UI state, preferences |
| Form State | React Hook Form | Form inputs, validation |
| URL State | Next.js searchParams | Filters, pagination |

## Server State (TanStack Query)

### Setup

The QueryProvider is configured in `src/providers/QueryProvider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Query Hooks

All API queries are wrapped in custom hooks in `src/hooks/`:

```typescript
// src/hooks/usePortfolios.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

// Query keys for cache management
export const queryKeys = {
  portfolios: {
    all: ["portfolios"] as const,
    list: (filters: object) => ["portfolios", "list", filters] as const,
    detail: (id: string) => ["portfolios", "detail", id] as const,
  },
};

// Fetch all portfolios
export function usePortfolios(filters?: PortfolioFilters) {
  return useQuery({
    queryKey: queryKeys.portfolios.list(filters ?? {}),
    queryFn: () => api.portfolios.list(filters),
  });
}

// Fetch single portfolio
export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.detail(id),
    queryFn: () => api.portfolios.get(id),
    enabled: !!id,
  });
}

// Create portfolio mutation
export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.portfolios.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolios.all
      });
    },
  });
}
```

### Usage Pattern

```tsx
"use client";

import { usePortfolios, useCreatePortfolio } from "@/hooks";

export function PortfolioList() {
  const { data, isLoading, error } = usePortfolios();
  const createMutation = useCreatePortfolio();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      {data?.portfolios.map(portfolio => (
        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
      ))}
      <Button
        onClick={() => createMutation.mutate(newData)}
        disabled={createMutation.isPending}
      >
        Create Portfolio
      </Button>
    </div>
  );
}
```

### Optimistic Updates

```typescript
export function useUpdateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.holdings.update,
    onMutate: async (newData) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.holdings.detail(newData.id)
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData(
        queryKeys.holdings.detail(newData.id)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.holdings.detail(newData.id),
        newData
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.holdings.detail(variables.id),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings.all });
    },
  });
}
```

## Client State (Zustand)

### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: "arc-auth",
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);
```

### UI Store

```typescript
// src/stores/uiStore.ts
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),

  collapseSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed
  })),
}));
```

### Usage

```tsx
"use client";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

export function Header() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <header>
      <Button onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>
      <span>{user?.name}</span>
      <Button onClick={logout}>Logout</Button>
    </header>
  );
}
```

## URL State

Use Next.js searchParams for filterable/shareable state:

```tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";

export function FilteredList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentFilter = searchParams.get("filter") ?? "all";
  const currentPage = parseInt(searchParams.get("page") ?? "1");

  const setFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", filter);
    params.set("page", "1"); // Reset page on filter change
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <Select value={currentFilter} onValueChange={setFilter}>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="active">Active</SelectItem>
      </Select>
    </div>
  );
}
```

## Best Practices

1. **Keep server state in React Query** - Don't duplicate API data in Zustand
2. **Keep client state minimal** - Only store what can't be derived
3. **Use URL for shareable state** - Filters, pagination, active tab
4. **Persist only what's needed** - Don't persist sensitive data
5. **Use selectors for performance** - Avoid re-renders with Zustand selectors

```typescript
// Good - only subscribes to what's needed
const sidebarOpen = useUIStore((state) => state.sidebarOpen);

// Bad - subscribes to entire store
const { sidebarOpen } = useUIStore();
```
