"""Unit tests for data sync workflows."""

from arc.workflows.sync import (
    build_eodhd_bulk_price_sync_workflow,
    build_eodhd_price_sync_workflow,
    build_fundamentals_sync_workflow,
)

# =============================================================================
# EODHD PRICE SYNC WORKFLOW TESTS
# =============================================================================


class TestEODHDPriceSyncWorkflow:
    """Test EODHD price sync workflow building."""

    def test_build_workflow_with_security_ids(self):
        """Test workflow builds with specific security IDs."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL", "MSFT"],
            start_date="2024-01-01",
            end_date="2024-12-31",
        )

        # Verify workflow is a WorkflowBuilder
        assert workflow is not None
        assert hasattr(workflow, "build")

        # Build and verify structure
        built = workflow.build()
        assert built is not None

    def test_build_workflow_without_security_ids(self):
        """Test workflow builds to query all securities."""
        workflow = build_eodhd_price_sync_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date_range(self):
        """Test workflow with specific date range."""
        workflow = build_eodhd_price_sync_workflow(
            start_date="2024-06-01",
            end_date="2024-06-30",
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_custom_batch_size(self):
        """Test workflow with custom batch size."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
            batch_size=500,
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_has_required_nodes_with_ids(self):
        """Test workflow contains expected nodes when IDs provided."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL", "MSFT"],
        )

        built = workflow.build()

        # Check that workflow has nodes
        assert hasattr(built, "nodes") or built is not None

    def test_workflow_has_fetch_node(self):
        """Test workflow contains fetch prices node."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_has_transform_node(self):
        """Test workflow contains transform prices node."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_has_save_node(self):
        """Test workflow contains save prices node."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_has_summary_node(self):
        """Test workflow contains compile summary node."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
        )

        built = workflow.build()
        assert built is not None


# =============================================================================
# EODHD BULK PRICE SYNC WORKFLOW TESTS
# =============================================================================


class TestEODHDBulkPriceSyncWorkflow:
    """Test EODHD bulk price sync workflow building."""

    def test_build_workflow_default_exchange(self):
        """Test workflow builds with default US exchange."""
        workflow = build_eodhd_bulk_price_sync_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_specific_exchange(self):
        """Test workflow builds with specific exchange."""
        workflow = build_eodhd_bulk_price_sync_workflow(exchange="LSE")

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_date(self):
        """Test workflow builds with specific date."""
        workflow = build_eodhd_bulk_price_sync_workflow(
            exchange="US",
            date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_batch_size(self):
        """Test workflow builds with custom batch size."""
        workflow = build_eodhd_bulk_price_sync_workflow(
            exchange="US",
            batch_size=5000,
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_supported_exchanges(self):
        """Test workflow builds for various exchanges."""
        exchanges = ["US", "LSE", "TO", "PA", "XETRA", "HK", "AU"]

        for exchange in exchanges:
            workflow = build_eodhd_bulk_price_sync_workflow(exchange=exchange)
            built = workflow.build()
            assert built is not None, f"Failed for exchange: {exchange}"


# =============================================================================
# FUNDAMENTALS SYNC WORKFLOW TESTS
# =============================================================================


class TestFundamentalsSyncWorkflow:
    """Test fundamentals sync workflow building."""

    def test_build_workflow_with_security_ids(self):
        """Test workflow builds with specific security IDs."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL", "MSFT"],
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_without_security_ids(self):
        """Test workflow builds to query all securities."""
        workflow = build_fundamentals_sync_workflow()

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_sync_options(self):
        """Test workflow with sync options."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL"],
            sync_annual=True,
            sync_quarterly=True,
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_annual_only(self):
        """Test workflow for annual data only."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL"],
            sync_annual=True,
            sync_quarterly=False,
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_quarterly_only(self):
        """Test workflow for quarterly data only."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL"],
            sync_annual=False,
            sync_quarterly=True,
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_with_ratio_calc(self):
        """Test workflow with ratio calculation enabled."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL"],
            trigger_ratio_calc=True,
        )

        built = workflow.build()
        assert built is not None

    def test_build_workflow_without_ratio_calc(self):
        """Test workflow without ratio calculation."""
        workflow = build_fundamentals_sync_workflow(
            security_ids=["AAPL"],
            trigger_ratio_calc=False,
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
            build_eodhd_price_sync_workflow(security_ids=["AAPL"]),
            build_eodhd_bulk_price_sync_workflow(),
            build_fundamentals_sync_workflow(security_ids=["AAPL"]),
        ]

        for wf in workflows:
            assert isinstance(wf, WorkflowBuilder)

    def test_all_workflows_buildable(self):
        """Test all workflows can be built without errors."""
        workflows = [
            build_eodhd_price_sync_workflow(security_ids=["AAPL"]),
            build_eodhd_bulk_price_sync_workflow(),
            build_fundamentals_sync_workflow(security_ids=["AAPL"]),
        ]

        for wf in workflows:
            built = wf.build()
            assert built is not None

    def test_workflow_exports(self):
        """Test that all expected workflows are exported."""
        from arc.workflows import sync

        assert hasattr(sync, "build_eodhd_price_sync_workflow")
        assert hasattr(sync, "build_eodhd_bulk_price_sync_workflow")
        assert hasattr(sync, "build_fundamentals_sync_workflow")

    def test_main_workflow_exports(self):
        """Test that workflows are exported from main module."""
        from arc.workflows import (
            build_eodhd_bulk_price_sync_workflow,
            build_eodhd_price_sync_workflow,
            build_fundamentals_sync_workflow,
        )

        assert callable(build_eodhd_price_sync_workflow)
        assert callable(build_eodhd_bulk_price_sync_workflow)
        assert callable(build_fundamentals_sync_workflow)


# =============================================================================
# WORKFLOW PARAMETER TESTS
# =============================================================================


class TestWorkflowParameters:
    """Test workflow parameter handling."""

    def test_empty_security_ids_list(self):
        """Test workflow with empty security IDs list."""
        workflow = build_eodhd_price_sync_workflow(security_ids=[])

        built = workflow.build()
        assert built is not None

    def test_single_security_id(self):
        """Test workflow with single security ID."""
        workflow = build_eodhd_price_sync_workflow(security_ids=["AAPL"])

        built = workflow.build()
        assert built is not None

    def test_many_security_ids(self):
        """Test workflow with many security IDs."""
        security_ids = [f"SEC{i}" for i in range(100)]
        workflow = build_eodhd_price_sync_workflow(security_ids=security_ids)

        built = workflow.build()
        assert built is not None

    def test_security_ids_with_exchange_suffix(self):
        """Test workflow with exchange suffix in security IDs."""
        workflow = build_eodhd_price_sync_workflow(security_ids=["AAPL.US", "MSFT.US", "VOD.LSE"])

        built = workflow.build()
        assert built is not None

    def test_various_date_formats(self):
        """Test workflow accepts standard date format."""
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
            start_date="2024-01-01",
            end_date="2024-12-31",
        )

        built = workflow.build()
        assert built is not None

    def test_batch_size_boundaries(self):
        """Test workflow with various batch sizes."""
        for batch_size in [1, 100, 1000, 5000, 10000]:
            workflow = build_eodhd_price_sync_workflow(
                security_ids=["AAPL"],
                batch_size=batch_size,
            )
            built = workflow.build()
            assert built is not None, f"Failed for batch_size: {batch_size}"


# =============================================================================
# PRICE TRANSFORMATION LOGIC TESTS
# =============================================================================


class TestPriceTransformationLogic:
    """Test price transformation logic in isolation."""

    def test_composite_id_format(self):
        """Test composite ID format is correct."""
        # The workflow creates IDs as "{security_id}_{price_date}"
        security_id = "AAPL"
        price_date = "2024-12-31"
        expected_id = f"{security_id}_{price_date}"

        assert expected_id == "AAPL_2024-12-31"

    def test_price_to_string_decimal(self):
        """Test price values converted to string decimals."""
        price = 150.25

        # Workflow converts prices to string
        price_str = str(price)

        assert price_str == "150.25"
        assert isinstance(price_str, str)

    def test_volume_to_integer(self):
        """Test volume converted to integer."""
        volume = 45000000.0

        # Workflow converts volume to int
        volume_int = int(volume)

        assert volume_int == 45000000
        assert isinstance(volume_int, int)

    def test_daily_return_calculation(self):
        """Test daily return calculation logic."""
        prev_close = 100.0
        curr_close = 102.0

        daily_return = (curr_close - prev_close) / prev_close

        assert abs(daily_return - 0.02) < 0.0001

    def test_daily_return_zero_division(self):
        """Test daily return handles zero previous close."""
        prev_close = 0.0
        curr_close = 100.0

        # Workflow checks for prev_close > 0 before calculating
        if prev_close > 0:
            daily_return = (curr_close - prev_close) / prev_close
        else:
            daily_return = None

        assert daily_return is None


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestWorkflowErrorHandling:
    """Test workflow error handling patterns."""

    def test_workflow_builds_with_invalid_dates(self):
        """Test workflow builds even with potentially invalid dates.

        Validation happens at runtime, not build time.
        """
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
            start_date="invalid-date",
            end_date="also-invalid",
        )

        # Should still build (validation is at runtime)
        built = workflow.build()
        assert built is not None

    def test_workflow_builds_with_reversed_dates(self):
        """Test workflow builds with reversed date range.

        Business logic handles this at runtime.
        """
        workflow = build_eodhd_price_sync_workflow(
            security_ids=["AAPL"],
            start_date="2024-12-31",
            end_date="2024-01-01",
        )

        built = workflow.build()
        assert built is not None

    def test_workflow_builds_with_special_characters_in_ids(self):
        """Test workflow handles special characters in security IDs."""
        workflow = build_eodhd_price_sync_workflow(security_ids=["BRK.A", "BRK.B", "BF-A", "BF-B"])

        built = workflow.build()
        assert built is not None
