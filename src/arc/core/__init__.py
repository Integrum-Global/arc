"""
Core utilities and shared components.

This package contains foundational components used across the ARC platform:
configuration management, exception handling, constants, and shared utilities.

Submodules:
    - config: Application configuration and settings
    - exceptions: Custom exception hierarchy
    - constants: Enums and constant values
"""

from arc.core.config import (
    APIConfig,
    DatabaseConfig,
    KaizenConfig,
    LoggingConfig,
    ProviderConfig,
    RedisConfig,
    Settings,
    get_settings,
    settings,
)
from arc.core.constants import (
    CACHE_TTL_LONG,
    CACHE_TTL_MARKET_DATA,
    CACHE_TTL_MEDIUM,
    CACHE_TTL_SHORT,
    DATE_FORMAT,
    DATETIME_FORMAT,
    DATETIME_FORMAT_MS,
    DEFAULT_CURRENCY,
    DEFAULT_PAGE_SIZE,
    DEFAULT_RISK_FREE_RATE,
    MAX_PAGE_SIZE,
    RATE_LIMIT_DEFAULT,
    RATE_LIMIT_HEAVY,
    TRADING_DAYS_PER_YEAR,
    AlertSeverity,
    AlertType,
    AssetClass,
    Currency,
    DataProvider,
    MarketStatus,
    OrderStatus,
    OrderType,
    PortfolioType,
    RatioClass,
    ReportType,
    SecurityType,
    SyncStatus,
    TimeHorizon,
    TransactionType,
    UserRole,
)
from arc.core.exceptions import (
    ARCException,
    AuthenticationError,
    AuthorizationError,
    ConfigurationError,
    ConflictError,
    DatabaseError,
    IntegrationError,
    NotFoundError,
    RateLimitError,
    ServiceUnavailableError,
    ValidationError,
    WorkflowError,
)

__all__ = [
    # Config
    "settings",
    "get_settings",
    "Settings",
    "DatabaseConfig",
    "RedisConfig",
    "APIConfig",
    "ProviderConfig",
    "KaizenConfig",
    "LoggingConfig",
    # Exceptions
    "ARCException",
    "ValidationError",
    "NotFoundError",
    "AuthenticationError",
    "AuthorizationError",
    "IntegrationError",
    "ConfigurationError",
    "DatabaseError",
    "RateLimitError",
    "WorkflowError",
    "ConflictError",
    "ServiceUnavailableError",
    # Enums
    "PortfolioType",
    "TransactionType",
    "AlertSeverity",
    "AlertType",
    "RatioClass",
    "UserRole",
    "AssetClass",
    "SecurityType",
    "MarketStatus",
    "DataProvider",
    "SyncStatus",
    "Currency",
    "TimeHorizon",
    "ReportType",
    "OrderStatus",
    "OrderType",
    # Constants
    "DEFAULT_PAGE_SIZE",
    "MAX_PAGE_SIZE",
    "CACHE_TTL_SHORT",
    "CACHE_TTL_MEDIUM",
    "CACHE_TTL_LONG",
    "CACHE_TTL_MARKET_DATA",
    "RATE_LIMIT_DEFAULT",
    "RATE_LIMIT_HEAVY",
    "DATE_FORMAT",
    "DATETIME_FORMAT",
    "DATETIME_FORMAT_MS",
    "TRADING_DAYS_PER_YEAR",
    "DEFAULT_RISK_FREE_RATE",
    "DEFAULT_CURRENCY",
]
