# Service Layer

The service layer provides business logic with tenant context management, workflow execution, and dependency injection.

## Overview

```
arc.services/
├── base.py      # BaseService class, errors
├── registry.py  # ServiceRegistry, create_services
├── portfolio.py # Portfolio operations (coming soon)
├── analytics.py # Analytics operations (coming soon)
└── ...
```

## BaseService

All services inherit from `BaseService`, which provides:

- **Tenant Context**: Automatic tenant ID propagation
- **User Context**: Audit trail user tracking
- **Workflow Execution**: Execute workflows with context injection
- **Logging**: Structured logging per service
- **ID Generation**: UUID generation with optional prefix

### Creating a Service

```python
from arc.services import BaseService, service_operation
from kailash.workflow.builder import WorkflowBuilder

class PortfolioService(BaseService):
    """Portfolio management service."""

    @service_operation("get_portfolio")
    async def get_portfolio(self, portfolio_id: str) -> dict:
        """Get portfolio by ID."""
        workflow = WorkflowBuilder()
        workflow.add_node("PortfolioReadNode", "read", {"id": portfolio_id})
        results, _ = await self.execute_workflow(workflow)

        if not results.get("read"):
            raise NotFoundError(f"Portfolio {portfolio_id} not found")

        return results["read"]

    @service_operation("create_portfolio")
    async def create_portfolio(self, name: str, code: str, manager_id: str) -> dict:
        """Create a new portfolio."""
        workflow = WorkflowBuilder()
        workflow.add_node("PortfolioCreateNode", "create", {
            "id": self.generate_id("port-"),
            "name": name,
            "code": code,
            "manager_id": manager_id,
            "inception_date": "2026-01-07",
        })
        results, _ = await self.execute_workflow(workflow)
        return results["create"]
```

### Context Management

```python
from arc.services.base import BaseService

class MyService(BaseService):
    pass

# Create service
service = MyService(db=db)

# Set tenant context
tenant_service = service.with_tenant("tenant-123")

# Set user context
user_service = service.with_user("user-456")

# Set both
context_service = service.with_context(
    tenant_id="tenant-123",
    user_id="user-456"
)
```

## ServiceRegistry

The registry provides centralized access to all services with lazy loading.

### Basic Usage

```python
from arc.services import create_services
from arc.models import db

# Create registry
services = create_services(db)

# Set tenant context (creates new registry)
tenant_services = services.with_tenant("tenant-123")

# Access services (lazy-loaded)
portfolio_service = tenant_services.portfolio
analytics_service = tenant_services.analytics
```

### Available Services

| Property | Service | Description |
|----------|---------|-------------|
| `portfolio` | PortfolioService | Portfolio management |
| `analytics` | AnalyticsService | Analytics and alerts |
| `intelligence` | IntelligenceService | AI-powered insights |
| `integration` | IntegrationService | External data sync |
| `user` | UserService | User management |
| `security` | SecurityService | Security/instrument data |
| `report` | ReportService | Report generation |

### Context Propagation

```python
# Set tenant at registry level
tenant_services = services.with_tenant("tenant-123")

# All services from this registry have tenant context
portfolio = tenant_services.portfolio  # Has tenant_id="tenant-123"
analytics = tenant_services.analytics  # Has tenant_id="tenant-123"

# Can also set user context
user_services = tenant_services.with_user("user-456")
```

## Service Errors

```python
from arc.services import (
    ServiceError,      # Base error
    NotFoundError,     # Resource not found
    ValidationError,   # Invalid input
    ConflictError,     # Duplicate resource
)

# All errors have structured data
try:
    result = await service.get_portfolio("invalid-id")
except NotFoundError as e:
    error_dict = e.to_dict()
    # {
    #     "error": "Portfolio invalid-id not found",
    #     "service": "PortfolioService",
    #     "operation": "get_portfolio",
    #     "details": {...}
    # }
```

## Decorator: @service_operation

Adds automatic logging and error handling:

```python
from arc.services import service_operation

class MyService(BaseService):

    @service_operation("my_operation")
    async def my_operation(self, data: dict) -> dict:
        # Automatically logs:
        # - "Starting my_operation" with args
        # - "Completed my_operation" on success
        # - "Failed my_operation" on error

        # Exceptions are wrapped in ServiceError
        return {"result": "success"}
```

## Workflow Execution

Services execute workflows via `execute_workflow()`:

```python
async def execute_workflow(
    self,
    workflow: WorkflowBuilder,
    inputs: dict | None = None,
) -> tuple[dict, str]:
    """
    Execute workflow with automatic context injection.

    - Injects tenant_id if set
    - Injects user_id if set
    - Returns (results, run_id)
    """
```

Example:

```python
workflow = WorkflowBuilder()
workflow.add_node("UserListNode", "list", {
    "filter": {"role": "admin"}
})

# tenant_id automatically injected
results, run_id = await self.execute_workflow(workflow)
users = results["list"]["records"]
```
