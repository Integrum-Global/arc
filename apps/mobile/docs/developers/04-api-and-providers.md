# API Client and Providers

## API Client

**Location**: `lib/core/api/api_client.dart`

The API client handles all HTTP communication with the backend.

### Setup

```dart
// Access via provider
final api = ref.watch(apiClientProvider);
```

### Endpoints

Defined in `lib/core/api/api_endpoints.dart`:

```dart
ApiEndpoints.baseUrl         // Environment-based URL
ApiEndpoints.login           // /auth/login
ApiEndpoints.portfolios      // /portfolios
ApiEndpoints.analytics       // /analytics
ApiEndpoints.briefs          // /intelligence/briefs
```

### Making Requests

```dart
// Portfolio endpoints
final portfolios = await api.getPortfolios();
final portfolio = await api.getPortfolio(id);
final holdings = await api.getHoldings(portfolioId);
final transactions = await api.getTransactions(portfolioId);

// Analytics endpoints
final ratios = await api.getSecurityRatios(securityId);
final alerts = await api.getAlerts(limit: 10);

// Intelligence endpoints
final brief = await api.getDailyBrief();
final result = await api.queryPortfolio('How is my portfolio?');
```

## Interceptors

**Location**: `lib/core/api/api_interceptors.dart`

| Interceptor | Purpose |
|-------------|---------|
| `AuthInterceptor` | Attaches JWT, handles token refresh |
| `RetryInterceptor` | Retries failed requests (3 attempts) |
| `ErrorInterceptor` | Transforms DioException to AppException |
| `LoggingInterceptor` | Logs requests/responses in debug mode |

## Error Handling

**Location**: `lib/core/api/api_exceptions.dart`

```dart
try {
  final data = await api.getPortfolios();
} on ApiException catch (e) {
  if (e.isNetworkError) {
    // Show offline message
  } else if (e.isAuthError) {
    // Redirect to login
  } else {
    // Show error message
  }
}
```

Exception types:
- `ApiException` - HTTP/network errors
- `CacheException` - Local storage errors
- `ValidationException` - Input validation errors
- `AuthException` - Authentication errors

## Providers

### Core Providers

**Location**: `lib/core/providers/providers.dart`

```dart
// API client
final apiClientProvider = Provider<ApiClient>(...);

// Auth service
final authServiceProvider = Provider<AuthService>(...);

// Auth state
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>(...);

// Cache manager
final cacheManagerProvider = Provider<CacheManager>(...);
```

### Feature Providers Pattern

Each feature has its own providers file following this pattern:

```dart
// lib/features/{feature}/presentation/providers/{feature}_providers.dart

// Async data from API
final portfolioListProvider = FutureProvider<List<Portfolio>>((ref) async {
  try {
    final api = ref.watch(apiClientProvider);
    return await api.getPortfolios();
  } catch (e) {
    // Return mock data in development
    return _mockPortfolios();
  }
});

// Parameterized provider
final portfolioProvider = FutureProvider.family<Portfolio?, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  return await api.getPortfolio(id);
});

// State provider for filters
final filterProvider = StateProvider<String?>((ref) => null);

// Derived provider
final filteredListProvider = Provider<List<Portfolio>>((ref) {
  final list = ref.watch(portfolioListProvider).valueOrNull ?? [];
  final filter = ref.watch(filterProvider);
  if (filter == null) return list;
  return list.where((p) => p.type == filter).toList();
});
```

### Using Providers in Widgets

```dart
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final portfolios = ref.watch(portfolioListProvider);

    return portfolios.when(
      data: (data) => ListView.builder(
        itemCount: data.length,
        itemBuilder: (_, i) => PortfolioTile(portfolio: data[i]),
      ),
      loading: () => PortfolioListSkeleton(),
      error: (e, _) => ErrorView(
        error: e,
        onRetry: () => ref.invalidate(portfolioListProvider),
      ),
    );
  }
}
```

### Refreshing Data

```dart
// Invalidate single provider
ref.invalidate(portfolioListProvider);

// Refresh with RefreshIndicator
RefreshIndicator(
  onRefresh: () async {
    ref.invalidate(portfolioListProvider);
    await ref.read(portfolioListProvider.future);
  },
  child: ListView(...),
)
```

## Caching

**Location**: `lib/core/cache/cache_manager.dart`

Hive-based caching with TTL:

```dart
final cache = ref.watch(cacheManagerProvider);

// Set with expiration
await cache.set('key', value, duration: Duration(hours: 1));

// Get cached value
final cached = await cache.get<MyType>('key');

// Delete
await cache.delete('key');
```

Cache keys defined in `CacheKeys`:
```dart
CacheKeys.portfolios
CacheKeys.holdings(portfolioId)
CacheKeys.alerts
CacheKeys.brief
```
