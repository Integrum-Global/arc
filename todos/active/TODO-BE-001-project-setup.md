# TODO-BE-001: Backend Project Initialization

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: None

---

## Objective

Initialize the backend Python project with proper structure, dependencies, and configuration for the ARC investment platform.

---

## Tasks

### 1. Project Structure Setup
- [ ] Create `src/arc/` package directory structure
- [ ] Create `__init__.py` files for all packages
- [ ] Create subdirectories:
  - `models/` - DataFlow models
  - `workflows/` - Kailash workflows
  - `services/` - Business services
  - `agents/` - Kaizen AI agents
  - `api/` - Nexus gateway
  - `integrations/` - External provider clients
  - `workers/` - Background workers
  - `core/` - Shared utilities

### 2. Poetry Configuration
- [ ] Initialize `pyproject.toml` with project metadata
- [ ] Add core dependencies:
  - `kailash>=0.10.0` - Core SDK
  - `kailash-dataflow>=0.8.0` - Database framework
  - `kailash-nexus>=0.7.0` - Multi-channel platform
  - `kailash-kaizen>=0.6.0` - AI agent framework
- [ ] Add dev dependencies:
  - `pytest>=8.0`
  - `pytest-asyncio>=0.24`
  - `pytest-cov`
  - `black`
  - `ruff`
  - `mypy`
- [ ] Configure tool settings (black, ruff, mypy, pytest)

### 3. Core Configuration Module
- [ ] Create `src/arc/core/config.py` with settings management
- [ ] Implement environment variable loading from `.env`
- [ ] Define configuration classes:
  - `DatabaseConfig` - PostgreSQL connection settings
  - `APIConfig` - Nexus API settings
  - `ProviderConfig` - Data provider credentials
  - `KaizenConfig` - AI agent settings
- [ ] Create `.env.example` template

### 4. Exception Handling
- [ ] Create `src/arc/core/exceptions.py`
- [ ] Define custom exception hierarchy:
  - `ARCException` - Base exception
  - `ValidationError` - Input validation errors
  - `NotFoundError` - Resource not found
  - `AuthenticationError` - Auth failures
  - `AuthorizationError` - Permission denied
  - `IntegrationError` - External service failures

### 5. Constants and Enums
- [ ] Create `src/arc/core/constants.py`
- [ ] Define enums:
  - `PortfolioType` - managed, model, benchmark, composite
  - `TransactionType` - buy, sell, dividend, transfer
  - `AlertSeverity` - info, warning, critical
  - `RatioClass` - liquidity, profitability, leverage, utilization, valuation
  - `UserRole` - admin, investment_manager, family_office, compliance, viewer

### 6. Development Setup
- [ ] Create `scripts/` directory
- [ ] Create development setup scripts
- [ ] Create database migration script placeholder
- [ ] Create seed data script placeholder

---

## Acceptance Criteria

- [ ] `poetry install` succeeds without errors
- [ ] All imports in `src/arc/__init__.py` resolve correctly
- [ ] Configuration loads from environment variables
- [ ] Unit test: Config loading with defaults
- [ ] Unit test: Custom exception handling
- [ ] `ruff check` passes on all files
- [ ] `black --check` passes on all files

---

## File Structure After Completion

```
arc-backend/
├── src/
│   └── arc/
│       ├── __init__.py
│       ├── models/
│       │   └── __init__.py
│       ├── workflows/
│       │   └── __init__.py
│       ├── services/
│       │   └── __init__.py
│       ├── agents/
│       │   └── __init__.py
│       ├── api/
│       │   └── __init__.py
│       ├── integrations/
│       │   └── __init__.py
│       ├── workers/
│       │   └── __init__.py
│       └── core/
│           ├── __init__.py
│           ├── config.py
│           ├── exceptions.py
│           └── constants.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── unit/
│       └── core/
│           ├── test_config.py
│           └── test_exceptions.py
├── scripts/
│   ├── seed_data.py
│   └── migrate.py
├── pyproject.toml
├── poetry.lock
├── .env.example
└── README.md
```

---

## Notes

- Use absolute imports throughout: `from arc.core.config import settings`
- Follow Kailash SDK conventions for Docker deployment
- Ensure `auto_migrate=False` is used for Docker/FastAPI compatibility
