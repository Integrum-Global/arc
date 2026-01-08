"""
Analytics workflows for ARC investment platform.

This module contains workflows for financial analytics operations:
- Ratio Calculation: Calculate 25+ financial ratios across 5 classes
- Threshold Alerts: Monitor ratios against user-defined thresholds
- Peer Benchmarks: Calculate percentile rankings within peer groups

Workflow Patterns Used:
- PythonCodeNode for Decimal-based calculations (sync - no external API)
- Multi-output pattern (v0.9.28+) for passing data between nodes
- BulkUpsertNode with conflict_resolution="update"
- Safe division and null handling

CRITICAL RULES:
- NEVER manually set created_at or updated_at
- Use Decimal for all ratio calculations
- Use string decimals for storage
- Handle zero denominators and null values

Example Usage:
    >>> from arc.workflows.analytics import build_ratio_calculation_workflow
    >>> from kailash.runtime import AsyncLocalRuntime
    >>>
    >>> workflow = build_ratio_calculation_workflow(security_ids=["AAPL"])
    >>> runtime = AsyncLocalRuntime()
    >>> results, run_id = await runtime.execute_workflow_async(workflow.build())
"""

# Ratio calculation workflows
# Alert workflows
from arc.workflows.analytics.alerts import (
    build_alert_cleanup_workflow,
    build_batch_alert_check_workflow,
    build_threshold_alert_workflow,
)

# Benchmark workflows
from arc.workflows.analytics.benchmarks import (
    build_batch_peer_benchmark_workflow,
    build_peer_benchmark_workflow,
    build_sector_benchmark_workflow,
)
from arc.workflows.analytics.ratios import (
    build_fundamental_ratio_workflow,
    build_ratio_calculation_workflow,
    build_valuation_ratio_workflow,
)

__all__ = [
    # Ratio calculation
    "build_ratio_calculation_workflow",
    "build_valuation_ratio_workflow",
    "build_fundamental_ratio_workflow",
    # Threshold alerts
    "build_threshold_alert_workflow",
    "build_batch_alert_check_workflow",
    "build_alert_cleanup_workflow",
    # Peer benchmarks
    "build_peer_benchmark_workflow",
    "build_batch_peer_benchmark_workflow",
    "build_sector_benchmark_workflow",
]
