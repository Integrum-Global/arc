# TODO-MOB-001: Flutter Project Setup

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: None

---

## Objective

Initialize the Flutter mobile application project with clean architecture structure, dependencies, and development tooling.

---

## Tasks

### 1. Create Flutter Project
- [ ] Create new Flutter project:
  ```bash
  flutter create --org com.arc --project-name arc_mobile apps/mobile
  cd apps/mobile
  flutter pub get
  ```
- [ ] Configure minimum SDK versions:
  - iOS: 15.0
  - Android: minSdkVersion 31 (Android 12)
- [ ] Set up Flutter version (3.27+)

### 2. Configure pubspec.yaml
- [ ] Add core dependencies:
  ```yaml
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
    shimmer: ^3.0.0
    # Utilities
    intl: ^0.19.0
    logger: ^2.4.0
  ```
- [ ] Add dev dependencies:
  ```yaml
  dev_dependencies:
    flutter_test:
      sdk: flutter
    build_runner: ^2.4.0
    freezed: ^2.5.0
    json_serializable: ^6.8.0
    riverpod_generator: ^2.4.0
    mocktail: ^1.0.0
    flutter_lints: ^4.0.0
  ```

### 3. Create Directory Structure
- [ ] Create core directories:
  ```
  lib/
  ├── main.dart
  ├── app.dart
  ├── bootstrap.dart
  ├── core/
  │   ├── api/
  │   ├── auth/
  │   ├── cache/
  │   ├── config/
  │   ├── design/
  │   ├── router/
  │   └── utils/
  ├── features/
  │   ├── dashboard/
  │   ├── portfolio/
  │   ├── analytics/
  │   ├── intelligence/
  │   └── settings/
  └── shared/
      ├── widgets/
      └── extensions/
  ```

### 4. Configure main.dart
- [ ] Create `lib/main.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:arc_mobile/bootstrap.dart';
  import 'package:arc_mobile/app.dart';

  void main() async {
    WidgetsFlutterBinding.ensureInitialized();
    await bootstrap();
    runApp(const ProviderScope(child: ArcApp()));
  }
  ```

### 5. Configure bootstrap.dart
- [ ] Create `lib/bootstrap.dart`:
  ```dart
  import 'package:hive_flutter/hive_flutter.dart';
  import 'package:arc_mobile/core/cache/cache_manager.dart';

  Future<void> bootstrap() async {
    // Initialize Hive
    await Hive.initFlutter();

    // Initialize cache manager
    await CacheManager().initialize();

    // Initialize other services
    // ...
  }
  ```

### 6. Configure app.dart
- [ ] Create `lib/app.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:arc_mobile/core/router/app_router.dart';
  import 'package:arc_mobile/core/config/theme_config.dart';

  class ArcApp extends ConsumerWidget {
    const ArcApp({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final router = ref.watch(routerProvider);

      return MaterialApp.router(
        title: 'ARC Investment Platform',
        theme: ThemeConfig.lightTheme,
        darkTheme: ThemeConfig.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      );
    }
  }
  ```

### 7. Configure analysis_options.yaml
- [ ] Set up linting rules:
  ```yaml
  include: package:flutter_lints/flutter.yaml

  linter:
    rules:
      prefer_const_constructors: true
      prefer_const_declarations: true
      prefer_final_fields: true
      prefer_final_locals: true
      avoid_print: true
      require_trailing_commas: true
  ```

### 8. Set Up build_runner
- [ ] Create build.yaml for code generation:
  ```yaml
  targets:
    $default:
      builders:
        freezed:
          generate_for:
            include:
              - lib/features/**/domain/models/*.dart
        json_serializable:
          options:
            explicit_to_json: true
        riverpod_generator:
          generate_for:
            include:
              - lib/features/**/presentation/providers/*.dart
  ```
- [ ] Add scripts to pubspec.yaml:
  ```yaml
  scripts:
    build: flutter pub run build_runner build --delete-conflicting-outputs
    watch: flutter pub run build_runner watch --delete-conflicting-outputs
  ```

### 9. Platform Configuration
- [ ] Configure iOS (ios/Runner/Info.plist):
  - Add camera, microphone permissions (for voice input)
  - Add network security settings
- [ ] Configure Android (android/app/src/main/AndroidManifest.xml):
  - Add internet permission
  - Add microphone permission
  - Configure network security

### 10. Development Tooling
- [ ] Set up VS Code launch configurations (.vscode/launch.json)
- [ ] Set up VS Code tasks (.vscode/tasks.json)
- [ ] Create .env.example for environment variables

---

## Acceptance Criteria

- [ ] Flutter project builds successfully
- [ ] All dependencies installed
- [ ] Directory structure matches specification
- [ ] Code generation (build_runner) works
- [ ] App launches on iOS simulator
- [ ] App launches on Android emulator
- [ ] Linting passes with no errors

---

## Technical Notes

- Use Flutter 3.27+ for latest features
- Riverpod 2.x for type-safe state management
- Go Router for declarative navigation
- Freezed for immutable models
- Follow Clean Architecture pattern
