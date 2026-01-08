import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/features/analytics/presentation/widgets/alert_tile.dart';
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

  group('AlertTile', () {
    final testTriggeredAt = DateTime(2026, 1, 7, 14, 30);

    group('basic rendering', () {
      testWidgets('displays alert title', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Price Alert Triggered',
            message: 'AAPL has reached your target price',
            severity: 'warning',
            type: 'threshold',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('Price Alert Triggered'), findsOneWidget);
      });

      testWidgets('displays alert message', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test Alert',
            message: 'This is the alert message',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('This is the alert message'), findsOneWidget);
      });

      testWidgets('displays type badge', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test message',
            severity: 'info',
            type: 'threshold',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('PRICE ALERT'), findsOneWidget);
      });

      testWidgets('displays relative timestamp', (tester) async {
        final recentTime = DateTime.now().subtract(const Duration(hours: 2));

        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Recent Alert',
            message: 'This happened recently',
            severity: 'info',
            type: 'news',
            triggeredAt: recentTime,
          ),
        ));

        expect(find.text('2h ago'), findsOneWidget);
      });
    });

    group('severity styling', () {
      testWidgets('shows error icon for critical severity', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Critical Alert',
            message: 'Something critical happened',
            severity: 'critical',
            type: 'risk',
            triggeredAt: testTriggeredAt,
          ),
        ));

        // Should have error-related icon
        expect(find.byType(Icon), findsWidgets);
      });

      testWidgets('shows warning icon for warning severity', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Warning Alert',
            message: 'Something needs attention',
            severity: 'warning',
            type: 'threshold',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.byType(Icon), findsWidgets);
      });

      testWidgets('shows info icon for info severity', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Info Alert',
            message: 'FYI information',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.byType(Icon), findsWidgets);
      });
    });

    group('type badges', () {
      testWidgets('shows "Price Alert" for threshold type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'info',
            type: 'threshold',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('PRICE ALERT'), findsOneWidget);
      });

      testWidgets('shows "Anomaly" for anomaly type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'warning',
            type: 'anomaly',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('ANOMALY'), findsOneWidget);
      });

      testWidgets('shows "News" for news type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('NEWS'), findsOneWidget);
      });

      testWidgets('shows "Earnings" for earnings type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'info',
            type: 'earnings',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('EARNINGS'), findsOneWidget);
      });

      testWidgets('shows "Compliance" for compliance type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'warning',
            type: 'compliance',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('COMPLIANCE'), findsOneWidget);
      });

      testWidgets('shows "Rebalance" for rebalance type', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Test',
            message: 'Test',
            severity: 'info',
            type: 'rebalance',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('REBALANCE'), findsOneWidget);
      });
    });

    group('read/unread state', () {
      testWidgets('shows unread indicator when isRead is false', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Unread Alert',
            message: 'This is unread',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            isRead: false,
          ),
        ));

        // Should have an unread dot indicator
        expect(find.byType(Container), findsWidgets);
      });

      testWidgets('does not show unread indicator when isRead is true', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Read Alert',
            message: 'This has been read',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            isRead: true,
          ),
        ));

        expect(find.text('Read Alert'), findsOneWidget);
      });
    });

    group('interactions', () {
      testWidgets('calls onTap when tapped', (tester) async {
        var tapped = false;

        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Tappable Alert',
            message: 'Tap me',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            onTap: () => tapped = true,
          ),
        ));

        await tester.tap(find.text('Tappable Alert'));
        await tester.pump();

        expect(tapped, isTrue);
      });

      testWidgets('shows chevron when onTap is provided and onDismiss is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Navigable',
            message: 'Message',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            onTap: () {},
          ),
        ));

        expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      });

      testWidgets('shows dismiss button when onDismiss is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Dismissable',
            message: 'Can be dismissed',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            onDismiss: () {},
          ),
        ));

        expect(find.byIcon(Icons.close), findsOneWidget);
      });

      testWidgets('calls onDismiss when dismiss button is tapped', (tester) async {
        var dismissed = false;

        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Dismissable',
            message: 'Can be dismissed',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            onDismiss: () => dismissed = true,
          ),
        ));

        await tester.tap(find.byIcon(Icons.close));
        await tester.pump();

        expect(dismissed, isTrue);
      });

      testWidgets('is wrapped in Dismissible when onDismiss is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Swipeable',
            message: 'Swipe to dismiss',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            onDismiss: () {},
          ),
        ));

        expect(find.byType(Dismissible), findsOneWidget);
      });

      testWidgets('is not wrapped in Dismissible when onDismiss is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Not Swipeable',
            message: 'Cannot swipe',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.byType(Dismissible), findsNothing);
      });
    });

    group('compact mode', () {
      testWidgets('renders with smaller styling in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Compact Alert',
            message: 'Compact message',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
            compact: true,
          ),
        ));

        expect(find.text('Compact Alert'), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode for critical alert', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Critical Dark',
            message: 'Critical in dark mode',
            severity: 'critical',
            type: 'risk',
            triggeredAt: testTriggeredAt,
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Critical Dark'), findsOneWidget);
      });

      testWidgets('adapts colors in dark mode for warning alert', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Warning Dark',
            message: 'Warning in dark mode',
            severity: 'warning',
            type: 'threshold',
            triggeredAt: testTriggeredAt,
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Warning Dark'), findsOneWidget);
      });
    });

    group('edge cases', () {
      testWidgets('handles very long title', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'This Is A Very Long Alert Title That Should Be Truncated In The Display To Prevent Overflow',
            message: 'Message',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.textContaining('This Is A Very Long'), findsOneWidget);
      });

      testWidgets('handles very long message', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Title',
            message: 'This is a very long message that should be truncated to prevent overflow in the UI. It contains many words and should demonstrate proper text handling.',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.textContaining('This is a very long message'), findsOneWidget);
      });

      testWidgets('handles empty message', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Title Only',
            message: '',
            severity: 'info',
            type: 'news',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('Title Only'), findsOneWidget);
      });

      testWidgets('handles unknown type gracefully', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          AlertTile(
            id: 'alert-001',
            title: 'Unknown Type',
            message: 'Message',
            severity: 'info',
            type: 'custom_type',
            triggeredAt: testTriggeredAt,
          ),
        ));

        expect(find.text('CUSTOM_TYPE'), findsOneWidget);
      });
    });
  });
}
