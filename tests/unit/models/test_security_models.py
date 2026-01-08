"""Unit tests for security domain models.

These tests verify model structure, field definitions, and DataFlow configuration
without requiring a running database. Integration tests with real database
operations are in tests/integration/models/.
"""


class TestSecurityModel:
    """Tests for Security model structure."""

    def test_security_has_identifier_fields(self) -> None:
        """Test Security model has all identifier fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "id" in annotations
        assert "ticker" in annotations
        assert "isin" in annotations
        assert "cusip" in annotations
        assert "sedol" in annotations
        assert "figi" in annotations

    def test_security_has_basic_info_fields(self) -> None:
        """Test Security model has basic info fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "name" in annotations
        assert "short_name" in annotations
        assert "security_type" in annotations
        assert "asset_class" in annotations

    def test_security_has_exchange_fields(self) -> None:
        """Test Security model has exchange/market fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "exchange" in annotations
        assert "mic" in annotations
        assert "currency" in annotations
        assert "country" in annotations

    def test_security_has_gics_classification_fields(self) -> None:
        """Test Security model has GICS classification fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "sector" in annotations
        assert "industry_group" in annotations
        assert "industry" in annotations
        assert "sub_industry" in annotations

    def test_security_has_market_cap_fields(self) -> None:
        """Test Security model has market cap fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "market_cap" in annotations
        assert "market_cap_category" in annotations

    def test_security_has_company_info_fields(self) -> None:
        """Test Security model has company info fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "employees" in annotations
        assert "website" in annotations
        assert "description" in annotations
        assert "headquarters_city" in annotations

    def test_security_has_private_company_flag(self) -> None:
        """Test Security model has is_private flag for Pitchbook."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "is_private" in annotations
        assert annotations["is_private"] is bool

    def test_security_has_status_fields(self) -> None:
        """Test Security model has status fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "active" in annotations
        assert "delisted_date" in annotations
        assert "deleted_at" in annotations

    def test_security_has_freshness_fields(self) -> None:
        """Test Security model has data freshness fields."""
        from arc.models.security import Security

        annotations = Security.__annotations__
        assert "last_price_date" in annotations
        assert "last_fundamental_date" in annotations

    def test_security_is_shared_across_tenants(self) -> None:
        """Test Security is shared (not multi-tenant)."""
        from arc.models.security import Security

        config = getattr(Security, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_security_has_audit_log(self) -> None:
        """Test Security has audit_log enabled."""
        from arc.models.security import Security

        config = getattr(Security, "__dataflow__", {})
        assert config.get("audit_log") is True

    def test_security_has_soft_delete(self) -> None:
        """Test Security has soft_delete enabled."""
        from arc.models.security import Security

        config = getattr(Security, "__dataflow__", {})
        assert config.get("soft_delete") is True

    def test_security_indexes(self) -> None:
        """Test Security has correct indexes defined."""
        from arc.models.security import Security

        indexes = getattr(Security, "__indexes__", [])
        assert len(indexes) >= 5

        # Check ticker has unique index
        ticker_index = next((idx for idx in indexes if "ticker" in idx.get("fields", [])), None)
        assert ticker_index is not None
        assert ticker_index.get("unique") is True

        # Check ISIN index exists
        isin_index = next((idx for idx in indexes if "isin" in idx.get("fields", [])), None)
        assert isin_index is not None


class TestPriceHistoryModel:
    """Tests for PriceHistory model structure."""

    def test_price_history_has_required_fields(self) -> None:
        """Test PriceHistory model has required fields."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__
        assert "id" in annotations
        assert "security_id" in annotations
        assert "price_date" in annotations
        assert "close_price" in annotations
        assert "adjusted_close" in annotations

    def test_price_history_has_ohlcv_fields(self) -> None:
        """Test PriceHistory model has OHLCV fields."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__
        assert "open_price" in annotations
        assert "high_price" in annotations
        assert "low_price" in annotations
        assert "close_price" in annotations
        assert "volume" in annotations

    def test_price_history_has_adjustment_fields(self) -> None:
        """Test PriceHistory model has adjustment fields."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__
        assert "split_factor" in annotations
        assert "dividend_factor" in annotations
        assert "is_adjusted" in annotations

    def test_price_history_has_calculated_fields(self) -> None:
        """Test PriceHistory model has calculated fields."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__
        assert "daily_return" in annotations

    def test_price_history_has_metadata_fields(self) -> None:
        """Test PriceHistory model has metadata fields."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__
        assert "source" in annotations
        assert "currency" in annotations

    def test_price_history_is_shared_across_tenants(self) -> None:
        """Test PriceHistory is shared (not multi-tenant)."""
        from arc.models.security import PriceHistory

        config = getattr(PriceHistory, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_price_history_no_audit_log(self) -> None:
        """Test PriceHistory has no audit_log (high volume)."""
        from arc.models.security import PriceHistory

        config = getattr(PriceHistory, "__dataflow__", {})
        assert config.get("audit_log") is False

    def test_price_history_has_unique_index(self) -> None:
        """Test PriceHistory has unique constraint on security_id+price_date."""
        from arc.models.security import PriceHistory

        indexes = getattr(PriceHistory, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "security_id" in idx.get("fields", [])
                and "price_date" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique security_id+price_date"


class TestCompanyFundamentalsModel:
    """Tests for CompanyFundamentals model structure."""

    def test_fundamentals_has_required_fields(self) -> None:
        """Test CompanyFundamentals model has required fields."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__
        assert "id" in annotations
        assert "security_id" in annotations
        assert "fiscal_year" in annotations
        assert "fiscal_quarter" in annotations
        assert "period_end_date" in annotations

    def test_fundamentals_has_income_statement_fields(self) -> None:
        """Test CompanyFundamentals has income statement fields."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__
        assert "revenue" in annotations
        assert "gross_profit" in annotations
        assert "operating_income" in annotations
        assert "ebitda" in annotations
        assert "net_income" in annotations
        assert "eps_basic" in annotations
        assert "eps_diluted" in annotations

    def test_fundamentals_has_balance_sheet_fields(self) -> None:
        """Test CompanyFundamentals has balance sheet fields."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__
        assert "total_assets" in annotations
        assert "current_assets" in annotations
        assert "cash_and_equivalents" in annotations
        assert "total_liabilities" in annotations
        assert "total_debt" in annotations
        assert "total_equity" in annotations
        assert "retained_earnings" in annotations

    def test_fundamentals_has_cash_flow_fields(self) -> None:
        """Test CompanyFundamentals has cash flow fields."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__
        assert "operating_cash_flow" in annotations
        assert "capital_expenditures" in annotations
        assert "free_cash_flow" in annotations
        assert "dividends_paid" in annotations
        assert "financing_cash_flow" in annotations
        assert "investing_cash_flow" in annotations

    def test_fundamentals_has_metadata_fields(self) -> None:
        """Test CompanyFundamentals has metadata fields."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__
        assert "source" in annotations
        assert "currency" in annotations
        assert "period_type" in annotations
        assert "is_restated" in annotations

    def test_fundamentals_is_shared_across_tenants(self) -> None:
        """Test CompanyFundamentals is shared (not multi-tenant)."""
        from arc.models.security import CompanyFundamentals

        config = getattr(CompanyFundamentals, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_fundamentals_has_audit_log(self) -> None:
        """Test CompanyFundamentals has audit_log enabled."""
        from arc.models.security import CompanyFundamentals

        config = getattr(CompanyFundamentals, "__dataflow__", {})
        assert config.get("audit_log") is True

    def test_fundamentals_has_unique_index(self) -> None:
        """Test CompanyFundamentals has unique constraint."""
        from arc.models.security import CompanyFundamentals

        indexes = getattr(CompanyFundamentals, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "security_id" in idx.get("fields", [])
                and "fiscal_year" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique constraint"


class TestSecurityRatioModel:
    """Tests for SecurityRatio model structure."""

    def test_ratio_has_required_fields(self) -> None:
        """Test SecurityRatio model has required fields."""
        from arc.models.security import SecurityRatio

        annotations = SecurityRatio.__annotations__
        assert "id" in annotations
        assert "security_id" in annotations
        assert "calculation_date" in annotations
        assert "ratio_class" in annotations
        assert "ratio_name" in annotations
        assert "ratio_value" in annotations

    def test_ratio_has_peer_comparison_fields(self) -> None:
        """Test SecurityRatio has peer comparison fields."""
        from arc.models.security import SecurityRatio

        annotations = SecurityRatio.__annotations__
        assert "peer_percentile" in annotations
        assert "sector_average" in annotations
        assert "industry_average" in annotations

    def test_ratio_has_historical_fields(self) -> None:
        """Test SecurityRatio has historical value fields."""
        from arc.models.security import SecurityRatio

        annotations = SecurityRatio.__annotations__
        assert "value_1m_ago" in annotations
        assert "value_3m_ago" in annotations
        assert "value_6m_ago" in annotations
        assert "value_1y_ago" in annotations

    def test_ratio_has_trend_fields(self) -> None:
        """Test SecurityRatio has trend analysis fields."""
        from arc.models.security import SecurityRatio

        annotations = SecurityRatio.__annotations__
        assert "trend_direction" in annotations
        assert "trend_magnitude" in annotations

    def test_ratio_is_shared_across_tenants(self) -> None:
        """Test SecurityRatio is shared (not multi-tenant)."""
        from arc.models.security import SecurityRatio

        config = getattr(SecurityRatio, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_ratio_no_audit_log(self) -> None:
        """Test SecurityRatio has no audit_log (high volume)."""
        from arc.models.security import SecurityRatio

        config = getattr(SecurityRatio, "__dataflow__", {})
        assert config.get("audit_log") is False

    def test_ratio_has_unique_index(self) -> None:
        """Test SecurityRatio has unique constraint."""
        from arc.models.security import SecurityRatio

        indexes = getattr(SecurityRatio, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "security_id" in idx.get("fields", [])
                and "calculation_date" in idx.get("fields", [])
                and "ratio_name" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique constraint"


class TestCorporateActionModel:
    """Tests for CorporateAction model structure."""

    def test_corporate_action_has_required_fields(self) -> None:
        """Test CorporateAction model has required fields."""
        from arc.models.security import CorporateAction

        annotations = CorporateAction.__annotations__
        assert "id" in annotations
        assert "security_id" in annotations
        assert "action_type" in annotations
        assert "ex_date" in annotations

    def test_corporate_action_has_date_fields(self) -> None:
        """Test CorporateAction has date fields."""
        from arc.models.security import CorporateAction

        annotations = CorporateAction.__annotations__
        assert "announcement_date" in annotations
        assert "ex_date" in annotations
        assert "record_date" in annotations
        assert "payment_date" in annotations

    def test_corporate_action_has_split_dividend_fields(self) -> None:
        """Test CorporateAction has split/dividend fields."""
        from arc.models.security import CorporateAction

        annotations = CorporateAction.__annotations__
        assert "split_ratio" in annotations
        assert "dividend_amount" in annotations
        assert "dividend_type" in annotations

    def test_corporate_action_has_merger_fields(self) -> None:
        """Test CorporateAction has merger/acquisition fields."""
        from arc.models.security import CorporateAction

        annotations = CorporateAction.__annotations__
        assert "target_security_id" in annotations
        assert "acquirer_security_id" in annotations
        assert "exchange_ratio" in annotations
        assert "cash_component" in annotations

    def test_corporate_action_has_status_field(self) -> None:
        """Test CorporateAction has status field."""
        from arc.models.security import CorporateAction

        annotations = CorporateAction.__annotations__
        assert "status" in annotations

    def test_corporate_action_is_shared_across_tenants(self) -> None:
        """Test CorporateAction is shared (not multi-tenant)."""
        from arc.models.security import CorporateAction

        config = getattr(CorporateAction, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_corporate_action_has_audit_log(self) -> None:
        """Test CorporateAction has audit_log enabled."""
        from arc.models.security import CorporateAction

        config = getattr(CorporateAction, "__dataflow__", {})
        assert config.get("audit_log") is True


class TestDividendModel:
    """Tests for Dividend model structure."""

    def test_dividend_has_required_fields(self) -> None:
        """Test Dividend model has required fields."""
        from arc.models.security import Dividend

        annotations = Dividend.__annotations__
        assert "id" in annotations
        assert "security_id" in annotations
        assert "ex_date" in annotations
        assert "amount" in annotations

    def test_dividend_has_date_fields(self) -> None:
        """Test Dividend has date fields."""
        from arc.models.security import Dividend

        annotations = Dividend.__annotations__
        assert "declaration_date" in annotations
        assert "ex_date" in annotations
        assert "record_date" in annotations
        assert "payment_date" in annotations

    def test_dividend_has_classification_fields(self) -> None:
        """Test Dividend has classification fields."""
        from arc.models.security import Dividend

        annotations = Dividend.__annotations__
        assert "dividend_type" in annotations
        assert "frequency" in annotations

    def test_dividend_has_tax_fields(self) -> None:
        """Test Dividend has tax-related fields."""
        from arc.models.security import Dividend

        annotations = Dividend.__annotations__
        assert "qualified" in annotations
        assert "tax_withholding_rate" in annotations

    def test_dividend_has_yield_field(self) -> None:
        """Test Dividend has yield field."""
        from arc.models.security import Dividend

        annotations = Dividend.__annotations__
        assert "dividend_yield" in annotations

    def test_dividend_is_shared_across_tenants(self) -> None:
        """Test Dividend is shared (not multi-tenant)."""
        from arc.models.security import Dividend

        config = getattr(Dividend, "__dataflow__", {})
        assert config.get("multi_tenant") is False

    def test_dividend_no_audit_log(self) -> None:
        """Test Dividend has no audit_log (high volume)."""
        from arc.models.security import Dividend

        config = getattr(Dividend, "__dataflow__", {})
        assert config.get("audit_log") is False

    def test_dividend_has_unique_index(self) -> None:
        """Test Dividend has unique constraint on security_id+ex_date."""
        from arc.models.security import Dividend

        indexes = getattr(Dividend, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "security_id" in idx.get("fields", [])
                and "ex_date" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique security_id+ex_date"


class TestSecurityModelExports:
    """Tests for security model exports from package."""

    def test_all_security_models_exported(self) -> None:
        """Test all security models are exported from arc.models."""
        from arc.models import (
            CompanyFundamentals,
            CorporateAction,
            Dividend,
            PriceHistory,
            Security,
            SecurityRatio,
        )

        assert Security is not None
        assert PriceHistory is not None
        assert CompanyFundamentals is not None
        assert SecurityRatio is not None
        assert CorporateAction is not None
        assert Dividend is not None


class TestSecurityFieldTypes:
    """Tests for correct field type annotations."""

    def test_security_field_types(self) -> None:
        """Test Security fields have correct types."""
        from arc.models.security import Security

        annotations = Security.__annotations__

        # Required fields should be plain types
        assert annotations["id"] is str
        assert annotations["ticker"] is str
        assert annotations["name"] is str
        assert annotations["exchange"] is str

        # Boolean fields
        assert annotations["is_private"] is bool
        assert annotations["active"] is bool

    def test_price_history_field_types(self) -> None:
        """Test PriceHistory fields have correct types."""
        from arc.models.security import PriceHistory

        annotations = PriceHistory.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["security_id"] is str
        assert annotations["price_date"] is str
        assert annotations["close_price"] is str
        assert annotations["adjusted_close"] is str

        # Integer fields
        assert annotations["volume"] is int

        # Boolean fields
        assert annotations["is_adjusted"] is bool

    def test_fundamentals_field_types(self) -> None:
        """Test CompanyFundamentals fields have correct types."""
        from arc.models.security import CompanyFundamentals

        annotations = CompanyFundamentals.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["security_id"] is str
        assert annotations["period_end_date"] is str

        # Integer fields
        assert annotations["fiscal_year"] is int

        # Boolean fields
        assert annotations["is_restated"] is bool

    def test_ratio_field_types(self) -> None:
        """Test SecurityRatio fields have correct types."""
        from arc.models.security import SecurityRatio

        annotations = SecurityRatio.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["security_id"] is str
        assert annotations["calculation_date"] is str
        assert annotations["ratio_class"] is str
        assert annotations["ratio_name"] is str
        assert annotations["ratio_value"] is str
