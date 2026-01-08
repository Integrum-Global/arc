"""
Unit tests for AnalyticsService.

Tests cover:
- Ratio calculations
- Threshold alerting
- Alert management
- Peer group management
- Benchmarking
- Trend analysis
"""

from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from arc.services import AnalyticsService, ConflictError, NotFoundError, ValidationError

# ============================================
# Fixtures
# ============================================


@pytest.fixture
def mock_db():
    """Create a mock DataFlow database."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.create = AsyncMock()
    db.express.read = AsyncMock()
    db.express.update = AsyncMock()
    db.express.delete = AsyncMock()
    db.express.list = AsyncMock()
    return db


@pytest.fixture
def service(mock_db):
    """Create an AnalyticsService with mocked database."""
    return AnalyticsService(
        db=mock_db,
        tenant_id="tenant-001",
        user_id="user-001",
    )


@pytest.fixture
def sample_security():
    """Sample security data."""
    return {
        "id": "sec-AAPL",
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "asset_type": "equity",
        "active": True,
    }


@pytest.fixture
def sample_fundamentals():
    """Sample company fundamentals data."""
    return {
        "id": "fund-001",
        "security_id": "sec-AAPL",
        "fiscal_date": "2024-12-31",
        "revenue": "100000000",
        "gross_profit": "40000000",
        "operating_income": "30000000",
        "net_income": "25000000",
        "total_assets": "500000000",
        "total_equity": "200000000",
        "total_debt": "150000000",
        "current_assets": "80000000",
        "current_liabilities": "40000000",
        "cash_and_equivalents": "30000000",
        "inventory": "20000000",
        "ebit": "32000000",
        "ebitda": "45000000",
        "interest_expense": "8000000",
        "cost_of_revenue": "60000000",
    }


@pytest.fixture
def sample_ratio():
    """Sample security ratio data."""
    return {
        "id": "sec-AAPL_2024-01-15_current_ratio",
        "security_id": "sec-AAPL",
        "calculation_date": "2024-01-15",
        "ratio_class": "liquidity",
        "ratio_name": "current_ratio",
        "ratio_value": "2.0",
    }


@pytest.fixture
def sample_threshold():
    """Sample alert threshold data."""
    return {
        "id": "thresh-001",
        "user_id": "user-001",
        "ratio_class": "liquidity",
        "ratio_name": "current_ratio",
        "warning_threshold": "1.5",
        "critical_threshold": "1.0",
        "comparison": "lt",
        "enabled": True,
        "cooldown_hours": 24,
        "times_triggered": 0,
    }


@pytest.fixture
def sample_alert():
    """Sample alert data."""
    return {
        "id": "alert-001",
        "user_id": "user-001",
        "security_id": "sec-AAPL",
        "alert_type": "threshold",
        "severity": "warning",
        "title": "current_ratio lt threshold breached",
        "status": "active",
        "triggered_at": "2024-01-15T10:00:00+00:00",
    }


@pytest.fixture
def sample_peer_group():
    """Sample peer group data."""
    return {
        "id": "peer-001",
        "user_id": "user-001",
        "name": "Tech Giants",
        "group_type": "custom",
        "security_ids": ["sec-AAPL", "sec-MSFT", "sec-GOOGL"],
        "member_count": 3,
        "active": True,
    }


# ============================================
# Ratio Calculation Tests
# ============================================


class TestCalculateRatios:
    """Tests for calculate_ratios method."""

    @pytest.mark.asyncio
    async def test_calculate_ratios_success(
        self, service, mock_db, sample_security, sample_fundamentals
    ):
        """Test successful ratio calculation."""
        mock_db.express.list.side_effect = [
            [sample_security],  # Securities list
            [sample_fundamentals],  # Fundamentals
        ]
        mock_db.express.read.return_value = None  # No existing ratios
        mock_db.express.create.return_value = {"id": "ratio-001"}

        result = await service.calculate_ratios(
            security_ids=["sec-AAPL"],
            ratio_names=["current_ratio"],
        )

        assert result["securities_processed"] == 1
        assert result["errors"] == 0
        assert "calculation_date" in result

    @pytest.mark.asyncio
    async def test_calculate_ratios_no_fundamentals(self, service, mock_db, sample_security):
        """Test calculation when no fundamentals exist."""
        mock_db.express.list.side_effect = [
            [sample_security],  # Securities
            [],  # No fundamentals
        ]

        result = await service.calculate_ratios(security_ids=["sec-AAPL"])

        assert result["securities_processed"] == 1
        assert result["ratios_calculated"] == 0

    @pytest.mark.asyncio
    async def test_calculate_ratios_skip_existing(
        self, service, mock_db, sample_security, sample_fundamentals, sample_ratio
    ):
        """Test that existing ratios are skipped unless force_recalculate."""
        mock_db.express.list.side_effect = [
            [sample_security],
            [sample_fundamentals],
        ]
        mock_db.express.read.return_value = sample_ratio  # Existing ratio

        await service.calculate_ratios(
            security_ids=["sec-AAPL"],
            ratio_names=["current_ratio"],
            force_recalculate=False,
        )

        # Should not have created/updated since ratio exists
        mock_db.express.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_calculate_ratios_force_recalculate(
        self, service, mock_db, sample_security, sample_fundamentals, sample_ratio
    ):
        """Test force recalculation updates existing ratios."""
        mock_db.express.list.side_effect = [
            [sample_security],
            [sample_fundamentals],
        ]
        mock_db.express.read.return_value = sample_ratio
        mock_db.express.update.return_value = sample_ratio

        await service.calculate_ratios(
            security_ids=["sec-AAPL"],
            ratio_names=["current_ratio"],
            force_recalculate=True,
        )

        mock_db.express.update.assert_called()


class TestCalculateRatioHelper:
    """Tests for _calculate_ratio helper method."""

    def test_current_ratio(self, service):
        """Test current ratio calculation."""
        fundamentals = {
            "current_assets": "200000",
            "current_liabilities": "100000",
        }
        result = service._calculate_ratio("current_ratio", fundamentals)
        assert result == Decimal("2.0")

    def test_quick_ratio(self, service):
        """Test quick ratio calculation."""
        fundamentals = {
            "current_assets": "200000",
            "inventory": "50000",
            "current_liabilities": "100000",
        }
        result = service._calculate_ratio("quick_ratio", fundamentals)
        assert result == Decimal("1.5")

    def test_gross_margin(self, service):
        """Test gross margin calculation."""
        fundamentals = {
            "gross_profit": "40000",
            "revenue": "100000",
        }
        result = service._calculate_ratio("gross_margin", fundamentals)
        assert result == Decimal("0.4")

    def test_return_on_equity(self, service):
        """Test ROE calculation."""
        fundamentals = {
            "net_income": "50000",
            "total_equity": "200000",
        }
        result = service._calculate_ratio("return_on_equity", fundamentals)
        assert result == Decimal("0.25")

    def test_debt_to_equity(self, service):
        """Test debt to equity calculation."""
        fundamentals = {
            "total_debt": "100000",
            "total_equity": "200000",
        }
        result = service._calculate_ratio("debt_to_equity", fundamentals)
        assert result == Decimal("0.5")

    def test_division_by_zero(self, service):
        """Test handling of division by zero."""
        fundamentals = {
            "current_assets": "200000",
            "current_liabilities": "0",  # Zero denominator
        }
        result = service._calculate_ratio("current_ratio", fundamentals)
        assert result is None

    def test_missing_data(self, service):
        """Test handling of missing data."""
        fundamentals = {}  # Empty
        result = service._calculate_ratio("current_ratio", fundamentals)
        assert result is None

    def test_unknown_ratio(self, service):
        """Test handling of unknown ratio name."""
        fundamentals = {"revenue": "100000"}
        result = service._calculate_ratio("unknown_ratio", fundamentals)
        assert result is None


class TestGetSecurityRatios:
    """Tests for get_security_ratios method."""

    @pytest.mark.asyncio
    async def test_get_security_ratios_success(
        self, service, mock_db, sample_security, sample_ratio
    ):
        """Test successful ratio retrieval."""
        mock_db.express.read.return_value = sample_security
        mock_db.express.list.return_value = [sample_ratio]

        result = await service.get_security_ratios("sec-AAPL")

        assert result is not None
        assert result["security_id"] == "sec-AAPL"
        assert "liquidity" in result
        assert "current_ratio" in result["liquidity"]

    @pytest.mark.asyncio
    async def test_get_security_ratios_not_found(self, service, mock_db):
        """Test retrieval for non-existent security."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError) as exc_info:
            await service.get_security_ratios("sec-NOTFOUND")

        assert "sec-NOTFOUND" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_security_ratios_no_ratios(self, service, mock_db, sample_security):
        """Test retrieval when no ratios exist."""
        mock_db.express.read.return_value = sample_security
        mock_db.express.list.return_value = []

        result = await service.get_security_ratios("sec-AAPL")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_security_ratios_with_date(
        self, service, mock_db, sample_security, sample_ratio
    ):
        """Test retrieval with specific date."""
        mock_db.express.read.return_value = sample_security
        mock_db.express.list.return_value = [sample_ratio]

        result = await service.get_security_ratios("sec-AAPL", as_of_date="2024-01-15")

        assert result is not None
        # Verify filter was called with date
        call_args = mock_db.express.list.call_args
        assert call_args[1]["filter"]["calculation_date"] == "2024-01-15"


class TestGetRatioHistory:
    """Tests for get_ratio_history method."""

    @pytest.mark.asyncio
    async def test_get_ratio_history_success(self, service, mock_db):
        """Test successful history retrieval."""
        history = [
            {"id": "r1", "calculation_date": "2024-01-15", "ratio_value": "2.0"},
            {"id": "r2", "calculation_date": "2024-01-10", "ratio_value": "1.9"},
        ]
        mock_db.express.list.return_value = history

        result = await service.get_ratio_history(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
        )

        assert len(result) == 2
        assert result[0]["ratio_value"] == "2.0"

    @pytest.mark.asyncio
    async def test_get_ratio_history_with_date_range(self, service, mock_db):
        """Test history retrieval with date range."""
        mock_db.express.list.return_value = []

        await service.get_ratio_history(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
            start_date="2024-01-01",
            end_date="2024-01-31",
        )

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert "$gte" in filter_dict["calculation_date"]
        assert "$lte" in filter_dict["calculation_date"]


# ============================================
# Threshold Alerting Tests
# ============================================


class TestConfigureThreshold:
    """Tests for configure_threshold method."""

    @pytest.mark.asyncio
    async def test_configure_threshold_create(self, service, mock_db, sample_threshold):
        """Test creating a new threshold."""
        mock_db.express.list.return_value = []  # No existing
        mock_db.express.create.return_value = sample_threshold

        result = await service.configure_threshold(
            ratio_class="liquidity",
            ratio_name="current_ratio",
            warning_threshold="1.5",
            critical_threshold="1.0",
        )

        assert result["ratio_name"] == "current_ratio"
        mock_db.express.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_configure_threshold_update(self, service, mock_db, sample_threshold):
        """Test updating an existing threshold."""
        mock_db.express.list.return_value = [sample_threshold]
        mock_db.express.update.return_value = {**sample_threshold, "warning_threshold": "1.8"}

        result = await service.configure_threshold(
            ratio_class="liquidity",
            ratio_name="current_ratio",
            warning_threshold="1.8",
            critical_threshold="1.2",
        )

        mock_db.express.update.assert_called_once()
        assert result["warning_threshold"] == "1.8"

    @pytest.mark.asyncio
    async def test_configure_threshold_no_user(self, mock_db):
        """Test threshold configuration without user ID."""
        service = AnalyticsService(db=mock_db, tenant_id="tenant-001", user_id=None)

        with pytest.raises(ValidationError) as exc_info:
            await service.configure_threshold(
                ratio_class="liquidity",
                ratio_name="current_ratio",
                warning_threshold="1.5",
                critical_threshold="1.0",
            )

        assert "User ID required" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_configure_threshold_invalid_ratio(self, service):
        """Test with invalid ratio name."""
        with pytest.raises(ValidationError) as exc_info:
            await service.configure_threshold(
                ratio_class="liquidity",
                ratio_name="invalid_ratio",
                warning_threshold="1.5",
                critical_threshold="1.0",
            )

        assert "Unknown ratio" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_configure_threshold_invalid_comparison(self, service):
        """Test with invalid comparison operator."""
        with pytest.raises(ValidationError) as exc_info:
            await service.configure_threshold(
                ratio_class="liquidity",
                ratio_name="current_ratio",
                warning_threshold="1.5",
                critical_threshold="1.0",
                comparison="invalid",
            )

        assert "Invalid comparison" in str(exc_info.value)


class TestGetThresholds:
    """Tests for get_thresholds method."""

    @pytest.mark.asyncio
    async def test_get_thresholds_success(self, service, mock_db, sample_threshold):
        """Test successful threshold retrieval."""
        mock_db.express.list.return_value = [sample_threshold]

        result = await service.get_thresholds()

        assert len(result) == 1
        assert result[0]["ratio_name"] == "current_ratio"

    @pytest.mark.asyncio
    async def test_get_thresholds_no_user(self, mock_db):
        """Test threshold retrieval without user ID."""
        service = AnalyticsService(db=mock_db, tenant_id="tenant-001", user_id=None)

        result = await service.get_thresholds()

        assert result == []

    @pytest.mark.asyncio
    async def test_get_thresholds_with_filters(self, service, mock_db):
        """Test threshold retrieval with filters."""
        mock_db.express.list.return_value = []

        await service.get_thresholds(
            ratio_name="current_ratio",
            portfolio_id="port-001",
            enabled_only=True,
        )

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert filter_dict["ratio_name"] == "current_ratio"
        assert filter_dict["portfolio_id"] == "port-001"
        assert filter_dict["enabled"] is True


class TestDeleteThreshold:
    """Tests for delete_threshold method."""

    @pytest.mark.asyncio
    async def test_delete_threshold_success(self, service, mock_db, sample_threshold):
        """Test successful threshold deletion."""
        mock_db.express.read.return_value = sample_threshold
        mock_db.express.delete.return_value = True

        result = await service.delete_threshold("thresh-001")

        assert result is True
        mock_db.express.delete.assert_called_once_with("AlertThreshold", "thresh-001")

    @pytest.mark.asyncio
    async def test_delete_threshold_not_found(self, service, mock_db):
        """Test deletion of non-existent threshold."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.delete_threshold("thresh-notfound")

    @pytest.mark.asyncio
    async def test_delete_threshold_wrong_user(self, service, mock_db, sample_threshold):
        """Test deletion of another user's threshold."""
        sample_threshold["user_id"] = "other-user"
        mock_db.express.read.return_value = sample_threshold

        with pytest.raises(ValidationError) as exc_info:
            await service.delete_threshold("thresh-001")

        assert "another user" in str(exc_info.value)


class TestCheckThresholds:
    """Tests for check_thresholds method."""

    @pytest.mark.asyncio
    async def test_check_thresholds_success(self, service, mock_db, sample_threshold, sample_ratio):
        """Test successful threshold checking."""
        sample_threshold["security_id"] = "sec-AAPL"
        sample_ratio["ratio_value"] = "0.8"  # Below critical threshold

        mock_db.express.list.side_effect = [
            [sample_threshold],  # Thresholds
            [sample_ratio],  # Ratios
        ]
        mock_db.express.create.return_value = {"id": "alert-001"}
        mock_db.express.update.return_value = sample_threshold

        result = await service.check_thresholds()

        assert result["thresholds_checked"] == 1
        assert result["alerts_generated"] == 1

    @pytest.mark.asyncio
    async def test_check_thresholds_no_user(self, mock_db):
        """Test threshold check without user ID."""
        service = AnalyticsService(db=mock_db, tenant_id="tenant-001", user_id=None)

        with pytest.raises(ValidationError):
            await service.check_thresholds()

    @pytest.mark.asyncio
    async def test_check_thresholds_cooldown(
        self, service, mock_db, sample_threshold, sample_ratio
    ):
        """Test that cooldown prevents re-alerting."""
        sample_threshold["security_id"] = "sec-AAPL"
        sample_threshold["last_triggered_at"] = datetime.now(UTC).isoformat()  # Just triggered
        sample_ratio["ratio_value"] = "0.8"  # Below critical

        mock_db.express.list.side_effect = [
            [sample_threshold],
            [sample_ratio],
        ]

        result = await service.check_thresholds()

        assert result["thresholds_checked"] == 1
        assert result["alerts_generated"] == 0  # Cooldown prevented alert


# ============================================
# Alert Management Tests
# ============================================


class TestGetUserAlerts:
    """Tests for get_user_alerts method."""

    @pytest.mark.asyncio
    async def test_get_user_alerts_success(self, service, mock_db, sample_alert):
        """Test successful alert retrieval."""
        mock_db.express.list.return_value = [sample_alert]

        result = await service.get_user_alerts()

        assert len(result) == 1
        assert result[0]["alert_type"] == "threshold"

    @pytest.mark.asyncio
    async def test_get_user_alerts_with_filters(self, service, mock_db):
        """Test alert retrieval with filters."""
        mock_db.express.list.return_value = []

        await service.get_user_alerts(
            status="active",
            alert_type="threshold",
            severity="warning",
        )

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert filter_dict["status"] == "active"
        assert filter_dict["alert_type"] == "threshold"
        assert filter_dict["severity"] == "warning"


class TestAcknowledgeAlert:
    """Tests for acknowledge_alert method."""

    @pytest.mark.asyncio
    async def test_acknowledge_alert_success(self, service, mock_db, sample_alert):
        """Test successful alert acknowledgment."""
        mock_db.express.read.return_value = sample_alert
        mock_db.express.update.return_value = {**sample_alert, "status": "acknowledged"}

        result = await service.acknowledge_alert("alert-001")

        assert result["status"] == "acknowledged"
        call_args = mock_db.express.update.call_args
        assert call_args[1]["fields"]["status"] == "acknowledged"
        assert "acknowledged_at" in call_args[1]["fields"]

    @pytest.mark.asyncio
    async def test_acknowledge_alert_not_found(self, service, mock_db):
        """Test acknowledging non-existent alert."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.acknowledge_alert("alert-notfound")

    @pytest.mark.asyncio
    async def test_acknowledge_alert_wrong_user(self, service, mock_db, sample_alert):
        """Test acknowledging another user's alert."""
        sample_alert["user_id"] = "other-user"
        mock_db.express.read.return_value = sample_alert

        with pytest.raises(ValidationError):
            await service.acknowledge_alert("alert-001")


class TestDismissAlert:
    """Tests for dismiss_alert method."""

    @pytest.mark.asyncio
    async def test_dismiss_alert_success(self, service, mock_db, sample_alert):
        """Test successful alert dismissal."""
        mock_db.express.read.return_value = sample_alert
        mock_db.express.update.return_value = {**sample_alert, "status": "dismissed"}

        result = await service.dismiss_alert("alert-001", reason="False positive")

        assert result["status"] == "dismissed"
        call_args = mock_db.express.update.call_args
        assert call_args[1]["fields"]["dismiss_reason"] == "False positive"


class TestResolveAlert:
    """Tests for resolve_alert method."""

    @pytest.mark.asyncio
    async def test_resolve_alert_success(self, service, mock_db, sample_alert):
        """Test successful alert resolution."""
        mock_db.express.read.return_value = sample_alert
        mock_db.express.update.return_value = {**sample_alert, "status": "resolved"}

        result = await service.resolve_alert("alert-001", resolution_notes="Fixed the issue")

        assert result["status"] == "resolved"
        call_args = mock_db.express.update.call_args
        assert call_args[1]["fields"]["resolution_notes"] == "Fixed the issue"


# ============================================
# Peer Group Tests
# ============================================


class TestCreatePeerGroup:
    """Tests for create_peer_group method."""

    @pytest.mark.asyncio
    async def test_create_peer_group_success(self, service, mock_db, sample_peer_group):
        """Test successful peer group creation."""
        mock_db.express.list.return_value = []  # No existing
        mock_db.express.create.return_value = sample_peer_group

        result = await service.create_peer_group(
            name="Tech Giants",
            security_ids=["sec-AAPL", "sec-MSFT", "sec-GOOGL"],
            description="Large cap tech companies",
        )

        assert result["name"] == "Tech Giants"
        assert result["member_count"] == 3

    @pytest.mark.asyncio
    async def test_create_peer_group_duplicate(self, service, mock_db, sample_peer_group):
        """Test creating duplicate peer group."""
        mock_db.express.list.return_value = [sample_peer_group]

        with pytest.raises(ConflictError) as exc_info:
            await service.create_peer_group(
                name="Tech Giants",
                security_ids=["sec-AAPL"],
            )

        assert "already exists" in str(exc_info.value)


class TestGetPeerGroups:
    """Tests for get_peer_groups method."""

    @pytest.mark.asyncio
    async def test_get_peer_groups_success(self, service, mock_db, sample_peer_group):
        """Test successful peer group retrieval."""
        mock_db.express.list.side_effect = [
            [sample_peer_group],  # User groups
            [],  # System groups
        ]

        result = await service.get_peer_groups()

        assert len(result) == 1
        assert result[0]["name"] == "Tech Giants"

    @pytest.mark.asyncio
    async def test_get_peer_groups_include_system(self, service, mock_db, sample_peer_group):
        """Test including system peer groups."""
        system_group = {**sample_peer_group, "id": "peer-sys", "user_id": None, "name": "S&P 500"}
        mock_db.express.list.side_effect = [
            [sample_peer_group],  # User groups
            [system_group],  # System groups
        ]

        result = await service.get_peer_groups(include_system=True)

        assert len(result) == 2


class TestUpdatePeerGroup:
    """Tests for update_peer_group method."""

    @pytest.mark.asyncio
    async def test_update_peer_group_success(self, service, mock_db, sample_peer_group):
        """Test successful peer group update."""
        mock_db.express.read.return_value = sample_peer_group
        mock_db.express.update.return_value = {**sample_peer_group, "description": "Updated"}

        result = await service.update_peer_group(
            "peer-001",
            {"description": "Updated description"},
        )

        assert result["description"] == "Updated"

    @pytest.mark.asyncio
    async def test_update_peer_group_updates_member_count(
        self, service, mock_db, sample_peer_group
    ):
        """Test that member count updates with security_ids."""
        mock_db.express.read.return_value = sample_peer_group
        mock_db.express.update.return_value = {**sample_peer_group, "member_count": 5}

        await service.update_peer_group(
            "peer-001",
            {"security_ids": ["sec-1", "sec-2", "sec-3", "sec-4", "sec-5"]},
        )

        call_args = mock_db.express.update.call_args
        assert call_args[1]["fields"]["member_count"] == 5

    @pytest.mark.asyncio
    async def test_update_peer_group_not_found(self, service, mock_db):
        """Test updating non-existent peer group."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.update_peer_group("peer-notfound", {"description": "Test"})


class TestDeletePeerGroup:
    """Tests for delete_peer_group method."""

    @pytest.mark.asyncio
    async def test_delete_peer_group_success(self, service, mock_db, sample_peer_group):
        """Test successful peer group deletion."""
        mock_db.express.read.return_value = sample_peer_group
        mock_db.express.delete.return_value = True

        result = await service.delete_peer_group("peer-001")

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_system_peer_group(self, service, mock_db, sample_peer_group):
        """Test deleting system peer group fails."""
        sample_peer_group["user_id"] = None  # System group
        mock_db.express.read.return_value = sample_peer_group

        with pytest.raises(ValidationError) as exc_info:
            await service.delete_peer_group("peer-001")

        assert "system peer group" in str(exc_info.value)


class TestBenchmarkAgainstPeers:
    """Tests for benchmark_against_peers method."""

    @pytest.mark.asyncio
    async def test_benchmark_success(self, service, mock_db, sample_peer_group):
        """Test successful peer benchmarking."""
        # Setup peer group
        mock_db.express.read.return_value = sample_peer_group

        # Setup security ratios
        security_ratios = {
            "security_id": "sec-AAPL",
            "calculation_date": "2024-01-15",
            "liquidity": {"current_ratio": {"value": "2.0"}},
            "profitability": {},
            "efficiency": {},
            "leverage": {},
            "valuation": {},
            "growth": {},
        }

        # Mock get_security_ratios
        service.get_security_ratios = AsyncMock(return_value=security_ratios)

        # Setup peer ratio values
        def list_side_effect(model, **kwargs):
            if model == "SecurityRatio":
                return [{"ratio_value": "1.8"}]
            return []

        mock_db.express.list.side_effect = list_side_effect

        result = await service.benchmark_against_peers(
            security_id="sec-AAPL",
            peer_group_id="peer-001",
            ratio_names=["current_ratio"],
        )

        assert result["security_id"] == "sec-AAPL"
        assert result["peer_group_id"] == "peer-001"
        assert "comparisons" in result

    @pytest.mark.asyncio
    async def test_benchmark_peer_group_not_found(self, service, mock_db):
        """Test benchmarking with non-existent peer group."""
        mock_db.express.read.return_value = None

        with pytest.raises(NotFoundError):
            await service.benchmark_against_peers(
                security_id="sec-AAPL",
                peer_group_id="peer-notfound",
            )

    @pytest.mark.asyncio
    async def test_benchmark_empty_peer_group(self, service, mock_db, sample_peer_group):
        """Test benchmarking against empty peer group."""
        sample_peer_group["security_ids"] = []
        mock_db.express.read.return_value = sample_peer_group

        with pytest.raises(ValidationError) as exc_info:
            await service.benchmark_against_peers(
                security_id="sec-AAPL",
                peer_group_id="peer-001",
            )

        assert "no members" in str(exc_info.value)


# ============================================
# Trend Analysis Tests
# ============================================


class TestGetRatioTrend:
    """Tests for get_ratio_trend method."""

    @pytest.mark.asyncio
    async def test_trend_improving(self, service, mock_db):
        """Test detecting improving trend."""
        history = [
            {"calculation_date": "2024-01-01", "ratio_value": "1.0"},
            {"calculation_date": "2024-01-15", "ratio_value": "1.2"},
        ]
        mock_db.express.list.return_value = history

        result = await service.get_ratio_trend(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
        )

        assert result["trend_direction"] == "improving"
        assert result["data_points"] == 2

    @pytest.mark.asyncio
    async def test_trend_declining(self, service, mock_db):
        """Test detecting declining trend."""
        history = [
            {"calculation_date": "2024-01-01", "ratio_value": "2.0"},
            {"calculation_date": "2024-01-15", "ratio_value": "1.5"},
        ]
        mock_db.express.list.return_value = history

        result = await service.get_ratio_trend(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
        )

        assert result["trend_direction"] == "declining"

    @pytest.mark.asyncio
    async def test_trend_stable(self, service, mock_db):
        """Test detecting stable trend."""
        history = [
            {"calculation_date": "2024-01-01", "ratio_value": "2.0"},
            {"calculation_date": "2024-01-15", "ratio_value": "2.02"},  # < 5% change
        ]
        mock_db.express.list.return_value = history

        result = await service.get_ratio_trend(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
        )

        assert result["trend_direction"] == "stable"

    @pytest.mark.asyncio
    async def test_trend_insufficient_data(self, service, mock_db):
        """Test trend with insufficient data points."""
        history = [{"calculation_date": "2024-01-01", "ratio_value": "2.0"}]
        mock_db.express.list.return_value = history

        result = await service.get_ratio_trend(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
        )

        assert result["trend_direction"] == "unknown"
        assert result["data_points"] == 1


class TestComparePeriods:
    """Tests for compare_periods method."""

    @pytest.mark.asyncio
    async def test_compare_periods_success(self, service, mock_db):
        """Test successful period comparison."""
        current = {"calculation_date": "2024-01-15", "ratio_value": "2.0"}
        historical = {"calculation_date": "2023-01-15", "ratio_value": "1.8"}

        mock_db.express.list.side_effect = [[current], [historical]]

        result = await service.compare_periods(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
            current_date="2024-01-15",
            comparison_date="2023-01-15",
        )

        assert result["current_value"] == "2.0"
        assert result["comparison_value"] == "1.8"
        assert result["absolute_change"] is not None
        assert result["percent_change"] is not None

    @pytest.mark.asyncio
    async def test_compare_periods_no_current(self, service, mock_db):
        """Test comparison when no current ratio exists."""
        mock_db.express.list.return_value = []

        with pytest.raises(NotFoundError):
            await service.compare_periods(
                security_id="sec-AAPL",
                ratio_name="current_ratio",
            )

    @pytest.mark.asyncio
    async def test_compare_periods_no_historical(self, service, mock_db):
        """Test comparison when no historical data exists."""
        current = {"calculation_date": "2024-01-15", "ratio_value": "2.0"}
        mock_db.express.list.side_effect = [[current], []]

        result = await service.compare_periods(
            security_id="sec-AAPL",
            ratio_name="current_ratio",
            comparison_date="2023-01-15",
        )

        assert result["current_value"] == "2.0"
        assert result["comparison_value"] is None
        assert result["absolute_change"] is None


# ============================================
# Service Registry Integration Tests
# ============================================


class TestServiceRegistryIntegration:
    """Tests for AnalyticsService integration with ServiceRegistry."""

    def test_analytics_service_in_registry(self, mock_db):
        """Test that AnalyticsService is accessible from ServiceRegistry."""
        from arc.services import ServiceRegistry

        registry = ServiceRegistry(
            db=mock_db,
            tenant_id="tenant-001",
            user_id="user-001",
        )

        # Access analytics service - should lazy load
        analytics = registry.analytics

        assert analytics is not None
        assert isinstance(analytics, AnalyticsService)
        assert analytics.tenant_id == "tenant-001"
        assert analytics.user_id == "user-001"

    def test_analytics_service_export(self):
        """Test that AnalyticsService is exported from arc.services."""
        from arc.services import AnalyticsService as ExportedService

        assert ExportedService is AnalyticsService
