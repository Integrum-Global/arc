"""Unit tests for PortfolioService.

Tests portfolio CRUD, holdings management, transactions, NAV, and analytics.
Uses mocking for DataFlow Express API since these are unit tests.
"""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.services.base import ConflictError, NotFoundError, ValidationError
from arc.services.portfolio_service import PortfolioService


@pytest.fixture
def mock_db():
    """Create a mock DataFlow instance."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.create = AsyncMock()
    db.express.read = AsyncMock()
    db.express.list = AsyncMock()
    db.express.update = AsyncMock()
    db.express.delete = AsyncMock()
    db.express.count = AsyncMock()
    return db


@pytest.fixture
def service(mock_db):
    """Create a PortfolioService instance."""
    return PortfolioService(
        db=mock_db,
        tenant_id="tenant-123",
        user_id="user-456",
    )


@pytest.fixture
def sample_portfolio():
    """Sample portfolio data."""
    return {
        "id": "port-001",
        "name": "Growth Portfolio",
        "code": "GROWTH",
        "description": "Long-term growth strategy",
        "portfolio_type": "managed",
        "strategy": "growth",
        "asset_class_focus": "equity",
        "inception_date": "2024-01-01",
        "base_currency": "USD",
        "manager_id": "user-456",
        "risk_profile": "moderate",
        "active": True,
        "deleted_at": None,
        "constraints": {
            "sector_limits": {},
            "single_name_limit": 0.10,
            "min_positions": 10,
            "max_positions": 50,
            "cash_minimum": 0.02,
            "cash_maximum": 0.10,
        },
    }


@pytest.fixture
def sample_holding():
    """Sample holding data."""
    return {
        "id": "hold-001",
        "portfolio_id": "port-001",
        "security_id": "sec-AAPL",
        "quantity": "100",
        "cost_basis": "150.00",
        "total_cost": "15000.00",
        "acquisition_date": "2024-01-15",
        "holding_period": "long",
        "current_price": "175.00",
        "market_value": "17500.00",
        "unrealized_pnl": "2500.00",
        "weight": "0.25",
        "active": True,
        "tags": [],
    }


@pytest.fixture
def sample_transaction():
    """Sample transaction data."""
    return {
        "id": "txn-001",
        "portfolio_id": "port-001",
        "security_id": "sec-AAPL",
        "transaction_type": "buy",
        "transaction_date": "2024-01-15",
        "settlement_date": "2024-01-17",
        "quantity": "100",
        "price": "150.00",
        "gross_amount": "15000.00",
        "commission": "10.00",
        "fees": "5.00",
        "taxes": "0",
        "net_amount": "14985.00",
        "currency": "USD",
        "compliance_status": "approved",
    }


class TestPortfolioServiceInit:
    """Tests for PortfolioService initialization."""

    def test_service_init_with_context(self, mock_db) -> None:
        """Service should initialize with tenant and user context."""
        service = PortfolioService(
            db=mock_db,
            tenant_id="tenant-123",
            user_id="user-456",
        )

        assert service.db is mock_db
        assert service.tenant_id == "tenant-123"
        assert service.user_id == "user-456"

    def test_service_init_without_context(self, mock_db) -> None:
        """Service should initialize without context."""
        service = PortfolioService(db=mock_db)

        assert service.db is mock_db
        assert service.tenant_id is None
        assert service.user_id is None


class TestCreatePortfolio:
    """Tests for portfolio creation."""

    @pytest.mark.asyncio
    async def test_create_portfolio_success(self, service, mock_db, sample_portfolio) -> None:
        """create_portfolio should create a new portfolio."""
        mock_db.express.list.return_value = []  # No existing portfolio
        mock_db.express.create.return_value = sample_portfolio

        result = await service.create_portfolio(
            name="Growth Portfolio",
            code="GROWTH",
            inception_date="2024-01-01",
            description="Long-term growth strategy",
            portfolio_type="managed",
            strategy="growth",
        )

        assert result["name"] == "Growth Portfolio"
        assert result["code"] == "GROWTH"
        mock_db.express.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_portfolio_duplicate_code(self, service, mock_db) -> None:
        """create_portfolio should raise ConflictError for duplicate code."""
        mock_db.express.list.return_value = [{"id": "existing", "code": "GROWTH"}]

        with pytest.raises(ConflictError) as exc_info:
            await service.create_portfolio(
                name="Growth Portfolio",
                code="GROWTH",
                inception_date="2024-01-01",
            )

        assert "already exists" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_create_portfolio_without_manager_uses_current_user(
        self, service, mock_db, sample_portfolio
    ) -> None:
        """create_portfolio should use current user as manager if not specified."""
        mock_db.express.list.return_value = []
        mock_db.express.create.return_value = sample_portfolio

        await service.create_portfolio(
            name="Test",
            code="TEST",
            inception_date="2024-01-01",
        )

        call_args = mock_db.express.create.call_args
        portfolio_data = call_args[0][1]
        assert portfolio_data["manager_id"] == "user-456"

    @pytest.mark.asyncio
    async def test_create_portfolio_no_manager_no_user_raises(self, mock_db) -> None:
        """create_portfolio should raise ValidationError if no manager and no user."""
        service = PortfolioService(db=mock_db)  # No user_id

        with pytest.raises(ValidationError) as exc_info:
            await service.create_portfolio(
                name="Test",
                code="TEST",
                inception_date="2024-01-01",
            )

        assert "Manager ID is required" in exc_info.value.message


class TestGetPortfolio:
    """Tests for portfolio retrieval."""

    @pytest.mark.asyncio
    async def test_get_portfolio_success(self, service, mock_db, sample_portfolio) -> None:
        """get_portfolio should return portfolio by ID."""
        mock_db.express.read.return_value = sample_portfolio

        result = await service.get_portfolio("port-001")

        assert result["id"] == "port-001"
        assert result["name"] == "Growth Portfolio"
        mock_db.express.read.assert_called_once_with("Portfolio", "port-001")

    @pytest.mark.asyncio
    async def test_get_portfolio_not_found(self, service, mock_db) -> None:
        """get_portfolio should raise NotFoundError if not found."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError) as exc_info:
            await service.get_portfolio("nonexistent")

        assert "not found" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_get_portfolio_soft_deleted(self, service, mock_db) -> None:
        """get_portfolio should raise NotFoundError for soft-deleted portfolios."""
        mock_db.express.read.return_value = {
            "id": "port-001",
            "deleted_at": "2024-01-15T00:00:00Z",
        }

        with pytest.raises(NotFoundError) as exc_info:
            await service.get_portfolio("port-001")

        assert "deleted" in exc_info.value.message


class TestListPortfolios:
    """Tests for listing portfolios."""

    @pytest.mark.asyncio
    async def test_list_portfolios_success(self, service, mock_db, sample_portfolio) -> None:
        """list_portfolios should return list of portfolios."""
        mock_db.express.list.return_value = [sample_portfolio]

        result = await service.list_portfolios()

        assert len(result) == 1
        assert result[0]["id"] == "port-001"

    @pytest.mark.asyncio
    async def test_list_portfolios_with_filters(self, service, mock_db) -> None:
        """list_portfolios should apply filters correctly."""
        mock_db.express.list.return_value = []

        await service.list_portfolios(
            manager_id="user-999",
            portfolio_type="model",
            active_only=True,
            limit=50,
            offset=10,
        )

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert filter_dict["manager_id"] == "user-999"
        assert filter_dict["portfolio_type"] == "model"
        assert filter_dict["active"] is True
        assert filter_dict["deleted_at"] == {"$null": True}

    @pytest.mark.asyncio
    async def test_list_portfolios_defaults_to_current_user(self, service, mock_db) -> None:
        """list_portfolios should default to current user's portfolios."""
        mock_db.express.list.return_value = []

        await service.list_portfolios()

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert filter_dict["manager_id"] == "user-456"


class TestUpdatePortfolio:
    """Tests for portfolio updates."""

    @pytest.mark.asyncio
    async def test_update_portfolio_success(self, service, mock_db, sample_portfolio) -> None:
        """update_portfolio should update mutable fields."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.update.return_value = {
            **sample_portfolio,
            "name": "Updated Name",
        }

        result = await service.update_portfolio(
            "port-001",
            {"name": "Updated Name", "description": "New description"},
        )

        assert result["name"] == "Updated Name"
        mock_db.express.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_portfolio_immutable_fields(
        self, service, mock_db, sample_portfolio
    ) -> None:
        """update_portfolio should reject immutable field updates."""
        mock_db.express.read.return_value = sample_portfolio

        with pytest.raises(ValidationError) as exc_info:
            await service.update_portfolio(
                "port-001",
                {"code": "NEWCODE"},
            )

        assert "immutable" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_update_portfolio_not_found(self, service, mock_db) -> None:
        """update_portfolio should raise NotFoundError if not found."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.update_portfolio("nonexistent", {"name": "Test"})


class TestDeletePortfolio:
    """Tests for portfolio deletion."""

    @pytest.mark.asyncio
    async def test_delete_portfolio_success(self, service, mock_db, sample_portfolio) -> None:
        """delete_portfolio should soft-delete the portfolio."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.delete.return_value = True

        result = await service.delete_portfolio("port-001")

        assert result is True
        mock_db.express.delete.assert_called_once_with("Portfolio", "port-001")

    @pytest.mark.asyncio
    async def test_delete_portfolio_not_found(self, service, mock_db) -> None:
        """delete_portfolio should raise NotFoundError if not found."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.delete_portfolio("nonexistent")


class TestGetHoldings:
    """Tests for holdings retrieval."""

    @pytest.mark.asyncio
    async def test_get_holdings_success(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """get_holdings should return holdings for a portfolio."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = [sample_holding]

        result = await service.get_holdings("port-001")

        assert len(result) == 1
        assert result[0]["security_id"] == "sec-AAPL"

    @pytest.mark.asyncio
    async def test_get_holdings_excludes_closed_by_default(
        self, service, mock_db, sample_portfolio
    ) -> None:
        """get_holdings should exclude closed positions by default."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = []

        await service.get_holdings("port-001")

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert filter_dict["active"] is True

    @pytest.mark.asyncio
    async def test_get_holdings_include_closed(self, service, mock_db, sample_portfolio) -> None:
        """get_holdings should include closed positions when requested."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = []

        await service.get_holdings("port-001", include_closed=True)

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert "active" not in filter_dict


class TestAddHolding:
    """Tests for adding holdings."""

    @pytest.mark.asyncio
    async def test_add_holding_new_position(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """add_holding should create a new holding if none exists."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = []  # No existing holding
        mock_db.express.create.return_value = sample_holding

        result = await service.add_holding(
            portfolio_id="port-001",
            security_id="sec-AAPL",
            quantity="100",
            cost_basis="150.00",
            acquisition_date="2024-01-15",
        )

        assert result["security_id"] == "sec-AAPL"
        mock_db.express.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_holding_updates_existing(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """add_holding should update existing holding with averaged cost."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = [sample_holding]
        mock_db.express.update.return_value = {
            **sample_holding,
            "quantity": "200",
            "total_cost": "30000.00",
        }

        await service.add_holding(
            portfolio_id="port-001",
            security_id="sec-AAPL",
            quantity="100",
            cost_basis="150.00",
            acquisition_date="2024-01-15",
        )

        # Should update existing, not create new
        mock_db.express.update.assert_called_once()
        mock_db.express.create.assert_not_called()


class TestRecordTransaction:
    """Tests for transaction recording."""

    @pytest.mark.asyncio
    async def test_record_buy_transaction(
        self, service, mock_db, sample_portfolio, sample_transaction
    ) -> None:
        """record_transaction should record buy and update holdings."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.create.return_value = sample_transaction
        mock_db.express.list.return_value = []  # For add_holding check

        with patch.object(service, "add_holding", new_callable=AsyncMock) as mock_add:
            await service.record_transaction(
                portfolio_id="port-001",
                security_id="sec-AAPL",
                transaction_type="buy",
                transaction_date="2024-01-15",
                settlement_date="2024-01-17",
                quantity="100",
                price="150.00",
            )

            mock_add.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_sell_transaction(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """record_transaction should record sell and reduce holdings."""

        # Mock read to return portfolio for Portfolio, holding for Holding
        def read_side_effect(model, id_val):
            if model == "Portfolio":
                return sample_portfolio
            if model == "Holding":
                return sample_holding
            return None

        mock_db.express.read.side_effect = read_side_effect
        mock_db.express.create.return_value = {"id": "txn-002"}
        # First list call for get_holdings in record_transaction (sell lookup)
        mock_db.express.list.return_value = [sample_holding]  # Existing holding
        mock_db.express.update.return_value = {**sample_holding, "quantity": "50"}

        await service.record_transaction(
            portfolio_id="port-001",
            security_id="sec-AAPL",
            transaction_type="sell",
            transaction_date="2024-01-20",
            settlement_date="2024-01-22",
            quantity="-50",  # Negative for sell
            price="175.00",
        )

        # Should create transaction
        mock_db.express.create.assert_called_once()
        # Should update holding quantity (called with Holding filter)
        update_calls = mock_db.express.update.call_args_list
        assert len(update_calls) > 0


class TestCalculateNAV:
    """Tests for NAV calculation."""

    @pytest.mark.asyncio
    async def test_calculate_nav_success(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """calculate_nav should calculate total portfolio value."""

        # Mock read to return portfolio first, then None for valuation
        def read_side_effect(model, id_val):
            if model == "Portfolio":
                return sample_portfolio
            if model == "PortfolioValuation":
                return None
            return None

        mock_db.express.read.side_effect = read_side_effect
        mock_db.express.list.side_effect = [
            [sample_holding],  # get_holdings
            [{"portfolio_id": "port-001", "currency": "USD", "balance": "5000"}],  # cash
        ]
        mock_db.express.create.return_value = {}

        result = await service.calculate_nav("port-001")

        assert "total_value" in result
        assert "securities_value" in result
        assert "cash_value" in result
        # 17500 (holding) + 5000 (cash) = 22500
        assert Decimal(result["total_value"]) == Decimal("22500")

    @pytest.mark.asyncio
    async def test_calculate_nav_no_holdings(self, service, mock_db, sample_portfolio) -> None:
        """calculate_nav should handle empty portfolio."""

        def read_side_effect(model, id_val):
            if model == "Portfolio":
                return sample_portfolio
            return None

        mock_db.express.read.side_effect = read_side_effect
        mock_db.express.list.side_effect = [[], []]  # No holdings, no cash
        mock_db.express.create.return_value = {}

        result = await service.calculate_nav("port-001")

        assert result["total_value"] == "0"
        assert result["holding_count"] == 0


class TestRunHealthScan:
    """Tests for health scan."""

    @pytest.mark.asyncio
    async def test_health_scan_healthy_portfolio(self, service, mock_db, sample_portfolio) -> None:
        """health_scan should return good score for healthy portfolio."""
        # Create 15 holdings with proper weights (none exceeding 10%)
        holdings = [
            {
                "id": f"hold-{i}",
                "security_id": f"sec-{i}",
                "quantity": "100",
                "market_value": "5000",  # Each 6.6% of 75000 total
            }
            for i in range(15)
        ]

        def read_side_effect(model, id_val):
            if model == "Portfolio":
                return sample_portfolio
            return None

        mock_db.express.read.side_effect = read_side_effect
        mock_db.express.list.side_effect = [
            holdings,  # get_holdings for health_scan
            holdings,  # get_holdings for calculate_nav
            [{"balance": "5000"}],  # cash accounts
        ]
        mock_db.express.create.return_value = {}

        result = await service.run_health_scan("port-001")

        assert result["score"] >= 70  # Healthy score
        assert isinstance(result["issues"], list)

    @pytest.mark.asyncio
    async def test_health_scan_concentration_warning(
        self, service, mock_db, sample_portfolio
    ) -> None:
        """health_scan should flag concentration risk."""
        # One holding with high concentration (50%)
        holdings = [
            {"id": "hold-1", "security_id": "sec-1", "quantity": "100", "market_value": "50000"},
            {"id": "hold-2", "security_id": "sec-2", "quantity": "100", "market_value": "25000"},
            {"id": "hold-3", "security_id": "sec-3", "quantity": "100", "market_value": "25000"},
        ]

        def read_side_effect(model, id_val):
            if model == "Portfolio":
                return sample_portfolio
            return None

        mock_db.express.read.side_effect = read_side_effect
        mock_db.express.list.side_effect = [
            holdings,  # get_holdings for health_scan
            holdings,  # get_holdings for calculate_nav
            [],  # No cash
        ]
        mock_db.express.create.return_value = {}

        result = await service.run_health_scan("port-001")

        # Should have concentration warning
        concentration_issues = [i for i in result["issues"] if i["type"] == "concentration"]
        assert len(concentration_issues) > 0


class TestGetSectorAllocation:
    """Tests for sector allocation."""

    @pytest.mark.asyncio
    async def test_get_sector_allocation(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """get_sector_allocation should return allocation breakdown."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = [sample_holding]

        result = await service.get_sector_allocation("port-001")

        assert isinstance(result, list)
        # Placeholder returns "Unknown" sector
        assert result[0]["sector"] == "Unknown"
        assert "weight" in result[0]


class TestGetAssetAllocation:
    """Tests for asset allocation."""

    @pytest.mark.asyncio
    async def test_get_asset_allocation(
        self, service, mock_db, sample_portfolio, sample_holding
    ) -> None:
        """get_asset_allocation should return allocation breakdown."""
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = [sample_holding]

        result = await service.get_asset_allocation("port-001")

        assert isinstance(result, list)
        # Placeholder returns "Equity" asset class
        assert result[0]["asset_class"] == "Equity"


class TestGetTopHoldings:
    """Tests for top holdings."""

    @pytest.mark.asyncio
    async def test_get_top_holdings(self, service, mock_db, sample_portfolio) -> None:
        """get_top_holdings should return sorted holdings."""
        holdings = [
            {"id": "h1", "market_value": "10000"},
            {"id": "h2", "market_value": "50000"},
            {"id": "h3", "market_value": "25000"},
        ]
        mock_db.express.read.return_value = sample_portfolio
        mock_db.express.list.return_value = holdings

        result = await service.get_top_holdings("port-001", limit=2)

        assert len(result) == 2
        # Should be sorted by market value descending
        assert result[0]["id"] == "h2"  # 50000
        assert result[1]["id"] == "h3"  # 25000


class TestPortfolioServiceExports:
    """Tests for module exports."""

    def test_portfolio_service_exported(self) -> None:
        """PortfolioService should be exported from services module."""
        from arc.services import PortfolioService as Exported

        assert Exported is PortfolioService

    def test_portfolio_service_in_registry(self, mock_db) -> None:
        """PortfolioService should be accessible via registry."""
        from arc.services import ServiceRegistry

        registry = ServiceRegistry(db=mock_db)
        portfolio_service = registry.portfolio

        assert isinstance(portfolio_service, PortfolioService)
