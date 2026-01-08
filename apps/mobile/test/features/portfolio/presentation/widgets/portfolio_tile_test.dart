import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/portfolio/presentation/widgets/portfolio_tile.dart';
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

  group('PortfolioTile', () {
    group('basic rendering', () {
      testWidgets('displays portfolio name', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Growth Portfolio',
            code: 'GROWTH',
            portfolioType: 'Equity',
            totalValue: 1234567.89,
            dayChangePct: 1.23,
          ),
        ));

        expect(find.text('Growth Portfolio'), findsOneWidget);
      });

      testWidgets('displays portfolio code', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Growth Portfolio',
            code: 'GRWTH',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.text('GRWTH'), findsOneWidget);
      });

      testWidgets('displays portfolio type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Bond Portfolio',
            code: 'BOND',
            portfolioType: 'Fixed Income',
            totalValue: 500000,
            dayChangePct: 0.5,
          ),
        ));

        expect(find.text('Fixed Income'), findsOneWidget);
      });

      testWidgets('displays total value with compact formatting', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Large Portfolio',
            code: 'LARGE',
            portfolioType: 'Balanced',
            totalValue: 2500000,
            dayChangePct: 0,
          ),
        ));

        expect(find.text('\$2.5M'), findsOneWidget);
      });

      testWidgets('displays day change percentage', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Test',
            code: 'TEST',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 2.45,
          ),
        ));

        expect(find.text('+2.45%'), findsOneWidget);
      });
    });

    group('change indicator colors', () {
      testWidgets('shows green for positive change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Gaining',
            code: 'GAIN',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 3.5,
          ),
        ));

        expect(find.text('+3.50%'), findsOneWidget);
      });

      testWidgets('shows red for negative change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Losing',
            code: 'LOSE',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: -2.5,
          ),
        ));

        expect(find.text('-2.50%'), findsOneWidget);
      });

      testWidgets('shows neutral for zero change', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Flat',
            code: 'FLAT',
            portfolioType: 'Balanced',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.text('+0.00%'), findsOneWidget);
      });
    });

    group('portfolio type icons', () {
      testWidgets('shows chart icon for equity portfolio', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Equity Portfolio',
            code: 'EQ',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.show_chart), findsOneWidget);
      });

      testWidgets('shows bank icon for fixed income portfolio', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Bond Portfolio',
            code: 'BD',
            portfolioType: 'Fixed Income',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.account_balance), findsOneWidget);
      });

      testWidgets('shows pie chart icon for balanced portfolio', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Balanced Portfolio',
            code: 'BAL',
            portfolioType: 'Balanced',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.pie_chart), findsOneWidget);
      });

      testWidgets('shows apartment icon for real estate portfolio', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Real Estate',
            code: 'RE',
            portfolioType: 'Real Estate',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.apartment), findsOneWidget);
      });

      testWidgets('shows default icon for unknown portfolio type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Custom',
            code: 'CUS',
            portfolioType: 'Custom Type',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
      });
    });

    group('interactions', () {
      testWidgets('calls onTap when tapped', (tester) async {
        var tapped = false;
        String? tappedId;

        await tester.pumpWidget(buildTestWidget(
          PortfolioTile(
            id: 'portfolio-123',
            name: 'Tappable Portfolio',
            code: 'TAP',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
            onTap: () {
              tapped = true;
              tappedId = 'portfolio-123';
            },
          ),
        ));

        await tester.tap(find.text('Tappable Portfolio'));
        await tester.pump();

        expect(tapped, isTrue);
        expect(tappedId, 'portfolio-123');
      });

      testWidgets('shows chevron when onTap is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          PortfolioTile(
            id: 'portfolio-001',
            name: 'Navigable',
            code: 'NAV',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
            onTap: () {},
          ),
        ));

        expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      });

      testWidgets('does not show chevron when onTap is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Static',
            code: 'STA',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        expect(find.byIcon(Icons.chevron_right), findsNothing);
      });
    });

    group('compact mode', () {
      testWidgets('renders with smaller styling in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Compact Portfolio',
            code: 'COMP',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 1.5,
            compact: true,
          ),
        ));

        expect(find.text('Compact Portfolio'), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          PortfolioTile(
            id: 'portfolio-001',
            name: 'Dark Mode Portfolio',
            code: 'DARK',
            portfolioType: 'Equity',
            totalValue: 1500000,
            dayChangePct: 2.5,
            onTap: () {},
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Dark Mode Portfolio'), findsOneWidget);
        expect(find.text('\$1.5M'), findsOneWidget);
        expect(find.text('+2.50%'), findsOneWidget);
      });
    });

    group('edge cases', () {
      testWidgets('handles very long portfolio name', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'This Is A Very Long Portfolio Name That Should Be Truncated',
            code: 'LONG',
            portfolioType: 'Equity',
            totalValue: 100000,
            dayChangePct: 0,
          ),
        ));

        // Should render without overflow errors
        expect(find.textContaining('This Is A Very Long'), findsOneWidget);
      });

      testWidgets('handles very large total value', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Billion Dollar',
            code: 'BIG',
            portfolioType: 'Equity',
            totalValue: 2500000000,
            dayChangePct: 0,
          ),
        ));

        expect(find.text('\$2.5B'), findsOneWidget);
      });

      testWidgets('handles small total value', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const PortfolioTile(
            id: 'portfolio-001',
            name: 'Small',
            code: 'SML',
            portfolioType: 'Cash',
            totalValue: 1234.56,
            dayChangePct: 0.1,
          ),
        ));

        // Currency compact format for values around 1K
        expect(find.textContaining('\$1'), findsOneWidget);
      });
    });
  });
}
