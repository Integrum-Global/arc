# ARC API Layer: Nexus Platform Configuration

## Overview

This document defines the complete Nexus platform configuration for the ARC investment management platform. Nexus provides zero-config multi-channel deployment (REST API, CLI, MCP) from a single codebase.

**Key Nexus Capabilities Used:**
- Multi-channel deployment (API + CLI + MCP simultaneously)
- Enterprise authentication (OAuth2, JWT, RBAC)
- Rate limiting and circuit breakers
- SSE streaming for real-time updates
- Health monitoring and audit logging
- Custom endpoint registration

---

## 1. Platform Architecture

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                    NEXUS PLATFORM                         │
                    ├──────────────────────────────────────────────────────────┤
                    │                                                           │
                    │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
                    │  │  REST API    │ │     CLI      │ │ MCP Server   │     │
                    │  │  Port: 8000  │ │   Interface  │ │ Port: 3001   │     │
                    │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │
                    │         │                │                │              │
                    │  ┌──────┴────────────────┴────────────────┴──────────┐  │
                    │  │              ENTERPRISE GATEWAY                    │  │
                    │  │                                                    │  │
                    │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
                    │  │  │  Auth   │ │  RBAC   │ │  Rate   │ │ Circuit │ │  │
                    │  │  │(OAuth2) │ │ Manager │ │ Limiter │ │ Breaker │ │  │
                    │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │
                    │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
                    │  │  │ Tenant  │ │  Audit  │ │ Metrics │ │  CORS   │ │  │
                    │  │  │ Context │ │   Log   │ │ Export  │ │ Handler │ │  │
                    │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │
                    │  └────────────────────────────────────────────────────┘  │
                    │                           │                               │
                    │  ┌────────────────────────┴───────────────────────────┐  │
                    │  │                 SESSION MANAGER                     │  │
                    │  │         (Unified across all channels)               │  │
                    │  └────────────────────────────────────────────────────┘  │
                    │                           │                               │
                    │  ┌────────────────────────┴───────────────────────────┐  │
                    │  │               SERVICE REGISTRY                      │  │
                    │  │                                                     │  │
                    │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐        │  │
                    │  │  │ Portfolio │ │ Analytics │ │Intelligence│        │  │
                    │  │  │  Service  │ │  Service  │ │  Service   │        │  │
                    │  │  └───────────┘ └───────────┘ └───────────┘        │  │
                    │  │  ┌───────────┐ ┌───────────┐                       │  │
                    │  │  │Integration│ │   User    │                       │  │
                    │  │  │  Service  │ │  Service  │                       │  │
                    │  │  └───────────┘ └───────────┘                       │  │
                    │  └────────────────────────────────────────────────────┘  │
                    └──────────────────────────────────────────────────────────┘
```

---

## 2. Application Entry Point

### 2.1 Main Application

**File**: `src/arc/api/app.py`

```python
"""
ARC Nexus Platform - Main Application Entry Point

This module configures and initializes the Nexus platform for the ARC
investment management platform, providing multi-channel access (API, CLI, MCP).
"""

from nexus import Nexus
from contextlib import asynccontextmanager
from fastapi import FastAPI
from typing import Optional
import os
import logging

from arc.models import db
from arc.services import ServiceRegistry
from arc.api.middleware.auth import AuthMiddleware
from arc.api.middleware.tenant import TenantMiddleware
from arc.api.middleware.audit import AuditMiddleware
from arc.api.middleware.rate_limit import RateLimitMiddleware
from arc.api.routes import (
    auth_router,
    portfolios_router,
    analytics_router,
    intelligence_router,
    integrations_router,
    users_router,
    admin_router,
    health_router,
)
from arc.api.mcp.tools import register_mcp_tools

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# =============================================================================
# APPLICATION LIFECYCLE
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.

    Startup:
    - Create database tables (auto_migrate=False for Docker)
    - Initialize service registry
    - Register MCP tools
    - Start background tasks

    Shutdown:
    - Close database connections
    - Cancel background tasks
    - Flush audit logs
    """
    logger.info("Starting ARC Nexus Platform...")

    # Startup: Create tables asynchronously (Docker-safe)
    await db.create_tables_async()
    logger.info("Database tables initialized")

    # Initialize global service registry
    app.state.services = ServiceRegistry(db)
    logger.info("Service registry initialized")

    # Register MCP tools
    register_mcp_tools(app.state.nexus)
    logger.info("MCP tools registered")

    # Start background tasks (price sync scheduler, alert checker)
    from arc.api.tasks import start_background_tasks
    await start_background_tasks(app)
    logger.info("Background tasks started")

    yield

    # Shutdown
    logger.info("Shutting down ARC Nexus Platform...")

    # Stop background tasks
    from arc.api.tasks import stop_background_tasks
    await stop_background_tasks(app)

    # Close database connections
    await db.close_async()
    logger.info("Database connections closed")


# =============================================================================
# NEXUS PLATFORM INITIALIZATION
# =============================================================================

def create_app() -> Nexus:
    """
    Create and configure the Nexus application.

    CRITICAL: Use auto_discovery=False to prevent DataFlow blocking issues.
    """

    # Environment configuration
    api_port = int(os.getenv("API_PORT", "8000"))
    mcp_port = int(os.getenv("MCP_PORT", "3001"))
    env = os.getenv("ENVIRONMENT", "development")

    # Create Nexus instance
    # CRITICAL: auto_discovery=False prevents blocking with DataFlow
    app = Nexus(
        api_port=api_port,
        mcp_port=mcp_port,
        auto_discovery=False,  # REQUIRED for DataFlow integration
        enable_auth=True,
        enable_rate_limiting=True,
        enable_monitoring=True,
        lifespan=lifespan,
        title="ARC Investment Management API",
        description="AI-native investment management platform for investment managers and family offices",
        version="1.0.0",
        docs_url="/docs" if env != "production" else None,
        redoc_url="/redoc" if env != "production" else None,
    )

    # Store reference for MCP tool registration
    app.state.nexus = app

    # Configure authentication
    configure_authentication(app)

    # Configure rate limiting
    configure_rate_limiting(app)

    # Configure CORS
    configure_cors(app)

    # Add middleware (order matters - outermost first)
    add_middleware(app)

    # Include routers
    include_routers(app)

    # Register workflows
    register_workflows(app)

    return app


# =============================================================================
# AUTHENTICATION CONFIGURATION
# =============================================================================

def configure_authentication(app: Nexus):
    """
    Configure OAuth2/JWT authentication with RBAC.

    Authentication Flow:
    1. User authenticates via OAuth2 provider (Auth0/Okta)
    2. JWT token issued with user claims and permissions
    3. Each request validated against RBAC policies
    4. Tenant context extracted from token
    """

    # OAuth2 configuration
    app.auth.strategy = "oauth2"
    app.auth.oauth2_config = {
        "issuer": os.getenv("OAUTH_ISSUER", "https://arc.auth0.com/"),
        "audience": os.getenv("OAUTH_AUDIENCE", "https://api.arc-invest.com"),
        "algorithms": ["RS256"],
        "jwks_uri": os.getenv("OAUTH_JWKS_URI", "https://arc.auth0.com/.well-known/jwks.json"),
    }

    # JWT configuration (for internal tokens)
    app.auth.jwt_config = {
        "secret": os.getenv("JWT_SECRET"),
        "algorithm": "HS256",
        "expiration_minutes": 60,
        "refresh_expiration_days": 7,
    }

    # Enable RBAC
    app.auth.rbac_enabled = True

    # Define roles and permissions
    app.auth.roles = {
        # Full system access
        "admin": ["*"],

        # Investment manager - full portfolio and analytics access
        "investment_manager": [
            # Portfolios
            "portfolios:read",
            "portfolios:write",
            "portfolios:delete",
            "holdings:read",
            "holdings:write",
            "transactions:read",
            "transactions:write",

            # Analytics
            "analytics:read",
            "analytics:calculate",
            "alerts:read",
            "alerts:write",
            "alerts:acknowledge",
            "benchmarks:read",
            "benchmarks:write",

            # Intelligence
            "intelligence:read",
            "intelligence:generate",
            "briefs:read",
            "briefs:generate",
            "queries:execute",

            # Reports
            "reports:read",
            "reports:generate",

            # Integrations
            "integrations:read",
            "sync:trigger",

            # Users (own tenant)
            "users:read",
            "users:invite",
        ],

        # Family office - view and limited write access
        "family_office": [
            "portfolios:read",
            "holdings:read",
            "transactions:read",
            "analytics:read",
            "alerts:read",
            "alerts:acknowledge",
            "benchmarks:read",
            "intelligence:read",
            "briefs:read",
            "queries:execute",
            "reports:read",
            "reports:generate",
        ],

        # Compliance officer - audit and compliance features
        "compliance": [
            "portfolios:read",
            "holdings:read",
            "transactions:read",
            "analytics:read",
            "alerts:read",
            "compliance:read",
            "compliance:write",
            "audit:read",
            "reports:read",
            "reports:generate",
        ],

        # Analyst - read-only with query access
        "analyst": [
            "portfolios:read",
            "holdings:read",
            "transactions:read",
            "analytics:read",
            "alerts:read",
            "benchmarks:read",
            "intelligence:read",
            "briefs:read",
            "queries:execute",
            "reports:read",
        ],

        # Viewer - read-only access
        "viewer": [
            "portfolios:read",
            "holdings:read",
            "analytics:read",
            "alerts:read",
            "reports:read",
        ],
    }

    # Permission aliases for common operations
    app.auth.permission_aliases = {
        "portfolios:full": ["portfolios:read", "portfolios:write", "portfolios:delete"],
        "analytics:full": ["analytics:read", "analytics:calculate"],
        "intelligence:full": ["intelligence:read", "intelligence:generate", "queries:execute"],
    }


# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================

def configure_rate_limiting(app: Nexus):
    """
    Configure rate limiting with tier-based limits.

    Rate limits are applied per-tenant and per-user, with different
    tiers based on subscription plan.
    """

    # Global default rate limit
    app.rate_limit = 5000  # requests per minute

    # Tier-based rate limits (requests per minute)
    app.rate_limit_tiers = {
        "professional": {
            "default": 1000,
            "intelligence": 100,      # AI endpoints are expensive
            "sync": 10,               # Data sync operations
            "reports": 50,            # Report generation
        },
        "enterprise": {
            "default": 5000,
            "intelligence": 500,
            "sync": 50,
            "reports": 200,
        },
        "private": {
            "default": 10000,
            "intelligence": 1000,
            "sync": 100,
            "reports": 500,
        },
    }

    # Endpoint-specific rate limits
    app.rate_limit_endpoints = {
        # Intelligence endpoints (expensive AI operations)
        "/api/v1/intelligence/brief": 50,
        "/api/v1/intelligence/query": 100,
        "/api/v1/intelligence/analyze": 50,

        # Sync endpoints
        "/api/v1/integrations/sync": 10,

        # Report endpoints
        "/api/v1/reports/generate": 30,

        # Auth endpoints (prevent brute force)
        "/api/v1/auth/login": 20,
        "/api/v1/auth/token": 20,
    }

    # Burst allowance (percentage over limit for short bursts)
    app.rate_limit_burst = 1.2  # 20% burst allowance


# =============================================================================
# CORS CONFIGURATION
# =============================================================================

def configure_cors(app: Nexus):
    """Configure CORS for web and mobile clients."""

    from fastapi.middleware.cors import CORSMiddleware

    allowed_origins = os.getenv("CORS_ORIGINS", "").split(",")

    # Default origins for development
    if not allowed_origins or allowed_origins == [""]:
        allowed_origins = [
            "http://localhost:3000",      # React dev server
            "http://localhost:5173",      # Vite dev server
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"],
    )


# =============================================================================
# MIDDLEWARE CONFIGURATION
# =============================================================================

def add_middleware(app: Nexus):
    """
    Add custom middleware stack.

    Order (outermost to innermost):
    1. Audit - Log all requests
    2. Tenant - Extract and validate tenant context
    3. Auth - Authenticate and authorize requests
    4. Rate Limit - Apply rate limiting
    """

    # Audit middleware - logs all requests
    app.add_middleware(
        AuditMiddleware,
        exclude_paths=["/health", "/ready", "/metrics", "/docs", "/redoc", "/openapi.json"],
    )

    # Tenant middleware - extracts tenant from JWT
    app.add_middleware(
        TenantMiddleware,
        exclude_paths=["/api/v1/auth", "/health", "/ready", "/docs"],
    )

    # Auth middleware - handles authentication
    app.add_middleware(
        AuthMiddleware,
        exclude_paths=[
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/health",
            "/ready",
            "/docs",
            "/redoc",
            "/openapi.json",
        ],
    )

    # Rate limit middleware
    app.add_middleware(
        RateLimitMiddleware,
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
    )


# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

def include_routers(app: Nexus):
    """Include all API routers."""

    # Health and monitoring (no auth required)
    app.include_router(health_router, prefix="", tags=["Health"])

    # Authentication
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

    # Core resources
    app.include_router(portfolios_router, prefix="/api/v1/portfolios", tags=["Portfolios"])
    app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
    app.include_router(intelligence_router, prefix="/api/v1/intelligence", tags=["Intelligence"])

    # Supporting resources
    app.include_router(integrations_router, prefix="/api/v1/integrations", tags=["Integrations"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])

    # Admin endpoints
    app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])


# =============================================================================
# WORKFLOW REGISTRATION
# =============================================================================

def register_workflows(app: Nexus):
    """
    Register Kailash workflows with Nexus.

    IMPORTANT: Call .build() on workflows before registration.
    """

    from arc.workflows.data_sync.eodhd import create_eodhd_price_sync_workflow
    from arc.workflows.data_sync.capitaliq import create_capitaliq_fundamentals_workflow
    from arc.workflows.analytics.ratios import create_ratio_calculation_workflow
    from arc.workflows.analytics.alerts import create_threshold_alert_workflow
    from arc.workflows.analytics.benchmarks import create_peer_benchmark_workflow
    from arc.workflows.portfolio.valuation import create_nav_calculation_workflow
    from arc.workflows.portfolio.health_scan import create_health_scan_workflow

    # Data sync workflows
    app.register("sync_prices", create_eodhd_price_sync_workflow())
    app.register("sync_fundamentals", create_capitaliq_fundamentals_workflow())

    # Analytics workflows
    app.register("calculate_ratios", create_ratio_calculation_workflow())
    app.register("check_thresholds", create_threshold_alert_workflow())
    app.register("peer_benchmark", create_peer_benchmark_workflow())

    # Portfolio workflows
    app.register("calculate_nav", create_nav_calculation_workflow())
    app.register("health_scan", create_health_scan_workflow())

    logger.info(f"Registered {len(app.workflows)} workflows")


# =============================================================================
# APPLICATION INSTANCE
# =============================================================================

# Create application instance
app = create_app()


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

def main():
    """CLI entry point for running the server."""
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    reload = os.getenv("ENVIRONMENT", "development") == "development"

    uvicorn.run(
        "arc.api.app:app",
        host=host,
        port=port,
        workers=workers,
        reload=reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
```

---

## 3. Middleware Implementation

### 3.1 Authentication Middleware

**File**: `src/arc/api/middleware/auth.py`

```python
"""
Authentication middleware for JWT/OAuth2 validation.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from typing import List, Optional
import jwt
from jwt import PyJWKClient
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware that validates JWT tokens.

    Supports:
    - OAuth2 tokens (RS256, validated against JWKS)
    - Internal JWT tokens (HS256)
    - API key authentication (for service accounts)
    """

    def __init__(self, app, exclude_paths: List[str] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or []

        # OAuth2 configuration
        self.oauth_issuer = os.getenv("OAUTH_ISSUER")
        self.oauth_audience = os.getenv("OAUTH_AUDIENCE")
        self.oauth_algorithms = ["RS256"]

        # Initialize JWKS client for OAuth2
        jwks_uri = os.getenv("OAUTH_JWKS_URI")
        if jwks_uri:
            self.jwks_client = PyJWKClient(jwks_uri, cache_keys=True)
        else:
            self.jwks_client = None

        # Internal JWT configuration
        self.jwt_secret = os.getenv("JWT_SECRET")
        self.jwt_algorithm = "HS256"

    async def dispatch(self, request: Request, call_next):
        # Skip authentication for excluded paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"error": "missing_token", "message": "Authorization header required"}
            )

        # Parse Bearer token
        try:
            scheme, token = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                raise ValueError("Invalid scheme")
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"error": "invalid_header", "message": "Invalid Authorization header format"}
            )

        # Validate token
        try:
            claims = await self._validate_token(token)

            # Attach user info to request state
            request.state.user_id = claims.get("sub")
            request.state.tenant_id = claims.get("tenant_id") or claims.get("https://arc-invest.com/tenant_id")
            request.state.email = claims.get("email")
            request.state.role = claims.get("role") or claims.get("https://arc-invest.com/role")
            request.state.permissions = claims.get("permissions", [])
            request.state.token_claims = claims

        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401,
                content={"error": "token_expired", "message": "Token has expired"}
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return JSONResponse(
                status_code=401,
                content={"error": "invalid_token", "message": "Invalid token"}
            )

        return await call_next(request)

    async def _validate_token(self, token: str) -> dict:
        """
        Validate token and return claims.

        First tries OAuth2 validation (RS256), then internal JWT (HS256).
        """

        # Try OAuth2 validation first
        if self.jwks_client:
            try:
                signing_key = self.jwks_client.get_signing_key_from_jwt(token)
                claims = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=self.oauth_algorithms,
                    issuer=self.oauth_issuer,
                    audience=self.oauth_audience,
                )
                return claims
            except jwt.exceptions.DecodeError:
                # Not an OAuth2 token, try internal JWT
                pass

        # Try internal JWT validation
        if self.jwt_secret:
            claims = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm],
            )
            return claims

        raise jwt.InvalidTokenError("No valid signing key found")


def require_permission(permission: str):
    """
    Dependency to check if user has required permission.

    Usage:
        @app.get("/portfolios")
        async def list_portfolios(
            request: Request,
            _: None = Depends(require_permission("portfolios:read"))
        ):
            ...
    """
    from fastapi import HTTPException, Request

    async def check_permission(request: Request):
        user_permissions = getattr(request.state, "permissions", [])
        user_role = getattr(request.state, "role", None)

        # Admin has all permissions
        if user_role == "admin" or "*" in user_permissions:
            return True

        # Check specific permission
        if permission not in user_permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission} required"
            )

        return True

    return check_permission
```

### 3.2 Tenant Middleware

**File**: `src/arc/api/middleware/tenant.py`

```python
"""
Multi-tenant middleware for tenant context extraction and isolation.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from typing import List
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extract and validate tenant context from authenticated requests.

    Tenant ID can come from:
    1. JWT token claims (preferred)
    2. X-Tenant-ID header (for admin operations)
    3. URL path parameter (for specific endpoints)
    """

    def __init__(self, app, exclude_paths: List[str] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or []

    async def dispatch(self, request: Request, call_next):
        # Skip for excluded paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)

        # Get tenant from various sources
        tenant_id = None

        # 1. From JWT token (set by auth middleware)
        if hasattr(request.state, "tenant_id"):
            tenant_id = request.state.tenant_id

        # 2. From header (admin override)
        if not tenant_id and hasattr(request.state, "role"):
            if request.state.role == "admin":
                header_tenant = request.headers.get("X-Tenant-ID")
                if header_tenant:
                    tenant_id = header_tenant

        # Validate tenant exists and is active
        if tenant_id:
            # Get services from app state
            services = request.app.state.services
            tenant = await services.user.get_tenant(tenant_id)

            if not tenant:
                return JSONResponse(
                    status_code=404,
                    content={"error": "tenant_not_found", "message": f"Tenant {tenant_id} not found"}
                )

            if not tenant.get("active"):
                return JSONResponse(
                    status_code=403,
                    content={"error": "tenant_inactive", "message": "Tenant account is inactive"}
                )

            # Attach tenant context
            request.state.tenant = tenant
            request.state.tenant_id = tenant_id

            # Create tenant-scoped services
            request.state.services = services.with_tenant(tenant_id)

        return await call_next(request)
```

### 3.3 Audit Middleware

**File**: `src/arc/api/middleware/audit.py`

```python
"""
Audit logging middleware for compliance and monitoring.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from typing import List
import time
import uuid
import logging
import json
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Log all API requests for audit and compliance.

    Logs:
    - Request method, path, query params
    - User ID and tenant ID
    - Response status and timing
    - Error details (if any)
    """

    def __init__(self, app, exclude_paths: List[str] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or []

    async def dispatch(self, request: Request, call_next):
        # Skip for excluded paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)

        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Capture start time
        start_time = time.time()

        # Extract request details
        audit_entry = {
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": request.method,
            "path": path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }

        try:
            response = await call_next(request)

            # Add response details
            duration_ms = (time.time() - start_time) * 1000
            audit_entry.update({
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "user_id": getattr(request.state, "user_id", None),
                "tenant_id": getattr(request.state, "tenant_id", None),
            })

            # Log based on status
            if response.status_code >= 500:
                logger.error(f"API Error: {json.dumps(audit_entry)}")
            elif response.status_code >= 400:
                logger.warning(f"API Warning: {json.dumps(audit_entry)}")
            else:
                logger.info(f"API Request: {json.dumps(audit_entry)}")

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            # Persist audit log asynchronously (non-blocking)
            if hasattr(request.state, "services"):
                await self._persist_audit_log(request.state.services, audit_entry)

            return response

        except Exception as e:
            # Log exception
            duration_ms = (time.time() - start_time) * 1000
            audit_entry.update({
                "status_code": 500,
                "duration_ms": round(duration_ms, 2),
                "error": str(e),
                "error_type": type(e).__name__,
            })
            logger.exception(f"API Exception: {json.dumps(audit_entry)}")
            raise

    async def _persist_audit_log(self, services, audit_entry: dict):
        """Persist audit log to database (fire-and-forget)."""
        try:
            # Only persist if user is authenticated (compliance-relevant)
            if audit_entry.get("user_id"):
                await services.db.express.create("AuditLog", {
                    "id": f"audit-{audit_entry['request_id']}",
                    "user_id": audit_entry["user_id"],
                    "action": audit_entry["method"],
                    "entity_type": "api_request",
                    "entity_id": audit_entry["path"],
                    "request_data": {
                        "query_params": audit_entry.get("query_params"),
                        "user_agent": audit_entry.get("user_agent"),
                    },
                    "ip_address": audit_entry.get("client_ip"),
                    "timestamp": audit_entry["timestamp"],
                    "compliance_relevant": audit_entry["path"].startswith("/api/v1/portfolios"),
                })
        except Exception as e:
            # Don't fail request if audit logging fails
            logger.error(f"Failed to persist audit log: {e}")
```

### 3.4 Rate Limit Middleware

**File**: `src/arc/api/middleware/rate_limit.py`

```python
"""
Rate limiting middleware using Redis.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from typing import Optional
import redis.asyncio as redis
import time
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with sliding window algorithm.

    Features:
    - Per-tenant rate limiting
    - Per-user rate limiting
    - Endpoint-specific limits
    - Tier-based limits (professional, enterprise, private)
    """

    def __init__(self, app, redis_url: str):
        super().__init__(app)
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Lazy Redis connection."""
        if self._redis is None:
            self._redis = redis.from_url(self.redis_url)
        return self._redis

    async def dispatch(self, request: Request, call_next):
        # Get rate limit configuration
        tenant = getattr(request.state, "tenant", None)
        user_id = getattr(request.state, "user_id", None)
        path = request.url.path

        if not user_id:
            # No rate limiting for unauthenticated requests (handled by auth)
            return await call_next(request)

        # Get tier-based limit
        tier = tenant.get("plan", "professional") if tenant else "professional"
        tier_limits = request.app.rate_limit_tiers.get(tier, {})

        # Determine applicable limit
        limit = tier_limits.get("default", 1000)

        # Check endpoint-specific limits
        endpoint_limits = getattr(request.app, "rate_limit_endpoints", {})
        for endpoint_path, endpoint_limit in endpoint_limits.items():
            if path.startswith(endpoint_path):
                limit = min(limit, endpoint_limit)
                break

        # Check rate limit
        try:
            r = await self.get_redis()
            tenant_id = getattr(request.state, "tenant_id", "default")

            # Create rate limit key
            window_start = int(time.time() // 60)  # 1-minute windows
            key = f"ratelimit:{tenant_id}:{user_id}:{window_start}"

            # Increment counter
            current = await r.incr(key)

            # Set expiry on first request in window
            if current == 1:
                await r.expire(key, 120)  # 2-minute expiry for cleanup

            # Check if over limit
            burst_limit = int(limit * getattr(request.app, "rate_limit_burst", 1.2))

            if current > burst_limit:
                remaining = 0
                reset_time = (window_start + 1) * 60

                response = JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "message": f"Rate limit exceeded. Limit: {limit}/min",
                        "retry_after": reset_time - int(time.time()),
                    }
                )
                response.headers["X-Rate-Limit-Limit"] = str(limit)
                response.headers["X-Rate-Limit-Remaining"] = "0"
                response.headers["X-Rate-Limit-Reset"] = str(reset_time)
                response.headers["Retry-After"] = str(reset_time - int(time.time()))

                return response

            # Proceed with request
            response = await call_next(request)

            # Add rate limit headers
            remaining = max(0, limit - current)
            reset_time = (window_start + 1) * 60

            response.headers["X-Rate-Limit-Limit"] = str(limit)
            response.headers["X-Rate-Limit-Remaining"] = str(remaining)
            response.headers["X-Rate-Limit-Reset"] = str(reset_time)

            return response

        except redis.RedisError as e:
            # If Redis is down, allow request (fail open)
            logger.warning(f"Rate limit check failed: {e}")
            return await call_next(request)
```

---

## 4. MCP Server Configuration

### 4.1 MCP Tools Registration

**File**: `src/arc/api/mcp/tools.py`

```python
"""
MCP (Model Context Protocol) tool definitions for AI agent integration.

These tools allow AI assistants (like Claude) to interact with the ARC
platform through a standardized protocol.
"""

from nexus import Nexus
import logging

logger = logging.getLogger(__name__)


def register_mcp_tools(app: Nexus):
    """
    Register all MCP tools with the Nexus platform.

    Tools are organized by domain:
    - Portfolio tools
    - Analytics tools
    - Intelligence tools
    """

    # ==========================================================================
    # PORTFOLIO TOOLS
    # ==========================================================================

    @app.mcp_tool(
        name="arc_list_portfolios",
        description="List all portfolios for the authenticated user. Returns portfolio summary including name, type, AUM, and performance metrics."
    )
    async def mcp_list_portfolios(
        portfolio_type: str = None,
        active_only: bool = True,
        limit: int = 20
    ):
        """
        List portfolios with optional filtering.

        Args:
            portfolio_type: Filter by type (managed, model, benchmark)
            active_only: Only return active portfolios
            limit: Maximum number of portfolios to return

        Returns:
            List of portfolio summaries
        """
        services = app.state.services
        portfolios = await services.portfolio.list_portfolios(
            portfolio_type=portfolio_type,
            active_only=active_only,
            limit=limit
        )
        return {"portfolios": portfolios, "count": len(portfolios)}

    @app.mcp_tool(
        name="arc_get_portfolio",
        description="Get detailed information about a specific portfolio including holdings, valuation, and performance."
    )
    async def mcp_get_portfolio(portfolio_id: str):
        """
        Get portfolio details.

        Args:
            portfolio_id: Portfolio ID

        Returns:
            Portfolio details with current valuation
        """
        services = app.state.services
        portfolio = await services.portfolio.get_portfolio(portfolio_id)

        if not portfolio:
            return {"error": "Portfolio not found"}

        # Get current valuation
        nav = await services.portfolio.calculate_nav(portfolio_id)
        holdings = await services.portfolio.get_holdings(portfolio_id)

        return {
            "portfolio": portfolio,
            "valuation": nav,
            "holdings_count": len(holdings),
        }

    @app.mcp_tool(
        name="arc_get_holdings",
        description="Get all holdings in a portfolio with current market values and unrealized P&L."
    )
    async def mcp_get_holdings(
        portfolio_id: str,
        include_closed: bool = False
    ):
        """
        Get portfolio holdings.

        Args:
            portfolio_id: Portfolio ID
            include_closed: Include positions with zero quantity

        Returns:
            List of holdings with security details
        """
        services = app.state.services
        holdings = await services.portfolio.get_holdings(
            portfolio_id=portfolio_id,
            include_closed=include_closed
        )
        return {"holdings": holdings, "count": len(holdings)}

    @app.mcp_tool(
        name="arc_portfolio_health_scan",
        description="Run a comprehensive health scan on a portfolio to identify issues with holdings based on financial ratios and thresholds."
    )
    async def mcp_health_scan(portfolio_id: str):
        """
        Run portfolio health scan.

        Args:
            portfolio_id: Portfolio ID

        Returns:
            Health scan results with scores and issues
        """
        services = app.state.services
        return await services.portfolio.run_health_scan(portfolio_id)

    # ==========================================================================
    # ANALYTICS TOOLS
    # ==========================================================================

    @app.mcp_tool(
        name="arc_get_security_ratios",
        description="Get all financial ratios for a security including liquidity, profitability, leverage, utilization, and valuation ratios."
    )
    async def mcp_security_ratios(
        security_id: str,
        as_of_date: str = None
    ):
        """
        Get security ratios.

        Args:
            security_id: Security ID (ticker or ISIN)
            as_of_date: Historical date (YYYY-MM-DD)

        Returns:
            All 25+ ratios organized by class
        """
        services = app.state.services
        return await services.analytics.get_security_ratios(
            security_id=security_id,
            as_of_date=as_of_date
        )

    @app.mcp_tool(
        name="arc_benchmark_security",
        description="Compare a security's ratios against its peer group to determine relative performance and percentile ranking."
    )
    async def mcp_benchmark_security(
        security_id: str,
        peer_group_id: str = None,
        ratios: list = None
    ):
        """
        Benchmark security against peers.

        Args:
            security_id: Security to benchmark
            peer_group_id: Peer group ID (auto-selects if not provided)
            ratios: Specific ratios to compare (all if not provided)

        Returns:
            Benchmark comparison with percentile rankings
        """
        services = app.state.services
        return await services.analytics.benchmark_against_peers(
            security_id=security_id,
            peer_group_id=peer_group_id,
            ratios=ratios
        )

    @app.mcp_tool(
        name="arc_get_alerts",
        description="Get active alerts for the user including threshold breaches and anomaly detections."
    )
    async def mcp_get_alerts(
        status: str = "active",
        severity: str = None,
        limit: int = 20
    ):
        """
        Get user alerts.

        Args:
            status: Filter by status (active, acknowledged, resolved)
            severity: Filter by severity (critical, warning)
            limit: Maximum alerts to return

        Returns:
            List of alerts
        """
        services = app.state.services
        return await services.analytics.get_user_alerts(
            status=status,
            limit=limit
        )

    # ==========================================================================
    # INTELLIGENCE TOOLS
    # ==========================================================================

    @app.mcp_tool(
        name="arc_query",
        description="Ask a natural language question about your portfolios. Examples: 'What's my tech sector exposure?', 'Which holdings have the highest P/E ratios?', 'How has my portfolio performed vs S&P 500?'"
    )
    async def mcp_query(
        question: str,
        portfolio_id: str = None
    ):
        """
        Natural language portfolio query.

        Args:
            question: Natural language question
            portfolio_id: Specific portfolio (all if not provided)

        Returns:
            Answer with confidence score and supporting data
        """
        services = app.state.services
        return await services.intelligence.query_portfolio(
            query=question,
            portfolio_id=portfolio_id
        )

    @app.mcp_tool(
        name="arc_market_brief",
        description="Generate an AI-powered market intelligence brief covering recent market developments, sector trends, and portfolio implications."
    )
    async def mcp_market_brief(
        brief_type: str = "daily",
        topics: list = None,
        portfolio_id: str = None
    ):
        """
        Generate market brief.

        Args:
            brief_type: Type of brief (daily, weekly, custom)
            topics: Specific topics to cover
            portfolio_id: Contextualize for portfolio

        Returns:
            AI-generated market brief
        """
        services = app.state.services
        return await services.intelligence.generate_market_brief(
            brief_type=brief_type,
            topics=topics,
            portfolio_id=portfolio_id
        )

    @app.mcp_tool(
        name="arc_analyze_security",
        description="Perform AI-powered financial analysis on a security including health assessment, trend analysis, and investment recommendation."
    )
    async def mcp_analyze_security(
        security_id: str,
        analysis_type: str = "comprehensive"
    ):
        """
        Analyze security with AI.

        Args:
            security_id: Security to analyze
            analysis_type: Depth of analysis (quick, comprehensive, deep_dive)

        Returns:
            AI analysis with scores and recommendations
        """
        services = app.state.services
        return await services.intelligence.analyze_security(
            security_id=security_id,
            analysis_type=analysis_type
        )

    logger.info("Registered MCP tools")
```

---

## 5. Background Tasks

### 5.1 Task Scheduler

**File**: `src/arc/api/tasks/__init__.py`

```python
"""
Background task management for scheduled operations.
"""

from fastapi import FastAPI
import asyncio
import logging
from datetime import datetime, time, timezone
from typing import Optional

logger = logging.getLogger(__name__)


class TaskScheduler:
    """Simple task scheduler for background operations."""

    def __init__(self, app: FastAPI):
        self.app = app
        self.tasks = []
        self._running = False

    async def start(self):
        """Start all scheduled tasks."""
        self._running = True

        # Daily price sync (6:00 AM UTC)
        self.tasks.append(asyncio.create_task(
            self._run_daily_task(
                time(6, 0),
                self._sync_prices,
                "price_sync"
            )
        ))

        # Daily NAV calculation (6:30 AM UTC)
        self.tasks.append(asyncio.create_task(
            self._run_daily_task(
                time(6, 30),
                self._calculate_nav,
                "nav_calculation"
            )
        ))

        # Ratio calculation (7:00 AM UTC)
        self.tasks.append(asyncio.create_task(
            self._run_daily_task(
                time(7, 0),
                self._calculate_ratios,
                "ratio_calculation"
            )
        ))

        # Alert checking (every 15 minutes during market hours)
        self.tasks.append(asyncio.create_task(
            self._run_periodic_task(
                900,  # 15 minutes
                self._check_alerts,
                "alert_check"
            )
        ))

        logger.info("Task scheduler started")

    async def stop(self):
        """Stop all tasks."""
        self._running = False
        for task in self.tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("Task scheduler stopped")

    async def _run_daily_task(self, run_time: time, func, name: str):
        """Run task daily at specified time."""
        while self._running:
            now = datetime.now(timezone.utc)
            target = datetime.combine(now.date(), run_time, tzinfo=timezone.utc)

            if now > target:
                # Already passed today, schedule for tomorrow
                target = target.replace(day=target.day + 1)

            sleep_seconds = (target - now).total_seconds()
            logger.info(f"Task {name} scheduled for {target.isoformat()}")

            await asyncio.sleep(sleep_seconds)

            if self._running:
                try:
                    logger.info(f"Running task {name}")
                    await func()
                    logger.info(f"Task {name} completed")
                except Exception as e:
                    logger.error(f"Task {name} failed: {e}")

    async def _run_periodic_task(self, interval: int, func, name: str):
        """Run task periodically."""
        while self._running:
            try:
                logger.debug(f"Running periodic task {name}")
                await func()
            except Exception as e:
                logger.error(f"Periodic task {name} failed: {e}")

            await asyncio.sleep(interval)

    async def _sync_prices(self):
        """Sync prices from EODHD."""
        services = self.app.state.services
        await services.integration.sync_prices()

    async def _calculate_nav(self):
        """Calculate NAV for all portfolios."""
        # Execute NAV workflow
        nexus = self.app.state.nexus
        await nexus._execute_workflow("calculate_nav", {})

    async def _calculate_ratios(self):
        """Calculate ratios for all securities."""
        nexus = self.app.state.nexus
        await nexus._execute_workflow("calculate_ratios", {})

    async def _check_alerts(self):
        """Check thresholds and generate alerts."""
        nexus = self.app.state.nexus
        await nexus._execute_workflow("check_thresholds", {})


# Global scheduler instance
_scheduler: Optional[TaskScheduler] = None


async def start_background_tasks(app: FastAPI):
    """Start background tasks."""
    global _scheduler
    _scheduler = TaskScheduler(app)
    await _scheduler.start()


async def stop_background_tasks(app: FastAPI):
    """Stop background tasks."""
    global _scheduler
    if _scheduler:
        await _scheduler.stop()
        _scheduler = None
```

---

## 6. Health & Monitoring

### 6.1 Health Endpoints

**File**: `src/arc/api/routes/health.py`

```python
"""
Health check and monitoring endpoints.
"""

from fastapi import APIRouter, Response
from typing import Dict, Any
import os
import time
from datetime import datetime, timezone

router = APIRouter()

_start_time = time.time()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.

    Returns 200 if the service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("APP_VERSION", "1.0.0"),
    }


@router.get("/ready")
async def readiness_check(response: Response) -> Dict[str, Any]:
    """
    Readiness check for Kubernetes.

    Returns 200 if the service is ready to accept requests.
    Checks database connectivity and critical dependencies.
    """
    from arc.models import db

    checks = {
        "database": False,
        "cache": False,
    }

    # Check database
    try:
        # Simple query to verify database connection
        await db.express.list("Tenant", limit=1)
        checks["database"] = True
    except Exception:
        pass

    # Check Redis (if configured)
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            import redis.asyncio as redis
            r = redis.from_url(redis_url)
            await r.ping()
            checks["cache"] = True
            await r.close()
        except Exception:
            pass
    else:
        checks["cache"] = True  # Not required

    # Determine overall status
    all_healthy = all(checks.values())

    if not all_healthy:
        response.status_code = 503

    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/metrics")
async def metrics() -> Dict[str, Any]:
    """
    Prometheus-compatible metrics endpoint.

    Returns service metrics for monitoring.
    """
    uptime_seconds = time.time() - _start_time

    return {
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        # Add more metrics as needed
    }
```

---

## 7. Configuration Management

### 7.1 Environment Configuration

**File**: `src/arc/config.py`

```python
"""
Application configuration management.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All settings can be overridden via environment variables.
    Environment variable names match field names in UPPER_SNAKE_CASE.
    """

    # ==========================================================================
    # GENERAL
    # ==========================================================================

    environment: str = Field(default="development", description="Environment name")
    debug: bool = Field(default=False, description="Enable debug mode")
    app_version: str = Field(default="1.0.0", description="Application version")

    # ==========================================================================
    # SERVER
    # ==========================================================================

    host: str = Field(default="0.0.0.0", description="Server host")
    api_port: int = Field(default=8000, description="API port")
    mcp_port: int = Field(default=3001, description="MCP server port")
    workers: int = Field(default=1, description="Number of worker processes")

    # ==========================================================================
    # DATABASE
    # ==========================================================================

    database_url: str = Field(
        default="postgresql://arc:arc@localhost:5432/arc",
        description="PostgreSQL connection URL"
    )
    database_pool_size: int = Field(default=10, description="Connection pool size")
    database_max_overflow: int = Field(default=20, description="Max overflow connections")

    # ==========================================================================
    # CACHE
    # ==========================================================================

    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    cache_ttl: int = Field(default=300, description="Default cache TTL in seconds")

    # ==========================================================================
    # AUTHENTICATION
    # ==========================================================================

    # OAuth2/OIDC
    oauth_issuer: Optional[str] = Field(default=None, description="OAuth2 issuer URL")
    oauth_audience: Optional[str] = Field(default=None, description="OAuth2 audience")
    oauth_jwks_uri: Optional[str] = Field(default=None, description="JWKS endpoint URL")

    # Internal JWT
    jwt_secret: str = Field(description="JWT signing secret")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_expiration_minutes: int = Field(default=60, description="JWT expiration")
    jwt_refresh_expiration_days: int = Field(default=7, description="Refresh token expiration")

    # ==========================================================================
    # DATA PROVIDERS
    # ==========================================================================

    eodhd_api_key: Optional[str] = Field(default=None, description="EODHD API key")
    capitaliq_api_key: Optional[str] = Field(default=None, description="Capital IQ API key")
    pitchbook_api_key: Optional[str] = Field(default=None, description="Pitchbook API key")

    # ==========================================================================
    # AI PROVIDERS
    # ==========================================================================

    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")

    # ==========================================================================
    # CORS
    # ==========================================================================

    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated CORS origins"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # ==========================================================================
    # RATE LIMITING
    # ==========================================================================

    rate_limit_default: int = Field(default=5000, description="Default rate limit per minute")
    rate_limit_burst: float = Field(default=1.2, description="Burst allowance multiplier")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
```

---

## 8. Docker Configuration

### 8.1 Dockerfile

**File**: `Dockerfile`

```dockerfile
# ARC API Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser
USER appuser

# Expose ports
EXPOSE 8000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "-m", "arc.api.app"]
```

### 8.2 Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "${API_PORT:-8000}:8000"
      - "${MCP_PORT:-3001}:3001"
    environment:
      - DATABASE_URL=postgresql://arc:arc@db:5432/arc
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=${ENVIRONMENT:-development}
      - JWT_SECRET=${JWT_SECRET}
      - EODHD_API_KEY=${EODHD_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - arc-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=arc
      - POSTGRES_PASSWORD=arc
      - POSTGRES_DB=arc
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arc"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - arc-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - arc-network

volumes:
  postgres_data:
  redis_data:

networks:
  arc-network:
    driver: bridge
```

---

## 9. Implementation Checklist

### Phase 1: Core Platform (Week 1)

- [ ] **API-001**: Create Nexus application entry point (`app.py`)
- [ ] **API-002**: Implement authentication middleware
- [ ] **API-003**: Implement tenant middleware
- [ ] **API-004**: Implement audit middleware
- [ ] **API-005**: Implement rate limit middleware
- [ ] **API-006**: Configure OAuth2/JWT authentication
- [ ] **API-007**: Define RBAC roles and permissions

### Phase 2: MCP & Tools (Week 2)

- [ ] **API-008**: Register MCP tools for portfolios
- [ ] **API-009**: Register MCP tools for analytics
- [ ] **API-010**: Register MCP tools for intelligence
- [ ] **API-011**: Test MCP tool execution

### Phase 3: Background Tasks (Week 3)

- [ ] **API-012**: Implement task scheduler
- [ ] **API-013**: Configure price sync schedule
- [ ] **API-014**: Configure NAV calculation schedule
- [ ] **API-015**: Configure alert checking schedule

### Phase 4: Monitoring & Deployment (Week 4)

- [ ] **API-016**: Implement health endpoints
- [ ] **API-017**: Configure Prometheus metrics
- [ ] **API-018**: Create Docker configuration
- [ ] **API-019**: Create Docker Compose setup
- [ ] **API-020**: Write integration tests

---

## 10. Acceptance Criteria

### Platform Configuration

- [ ] Nexus starts without blocking with DataFlow integration
- [ ] All middleware layers execute in correct order
- [ ] Authentication validates JWT and OAuth2 tokens
- [ ] Rate limiting enforces tier-based limits
- [ ] Audit logs capture all API requests

### Multi-Channel Access

- [ ] REST API accessible on configured port
- [ ] MCP server accessible on configured port
- [ ] Same workflows executable via both channels
- [ ] Unified session management across channels

### Security

- [ ] Invalid tokens rejected with 401
- [ ] Insufficient permissions rejected with 403
- [ ] Tenant isolation enforced on all requests
- [ ] Rate limit headers included in responses

### Monitoring

- [ ] Health endpoint returns correct status
- [ ] Readiness check validates dependencies
- [ ] Metrics endpoint returns valid data
- [ ] Background tasks execute on schedule
