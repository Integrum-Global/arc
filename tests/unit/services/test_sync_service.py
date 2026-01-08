"""Unit tests for SyncService."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.services.sync_service import SyncService

# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def mock_db():
    """Create mock DataFlow instance."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.list = AsyncMock(return_value=[])
    db.express.read = AsyncMock(return_value=None)
    db.express.create = AsyncMock(return_value={})
    db.express.update = AsyncMock(return_value={})
    return db


@pytest.fixture
def sync_service(mock_db):
    """Create SyncService instance."""
    service = SyncService(db=mock_db)
    return service


@pytest.fixture
def mock_workflow_result():
    """Mock workflow execution result."""
    return (
        {
            "compile_summary": {
                "result": {
                    "status": "success",
                    "records_processed": 100,
                    "errors": [],
                }
            }
        },
        "run-123",
    )


# =============================================================================
# INITIALIZATION TESTS
# =============================================================================


class TestSyncServiceInit:
    """Test SyncService initialization."""

    def test_init_with_db(self, mock_db):
        """Test service initializes with database."""
        service = SyncService(db=mock_db)

        assert service.db == mock_db

    def test_init_sets_attributes(self, mock_db):
        """Test service sets expected attributes."""
        service = SyncService(db=mock_db)

        assert hasattr(service, "db")


# =============================================================================
# PRICE SYNC TESTS
# =============================================================================


class TestPriceSync:
    """Test price sync functionality."""

    @pytest.mark.asyncio
    async def test_sync_prices_returns_dict(self, sync_service, mock_workflow_result):
        """Test sync_prices returns a dictionary result."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_prices(security_ids=["AAPL"])

        assert isinstance(result, dict)
        assert "status" in result

    @pytest.mark.asyncio
    async def test_sync_prices_with_date_range(self, sync_service, mock_workflow_result):
        """Test sync_prices with date range."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_prices(
                security_ids=["AAPL"],
                start_date="2024-01-01",
                end_date="2024-12-31",
            )

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_prices_calls_workflow(self, sync_service, mock_workflow_result):
        """Test sync_prices runs workflow."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            await sync_service.sync_prices(security_ids=["AAPL", "MSFT"])

        mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_sync_prices_includes_run_id(self, sync_service, mock_workflow_result):
        """Test sync_prices result includes run_id."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_prices(security_ids=["AAPL"])

        assert "run_id" in result
        assert result["run_id"] == "run-123"


# =============================================================================
# BULK PRICE SYNC TESTS
# =============================================================================


class TestBulkPriceSync:
    """Test bulk price sync functionality."""

    @pytest.mark.asyncio
    async def test_sync_exchange_prices_returns_dict(self, sync_service, mock_workflow_result):
        """Test sync_exchange_prices returns a dictionary result."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_exchange_prices(exchange="US")

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_exchange_prices_with_date(self, sync_service, mock_workflow_result):
        """Test sync_exchange_prices with specific date."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_exchange_prices(
                exchange="US",
                date="2024-12-31",
            )

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_exchange_prices_calls_workflow(self, sync_service, mock_workflow_result):
        """Test sync_exchange_prices runs workflow."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            await sync_service.sync_exchange_prices(exchange="LSE")

        mock_run.assert_called_once()


# =============================================================================
# FUNDAMENTALS SYNC TESTS
# =============================================================================


class TestFundamentalsSync:
    """Test fundamentals sync functionality."""

    @pytest.mark.asyncio
    async def test_sync_fundamentals_returns_dict(self, sync_service, mock_workflow_result):
        """Test sync_fundamentals returns a dictionary result."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_fundamentals(security_ids=["AAPL"])

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_fundamentals_with_options(self, sync_service, mock_workflow_result):
        """Test sync_fundamentals with sync options."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_fundamentals(
                security_ids=["AAPL"],
                sync_annual=True,
                sync_quarterly=True,
                trigger_ratio_calc=True,
            )

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_fundamentals_calls_workflow(self, sync_service, mock_workflow_result):
        """Test sync_fundamentals runs workflow."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            await sync_service.sync_fundamentals(security_ids=["AAPL"])

        mock_run.assert_called_once()


# =============================================================================
# FULL SYNC TESTS
# =============================================================================


class TestFullSync:
    """Test full sync functionality."""

    @pytest.mark.asyncio
    async def test_full_sync_returns_dict(self, sync_service):
        """Test full_sync returns a dictionary result."""
        with patch.object(sync_service, "sync_prices", new_callable=AsyncMock) as mock_prices:
            mock_prices.return_value = {"status": "success"}
            with patch.object(
                sync_service, "sync_fundamentals", new_callable=AsyncMock
            ) as mock_fundamentals:
                mock_fundamentals.return_value = {"status": "success"}

                result = await sync_service.full_sync(security_ids=["AAPL"])

        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_full_sync_calls_both_syncs(self, sync_service):
        """Test full_sync calls both price and fundamentals sync."""
        with patch.object(sync_service, "sync_prices", new_callable=AsyncMock) as mock_prices:
            mock_prices.return_value = {"status": "success"}
            with patch.object(
                sync_service, "sync_fundamentals", new_callable=AsyncMock
            ) as mock_fundamentals:
                mock_fundamentals.return_value = {"status": "success"}

                await sync_service.full_sync(security_ids=["AAPL"])

        mock_prices.assert_called_once()
        mock_fundamentals.assert_called_once()


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestErrorHandling:
    """Test error handling in sync service."""

    @pytest.mark.asyncio
    async def test_sync_prices_handles_workflow_error(self, sync_service):
        """Test sync_prices handles workflow errors gracefully."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.side_effect = Exception("Workflow failed")

            with pytest.raises(Exception, match="Workflow failed"):
                await sync_service.sync_prices(security_ids=["AAPL"])

    @pytest.mark.asyncio
    async def test_sync_fundamentals_handles_workflow_error(self, sync_service):
        """Test sync_fundamentals handles workflow errors gracefully."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.side_effect = Exception("Workflow failed")

            with pytest.raises(Exception, match="Workflow failed"):
                await sync_service.sync_fundamentals(security_ids=["AAPL"])


# =============================================================================
# SERVICE EXPORT TESTS
# =============================================================================


class TestServiceExports:
    """Test service exports."""

    def test_sync_service_exported_from_services(self):
        """Test SyncService is exported from services package."""
        from arc.services import SyncService as ExportedService

        assert ExportedService is SyncService

    def test_sync_service_has_required_methods(self, sync_service):
        """Test SyncService has all required methods."""
        required_methods = [
            "sync_prices",
            "sync_exchange_prices",
            "sync_fundamentals",
            "full_sync",
        ]

        for method in required_methods:
            assert hasattr(sync_service, method), f"Missing method: {method}"
            assert callable(getattr(sync_service, method)), f"Not callable: {method}"


# =============================================================================
# PARAMETER VALIDATION TESTS
# =============================================================================


class TestParameterValidation:
    """Test parameter validation."""

    @pytest.mark.asyncio
    async def test_sync_prices_empty_ids(self, sync_service, mock_workflow_result):
        """Test sync_prices with empty security IDs."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_prices(security_ids=[])

        # Should still work, just sync nothing
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_prices_none_ids(self, sync_service, mock_workflow_result):
        """Test sync_prices with None security IDs."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_prices(security_ids=None)

        # Should still work, will query all securities
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_sync_exchange_prices_empty_exchange(self, sync_service, mock_workflow_result):
        """Test sync_exchange_prices with empty exchange."""
        with patch.object(sync_service, "execute_workflow", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_workflow_result

            result = await sync_service.sync_exchange_prices(exchange="")

        # Should still build, error at runtime
        assert isinstance(result, dict)
