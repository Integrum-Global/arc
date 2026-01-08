# Getting Started

## Prerequisites

- Flutter 3.27+
- Dart 3.6+
- Xcode (for iOS)
- Android Studio (for Android)

## Setup

1. **Clone and navigate**:
   ```bash
   cd apps/mobile
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Generate code** (Freezed models):
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Run**:
   ```bash
   # iOS
   flutter run -d iPhone

   # Android
   flutter run -d android

   # With environment
   flutter run --dart-define=ENV=staging
   ```

## Project Structure Overview

```
lib/
├── core/design/design_system.dart    # Import for all design tokens
├── core/api/api_client.dart          # HTTP client
├── core/providers/providers.dart     # Global providers
├── shared/widgets/widgets.dart       # Shared widgets
└── features/{name}/                  # Feature modules
```

## Quick Reference

### Import Design System
```dart
import 'package:arc_mobile/core/design/design_system.dart';
```

### Import Shared Widgets
```dart
import 'package:arc_mobile/shared/widgets/widgets.dart';
```

### Import Feature Models
```dart
import 'package:arc_mobile/features/portfolio/domain/models/models.dart';
```

### Access API Client
```dart
final api = ref.watch(apiClientProvider);
```

### Common Patterns

**Async data with loading/error states**:
```dart
final data = ref.watch(myProvider);

return data.when(
  data: (d) => MyWidget(data: d),
  loading: () => LoadingSkeleton.card(),
  error: (e, _) => ErrorView(error: e),
);
```

**Pull-to-refresh**:
```dart
RefreshIndicator(
  onRefresh: () async {
    ref.invalidate(myProvider);
    await ref.read(myProvider.future);
  },
  child: ListView(...),
)
```

**Navigation**:
```dart
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/router/route_paths.dart';

// Navigate
context.go(RoutePaths.portfolios);
context.go(RoutePaths.portfolioDetail('123'));

// Push (keeps back stack)
context.push(RoutePaths.portfolioDetail('123'));
```

## Testing

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/widget_test.dart

# Run with coverage
flutter test --coverage
```

## Building

```bash
# iOS (requires signing)
flutter build ios

# iOS (no codesign for CI)
flutter build ios --no-codesign

# Android APK
flutter build apk

# Android App Bundle
flutter build appbundle
```

## Code Generation

After modifying Freezed models:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Or watch for changes:
```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## Environment Configuration

Set environment via `--dart-define`:

```bash
# Development (default)
flutter run

# Staging
flutter run --dart-define=ENV=staging

# Production
flutter run --dart-define=ENV=production
```

API base URLs:
- Development: `http://localhost:8000/v1`
- Staging: `https://api.staging.arc-platform.com/v1`
- Production: `https://api.arc-platform.com/v1`
