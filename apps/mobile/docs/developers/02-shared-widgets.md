# Shared Widgets

## Overview

Shared widgets are reusable across features. Import from:

```dart
import 'package:arc_mobile/shared/widgets/widgets.dart';
```

## Common Widgets

### EmptyState

Display when no data is available:

```dart
EmptyState(
  icon: Icons.inbox,
  title: 'No Items',
  message: 'Add your first item to get started',
  actionLabel: 'Add Item',
  onAction: () {},
)

// Preset factories
EmptyState.noResults()
EmptyState.noData()
EmptyState.offline(onRetry: () {})
```

### ErrorView

Display error states with retry:

```dart
ErrorView(
  error: error,
  onRetry: () => ref.invalidate(provider),
)
```

Automatically shows appropriate icon/message for:
- `ApiException` - Network/server errors
- `CacheException` - Local storage errors
- `ValidationException` - Input errors

### LoadingSkeleton

Shimmer loading placeholders:

```dart
// Basic shapes
LoadingSkeleton.text(width: 100, height: 14)
LoadingSkeleton.circle(size: 48)
LoadingSkeleton.card(height: 100)

// Pre-built layouts
DashboardSkeleton()
PortfolioListSkeleton()
DetailSkeleton()
```

### SectionHeader

Section header with optional count and action:

```dart
SectionHeader(
  title: 'Holdings',
  count: 15,
  viewAllLabel: 'View All',
  onViewAll: () {},
)
```

### MainShell

App scaffold with bottom navigation:

```dart
// Used internally by GoRouter ShellRoute
MainShell(child: child)
```

## Data Display Widgets

### StatCard

Displays key metrics:

```dart
StatCard.currency(
  label: 'Total Value',
  value: 1500000,
  changeValue: 2.5, // percentage change
  onTap: () {},
)

StatCard.percentage(
  label: 'YTD Return',
  value: 12.5,
)
```

### PortfolioTile

List item for portfolio:

```dart
PortfolioTile(
  id: portfolio.id,
  name: portfolio.name,
  code: portfolio.code,
  portfolioType: portfolio.portfolioType,
  totalValue: portfolio.totalValue,
  dayChangePct: portfolio.dayChangePercent,
  onTap: () {},
)
```

### HoldingTile

List item for holdings:

```dart
HoldingTile(
  ticker: holding.ticker,
  name: holding.name,
  quantity: holding.quantity,
  marketValue: holding.marketValue,
  weight: holding.weight,
  unrealizedPnlPct: holding.unrealizedPnlPct,
  onTap: () {},
)
```

### TransactionTile

List item for transactions:

```dart
TransactionTile(
  type: transaction.type, // BUY, SELL, DIVIDEND, etc.
  ticker: transaction.ticker,
  quantity: transaction.quantity,
  amount: transaction.amount,
  date: transaction.date,
  onTap: () {},
)
```

### AlertTile

Alert notification item:

```dart
AlertTile(
  id: alert.id,
  title: alert.title,
  message: alert.message,
  severity: alert.severity, // critical, warning, info
  type: alert.type, // threshold, anomaly, news
  triggeredAt: alert.triggeredAt,
  onTap: () {},
  onDismiss: () {},
)
```

### RatioCard

Financial ratio display:

```dart
RatioCard(
  label: 'P/E Ratio',
  value: 25.4,
  benchmarkValue: 22.1,
  benchmarkLabel: 'Sector Avg',
  percentile: 72,
  onTap: () {},
)
```

## Chart Widgets

Import from:

```dart
import 'package:arc_mobile/shared/widgets/charts/charts.dart';
```

### AllocationPieChart

```dart
AllocationPieChart(
  allocations: {
    'Equities': 0.45,
    'Fixed Income': 0.30,
    'Cash': 0.25,
  },
  showLegend: true,
  size: 200,
)
```

### PerformanceLineChart

```dart
PerformanceLineChart(
  data: portfolioData, // List<PerformanceDataPoint>
  benchmarkData: sp500Data,
  benchmarkLabel: 'S&P 500',
  showTooltips: true,
  height: 250,
)
```

### TrendSparkline

Mini inline chart:

```dart
TrendSparkline(
  values: [100, 102, 98, 105, 110],
  height: 40,
  width: 100,
)
```

### PeerComparisonBarChart

```dart
PeerComparisonBarChart(
  data: {
    'Your Portfolio': 12.5,
    'Peer Average': 10.2,
    'Sector': 9.8,
  },
  highlightLabel: 'Your Portfolio',
)
```

### PercentileIndicator

```dart
PercentileIndicator(
  percentile: 75,
  label: 'Performance Rank',
)
```
