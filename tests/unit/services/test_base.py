"""Unit tests for base service and service registry.

These tests verify:
- BaseService tenant context management
- ServiceRegistry lazy loading
- with_tenant() and with_context() methods
- Service exports
"""

from unittest.mock import MagicMock


class TestBaseService:
    """Tests for BaseService class."""

    def test_base_service_has_required_attributes(self) -> None:
        """Test BaseService has required attributes."""
        from arc.services.base import BaseService

        # BaseService is abstract, so we check its interface
        assert hasattr(BaseService, "__init__")
        assert hasattr(BaseService, "with_tenant")
        assert hasattr(BaseService, "with_user")
        assert hasattr(BaseService, "with_context")
        assert hasattr(BaseService, "execute_workflow")
        assert hasattr(BaseService, "generate_id")
        assert hasattr(BaseService, "runtime")

    def test_base_service_init_stores_context(self) -> None:
        """Test BaseService init stores db and context."""
        from arc.services.base import BaseService

        # Create a concrete subclass for testing
        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db, tenant_id="tenant-123", user_id="user-456")

        assert service.db is mock_db
        assert service.tenant_id == "tenant-123"
        assert service.user_id == "user-456"

    def test_base_service_with_tenant_creates_new_instance(self) -> None:
        """Test with_tenant creates new instance with tenant context."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db)

        # Create new service with tenant
        tenant_service = service.with_tenant("tenant-123")

        # Should be new instance
        assert tenant_service is not service
        # Should have tenant set
        assert tenant_service.tenant_id == "tenant-123"
        # Original should not have tenant
        assert service.tenant_id is None
        # Should share db
        assert tenant_service.db is mock_db

    def test_base_service_with_user_creates_new_instance(self) -> None:
        """Test with_user creates new instance with user context."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db)

        user_service = service.with_user("user-456")

        assert user_service is not service
        assert user_service.user_id == "user-456"
        assert service.user_id is None

    def test_base_service_with_context_sets_both(self) -> None:
        """Test with_context sets both tenant and user."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db)

        context_service = service.with_context(tenant_id="tenant-123", user_id="user-456")

        assert context_service.tenant_id == "tenant-123"
        assert context_service.user_id == "user-456"

    def test_base_service_with_context_preserves_existing(self) -> None:
        """Test with_context preserves existing context if not overridden."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db, tenant_id="tenant-123")

        # Only set user, should preserve tenant
        context_service = service.with_context(user_id="user-456")

        assert context_service.tenant_id == "tenant-123"
        assert context_service.user_id == "user-456"

    def test_base_service_has_logger(self) -> None:
        """Test BaseService has logger with correct name."""
        from arc.services.base import BaseService

        class MyCustomService(BaseService):
            pass

        mock_db = MagicMock()
        service = MyCustomService(db=mock_db)

        assert service.logger is not None
        assert "MyCustomService" in service.logger.name

    def test_base_service_generate_id_without_prefix(self) -> None:
        """Test generate_id without prefix returns UUID."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db)

        id1 = service.generate_id()
        id2 = service.generate_id()

        # Should be unique
        assert id1 != id2
        # Should be UUID format (36 chars with dashes)
        assert len(id1) == 36

    def test_base_service_generate_id_with_prefix(self) -> None:
        """Test generate_id with prefix."""
        from arc.services.base import BaseService

        class TestService(BaseService):
            pass

        mock_db = MagicMock()
        service = TestService(db=mock_db)

        generated_id = service.generate_id(prefix="port-")

        assert generated_id.startswith("port-")
        # prefix (5) + UUID (36) = 41
        assert len(generated_id) == 41


class TestServiceErrors:
    """Tests for service error classes."""

    def test_service_error_has_required_attributes(self) -> None:
        """Test ServiceError has required attributes."""
        from arc.services.base import ServiceError

        error = ServiceError(
            "Test error",
            service="TestService",
            operation="test_op",
            details={"key": "value"},
        )

        assert error.message == "Test error"
        assert error.service == "TestService"
        assert error.operation == "test_op"
        assert error.details == {"key": "value"}

    def test_service_error_to_dict(self) -> None:
        """Test ServiceError to_dict method."""
        from arc.services.base import ServiceError

        error = ServiceError(
            "Test error",
            service="TestService",
            operation="test_op",
            details={"key": "value"},
        )

        error_dict = error.to_dict()

        assert error_dict["error"] == "Test error"
        assert error_dict["service"] == "TestService"
        assert error_dict["operation"] == "test_op"
        assert error_dict["details"] == {"key": "value"}

    def test_not_found_error_is_service_error(self) -> None:
        """Test NotFoundError is a ServiceError."""
        from arc.services.base import NotFoundError, ServiceError

        error = NotFoundError("Resource not found")

        assert isinstance(error, ServiceError)

    def test_validation_error_is_service_error(self) -> None:
        """Test ValidationError is a ServiceError."""
        from arc.services.base import ServiceError, ValidationError

        error = ValidationError("Invalid input")

        assert isinstance(error, ServiceError)

    def test_conflict_error_is_service_error(self) -> None:
        """Test ConflictError is a ServiceError."""
        from arc.services.base import ConflictError, ServiceError

        error = ConflictError("Resource already exists")

        assert isinstance(error, ServiceError)


class TestServiceRegistry:
    """Tests for ServiceRegistry class."""

    def test_registry_has_required_attributes(self) -> None:
        """Test ServiceRegistry has required attributes."""
        from arc.services.registry import ServiceRegistry

        assert hasattr(ServiceRegistry, "__init__")
        assert hasattr(ServiceRegistry, "with_tenant")
        assert hasattr(ServiceRegistry, "with_user")
        assert hasattr(ServiceRegistry, "with_context")
        assert hasattr(ServiceRegistry, "portfolio")
        assert hasattr(ServiceRegistry, "analytics")
        assert hasattr(ServiceRegistry, "intelligence")

    def test_registry_init_stores_context(self) -> None:
        """Test ServiceRegistry init stores db and context."""
        from arc.services.registry import ServiceRegistry

        mock_db = MagicMock()
        registry = ServiceRegistry(db=mock_db, tenant_id="tenant-123", user_id="user-456")

        assert registry.db is mock_db
        assert registry.tenant_id == "tenant-123"
        assert registry.user_id == "user-456"

    def test_registry_with_tenant_creates_new_instance(self) -> None:
        """Test with_tenant creates new registry with tenant context."""
        from arc.services.registry import ServiceRegistry

        mock_db = MagicMock()
        registry = ServiceRegistry(db=mock_db)

        tenant_registry = registry.with_tenant("tenant-123")

        assert tenant_registry is not registry
        assert tenant_registry.tenant_id == "tenant-123"
        assert registry.tenant_id is None
        assert tenant_registry.db is mock_db

    def test_registry_with_user_creates_new_instance(self) -> None:
        """Test with_user creates new registry with user context."""
        from arc.services.registry import ServiceRegistry

        mock_db = MagicMock()
        registry = ServiceRegistry(db=mock_db)

        user_registry = registry.with_user("user-456")

        assert user_registry is not registry
        assert user_registry.user_id == "user-456"
        assert registry.user_id is None

    def test_registry_with_context_sets_both(self) -> None:
        """Test with_context sets both tenant and user."""
        from arc.services.registry import ServiceRegistry

        mock_db = MagicMock()
        registry = ServiceRegistry(db=mock_db)

        context_registry = registry.with_context(tenant_id="tenant-123", user_id="user-456")

        assert context_registry.tenant_id == "tenant-123"
        assert context_registry.user_id == "user-456"

    def test_registry_services_initially_none(self) -> None:
        """Test registry services are initially None (lazy loading)."""
        from arc.services.registry import ServiceRegistry

        mock_db = MagicMock()
        registry = ServiceRegistry(db=mock_db)

        # Private attributes should be None
        assert registry._portfolio is None
        assert registry._analytics is None
        assert registry._intelligence is None
        assert registry._integration is None
        assert registry._user is None
        assert registry._security is None
        assert registry._report is None


class TestCreateServices:
    """Tests for create_services function."""

    def test_create_services_returns_registry(self) -> None:
        """Test create_services returns ServiceRegistry."""
        from arc.services import ServiceRegistry, create_services

        mock_db = MagicMock()
        registry = create_services(db=mock_db)

        assert isinstance(registry, ServiceRegistry)

    def test_create_services_with_context(self) -> None:
        """Test create_services with tenant and user context."""
        from arc.services import create_services

        mock_db = MagicMock()
        registry = create_services(db=mock_db, tenant_id="tenant-123", user_id="user-456")

        assert registry.tenant_id == "tenant-123"
        assert registry.user_id == "user-456"

    def test_create_services_without_context(self) -> None:
        """Test create_services without context."""
        from arc.services import create_services

        mock_db = MagicMock()
        registry = create_services(db=mock_db)

        assert registry.tenant_id is None
        assert registry.user_id is None


class TestServiceExports:
    """Tests for service module exports."""

    def test_base_service_exported(self) -> None:
        """Test BaseService is exported from arc.services."""
        from arc.services import BaseService

        assert BaseService is not None

    def test_service_registry_exported(self) -> None:
        """Test ServiceRegistry is exported from arc.services."""
        from arc.services import ServiceRegistry

        assert ServiceRegistry is not None

    def test_create_services_exported(self) -> None:
        """Test create_services is exported from arc.services."""
        from arc.services import create_services

        assert create_services is not None

    def test_service_errors_exported(self) -> None:
        """Test service errors are exported from arc.services."""
        from arc.services import ConflictError, NotFoundError, ServiceError, ValidationError

        assert ServiceError is not None
        assert NotFoundError is not None
        assert ValidationError is not None
        assert ConflictError is not None

    def test_service_operation_decorator_exported(self) -> None:
        """Test service_operation decorator is exported from arc.services."""
        from arc.services import service_operation

        assert service_operation is not None
