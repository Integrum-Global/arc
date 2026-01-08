"""
Portfolio API routes for ARC.

Endpoints:
- GET /portfolios - List user's portfolios
- POST /portfolios - Create portfolio
- GET /portfolios/{id} - Get portfolio details
- PUT /portfolios/{id} - Update portfolio
- DELETE /portfolios/{id} - Delete portfolio
- GET /portfolios/{id}/holdings - Get holdings
- POST /portfolios/{id}/holdings - Add holding
- POST /portfolios/{id}/transactions - Record transaction
- GET /portfolios/{id}/transactions - Get transactions
- GET /portfolios/{id}/valuations - Get NAV history
- POST /portfolios/{id}/valuations/calculate - Calculate NAV
- GET /portfolios/{id}/health - Run health scan
- GET /portfolios/{id}/allocation/sector - Sector allocation
- GET /portfolios/{id}/allocation/asset - Asset allocation
"""

from typing import Any

from pydantic import BaseModel, Field

from arc.api.auth import CurrentUser
from arc.models import db
from arc.services import ConflictError, NotFoundError, PortfolioService, ValidationError

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class CreatePortfolioRequest(BaseModel):
    """Create portfolio request body."""

    name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1, max_length=20)
    inception_date: str
    description: str | None = None
    portfolio_type: str = "managed"
    strategy: str | None = None
    risk_profile: str = "moderate"
    base_currency: str = "USD"
    manager_id: str | None = None


class UpdatePortfolioRequest(BaseModel):
    """Update portfolio request body."""

    name: str | None = None
    description: str | None = None
    strategy: str | None = None
    risk_profile: str | None = None


class AddHoldingRequest(BaseModel):
    """Add holding request body."""

    security_id: str
    quantity: str
    cost_basis: str
    acquisition_date: str


class RecordTransactionRequest(BaseModel):
    """Record transaction request body."""

    security_id: str
    transaction_type: str
    transaction_date: str
    quantity: str
    price: str
    settlement_date: str | None = None
    commission: str = "0"
    fees: str = "0"
    notes: str | None = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def get_portfolio_service(current_user: CurrentUser) -> PortfolioService:
    """Create PortfolioService with user context."""
    return PortfolioService(
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
# PORTFOLIO ENDPOINTS
# =============================================================================


async def list_portfolios(
    current_user: CurrentUser,
    portfolio_type: str | None = None,
    active_only: bool = True,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """
    List user's portfolios.

    Args:
        current_user: Authenticated user
        portfolio_type: Filter by type
        active_only: Only return active portfolios
        limit: Maximum results
        offset: Skip results

    Returns:
        List of portfolios
    """
    service = get_portfolio_service(current_user)
    try:
        portfolios = await service.list_portfolios(
            portfolio_type=portfolio_type,
            active_only=active_only,
            limit=limit,
        )
        return {
            "success": True,
            "data": portfolios,
            "meta": {"limit": limit, "offset": offset, "count": len(portfolios)},
        }
    except Exception as e:
        return format_error(e)


async def create_portfolio(
    current_user: CurrentUser,
    data: CreatePortfolioRequest,
) -> dict[str, Any]:
    """
    Create a new portfolio.

    Args:
        current_user: Authenticated user
        data: Portfolio creation data

    Returns:
        Created portfolio
    """
    service = get_portfolio_service(current_user)
    try:
        portfolio = await service.create_portfolio(
            name=data.name,
            code=data.code,
            inception_date=data.inception_date,
            description=data.description,
            portfolio_type=data.portfolio_type,
            strategy=data.strategy,
            risk_profile=data.risk_profile,
            base_currency=data.base_currency,
            manager_id=data.manager_id or current_user["user_id"],
        )
        return {"success": True, "data": portfolio}
    except Exception as e:
        return format_error(e)


async def get_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """
    Get portfolio by ID.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID

    Returns:
        Portfolio details
    """
    service = get_portfolio_service(current_user)
    try:
        portfolio = await service.get_portfolio(portfolio_id)
        return {"success": True, "data": portfolio}
    except Exception as e:
        return format_error(e)


async def update_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
    data: UpdatePortfolioRequest,
) -> dict[str, Any]:
    """
    Update portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        data: Update data

    Returns:
        Updated portfolio
    """
    service = get_portfolio_service(current_user)
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        portfolio = await service.update_portfolio(portfolio_id, updates)
        return {"success": True, "data": portfolio}
    except Exception as e:
        return format_error(e)


async def delete_portfolio(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """
    Delete portfolio (soft delete).

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID

    Returns:
        Success confirmation
    """
    service = get_portfolio_service(current_user)
    try:
        result = await service.delete_portfolio(portfolio_id)
        return {"success": True, "data": {"deleted": result}}
    except Exception as e:
        return format_error(e)


async def get_holdings(
    current_user: CurrentUser,
    portfolio_id: str,
    include_closed: bool = False,
) -> dict[str, Any]:
    """
    Get portfolio holdings.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        include_closed: Include closed positions

    Returns:
        List of holdings
    """
    service = get_portfolio_service(current_user)
    try:
        holdings = await service.get_holdings(
            portfolio_id=portfolio_id,
            include_closed=include_closed,
        )
        return {"success": True, "data": holdings}
    except Exception as e:
        return format_error(e)


async def add_holding(
    current_user: CurrentUser,
    portfolio_id: str,
    data: AddHoldingRequest,
) -> dict[str, Any]:
    """
    Add or update holding in portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        data: Holding data

    Returns:
        Created/updated holding
    """
    service = get_portfolio_service(current_user)
    try:
        holding = await service.add_holding(
            portfolio_id=portfolio_id,
            security_id=data.security_id,
            quantity=data.quantity,
            cost_basis=data.cost_basis,
            acquisition_date=data.acquisition_date,
        )
        return {"success": True, "data": holding}
    except Exception as e:
        return format_error(e)


async def record_transaction(
    current_user: CurrentUser,
    portfolio_id: str,
    data: RecordTransactionRequest,
) -> dict[str, Any]:
    """
    Record a transaction.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        data: Transaction data

    Returns:
        Created transaction
    """
    service = get_portfolio_service(current_user)
    try:
        transaction = await service.record_transaction(
            portfolio_id=portfolio_id,
            security_id=data.security_id,
            transaction_type=data.transaction_type,
            transaction_date=data.transaction_date,
            quantity=data.quantity,
            price=data.price,
            settlement_date=data.settlement_date,
            commission=data.commission,
            fees=data.fees,
            notes=data.notes,
        )
        return {"success": True, "data": transaction}
    except Exception as e:
        return format_error(e)


async def get_transactions(
    current_user: CurrentUser,
    portfolio_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
    transaction_type: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """
    Get portfolio transactions.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        start_date: Filter start date
        end_date: Filter end date
        transaction_type: Filter by type
        limit: Maximum results

    Returns:
        List of transactions
    """
    service = get_portfolio_service(current_user)
    try:
        transactions = await service.get_transactions(
            portfolio_id=portfolio_id,
            start_date=start_date,
            end_date=end_date,
            transaction_type=transaction_type,
            limit=limit,
        )
        return {"success": True, "data": transactions}
    except Exception as e:
        return format_error(e)


async def get_valuations(
    current_user: CurrentUser,
    portfolio_id: str,
    start_date: str | None = None,
    limit: int = 30,
) -> dict[str, Any]:
    """
    Get NAV history for portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        start_date: Filter start date
        limit: Maximum results

    Returns:
        List of NAV values
    """
    service = get_portfolio_service(current_user)
    try:
        history = await service.get_nav_history(
            portfolio_id=portfolio_id,
            start_date=start_date,
            limit=limit,
        )
        return {"success": True, "data": history}
    except Exception as e:
        return format_error(e)


async def calculate_nav(
    current_user: CurrentUser,
    portfolio_id: str,
    valuation_date: str | None = None,
) -> dict[str, Any]:
    """
    Calculate and store NAV for portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        valuation_date: Date for valuation (defaults to today)

    Returns:
        NAV calculation result
    """
    service = get_portfolio_service(current_user)
    try:
        nav = await service.calculate_nav(
            portfolio_id=portfolio_id,
            valuation_date=valuation_date,
        )
        return {"success": True, "data": nav}
    except Exception as e:
        return format_error(e)


async def get_health_scan(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """
    Run health scan on portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID

    Returns:
        Health scan results
    """
    service = get_portfolio_service(current_user)
    try:
        health = await service.run_health_scan(portfolio_id)
        return {"success": True, "data": health}
    except Exception as e:
        return format_error(e)


async def get_sector_allocation(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """
    Get sector allocation for portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID

    Returns:
        Sector allocation breakdown
    """
    service = get_portfolio_service(current_user)
    try:
        allocation = await service.get_sector_allocation(portfolio_id)
        return {"success": True, "data": allocation}
    except Exception as e:
        return format_error(e)


async def get_asset_allocation(
    current_user: CurrentUser,
    portfolio_id: str,
) -> dict[str, Any]:
    """
    Get asset class allocation for portfolio.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID

    Returns:
        Asset class allocation breakdown
    """
    service = get_portfolio_service(current_user)
    try:
        allocation = await service.get_asset_allocation(portfolio_id)
        return {"success": True, "data": allocation}
    except Exception as e:
        return format_error(e)


async def get_top_holdings(
    current_user: CurrentUser,
    portfolio_id: str,
    limit: int = 10,
) -> dict[str, Any]:
    """
    Get top holdings by value.

    Args:
        current_user: Authenticated user
        portfolio_id: Portfolio ID
        limit: Number of holdings to return

    Returns:
        Top holdings list
    """
    service = get_portfolio_service(current_user)
    try:
        top = await service.get_top_holdings(portfolio_id, limit=limit)
        return {"success": True, "data": top}
    except Exception as e:
        return format_error(e)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "CreatePortfolioRequest",
    "UpdatePortfolioRequest",
    "AddHoldingRequest",
    "RecordTransactionRequest",
    "list_portfolios",
    "create_portfolio",
    "get_portfolio",
    "update_portfolio",
    "delete_portfolio",
    "get_holdings",
    "add_holding",
    "record_transaction",
    "get_transactions",
    "get_valuations",
    "calculate_nav",
    "get_health_scan",
    "get_sector_allocation",
    "get_asset_allocation",
    "get_top_holdings",
]
