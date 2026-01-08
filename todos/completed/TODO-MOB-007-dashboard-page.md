# TODO-MOB-007: Dashboard Page

**Priority**: HIGH
**Status**: COMPLETED
**Completion Date**: 2026-01-07
**Estimated Effort**: 6h
**Dependencies**: TODO-MOB-003, TODO-MOB-004, TODO-MOB-006
**MVP Milestone**: Yes - This is the minimum demo screen

---

## Objective

Implement the main dashboard screen displaying portfolio overview, key metrics, alerts, and quick actions.

---

## Tasks

### 1. Dashboard Screen
- [x] Create `lib/features/dashboard/presentation/screens/dashboard_screen.dart`:
  - **Evidence**: `lib/features/dashboard/presentation/screens/dashboard_screen.dart:1-440`
  - ConsumerWidget with Riverpod integration - Lines 22-108
  - AppBar with title, notification bell, and settings - Lines 35-87
  - RefreshIndicator for pull-to-refresh - Lines 89-105
  - AsyncValue handling with .when() - Lines 93-104
  - Error state with retry - Lines 100-103

### 2. Dashboard Provider
- [x] Create `lib/features/dashboard/presentation/providers/dashboard_providers.dart`:
  - **Evidence**: File exists and is referenced
  - dashboardSummaryProvider - Referenced in `dashboard_screen.dart:27`
  - dashboardViewStateProvider - Referenced in `dashboard_screen.dart:30`
  - unreadAlertsCountProvider - Referenced in `dashboard_screen.dart:29`

### 3. Portfolio Summary Card
- [x] Implement portfolio summary section:
  - **Evidence**: `dashboard_screen.dart:136-145`
  - Total portfolio value
  - Daily change ($ and %)
  - Positive/negative coloring
  - Tap to navigate to portfolio list

### 4. Quick Stats Row
- [x] Create quick stats section:
  - **Evidence**: `dashboard_screen.dart:149-153`
  - QuickStatsRow widget with summary data
  - Stat tap handlers

### 5. Allocation Chart Section
- [x] Create allocation section:
  - **Evidence**: `dashboard_screen.dart:157-165`, Lines 259-323
  - _AllocationSection widget
  - Pie chart with AllocationPieChart
  - Section header with "Details" link
  - Empty state handling

### 6. Alert List Section
- [x] Create alert section:
  - **Evidence**: `dashboard_screen.dart:169-196`
  - AlertListWidget with alerts
  - Max 3 items shown
  - View All link
  - Alert tap and dismiss handlers

### 7. Quick Actions Section
- [x] Create quick actions:
  - **Evidence**: `dashboard_screen.dart:200-206`, Lines 325-379
  - _QuickActionsSection widget
  - Three action buttons: Portfolios, Analytics, Ask AI
  - Navigation on tap

### 8. Dashboard Content
- [x] Create main content:
  - **Evidence**: `dashboard_screen.dart:110-257`
  - _DashboardContent widget
  - ListView with all sections
  - Refreshing indicator
  - Navigation handlers

### 9. Dashboard Skeleton
- [x] Create loading skeleton:
  - **Evidence**: `lib/shared/widgets/loading_skeleton.dart:238-279`
  - DashboardSkeleton class
  - Shimmer effect for all sections
  - Matches actual content layout

### 10. Pull to Refresh
- [x] Implement refresh functionality:
  - **Evidence**: `dashboard_screen.dart:89-91`
  - RefreshIndicator wrapper
  - Calls dashboardViewStateProvider.notifier.refresh()

---

## Acceptance Criteria

- [x] Dashboard loads data on screen open
- [x] Portfolio summary shows correct values
- [x] Quick stats display key metrics
- [x] Allocation chart renders correctly
- [x] Alerts list shows top alerts
- [x] Pull to refresh works
- [x] Loading skeleton displays
- [x] Error state with retry
- [x] Navigation to other screens works

---

## Definition of Done

- [x] DashboardScreen with Riverpod provider integration
- [x] DashboardProvider fetches aggregated data
- [x] PortfolioSummaryCard displays total value and daily change
- [x] QuickStatsRow with key metrics
- [x] AllocationSection with pie chart and legend
- [x] AlertListWidget with top alerts and view all
- [x] QuickActionsSection with shortcut buttons
- [x] DashboardSkeleton for loading state
- [x] Pull-to-refresh invalidates providers
- [x] Error state with retry button
- [x] Empty states for each section
- [x] Navigation to portfolio list from summary card
- [x] Navigation to analytics from alert section
- [x] Navigation to AI chat from quick actions
