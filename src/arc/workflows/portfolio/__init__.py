"""
Portfolio management workflows for ARC platform.

This module contains workflows for portfolio operations:
- NAV calculation and valuation
- Portfolio health scan and scoring
- Rebalance recommendations

Workflow Patterns Used:
- PythonCodeNode for calculations (sync-safe)
- BulkUpsertNode for efficient database operations
- Decimal math for monetary values

CRITICAL RULES:
- Use Decimal for all monetary calculations
- NEVER manually set created_at or updated_at
- Always use string decimals for monetary values
- Handle missing prices gracefully (use last available)
"""

from arc.workflows.portfolio.health_scan import (
    build_batch_health_scan_workflow,
    build_portfolio_health_scan_workflow,
)
from arc.workflows.portfolio.rebalance import (
    build_rebalance_analysis_workflow,
)
from arc.workflows.portfolio.valuation import (
    build_nav_calculation_workflow,
    build_portfolio_valuation_workflow,
)

__all__ = [
    # Valuation workflows
    "build_nav_calculation_workflow",
    "build_portfolio_valuation_workflow",
    # Health scan workflows
    "build_portfolio_health_scan_workflow",
    "build_batch_health_scan_workflow",
    # Rebalance workflows
    "build_rebalance_analysis_workflow",
]
