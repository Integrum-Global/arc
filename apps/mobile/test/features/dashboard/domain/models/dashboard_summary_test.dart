import 'package:arc_mobile/features/dashboard/domain/models/dashboard_summary.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DashboardSummary', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'total_value': 1500000.50,
          'daily_change': 15000.25,
          'daily_change_pct': 1.01,
          'alerts_count': 5,
          'allocation': {
            'Equities': 0.60,
            'Fixed Income': 0.30,
            'Cash': 0.10,
          },
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.totalValue, 1500000.50);
        expect(summary.dailyChange, 15000.25);
        expect(summary.dailyChangePct, 1.01);
        expect(summary.alertsCount, 5);
        expect(summary.allocation['Equities'], 0.60);
        expect(summary.allocation['Fixed Income'], 0.30);
        expect(summary.allocation['Cash'], 0.10);
      });

      test('parses optional count fields correctly', () {
        final json = <String, dynamic>{
          'total_value': 1000000.0,
          'daily_change': 0.0,
          'daily_change_pct': 0.0,
          'alerts_count': 0,
          'allocation': <String, dynamic>{},
          'portfolio_count': 5,
          'holdings_count': 25,
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.portfolioCount, 5);
        expect(summary.holdingsCount, 25);
      });

      test('parses optional return fields correctly', () {
        final json = <String, dynamic>{
          'total_value': 2000000.0,
          'daily_change': 20000.0,
          'daily_change_pct': 1.0,
          'alerts_count': 3,
          'allocation': <String, dynamic>{},
          'ytd_return': 12.5,
          'mtd_return': 2.3,
          'wtd_return': 0.8,
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.ytdReturn, 12.5);
        expect(summary.mtdReturn, 2.3);
        expect(summary.wtdReturn, 0.8);
      });

      test('parses optional P&L fields correctly', () {
        final json = <String, dynamic>{
          'total_value': 1500000.0,
          'daily_change': 15000.0,
          'daily_change_pct': 1.0,
          'alerts_count': 2,
          'allocation': <String, dynamic>{},
          'total_unrealized_pnl': 250000.0,
          'total_unrealized_pnl_pct': 20.0,
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.totalUnrealizedPnl, 250000.0);
        expect(summary.totalUnrealizedPnlPct, 20.0);
      });

      test('parses lastUpdated correctly', () {
        final json = <String, dynamic>{
          'total_value': 1000000.0,
          'daily_change': 0.0,
          'daily_change_pct': 0.0,
          'alerts_count': 0,
          'allocation': <String, dynamic>{},
          'last_updated': '2026-01-07T14:30:00.000Z',
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.lastUpdated, isNotNull);
        expect(summary.lastUpdated!.year, 2026);
        expect(summary.lastUpdated!.month, 1);
        expect(summary.lastUpdated!.day, 7);
      });

      test('defaults count fields to 0', () {
        final json = <String, dynamic>{
          'total_value': 1000000.0,
          'daily_change': 0.0,
          'daily_change_pct': 0.0,
          'alerts_count': 0,
          'allocation': <String, dynamic>{},
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.portfolioCount, 0);
        expect(summary.holdingsCount, 0);
      });

      test('handles negative values', () {
        final json = {
          'total_value': 900000.0,
          'daily_change': -10000.0,
          'daily_change_pct': -1.1,
          'alerts_count': 1,
          'allocation': {'Cash': 1.0},
          'ytd_return': -5.5,
          'total_unrealized_pnl': -50000.0,
          'total_unrealized_pnl_pct': -5.0,
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.dailyChange, -10000.0);
        expect(summary.dailyChangePct, -1.1);
        expect(summary.ytdReturn, -5.5);
        expect(summary.totalUnrealizedPnl, -50000.0);
        expect(summary.totalUnrealizedPnlPct, -5.0);
      });

      test('handles empty allocation', () {
        final json = <String, dynamic>{
          'total_value': 0.0,
          'daily_change': 0.0,
          'daily_change_pct': 0.0,
          'alerts_count': 0,
          'allocation': <String, dynamic>{},
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.allocation, isEmpty);
      });

      test('handles null optional fields', () {
        final json = <String, dynamic>{
          'total_value': 1000000.0,
          'daily_change': 0.0,
          'daily_change_pct': 0.0,
          'alerts_count': 0,
          'allocation': <String, dynamic>{},
          'ytd_return': null,
          'mtd_return': null,
          'wtd_return': null,
          'total_unrealized_pnl': null,
          'total_unrealized_pnl_pct': null,
          'last_updated': null,
        };

        final summary = DashboardSummary.fromJson(json);

        expect(summary.ytdReturn, isNull);
        expect(summary.mtdReturn, isNull);
        expect(summary.wtdReturn, isNull);
        expect(summary.totalUnrealizedPnl, isNull);
        expect(summary.totalUnrealizedPnlPct, isNull);
        expect(summary.lastUpdated, isNull);
      });
    });

    group('toJson', () {
      test('serializes required fields correctly', () {
        const summary = DashboardSummary(
          totalValue: 1500000.50,
          dailyChange: 15000.25,
          dailyChangePct: 1.01,
          alertsCount: 5,
          allocation: {'Equities': 0.60, 'Bonds': 0.40},
        );

        final json = summary.toJson();

        expect(json['total_value'], 1500000.50);
        expect(json['daily_change'], 15000.25);
        expect(json['daily_change_pct'], 1.01);
        expect(json['alerts_count'], 5);
        expect(json['allocation'], {'Equities': 0.60, 'Bonds': 0.40});
      });

      test('round trip serialization preserves data', () {
        final original = DashboardSummary(
          totalValue: 2500000.0,
          dailyChange: 25000.0,
          dailyChangePct: 1.0,
          alertsCount: 10,
          allocation: {'Equities': 0.50, 'Bonds': 0.30, 'Cash': 0.20},
          portfolioCount: 3,
          holdingsCount: 50,
          ytdReturn: 15.5,
          mtdReturn: 3.2,
          wtdReturn: 1.1,
          totalUnrealizedPnl: 300000.0,
          totalUnrealizedPnlPct: 13.6,
          lastUpdated: DateTime.utc(2026, 1, 7, 14, 30),
        );

        final json = original.toJson();
        final restored = DashboardSummary.fromJson(json);

        expect(restored.totalValue, original.totalValue);
        expect(restored.dailyChange, original.dailyChange);
        expect(restored.dailyChangePct, original.dailyChangePct);
        expect(restored.alertsCount, original.alertsCount);
        expect(restored.allocation, original.allocation);
        expect(restored.portfolioCount, original.portfolioCount);
        expect(restored.holdingsCount, original.holdingsCount);
        expect(restored.ytdReturn, original.ytdReturn);
        expect(restored.mtdReturn, original.mtdReturn);
        expect(restored.wtdReturn, original.wtdReturn);
        expect(restored.totalUnrealizedPnl, original.totalUnrealizedPnl);
        expect(restored.totalUnrealizedPnlPct, original.totalUnrealizedPnlPct);
      });
    });

    group('equality', () {
      test('two summaries with same values are equal', () {
        const summary1 = DashboardSummary(
          totalValue: 1000000.0,
          dailyChange: 10000.0,
          dailyChangePct: 1.0,
          alertsCount: 5,
          allocation: {'Equities': 0.60},
        );

        const summary2 = DashboardSummary(
          totalValue: 1000000.0,
          dailyChange: 10000.0,
          dailyChangePct: 1.0,
          alertsCount: 5,
          allocation: {'Equities': 0.60},
        );

        expect(summary1, equals(summary2));
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        const original = DashboardSummary(
          totalValue: 1000000.0,
          dailyChange: 10000.0,
          dailyChangePct: 1.0,
          alertsCount: 5,
          allocation: {'Equities': 0.60},
        );

        final copy = original.copyWith(
          totalValue: 1100000.0,
          alertsCount: 3,
        );

        expect(copy.totalValue, 1100000.0);
        expect(copy.alertsCount, 3);
        expect(copy.dailyChange, original.dailyChange);
        expect(copy.allocation, original.allocation);
      });
    });
  });

  group('PerformancePoint', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'date': '2026-01-07T00:00:00.000Z',
          'value': 1500000.0,
        };

        final point = PerformancePoint.fromJson(json);

        expect(point.date.year, 2026);
        expect(point.date.month, 1);
        expect(point.date.day, 7);
        expect(point.value, 1500000.0);
      });

      test('parses optional fields correctly', () {
        final json = {
          'date': '2026-01-07T00:00:00.000Z',
          'value': 1500000.0,
          'return_pct': 5.5,
          'benchmark_value': 1480000.0,
          'benchmark_return_pct': 5.0,
        };

        final point = PerformancePoint.fromJson(json);

        expect(point.returnPct, 5.5);
        expect(point.benchmarkValue, 1480000.0);
        expect(point.benchmarkReturnPct, 5.0);
      });
    });

    group('toJson', () {
      test('round trip serialization preserves data', () {
        final original = PerformancePoint(
          date: DateTime.utc(2026, 1, 7),
          value: 1500000.0,
          returnPct: 5.5,
          benchmarkValue: 1480000.0,
          benchmarkReturnPct: 5.0,
        );

        final json = original.toJson();
        final restored = PerformancePoint.fromJson(json);

        expect(restored.value, original.value);
        expect(restored.returnPct, original.returnPct);
        expect(restored.benchmarkValue, original.benchmarkValue);
        expect(restored.benchmarkReturnPct, original.benchmarkReturnPct);
      });
    });
  });

  group('PerformanceData', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'period': '1M',
          'start_value': 1400000.0,
          'end_value': 1500000.0,
          'total_return_pct': 7.14,
        };

        final data = PerformanceData.fromJson(json);

        expect(data.period, '1M');
        expect(data.startValue, 1400000.0);
        expect(data.endValue, 1500000.0);
        expect(data.totalReturnPct, 7.14);
      });

      test('parses points array correctly', () {
        final json = {
          'period': '1W',
          'start_value': 1000000.0,
          'end_value': 1050000.0,
          'total_return_pct': 5.0,
          'points': [
            {'date': '2026-01-01T00:00:00.000Z', 'value': 1000000.0},
            {'date': '2026-01-02T00:00:00.000Z', 'value': 1020000.0},
            {'date': '2026-01-03T00:00:00.000Z', 'value': 1050000.0},
          ],
        };

        final data = PerformanceData.fromJson(json);

        expect(data.points.length, 3);
        expect(data.points[0].value, 1000000.0);
        expect(data.points[2].value, 1050000.0);
      });

      test('parses optional fields correctly', () {
        final json = {
          'period': 'YTD',
          'start_value': 1000000.0,
          'end_value': 1150000.0,
          'total_return_pct': 15.0,
          'benchmark_label': 'S&P 500',
          'start_date': '2026-01-01T00:00:00.000Z',
          'end_date': '2026-01-07T00:00:00.000Z',
        };

        final data = PerformanceData.fromJson(json);

        expect(data.benchmarkLabel, 'S&P 500');
        expect(data.startDate, isNotNull);
        expect(data.endDate, isNotNull);
      });

      test('defaults points to empty list', () {
        final json = {
          'period': '1D',
          'start_value': 1000000.0,
          'end_value': 1000000.0,
          'total_return_pct': 0.0,
        };

        final data = PerformanceData.fromJson(json);

        expect(data.points, isEmpty);
      });
    });

    group('toJson', () {
      test('round trip serialization preserves data', () {
        final original = PerformanceData(
          period: '3M',
          startValue: 1200000.0,
          endValue: 1350000.0,
          totalReturnPct: 12.5,
          points: [
            PerformancePoint(date: DateTime.utc(2026, 1, 1), value: 1200000.0),
            PerformancePoint(date: DateTime.utc(2026, 1, 15), value: 1275000.0),
          ],
          benchmarkLabel: 'Russell 2000',
        );

        final json = original.toJson();
        final restored = PerformanceData.fromJson(json);

        expect(restored.period, original.period);
        expect(restored.startValue, original.startValue);
        expect(restored.endValue, original.endValue);
        expect(restored.totalReturnPct, original.totalReturnPct);
        expect(restored.points.length, original.points.length);
        expect(restored.benchmarkLabel, original.benchmarkLabel);
      });
    });
  });

  group('ActivityItem', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'id': 'activity-001',
          'type': 'trade',
          'title': 'Buy Order Executed',
          'timestamp': '2026-01-07T14:30:00.000Z',
        };

        final item = ActivityItem.fromJson(json);

        expect(item.id, 'activity-001');
        expect(item.type, 'trade');
        expect(item.title, 'Buy Order Executed');
        expect(item.timestamp.year, 2026);
      });

      test('parses optional fields correctly', () {
        final json = {
          'id': 'activity-002',
          'type': 'dividend',
          'title': 'Dividend Received',
          'timestamp': '2026-01-07T10:00:00.000Z',
          'description': 'AAPL Q1 2026 dividend',
          'portfolio_id': 'portfolio-001',
          'ticker': 'AAPL',
          'amount': 250.0,
          'icon': 'attach_money',
          'action_url': '/activity/activity-002',
        };

        final item = ActivityItem.fromJson(json);

        expect(item.description, 'AAPL Q1 2026 dividend');
        expect(item.portfolioId, 'portfolio-001');
        expect(item.ticker, 'AAPL');
        expect(item.amount, 250.0);
        expect(item.icon, 'attach_money');
        expect(item.actionUrl, '/activity/activity-002');
      });
    });

    group('toJson', () {
      test('round trip serialization preserves data', () {
        final original = ActivityItem(
          id: 'activity-003',
          type: 'deposit',
          title: 'Funds Deposited',
          timestamp: DateTime.utc(2026, 1, 7, 9, 0),
          description: 'Wire transfer received',
          amount: 10000.0,
        );

        final json = original.toJson();
        final restored = ActivityItem.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.type, original.type);
        expect(restored.title, original.title);
        expect(restored.description, original.description);
        expect(restored.amount, original.amount);
      });
    });
  });

  group('ActivityType', () {
    test('enum values have correct display names', () {
      expect(ActivityType.trade.displayName, 'Trade');
      expect(ActivityType.dividend.displayName, 'Dividend');
      expect(ActivityType.deposit.displayName, 'Deposit');
      expect(ActivityType.withdrawal.displayName, 'Withdrawal');
      expect(ActivityType.alert.displayName, 'Alert');
      expect(ActivityType.news.displayName, 'News');
      expect(ActivityType.priceAlert.displayName, 'Price Alert');
      expect(ActivityType.portfolioUpdate.displayName, 'Portfolio Update');
      expect(ActivityType.marketOpen.displayName, 'Market Open');
      expect(ActivityType.marketClose.displayName, 'Market Close');
      expect(ActivityType.other.displayName, 'Other');
    });

    test('all enum values are accounted for', () {
      expect(ActivityType.values.length, 11);
    });
  });

  group('TimePeriod', () {
    test('enum values have correct codes and display names', () {
      expect(TimePeriod.oneDay.code, '1D');
      expect(TimePeriod.oneDay.displayName, '1 Day');

      expect(TimePeriod.oneWeek.code, '1W');
      expect(TimePeriod.oneWeek.displayName, '1 Week');

      expect(TimePeriod.oneMonth.code, '1M');
      expect(TimePeriod.oneMonth.displayName, '1 Month');

      expect(TimePeriod.threeMonths.code, '3M');
      expect(TimePeriod.threeMonths.displayName, '3 Months');

      expect(TimePeriod.sixMonths.code, '6M');
      expect(TimePeriod.sixMonths.displayName, '6 Months');

      expect(TimePeriod.oneYear.code, '1Y');
      expect(TimePeriod.oneYear.displayName, '1 Year');

      expect(TimePeriod.ytd.code, 'YTD');
      expect(TimePeriod.ytd.displayName, 'Year to Date');

      expect(TimePeriod.threeYears.code, '3Y');
      expect(TimePeriod.threeYears.displayName, '3 Years');

      expect(TimePeriod.fiveYears.code, '5Y');
      expect(TimePeriod.fiveYears.displayName, '5 Years');

      expect(TimePeriod.all.code, 'ALL');
      expect(TimePeriod.all.displayName, 'All Time');
    });

    test('all enum values are accounted for', () {
      expect(TimePeriod.values.length, 10);
    });
  });
}
