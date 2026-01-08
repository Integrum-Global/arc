"""Unit tests for analytics domain models.

These tests verify model structure, field definitions, and DataFlow configuration
without requiring a running database. Integration tests with real database
operations are in tests/integration/models/.
"""


class TestAlertModel:
    """Tests for Alert model structure."""

    def test_alert_has_required_fields(self) -> None:
        """Test Alert model has required fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "alert_type" in annotations
        assert "severity" in annotations
        assert "title" in annotations
        assert "message" in annotations
        assert "triggered_at" in annotations

    def test_alert_has_relationship_fields(self) -> None:
        """Test Alert model has relationship fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "user_id" in annotations
        assert "portfolio_id" in annotations
        assert "security_id" in annotations

    def test_alert_has_trigger_fields(self) -> None:
        """Test Alert model has trigger detail fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "trigger_value" in annotations
        assert "threshold_value" in annotations
        assert "ratio_name" in annotations
        assert "comparison" in annotations

    def test_alert_has_action_fields(self) -> None:
        """Test Alert model has suggested action fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "suggested_actions" in annotations
        assert "action_url" in annotations

    def test_alert_has_status_workflow_fields(self) -> None:
        """Test Alert has status workflow fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "status" in annotations
        assert "acknowledged_at" in annotations
        assert "acknowledged_by" in annotations
        assert "dismissed_at" in annotations
        assert "resolved_at" in annotations

    def test_alert_has_delivery_fields(self) -> None:
        """Test Alert has delivery status fields."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__
        assert "delivery_status" in annotations
        assert annotations["delivery_status"] is dict

    def test_alert_is_multi_tenant(self) -> None:
        """Test Alert is multi-tenant."""
        from arc.models.analytics import Alert

        config = getattr(Alert, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_alert_has_audit_log(self) -> None:
        """Test Alert has audit_log enabled."""
        from arc.models.analytics import Alert

        config = getattr(Alert, "__dataflow__", {})
        assert config.get("audit_log") is True

    def test_alert_indexes(self) -> None:
        """Test Alert has correct indexes defined."""
        from arc.models.analytics import Alert

        indexes = getattr(Alert, "__indexes__", [])
        assert len(indexes) >= 4

        # Check user_id+status index exists
        user_status_index = next(
            (
                idx
                for idx in indexes
                if "user_id" in idx.get("fields", []) and "status" in idx.get("fields", [])
            ),
            None,
        )
        assert user_status_index is not None


class TestAlertThresholdModel:
    """Tests for AlertThreshold model structure."""

    def test_threshold_has_required_fields(self) -> None:
        """Test AlertThreshold model has required fields."""
        from arc.models.analytics import AlertThreshold

        annotations = AlertThreshold.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "ratio_class" in annotations
        assert "ratio_name" in annotations
        assert "warning_threshold" in annotations
        assert "critical_threshold" in annotations
        assert "comparison" in annotations

    def test_threshold_has_scope_fields(self) -> None:
        """Test AlertThreshold has scope fields."""
        from arc.models.analytics import AlertThreshold

        annotations = AlertThreshold.__annotations__
        assert "portfolio_id" in annotations
        assert "security_id" in annotations

    def test_threshold_has_settings_fields(self) -> None:
        """Test AlertThreshold has settings fields."""
        from arc.models.analytics import AlertThreshold

        annotations = AlertThreshold.__annotations__
        assert "enabled" in annotations
        assert "alert_on_improvement" in annotations
        assert "cooldown_hours" in annotations

    def test_threshold_has_tracking_fields(self) -> None:
        """Test AlertThreshold has tracking fields."""
        from arc.models.analytics import AlertThreshold

        annotations = AlertThreshold.__annotations__
        assert "last_triggered_at" in annotations
        assert "last_triggered_value" in annotations
        assert "times_triggered" in annotations

    def test_threshold_is_multi_tenant(self) -> None:
        """Test AlertThreshold is multi-tenant."""
        from arc.models.analytics import AlertThreshold

        config = getattr(AlertThreshold, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_threshold_indexes(self) -> None:
        """Test AlertThreshold has correct indexes defined."""
        from arc.models.analytics import AlertThreshold

        indexes = getattr(AlertThreshold, "__indexes__", [])
        assert len(indexes) >= 2

        # Check user_id+ratio_name index exists
        user_ratio_index = next(
            (
                idx
                for idx in indexes
                if "user_id" in idx.get("fields", []) and "ratio_name" in idx.get("fields", [])
            ),
            None,
        )
        assert user_ratio_index is not None


class TestPeerGroupModel:
    """Tests for PeerGroup model structure."""

    def test_peer_group_has_required_fields(self) -> None:
        """Test PeerGroup model has required fields."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "id" in annotations
        assert "name" in annotations
        assert "group_type" in annotations

    def test_peer_group_has_ownership_field(self) -> None:
        """Test PeerGroup has optional user_id for system vs user groups."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "user_id" in annotations

    def test_peer_group_has_criteria_field(self) -> None:
        """Test PeerGroup has criteria dict."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "criteria" in annotations
        assert annotations["criteria"] is dict

    def test_peer_group_has_membership_fields(self) -> None:
        """Test PeerGroup has membership list fields."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "security_ids" in annotations
        assert "exclude_security_ids" in annotations

    def test_peer_group_has_refresh_fields(self) -> None:
        """Test PeerGroup has auto-refresh fields."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "auto_refresh" in annotations
        assert "refresh_frequency" in annotations
        assert "last_refreshed_at" in annotations

    def test_peer_group_has_statistics_fields(self) -> None:
        """Test PeerGroup has statistics fields."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__
        assert "member_count" in annotations
        assert "stats_date" in annotations
        assert "avg_market_cap" in annotations

    def test_peer_group_is_multi_tenant(self) -> None:
        """Test PeerGroup is multi-tenant."""
        from arc.models.analytics import PeerGroup

        config = getattr(PeerGroup, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_peer_group_indexes(self) -> None:
        """Test PeerGroup has correct indexes defined."""
        from arc.models.analytics import PeerGroup

        indexes = getattr(PeerGroup, "__indexes__", [])
        assert len(indexes) >= 2

        # Check user_id index exists
        user_index = next((idx for idx in indexes if "user_id" in idx.get("fields", [])), None)
        assert user_index is not None


class TestReportModel:
    """Tests for Report model structure."""

    def test_report_has_required_fields(self) -> None:
        """Test Report model has required fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "report_type" in annotations
        assert "report_name" in annotations
        assert "requested_at" in annotations

    def test_report_has_scope_fields(self) -> None:
        """Test Report has scope fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "portfolio_id" in annotations
        assert "security_id" in annotations

    def test_report_has_parameter_fields(self) -> None:
        """Test Report has parameter fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "parameters" in annotations
        assert "date_range_start" in annotations
        assert "date_range_end" in annotations
        assert "as_of_date" in annotations

    def test_report_has_format_field(self) -> None:
        """Test Report has output format field."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "output_format" in annotations

    def test_report_has_status_fields(self) -> None:
        """Test Report has status fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "status" in annotations
        assert "progress_percent" in annotations
        assert "error_message" in annotations

    def test_report_has_output_fields(self) -> None:
        """Test Report has output fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "output_url" in annotations
        assert "output_size_bytes" in annotations
        assert "page_count" in annotations

    def test_report_has_timing_fields(self) -> None:
        """Test Report has timing fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "started_at" in annotations
        assert "completed_at" in annotations
        assert "expires_at" in annotations

    def test_report_has_scheduling_fields(self) -> None:
        """Test Report has scheduling fields."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__
        assert "is_scheduled" in annotations
        assert "schedule_cron" in annotations
        assert "next_run_at" in annotations

    def test_report_is_multi_tenant(self) -> None:
        """Test Report is multi-tenant."""
        from arc.models.analytics import Report

        config = getattr(Report, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_report_has_audit_log(self) -> None:
        """Test Report has audit_log enabled."""
        from arc.models.analytics import Report

        config = getattr(Report, "__dataflow__", {})
        assert config.get("audit_log") is True

    def test_report_indexes(self) -> None:
        """Test Report has correct indexes defined."""
        from arc.models.analytics import Report

        indexes = getattr(Report, "__indexes__", [])
        assert len(indexes) >= 3


class TestWatchlistModel:
    """Tests for Watchlist model structure."""

    def test_watchlist_has_required_fields(self) -> None:
        """Test Watchlist model has required fields."""
        from arc.models.analytics import Watchlist

        annotations = Watchlist.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "name" in annotations

    def test_watchlist_has_display_fields(self) -> None:
        """Test Watchlist has display fields."""
        from arc.models.analytics import Watchlist

        annotations = Watchlist.__annotations__
        assert "description" in annotations
        assert "color" in annotations
        assert "icon" in annotations

    def test_watchlist_has_settings_fields(self) -> None:
        """Test Watchlist has settings fields."""
        from arc.models.analytics import Watchlist

        annotations = Watchlist.__annotations__
        assert "is_default" in annotations
        assert "sort_order" in annotations

    def test_watchlist_is_multi_tenant(self) -> None:
        """Test Watchlist is multi-tenant."""
        from arc.models.analytics import Watchlist

        config = getattr(Watchlist, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_watchlist_indexes(self) -> None:
        """Test Watchlist has correct indexes defined."""
        from arc.models.analytics import Watchlist

        indexes = getattr(Watchlist, "__indexes__", [])
        assert len(indexes) >= 1

        # Check user_id index exists
        user_index = next((idx for idx in indexes if "user_id" in idx.get("fields", [])), None)
        assert user_index is not None


class TestWatchlistItemModel:
    """Tests for WatchlistItem model structure."""

    def test_watchlist_item_has_required_fields(self) -> None:
        """Test WatchlistItem model has required fields."""
        from arc.models.analytics import WatchlistItem

        annotations = WatchlistItem.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "security_id" in annotations
        assert "added_at" in annotations

    def test_watchlist_item_has_price_target_fields(self) -> None:
        """Test WatchlistItem has price target fields."""
        from arc.models.analytics import WatchlistItem

        annotations = WatchlistItem.__annotations__
        assert "target_price" in annotations
        assert "stop_loss" in annotations
        assert "price_at_addition" in annotations

    def test_watchlist_item_has_alert_fields(self) -> None:
        """Test WatchlistItem has alert fields."""
        from arc.models.analytics import WatchlistItem

        annotations = WatchlistItem.__annotations__
        assert "alert_on_target" in annotations
        assert "alert_on_stop" in annotations
        assert "alert_on_news" in annotations
        assert "alert_on_earnings" in annotations

    def test_watchlist_item_has_notes_fields(self) -> None:
        """Test WatchlistItem has notes fields."""
        from arc.models.analytics import WatchlistItem

        annotations = WatchlistItem.__annotations__
        assert "notes" in annotations
        assert "tags" in annotations

    def test_watchlist_item_is_multi_tenant(self) -> None:
        """Test WatchlistItem is multi-tenant."""
        from arc.models.analytics import WatchlistItem

        config = getattr(WatchlistItem, "__dataflow__", {})
        assert config.get("multi_tenant") is True

    def test_watchlist_item_no_audit_log(self) -> None:
        """Test WatchlistItem has no audit_log (high frequency)."""
        from arc.models.analytics import WatchlistItem

        config = getattr(WatchlistItem, "__dataflow__", {})
        assert config.get("audit_log") is False

    def test_watchlist_item_has_unique_index(self) -> None:
        """Test WatchlistItem has unique constraint on user_id+security_id."""
        from arc.models.analytics import WatchlistItem

        indexes = getattr(WatchlistItem, "__indexes__", [])
        unique_index = next(
            (
                idx
                for idx in indexes
                if idx.get("unique") is True
                and "user_id" in idx.get("fields", [])
                and "security_id" in idx.get("fields", [])
            ),
            None,
        )
        assert unique_index is not None, "Should have unique user_id+security_id"


class TestAnalyticsModelExports:
    """Tests for analytics model exports from package."""

    def test_all_analytics_models_exported(self) -> None:
        """Test all analytics models are exported from arc.models."""
        from arc.models import (
            Alert,
            AlertThreshold,
            PeerGroup,
            Report,
            Watchlist,
            WatchlistItem,
        )

        assert Alert is not None
        assert AlertThreshold is not None
        assert PeerGroup is not None
        assert Report is not None
        assert Watchlist is not None
        assert WatchlistItem is not None


class TestAnalyticsFieldTypes:
    """Tests for correct field type annotations."""

    def test_alert_field_types(self) -> None:
        """Test Alert fields have correct types."""
        from arc.models.analytics import Alert

        annotations = Alert.__annotations__

        # Required fields should be plain types
        assert annotations["id"] is str
        assert annotations["user_id"] is str
        assert annotations["alert_type"] is str
        assert annotations["title"] is str
        assert annotations["message"] is str
        assert annotations["triggered_at"] is str

        # Dict fields
        assert annotations["delivery_status"] is dict
        assert annotations["metadata"] is dict

    def test_threshold_field_types(self) -> None:
        """Test AlertThreshold fields have correct types."""
        from arc.models.analytics import AlertThreshold

        annotations = AlertThreshold.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["user_id"] is str
        assert annotations["ratio_class"] is str
        assert annotations["ratio_name"] is str
        assert annotations["warning_threshold"] is str
        assert annotations["critical_threshold"] is str
        assert annotations["comparison"] is str

        # Boolean fields
        assert annotations["enabled"] is bool
        assert annotations["alert_on_improvement"] is bool

        # Integer fields
        assert annotations["cooldown_hours"] is int
        assert annotations["times_triggered"] is int

    def test_peer_group_field_types(self) -> None:
        """Test PeerGroup fields have correct types."""
        from arc.models.analytics import PeerGroup

        annotations = PeerGroup.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["name"] is str
        assert annotations["group_type"] is str

        # Dict fields
        assert annotations["criteria"] is dict

        # Boolean fields
        assert annotations["auto_refresh"] is bool
        assert annotations["active"] is bool

        # Integer fields
        assert annotations["member_count"] is int

    def test_report_field_types(self) -> None:
        """Test Report fields have correct types."""
        from arc.models.analytics import Report

        annotations = Report.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["user_id"] is str
        assert annotations["report_type"] is str
        assert annotations["report_name"] is str
        assert annotations["requested_at"] is str

        # Dict fields
        assert annotations["parameters"] is dict

        # Integer fields
        assert annotations["progress_percent"] is int

        # Boolean fields
        assert annotations["is_scheduled"] is bool
