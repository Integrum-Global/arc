# TODO-BE-012: Nexus Application Setup

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-009

---

## Objective

Set up the Nexus multi-channel gateway that deploys all ARC workflows as API + CLI + MCP endpoints simultaneously.

---

## Tasks

### 1. Nexus Application Core
- [ ] Create `src/arc/api/app.py`
- [ ] Initialize Nexus with DataFlow integration:
  ```python
  from nexus import Nexus
  from arc.models.database import db

  nexus = Nexus(
      workflows=get_all_workflows(),
      db=db,  # DataFlow integration for auto CRUD
      title="ARC Investment Platform",
      version="1.0.0"
  )
  ```
- [ ] Configure async lifespan for database setup:
  ```python
  @asynccontextmanager
  async def lifespan(app):
      await db.create_tables_async()
      yield
      await db.close_async()
  ```
- [ ] Set up health monitoring endpoint

### 2. Workflow Registration
- [ ] Create `src/arc/api/workflows.py`
- [ ] Implement `get_all_workflows()`:
  - Register sync workflows (eodhd, capitaliq, pitchbook)
  - Register analytics workflows (ratios, alerts, benchmarks)
  - Register portfolio workflows (nav, health)
- [ ] Configure workflow metadata for API discovery

### 3. DataFlow Auto-CRUD Endpoints
- [ ] Register DataFlow models with Nexus
- [ ] Configure auto-generated endpoints:
  - `GET /api/Portfolio/list`
  - `POST /api/Portfolio/create`
  - `GET /api/Portfolio/read/{id}`
  - `PUT /api/Portfolio/update/{id}`
  - `DELETE /api/Portfolio/delete/{id}`
- [ ] Apply for all models: Portfolio, Holding, Transaction, Security, etc.

### 4. Custom Routes Structure
- [ ] Create `src/arc/api/routes/` directory
- [ ] Create `__init__.py` for route aggregation
- [ ] Set up route modules:
  - `auth.py` - Authentication endpoints
  - `webhooks.py` - External webhook handlers

### 5. Middleware Structure
- [ ] Create `src/arc/api/middleware/` directory
- [ ] Create placeholder for:
  - `tenant.py` - Tenant context middleware
  - `audit.py` - Audit logging middleware

### 6. API Configuration
- [ ] Configure CORS settings
- [ ] Set up request validation
- [ ] Configure rate limiting (placeholder)
- [ ] Add OpenAPI documentation customization

### 7. Entry Point
- [ ] Create main entry point for running Nexus
- [ ] Support both development and production modes
- [ ] Configure worker count for production

---

## Acceptance Criteria

- [ ] Nexus application initializes without errors
- [ ] All workflows accessible via HTTP API
- [ ] CLI commands auto-generated
- [ ] MCP server available for AI tools
- [ ] DataFlow CRUD endpoints auto-generated
- [ ] Health endpoint returns status
- [ ] OpenAPI spec available at `/openapi.json`
- [ ] Unit test: Workflow registration
- [ ] Integration test: API endpoint access
- [ ] Integration test: Health endpoint

---

## Directory Structure

```
src/arc/api/
├── __init__.py
├── app.py              # Main Nexus application
├── workflows.py        # Workflow registration
├── auth/
│   ├── __init__.py
│   ├── oauth.py       # OAuth handlers
│   ├── jwt.py         # JWT utilities
│   └── rbac.py        # Role-based access
├── middleware/
│   ├── __init__.py
│   ├── tenant.py      # Tenant context
│   └── audit.py       # Audit logging
└── routes/
    ├── __init__.py
    ├── auth.py        # Auth endpoints
    └── webhooks.py    # Webhook handlers
```

---

## Usage

```bash
# Development
uvicorn arc.api.app:nexus --reload

# Production
uvicorn arc.api.app:nexus --host 0.0.0.0 --port 8000 --workers 4
```

---

## Technical Notes

- Nexus uses `AsyncLocalRuntime` by default (correct for Docker)
- DataFlow `auto_migrate=False` is critical for async compatibility
- All workflows registered once at startup
- Health monitoring should check database connectivity
