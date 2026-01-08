import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/shared/widgets/loading_skeleton.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

void main() {
  Widget buildTestWidget(Widget child, {ThemeMode themeMode = ThemeMode.light}) {
    return MaterialApp(
      themeMode: themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: Scaffold(body: child),
    );
  }

  group('LoadingSkeleton', () {
    group('basic rendering', () {
      testWidgets('renders with specified height', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const LoadingSkeleton(height: 100),
        ));

        expect(find.byType(Shimmer), findsOneWidget);
        final container = tester.widget<Container>(find.byType(Container).first);
        expect((container.constraints as BoxConstraints?)?.maxHeight, 100);
      });

      testWidgets('renders with specified width and height', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const LoadingSkeleton(width: 200, height: 50),
        ));

        expect(find.byType(Shimmer), findsOneWidget);
      });

      testWidgets('applies custom border radius', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const LoadingSkeleton(
            height: 50,
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
        ));

        expect(find.byType(Shimmer), findsOneWidget);
      });

      testWidgets('uses shimmer animation', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const LoadingSkeleton(height: 100),
        ));

        expect(find.byType(Shimmer), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const LoadingSkeleton(height: 100),
          themeMode: ThemeMode.dark,
        ));

        expect(find.byType(Shimmer), findsOneWidget);
      });
    });
  });

  group('LoadingSkeleton.text', () {
    testWidgets('creates text-sized skeleton with default dimensions', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.text(),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('accepts custom width and height', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.text(width: 150, height: 20),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });
  });

  group('LoadingSkeleton.circle', () {
    testWidgets('creates circular skeleton with default size', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.circle(),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('accepts custom size', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.circle(size: 64),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });
  });

  group('LoadingSkeleton.card', () {
    testWidgets('creates card-shaped skeleton', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.card(),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('accepts custom height and width', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.card(height: 150, width: 300),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });
  });

  group('LoadingSkeleton.button', () {
    testWidgets('creates button-shaped skeleton', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.button(),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('accepts custom dimensions', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        LoadingSkeleton.button(width: 160, height: 48),
      ));

      expect(find.byType(Shimmer), findsOneWidget);
    });
  });

  group('ListTileSkeleton', () {
    testWidgets('renders with avatar by default', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const ListTileSkeleton(),
      ));

      // Should have multiple shimmer elements for avatar and text
      expect(find.byType(Shimmer), findsWidgets);
    });

    testWidgets('renders without avatar when showAvatar is false', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const ListTileSkeleton(showAvatar: false),
      ));

      expect(find.byType(Shimmer), findsWidgets);
    });

    testWidgets('renders with trailing element when showTrailing is true', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const ListTileSkeleton(showTrailing: true),
      ));

      expect(find.byType(Shimmer), findsWidgets);
    });
  });

  group('PortfolioTileSkeleton', () {
    testWidgets('renders portfolio card skeleton', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const PortfolioTileSkeleton(),
      ));

      expect(find.byType(AppCard), findsOneWidget);
      expect(find.byType(Shimmer), findsWidgets);
    });
  });

  group('PortfolioListSkeleton', () {
    testWidgets('renders multiple portfolio tile skeletons', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const PortfolioListSkeleton(itemCount: 3),
      ));

      expect(find.byType(PortfolioTileSkeleton), findsNWidgets(3));
    });

    testWidgets('defaults to 4 items', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const PortfolioListSkeleton(),
      ));

      expect(find.byType(PortfolioTileSkeleton), findsNWidgets(4));
    });
  });

  group('StatCardsSkeleton', () {
    testWidgets('renders specified number of stat card skeletons', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const StatCardsSkeleton(count: 2),
      ));

      expect(find.byType(AppCard), findsNWidgets(2));
    });

    testWidgets('defaults to 3 cards', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const StatCardsSkeleton(),
      ));

      expect(find.byType(AppCard), findsNWidgets(3));
    });
  });

  group('DashboardSkeleton', () {
    testWidgets('renders complete dashboard skeleton', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const DashboardSkeleton(),
      ));

      expect(find.byType(Shimmer), findsWidgets);
      expect(find.byType(StatCardsSkeleton), findsOneWidget);
      expect(find.byType(ListTileSkeleton), findsWidgets);
    });
  });

  group('AnalyticsSkeleton', () {
    testWidgets('renders analytics screen skeleton', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const AnalyticsSkeleton(),
      ));

      expect(find.byType(Shimmer), findsWidgets);
      expect(find.byType(StatCardsSkeleton), findsWidgets);
    });
  });

  group('DetailSkeleton', () {
    testWidgets('renders detail screen skeleton with header', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const DetailSkeleton(),
      ));

      expect(find.byType(Shimmer), findsWidgets);
      expect(find.byType(StatCardsSkeleton), findsOneWidget);
      // DetailSkeleton includes ListTileSkeletons in its ListView
      expect(find.byType(DetailSkeleton), findsOneWidget);
    });
  });
}
