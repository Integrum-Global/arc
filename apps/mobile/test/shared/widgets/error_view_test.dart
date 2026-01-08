import 'package:arc_mobile/core/api/api_exceptions.dart';
import 'package:arc_mobile/core/design/design_system.dart';
import 'package:arc_mobile/shared/widgets/error_view.dart';
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

  group('ErrorView', () {
    group('generic errors', () {
      testWidgets('displays generic error message for unknown errors', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Something went wrong'),
          ),
        ));

        expect(find.text('Something went wrong'), findsOneWidget);
        expect(find.text('An unexpected error occurred. Please try again.'), findsOneWidget);
        expect(find.byIcon(Icons.error_outline), findsOneWidget);
      });

      testWidgets('shows technical details when showDetails is true', (tester) async {
        final error = Exception('Technical error details');

        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: error,
            showDetails: true,
          ),
        ));

        expect(find.textContaining('Technical error details'), findsWidgets);
      });
    });

    group('API exceptions', () {
      testWidgets('displays network error with wifi icon', (tester) async {
        const error = ApiException(
          message: 'Unable to connect. Please check your internet connection.',
          code: 'CONNECTION_ERROR',
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(error: error),
        ));

        expect(find.text('Connection Error'), findsOneWidget);
        expect(find.byIcon(Icons.wifi_off_outlined), findsOneWidget);
      });

      testWidgets('displays auth error with lock icon', (tester) async {
        const error = ApiException(
          message: 'Session expired. Please log in again.',
          statusCode: 401,
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(error: error),
        ));

        expect(find.text('Access Denied'), findsOneWidget);
        expect(find.byIcon(Icons.lock_outline), findsOneWidget);
      });

      testWidgets('displays server error with cloud icon', (tester) async {
        const error = ApiException(
          message: 'Server error. Please try again later.',
          statusCode: 500,
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(error: error),
        ));

        expect(find.text('Server Error'), findsOneWidget);
        expect(find.byIcon(Icons.cloud_off_outlined), findsOneWidget);
      });

      testWidgets('shows status code in details when available', (tester) async {
        const error = ApiException(
          message: 'Server error',
          statusCode: 503,
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(
            error: error,
            showDetails: true,
          ),
        ));

        expect(find.textContaining('503'), findsWidgets);
      });
    });

    group('Cache exceptions', () {
      testWidgets('displays cache error with storage icon', (tester) async {
        const error = CacheException(
          message: 'Failed to read cached data.',
          code: 'CACHE_READ_ERROR',
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(error: error),
        ));

        expect(find.text('Cache Error'), findsOneWidget);
        expect(find.byIcon(Icons.storage_outlined), findsOneWidget);
      });
    });

    group('Validation exceptions', () {
      testWidgets('displays validation error', (tester) async {
        const error = ValidationException(
          message: 'Invalid input provided.',
        );

        await tester.pumpWidget(buildTestWidget(
          const ErrorView(error: error),
        ));

        expect(find.text('Validation Error'), findsOneWidget);
        expect(find.text('Invalid input provided.'), findsOneWidget);
      });
    });

    group('Auth exceptions', () {
      testWidgets('displays auth error with lock icon', (tester) async {
        final error = AuthException.sessionExpired();

        await tester.pumpWidget(buildTestWidget(
          ErrorView(error: error),
        ));

        expect(find.text('Authentication Required'), findsOneWidget);
        expect(find.byIcon(Icons.lock_outline), findsOneWidget);
      });
    });

    group('Not found exceptions', () {
      testWidgets('displays not found error with search icon', (tester) async {
        final error = NotFoundException.resource('Portfolio', 'abc123');

        await tester.pumpWidget(buildTestWidget(
          ErrorView(error: error),
        ));

        expect(find.text('Not Found'), findsOneWidget);
        expect(find.text('Portfolio not found.'), findsOneWidget);
        expect(find.byIcon(Icons.search_off_outlined), findsOneWidget);
      });
    });

    group('retry button', () {
      testWidgets('displays retry button when onRetry is provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Error'),
            onRetry: () {},
          ),
        ));

        expect(find.text('Try Again'), findsOneWidget);
        expect(find.byIcon(Icons.refresh), findsOneWidget);
      });

      testWidgets('calls onRetry when retry button is tapped', (tester) async {
        var retried = false;

        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Error'),
            onRetry: () => retried = true,
          ),
        ));

        await tester.tap(find.text('Try Again'));
        await tester.pump();

        expect(retried, isTrue);
      });

      testWidgets('uses custom retry label when provided', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Error'),
            onRetry: () {},
            retryLabel: 'Refresh Data',
          ),
        ));

        expect(find.text('Refresh Data'), findsOneWidget);
        expect(find.text('Try Again'), findsNothing);
      });

      testWidgets('does not display retry button when onRetry is null', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Error'),
          ),
        ));

        expect(find.text('Try Again'), findsNothing);
        expect(find.byType(AppButton), findsNothing);
      });
    });

    group('compact mode', () {
      testWidgets('uses smaller spacing in compact mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Compact error'),
            compact: true,
          ),
        ));

        expect(find.text('Something went wrong'), findsOneWidget);
      });
    });

    group('dark mode support', () {
      testWidgets('adapts colors in dark mode', (tester) async {
        await tester.pumpWidget(buildTestWidget(
          ErrorView(
            error: Exception('Dark mode error'),
            onRetry: () {},
          ),
          themeMode: ThemeMode.dark,
        ));

        expect(find.text('Something went wrong'), findsOneWidget);
      });
    });
  });

  group('InlineError', () {
    testWidgets('displays error message', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const InlineError(message: 'Field is required'),
      ));

      expect(find.text('Field is required'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('shows chevron when onTap is provided', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        InlineError(
          message: 'Tap for details',
          onTap: () {},
        ),
      ));

      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;

      await tester.pumpWidget(buildTestWidget(
        InlineError(
          message: 'Tappable error',
          onTap: () => tapped = true,
        ),
      ));

      await tester.tap(find.text('Tappable error'));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('does not show chevron when onTap is null', (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const InlineError(message: 'Static error'),
      ));

      expect(find.byIcon(Icons.chevron_right), findsNothing);
    });
  });
}
