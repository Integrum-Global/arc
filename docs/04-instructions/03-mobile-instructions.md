# ARC Mobile App - Implementation Instructions

## Overview

This worktree contains the Flutter mobile application for iOS and Android. You are implementing a mobile investment management app that connects to the ARC backend API.

**Working Directory**: `apps/mobile/`
**Stack**: Flutter 3.27+, Dart 3.6+, Riverpod 2.6+, Go Router 14.0+, Dio 5.4+, FL Chart 0.68+

---

## Prerequisites

Before starting mobile development:
1. **Backend API must be running** on `http://localhost:8000`
2. Read `docs/03-design/` for design system specifications
3. Flutter SDK installed and configured
4. iOS Simulator or Android Emulator ready

---

## Implementation Phases

### Phase 1: Foundation (TODO-MOB-001 to TODO-MOB-002)

#### 1.1 Project Setup
```
Read: todos/active/TODO-MOB-001-project-setup.md

Tasks:
- Create Flutter project with package name
- Add dependencies to pubspec.yaml
- Configure directory structure
- Set up environment configuration
- Configure build flavors (dev, staging, prod)
```

#### 1.2 Design System
```
Read: todos/active/TODO-MOB-002-design-system.md

Tasks:
- Create AppColors class with design tokens
- Create AppTypography class
- Create AppTheme with light/dark themes
- Build base components (AppButton, AppCard, AppInput)
```

### Phase 2: Core Widgets (TODO-MOB-003 to TODO-MOB-005)

#### 2.1 Common Widgets
```
Read: todos/active/TODO-MOB-003-common-widgets.md

Widgets to build:
- MainShell (scaffold with bottom nav)
- BottomNavigation
- EmptyState
- ErrorView
- LoadingSkeleton
- RefreshableList
```

#### 2.2 Data Display Widgets
```
Read: todos/active/TODO-MOB-004-data-widgets.md

Widgets to build:
- StatCard
- PortfolioSummaryCard
- HoldingTile
- TransactionTile
- AlertTile
- RatioCard
```

#### 2.3 Chart Widgets
```
Read: todos/active/TODO-MOB-005-chart-widgets.md

Widgets to build (using FL Chart):
- AllocationPieChart
- PerformanceLineChart
- TrendSparkline
- PeerComparisonBarChart
```

### Phase 3: API Integration (TODO-MOB-006)

```
Read: todos/active/TODO-MOB-006-api-client.md

Tasks:
- Configure Dio client with interceptors
- Create ApiException classes
- Build Riverpod providers for API calls
- Implement token refresh logic
- Set up offline caching with Hive
```

### Phase 4: Screens (TODO-MOB-007 to TODO-MOB-010)

```
Read: todos/active/TODO-MOB-007-dashboard-page.md
Read: todos/active/TODO-MOB-008-portfolio-pages.md
Read: todos/active/TODO-MOB-009-analytics-page.md
Read: todos/active/TODO-MOB-010-intelligence-page.md
```

---

## Directory Structure

```
apps/mobile/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── env.dart
│   │   ├── theme/
│   │   │   ├── app_colors.dart
│   │   │   ├── app_typography.dart
│   │   │   └── app_theme.dart
│   │   └── widgets/
│   │       ├── app_button.dart
│   │       ├── app_card.dart
│   │       └── app_input.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   ├── analytics/
│   │   └── intelligence/
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── stat_card.dart
│   │   │   ├── portfolio_summary_card.dart
│   │   │   └── charts/
│   │   └── providers/
│   ├── routes/
│   │   └── app_router.dart
│   └── main.dart
├── test/
├── integration_test/
└── pubspec.yaml
```

---

## Design System Implementation

### AppColors
```dart
// lib/core/theme/app_colors.dart
abstract class AppColors {
  // Primary
  static const Color primary50 = Color(0xFFEFF6FF);
  static const Color primary500 = Color(0xFF3B82F6);
  static const Color primary600 = Color(0xFF2563EB);
  static const Color primary700 = Color(0xFF1D4ED8);

  // Semantic
  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);

  // Neutral
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray900 = Color(0xFF111827);

  // Gains/Losses
  static const Color gain = Color(0xFF059669);
  static const Color loss = Color(0xFFDC2626);
}
```

### AppTypography
```dart
// lib/core/theme/app_typography.dart
abstract class AppTypography {
  static const TextStyle heading1 = TextStyle(
    fontSize: 30,
    fontWeight: FontWeight.bold,
    height: 1.2,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.25,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    height: 1.4,
  );
}
```

### AppTheme
```dart
// lib/core/theme/app_theme.dart
abstract class AppTheme {
  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.primary600,
      secondary: AppColors.primary500,
      surface: Colors.white,
      background: AppColors.gray50,
      error: AppColors.danger,
    ),
    textTheme: TextTheme(
      headlineLarge: AppTypography.heading1,
      headlineMedium: AppTypography.heading2,
      bodyLarge: AppTypography.bodyLarge,
      bodySmall: AppTypography.caption,
    ),
  );

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primary500,
      secondary: AppColors.primary600,
      surface: AppColors.gray900,
      background: Color(0xFF0F172A),
      error: AppColors.danger,
    ),
  );
}
```

---

## API Integration Pattern

### Dio Client
```dart
// lib/core/network/api_client.dart
class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors.addAll([
      AuthInterceptor(),
      LogInterceptor(requestBody: true, responseBody: true),
    ]);
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? params}) async {
    final response = await _dio.get(path, queryParameters: params);
    return response.data as T;
  }

  Future<T> post<T>(String path, {dynamic data}) async {
    final response = await _dio.post(path, data: data);
    return response.data as T;
  }
}
```

### Riverpod Providers
```dart
// lib/shared/providers/portfolio_providers.dart
final apiClientProvider = Provider((ref) => ApiClient());

final portfoliosProvider = FutureProvider.autoDispose<List<Portfolio>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get<Map<String, dynamic>>('/portfolios');
  final items = response['items'] as List;
  return items.map((e) => Portfolio.fromJson(e)).toList();
});

final portfolioProvider = FutureProvider.autoDispose.family<Portfolio, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final data = await api.get<Map<String, dynamic>>('/portfolios/$id');
  return Portfolio.fromJson(data);
});

final holdingsProvider = FutureProvider.autoDispose.family<List<Holding>, String>((ref, portfolioId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get<Map<String, dynamic>>('/portfolios/$portfolioId/holdings');
  final items = response['items'] as List;
  return items.map((e) => Holding.fromJson(e)).toList();
});
```

---

## Widget Patterns

### StatCard Widget
```dart
// lib/shared/widgets/stat_card.dart
class StatCard extends StatelessWidget {
  final String label;
  final double value;
  final StatFormat format;
  final TrendDirection? trend;
  final double? trendValue;
  final bool isLoading;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.format,
    this.trend,
    this.trendValue,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const StatCardSkeleton();
    }

    return AppCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTypography.caption.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatValue(value, format),
              style: AppTypography.heading2,
            ),
            if (trend != null) ...[
              const SizedBox(height: 4),
              TrendIndicator(
                trend: trend!,
                value: trendValue,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

### Screen Pattern
```dart
// lib/features/dashboard/presentation/screens/dashboard_screen.dart
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(dashboardSummaryProvider);
    final alerts = ref.watch(recentAlertsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardSummaryProvider);
          ref.invalidate(recentAlertsProvider);
        },
        child: summary.when(
          data: (data) => _buildContent(context, data, alerts),
          loading: () => const DashboardSkeleton(),
          error: (error, stack) => ErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(dashboardSummaryProvider),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    DashboardSummary summary,
    AsyncValue<List<Alert>> alerts,
  ) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats Grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            StatCard(
              label: 'Total AUM',
              value: summary.totalValue,
              format: StatFormat.currency,
              trend: summary.dayChangeTrend,
              trendValue: summary.dayChangePercent,
            ),
            // More stats...
          ],
        ),
        const SizedBox(height: 24),

        // Charts
        AllocationPieChart(data: summary.allocation),
        const SizedBox(height: 24),

        // Alerts
        AlertsSection(alerts: alerts),
      ],
    );
  }
}
```

---

## Navigation (Go Router)

```dart
// lib/routes/app_router.dart
final appRouter = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/portfolios',
          builder: (context, state) => const PortfolioListScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => PortfolioDetailScreen(
                id: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/analytics',
          builder: (context, state) => const AnalyticsScreen(),
        ),
        GoRoute(
          path: '/intelligence',
          builder: (context, state) => const IntelligenceScreen(),
        ),
      ],
    ),
  ],
);
```

---

## Testing

```
Read: todos/active/TODO-TEST-004-mobile-tests.md

- Unit tests: flutter test
- Widget tests: flutter test
- Golden tests: golden_toolkit
- Integration tests: integration_test/
```

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run integration tests
flutter test integration_test/

# Update golden files
flutter test --update-goldens test/golden/
```

---

## Running the App

### Development
```bash
cd apps/mobile

# Get dependencies
flutter pub get

# Run on iOS Simulator
flutter run -d ios

# Run on Android Emulator
flutter run -d android

# Run with specific flavor
flutter run --flavor dev -t lib/main_dev.dart
```

### Build
```bash
# iOS
flutter build ios

# Android
flutter build apk
flutter build appbundle
```

---

## Environment Configuration

```dart
// lib/core/config/env.dart
abstract class Env {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8000/api',
  );
}
```

Pass at build time:
```bash
flutter run --dart-define=API_URL=http://localhost:8000/api
```

---

## Checklist Before Integration Testing

- [ ] All TODO-MOB-* complete
- [ ] Design system configured (colors, typography, themes)
- [ ] All screens render correctly
- [ ] API integration works
- [ ] Authentication flow works
- [ ] Navigation works correctly
- [ ] Pull-to-refresh works
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Offline mode works (Hive caching)
- [ ] Dark mode works
- [ ] Widget tests pass
- [ ] Integration tests pass

---

## Integration with Backend

The app connects to backend via `Env.apiUrl`. Ensure:

1. Backend is running: `curl http://localhost:8000/health`
2. If testing on physical device, use machine's IP instead of localhost
3. For iOS Simulator: `http://localhost:8000` works
4. For Android Emulator: Use `http://10.0.2.2:8000`

### Model Types
```dart
// lib/features/portfolio/domain/models/portfolio.dart
@freezed
class Portfolio with _$Portfolio {
  const factory Portfolio({
    required String id,
    required String name,
    required String code,
    required String portfolioType,
    required String baseCurrency,
    required double totalValue,
    required double dayChangePercent,
    required bool active,
  }) = _Portfolio;

  factory Portfolio.fromJson(Map<String, dynamic> json) =>
      _$PortfolioFromJson(json);
}
```
