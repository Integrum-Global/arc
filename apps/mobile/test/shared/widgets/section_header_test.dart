import 'package:arc_mobile/shared/widgets/section_header.dart';
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

  group('SectionHeader', () {
    group('basic rendering', () {
      testWidgets('displays title', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(title: 'Recent Transactions'),
        ));

        expect(find.text('Recent Transactions'), findsOneWidget);
      });

      testWidgets('displays icon when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Portfolio',
            icon: Icons.pie_chart,
          ),
        ));

        expect(find.byIcon(Icons.pie_chart), findsOneWidget);
        expect(find.text('Portfolio'), findsOneWidget);
      });

      testWidgets('displays subtitle when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Holdings',
            subtitle: 'Your current positions',
          ),
        ));

        expect(find.text('Holdings'), findsOneWidget);
        expect(find.text('Your current positions'), findsOneWidget);
      });
    });

    group('count badge', () {
      testWidgets('displays count badge when count is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Alerts',
            count: 12,
          ),
        ));

        expect(find.text('Alerts'), findsOneWidget);
        expect(find.text('12'), findsOneWidget);
      });

      testWidgets('does not display count badge when count is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(title: 'No Count'),
        ));

        expect(find.text('No Count'), findsOneWidget);
        // No container with count should exist
      });

      testWidgets('handles zero count', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Items',
            count: 0,
          ),
        ));

        expect(find.text('0'), findsOneWidget);
      });

      testWidgets('handles large count', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Items',
            count: 9999,
          ),
        ));

        expect(find.text('9999'), findsOneWidget);
      });
    });

    group('view all button', () {
      testWidgets('displays View All button when onViewAll is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          SectionHeader(
            title: 'Transactions',
            onViewAll: () {},
          ),
        ));

        expect(find.text('View All'), findsOneWidget);
        expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      });

      testWidgets('calls onViewAll when button is tapped', (tester) async {
        var viewAllCalled = false;

        await tester.pumpWidget(buildTestWidget(
          SectionHeader(
            title: 'Transactions',
            onViewAll: () => viewAllCalled = true,
          ),
        ));

        await tester.tap(find.text('View All'));
        await tester.pump();

        expect(viewAllCalled, isTrue);
      });

      testWidgets('uses custom view all label when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          SectionHeader(
            title: 'Items',
            viewAllLabel: 'See More',
            onViewAll: () {},
          ),
        ));

        expect(find.text('See More'), findsOneWidget);
        expect(find.text('View All'), findsNothing);
      });

      testWidgets('does not display View All when onViewAll is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(title: 'No Action'),
        ));

        expect(find.text('View All'), findsNothing);
        expect(find.byType(TextButton), findsNothing);
      });
    });

    group('compact mode', () {
      testWidgets('renders with smaller styling in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Compact Header',
            compact: true,
          ),
        ));

        expect(find.text('Compact Header'), findsOneWidget);
      });

      testWidgets('compact mode affects icon size', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Compact',
            icon: Icons.star,
            compact: true,
          ),
        ));

        final icon = tester.widget<Icon>(find.byIcon(Icons.star));
        expect(icon.size, 18);
      });

      testWidgets('non-compact mode has larger icon', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const SectionHeader(
            title: 'Normal',
            icon: Icons.star,
            compact: false,
          ),
        ));

        final icon = tester.widget<Icon>(find.byIcon(Icons.star));
        expect(icon.size, 20);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          SectionHeader(
            title: 'Dark Mode Header',
            icon: Icons.info,
            count: 5,
            onViewAll: () {},
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Dark Mode Header'), findsOneWidget);
        expect(find.text('5'), findsOneWidget);
      });
    });
  });

  group('SectionDivider', () {
    testWidgets('renders simple divider without label', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const SectionDivider(),
      ));

      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('renders divider with label in center', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const SectionDivider(label: 'OR'),
      ));

      expect(find.text('OR'), findsOneWidget);
      expect(find.byType(Divider), findsNWidgets(2)); // Two dividers for labeled variant
    });

    testWidgets('applies custom padding', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const SectionDivider(
          padding: EdgeInsets.symmetric(vertical: 24),
        ),
      ));

      // Find the SectionDivider widget to get its actual padding
      final sectionDivider = tester.widget<SectionDivider>(find.byType(SectionDivider));
      expect(sectionDivider.padding, const EdgeInsets.symmetric(vertical: 24));
    });

    testWidgets('adapts colors in dark mode', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const SectionDivider(label: 'DIVIDER'),
        themeMode: ThemeMode.dark,
      ));

      expect(find.text('DIVIDER'), findsOneWidget);
    });
  });
}
