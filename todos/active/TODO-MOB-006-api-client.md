# TODO-MOB-006: API Client and Providers

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-001, TODO-BE-014

---

## Objective

Implement the Nexus API client with Dio, authentication handling, caching, and Riverpod providers for state management.

---

## Tasks

### 1. API Endpoints Configuration
- [ ] Create `lib/core/api/api_endpoints.dart`:
  ```dart
  class ApiEndpoints {
    static String get baseUrl => _getBaseUrl();

    static String _getBaseUrl() {
      const env = String.fromEnvironment('ENV', defaultValue: 'development');
      switch (env) {
        case 'production':
          return 'https://api.arc-platform.com/v1';
        case 'staging':
          return 'https://api.staging.arc-platform.com/v1';
        default:
          return 'http://localhost:8000/v1';
      }
    }

    // Auth
    static const String login = '/auth/login';
    static const String logout = '/auth/logout';
    static const String refresh = '/auth/refresh';

    // Portfolio
    static const String portfolios = '/portfolios';

    // Analytics
    static const String analytics = '/analytics';
    static const String alerts = '/alerts';

    // Intelligence
    static const String briefs = '/intelligence/briefs';
    static const String query = '/intelligence/query';
  }
  ```

### 2. API Client
- [ ] Create `lib/core/api/api_client.dart`:
  - Dio instance with base configuration
  - Connect/receive timeouts
  - JSON content type
  - Interceptor chain

### 3. Auth Interceptor
- [ ] Create `lib/core/api/interceptors/auth_interceptor.dart`:
  - Add Authorization header
  - Handle 401 responses
  - Token refresh logic
  - Logout on refresh failure

### 4. Logging Interceptor
- [ ] Create `lib/core/api/interceptors/logging_interceptor.dart`:
  - Log request method and URL
  - Log response status
  - Log errors

### 5. Retry Interceptor
- [ ] Create `lib/core/api/interceptors/retry_interceptor.dart`:
  - Retry on network errors
  - Retry on 5xx responses
  - Configurable max retries
  - Exponential backoff

### 6. Error Interceptor
- [ ] Create `lib/core/api/interceptors/error_interceptor.dart`:
  - Transform DioException to ApiException
  - Handle timeout, connection errors
  - Parse server error responses

### 7. API Exceptions
- [ ] Create `lib/core/api/api_exceptions.dart`:
  ```dart
  abstract class AppException implements Exception {
    final String message;
    final String? code;

    const AppException(this.message, {this.code});
  }

  class ApiException extends AppException {
    final int? statusCode;

    const ApiException(super.message, {this.statusCode, super.code});

    factory ApiException.fromDioError(DioException error) {
      // Handle different error types
    }
  }
  ```

### 8. Core Providers
- [ ] Create `lib/core/providers/providers.dart`:
  ```dart
  // API Client
  final apiClientProvider = Provider<ApiClient>((ref) {
    final authService = ref.watch(authServiceProvider);
    return ApiClient(authService: authService);
  });

  // Auth Service
  final authServiceProvider = Provider<AuthService>((ref) {
    return AuthService();
  });

  // Auth State
  final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
    final authService = ref.watch(authServiceProvider);
    return AuthNotifier(authService);
  });

  // Cache Manager
  final cacheManagerProvider = Provider<CacheManager>((ref) {
    return CacheManager();
  });

  // Current User
  final currentUserProvider = FutureProvider<User?>((ref) async {
    final authState = ref.watch(authStateProvider);
    if (!authState.isAuthenticated) return null;
    final api = ref.watch(apiClientProvider);
    return api.getCurrentUser();
  });
  ```

### 9. Portfolio Providers
- [ ] Create `lib/features/portfolio/presentation/providers/portfolio_providers.dart`:
  - portfolioRepositoryProvider
  - portfolioListProvider (FutureProvider)
  - portfolioProvider(id) (FutureProvider.family)
  - holdingsProvider(portfolioId) (FutureProvider.family)
  - transactionsProvider(portfolioId) (FutureProvider.family)

### 10. Analytics Providers
- [ ] Create `lib/features/analytics/presentation/providers/analytics_providers.dart`:
  - analyticsRepositoryProvider
  - alertsProvider
  - thresholdsProvider
  - securityRatiosProvider(securityId)

---

## Acceptance Criteria

- [ ] API client connects to backend
- [ ] Authentication flow works
- [ ] Token refresh works automatically
- [ ] Errors transformed to user-friendly messages
- [ ] Retry logic handles transient failures
- [ ] Providers fetch and cache data
- [ ] Family providers work with IDs
- [ ] Loading states handled correctly
- [ ] Error states propagate to UI

---

## API Response Handling

### Success Response
```dart
// Backend returns
{ "id": "...", "name": "...", ... }

// Or list
{ "items": [...], "total": 100, "limit": 20 }
```

### Error Response
```dart
// Backend returns
{
  "code": "NOT_FOUND",
  "message": "Portfolio not found",
  "details": { ... }
}
```

---

## Cache Strategy

| Data Type | Cache Duration | Stale Time |
|-----------|----------------|------------|
| User Profile | 1 hour | 5 min |
| Portfolio List | 5 min | 1 min |
| Holdings | 5 min | 1 min |
| Alerts | 1 min | 30 sec |
| Briefs | 1 hour | 30 min |
| Ratios | 30 min | 5 min |

---

## Technical Notes

- Use Dio for HTTP client
- Use flutter_secure_storage for tokens
- Use Hive for caching
- Use Riverpod for state management
- Handle offline mode gracefully
- Log all API errors
