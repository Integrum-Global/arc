"""
Data Synchronization Service for ARC platform.

Provides high-level API for syncing external market data using Kailash workflows.

Features:
- EODHD price sync (individual and bulk)
- Fundamentals sync with ratio calculation
- Progress tracking and error reporting
- Async-first design for Docker/FastAPI

Usage:
    from arc.services.sync_service import SyncService
    from arc.models.database import db

    sync = SyncService(db)
    result = await sync.sync_prices(security_ids=["AAPL", "MSFT"])

CRITICAL RULES:
- ALWAYS use AsyncLocalRuntime for Docker/FastAPI
- NEVER manually set created_at or updated_at in workflows
- Use string decimals for all monetary values
"""

import logging
from datetime import datetime
from typing import Any

from arc.models.database import db
from arc.services.base import BaseService, ServiceError, service_operation
from arc.workflows.sync import (
    build_eodhd_bulk_price_sync_workflow,
    build_eodhd_price_sync_workflow,
    build_fundamentals_sync_workflow,
)
from arc.workflows.sync.fundamentals_sync import build_ratio_recalculation_workflow

logger = logging.getLogger(__name__)


class SyncService(BaseService):
    """
    Service for synchronizing external market data.

    Provides methods for:
    - Price sync from EODHD
    - Fundamentals sync with ratio calculation
    - Bulk operations for end-of-day sync
    - Progress tracking and error handling

    Example:
        >>> sync = SyncService(db)
        >>>
        >>> # Sync prices for specific securities
        >>> result = await sync.sync_prices(
        ...     security_ids=["AAPL", "MSFT"],
        ...     start_date="2024-01-01"
        ... )
        >>>
        >>> # Bulk sync for exchange
        >>> result = await sync.sync_exchange_prices(exchange="US")
        >>>
        >>> # Sync fundamentals with ratio calculation
        >>> result = await sync.sync_fundamentals(
        ...     security_ids=["AAPL"],
        ...     trigger_ratio_calc=True
        ... )
    """

    @service_operation("sync_prices")
    async def sync_prices(
        self,
        security_ids: list[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        batch_size: int = 1000,
    ) -> dict[str, Any]:
        """
        Sync historical prices from EODHD.

        Args:
            security_ids: Securities to sync. If None, syncs all active securities.
            start_date: Start date (YYYY-MM-DD). Defaults to last sync date.
            end_date: End date (YYYY-MM-DD). Defaults to today.
            batch_size: Records per batch for bulk operations.

        Returns:
            Sync summary with counts and any errors.

        Raises:
            ServiceError: If sync fails.
        """
        workflow = build_eodhd_price_sync_workflow(
            security_ids=security_ids,
            start_date=start_date,
            end_date=end_date,
            batch_size=batch_size,
        )

        results, run_id = await self.execute_workflow(workflow)

        # Extract summary from compile_summary node
        summary = results.get("compile_summary", {}).get("result", {})
        summary["run_id"] = run_id

        return summary

    @service_operation("sync_exchange_prices")
    async def sync_exchange_prices(
        self,
        exchange: str = "US",
        date: str | None = None,
        batch_size: int = 2000,
    ) -> dict[str, Any]:
        """
        Sync bulk prices for an entire exchange.

        Uses EODHD's bulk endpoint for efficient end-of-day sync.

        Args:
            exchange: Exchange code (e.g., "US", "LSE", "TO").
            date: Date to sync (YYYY-MM-DD). Defaults to latest.
            batch_size: Records per batch for bulk operations.

        Returns:
            Sync summary with counts.

        Raises:
            ServiceError: If sync fails.
        """
        workflow = build_eodhd_bulk_price_sync_workflow(
            exchange=exchange,
            date=date,
            batch_size=batch_size,
        )

        results, run_id = await self.execute_workflow(workflow)

        summary = results.get("compile_summary", {}).get("result", {})
        summary["run_id"] = run_id

        return summary

    @service_operation("sync_fundamentals")
    async def sync_fundamentals(
        self,
        security_ids: list[str] | None = None,
        sync_annual: bool = True,
        sync_quarterly: bool = True,
        trigger_ratio_calc: bool = True,
        batch_size: int = 500,
    ) -> dict[str, Any]:
        """
        Sync company fundamentals and optionally calculate ratios.

        Args:
            security_ids: Securities to sync. If None, syncs all active equities.
            sync_annual: Whether to sync annual statements.
            sync_quarterly: Whether to sync quarterly statements.
            trigger_ratio_calc: Whether to calculate financial ratios after sync.
            batch_size: Records per batch for bulk operations.

        Returns:
            Sync summary with counts.

        Raises:
            ServiceError: If sync fails.
        """
        workflow = build_fundamentals_sync_workflow(
            security_ids=security_ids,
            sync_annual=sync_annual,
            sync_quarterly=sync_quarterly,
            batch_size=batch_size,
            trigger_ratio_calc=trigger_ratio_calc,
        )

        results, run_id = await self.execute_workflow(workflow)

        summary = results.get("compile_summary", {}).get("result", {})
        summary["run_id"] = run_id

        return summary

    @service_operation("recalculate_ratios")
    async def recalculate_ratios(
        self,
        security_ids: list[str] | None = None,
        calculation_date: str | None = None,
        batch_size: int = 1000,
    ) -> dict[str, Any]:
        """
        Recalculate financial ratios from existing fundamentals.

        Useful when ratio logic changes or for historical recalculation.

        Args:
            security_ids: Securities to recalculate. If None, recalculates all.
            calculation_date: Date for calculation. Defaults to today.
            batch_size: Records per batch.

        Returns:
            Recalculation summary.

        Raises:
            ServiceError: If recalculation fails.
        """
        workflow = build_ratio_recalculation_workflow(
            security_ids=security_ids,
            calculation_date=calculation_date,
            batch_size=batch_size,
        )

        results, run_id = await self.execute_workflow(workflow)

        summary = results.get("compile_summary", {}).get("result", {})
        summary["run_id"] = run_id

        return summary

    @service_operation("full_sync")
    async def full_sync(
        self,
        security_ids: list[str] | None = None,
        include_prices: bool = True,
        include_fundamentals: bool = True,
        include_ratios: bool = True,
        price_start_date: str | None = None,
    ) -> dict[str, Any]:
        """
        Perform a full sync of all data types.

        Runs price sync, fundamentals sync, and ratio calculation in sequence.

        Args:
            security_ids: Securities to sync. If None, syncs all active.
            include_prices: Whether to sync prices.
            include_fundamentals: Whether to sync fundamentals.
            include_ratios: Whether to calculate ratios.
            price_start_date: Start date for price history.

        Returns:
            Combined sync summary.

        Raises:
            ServiceError: If any sync step fails.
        """
        results = {
            "sync_type": "full_sync",
            "started_at": datetime.now().isoformat(),
            "steps": {},
        }

        # Step 1: Price Sync
        if include_prices:
            try:
                price_result = await self.sync_prices(
                    security_ids=security_ids,
                    start_date=price_start_date,
                )
                results["steps"]["prices"] = price_result
            except ServiceError as e:
                results["steps"]["prices"] = {"status": "failed", "error": str(e)}

        # Step 2: Fundamentals Sync
        if include_fundamentals:
            try:
                fundamentals_result = await self.sync_fundamentals(
                    security_ids=security_ids,
                    trigger_ratio_calc=include_ratios,
                )
                results["steps"]["fundamentals"] = fundamentals_result
            except ServiceError as e:
                results["steps"]["fundamentals"] = {"status": "failed", "error": str(e)}

        results["completed_at"] = datetime.now().isoformat()

        # Determine overall status
        all_success = all(step.get("status") != "failed" for step in results["steps"].values())
        results["status"] = "success" if all_success else "partial_success"

        return results


# Convenience function to get a configured sync service
def get_sync_service() -> SyncService:
    """
    Get a configured SyncService instance.

    Returns:
        SyncService configured with the default database.
    """
    return SyncService(db)
