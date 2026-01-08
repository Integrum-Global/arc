import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/shared/widgets/stat_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
    return MaterialApp(
      themeMode: themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: Scaffold(body: Center(child: child)),
    );
  }

  group('StatCard', () {
    group('basic rendering', () {
      testWidgets('displays label and value', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Total Value',
            value: '\$1,234,567',
          ),
        ));

        expect(find.text('Total Value'), findsOneWidget);
        expect(find.text('\$1,234,567'), findsOneWidget);
      });

      testWidgets('displays icon when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Balance',
            value: '\$100',
            icon: Icons.account_balance_wallet,
          ),
        ));

        expect(find.byIcon(Icons.account_balance_wallet), findsOneWidget);
      });

      testWidgets('displays change indicator when changeValue is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Portfolio',
            value: '\$50,000',
            changeValue: 2.5,
            isPercentage: true,
          ),
        ));

        expect(find.text('+2.50%'), findsOneWidget);
        expect(find.byIcon(Icons.trending_up), findsOneWidget);
      });
    });

    group('change indicator colors', () {
      testWidgets('shows green for positive change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Gains',
            value: '\$1,000',
            changeValue: 5.0,
            isPercentage: true,
          ),
        ));

        expect(find.byIcon(Icons.trending_up), findsOneWidget);
      });

      testWidgets('shows red for negative change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Losses',
            value: '\$1,000',
            changeValue: -3.5,
            isPercentage: true,
          ),
        ));

        expect(find.text('-3.50%'), findsOneWidget);
        expect(find.byIcon(Icons.trending_down), findsOneWidget);
      });

      testWidgets('shows neutral for zero change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Stable',
            value: '\$1,000',
            changeValue: 0.0,
            isPercentage: true,
          ),
        ));

        expect(find.text('+0.00%'), findsOneWidget);
        expect(find.byIcon(Icons.trending_flat), findsOneWidget);
      });
    });

    group('interactions', () {
      testWidgets('calls onTap when tapped', (tester) async {
        var tapped = false;

        await tester.pumpWidget(buildTestWidget(
          StatCard(
            label: 'Tappable',
            value: '\$100',
            onTap: () => tapped = true,
          ),
        ));

        await tester.tap(find.text('\$100'));
        await tester.pump();

        expect(tapped, isTrue);
      });
    });

    group('compact mode', () {
      testWidgets('renders with smaller spacing in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const StatCard(
            label: 'Compact',
            value: '\$500',
            compact: true,
          ),
        ));

        expect(find.text('Compact'), findsOneWidget);
        expect(find.text('\$500'), findsOneWidget);
      });
    });
  });

  group('StatCard.currency', () {
    testWidgets('formats large values with compact notation', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.currency(
          label: 'Portfolio Value',
          value: 1234567,
        ),
      ));

      expect(find.text('Portfolio Value'), findsOneWidget);
      expect(find.text('\$1.23M'), findsOneWidget);
    });

    testWidgets('formats smaller values with full precision', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.currency(
          label: 'Cash Balance',
          value: 12345.67,
        ),
      ));

      expect(find.text('\$12,345.67'), findsOneWidget);
    });

    testWidgets('uses money icon by default', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.currency(
          label: 'Value',
          value: 1000,
        ),
      ));

      expect(find.byIcon(Icons.attach_money), findsOneWidget);
    });

    testWidgets('displays percentage change when provided', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.currency(
          label: 'Value',
          value: 1000000,
          changeValue: 5.25,
        ),
      ));

      expect(find.text('+5.25%'), findsOneWidget);
    });
  });

  group('StatCard.percentage', () {
    testWidgets('formats value as percentage with sign', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.percentage(
          label: 'Return',
          value: 12.5,
        ),
      ));

      expect(find.text('Return'), findsOneWidget);
      expect(find.text('+12.50%'), findsOneWidget);
    });

    testWidgets('handles negative percentages', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.percentage(
          label: 'Loss',
          value: -8.75,
        ),
      ));

      expect(find.text('-8.75%'), findsOneWidget);
    });

    testWidgets('uses percent icon by default', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.percentage(
          label: 'Rate',
          value: 5.0,
        ),
      ));

      expect(find.byIcon(Icons.percent), findsOneWidget);
    });
  });

  group('StatCard.number', () {
    testWidgets('formats large numbers with compact notation', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.number(
          label: 'Holdings',
          value: 1500000,
        ),
      ));

      expect(find.text('Holdings'), findsOneWidget);
      expect(find.text('1.5M'), findsOneWidget);
    });

    testWidgets('formats smaller numbers with commas', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.number(
          label: 'Count',
          value: 12345,
        ),
      ));

      expect(find.text('12,345'), findsOneWidget);
    });

    testWidgets('uses tag icon by default', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.number(
          label: 'Items',
          value: 100,
        ),
      ));

      expect(find.byIcon(Icons.tag), findsOneWidget);
    });
  });

  group('dark mode support', () {
    testWidgets('adapts colors in dark mode', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        StatCard.currency(
          label: 'Dark Mode Value',
          value: 50000,
          changeValue: 2.5,
        ),
        themeMode: ThemeMode.dark,
      ));

      expect(find.text('Dark Mode Value'), findsOneWidget);
      expect(find.text('\$50,000.00'), findsOneWidget);
    });
  });
}
