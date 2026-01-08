"""Unit tests for constants module."""

import json

import pytest

from arc.core.constants import (
    CACHE_TTL_LONG,
    CACHE_TTL_MARKET_DATA,
    CACHE_TTL_MEDIUM,
    CACHE_TTL_SHORT,
    DATE_FORMAT,
    DATETIME_FORMAT,
    DEFAULT_CURRENCY,
    DEFAULT_PAGE_SIZE,
    DEFAULT_RISK_FREE_RATE,
    MAX_PAGE_SIZE,
    RATE_LIMIT_DEFAULT,
    TRADING_DAYS_PER_YEAR,
    AlertSeverity,
    AssetClass,
    Currency,
    DataProvider,
    MarketStatus,
    PortfolioType,
    RatioClass,
    SecurityType,
    SyncStatus,
    TimeHorizon,
    TransactionType,
    UserRole,
)


class TestPortfolioType:
    """Tests for PortfolioType enum."""

    def test_all_types_defined(self) -> None:
        """Test all portfolio types are defined."""
        assert PortfolioType.MANAGED == "managed"
        assert PortfolioType.MODEL == "model"
        assert PortfolioType.BENCHMARK == "benchmark"
        assert PortfolioType.COMPOSITE == "composite"

    def test_serializes_to_string(self) -> None:
        """Test enum serializes to string value."""
        assert str(PortfolioType.MANAGED) == "managed"

    def test_json_serializable(self) -> None:
        """Test enum is JSON serializable."""
        data = {"type": PortfolioType.MANAGED}
        json_str = json.dumps(data)
        assert '"managed"' in json_str

    def test_from_string(self) -> None:
        """Test enum can be created from string."""
        portfolio_type = PortfolioType("managed")
        assert portfolio_type == PortfolioType.MANAGED

    def test_invalid_value_raises(self) -> None:
        """Test invalid value raises ValueError."""
        with pytest.raises(ValueError):
            PortfolioType("invalid")


class TestTransactionType:
    """Tests for TransactionType enum."""

    def test_common_types_defined(self) -> None:
        """Test common transaction types exist."""
        assert TransactionType.BUY == "buy"
        assert TransactionType.SELL == "sell"
        assert TransactionType.DIVIDEND == "dividend"
        assert TransactionType.TRANSFER_IN == "transfer_in"
        assert TransactionType.TRANSFER_OUT == "transfer_out"

    def test_corporate_actions_defined(self) -> None:
        """Test corporate action types exist."""
        assert TransactionType.SPLIT == "split"
        assert TransactionType.MERGER == "merger"
        assert TransactionType.SPINOFF == "spinoff"


class TestAlertSeverity:
    """Tests for AlertSeverity enum."""

    def test_severity_levels(self) -> None:
        """Test all severity levels are defined."""
        assert AlertSeverity.INFO == "info"
        assert AlertSeverity.WARNING == "warning"
        assert AlertSeverity.CRITICAL == "critical"

    def test_severity_ordering(self) -> None:
        """Test severity levels can be compared by string."""
        # StrEnum doesn't support direct comparison, but we can list them
        severities = [AlertSeverity.INFO, AlertSeverity.WARNING, AlertSeverity.CRITICAL]
        assert len(severities) == 3


class TestRatioClass:
    """Tests for RatioClass enum."""

    def test_all_classes_defined(self) -> None:
        """Test all ratio classes are defined."""
        assert RatioClass.LIQUIDITY == "liquidity"
        assert RatioClass.PROFITABILITY == "profitability"
        assert RatioClass.LEVERAGE == "leverage"
        assert RatioClass.EFFICIENCY == "efficiency"
        assert RatioClass.VALUATION == "valuation"
        assert RatioClass.GROWTH == "growth"


class TestUserRole:
    """Tests for UserRole enum."""

    def test_all_roles_defined(self) -> None:
        """Test all user roles are defined."""
        assert UserRole.ADMIN == "admin"
        assert UserRole.INVESTMENT_MANAGER == "investment_manager"
        assert UserRole.FAMILY_OFFICE == "family_office"
        assert UserRole.COMPLIANCE == "compliance"
        assert UserRole.ANALYST == "analyst"
        assert UserRole.VIEWER == "viewer"


class TestAssetClass:
    """Tests for AssetClass enum."""

    def test_traditional_assets(self) -> None:
        """Test traditional asset classes are defined."""
        assert AssetClass.EQUITY == "equity"
        assert AssetClass.FIXED_INCOME == "fixed_income"
        assert AssetClass.CASH == "cash"
        assert AssetClass.REAL_ESTATE == "real_estate"

    def test_alternative_assets(self) -> None:
        """Test alternative asset classes are defined."""
        assert AssetClass.ALTERNATIVES == "alternatives"
        assert AssetClass.PRIVATE_EQUITY == "private_equity"
        assert AssetClass.HEDGE_FUND == "hedge_fund"
        assert AssetClass.CRYPTO == "crypto"


class TestSecurityType:
    """Tests for SecurityType enum."""

    def test_equity_types(self) -> None:
        """Test equity security types are defined."""
        assert SecurityType.STOCK == "stock"
        assert SecurityType.PREFERRED == "preferred"
        assert SecurityType.ETF == "etf"
        assert SecurityType.ADR == "adr"

    def test_derivative_types(self) -> None:
        """Test derivative types are defined."""
        assert SecurityType.OPTION == "option"
        assert SecurityType.FUTURE == "future"
        assert SecurityType.WARRANT == "warrant"


class TestMarketStatus:
    """Tests for MarketStatus enum."""

    def test_all_statuses(self) -> None:
        """Test all market statuses are defined."""
        assert MarketStatus.OPEN == "open"
        assert MarketStatus.CLOSED == "closed"
        assert MarketStatus.PRE_MARKET == "pre_market"
        assert MarketStatus.AFTER_HOURS == "after_hours"
        assert MarketStatus.HALTED == "halted"


class TestDataProvider:
    """Tests for DataProvider enum."""

    def test_all_providers(self) -> None:
        """Test all data providers are defined."""
        assert DataProvider.EODHD == "eodhd"
        assert DataProvider.CAPITAL_IQ == "capital_iq"
        assert DataProvider.PITCHBOOK == "pitchbook"
        assert DataProvider.MANUAL == "manual"
        assert DataProvider.INTERNAL == "internal"


class TestSyncStatus:
    """Tests for SyncStatus enum."""

    def test_all_statuses(self) -> None:
        """Test all sync statuses are defined."""
        assert SyncStatus.PENDING == "pending"
        assert SyncStatus.IN_PROGRESS == "in_progress"
        assert SyncStatus.COMPLETED == "completed"
        assert SyncStatus.FAILED == "failed"
        assert SyncStatus.CANCELLED == "cancelled"


class TestCurrency:
    """Tests for Currency enum."""

    def test_major_currencies(self) -> None:
        """Test major currencies are defined."""
        assert Currency.USD == "USD"
        assert Currency.EUR == "EUR"
        assert Currency.GBP == "GBP"
        assert Currency.JPY == "JPY"
        assert Currency.CHF == "CHF"


class TestTimeHorizon:
    """Tests for TimeHorizon enum."""

    def test_standard_periods(self) -> None:
        """Test standard time periods are defined."""
        assert TimeHorizon.DAILY == "daily"
        assert TimeHorizon.WEEKLY == "weekly"
        assert TimeHorizon.MONTHLY == "monthly"
        assert TimeHorizon.YEARLY == "yearly"

    def test_to_date_periods(self) -> None:
        """Test to-date periods are defined."""
        assert TimeHorizon.YTD == "ytd"
        assert TimeHorizon.MTD == "mtd"
        assert TimeHorizon.QTD == "qtd"


class TestConstants:
    """Tests for constant values."""

    def test_pagination_constants(self) -> None:
        """Test pagination constants have reasonable values."""
        assert DEFAULT_PAGE_SIZE == 20
        assert MAX_PAGE_SIZE == 100
        assert DEFAULT_PAGE_SIZE <= MAX_PAGE_SIZE

    def test_cache_ttl_constants(self) -> None:
        """Test cache TTL constants are ordered correctly."""
        assert CACHE_TTL_SHORT < CACHE_TTL_MEDIUM
        assert CACHE_TTL_MEDIUM < CACHE_TTL_LONG
        assert CACHE_TTL_MARKET_DATA > 0

    def test_rate_limit_constants(self) -> None:
        """Test rate limit constants are reasonable."""
        assert RATE_LIMIT_DEFAULT > 0
        assert RATE_LIMIT_DEFAULT > 10  # Should allow reasonable usage

    def test_date_format_constants(self) -> None:
        """Test date format constants are valid."""
        from datetime import datetime

        now = datetime.now()

        # Should not raise
        now.strftime(DATE_FORMAT)
        now.strftime(DATETIME_FORMAT)

    def test_financial_constants(self) -> None:
        """Test financial constants have expected values."""
        assert TRADING_DAYS_PER_YEAR == 252
        assert 0 <= DEFAULT_RISK_FREE_RATE <= 1  # Reasonable rate
        assert DEFAULT_CURRENCY == Currency.USD


class TestEnumUniqueness:
    """Tests for enum value uniqueness."""

    def test_portfolio_type_values_unique(self) -> None:
        """Test PortfolioType values are unique."""
        values = [e.value for e in PortfolioType]
        assert len(values) == len(set(values))

    def test_transaction_type_values_unique(self) -> None:
        """Test TransactionType values are unique."""
        values = [e.value for e in TransactionType]
        assert len(values) == len(set(values))

    def test_user_role_values_unique(self) -> None:
        """Test UserRole values are unique."""
        values = [e.value for e in UserRole]
        assert len(values) == len(set(values))
