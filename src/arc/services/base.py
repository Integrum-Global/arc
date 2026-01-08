"""
Base service class for ARC services.

Provides common functionality including:
- Tenant context management
- Workflow execution with context injection
- Logging and error handling
- Common CRUD patterns

CRITICAL RULES:
- NEVER manually set created_at or updated_at in workflows
- ALWAYS use AsyncLocalRuntime for Docker/FastAPI compatibility
- ALWAYS inject tenant context into multi-tenant workflows
"""

import logging
import uuid
from functools import wraps
from typing import TYPE_CHECKING, Any, TypeVar

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

if TYPE_CHECKING:
    from dataflow import DataFlow

T = TypeVar("T", bound="BaseService")


class ServiceError(Exception):
    """Base exception for service errors."""

    def __init__(
        self,
        message: str,
        *,
        service: str | None = None,
        operation: str | None = None,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.service = service
        self.operation = operation
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "error": self.message,
            "service": self.service,
            "operation": self.operation,
            "details": self.details,
        }


class NotFoundError(ServiceError):
    """Raised when a resource is not found."""

    pass


class ValidationError(ServiceError):
    """Raised when input validation fails."""

    pass


class ConflictError(ServiceError):
    """Raised when a conflict occurs (e.g., duplicate resource)."""

    pass


class BaseService:
    """
    Base class for all ARC services.

    Provides:
    - Tenant context management
    - Workflow execution with automatic tenant injection
    - Logging for all operations
    - Error handling wrappers

    Usage:
        class PortfolioService(BaseService):
            async def get_portfolio(self, portfolio_id: str) -> dict:
                workflow = WorkflowBuilder()
                workflow.add_node("PortfolioReadNode", "read", {"id": portfolio_id})
                results, _ = await self.execute_workflow(workflow)
                return results["read"]
    """

    def __init__(
        self,
        db: "DataFlow",
        tenant_id: str | None = None,
        user_id: str | None = None,
    ):
        """
        Initialize the service.

        Args:
            db: DataFlow instance for database operations
            tenant_id: Optional tenant context for multi-tenant operations
            user_id: Optional user context for audit logging
        """
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id
        self._runtime: AsyncLocalRuntime | None = None
        self.logger = logging.getLogger(f"arc.services.{self.__class__.__name__}")

    @property
    def runtime(self) -> AsyncLocalRuntime:
        """Get or create the async runtime instance."""
        if self._runtime is None:
            self._runtime = AsyncLocalRuntime()
        return self._runtime

    def with_tenant(self: T, tenant_id: str) -> T:
        """
        Create a new service instance with tenant context.

        Args:
            tenant_id: The tenant ID to set as context

        Returns:
            New service instance with tenant context set
        """
        return self.__class__(
            db=self.db,
            tenant_id=tenant_id,
            user_id=self.user_id,
        )

    def with_user(self: T, user_id: str) -> T:
        """
        Create a new service instance with user context.

        Args:
            user_id: The user ID to set as context

        Returns:
            New service instance with user context set
        """
        return self.__class__(
            db=self.db,
            tenant_id=self.tenant_id,
            user_id=user_id,
        )

    def with_context(self: T, tenant_id: str | None = None, user_id: str | None = None) -> T:
        """
        Create a new service instance with both tenant and user context.

        Args:
            tenant_id: Optional tenant ID to set
            user_id: Optional user ID to set

        Returns:
            New service instance with context set
        """
        return self.__class__(
            db=self.db,
            tenant_id=tenant_id or self.tenant_id,
            user_id=user_id or self.user_id,
        )

    async def execute_workflow(
        self,
        workflow: WorkflowBuilder,
        inputs: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any], str]:
        """
        Execute a workflow with tenant context injection.

        Automatically injects tenant_id into workflow inputs if set.

        Args:
            workflow: The workflow to execute
            inputs: Optional input parameters

        Returns:
            Tuple of (results dict, run_id)

        Raises:
            ServiceError: If workflow execution fails
        """
        inputs = inputs or {}

        # Inject tenant context if available
        if self.tenant_id:
            inputs["tenant_id"] = self.tenant_id

        # Inject user context if available
        if self.user_id:
            inputs["user_id"] = self.user_id

        run_id = str(uuid.uuid4())
        self.logger.debug(
            "Executing workflow",
            extra={"run_id": run_id, "tenant_id": self.tenant_id, "inputs": inputs},
        )

        try:
            results, run_id = await self.runtime.execute_workflow_async(
                workflow.build(),
                inputs=inputs,
            )
            self.logger.debug(
                "Workflow completed",
                extra={"run_id": run_id, "result_count": len(results)},
            )
            return results, run_id
        except Exception as e:
            self.logger.exception(
                "Workflow execution failed",
                extra={"run_id": run_id, "error": str(e)},
            )
            raise ServiceError(
                f"Workflow execution failed: {e}",
                service=self.__class__.__name__,
                operation="execute_workflow",
                details={"run_id": run_id, "error": str(e)},
            ) from e

    def generate_id(self, prefix: str = "") -> str:
        """
        Generate a unique ID with optional prefix.

        Args:
            prefix: Optional prefix for the ID (e.g., "port-", "user-")

        Returns:
            Unique ID string
        """
        unique_id = str(uuid.uuid4())
        return f"{prefix}{unique_id}" if prefix else unique_id


def service_operation(operation_name: str | None = None):
    """
    Decorator for service operations that adds logging and error handling.

    Args:
        operation_name: Optional name for the operation (defaults to method name)

    Usage:
        class PortfolioService(BaseService):
            @service_operation("get_portfolio")
            async def get_portfolio(self, portfolio_id: str) -> dict:
                ...
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(self: BaseService, *args, **kwargs):
            op_name = operation_name or func.__name__
            self.logger.info(
                f"Starting {op_name}",
                extra={
                    "operation": op_name,
                    "tenant_id": self.tenant_id,
                    "args": args,
                    "kwargs": kwargs,
                },
            )
            try:
                result = await func(self, *args, **kwargs)
                self.logger.info(
                    f"Completed {op_name}",
                    extra={"operation": op_name, "tenant_id": self.tenant_id},
                )
                return result
            except ServiceError:
                raise
            except Exception as e:
                self.logger.exception(
                    f"Failed {op_name}",
                    extra={
                        "operation": op_name,
                        "tenant_id": self.tenant_id,
                        "error": str(e),
                    },
                )
                raise ServiceError(
                    f"{op_name} failed: {e}",
                    service=self.__class__.__name__,
                    operation=op_name,
                    details={"error": str(e)},
                ) from e

        return wrapper

    return decorator
