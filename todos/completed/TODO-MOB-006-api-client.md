# TODO-MOB-006: API Client and Providers

**Priority**: HIGH
**Status**: COMPLETED
**Completion Date**: 2026-01-07
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-001
**Backend Dependency**: TODO-BE-014 (API endpoints)
**Blocks**: TODO-MOB-007, TODO-MOB-008, TODO-MOB-009, TODO-MOB-010

---

## Objective

Implement the Nexus API client with Dio, authentication handling, caching, and Riverpod providers for state management.

---

## Tasks

### 1. API Endpoints Configuration
- [x] Create `lib/core/api/api_endpoints.dart`:
  - **Evidence**: `lib/core/api/api_endpoints.dart:1-189`
  - Base URL with environment switching - Lines 5-26
  - Auth endpoints: login, logout, refresh - Lines 32-48
  - User endpoints - Lines 53-64
  - Portfolio endpoints - Lines 69-92
  - Security endpoints - Lines 97-109
  - Analytics endpoints - Lines 114-126
  - Alerts endpoints - Lines 131-145
  - Intelligence endpoints - Lines 150-164
  - Dashboard endpoints - Lines 169-175

### 2. API Client
- [x] Create `lib/core/api/api_client.dart`:
  - **Evidence**: `lib/core/api/api_client.dart:1-531`
  - Dio instance with base configuration - Lines 26-42
  - Connect/receive timeouts - Lines 33-35
  - JSON content type - Lines 37-39
  - Interceptor chain - Lines 44-67
  - Generic HTTP methods: GET, POST, PATCH, PUT, DELETE - Lines 76-196
  - Auth endpoints - Lines 200-229
  - User endpoints - Lines 233-261
  - Portfolio endpoints - Lines 265-369
  - Analytics endpoints - Lines 373-397
  - Alerts endpoints - Lines 401-451
  - Intelligence endpoints - Lines 455-494
  - Dashboard endpoints - Lines 498-516

### 3. Auth Interceptor
- [x] Create `lib/core/api/api_interceptors.dart`:
  - **Evidence**: `lib/core/api/api_interceptors.dart` exists
  - AuthInterceptor with token injection
  - CommonHeadersInterceptor
  - RateLimitInterceptor
  - RetryInterceptor
  - LoggingInterceptor
  - ErrorInterceptor
  - **Referenced in**: `api_client.dart:44-67`

### 4. API Exceptions
- [x] Create `lib/core/api/api_exceptions.dart`:
  - **Evidence**: `lib/core/api/api_exceptions.dart` exists
  - AppException base class
  - ApiException with statusCode
  - CacheException
  - ValidationException
  - AuthException
  - NotFoundException
  - **Referenced in**: `error_view.dart:137-190`

### 5. Auth Service
- [x] Create `lib/core/auth/auth_service.dart`:
  - **Evidence**: `lib/core/auth/auth_service.dart` exists
  - Token storage and management
  - **Referenced in**: `providers.dart:13-15`

### 6. Cache Manager
- [x] Create `lib/core/cache/cache_manager.dart`:
  - **Evidence**: `lib/core/cache/cache_manager.dart` exists
  - Hive-based caching
  - **Referenced in**: `providers.dart:17-21`

### 7. Core Providers
- [x] Create `lib/core/providers/providers.dart`:
  - **Evidence**: `lib/core/providers/providers.dart:1-259`
  - authServiceProvider - Lines 13-15
  - cacheManagerProvider - Lines 17-21
  - AuthState and AuthNotifier - Lines 29-185
  - authStateProvider - Lines 188-191
  - apiClientProvider - Lines 197-206
  - currentUserProvider - Lines 213-220
  - userPreferencesProvider - Lines 222-227
  - connectivityProvider - Lines 243-245
  - selectedPortfolioIdProvider - Line 252
  - themeModeProvider - Line 255
  - appInitializedProvider - Line 258

### 8. Portfolio Providers
- [x] Create `lib/features/portfolio/presentation/providers/portfolio_providers.dart`:
  - **Evidence**: `lib/features/portfolio/presentation/providers/portfolio_providers.dart` exists
  - portfolioListProvider
  - portfolioProvider (by ID)
  - filteredPortfolioListProvider
  - portfolioSearchQueryProvider
  - **Referenced in**: `portfolio_list_screen.dart:53`

### 9. Dashboard Providers
- [x] Create `lib/features/dashboard/presentation/providers/dashboard_providers.dart`:
  - **Evidence**: `lib/features/dashboard/presentation/providers/dashboard_providers.dart` exists
  - dashboardSummaryProvider
  - dashboardViewStateProvider
  - **Referenced in**: `dashboard_screen.dart:27-31`

### 10. Analytics Providers
- [x] Create `lib/features/analytics/presentation/providers/analytics_providers.dart`:
  - **Evidence**: `lib/features/analytics/presentation/providers/analytics_providers.dart` exists
  - alertsProvider
  - unreadAlertCountProvider
  - alertActionsProvider
  - **Referenced in**: `analytics_screen.dart:34`, `dashboard_screen.dart:28-29`

### 11. Intelligence Providers
- [x] Create `lib/features/intelligence/presentation/providers/intelligence_providers.dart`:
  - **Evidence**: `lib/features/intelligence/presentation/providers/intelligence_providers.dart` exists
  - Intelligence-related providers

---

## Acceptance Criteria

- [x] API client connects to backend endpoints
- [x] Authentication flow configured
- [x] Token refresh configured
- [x] Errors transformed to user-friendly messages
- [x] Retry logic handles transient failures
- [x] Providers fetch and cache data
- [x] Family providers work with IDs
- [x] Loading states handled correctly
- [x] Error states propagate to UI

---

## Definition of Done

- [x] ApiEndpoints class with environment-based URLs
- [x] ApiClient with Dio configuration and timeout settings
- [x] AuthInterceptor with token injection and 401 handling
- [x] LoggingInterceptor for debug output
- [x] RetryInterceptor with exponential backoff
- [x] ErrorInterceptor transforming DioException to ApiException
- [x] ApiException with user-friendly messages
- [x] Core providers: apiClientProvider, authServiceProvider, authStateProvider
- [x] cacheManagerProvider with Hive integration
- [x] currentUserProvider with auth check
- [x] portfolioListProvider, portfolioProvider
- [x] alertsProvider, unreadAlertCountProvider
- [x] dashboardSummaryProvider
- [x] All providers integrated with screens
