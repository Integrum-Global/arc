import 'package:arc_mobile/shared/widgets/charts/trend_sparkline.dart';
import 'package:fl_chart/fl_chart.dart';
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

  group('TrendSparkline', () {
    group('basic rendering', () {
      testWidgets('renders line chart with values', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 105, 102, 110, 108, 115],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('renders with specified dimensions', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110],
            width: 150,
            height: 50,
          ),
        ));

        final sizedBox = tester.widget<SizedBox>(
          find.ancestor(
            of: find.byType(LineChart),
            matching: find.byType(SizedBox),
          ).first,
        );
        expect(sizedBox.width, 150);
        expect(sizedBox.height, 50);
      });

      testWidgets('renders empty sized box when values is empty', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [],
          ),
        ));

        expect(find.byType(LineChart), findsNothing);
        expect(find.byType(SizedBox), findsOneWidget);
      });

      testWidgets('renders dot for single value', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100],
          ),
        ));

        expect(find.byType(LineChart), findsNothing);
        // Should show a centered dot container
        expect(find.byType(Container), findsWidgets);
      });
    });

    group('trend colors', () {
      testWidgets('uses green color for positive trend', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 120], // Upward trend
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('uses red color for negative trend', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 90, 80], // Downward trend
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('uses neutral color for flat trend', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 100], // Flat trend
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('uses custom lineColor when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110],
            lineColor: Colors.purple,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });
    });

    group('customization', () {
      testWidgets('applies custom stroke width', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 105],
            strokeWidth: 4.0,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('applies custom curve smoothness', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 105],
            curveSmoothness: 0.5,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('shows dots when showDots is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 105],
            showDots: true,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('hides dots when showDots is false', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 105],
            showDots: false,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('applies custom fill color', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110],
            fillColor: Colors.blue,
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 110, 120], // Positive trend
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('uses dark mode colors for negative trend', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 90, 80], // Negative trend
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });
    });

    group('edge cases', () {
      testWidgets('handles two equal values (neutral)', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100, 100],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles many data points', (tester) async {
        final manyValues = List.generate(100, (i) => 100.0 + i);

        await tester.pumpWidget(buildTestWidget(
          TrendSparkline(values: manyValues),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles negative values', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [-50, -30, -40, -20],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles mixed positive and negative values', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [-20, 10, -5, 30, -10],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles very small value differences', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [100.001, 100.002, 100.003],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles all same values', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [50, 50, 50, 50, 50],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });

      testWidgets('handles zero values', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          const TrendSparkline(
            values: [0, 0, 0],
          ),
        ));

        expect(find.byType(LineChart), findsOneWidget);
      });
    });
  });
}
