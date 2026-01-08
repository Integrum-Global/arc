"""
Analytics API routes for ARC.

Endpoints:
- GET /securities/{id}/ratios - Get security ratios
- GET /securities/{id}/ratios/history - Get ratio history
- POST /analytics/ratios/calculate - Trigger ratio calculation
- GET /alerts - Get user alerts
- PUT /alerts/{id}/acknowledge - Acknowledge alert
- PUT /alerts/{id}/dismiss - Dismiss alert
- PUT /alerts/{id}/resolve - Resolve alert
- GET /thresholds - Get user thresholds
- POST /thresholds - Create threshold
- DELETE /thresholds/{id} - Delete threshold
- POST /analytics/thresholds/check - Check all thresholds
- GET /peer-groups - List peer groups
- POST /peer-groups - Create peer group
- PUT /peer-groups/{id} - Update peer group
- DELETE /peer-groups/{id} - Delete peer group
- GET /securities/{id}/benchmark - Benchmark vs peers
- GET /securities/{id}/trend - Get ratio trend
"""

from typing import Any

from pydantic import BaseModel, Field

from arc.api.auth import CurrentUser
from arc.models import db
from arc.services import AnalyticsService, ConflictError, NotFoundError, ValidationError

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class CalculateRatiosRequest(BaseModel):
    """Calculate ratios request body."""

    security_ids: list[str] | None = None
    ratio_names: list[str] | None = None
    force_recalculate: bool = False


class ConfigureThresholdRequest(BaseModel):
    """Configure threshold request body."""

    ratio_class: str
    ratio_name: str
    warning_threshold: str
    critical_threshold: str
    comparison: str = "lt"
    portfolio_id: str | None = None
    security_id: str | None = None
    cooldown_hours: int = 24
    alert_on_improvement: bool = False


class CreatePeerGroupRequest(BaseModel):
    """Create peer group request body."""

    name: str = Field(..., min_length=1)
    security_ids: list[str]
    description: str | None = None
    group_type: str = "custom"
    criteria: dict | None = None


class UpdatePeerGroupRequest(BaseModel):
    """Update peer group request body."""

    name: str | None = None
    description: str | None = None
    security_ids: list[str] | None = None
    criteria: dict | None = None


class DismissAlertRequest(BaseModel):
    """Dismiss alert request body."""

    reason: str | None = None


class ResolveAlertRequest(BaseModel):
    """Resolve alert request body."""

    resolution_notes: str | None = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def get_analytics_service(current_user: CurrentUser) -> AnalyticsService:
    """Create AnalyticsService with user context."""
    return AnalyticsService(
        db=db,
        tenant_id=current_user["tenant_id"],
        user_id=current_user["user_id"],
    )


def format_error(e: Exception) -> dict[str, Any]:
    """Format exception as error response."""
    if isinstance(e, NotFoundError):
        return {"success": False, "error": {"code": "NOT_FOUND", "message": str(e)}}
    if isinstance(e, ValidationError):
        return {"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}
    if isinstance(e, ConflictError):
        return {"success": False, "error": {"code": "CONFLICT", "message": str(e)}}
    return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}


# =============================================================================
# RATIO ENDPOINTS
# =============================================================================


async def get_security_ratios(
    current_user: CurrentUser,
    security_id: str,
    as_of_date: str | None = None,
) -> dict[str, Any]:
    """
    Get all ratios for a security.

    Args:
        current_user: Authenticated user
        security_id: Security ID
        as_of_date: Date for ratios (optional)

    Returns:
        Security ratios organized by class
    """
    service = get_analytics_service(current_user)
    try:
        ratios = await service.get_security_ratios(
            security_id=security_id,
            as_of_date=as_of_date,
        )
        return {"success": True, "data": ratios}
    except Exception as e:
        return format_error(e)


async def get_ratio_history(
    current_user: CurrentUser,
    security_id: str,
    ratio_name: str,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """
    Get historical ratio values.

    Args:
        current_user: Authenticated user
        security_id: Security ID
        ratio_name: Ratio to retrieve
        start_date: Start date filter
        end_date: End date filter
        limit: Maximum results

    Returns:
        Historical ratio values
    """
    service = get_analytics_service(current_user)
    try:
        history = await service.get_ratio_history(
            security_id=security_id,
            ratio_name=ratio_name,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )
        return {"success": True, "data": history}
    except Exception as e:
        return format_error(e)


async def calculate_ratios(
    current_user: CurrentUser,
    data: CalculateRatiosRequest,
) -> dict[str, Any]:
    """
    Calculate ratios for securities.

    Args:
        current_user: Authenticated user
        data: Calculation parameters

    Returns:
        Calculation summary
    """
    service = get_analytics_service(current_user)
    try:
        result = await service.calculate_ratios(
            security_ids=data.security_ids,
            ratio_names=data.ratio_names,
            force_recalculate=data.force_recalculate,
        )
        return {"success": True, "data": result}
    except Exception as e:
        return format_error(e)


# =============================================================================
# ALERT ENDPOINTS
# =============================================================================


async def get_alerts(
    current_user: CurrentUser,
    status: str | None = None,
    alert_type: str | None = None,
    severity: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """
    Get user alerts.

    Args:
        current_user: Authenticated user
        status: Filter by status
        alert_type: Filter by type
        severity: Filter by severity
        limit: Maximum results

    Returns:
        List of alerts
    """
    service = get_analytics_service(current_user)
    try:
        alerts = await service.get_user_alerts(
            status=status,
            alert_type=alert_type,
            severity=severity,
            limit=limit,
        )
        return {"success": True, "data": alerts}
    except Exception as e:
        return format_error(e)


async def acknowledge_alert(
    current_user: CurrentUser,
    alert_id: str,
) -> dict[str, Any]:
    """
    Acknowledge an alert.

    Args:
        current_user: Authenticated user
        alert_id: Alert ID

    Returns:
        Updated alert
    """
    service = get_analytics_service(current_user)
    try:
        alert = await service.acknowledge_alert(alert_id)
        return {"success": True, "data": alert}
    except Exception as e:
        return format_error(e)


async def dismiss_alert(
    current_user: CurrentUser,
    alert_id: str,
    data: DismissAlertRequest | None = None,
) -> dict[str, Any]:
    """
    Dismiss an alert.

    Args:
        current_user: Authenticated user
        alert_id: Alert ID
        data: Dismissal reason

    Returns:
        Updated alert
    """
    service = get_analytics_service(current_user)
    try:
        reason = data.reason if data else None
        alert = await service.dismiss_alert(alert_id, reason=reason)
        return {"success": True, "data": alert}
    except Exception as e:
        return format_error(e)


async def resolve_alert(
    current_user: CurrentUser,
    alert_id: str,
    data: ResolveAlertRequest | None = None,
) -> dict[str, Any]:
    """
    Resolve an alert.

    Args:
        current_user: Authenticated user
        alert_id: Alert ID
        data: Resolution notes

    Returns:
        Updated alert
    """
    service = get_analytics_service(current_user)
    try:
        notes = data.resolution_notes if data else None
        alert = await service.resolve_alert(alert_id, resolution_notes=notes)
        return {"success": True, "data": alert}
    except Exception as e:
        return format_error(e)


# =============================================================================
# THRESHOLD ENDPOINTS
# =============================================================================


async def get_thresholds(
    current_user: CurrentUser,
    ratio_name: str | None = None,
    portfolio_id: str | None = None,
    enabled_only: bool = True,
) -> dict[str, Any]:
    """
    Get user's alert thresholds.

    Args:
        current_user: Authenticated user
        ratio_name: Filter by ratio
        portfolio_id: Filter by portfolio
        enabled_only: Only enabled thresholds

    Returns:
        List of thresholds
    """
    service = get_analytics_service(current_user)
    try:
        thresholds = await service.get_thresholds(
            ratio_name=ratio_name,
            portfolio_id=portfolio_id,
            enabled_only=enabled_only,
        )
        return {"success": True, "data": thresholds}
    except Exception as e:
        return format_error(e)


async def configure_threshold(
    current_user: CurrentUser,
    data: ConfigureThresholdRequest,
) -> dict[str, Any]:
    """
    Create or update a threshold.

    Args:
        current_user: Authenticated user
        data: Threshold configuration

    Returns:
        Created/updated threshold
    """
    service = get_analytics_service(current_user)
    try:
        threshold = await service.configure_threshold(
            ratio_class=data.ratio_class,
            ratio_name=data.ratio_name,
            warning_threshold=data.warning_threshold,
            critical_threshold=data.critical_threshold,
            comparison=data.comparison,
            portfolio_id=data.portfolio_id,
            security_id=data.security_id,
            cooldown_hours=data.cooldown_hours,
            alert_on_improvement=data.alert_on_improvement,
        )
        return {"success": True, "data": threshold}
    except Exception as e:
        return format_error(e)


async def delete_threshold(
    current_user: CurrentUser,
    threshold_id: str,
) -> dict[str, Any]:
    """
    Delete a threshold.

    Args:
        current_user: Authenticated user
        threshold_id: Threshold ID

    Returns:
        Deletion confirmation
    """
    service = get_analytics_service(current_user)
    try:
        result = await service.delete_threshold(threshold_id)
        return {"success": True, "data": {"deleted": result}}
    except Exception as e:
        return format_error(e)


async def check_thresholds(
    current_user: CurrentUser,
) -> dict[str, Any]:
    """
    Check all thresholds and generate alerts.

    Args:
        current_user: Authenticated user

    Returns:
        Check summary
    """
    service = get_analytics_service(current_user)
    try:
        result = await service.check_thresholds()
        return {"success": True, "data": result}
    except Exception as e:
        return format_error(e)


# =============================================================================
# PEER GROUP ENDPOINTS
# =============================================================================


async def get_peer_groups(
    current_user: CurrentUser,
    include_system: bool = True,
    group_type: str | None = None,
) -> dict[str, Any]:
    """
    Get user's peer groups.

    Args:
        current_user: Authenticated user
        include_system: Include system groups
        group_type: Filter by type

    Returns:
        List of peer groups
    """
    service = get_analytics_service(current_user)
    try:
        groups = await service.get_peer_groups(
            include_system=include_system,
            group_type=group_type,
        )
        return {"success": True, "data": groups}
    except Exception as e:
        return format_error(e)


async def create_peer_group(
    current_user: CurrentUser,
    data: CreatePeerGroupRequest,
) -> dict[str, Any]:
    """
    Create a peer group.

    Args:
        current_user: Authenticated user
        data: Peer group data

    Returns:
        Created peer group
    """
    service = get_analytics_service(current_user)
    try:
        group = await service.create_peer_group(
            name=data.name,
            security_ids=data.security_ids,
            description=data.description,
            group_type=data.group_type,
            criteria=data.criteria,
        )
        return {"success": True, "data": group}
    except Exception as e:
        return format_error(e)


async def update_peer_group(
    current_user: CurrentUser,
    peer_group_id: str,
    data: UpdatePeerGroupRequest,
) -> dict[str, Any]:
    """
    Update a peer group.

    Args:
        current_user: Authenticated user
        peer_group_id: Peer group ID
        data: Update data

    Returns:
        Updated peer group
    """
    service = get_analytics_service(current_user)
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        group = await service.update_peer_group(peer_group_id, updates)
        return {"success": True, "data": group}
    except Exception as e:
        return format_error(e)


async def delete_peer_group(
    current_user: CurrentUser,
    peer_group_id: str,
) -> dict[str, Any]:
    """
    Delete a peer group.

    Args:
        current_user: Authenticated user
        peer_group_id: Peer group ID

    Returns:
        Deletion confirmation
    """
    service = get_analytics_service(current_user)
    try:
        result = await service.delete_peer_group(peer_group_id)
        return {"success": True, "data": {"deleted": result}}
    except Exception as e:
        return format_error(e)


async def benchmark_security(
    current_user: CurrentUser,
    security_id: str,
    peer_group_id: str,
    ratio_names: list[str] | None = None,
) -> dict[str, Any]:
    """
    Benchmark security against peer group.

    Args:
        current_user: Authenticated user
        security_id: Security to benchmark
        peer_group_id: Peer group to compare against
        ratio_names: Specific ratios (optional)

    Returns:
        Benchmark comparison
    """
    service = get_analytics_service(current_user)
    try:
        result = await service.benchmark_against_peers(
            security_id=security_id,
            peer_group_id=peer_group_id,
            ratio_names=ratio_names,
        )
        return {"success": True, "data": result}
    except Exception as e:
        return format_error(e)


# =============================================================================
# TREND ENDPOINTS
# =============================================================================


async def get_ratio_trend(
    current_user: CurrentUser,
    security_id: str,
    ratio_name: str,
    periods: int = 4,
) -> dict[str, Any]:
    """
    Get trend analysis for a ratio.

    Args:
        current_user: Authenticated user
        security_id: Security ID
        ratio_name: Ratio to analyze
        periods: Number of periods

    Returns:
        Trend analysis
    """
    service = get_analytics_service(current_user)
    try:
        trend = await service.get_ratio_trend(
            security_id=security_id,
            ratio_name=ratio_name,
            periods=periods,
        )
        return {"success": True, "data": trend}
    except Exception as e:
        return format_error(e)


async def compare_periods(
    current_user: CurrentUser,
    security_id: str,
    ratio_name: str,
    current_date: str | None = None,
    comparison_date: str | None = None,
) -> dict[str, Any]:
    """
    Compare ratio between two periods.

    Args:
        current_user: Authenticated user
        security_id: Security ID
        ratio_name: Ratio to compare
        current_date: Current period date
        comparison_date: Historical date

    Returns:
        Period comparison
    """
    service = get_analytics_service(current_user)
    try:
        comparison = await service.compare_periods(
            security_id=security_id,
            ratio_name=ratio_name,
            current_date=current_date,
            comparison_date=comparison_date,
        )
        return {"success": True, "data": comparison}
    except Exception as e:
        return format_error(e)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "CalculateRatiosRequest",
    "ConfigureThresholdRequest",
    "CreatePeerGroupRequest",
    "UpdatePeerGroupRequest",
    "DismissAlertRequest",
    "ResolveAlertRequest",
    "get_security_ratios",
    "get_ratio_history",
    "calculate_ratios",
    "get_alerts",
    "acknowledge_alert",
    "dismiss_alert",
    "resolve_alert",
    "get_thresholds",
    "configure_threshold",
    "delete_threshold",
    "check_thresholds",
    "get_peer_groups",
    "create_peer_group",
    "update_peer_group",
    "delete_peer_group",
    "benchmark_security",
    "get_ratio_trend",
    "compare_periods",
]
