# ARC Mobile Architecture

## Overview

The ARC Mobile app is a Flutter-based investment management platform following Clean Architecture principles with feature-based organization.

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Flutter | 3.27+ |
| Language | Dart | 3.6+ |
| State Management | Riverpod | 2.6+ |
| Navigation | GoRouter | 14.0+ |
| HTTP Client | Dio | 5.4+ |
| Data Classes | Freezed | 2.5+ |
| Charts | FL Chart | 0.68+ |
| Local Storage | Hive | 1.1+ |
| Secure Storage | flutter_secure_storage | 9.2+ |

## Directory Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # MaterialApp.router configuration
├── bootstrap.dart            # Initialization logic
│
├── core/                     # Shared core functionality
│   ├── api/                  # API client, interceptors, exceptions
│   ├── auth/                 # Authentication service
│   ├── cache/                # Hive cache manager
│   ├── config/               # App configuration
│   ├── design/               # Design system (colors, typography, spacing)
│   │   └── components/       # Core components (AppButton, AppCard, AppInput)
│   ├── providers/            # Global Riverpod providers
│   ├── router/               # GoRouter configuration
│   └── utils/                # Formatters, helpers
│
├── features/                 # Feature modules
│   ├── dashboard/            # Home screen
│   ├── portfolio/            # Portfolio management
│   ├── analytics/            # Alerts and ratios
│   ├── intelligence/         # AI assistant
│   └── settings/             # App settings
│
└── shared/                   # Shared widgets
    ├── widgets/              # Common widgets
    │   └── charts/           # Chart widgets
    └── extensions/           # Dart extensions
```

## Feature Module Structure

Each feature follows Clean Architecture:

```
feature/
├── data/                     # Data layer
│   ├── repositories/         # Repository implementations
│   └── data_sources/         # API/local data sources
│
├── domain/                   # Domain layer
│   ├── models/               # Freezed data models
│   └── use_cases/            # Business logic (optional)
│
└── presentation/             # Presentation layer
    ├── providers/            # Riverpod providers
    ├── screens/              # Full-page screens
    └── widgets/              # Feature-specific widgets
```

## State Management

Using Riverpod for reactive state management:

```dart
// Provider for async data
final portfoliosProvider = FutureProvider<List<Portfolio>>((ref) async {
  final api = ref.watch(apiClientProvider);
  return await api.getPortfolios();
});

// StateNotifier for complex state
final chatNotifier = StateNotifierProvider<ChatNotifier, ChatState>(...);

// Simple state
final filterProvider = StateProvider<String?>((ref) => null);
```

## Navigation

Using GoRouter with ShellRoute for bottom navigation:

```dart
GoRouter(
  routes: [
    ShellRoute(
      builder: (_, __, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => DashboardScreen()),
        GoRoute(path: '/portfolios', builder: (_, __) => PortfolioListScreen()),
        // ...
      ],
    ),
  ],
)
```

## API Client

Dio-based client with interceptors:

```dart
final api = ref.watch(apiClientProvider);

// GET request
final portfolios = await api.getPortfolios();

// POST request
final result = await api.queryPortfolio('How is my portfolio?');
```

Built-in interceptors:
- `AuthInterceptor` - Attaches JWT tokens
- `RetryInterceptor` - Retries failed requests
- `ErrorInterceptor` - Transforms errors to AppException
- `LoggingInterceptor` - Logs requests/responses
