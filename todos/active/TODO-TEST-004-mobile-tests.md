# TODO-TEST-004: Mobile Frontend Tests

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-MOB-001 to TODO-MOB-010

---

## Objective

Implement comprehensive tests for the Flutter mobile application including unit tests, widget tests, and integration tests.

---

## Tasks

### 1. Test Infrastructure Setup
- [ ] Configure Flutter test runner
- [ ] Set up mock providers for Riverpod
- [ ] Configure golden tests for visual regression
- [ ] Set up integration test driver
- [ ] Configure coverage reporting

### 2. Unit Tests - Utilities
- [ ] Create `test/utils/formatters_test.dart`:
  - formatCurrency tests
  - formatPercentage tests
  - formatDate tests
  - formatNumber tests
  - formatRatio tests
- [ ] Create `test/utils/validators_test.dart`:
  - validateEmail tests
  - validateTicker tests
  - validateQuantity tests
  - validatePrice tests
- [ ] Create `test/utils/calculations_test.dart`:
  - calculateGainLoss tests
  - calculateAllocation tests
  - calculatePerformance tests

### 3. Unit Tests - Models
- [ ] Create `test/models/portfolio_test.dart`:
  - fromJson tests
  - toJson tests
  - copyWith tests
  - equality tests
- [ ] Create `test/models/holding_test.dart`:
  - fromJson tests
  - gainLoss calculation tests
  - allocation calculation tests
- [ ] Create `test/models/security_test.dart`:
  - fromJson tests
  - type enum tests

### 4. Unit Tests - Providers
- [ ] Create `test/providers/portfolio_provider_test.dart`:
  - initial state test
  - fetch portfolios test
  - create portfolio test
  - error handling test
- [ ] Create `test/providers/analytics_provider_test.dart`:
  - fetch ratios test
  - fetch alerts test
  - threshold management test
- [ ] Create `test/providers/auth_provider_test.dart`:
  - login test
  - logout test
  - token refresh test

### 5. Widget Tests - Design System
- [ ] Create `test/widgets/design_system/app_button_test.dart`:
  - renders correctly
  - handles tap
  - shows loading state
  - disabled state works
  - variants render correctly
- [ ] Create `test/widgets/design_system/app_card_test.dart`:
  - renders children
  - applies elevation
  - handles tap gesture
- [ ] Create `test/widgets/design_system/app_input_test.dart`:
  - renders with label
  - handles text input
  - shows error state
  - handles obscure text

### 6. Widget Tests - Data Display
- [ ] Create `test/widgets/stat_card_test.dart`:
  - renders value and label
  - formats currency correctly
  - shows trend indicator
  - handles loading state
- [ ] Create `test/widgets/portfolio_summary_card_test.dart`:
  - displays portfolio name
  - shows value with currency
  - shows performance percentage
  - handles tap navigation
- [ ] Create `test/widgets/holding_tile_test.dart`:
  - displays security info
  - shows quantity and value
  - shows gain/loss correctly
  - handles tap for detail

### 7. Widget Tests - Charts
- [ ] Create `test/widgets/allocation_pie_chart_test.dart`:
  - renders chart
  - shows legend items
  - handles empty data
  - handles single item
- [ ] Create `test/widgets/performance_chart_test.dart`:
  - renders line chart
  - handles date range
  - shows correct labels
  - handles no data

### 8. Screen Tests
- [ ] Create `test/screens/dashboard_screen_test.dart`:
  - renders summary cards
  - renders allocation chart
  - renders alerts section
  - handles pull to refresh
  - handles loading state
- [ ] Create `test/screens/portfolio_list_screen_test.dart`:
  - renders portfolio cards
  - handles empty state
  - handles FAB tap
  - handles search
- [ ] Create `test/screens/portfolio_detail_screen_test.dart`:
  - renders tab bar
  - switches between tabs
  - shows holdings list
  - shows transactions list

### 9. Golden Tests (Visual Regression)
- [ ] Create `test/golden/design_system_golden_test.dart`:
  - AppButton variants
  - AppCard styles
  - AppInput states
  - Color scheme light/dark
- [ ] Create `test/golden/stat_card_golden_test.dart`:
  - Positive trend
  - Negative trend
  - Loading state
  - Different formats
- [ ] Create `test/golden/chart_golden_test.dart`:
  - Allocation chart
  - Performance chart
  - Sparkline

### 10. Integration Tests
- [ ] Create `integration_test/auth_flow_test.dart`:
  - complete login flow
  - complete logout flow
  - biometric auth
  - session persistence
- [ ] Create `integration_test/portfolio_flow_test.dart`:
  - create portfolio
  - view portfolio details
  - add transaction
  - view holdings
- [ ] Create `integration_test/navigation_test.dart`:
  - bottom navigation
  - tab navigation
  - back button behavior
  - deep link handling

---

## Acceptance Criteria

- [ ] Unit test coverage >= 80%
- [ ] All widget tests pass
- [ ] All integration tests pass
- [ ] Golden tests match snapshots
- [ ] Tests run on CI pipeline
- [ ] No accessibility errors

---

## Test Directory Structure

```
apps/mobile/
├── test/
│   ├── utils/
│   │   ├── formatters_test.dart
│   │   ├── validators_test.dart
│   │   └── calculations_test.dart
│   ├── models/
│   │   ├── portfolio_test.dart
│   │   ├── holding_test.dart
│   │   └── security_test.dart
│   ├── providers/
│   │   ├── portfolio_provider_test.dart
│   │   ├── analytics_provider_test.dart
│   │   └── auth_provider_test.dart
│   ├── widgets/
│   │   ├── design_system/
│   │   │   ├── app_button_test.dart
│   │   │   ├── app_card_test.dart
│   │   │   └── app_input_test.dart
│   │   ├── stat_card_test.dart
│   │   ├── portfolio_summary_card_test.dart
│   │   └── holding_tile_test.dart
│   ├── screens/
│   │   ├── dashboard_screen_test.dart
│   │   ├── portfolio_list_screen_test.dart
│   │   └── portfolio_detail_screen_test.dart
│   ├── golden/
│   │   ├── design_system_golden_test.dart
│   │   ├── stat_card_golden_test.dart
│   │   └── chart_golden_test.dart
│   └── test_utils/
│       ├── mock_providers.dart
│       └── test_wrapper.dart
├── integration_test/
│   ├── auth_flow_test.dart
│   ├── portfolio_flow_test.dart
│   └── navigation_test.dart
└── pubspec.yaml
```

---

## Test Dependencies (pubspec.yaml)

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mocktail: ^1.0.0
  golden_toolkit: ^0.15.0
  network_image_mock: ^2.1.1
```

---

## Test Utilities

```dart
// test/test_utils/test_wrapper.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:arc_mobile/core/theme/app_theme.dart';

class TestWrapper extends StatelessWidget {
  final Widget child;
  final List<Override> overrides;

  const TestWrapper({
    super.key,
    required this.child,
    this.overrides = const [],
  });

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        home: child,
      ),
    );
  }
}

// Helper for pumping widgets
extension WidgetTesterX on WidgetTester {
  Future<void> pumpApp(Widget widget, {List<Override> overrides = const []}) {
    return pumpWidget(
      TestWrapper(
        overrides: overrides,
        child: widget,
      ),
    );
  }
}
```

```dart
// test/test_utils/mock_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:arc_mobile/features/portfolio/data/repositories/portfolio_repository.dart';

class MockPortfolioRepository extends Mock implements PortfolioRepository {}

// Mock data
final mockPortfolios = [
  Portfolio(
    id: 'pf-1',
    name: 'Growth Portfolio',
    code: 'GROWTH',
    portfolioType: PortfolioType.managed,
    baseCurrency: 'USD',
    totalValue: 1500000,
    dayChange: 0.02,
    active: true,
  ),
  Portfolio(
    id: 'pf-2',
    name: 'Income Portfolio',
    code: 'INCOME',
    portfolioType: PortfolioType.advisory,
    baseCurrency: 'USD',
    totalValue: 750000,
    dayChange: -0.01,
    active: true,
  ),
];
```

---

## Example Widget Test

```dart
// test/widgets/stat_card_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:arc_mobile/shared/widgets/stat_card.dart';
import '../test_utils/test_wrapper.dart';

void main() {
  group('StatCard', () {
    testWidgets('renders value and label', (tester) async {
      await tester.pumpApp(
        const StatCard(
          label: 'Total Value',
          value: 1500000,
          format: StatFormat.currency,
        ),
      );

      expect(find.text('Total Value'), findsOneWidget);
      expect(find.text('\$1,500,000'), findsOneWidget);
    });

    testWidgets('shows positive trend indicator', (tester) async {
      await tester.pumpApp(
        const StatCard(
          label: 'Performance',
          value: 0.15,
          format: StatFormat.percentage,
          trend: TrendDirection.up,
          trendValue: 0.05,
        ),
      );

      expect(find.text('15.00%'), findsOneWidget);
      expect(find.text('+5.00%'), findsOneWidget);
      expect(find.byIcon(Icons.trending_up), findsOneWidget);
    });

    testWidgets('shows negative trend indicator', (tester) async {
      await tester.pumpApp(
        const StatCard(
          label: 'Performance',
          value: -0.05,
          format: StatFormat.percentage,
          trend: TrendDirection.down,
          trendValue: -0.03,
        ),
      );

      expect(find.text('-5.00%'), findsOneWidget);
      expect(find.text('-3.00%'), findsOneWidget);
      expect(find.byIcon(Icons.trending_down), findsOneWidget);
    });

    testWidgets('handles loading state', (tester) async {
      await tester.pumpApp(
        const StatCard(
          label: 'Loading',
          value: 0,
          isLoading: true,
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}
```

---

## Example Integration Test

```dart
// integration_test/portfolio_flow_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:arc_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Portfolio Flow', () {
    testWidgets('complete portfolio creation flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to portfolios
      await tester.tap(find.byIcon(Icons.account_balance_wallet));
      await tester.pumpAndSettle();

      // Tap create button
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Fill form
      await tester.enterText(
        find.byKey(const Key('portfolio_name_field')),
        'Integration Test Portfolio',
      );
      await tester.enterText(
        find.byKey(const Key('portfolio_code_field')),
        'INT001',
      );

      // Select portfolio type
      await tester.tap(find.byKey(const Key('portfolio_type_dropdown')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Managed'));
      await tester.pumpAndSettle();

      // Submit form
      await tester.tap(find.byKey(const Key('create_portfolio_button')));
      await tester.pumpAndSettle();

      // Verify navigation to detail
      expect(find.text('Integration Test Portfolio'), findsOneWidget);
      expect(find.text('INT001'), findsOneWidget);
    });

    testWidgets('view portfolio holdings', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to portfolios
      await tester.tap(find.byIcon(Icons.account_balance_wallet));
      await tester.pumpAndSettle();

      // Tap first portfolio
      await tester.tap(find.byType(PortfolioSummaryCard).first);
      await tester.pumpAndSettle();

      // Tap Holdings tab
      await tester.tap(find.text('Holdings'));
      await tester.pumpAndSettle();

      // Verify holdings list
      expect(find.byType(HoldingTile), findsWidgets);
    });
  });
}
```

---

## Example Golden Test

```dart
// test/golden/stat_card_golden_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:arc_mobile/shared/widgets/stat_card.dart';

void main() {
  group('StatCard Golden Tests', () {
    testGoldens('StatCard - all variants', (tester) async {
      final builder = GoldenBuilder.grid(
        columns: 2,
        widthToHeightRatio: 1.5,
      )
        ..addScenario(
          'Positive Trend',
          const StatCard(
            label: 'Performance',
            value: 0.15,
            format: StatFormat.percentage,
            trend: TrendDirection.up,
            trendValue: 0.05,
          ),
        )
        ..addScenario(
          'Negative Trend',
          const StatCard(
            label: 'Performance',
            value: -0.05,
            format: StatFormat.percentage,
            trend: TrendDirection.down,
            trendValue: -0.03,
          ),
        )
        ..addScenario(
          'Currency Format',
          const StatCard(
            label: 'Total Value',
            value: 1500000,
            format: StatFormat.currency,
          ),
        )
        ..addScenario(
          'Loading State',
          const StatCard(
            label: 'Loading',
            value: 0,
            isLoading: true,
          ),
        );

      await tester.pumpWidgetBuilder(
        builder.build(),
        surfaceSize: const Size(600, 400),
      );
      await screenMatchesGolden(tester, 'stat_card_variants');
    });
  });
}
```

---

## Running Tests

```bash
# Run all unit and widget tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific test file
flutter test test/widgets/stat_card_test.dart

# Run golden tests
flutter test test/golden/

# Update golden files
flutter test --update-goldens test/golden/

# Run integration tests
flutter test integration_test/

# Run integration tests on device
flutter drive --driver=test_driver/integration_test.dart \
  --target=integration_test/app_test.dart
```

---

## Technical Notes

- Use mocktail for mocking (preferred over mockito for null safety)
- Use golden_toolkit for visual regression testing
- Wrap widgets in TestWrapper for proper theming
- Use ProviderScope overrides for provider testing
- Mock network images with network_image_mock
- Run golden tests on CI with consistent environment
- Use integration_test package for E2E tests
