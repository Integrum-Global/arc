import 'package:arc_mobile/core/utils/formatters.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Formatters', () {
    group('currency', () {
      test('formats positive amounts with dollar sign and commas', () {
        expect(Formatters.currency(1234567.89), '\$1,234,567.89');
      });

      test('formats zero correctly', () {
        expect(Formatters.currency(0), '\$0.00');
      });

      test('formats negative amounts with minus sign', () {
        expect(Formatters.currency(-1234.56), '-\$1,234.56');
      });

      test('formats small amounts without commas', () {
        expect(Formatters.currency(123.45), '\$123.45');
      });

      test('respects custom decimal places', () {
        expect(Formatters.currency(1234.5678, decimals: 0), '\$1,235');
        expect(Formatters.currency(1234.5678, decimals: 4), '\$1,234.5678');
      });

      test('respects custom currency symbol', () {
        expect(Formatters.currency(1234.56, symbol: 'EUR'), 'EUR1,234.56');
        expect(Formatters.currency(1234.56, symbol: ''), '1,234.56');
      });

      test('handles very large amounts', () {
        expect(Formatters.currency(999999999999.99), '\$999,999,999,999.99');
      });

      test('handles very small fractional amounts', () {
        expect(Formatters.currency(0.01), '\$0.01');
        expect(Formatters.currency(0.001, decimals: 3), '\$0.001');
      });
    });

    group('currencyCompact', () {
      test('formats millions with M suffix', () {
        expect(Formatters.currencyCompact(1234567), '\$1.23M');
        expect(Formatters.currencyCompact(5500000), '\$5.5M');
      });

      test('formats thousands with K suffix', () {
        expect(Formatters.currencyCompact(456000), '\$456K');
        expect(Formatters.currencyCompact(1500), '\$1.5K');
      });

      test('formats billions with B suffix', () {
        expect(Formatters.currencyCompact(1234567890), '\$1.23B');
      });

      test('formats amounts under 1000 without suffix', () {
        expect(Formatters.currencyCompact(999), '\$999');
        expect(Formatters.currencyCompact(100), '\$100');
      });

      test('handles negative compact values', () {
        expect(Formatters.currencyCompact(-1234567), '-\$1.23M');
      });

      test('respects custom currency symbol', () {
        expect(Formatters.currencyCompact(1234567, symbol: 'EUR'), 'EUR1.23M');
      });
    });

    group('percent', () {
      test('converts decimal to percentage format', () {
        expect(Formatters.percent(0.1234), '12.34%');
      });

      test('handles zero', () {
        expect(Formatters.percent(0), '0.00%');
      });

      test('handles negative percentages', () {
        expect(Formatters.percent(-0.1234), '-12.34%');
      });

      test('handles 100%', () {
        expect(Formatters.percent(1.0), '100.00%');
      });

      test('respects custom decimal places', () {
        expect(Formatters.percent(0.12345, decimals: 1), '12.3%');
        expect(Formatters.percent(0.12345, decimals: 0), '12%');
      });

      test('handles values over 100%', () {
        expect(Formatters.percent(2.5), '250.00%');
      });

      test('handles very small percentages', () {
        expect(Formatters.percent(0.0001), '0.01%');
      });
    });

    group('percentChange', () {
      test('adds plus sign for positive values', () {
        expect(Formatters.percentChange(12.34), '+12.34%');
      });

      test('keeps minus sign for negative values', () {
        expect(Formatters.percentChange(-12.34), '-12.34%');
      });

      test('shows plus sign for zero', () {
        expect(Formatters.percentChange(0), '+0.00%');
      });

      test('respects custom decimal places', () {
        expect(Formatters.percentChange(12.345, decimals: 1), '+12.3%');
        expect(Formatters.percentChange(-12.345, decimals: 0), '-12%');
      });

      test('handles very small changes', () {
        expect(Formatters.percentChange(0.01), '+0.01%');
        expect(Formatters.percentChange(-0.01), '-0.01%');
      });

      test('handles large changes', () {
        expect(Formatters.percentChange(500.0), '+500.00%');
        expect(Formatters.percentChange(-99.99), '-99.99%');
      });
    });

    group('number', () {
      test('adds thousands separators', () {
        expect(Formatters.number(1234567), '1,234,567');
      });

      test('handles zero', () {
        expect(Formatters.number(0), '0');
      });

      test('handles negative numbers', () {
        expect(Formatters.number(-1234567), '-1,234,567');
      });

      test('rounds to nearest integer by default', () {
        expect(Formatters.number(1234.5), '1,235');
        expect(Formatters.number(1234.4), '1,234');
      });

      test('respects custom decimal places', () {
        expect(Formatters.number(1234.5678, decimals: 2), '1,234.57');
        expect(Formatters.number(1234, decimals: 2), '1,234.00');
      });

      test('handles small numbers without commas', () {
        expect(Formatters.number(999), '999');
        expect(Formatters.number(100), '100');
      });
    });

    group('numberCompact', () {
      test('formats millions with M suffix', () {
        expect(Formatters.numberCompact(1234567), '1.23M');
      });

      test('formats thousands with K suffix', () {
        expect(Formatters.numberCompact(45600), '45.6K');
      });

      test('formats small numbers without suffix', () {
        expect(Formatters.numberCompact(999), '999');
      });

      test('handles negative values', () {
        expect(Formatters.numberCompact(-5000000), '-5M');
      });

      test('formats billions', () {
        expect(Formatters.numberCompact(2500000000), '2.5B');
      });
    });

    group('date', () {
      test('formats date in MMM d, yyyy format', () {
        expect(Formatters.date(DateTime(2026, 1, 7)), 'Jan 7, 2026');
        expect(Formatters.date(DateTime(2025, 12, 25)), 'Dec 25, 2025');
      });

      test('handles single digit days', () {
        expect(Formatters.date(DateTime(2026, 3, 5)), 'Mar 5, 2026');
      });

      test('handles all months correctly', () {
        expect(Formatters.date(DateTime(2026, 6, 15)), 'Jun 15, 2026');
        expect(Formatters.date(DateTime(2026, 11, 20)), 'Nov 20, 2026');
      });
    });

    group('dateShort', () {
      test('formats date in M/d/yy format', () {
        expect(Formatters.dateShort(DateTime(2026, 1, 7)), '1/7/26');
        expect(Formatters.dateShort(DateTime(2025, 12, 25)), '12/25/25');
      });

      test('handles single digit months and days', () {
        expect(Formatters.dateShort(DateTime(2026, 3, 5)), '3/5/26');
      });
    });

    group('dateTime', () {
      test('formats date and time correctly', () {
        expect(
          Formatters.dateTime(DateTime(2026, 1, 7, 16, 30)),
          'Jan 7, 2026 4:30 PM',
        );
      });

      test('handles midnight correctly', () {
        expect(
          Formatters.dateTime(DateTime(2026, 1, 7, 0, 0)),
          'Jan 7, 2026 12:00 AM',
        );
      });

      test('handles noon correctly', () {
        expect(
          Formatters.dateTime(DateTime(2026, 1, 7, 12, 0)),
          'Jan 7, 2026 12:00 PM',
        );
      });

      test('handles minutes with leading zeros', () {
        expect(
          Formatters.dateTime(DateTime(2026, 1, 7, 9, 5)),
          'Jan 7, 2026 9:05 AM',
        );
      });
    });

    group('relativeTime', () {
      test('shows "Just now" for recent times', () {
        final now = DateTime.now();
        expect(Formatters.relativeTime(now), 'Just now');
        expect(
          Formatters.relativeTime(now.subtract(const Duration(seconds: 30))),
          'Just now',
        );
      });

      test('shows minutes for times under an hour', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.subtract(const Duration(minutes: 5))),
          '5m ago',
        );
        expect(
          Formatters.relativeTime(now.subtract(const Duration(minutes: 45))),
          '45m ago',
        );
      });

      test('shows hours for times under a day', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.subtract(const Duration(hours: 2))),
          '2h ago',
        );
        expect(
          Formatters.relativeTime(now.subtract(const Duration(hours: 23))),
          '23h ago',
        );
      });

      test('shows "Yesterday" for one day ago', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.subtract(const Duration(hours: 25))),
          'Yesterday',
        );
      });

      test('shows days for times under a week', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.subtract(const Duration(days: 3))),
          '3d ago',
        );
        expect(
          Formatters.relativeTime(now.subtract(const Duration(days: 6))),
          '6d ago',
        );
      });

      test('shows month and day for times over a week but within a year', () {
        final now = DateTime.now();
        final twoWeeksAgo = now.subtract(const Duration(days: 14));
        final result = Formatters.relativeTime(twoWeeksAgo);
        // Should be in format like "Jan 7" or "Dec 25"
        expect(result, matches(RegExp(r'^[A-Z][a-z]{2} \d{1,2}$')));
      });

      test('shows full date for times over a year', () {
        final now = DateTime.now();
        final twoYearsAgo = now.subtract(const Duration(days: 400));
        final result = Formatters.relativeTime(twoYearsAgo);
        // Should be in format like "Jan 7, 2024"
        expect(result, matches(RegExp(r'^[A-Z][a-z]{2} \d{1,2}, \d{4}$')));
      });

      test('handles future times with "In" prefix', () {
        final now = DateTime.now();
        // Use regex to allow for timing variations (29-31m, 1-2h)
        final minutes30Result = Formatters.relativeTime(now.add(const Duration(minutes: 30)));
        expect(minutes30Result, matches(RegExp(r'^In (29|30|31)m$')));

        final hours2Result = Formatters.relativeTime(now.add(const Duration(hours: 2)));
        expect(hours2Result, matches(RegExp(r'^In [12]h$')));
      });

      test('shows "Tomorrow" for one day in future', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.add(const Duration(hours: 25))),
          'Tomorrow',
        );
      });

      test('shows "In a moment" for very near future', () {
        final now = DateTime.now();
        expect(
          Formatters.relativeTime(now.add(const Duration(seconds: 30))),
          'In a moment',
        );
      });
    });

    group('quantity', () {
      test('shows integers without decimals', () {
        expect(Formatters.quantity(100.0), '100');
        expect(Formatters.quantity(1.0), '1');
        expect(Formatters.quantity(0.0), '0');
      });

      test('shows fractional quantities with precision', () {
        expect(Formatters.quantity(100.5), '100.5');
        expect(Formatters.quantity(100.25), '100.25');
      });

      test('removes trailing zeros', () {
        expect(Formatters.quantity(100.5000), '100.5');
        expect(Formatters.quantity(100.1234), '100.1234');
      });

      test('handles very small quantities', () {
        expect(Formatters.quantity(0.0001), '0.0001');
        expect(Formatters.quantity(0.5), '0.5');
      });

      test('handles large quantities', () {
        expect(Formatters.quantity(10000.0), '10000');
        expect(Formatters.quantity(10000.5), '10000.5');
      });
    });

    group('basisPoints', () {
      test('converts basis points to percentage', () {
        expect(Formatters.basisPoints(125), '1.25%');
        expect(Formatters.basisPoints(100), '1.00%');
        expect(Formatters.basisPoints(50), '0.50%');
      });

      test('handles zero basis points', () {
        expect(Formatters.basisPoints(0), '0.00%');
      });

      test('handles fractional basis points', () {
        expect(Formatters.basisPoints(12.5), '0.13%');
      });

      test('handles large basis point values', () {
        expect(Formatters.basisPoints(1000), '10.00%');
        expect(Formatters.basisPoints(500), '5.00%');
      });

      test('handles negative basis points', () {
        expect(Formatters.basisPoints(-125), '-1.25%');
      });
    });
  });
}
