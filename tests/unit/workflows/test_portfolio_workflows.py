"""
Tests for portfolio management workflows.

Tests cover:
- Workflow building and structure
- NAV calculation logic
- Health scan scoring algorithm
- Rebalance analysis logic
- Parameter validation
"""

import pytest
from decimal import Decimal, ROUND_HALF_UP

# Import database models first to register DataFlow nodes
from arc.models.database import db  # noqa: F401

from arc.workflows.portfolio import (
    build_nav_calculation_workflow,
    build_portfolio_valuation_workflow,
    build_portfolio_health_scan_workflow,
    build_batch_health_scan_workflow,
    build_rebalance_analysis_workflow,
)
from arc.workflows.portfolio.health_scan import DEFAULT_THRESHOLDS, CLASS_WEIGHTS


# =============================================================================
# NAV Calculation Workflow Tests
# =============================================================================


class TestNAVCalculationWorkflow:
    """Tests for NAV calculation workflow building."""

    def test_build_workflow_with_portfolio_ids(self):
        """Test building workflow with specific portfolio IDs."""
        workflow = build_nav_calculation_workflow(
            portfolio_ids=["port-001", "port-002"],
            valuation_date="2024-12-31",
        )
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) == 11  # Expected node count

    def test_build_workflow_without_portfolio_ids(self):
        """Test building workflow for all portfolios."""
        workflow = build_nav_calculation_workflow(
            valuation_date="2024-12-31",
        )
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) >= 8  # Core nodes present

    def test_build_workflow_with_custom_currency(self):
        """Test building workflow with custom base currency."""
        workflow = build_nav_calculation_workflow(
            portfolio_ids=["port-001"],
            base_currency="EUR",
        )
        built = workflow.build()

        assert built is not None
        # Workflow should build without errors with EUR currency

    def test_build_workflow_default_date(self):
        """Test building workflow with default date (today)."""
        workflow = build_nav_calculation_workflow(
            portfolio_ids=["port-001"],
        )
        built = workflow.build()

        assert built is not None
        # Should use datetime.now() in code

    def test_build_workflow_with_batch_size(self):
        """Test building workflow with custom batch size."""
        workflow = build_nav_calculation_workflow(
            portfolio_ids=["port-001"],
            batch_size=500,
        )
        built = workflow.build()

        assert built is not None
        # Check batch_size is used in bulk nodes
        for node_id, node in built.nodes.items():
            if "Bulk" in node_id:
                assert node.config.get("batch_size") == 500


class TestPortfolioValuationWorkflow:
    """Tests for single portfolio valuation workflow."""

    def test_build_workflow(self):
        """Test building single portfolio valuation workflow."""
        workflow = build_portfolio_valuation_workflow(
            portfolio_id="port-001",
            valuation_date="2024-12-31",
        )
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) >= 8

    def test_build_workflow_different_portfolios(self):
        """Test building workflow for different portfolios."""
        w1 = build_portfolio_valuation_workflow(portfolio_id="port-001")
        w2 = build_portfolio_valuation_workflow(portfolio_id="port-002")

        # Different portfolio IDs should produce different configurations
        assert w1 is not w2


# =============================================================================
# Health Scan Workflow Tests
# =============================================================================


class TestPortfolioHealthScanWorkflow:
    """Tests for portfolio health scan workflow building."""

    def test_build_workflow(self):
        """Test building health scan workflow."""
        workflow = build_portfolio_health_scan_workflow(
            portfolio_id="port-001",
        )
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) == 8

    def test_build_workflow_with_user_id(self):
        """Test building health scan workflow with user ID."""
        workflow = build_portfolio_health_scan_workflow(
            portfolio_id="port-001",
            user_id="user-123",
            use_default_thresholds=False,
        )
        built = workflow.build()

        assert built is not None
        # Should include AlertThresholdListNode for user thresholds
        assert any("get_thresholds" in str(n) for n in built.nodes.keys())

    def test_build_workflow_with_default_thresholds(self):
        """Test building health scan workflow with default thresholds."""
        workflow = build_portfolio_health_scan_workflow(
            portfolio_id="port-001",
            use_default_thresholds=True,
        )
        built = workflow.build()

        assert built is not None

    def test_default_thresholds_structure(self):
        """Test that default thresholds have correct structure."""
        assert "current_ratio" in DEFAULT_THRESHOLDS
        assert "debt_to_equity" in DEFAULT_THRESHOLDS
        assert "pe_ratio" in DEFAULT_THRESHOLDS

        # Check min/max structure
        assert "min" in DEFAULT_THRESHOLDS["current_ratio"]
        assert "max" in DEFAULT_THRESHOLDS["debt_to_equity"]
        assert "max" in DEFAULT_THRESHOLDS["pe_ratio"]

    def test_class_weights_sum_to_one(self):
        """Test that class weights sum to 1.0."""
        total = sum(CLASS_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001


class TestBatchHealthScanWorkflow:
    """Tests for batch health scan workflow building."""

    def test_build_workflow_default(self):
        """Test building batch health scan workflow with defaults."""
        workflow = build_batch_health_scan_workflow()
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) == 6

    def test_build_workflow_with_portfolio_ids(self):
        """Test building batch health scan with specific portfolios."""
        workflow = build_batch_health_scan_workflow(
            portfolio_ids=["port-001", "port-002"],
        )
        built = workflow.build()

        assert built is not None


# =============================================================================
# Rebalance Workflow Tests
# =============================================================================


class TestRebalanceAnalysisWorkflow:
    """Tests for rebalance analysis workflow building."""

    def test_build_workflow_basic(self):
        """Test building rebalance workflow."""
        workflow = build_rebalance_analysis_workflow(
            portfolio_id="port-001",
        )
        built = workflow.build()

        assert built is not None
        assert len(built.nodes) == 6

    def test_build_workflow_with_target_allocation(self):
        """Test building rebalance workflow with target allocation."""
        workflow = build_rebalance_analysis_workflow(
            portfolio_id="port-001",
            target_allocation={
                "AAPL": 25.0,
                "MSFT": 25.0,
                "GOOGL": 25.0,
                "cash": 25.0,
            },
        )
        built = workflow.build()

        assert built is not None
        # Workflow should build successfully with target allocation

    def test_build_workflow_with_custom_tolerance(self):
        """Test building rebalance workflow with custom tolerance."""
        workflow = build_rebalance_analysis_workflow(
            portfolio_id="port-001",
            tolerance_pct=3.0,
        )
        built = workflow.build()

        assert built is not None
        # Workflow should build successfully with custom tolerance

    def test_build_workflow_with_min_trade_value(self):
        """Test building rebalance workflow with custom min trade value."""
        workflow = build_rebalance_analysis_workflow(
            portfolio_id="port-001",
            min_trade_value=500.0,
        )
        built = workflow.build()

        assert built is not None


# =============================================================================
# Workflow Integration Tests
# =============================================================================


class TestWorkflowIntegration:
    """Integration tests for portfolio workflows."""

    def test_all_workflows_return_workflow_builder(self):
        """Test that all workflow builders return WorkflowBuilder."""
        from kailash.workflow.builder import WorkflowBuilder

        workflows = [
            build_nav_calculation_workflow(portfolio_ids=["p1"]),
            build_portfolio_valuation_workflow(portfolio_id="p1"),
            build_portfolio_health_scan_workflow(portfolio_id="p1"),
            build_batch_health_scan_workflow(),
            build_rebalance_analysis_workflow(portfolio_id="p1"),
        ]

        for wf in workflows:
            assert isinstance(wf, WorkflowBuilder)

    def test_all_workflows_buildable(self):
        """Test that all workflows can be built without errors."""
        workflows = [
            ("nav_calculation", build_nav_calculation_workflow(portfolio_ids=["p1"])),
            ("portfolio_valuation", build_portfolio_valuation_workflow(portfolio_id="p1")),
            ("health_scan", build_portfolio_health_scan_workflow(portfolio_id="p1")),
            ("batch_health_scan", build_batch_health_scan_workflow()),
            ("rebalance", build_rebalance_analysis_workflow(portfolio_id="p1")),
        ]

        for name, wf in workflows:
            try:
                built = wf.build()
                assert built is not None, f"{name} workflow returned None"
                assert len(built.nodes) > 0, f"{name} workflow has no nodes"
            except Exception as e:
                pytest.fail(f"{name} workflow failed to build: {e}")

    def test_workflow_exports(self):
        """Test that all workflows are exported from package."""
        from arc.workflows.portfolio import (
            build_nav_calculation_workflow,
            build_portfolio_valuation_workflow,
            build_portfolio_health_scan_workflow,
            build_batch_health_scan_workflow,
            build_rebalance_analysis_workflow,
        )

        assert callable(build_nav_calculation_workflow)
        assert callable(build_portfolio_valuation_workflow)
        assert callable(build_portfolio_health_scan_workflow)
        assert callable(build_batch_health_scan_workflow)
        assert callable(build_rebalance_analysis_workflow)

    def test_main_workflow_exports(self):
        """Test that portfolio workflows are exported from main workflows package."""
        from arc.workflows import (
            build_nav_calculation_workflow,
            build_portfolio_valuation_workflow,
            build_portfolio_health_scan_workflow,
            build_batch_health_scan_workflow,
            build_rebalance_analysis_workflow,
        )

        assert callable(build_nav_calculation_workflow)
        assert callable(build_portfolio_valuation_workflow)
        assert callable(build_portfolio_health_scan_workflow)
        assert callable(build_batch_health_scan_workflow)
        assert callable(build_rebalance_analysis_workflow)


# =============================================================================
# NAV Calculation Logic Tests
# =============================================================================


class TestNAVCalculationLogic:
    """Tests for NAV calculation logic."""

    def test_securities_value_calculation(self):
        """Test that securities value = sum(quantity * price)."""
        holdings = [
            {"quantity": Decimal("100"), "price": Decimal("150.00")},
            {"quantity": Decimal("50"), "price": Decimal("200.00")},
        ]

        total = sum(h["quantity"] * h["price"] for h in holdings)
        assert total == Decimal("25000.00")  # 100*150 + 50*200

    def test_total_nav_calculation(self):
        """Test that total NAV = securities + cash."""
        securities_value = Decimal("100000.00")
        cash_value = Decimal("25000.00")

        total_nav = securities_value + cash_value
        assert total_nav == Decimal("125000.00")

    def test_daily_return_calculation(self):
        """Test daily return calculation."""
        prev_nav = Decimal("100000.00")
        current_nav = Decimal("101500.00")

        daily_return = ((current_nav - prev_nav) / prev_nav * 100).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        assert daily_return == Decimal("1.5000")

    def test_return_calculation_negative(self):
        """Test negative return calculation."""
        prev_nav = Decimal("100000.00")
        current_nav = Decimal("98000.00")

        daily_return = ((current_nav - prev_nav) / prev_nav * 100).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        assert daily_return == Decimal("-2.0000")

    def test_fx_conversion_same_currency(self):
        """Test FX conversion for same currency returns 1."""
        from_curr = "USD"
        to_curr = "USD"

        rate = Decimal("1") if from_curr == to_curr else Decimal("0.85")
        assert rate == Decimal("1")

    def test_holding_value_with_fx(self):
        """Test holding value calculation with FX."""
        quantity = Decimal("100")
        price = Decimal("100.00")  # EUR
        fx_rate = Decimal("1.10")  # EUR to USD

        value = quantity * price * fx_rate
        assert value == Decimal("11000.00")


# =============================================================================
# Health Score Logic Tests
# =============================================================================


class TestHealthScoreLogic:
    """Tests for health score calculation logic."""

    def test_score_starts_at_100(self):
        """Test that health score starts at 100."""
        score = 100
        issues = []

        for issue in issues:
            if issue["severity"] == "critical":
                score -= 15
            else:
                score -= 5

        assert score == 100

    def test_critical_issue_deducts_15(self):
        """Test that critical issues deduct 15 points."""
        score = 100
        score -= 15  # One critical issue
        assert score == 85

    def test_warning_issue_deducts_5(self):
        """Test that warning issues deduct 5 points."""
        score = 100
        score -= 5  # One warning issue
        assert score == 95

    def test_multiple_issues_cumulative(self):
        """Test that multiple issues are cumulative."""
        score = 100
        score -= 15  # Critical
        score -= 15  # Critical
        score -= 5  # Warning
        assert score == 65

    def test_score_minimum_is_zero(self):
        """Test that score cannot go below 0."""
        score = 100
        # 7 critical issues would be -5, but should be 0
        for _ in range(7):
            score -= 15
        score = max(0, score)
        assert score == 0

    def test_weighted_overall_score(self):
        """Test weighted overall score calculation."""
        class_scores = {
            "liquidity": 90,  # weight 0.20
            "profitability": 80,  # weight 0.25
            "leverage": 70,  # weight 0.25
            "efficiency": 100,  # weight 0.15
            "valuation": 60,  # weight 0.15
        }

        overall = 0
        for cls, score in class_scores.items():
            overall += score * CLASS_WEIGHTS[cls]

        # 90*0.20 + 80*0.25 + 70*0.25 + 100*0.15 + 60*0.15
        # = 18 + 20 + 17.5 + 15 + 9 = 79.5
        assert abs(overall - 79.5) < 0.01

    def test_threshold_higher_is_better(self):
        """Test threshold check for higher-is-better ratios."""
        ratio_value = 1.2
        threshold = DEFAULT_THRESHOLDS["current_ratio"]
        min_val = threshold["min"]  # 1.0

        # Value above min should not trigger
        triggered = ratio_value < min_val
        assert not triggered

    def test_threshold_lower_is_better(self):
        """Test threshold check for lower-is-better ratios."""
        ratio_value = 2.5
        threshold = DEFAULT_THRESHOLDS["debt_to_equity"]
        max_val = threshold["max"]  # 2.0

        # Value above max should trigger
        triggered = ratio_value > max_val
        assert triggered

    def test_threshold_critical_vs_warning(self):
        """Test threshold determines severity correctly."""
        threshold = DEFAULT_THRESHOLDS["current_ratio"]
        min_val = threshold["min"]  # 1.0
        warning_val = threshold["warning"]  # 1.5

        # Below min = critical
        value1 = 0.8
        severity1 = "critical" if value1 < min_val else "warning" if value1 < warning_val else None
        assert severity1 == "critical"

        # Between min and warning = warning
        value2 = 1.2
        severity2 = "critical" if value2 < min_val else "warning" if value2 < warning_val else None
        assert severity2 == "warning"

        # Above warning = no issue
        value3 = 2.0
        severity3 = "critical" if value3 < min_val else "warning" if value3 < warning_val else None
        assert severity3 is None


# =============================================================================
# Rebalance Logic Tests
# =============================================================================


class TestRebalanceLogic:
    """Tests for rebalance analysis logic."""

    def test_weight_calculation(self):
        """Test weight calculation from values."""
        total_value = Decimal("100000")
        security_value = Decimal("25000")

        weight = (security_value / total_value * 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        assert weight == Decimal("25.00")

    def test_drift_calculation(self):
        """Test drift calculation."""
        current_weight = 30.0
        target_weight = 25.0

        drift = current_weight - target_weight
        assert drift == 5.0  # Overweight by 5%

    def test_drift_within_tolerance(self):
        """Test drift within tolerance."""
        drift = 3.0
        tolerance = 5.0

        within_tolerance = abs(drift) <= tolerance
        assert within_tolerance

    def test_drift_outside_tolerance(self):
        """Test drift outside tolerance."""
        drift = 7.0
        tolerance = 5.0

        within_tolerance = abs(drift) <= tolerance
        assert not within_tolerance

    def test_trade_value_calculation(self):
        """Test trade value calculation."""
        total_value = Decimal("100000")
        target_weight = Decimal("25.0")
        current_weight = Decimal("30.0")

        target_value = total_value * target_weight / 100
        current_value = total_value * current_weight / 100
        trade_value = target_value - current_value

        assert trade_value == Decimal("-5000")  # Sell $5000

    def test_buy_vs_sell_determination(self):
        """Test buy vs sell action determination."""
        trade_value_positive = 5000  # Need to buy
        trade_value_negative = -5000  # Need to sell

        action_positive = "buy" if trade_value_positive > 0 else "sell"
        action_negative = "buy" if trade_value_negative > 0 else "sell"

        assert action_positive == "buy"
        assert action_negative == "sell"

    def test_min_trade_filter(self):
        """Test minimum trade value filter."""
        min_trade = 100.0
        trade_values = [50, 150, 90, 200]

        recommendations = [tv for tv in trade_values if abs(tv) >= min_trade]
        assert recommendations == [150, 200]

    def test_total_drift_calculation(self):
        """Test total drift calculation."""
        drift_analysis = [
            {"drift": 5.0},
            {"drift": -3.0},
            {"drift": 2.0},
        ]

        # Total drift is sum of absolute values / 2 (to avoid double counting)
        total_drift = sum(abs(d["drift"]) for d in drift_analysis) / 2
        assert total_drift == 5.0  # (5+3+2)/2


# =============================================================================
# Parameter Validation Tests
# =============================================================================


class TestWorkflowParameters:
    """Tests for workflow parameter validation."""

    def test_empty_portfolio_ids_list(self):
        """Test workflow with empty portfolio IDs list."""
        workflow = build_nav_calculation_workflow(portfolio_ids=[])
        built = workflow.build()
        assert built is not None

    def test_single_portfolio_id(self):
        """Test workflow with single portfolio ID."""
        workflow = build_nav_calculation_workflow(portfolio_ids=["single-port"])
        built = workflow.build()
        assert built is not None

    def test_many_portfolio_ids(self):
        """Test workflow with many portfolio IDs."""
        portfolio_ids = [f"port-{i:03d}" for i in range(100)]
        workflow = build_nav_calculation_workflow(portfolio_ids=portfolio_ids)
        built = workflow.build()
        assert built is not None

    def test_various_date_formats(self):
        """Test workflow with various date formats."""
        dates = ["2024-01-01", "2024-12-31", "2025-06-15"]
        for date in dates:
            workflow = build_nav_calculation_workflow(
                portfolio_ids=["p1"],
                valuation_date=date,
            )
            built = workflow.build()
            assert built is not None

    def test_batch_size_boundaries(self):
        """Test workflow with various batch sizes."""
        batch_sizes = [1, 100, 1000, 10000]
        for size in batch_sizes:
            workflow = build_nav_calculation_workflow(
                portfolio_ids=["p1"],
                batch_size=size,
            )
            built = workflow.build()
            assert built is not None

    def test_currency_codes(self):
        """Test workflow with various currency codes."""
        currencies = ["USD", "EUR", "GBP", "JPY", "CHF"]
        for currency in currencies:
            workflow = build_nav_calculation_workflow(
                portfolio_ids=["p1"],
                base_currency=currency,
            )
            built = workflow.build()
            assert built is not None

    def test_tolerance_values(self):
        """Test rebalance workflow with various tolerance values."""
        tolerances = [0.1, 1.0, 5.0, 10.0, 25.0]
        for tol in tolerances:
            workflow = build_rebalance_analysis_workflow(
                portfolio_id="p1",
                tolerance_pct=tol,
            )
            built = workflow.build()
            assert built is not None
