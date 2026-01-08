# ARC Backend Developer Documentation

## Overview

The ARC (Asset Research & Control) backend is built using the Kailash SDK, providing a workflow-based architecture for investment management operations.

## Architecture

```
src/arc/
├── models/         # DataFlow database models
├── services/       # Business logic services
├── workflows/      # Kailash workflow definitions
├── agents/         # Kaizen AI agents
├── api/            # Nexus API endpoints
├── integrations/   # External data provider clients
├── workers/        # Background job processors
└── core/           # Configuration, exceptions, constants
```

## Key Technologies

- **DataFlow**: Zero-config database framework (PostgreSQL, SQLite)
- **Nexus**: Multi-channel platform (API + CLI + MCP)
- **Kaizen**: AI agent framework for intelligent features
- **Kailash Core**: Workflow execution engine

## Quick Start

```python
from arc.models import db, Portfolio, Holding
from arc.services import create_services

# Create service registry
services = create_services(db)

# Set tenant context
tenant_services = services.with_tenant("tenant-123")

# Use services (not yet implemented)
# portfolio = await tenant_services.portfolio.get_portfolio("port-001")
```

## Documentation Index

1. [Models](./01-models.md) - DataFlow database models
2. [Services](./02-services.md) - Business logic layer
3. [API](./03-api.md) - REST API endpoints (coming soon)
4. [Agents](./04-agents.md) - AI agents (coming soon)

## Environment Setup

```bash
# Install dependencies
uv sync

# Run tests
uv run pytest tests/unit/ --tb=short

# Run linting
uv run ruff check src/arc/ tests/

# Run formatting
uv run black src/arc/ tests/
```
