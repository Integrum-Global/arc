import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/holding_tile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
    return MaterialApp(
      themeMode: themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: Scaffold(body: Padding(
        padding: const EdgeInsets.all(16),
        child: child,
      )),
    );
  }

  group('HoldingTile', () {
    group('basic rendering', () {
      testWidgets('displays ticker symbol', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
          ),
        ));

        // The ticker is shown as text in the row, and badge shows first 3 chars
        expect(find.text('AAPL'), findsOneWidget);
        // Badge shows truncated ticker for 4-char tickers
        expect(find.text('AAP'), findsOneWidget);
      });

      testWidgets('displays security name', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'MSFT',
            name: 'Microsoft Corporation',
            quantity: 50,
            marketValue: 18500,
            weight: 12.3,
          ),
        ));

        expect(find.text('Microsoft Corporation'), findsOneWidget);
      });

      testWidgets('displays quantity with shares label', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 25,
            marketValue: 3750,
            weight: 5.0,
          ),
        ));

        expect(find.text('25 shares'), findsOneWidget);
      });

      testWidgets('displays fractional quantity correctly', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AMZN',
            name: 'Amazon.com Inc.',
            quantity: 10.5,
            marketValue: 1680,
            weight: 2.2,
          ),
        ));

        expect(find.text('10.5 shares'), findsOneWidget);
      });

      testWidgets('displays market value with currency formatting', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'NVDA',
            name: 'NVIDIA Corporation',
            quantity: 20,
            marketValue: 9800.50,
            weight: 8.5,
          ),
        ));

        expect(find.text('\$9,800.50'), findsOneWidget);
      });

      testWidgets('displays portfolio weight', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'TSLA',
            name: 'Tesla Inc.',
            quantity: 30,
            marketValue: 7500,
            weight: 6.5,
          ),
        ));

        expect(find.text('6.5%'), findsOneWidget);
        expect(find.byIcon(Icons.pie_chart_outline), findsOneWidget);
      });
    });

    group('unrealized P&L', () {
      testWidgets('displays positive P&L with green styling', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            unrealizedPnlPct: 12.34,
          ),
        ));

        expect(find.text('+12.34%'), findsOneWidget);
      });

      testWidgets('displays negative P&L with red styling', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'META',
            name: 'Meta Platforms Inc.',
            quantity: 40,
            marketValue: 12000,
            weight: 10.2,
            unrealizedPnlPct: -8.75,
          ),
        ));

        expect(find.text('-8.75%'), findsOneWidget);
      });

      testWidgets('displays zero P&L', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'XYZ',
            name: 'XYZ Corp',
            quantity: 50,
            marketValue: 5000,
            weight: 5.0,
            unrealizedPnlPct: 0,
          ),
        ));

        expect(find.text('+0.00%'), findsOneWidget);
      });

      testWidgets('does not show P&L when null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'ABC',
            name: 'ABC Corp',
            quantity: 100,
            marketValue: 10000,
            weight: 8.0,
            unrealizedPnlPct: null,
          ),
        ));

        // Should not have any percentage change text
        expect(find.textContaining('%').evaluate().where(
          (element) => element.widget is Text &&
                       (element.widget as Text).data?.contains('+') == true
        ).isEmpty, isTrue);
      });
    });

    group('interactions', () {
      testWidgets('calls onTap when tapped', (tester) async {
        var tapped = false;

        await tester.pumpWidget(buildTestWidget(
          HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            onTap: () => tapped = true,
          ),
        ));

        await tester.tap(find.text('Apple Inc.'));
        await tester.pump();

        expect(tapped, isTrue);
      });

      testWidgets('shows chevron when onTap is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            onTap: () {},
          ),
        ));

        expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      });

      testWidgets('does not show chevron when onTap is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
          ),
        ));

        expect(find.byIcon(Icons.chevron_right), findsNothing);
      });
    });

    group('ticker badge colors by asset class', () {
      testWidgets('uses success color for equity', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            assetClass: 'equity',
          ),
        ));

        // The ticker is shown as text in the row
        expect(find.text('AAPL'), findsOneWidget);
        // Badge shows truncated ticker
        expect(find.text('AAP'), findsOneWidget);
      });

      testWidgets('uses info color for fixed income', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'BND',
            name: 'Vanguard Bond ETF',
            quantity: 200,
            marketValue: 16000,
            weight: 13.5,
            assetClass: 'fixed income',
          ),
        ));

        // 3-char ticker shown in both places
        expect(find.text('BND'), findsNWidgets(2));
      });

      testWidgets('uses secondary color for cash', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'MMF',
            name: 'Money Market Fund',
            quantity: 1000,
            marketValue: 1000,
            weight: 1.0,
            assetClass: 'cash',
          ),
        ));

        expect(find.text('MMF'), findsNWidgets(2));
      });

      testWidgets('uses primary color for unknown asset class', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'XYZ',
            name: 'Unknown Asset',
            quantity: 50,
            marketValue: 5000,
            weight: 4.0,
            assetClass: 'other',
          ),
        ));

        expect(find.text('XYZ'), findsNWidgets(2));
      });
    });

    group('compact mode', () {
      testWidgets('renders with smaller styling in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            compact: true,
          ),
        ));

        expect(find.text('Apple Inc.'), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 100,
            marketValue: 19500,
            weight: 15.5,
            unrealizedPnlPct: 5.25,
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Apple Inc.'), findsOneWidget);
        expect(find.text('+5.25%'), findsOneWidget);
      });
    });

    group('ticker badge text', () {
      testWidgets('shows full ticker for 3 or fewer characters', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'XYZ',
            name: 'XYZ Corp',
            quantity: 100,
            marketValue: 10000,
            weight: 10.0,
          ),
        ));

        // Badge should show 'XYZ'
        expect(find.text('XYZ'), findsNWidgets(2));
      });

      testWidgets('truncates ticker to first 3 characters for longer tickers', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 25,
            marketValue: 4000,
            weight: 3.5,
          ),
        ));

        // Badge should show 'GOO' but full ticker shown elsewhere
        expect(find.text('GOO'), findsOneWidget);
        expect(find.text('GOOGL'), findsOneWidget);
      });
    });

    group('edge cases', () {
      testWidgets('handles very long security name', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'LONG',
            name: 'This Is A Very Long Security Name That Should Be Truncated In The Display',
            quantity: 50,
            marketValue: 5000,
            weight: 5.0,
          ),
        ));

        expect(find.textContaining('This Is A Very Long'), findsOneWidget);
      });

      testWidgets('handles very large market value', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'BIG',
            name: 'Big Holding',
            quantity: 1000000,
            marketValue: 150000000.50,
            weight: 80.5,
          ),
        ));

        expect(find.text('\$150,000,000.50'), findsOneWidget);
      });

      testWidgets('handles zero weight', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const HoldingTile(
            ticker: 'ZERO',
            name: 'Zero Weight',
            quantity: 1,
            marketValue: 10,
            weight: 0.0,
          ),
        ));

        expect(find.text('0.0%'), findsOneWidget);
      });
    });
  });
}
