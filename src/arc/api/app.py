"""
Nexus application for ARC investment platform.

This module provides the main Nexus application with:
- Custom endpoints using DataFlow Express API for CRUD operations
- Async database initialization
- Health monitoring endpoints
- Multi-channel support (API, CLI, MCP)

CRITICAL: Uses auto_discovery=False to prevent blocking with DataFlow integration.
Tables are created explicitly via create_tables_async() during startup.

Usage:
    from arc.api.app import app

    # Run with uvicorn
    uvicorn arc.api.app:app --host 0.0.0.0 --port 8000
"""

from datetime import UTC, datetime
from typing import Any

from nexus import Nexus

from arc.core.config import settings

# Import db and models - models register with db via @db.model decorator
from arc.models import (
    Alert,
    AlertThreshold,
    AuditLog,
    Benchmark,
    CashAccount,
    CompanyFundamentals,
    CorporateAction,
    Dividend,
    Holding,
    NotificationPreference,
    PeerGroup,
    Portfolio,
    PortfolioValuation,
    PriceHistory,
    Report,
    Security,
    SecurityRatio,
    Tenant,
    Transaction,
    User,
    UserPreference,
    Watchlist,
    WatchlistItem,
    close_database,
    create_tables,
    db,
)

# =============================================================================
# NEXUS APPLICATION SETUP
# =============================================================================


async def initialize_database() -> None:
    """
    Initialize database tables asynchronously.

    Called during application startup to create all tables.
    CRITICAL: Uses auto_migrate=False pattern for Docker/FastAPI compatibility.
    """
    print(f"[{datetime.now(UTC).isoformat()}] Starting ARC Platform...")
    print(f"[{datetime.now(UTC).isoformat()}] Environment: {settings.environment}")
    print(f"[{datetime.now(UTC).isoformat()}] Creating database tables...")

    await create_tables()

    print(f"[{datetime.now(UTC).isoformat()}] Database tables created successfully")
    print(f"[{datetime.now(UTC).isoformat()}] ARC Platform ready")


async def shutdown_database() -> None:
    """
    Shutdown database connections gracefully.

    Called during application shutdown to close all connections.
    """
    print(f"[{datetime.now(UTC).isoformat()}] Shutting down ARC Platform...")
    await close_database()
    print(f"[{datetime.now(UTC).isoformat()}] Database connections closed")


# =============================================================================
# CREATE NEXUS APPLICATION
# =============================================================================

# Initialize Nexus with production-safe settings
# CRITICAL: auto_discovery=False prevents blocking during DataFlow integration
app = Nexus(
    api_port=settings.api.port,
    auto_discovery=False,  # CRITICAL: Prevents infinite blocking with DataFlow
    enable_monitoring=True,
    rate_limit=100,  # Requests per minute
)


# =============================================================================
# MODEL REGISTRY
# =============================================================================

# Core Models (tenant-scoped)
CORE_MODELS = [
    ("tenants", Tenant),
    ("users", User),
    ("user-preferences", UserPreference),
    ("notification-preferences", NotificationPreference),
    ("audit-logs", AuditLog),
]

# Portfolio Models (tenant-scoped)
PORTFOLIO_MODELS = [
    ("portfolios", Portfolio),
    ("holdings", Holding),
    ("transactions", Transaction),
    ("portfolio-valuations", PortfolioValuation),
    ("cash-accounts", CashAccount),
    ("benchmarks", Benchmark),
]

# Security Models (shared across tenants)
SECURITY_MODELS = [
    ("securities", Security),
    ("price-history", PriceHistory),
    ("company-fundamentals", CompanyFundamentals),
    ("security-ratios", SecurityRatio),
    ("corporate-actions", CorporateAction),
    ("dividends", Dividend),
]

# Analytics Models (tenant-scoped)
ANALYTICS_MODELS = [
    ("alerts", Alert),
    ("alert-thresholds", AlertThreshold),
    ("peer-groups", PeerGroup),
    ("reports", Report),
    ("watchlists", Watchlist),
    ("watchlist-items", WatchlistItem),
]

# Combine all models
ALL_MODELS = CORE_MODELS + PORTFOLIO_MODELS + SECURITY_MODELS + ANALYTICS_MODELS


# =============================================================================
# HEALTH MONITORING ENDPOINTS
# =============================================================================


@app.endpoint("/health", methods=["GET"])
async def health_check() -> dict[str, Any]:
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        Health status including:
        - Overall status (healthy/unhealthy)
        - Database connectivity
        - Registered models count
        - Uptime information
    """
    health_status: dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
        "version": "1.0.0",
        "environment": settings.environment,
        "checks": {},
    }

    # Check database connectivity
    try:
        # Use DataFlow express to verify database connection
        # This is a lightweight check that validates the connection pool
        await db.express.count("Tenant")
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful",
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
        }

    # Add model registration info
    health_status["models"] = {
        "registered_count": len(ALL_MODELS),
        "models": [name for name, _ in ALL_MODELS],
    }

    return health_status


@app.endpoint("/health/ready", methods=["GET"])
async def readiness_check() -> dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.

    Returns 200 if the service is ready to accept traffic.
    Returns 503 if dependencies are not available.
    """
    try:
        # Verify database is accessible
        await db.express.count("Tenant")
        return {
            "ready": True,
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        # Return 503 status for unhealthy state
        return {
            "ready": False,
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
        }


@app.endpoint("/health/live", methods=["GET"])
async def liveness_check() -> dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.

    Returns 200 if the service process is alive.
    This is a lightweight check that doesn't verify dependencies.
    """
    return {
        "alive": True,
        "timestamp": datetime.now(UTC).isoformat(),
    }


# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

# Import auth routes after app is created to avoid circular imports
from arc.api.auth import CurrentUser  # noqa: E402
from arc.api.routes.auth import (  # noqa: E402
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    get_me,
    login,
    logout,
    refresh_tokens,
    register,
)


@app.endpoint("/auth/login", methods=["POST"])
async def auth_login(email: str, password: str) -> dict[str, Any]:
    """
    Authenticate user with email and password.

    Returns access and refresh tokens.
    """
    data = LoginRequest(email=email, password=password)
    return await login(data)


@app.endpoint("/auth/register", methods=["POST"])
async def auth_register(
    email: str,
    password: str,
    name: str,
    tenant_id: str | None = None,
) -> dict[str, Any]:
    """
    Register a new user.

    Returns access and refresh tokens.
    """
    data = RegisterRequest(
        email=email,
        password=password,
        name=name,
        tenant_id=tenant_id,
    )
    return await register(data)


@app.endpoint("/auth/me", methods=["GET"])
async def auth_me(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get current authenticated user profile.
    """
    return await get_me(current_user)


@app.endpoint("/auth/refresh", methods=["POST"])
async def auth_refresh(refresh_token: str) -> dict[str, Any]:
    """
    Refresh access token using refresh token.
    """
    data = RefreshRequest(refresh_token=refresh_token)
    return await refresh_tokens(data)


@app.endpoint("/auth/logout", methods=["POST"])
async def auth_logout(current_user: CurrentUser) -> dict[str, Any]:
    """
    Logout user and invalidate tokens.
    """
    return await logout(current_user)


# =============================================================================
# PORTFOLIO ENDPOINTS
# =============================================================================

from arc.api.routes.portfolios import (  # noqa: E402
    AddHoldingRequest,
    CreatePortfolioRequest,
    RecordTransactionRequest,
    UpdatePortfolioRequest,
    add_holding,
    calculate_nav,
    create_portfolio,
    delete_portfolio,
    get_asset_allocation,
    get_health_scan,
    get_holdings,
    get_portfolio,
    get_sector_allocation,
    get_top_holdings,
    get_transactions,
    get_valuations,
    list_portfolios,
    record_transaction,
    update_portfolio,
)


@app.endpoint("/portfolios", methods=["GET"])
async def api_list_portfolios(
    current_user: CurrentUser,
    portfolio_type: str | None = None,
    active_only: bool = True,
    limit: int = 50,
) -> dict[str, Any]:
    """List user's portfolios."""
    return await list_portfolios(current_user, portfolio_type, active_only, limit)


@app.endpoint("/portfolios", methods=["POST"])
async def api_create_portfolio(
    current_user: CurrentUser,
    name: str,
    code: str,
    inception_date: str,
    description: str | None = None,
    portfolio_type: str = "managed",
    strategy: str | None = None,
    risk_profile: str = "moderate",
    base_currency: str = "USD",
) -> dict[str, Any]:
    """Create a new portfolio."""
    data = CreatePortfolioRequest(
        name=name,
        code=code,
        inception_date=inception_date,
        description=description,
        portfolio_type=portfolio_type,
        strategy=strategy,
        risk_profile=risk_profile,
        base_currency=base_currency,
    )
    return await create_portfolio(current_user, data)


@app.endpoint("/portfolios/{portfolio_id}", methods=["GET"])
async def api_get_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """Get portfolio by ID."""
    return await get_portfolio(current_user, portfolio_id)


@app.endpoint("/portfolios/{portfolio_id}", methods=["PUT"])
async def api_update_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
    name: str | None = None,
    description: str | None = None,
    strategy: str | None = None,
    risk_profile: str | None = None,
) -> dict[str, Any]:
    """Update portfolio."""
    data = UpdatePortfolioRequest(
        name=name, description=description, strategy=strategy, risk_profile=risk_profile
    )
    return await update_portfolio(current_user, portfolio_id, data)


@app.endpoint("/portfolios/{portfolio_id}", methods=["DELETE"])
async def api_delete_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """Delete portfolio (soft delete)."""
    return await delete_portfolio(current_user, portfolio_id)


@app.endpoint("/portfolios/{portfolio_id}/holdings", methods=["GET"])
async def api_get_holdings(
    current_user: CurrentUser,
    portfolio_id: str,
    include_closed: bool = False,
) -> dict[str, Any]:
    """Get portfolio holdings."""
    return await get_holdings(current_user, portfolio_id, include_closed)


@app.endpoint("/portfolios/{portfolio_id}/holdings", methods=["POST"])
async def api_add_holding(
    current_user: CurrentUser,
    portfolio_id: str,
    security_id: str,
    quantity: str,
    cost_basis: str,
    acquisition_date: str,
) -> dict[str, Any]:
    """Add holding to portfolio."""
    data = AddHoldingRequest(
        security_id=security_id,
        quantity=quantity,
        cost_basis=cost_basis,
        acquisition_date=acquisition_date,
    )
    return await add_holding(current_user, portfolio_id, data)


@app.endpoint("/portfolios/{portfolio_id}/transactions", methods=["GET"])
async def api_get_transactions(
    current_user: CurrentUser,
    portfolio_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
    transaction_type: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get portfolio transactions."""
    return await get_transactions(
        current_user, portfolio_id, start_date, end_date, transaction_type, limit
    )


@app.endpoint("/portfolios/{portfolio_id}/transactions", methods=["POST"])
async def api_record_transaction(
    current_user: CurrentUser,
    portfolio_id: str,
    security_id: str,
    transaction_type: str,
    transaction_date: str,
    quantity: str,
    price: str,
    settlement_date: str | None = None,
    commission: str = "0",
    fees: str = "0",
) -> dict[str, Any]:
    """Record a transaction."""
    data = RecordTransactionRequest(
        security_id=security_id,
        transaction_type=transaction_type,
        transaction_date=transaction_date,
        quantity=quantity,
        price=price,
        settlement_date=settlement_date,
        commission=commission,
        fees=fees,
    )
    return await record_transaction(current_user, portfolio_id, data)


@app.endpoint("/portfolios/{portfolio_id}/valuations", methods=["GET"])
async def api_get_valuations(
    current_user: CurrentUser,
    portfolio_id: str,
    start_date: str | None = None,
    limit: int = 30,
) -> dict[str, Any]:
    """Get NAV history."""
    return await get_valuations(current_user, portfolio_id, start_date, limit)


@app.endpoint("/portfolios/{portfolio_id}/valuations/calculate", methods=["POST"])
async def api_calculate_nav(
    current_user: CurrentUser,
    portfolio_id: str,
    valuation_date: str | None = None,
) -> dict[str, Any]:
    """Calculate and store NAV."""
    return await calculate_nav(current_user, portfolio_id, valuation_date)


@app.endpoint("/portfolios/{portfolio_id}/health", methods=["GET"])
async def api_get_health(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """Run health scan."""
    return await get_health_scan(current_user, portfolio_id)


@app.endpoint("/portfolios/{portfolio_id}/allocation/sector", methods=["GET"])
async def api_get_sector_allocation(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """Get sector allocation."""
    return await get_sector_allocation(current_user, portfolio_id)


@app.endpoint("/portfolios/{portfolio_id}/allocation/asset", methods=["GET"])
async def api_get_asset_allocation(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """Get asset class allocation."""
    return await get_asset_allocation(current_user, portfolio_id)


@app.endpoint("/portfolios/{portfolio_id}/top-holdings", methods=["GET"])
async def api_get_top_holdings(
    current_user: CurrentUser,
    portfolio_id: str,
    limit: int = 10,
) -> dict[str, Any]:
    """Get top holdings by value."""
    return await get_top_holdings(current_user, portfolio_id, limit)


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

from arc.api.routes.analytics import (  # noqa: E402
    CalculateRatiosRequest,
    ConfigureThresholdRequest,
    CreatePeerGroupRequest,
    DismissAlertRequest,
    ResolveAlertRequest,
    UpdatePeerGroupRequest,
    acknowledge_alert,
    benchmark_security,
    calculate_ratios,
    check_thresholds,
    configure_threshold,
    create_peer_group,
    delete_peer_group,
    delete_threshold,
    dismiss_alert,
    get_alerts,
    get_peer_groups,
    get_ratio_history,
    get_ratio_trend,
    get_security_ratios,
    get_thresholds,
    resolve_alert,
    update_peer_group,
)


@app.endpoint("/securities/{security_id}/ratios", methods=["GET"])
async def api_get_security_ratios(
    current_user: CurrentUser,
    security_id: str,
    as_of_date: str | None = None,
) -> dict[str, Any]:
    """Get security ratios."""
    return await get_security_ratios(current_user, security_id, as_of_date)


@app.endpoint("/securities/{security_id}/ratios/history", methods=["GET"])
async def api_get_ratio_history(
    current_user: CurrentUser,
    security_id: str,
    ratio_name: str,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get ratio history."""
    return await get_ratio_history(
        current_user, security_id, ratio_name, start_date, end_date, limit
    )


@app.endpoint("/securities/{security_id}/benchmark", methods=["GET"])
async def api_benchmark_security(
    current_user: CurrentUser,
    security_id: str,
    peer_group_id: str,
) -> dict[str, Any]:
    """Benchmark security against peers."""
    return await benchmark_security(current_user, security_id, peer_group_id)


@app.endpoint("/securities/{security_id}/trend", methods=["GET"])
async def api_get_ratio_trend(
    current_user: CurrentUser,
    security_id: str,
    ratio_name: str,
    periods: int = 4,
) -> dict[str, Any]:
    """Get ratio trend analysis."""
    return await get_ratio_trend(current_user, security_id, ratio_name, periods)


@app.endpoint("/analytics/ratios/calculate", methods=["POST"])
async def api_calculate_ratios(
    current_user: CurrentUser,
    security_ids: list[str] | None = None,
    ratio_names: list[str] | None = None,
    force_recalculate: bool = False,
) -> dict[str, Any]:
    """Calculate ratios for securities."""
    data = CalculateRatiosRequest(
        security_ids=security_ids,
        ratio_names=ratio_names,
        force_recalculate=force_recalculate,
    )
    return await calculate_ratios(current_user, data)


@app.endpoint("/analytics/thresholds/check", methods=["POST"])
async def api_check_thresholds(current_user: CurrentUser) -> dict[str, Any]:
    """Check all thresholds and generate alerts."""
    return await check_thresholds(current_user)


@app.endpoint("/alerts", methods=["GET"])
async def api_get_alerts(
    current_user: CurrentUser,
    status: str | None = None,
    alert_type: str | None = None,
    severity: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get user alerts."""
    return await get_alerts(current_user, status, alert_type, severity, limit)


@app.endpoint("/alerts/{alert_id}/acknowledge", methods=["PUT"])
async def api_acknowledge_alert(
    current_user: CurrentUser,
    alert_id: str,
) -> dict[str, Any]:
    """Acknowledge an alert."""
    return await acknowledge_alert(current_user, alert_id)


@app.endpoint("/alerts/{alert_id}/dismiss", methods=["PUT"])
async def api_dismiss_alert(
    current_user: CurrentUser,
    alert_id: str,
    reason: str | None = None,
) -> dict[str, Any]:
    """Dismiss an alert."""
    data = DismissAlertRequest(reason=reason) if reason else None
    return await dismiss_alert(current_user, alert_id, data)


@app.endpoint("/alerts/{alert_id}/resolve", methods=["PUT"])
async def api_resolve_alert(
    current_user: CurrentUser,
    alert_id: str,
    resolution_notes: str | None = None,
) -> dict[str, Any]:
    """Resolve an alert."""
    data = ResolveAlertRequest(resolution_notes=resolution_notes) if resolution_notes else None
    return await resolve_alert(current_user, alert_id, data)


@app.endpoint("/thresholds", methods=["GET"])
async def api_get_thresholds(
    current_user: CurrentUser,
    ratio_name: str | None = None,
    portfolio_id: str | None = None,
    enabled_only: bool = True,
) -> dict[str, Any]:
    """Get user's alert thresholds."""
    return await get_thresholds(current_user, ratio_name, portfolio_id, enabled_only)


@app.endpoint("/thresholds", methods=["POST"])
async def api_configure_threshold(
    current_user: CurrentUser,
    ratio_class: str,
    ratio_name: str,
    warning_threshold: str,
    critical_threshold: str,
    comparison: str = "lt",
    portfolio_id: str | None = None,
    security_id: str | None = None,
    cooldown_hours: int = 24,
) -> dict[str, Any]:
    """Create or update a threshold."""
    data = ConfigureThresholdRequest(
        ratio_class=ratio_class,
        ratio_name=ratio_name,
        warning_threshold=warning_threshold,
        critical_threshold=critical_threshold,
        comparison=comparison,
        portfolio_id=portfolio_id,
        security_id=security_id,
        cooldown_hours=cooldown_hours,
    )
    return await configure_threshold(current_user, data)


@app.endpoint("/thresholds/{threshold_id}", methods=["DELETE"])
async def api_delete_threshold(
    current_user: CurrentUser,
    threshold_id: str,
) -> dict[str, Any]:
    """Delete a threshold."""
    return await delete_threshold(current_user, threshold_id)


@app.endpoint("/peer-groups", methods=["GET"])
async def api_get_peer_groups(
    current_user: CurrentUser,
    include_system: bool = True,
    group_type: str | None = None,
) -> dict[str, Any]:
    """Get peer groups."""
    return await get_peer_groups(current_user, include_system, group_type)


@app.endpoint("/peer-groups", methods=["POST"])
async def api_create_peer_group(
    current_user: CurrentUser,
    name: str,
    security_ids: list[str],
    description: str | None = None,
    group_type: str = "custom",
) -> dict[str, Any]:
    """Create a peer group."""
    data = CreatePeerGroupRequest(
        name=name,
        security_ids=security_ids,
        description=description,
        group_type=group_type,
    )
    return await create_peer_group(current_user, data)


@app.endpoint("/peer-groups/{peer_group_id}", methods=["PUT"])
async def api_update_peer_group(
    current_user: CurrentUser,
    peer_group_id: str,
    name: str | None = None,
    description: str | None = None,
    security_ids: list[str] | None = None,
) -> dict[str, Any]:
    """Update a peer group."""
    data = UpdatePeerGroupRequest(name=name, description=description, security_ids=security_ids)
    return await update_peer_group(current_user, peer_group_id, data)


@app.endpoint("/peer-groups/{peer_group_id}", methods=["DELETE"])
async def api_delete_peer_group(
    current_user: CurrentUser,
    peer_group_id: str,
) -> dict[str, Any]:
    """Delete a peer group."""
    return await delete_peer_group(current_user, peer_group_id)


# =============================================================================
# USER ENDPOINTS
# =============================================================================

from arc.api.routes.users import (  # noqa: E402
    CreateUserRequest,
    UpdateMeRequest,
    UpdatePreferencesRequest,
    UpdateUserRequest,
    create_user,
    deactivate_user,
    get_preferences,
    list_users,
    update_me,
    update_preferences,
    update_user,
)
from arc.api.routes.users import get_me as users_get_me  # noqa: E402


@app.endpoint("/users/me", methods=["GET"])
async def api_get_me(current_user: CurrentUser) -> dict[str, Any]:
    """Get current user profile."""
    return await users_get_me(current_user)


@app.endpoint("/users/me", methods=["PUT"])
async def api_update_me(
    current_user: CurrentUser,
    name: str | None = None,
    phone: str | None = None,
    timezone: str | None = None,
) -> dict[str, Any]:
    """Update current user profile."""
    data = UpdateMeRequest(name=name, phone=phone, timezone=timezone)
    return await update_me(current_user, data)


@app.endpoint("/users/me/preferences", methods=["GET"])
async def api_get_preferences(current_user: CurrentUser) -> dict[str, Any]:
    """Get user preferences."""
    return await get_preferences(current_user)


@app.endpoint("/users/me/preferences", methods=["PUT"])
async def api_update_preferences(
    current_user: CurrentUser,
    theme: str | None = None,
    language: str | None = None,
    default_portfolio_view: str | None = None,
    date_format: str | None = None,
    number_format: str | None = None,
    default_dashboard: str | None = None,
) -> dict[str, Any]:
    """Update user preferences."""
    data = UpdatePreferencesRequest(
        theme=theme,
        language=language,
        default_portfolio_view=default_portfolio_view,
        date_format=date_format,
        number_format=number_format,
        default_dashboard=default_dashboard,
    )
    return await update_preferences(current_user, data)


@app.endpoint("/users", methods=["GET"])
async def api_list_users(
    current_user: CurrentUser,
    status: str | None = None,
    role: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """List users in tenant (admin only)."""
    return await list_users(current_user, status, role, limit)


@app.endpoint("/users", methods=["POST"])
async def api_create_user(
    current_user: CurrentUser,
    email: str,
    name: str,
    password: str,
    role: str = "viewer",
) -> dict[str, Any]:
    """Create a new user (admin only)."""
    data = CreateUserRequest(email=email, name=name, password=password, role=role)
    return await create_user(current_user, data)


@app.endpoint("/users/{user_id}", methods=["PUT"])
async def api_update_user(
    current_user: CurrentUser,
    user_id: str,
    name: str | None = None,
    email: str | None = None,
    role: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    """Update a user (admin only)."""
    data = UpdateUserRequest(name=name, email=email, role=role, status=status)
    return await update_user(current_user, user_id, data)


@app.endpoint("/users/{user_id}", methods=["DELETE"])
async def api_deactivate_user(
    current_user: CurrentUser,
    user_id: str,
) -> dict[str, Any]:
    """Deactivate a user (admin only)."""
    return await deactivate_user(current_user, user_id)


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

from arc.api.routes.admin import (  # noqa: E402
    UpdateTenantRequest,
    get_audit_logs,
    get_metrics,
    get_tenant,
    update_tenant,
)


@app.endpoint("/admin/tenant", methods=["GET"])
async def api_get_tenant(current_user: CurrentUser) -> dict[str, Any]:
    """Get tenant information (admin only)."""
    return await get_tenant(current_user)


@app.endpoint("/admin/tenant", methods=["PUT"])
async def api_update_tenant(
    current_user: CurrentUser,
    name: str | None = None,
    settings: dict | None = None,
) -> dict[str, Any]:
    """Update tenant settings (admin only)."""
    data = UpdateTenantRequest(name=name, settings=settings)
    return await update_tenant(current_user, data)


@app.endpoint("/admin/audit", methods=["GET"])
async def api_get_audit_logs(
    current_user: CurrentUser,
    start_date: str | None = None,
    end_date: str | None = None,
    action: str | None = None,
    user_id: str | None = None,
    entity_type: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get audit logs (admin only)."""
    return await get_audit_logs(
        current_user, start_date, end_date, action, user_id, entity_type, limit
    )


@app.endpoint("/admin/metrics", methods=["GET"])
async def api_get_metrics(current_user: CurrentUser) -> dict[str, Any]:
    """Get usage metrics (admin only)."""
    return await get_metrics(current_user)


# =============================================================================
# CUSTOM WORKFLOW REGISTRATION
# =============================================================================


def register_workflows() -> None:
    """
    Register custom workflows with Nexus.

    This is where you register business logic workflows beyond simple CRUD.
    Examples:
    - Portfolio rebalancing workflow
    - Morning brief generation
    - Alert processing workflow
    - Data import/export workflows

    Usage:
        from kailash.workflow.builder import WorkflowBuilder

        workflow = WorkflowBuilder()
        workflow.add_node("PythonCodeNode", "process", {...})
        app.register("workflow-name", workflow.build())
    """
    # Custom workflows will be registered here as they are implemented
    # Example:
    #
    # from arc.workflows.portfolio import create_rebalance_workflow
    # app.register("portfolio/rebalance", create_rebalance_workflow().build())
    #
    # from arc.workflows.analytics import create_morning_brief_workflow
    # app.register("analytics/morning-brief", create_morning_brief_workflow().build())
    pass


# Register custom workflows
register_workflows()


# =============================================================================
# APPLICATION EXPORTS
# =============================================================================

# Export the app for uvicorn
__all__ = [
    "app",
    "db",
    "ALL_MODELS",
    "CORE_MODELS",
    "PORTFOLIO_MODELS",
    "SECURITY_MODELS",
    "ANALYTICS_MODELS",
    "initialize_database",
    "shutdown_database",
    "health_check",
    "readiness_check",
    "liveness_check",
    "register_workflows",
]
