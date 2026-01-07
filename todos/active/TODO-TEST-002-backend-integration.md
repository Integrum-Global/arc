# TODO-TEST-002: Backend Integration Tests

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 16h
**Dependencies**: TODO-BE-001 to TODO-BE-024, TODO-TEST-001

---

## Objective

Implement comprehensive integration tests (Tier 2) for backend services with REAL infrastructure. NO MOCKING ALLOWED - tests must use real PostgreSQL, Redis, and workflow execution.

---

## Tasks

### 1. Test Infrastructure Setup
- [ ] Create `docker-compose.test.yml`:
  - PostgreSQL 16 with pgvector
  - Redis 7
  - Network configuration
  - Volume for test data
- [ ] Create `tests/integration/conftest.py`:
  - Real database connection (auto_migrate=False)
  - Real Redis connection
  - Database cleanup between tests
  - Sample fixture factories

### 2. Database Fixtures
- [ ] Create `tests/integration/fixtures.py`:
  - sample_tenant fixture
  - sample_user fixture
  - sample_portfolio fixture
  - sample_securities fixture (AAPL, MSFT, GOOGL)
  - sample_holdings fixture
  - sample_transactions fixture
  - sample_fundamentals fixture
  - sample_price_history fixture

### 3. DataFlow CRUD Tests
- [ ] Create `tests/integration/dataflow/test_tenant_crud.py`:
  - test_create_tenant
  - test_read_tenant
  - test_update_tenant
  - test_delete_tenant (soft delete)
  - test_list_tenants_with_filter
- [ ] Create `tests/integration/dataflow/test_portfolio_crud.py`:
  - test_create_portfolio
  - test_read_portfolio
  - test_update_portfolio
  - test_list_portfolios_by_manager
  - test_portfolio_unique_code_constraint
- [ ] Create `tests/integration/dataflow/test_holding_crud.py`:
  - test_create_holding
  - test_update_holding_quantity
  - test_list_holdings_by_portfolio
  - test_holding_cascade_delete
- [ ] Create `tests/integration/dataflow/test_transaction_crud.py`:
  - test_create_buy_transaction
  - test_create_sell_transaction
  - test_transaction_updates_holding
  - test_list_transactions_date_range

### 4. Service Integration Tests - Portfolio
- [ ] Create `tests/integration/services/test_portfolio_service.py`:
  - test_create_portfolio (real DB)
  - test_create_portfolio_duplicate_code
  - test_add_holding (real DB)
  - test_add_holding_updates_existing
  - test_record_transaction (updates holding)
  - test_get_holdings_excludes_closed
  - test_calculate_portfolio_value
  - test_get_portfolio_allocation
  - test_portfolio_transaction_history

### 5. Service Integration Tests - Analytics
- [ ] Create `tests/integration/services/test_analytics_service.py`:
  - test_calculate_ratios_for_security
  - test_calculate_ratios_missing_fundamentals
  - test_get_security_health_scan
  - test_portfolio_health_aggregation
  - test_compare_to_peers
  - test_create_alert_threshold
  - test_check_threshold_violations

### 6. Service Integration Tests - Intelligence
- [ ] Create `tests/integration/services/test_intelligence_service.py`:
  - test_execute_portfolio_query
  - test_generate_daily_brief
  - test_generate_security_analysis
  - test_streaming_response
  - test_query_with_real_data

### 7. Workflow Integration Tests
- [ ] Create `tests/integration/workflows/test_ratio_calculation.py`:
  - test_calculate_ratios_for_security
  - test_calculate_ratios_batch
  - test_ratio_workflow_handles_missing_data
  - test_ratio_workflow_stores_results
- [ ] Create `tests/integration/workflows/test_portfolio_valuation.py`:
  - test_calculate_portfolio_value
  - test_valuation_creates_history
  - test_valuation_with_currency_conversion
- [ ] Create `tests/integration/workflows/test_alert_detection.py`:
  - test_detect_threshold_violation
  - test_create_alert_on_violation
  - test_no_alert_within_cooldown

### 8. API Integration Tests
- [ ] Create `tests/integration/api/test_portfolio_endpoints.py`:
  - test_create_portfolio
  - test_list_portfolios
  - test_get_portfolio
  - test_get_portfolio_not_found
  - test_update_portfolio
  - test_delete_portfolio
  - test_unauthorized_access
  - test_get_portfolio_holdings
  - test_get_portfolio_transactions
- [ ] Create `tests/integration/api/test_analytics_endpoints.py`:
  - test_get_security_ratios
  - test_get_portfolio_health
  - test_create_threshold
  - test_list_alerts
  - test_acknowledge_alert
- [ ] Create `tests/integration/api/test_intelligence_endpoints.py`:
  - test_execute_query
  - test_generate_brief
  - test_analyze_security
  - test_streaming_query

### 9. Cache Integration Tests
- [ ] Create `tests/integration/cache/test_redis_cache.py`:
  - test_cache_portfolio_value
  - test_cache_invalidation
  - test_cache_expiry
  - test_cache_miss_fallback

### 10. Authentication Integration Tests
- [ ] Create `tests/integration/api/test_auth.py`:
  - test_login_success
  - test_login_invalid_credentials
  - test_token_refresh
  - test_token_expiry
  - test_api_key_authentication
  - test_tenant_isolation

---

## Acceptance Criteria

- [ ] All integration tests pass with real PostgreSQL
- [ ] All integration tests pass with real Redis
- [ ] Tests properly clean up data between runs
- [ ] No mocking of database, cache, or workflows
- [ ] Tests run in < 5 minutes total
- [ ] CI runs integration tests on PR merge

---

## Test Directory Structure

```
tests/
├── integration/
│   ├── conftest.py              # Real infrastructure setup
│   ├── fixtures.py              # Sample data factories
│   ├── dataflow/
│   │   ├── __init__.py
│   │   ├── test_tenant_crud.py
│   │   ├── test_portfolio_crud.py
│   │   ├── test_holding_crud.py
│   │   └── test_transaction_crud.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── test_portfolio_service.py
│   │   ├── test_analytics_service.py
│   │   └── test_intelligence_service.py
│   ├── workflows/
│   │   ├── __init__.py
│   │   ├── test_ratio_calculation.py
│   │   ├── test_portfolio_valuation.py
│   │   └── test_alert_detection.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── test_portfolio_endpoints.py
│   │   ├── test_analytics_endpoints.py
│   │   ├── test_intelligence_endpoints.py
│   │   └── test_auth.py
│   └── cache/
│       ├── __init__.py
│       └── test_redis_cache.py
```

---

## docker-compose.test.yml

```yaml
version: '3.8'

services:
  postgres-test:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: arc_test
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

---

## Example Integration Test

```python
# tests/integration/conftest.py
import pytest
import asyncio
from dataflow import DataFlow
import os

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://test:test@localhost:5433/arc_test"
)

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db():
    """Create REAL database connection."""
    # CRITICAL: auto_migrate=False for async context
    database = DataFlow(TEST_DATABASE_URL, auto_migrate=False)

    # Register models and create tables
    from arc.models import register_all_models
    register_all_models(database)
    await database.create_tables_async()

    yield database

    await database.close_async()

@pytest.fixture(autouse=True)
async def clean_database(db):
    """Clean database before each test."""
    models = ["Alert", "SecurityRatio", "Transaction", "Holding",
              "Portfolio", "Security", "User", "Tenant"]
    for model in models:
        try:
            await db.express.delete_all(model)
        except Exception:
            pass
    yield
```

```python
# tests/integration/services/test_portfolio_service.py
import pytest
from arc.services.portfolio_service import PortfolioService
from decimal import Decimal

@pytest.mark.asyncio
class TestPortfolioServiceIntegration:
    """Integration tests with REAL database - NO MOCKING."""

    async def test_create_portfolio(self, db, sample_user):
        """Test creating a portfolio with real DB."""
        service = PortfolioService(db)

        portfolio = await service.create_portfolio(
            name="My Portfolio",
            code="PORT001",
            manager_id=sample_user["id"],
            portfolio_type="managed",
            base_currency="USD"
        )

        assert portfolio["id"].startswith("pf-")
        assert portfolio["name"] == "My Portfolio"

        # Verify in real database
        saved = await db.express.read("Portfolio", portfolio["id"])
        assert saved is not None
        assert saved["name"] == "My Portfolio"

    async def test_add_holding_updates_existing(self, db, sample_portfolio, sample_securities):
        """Test adding to existing holding updates quantity."""
        service = PortfolioService(db)
        security = sample_securities[0]

        # First purchase
        await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("100"),
            cost_basis=Decimal("150.00")
        )

        # Second purchase - should update existing
        holding = await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("50"),
            cost_basis=Decimal("160.00")
        )

        # Quantity combined, cost basis weighted average
        assert holding["quantity"] == 150
        expected_cost = (100 * 150 + 50 * 160) / 150
        assert abs(holding["cost_basis"] - expected_cost) < 0.01
```

---

## Running Integration Tests

```bash
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be healthy
sleep 10

# Run integration tests
TEST_DATABASE_URL=postgresql://test:test@localhost:5433/arc_test \
TEST_REDIS_URL=redis://localhost:6380 \
pytest tests/integration -v

# Run specific test file
pytest tests/integration/services/test_portfolio_service.py -v

# Run with coverage
pytest tests/integration --cov=arc --cov-report=term

# Stop test infrastructure
docker-compose -f docker-compose.test.yml down -v
```

---

## Technical Notes

- **NO MOCKING** - All tests use real PostgreSQL and Redis
- Use `auto_migrate=False` + `create_tables_async()` for DataFlow
- Clean database before each test (autouse fixture)
- Use separate ports (5433, 6380) to avoid conflicts
- Tests may be slower but catch real integration issues
- Verify data in database after operations
