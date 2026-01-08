import 'package:arc_mobile/features/portfolio/domain/models/portfolio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Portfolio', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'id': 'portfolio-001',
          'name': 'Growth Portfolio',
          'code': 'GROWTH',
          'portfolio_type': 'individual',
          'base_currency': 'USD',
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.id, 'portfolio-001');
        expect(portfolio.name, 'Growth Portfolio');
        expect(portfolio.code, 'GROWTH');
        expect(portfolio.portfolioType, 'individual');
        expect(portfolio.baseCurrency, 'USD');
      });

      test('parses optional numeric fields correctly', () {
        final json = {
          'id': 'portfolio-002',
          'name': 'Test Portfolio',
          'code': 'TEST',
          'portfolio_type': 'joint',
          'base_currency': 'EUR',
          'total_value': 1234567.89,
          'day_change': 1234.56,
          'day_change_percent': 0.1,
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.totalValue, 1234567.89);
        expect(portfolio.dayChange, 1234.56);
        expect(portfolio.dayChangePercent, 0.1);
      });

      test('parses DateTime fields correctly', () {
        final json = {
          'id': 'portfolio-003',
          'name': 'Dated Portfolio',
          'code': 'DATE',
          'portfolio_type': 'ira',
          'base_currency': 'USD',
          'created_at': '2026-01-01T10:00:00.000Z',
          'updated_at': '2026-01-07T14:30:00.000Z',
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.createdAt, isNotNull);
        expect(portfolio.createdAt!.year, 2026);
        expect(portfolio.createdAt!.month, 1);
        expect(portfolio.createdAt!.day, 1);
        expect(portfolio.updatedAt, isNotNull);
        expect(portfolio.updatedAt!.year, 2026);
        expect(portfolio.updatedAt!.month, 1);
        expect(portfolio.updatedAt!.day, 7);
      });

      test('defaults active to true', () {
        final json = {
          'id': 'portfolio-004',
          'name': 'Active Portfolio',
          'code': 'ACTIVE',
          'portfolio_type': 'individual',
          'base_currency': 'USD',
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.active, isTrue);
      });

      test('parses active field when explicitly set to false', () {
        final json = {
          'id': 'portfolio-005',
          'name': 'Inactive Portfolio',
          'code': 'INACTIVE',
          'portfolio_type': 'individual',
          'base_currency': 'USD',
          'active': false,
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.active, isFalse);
      });

      test('handles null optional fields', () {
        final json = {
          'id': 'portfolio-006',
          'name': 'Minimal Portfolio',
          'code': 'MIN',
          'portfolio_type': 'trust',
          'base_currency': 'GBP',
          'total_value': null,
          'day_change': null,
          'day_change_percent': null,
          'created_at': null,
          'updated_at': null,
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.totalValue, isNull);
        expect(portfolio.dayChange, isNull);
        expect(portfolio.dayChangePercent, isNull);
        expect(portfolio.createdAt, isNull);
        expect(portfolio.updatedAt, isNull);
      });

      test('handles negative values', () {
        final json = {
          'id': 'portfolio-007',
          'name': 'Loss Portfolio',
          'code': 'LOSS',
          'portfolio_type': 'individual',
          'base_currency': 'USD',
          'total_value': 50000.0,
          'day_change': -500.0,
          'day_change_percent': -1.0,
        };

        final portfolio = Portfolio.fromJson(json);

        expect(portfolio.dayChange, -500.0);
        expect(portfolio.dayChangePercent, -1.0);
      });
    });

    group('toJson', () {
      test('serializes required fields correctly', () {
        const portfolio = Portfolio(
          id: 'portfolio-001',
          name: 'Test Portfolio',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
        );

        final json = portfolio.toJson();

        expect(json['id'], 'portfolio-001');
        expect(json['name'], 'Test Portfolio');
        expect(json['code'], 'TEST');
        expect(json['portfolio_type'], 'individual');
        expect(json['base_currency'], 'USD');
      });

      test('serializes optional fields correctly', () {
        final portfolio = Portfolio(
          id: 'portfolio-002',
          name: 'Full Portfolio',
          code: 'FULL',
          portfolioType: 'joint',
          baseCurrency: 'EUR',
          totalValue: 100000.0,
          dayChange: 1000.0,
          dayChangePercent: 1.0,
          active: true,
          createdAt: DateTime.utc(2026, 1, 1),
          updatedAt: DateTime.utc(2026, 1, 7),
        );

        final json = portfolio.toJson();

        expect(json['total_value'], 100000.0);
        expect(json['day_change'], 1000.0);
        expect(json['day_change_percent'], 1.0);
        expect(json['active'], true);
        expect(json['created_at'], isNotNull);
        expect(json['updated_at'], isNotNull);
      });

      test('round trip serialization preserves data', () {
        final original = Portfolio(
          id: 'portfolio-003',
          name: 'Round Trip Portfolio',
          code: 'ROUND',
          portfolioType: 'ira',
          baseCurrency: 'USD',
          totalValue: 250000.50,
          dayChange: 2500.25,
          dayChangePercent: 1.01,
          active: true,
          createdAt: DateTime.utc(2026, 1, 1, 10, 30),
          updatedAt: DateTime.utc(2026, 1, 7, 15, 45),
        );

        final json = original.toJson();
        final restored = Portfolio.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.name, original.name);
        expect(restored.code, original.code);
        expect(restored.portfolioType, original.portfolioType);
        expect(restored.baseCurrency, original.baseCurrency);
        expect(restored.totalValue, original.totalValue);
        expect(restored.dayChange, original.dayChange);
        expect(restored.dayChangePercent, original.dayChangePercent);
        expect(restored.active, original.active);
      });
    });

    group('equality', () {
      test('two portfolios with same values are equal', () {
        const portfolio1 = Portfolio(
          id: 'portfolio-001',
          name: 'Test',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
        );

        const portfolio2 = Portfolio(
          id: 'portfolio-001',
          name: 'Test',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
        );

        expect(portfolio1, equals(portfolio2));
      });

      test('two portfolios with different ids are not equal', () {
        const portfolio1 = Portfolio(
          id: 'portfolio-001',
          name: 'Test',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
        );

        const portfolio2 = Portfolio(
          id: 'portfolio-002',
          name: 'Test',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
        );

        expect(portfolio1, isNot(equals(portfolio2)));
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        const original = Portfolio(
          id: 'portfolio-001',
          name: 'Original Name',
          code: 'ORIG',
          portfolioType: 'individual',
          baseCurrency: 'USD',
          totalValue: 100000,
        );

        final copy = original.copyWith(
          name: 'Updated Name',
          totalValue: 150000,
        );

        expect(copy.id, original.id);
        expect(copy.name, 'Updated Name');
        expect(copy.code, original.code);
        expect(copy.totalValue, 150000);
      });

      test('preserves original when no changes specified', () {
        const original = Portfolio(
          id: 'portfolio-001',
          name: 'Test',
          code: 'TEST',
          portfolioType: 'individual',
          baseCurrency: 'USD',
          totalValue: 100000,
        );

        final copy = original.copyWith();

        expect(copy, equals(original));
      });
    });
  });

  group('PortfolioType', () {
    test('enum values have correct display names', () {
      expect(PortfolioType.individual.displayName, 'Individual');
      expect(PortfolioType.joint.displayName, 'Joint');
      expect(PortfolioType.ira.displayName, 'IRA');
      expect(PortfolioType.rothIra.displayName, 'Roth IRA');
      expect(PortfolioType.k401.displayName, '401(k)');
      expect(PortfolioType.trust.displayName, 'Trust');
      expect(PortfolioType.corporate.displayName, 'Corporate');
      expect(PortfolioType.other.displayName, 'Other');
    });

    test('all enum values are accounted for', () {
      expect(PortfolioType.values.length, 8);
    });
  });
}
