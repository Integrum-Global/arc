import 'package:arc_mobile/features/portfolio/domain/models/holding.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Holding', () {
    group('fromJson', () {
      test('parses required fields correctly', () {
        final json = {
          'id': 'holding-001',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-001',
          'ticker': 'AAPL',
          'name': 'Apple Inc.',
          'quantity': 100.0,
        };

        final holding = Holding.fromJson(json);

        expect(holding.id, 'holding-001');
        expect(holding.portfolioId, 'portfolio-001');
        expect(holding.securityId, 'security-001');
        expect(holding.ticker, 'AAPL');
        expect(holding.name, 'Apple Inc.');
        expect(holding.quantity, 100.0);
      });

      test('parses optional numeric fields correctly', () {
        final json = {
          'id': 'holding-002',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-002',
          'ticker': 'MSFT',
          'name': 'Microsoft Corporation',
          'quantity': 50.0,
          'cost_basis': 15000.0,
          'current_price': 350.0,
          'market_value': 17500.0,
          'weight': 12.5,
          'unrealized_pnl': 2500.0,
          'unrealized_pnl_pct': 16.67,
          'day_change': 175.0,
          'day_change_pct': 1.01,
        };

        final holding = Holding.fromJson(json);

        expect(holding.costBasis, 15000.0);
        expect(holding.currentPrice, 350.0);
        expect(holding.marketValue, 17500.0);
        expect(holding.weight, 12.5);
        expect(holding.unrealizedPnl, 2500.0);
        expect(holding.unrealizedPnlPct, 16.67);
        expect(holding.dayChange, 175.0);
        expect(holding.dayChangePct, 1.01);
      });

      test('parses optional string fields correctly', () {
        final json = {
          'id': 'holding-003',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-003',
          'ticker': 'BND',
          'name': 'Vanguard Bond ETF',
          'quantity': 200.0,
          'asset_class': 'fixed_income',
          'sector': 'Financials',
          'currency': 'USD',
        };

        final holding = Holding.fromJson(json);

        expect(holding.assetClass, 'fixed_income');
        expect(holding.sector, 'Financials');
        expect(holding.currency, 'USD');
      });

      test('parses DateTime field correctly', () {
        final json = {
          'id': 'holding-004',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-004',
          'ticker': 'GOOGL',
          'name': 'Alphabet Inc.',
          'quantity': 25.0,
          'updated_at': '2026-01-07T14:30:00.000Z',
        };

        final holding = Holding.fromJson(json);

        expect(holding.updatedAt, isNotNull);
        expect(holding.updatedAt!.year, 2026);
        expect(holding.updatedAt!.month, 1);
        expect(holding.updatedAt!.day, 7);
      });

      test('handles fractional quantity', () {
        final json = {
          'id': 'holding-005',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-005',
          'ticker': 'AMZN',
          'name': 'Amazon.com Inc.',
          'quantity': 10.5,
        };

        final holding = Holding.fromJson(json);

        expect(holding.quantity, 10.5);
      });

      test('handles negative P&L values', () {
        final json = {
          'id': 'holding-006',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-006',
          'ticker': 'META',
          'name': 'Meta Platforms Inc.',
          'quantity': 40.0,
          'cost_basis': 15000.0,
          'market_value': 12000.0,
          'unrealized_pnl': -3000.0,
          'unrealized_pnl_pct': -20.0,
          'day_change': -500.0,
          'day_change_pct': -4.0,
        };

        final holding = Holding.fromJson(json);

        expect(holding.unrealizedPnl, -3000.0);
        expect(holding.unrealizedPnlPct, -20.0);
        expect(holding.dayChange, -500.0);
        expect(holding.dayChangePct, -4.0);
      });

      test('handles null optional fields', () {
        final json = {
          'id': 'holding-007',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-007',
          'ticker': 'XYZ',
          'name': 'XYZ Corp',
          'quantity': 100.0,
          'cost_basis': null,
          'current_price': null,
          'market_value': null,
          'weight': null,
          'unrealized_pnl': null,
          'unrealized_pnl_pct': null,
          'day_change': null,
          'day_change_pct': null,
          'asset_class': null,
          'sector': null,
          'currency': null,
          'updated_at': null,
        };

        final holding = Holding.fromJson(json);

        expect(holding.costBasis, isNull);
        expect(holding.currentPrice, isNull);
        expect(holding.marketValue, isNull);
        expect(holding.weight, isNull);
        expect(holding.unrealizedPnl, isNull);
        expect(holding.unrealizedPnlPct, isNull);
        expect(holding.dayChange, isNull);
        expect(holding.dayChangePct, isNull);
        expect(holding.assetClass, isNull);
        expect(holding.sector, isNull);
        expect(holding.currency, isNull);
        expect(holding.updatedAt, isNull);
      });

      test('handles integer quantity', () {
        final json = {
          'id': 'holding-008',
          'portfolio_id': 'portfolio-001',
          'security_id': 'security-008',
          'ticker': 'NVDA',
          'name': 'NVIDIA Corporation',
          'quantity': 20,  // Integer in JSON
        };

        final holding = Holding.fromJson(json);

        expect(holding.quantity, 20.0);
      });
    });

    group('toJson', () {
      test('serializes required fields correctly', () {
        const holding = Holding(
          id: 'holding-001',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
        );

        final json = holding.toJson();

        expect(json['id'], 'holding-001');
        expect(json['portfolio_id'], 'portfolio-001');
        expect(json['security_id'], 'security-001');
        expect(json['ticker'], 'AAPL');
        expect(json['name'], 'Apple Inc.');
        expect(json['quantity'], 100.0);
      });

      test('serializes all optional fields correctly', () {
        final holding = Holding(
          id: 'holding-002',
          portfolioId: 'portfolio-001',
          securityId: 'security-002',
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          quantity: 50.0,
          costBasis: 15000.0,
          currentPrice: 350.0,
          marketValue: 17500.0,
          weight: 12.5,
          unrealizedPnl: 2500.0,
          unrealizedPnlPct: 16.67,
          dayChange: 175.0,
          dayChangePct: 1.01,
          assetClass: 'equity',
          sector: 'Technology',
          currency: 'USD',
          updatedAt: DateTime.utc(2026, 1, 7),
        );

        final json = holding.toJson();

        expect(json['cost_basis'], 15000.0);
        expect(json['current_price'], 350.0);
        expect(json['market_value'], 17500.0);
        expect(json['weight'], 12.5);
        expect(json['unrealized_pnl'], 2500.0);
        expect(json['unrealized_pnl_pct'], 16.67);
        expect(json['day_change'], 175.0);
        expect(json['day_change_pct'], 1.01);
        expect(json['asset_class'], 'equity');
        expect(json['sector'], 'Technology');
        expect(json['currency'], 'USD');
        expect(json['updated_at'], isNotNull);
      });

      test('round trip serialization preserves data', () {
        final original = Holding(
          id: 'holding-003',
          portfolioId: 'portfolio-001',
          securityId: 'security-003',
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          quantity: 25.5,
          costBasis: 3000.0,
          currentPrice: 145.0,
          marketValue: 3697.5,
          weight: 5.25,
          unrealizedPnl: 697.5,
          unrealizedPnlPct: 23.25,
          dayChange: 50.0,
          dayChangePct: 1.37,
          assetClass: 'equity',
          sector: 'Communication Services',
          currency: 'USD',
          updatedAt: DateTime.utc(2026, 1, 7, 14, 30),
        );

        final json = original.toJson();
        final restored = Holding.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.portfolioId, original.portfolioId);
        expect(restored.securityId, original.securityId);
        expect(restored.ticker, original.ticker);
        expect(restored.name, original.name);
        expect(restored.quantity, original.quantity);
        expect(restored.costBasis, original.costBasis);
        expect(restored.currentPrice, original.currentPrice);
        expect(restored.marketValue, original.marketValue);
        expect(restored.weight, original.weight);
        expect(restored.unrealizedPnl, original.unrealizedPnl);
        expect(restored.unrealizedPnlPct, original.unrealizedPnlPct);
        expect(restored.dayChange, original.dayChange);
        expect(restored.dayChangePct, original.dayChangePct);
        expect(restored.assetClass, original.assetClass);
        expect(restored.sector, original.sector);
        expect(restored.currency, original.currency);
      });
    });

    group('equality', () {
      test('two holdings with same values are equal', () {
        const holding1 = Holding(
          id: 'holding-001',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
        );

        const holding2 = Holding(
          id: 'holding-001',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
        );

        expect(holding1, equals(holding2));
      });

      test('two holdings with different ids are not equal', () {
        const holding1 = Holding(
          id: 'holding-001',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
        );

        const holding2 = Holding(
          id: 'holding-002',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
        );

        expect(holding1, isNot(equals(holding2)));
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        const original = Holding(
          id: 'holding-001',
          portfolioId: 'portfolio-001',
          securityId: 'security-001',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100.0,
          marketValue: 19500.0,
        );

        final copy = original.copyWith(
          quantity: 150.0,
          marketValue: 29250.0,
        );

        expect(copy.id, original.id);
        expect(copy.ticker, original.ticker);
        expect(copy.quantity, 150.0);
        expect(copy.marketValue, 29250.0);
      });
    });
  });

  group('AssetClass', () {
    test('enum values have correct display names', () {
      expect(AssetClass.equity.displayName, 'Equity');
      expect(AssetClass.fixedIncome.displayName, 'Fixed Income');
      expect(AssetClass.cash.displayName, 'Cash');
      expect(AssetClass.realEstate.displayName, 'Real Estate');
      expect(AssetClass.commodities.displayName, 'Commodities');
      expect(AssetClass.alternatives.displayName, 'Alternatives');
      expect(AssetClass.crypto.displayName, 'Cryptocurrency');
      expect(AssetClass.other.displayName, 'Other');
    });

    test('all enum values are accounted for', () {
      expect(AssetClass.values.length, 8);
    });
  });
}
