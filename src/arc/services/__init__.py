"""
Business services layer for ARC.

This package contains service classes that encapsulate business logic.
Services use DataFlow Express for simple CRUD and workflows for complex operations.

Submodules:
    - base: Base service class with tenant context management
    - registry: Service registry for dependency injection
    - portfolio: Portfolio management service
    - analytics: Analytics and reporting service
    - intelligence: AI-powered intelligence service

Usage:
    from arc.services import create_services
    from arc.models.database import db

    # Create service registry
    services = create_services(db)

    # Set tenant context
    tenant_services = services.with_tenant("tenant-123")

    # Use services
    portfolio = await tenant_services.portfolio.get_portfolio("port-001")
"""

from arc.services.analytics_service import AnalyticsService
from arc.services.base import (
    BaseService,
    ConflictError,
    NotFoundError,
    ServiceError,
    ValidationError,
    service_operation,
)
from arc.services.intelligence import (
    IntelligenceConfig,
    IntelligenceService,
    UsageRecord,
)
from arc.services.notification_service import (
    NotificationConfig,
    NotificationService,
)
from arc.services.portfolio_service import PortfolioService
from arc.services.registry import ServiceRegistry, create_services
from arc.services.sync_service import SyncService

__all__ = [
    # Base classes
    "BaseService",
    "service_operation",
    # Exceptions
    "ServiceError",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    # Services
    "AnalyticsService",
    "IntelligenceService",
    "IntelligenceConfig",
    "NotificationService",
    "NotificationConfig",
    "PortfolioService",
    "SyncService",
    "UsageRecord",
    # Registry
    "ServiceRegistry",
    "create_services",
]
