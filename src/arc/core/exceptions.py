"""
Custom exception hierarchy for the ARC platform.

All exceptions inherit from ARCException and provide:
- Error codes for API responses
- HTTP status code mapping
- Serialization for JSON API responses
- Context information for debugging
"""

from typing import Any


class ARCException(Exception):
    """Base exception for all ARC platform errors."""

    error_code: str = "ARC_ERROR"
    http_status: int = 500
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: str | None = None,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.message
        self.error_code = error_code or self.error_code
        self.details = details or {}
        super().__init__(self.message)

    def __str__(self) -> str:
        return f"[{self.error_code}] {self.message}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(message={self.message!r}, error_code={self.error_code!r})"
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize exception for API responses."""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details,
            }
        }


class ValidationError(ARCException):
    """Input validation failed."""

    error_code = "VALIDATION_ERROR"
    http_status = 400
    message = "Validation failed"

    def __init__(
        self,
        message: str | None = None,
        field_errors: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message=message, details={"field_errors": field_errors or {}})
        self.field_errors = field_errors or {}


class NotFoundError(ARCException):
    """Requested resource was not found."""

    error_code = "NOT_FOUND"
    http_status = 404
    message = "Resource not found"

    def __init__(
        self,
        resource_type: str,
        resource_id: str | None = None,
        message: str | None = None,
    ) -> None:
        default_msg = f"{resource_type} not found"
        if resource_id:
            default_msg = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(
            message=message or default_msg,
            details={"resource_type": resource_type, "resource_id": resource_id},
        )
        self.resource_type = resource_type
        self.resource_id = resource_id


class AuthenticationError(ARCException):
    """Authentication failed."""

    error_code = "AUTHENTICATION_ERROR"
    http_status = 401
    message = "Authentication required"

    def __init__(
        self,
        message: str | None = None,
        auth_type: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={"auth_type": auth_type} if auth_type else {},
        )
        self.auth_type = auth_type


class AuthorizationError(ARCException):
    """User lacks required permissions."""

    error_code = "AUTHORIZATION_ERROR"
    http_status = 403
    message = "Permission denied"

    def __init__(
        self,
        message: str | None = None,
        required_permission: str | None = None,
        user_permissions: list[str] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "required_permission": required_permission,
                "user_permissions": user_permissions or [],
            },
        )
        self.required_permission = required_permission
        self.user_permissions = user_permissions or []


class IntegrationError(ARCException):
    """External service integration failed."""

    error_code = "INTEGRATION_ERROR"
    http_status = 502
    message = "External service error"

    def __init__(
        self,
        provider: str,
        message: str | None = None,
        operation: str | None = None,
        response_code: int | None = None,
        retry_after: int | None = None,
    ) -> None:
        default_msg = f"Error communicating with {provider}"
        super().__init__(
            message=message or default_msg,
            details={
                "provider": provider,
                "operation": operation,
                "response_code": response_code,
                "retry_after": retry_after,
            },
        )
        self.provider = provider
        self.operation = operation
        self.response_code = response_code
        self.retry_after = retry_after


class ConfigurationError(ARCException):
    """Application configuration error."""

    error_code = "CONFIGURATION_ERROR"
    http_status = 500
    message = "Configuration error"

    def __init__(
        self,
        message: str | None = None,
        missing_key: str | None = None,
        invalid_value: Any = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "missing_key": missing_key,
                "invalid_value": str(invalid_value) if invalid_value else None,
            },
        )
        self.missing_key = missing_key
        self.invalid_value = invalid_value


class DatabaseError(ARCException):
    """Database operation failed."""

    error_code = "DATABASE_ERROR"
    http_status = 500
    message = "Database operation failed"

    def __init__(
        self,
        message: str | None = None,
        operation: str | None = None,
        table: str | None = None,
        constraint: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "operation": operation,
                "table": table,
                "constraint": constraint,
            },
        )
        self.operation = operation
        self.table = table
        self.constraint = constraint


class RateLimitError(ARCException):
    """Rate limit exceeded."""

    error_code = "RATE_LIMIT_ERROR"
    http_status = 429
    message = "Rate limit exceeded"

    def __init__(
        self,
        message: str | None = None,
        retry_after: int | None = None,
        limit: int | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "retry_after": retry_after,
                "limit": limit,
            },
        )
        self.retry_after = retry_after
        self.limit = limit


class WorkflowError(ARCException):
    """Kailash workflow execution failed."""

    error_code = "WORKFLOW_ERROR"
    http_status = 500
    message = "Workflow execution failed"

    def __init__(
        self,
        message: str | None = None,
        workflow_id: str | None = None,
        node_id: str | None = None,
        run_id: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "workflow_id": workflow_id,
                "node_id": node_id,
                "run_id": run_id,
            },
        )
        self.workflow_id = workflow_id
        self.node_id = node_id
        self.run_id = run_id


class ConflictError(ARCException):
    """Resource conflict (e.g., duplicate entry)."""

    error_code = "CONFLICT_ERROR"
    http_status = 409
    message = "Resource conflict"

    def __init__(
        self,
        message: str | None = None,
        resource_type: str | None = None,
        conflict_field: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "resource_type": resource_type,
                "conflict_field": conflict_field,
            },
        )
        self.resource_type = resource_type
        self.conflict_field = conflict_field


class ServiceUnavailableError(ARCException):
    """Service temporarily unavailable."""

    error_code = "SERVICE_UNAVAILABLE"
    http_status = 503
    message = "Service temporarily unavailable"

    def __init__(
        self,
        message: str | None = None,
        service: str | None = None,
        retry_after: int | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details={
                "service": service,
                "retry_after": retry_after,
            },
        )
        self.service = service
        self.retry_after = retry_after
