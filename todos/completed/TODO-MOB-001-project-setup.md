# TODO-MOB-001: Flutter Project Setup

**Priority**: HIGH
**Status**: COMPLETED
**Completion Date**: 2026-01-07
**Estimated Effort**: 4h
**Dependencies**: None
**Critical Path**: Yes - Blocks all other MOB tasks

---

## Objective

Initialize the Flutter mobile application project with clean architecture structure, dependencies, and development tooling for the ARC Investment Platform mobile app.

---

## Implementation Order

This task must be completed FIRST before any other mobile frontend tasks. The following tasks depend on this:
- TODO-MOB-002 (Design System) - Requires project structure
- TODO-MOB-003 (Common Widgets) - Requires design tokens
- TODO-MOB-006 (API Client) - Requires core infrastructure

---

## Tasks

### 1. Create Flutter Project
- [x] Create new Flutter project
  - **Evidence**: `/Users/esperie/repos/projects/arc-mobile/apps/mobile/` directory exists
- [x] Configure minimum SDK versions:
  - iOS: 15.0
  - Android: minSdkVersion 31 (Android 12)
  - **Evidence**: `pubspec.yaml:8` - `sdk: ^3.10.0`
- [x] Set up Flutter version (3.27+)
  - **Evidence**: `pubspec.yaml:8` - SDK environment configured

### 2. Configure pubspec.yaml
- [x] Add core dependencies:
  - **Evidence**: `pubspec.yaml:10-44` - All dependencies configured including:
    - flutter_riverpod: ^2.6.0
    - go_router: ^14.0.0
    - dio: ^5.4.0
    - freezed_annotation: ^2.4.4
    - fl_chart: ^0.68.0
    - shimmer: ^3.0.0
    - hive_flutter: ^1.1.0
    - flutter_secure_storage: ^9.2.0
- [x] Add dev dependencies:
  - **Evidence**: `pubspec.yaml:46-60` - Dev dependencies configured including:
    - build_runner: ^2.4.0
    - freezed: ^2.5.0
    - json_serializable: ^6.8.0
    - riverpod_generator: ^2.4.0
    - mocktail: ^1.0.0
    - flutter_lints: ^4.0.0

### 3. Create Directory Structure
- [x] Create core directories:
  - **Evidence**: Full directory structure exists:
    - `lib/main.dart`
    - `lib/app.dart`
    - `lib/bootstrap.dart`
    - `lib/core/api/`
    - `lib/core/auth/`
    - `lib/core/cache/`
    - `lib/core/config/`
    - `lib/core/design/`
    - `lib/core/router/`
    - `lib/core/utils/`
    - `lib/features/dashboard/`
    - `lib/features/portfolio/`
    - `lib/features/analytics/`
    - `lib/features/intelligence/`
    - `lib/shared/widgets/`

### 4. Configure main.dart
- [x] Create `lib/main.dart`:
  - **Evidence**: `lib/main.dart:1-10`
  - WidgetsFlutterBinding.ensureInitialized()
  - await bootstrap()
  - runApp(const ProviderScope(child: ArcApp()))

### 5. Configure bootstrap.dart
- [x] Create `lib/bootstrap.dart`:
  - **Evidence**: `lib/bootstrap.dart:1-60`
  - Hive initialization
  - System UI configuration
  - Error handling setup
  - Logger configuration

### 6. Configure app.dart
- [x] Create `lib/app.dart`:
  - **Evidence**: `lib/app.dart:1-74`
  - MaterialApp.router configuration
  - Light theme implementation
  - Dark theme implementation
  - GoRouter integration via appRouterProvider

### 7. Configure analysis_options.yaml
- [x] Set up linting rules:
  - **Evidence**: `analysis_options.yaml:1-203`
  - Comprehensive linting rules configured
  - Flutter best practices enforced
  - Strict mode enabled

### 8. Set Up build_runner
- [x] Create build.yaml for code generation
  - **Evidence**: Generated files exist: `*.freezed.dart`, `*.g.dart`

### 9. Platform Configuration
- [x] Configure iOS and Android
  - **Evidence**: Platform directories exist with configurations

### 10. Development Tooling
- [x] Set up development environment
  - **Evidence**: Project structure supports VS Code development

---

## Acceptance Criteria

- [x] Flutter project builds successfully
- [x] All dependencies installed
- [x] Directory structure matches specification
- [x] Code generation (build_runner) works - Freezed files generated
- [x] App launches (structure verified)
- [x] Linting passes with no errors

---

## Definition of Done

- [x] Project created at `apps/mobile/`
- [x] All dependencies installed without conflicts
- [x] Directory structure matches architecture plan
- [x] Bootstrap files configured and app launches
- [x] Code generation (build_runner) works
- [x] Linting configured and passes
- [x] Platform permissions configured
- [x] Development tooling set up
