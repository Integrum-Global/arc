// Basic Flutter widget test for ARC Investment Platform mobile app.

import 'package:arc_mobile/core/design/design_system.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Design System', () {
    test('AppColors has correct primary color', () {
      expect(AppColors.primary, const Color(0xFF1976D2));
    });

    test('AppColors has all required colors', () {
      expect(AppColors.success, isNotNull);
      expect(AppColors.warning, isNotNull);
      expect(AppColors.error, isNotNull);
      expect(AppColors.info, isNotNull);
    });

    test('AppTypography has all text styles', () {
      expect(AppTypography.h1, isNotNull);
      expect(AppTypography.bodyMedium, isNotNull);
      expect(AppTypography.labelSmall, isNotNull);
    });

    test('AppSpacing has correct values', () {
      expect(AppSpacing.xs, 4);
      expect(AppSpacing.sm, 8);
      expect(AppSpacing.md, 16);
      expect(AppSpacing.lg, 24);
    });
  });

  group('Widgets', () {
    testWidgets('AppButton renders correctly', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              label: 'Test Button',
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.text('Test Button'), findsOneWidget);
    });

    testWidgets('AppCard renders correctly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppCard(
              child: Text('Card Content'),
            ),
          ),
        ),
      );

      expect(find.text('Card Content'), findsOneWidget);
    });
  });
}
