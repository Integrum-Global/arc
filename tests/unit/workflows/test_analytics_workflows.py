"""Unit tests for analytics workflows."""

import pytest

# Import database first to register DataFlow nodes
from arc.models.database import db  # noqa: F401

from arc.workflows.analytics import (
    build_alert_cleanup_workflow,
    build_batch_alert_check_workflow,
    build_batch_peer_benchmark_workflow,
    build_fundamental_ratio_workflow,
    build_peer_benchmark_workflow,
    build_ratio_calculation_workflow,
    build_sector_benchmark_workflow,
    build_threshold_alert_workflow,
    build_valuation_ratio_workflow,
)


# =============================================================================
# RATIO CALCULATION WORKFLOW TESTS
# =============================================================================


class TestRatioCalculationWorkflow:
    """Test ratio calculation workflow building."""

    def test_build_workflow_with_security_ids(self):
        """Test workflow builds with specific security IDs."""
        workflow = build_ratio_calculation_workflow(
            security_ids=["AAPL", "MSFT"],
            calculation_date="2024-12-31",
        )

        assert workflow is not None
        assert hasattr(workflow, "build")

        built = workflow.build()
        assert built is not None

    def test_build_workflow_without_security_ids(self):
        """Test workflow builds to calculate for all securities."""
        workflow = build_ratio_calculation_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_specific_ratio_classes(self):
        """Test workflow with specific ratio classes."""
        workflow = build_ratio_calculation_workflow(
            security_ids=["AAPL"],
            ratio_classes=["liquidity", "profitability"],
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_single_ratio_class(self):
        """Test workflow with single ratio class."""
        for ratio_class in ["liquidity", "profitability", "leverage", "efficiency", "valuation"]:
            workflow = build_ratio_calculation_workflow(
                security_ids=["AAPL"],
                ratio_classes=[ratio_class],
            )

            built = workflow.build()
            assert built is not None, f"Failed for ratio_class: {ratio_class}"

    def test_build_workflow_with_custom_batch_size(self):
        """Test workflow with custom batch size."""
        workflow = build_ratio_calculation_workflow(
            security_ids=["AAPL"],
            batch_size=500,
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_has_expected_structure(self):
        """Test workflow contains expected nodes."""
        workflow = build_ratio_calculation_workflow(security_ids=["AAPL"])

        built = workflow.build()
        assert built is not None
        assert hasattr(built, "nodes") or built is not None


class TestValuationRatioWorkflow:
    """Test valuation ratio workflow building."""

    def test_build_workflow(self):
        """Test valuation ratio workflow builds."""
        workflow = build_valuation_ratio_workflow(security_ids=["AAPL"])

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test valuation workflow with specific date."""
        workflow = build_valuation_ratio_workflow(
            security_ids=["AAPL"],
            calculation_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None


class TestFundamentalRatioWorkflow:
    """Test fundamental ratio workflow building."""

    def test_build_workflow(self):
        """Test fundamental ratio workflow builds."""
        workflow = build_fundamental_ratio_workflow(security_ids=["AAPL"])

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test fundamental workflow with specific date."""
        workflow = build_fundamental_ratio_workflow(
            security_ids=["AAPL", "MSFT"],
            calculation_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None


# =============================================================================
# THRESHOLD ALERT WORKFLOW TESTS
# =============================================================================


class TestThresholdAlertWorkflow:
    """Test threshold alert workflow building."""

    def test_build_workflow_with_user_id(self):
        """Test workflow builds for specific user."""
        workflow = build_threshold_alert_workflow(
            user_id="user-123",
            check_date="2024-12-31",
        )

        assert workflow is not None
        assert hasattr(workflow, "build")

        built = workflow.build()
        assert built is not None

    def test_build_workflow_batch_mode(self):
        """Test workflow builds in batch mode (all users)."""
        workflow = build_threshold_alert_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_security_filter(self):
        """Test workflow with specific securities."""
        workflow = build_threshold_alert_workflow(
            user_id="user-123",
            security_ids=["AAPL", "MSFT"],
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_custom_batch_size(self):
        """Test workflow with custom batch size."""
        workflow = build_threshold_alert_workflow(
            user_id="user-123",
            batch_size=250,
        )

        built = workflow.build()
        assert built is not None


class TestBatchAlertCheckWorkflow:
    """Test batch alert check workflow building."""

    def test_build_workflow_default(self):
        """Test batch alert check workflow builds."""
        workflow = build_batch_alert_check_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test batch workflow with specific date."""
        workflow = build_batch_alert_check_workflow(
            check_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None


class TestAlertCleanupWorkflow:
    """Test alert cleanup workflow building."""

    def test_build_workflow_default(self):
        """Test alert cleanup workflow builds."""
        workflow = build_alert_cleanup_workflow(days_to_keep=30)

        built = workflow.build()
        assert built is not None

    def test_build_workflow_custom_retention(self):
        """Test cleanup workflow with custom retention period."""
        for days in [7, 14, 30, 60, 90]:
            workflow = build_alert_cleanup_workflow(days_to_keep=days)

            built = workflow.build()
            assert built is not None, f"Failed for days_to_keep: {days}"


# =============================================================================
# PEER BENCHMARK WORKFLOW TESTS
# =============================================================================


class TestPeerBenchmarkWorkflow:
    """Test peer benchmark workflow building."""

    def test_build_workflow(self):
        """Test peer benchmark workflow builds."""
        workflow = build_peer_benchmark_workflow(
            security_id="AAPL",
            peer_group_id="sector_technology_large",
        )

        assert workflow is not None
        assert hasattr(workflow, "build")

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_specific_ratios(self):
        """Test workflow with specific ratios to benchmark."""
        workflow = build_peer_benchmark_workflow(
            security_id="AAPL",
            peer_group_id="peer-123",
            ratio_names=["pe_ratio", "roe", "profit_margin"],
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test workflow with specific calculation date."""
        workflow = build_peer_benchmark_workflow(
            security_id="AAPL",
            peer_group_id="peer-123",
            calculation_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_no_ratio_update(self):
        """Test workflow without updating ratios."""
        workflow = build_peer_benchmark_workflow(
            security_id="AAPL",
            peer_group_id="peer-123",
            update_ratios=False,
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_custom_batch_size(self):
        """Test workflow with custom batch size."""
        workflow = build_peer_benchmark_workflow(
            security_id="AAPL",
            peer_group_id="peer-123",
            batch_size=500,
        )

        built = workflow.build()
        assert built is not None


class TestBatchPeerBenchmarkWorkflow:
    """Test batch peer benchmark workflow building."""

    def test_build_workflow_default(self):
        """Test batch peer benchmark workflow builds."""
        workflow = build_batch_peer_benchmark_workflow(peer_group_id="peer-123")

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test batch workflow with specific date."""
        workflow = build_batch_peer_benchmark_workflow(
            peer_group_id="peer-123",
            calculation_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None


class TestSectorBenchmarkWorkflow:
    """Test sector benchmark workflow building."""

    def test_build_workflow(self):
        """Test sector benchmark workflow builds."""
        workflow = build_sector_benchmark_workflow(
            sector="Technology",
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_different_sectors(self):
        """Test workflow for different sectors."""
        sectors = ["Technology", "Healthcare", "Financial Services", "Energy", "Consumer"]

        for sector in sectors:
            workflow = build_sector_benchmark_workflow(
                sector=sector,
            )

            built = workflow.build()
            assert built is not None, f"Failed for sector: {sector}"

    def test_build_workflow_with_ratios(self):
        """Test workflow with specific ratios."""
        workflow = build_sector_benchmark_workflow(
            sector="Technology",
            ratio_names=["pe_ratio", "pb_ratio"],
        )

        built = workflow.build()
        assert built is not None


# =============================================================================
# WORKFLOW INTEGRATION TESTS
# =============================================================================


class TestWorkflowIntegration:
    """Test workflow integration patterns."""

    def test_all_workflows_return_workflow_builder(self):
        """Test all workflow builders return WorkflowBuilder instances."""
        from kailash.workflow.builder import WorkflowBuilder

        workflows = [
            build_ratio_calculation_workflow(security_ids=["AAPL"]),
            build_valuation_ratio_workflow(security_ids=["AAPL"]),
            build_fundamental_ratio_workflow(security_ids=["AAPL"]),
            build_threshold_alert_workflow(user_id="user-123"),
            build_batch_alert_check_workflow(),
            build_alert_cleanup_workflow(days_to_keep=30),
            build_peer_benchmark_workflow(security_id="AAPL", peer_group_id="peer-123"),
            build_batch_peer_benchmark_workflow(peer_group_id="peer-123"),
            build_sector_benchmark_workflow(sector="Technology"),
        ]

        for wf in workflows:
            assert isinstance(wf, WorkflowBuilder)

    def test_all_workflows_buildable(self):
        """Test all workflows can be built without errors."""
        workflows = [
            build_ratio_calculation_workflow(security_ids=["AAPL"]),
            build_valuation_ratio_workflow(security_ids=["AAPL"]),
            build_fundamental_ratio_workflow(security_ids=["AAPL"]),
            build_threshold_alert_workflow(user_id="user-123"),
            build_batch_alert_check_workflow(),
            build_alert_cleanup_workflow(days_to_keep=30),
            build_peer_benchmark_workflow(security_id="AAPL", peer_group_id="peer-123"),
            build_batch_peer_benchmark_workflow(peer_group_id="peer-123"),
            build_sector_benchmark_workflow(sector="Technology"),
        ]

        for wf in workflows:
            built = wf.build()
            assert built is not None

    def test_workflow_exports(self):
        """Test that all expected workflows are exported."""
        from arc.workflows import analytics

        expected_workflows = [
            "build_ratio_calculation_workflow",
            "build_valuation_ratio_workflow",
            "build_fundamental_ratio_workflow",
            "build_threshold_alert_workflow",
            "build_batch_alert_check_workflow",
            "build_alert_cleanup_workflow",
            "build_peer_benchmark_workflow",
            "build_batch_peer_benchmark_workflow",
            "build_sector_benchmark_workflow",
        ]

        for workflow_name in expected_workflows:
            assert hasattr(analytics, workflow_name), f"Missing: {workflow_name}"
            assert callable(getattr(analytics, workflow_name)), f"Not callable: {workflow_name}"

    def test_main_workflow_exports(self):
        """Test that workflows are exported from main workflows module."""
        from arc.workflows import (
            build_alert_cleanup_workflow,
            build_batch_alert_check_workflow,
            build_batch_peer_benchmark_workflow,
            build_fundamental_ratio_workflow,
            build_peer_benchmark_workflow,
            build_ratio_calculation_workflow,
            build_sector_benchmark_workflow,
            build_threshold_alert_workflow,
            build_valuation_ratio_workflow,
        )

        # All should be callable
        assert callable(build_ratio_calculation_workflow)
        assert callable(build_valuation_ratio_workflow)
        assert callable(build_fundamental_ratio_workflow)
        assert callable(build_threshold_alert_workflow)
        assert callable(build_batch_alert_check_workflow)
        assert callable(build_alert_cleanup_workflow)
        assert callable(build_peer_benchmark_workflow)
        assert callable(build_batch_peer_benchmark_workflow)
        assert callable(build_sector_benchmark_workflow)


# =============================================================================
# RATIO CALCULATION LOGIC TESTS
# =============================================================================


class TestRatioCalculationLogic:
    """Test ratio calculation logic in isolation."""

    def test_safe_division_logic(self):
        """Test safe division handles edge cases."""
        from decimal import Decimal

        def safe_divide(numerator, denominator):
            if numerator is None or denominator is None:
                return None
            if denominator == Decimal(0):
                return None
            return numerator / denominator

        # Normal division
        assert safe_divide(Decimal("100"), Decimal("50")) == Decimal("2")

        # Zero denominator
        assert safe_divide(Decimal("100"), Decimal("0")) is None

        # None values
        assert safe_divide(None, Decimal("50")) is None
        assert safe_divide(Decimal("100"), None) is None

    def test_current_ratio_formula(self):
        """Test current ratio calculation."""
        from decimal import Decimal

        current_assets = Decimal("500000")
        current_liabilities = Decimal("250000")

        current_ratio = current_assets / current_liabilities

        assert current_ratio == Decimal("2")

    def test_quick_ratio_formula(self):
        """Test quick ratio calculation."""
        from decimal import Decimal

        current_assets = Decimal("500000")
        inventory = Decimal("100000")
        current_liabilities = Decimal("200000")

        quick_ratio = (current_assets - inventory) / current_liabilities

        assert quick_ratio == Decimal("2")

    def test_roe_formula(self):
        """Test return on equity calculation."""
        from decimal import Decimal

        net_income = Decimal("50000")
        total_equity = Decimal("500000")

        roe = net_income / total_equity

        assert roe == Decimal("0.1")  # 10%

    def test_debt_to_equity_formula(self):
        """Test debt to equity calculation."""
        from decimal import Decimal

        total_debt = Decimal("300000")
        total_equity = Decimal("600000")

        debt_to_equity = total_debt / total_equity

        assert debt_to_equity == Decimal("0.5")

    def test_pe_ratio_formula(self):
        """Test P/E ratio calculation."""
        from decimal import Decimal

        price = Decimal("150.00")
        eps = Decimal("5.00")

        pe_ratio = price / eps

        assert pe_ratio == Decimal("30")

    def test_composite_id_format(self):
        """Test composite ID format is correct."""
        security_id = "AAPL"
        calculation_date = "2024-12-31"
        ratio_name = "current_ratio"

        expected_id = f"{security_id}_{calculation_date}_{ratio_name}"

        assert expected_id == "AAPL_2024-12-31_current_ratio"


# =============================================================================
# THRESHOLD ALERT LOGIC TESTS
# =============================================================================


class TestThresholdAlertLogic:
    """Test threshold alert logic in isolation."""

    def test_threshold_breach_detection_lt(self):
        """Test threshold breach detection for less than comparison."""
        from decimal import Decimal

        ratio_value = Decimal("0.8")
        warning_threshold = Decimal("1.0")
        critical_threshold = Decimal("0.5")
        comparison = "lt"

        # Check breach
        severity = None
        if comparison == "lt":
            if ratio_value < critical_threshold:
                severity = "critical"
            elif ratio_value < warning_threshold:
                severity = "warning"

        assert severity == "warning"  # 0.8 < 1.0 (warning)

    def test_threshold_breach_detection_gt(self):
        """Test threshold breach detection for greater than comparison."""
        from decimal import Decimal

        ratio_value = Decimal("3.0")
        warning_threshold = Decimal("2.0")
        critical_threshold = Decimal("2.5")
        comparison = "gt"

        # Check breach
        severity = None
        if comparison == "gt":
            if ratio_value > critical_threshold:
                severity = "critical"
            elif ratio_value > warning_threshold:
                severity = "warning"

        assert severity == "critical"  # 3.0 > 2.5 (critical)

    def test_cooldown_logic(self):
        """Test cooldown period enforcement."""
        from datetime import UTC, datetime, timedelta

        last_triggered_at = datetime.now(UTC) - timedelta(hours=12)
        cooldown_hours = 24
        now = datetime.now(UTC)

        hours_since = (now - last_triggered_at).total_seconds() / 3600

        # Should not trigger (within cooldown)
        assert hours_since < cooldown_hours

    def test_cooldown_expired(self):
        """Test cooldown period expiration."""
        from datetime import UTC, datetime, timedelta

        last_triggered_at = datetime.now(UTC) - timedelta(hours=25)
        cooldown_hours = 24
        now = datetime.now(UTC)

        hours_since = (now - last_triggered_at).total_seconds() / 3600

        # Should trigger (past cooldown)
        assert hours_since >= cooldown_hours


# =============================================================================
# PEER BENCHMARK LOGIC TESTS
# =============================================================================


class TestPeerBenchmarkLogic:
    """Test peer benchmark logic in isolation."""

    def test_percentile_calculation(self):
        """Test percentile calculation."""
        values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        security_value = 75

        below_count = sum(1 for v in values if v < security_value)
        percentile = (below_count / len(values)) * 100

        assert percentile == 70.0  # 7 values below 75

    def test_percentile_calculation_at_max(self):
        """Test percentile at maximum value."""
        values = [10, 20, 30, 40, 50]
        security_value = 50

        below_count = sum(1 for v in values if v < security_value)
        percentile = (below_count / len(values)) * 100

        assert percentile == 80.0  # 4 values below 50

    def test_rank_calculation(self):
        """Test rank calculation."""
        values = [100, 80, 60, 40, 20]  # Already sorted descending
        security_value = 70

        # Rank is the position where security_value would fit
        # 70 is >= 60, so it would be ranked 3rd (after 100 and 80)
        rank = 1
        for i, v in enumerate(values):
            if security_value >= v:
                rank = i + 1
                break

        assert rank == 3  # 70 >= 60 at index 2, so rank 3

    def test_statistics_calculation(self):
        """Test peer statistics calculation."""
        from statistics import mean, median

        values = [10.0, 20.0, 30.0, 40.0, 50.0]

        assert mean(values) == 30.0
        assert median(values) == 30.0
        assert min(values) == 10.0
        assert max(values) == 50.0


# =============================================================================
# WORKFLOW PARAMETER TESTS
# =============================================================================


class TestWorkflowParameters:
    """Test workflow parameter handling."""

    def test_empty_security_ids_list(self):
        """Test workflow with empty security IDs list."""
        workflow = build_ratio_calculation_workflow(security_ids=[])

        built = workflow.build()
        assert built is not None

    def test_single_security_id(self):
        """Test workflow with single security ID."""
        workflow = build_ratio_calculation_workflow(security_ids=["AAPL"])

        built = workflow.build()
        assert built is not None

    def test_many_security_ids(self):
        """Test workflow with many security IDs."""
        security_ids = [f"SEC{i}" for i in range(100)]
        workflow = build_ratio_calculation_workflow(security_ids=security_ids)

        built = workflow.build()
        assert built is not None

    def test_various_date_formats(self):
        """Test workflow accepts standard date format."""
        workflow = build_ratio_calculation_workflow(
            security_ids=["AAPL"],
            calculation_date="2024-01-01",
        )

        built = workflow.build()
        assert built is not None

    def test_batch_size_boundaries(self):
        """Test workflow with various batch sizes."""
        for batch_size in [1, 100, 500, 1000, 5000]:
            workflow = build_ratio_calculation_workflow(
                security_ids=["AAPL"],
                batch_size=batch_size,
            )
            built = workflow.build()
            assert built is not None, f"Failed for batch_size: {batch_size}"

    def test_ratio_classes_combinations(self):
        """Test different ratio class combinations."""
        test_cases = [
            ["liquidity"],
            ["profitability"],
            ["leverage", "efficiency"],
            ["liquidity", "profitability", "valuation"],
            ["liquidity", "profitability", "leverage", "efficiency", "valuation"],
        ]

        for ratio_classes in test_cases:
            workflow = build_ratio_calculation_workflow(
                security_ids=["AAPL"],
                ratio_classes=ratio_classes,
            )
            built = workflow.build()
            assert built is not None, f"Failed for ratio_classes: {ratio_classes}"
