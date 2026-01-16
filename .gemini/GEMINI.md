# GEMINI.md - Project Context & Directives 📜

> [!NOTE]
> This file is the central source of truth for Agenteer behavior. It supports a **Hybrid Configuration** for:
> 1. **Google Antigravity** (Managed Agents, Agent Manager)
> 2. **Gemini CLI** (Terminal-based Agent)

## Platform & Configuration

- **Skills**: `.agent/skills/` (Primary) -> Linked to `.gemini/skills/` (CLI Compatibility).
- **Knowledge**: `.gemini/knowledge/` (Specialized Personas).
- **Workflows**: `.agent/workflows/` (Antigravity Workflows).

## Important Directives

1. **Always use Kailash SDK** with its frameworks to implement.
2. **Consult Specialist Personas**: Before modifying specific frameworks, consult the relevant "Knowledge Persona" in `.gemini/knowledge/`.
   - **Nexus (Platforms)**: [nexus-specialist](../knowledge/nexus-specialist.md)
   - **DataFlow (Databases)**: [dataflow-specialist](../knowledge/dataflow-specialist.md)
   - **MCP (Integration)**: [mcp-specialist](../knowledge/mcp-specialist.md)
   - **Kaizen (Agents)**: [kaizen-specialist](../knowledge/kaizen-specialist.md)
3. **Check Frameworks First**: Never attempt to write code from scratch without checking framework patterns.
4. **Environment Variables**:
   - **CRITICAL**: ALWAYS load environment variables from `.env` before ANY operation.
   - For pytest: Prefix with env vars or use `pytest-dotenv`.
   - For Docker: Use `docker-compose` with `env_file`.
   - For Python scripts: Load `dotenv` at the top of the file.

## 🏗️ Documentation & Skills (Reference)

You have access to a comprehensive library of "Skills" (Reference Documentation) in `.agent/skills/`. Use these to understand how to use the SDK.

### Core SDK (`sdk-users/`)
- **[core-sdk](../skills/01-core-sdk/SKILL.md)**: Fundamentals, workflow creation, nodes.

### DataFlow (`sdk-users/apps/dataflow/`)
- **[dataflow](../skills/02-dataflow/SKILL.md)**: Zero-config database operations.

### Nexus (`sdk-users/apps/nexus/`)
- **[nexus](../skills/03-nexus/SKILL.md)**: Multi-channel platform (API/CLI/MCP).

### Kaizen (`sdk-users/apps/kaizen/`)
- **[kaizen](../skills/04-kaizen/SKILL.md)**: AI agent framework.

## 🎯 Specialized Personas (Knowledge)

When you need deep expertise, "adopt" one of these personas by reading their knowledge file in `.gemini/knowledge/`:

### Analysis & Planning
- **[ultrathink-analyst](../knowledge/ultrathink-analyst.md)**: Deep failure analysis.
- **[requirements-analyst](../knowledge/requirements-analyst.md)**: Requirements breakdown.
- **[sdk-navigator](../knowledge/sdk-navigator.md)**: Pattern finding.
- **[framework-advisor](../knowledge/framework-advisor.md)**: Framework selection.

### Framework Implementation
- **[nexus-specialist](../knowledge/nexus-specialist.md)**: Multi-channel platform implementation.
- **[dataflow-specialist](../knowledge/dataflow-specialist.md)**: Database operations implementation.

### Core Implementation
- **[pattern-expert](../knowledge/pattern-expert.md)**: Workflow patterns and nodes.
- **[gold-standards-validator](../knowledge/gold-standards-validator.md)**: Compliance checking.

### Testing & Validation
- **[testing-specialist](../knowledge/testing-specialist.md)**: 3-tier testing strategy.
- **[documentation-validator](../knowledge/documentation-validator.md)**: Documentation accuracy.

## 🏆 Success Factors & Lessons Learned

### Success Factors
- **What Worked Well** ✅
  1. Systematic Task Completion - Finishing each task completely before moving on
  2. Test-First Development: Writing all tests before implementation prevented bugs
  3. Comprehensive Testing: Catching issues early with comprehensive tests
  4. Real Infrastructure Testing - NO MOCKING policy found real-world issues
  5. Evidence-Based Tracking: Clear audit trail with file:line references made progress clear
  6. Comprehensive Documentation: Guides provide clear path for users and prevent future support questions
  7. Subagent Specialization - Right agent for each task type
  8. Manual Verification: Running all examples caught integration issues
  9. Design System Foundation: Creating comprehensive design system FIRST prevented inconsistencies
  10. Institutional Directives: Documented design patterns as mandatory guides for future work
  11. Component Reusability: Building 16 reusable components eliminated redundant work
  12. Responsive-First Design: Building responsive patterns from the start prevented mobile/desktop divergence
  13. Dark Mode Built-In: Supporting dark mode in all components from day 1 avoided retrofitting
  14. Design Token System: Using centralized tokens (colors, spacing, typography) enabled easy theme changes

### Lessons Learned 🎓
  1. Documentation Early: Writing guides after implementation is easier
  2. Pattern Consistency: Following same structure across examples reduces errors
  3. Incremental Validation: Verifying tests pass immediately prevents compounding issues
  4. Comprehensive Coverage: Detailed documentation prevents future questions
  5. Design System as Foundation: Create design system BEFORE features to enforce consistency
  6. Mandatory Guides: Institutionalizing design patterns as "must follow" directives prevents drift
  7. Single Import Pattern: Consolidating all design system exports into one file (design_system.dart) simplifies usage
  8. Component Showcase: Building live demo app while developing components catches UX issues early
  9. Deprecation Fixes: Address all deprecations immediately to prevent tech debt accumulation
  10. Real Device Testing: Testing on actual trackpad/touch reveals issues that simulators miss
  11. Pointer Events for Touch: Low-level pointer events (PointerDownEvent, PointerMoveEvent) handle trackpad/touch better than high-level gestures alone
  12. Responsive Testing: Test at all three breakpoints (mobile/tablet/desktop) for every feature

## ⚡ Performance Patterns

- **DataFlow Express**: Use `db.express` for high-performance API endpoints (23x faster than workflows).
  - `await db.express.create/read/list/count/update/delete`
- **Async Safety**: Use `async_safe_run()` from `dataflow.core.async_utils` for bridging sync/async contexts.

## ⚡ Workflows (Processes)

For step-by-step specific tasks, check `.agent/workflows/`:
- **[deploy](../workflows/deploy.md)**: Deployment steps.
- **[tdd_workflow](../workflows/tdd_workflow.md)**: Test-Driven Development workflow.
- **[release_workflow](../workflows/release_workflow.md)**: Git release and CI validation.
- **[todo_workflow](../workflows/todo_workflow.md)**: Task management and tracking.
- **[github_workflow](../workflows/github_workflow.md)**: GitHub PR and issue management.

## ⚠️ Critical Rules (Global)

- ALWAYS: `runtime.execute(workflow.build())`
- NEVER: `workflow.execute(runtime)`
- String-based nodes: `workflow.add_node("NodeName", "id", {})`
- Real infrastructure: NO MOCKING in Tiers 2-3 tests.
- **Docker/FastAPI**: Use `AsyncLocalRuntime` or `WorkflowAPI` (defaults to async).
- **CLI/Scripts**: Use `LocalRuntime` for synchronous execution.

## 🚨 DataFlow Critical Rules

1. **Timestamps**: NEVER manually set `created_at` or `updated_at`.
2. **Updates**: `UpdateNode` uses nested `{"filter": {...}, "fields": {...}}`.
3. **Primary Key**: MUST be named `id`.
4. **Soft Delete**: Only affects `DeleteNode`, NOT queries (use `filter`).
5. **Docker**: `auto_migrate=True` works for file-based DBs (Postgres/SQLite). Use `False` only for `:memory:`.
6. **Logging**: Use `LoggingConfig` for centralized log control (v0.10.12+).

---

## ⚡ Essential Pattern (All Frameworks)

### For Docker/FastAPI Deployment (RECOMMENDED)
```python
from kailash.workflow.builder import WorkflowBuilder
from kailash.runtime import AsyncLocalRuntime  # Docker-optimized runtime

workflow = WorkflowBuilder()
workflow.add_node("NodeName", "id", {"param": "value"})  # String-based
runtime = AsyncLocalRuntime()  # Async-first, no threading
results, run_id = await runtime.execute_workflow_async(workflow.build(), inputs={})  # Same return as LocalRuntime!
```

### For CLI/Scripts (Sync Contexts)
```python
from kailash.workflow.builder import WorkflowBuilder
from kailash.runtime import LocalRuntime

workflow = WorkflowBuilder()
workflow.add_node("NodeName", "id", {"param": "value"})  # String-based
runtime = LocalRuntime()  # Inherits from BaseRuntime with 3 mixins
results, run_id = runtime.execute(workflow.build())  # ALWAYS .build()
```

### Auto-Detection (Simplest)
```python
from kailash.runtime import get_runtime

# Automatically selects AsyncLocalRuntime for Docker/FastAPI,
# LocalRuntime for CLI/scripts
runtime = get_runtime()  # Defaults to "async" context
```

### Runtime Architecture (Internal)
Both LocalRuntime and AsyncLocalRuntime inherit from BaseRuntime and use shared mixins:

**BaseRuntime Foundation**:
- 29 configuration parameters (debug, enable_cycles, conditional_execution, connection_validation, etc.)
- Execution metadata management (run IDs, workflow caching)
- Common initialization and validation modes (strict, warn, off)

**Shared Mixins**:
- **CycleExecutionMixin**: Cycle execution delegation to CyclicWorkflowExecutor with validation and error wrapping
- **ValidationMixin**: Workflow structure validation (5 methods)
- **ConditionalExecutionMixin**: Conditional execution and branching logic with SwitchNode support

**LocalRuntime-Specific Features**:
- Enhanced error messages via _generate_enhanced_validation_error()
- Connection context building via _build_connection_context()
- Public validation API: get_validation_metrics(), reset_validation_metrics()

**Usage**:
```python
# Configuration from BaseRuntime (29 parameters)
runtime = LocalRuntime(
    debug=True,
    enable_cycles=True,                    # CycleExecutionMixin
    conditional_execution="skip_branches",  # ConditionalExecutionMixin
    connection_validation="strict"          # ValidationMixin (strict/warn/off)
)
results, run_id = runtime.execute(workflow.build())
```

**AsyncLocalRuntime-Specific Features**:
AsyncLocalRuntime extends LocalRuntime with async-optimized execution:
- **WorkflowAnalyzer**: Analyzes workflows to determine optimal execution strategy
- **ExecutionContext**: Async execution context with integrated resource access
- **Execution Strategies**: Automatically selects pure async, mixed, or sync-only execution
- **Level-Based Parallelism**: Executes independent nodes concurrently within dependency levels

## 🐳 DataFlow Docker Deployment

### ✅ auto_migrate=True Now Works in Docker/FastAPI (v0.10.15+)

**FIXED**: As of v0.10.15, `auto_migrate=True` works in Docker/FastAPI for file-based databases (PostgreSQL, SQLite file).

**How it works**: DataFlow uses `SyncDDLExecutor` with synchronous drivers (psycopg2, sqlite3) for DDL. No event loop involvement - works in any context.

### ✅ Zero-Config Pattern (RECOMMENDED for file-based databases)

```python
from dataflow import DataFlow
from fastapi import FastAPI

# auto_migrate=True (default) works for PostgreSQL and SQLite file databases!
db = DataFlow("postgresql://...")

@db.model  # Tables created immediately via sync DDL
class User:
    id: str
    name: str
    email: str

app = FastAPI()

@app.post("/users")
async def create_user(data: dict):
    return await db.express.create("User", data)
```

### ⚠️ Limitation: In-Memory SQLite

In-memory databases (`:memory:`) do NOT use sync DDL because each connection gets a separate database. For in-memory SQLite, use the lifespan pattern:

```python
db = DataFlow(":memory:", auto_migrate=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.create_tables_async()  # Uses shared connection
    yield
```

### Pattern Summary

| Context | Pattern | Notes |
|---------|---------|-------|
| **PostgreSQL** | `auto_migrate=True` (default) | ✅ Uses sync DDL (psycopg2) |
| **SQLite file** | `auto_migrate=True` (default) | ✅ Uses sync DDL (sqlite3) |
| **SQLite :memory:** | `auto_migrate=False` + `create_tables_async()` | ⚠️ Sync DDL not supported |
| **CLI Scripts** | `auto_migrate=True` (default) | Always worked |
| **pytest (async)** | `auto_migrate=True` (default) | ✅ Uses sync DDL |

### DataFlow Express (23x Faster CRUD)

For high-performance API endpoints, use `db.express` instead of workflows:

```python
# Express API: Direct node invocation, 23x faster than workflows
user = await db.express.create("User", {"id": "user-123", "name": "Alice"})
user = await db.express.read("User", "user-123")  # Primary key lookup
user = await db.express.find_one("User", {"email": "alice@example.com"})  # Non-PK lookup (v0.10.13+)
users = await db.express.list("User", filter={"status": "active"}, limit=100)
count = await db.express.count("User", filter={"status": "active"})
user = await db.express.update("User", "user-123", {"name": "Alice Updated"})
deleted = await db.express.delete("User", "user-123")

# Performance: ~0.27ms vs ~6.3ms per operation
```

## 🔧 DataFlow Centralized Logging (v0.10.12+)

Control log verbosity with LoggingConfig for cleaner output:

```python
from dataflow import DataFlow, LoggingConfig
import logging

# Option 1: Simple log level
db = DataFlow("postgresql://...", log_level=logging.WARNING)

# Option 2: Full configuration with presets
db = DataFlow("postgresql://...", log_config=LoggingConfig.production())

# Option 3: Environment variables (12-factor app)
config = LoggingConfig.from_env()
```

### Sensitive Value Masking

```python
from dataflow import LoggingConfig, mask_sensitive

config = LoggingConfig(mask_sensitive_values=True)
data = {"password": "secret123", "api_key": "sk-xxx"}
masked = mask_sensitive(data, config)
# {'password': '***MASKED***', 'api_key': '***MASKED***'}
```

## 🔧 Async-Safe Utilities (v0.10.6+)

For custom sync→async bridging, use `async_safe_run`:

```python
from dataflow.core.async_utils import async_safe_run

# Works in both sync contexts (CLI) and async contexts (FastAPI)
async def my_async_op():
    return await some_async_call()

result = async_safe_run(my_async_op())  # Works everywhere!
```
