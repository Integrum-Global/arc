# ARC API Layer: Endpoint Specifications

## Overview

This document defines ALL REST API endpoints for the ARC investment management platform. Each endpoint includes complete request/response schemas, authentication requirements, rate limits, and implementation code.

**Base URL**: `https://api.arc-invest.com/api/v1`

**Authentication**: All endpoints except `/auth/*` require Bearer token authentication.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Portfolio Management](#2-portfolio-management)
3. [Holdings & Transactions](#3-holdings--transactions)
4. [Analytics & Ratios](#4-analytics--ratios)
5. [Intelligence & AI](#5-intelligence--ai)
6. [Integrations](#6-integrations)
7. [Users & Tenants](#7-users--tenants)
8. [WebSocket/SSE Real-Time](#8-websocketsse-real-time)
9. [Admin & System](#9-admin--system)

---

## 1. Authentication & Authorization

### 1.1 Login

**POST** `/auth/login`

**Description**: Authenticate user and obtain access token.

**Rate Limit**: 20/min

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "string",
  "mfa_code": "123456"  // Optional, if MFA enabled
}
```

**Response** `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user-001",
    "email": "user@example.com",
    "name": "John Smith",
    "role": "investment_manager",
    "tenant_id": "tenant-001"
  }
}
```

**Response** `401 Unauthorized`:
```json
{
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

**Implementation**:
```python
# src/arc/api/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
from datetime import datetime, timedelta, timezone

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email and password.

    Returns JWT access token and refresh token.
    """
    from arc.services import ServiceRegistry
    from arc.models import db
    from arc.config import settings

    services = ServiceRegistry(db)

    # Get user by email
    user = await services.user.get_user_by_email(request.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(request.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check MFA if enabled
    if user.get("mfa_enabled"):
        if not request.mfa_code:
            raise HTTPException(status_code=401, detail="MFA code required")
        if not verify_mfa(user["id"], request.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    # Generate tokens
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=user.get("tenant_id"),
        role=user.get("role"),
        permissions=get_role_permissions(user.get("role")),
    )

    refresh_token = create_refresh_token(user["id"])

    # Update last login
    await services.user.update_user(user["id"], {
        "last_login_at": datetime.now(timezone.utc).isoformat()
    })

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiration_minutes * 60,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role"),
            "tenant_id": user.get("tenant_id"),
        }
    )


def create_access_token(user_id: str, tenant_id: str, role: str, permissions: list) -> str:
    """Create JWT access token."""
    from arc.config import settings

    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "permissions": permissions,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes),
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """Create refresh token."""
    from arc.config import settings

    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_expiration_days),
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
```

---

### 1.2 Refresh Token

**POST** `/auth/refresh`

**Description**: Refresh access token using refresh token.

**Rate Limit**: 20/min

**Request Body**:
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response** `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "bmV3IHJlZnJlc2ggdG9rZW4...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Implementation**:
```python
class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    """Refresh access token."""
    from arc.config import settings

    try:
        payload = jwt.decode(
            request.refresh_token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload["sub"]

        # Get current user data
        from arc.services import ServiceRegistry
        from arc.models import db

        services = ServiceRegistry(db)
        user = await services.user.get_user(user_id)

        if not user or not user.get("active"):
            raise HTTPException(status_code=401, detail="User not found or inactive")

        # Generate new tokens
        access_token = create_access_token(
            user_id=user["id"],
            tenant_id=user.get("tenant_id"),
            role=user.get("role"),
            permissions=get_role_permissions(user.get("role")),
        )

        new_refresh_token = create_refresh_token(user["id"])

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expiration_minutes * 60,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

---

### 1.3 OAuth2 Callback

**GET** `/auth/oauth/callback`

**Description**: Handle OAuth2 provider callback.

**Query Parameters**:
- `code`: Authorization code from provider
- `state`: State parameter for CSRF protection

**Response**: Redirects to frontend with tokens

---

### 1.4 Get Current User

**GET** `/auth/me`

**Description**: Get current authenticated user profile.

**Authorization**: Required

**Response** `200 OK`:
```json
{
  "id": "user-001",
  "email": "user@example.com",
  "name": "John Smith",
  "role": "investment_manager",
  "tenant_id": "tenant-001",
  "tenant": {
    "id": "tenant-001",
    "name": "Smith Family Office",
    "plan": "enterprise"
  },
  "permissions": ["portfolios:read", "portfolios:write", ...],
  "preferences": {
    "timezone": "America/New_York",
    "locale": "en-US",
    "number_format": "us",
    "date_format": "MM/DD/YYYY"
  },
  "last_login_at": "2026-01-07T10:30:00Z"
}
```

**Implementation**:
```python
@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user profile."""
    user_id = request.state.user_id
    services = request.state.services

    user = await services.user.get_user(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tenant info
    tenant = await services.user.get_tenant(user.get("tenant_id"))

    # Get preferences
    preferences = await services.user.get_preferences(user_id)

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role"),
        "tenant_id": user.get("tenant_id"),
        "tenant": {
            "id": tenant["id"],
            "name": tenant["name"],
            "plan": tenant.get("plan"),
        } if tenant else None,
        "permissions": request.state.permissions,
        "preferences": preferences,
        "last_login_at": user.get("last_login_at"),
    }
```

---

## 2. Portfolio Management

### 2.1 List Portfolios

**GET** `/portfolios`

**Description**: List all portfolios for the authenticated user's tenant.

**Authorization**: `portfolios:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by portfolio_type (managed, model, benchmark) |
| `manager_id` | string | - | Filter by portfolio manager |
| `active` | boolean | true | Filter by active status |
| `limit` | integer | 50 | Max results (1-100) |
| `offset` | integer | 0 | Pagination offset |
| `sort` | string | -created_at | Sort field (prefix - for desc) |

**Response** `200 OK`:
```json
{
  "portfolios": [
    {
      "id": "port-001",
      "name": "Growth Equity Portfolio",
      "code": "GEP",
      "portfolio_type": "managed",
      "base_currency": "USD",
      "inception_date": "2020-01-15",
      "manager_id": "user-001",
      "manager": {
        "id": "user-001",
        "name": "John Smith"
      },
      "benchmark_id": "SPX",
      "risk_profile": "aggressive",
      "active": true,
      "summary": {
        "total_value": 15000000.00,
        "daily_return": 0.0125,
        "ytd_return": 0.0842,
        "holdings_count": 35
      },
      "created_at": "2020-01-15T00:00:00Z",
      "updated_at": "2026-01-07T10:00:00Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

**Implementation**:
```python
# src/arc/api/routes/portfolios.py
from fastapi import APIRouter, Request, Query, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
from arc.api.middleware.auth import require_permission

router = APIRouter()


class PortfolioSummary(BaseModel):
    total_value: Optional[float] = None
    daily_return: Optional[float] = None
    ytd_return: Optional[float] = None
    holdings_count: int = 0


class PortfolioResponse(BaseModel):
    id: str
    name: str
    code: str
    portfolio_type: str
    base_currency: str
    inception_date: str
    manager_id: str
    manager: Optional[dict] = None
    benchmark_id: Optional[str] = None
    risk_profile: str
    active: bool
    summary: Optional[PortfolioSummary] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PortfolioListResponse(BaseModel):
    portfolios: List[PortfolioResponse]
    total: int
    limit: int
    offset: int


@router.get("", response_model=PortfolioListResponse)
async def list_portfolios(
    request: Request,
    type: Optional[str] = Query(None, description="Portfolio type filter"),
    manager_id: Optional[str] = Query(None, description="Manager ID filter"),
    active: bool = Query(True, description="Active status filter"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    sort: str = Query("-created_at", description="Sort field"),
    _: None = Depends(require_permission("portfolios:read"))
):
    """
    List portfolios with filtering and pagination.

    Returns portfolio summaries including current valuation and performance.
    """
    services = request.state.services

    # Get portfolios
    portfolios = await services.portfolio.list_portfolios(
        manager_id=manager_id,
        portfolio_type=type,
        active_only=active,
        limit=limit,
        offset=offset
    )

    # Get total count
    total = await services.db.express.count("Portfolio", filter={
        "deleted_at": {"$null": True},
        "active": active
    })

    # Enrich with summaries
    enriched = []
    for portfolio in portfolios:
        # Get latest valuation
        valuations = await services.db.express.list(
            "PortfolioValuation",
            filter={"portfolio_id": portfolio["id"]},
            order_by=[("-valuation_date", "desc")],
            limit=1
        )

        valuation = valuations[0] if valuations else {}

        # Get holdings count
        holdings_count = await services.db.express.count(
            "Holding",
            filter={"portfolio_id": portfolio["id"], "active": True}
        )

        # Get manager info
        manager = await services.db.express.read("User", portfolio.get("manager_id"))

        enriched.append({
            **portfolio,
            "manager": {
                "id": manager["id"],
                "name": manager["name"]
            } if manager else None,
            "summary": {
                "total_value": float(valuation.get("total_value", 0)),
                "daily_return": float(valuation.get("daily_return", 0)) if valuation.get("daily_return") else None,
                "ytd_return": float(valuation.get("ytd_return", 0)) if valuation.get("ytd_return") else None,
                "holdings_count": holdings_count
            }
        })

    return PortfolioListResponse(
        portfolios=enriched,
        total=total,
        limit=limit,
        offset=offset
    )
```

---

### 2.2 Create Portfolio

**POST** `/portfolios`

**Description**: Create a new portfolio.

**Authorization**: `portfolios:write`

**Request Body**:
```json
{
  "name": "Growth Equity Portfolio",
  "code": "GEP",
  "portfolio_type": "managed",
  "base_currency": "USD",
  "inception_date": "2026-01-15",
  "manager_id": "user-001",
  "benchmark_id": "SPX",
  "risk_profile": "aggressive",
  "investment_objective": "Long-term capital appreciation",
  "constraints": {
    "sector_limits": {
      "Technology": 0.40,
      "Healthcare": 0.25
    },
    "single_name_limit": 0.10,
    "min_positions": 15,
    "max_positions": 50,
    "cash_minimum": 0.02
  }
}
```

**Response** `201 Created`:
```json
{
  "id": "port-gep-20260115120000",
  "name": "Growth Equity Portfolio",
  "code": "GEP",
  "portfolio_type": "managed",
  "base_currency": "USD",
  "inception_date": "2026-01-15",
  "manager_id": "user-001",
  "benchmark_id": "SPX",
  "risk_profile": "aggressive",
  "active": true,
  "created_at": "2026-01-15T12:00:00Z"
}
```

**Response** `400 Bad Request`:
```json
{
  "error": "duplicate_code",
  "message": "Portfolio with code 'GEP' already exists"
}
```

**Implementation**:
```python
class CreatePortfolioRequest(BaseModel):
    name: str
    code: str
    portfolio_type: str = "managed"
    base_currency: str = "USD"
    inception_date: Optional[str] = None
    manager_id: Optional[str] = None
    benchmark_id: Optional[str] = None
    risk_profile: str = "moderate"
    investment_objective: Optional[str] = None
    constraints: Optional[dict] = None


@router.post("", status_code=201)
async def create_portfolio(
    request: Request,
    body: CreatePortfolioRequest,
    _: None = Depends(require_permission("portfolios:write"))
):
    """
    Create a new portfolio.

    The code must be unique within the tenant.
    """
    services = request.state.services
    user_id = request.state.user_id

    try:
        portfolio = await services.portfolio.create_portfolio(
            name=body.name,
            code=body.code,
            manager_id=body.manager_id or user_id,
            portfolio_type=body.portfolio_type,
            base_currency=body.base_currency,
            inception_date=body.inception_date,
            benchmark_id=body.benchmark_id,
            risk_profile=body.risk_profile,
            constraints=body.constraints
        )

        return portfolio

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

### 2.3 Get Portfolio

**GET** `/portfolios/{portfolio_id}`

**Description**: Get detailed portfolio information.

**Authorization**: `portfolios:read`

**Path Parameters**:
- `portfolio_id`: Portfolio ID

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_holdings` | boolean | false | Include holdings in response |
| `include_valuation` | boolean | true | Include current valuation |
| `include_performance` | boolean | false | Include performance metrics |

**Response** `200 OK`:
```json
{
  "id": "port-001",
  "name": "Growth Equity Portfolio",
  "code": "GEP",
  "portfolio_type": "managed",
  "description": "Focused on high-growth technology stocks",
  "strategy": "growth",
  "asset_class_focus": "equity",
  "base_currency": "USD",
  "inception_date": "2020-01-15",
  "manager_id": "user-001",
  "manager": {
    "id": "user-001",
    "name": "John Smith",
    "email": "john@example.com"
  },
  "benchmark_id": "SPX",
  "benchmark": {
    "id": "SPX",
    "name": "S&P 500",
    "return_ytd": 0.12
  },
  "risk_profile": "aggressive",
  "investment_objective": "Long-term capital appreciation",
  "constraints": {
    "sector_limits": {"Technology": 0.40},
    "single_name_limit": 0.10,
    "min_positions": 15,
    "max_positions": 50,
    "cash_minimum": 0.02
  },
  "active": true,
  "valuation": {
    "valuation_date": "2026-01-07",
    "total_value": 15000000.00,
    "securities_value": 14700000.00,
    "cash_value": 300000.00,
    "daily_return": 0.0125,
    "mtd_return": 0.0312,
    "ytd_return": 0.0842,
    "inception_return": 0.65
  },
  "allocation": {
    "by_sector": [
      {"sector": "Technology", "value": 6000000, "weight": 0.40},
      {"sector": "Healthcare", "value": 3000000, "weight": 0.20}
    ],
    "by_asset_class": [
      {"asset_class": "Equity", "value": 14700000, "weight": 0.98},
      {"asset_class": "Cash", "value": 300000, "weight": 0.02}
    ]
  },
  "created_at": "2020-01-15T00:00:00Z",
  "updated_at": "2026-01-07T10:00:00Z"
}
```

**Implementation**:
```python
@router.get("/{portfolio_id}")
async def get_portfolio(
    request: Request,
    portfolio_id: str,
    include_holdings: bool = Query(False),
    include_valuation: bool = Query(True),
    include_performance: bool = Query(False),
    _: None = Depends(require_permission("portfolios:read"))
):
    """Get portfolio details with optional related data."""
    services = request.state.services

    portfolio = await services.portfolio.get_portfolio(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    result = dict(portfolio)

    # Get manager info
    if portfolio.get("manager_id"):
        manager = await services.db.express.read("User", portfolio["manager_id"])
        if manager:
            result["manager"] = {
                "id": manager["id"],
                "name": manager["name"],
                "email": manager.get("email")
            }

    # Get benchmark info
    if portfolio.get("benchmark_id"):
        benchmark = await services.db.express.read("Benchmark", portfolio["benchmark_id"])
        if benchmark:
            result["benchmark"] = benchmark

    # Include valuation
    if include_valuation:
        nav = await services.portfolio.calculate_nav(portfolio_id)
        result["valuation"] = nav

        # Include allocation breakdown
        sector_allocation = await services.portfolio.get_sector_allocation(portfolio_id)
        asset_allocation = await services.portfolio.get_asset_allocation(portfolio_id)

        result["allocation"] = {
            "by_sector": sector_allocation,
            "by_asset_class": asset_allocation
        }

    # Include holdings
    if include_holdings:
        holdings = await services.portfolio.get_holdings(portfolio_id)
        result["holdings"] = holdings

    return result
```

---

### 2.4 Update Portfolio

**PATCH** `/portfolios/{portfolio_id}`

**Description**: Update portfolio properties.

**Authorization**: `portfolios:write`

**Request Body** (partial update):
```json
{
  "name": "Updated Portfolio Name",
  "risk_profile": "moderate",
  "constraints": {
    "single_name_limit": 0.15
  }
}
```

**Response** `200 OK`: Updated portfolio object

**Implementation**:
```python
class UpdatePortfolioRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    strategy: Optional[str] = None
    risk_profile: Optional[str] = None
    investment_objective: Optional[str] = None
    constraints: Optional[dict] = None
    benchmark_id: Optional[str] = None
    active: Optional[bool] = None


@router.patch("/{portfolio_id}")
async def update_portfolio(
    request: Request,
    portfolio_id: str,
    body: UpdatePortfolioRequest,
    _: None = Depends(require_permission("portfolios:write"))
):
    """Update portfolio properties."""
    services = request.state.services

    # Verify portfolio exists
    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Build update dict (exclude None values)
    updates = {k: v for k, v in body.dict().items() if v is not None}

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await services.portfolio.update_portfolio(portfolio_id, updates)

    return updated
```

---

### 2.5 Delete Portfolio

**DELETE** `/portfolios/{portfolio_id}`

**Description**: Soft delete a portfolio.

**Authorization**: `portfolios:delete`

**Response** `204 No Content`

**Implementation**:
```python
@router.delete("/{portfolio_id}", status_code=204)
async def delete_portfolio(
    request: Request,
    portfolio_id: str,
    _: None = Depends(require_permission("portfolios:delete"))
):
    """Soft delete a portfolio."""
    services = request.state.services

    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    await services.portfolio.delete_portfolio(portfolio_id)

    return None
```

---

### 2.6 Portfolio Health Scan

**POST** `/portfolios/{portfolio_id}/health-scan`

**Description**: Run comprehensive health scan on portfolio.

**Authorization**: `analytics:read`

**Request Body** (optional):
```json
{
  "include_ai_explanation": true,
  "ratio_classes": ["liquidity", "leverage"]
}
```

**Response** `200 OK`:
```json
{
  "portfolio_id": "port-001",
  "scan_date": "2026-01-07T12:00:00Z",
  "overall_score": 78,
  "grade": "B+",
  "ratio_class_scores": {
    "liquidity": {
      "score": 85,
      "grade": "A-",
      "issues_count": 2
    },
    "profitability": {
      "score": 72,
      "grade": "B",
      "issues_count": 5
    },
    "leverage": {
      "score": 65,
      "grade": "C+",
      "issues_count": 4
    },
    "utilization": {
      "score": 88,
      "grade": "A",
      "issues_count": 1
    },
    "valuation": {
      "score": 80,
      "grade": "B+",
      "issues_count": 3
    }
  },
  "issues": [
    {
      "security_id": "AAPL",
      "security_name": "Apple Inc.",
      "ratio_name": "debt_equity",
      "ratio_class": "leverage",
      "severity": "warning",
      "current_value": 1.25,
      "threshold_value": 1.0,
      "message": "Debt/Equity ratio of 1.25 exceeds warning threshold of 1.0",
      "ai_explanation": "Apple's debt levels have increased due to recent bond issuances for share buybacks. While leverage is elevated, the company maintains strong cash flows and interest coverage, suggesting manageable risk."
    }
  ],
  "issues_summary": {
    "critical": 0,
    "warning": 15,
    "total": 15
  },
  "recommendations": [
    "Consider reducing exposure to highly leveraged positions",
    "3 holdings have declining profitability trends - review fundamentals"
  ]
}
```

**Implementation**:
```python
class HealthScanRequest(BaseModel):
    include_ai_explanation: bool = True
    ratio_classes: Optional[List[str]] = None


@router.post("/{portfolio_id}/health-scan")
async def run_health_scan(
    request: Request,
    portfolio_id: str,
    body: Optional[HealthScanRequest] = None,
    _: None = Depends(require_permission("analytics:read"))
):
    """Run portfolio health scan."""
    services = request.state.services
    body = body or HealthScanRequest()

    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Run health scan
    result = await services.portfolio.run_health_scan(portfolio_id)

    # Add AI explanations if requested
    if body.include_ai_explanation:
        for issue in result.get("issues", []):
            explanation = await services.intelligence.explain_ratio_issue(
                security_id=issue["security_id"],
                ratio_name=issue["ratio_name"],
                current_value=issue["current_value"]
            )
            issue["ai_explanation"] = explanation

    return result
```

---

## 3. Holdings & Transactions

### 3.1 List Holdings

**GET** `/portfolios/{portfolio_id}/holdings`

**Description**: Get all holdings in a portfolio.

**Authorization**: `holdings:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_closed` | boolean | false | Include zero-quantity positions |
| `sort` | string | -market_value | Sort field |

**Response** `200 OK`:
```json
{
  "holdings": [
    {
      "id": "hold-001",
      "portfolio_id": "port-001",
      "security_id": "AAPL",
      "security": {
        "id": "AAPL",
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "exchange": "NASDAQ"
      },
      "quantity": 1000,
      "cost_basis": 150.25,
      "total_cost": 150250.00,
      "acquisition_date": "2024-03-15",
      "holding_period": "long",
      "current_price": 185.50,
      "market_value": 185500.00,
      "unrealized_pnl": 35250.00,
      "unrealized_pnl_pct": 0.2346,
      "weight": 0.0124,
      "tags": ["high_conviction", "esg"]
    }
  ],
  "summary": {
    "total_holdings": 35,
    "total_market_value": 14700000.00,
    "total_cost_basis": 12500000.00,
    "total_unrealized_pnl": 2200000.00,
    "total_unrealized_pnl_pct": 0.176
  }
}
```

**Implementation**:
```python
# src/arc/api/routes/holdings.py
from fastapi import APIRouter, Request, Query, HTTPException, Depends
from typing import Optional, List
from arc.api.middleware.auth import require_permission

router = APIRouter()


@router.get("/{portfolio_id}/holdings")
async def list_holdings(
    request: Request,
    portfolio_id: str,
    include_closed: bool = Query(False),
    sort: str = Query("-market_value"),
    _: None = Depends(require_permission("holdings:read"))
):
    """Get all holdings in a portfolio."""
    services = request.state.services

    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holdings = await services.portfolio.get_holdings(
        portfolio_id=portfolio_id,
        include_closed=include_closed
    )

    # Calculate summary
    total_market_value = sum(float(h.get("market_value", 0) or 0) for h in holdings)
    total_cost_basis = sum(float(h.get("total_cost", 0) or 0) for h in holdings)
    total_unrealized_pnl = total_market_value - total_cost_basis

    return {
        "holdings": holdings,
        "summary": {
            "total_holdings": len(holdings),
            "total_market_value": total_market_value,
            "total_cost_basis": total_cost_basis,
            "total_unrealized_pnl": total_unrealized_pnl,
            "total_unrealized_pnl_pct": total_unrealized_pnl / total_cost_basis if total_cost_basis > 0 else 0
        }
    }
```

---

### 3.2 Record Transaction

**POST** `/portfolios/{portfolio_id}/transactions`

**Description**: Record a new transaction.

**Authorization**: `transactions:write`

**Request Body**:
```json
{
  "security_id": "AAPL",
  "transaction_type": "buy",
  "quantity": 100,
  "price": 185.50,
  "trade_date": "2026-01-07",
  "settlement_date": "2026-01-09",
  "commission": 9.99,
  "fees": 0,
  "currency": "USD",
  "notes": "Adding to position on market pullback"
}
```

**Response** `201 Created`:
```json
{
  "id": "txn-20260107120000123456",
  "portfolio_id": "port-001",
  "security_id": "AAPL",
  "transaction_type": "buy",
  "quantity": 100,
  "price": 185.50,
  "gross_amount": 18550.00,
  "net_amount": 18559.99,
  "commission": 9.99,
  "fees": 0,
  "currency": "USD",
  "trade_date": "2026-01-07",
  "settlement_date": "2026-01-09",
  "compliance_status": "approved",
  "created_at": "2026-01-07T12:00:00Z"
}
```

**Implementation**:
```python
from decimal import Decimal
from pydantic import BaseModel, Field


class CreateTransactionRequest(BaseModel):
    security_id: str
    transaction_type: str = Field(..., regex="^(buy|sell|dividend|split|transfer_in|transfer_out)$")
    quantity: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    trade_date: str
    settlement_date: Optional[str] = None
    commission: float = 0
    fees: float = 0
    currency: str = "USD"
    notes: Optional[str] = None


@router.post("/{portfolio_id}/transactions", status_code=201)
async def create_transaction(
    request: Request,
    portfolio_id: str,
    body: CreateTransactionRequest,
    _: None = Depends(require_permission("transactions:write"))
):
    """Record a new transaction."""
    services = request.state.services

    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Verify security exists
    security = await services.db.express.read("Security", body.security_id)
    if not security:
        raise HTTPException(status_code=400, detail=f"Security {body.security_id} not found")

    # Record transaction
    transaction = await services.portfolio.record_transaction(
        portfolio_id=portfolio_id,
        security_id=body.security_id,
        transaction_type=body.transaction_type,
        quantity=Decimal(str(body.quantity)),
        price=Decimal(str(body.price)),
        trade_date=body.trade_date,
        settlement_date=body.settlement_date,
        fees=Decimal(str(body.commission + body.fees)),
        notes=body.notes
    )

    return transaction
```

---

### 3.3 List Transactions

**GET** `/portfolios/{portfolio_id}/transactions`

**Description**: Get transaction history for a portfolio.

**Authorization**: `transactions:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security_id` | string | - | Filter by security |
| `type` | string | - | Filter by transaction type |
| `start_date` | string | - | Filter by trade date (YYYY-MM-DD) |
| `end_date` | string | - | Filter by trade date (YYYY-MM-DD) |
| `limit` | integer | 100 | Max results |
| `offset` | integer | 0 | Pagination offset |

**Response** `200 OK`:
```json
{
  "transactions": [
    {
      "id": "txn-001",
      "portfolio_id": "port-001",
      "security_id": "AAPL",
      "security": {
        "ticker": "AAPL",
        "name": "Apple Inc."
      },
      "transaction_type": "buy",
      "transaction_date": "2026-01-07",
      "settlement_date": "2026-01-09",
      "quantity": 100,
      "price": 185.50,
      "gross_amount": 18550.00,
      "net_amount": 18559.99,
      "commission": 9.99,
      "currency": "USD",
      "compliance_status": "approved",
      "created_at": "2026-01-07T12:00:00Z"
    }
  ],
  "total": 250,
  "limit": 100,
  "offset": 0
}
```

---

## 4. Analytics & Ratios

### 4.1 Get Security Ratios

**GET** `/analytics/securities/{security_id}/ratios`

**Description**: Get all financial ratios for a security.

**Authorization**: `analytics:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `as_of_date` | string | today | Point-in-time ratios (YYYY-MM-DD) |
| `include_history` | boolean | false | Include historical values |

**Response** `200 OK`:
```json
{
  "security_id": "AAPL",
  "security": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology"
  },
  "calculation_date": "2026-01-07",
  "ratios": {
    "liquidity": {
      "current_ratio": {
        "value": 1.04,
        "peer_percentile": 45,
        "trend": "stable",
        "history": [
          {"date": "2025-10-01", "value": 1.02},
          {"date": "2025-07-01", "value": 1.06}
        ]
      },
      "quick_ratio": {
        "value": 0.92,
        "peer_percentile": 52,
        "trend": "improving"
      },
      "cash_ratio": {
        "value": 0.35,
        "peer_percentile": 65,
        "trend": "stable"
      }
    },
    "profitability": {
      "roe": {
        "value": 0.145,
        "peer_percentile": 85,
        "trend": "stable"
      },
      "roa": {
        "value": 0.287,
        "peer_percentile": 92,
        "trend": "improving"
      },
      "gross_margin": {
        "value": 0.435,
        "peer_percentile": 78,
        "trend": "stable"
      },
      "operating_margin": {
        "value": 0.298,
        "peer_percentile": 88,
        "trend": "stable"
      },
      "net_margin": {
        "value": 0.251,
        "peer_percentile": 90,
        "trend": "stable"
      }
    },
    "leverage": {
      "debt_equity": {
        "value": 1.81,
        "peer_percentile": 25,
        "trend": "declining"
      },
      "debt_ebitda": {
        "value": 1.24,
        "peer_percentile": 60,
        "trend": "stable"
      },
      "interest_coverage": {
        "value": 29.8,
        "peer_percentile": 95,
        "trend": "stable"
      }
    },
    "utilization": {
      "asset_turnover": {
        "value": 1.14,
        "peer_percentile": 72,
        "trend": "stable"
      },
      "inventory_turnover": {
        "value": 38.5,
        "peer_percentile": 88,
        "trend": "improving"
      }
    },
    "valuation": {
      "pe_ratio": {
        "value": 28.5,
        "peer_percentile": 55,
        "trend": "stable"
      },
      "pb_ratio": {
        "value": 42.3,
        "peer_percentile": 15,
        "trend": "declining"
      },
      "ev_ebitda": {
        "value": 21.2,
        "peer_percentile": 45,
        "trend": "stable"
      }
    }
  }
}
```

**Implementation**:
```python
# src/arc/api/routes/analytics.py
from fastapi import APIRouter, Request, Query, HTTPException, Depends
from typing import Optional
from arc.api.middleware.auth import require_permission

router = APIRouter()


@router.get("/securities/{security_id}/ratios")
async def get_security_ratios(
    request: Request,
    security_id: str,
    as_of_date: Optional[str] = Query(None, description="Point-in-time date"),
    include_history: bool = Query(False, description="Include historical values"),
    _: None = Depends(require_permission("analytics:read"))
):
    """Get all financial ratios for a security."""
    services = request.state.services

    # Get security
    security = await services.db.express.read("Security", security_id)
    if not security:
        raise HTTPException(status_code=404, detail="Security not found")

    # Get ratios
    ratios = await services.analytics.get_security_ratios(
        security_id=security_id,
        as_of_date=as_of_date
    )

    if not ratios:
        raise HTTPException(status_code=404, detail="No ratios available for this security")

    # Add history if requested
    if include_history:
        for ratio_class, class_ratios in ratios.items():
            if isinstance(class_ratios, dict):
                for ratio_name in class_ratios:
                    history = await services.analytics.get_ratio_history(
                        security_id=security_id,
                        ratio_name=ratio_name,
                        interval="quarterly"
                    )
                    if isinstance(class_ratios[ratio_name], dict):
                        class_ratios[ratio_name]["history"] = history[:4]  # Last 4 quarters

    return {
        "security_id": security_id,
        "security": {
            "ticker": security.get("ticker"),
            "name": security.get("name"),
            "sector": security.get("sector")
        },
        "calculation_date": ratios.get("calculation_date"),
        "ratios": {k: v for k, v in ratios.items() if k not in ["security_id", "calculation_date"]}
    }
```

---

### 4.2 Benchmark Against Peers

**POST** `/analytics/securities/{security_id}/benchmark`

**Description**: Compare a security against its peer group.

**Authorization**: `benchmarks:read`

**Request Body**:
```json
{
  "peer_group_id": "sector_technology_large",
  "ratios": ["pe_ratio", "roe", "debt_equity"]
}
```

**Response** `200 OK`:
```json
{
  "security_id": "AAPL",
  "security": {
    "ticker": "AAPL",
    "name": "Apple Inc."
  },
  "peer_group": {
    "id": "sector_technology_large",
    "name": "Large Cap Technology",
    "member_count": 45
  },
  "comparisons": [
    {
      "ratio_name": "pe_ratio",
      "ratio_class": "valuation",
      "security_value": 28.5,
      "peer_median": 32.1,
      "peer_mean": 35.4,
      "peer_min": 12.5,
      "peer_max": 125.0,
      "percentile": 42,
      "vs_median": -3.6,
      "vs_median_pct": -11.2,
      "interpretation": "Trading at a discount to peers"
    },
    {
      "ratio_name": "roe",
      "ratio_class": "profitability",
      "security_value": 0.145,
      "peer_median": 0.12,
      "peer_mean": 0.11,
      "peer_min": -0.05,
      "peer_max": 0.35,
      "percentile": 72,
      "vs_median": 0.025,
      "vs_median_pct": 20.8,
      "interpretation": "Above average profitability"
    }
  ],
  "overall_assessment": "AAPL shows strong profitability metrics relative to peers while trading at a slight discount on valuation multiples. Leverage is elevated but interest coverage remains robust."
}
```

---

### 4.3 Get Alerts

**GET** `/analytics/alerts`

**Description**: Get alerts for the current user.

**Authorization**: `alerts:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | active | Filter by status (active, acknowledged, resolved) |
| `severity` | string | - | Filter by severity (critical, warning) |
| `portfolio_id` | string | - | Filter by portfolio |
| `limit` | integer | 50 | Max results |

**Response** `200 OK`:
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "alert_type": "threshold",
      "severity": "warning",
      "title": "Debt/Equity Alert",
      "message": "AAPL debt/equity ratio of 1.81 exceeds warning threshold of 1.0",
      "security_id": "AAPL",
      "security": {
        "ticker": "AAPL",
        "name": "Apple Inc."
      },
      "portfolio_id": "port-001",
      "ratio_name": "debt_equity",
      "trigger_value": 1.81,
      "threshold_value": 1.0,
      "triggered_at": "2026-01-07T06:00:00Z",
      "status": "active",
      "suggested_actions": [
        "Review debt levels and cash position",
        "Check recent bond issuances",
        "Evaluate interest coverage ratio"
      ]
    }
  ],
  "summary": {
    "critical": 0,
    "warning": 5,
    "total_active": 5
  }
}
```

---

### 4.4 Acknowledge Alert

**POST** `/analytics/alerts/{alert_id}/acknowledge`

**Description**: Mark an alert as acknowledged.

**Authorization**: `alerts:acknowledge`

**Response** `200 OK`:
```json
{
  "id": "alert-001",
  "status": "acknowledged",
  "acknowledged_at": "2026-01-07T12:00:00Z",
  "acknowledged_by": "user-001"
}
```

---

### 4.5 Configure Alert Threshold

**POST** `/analytics/thresholds`

**Description**: Create or update alert threshold configuration.

**Authorization**: `alerts:write`

**Request Body**:
```json
{
  "ratio_name": "debt_equity",
  "warning_threshold": 1.0,
  "critical_threshold": 2.0,
  "comparison": "gt",
  "portfolio_id": null,
  "cooldown_hours": 24,
  "enabled": true
}
```

**Response** `201 Created`:
```json
{
  "id": "thresh-001",
  "user_id": "user-001",
  "ratio_name": "debt_equity",
  "ratio_class": "leverage",
  "warning_threshold": 1.0,
  "critical_threshold": 2.0,
  "comparison": "gt",
  "portfolio_id": null,
  "cooldown_hours": 24,
  "enabled": true,
  "created_at": "2026-01-07T12:00:00Z"
}
```

---

## 5. Intelligence & AI

### 5.1 Generate Market Brief

**POST** `/intelligence/brief`

**Description**: Generate AI-powered market intelligence brief.

**Authorization**: `briefs:generate`

**Rate Limit**: 50/min (AI-intensive)

**Request Body**:
```json
{
  "brief_type": "daily",
  "topics": ["technology", "earnings"],
  "portfolio_id": "port-001",
  "format": "standard"
}
```

**Response** `200 OK`:
```json
{
  "id": "brief-20260107120000",
  "type": "daily",
  "generated_at": "2026-01-07T12:00:00Z",
  "sections": [
    {
      "title": "Market Overview",
      "content": "US markets opened higher on Tuesday following strong manufacturing data...",
      "sentiment": "positive",
      "relevance_score": 0.95
    },
    {
      "title": "Technology Sector",
      "content": "The technology sector continues to lead, with semiconductor stocks reaching new highs...",
      "sentiment": "positive",
      "relevance_score": 0.92,
      "portfolio_impact": "High - 40% of your portfolio is in technology"
    },
    {
      "title": "Earnings Watch",
      "content": "5 of your holdings report earnings this week: AAPL (Wed), MSFT (Thu)...",
      "sentiment": "neutral",
      "relevance_score": 0.88
    }
  ],
  "key_takeaways": [
    "Market sentiment remains bullish with VIX at multi-month lows",
    "Your top holding AAPL reports Wednesday - consensus expects strong iPhone sales",
    "Consider reviewing healthcare exposure given proposed regulatory changes"
  ],
  "action_items": [
    {
      "priority": "high",
      "action": "Review AAPL position ahead of earnings",
      "reason": "Stock has run up 15% into earnings, consider trimming"
    }
  ],
  "sources": [
    {"title": "Reuters", "relevance": 0.95},
    {"title": "Bloomberg", "relevance": 0.92}
  ]
}
```

**Implementation**:
```python
# src/arc/api/routes/intelligence.py
from fastapi import APIRouter, Request, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel
from arc.api.middleware.auth import require_permission

router = APIRouter()


class MarketBriefRequest(BaseModel):
    brief_type: str = "daily"
    topics: Optional[List[str]] = None
    portfolio_id: Optional[str] = None
    format: str = "standard"


@router.post("/brief")
async def generate_market_brief(
    request: Request,
    body: MarketBriefRequest,
    _: None = Depends(require_permission("briefs:generate"))
):
    """Generate AI-powered market brief."""
    services = request.state.services
    user_id = request.state.user_id

    # Validate portfolio if provided
    if body.portfolio_id:
        portfolio = await services.portfolio.get_portfolio(body.portfolio_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")

    # Generate brief
    brief = await services.intelligence.generate_market_brief(
        brief_type=body.brief_type,
        topics=body.topics,
        portfolio_id=body.portfolio_id,
        format=body.format
    )

    return brief
```

---

### 5.2 Stream Market Brief

**GET** `/intelligence/brief/stream`

**Description**: Stream market brief generation in real-time.

**Authorization**: `briefs:generate`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | daily | Brief type |
| `portfolio_id` | string | - | Portfolio context |

**Response**: Server-Sent Events (SSE)

```
event: start
data: {"id": "brief-001", "status": "generating"}

event: section
data: {"title": "Market Overview", "content": "US markets..."}

event: section
data: {"title": "Technology Sector", "content": "The technology..."}

event: complete
data: {"id": "brief-001", "status": "complete"}
```

**Implementation**:
```python
@router.get("/brief/stream")
async def stream_market_brief(
    request: Request,
    type: str = Query("daily"),
    portfolio_id: Optional[str] = Query(None),
    _: None = Depends(require_permission("briefs:generate"))
):
    """Stream market brief generation."""
    services = request.state.services

    async def event_generator():
        yield f"event: start\ndata: {json.dumps({'status': 'generating'})}\n\n"

        async for chunk in services.intelligence.stream_market_brief(
            brief_type=type,
            topics=None
        ):
            yield f"event: section\ndata: {json.dumps(chunk)}\n\n"

        yield f"event: complete\ndata: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

---

### 5.3 Natural Language Query

**POST** `/intelligence/query`

**Description**: Ask natural language questions about portfolios.

**Authorization**: `queries:execute`

**Rate Limit**: 100/min

**Request Body**:
```json
{
  "question": "What's my exposure to technology sector?",
  "portfolio_id": "port-001",
  "include_sources": true
}
```

**Response** `200 OK`:
```json
{
  "query": "What's my exposure to technology sector?",
  "answer": "Your Growth Equity Portfolio has 40.2% exposure to the technology sector, representing $6.03M of your $15M portfolio. This is allocated across 12 holdings, with your largest positions being:\n\n1. **Apple (AAPL)** - $1.85M (12.3%)\n2. **Microsoft (MSFT)** - $1.20M (8.0%)\n3. **NVIDIA (NVDA)** - $0.95M (6.3%)\n\nYour technology allocation exceeds your constraint limit of 40%, which may warrant attention.",
  "confidence": 0.95,
  "data": {
    "sector": "Technology",
    "total_exposure": 6030000.00,
    "weight": 0.402,
    "holdings_count": 12,
    "top_holdings": [
      {"ticker": "AAPL", "name": "Apple Inc.", "value": 1850000, "weight": 0.123},
      {"ticker": "MSFT", "name": "Microsoft Corp.", "value": 1200000, "weight": 0.080},
      {"ticker": "NVDA", "name": "NVIDIA Corp.", "value": 950000, "weight": 0.063}
    ],
    "constraint_limit": 0.40,
    "exceeds_constraint": true
  },
  "sources": [
    "Portfolio holdings as of 2026-01-07",
    "GICS sector classification"
  ],
  "follow_up_questions": [
    "How has my tech exposure changed over the last year?",
    "Which tech holdings have the best performance?",
    "Should I rebalance to meet my sector constraints?"
  ]
}
```

**Implementation**:
```python
class QueryRequest(BaseModel):
    question: str
    portfolio_id: Optional[str] = None
    include_sources: bool = True


@router.post("/query")
async def query_portfolio(
    request: Request,
    body: QueryRequest,
    _: None = Depends(require_permission("queries:execute"))
):
    """Natural language portfolio query."""
    services = request.state.services
    user_id = request.state.user_id

    result = await services.intelligence.query_portfolio(
        user_id=user_id,
        query=body.question,
        portfolio_id=body.portfolio_id,
        include_sources=body.include_sources
    )

    return result
```

---

### 5.4 Analyze Security

**POST** `/intelligence/analyze/{security_id}`

**Description**: Perform AI-powered security analysis.

**Authorization**: `analytics:read`

**Rate Limit**: 50/min

**Request Body**:
```json
{
  "analysis_type": "comprehensive",
  "include_peer_comparison": true
}
```

**Response** `200 OK`:
```json
{
  "security_id": "AAPL",
  "security": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "market_cap": 3000000000000
  },
  "analysis_type": "comprehensive",
  "generated_at": "2026-01-07T12:00:00Z",
  "summary": "Apple Inc. demonstrates strong fundamental health with industry-leading profitability metrics. While leverage has increased due to capital return programs, interest coverage remains robust. Valuation is reasonable relative to growth and profitability.",
  "financial_health": {
    "score": 85,
    "grade": "A-",
    "trend": "stable",
    "components": {
      "liquidity": {"score": 75, "trend": "stable"},
      "profitability": {"score": 95, "trend": "stable"},
      "leverage": {"score": 70, "trend": "declining"},
      "efficiency": {"score": 90, "trend": "improving"}
    }
  },
  "key_metrics": {
    "revenue_growth_3y": 0.08,
    "earnings_growth_3y": 0.12,
    "fcf_yield": 0.035,
    "dividend_yield": 0.005
  },
  "strengths": [
    "Industry-leading profitability margins",
    "Strong brand and ecosystem lock-in",
    "Consistent free cash flow generation",
    "Services segment growing rapidly"
  ],
  "concerns": [
    "Elevated debt levels from share buybacks",
    "iPhone revenue growth slowing",
    "Concentration risk in China manufacturing",
    "Regulatory scrutiny on App Store practices"
  ],
  "peer_comparison": {
    "peer_group": "Large Cap Technology",
    "ranking": "4 of 45",
    "outperforming_metrics": ["ROE", "Operating Margin", "FCF Conversion"],
    "underperforming_metrics": ["Revenue Growth", "P/B Ratio"]
  },
  "recommendation": "HOLD - Strong fundamentals but limited near-term catalysts. Consider adding on pullbacks below $175.",
  "confidence": 0.82
}
```

---

### 5.5 Detect Anomalies

**POST** `/intelligence/anomalies`

**Description**: Detect anomalies in portfolio holdings.

**Authorization**: `analytics:read`

**Request Body**:
```json
{
  "portfolio_id": "port-001",
  "lookback_days": 90
}
```

**Response** `200 OK`:
```json
{
  "portfolio_id": "port-001",
  "scan_date": "2026-01-07T12:00:00Z",
  "anomalies": [
    {
      "security_id": "XYZ",
      "security": {
        "ticker": "XYZ",
        "name": "XYZ Corp"
      },
      "anomaly_type": "ratio_deviation",
      "severity": "high",
      "description": "Debt/EBITDA ratio increased from 2.1 to 4.5 in one quarter",
      "detected_at": "2026-01-07T06:00:00Z",
      "metrics": {
        "previous_value": 2.1,
        "current_value": 4.5,
        "change_pct": 114.3,
        "z_score": 3.2
      },
      "potential_causes": [
        "Large debt issuance in Q4",
        "EBITDA decline due to one-time charges"
      ],
      "recommended_actions": [
        "Review recent 10-Q filing",
        "Check for acquisition announcements",
        "Evaluate position sizing"
      ]
    }
  ],
  "summary": {
    "high_severity": 1,
    "medium_severity": 3,
    "low_severity": 5,
    "total": 9
  }
}
```

---

## 6. Integrations

### 6.1 List Data Providers

**GET** `/integrations/providers`

**Description**: Get configured data provider connections.

**Authorization**: `integrations:read`

**Response** `200 OK`:
```json
{
  "providers": [
    {
      "id": "conn-eodhd-001",
      "provider": "eodhd",
      "display_name": "EODHD Historical Data",
      "status": "connected",
      "capabilities": ["prices", "dividends", "splits"],
      "last_sync": {
        "at": "2026-01-07T06:00:00Z",
        "status": "success",
        "records": 15420
      },
      "sync_schedule": "daily"
    },
    {
      "id": "conn-capitaliq-001",
      "provider": "capital_iq",
      "display_name": "S&P Capital IQ",
      "status": "connected",
      "capabilities": ["fundamentals", "estimates", "ratings"],
      "last_sync": {
        "at": "2026-01-05T00:00:00Z",
        "status": "success",
        "records": 2850
      },
      "sync_schedule": "weekly"
    }
  ]
}
```

---

### 6.2 Configure Provider

**POST** `/integrations/providers`

**Description**: Configure a new data provider connection.

**Authorization**: `integrations:write`

**Request Body**:
```json
{
  "provider": "eodhd",
  "api_key": "your-api-key-here",
  "settings": {
    "sync_prices": true,
    "sync_fundamentals": true,
    "sync_schedule": "daily"
  }
}
```

**Response** `201 Created`:
```json
{
  "id": "conn-eodhd-001",
  "provider": "eodhd",
  "status": "connected",
  "validated_at": "2026-01-07T12:00:00Z"
}
```

---

### 6.3 Trigger Sync

**POST** `/integrations/sync`

**Description**: Trigger a data synchronization.

**Authorization**: `sync:trigger`

**Rate Limit**: 10/min

**Request Body**:
```json
{
  "provider": "eodhd",
  "job_type": "prices",
  "parameters": {
    "security_ids": ["AAPL", "MSFT", "GOOGL"],
    "start_date": "2026-01-01",
    "end_date": "2026-01-07"
  }
}
```

**Response** `202 Accepted`:
```json
{
  "job_id": "sync-eodhd-20260107120000",
  "status": "running",
  "started_at": "2026-01-07T12:00:00Z",
  "estimated_completion": "2026-01-07T12:05:00Z"
}
```

---

### 6.4 Get Sync Job Status

**GET** `/integrations/sync/{job_id}`

**Description**: Get status of a sync job.

**Authorization**: `integrations:read`

**Response** `200 OK`:
```json
{
  "job_id": "sync-eodhd-20260107120000",
  "provider": "eodhd",
  "job_type": "prices",
  "status": "completed",
  "started_at": "2026-01-07T12:00:00Z",
  "completed_at": "2026-01-07T12:03:45Z",
  "progress": {
    "total_records": 1500,
    "processed_records": 1500,
    "failed_records": 3,
    "progress_pct": 100
  },
  "results": {
    "records_created": 1200,
    "records_updated": 297,
    "records_skipped": 0
  },
  "errors": [
    {"security_id": "DELISTED", "error": "Security not found"}
  ]
}
```

---

## 7. Users & Tenants

### 7.1 List Users

**GET** `/users`

**Description**: List users in the tenant.

**Authorization**: `users:read`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `role` | string | - | Filter by role |
| `status` | string | active | Filter by status |
| `limit` | integer | 50 | Max results |

**Response** `200 OK`:
```json
{
  "users": [
    {
      "id": "user-001",
      "email": "john@example.com",
      "name": "John Smith",
      "role": "investment_manager",
      "status": "active",
      "last_login_at": "2026-01-07T10:30:00Z",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 5
}
```

---

### 7.2 Invite User

**POST** `/users/invite`

**Description**: Invite a new user to the tenant.

**Authorization**: `users:invite`

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "analyst"
}
```

**Response** `201 Created`:
```json
{
  "id": "user-002",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "analyst",
  "status": "pending",
  "invitation_sent_at": "2026-01-07T12:00:00Z"
}
```

---

### 7.3 Update Preferences

**PATCH** `/users/me/preferences`

**Description**: Update current user's preferences.

**Authorization**: Required (any authenticated user)

**Request Body**:
```json
{
  "timezone": "America/New_York",
  "locale": "en-US",
  "number_format": "us",
  "date_format": "MM/DD/YYYY",
  "brief_settings": {
    "enabled": true,
    "delivery_time": "07:00",
    "detail_level": "standard"
  },
  "alert_thresholds": {
    "current_ratio": {"warning": 1.5, "critical": 1.0}
  }
}
```

**Response** `200 OK`: Updated preferences object

---

## 8. WebSocket/SSE Real-Time

### 8.1 Portfolio Updates Stream

**GET** `/stream/portfolio/{portfolio_id}`

**Description**: Real-time portfolio updates via SSE.

**Authorization**: `portfolios:read`

**Response**: Server-Sent Events

```
event: valuation
data: {"portfolio_id": "port-001", "total_value": 15000000.00, "daily_return": 0.0125}

event: alert
data: {"id": "alert-001", "severity": "warning", "message": "AAPL debt/equity..."}

event: price
data: {"security_id": "AAPL", "price": 186.25, "change": 0.75}

:keepalive
```

**Implementation**:
```python
@router.get("/stream/portfolio/{portfolio_id}")
async def stream_portfolio_updates(
    request: Request,
    portfolio_id: str,
    _: None = Depends(require_permission("portfolios:read"))
):
    """Stream real-time portfolio updates."""
    services = request.state.services

    portfolio = await services.portfolio.get_portfolio(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    async def event_generator():
        import asyncio
        from datetime import datetime

        # Send initial state
        nav = await services.portfolio.calculate_nav(portfolio_id)
        yield f"event: valuation\ndata: {json.dumps(nav)}\n\n"

        # Poll for updates (in production, use Redis pub/sub)
        last_check = datetime.utcnow()
        while True:
            # Check for new alerts
            alerts = await services.db.express.list(
                "Alert",
                filter={
                    "portfolio_id": portfolio_id,
                    "triggered_at": {"$gt": last_check.isoformat()}
                },
                limit=10
            )

            for alert in alerts:
                yield f"event: alert\ndata: {json.dumps(alert)}\n\n"

            last_check = datetime.utcnow()

            # Keepalive
            yield f":keepalive\n\n"

            await asyncio.sleep(30)  # Check every 30 seconds

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

---

### 8.2 Alerts Stream

**GET** `/stream/alerts`

**Description**: Real-time alerts stream for current user.

**Authorization**: `alerts:read`

**Response**: Server-Sent Events

```
event: alert
data: {"id": "alert-001", "severity": "critical", "title": "Liquidity Alert", ...}

event: acknowledge
data: {"alert_id": "alert-002", "acknowledged_by": "user-001"}
```

---

## 9. Admin & System

### 9.1 System Health

**GET** `/admin/health`

**Description**: Comprehensive system health check.

**Authorization**: `admin` role only

**Response** `200 OK`:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T12:00:00Z",
  "version": "1.0.0",
  "components": {
    "database": {
      "status": "healthy",
      "latency_ms": 5,
      "connections": {"active": 10, "max": 100}
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 1,
      "memory_used_mb": 256
    },
    "data_providers": {
      "eodhd": {"status": "connected", "last_sync": "2026-01-07T06:00:00Z"},
      "capital_iq": {"status": "connected", "last_sync": "2026-01-05T00:00:00Z"}
    },
    "background_tasks": {
      "price_sync": {"status": "scheduled", "next_run": "2026-01-08T06:00:00Z"},
      "alert_check": {"status": "running", "last_run": "2026-01-07T11:45:00Z"}
    }
  },
  "metrics": {
    "uptime_seconds": 86400,
    "requests_24h": 125000,
    "errors_24h": 12,
    "avg_response_ms": 45
  }
}
```

---

### 9.2 Trigger Maintenance Task

**POST** `/admin/tasks/{task_name}`

**Description**: Manually trigger a maintenance task.

**Authorization**: `admin` role only

**Path Parameters**:
- `task_name`: Task to run (price_sync, ratio_calculation, alert_check)

**Response** `202 Accepted`:
```json
{
  "task": "price_sync",
  "status": "started",
  "job_id": "task-price_sync-20260107120000"
}
```

---

### 9.3 Get Audit Logs

**GET** `/admin/audit-logs`

**Description**: Query audit logs.

**Authorization**: `admin` role only

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `user_id` | string | - | Filter by user |
| `action` | string | - | Filter by action type |
| `entity_type` | string | - | Filter by entity type |
| `start_date` | string | - | Filter by date range |
| `end_date` | string | - | Filter by date range |
| `limit` | integer | 100 | Max results |

**Response** `200 OK`:
```json
{
  "logs": [
    {
      "id": "audit-001",
      "timestamp": "2026-01-07T12:00:00Z",
      "user_id": "user-001",
      "user": {
        "email": "john@example.com",
        "name": "John Smith"
      },
      "action": "create",
      "entity_type": "Portfolio",
      "entity_id": "port-001",
      "changes": {
        "name": {"old": null, "new": "Growth Portfolio"}
      },
      "ip_address": "192.168.1.1",
      "compliance_relevant": true
    }
  ],
  "total": 1250
}
```

---

## 10. Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "request_id": "req-12345"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `bad_request` | Invalid request body or parameters |
| 400 | `validation_error` | Field validation failed |
| 400 | `duplicate_code` | Resource with code already exists |
| 401 | `missing_token` | No authorization token provided |
| 401 | `invalid_token` | Token is invalid or malformed |
| 401 | `token_expired` | Token has expired |
| 403 | `permission_denied` | User lacks required permission |
| 403 | `tenant_inactive` | Tenant account is inactive |
| 404 | `not_found` | Resource not found |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Unexpected server error |
| 503 | `service_unavailable` | Service temporarily unavailable |

---

## 11. Implementation Checklist

### Phase 1: Authentication & Core (Week 1-2)

- [ ] **EP-001**: POST /auth/login
- [ ] **EP-002**: POST /auth/refresh
- [ ] **EP-003**: GET /auth/me
- [ ] **EP-004**: GET /portfolios
- [ ] **EP-005**: POST /portfolios
- [ ] **EP-006**: GET /portfolios/{id}
- [ ] **EP-007**: PATCH /portfolios/{id}
- [ ] **EP-008**: DELETE /portfolios/{id}

### Phase 2: Holdings & Transactions (Week 3-4)

- [ ] **EP-009**: GET /portfolios/{id}/holdings
- [ ] **EP-010**: POST /portfolios/{id}/transactions
- [ ] **EP-011**: GET /portfolios/{id}/transactions
- [ ] **EP-012**: POST /portfolios/{id}/health-scan

### Phase 3: Analytics (Week 5-6)

- [ ] **EP-013**: GET /analytics/securities/{id}/ratios
- [ ] **EP-014**: POST /analytics/securities/{id}/benchmark
- [ ] **EP-015**: GET /analytics/alerts
- [ ] **EP-016**: POST /analytics/alerts/{id}/acknowledge
- [ ] **EP-017**: POST /analytics/thresholds
- [ ] **EP-018**: GET /analytics/thresholds

### Phase 4: Intelligence (Week 7-8)

- [ ] **EP-019**: POST /intelligence/brief
- [ ] **EP-020**: GET /intelligence/brief/stream
- [ ] **EP-021**: POST /intelligence/query
- [ ] **EP-022**: POST /intelligence/analyze/{id}
- [ ] **EP-023**: POST /intelligence/anomalies

### Phase 5: Integrations & Admin (Week 9-10)

- [ ] **EP-024**: GET /integrations/providers
- [ ] **EP-025**: POST /integrations/providers
- [ ] **EP-026**: POST /integrations/sync
- [ ] **EP-027**: GET /integrations/sync/{id}
- [ ] **EP-028**: GET /users
- [ ] **EP-029**: POST /users/invite
- [ ] **EP-030**: PATCH /users/me/preferences

### Phase 6: Real-Time & Monitoring (Week 11-12)

- [ ] **EP-031**: GET /stream/portfolio/{id}
- [ ] **EP-032**: GET /stream/alerts
- [ ] **EP-033**: GET /admin/health
- [ ] **EP-034**: POST /admin/tasks/{name}
- [ ] **EP-035**: GET /admin/audit-logs

---

## 12. Acceptance Criteria

### All Endpoints

- [ ] Proper authentication validation
- [ ] RBAC permission checks
- [ ] Request validation with clear error messages
- [ ] Consistent response format
- [ ] Rate limiting headers included
- [ ] Audit logging for mutations
- [ ] Request ID in all responses

### Performance Requirements

| Endpoint Category | P95 Latency | Max Concurrent |
|------------------|-------------|----------------|
| Read operations | < 100ms | 1000 |
| Write operations | < 500ms | 100 |
| AI/Intelligence | < 5000ms | 50 |
| Streaming | < 100ms initial | 500 |

### Testing Requirements

For each endpoint:
- [ ] Unit test with mocked services
- [ ] Integration test with real database
- [ ] Authentication test (valid/invalid/expired tokens)
- [ ] Authorization test (permission denied cases)
- [ ] Rate limiting test
- [ ] Error handling test (400, 404, 500 cases)
