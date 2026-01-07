# ARC Mobile Screen Specifications

## Overview

This document provides comprehensive specifications for all screens in the ARC mobile application. Each screen includes wireframe descriptions, component breakdowns, user interactions, API integrations, and acceptance criteria.

---

## 1. Dashboard Screen

### 1.1 Screen Overview

**Purpose**: Provide a quick overview of portfolio performance, key metrics, and actionable alerts.

**Route**: `/` (root)
**File**: `lib/features/dashboard/presentation/screens/dashboard_screen.dart`

### 1.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   ARC Logo    "Good morning, John"   [Notif]│
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Total Portfolio Value Card]        │ │
│ │  $1,523,450.00                      │ │
│ │  +$25,340.00 (+1.69%) today        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │YTD     │ │30D     │ │7D      │       │
│ │+12.5%  │ │+3.2%   │ │+1.1%   │       │
│ └────────┘ └────────┘ └────────┘       │
│                                         │
│ ── Active Alerts (3) ──────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ [!] AAPL Current Ratio below 1.0   │ │
│ │     Threshold alert - 2h ago       │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [!] MSFT Debt/Equity rising        │ │
│ │     Trend alert - 4h ago           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Top Performers ────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ NVDA  +5.2%  $892.50               │ │
│ │ AAPL  +2.1%  $198.45               │ │
│ │ MSFT  +1.8%  $421.30               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Today's Brief ──────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ [AI] Market Intelligence Brief      │ │
│ │ Tech sector momentum continues...   │ │
│ │                    [Read More →]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 1.3 Implementation

```dart
// lib/features/dashboard/presentation/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/dashboard/presentation/providers/dashboard_providers.dart';
import 'package:arc_mobile/features/dashboard/presentation/widgets/portfolio_summary_card.dart';
import 'package:arc_mobile/features/dashboard/presentation/widgets/quick_stats_row.dart';
import 'package:arc_mobile/features/dashboard/presentation/widgets/alert_list_widget.dart';
import 'package:arc_mobile/features/dashboard/presentation/widgets/top_performers_widget.dart';
import 'package:arc_mobile/features/dashboard/presentation/widgets/brief_preview_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: _buildGreeting(ref),
        actions: [
          IconButton(
            icon: Badge(
              label: Text('${ref.watch(unreadAlertCountProvider)}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.push('/analytics/alerts'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(dashboardProvider.future),
        child: dashboardAsync.when(
          data: (data) => _buildContent(context, ref, data),
          loading: () => const DashboardSkeleton(),
          error: (error, stack) => ErrorView(
            error: error,
            onRetry: () => ref.refresh(dashboardProvider.future),
          ),
        ),
      ),
    );
  }

  Widget _buildGreeting(WidgetRef ref) {
    final userName = ref.watch(currentUserProvider).valueOrNull?.name ?? 'there';
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$greeting,',
          style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
        ),
        Text(userName.split(' ').first, style: AppTypography.h4),
      ],
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, DashboardData data) {
    return ListView(
      padding: AppSpacing.allMd,
      children: [
        // Portfolio Summary Card
        PortfolioSummaryCard(
          totalValue: data.totalValue,
          dailyChange: data.dailyChange,
          dailyChangePct: data.dailyChangePct,
          onTap: () => context.go('/portfolios'),
        ),

        AppSpacing.gapMd,

        // Quick Stats Row (YTD, 30D, 7D)
        QuickStatsRow(
          ytdReturn: data.ytdReturn,
          thirtyDayReturn: data.thirtyDayReturn,
          sevenDayReturn: data.sevenDayReturn,
        ),

        AppSpacing.gapLg,

        // Active Alerts Section
        SectionHeader(
          title: 'Active Alerts',
          count: data.activeAlerts.length,
          onViewAll: () => context.push('/analytics/alerts'),
        ),
        AlertListWidget(
          alerts: data.activeAlerts.take(3).toList(),
          compact: true,
        ),

        AppSpacing.gapLg,

        // Top Performers Section
        SectionHeader(
          title: 'Top Performers',
          onViewAll: () => context.go('/portfolios'),
        ),
        TopPerformersWidget(performers: data.topPerformers),

        AppSpacing.gapLg,

        // Today's Brief Preview
        if (data.latestBrief != null) ...[
          SectionHeader(title: "Today's Brief"),
          BriefPreviewCard(
            brief: data.latestBrief!,
            onTap: () => context.push('/intelligence/brief/${data.latestBrief!.id}'),
          ),
        ],

        AppSpacing.gapXxl, // Bottom padding for FAB
      ],
    );
  }
}
```

### 1.4 Dashboard Providers

```dart
// lib/features/dashboard/presentation/providers/dashboard_providers.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

final dashboardProvider = FutureProvider<DashboardData>((ref) async {
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(cacheManagerProvider);

  // Try cache first (5 minute TTL)
  final cached = await cache.get<DashboardData>('dashboard');
  if (cached != null) return cached;

  // Fetch from API
  final response = await api.getDashboard();
  final data = DashboardData.fromJson(response);

  // Cache result
  await cache.set('dashboard', data, duration: const Duration(minutes: 5));

  return data;
});

final unreadAlertCountProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.valueOrNull?.activeAlerts.length ?? 0;
});
```

### 1.5 API Integration

**Endpoint**: `GET /v1/dashboard`

**Response**:
```json
{
  "total_value": 1523450.00,
  "daily_change": 25340.00,
  "daily_change_pct": 1.69,
  "ytd_return": 12.5,
  "thirty_day_return": 3.2,
  "seven_day_return": 1.1,
  "active_alerts": [
    {
      "id": "alert-001",
      "type": "threshold",
      "severity": "warning",
      "title": "AAPL Current Ratio below 1.0",
      "security_id": "AAPL",
      "triggered_at": "2026-01-07T08:30:00Z"
    }
  ],
  "top_performers": [
    {
      "security_id": "NVDA",
      "ticker": "NVDA",
      "name": "NVIDIA Corp",
      "daily_change_pct": 5.2,
      "current_price": 892.50
    }
  ],
  "latest_brief": {
    "id": "brief-20260107",
    "type": "daily",
    "summary": "Tech sector momentum continues...",
    "generated_at": "2026-01-07T07:00:00Z"
  }
}
```

### 1.6 Acceptance Criteria

- [ ] **DASH-001**: Display total portfolio value with formatting
- [ ] **DASH-002**: Show daily change with color coding (green/red)
- [ ] **DASH-003**: Display YTD, 30D, 7D return metrics
- [ ] **DASH-004**: Show up to 3 active alerts with severity icons
- [ ] **DASH-005**: Display top 5 performing holdings
- [ ] **DASH-006**: Show brief preview if available
- [ ] **DASH-007**: Pull-to-refresh functionality
- [ ] **DASH-008**: Loading skeleton on initial load
- [ ] **DASH-009**: Error state with retry button
- [ ] **DASH-010**: Navigate to alerts on notification icon tap
- [ ] **DASH-011**: Navigate to portfolio detail on value card tap
- [ ] **DASH-012**: Time-based greeting (morning/afternoon/evening)

---

## 2. Portfolio List Screen

### 2.1 Screen Overview

**Purpose**: Display all portfolios with summary metrics and navigation to details.

**Route**: `/portfolios`
**File**: `lib/features/portfolio/presentation/screens/portfolio_list_screen.dart`

### 2.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   Portfolios                    [Filter]│
├─────────────────────────────────────────┤
│ [Search Bar]                            │
│ ┌─────────────────────────────────────┐ │
│ │ Search portfolios...                │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Filter Chips]                          │
│ (All) (Managed) (Model) (Benchmark)     │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Growth Equity Portfolio     [GEP]  │ │
│ │ $523,450.00                         │ │
│ │ +2.1% today  |  +15.3% YTD         │ │
│ │ 25 holdings  |  Moderate risk      │ │
│ │ ▓▓▓▓▓▓▓▓▓▓░░░░ 68% equity          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Income Portfolio            [INC]  │ │
│ │ $312,890.00                         │ │
│ │ +0.8% today  |  +8.2% YTD          │ │
│ │ 18 holdings  |  Conservative       │ │
│ │ ▓▓▓▓░░░░░░░░░░ 30% equity          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Private Equity Fund         [PEF]  │ │
│ │ $687,110.00                         │ │
│ │ --% today   |  +22.1% YTD          │ │
│ │ 8 holdings   |  Aggressive         │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% alternative    │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 2.3 Implementation

```dart
// lib/features/portfolio/presentation/screens/portfolio_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/portfolio/presentation/providers/portfolio_providers.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/portfolio_list_tile.dart';

class PortfolioListScreen extends ConsumerStatefulWidget {
  const PortfolioListScreen({super.key});

  @override
  ConsumerState<PortfolioListScreen> createState() => _PortfolioListScreenState();
}

class _PortfolioListScreenState extends ConsumerState<PortfolioListScreen> {
  String _searchQuery = '';
  String _selectedType = 'all';

  final List<(String, String)> _filterOptions = [
    ('all', 'All'),
    ('managed', 'Managed'),
    ('model', 'Model'),
    ('benchmark', 'Benchmark'),
  ];

  @override
  Widget build(BuildContext context) {
    final portfoliosAsync = ref.watch(portfolioListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolios'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterBottomSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: AppSpacing.horizontalMd.add(AppSpacing.verticalSm),
            child: AppInput.search(
              hint: 'Search portfolios...',
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),

          // Filter Chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: AppSpacing.horizontalMd,
              itemCount: _filterOptions.length,
              separatorBuilder: (_, __) => AppSpacing.gapSm,
              itemBuilder: (context, index) {
                final (key, label) = _filterOptions[index];
                final isSelected = _selectedType == key;

                return FilterChip(
                  label: Text(label),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedType = key),
                );
              },
            ),
          ),

          // Portfolio List
          Expanded(
            child: portfoliosAsync.when(
              data: (portfolios) {
                final filtered = _filterPortfolios(portfolios);

                if (filtered.isEmpty) {
                  return EmptyState(
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'No portfolios found',
                    message: _searchQuery.isNotEmpty
                        ? 'Try a different search term'
                        : 'Create your first portfolio to get started',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.refresh(portfolioListProvider.future),
                  child: ListView.separated(
                    padding: AppSpacing.allMd,
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => AppSpacing.gapMd,
                    itemBuilder: (context, index) {
                      final portfolio = filtered[index];
                      return PortfolioListTile(
                        portfolio: portfolio,
                        onTap: () => context.push('/portfolios/${portfolio.id}'),
                      );
                    },
                  ),
                );
              },
              loading: () => const PortfolioListSkeleton(),
              error: (error, _) => ErrorView(
                error: error,
                onRetry: () => ref.refresh(portfolioListProvider.future),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Portfolio> _filterPortfolios(List<Portfolio> portfolios) {
    return portfolios.where((p) {
      // Type filter
      if (_selectedType != 'all' && p.portfolioType != _selectedType) {
        return false;
      }

      // Search filter
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        return p.name.toLowerCase().contains(query) ||
               p.code.toLowerCase().contains(query);
      }

      return true;
    }).toList();
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => PortfolioFilterSheet(
        initialType: _selectedType,
        onApply: (type) {
          setState(() => _selectedType = type);
          Navigator.pop(context);
        },
      ),
    );
  }
}
```

### 2.4 Portfolio List Tile

```dart
// lib/features/portfolio/presentation/widgets/portfolio_list_tile.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class PortfolioListTile extends StatelessWidget {
  final Portfolio portfolio;
  final VoidCallback? onTap;

  const PortfolioListTile({
    super.key,
    required this.portfolio,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Expanded(
                child: Text(
                  portfolio.name,
                  style: AppTypography.h4,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? AppColorsDark.surface : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  portfolio.code,
                  style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),

          AppSpacing.gapSm,

          // Total Value
          Text(
            Formatters.currency(portfolio.totalValue),
            style: AppTypography.h3,
          ),

          AppSpacing.gapXs,

          // Returns Row
          Row(
            children: [
              _ReturnBadge(
                label: 'Today',
                value: portfolio.dailyChangePct,
              ),
              AppSpacing.gapMd,
              _ReturnBadge(
                label: 'YTD',
                value: portfolio.ytdReturn,
              ),
            ],
          ),

          AppSpacing.gapSm,

          // Info Row
          Row(
            children: [
              Icon(
                Icons.pie_chart_outline,
                size: 16,
                color: AppColors.textSecondary,
              ),
              AppSpacing.gapXs,
              Text(
                '${portfolio.holdingsCount} holdings',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              AppSpacing.gapMd,
              Icon(
                Icons.speed_outlined,
                size: 16,
                color: AppColors.textSecondary,
              ),
              AppSpacing.gapXs,
              Text(
                portfolio.riskProfile.capitalize(),
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),

          AppSpacing.gapSm,

          // Asset Allocation Bar
          _AllocationBar(
            allocations: portfolio.assetAllocation,
          ),
        ],
      ),
    );
  }
}

class _ReturnBadge extends StatelessWidget {
  final String label;
  final double? value;

  const _ReturnBadge({required this.label, this.value});

  @override
  Widget build(BuildContext context) {
    final isPositive = (value ?? 0) >= 0;
    final color = value == null
        ? AppColors.textSecondary
        : isPositive
            ? AppColors.success
            : AppColors.error;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$label: ',
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value != null ? Formatters.percentChange(value!) : '--',
          style: AppTypography.bodySmall.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _AllocationBar extends StatelessWidget {
  final Map<String, double> allocations;

  const _AllocationBar({required this.allocations});

  static const _assetColors = {
    'equity': Color(0xFF1976D2),
    'fixed_income': Color(0xFF26A69A),
    'alternative': Color(0xFFAB47BC),
    'cash': Color(0xFFBDBDBD),
  };

  @override
  Widget build(BuildContext context) {
    final sorted = allocations.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final primary = sorted.isNotEmpty ? sorted.first : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: SizedBox(
            height: 8,
            child: Row(
              children: sorted.map((entry) {
                return Expanded(
                  flex: (entry.value * 100).round(),
                  child: Container(
                    color: _assetColors[entry.key] ?? AppColors.textSecondary,
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        AppSpacing.gapXs,

        // Label
        if (primary != null)
          Text(
            '${(primary.value * 100).round()}% ${_formatAssetClass(primary.key)}',
            style: AppTypography.caption.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
      ],
    );
  }

  String _formatAssetClass(String key) {
    return key.replaceAll('_', ' ').capitalize();
  }
}
```

### 2.5 Acceptance Criteria

- [ ] **PLIST-001**: Display all portfolios in scrollable list
- [ ] **PLIST-002**: Search portfolios by name or code
- [ ] **PLIST-003**: Filter by portfolio type (managed/model/benchmark)
- [ ] **PLIST-004**: Show total value with proper formatting
- [ ] **PLIST-005**: Display daily and YTD returns with color coding
- [ ] **PLIST-006**: Show holdings count and risk profile
- [ ] **PLIST-007**: Asset allocation bar visualization
- [ ] **PLIST-008**: Pull-to-refresh functionality
- [ ] **PLIST-009**: Empty state when no results
- [ ] **PLIST-010**: Navigate to portfolio detail on tap

---

## 3. Portfolio Detail Screen

### 3.1 Screen Overview

**Purpose**: Display comprehensive portfolio information including holdings, performance, and allocations.

**Route**: `/portfolios/:portfolioId`
**File**: `lib/features/portfolio/presentation/screens/portfolio_detail_screen.dart`

### 3.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   ← Growth Equity Portfolio     [More]  │
├─────────────────────────────────────────┤
│ [Tab Bar]                               │
│   (Overview) (Holdings) (Performance)   │
├─────────────────────────────────────────┤
│                                         │
│ === OVERVIEW TAB ===                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Total Value                         │ │
│ │ $523,450.00                         │ │
│ │ +$10,890.50 (+2.12%) today         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌────────────────┐ ┌────────────────┐   │
│ │ YTD Return     │ │ Since Inception│   │
│ │ +15.3%         │ │ +42.8%         │   │
│ └────────────────┘ └────────────────┘   │
│                                         │
│ ── Sector Allocation ─────────────────│
│ ┌─────────────────────────────────────┐ │
│ │      [Pie Chart]                    │ │
│ │   Technology 40%                    │ │
│ │   Healthcare 25%                    │ │
│ │   Financials 20%                    │ │
│ │   Consumer 15%                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Asset Allocation ──────────────────│
│ │ Equity        ▓▓▓▓▓▓▓▓▓▓░░  68%    │ │
│ │ Fixed Income  ▓▓▓▓░░░░░░░░  20%    │ │
│ │ Cash          ▓▓░░░░░░░░░░  12%    │ │
│                                         │
│ === HOLDINGS TAB ===                    │
│                                         │
│ [Sort: Value ▼] [Search...]             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ NVDA           $125,340 (23.9%)    │ │
│ │ NVIDIA Corp    +5.2% today         │ │
│ │ 140 shares @ $428.50 avg           │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ AAPL           $98,225 (18.8%)     │ │
│ │ Apple Inc      +2.1% today         │ │
│ │ 495 shares @ $158.20 avg           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ === PERFORMANCE TAB ===                 │
│                                         │
│ [1D] [1W] [1M] [3M] [1Y] [ALL]         │
│ ┌─────────────────────────────────────┐ │
│ │        [Line Chart]                 │ │
│ │   Portfolio vs Benchmark            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Risk Metrics                            │
│ │ Volatility (30d)     12.5%         │ │
│ │ Sharpe Ratio         1.45          │ │
│ │ Max Drawdown         -8.2%         │ │
│ │ Beta                 1.12          │ │
│                                         │
└─────────────────────────────────────────┘
```

### 3.3 Implementation

```dart
// lib/features/portfolio/presentation/screens/portfolio_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/portfolio/presentation/providers/portfolio_providers.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/portfolio_overview_tab.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/holdings_tab.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/performance_tab.dart';

class PortfolioDetailScreen extends ConsumerStatefulWidget {
  final String portfolioId;

  const PortfolioDetailScreen({super.key, required this.portfolioId});

  @override
  ConsumerState<PortfolioDetailScreen> createState() => _PortfolioDetailScreenState();
}

class _PortfolioDetailScreenState extends ConsumerState<PortfolioDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final portfolioAsync = ref.watch(portfolioProvider(widget.portfolioId));

    return portfolioAsync.when(
      data: (portfolio) {
        if (portfolio == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const ErrorView(
              error: ApiException('Portfolio not found', code: 'NOT_FOUND'),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(portfolio.name),
            actions: [
              PopupMenuButton<String>(
                onSelected: (value) => _handleMenuAction(value, portfolio),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'refresh_nav',
                    child: Text('Refresh NAV'),
                  ),
                  const PopupMenuItem(
                    value: 'health_scan',
                    child: Text('Run Health Scan'),
                  ),
                  const PopupMenuItem(
                    value: 'export',
                    child: Text('Export Report'),
                  ),
                ],
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Holdings'),
                Tab(text: 'Performance'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              PortfolioOverviewTab(portfolio: portfolio),
              HoldingsTab(portfolioId: portfolio.id),
              PerformanceTab(portfolioId: portfolio.id),
            ],
          ),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: ErrorView(
          error: error,
          onRetry: () => ref.refresh(portfolioProvider(widget.portfolioId)),
        ),
      ),
    );
  }

  void _handleMenuAction(String action, Portfolio portfolio) async {
    switch (action) {
      case 'refresh_nav':
        await _refreshNav(portfolio.id);
        break;
      case 'health_scan':
        _showHealthScan(portfolio.id);
        break;
      case 'export':
        _exportReport(portfolio);
        break;
    }
  }

  Future<void> _refreshNav(String portfolioId) async {
    try {
      await ref.read(portfolioNavProvider(portfolioId).notifier).refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('NAV refreshed successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to refresh NAV: $e')),
        );
      }
    }
  }

  void _showHealthScan(String portfolioId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => HealthScanSheet(portfolioId: portfolioId),
    );
  }

  void _exportReport(Portfolio portfolio) {
    // TODO: Implement export functionality
  }
}
```

### 3.4 Holdings Tab

```dart
// lib/features/portfolio/presentation/widgets/holdings_tab.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class HoldingsTab extends ConsumerStatefulWidget {
  final String portfolioId;

  const HoldingsTab({super.key, required this.portfolioId});

  @override
  ConsumerState<HoldingsTab> createState() => _HoldingsTabState();
}

class _HoldingsTabState extends ConsumerState<HoldingsTab> {
  String _sortBy = 'value';
  bool _sortAscending = false;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final holdingsAsync = ref.watch(holdingsProvider(widget.portfolioId));

    return Column(
      children: [
        // Sort and Search Row
        Padding(
          padding: AppSpacing.allMd,
          child: Row(
            children: [
              // Sort Dropdown
              DropdownButton<String>(
                value: _sortBy,
                items: const [
                  DropdownMenuItem(value: 'value', child: Text('Value')),
                  DropdownMenuItem(value: 'change', child: Text('Change')),
                  DropdownMenuItem(value: 'weight', child: Text('Weight')),
                  DropdownMenuItem(value: 'name', child: Text('Name')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _sortBy = value);
                  }
                },
              ),
              IconButton(
                icon: Icon(
                  _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
                ),
                onPressed: () => setState(() => _sortAscending = !_sortAscending),
              ),
              const Spacer(),
              // Search
              SizedBox(
                width: 150,
                child: AppInput.search(
                  hint: 'Search...',
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
              ),
            ],
          ),
        ),

        // Holdings List
        Expanded(
          child: holdingsAsync.when(
            data: (holdings) {
              final sorted = _sortAndFilter(holdings);

              if (sorted.isEmpty) {
                return EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No holdings',
                  message: _searchQuery.isNotEmpty
                      ? 'No holdings match your search'
                      : 'This portfolio has no holdings yet',
                );
              }

              return RefreshIndicator(
                onRefresh: () => ref.refresh(holdingsProvider(widget.portfolioId).future),
                child: ListView.separated(
                  padding: AppSpacing.horizontalMd,
                  itemCount: sorted.length,
                  separatorBuilder: (_, __) => AppSpacing.gapSm,
                  itemBuilder: (context, index) {
                    final holding = sorted[index];
                    return HoldingListTile(
                      holding: holding,
                      onTap: () => context.push(
                        '/portfolios/${widget.portfolioId}/holding/${holding.id}',
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const HoldingsListSkeleton(),
            error: (error, _) => ErrorView(
              error: error,
              onRetry: () => ref.refresh(holdingsProvider(widget.portfolioId).future),
            ),
          ),
        ),
      ],
    );
  }

  List<Holding> _sortAndFilter(List<Holding> holdings) {
    var filtered = holdings.where((h) {
      if (_searchQuery.isEmpty) return true;
      final query = _searchQuery.toLowerCase();
      return h.security.ticker.toLowerCase().contains(query) ||
             h.security.name.toLowerCase().contains(query);
    }).toList();

    filtered.sort((a, b) {
      int result;
      switch (_sortBy) {
        case 'value':
          result = (a.marketValue ?? 0).compareTo(b.marketValue ?? 0);
          break;
        case 'change':
          result = (a.unrealizedPnlPct ?? 0).compareTo(b.unrealizedPnlPct ?? 0);
          break;
        case 'weight':
          result = (a.weight ?? 0).compareTo(b.weight ?? 0);
          break;
        case 'name':
          result = a.security.name.compareTo(b.security.name);
          break;
        default:
          result = 0;
      }
      return _sortAscending ? result : -result;
    });

    return filtered;
  }
}

class HoldingListTile extends StatelessWidget {
  final Holding holding;
  final VoidCallback? onTap;

  const HoldingListTile({
    super.key,
    required this.holding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = (holding.unrealizedPnlPct ?? 0) >= 0;
    final changeColor = isPositive ? AppColors.success : AppColors.error;

    return AppCard(
      onTap: onTap,
      padding: AppSpacing.allMd,
      child: Row(
        children: [
          // Ticker and Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      holding.security.ticker,
                      style: AppTypography.h4,
                    ),
                    AppSpacing.gapSm,
                    if (holding.weight != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          Formatters.percent(holding.weight!),
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                  ],
                ),
                AppSpacing.gapXs,
                Text(
                  holding.security.name,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                AppSpacing.gapXs,
                Text(
                  '${Formatters.number(holding.quantity)} shares @ ${Formatters.currency(holding.costBasis)} avg',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Value and Change
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.currency(holding.marketValue ?? 0),
                style: AppTypography.h4,
              ),
              AppSpacing.gapXs,
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPositive ? Icons.trending_up : Icons.trending_down,
                    size: 16,
                    color: changeColor,
                  ),
                  AppSpacing.gapXs,
                  Text(
                    Formatters.percentChange(holding.unrealizedPnlPct ?? 0),
                    style: AppTypography.bodySmall.copyWith(
                      color: changeColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          AppSpacing.gapSm,
          const Icon(
            Icons.chevron_right,
            color: AppColors.textSecondary,
          ),
        ],
      ),
    );
  }
}
```

### 3.5 Performance Tab

```dart
// lib/features/portfolio/presentation/widgets/performance_tab.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class PerformanceTab extends ConsumerStatefulWidget {
  final String portfolioId;

  const PerformanceTab({super.key, required this.portfolioId});

  @override
  ConsumerState<PerformanceTab> createState() => _PerformanceTabState();
}

class _PerformanceTabState extends ConsumerState<PerformanceTab> {
  String _selectedPeriod = '1M';

  final List<String> _periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  @override
  Widget build(BuildContext context) {
    final performanceAsync = ref.watch(
      portfolioPerformanceProvider((widget.portfolioId, _selectedPeriod)),
    );

    return ListView(
      padding: AppSpacing.allMd,
      children: [
        // Period Selector
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: _periods.map((period) {
            final isSelected = period == _selectedPeriod;
            return GestureDetector(
              onTap: () => setState(() => _selectedPeriod = period),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  period,
                  style: AppTypography.labelMedium.copyWith(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        AppSpacing.gapLg,

        // Performance Chart
        SizedBox(
          height: 250,
          child: performanceAsync.when(
            data: (data) => PerformanceChart(
              portfolioData: data.portfolioValues,
              benchmarkData: data.benchmarkValues,
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => ErrorView(error: error, compact: true),
          ),
        ),

        AppSpacing.gapLg,

        // Return Summary
        performanceAsync.when(
          data: (data) => AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Period Return', style: AppTypography.h4),
                AppSpacing.gapSm,
                Row(
                  children: [
                    _ReturnMetric(
                      label: 'Portfolio',
                      value: data.portfolioReturn,
                    ),
                    AppSpacing.gapLg,
                    _ReturnMetric(
                      label: 'Benchmark',
                      value: data.benchmarkReturn,
                    ),
                    AppSpacing.gapLg,
                    _ReturnMetric(
                      label: 'Alpha',
                      value: data.alpha,
                    ),
                  ],
                ),
              ],
            ),
          ),
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),

        AppSpacing.gapLg,

        // Risk Metrics
        SectionHeader(title: 'Risk Metrics'),
        AppSpacing.gapSm,
        performanceAsync.when(
          data: (data) => AppCard(
            child: Column(
              children: [
                _RiskMetricRow(
                  label: 'Volatility (30d)',
                  value: Formatters.percent(data.volatility30d),
                ),
                const Divider(),
                _RiskMetricRow(
                  label: 'Sharpe Ratio',
                  value: data.sharpeRatio.toStringAsFixed(2),
                ),
                const Divider(),
                _RiskMetricRow(
                  label: 'Max Drawdown',
                  value: Formatters.percentChange(data.maxDrawdown),
                  valueColor: AppColors.error,
                ),
                const Divider(),
                _RiskMetricRow(
                  label: 'Beta',
                  value: data.beta.toStringAsFixed(2),
                ),
              ],
            ),
          ),
          loading: () => const CardSkeleton(height: 180),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ],
    );
  }
}

class PerformanceChart extends StatelessWidget {
  final List<ChartDataPoint> portfolioData;
  final List<ChartDataPoint>? benchmarkData;

  const PerformanceChart({
    super.key,
    required this.portfolioData,
    this.benchmarkData,
  });

  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 5,
          getDrawingHorizontalLine: (value) => FlLine(
            color: AppColors.border,
            strokeWidth: 1,
          ),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(
                '${value.toInt()}%',
                style: AppTypography.caption,
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index >= 0 && index < portfolioData.length) {
                  return Text(
                    portfolioData[index].label,
                    style: AppTypography.caption,
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          // Portfolio line
          LineChartBarData(
            spots: portfolioData.asMap().entries.map((e) {
              return FlSpot(e.key.toDouble(), e.value.value);
            }).toList(),
            isCurved: true,
            color: AppColors.primary,
            barWidth: 2,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: AppColors.primary.withOpacity(0.1),
            ),
          ),
          // Benchmark line
          if (benchmarkData != null)
            LineChartBarData(
              spots: benchmarkData!.asMap().entries.map((e) {
                return FlSpot(e.key.toDouble(), e.value.value);
              }).toList(),
              isCurved: true,
              color: AppColors.textSecondary,
              barWidth: 2,
              dotData: const FlDotData(show: false),
              dashArray: [5, 5],
            ),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => AppColors.surface,
            getTooltipItems: (spots) {
              return spots.map((spot) {
                return LineTooltipItem(
                  '${spot.y.toStringAsFixed(2)}%',
                  AppTypography.bodySmall.copyWith(
                    color: spot.barIndex == 0
                        ? AppColors.primary
                        : AppColors.textSecondary,
                  ),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }
}

class _ReturnMetric extends StatelessWidget {
  final String label;
  final double value;

  const _ReturnMetric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final isPositive = value >= 0;
    final color = isPositive ? AppColors.success : AppColors.error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
        ),
        AppSpacing.gapXs,
        Text(
          Formatters.percentChange(value),
          style: AppTypography.h4.copyWith(color: color),
        ),
      ],
    );
  }
}

class _RiskMetricRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _RiskMetricRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium),
          Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}
```

### 3.6 Acceptance Criteria

- [ ] **PDET-001**: Display portfolio name and code in app bar
- [ ] **PDET-002**: Three tabs: Overview, Holdings, Performance
- [ ] **PDET-003**: Overview shows total value and returns
- [ ] **PDET-004**: Sector allocation pie chart
- [ ] **PDET-005**: Asset allocation bar chart
- [ ] **PDET-006**: Holdings list with sorting options
- [ ] **PDET-007**: Holdings search functionality
- [ ] **PDET-008**: Holding detail navigation
- [ ] **PDET-009**: Performance chart with period selection
- [ ] **PDET-010**: Portfolio vs benchmark comparison
- [ ] **PDET-011**: Risk metrics display
- [ ] **PDET-012**: Menu actions (Refresh NAV, Health Scan, Export)

---

## 4. Analytics Screen

### 4.1 Screen Overview

**Purpose**: Display financial ratios, alerts, and peer comparisons for portfolio holdings.

**Route**: `/analytics`
**File**: `lib/features/analytics/presentation/screens/analytics_screen.dart`

### 4.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   Analytics                    [Alerts] │
├─────────────────────────────────────────┤
│                                         │
│ ── Select Security ───────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ [Dropdown] NVDA - NVIDIA Corp    ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Ratio Overview ────────────────────│
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Liquidity│ │Profit. │ │Leverage│       │
│ │  ●●●●○  │ │ ●●●●● │ │ ●●●○○ │       │
│ │  Good   │ │Excellent│ │ Fair  │       │
│ └────────┘ └────────┘ └────────┘       │
│                                         │
│ ── Liquidity Ratios ──────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Current Ratio           1.85       │ │
│ │ ▓▓▓▓▓▓▓▓▓░░░░░░░░  P75            │ │
│ │ Trend: ↑ improving                 │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Quick Ratio             1.42       │ │
│ │ ▓▓▓▓▓▓▓░░░░░░░░░░░  P65           │ │
│ │ Trend: → stable                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Profitability Ratios ──────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Return on Equity       28.5%       │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  P92             │ │
│ │ Trend: ↑ improving                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [View All Ratios]                       │
│                                         │
└─────────────────────────────────────────┘
```

### 4.3 Implementation

```dart
// lib/features/analytics/presentation/screens/analytics_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/analytics/presentation/providers/analytics_providers.dart';
import 'package:arc_mobile/features/analytics/presentation/widgets/ratio_category_summary.dart';
import 'package:arc_mobile/features/analytics/presentation/widgets/ratio_card.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  String? _selectedSecurityId;

  @override
  Widget build(BuildContext context) {
    final holdingsAsync = ref.watch(allHoldingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: Badge(
              label: Text('${ref.watch(activeAlertCountProvider)}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.push('/analytics/alerts'),
          ),
        ],
      ),
      body: holdingsAsync.when(
        data: (holdings) {
          if (holdings.isEmpty) {
            return const EmptyState(
              icon: Icons.analytics_outlined,
              title: 'No securities to analyze',
              message: 'Add holdings to your portfolio to view analytics',
            );
          }

          // Auto-select first if none selected
          _selectedSecurityId ??= holdings.first.securityId;

          return Column(
            children: [
              // Security Selector
              Padding(
                padding: AppSpacing.allMd,
                child: AppCard(
                  padding: AppSpacing.horizontalMd,
                  child: DropdownButtonFormField<String>(
                    value: _selectedSecurityId,
                    decoration: const InputDecoration(
                      labelText: 'Select Security',
                      border: InputBorder.none,
                    ),
                    items: holdings.map((h) {
                      return DropdownMenuItem(
                        value: h.securityId,
                        child: Text('${h.security.ticker} - ${h.security.name}'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _selectedSecurityId = value);
                      }
                    },
                  ),
                ),
              ),

              // Ratio Content
              Expanded(
                child: _selectedSecurityId != null
                    ? _RatioContent(securityId: _selectedSecurityId!)
                    : const SizedBox.shrink(),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(
          error: error,
          onRetry: () => ref.refresh(allHoldingsProvider.future),
        ),
      ),
    );
  }
}

class _RatioContent extends ConsumerWidget {
  final String securityId;

  const _RatioContent({required this.securityId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ratiosAsync = ref.watch(securityRatiosProvider(securityId));

    return ratiosAsync.when(
      data: (ratios) {
        if (ratios == null) {
          return const EmptyState(
            icon: Icons.calculate_outlined,
            title: 'No ratios available',
            message: 'Financial ratios are not yet calculated for this security',
          );
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(securityRatiosProvider(securityId).future),
          child: ListView(
            padding: AppSpacing.allMd,
            children: [
              // Category Summary Row
              Row(
                children: [
                  Expanded(
                    child: RatioCategorySummary(
                      category: 'Liquidity',
                      score: ratios.liquidityScore,
                      icon: Icons.water_drop_outlined,
                    ),
                  ),
                  AppSpacing.gapSm,
                  Expanded(
                    child: RatioCategorySummary(
                      category: 'Profitability',
                      score: ratios.profitabilityScore,
                      icon: Icons.trending_up,
                    ),
                  ),
                  AppSpacing.gapSm,
                  Expanded(
                    child: RatioCategorySummary(
                      category: 'Leverage',
                      score: ratios.leverageScore,
                      icon: Icons.account_balance,
                    ),
                  ),
                ],
              ),

              AppSpacing.gapLg,

              // Liquidity Ratios
              SectionHeader(title: 'Liquidity Ratios'),
              AppSpacing.gapSm,
              RatioCard(
                name: 'Current Ratio',
                value: ratios.liquidity.currentRatio,
                percentile: ratios.liquidity.currentRatioPercentile,
                trend: ratios.liquidity.currentRatioTrend,
                onTap: () => _showRatioDetail(context, 'current_ratio', ratios),
              ),
              AppSpacing.gapSm,
              RatioCard(
                name: 'Quick Ratio',
                value: ratios.liquidity.quickRatio,
                percentile: ratios.liquidity.quickRatioPercentile,
                trend: ratios.liquidity.quickRatioTrend,
                onTap: () => _showRatioDetail(context, 'quick_ratio', ratios),
              ),

              AppSpacing.gapLg,

              // Profitability Ratios
              SectionHeader(title: 'Profitability Ratios'),
              AppSpacing.gapSm,
              RatioCard(
                name: 'Return on Equity',
                value: ratios.profitability.roe,
                percentile: ratios.profitability.roePercentile,
                trend: ratios.profitability.roeTrend,
                isPercentage: true,
                onTap: () => _showRatioDetail(context, 'roe', ratios),
              ),
              AppSpacing.gapSm,
              RatioCard(
                name: 'Net Margin',
                value: ratios.profitability.netMargin,
                percentile: ratios.profitability.netMarginPercentile,
                trend: ratios.profitability.netMarginTrend,
                isPercentage: true,
                onTap: () => _showRatioDetail(context, 'net_margin', ratios),
              ),

              AppSpacing.gapLg,

              // Leverage Ratios
              SectionHeader(title: 'Leverage Ratios'),
              AppSpacing.gapSm,
              RatioCard(
                name: 'Debt to Equity',
                value: ratios.leverage.debtToEquity,
                percentile: ratios.leverage.debtToEquityPercentile,
                trend: ratios.leverage.debtToEquityTrend,
                invertPercentile: true, // Lower is better
                onTap: () => _showRatioDetail(context, 'debt_to_equity', ratios),
              ),

              AppSpacing.gapLg,

              // View All Button
              AppButton.secondary(
                label: 'View All Ratios',
                isFullWidth: true,
                onPressed: () => context.push('/analytics/security/$securityId'),
              ),

              AppSpacing.gapXxl,
            ],
          ),
        );
      },
      loading: () => const RatiosSkeleton(),
      error: (error, _) => ErrorView(
        error: error,
        onRetry: () => ref.refresh(securityRatiosProvider(securityId).future),
      ),
    );
  }

  void _showRatioDetail(BuildContext context, String ratioName, RatioData ratios) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => RatioDetailSheet(
        ratioName: ratioName,
        securityId: securityId,
      ),
    );
  }
}
```

### 4.4 Ratio Card Widget

```dart
// lib/features/analytics/presentation/widgets/ratio_card.dart

import 'package:flutter/material.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/core/utils/formatters.dart';

class RatioCard extends StatelessWidget {
  final String name;
  final double? value;
  final int? percentile;
  final String? trend; // "improving" | "stable" | "declining"
  final bool isPercentage;
  final bool invertPercentile;
  final VoidCallback? onTap;

  const RatioCard({
    super.key,
    required this.name,
    required this.value,
    this.percentile,
    this.trend,
    this.isPercentage = false,
    this.invertPercentile = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          // Name and Trend
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppTypography.bodyMedium),
                AppSpacing.gapXs,
                if (percentile != null) ...[
                  _PercentileBar(
                    percentile: percentile!,
                    inverted: invertPercentile,
                  ),
                  AppSpacing.gapXs,
                ],
                if (trend != null)
                  _TrendIndicator(trend: trend!),
              ],
            ),
          ),

          // Value
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value != null
                    ? isPercentage
                        ? Formatters.percent(value!)
                        : Formatters.decimal(value!)
                    : '--',
                style: AppTypography.h3,
              ),
              if (percentile != null)
                Text(
                  'P$percentile',
                  style: AppTypography.caption.copyWith(
                    color: _getPercentileColor(percentile!, invertPercentile),
                  ),
                ),
            ],
          ),

          AppSpacing.gapSm,
          const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        ],
      ),
    );
  }

  Color _getPercentileColor(int percentile, bool inverted) {
    final effectivePercentile = inverted ? 100 - percentile : percentile;
    if (effectivePercentile >= 75) return AppColors.success;
    if (effectivePercentile >= 50) return AppColors.warning;
    return AppColors.error;
  }
}

class _PercentileBar extends StatelessWidget {
  final int percentile;
  final bool inverted;

  const _PercentileBar({required this.percentile, this.inverted = false});

  @override
  Widget build(BuildContext context) {
    final effectivePercentile = inverted ? 100 - percentile : percentile;
    final color = effectivePercentile >= 75
        ? AppColors.success
        : effectivePercentile >= 50
            ? AppColors.warning
            : AppColors.error;

    return ClipRRect(
      borderRadius: BorderRadius.circular(2),
      child: SizedBox(
        height: 4,
        child: LinearProgressIndicator(
          value: percentile / 100,
          backgroundColor: AppColors.border,
          valueColor: AlwaysStoppedAnimation(color),
        ),
      ),
    );
  }
}

class _TrendIndicator extends StatelessWidget {
  final String trend;

  const _TrendIndicator({required this.trend});

  @override
  Widget build(BuildContext context) {
    final (icon, label, color) = switch (trend) {
      'improving' => (Icons.trending_up, 'Improving', AppColors.success),
      'declining' => (Icons.trending_down, 'Declining', AppColors.error),
      _ => (Icons.trending_flat, 'Stable', AppColors.textSecondary),
    };

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        AppSpacing.gapXs,
        Text(
          label,
          style: AppTypography.caption.copyWith(color: color),
        ),
      ],
    );
  }
}
```

### 4.5 Acceptance Criteria

- [ ] **ANAL-001**: Security selector dropdown with all holdings
- [ ] **ANAL-002**: Category summary cards (Liquidity, Profitability, Leverage)
- [ ] **ANAL-003**: Score visualization (1-5 dots)
- [ ] **ANAL-004**: Ratio cards with value, percentile, trend
- [ ] **ANAL-005**: Percentile bar visualization
- [ ] **ANAL-006**: Trend indicator (improving/stable/declining)
- [ ] **ANAL-007**: Navigate to alerts screen
- [ ] **ANAL-008**: Ratio detail bottom sheet
- [ ] **ANAL-009**: View all ratios navigation
- [ ] **ANAL-010**: Pull-to-refresh ratios

---

## 5. Intelligence Screen

### 5.1 Screen Overview

**Purpose**: AI-powered market briefs, natural language queries, and push notifications for intelligence features.

**Route**: `/intelligence`
**File**: `lib/features/intelligence/presentation/screens/intelligence_screen.dart`

### 5.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   Intelligence                  [Chat]  │
├─────────────────────────────────────────┤
│                                         │
│ ── Today's Brief ──────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ [AI Icon] Daily Market Brief        │ │
│ │ January 7, 2026 - 7:00 AM          │ │
│ │                                     │ │
│ │ Key Highlights:                     │ │
│ │ - Tech sector continues momentum    │ │
│ │ - Fed maintains rate stance         │ │
│ │ - Earnings season begins next week  │ │
│ │                                     │ │
│ │ [Read Full Brief →]                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Quick Actions ─────────────────────│
│ ┌──────────┐ ┌──────────┐              │
│ │ [Mic]    │ │ [Type]   │              │
│ │ Voice    │ │ Ask a    │              │
│ │ Query    │ │ Question │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ ── Suggested Questions ───────────────│
│ ┌─────────────────────────────────────┐ │
│ │ "What's my sector exposure?"        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ "Which holdings have low liquidity?"│ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ "How am I doing vs S&P 500?"        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Recent Briefs ─────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Weekly Summary - Jan 6             │ │
│ │ Daily Brief - Jan 6                │ │
│ │ Earnings Alert - Jan 5             │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 5.3 Implementation

```dart
// lib/features/intelligence/presentation/screens/intelligence_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/intelligence/presentation/providers/intelligence_providers.dart';
import 'package:arc_mobile/features/intelligence/presentation/widgets/brief_card.dart';
import 'package:arc_mobile/features/intelligence/presentation/widgets/voice_input_button.dart';
import 'package:arc_mobile/features/intelligence/presentation/widgets/suggested_query_chip.dart';

class IntelligenceScreen extends ConsumerWidget {
  const IntelligenceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latestBriefAsync = ref.watch(latestBriefProvider);
    final suggestionsAsync = ref.watch(querySuggestionsProvider);
    final recentBriefsAsync = ref.watch(recentBriefsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Intelligence'),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => context.push('/intelligence/chat'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.refresh(latestBriefProvider.future),
            ref.refresh(querySuggestionsProvider.future),
            ref.refresh(recentBriefsProvider.future),
          ]);
        },
        child: ListView(
          padding: AppSpacing.allMd,
          children: [
            // Today's Brief
            SectionHeader(title: "Today's Brief"),
            AppSpacing.gapSm,
            latestBriefAsync.when(
              data: (brief) {
                if (brief == null) {
                  return AppCard(
                    child: Column(
                      children: [
                        const Icon(
                          Icons.psychology_outlined,
                          size: 48,
                          color: AppColors.textSecondary,
                        ),
                        AppSpacing.gapSm,
                        Text(
                          'No brief available yet',
                          style: AppTypography.bodyMedium,
                        ),
                        AppSpacing.gapMd,
                        AppButton.primary(
                          label: 'Generate Brief',
                          onPressed: () => _generateBrief(ref),
                        ),
                      ],
                    ),
                  );
                }

                return BriefCard(
                  brief: brief,
                  onTap: () => context.push('/intelligence/brief/${brief.id}'),
                );
              },
              loading: () => const BriefCardSkeleton(),
              error: (error, _) => ErrorView(error: error, compact: true),
            ),

            AppSpacing.gapLg,

            // Quick Actions
            SectionHeader(title: 'Quick Actions'),
            AppSpacing.gapSm,
            Row(
              children: [
                Expanded(
                  child: VoiceInputButton(
                    onResult: (query) => _handleQuery(context, ref, query),
                  ),
                ),
                AppSpacing.gapMd,
                Expanded(
                  child: AppCard(
                    onTap: () => context.push('/intelligence/chat'),
                    child: Column(
                      children: [
                        Icon(
                          Icons.keyboard,
                          size: 32,
                          color: AppColors.primary,
                        ),
                        AppSpacing.gapSm,
                        Text('Type a', style: AppTypography.bodySmall),
                        Text('Question', style: AppTypography.labelMedium),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            AppSpacing.gapLg,

            // Suggested Questions
            SectionHeader(title: 'Suggested Questions'),
            AppSpacing.gapSm,
            suggestionsAsync.when(
              data: (suggestions) => Wrap(
                spacing: 8,
                runSpacing: 8,
                children: suggestions.map((q) {
                  return SuggestedQueryChip(
                    query: q,
                    onTap: () => _handleQuery(context, ref, q),
                  );
                }).toList(),
              ),
              loading: () => const SuggestionsListSkeleton(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            AppSpacing.gapLg,

            // Recent Briefs
            SectionHeader(
              title: 'Recent Briefs',
              onViewAll: () => _showAllBriefs(context),
            ),
            AppSpacing.gapSm,
            recentBriefsAsync.when(
              data: (briefs) => Column(
                children: briefs.take(3).map((brief) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _RecentBriefTile(
                      brief: brief,
                      onTap: () => context.push('/intelligence/brief/${brief.id}'),
                    ),
                  );
                }).toList(),
              ),
              loading: () => const RecentBriefsListSkeleton(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            AppSpacing.gapXxl,
          ],
        ),
      ),
    );
  }

  Future<void> _generateBrief(WidgetRef ref) async {
    try {
      await ref.read(intelligenceServiceProvider).generateBrief();
      ref.refresh(latestBriefProvider);
    } catch (e) {
      // Error handled by provider
    }
  }

  void _handleQuery(BuildContext context, WidgetRef ref, String query) {
    context.push('/intelligence/chat', extra: {'initialQuery': query});
  }

  void _showAllBriefs(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const AllBriefsSheet(),
    );
  }
}

class _RecentBriefTile extends StatelessWidget {
  final MarketBrief brief;
  final VoidCallback? onTap;

  const _RecentBriefTile({required this.brief, this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: AppSpacing.allMd,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getIconForType(brief.type),
              color: AppColors.primary,
              size: 20,
            ),
          ),
          AppSpacing.gapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  brief.title,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  Formatters.relativeDate(brief.generatedAt),
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        ],
      ),
    );
  }

  IconData _getIconForType(String type) {
    return switch (type) {
      'daily' => Icons.today,
      'weekly' => Icons.date_range,
      'earnings' => Icons.monetization_on,
      'alert' => Icons.warning_amber,
      _ => Icons.article,
    };
  }
}
```

### 5.4 Chat Screen

```dart
// lib/features/intelligence/presentation/screens/chat_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/intelligence/presentation/providers/chat_providers.dart';
import 'package:arc_mobile/features/intelligence/presentation/widgets/chat_bubble.dart';
import 'package:arc_mobile/features/intelligence/presentation/widgets/chat_input.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String? initialQuery;

  const ChatScreen({super.key, this.initialQuery});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _sendMessage(widget.initialQuery!);
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider);
    final isLoading = ref.watch(chatLoadingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ask ARC'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _clearChat(ref),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: messages.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: AppSpacing.allMd,
                    itemCount: messages.length + (isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == messages.length && isLoading) {
                        return const ChatBubble.loading();
                      }
                      return ChatBubble(message: messages[index]);
                    },
                  ),
          ),

          // Input Area
          Container(
            padding: AppSpacing.allMd,
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [AppShadows.card],
            ),
            child: SafeArea(
              child: ChatInput(
                controller: _inputController,
                onSend: _sendMessage,
                onVoiceInput: _handleVoiceInput,
                isLoading: isLoading,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: AppSpacing.allLg,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.psychology_outlined,
              size: 64,
              color: AppColors.primary.withOpacity(0.5),
            ),
            AppSpacing.gapMd,
            Text(
              'Ask me anything about your portfolio',
              style: AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            AppSpacing.gapSm,
            Text(
              'Try questions like:\n'
              '"What\'s my sector exposure?"\n'
              '"Which holdings have low liquidity?"\n'
              '"How am I performing vs the benchmark?"',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    _inputController.clear();

    await ref.read(chatNotifierProvider.notifier).sendMessage(text);

    // Scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleVoiceInput(String text) {
    _inputController.text = text;
    _sendMessage(text);
  }

  void _clearChat(WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear chat?'),
        content: const Text('This will delete all messages in this conversation.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(chatNotifierProvider.notifier).clearChat();
              Navigator.pop(context);
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}
```

### 5.5 Acceptance Criteria

- [ ] **INTEL-001**: Display latest market brief with summary
- [ ] **INTEL-002**: Generate brief button when none available
- [ ] **INTEL-003**: Voice input for queries
- [ ] **INTEL-004**: Navigate to chat screen
- [ ] **INTEL-005**: Suggested questions based on context
- [ ] **INTEL-006**: Recent briefs list
- [ ] **INTEL-007**: Chat screen with message history
- [ ] **INTEL-008**: Streaming response display
- [ ] **INTEL-009**: Clear chat functionality
- [ ] **INTEL-010**: Navigate to brief detail

---

## 6. Settings Screen

### 6.1 Screen Overview

**Purpose**: User profile, preferences, and notification settings.

**Route**: `/settings`
**File**: `lib/features/settings/presentation/screens/settings_screen.dart`

### 6.2 Layout Specification

```
┌─────────────────────────────────────────┐
│ [AppBar]                                │
│   Settings                              │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar]  John Smith               │ │
│ │           john@example.com          │ │
│ │           Investment Manager        │ │
│ │                     [Edit Profile →]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Preferences ───────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Theme              [System ▼]       │ │
│ │ Currency           [USD ▼]          │ │
│ │ Date Format        [MM/DD/YYYY ▼]   │ │
│ │ Number Format      [1,234.56 ▼]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Notifications ─────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Push Notifications       [Toggle]   │ │
│ │ Alert Notifications      [Toggle]   │ │
│ │ Daily Brief              [Toggle]   │ │
│ │ Weekly Summary           [Toggle]   │ │
│ │                 [Manage Alerts →]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Security ──────────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ Biometric Login          [Toggle]   │ │
│ │ Change Password                   → │ │
│ │ Two-Factor Auth                   → │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── About ─────────────────────────────│
│ ┌─────────────────────────────────────┐ │
│ │ App Version              1.0.0      │ │
│ │ Terms of Service                  → │ │
│ │ Privacy Policy                    → │ │
│ │ Help & Support                    → │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │          [Log Out]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 6.3 Implementation

```dart
// lib/features/settings/presentation/screens/settings_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/settings/presentation/providers/settings_providers.dart';
import 'package:arc_mobile/features/settings/presentation/widgets/settings_section.dart';
import 'package:arc_mobile/features/settings/presentation/widgets/settings_tile.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final prefsAsync = ref.watch(userPreferencesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: AppSpacing.allMd,
        children: [
          // Profile Card
          userAsync.when(
            data: (user) => _ProfileCard(
              user: user,
              onEdit: () => context.push('/settings/profile'),
            ),
            loading: () => const ProfileCardSkeleton(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          AppSpacing.gapLg,

          // Preferences Section
          prefsAsync.when(
            data: (prefs) => SettingsSection(
              title: 'Preferences',
              children: [
                SettingsTile.dropdown(
                  title: 'Theme',
                  value: prefs.theme,
                  options: const ['System', 'Light', 'Dark'],
                  onChanged: (value) => _updatePreference(ref, 'theme', value),
                ),
                SettingsTile.dropdown(
                  title: 'Currency',
                  value: prefs.defaultCurrency,
                  options: const ['USD', 'EUR', 'GBP', 'JPY'],
                  onChanged: (value) => _updatePreference(ref, 'default_currency', value),
                ),
                SettingsTile.dropdown(
                  title: 'Date Format',
                  value: prefs.dateFormat,
                  options: const ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
                  onChanged: (value) => _updatePreference(ref, 'date_format', value),
                ),
                SettingsTile.dropdown(
                  title: 'Number Format',
                  value: prefs.numberFormat,
                  options: const ['1,234.56', '1.234,56', '1 234.56'],
                  onChanged: (value) => _updatePreference(ref, 'number_format', value),
                ),
              ],
            ),
            loading: () => const SettingsSectionSkeleton(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          AppSpacing.gapLg,

          // Notifications Section
          SettingsSection(
            title: 'Notifications',
            children: [
              prefsAsync.when(
                data: (prefs) => Column(
                  children: [
                    SettingsTile.toggle(
                      title: 'Push Notifications',
                      value: prefs.notifications.push,
                      onChanged: (value) => _updateNotificationPref(ref, 'push', value),
                    ),
                    SettingsTile.toggle(
                      title: 'Alert Notifications',
                      value: prefs.notifications.alerts,
                      onChanged: (value) => _updateNotificationPref(ref, 'alerts', value),
                    ),
                    SettingsTile.toggle(
                      title: 'Daily Brief',
                      value: prefs.notifications.dailyBrief,
                      onChanged: (value) => _updateNotificationPref(ref, 'daily_brief', value),
                    ),
                    SettingsTile.toggle(
                      title: 'Weekly Summary',
                      value: prefs.notifications.weeklySummary,
                      onChanged: (value) => _updateNotificationPref(ref, 'weekly_summary', value),
                    ),
                  ],
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              SettingsTile.navigation(
                title: 'Manage Alert Thresholds',
                onTap: () => context.push('/settings/notifications'),
              ),
            ],
          ),

          AppSpacing.gapLg,

          // Security Section
          SettingsSection(
            title: 'Security',
            children: [
              prefsAsync.when(
                data: (prefs) => SettingsTile.toggle(
                  title: 'Biometric Login',
                  value: prefs.biometricEnabled,
                  onChanged: (value) => _updatePreference(ref, 'biometric_enabled', value),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              SettingsTile.navigation(
                title: 'Change Password',
                onTap: () => _showChangePasswordDialog(context),
              ),
              SettingsTile.navigation(
                title: 'Two-Factor Authentication',
                onTap: () => _showTwoFactorSetup(context),
              ),
            ],
          ),

          AppSpacing.gapLg,

          // About Section
          SettingsSection(
            title: 'About',
            children: [
              SettingsTile.info(
                title: 'App Version',
                value: '1.0.0',
              ),
              SettingsTile.navigation(
                title: 'Terms of Service',
                onTap: () => _openUrl('https://arc-platform.com/terms'),
              ),
              SettingsTile.navigation(
                title: 'Privacy Policy',
                onTap: () => _openUrl('https://arc-platform.com/privacy'),
              ),
              SettingsTile.navigation(
                title: 'Help & Support',
                onTap: () => _openUrl('https://arc-platform.com/support'),
              ),
            ],
          ),

          AppSpacing.gapLg,

          // Logout Button
          AppButton.secondary(
            label: 'Log Out',
            isFullWidth: true,
            isDestructive: true,
            onPressed: () => _showLogoutConfirmation(context, ref),
          ),

          AppSpacing.gapXxl,
        ],
      ),
    );
  }

  void _updatePreference(WidgetRef ref, String key, dynamic value) {
    ref.read(userPreferencesProvider.notifier).update(key, value);
  }

  void _updateNotificationPref(WidgetRef ref, String key, bool value) {
    ref.read(userPreferencesProvider.notifier).updateNotification(key, value);
  }

  void _showChangePasswordDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const ChangePasswordDialog(),
    );
  }

  void _showTwoFactorSetup(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const TwoFactorSetupSheet(),
    );
  }

  void _openUrl(String url) {
    // TODO: Implement URL opening
  }

  void _showLogoutConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('Are you sure you want to log out of ARC?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authServiceProvider).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final User? user;
  final VoidCallback? onEdit;

  const _ProfileCard({this.user, this.onEdit});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundImage: user?.avatarUrl != null
                ? NetworkImage(user!.avatarUrl!)
                : null,
            child: user?.avatarUrl == null
                ? Text(
                    user?.name.substring(0, 1).toUpperCase() ?? '?',
                    style: AppTypography.h3,
                  )
                : null,
          ),
          AppSpacing.gapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? 'User',
                  style: AppTypography.h4,
                ),
                Text(
                  user?.email ?? '',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  user?.role.capitalize() ?? '',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: onEdit,
          ),
        ],
      ),
    );
  }
}
```

### 6.4 Acceptance Criteria

- [ ] **SETT-001**: Display user profile with avatar
- [ ] **SETT-002**: Edit profile navigation
- [ ] **SETT-003**: Theme selection (System/Light/Dark)
- [ ] **SETT-004**: Currency preference
- [ ] **SETT-005**: Date format preference
- [ ] **SETT-006**: Number format preference
- [ ] **SETT-007**: Push notification toggle
- [ ] **SETT-008**: Alert notification toggle
- [ ] **SETT-009**: Brief notification toggles
- [ ] **SETT-010**: Biometric login toggle
- [ ] **SETT-011**: Change password dialog
- [ ] **SETT-012**: Two-factor setup
- [ ] **SETT-013**: App version display
- [ ] **SETT-014**: Legal links (Terms, Privacy)
- [ ] **SETT-015**: Logout with confirmation

---

## 7. Implementation Checklist

### Phase 1: Core Screens (Week 1-2)
- [ ] **SCR-001**: Dashboard screen with all widgets
- [ ] **SCR-002**: Portfolio list screen with filtering
- [ ] **SCR-003**: Portfolio detail with tabs
- [ ] **SCR-004**: Holdings tab with sorting
- [ ] **SCR-005**: Performance tab with charts

### Phase 2: Analytics & Intelligence (Week 3-4)
- [ ] **SCR-006**: Analytics screen with ratio cards
- [ ] **SCR-007**: Ratio detail bottom sheet
- [ ] **SCR-008**: Alerts screen
- [ ] **SCR-009**: Intelligence screen
- [ ] **SCR-010**: Chat screen with streaming

### Phase 3: Settings & Polish (Week 5-6)
- [ ] **SCR-011**: Settings screen
- [ ] **SCR-012**: Profile screen
- [ ] **SCR-013**: Notification preferences
- [ ] **SCR-014**: Loading skeletons for all screens
- [ ] **SCR-015**: Error states for all screens

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Author**: ARC Development Team
