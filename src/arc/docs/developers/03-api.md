# ARC API Layer Developer Guide

## Overview

The ARC API layer is built using **Kailash Nexus**, a zero-config multi-channel platform that provides REST API, CLI, and MCP interfaces from the same codebase.

## Architecture

```
arc/api/
├── __init__.py          # Module exports
├── app.py               # Main Nexus application
├── auth/                # Authentication (TODO)
│   └── __init__.py
├── middleware/          # Request/response middleware (TODO)
│   └── __init__.py
└── routes/              # Custom API routes (TODO)
    └── __init__.py
```

## Core Components

### Nexus Application (`app.py`)

The main application is a Nexus instance configured for production use:

```python
from nexus import Nexus
from arc.core.config import settings

app = Nexus(
    api_port=settings.api.port,
    auto_discovery=False,  # CRITICAL for DataFlow integration
    enable_monitoring=True,
    rate_limit=100,  # Requests per minute
)
```

**Key Configuration:**
- `auto_discovery=False`: Prevents blocking during DataFlow model registration
- `enable_monitoring=True`: Enables health metrics
- `rate_limit=100`: Default rate limiting per minute

### Database Functions

Async functions for database lifecycle:

```python
from arc.api import initialize_database, shutdown_database

# During startup
await initialize_database()

# During shutdown
await shutdown_database()
```

## Model Registry

All 23 DataFlow models are organized by domain:

### Core Models (5)
- `tenants` - Multi-tenant organization
- `users` - User accounts
- `user-preferences` - User settings
- `notification-preferences` - Alert preferences
- `audit-logs` - Audit trail

### Portfolio Models (6)
- `portfolios` - Investment portfolios
- `holdings` - Portfolio positions
- `transactions` - Trade history
- `portfolio-valuations` - Historical values
- `cash-accounts` - Cash positions
- `benchmarks` - Performance benchmarks

### Security Models (6)
- `securities` - Instruments (stocks, bonds, etc.)
- `price-history` - Historical prices
- `company-fundamentals` - Financial data
- `security-ratios` - Valuation metrics
- `corporate-actions` - Dividends, splits
- `dividends` - Dividend payments

### Analytics Models (6)
- `alerts` - User notifications
- `alert-thresholds` - Alert triggers
- `peer-groups` - Comparison groups
- `reports` - Generated reports
- `watchlists` - Watched securities
- `watchlist-items` - Watchlist entries

## Health Endpoints

Three health endpoints are provided for monitoring:

### `/health` - Full Health Check
Returns comprehensive status including database connectivity:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T12:00:00+00:00",
  "version": "1.0.0",
  "environment": "development",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    }
  },
  "models": {
    "registered_count": 23,
    "models": ["tenants", "users", ...]
  }
}
```

### `/health/ready` - Kubernetes Readiness Probe
Returns 200 if ready to accept traffic:

```json
{
  "ready": true,
  "timestamp": "2026-01-07T12:00:00+00:00"
}
```

### `/health/live` - Kubernetes Liveness Probe
Lightweight check that returns immediately:

```json
{
  "alive": true,
  "timestamp": "2026-01-07T12:00:00+00:00"
}
```

## Custom Endpoints

Use the `@app.endpoint` decorator for custom routes:

```python
from arc.api import app, db

@app.endpoint("/users", methods=["POST"])
async def create_user(data: dict) -> dict:
    """Create a new user."""
    return await db.express.create("User", data)

@app.endpoint("/users/{id}", methods=["GET"])
async def get_user(id: str) -> dict:
    """Get user by ID."""
    return await db.express.read("User", id)

@app.endpoint("/users", methods=["GET"])
async def list_users(limit: int = 100) -> list:
    """List all users."""
    return await db.express.list("User", limit=limit)
```

## Workflow Registration

Register custom workflows for complex business logic:

```python
from arc.api import app
from kailash.workflow.builder import WorkflowBuilder

def register_workflows() -> None:
    """Register custom business workflows."""

    # Portfolio rebalancing workflow
    rebalance = WorkflowBuilder()
    rebalance.add_node("PythonCodeNode", "calculate", {
        "code": "# Rebalancing logic"
    })
    app.register("portfolio/rebalance", rebalance.build())
```

## DataFlow Express API

For CRUD operations, use the DataFlow Express API (23x faster than workflows):

```python
from arc.api import db

# Create
user = await db.express.create("User", {
    "id": "user-123",
    "name": "Alice",
    "email": "alice@example.com"
})

# Read
user = await db.express.read("User", "user-123")

# List with filter
users = await db.express.list("User",
    filter={"status": "active"},
    limit=100
)

# Count
count = await db.express.count("User", filter={"status": "active"})

# Update
user = await db.express.update("User", "user-123", {"name": "Alice Updated"})

# Delete
deleted = await db.express.delete("User", "user-123")
```

## Running the Server

### Development
```bash
uvicorn arc.api.app:app --host 0.0.0.0 --port 8000 --reload
```

### Production
```bash
uvicorn arc.api.app:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Docker
```bash
docker run -p 8000:8000 arc-backend
```

## Testing

Run API unit tests:
```bash
uv run pytest tests/unit/api/ -v
```

## Module Exports

The `arc.api` module exports:

```python
from arc.api import (
    app,                    # Nexus application instance
    db,                     # DataFlow database instance
    ALL_MODELS,             # All 23 model tuples
    CORE_MODELS,            # Core domain models
    PORTFOLIO_MODELS,       # Portfolio domain models
    SECURITY_MODELS,        # Security domain models
    ANALYTICS_MODELS,       # Analytics domain models
    initialize_database,    # Async startup function
    shutdown_database,      # Async shutdown function
)
```

## Next Steps

1. **TODO-BE-013**: Implement authentication and authorization
2. **TODO-BE-014**: Implement CRUD API endpoints for all models
3. Custom business logic endpoints (rebalancing, analytics, etc.)
