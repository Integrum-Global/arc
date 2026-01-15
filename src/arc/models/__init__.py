"""
DataFlow models for ARC investment platform.

This package contains all database models defined using Kailash DataFlow.
Each model automatically generates CRUD workflow nodes for database operations.

Submodules:
    - database: DataFlow initialization and lifespan management
    - core: Core domain models (User, Tenant, Preferences)
    - portfolio: Portfolio domain models (Portfolio, Holding, Transaction)
    - security: Security domain models (Security, Price, Fundamentals)
    - analytics: Analytics domain models (Alert, Ratio, Report)

CRITICAL RULES:
    - NEVER manually set created_at or updated_at - DataFlow manages these
    - Primary key MUST be named 'id' - not user_id, tenant_id, etc.
    - CreateNode uses FLAT fields, UpdateNode uses NESTED filter+fields
    - soft_delete only affects DeleteNode - manually filter deleted_at in ListNode
"""

# Core models
# Analytics models
from arc.models.analytics import (
    Alert,
    AlertThreshold,
    PeerGroup,
    Report,
    Watchlist,
    WatchlistItem,
)
from arc.models.core import (
    AuditLog,
    Notification,
    NotificationPreference,
    Tenant,
    User,
    UserPreference,
)

# Database initialization
from arc.models.database import (
    close_database,
    create_tables,
    database_lifespan,
    db,
)

# Portfolio models
from arc.models.portfolio import (
    Benchmark,
    CashAccount,
    Holding,
    Portfolio,
    PortfolioValuation,
    Transaction,
)

# Security models
from arc.models.security import (
    CompanyFundamentals,
    CorporateAction,
    Dividend,
    PriceHistory,
    Security,
    SecurityRatio,
)

# SSO models
from arc.models.sso import (
    LinkedAccount,
    SSOProvider,
)

__all__ = [
    # Database
    "db",
    "create_tables",
    "close_database",
    "database_lifespan",
    # Core Models
    "Tenant",
    "User",
    "UserPreference",
    "NotificationPreference",
    "Notification",
    "AuditLog",
    # Portfolio Models
    "Portfolio",
    "Holding",
    "Transaction",
    "PortfolioValuation",
    "CashAccount",
    "Benchmark",
    # Security Models
    "Security",
    "PriceHistory",
    "CompanyFundamentals",
    "SecurityRatio",
    "CorporateAction",
    "Dividend",
    # Analytics Models
    "Alert",
    "AlertThreshold",
    "PeerGroup",
    "Report",
    "Watchlist",
    "WatchlistItem",
    # SSO Models
    "SSOProvider",
    "LinkedAccount",
]
