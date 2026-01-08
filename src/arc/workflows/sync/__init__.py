"""
Data synchronization workflows for ARC platform.

This module contains workflows for syncing external market data:
- EODHD: Historical prices, real-time quotes, dividends
- Capital IQ: Company fundamentals, financial statements

Workflow Patterns Used:
- PythonCodeNode for external API calls (async-safe)
- BulkUpsertNode for efficient database operations
- Error handling with retry logic
- Progress tracking for long-running syncs

CRITICAL RULES:
- Use AsyncPythonCodeNode for async API calls
- Use BulkUpsertNode for large datasets (>100 records)
- NEVER manually set created_at or updated_at
- Always use string decimals for monetary values
"""

from arc.workflows.sync.eodhd_price_sync import (
    build_eodhd_bulk_price_sync_workflow,
    build_eodhd_price_sync_workflow,
)
from arc.workflows.sync.fundamentals_sync import (
    build_fundamentals_sync_workflow,
)

__all__ = [
    "build_eodhd_price_sync_workflow",
    "build_eodhd_bulk_price_sync_workflow",
    "build_fundamentals_sync_workflow",
]
