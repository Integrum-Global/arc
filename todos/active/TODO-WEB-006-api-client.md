# TODO-WEB-006: API Client and Hooks

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-001, TODO-BE-014

---

## Objective

Implement the API client for communicating with the backend and create TanStack Query hooks for data fetching.

---

## Tasks

### 1. API Client Setup
- [ ] Create `src/lib/api/client.ts`:
  ```typescript
  import axios from 'axios';

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for auth token
  apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor for errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => handleApiError(error)
  );
  ```

### 2. API Types
- [ ] Create `src/lib/api/types.ts`:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
      page: number;
      limit: number;
      total: number;
    };
  }

  interface ApiError {
    code: string;
    message: string;
    details?: any;
  }
  ```
- [ ] Define domain types:
  - Portfolio, Holding, Transaction
  - Security, SecurityRatio
  - Alert, AlertThreshold
  - User, UserPreference

### 3. API Endpoints
- [ ] Create `src/lib/api/endpoints.ts`:
  ```typescript
  export const endpoints = {
    auth: {
      login: '/auth/login',
      refresh: '/auth/refresh',
      me: '/auth/me',
    },
    portfolios: {
      list: '/portfolios',
      get: (id: string) => `/portfolios/${id}`,
      holdings: (id: string) => `/portfolios/${id}/holdings`,
      transactions: (id: string) => `/portfolios/${id}/transactions`,
      health: (id: string) => `/portfolios/${id}/health`,
    },
    analytics: {
      ratios: (securityId: string) => `/securities/${securityId}/ratios`,
      alerts: '/alerts',
      thresholds: '/thresholds',
    },
    intelligence: {
      brief: '/intelligence/brief',
      query: '/intelligence/query',
    },
  };
  ```

### 4. Portfolio Hooks
- [ ] Create `src/lib/hooks/usePortfolios.ts`:
  ```typescript
  export function usePortfolios(options?: ListOptions) {
    return useQuery({
      queryKey: ['portfolios', options],
      queryFn: () => api.portfolios.list(options),
    });
  }

  export function usePortfolio(id: string) {
    return useQuery({
      queryKey: ['portfolio', id],
      queryFn: () => api.portfolios.get(id),
      enabled: !!id,
    });
  }

  export function usePortfolioHoldings(portfolioId: string) {
    return useQuery({
      queryKey: ['portfolio', portfolioId, 'holdings'],
      queryFn: () => api.portfolios.getHoldings(portfolioId),
      enabled: !!portfolioId,
    });
  }

  export function useCreatePortfolio() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreatePortfolioInput) => api.portfolios.create(data),
      onSuccess: () => queryClient.invalidateQueries(['portfolios']),
    });
  }
  ```

### 5. Analytics Hooks
- [ ] Create `src/lib/hooks/useAnalytics.ts`:
  ```typescript
  export function useSecurityRatios(securityId: string) {
    return useQuery({
      queryKey: ['security', securityId, 'ratios'],
      queryFn: () => api.analytics.getRatios(securityId),
      enabled: !!securityId,
    });
  }

  export function useAlerts(options?: AlertOptions) {
    return useQuery({
      queryKey: ['alerts', options],
      queryFn: () => api.analytics.getAlerts(options),
    });
  }

  export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (alertId: string) => api.analytics.acknowledgeAlert(alertId),
      onSuccess: () => queryClient.invalidateQueries(['alerts']),
    });
  }
  ```

### 6. Intelligence Hooks
- [ ] Create `src/lib/hooks/useIntelligence.ts`:
  ```typescript
  export function useMarketBrief(options?: BriefOptions) {
    return useQuery({
      queryKey: ['brief', options],
      queryFn: () => api.intelligence.generateBrief(options),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }

  export function usePortfolioQuery() {
    return useMutation({
      mutationFn: (query: string) => api.intelligence.query(query),
    });
  }

  export function useQuerySuggestions() {
    return useQuery({
      queryKey: ['query-suggestions'],
      queryFn: () => api.intelligence.getSuggestions(),
    });
  }
  ```

### 7. Auth Hooks
- [ ] Create `src/lib/hooks/useAuth.ts`:
  ```typescript
  export function useAuth() {
    const { user, setUser, clearUser } = useAuthStore();

    const login = useMutation({
      mutationFn: api.auth.login,
      onSuccess: (data) => setUser(data.user),
    });

    const logout = () => {
      clearUser();
      queryClient.clear();
    };

    return { user, login, logout, isAuthenticated: !!user };
  }

  export function useCurrentUser() {
    return useQuery({
      queryKey: ['currentUser'],
      queryFn: () => api.auth.me(),
    });
  }
  ```

### 8. Error Handling
- [ ] Create `src/lib/api/errors.ts`:
  - ApiError class
  - Error type guards
  - Toast notifications for errors
- [ ] Handle 401 (token refresh/logout)
- [ ] Handle 403 (permission denied)
- [ ] Handle 404 (not found)
- [ ] Handle 429 (rate limit)

---

## Acceptance Criteria

- [ ] API client configured with interceptors
- [ ] Auth token attached to requests
- [ ] All domain types defined
- [ ] Portfolio CRUD hooks
- [ ] Analytics hooks
- [ ] Intelligence hooks
- [ ] Auth hooks with store
- [ ] Error handling with toasts
- [ ] Unit test: Hook behavior
- [ ] Integration test: API calls

---

## Hook Patterns

```typescript
// List with pagination
const { data, isLoading, error, fetchNextPage, hasNextPage } = usePortfolios({
  limit: 20,
  sort: 'name',
});

// Single resource
const { data: portfolio, isLoading } = usePortfolio(portfolioId);

// Mutation with optimistic update
const updatePortfolio = useUpdatePortfolio({
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['portfolio', id]);
    const previous = queryClient.getQueryData(['portfolio', id]);
    queryClient.setQueryData(['portfolio', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['portfolio', id], context.previous);
  },
});
```

---

## Query Key Convention

```typescript
// Resource list
['portfolios']
['portfolios', { page, limit, sort }]

// Single resource
['portfolio', portfolioId]

// Nested resource
['portfolio', portfolioId, 'holdings']
['portfolio', portfolioId, 'transactions', { startDate, endDate }]

// Other resources
['security', securityId, 'ratios']
['alerts', { status }]
```

---

## Technical Notes

- Use TanStack Query for server state
- Implement query key factory
- Configure appropriate stale times
- Handle loading and error states
- Support infinite queries for lists
- Implement optimistic updates where appropriate
