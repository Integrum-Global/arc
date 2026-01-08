"""
Service Registry for dependency injection.

Provides a centralized access point for all ARC services with:
- Lazy loading to prevent unnecessary initialization
- Tenant context propagation
- Consistent service instantiation

Usage:
    from arc.services import create_services
    from arc.models.database import db

    services = create_services(db)
    tenant_services = services.with_tenant("tenant-123")
    portfolio = await tenant_services.portfolio.get_portfolio("port-001")
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from dataflow import DataFlow

    from arc.services.base import BaseService


class ServiceRegistry:
    """
    Central registry for all ARC services.

    Provides lazy-loaded access to service instances with automatic
    tenant and user context propagation.

    Services are instantiated on first access and cached for reuse.
    Creating a new registry with_tenant() creates a new registry
    with fresh service instances.

    Attributes:
        db: DataFlow instance for database operations
        tenant_id: Current tenant context (if set)
        user_id: Current user context (if set)
    """

    def __init__(
        self,
        db: "DataFlow",
        tenant_id: str | None = None,
        user_id: str | None = None,
    ):
        """
        Initialize the service registry.

        Args:
            db: DataFlow instance for database operations
            tenant_id: Optional tenant context
            user_id: Optional user context
        """
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id

        # Lazy-loaded service instances
        self._portfolio: BaseService | None = None
        self._analytics: BaseService | None = None
        self._intelligence: BaseService | None = None
        self._notification: BaseService | None = None
        self._integration: BaseService | None = None
        self._user: BaseService | None = None
        self._security: BaseService | None = None
        self._report: BaseService | None = None

    def with_tenant(self, tenant_id: str) -> "ServiceRegistry":
        """
        Create a new registry with tenant context.

        Creates a fresh registry with all services uninstantiated.
        The new registry will create service instances with the
        specified tenant context on first access.

        Args:
            tenant_id: The tenant ID to set as context

        Returns:
            New ServiceRegistry with tenant context
        """
        return ServiceRegistry(
            db=self.db,
            tenant_id=tenant_id,
            user_id=self.user_id,
        )

    def with_user(self, user_id: str) -> "ServiceRegistry":
        """
        Create a new registry with user context.

        Args:
            user_id: The user ID to set as context

        Returns:
            New ServiceRegistry with user context
        """
        return ServiceRegistry(
            db=self.db,
            tenant_id=self.tenant_id,
            user_id=user_id,
        )

    def with_context(
        self,
        tenant_id: str | None = None,
        user_id: str | None = None,
    ) -> "ServiceRegistry":
        """
        Create a new registry with both tenant and user context.

        Args:
            tenant_id: Optional tenant ID to set
            user_id: Optional user ID to set

        Returns:
            New ServiceRegistry with context
        """
        return ServiceRegistry(
            db=self.db,
            tenant_id=tenant_id or self.tenant_id,
            user_id=user_id or self.user_id,
        )

    @property
    def portfolio(self) -> "BaseService":
        """
        Get the portfolio service instance.

        Lazy-loads the PortfolioService on first access.

        Returns:
            PortfolioService instance with current context
        """
        if self._portfolio is None:
            from arc.services.portfolio_service import PortfolioService

            self._portfolio = PortfolioService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._portfolio

    @property
    def analytics(self) -> "BaseService":
        """
        Get the analytics service instance.

        Lazy-loads the AnalyticsService on first access.

        Returns:
            AnalyticsService instance with current context
        """
        if self._analytics is None:
            from arc.services.analytics_service import AnalyticsService

            self._analytics = AnalyticsService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._analytics

    @property
    def intelligence(self) -> "BaseService":
        """
        Get the intelligence service instance.

        Lazy-loads the IntelligenceService on first access.

        Returns:
            IntelligenceService instance with current context
        """
        if self._intelligence is None:
            from arc.services.intelligence import IntelligenceService

            self._intelligence = IntelligenceService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._intelligence

    @property
    def notification(self) -> "BaseService":
        """
        Get the notification service instance.

        Lazy-loads the NotificationService on first access.

        Returns:
            NotificationService instance with current context
        """
        if self._notification is None:
            from arc.services.notification_service import NotificationService

            self._notification = NotificationService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._notification

    @property
    def integration(self) -> "BaseService":
        """
        Get the integration service instance.

        Lazy-loads the IntegrationService on first access.

        Returns:
            IntegrationService instance with current context
        """
        if self._integration is None:
            from arc.services.integration import IntegrationService

            self._integration = IntegrationService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._integration

    @property
    def user(self) -> "BaseService":
        """
        Get the user service instance.

        Lazy-loads the UserService on first access.

        Returns:
            UserService instance with current context
        """
        if self._user is None:
            from arc.services.user import UserService

            self._user = UserService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._user

    @property
    def security(self) -> "BaseService":
        """
        Get the security/instrument service instance.

        Lazy-loads the SecurityService on first access.
        Note: This is for securities/instruments, not authentication.

        Returns:
            SecurityService instance with current context
        """
        if self._security is None:
            from arc.services.security import SecurityService

            self._security = SecurityService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._security

    @property
    def report(self) -> "BaseService":
        """
        Get the report service instance.

        Lazy-loads the ReportService on first access.

        Returns:
            ReportService instance with current context
        """
        if self._report is None:
            from arc.services.report import ReportService

            self._report = ReportService(
                db=self.db,
                tenant_id=self.tenant_id,
                user_id=self.user_id,
            )
        return self._report


def create_services(
    db: "DataFlow",
    tenant_id: str | None = None,
    user_id: str | None = None,
) -> ServiceRegistry:
    """
    Create a service registry with optional context.

    Convenience function for creating a ServiceRegistry instance.

    Args:
        db: DataFlow instance for database operations
        tenant_id: Optional tenant context
        user_id: Optional user context

    Returns:
        ServiceRegistry instance

    Example:
        from arc.services import create_services
        from arc.models.database import db

        # Create registry without context
        services = create_services(db)

        # Set tenant context for subsequent operations
        tenant_services = services.with_tenant("tenant-123")

        # Or create with context directly
        services = create_services(db, tenant_id="tenant-123", user_id="user-456")
    """
    return ServiceRegistry(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
    )
