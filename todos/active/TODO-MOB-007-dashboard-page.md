# TODO-MOB-007: Dashboard Page

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-MOB-003, TODO-MOB-004, TODO-MOB-006

---

## Objective

Implement the main dashboard screen displaying portfolio overview, key metrics, alerts, and morning brief summary.

---

## Tasks

### 1. Dashboard Screen
- [ ] Create `lib/features/dashboard/presentation/screens/dashboard_screen.dart`:
  ```dart
  class DashboardScreen extends ConsumerWidget {
    const DashboardScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final dashboard = ref.watch(dashboardProvider);

      return Scaffold(
        appBar: AppBar(
          title: const Text('Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.refresh(dashboardProvider),
            ),
          ],
        ),
        body: dashboard.when(
          data: (data) => _DashboardContent(data: data),
          loading: () => const DashboardSkeleton(),
          error: (error, _) => ErrorView(
            error: error,
            onRetry: () => ref.refresh(dashboardProvider),
          ),
        ),
      );
    }
  }
  ```

### 2. Dashboard Provider
- [ ] Create `lib/features/dashboard/presentation/providers/dashboard_provider.dart`:
  ```dart
  final dashboardProvider = FutureProvider<DashboardData>((ref) async {
    final api = ref.watch(apiClientProvider);
    return api.getDashboardData();
  });
  ```

### 3. Portfolio Summary Card
- [ ] Implement portfolio summary section:
  - Total portfolio value
  - Daily change ($ and %)
  - Positive/negative coloring
  - Tap to navigate to portfolio list

### 4. Quick Stats Row
- [ ] Create `lib/features/dashboard/presentation/widgets/quick_stats_row.dart`:
  - 3-4 stat cards in horizontal row
  - YTD Return
  - Health Score
  - Active Alerts count
  - Holdings count

### 5. Allocation Chart Section
- [ ] Create `lib/features/dashboard/presentation/widgets/allocation_section.dart`:
  - Pie chart with sector allocation
  - Legend with percentages
  - Toggle between sector/asset class
  - "View details" link

### 6. Performance Chart Section
- [ ] Create `lib/features/dashboard/presentation/widgets/performance_section.dart`:
  - Line chart (1M, 3M, YTD, 1Y)
  - Period selector chips
  - Benchmark comparison toggle
  - Full-width display

### 7. Alert List Section
- [ ] Create `lib/features/dashboard/presentation/widgets/alert_section.dart`:
  - Section header with count
  - List of top 3-5 alerts
  - Alert tiles (compact variant)
  - "View All" link
  - Swipe to acknowledge

### 8. Morning Brief Section
- [ ] Create `lib/features/dashboard/presentation/widgets/brief_section.dart`:
  - Today's brief summary
  - Key takeaways (bullet points)
  - "Read Full Brief" button
  - Generate button if not available
  - Loading state for streaming

### 9. Dashboard Skeleton
- [ ] Create `lib/features/dashboard/presentation/widgets/dashboard_skeleton.dart`:
  - Shimmer effect for all sections
  - Match layout of actual content
  - Smooth loading experience

### 10. Pull to Refresh
- [ ] Implement refresh functionality:
  - RefreshIndicator wrapper
  - Invalidate all dashboard providers
  - Show loading indicator

---

## Acceptance Criteria

- [ ] Dashboard loads data on screen open
- [ ] Portfolio summary shows correct values
- [ ] Quick stats display key metrics
- [ ] Allocation chart renders correctly
- [ ] Performance chart responds to period selection
- [ ] Alerts list shows top alerts
- [ ] Brief section shows today's brief
- [ ] Pull to refresh works
- [ ] Loading skeleton displays
- [ ] Error state with retry

---

## Dashboard Layout

```
┌─────────────────────────────────────┐
│  Dashboard                    [🔄]  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ Total Portfolio Value           ││
│  │ $1,500,000                      ││
│  │ ▲ $25,000 (1.69%) today         ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ YTD   │ │Health │ │Alerts │     │
│  │+8.5%  │ │ 85    │ │  3    │     │
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│  Allocation           [View All >] │
│  ┌─────────────────────────────────┐│
│  │    [Pie Chart]                  ││
│  └─────────────────────────────────┘│
│                                     │
│  Performance                        │
│  [1M] [3M] [YTD] [1Y]              │
│  ┌─────────────────────────────────┐│
│  │    [Line Chart]                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Alerts (3)           [View All >] │
│  ┌─────────────────────────────────┐│
│  │ ⚠️ AAPL: Current ratio below... ││
│  │ ⚠️ MSFT: Debt/EBITDA rising...  ││
│  └─────────────────────────────────┘│
│                                     │
│  Morning Brief       [Read Full >] │
│  ┌─────────────────────────────────┐│
│  │ Key Takeaways:                  ││
│  │ • Markets up on Fed signals...  ││
│  │ • Tech sector shows strength... ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Technical Notes

- Use ListView for scrollable content
- Lazy load charts (only render when visible)
- Cache dashboard data (1 min stale)
- Use Riverpod for state management
- Handle empty states for each section
- Support landscape orientation
