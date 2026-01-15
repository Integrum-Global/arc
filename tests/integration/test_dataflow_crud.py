"""
Integration tests for DataFlow CRUD operations.

NO MOCKING: Uses real PostgreSQL database via docker-compose.test.yml.

NOTE: Some models (Tenant, User, etc.) have list/dict fields that cause
DDL generation issues. These tests use models that work correctly with
PostgreSQL's type system.
"""

import pytest
import pytest_asyncio
from dataflow import DataFlow


@pytest.mark.asyncio
class TestSecurityCRUD:
    """Test Security model CRUD operations (works with PostgreSQL)."""

    async def test_create_security(self, dataflow: DataFlow) -> None:
        """Test creating a security."""
        security_data = {
            "id": "security-aapl",
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "security_type": "equity",
            "exchange": "NASDAQ",
            "currency": "USD",
            "active": True,
        }

        result = await dataflow.express.create("Security", security_data)

        assert result["id"] == "security-aapl"
        assert result["symbol"] == "AAPL"
        assert result["name"] == "Apple Inc."

    async def test_read_security(self, dataflow: DataFlow) -> None:
        """Test reading a security by ID."""
        # Create first
        await dataflow.express.create(
            "Security",
            {
                "id": "security-read-test",
                "symbol": "MSFT",
                "name": "Microsoft Corp",
                "security_type": "equity",
                "currency": "USD",
            },
        )

        result = await dataflow.express.read("Security", "security-read-test")

        assert result is not None
        assert result["symbol"] == "MSFT"

    async def test_update_security(self, dataflow: DataFlow) -> None:
        """Test updating a security."""
        # Create first
        await dataflow.express.create(
            "Security",
            {
                "id": "security-update-test",
                "symbol": "GOOG",
                "name": "Alphabet Inc.",
                "security_type": "equity",
                "currency": "USD",
            },
        )

        result = await dataflow.express.update(
            "Security", "security-update-test", {"name": "Alphabet Inc. Updated"}
        )

        assert result["name"] == "Alphabet Inc. Updated"

    async def test_list_securities(self, dataflow: DataFlow) -> None:
        """Test listing securities."""
        # Create a few securities
        await dataflow.express.create(
            "Security",
            {
                "id": "security-list-1",
                "symbol": "NVDA",
                "name": "NVIDIA Corp",
                "security_type": "equity",
                "currency": "USD",
            },
        )
        await dataflow.express.create(
            "Security",
            {
                "id": "security-list-2",
                "symbol": "META",
                "name": "Meta Platforms",
                "security_type": "equity",
                "currency": "USD",
            },
        )

        results = await dataflow.express.list("Security")

        assert len(results) >= 2
        symbols = [r["symbol"] for r in results]
        assert "NVDA" in symbols
        assert "META" in symbols

    async def test_count_securities(self, dataflow: DataFlow) -> None:
        """Test counting securities."""
        await dataflow.express.create(
            "Security",
            {
                "id": "security-count-test",
                "symbol": "AMZN",
                "name": "Amazon.com",
                "security_type": "equity",
                "currency": "USD",
            },
        )

        count = await dataflow.express.count("Security")

        assert count >= 1

    async def test_delete_security(self, dataflow: DataFlow) -> None:
        """Test deleting a security."""
        # Create a security to delete
        await dataflow.express.create(
            "Security",
            {
                "id": "security-to-delete",
                "symbol": "DELETE",
                "name": "To Delete",
                "security_type": "equity",
                "currency": "USD",
            },
        )

        # Delete it
        result = await dataflow.express.delete("Security", "security-to-delete")
        assert result is True

        # Verify it's gone
        deleted = await dataflow.express.read("Security", "security-to-delete")
        assert deleted is None

    async def test_filter_securities_by_type(self, dataflow: DataFlow) -> None:
        """Test filtering securities by type."""
        # Create different types
        await dataflow.express.create(
            "Security",
            {
                "id": "security-equity",
                "symbol": "SPY",
                "name": "SPDR S&P 500",
                "security_type": "etf",
                "currency": "USD",
            },
        )
        await dataflow.express.create(
            "Security",
            {
                "id": "security-bond",
                "symbol": "TLT",
                "name": "Treasury Bond ETF",
                "security_type": "etf",
                "currency": "USD",
            },
        )

        results = await dataflow.express.list(
            "Security", filter={"security_type": "etf"}
        )

        assert len(results) >= 2
        assert all(r["security_type"] == "etf" for r in results)


@pytest.mark.asyncio
class TestTransactionCRUD:
    """Test Transaction model CRUD operations."""

    async def test_create_transaction(self, dataflow: DataFlow) -> None:
        """Test creating a transaction."""
        tx_data = {
            "id": "tx-001",
            "transaction_type": "buy",
            "quantity": 100.0,
            "price": 150.0,
            "currency": "USD",
            "executed_at": "2026-01-08T10:00:00Z",
        }

        result = await dataflow.express.create("Transaction", tx_data)

        assert result["id"] == "tx-001"
        assert result["transaction_type"] == "buy"
        assert result["quantity"] == 100.0

    async def test_list_transactions(self, dataflow: DataFlow) -> None:
        """Test listing transactions."""
        await dataflow.express.create(
            "Transaction",
            {
                "id": "tx-list-1",
                "transaction_type": "buy",
                "quantity": 50.0,
                "price": 100.0,
                "currency": "USD",
            },
        )
        await dataflow.express.create(
            "Transaction",
            {
                "id": "tx-list-2",
                "transaction_type": "sell",
                "quantity": 25.0,
                "price": 110.0,
                "currency": "USD",
            },
        )

        results = await dataflow.express.list("Transaction")

        assert len(results) >= 2


@pytest.mark.asyncio
class TestDividendCRUD:
    """Test Dividend model CRUD operations."""

    async def test_create_dividend(self, dataflow: DataFlow) -> None:
        """Test creating a dividend record."""
        div_data = {
            "id": "div-001",
            "amount": 0.25,
            "currency": "USD",
            "ex_date": "2026-01-15",
            "pay_date": "2026-01-22",
            "dividend_type": "regular",
        }

        result = await dataflow.express.create("Dividend", div_data)

        assert result["id"] == "div-001"
        assert result["amount"] == 0.25
        assert result["dividend_type"] == "regular"

    async def test_list_dividends(self, dataflow: DataFlow) -> None:
        """Test listing dividends."""
        await dataflow.express.create(
            "Dividend",
            {
                "id": "div-list-1",
                "amount": 0.50,
                "currency": "USD",
                "ex_date": "2026-01-01",
                "dividend_type": "regular",
            },
        )

        results = await dataflow.express.list("Dividend")

        assert len(results) >= 1


@pytest.mark.asyncio
class TestPriceHistoryCRUD:
    """Test PriceHistory model CRUD operations."""

    async def test_create_price_history(self, dataflow: DataFlow) -> None:
        """Test creating a price history record."""
        price_data = {
            "id": "price-001",
            "date": "2026-01-08",
            "open": 150.0,
            "high": 155.0,
            "low": 149.0,
            "close": 154.0,
            "volume": 1000000.0,
            "adjusted_close": 154.0,
        }

        result = await dataflow.express.create("PriceHistory", price_data)

        assert result["id"] == "price-001"
        assert result["close"] == 154.0

    async def test_list_price_history(self, dataflow: DataFlow) -> None:
        """Test listing price history."""
        await dataflow.express.create(
            "PriceHistory",
            {
                "id": "price-list-1",
                "date": "2026-01-07",
                "open": 148.0,
                "high": 152.0,
                "low": 147.0,
                "close": 151.0,
                "volume": 900000.0,
            },
        )

        results = await dataflow.express.list("PriceHistory")

        assert len(results) >= 1
