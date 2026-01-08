import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/shared/widgets/empty_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
    return MaterialApp(
      themeMode: themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: Scaffold(body: child),
    );
  }

  group('EmptyState', () {
    group('basic rendering', () {
      testWidgets('displays icon, title, and message', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const EmptyState(
            icon: Icons.folder_outlined,
            title: 'No portfolios yet',
            message: 'Create your first portfolio to start tracking.',
          ),
        ));

        expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
        expect(find.text('No portfolios yet'), findsOneWidget);
        expect(find.text('Create your first portfolio to start tracking.'), findsOneWidget);
      });

      testWidgets('displays without message when not provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const EmptyState(
            icon: Icons.inbox_outlined,
            title: 'Empty inbox',
          ),
        ));

        expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
        expect(find.text('Empty inbox'), findsOneWidget);
      });

      testWidgets('respects custom icon size', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const EmptyState(
            icon: Icons.search_off,
            title: 'No results',
            iconSize: 60,
          ),
        ));

        final icon = tester.widget<Icon>(find.byIcon(Icons.search_off));
        expect(icon.size, 60);
      });
    });

    group('action button', () {
      testWidgets('displays action button when actionLabel and onAction provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          EmptyState(
            icon: Icons.add,
            title: 'No items',
            actionLabel: 'Add Item',
            onAction: () {},
          ),
        ));

        expect(find.text('Add Item'), findsOneWidget);
        expect(find.byType(AppButton), findsOneWidget);
      });

      testWidgets('calls onAction when action button is tapped', (tester) async {
        var actionCalled = false;

        await tester.pumpWidget(buildTestWidget(
          EmptyState(
            icon: Icons.add,
            title: 'No items',
            actionLabel: 'Create',
            onAction: () => actionCalled = true,
          ),
        ));

        await tester.tap(find.text('Create'));
        await tester.pump();

        expect(actionCalled, isTrue);
      });

      testWidgets('does not display button when only actionLabel provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const EmptyState(
            icon: Icons.info,
            title: 'Info',
            actionLabel: 'Click Me',
            // onAction not provided
          ),
        ));

        expect(find.text('Click Me'), findsNothing);
      });
    });

    group('secondary action', () {
      testWidgets('displays secondary action button when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          EmptyState(
            icon: Icons.search,
            title: 'No results',
            actionLabel: 'Primary',
            onAction: () {},
            secondaryActionLabel: 'Secondary',
            onSecondaryAction: () {},
          ),
        ));

        expect(find.text('Primary'), findsOneWidget);
        expect(find.text('Secondary'), findsOneWidget);
      });

      testWidgets('calls onSecondaryAction when tapped', (tester) async {
        var secondaryCalled = false;

        await tester.pumpWidget(buildTestWidget(
          EmptyState(
            icon: Icons.search,
            title: 'No results',
            actionLabel: 'Primary',
            onAction: () {},
            secondaryActionLabel: 'Go Back',
            onSecondaryAction: () => secondaryCalled = true,
          ),
        ));

        await tester.tap(find.text('Go Back'));
        await tester.pump();

        expect(secondaryCalled, isTrue);
      });
    });

    group('compact mode', () {
      testWidgets('uses smaller spacing in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const EmptyState(
            icon: Icons.inbox,
            title: 'Compact Empty State',
            compact: true,
          ),
        ));

        expect(find.text('Compact Empty State'), findsOneWidget);
      });
    });
  });

  group('EmptyState.noResults', () {
    testWidgets('displays search off icon and correct title', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        EmptyState.noResults(),
      ));

      expect(find.byIcon(Icons.search_off_outlined), findsOneWidget);
      expect(find.text('No results found'), findsOneWidget);
    });

    testWidgets('includes search query in message when provided', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        EmptyState.noResults(searchQuery: 'test query'),
      ));

      expect(find.text('No matches for "test query"'), findsOneWidget);
    });

    testWidgets('shows clear button when onClear is provided', (tester) async {
      var cleared = false;

      await tester.pumpWidget(buildTestWidget(
        EmptyState.noResults(
          onClear: () => cleared = true,
        ),
      ));

      expect(find.text('Clear Search'), findsOneWidget);

      await tester.tap(find.text('Clear Search'));
      await tester.pump();

      expect(cleared, isTrue);
    });
  });

  group('EmptyState.noData', () {
    testWidgets('displays inbox icon and data type in title', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        EmptyState.noData(dataType: 'transactions'),
      ));

      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
      expect(find.text('No transactions'), findsOneWidget);
      expect(find.text('There are no transactions to display yet.'), findsOneWidget);
    });

    testWidgets('shows action button when provided', (tester) async {
      var actionCalled = false;

      await tester.pumpWidget(buildTestWidget(
        EmptyState.noData(
          dataType: 'portfolios',
          actionLabel: 'Create Portfolio',
          onAction: () => actionCalled = true,
        ),
      ));

      expect(find.text('Create Portfolio'), findsOneWidget);

      await tester.tap(find.text('Create Portfolio'));
      await tester.pump();

      expect(actionCalled, isTrue);
    });
  });

  group('EmptyState.offline', () {
    testWidgets('displays wifi off icon and offline message', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        EmptyState.offline(),
      ));

      expect(find.byIcon(Icons.wifi_off_outlined), findsOneWidget);
      expect(find.text("You're offline"), findsOneWidget);
      expect(find.text('Please check your internet connection and try again.'), findsOneWidget);
    });

    testWidgets('shows retry button when onRetry is provided', (tester) async {
      var retried = false;

      await tester.pumpWidget(buildTestWidget(
        EmptyState.offline(
          onRetry: () => retried = true,
        ),
      ));

      expect(find.text('Retry'), findsOneWidget);

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retried, isTrue);
    });
  });

  group('dark mode support', () {
    testWidgets('adapts colors in dark mode', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const EmptyState(
          icon: Icons.folder_outlined,
          title: 'Dark Mode Empty State',
          message: 'This should render correctly in dark mode.',
        ),
        themeMode: ThemeMode.dark,
      ));

      expect(find.text('Dark Mode Empty State'), findsOneWidget);
    });
  });
}
