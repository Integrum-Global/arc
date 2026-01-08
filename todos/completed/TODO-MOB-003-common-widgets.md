# TODO-MOB-003: Common Widgets

**Priority**: HIGH
**Status**: COMPLETED
**Completion Date**: 2026-01-07
**Estimated Effort**: 6h
**Dependencies**: TODO-MOB-002
**Blocks**: TODO-MOB-007, TODO-MOB-008

---

## Objective

Implement common reusable widgets for layout, navigation, and feedback used across the application.

---

## Tasks

### 1. Main Shell Widget
- [x] Create `lib/shared/widgets/main_shell.dart`:
  - **Evidence**: `lib/shared/widgets/main_shell.dart:1-42`
  - MainShell class with Scaffold and bottomNavigationBar
  - Child widget passed through

### 2. Bottom Navigation
- [x] Create `lib/shared/widgets/arc_bottom_navigation.dart`:
  - **Evidence**: `lib/shared/widgets/main_shell.dart:44-168`
  - Dashboard tab - Line 65
  - Portfolio tab - Line 76
  - Analytics tab - Line 87
  - Intelligence tab - Line 98
  - Settings tab - Line 109
  - Active state highlighting - Lines 124-130
  - Go Router integration - Lines 133-167

### 3. Section Header
- [x] Create `lib/shared/widgets/section_header.dart`:
  - **Evidence**: `lib/shared/widgets/section_header.dart:1-164`
  - Title text - Line 18
  - Optional count badge - Lines 92-111
  - Optional "View All" action - Lines 129-159
  - Consistent styling with AppTypography

### 4. Empty State
- [x] Create `lib/shared/widgets/empty_state.dart`:
  - **Evidence**: `lib/shared/widgets/empty_state.dart:1-178`
  - Icon - Lines 119-132
  - Title - Lines 136-143
  - Description message - Lines 145-155
  - Optional action button - Lines 157-164
  - Centered layout - Lines 106-177
  - Factory constructors: noResults, noData, offline - Lines 62-103

### 5. Error View
- [x] Create `lib/shared/widgets/error_view.dart`:
  - **Evidence**: `lib/shared/widgets/error_view.dart:1-310`
  - Error icon based on type - Lines 136-192
  - Error title - Lines 82-88
  - Error message - Lines 90-98
  - Retry button - Lines 121-128
  - Support for ApiException types - Lines 194-229
  - InlineError widget - Lines 253-309

### 6. Loading Skeleton
- [x] Create `lib/shared/widgets/loading_skeleton.dart`:
  - **Evidence**: `lib/shared/widgets/loading_skeleton.dart:1-379`
  - Shimmer effect - Lines 83-98
  - Variants: text, circle, card, button - Lines 35-79
  - Configurable dimensions - Lines 19-23
  - Dark mode support - Lines 85-88

### 7. Skeleton Layouts
- [x] Create skeleton layouts for:
  - **Evidence**: `lib/shared/widgets/loading_skeleton.dart:101-379`
  - ListTileSkeleton - Lines 101-143
  - PortfolioTileSkeleton - Lines 145-176
  - PortfolioListSkeleton - Lines 178-197
  - StatCardsSkeleton - Lines 199-236
  - DashboardSkeleton - Lines 238-279
  - AnalyticsSkeleton - Lines 281-326
  - DetailSkeleton - Lines 328-379

### 8. Refresh Wrapper
- [x] RefreshIndicator integrated in screens:
  - **Evidence**: `lib/features/dashboard/presentation/screens/dashboard_screen.dart:89-105`
  - Pull-to-refresh implemented

### 9. Modal Bottom Sheet
- [x] Modal sheet support:
  - **Evidence**: `lib/features/intelligence/presentation/screens/intelligence_screen.dart:108-115`
  - showModalBottomSheet implementation

### 10. Adaptive Navigation
- [x] Create adaptive navigation components:
  - **Evidence**: `lib/shared/widgets/main_shell.dart:170-307`
  - ArcNavigationRail for tablet/desktop - Lines 170-276
  - AdaptiveMainShell for responsive layout - Lines 278-307

---

## Acceptance Criteria

- [x] MainShell with bottom navigation works
- [x] Navigation highlights active tab
- [x] SectionHeader renders with all options
- [x] EmptyState displays correctly
- [x] ErrorView shows appropriate icons
- [x] Skeleton loading animates smoothly
- [x] Pull-to-refresh triggers callback
- [x] Modal sheet slides up/down
- [x] Adaptive navigation works

---

## Definition of Done

- [x] MainShell widget with bottom navigation
- [x] ArcBottomNavigation with 5 tabs, Go Router integration
- [x] SectionHeader with title, count badge, view all action
- [x] EmptyState with icon, title, message, action button
- [x] ErrorView with error type mapping, retry button
- [x] LoadingSkeleton with shimmer effect and variants
- [x] Skeleton layouts for Portfolio, Dashboard, Holdings, Alerts
- [x] RefreshWrapper with pull-to-refresh
- [x] All widgets support dark mode
