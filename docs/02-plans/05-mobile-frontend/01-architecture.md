# ARC Mobile App Architecture

## Overview

This document defines the architecture for the ARC Flutter mobile application targeting investment managers and family offices. The app provides mobile access to portfolio management, analytics, and AI-powered intelligence features.

---

## 1. Technology Stack

### 1.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | 3.27+ | Cross-platform UI framework |
| **Dart** | 3.6+ | Programming language |
| **Riverpod** | 2.6+ | State management (recommended for 2025) |
| **Go Router** | 14.0+ | Declarative routing |
| **Dio** | 5.4+ | HTTP client with interceptors |
| **Freezed** | 2.5+ | Immutable data classes |
| **Hive** | 2.2+ | Local storage/caching |
| **FL Chart** | 0.68+ | Financial charts |

### 1.2 Platform Targets

- **Primary**: iOS 15+ and Android 12+
- **Secondary**: iPadOS, Android Tablets
- **Future**: macOS, Windows (desktop)

### 1.3 Minimum Requirements

```yaml
# iOS
- Deployment Target: 15.0
- Architecture: arm64

# Android
- minSdkVersion: 31 (Android 12)
- targetSdkVersion: 34 (Android 14)
- Architecture: arm64-v8a, armeabi-v7a
```

---

## 2. Application Architecture

### 2.1 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │   Screens   │ │   Widgets   │ │  Providers  │ │ Controllers│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       Domain Layer                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │  Entities   │ │  Use Cases  │ │ Repositories│                │
│  │  (Models)   │ │  (Logic)    │ │ (Interfaces)│                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │ API Client  │ │ Local Cache │ │  Data DTOs  │                │
│  │   (Nexus)   │ │   (Hive)    │ │             │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
lib/
├── main.dart                          # App entry point
├── app.dart                           # MaterialApp configuration
├── bootstrap.dart                     # Dependency initialization
│
├── core/                              # Shared infrastructure
│   ├── api/                           # Nexus API client
│   │   ├── api_client.dart            # Dio configuration
│   │   ├── api_endpoints.dart         # Endpoint constants
│   │   ├── api_interceptors.dart      # Auth, logging, retry
│   │   └── api_exceptions.dart        # Custom exceptions
│   │
│   ├── auth/                          # Authentication
│   │   ├── auth_provider.dart         # Auth state management
│   │   ├── auth_service.dart          # Auth operations
│   │   └── secure_storage.dart        # Token storage
│   │
│   ├── cache/                         # Local caching
│   │   ├── cache_manager.dart         # Cache orchestration
│   │   ├── hive_adapters.dart         # Type adapters
│   │   └── cache_keys.dart            # Cache key constants
│   │
│   ├── config/                        # App configuration
│   │   ├── app_config.dart            # Environment config
│   │   ├── theme_config.dart          # Theme definitions
│   │   └── feature_flags.dart         # Feature toggles
│   │
│   ├── design/                        # Design system
│   │   ├── design_system.dart         # Unified export
│   │   ├── colors.dart                # Color tokens
│   │   ├── typography.dart            # Text styles
│   │   ├── spacing.dart               # Spacing constants
│   │   ├── shadows.dart               # Shadow definitions
│   │   └── components/                # Base components
│   │       ├── app_button.dart
│   │       ├── app_card.dart
│   │       ├── app_input.dart
│   │       └── ...
│   │
│   ├── router/                        # Navigation
│   │   ├── app_router.dart            # Route definitions
│   │   ├── route_guards.dart          # Auth guards
│   │   └── route_paths.dart           # Path constants
│   │
│   └── utils/                         # Utilities
│       ├── formatters.dart            # Number/date formatting
│       ├── validators.dart            # Input validation
│       ├── extensions.dart            # Dart extensions
│       └── logger.dart                # Logging utility
│
├── features/                          # Feature modules
│   ├── dashboard/                     # Dashboard feature
│   │   ├── data/
│   │   │   ├── dashboard_api.dart     # API calls
│   │   │   └── dashboard_repository.dart
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── dashboard_summary.dart
│   │   │   │   └── quick_stat.dart
│   │   │   └── use_cases/
│   │   │       └── get_dashboard_data.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── dashboard_provider.dart
│   │       ├── screens/
│   │       │   └── dashboard_screen.dart
│   │       └── widgets/
│   │           ├── portfolio_summary_card.dart
│   │           ├── alert_list_widget.dart
│   │           └── quick_stats_row.dart
│   │
│   ├── portfolio/                     # Portfolio feature
│   │   ├── data/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── portfolio.dart
│   │   │   │   ├── holding.dart
│   │   │   │   └── transaction.dart
│   │   │   └── use_cases/
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   ├── portfolio_list_screen.dart
│   │       │   ├── portfolio_detail_screen.dart
│   │       │   └── holding_detail_screen.dart
│   │       └── widgets/
│   │           ├── holdings_list.dart
│   │           ├── allocation_chart.dart
│   │           └── performance_chart.dart
│   │
│   ├── analytics/                     # Analytics feature
│   │   ├── data/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── ratio_data.dart
│   │   │   │   ├── alert.dart
│   │   │   │   └── benchmark.dart
│   │   │   └── use_cases/
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   ├── analytics_screen.dart
│   │       │   ├── ratio_detail_screen.dart
│   │       │   └── alerts_screen.dart
│   │       └── widgets/
│   │           ├── ratio_card.dart
│   │           ├── trend_chart.dart
│   │           └── alert_tile.dart
│   │
│   ├── intelligence/                  # AI Intelligence feature
│   │   ├── data/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── market_brief.dart
│   │   │   │   ├── query_result.dart
│   │   │   │   └── analysis.dart
│   │   │   └── use_cases/
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   ├── intelligence_screen.dart
│   │       │   ├── chat_screen.dart
│   │       │   └── brief_detail_screen.dart
│   │       └── widgets/
│   │           ├── chat_bubble.dart
│   │           ├── voice_input_button.dart
│   │           └── brief_card.dart
│   │
│   └── settings/                      # Settings feature
│       ├── data/
│       ├── domain/
│       │   └── models/
│       │       └── user_preferences.dart
│       └── presentation/
│           ├── providers/
│           ├── screens/
│           │   ├── settings_screen.dart
│           │   ├── profile_screen.dart
│           │   └── notifications_screen.dart
│           └── widgets/
│
└── shared/                            # Cross-feature widgets
    ├── widgets/
    │   ├── loading_overlay.dart
    │   ├── error_view.dart
    │   ├── empty_state.dart
    │   └── refresh_wrapper.dart
    └── extensions/
        └── context_extensions.dart
```

---

## 3. State Management with Riverpod

### 3.1 Provider Architecture

```dart
// lib/core/providers/providers.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/api/api_client.dart';
import 'package:arc_mobile/core/auth/auth_service.dart';
import 'package:arc_mobile/core/cache/cache_manager.dart';

// ============ Core Providers ============

/// API Client - singleton for entire app
final apiClientProvider = Provider<ApiClient>((ref) {
  final authService = ref.watch(authServiceProvider);
  return ApiClient(authService: authService);
});

/// Auth Service - manages authentication state
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// Auth State - reactive auth status
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

/// Cache Manager - local data persistence
final cacheManagerProvider = Provider<CacheManager>((ref) {
  return CacheManager();
});

/// Current User - authenticated user data
final currentUserProvider = FutureProvider<User?>((ref) async {
  final authState = ref.watch(authStateProvider);
  if (!authState.isAuthenticated) return null;

  final api = ref.watch(apiClientProvider);
  return api.getCurrentUser();
});

/// User Preferences - cached preferences
final userPreferencesProvider = FutureProvider<UserPreferences>((ref) async {
  final cache = ref.watch(cacheManagerProvider);
  final api = ref.watch(apiClientProvider);

  // Try cache first
  final cached = await cache.get<UserPreferences>('user_preferences');
  if (cached != null) return cached;

  // Fetch from API
  final prefs = await api.getUserPreferences();
  await cache.set('user_preferences', prefs, duration: Duration(hours: 1));
  return prefs;
});
```

### 3.2 Feature Provider Pattern

```dart
// lib/features/portfolio/presentation/providers/portfolio_providers.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/features/portfolio/domain/models/portfolio.dart';
import 'package:arc_mobile/features/portfolio/data/portfolio_repository.dart';

// Repository provider
final portfolioRepositoryProvider = Provider<PortfolioRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(cacheManagerProvider);
  return PortfolioRepository(api: api, cache: cache);
});

// Portfolio list with auto-refresh
final portfolioListProvider = FutureProvider<List<Portfolio>>((ref) async {
  final repo = ref.watch(portfolioRepositoryProvider);
  return repo.getPortfolios();
});

// Single portfolio by ID (family)
final portfolioProvider = FutureProvider.family<Portfolio?, String>((ref, id) async {
  final repo = ref.watch(portfolioRepositoryProvider);
  return repo.getPortfolio(id);
});

// Holdings for a portfolio
final holdingsProvider = FutureProvider.family<List<Holding>, String>((ref, portfolioId) async {
  final repo = ref.watch(portfolioRepositoryProvider);
  return repo.getHoldings(portfolioId);
});

// Portfolio NAV calculation (with loading state)
final portfolioNavProvider = StateNotifierProvider.family<NavNotifier, AsyncValue<NavData>, String>((ref, portfolioId) {
  final repo = ref.watch(portfolioRepositoryProvider);
  return NavNotifier(repo, portfolioId);
});

class NavNotifier extends StateNotifier<AsyncValue<NavData>> {
  final PortfolioRepository _repo;
  final String _portfolioId;

  NavNotifier(this._repo, this._portfolioId) : super(const AsyncValue.loading()) {
    _fetchNav();
  }

  Future<void> _fetchNav() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repo.calculateNav(_portfolioId));
  }

  Future<void> refresh() => _fetchNav();
}
```

### 3.3 State Classes with Freezed

```dart
// lib/features/portfolio/domain/models/portfolio.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'portfolio.freezed.dart';
part 'portfolio.g.dart';

@freezed
class Portfolio with _$Portfolio {
  const factory Portfolio({
    required String id,
    required String name,
    required String code,
    required String portfolioType,
    required String baseCurrency,
    required String inceptionDate,
    required String managerId,
    String? benchmarkId,
    required String riskProfile,
    required Map<String, dynamic> constraints,
    required bool active,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Portfolio;

  factory Portfolio.fromJson(Map<String, dynamic> json) => _$PortfolioFromJson(json);
}

@freezed
class Holding with _$Holding {
  const factory Holding({
    required String id,
    required String portfolioId,
    required String securityId,
    required double quantity,
    required double costBasis,
    required double totalCost,
    required String acquisitionDate,
    double? currentPrice,
    double? marketValue,
    double? unrealizedPnl,
    double? unrealizedPnlPct,
    double? weight,
    required Security security,
  }) = _Holding;

  factory Holding.fromJson(Map<String, dynamic> json) => _$HoldingFromJson(json);
}

@freezed
class Security with _$Security {
  const factory Security({
    required String id,
    required String ticker,
    required String name,
    String? isin,
    required String securityType,
    required String assetClass,
    required String exchange,
    required String currency,
    String? sector,
    String? industry,
    String? marketCap,
    String? marketCapCategory,
  }) = _Security;

  factory Security.fromJson(Map<String, dynamic> json) => _$SecurityFromJson(json);
}
```

---

## 4. API Integration

### 4.1 Nexus API Client

```dart
// lib/core/api/api_client.dart

import 'package:dio/dio.dart';
import 'package:arc_mobile/core/api/api_endpoints.dart';
import 'package:arc_mobile/core/api/api_interceptors.dart';
import 'package:arc_mobile/core/auth/auth_service.dart';

class ApiClient {
  late final Dio _dio;
  final AuthService _authService;

  ApiClient({required AuthService authService}) : _authService = authService {
    _dio = Dio(BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.addAll([
      AuthInterceptor(_authService),
      LoggingInterceptor(),
      RetryInterceptor(),
      ErrorInterceptor(),
    ]);
  }

  // ============ Portfolio Endpoints ============

  Future<List<Map<String, dynamic>>> getPortfolios({
    int limit = 100,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      ApiEndpoints.portfolios,
      queryParameters: {'limit': limit, 'offset': offset},
    );
    return List<Map<String, dynamic>>.from(response.data['portfolios']);
  }

  Future<Map<String, dynamic>> getPortfolio(String id) async {
    final response = await _dio.get('${ApiEndpoints.portfolios}/$id');
    return response.data;
  }

  Future<List<Map<String, dynamic>>> getHoldings(String portfolioId) async {
    final response = await _dio.get(
      '${ApiEndpoints.portfolios}/$portfolioId/holdings',
    );
    return List<Map<String, dynamic>>.from(response.data['holdings']);
  }

  Future<Map<String, dynamic>> calculateNav(String portfolioId) async {
    final response = await _dio.post(
      '${ApiEndpoints.portfolios}/$portfolioId/nav/calculate',
    );
    return response.data;
  }

  // ============ Analytics Endpoints ============

  Future<Map<String, dynamic>> getSecurityRatios(String securityId) async {
    final response = await _dio.get(
      '${ApiEndpoints.analytics}/securities/$securityId/ratios',
    );
    return response.data;
  }

  Future<List<Map<String, dynamic>>> getAlerts({
    String? status,
    int limit = 50,
  }) async {
    final response = await _dio.get(
      ApiEndpoints.alerts,
      queryParameters: {
        if (status != null) 'status': status,
        'limit': limit,
      },
    );
    return List<Map<String, dynamic>>.from(response.data['alerts']);
  }

  Future<void> acknowledgeAlert(String alertId) async {
    await _dio.post('${ApiEndpoints.alerts}/$alertId/acknowledge');
  }

  // ============ Intelligence Endpoints ============

  Future<Map<String, dynamic>> generateBrief({
    String type = 'daily',
    String? portfolioId,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.briefs,
      data: {
        'type': type,
        if (portfolioId != null) 'portfolio_id': portfolioId,
      },
    );
    return response.data;
  }

  Stream<String> streamBrief({
    String type = 'daily',
  }) async* {
    final response = await _dio.get<ResponseBody>(
      '${ApiEndpoints.briefs}/stream',
      queryParameters: {'type': type},
      options: Options(responseType: ResponseType.stream),
    );

    await for (final chunk in response.data!.stream) {
      yield String.fromCharCodes(chunk);
    }
  }

  Future<Map<String, dynamic>> queryPortfolio(String query, {
    String? portfolioId,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.query,
      data: {
        'query': query,
        if (portfolioId != null) 'portfolio_id': portfolioId,
      },
    );
    return response.data;
  }

  // ============ User Endpoints ============

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _dio.get(ApiEndpoints.currentUser);
    return response.data;
  }

  Future<Map<String, dynamic>> getUserPreferences() async {
    final response = await _dio.get(ApiEndpoints.preferences);
    return response.data;
  }

  Future<void> updatePreferences(Map<String, dynamic> prefs) async {
    await _dio.patch(ApiEndpoints.preferences, data: prefs);
  }
}
```

### 4.2 API Endpoints

```dart
// lib/core/api/api_endpoints.dart

class ApiEndpoints {
  // Base URL configured per environment
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
  static const String auth = '/auth';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';

  // User
  static const String currentUser = '/users/me';
  static const String preferences = '/users/me/preferences';
  static const String notifications = '/users/me/notifications';

  // Portfolio
  static const String portfolios = '/portfolios';

  // Analytics
  static const String analytics = '/analytics';
  static const String alerts = '/alerts';
  static const String thresholds = '/thresholds';

  // Intelligence
  static const String briefs = '/intelligence/briefs';
  static const String query = '/intelligence/query';
  static const String analysis = '/intelligence/analysis';
}
```

### 4.3 Interceptors

```dart
// lib/core/api/api_interceptors.dart

import 'package:dio/dio.dart';

/// Adds auth token to requests
class AuthInterceptor extends Interceptor {
  final AuthService _authService;

  AuthInterceptor(this._authService);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _authService.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final success = await _authService.refreshToken();
      if (success) {
        // Retry request with new token
        final token = await _authService.getAccessToken();
        err.requestOptions.headers['Authorization'] = 'Bearer $token';

        final dio = Dio();
        final response = await dio.fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } else {
        // Logout user
        await _authService.logout();
      }
    }
    handler.next(err);
  }
}

/// Logs requests and responses
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('REQUEST: ${options.method} ${options.uri}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('RESPONSE: ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('ERROR: ${err.message} ${err.requestOptions.uri}');
    handler.next(err);
  }
}

/// Retries failed requests
class RetryInterceptor extends Interceptor {
  final int maxRetries;
  final Duration retryDelay;

  RetryInterceptor({this.maxRetries = 3, this.retryDelay = const Duration(seconds: 1)});

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final retryCount = err.requestOptions.extra['retryCount'] ?? 0;

    // Only retry on network errors or 5xx
    final shouldRetry = err.type == DioExceptionType.connectionError ||
                        err.type == DioExceptionType.connectionTimeout ||
                        (err.response?.statusCode ?? 0) >= 500;

    if (shouldRetry && retryCount < maxRetries) {
      await Future.delayed(retryDelay * (retryCount + 1));

      err.requestOptions.extra['retryCount'] = retryCount + 1;

      final dio = Dio();
      try {
        final response = await dio.fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (e) {
        // Fall through to handler.next
      }
    }

    handler.next(err);
  }
}

/// Transforms errors to user-friendly messages
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final apiError = ApiException.fromDioError(err);
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      error: apiError,
      type: err.type,
      response: err.response,
    ));
  }
}
```

---

## 5. Navigation with Go Router

### 5.1 Router Configuration

```dart
// lib/core/router/app_router.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/router/route_paths.dart';
import 'package:arc_mobile/core/router/route_guards.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RoutePaths.dashboard,
    refreshListenable: authState,

    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == RoutePaths.login;

      if (!isLoggedIn && !isLoginRoute) {
        return RoutePaths.login;
      }

      if (isLoggedIn && isLoginRoute) {
        return RoutePaths.dashboard;
      }

      return null;
    },

    routes: [
      // Login
      GoRoute(
        path: RoutePaths.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Main Shell with Bottom Navigation
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          // Dashboard Tab
          GoRoute(
            path: RoutePaths.dashboard,
            name: 'dashboard',
            pageBuilder: (context, state) => NoTransitionPage(
              child: const DashboardScreen(),
            ),
          ),

          // Portfolio Tab
          GoRoute(
            path: RoutePaths.portfolios,
            name: 'portfolios',
            pageBuilder: (context, state) => NoTransitionPage(
              child: const PortfolioListScreen(),
            ),
            routes: [
              GoRoute(
                path: ':portfolioId',
                name: 'portfolio-detail',
                builder: (context, state) {
                  final id = state.pathParameters['portfolioId']!;
                  return PortfolioDetailScreen(portfolioId: id);
                },
                routes: [
                  GoRoute(
                    path: 'holding/:holdingId',
                    name: 'holding-detail',
                    builder: (context, state) {
                      final portfolioId = state.pathParameters['portfolioId']!;
                      final holdingId = state.pathParameters['holdingId']!;
                      return HoldingDetailScreen(
                        portfolioId: portfolioId,
                        holdingId: holdingId,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),

          // Analytics Tab
          GoRoute(
            path: RoutePaths.analytics,
            name: 'analytics',
            pageBuilder: (context, state) => NoTransitionPage(
              child: const AnalyticsScreen(),
            ),
            routes: [
              GoRoute(
                path: 'alerts',
                name: 'alerts',
                builder: (context, state) => const AlertsScreen(),
              ),
              GoRoute(
                path: 'security/:securityId',
                name: 'security-ratios',
                builder: (context, state) {
                  final id = state.pathParameters['securityId']!;
                  return RatioDetailScreen(securityId: id);
                },
              ),
            ],
          ),

          // Intelligence Tab
          GoRoute(
            path: RoutePaths.intelligence,
            name: 'intelligence',
            pageBuilder: (context, state) => NoTransitionPage(
              child: const IntelligenceScreen(),
            ),
            routes: [
              GoRoute(
                path: 'chat',
                name: 'chat',
                builder: (context, state) => const ChatScreen(),
              ),
              GoRoute(
                path: 'brief/:briefId',
                name: 'brief-detail',
                builder: (context, state) {
                  final id = state.pathParameters['briefId']!;
                  return BriefDetailScreen(briefId: id);
                },
              ),
            ],
          ),

          // Settings Tab
          GoRoute(
            path: RoutePaths.settings,
            name: 'settings',
            pageBuilder: (context, state) => NoTransitionPage(
              child: const SettingsScreen(),
            ),
            routes: [
              GoRoute(
                path: 'profile',
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
              GoRoute(
                path: 'notifications',
                name: 'notification-settings',
                builder: (context, state) => const NotificationsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],

    errorBuilder: (context, state) => ErrorScreen(error: state.error),
  );
});
```

### 5.2 Route Paths

```dart
// lib/core/router/route_paths.dart

class RoutePaths {
  static const String login = '/login';
  static const String dashboard = '/';
  static const String portfolios = '/portfolios';
  static const String analytics = '/analytics';
  static const String intelligence = '/intelligence';
  static const String settings = '/settings';

  // Nested paths
  static String portfolioDetail(String id) => '/portfolios/$id';
  static String holdingDetail(String portfolioId, String holdingId) =>
      '/portfolios/$portfolioId/holding/$holdingId';
  static String securityRatios(String id) => '/analytics/security/$id';
  static String briefDetail(String id) => '/intelligence/brief/$id';
}
```

### 5.3 Main Shell with Bottom Navigation

```dart
// lib/shared/widgets/main_shell.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class MainShell extends StatelessWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const ArcBottomNavigation(),
    );
  }
}

class ArcBottomNavigation extends StatelessWidget {
  const ArcBottomNavigation({super.key});

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/portfolios')) return 1;
    if (location.startsWith('/analytics')) return 2;
    if (location.startsWith('/intelligence')) return 3;
    if (location.startsWith('/settings')) return 4;
    return 0; // Dashboard
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(RoutePaths.dashboard);
        break;
      case 1:
        context.go(RoutePaths.portfolios);
        break;
      case 2:
        context.go(RoutePaths.analytics);
        break;
      case 3:
        context.go(RoutePaths.intelligence);
        break;
      case 4:
        context.go(RoutePaths.settings);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _calculateSelectedIndex(context);

    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) => _onItemTapped(context, index),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        NavigationDestination(
          icon: Icon(Icons.account_balance_wallet_outlined),
          selectedIcon: Icon(Icons.account_balance_wallet),
          label: 'Portfolio',
        ),
        NavigationDestination(
          icon: Icon(Icons.analytics_outlined),
          selectedIcon: Icon(Icons.analytics),
          label: 'Analytics',
        ),
        NavigationDestination(
          icon: Icon(Icons.psychology_outlined),
          selectedIcon: Icon(Icons.psychology),
          label: 'Intel',
        ),
        NavigationDestination(
          icon: Icon(Icons.settings_outlined),
          selectedIcon: Icon(Icons.settings),
          label: 'Settings',
        ),
      ],
    );
  }
}
```

---

## 6. Local Caching Strategy

### 6.1 Cache Manager

```dart
// lib/core/cache/cache_manager.dart

import 'package:hive_flutter/hive_flutter.dart';
import 'package:arc_mobile/core/cache/cache_keys.dart';

class CacheManager {
  static const String _boxName = 'arc_cache';
  late Box<dynamic> _box;

  Future<void> initialize() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  /// Get cached value
  Future<T?> get<T>(String key) async {
    final entry = _box.get(key) as CacheEntry<T>?;

    if (entry == null) return null;

    // Check expiration
    if (entry.isExpired) {
      await delete(key);
      return null;
    }

    return entry.value;
  }

  /// Set cached value with optional duration
  Future<void> set<T>(
    String key,
    T value, {
    Duration? duration,
  }) async {
    final entry = CacheEntry<T>(
      value: value,
      expiresAt: duration != null ? DateTime.now().add(duration) : null,
    );
    await _box.put(key, entry);
  }

  /// Delete cached value
  Future<void> delete(String key) async {
    await _box.delete(key);
  }

  /// Clear all cache
  Future<void> clearAll() async {
    await _box.clear();
  }

  /// Clear expired entries
  Future<void> clearExpired() async {
    final keys = _box.keys.toList();
    for (final key in keys) {
      final entry = _box.get(key) as CacheEntry?;
      if (entry?.isExpired ?? false) {
        await _box.delete(key);
      }
    }
  }
}

class CacheEntry<T> {
  final T value;
  final DateTime? expiresAt;
  final DateTime cachedAt;

  CacheEntry({
    required this.value,
    this.expiresAt,
  }) : cachedAt = DateTime.now();

  bool get isExpired =>
      expiresAt != null && DateTime.now().isAfter(expiresAt!);
}
```

### 6.2 Cache Keys

```dart
// lib/core/cache/cache_keys.dart

class CacheKeys {
  // User
  static const String currentUser = 'current_user';
  static const String userPreferences = 'user_preferences';

  // Portfolio
  static const String portfolioList = 'portfolio_list';
  static String portfolio(String id) => 'portfolio_$id';
  static String holdings(String portfolioId) => 'holdings_$portfolioId';
  static String nav(String portfolioId) => 'nav_$portfolioId';

  // Analytics
  static String ratios(String securityId) => 'ratios_$securityId';
  static const String alerts = 'alerts';

  // Intelligence
  static const String recentBriefs = 'recent_briefs';
  static String brief(String id) => 'brief_$id';
  static const String querySuggestions = 'query_suggestions';

  // Durations
  static const Duration shortCache = Duration(minutes: 5);
  static const Duration mediumCache = Duration(hours: 1);
  static const Duration longCache = Duration(hours: 24);
}
```

---

## 7. Error Handling

### 7.1 Exception Types

```dart
// lib/core/api/api_exceptions.dart

import 'package:dio/dio.dart';

abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AppException(this.message, {this.code, this.originalError});

  @override
  String toString() => message;
}

class ApiException extends AppException {
  final int? statusCode;

  const ApiException(
    super.message, {
    this.statusCode,
    super.code,
    super.originalError,
  });

  factory ApiException.fromDioError(DioException error) {
    final response = error.response;
    final statusCode = response?.statusCode;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const ApiException(
          'Connection timed out. Please check your network.',
          code: 'TIMEOUT',
        );

      case DioExceptionType.connectionError:
        return const ApiException(
          'Unable to connect to server. Please check your network.',
          code: 'CONNECTION_ERROR',
        );

      case DioExceptionType.badResponse:
        return _handleBadResponse(statusCode, response?.data);

      default:
        return ApiException(
          error.message ?? 'An unexpected error occurred.',
          originalError: error,
        );
    }
  }

  static ApiException _handleBadResponse(int? statusCode, dynamic data) {
    final message = data is Map ? data['message'] as String? : null;
    final code = data is Map ? data['code'] as String? : null;

    switch (statusCode) {
      case 400:
        return ApiException(
          message ?? 'Invalid request. Please check your input.',
          statusCode: 400,
          code: code ?? 'BAD_REQUEST',
        );
      case 401:
        return ApiException(
          message ?? 'Session expired. Please log in again.',
          statusCode: 401,
          code: code ?? 'UNAUTHORIZED',
        );
      case 403:
        return ApiException(
          message ?? 'You do not have permission to perform this action.',
          statusCode: 403,
          code: code ?? 'FORBIDDEN',
        );
      case 404:
        return ApiException(
          message ?? 'The requested resource was not found.',
          statusCode: 404,
          code: code ?? 'NOT_FOUND',
        );
      case 422:
        return ApiException(
          message ?? 'Validation failed. Please check your input.',
          statusCode: 422,
          code: code ?? 'VALIDATION_ERROR',
        );
      case 429:
        return ApiException(
          message ?? 'Too many requests. Please try again later.',
          statusCode: 429,
          code: code ?? 'RATE_LIMITED',
        );
      case 500:
      case 502:
      case 503:
        return ApiException(
          message ?? 'Server error. Please try again later.',
          statusCode: statusCode,
          code: code ?? 'SERVER_ERROR',
        );
      default:
        return ApiException(
          message ?? 'An unexpected error occurred.',
          statusCode: statusCode,
          code: code,
        );
    }
  }
}

class CacheException extends AppException {
  const CacheException(super.message, {super.code});
}

class ValidationException extends AppException {
  final Map<String, List<String>>? fieldErrors;

  const ValidationException(super.message, {this.fieldErrors, super.code});
}
```

### 7.2 Error UI Components

```dart
// lib/shared/widgets/error_view.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/api/api_exceptions.dart';
import 'package:arc_mobile/core/design/design_system.dart';

class ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  final String? retryLabel;

  const ErrorView({
    super.key,
    required this.error,
    this.onRetry,
    this.retryLabel,
  });

  @override
  Widget build(BuildContext context) {
    final (icon, title, message) = _getErrorDetails(error);

    return Center(
      child: Padding(
        padding: AppSpacing.allLg,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.error,
            ),
            AppSpacing.gapMd,
            Text(
              title,
              style: AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            AppSpacing.gapSm,
            Text(
              message,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              AppSpacing.gapLg,
              AppButton.primary(
                label: retryLabel ?? 'Try Again',
                onPressed: onRetry,
                icon: Icons.refresh,
              ),
            ],
          ],
        ),
      ),
    );
  }

  (IconData, String, String) _getErrorDetails(Object error) {
    if (error is ApiException) {
      switch (error.code) {
        case 'CONNECTION_ERROR':
        case 'TIMEOUT':
          return (
            Icons.wifi_off,
            'No Connection',
            error.message,
          );
        case 'UNAUTHORIZED':
          return (
            Icons.lock_outline,
            'Session Expired',
            error.message,
          );
        case 'FORBIDDEN':
          return (
            Icons.block,
            'Access Denied',
            error.message,
          );
        case 'NOT_FOUND':
          return (
            Icons.search_off,
            'Not Found',
            error.message,
          );
        case 'SERVER_ERROR':
          return (
            Icons.cloud_off,
            'Server Error',
            error.message,
          );
        default:
          return (
            Icons.error_outline,
            'Error',
            error.message,
          );
      }
    }

    return (
      Icons.error_outline,
      'Something went wrong',
      error.toString(),
    );
  }
}
```

---

## 8. Performance Optimization

### 8.1 Widget Optimization Guidelines

```dart
// Performance best practices

// 1. Use const constructors
class OptimizedCard extends StatelessWidget {
  const OptimizedCard({super.key}); // Always const

  @override
  Widget build(BuildContext context) {
    return const Card(  // Const prevents rebuild
      child: Padding(
        padding: EdgeInsets.all(16), // EdgeInsets.all is const
        child: Text('Static content'),
      ),
    );
  }
}

// 2. Use ListView.builder for lists
Widget buildList(List<Holding> holdings) {
  return ListView.builder(
    itemCount: holdings.length,
    itemBuilder: (context, index) {
      return HoldingTile(holding: holdings[index]);
    },
  );
}

// 3. Use RepaintBoundary for expensive widgets
Widget buildChart(List<DataPoint> data) {
  return RepaintBoundary(
    child: PerformanceChart(data: data),
  );
}

// 4. Use select() to minimize rebuilds
final totalValue = ref.watch(
  portfolioProvider(id).select((p) => p.valueOrNull?.totalValue),
);

// 5. Split widgets by rebuild frequency
class PortfolioHeader extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Static parts don't rebuild
    return Column(
      children: [
        const StaticLogoHeader(), // Never rebuilds
        DynamicValueDisplay(), // Rebuilds on data change
      ],
    );
  }
}

// 6. Memoize expensive computations
class RatioCalculator {
  static final _cache = <String, double>{};

  static double calculate(String key, double Function() computation) {
    return _cache.putIfAbsent(key, computation);
  }
}
```

### 8.2 Image Optimization

```dart
// lib/shared/widgets/cached_image.dart

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ArcCachedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const ArcCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      // Memory optimization
      memCacheWidth: width?.toInt(),
      memCacheHeight: height?.toInt(),
      placeholder: (context, url) => Container(
        color: AppColors.surface,
        child: const Center(
          child: CircularProgressIndicator.adaptive(),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        color: AppColors.surface,
        child: const Icon(Icons.broken_image),
      ),
    );
  }
}
```

---

## 9. Testing Strategy

### 9.1 Test Structure

```
test/
├── unit/                           # Unit tests
│   ├── models/                     # Model tests
│   ├── providers/                  # Provider tests
│   └── utils/                      # Utility tests
│
├── widget/                         # Widget tests
│   ├── components/                 # Component tests
│   └── screens/                    # Screen tests
│
├── integration/                    # Integration tests
│   ├── api/                        # API client tests
│   └── flows/                      # User flow tests
│
├── mocks/                          # Mock classes
│   ├── mock_api_client.dart
│   └── mock_providers.dart
│
└── fixtures/                       # Test data
    ├── portfolio_fixtures.dart
    └── user_fixtures.dart
```

### 9.2 Provider Testing

```dart
// test/unit/providers/portfolio_provider_test.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockPortfolioRepository extends Mock implements PortfolioRepository {}

void main() {
  late ProviderContainer container;
  late MockPortfolioRepository mockRepo;

  setUp(() {
    mockRepo = MockPortfolioRepository();
    container = ProviderContainer(
      overrides: [
        portfolioRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('portfolioListProvider', () {
    test('returns portfolios on success', () async {
      final portfolios = [
        Portfolio(id: '1', name: 'Test Portfolio', ...),
      ];

      when(() => mockRepo.getPortfolios()).thenAnswer((_) async => portfolios);

      final result = await container.read(portfolioListProvider.future);

      expect(result, equals(portfolios));
      verify(() => mockRepo.getPortfolios()).called(1);
    });

    test('handles error state', () async {
      when(() => mockRepo.getPortfolios()).thenThrow(
        const ApiException('Network error'),
      );

      expect(
        () => container.read(portfolioListProvider.future),
        throwsA(isA<ApiException>()),
      );
    });
  });
}
```

### 9.3 Widget Testing

```dart
// test/widget/screens/dashboard_screen_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('DashboardScreen shows portfolio summary', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dashboardProvider.overrideWith((ref) => AsyncValue.data(
            DashboardSummary(
              totalValue: 1500000,
              dailyChange: 25000,
              dailyChangePct: 1.69,
              alertsCount: 3,
            ),
          )),
        ],
        child: const MaterialApp(
          home: DashboardScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('\$1,500,000'), findsOneWidget);
    expect(find.text('+1.69%'), findsOneWidget);
    expect(find.text('3 alerts'), findsOneWidget);
  });

  testWidgets('DashboardScreen shows loading state', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dashboardProvider.overrideWith((ref) => const AsyncValue.loading()),
        ],
        child: const MaterialApp(
          home: DashboardScreen(),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
```

---

## 10. Build and Deployment

### 10.1 Build Configuration

```yaml
# pubspec.yaml

name: arc_mobile
description: ARC Investment Management Platform
version: 1.0.0+1
publish_to: none

environment:
  sdk: '>=3.6.0 <4.0.0'
  flutter: '>=3.27.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.6.0
  riverpod_annotation: ^2.4.0

  # Routing
  go_router: ^14.0.0

  # Networking
  dio: ^5.4.0

  # Data Classes
  freezed_annotation: ^2.5.0
  json_annotation: ^4.9.0

  # Local Storage
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.2.0

  # UI
  fl_chart: ^0.68.0
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.10

  # Utilities
  intl: ^0.19.0
  logger: ^2.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter

  # Code Generation
  build_runner: ^2.4.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.0

  # Testing
  mocktail: ^1.0.0

  # Linting
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/
```

### 10.2 Environment Configuration

```dart
// lib/core/config/app_config.dart

enum Environment { development, staging, production }

class AppConfig {
  static Environment get environment {
    const env = String.fromEnvironment('ENV', defaultValue: 'development');
    switch (env) {
      case 'production':
        return Environment.production;
      case 'staging':
        return Environment.staging;
      default:
        return Environment.development;
    }
  }

  static bool get isProduction => environment == Environment.production;
  static bool get isDevelopment => environment == Environment.development;

  static String get apiBaseUrl {
    switch (environment) {
      case Environment.production:
        return 'https://api.arc-platform.com/v1';
      case Environment.staging:
        return 'https://api.staging.arc-platform.com/v1';
      case Environment.development:
        return 'http://localhost:8000/v1';
    }
  }

  static Duration get cacheDefaultDuration {
    switch (environment) {
      case Environment.production:
        return const Duration(minutes: 30);
      case Environment.staging:
        return const Duration(minutes: 5);
      case Environment.development:
        return const Duration(minutes: 1);
    }
  }
}
```

---

## 11. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] **ARCH-001**: Project setup with Flutter 3.27+
- [ ] **ARCH-002**: Riverpod configuration
- [ ] **ARCH-003**: Go Router setup with shell routes
- [ ] **ARCH-004**: Design system foundation
- [ ] **ARCH-005**: API client with Dio
- [ ] **ARCH-006**: Cache manager with Hive
- [ ] **ARCH-007**: Auth flow (login/logout/refresh)

### Phase 2: Core Features (Week 3-4)
- [ ] **ARCH-008**: Dashboard screen implementation
- [ ] **ARCH-009**: Portfolio list and detail screens
- [ ] **ARCH-010**: Holdings display with charts
- [ ] **ARCH-011**: Analytics screen with ratio cards
- [ ] **ARCH-012**: Alerts display and acknowledgment

### Phase 3: Intelligence (Week 5-6)
- [ ] **ARCH-013**: Intelligence screen
- [ ] **ARCH-014**: Chat interface with streaming
- [ ] **ARCH-015**: Market brief display
- [ ] **ARCH-016**: Voice input integration

### Phase 4: Settings & Polish (Week 7-8)
- [ ] **ARCH-017**: Settings screen
- [ ] **ARCH-018**: Profile management
- [ ] **ARCH-019**: Notification preferences
- [ ] **ARCH-020**: Push notification setup
- [ ] **ARCH-021**: Performance optimization
- [ ] **ARCH-022**: Testing suite completion

---

## 12. Acceptance Criteria

### Architecture Requirements
- [ ] Clean architecture with clear layer separation
- [ ] Feature-based folder structure
- [ ] Riverpod for all state management
- [ ] Go Router for navigation
- [ ] Type-safe models with Freezed
- [ ] Comprehensive error handling

### Performance Requirements
- [ ] App launch < 2 seconds
- [ ] Screen transitions < 300ms
- [ ] List scrolling at 60fps
- [ ] Memory usage < 150MB baseline
- [ ] Offline capability for cached data

### Quality Requirements
- [ ] Unit test coverage > 80%
- [ ] Widget test coverage for all screens
- [ ] No critical linter warnings
- [ ] Accessibility support (VoiceOver/TalkBack)
- [ ] Dark mode support

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Author**: ARC Development Team
