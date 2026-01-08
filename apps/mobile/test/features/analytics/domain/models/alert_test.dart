import 'package:arc_mobile/features/analytics/domain/models/alert.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Alert', () {
    final testDateTime = DateTime.utc(2026, 1, 7, 14, 30);

    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'id': 'alert-001',
          'title': 'Price Alert Triggered',
          'message': 'AAPL has reached your target price',
          'severity': 'warning',
          'type': 'price_target',
          'triggered_at': '2026-01-07T14:30:00.000Z',
        };

        final alert = Alert.fromJson(json);

        expect(alert.id, 'alert-001');
        expect(alert.title, 'Price Alert Triggered');
        expect(alert.message, 'AAPL has reached your target price');
        expect(alert.severity, 'warning');
        expect(alert.type, 'price_target');
        expect(alert.triggeredAt.year, 2026);
        expect(alert.triggeredAt.month, 1);
        expect(alert.triggeredAt.day, 7);
      });

      test('parses optional fields correctly', () {
        final json = {
          'id': 'alert-002',
          'title': 'Portfolio Alert',
          'message': 'Portfolio drift detected',
          'severity': 'critical',
          'type': 'portfolio_drift',
          'triggered_at': '2026-01-07T14:30:00.000Z',
          'is_read': true,
          'is_dismissed': true,
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-001',
          'ticker': 'AAPL',
          'action_url': '/alerts/alert-002',
          'expires_at': '2026-01-14T14:30:00.000Z',
        };

        final alert = Alert.fromJson(json);

        expect(alert.isRead, true);
        expect(alert.isDismissed, true);
        expect(alert.portfolioId, 'portfolio-001');
        expect(alert.securityId, 'security-001');
        expect(alert.ticker, 'AAPL');
        expect(alert.actionUrl, '/alerts/alert-002');
        expect(alert.expiresAt, isNotNull);
        expect(alert.expiresAt!.day, 14);
      });

      test('parses metadata correctly', () {
        final json = {
          'id': 'alert-003',
          'title': 'Test Alert',
          'message': 'Test message',
          'severity': 'info',
          'type': 'news',
          'triggered_at': '2026-01-07T14:30:00.000Z',
          'metadata': {
            'target_price': 200.0,
            'current_price': 205.0,
            'threshold_type': 'above',
          },
        };

        final alert = Alert.fromJson(json);

        expect(alert.metadata, isNotNull);
        expect(alert.metadata!['target_price'], 200.0);
        expect(alert.metadata!['current_price'], 205.0);
        expect(alert.metadata!['threshold_type'], 'above');
      });

      test('defaults isRead to false', () {
        final json = {
          'id': 'alert-004',
          'title': 'Unread Alert',
          'message': 'This is unread',
          'severity': 'info',
          'type': 'news',
          'triggered_at': '2026-01-07T14:30:00.000Z',
        };

        final alert = Alert.fromJson(json);

        expect(alert.isRead, false);
      });

      test('defaults isDismissed to false', () {
        final json = {
          'id': 'alert-005',
          'title': 'Not Dismissed Alert',
          'message': 'This is not dismissed',
          'severity': 'info',
          'type': 'news',
          'triggered_at': '2026-01-07T14:30:00.000Z',
        };

        final alert = Alert.fromJson(json);

        expect(alert.isDismissed, false);
      });

      test('handles null optional fields', () {
        final json = {
          'id': 'alert-006',
          'title': 'Minimal Alert',
          'message': 'Minimal message',
          'severity': 'info',
          'type': 'system',
          'triggered_at': '2026-01-07T14:30:00.000Z',
          'portfolio_id': null,
          'security_id': null,
          'ticker': null,
          'metadata': null,
          'expires_at': null,
          'action_url': null,
        };

        final alert = Alert.fromJson(json);

        expect(alert.portfolioId, isNull);
        expect(alert.securityId, isNull);
        expect(alert.ticker, isNull);
        expect(alert.metadata, isNull);
        expect(alert.expiresAt, isNull);
        expect(alert.actionUrl, isNull);
      });
    });

    group('toJson', () {
      test('serializes required fields correctly', () {
        final alert = Alert(
          id: 'alert-001',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'warning',
          type: 'price_target',
          triggeredAt: testDateTime,
        );

        final json = alert.toJson();

        expect(json['id'], 'alert-001');
        expect(json['title'], 'Test Alert');
        expect(json['message'], 'Test message');
        expect(json['severity'], 'warning');
        expect(json['type'], 'price_target');
        expect(json['triggered_at'], isNotNull);
      });

      test('serializes optional fields correctly', () {
        final alert = Alert(
          id: 'alert-002',
          title: 'Full Alert',
          message: 'Full message',
          severity: 'critical',
          type: 'portfolio_drift',
          triggeredAt: testDateTime,
          isRead: true,
          isDismissed: true,
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          actionUrl: '/alerts/alert-002',
          expiresAt: DateTime.utc(2026, 1, 14),
          metadata: {'key': 'value'},
        );

        final json = alert.toJson();

        expect(json['is_read'], true);
        expect(json['is_dismissed'], true);
        expect(json['portfolio_id'], 'portfolio-001');
        expect(json['security_id'], 'security-001');
        expect(json['ticker'], 'AAPL');
        expect(json['action_url'], '/alerts/alert-002');
        expect(json['expires_at'], isNotNull);
        expect(json['metadata'], {'key': 'value'});
      });

      test('round trip serialization preserves data', () {
        final original = Alert(
          id: 'alert-003',
          title: 'Round Trip Alert',
          message: 'Testing round trip',
          severity: 'warning',
          type: 'price_change',
          triggeredAt: testDateTime,
          isRead: true,
          isDismissed: false,
          portfolioId: 'portfolio-001',
          ticker: 'MSFT',
          metadata: {'change': 5.5},
        );

        final json = original.toJson();
        final restored = Alert.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.title, original.title);
        expect(restored.message, original.message);
        expect(restored.severity, original.severity);
        expect(restored.type, original.type);
        expect(restored.isRead, original.isRead);
        expect(restored.isDismissed, original.isDismissed);
        expect(restored.portfolioId, original.portfolioId);
        expect(restored.ticker, original.ticker);
        expect(restored.metadata, original.metadata);
      });
    });

    group('equality', () {
      test('two alerts with same values are equal', () {
        final alert1 = Alert(
          id: 'alert-001',
          title: 'Test',
          message: 'Message',
          severity: 'info',
          type: 'news',
          triggeredAt: testDateTime,
        );

        final alert2 = Alert(
          id: 'alert-001',
          title: 'Test',
          message: 'Message',
          severity: 'info',
          type: 'news',
          triggeredAt: testDateTime,
        );

        expect(alert1, equals(alert2));
      });

      test('two alerts with different ids are not equal', () {
        final alert1 = Alert(
          id: 'alert-001',
          title: 'Test',
          message: 'Message',
          severity: 'info',
          type: 'news',
          triggeredAt: testDateTime,
        );

        final alert2 = Alert(
          id: 'alert-002',
          title: 'Test',
          message: 'Message',
          severity: 'info',
          type: 'news',
          triggeredAt: testDateTime,
        );

        expect(alert1, isNot(equals(alert2)));
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        final original = Alert(
          id: 'alert-001',
          title: 'Original Title',
          message: 'Original message',
          severity: 'info',
          type: 'news',
          triggeredAt: testDateTime,
          isRead: false,
        );

        final copy = original.copyWith(
          isRead: true,
          title: 'Updated Title',
        );

        expect(copy.id, original.id);
        expect(copy.title, 'Updated Title');
        expect(copy.isRead, true);
        expect(copy.message, original.message);
      });
    });
  });

  group('AlertSeverity', () {
    test('enum values have correct display names', () {
      expect(AlertSeverity.info.displayName, 'Info');
      expect(AlertSeverity.warning.displayName, 'Warning');
      expect(AlertSeverity.critical.displayName, 'Critical');
      expect(AlertSeverity.success.displayName, 'Success');
    });

    test('isHighPriority returns true for warning and critical', () {
      expect(AlertSeverity.warning.isHighPriority, true);
      expect(AlertSeverity.critical.isHighPriority, true);
      expect(AlertSeverity.info.isHighPriority, false);
      expect(AlertSeverity.success.isHighPriority, false);
    });

    test('all enum values are accounted for', () {
      expect(AlertSeverity.values.length, 4);
    });
  });

  group('AlertType', () {
    test('enum values have correct display names', () {
      expect(AlertType.priceTarget.displayName, 'Price Target');
      expect(AlertType.priceChange.displayName, 'Price Change');
      expect(AlertType.portfolioDrift.displayName, 'Portfolio Drift');
      expect(AlertType.dividend.displayName, 'Dividend');
      expect(AlertType.earnings.displayName, 'Earnings');
      expect(AlertType.news.displayName, 'News');
      expect(AlertType.market.displayName, 'Market');
      expect(AlertType.risk.displayName, 'Risk Alert');
      expect(AlertType.compliance.displayName, 'Compliance');
      expect(AlertType.system.displayName, 'System');
      expect(AlertType.other.displayName, 'Other');
    });

    test('all enum values are accounted for', () {
      expect(AlertType.values.length, 11);
    });
  });
}
