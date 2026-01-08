"""
Admin API routes for ARC.

Endpoints:
- GET /admin/tenant - Get tenant info
- PUT /admin/tenant - Update tenant settings
- GET /admin/audit - Get audit logs
- GET /admin/metrics - Get usage metrics
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel

from arc.api.auth import CurrentUser
from arc.models import db
from arc.services import NotFoundError

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class UpdateTenantRequest(BaseModel):
    """Update tenant request body."""

    name: str | None = None
    settings: dict | None = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def format_error(e: Exception) -> dict[str, Any]:
    """Format exception as error response."""
    if isinstance(e, NotFoundError):
        return {"success": False, "error": {"code": "NOT_FOUND", "message": str(e)}}
    return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}


def check_admin_permission(current_user: CurrentUser) -> dict[str, Any] | None:
    """Check if user has admin permission."""
    if current_user.get("role") != "admin":
        return {"success": False, "error": {"code": "FORBIDDEN", "message": "Admin role required"}}
    return None


# =============================================================================
# TENANT MANAGEMENT ENDPOINTS
# =============================================================================


async def get_tenant(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get tenant information.

    Args:
        current_user: Authenticated user

    Returns:
        Tenant details
    """
    error = check_admin_permission(current_user)
    if error:
        return error

    try:
        tenant = await db.express.read("Tenant", current_user["tenant_id"])
        if not tenant:
            return format_error(NotFoundError("Tenant not found"))

        return {
            "success": True,
            "data": {
                "id": tenant["id"],
                "name": tenant.get("name"),
                "status": tenant.get("status"),
                "plan": tenant.get("plan"),
                "settings": tenant.get("settings", {}),
                "created_at": tenant.get("created_at"),
            },
        }
    except Exception as e:
        return format_error(e)


async def update_tenant(
    current_user: CurrentUser,
    data: UpdateTenantRequest,
) -> dict[str, Any]:
    """
    Update tenant settings.

    Args:
        current_user: Authenticated user
        data: Update data

    Returns:
        Updated tenant
    """
    error = check_admin_permission(current_user)
    if error:
        return error

    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "No updates provided"},
            }

        tenant = await db.express.update(
            "Tenant",
            filter={"id": current_user["tenant_id"]},
            fields=updates,
        )

        if not tenant:
            return format_error(NotFoundError("Tenant not found"))

        return {
            "success": True,
            "data": {
                "id": tenant["id"],
                "name": tenant.get("name"),
                "status": tenant.get("status"),
                "plan": tenant.get("plan"),
                "settings": tenant.get("settings", {}),
            },
        }
    except Exception as e:
        return format_error(e)


# =============================================================================
# AUDIT LOG ENDPOINTS
# =============================================================================


async def get_audit_logs(
    current_user: CurrentUser,
    start_date: str | None = None,
    end_date: str | None = None,
    action: str | None = None,
    user_id: str | None = None,
    entity_type: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> dict[str, Any]:
    """
    Get audit logs for tenant.

    Args:
        current_user: Authenticated user
        start_date: Filter start date
        end_date: Filter end date
        action: Filter by action type
        user_id: Filter by user
        entity_type: Filter by entity type
        limit: Maximum results
        offset: Skip results

    Returns:
        List of audit logs
    """
    error = check_admin_permission(current_user)
    if error:
        return error

    try:
        filter_dict: dict[str, Any] = {
            "tenant_id": current_user["tenant_id"],
        }

        if action:
            filter_dict["action"] = action
        if user_id:
            filter_dict["user_id"] = user_id
        if entity_type:
            filter_dict["entity_type"] = entity_type

        # Date range filters
        if start_date:
            filter_dict["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in filter_dict:
                filter_dict["created_at"]["$lte"] = end_date
            else:
                filter_dict["created_at"] = {"$lte": end_date}

        logs = await db.express.list("AuditLog", filter=filter_dict, limit=limit)

        return {
            "success": True,
            "data": logs,
            "meta": {"limit": limit, "offset": offset, "count": len(logs)},
        }
    except Exception as e:
        return format_error(e)


# =============================================================================
# METRICS ENDPOINTS
# =============================================================================


async def get_metrics(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get usage metrics for tenant.

    Args:
        current_user: Authenticated user

    Returns:
        Usage metrics
    """
    error = check_admin_permission(current_user)
    if error:
        return error

    try:
        tenant_id = current_user["tenant_id"]

        # Count users
        user_count = await db.express.count(
            "User",
            filter={"tenant_id": tenant_id, "deleted_at": {"$null": True}},
        )

        # Count active users (logged in last 30 days)
        thirty_days_ago = (datetime.now(UTC) - timedelta(days=30)).isoformat()
        active_users = await db.express.count(
            "User",
            filter={
                "tenant_id": tenant_id,
                "deleted_at": {"$null": True},
                "last_login_at": {"$gte": thirty_days_ago},
            },
        )

        # Count portfolios
        portfolio_count = await db.express.count(
            "Portfolio",
            filter={"tenant_id": tenant_id, "deleted_at": {"$null": True}},
        )

        # Count holdings
        holdings = await db.express.list(
            "Portfolio",
            filter={"tenant_id": tenant_id, "deleted_at": {"$null": True}},
            limit=1000,
        )
        portfolio_ids = [p["id"] for p in holdings]

        total_holdings = 0
        if portfolio_ids:
            for pid in portfolio_ids[:50]:  # Limit to prevent timeout
                count = await db.express.count(
                    "Holding",
                    filter={"portfolio_id": pid, "closed_at": {"$null": True}},
                )
                total_holdings += count

        # Count alerts
        alert_count = await db.express.count(
            "Alert",
            filter={"user_id": {"$in": [current_user["user_id"]]}, "status": "active"},
        )

        # Count transactions (last 30 days)
        transaction_count = 0
        if portfolio_ids:
            for pid in portfolio_ids[:50]:
                count = await db.express.count(
                    "Transaction",
                    filter={"portfolio_id": pid, "created_at": {"$gte": thirty_days_ago}},
                )
                transaction_count += count

        return {
            "success": True,
            "data": {
                "users": {
                    "total": user_count,
                    "active_30d": active_users,
                },
                "portfolios": {
                    "total": portfolio_count,
                    "total_holdings": total_holdings,
                },
                "activity": {
                    "transactions_30d": transaction_count,
                    "active_alerts": alert_count,
                },
                "timestamp": datetime.now(UTC).isoformat(),
            },
        }
    except Exception as e:
        return format_error(e)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "UpdateTenantRequest",
    "get_tenant",
    "update_tenant",
    "get_audit_logs",
    "get_metrics",
]
