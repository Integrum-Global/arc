# ARC Backend - Implementation Instructions

## Overview

This worktree contains the Python backend using the Kailash SDK (DataFlow, Nexus, Kaizen). You are implementing an AI-native investment management platform API.

**Working Directory**: `src/arc/`
**Stack**: Python 3.11+, Kailash SDK, PostgreSQL + pgvector, Redis

---

## Before You Start

Ensure you have read and understood:
- `CLAUDE.md` - Critical SDK patterns and rules
- `docs/02-plans/01-backend/01-architecture.md` - Backend architecture
- `docs/03-design/` - Design system for consistent theming

---

## Implementation Phases

### Phase 1: Foundation (TODO-BE-001 to TODO-BE-014)

Execute these TODOs in order. Each TODO file has detailed tasks, acceptance criteria, and code examples.

#### 1.1 Project Setup
```
Read: todos/active/TODO-BE-001-project-setup.md

Tasks:
- Initialize Poetry project with dependencies
- Create directory structure (src/arc/)
- Configure DataFlow with PostgreSQL
- Set up environment configuration
```

#### 1.2 DataFlow Models
```
Read: todos/active/TODO-BE-002-core-models.md
Read: todos/active/TODO-BE-003-portfolio-models.md
Read: todos/active/TODO-BE-004-security-models.md
Read: todos/active/TODO-BE-005-analytics-models.md

CRITICAL DataFlow Rules (from CLAUDE.md):
- NEVER manually set created_at or updated_at
- CreateNode: FLAT fields, UpdateNode: NESTED filter+fields
- Primary key MUST be named 'id'
- soft_delete only affects DELETE, NOT queries
```

#### 1.3 Kailash Workflows
```
Read: todos/active/TODO-BE-006-sync-workflows.md
Read: todos/active/TODO-BE-007-analytics-workflows.md
Read: todos/active/TODO-BE-008-portfolio-workflows.md

Pattern:
workflow = WorkflowBuilder()
workflow.add_node("NodeName", "id", {"param": "value"})
runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build(), inputs={})
```

#### 1.4 Services Layer
```
Read: todos/active/TODO-BE-009-base-service.md
Read: todos/active/TODO-BE-010-portfolio-service.md
Read: todos/active/TODO-BE-011-analytics-service.md

Pattern:
- BaseService with db, cache, and workflow access
- Services use DataFlow Express for simple CRUD
- Services use workflows for complex operations
```

#### 1.5 Nexus Gateway
```
Read: todos/active/TODO-BE-012-nexus-setup.md
Read: todos/active/TODO-BE-013-auth.md
Read: todos/active/TODO-BE-014-api-endpoints.md

IMPORTANT: Use Nexus instead of FastAPI:
from nexus import Nexus
nexus = Nexus(workflows)
nexus.run(port=8000)
```

### Phase 2: AI & Intelligence (TODO-BE-015 to TODO-BE-020)

Only start after Phase 1 is complete and tested.

```
Read: todos/active/TODO-BE-015-base-agent.md
Read: todos/active/TODO-BE-016-market-agent.md
Read: todos/active/TODO-BE-017-query-agent.md
Read: todos/active/TODO-BE-018-analyst-agent.md
Read: todos/active/TODO-BE-019-committee-agent.md
Read: todos/active/TODO-BE-020-intelligence-service.md

Use Kaizen BaseAgent pattern:
class MyAgent(BaseAgent):
    def __init__(self, config):
        super().__init__(config=config, signature=MySignature())
```

### Phase 3: Integrations (TODO-BE-021 to TODO-BE-024)

```
Read: todos/active/TODO-BE-021-eodhd-client.md
Read: todos/active/TODO-BE-022-capitaliq-client.md
Read: todos/active/TODO-BE-023-pitchbook-client.md
Read: todos/active/TODO-BE-024-notifications.md
```

---

## Critical Patterns

### DataFlow Model Definition
```python
from dataflow import DataFlow

db = DataFlow("postgresql://...", auto_migrate=False)

@db.model
class Portfolio:
    id: str                    # MUST be 'id'
    name: str
    code: str
    manager_id: str
    active: bool = True
    # NEVER include created_at/updated_at - auto-managed
```

### DataFlow CRUD
```python
# Create (FLAT fields)
portfolio = await db.express.create("Portfolio", {
    "id": "pf-123",
    "name": "Growth Portfolio",
    "code": "GROWTH",
    "manager_id": "user-456"
})

# Update (NESTED filter + fields)
await db.express.update("Portfolio", "pf-123", {
    "name": "Updated Name"
})

# List with filter
portfolios = await db.express.list("Portfolio",
    filter={"active": True, "manager_id": "user-456"},
    limit=100
)
```

### Nexus API (NOT FastAPI)
```python
from nexus import Nexus

# Register workflows, not routes
workflows = [
    create_portfolio_workflow(),
    list_portfolios_workflow(),
    get_portfolio_workflow(),
]

nexus = Nexus(workflows)
nexus.run(port=8000)
```

### AsyncLocalRuntime for Docker
```python
from kailash.runtime import AsyncLocalRuntime

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(
    workflow.build(),
    inputs={"param": "value"}
)
```

---

## Testing Requirements

**Tier 1 (Unit)**: Mocking allowed
```bash
pytest tests/unit -v
```

**Tier 2 (Integration)**: NO MOCKING - Real PostgreSQL + Redis
```bash
docker-compose -f docker-compose.test.yml up -d
pytest tests/integration -v
```

See:
- `todos/active/TODO-TEST-001-backend-unit.md`
- `todos/active/TODO-TEST-002-backend-integration.md`

---

## Running the Backend

### Development
```bash
# Load environment
source .env

# Start dependencies
docker-compose up -d postgres redis

# Run API
poetry run uvicorn arc.api.app:app --reload --port 8000
```

### Verify
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/portfolios
```

---

## Specialist Subagents

When implementing, invoke the appropriate specialist:

| Task | Subagent |
|------|----------|
| DataFlow questions | `dataflow-specialist` |
| Nexus setup | `nexus-specialist` |
| Kaizen agents | `kaizen-specialist` |
| MCP integration | `mcp-specialist` |
| Testing strategy | `testing-specialist` |
| Workflow patterns | `pattern-expert` |

---

## Checklist Before Moving to Frontend

- [ ] All Phase 1 TODOs complete (TODO-BE-001 to TODO-BE-014)
- [ ] API runs on port 8000
- [ ] Health endpoint returns OK
- [ ] Auth endpoints work (login, refresh)
- [ ] Portfolio CRUD works
- [ ] Holdings and transactions work
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API documented in OpenAPI

---

## API Contract for Frontends

Once backend is ready, frontends can integrate using:

**Base URL**: `http://localhost:8000/api`

**Key Endpoints**:
```
POST /auth/login          → {access_token, refresh_token}
POST /auth/refresh        → {access_token}
GET  /portfolios          → {items: [...], total, page}
POST /portfolios          → {id, name, code, ...}
GET  /portfolios/{id}     → {id, name, code, ...}
GET  /portfolios/{id}/holdings → {items: [...]}
GET  /analytics/securities/{id}/ratios → {current_ratio, roe, ...}
GET  /analytics/alerts    → {items: [...]}
POST /intelligence/query  → {response, confidence, sources}
```
