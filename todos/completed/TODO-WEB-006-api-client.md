# TODO-WEB-006: API Client and Hooks

**Priority**: HIGH
**Status**: COMPLETED
**Completed**: 2026-01-07
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-001, TODO-BE-014

---

## Verification Summary

**All acceptance criteria have been met.** The API client is fully implemented with axios, interceptors, retry logic, and TanStack Query hooks for portfolios, analytics, intelligence, and auth.

---

## Evidence of Completion

### 1. API Client Setup - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/api/client.ts` (215 lines)
- Features:
  - Axios instance with base URL and timeout
  - Request interceptor (auth token, request ID)
  - Response interceptor (error handling, retry logic)
  - Token refresh on 401
  - Exponential backoff with jitter
  - Generic get, post, put, patch, del functions

### 2. API Types - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/types/api.ts`
- Types: ApiResponse, ApiError, Portfolio, Holding, Transaction, Security, SecurityRatio, Alert, User

### 3. API Endpoints - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/api/endpoints.ts`
- Endpoints: auth, portfolios, analytics, intelligence

### 4. Portfolio Hooks - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/hooks/usePortfolios.ts`
- **Tests**: Tests passing (`usePortfolios.test.tsx`)
- Hooks: usePortfolios, usePortfolio, usePortfolioHoldings, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio

### 5. Analytics Hooks - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/hooks/useAnalytics.ts`
- **Tests**: Tests passing (`useAnalytics.test.tsx`)
- Hooks: useSecurityRatios, useAlerts, useAcknowledgeAlert, useDismissAlert, useThresholds

### 6. Intelligence Hooks - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/hooks/useIntelligence.ts`
- **Tests**: Tests passing (`useIntelligence.test.tsx`)
- Hooks: useMarketBrief, usePortfolioQuery, useQuerySuggestions, useSecurityAnalysis

### 7. Auth Hooks - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/hooks/useAuth.ts`
- **Tests**: Tests passing (`useAuth.test.tsx`)
- Hooks: useAuth (login, logout, isAuthenticated), useCurrentUser
- Store: `/Users/esperie/repos/projects/arc-web/apps/web/src/stores/authStore.ts`

### 8. Error Handling - COMPLETED
- **File**: `/Users/esperie/repos/projects/arc-web/apps/web/src/api/errors.ts`
- ApiError class with code, statusCode, details
- Error type guards
- 401 handling (token refresh/logout)
- Retry logic for 408, 429, 500, 502, 503, 504

---

## Files Created

```
src/api/
├── client.ts
├── endpoints.ts
└── errors.ts

src/hooks/
├── index.ts
├── useAnalytics.ts
├── useAuth.ts
├── useDashboardData.ts
├── useBreakpoint.ts
├── useIntelligence.ts
└── usePortfolios.ts

src/lib/
└── queryKeys.ts
```

---

## Acceptance Criteria - ALL MET

- [x] API client configured with interceptors
- [x] Auth token attached to requests
- [x] All domain types defined
- [x] Portfolio CRUD hooks
- [x] Analytics hooks
- [x] Intelligence hooks
- [x] Auth hooks with store
- [x] Error handling with retry
- [x] Unit test: Hook behavior
- [x] Integration test: API calls

---

## Test Coverage

- **usePortfolios.test.tsx**: Tests passing
- **useAnalytics.test.tsx**: Tests passing
- **useIntelligence.test.tsx**: Tests passing
- **useAuth.test.tsx**: Tests passing
- **useDashboardData.test.tsx**: Tests passing
