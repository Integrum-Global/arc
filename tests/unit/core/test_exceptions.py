"""Unit tests for exception module."""

import json

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


class TestARCException:
    """Tests for base ARCException."""

    def test_default_values(self) -> None:
        """Test default exception values."""
        exc = ARCException()

        assert exc.error_code == "ARC_ERROR"
        assert exc.http_status == 500
        assert exc.message == "An unexpected error occurred"
        assert exc.details == {}

    def test_custom_message(self) -> None:
        """Test custom message overrides default."""
        exc = ARCException(message="Custom error message")

        assert exc.message == "Custom error message"
        assert str(exc) == "[ARC_ERROR] Custom error message"

    def test_custom_error_code(self) -> None:
        """Test custom error code."""
        exc = ARCException(error_code="CUSTOM_CODE")

        assert exc.error_code == "CUSTOM_CODE"
        assert "[CUSTOM_CODE]" in str(exc)

    def test_to_dict_serialization(self) -> None:
        """Test exception serializes to dict correctly."""
        exc = ARCException(
            message="Test error",
            error_code="TEST_ERROR",
            details={"key": "value"},
        )

        result = exc.to_dict()

        assert result["error"]["code"] == "TEST_ERROR"
        assert result["error"]["message"] == "Test error"
        assert result["error"]["details"] == {"key": "value"}

    def test_json_serializable(self) -> None:
        """Test exception dict is JSON serializable."""
        exc = ARCException(message="Test", details={"nested": {"data": 123}})

        # Should not raise
        json_str = json.dumps(exc.to_dict())
        assert "Test" in json_str

    def test_repr(self) -> None:
        """Test exception repr."""
        exc = ARCException(message="Test error", error_code="TEST")

        assert "ARCException" in repr(exc)
        assert "Test error" in repr(exc)


class TestValidationError:
    """Tests for ValidationError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 400."""
        exc = ValidationError()

        assert exc.http_status == 400
        assert exc.error_code == "VALIDATION_ERROR"

    def test_field_errors(self) -> None:
        """Test field-level error tracking."""
        field_errors = {
            "email": ["Invalid email format"],
            "password": ["Too short", "Must contain a number"],
        }
        exc = ValidationError(
            message="Validation failed",
            field_errors=field_errors,
        )

        assert exc.field_errors == field_errors
        assert exc.details["field_errors"] == field_errors


class TestNotFoundError:
    """Tests for NotFoundError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 404."""
        exc = NotFoundError(resource_type="Portfolio")

        assert exc.http_status == 404
        assert exc.error_code == "NOT_FOUND"

    def test_resource_info_in_message(self) -> None:
        """Test resource info appears in message."""
        exc = NotFoundError(resource_type="Portfolio", resource_id="pf-123")

        assert "Portfolio" in exc.message
        assert "pf-123" in exc.message
        assert exc.resource_type == "Portfolio"
        assert exc.resource_id == "pf-123"

    def test_without_resource_id(self) -> None:
        """Test message without resource ID."""
        exc = NotFoundError(resource_type="User")

        assert exc.message == "User not found"


class TestAuthenticationError:
    """Tests for AuthenticationError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 401."""
        exc = AuthenticationError()

        assert exc.http_status == 401
        assert exc.error_code == "AUTHENTICATION_ERROR"

    def test_auth_type_tracking(self) -> None:
        """Test authentication type is tracked."""
        exc = AuthenticationError(
            message="Invalid token",
            auth_type="bearer",
        )

        assert exc.auth_type == "bearer"
        assert exc.details["auth_type"] == "bearer"


class TestAuthorizationError:
    """Tests for AuthorizationError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 403."""
        exc = AuthorizationError()

        assert exc.http_status == 403
        assert exc.error_code == "AUTHORIZATION_ERROR"

    def test_permission_tracking(self) -> None:
        """Test permission info is tracked."""
        exc = AuthorizationError(
            message="Access denied",
            required_permission="admin:write",
            user_permissions=["user:read", "user:write"],
        )

        assert exc.required_permission == "admin:write"
        assert exc.user_permissions == ["user:read", "user:write"]


class TestIntegrationError:
    """Tests for IntegrationError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 502."""
        exc = IntegrationError(provider="EODHD")

        assert exc.http_status == 502
        assert exc.error_code == "INTEGRATION_ERROR"

    def test_provider_tracking(self) -> None:
        """Test provider details are tracked."""
        exc = IntegrationError(
            provider="Capital IQ",
            operation="fetch_fundamentals",
            response_code=503,
            retry_after=60,
        )

        assert exc.provider == "Capital IQ"
        assert exc.operation == "fetch_fundamentals"
        assert exc.response_code == 503
        assert exc.retry_after == 60

    def test_default_message_includes_provider(self) -> None:
        """Test default message mentions provider."""
        exc = IntegrationError(provider="EODHD")

        assert "EODHD" in exc.message


class TestConfigurationError:
    """Tests for ConfigurationError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 500."""
        exc = ConfigurationError()

        assert exc.http_status == 500
        assert exc.error_code == "CONFIGURATION_ERROR"

    def test_missing_key_tracking(self) -> None:
        """Test missing key is tracked."""
        exc = ConfigurationError(
            message="Missing required configuration",
            missing_key="DB_PASSWORD",
        )

        assert exc.missing_key == "DB_PASSWORD"


class TestDatabaseError:
    """Tests for DatabaseError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 500."""
        exc = DatabaseError()

        assert exc.http_status == 500
        assert exc.error_code == "DATABASE_ERROR"

    def test_operation_tracking(self) -> None:
        """Test database operation details are tracked."""
        exc = DatabaseError(
            message="Constraint violation",
            operation="insert",
            table="portfolios",
            constraint="unique_portfolio_code",
        )

        assert exc.operation == "insert"
        assert exc.table == "portfolios"
        assert exc.constraint == "unique_portfolio_code"


class TestRateLimitError:
    """Tests for RateLimitError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 429."""
        exc = RateLimitError()

        assert exc.http_status == 429
        assert exc.error_code == "RATE_LIMIT_ERROR"

    def test_retry_info(self) -> None:
        """Test retry information is tracked."""
        exc = RateLimitError(
            message="Too many requests",
            retry_after=60,
            limit=100,
        )

        assert exc.retry_after == 60
        assert exc.limit == 100


class TestWorkflowError:
    """Tests for WorkflowError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 500."""
        exc = WorkflowError()

        assert exc.http_status == 500
        assert exc.error_code == "WORKFLOW_ERROR"

    def test_workflow_tracking(self) -> None:
        """Test workflow details are tracked."""
        exc = WorkflowError(
            message="Node execution failed",
            workflow_id="sync-prices",
            node_id="fetch-eodhd",
            run_id="run-123",
        )

        assert exc.workflow_id == "sync-prices"
        assert exc.node_id == "fetch-eodhd"
        assert exc.run_id == "run-123"


class TestConflictError:
    """Tests for ConflictError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 409."""
        exc = ConflictError()

        assert exc.http_status == 409
        assert exc.error_code == "CONFLICT_ERROR"

    def test_conflict_tracking(self) -> None:
        """Test conflict details are tracked."""
        exc = ConflictError(
            message="Duplicate portfolio code",
            resource_type="Portfolio",
            conflict_field="code",
        )

        assert exc.resource_type == "Portfolio"
        assert exc.conflict_field == "code"


class TestServiceUnavailableError:
    """Tests for ServiceUnavailableError."""

    def test_http_status(self) -> None:
        """Test HTTP status is 503."""
        exc = ServiceUnavailableError()

        assert exc.http_status == 503
        assert exc.error_code == "SERVICE_UNAVAILABLE"

    def test_service_tracking(self) -> None:
        """Test service details are tracked."""
        exc = ServiceUnavailableError(
            message="Database unavailable",
            service="PostgreSQL",
            retry_after=30,
        )

        assert exc.service == "PostgreSQL"
        assert exc.retry_after == 30


class TestExceptionInheritance:
    """Tests for exception inheritance hierarchy."""

    def test_all_inherit_from_arc_exception(self) -> None:
        """Test all exceptions inherit from ARCException."""
        exceptions = [
            ValidationError(),
            NotFoundError(resource_type="Test"),
            AuthenticationError(),
            AuthorizationError(),
            IntegrationError(provider="Test"),
            ConfigurationError(),
            DatabaseError(),
            RateLimitError(),
            WorkflowError(),
            ConflictError(),
            ServiceUnavailableError(),
        ]

        for exc in exceptions:
            assert isinstance(exc, ARCException)

    def test_all_have_to_dict(self) -> None:
        """Test all exceptions have to_dict method."""
        exceptions = [
            ValidationError(message="Test"),
            NotFoundError(resource_type="Test"),
            IntegrationError(provider="Test"),
        ]

        for exc in exceptions:
            result = exc.to_dict()
            assert "error" in result
            assert "code" in result["error"]
            assert "message" in result["error"]
