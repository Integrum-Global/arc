"""Unit tests for portfolio domain models.

These tests verify model structure, field definitions, and DataFlow configuration
without requiring a running database. Integration tests with real database
operations are in tests/integration/models/.
"""


class TestPortfolioModel:
    """Tests for Portfolio model structure."""

    def test_portfolio_has_required_fields(self) -> None:
        """Test Portfolio model has required fields."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__
        assert "id" in annotations
        assert "name" in annotations
        assert "code" in annotations
        assert "inception_date" in annotations
        assert "manager_id" in annotations

    def test_portfolio_has_classification_fields(self) -> None:
        """Test Portfolio model has classification fields."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__
        assert "portfolio_type" in annotations
        assert "strategy" in annotations
        assert "asset_class_focus" in annotations
        assert "risk_profile" in annotations

    def test_portfolio_has_currency_fields(self) -> None:
        """Test Portfolio model has currency fields."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__
        assert "base_currency" in annotations

    def test_portfolio_has_relationship_fields(self) -> None:
        """Test Portfolio model has relationship fields."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__
        assert "manager_id" in annotations
        assert "benchmark_id" in annotations

    def test_portfolio_has_constraints_field(self) -> None:
        """Test Portfolio model has constraints dict field."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__
        assert "constraints" in annotations
        assert annotations["constraints"] is dict

    def test_portfolio_dataflow_config(self) -> None:
        """Test Portfolio has correct DataFlow configuration."""
        from arc.models.portfolio import Portfolio

        config = getattr(Portfolio, "__dataflow__", {})
        assert config.get("multi_tenant") is True
        assert config.get("audit_log") is True
        assert config.get("soft_delete") is True

    def test_portfolio_indexes(self) -> None:
        """Test Portfolio has correct indexes defined."""
        from arc.models.portfolio import Portfolio

        indexes = getattr(Portfolio, "__indexes__", [])
        assert len(indexes) >= 3

        # Check manager_id index exists
        manager_index = next(
            (idx for idx in indexes if "manager_id" in idx.get("fields", [])), None
        )
        assert manager_index is not None


class TestHoldingModel:
    """Tests for Holding model structure."""

    def test_holding_has_required_fields(self) -> None:
        """Test Holding model has required fields."""
        from arc.models.portfolio import Holding

        annotations = Holding.__annotations__
        assert "id" in annotations
        assert "portfolio_id" in annotations
        assert "security_id" in annotations
        assert "quantity" in annotations
        assert "cost_basis" in annotations
        assert "total_cost" in annotations

    def test_holding_has_tax_lot_fields(self) -> None:
        """Test Holding model has tax lot tracking fields."""
        from arc.models.portfolio import Holding

        annotations = Holding.__annotations__
        assert "lot_id" in annotations
        assert "acquisition_date" in annotations
        assert "holding_period" in annotations

    def test_holding_has_valuation_fields(self) -> None:
        """Test Holding model has valuation fields."""
        from arc.models.portfolio import Holding

        annotations = Holding.__annotations__
        assert "current_price" in annotations
        assert "market_value" in annotations
        assert "unrealized_pnl" in annotations
        assert "unrealized_pnl_pct" in annotations
        assert "weight" in annotations

    def test_holding_has_versioning(self) -> None:
        """Test Holding has versioning for concurrent updates."""
        from arc.models.portfolio import Holding

        config = getattr(Holding, "__dataflow__", {})
        assert config.get("versioned") is True, "Holding must have versioning"

    def test_holding_dataflow_config(self) -> None:
        """Test Holding has correct DataFlow configuration."""
        from arc.models.portfolio import Holding

        config = getattr(Holding, "__dataflow__", {})
        assert config.get("multi_tenant") is True
        assert config.get("audit_log") is True

    def test_holding_indexes(self) -> None:
        """Test Holding has correct indexes defined."""
        from arc.models.portfolio import Holding

        indexes = getattr(Holding, "__indexes__", [])
        assert len(indexes) >= 3

        # Check composite index exists
        composite_index = next(
            (
                idx
                for idx in indexes
                if "portfolio_id" in idx.get("fields", [])
                and "security_id" in idx.get("fields", [])
            ),
            None,
        )
        assert composite_index is not None


class TestTransactionModel:
    """Tests for Transaction model structure."""

    def test_transaction_has_required_fields(self) -> None:
        """Test Transaction model has required fields."""
        from arc.models.portfolio import Transaction

        annotations = Transaction.__annotations__
        assert "id" in annotations
        assert "portfolio_id" in annotations
        assert "security_id" in annotations
        assert "transaction_type" in annotations
        assert "transaction_date" in annotations
        assert "settlement_date" in annotations

    def test_transaction_has_amount_fields(self) -> None:
        """Test Transaction model has amount fields."""
        from arc.models.portfolio import Transaction

        annotations = Transaction.__annotations__
        assert "quantity" in annotations
        assert "price" in annotations
        assert "gross_amount" in annotations
        assert "commission" in annotations
        assert "fees" in annotations
        assert "taxes" in annotations
        assert "net_amount" in annotations

    def test_transaction_has_currency_fields(self) -> None:
        """Test Transaction model has currency fields."""
        from arc.models.portfolio import Transaction

        annotations = Transaction.__annotations__
        assert "currency" in annotations
        assert "fx_rate" in annotations

    def test_transaction_has_compliance_fields(self) -> None:
        """Test Transaction model has compliance fields."""
        from arc.models.portfolio import Transaction

        annotations = Transaction.__annotations__
        assert "compliance_status" in annotations
        assert "compliance_notes" in annotations

    def test_transaction_is_immutable(self) -> None:
        """Test Transaction does not have versioning or soft_delete."""
        from arc.models.portfolio import Transaction

        config = getattr(Transaction, "__dataflow__", {})
        # Transactions are immutable - no versioning
        assert config.get("versioned") is not True
        # Transactions are never deleted - no soft_delete
        assert config.get("soft_delete") is not True

    def test_transaction_dataflow_config(self) -> None:
        """Test Transaction has correct DataFlow configuration."""
        from arc.models.portfolio import Transaction

        config = getattr(Transaction, "__dataflow__", {})
        assert config.get("multi_tenant") is True
        assert config.get("audit_log") is True

    def test_transaction_indexes(self) -> None:
        """Test Transaction has correct indexes defined."""
        from arc.models.portfolio import Transaction

        indexes = getattr(Transaction, "__indexes__", [])
        assert len(indexes) >= 4

        # Check settlement_date index exists
        settlement_index = next(
            (idx for idx in indexes if "settlement_date" in idx.get("fields", [])), None
        )
        assert settlement_index is not None


class TestPortfolioValuationModel:
    """Tests for PortfolioValuation model structure."""

    def test_valuation_has_required_fields(self) -> None:
        """Test PortfolioValuation model has required fields."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "id" in annotations
        assert "portfolio_id" in annotations
        assert "valuation_date" in annotations
        assert "total_value" in annotations

    def test_valuation_has_value_fields(self) -> None:
        """Test PortfolioValuation model has value fields."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "securities_value" in annotations
        assert "cash_value" in annotations
        assert "accrued_income" in annotations
        assert "contributions" in annotations
        assert "withdrawals" in annotations

    def test_valuation_has_return_fields(self) -> None:
        """Test PortfolioValuation model has return fields."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "daily_return" in annotations
        assert "mtd_return" in annotations
        assert "qtd_return" in annotations
        assert "ytd_return" in annotations
        assert "inception_return" in annotations

    def test_valuation_has_risk_fields(self) -> None:
        """Test PortfolioValuation model has risk fields."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "volatility_30d" in annotations
        assert "sharpe_ratio_30d" in annotations
        assert "max_drawdown_ytd" in annotations

    def test_valuation_has_benchmark_fields(self) -> None:
        """Test PortfolioValuation model has benchmark comparison fields."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "benchmark_return" in annotations
        assert "tracking_error" in annotations
        assert "alpha" in annotations
        assert "beta" in annotations

    def test_valuation_has_final_flag(self) -> None:
        """Test PortfolioValuation has is_final flag."""
        from arc.models.portfolio import PortfolioValuation

        annotations = PortfolioValuation.__annotations__
        assert "is_final" in annotations
        assert annotations["is_final"] is bool

    def test_valuation_has_unique_index(self) -> None:
        """Test PortfolioValuation has unique constraint."""
        from arc.models.portfolio import PortfolioValuation

        indexes = getattr(PortfolioValuation, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "portfolio_id" in idx.get("fields", [])
                and "valuation_date" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique portfolio_id+valuation_date"


class TestCashAccountModel:
    """Tests for CashAccount model structure."""

    def test_cash_account_has_required_fields(self) -> None:
        """Test CashAccount model has required fields."""
        from arc.models.portfolio import CashAccount

        annotations = CashAccount.__annotations__
        assert "id" in annotations
        assert "portfolio_id" in annotations
        assert "currency" in annotations
        assert "balance" in annotations

    def test_cash_account_has_interest_fields(self) -> None:
        """Test CashAccount model has interest fields."""
        from arc.models.portfolio import CashAccount

        annotations = CashAccount.__annotations__
        assert "interest_rate" in annotations
        assert "accrued_interest" in annotations

    def test_cash_account_has_unique_index(self) -> None:
        """Test CashAccount has unique constraint on portfolio+currency."""
        from arc.models.portfolio import CashAccount

        indexes = getattr(CashAccount, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "portfolio_id" in idx.get("fields", [])
                and "currency" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique portfolio_id+currency"

    def test_cash_account_has_versioning(self) -> None:
        """Test CashAccount has versioning for concurrent updates."""
        from arc.models.portfolio import CashAccount

        config = getattr(CashAccount, "__dataflow__", {})
        assert config.get("versioned") is True


class TestBenchmarkModel:
    """Tests for Benchmark model structure."""

    def test_benchmark_has_required_fields(self) -> None:
        """Test Benchmark model has required fields."""
        from arc.models.portfolio import Benchmark

        annotations = Benchmark.__annotations__
        assert "id" in annotations
        assert "name" in annotations
        assert "code" in annotations

    def test_benchmark_has_classification_fields(self) -> None:
        """Test Benchmark model has classification fields."""
        from arc.models.portfolio import Benchmark

        annotations = Benchmark.__annotations__
        assert "benchmark_type" in annotations
        assert "asset_class" in annotations
        assert "geography" in annotations

    def test_benchmark_has_data_source_fields(self) -> None:
        """Test Benchmark model has data source fields."""
        from arc.models.portfolio import Benchmark

        annotations = Benchmark.__annotations__
        assert "provider" in annotations
        assert "ticker" in annotations

    def test_benchmark_has_weights_for_composite(self) -> None:
        """Test Benchmark model has weights for composite benchmarks."""
        from arc.models.portfolio import Benchmark

        annotations = Benchmark.__annotations__
        assert "weights" in annotations
        assert annotations["weights"] is dict

    def test_benchmark_is_shared_across_tenants(self) -> None:
        """Test Benchmark is shared (not multi-tenant)."""
        from arc.models.portfolio import Benchmark

        config = getattr(Benchmark, "__dataflow__", {})
        # Benchmarks are shared data - not tenant-specific
        assert config.get("multi_tenant") is False

    def test_benchmark_has_unique_code_index(self) -> None:
        """Test Benchmark has unique code index."""
        from arc.models.portfolio import Benchmark

        indexes = getattr(Benchmark, "__indexes__", [])
        code_index = next(
            (
                idx
                for idx in indexes
                if "code" in idx.get("fields", []) and idx.get("unique") is True
            ),
            None,
        )
        assert code_index is not None, "Should have unique code index"


class TestPortfolioModelExports:
    """Tests for portfolio model exports from package."""

    def test_all_portfolio_models_exported(self) -> None:
        """Test all portfolio models are exported from arc.models."""
        from arc.models import (
            Benchmark,
            CashAccount,
            Holding,
            Portfolio,
            PortfolioValuation,
            Transaction,
        )

        assert Portfolio is not None
        assert Holding is not None
        assert Transaction is not None
        assert PortfolioValuation is not None
        assert CashAccount is not None
        assert Benchmark is not None


class TestPortfolioFieldTypes:
    """Tests for correct field type annotations."""

    def test_portfolio_field_types(self) -> None:
        """Test Portfolio fields have correct types."""
        from arc.models.portfolio import Portfolio

        annotations = Portfolio.__annotations__

        # Required fields should be plain types
        assert annotations["id"] is str
        assert annotations["name"] is str
        assert annotations["code"] is str
        assert annotations["inception_date"] is str
        assert annotations["manager_id"] is str

        # Boolean fields
        assert annotations["active"] is bool

        # Dict fields
        assert annotations["constraints"] is dict

    def test_transaction_field_types(self) -> None:
        """Test Transaction fields have correct types."""
        from arc.models.portfolio import Transaction

        annotations = Transaction.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["portfolio_id"] is str
        assert annotations["security_id"] is str
        assert annotations["transaction_type"] is str
        assert annotations["transaction_date"] is str

    def test_holding_field_types(self) -> None:
        """Test Holding fields have correct types."""
        from arc.models.portfolio import Holding

        annotations = Holding.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["portfolio_id"] is str
        assert annotations["security_id"] is str

        # Numeric fields (as strings)
        assert annotations["quantity"] is str
        assert annotations["cost_basis"] is str

        # List fields
        assert "list" in str(annotations.get("tags", "")).lower()
