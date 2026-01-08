# Features

## Overview

The app has 5 main features accessible via bottom navigation:
1. **Dashboard** - Portfolio overview and quick stats
2. **Portfolio** - Portfolio list and detail management
3. **Analytics** - Alerts and financial ratios
4. **Intelligence** - AI assistant and market briefs
5. **Settings** - App configuration

## Dashboard Feature

**Location**: `lib/features/dashboard/`

**Screens**:
- `DashboardScreen` - Main home screen

**Key Providers**:
```dart
// Portfolio summary with total value, allocation
final dashboardSummaryProvider = FutureProvider<DashboardSummary>(...);

// Recent alerts count
final unreadAlertsCountProvider = FutureProvider<int>(...);
```

**Usage**:
```dart
final summary = ref.watch(dashboardSummaryProvider);

summary.when(
  data: (data) => PortfolioSummaryCard(
    totalValue: data.totalValue,
    dailyChange: data.dailyChange,
    dailyChangePct: data.dailyChangePct,
  ),
  loading: () => DashboardSkeleton(),
  error: (e, _) => ErrorView(error: e),
);
```

## Portfolio Feature

**Location**: `lib/features/portfolio/`

**Screens**:
- `PortfolioListScreen` - List all portfolios
- `PortfolioDetailScreen` - Portfolio details with tabs
- `HoldingDetailScreen` - Individual holding details

**Key Providers**:
```dart
// All portfolios
final portfolioListProvider = FutureProvider<List<Portfolio>>(...);

// Single portfolio by ID
final portfolioProvider = FutureProvider.family<Portfolio?, String>(...);

// Holdings for a portfolio
final holdingsProvider = FutureProvider.family<List<Holding>, String>(...);

// Transactions for a portfolio
final transactionsProvider = FutureProvider.family<List<Transaction>, String>(...);

// Allocation data for pie chart
final portfolioAllocationProvider = FutureProvider.family<Map<String, double>, String>(...);
```

**Tabs in PortfolioDetailScreen**:
1. Holdings - Allocation chart + holdings list
2. Transactions - Filterable transaction history
3. Performance - Return charts with benchmark

## Analytics Feature

**Location**: `lib/features/analytics/`

**Screens**:
- `AnalyticsScreen` - Main screen with tabs
- `SecurityRatiosScreen` - Full ratio analysis for a security

**Tabs**:
1. Alerts - Filtered alert list
2. Ratios - Security search and ratio display

**Key Providers**:
```dart
// All alerts
final alertsProvider = FutureProvider<List<Alert>>(...);

// Filter state
final alertSeverityFilterProvider = StateProvider<String?>(...);
final alertTypeFilterProvider = StateProvider<String?>(...);

// Filtered alerts
final filteredAlertsProvider = Provider<AsyncValue<List<Alert>>>(...);

// Security ratios
final securityRatiosProvider = FutureProvider.family<FinancialRatios?, String>(...);
```

## Intelligence Feature

**Location**: `lib/features/intelligence/`

**Screens**:
- `IntelligenceScreen` - Main screen with tabs
- `BriefDetailScreen` - Full market brief view

**Tabs**:
1. Ask AI - Chat interface with AI assistant
2. Briefs - Daily/weekly market briefs
3. Insights - AI-generated portfolio insights

**Key Providers**:
```dart
// Chat conversation
final conversationProvider = StateNotifierProvider<ChatNotifier, Conversation>(...);

// Market briefs
final briefsListProvider = FutureProvider<List<MarketBrief>>(...);
final dailyBriefProvider = Provider<AsyncValue<MarketBrief?>>(...);

// Portfolio insights
final insightsListProvider = FutureProvider<List<Insight>>(...);
```

**Chat Usage**:
```dart
// Send a message
ref.read(conversationProvider.notifier).sendMessage(
  'How is my portfolio performing?',
  ref.read(apiClientProvider),
);

// Watch messages
final conversation = ref.watch(conversationProvider);
for (final message in conversation.messages) {
  ChatBubble(message: message);
}
```

## Settings Feature

**Location**: `lib/features/settings/`

Placeholder for app settings including:
- Theme preference
- Notifications
- Security
- Account management
