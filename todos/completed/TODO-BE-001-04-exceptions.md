# TODO-BE-001-04: Exception Handling Module

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 45m
**Dependencies**: TODO-BE-001-01 (Project Structure)

---

## Objective

Create a comprehensive exception hierarchy for the ARC platform that provides clear, actionable error information for debugging and API responses.

---

## Description

Implement `src/arc/core/exceptions.py` with a structured exception hierarchy. All exceptions should:
- Inherit from a common base class `ARCException`
- Include error codes for API responses
- Provide helpful error messages
- Support serialization for JSON API responses
- Include context information for debugging

---

## Acceptance Criteria

- [ ] `src/arc/core/exceptions.py` exists with all exception classes
- [ ] `ARCException` base class with error code and message
- [ ] `ValidationError` for input validation failures
- [ ] `NotFoundError` for missing resources
- [ ] `AuthenticationError` for auth failures
- [ ] `AuthorizationError` for permission denied
- [ ] `IntegrationError` for external service failures
- [ ] All exceptions have proper `__str__` and `to_dict()` methods
- [ ] Unit test passes for exception handling

---

## Subtasks

- [ ] Create `ARCException` base class (Est: 10m)
  - error_code, message, details fields
  - HTTP status code mapping
  - to_dict() serialization method
  - Verification: Exception can be raised and caught

- [ ] Create `ValidationError` class (Est: 5m)
  - field_errors for per-field validation errors
  - HTTP 400 status code
  - Verification: Field-level errors captured

- [ ] Create `NotFoundError` class (Est: 5m)
  - resource_type and resource_id fields
  - HTTP 404 status code
  - Verification: Resource info in error message

- [ ] Create `AuthenticationError` class (Est: 5m)
  - auth_type field (bearer, api_key, etc.)
  - HTTP 401 status code
  - Verification: Auth type in error message

- [ ] Create `AuthorizationError` class (Est: 5m)
  - required_permission and user_permissions fields
  - HTTP 403 status code
  - Verification: Permission info in error message

- [ ] Create `IntegrationError` class (Est: 10m)
  - provider, operation, response_code fields
  - HTTP 502/503 status codes
  - retry_after suggestion
  - Verification: Provider details captured

- [ ] Create `ConfigurationError` class (Est: 5m)
  - missing_key, invalid_value fields
  - For startup/configuration failures
  - Verification: Config issue clearly identified

- [ ] Create `DatabaseError` class (Est: 5m)
  - operation, table, constraint fields
  - For DataFlow/database failures
  - Verification: DB operation context captured

- [ ] Update `src/arc/core/__init__.py` exports (Est: 5m)
  - Export all exception classes
  - Verification: `from arc.core import ARCException`

---

## Exception Class Structure

```python
# src/arc/core/exceptions.py

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
```

---

## Risk Assessment

- **LOW**: Standard exception pattern
- **MEDIUM**: Ensure all error paths are covered
- **MITIGATION**: Add exceptions as needed during development

---

## Testing Requirements

- [ ] Unit test: ARCException can be raised and serialized
- [ ] Unit test: ValidationError captures field errors
- [ ] Unit test: NotFoundError formats resource info correctly
- [ ] Unit test: AuthenticationError and AuthorizationError distinct
- [ ] Unit test: IntegrationError captures provider details
- [ ] Unit test: All exceptions have correct HTTP status codes
- [ ] Unit test: to_dict() produces valid JSON-serializable output

---

## Definition of Done

- [ ] `exceptions.py` module created and functional
- [ ] All exception classes implemented
- [ ] `src/arc/core/__init__.py` exports all exceptions
- [ ] Unit tests pass for all exception types
- [ ] Parent todo TODO-BE-001 updated with completion status
