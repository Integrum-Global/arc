# Testing Guide

## Overview

The ARC Mobile app uses Flutter's testing framework with comprehensive unit, widget, and model tests.

## Test Structure

```
test/
├── core/
│   ├── utils/
│   │   └── formatters_test.dart     # 67 tests for formatters
│   └── design/
│       └── components_test.dart     # Design system components
├── shared/
│   └── widgets/
│       ├── stat_card_test.dart
│       ├── empty_state_test.dart
│       ├── error_view_test.dart
│       ├── loading_skeleton_test.dart
│       ├── section_header_test.dart
│       └── charts/
│           ├── allocation_pie_chart_test.dart
│           ├── trend_sparkline_test.dart
│           └── percentile_indicator_test.dart
└── features/
    ├── portfolio/
    │   ├── domain/models/
    │   │   ├── portfolio_test.dart
    │   │   └── holding_test.dart
    │   └── presentation/widgets/
    │       ├── portfolio_tile_test.dart
    │       └── holding_tile_test.dart
    ├── analytics/
    │   ├── domain/models/
    │   │   └── alert_test.dart
    │   └── presentation/widgets/
    │       └── alert_tile_test.dart
    └── dashboard/
        └── domain/models/
            └── dashboard_summary_test.dart
```

## Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/core/utils/formatters_test.dart

# Run with coverage
flutter test --coverage

# Run tests in specific directory
flutter test test/shared/widgets/
```

## Test Patterns

### Unit Tests (Formatters)

```dart
group('Formatters.currency', () {
  test('formats positive amounts correctly', () {
    expect(Formatters.currency(1234.56), equals('\$1,234.56'));
  });

  test('formats large amounts with compact notation', () {
    expect(Formatters.currencyCompact(1500000), equals('\$1.50M'));
  });

  test('handles negative amounts', () {
    expect(Formatters.currency(-500), equals('-\$500.00'));
  });
});
```

### Widget Tests

```dart
testWidgets('AppButton renders label and handles tap', (tester) async {
  var tapped = false;

  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: AppButton(
          label: 'Test',
          onPressed: () => tapped = true,
        ),
      ),
    ),
  );

  expect(find.text('Test'), findsOneWidget);

  await tester.tap(find.text('Test'));
  await tester.pump();

  expect(tapped, isTrue);
});
```

### Model Tests (Freezed)

```dart
group('Portfolio', () {
  test('fromJson creates instance correctly', () {
    final json = {
      'id': 'port-123',
      'name': 'Growth Portfolio',
      'code': 'GROWTH-01',
      'portfolio_type': 'growth',
      'base_currency': 'USD',
      'total_value': 1500000.0,
      'day_change_percent': 1.25,
      'active': true,
    };

    final portfolio = Portfolio.fromJson(json);

    expect(portfolio.id, equals('port-123'));
    expect(portfolio.name, equals('Growth Portfolio'));
    expect(portfolio.totalValue, equals(1500000.0));
  });

  test('toJson serializes correctly', () {
    final portfolio = Portfolio(
      id: 'port-123',
      name: 'Test',
      code: 'TEST-01',
      portfolioType: 'growth',
      baseCurrency: 'USD',
      active: true,
    );

    final json = portfolio.toJson();

    expect(json['id'], equals('port-123'));
    expect(json['portfolio_type'], equals('growth'));
  });

  test('copyWith creates modified copy', () {
    final original = Portfolio(
      id: 'port-123',
      name: 'Original',
      code: 'TEST-01',
      portfolioType: 'growth',
      baseCurrency: 'USD',
      active: true,
    );

    final modified = original.copyWith(name: 'Modified');

    expect(modified.name, equals('Modified'));
    expect(modified.id, equals(original.id));
  });
});
```

## Test Categories

### 1. Formatters (67 tests)
- Currency formatting (standard, compact, negative)
- Percentage formatting (with/without sign)
- Number formatting (standard, compact)
- Date/time formatting
- Relative time formatting

### 2. Design System Components
- AppButton (variants, sizes, states, interactions)
- AppCard (rendering, tapping)
- AppInput (text entry, validation, specialized inputs)

### 3. Shared Widgets
- StatCard (currency/percentage display)
- EmptyState (variants, action buttons)
- ErrorView (error types, retry)
- LoadingSkeleton (shapes)
- SectionHeader (count badge, view all)

### 4. Chart Widgets
- AllocationPieChart (data rendering)
- TrendSparkline (positive/negative trends)
- PercentileIndicator (color coding)

### 5. Feature Widgets
- PortfolioTile (display, tap navigation)
- HoldingTile (position display)
- AlertTile (severity styling)

### 6. Domain Models
- Portfolio (serialization, equality, copyWith)
- Holding (serialization, optional fields)
- Alert (serialization, enums)
- DashboardSummary (nested maps)

## Best Practices

1. **Test real behavior, not implementation**
   ```dart
   // Good: Tests user-visible behavior
   expect(find.text('\$1,234.56'), findsOneWidget);

   // Avoid: Testing implementation details
   expect(widget.formattedValue, contains('1234'));
   ```

2. **Use meaningful test descriptions**
   ```dart
   // Good
   test('displays negative values in red with minus sign', () {...});

   // Avoid
   test('test 1', () {...});
   ```

3. **Test edge cases**
   ```dart
   test('handles zero value', () {...});
   test('handles very large numbers', () {...});
   test('handles null optional fields', () {...});
   ```

4. **Group related tests**
   ```dart
   group('PortfolioTile', () {
     group('basic rendering', () {...});
     group('interactions', () {...});
     group('edge cases', () {...});
   });
   ```
