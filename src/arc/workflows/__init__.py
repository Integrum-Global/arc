"""
Kailash workflows for ARC business logic.

This package contains workflow definitions built using Kailash WorkflowBuilder.
Workflows orchestrate complex business operations by connecting DataFlow nodes
and custom processing logic.

Submodules:
    - sync: Data synchronization workflows (EODHD prices, fundamentals)
    - analytics: Analytics calculation workflows (ratios, alerts, benchmarks)
    - portfolio: Portfolio management workflows

Key Patterns:
    - Use WorkflowBuilder for all workflows
    - Use AsyncLocalRuntime for Docker/FastAPI contexts
    - Use AsyncPythonCodeNode for async API calls
    - Use PythonCodeNode for sync calculations (no external calls)
    - Use BulkUpsertNode for large datasets (>100 records)
    - NEVER manually set created_at or updated_at

Example:
    >>> from arc.workflows.sync import build_eodhd_price_sync_workflow
    >>> from arc.workflows.analytics import build_ratio_calculation_workflow
    >>> from kailash.runtime import AsyncLocalRuntime
    >>>
    >>> workflow = build_eodhd_price_sync_workflow(security_ids=["AAPL"])
    >>> runtime = AsyncLocalRuntime()
    >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
"""

# Sync workflows
from arc.workflows.sync import (
    build_eodhd_bulk_price_sync_workflow,
    build_eodhd_price_sync_workflow,
    build_fundamentals_sync_workflow,
)

# Analytics workflows
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

# Portfolio workflows
from arc.workflows.portfolio import (
    build_batch_health_scan_workflow,
    build_nav_calculation_workflow,
    build_portfolio_health_scan_workflow,
    build_portfolio_valuation_workflow,
    build_rebalance_analysis_workflow,
)

__all__ = [
    # Sync workflows
    "build_eodhd_price_sync_workflow",
    "build_eodhd_bulk_price_sync_workflow",
    "build_fundamentals_sync_workflow",
    # Analytics - Ratio calculation
    "build_ratio_calculation_workflow",
    "build_valuation_ratio_workflow",
    "build_fundamental_ratio_workflow",
    # Analytics - Threshold alerts
    "build_threshold_alert_workflow",
    "build_batch_alert_check_workflow",
    "build_alert_cleanup_workflow",
    # Analytics - Peer benchmarks
    "build_peer_benchmark_workflow",
    "build_batch_peer_benchmark_workflow",
    "build_sector_benchmark_workflow",
    # Portfolio workflows
    "build_nav_calculation_workflow",
    "build_portfolio_valuation_workflow",
    "build_portfolio_health_scan_workflow",
    "build_batch_health_scan_workflow",
    "build_rebalance_analysis_workflow",
]
