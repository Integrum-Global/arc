# ARC Testing Strategy

## Overview

This document defines the comprehensive 3-tier testing strategy for the ARC platform, following the Kailash SDK's NO MOCKING policy for Tiers 2-3.

---

## 1. Testing Philosophy

### 1.1 Core Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARC Testing Pyramid                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌─────────────┐                                   │
│                           │    E2E      │  Tier 3: Full system tests       │
│                           │   Tests     │  Real infrastructure             │
│                           │    (~10%)   │  NO MOCKING                      │
│                       ┌───┴─────────────┴───┐                               │
│                       │   Integration Tests  │  Tier 2: Component tests    │
│                       │        (~30%)        │  Real database/cache        │
│                       │                      │  NO MOCKING                 │
│                   ┌───┴──────────────────────┴───┐                          │
│                   │        Unit Tests            │  Tier 1: Isolated tests │
│                   │          (~60%)              │  Mocking allowed        │
│                   │                              │  Fast execution         │
│                   └──────────────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 NO MOCKING Policy

**Tiers 2-3 MUST use real infrastructure:**
- Real PostgreSQL database (not SQLite)
- Real Redis cache
- Real API calls (or recorded fixtures)
- Real workflow execution

**Why?**
- DataFlow generates database-specific SQL
- Nexus requires real async execution
- Integration issues only surface with real components

---

## 2. Tier 1: Unit Tests

### 2.1 Scope

Unit tests verify isolated components with mocked dependencies.

**What to test:**
- Service business logic (calculations, validations)
- Utility functions
- Data transformations
- Signature definitions (Kaizen)
- Model field validations

**What NOT to test:**
- Database operations (use Tier 2)
- API endpoints (use Tier 2)
- Workflow execution (use Tier 2)

### 2.2 Directory Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── test_portfolio_service.py
│   │   ├── test_analytics_service.py
│   │   └── test_intelligence_service.py
│   ├── utils/
│   │   ├── test_calculations.py
│   │   └── test_formatters.py
│   ├── agents/
│   │   ├── test_signatures.py
│   │   └── test_prompts.py
│   └── conftest.py
```

### 2.3 Example Tests

**File**: `tests/unit/services/test_analytics_service.py`

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from arc.services.analytics_service import AnalyticsService
from arc.services.base import BaseService

class TestAnalyticsServiceCalculations:
    """Unit tests for analytics calculations (mocking allowed)."""

    def test_calculate_health_score_all_positive(self):
        """Test health score with all positive findings."""
        service = AnalyticsService.__new__(AnalyticsService)

        findings = [
            {"category": "liquidity", "score": 85},
            {"category": "profitability", "score": 90},
            {"category": "leverage", "score": 75},
            {"category": "efficiency", "score": 80},
            {"category": "valuation", "score": 70},
        ]

        score = service._calculate_health_score(findings)

        assert 70 <= score <= 90
        assert isinstance(score, float)

    def test_calculate_health_score_empty(self):
        """Test health score with no findings."""
        service = AnalyticsService.__new__(AnalyticsService)

        score = service._calculate_health_score([])

        assert score == 50.0  # Default neutral

    def test_score_to_grade_boundaries(self):
        """Test grade boundaries."""
        service = AnalyticsService.__new__(AnalyticsService)

        assert service._score_to_grade(95) == "A"
        assert service._score_to_grade(90) == "A"
        assert service._score_to_grade(89) == "B"
        assert service._score_to_grade(80) == "B"
        assert service._score_to_grade(79) == "C"
        assert service._score_to_grade(70) == "C"
        assert service._score_to_grade(69) == "D"
        assert service._score_to_grade(60) == "D"
        assert service._score_to_grade(59) == "F"

    def test_determine_trend_improving(self):
        """Test trend detection for improving metrics."""
        service = AnalyticsService.__new__(AnalyticsService)

        ratios = [
            {"calculation_date": "2024-01-01", "roe": 0.10, "net_margin": 0.05, "debt_to_equity": 0.8},
            {"calculation_date": "2024-06-01", "roe": 0.15, "net_margin": 0.08, "debt_to_equity": 0.6},
        ]

        trend = service._determine_trend(ratios)

        assert trend == "improving"

    def test_determine_trend_declining(self):
        """Test trend detection for declining metrics."""
        service = AnalyticsService.__new__(AnalyticsService)

        ratios = [
            {"calculation_date": "2024-01-01", "roe": 0.15, "net_margin": 0.08, "debt_to_equity": 0.5},
            {"calculation_date": "2024-06-01", "roe": 0.08, "net_margin": 0.03, "debt_to_equity": 1.0},
        ]

        trend = service._determine_trend(ratios)

        assert trend == "declining"

    def test_determine_trend_stable(self):
        """Test trend detection for stable metrics."""
        service = AnalyticsService.__new__(AnalyticsService)

        ratios = [
            {"calculation_date": "2024-01-01", "roe": 0.10, "net_margin": 0.05},
            {"calculation_date": "2024-06-01", "roe": 0.10, "net_margin": 0.05},
        ]

        trend = service._determine_trend(ratios)

        assert trend == "stable"


class TestRatioCalculations:
    """Unit tests for ratio calculations."""

    def test_current_ratio(self):
        """Test current ratio calculation."""
        from arc.utils.calculations import calculate_current_ratio

        result = calculate_current_ratio(
            current_assets=1000000,
            current_liabilities=500000
        )

        assert result == 2.0

    def test_current_ratio_zero_liabilities(self):
        """Test current ratio with zero liabilities."""
        from arc.utils.calculations import calculate_current_ratio

        result = calculate_current_ratio(
            current_assets=1000000,
            current_liabilities=0
        )

        assert result is None  # Cannot divide by zero

    def test_debt_to_equity(self):
        """Test debt to equity calculation."""
        from arc.utils.calculations import calculate_debt_to_equity

        result = calculate_debt_to_equity(
            total_debt=500000,
            total_equity=1000000
        )

        assert result == 0.5

    def test_roe(self):
        """Test return on equity calculation."""
        from arc.utils.calculations import calculate_roe

        result = calculate_roe(
            net_income=100000,
            average_equity=1000000
        )

        assert result == 0.10
```

**File**: `tests/unit/utils/test_formatters.py`

```python
import pytest
from arc.utils.formatters import (
    format_currency,
    format_percentage,
    format_ratio,
    format_timestamp
)

class TestCurrencyFormatter:
    """Tests for currency formatting."""

    def test_format_currency_usd(self):
        assert format_currency(1000000, "USD") == "$1,000,000"

    def test_format_currency_with_decimals(self):
        assert format_currency(1234.56, "USD", decimals=2) == "$1,234.56"

    def test_format_currency_negative(self):
        assert format_currency(-1000, "USD") == "-$1,000"

    def test_format_currency_zero(self):
        assert format_currency(0, "USD") == "$0"


class TestPercentageFormatter:
    """Tests for percentage formatting."""

    def test_format_percentage_decimal(self):
        assert format_percentage(0.1523) == "15.23%"

    def test_format_percentage_whole(self):
        assert format_percentage(0.5) == "50.00%"

    def test_format_percentage_negative(self):
        assert format_percentage(-0.05) == "-5.00%"


class TestRatioFormatter:
    """Tests for ratio formatting."""

    def test_format_ratio_decimal(self):
        assert format_ratio(1.5, "decimal") == "1.50"

    def test_format_ratio_multiple(self):
        assert format_ratio(2.5, "multiple") == "2.5x"

    def test_format_ratio_none(self):
        assert format_ratio(None, "decimal") == "N/A"
```

### 2.4 Running Unit Tests

```bash
# Run all unit tests
pytest tests/unit -v

# Run with coverage
pytest tests/unit --cov=arc --cov-report=html

# Run specific test file
pytest tests/unit/services/test_analytics_service.py -v

# Run tests matching pattern
pytest tests/unit -k "test_calculate" -v
```

---

## 3. Tier 2: Integration Tests

### 3.1 Scope

Integration tests verify component interactions with REAL infrastructure.

**What to test:**
- DataFlow CRUD operations (real PostgreSQL)
- Workflow execution (real runtime)
- Service layer with database
- Cache operations (real Redis)
- API endpoints

**NO MOCKING ALLOWED:**
- Database connections
- Workflow runtime
- Cache clients

### 3.2 Test Infrastructure

**File**: `tests/integration/conftest.py`

```python
import pytest
import asyncio
from dataflow import DataFlow
from arc.models import register_all_models
import os

# CRITICAL: Use real PostgreSQL, not SQLite
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://test:test@localhost:5432/arc_test"
)

TEST_REDIS_URL = os.getenv(
    "TEST_REDIS_URL",
    "redis://localhost:6379/1"
)

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db():
    """Create real database connection for tests."""
    # CRITICAL: auto_migrate=False for async context
    database = DataFlow(
        TEST_DATABASE_URL,
        auto_migrate=False
    )

    # Register models
    register_all_models(database)

    # Create tables in async context
    await database.create_tables_async()

    yield database

    # Cleanup
    await database.close_async()

@pytest.fixture(autouse=True)
async def clean_database(db):
    """Clean database before each test."""
    # Delete in reverse dependency order
    models = [
        "Alert", "AlertThreshold", "SecurityRatio",
        "PriceHistory", "CompanyFundamentals",
        "Transaction", "Holding", "PortfolioValuation", "Portfolio",
        "Security", "User", "Tenant"
    ]

    for model in models:
        try:
            await db.express.delete_all(model)
        except Exception:
            pass  # Model may not exist yet

    yield

@pytest.fixture
async def sample_tenant(db):
    """Create a sample tenant for tests."""
    tenant = await db.express.create("Tenant", {
        "id": "tenant-test",
        "name": "Test Organization",
        "subscription_tier": "enterprise",
        "status": "active"
    })
    return tenant

@pytest.fixture
async def sample_user(db, sample_tenant):
    """Create a sample user for tests."""
    user = await db.express.create("User", {
        "id": "user-test",
        "email": "test@example.com",
        "name": "Test User",
        "role": "manager",
        "tenant_id": sample_tenant["id"],
        "status": "active"
    })
    return user

@pytest.fixture
async def sample_portfolio(db, sample_user):
    """Create a sample portfolio for tests."""
    portfolio = await db.express.create("Portfolio", {
        "id": "portfolio-test",
        "name": "Test Portfolio",
        "code": "TEST001",
        "portfolio_type": "managed",
        "base_currency": "USD",
        "inception_date": "2024-01-01",
        "manager_id": sample_user["id"],
        "risk_profile": "moderate",
        "active": True
    })
    return portfolio

@pytest.fixture
async def sample_securities(db):
    """Create sample securities for tests."""
    securities = []
    for ticker in ["AAPL", "MSFT", "GOOGL"]:
        security = await db.express.create("Security", {
            "id": f"sec-{ticker.lower()}",
            "ticker": ticker,
            "name": f"{ticker} Inc",
            "security_type": "equity",
            "exchange": "NASDAQ",
            "currency": "USD",
            "sector": "Technology",
            "industry": "Software",
            "active": True
        })
        securities.append(security)
    return securities
```

### 3.3 Service Integration Tests

**File**: `tests/integration/services/test_portfolio_service.py`

```python
import pytest
from arc.services.portfolio_service import PortfolioService
from decimal import Decimal

@pytest.mark.asyncio
class TestPortfolioServiceIntegration:
    """Integration tests for PortfolioService with real database."""

    async def test_create_portfolio(self, db, sample_user):
        """Test creating a portfolio."""
        service = PortfolioService(db)

        portfolio = await service.create_portfolio(
            name="My Portfolio",
            code="PORT001",
            manager_id=sample_user["id"],
            portfolio_type="managed",
            base_currency="USD",
            risk_profile="moderate"
        )

        assert portfolio["id"].startswith("pf-")
        assert portfolio["name"] == "My Portfolio"
        assert portfolio["code"] == "PORT001"
        assert portfolio["active"] is True

        # Verify in database
        saved = await db.express.read("Portfolio", portfolio["id"])
        assert saved is not None
        assert saved["name"] == "My Portfolio"

    async def test_create_portfolio_duplicate_code(self, db, sample_user, sample_portfolio):
        """Test that duplicate codes are rejected."""
        service = PortfolioService(db)

        with pytest.raises(ValueError, match="already exists"):
            await service.create_portfolio(
                name="Another Portfolio",
                code=sample_portfolio["code"],  # Duplicate
                manager_id=sample_user["id"]
            )

    async def test_add_holding(self, db, sample_portfolio, sample_securities):
        """Test adding holdings to a portfolio."""
        service = PortfolioService(db)
        security = sample_securities[0]

        holding = await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("100"),
            cost_basis=Decimal("150.00"),
            acquisition_date="2024-01-15"
        )

        assert holding["quantity"] == 100
        assert holding["cost_basis"] == 150.00
        assert holding["portfolio_id"] == sample_portfolio["id"]

    async def test_add_holding_updates_existing(self, db, sample_portfolio, sample_securities):
        """Test that adding to existing holding updates quantity."""
        service = PortfolioService(db)
        security = sample_securities[0]

        # First purchase
        await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("100"),
            cost_basis=Decimal("150.00"),
            acquisition_date="2024-01-15"
        )

        # Second purchase
        holding = await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("50"),
            cost_basis=Decimal("160.00"),
            acquisition_date="2024-02-01"
        )

        # Quantity should be combined
        assert holding["quantity"] == 150
        # Cost basis should be weighted average
        expected_cost = (100 * 150 + 50 * 160) / 150
        assert abs(holding["cost_basis"] - expected_cost) < 0.01

    async def test_record_transaction(self, db, sample_portfolio, sample_securities):
        """Test recording a transaction."""
        service = PortfolioService(db)
        security = sample_securities[0]

        transaction = await service.record_transaction(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            transaction_type="buy",
            quantity=Decimal("100"),
            price=Decimal("150.00"),
            trade_date="2024-01-15",
            fees=Decimal("9.99")
        )

        assert transaction["transaction_type"] == "buy"
        assert transaction["quantity"] == 100
        assert transaction["gross_amount"] == 15000.00
        assert transaction["fees"] == 9.99

        # Verify holding was created
        holdings = await service.get_holdings(sample_portfolio["id"])
        assert len(holdings) == 1
        assert holdings[0]["quantity"] == 100

    async def test_get_holdings_excludes_closed(self, db, sample_portfolio, sample_securities):
        """Test that closed positions are excluded by default."""
        service = PortfolioService(db)
        security = sample_securities[0]

        # Add then sell all
        await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("100"),
            cost_basis=Decimal("150.00"),
            acquisition_date="2024-01-15"
        )
        await service.add_holding(
            portfolio_id=sample_portfolio["id"],
            security_id=security["id"],
            quantity=Decimal("-100"),
            cost_basis=Decimal("0"),
            acquisition_date="2024-02-01"
        )

        # Should exclude zero positions
        holdings = await service.get_holdings(sample_portfolio["id"])
        assert len(holdings) == 0

        # Include closed should show it
        holdings_with_closed = await service.get_holdings(
            sample_portfolio["id"],
            include_closed=True
        )
        assert len(holdings_with_closed) == 1
```

### 3.4 Workflow Integration Tests

**File**: `tests/integration/workflows/test_ratio_calculation.py`

```python
import pytest
from kailash.runtime import AsyncLocalRuntime
from arc.workflows.analytics import create_ratio_calculation_workflow

@pytest.mark.asyncio
class TestRatioCalculationWorkflow:
    """Integration tests for ratio calculation workflow."""

    async def test_calculate_ratios_for_security(self, db, sample_securities):
        """Test ratio calculation for a security with fundamentals."""
        security = sample_securities[0]

        # Create fundamental data
        await db.express.create("CompanyFundamentals", {
            "id": f"fund-{security['id']}-2024q1",
            "security_id": security["id"],
            "period_end_date": "2024-03-31",
            "period_type": "quarterly",
            "revenue": 94836000000,
            "net_income": 23050000000,
            "total_assets": 352583000000,
            "current_assets": 143692000000,
            "current_liabilities": 145308000000,
            "total_liabilities": 290437000000,
            "total_equity": 62146000000,
            "cash_and_equivalents": 29965000000,
            "total_debt": 113959000000,
            "operating_cash_flow": 26385000000,
            "ebitda": 29500000000
        })

        # Create price data
        await db.express.create("PriceHistory", {
            "id": f"price-{security['id']}-20240331",
            "security_id": security["id"],
            "price_date": "2024-03-31",
            "close": 171.48,
            "volume": 50000000
        })

        # Execute workflow
        workflow = create_ratio_calculation_workflow()
        runtime = AsyncLocalRuntime()

        results, run_id = await runtime.execute_workflow_async(
            workflow,
            inputs={"security_ids": [security["id"]]}
        )

        # Verify ratios were calculated
        ratios = await db.express.list(
            "SecurityRatio",
            filter={"security_id": security["id"]},
            limit=1
        )

        assert len(ratios) == 1
        ratio = ratios[0]

        # Verify specific ratios
        assert ratio["current_ratio"] is not None
        assert 0 < ratio["current_ratio"] < 5
        assert ratio["roe"] is not None
        assert ratio["debt_to_equity"] is not None

    async def test_calculate_ratios_missing_fundamentals(self, db, sample_securities):
        """Test ratio calculation handles missing data gracefully."""
        security = sample_securities[1]  # No fundamentals created

        workflow = create_ratio_calculation_workflow()
        runtime = AsyncLocalRuntime()

        results, run_id = await runtime.execute_workflow_async(
            workflow,
            inputs={"security_ids": [security["id"]]}
        )

        # Should not create ratios for securities without fundamentals
        ratios = await db.express.list(
            "SecurityRatio",
            filter={"security_id": security["id"]},
            limit=1
        )

        assert len(ratios) == 0
```

### 3.5 API Integration Tests

**File**: `tests/integration/api/test_portfolio_endpoints.py`

```python
import pytest
from httpx import AsyncClient
from arc.api.app import app

@pytest.fixture
async def client(db):
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def auth_headers(sample_user):
    """Create authenticated headers."""
    # Generate test JWT token
    from arc.api.auth import create_access_token
    token = create_access_token({"sub": sample_user["id"]})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
class TestPortfolioEndpoints:
    """Integration tests for portfolio API endpoints."""

    async def test_create_portfolio(self, client, auth_headers):
        """Test POST /portfolios."""
        response = await client.post(
            "/portfolios",
            headers=auth_headers,
            json={
                "name": "API Test Portfolio",
                "code": "API001",
                "portfolio_type": "managed",
                "base_currency": "USD",
                "risk_profile": "moderate"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "API Test Portfolio"
        assert "id" in data

    async def test_list_portfolios(self, client, auth_headers, sample_portfolio):
        """Test GET /portfolios."""
        response = await client.get(
            "/portfolios",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1

    async def test_get_portfolio(self, client, auth_headers, sample_portfolio):
        """Test GET /portfolios/{id}."""
        response = await client.get(
            f"/portfolios/{sample_portfolio['id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_portfolio["id"]

    async def test_get_portfolio_not_found(self, client, auth_headers):
        """Test GET /portfolios/{id} with invalid ID."""
        response = await client.get(
            "/portfolios/invalid-id",
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_update_portfolio(self, client, auth_headers, sample_portfolio):
        """Test PATCH /portfolios/{id}."""
        response = await client.patch(
            f"/portfolios/{sample_portfolio['id']}",
            headers=auth_headers,
            json={"name": "Updated Name"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    async def test_unauthorized_access(self, client, sample_portfolio):
        """Test endpoints require authentication."""
        response = await client.get(f"/portfolios/{sample_portfolio['id']}")

        assert response.status_code == 401
```

### 3.6 Running Integration Tests

```bash
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pytest tests/integration -v

# Run with specific markers
pytest tests/integration -m "slow" -v

# Run API tests only
pytest tests/integration/api -v
```

---

## 4. Tier 3: End-to-End Tests

### 4.1 Scope

E2E tests verify complete user journeys through the entire system.

**What to test:**
- Complete user workflows
- Multi-service interactions
- Real external APIs (with fixtures)
- Full stack (API + Workers + Database)

### 4.2 E2E Test Examples

**File**: `tests/e2e/test_portfolio_workflow.py`

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
@pytest.mark.e2e
class TestPortfolioWorkflowE2E:
    """End-to-end tests for complete portfolio workflows."""

    async def test_complete_portfolio_setup_workflow(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test complete workflow:
        1. Create portfolio
        2. Add securities
        3. Record transactions
        4. Calculate ratios
        5. Run health scan
        6. Generate report
        """
        # Step 1: Create portfolio
        portfolio_response = await client.post(
            "/portfolios",
            headers=auth_headers,
            json={
                "name": "E2E Test Portfolio",
                "code": "E2E001",
                "portfolio_type": "managed",
                "base_currency": "USD"
            }
        )
        assert portfolio_response.status_code == 201
        portfolio = portfolio_response.json()

        # Step 2: Add transactions (which create holdings)
        transactions = [
            {"ticker": "AAPL", "quantity": 100, "price": 150.00},
            {"ticker": "MSFT", "quantity": 50, "price": 380.00},
            {"ticker": "GOOGL", "quantity": 25, "price": 140.00},
        ]

        for txn in transactions:
            # Get or create security
            security_response = await client.get(
                f"/securities/search?ticker={txn['ticker']}",
                headers=auth_headers
            )
            security = security_response.json()["items"][0]

            # Record transaction
            txn_response = await client.post(
                f"/portfolios/{portfolio['id']}/transactions",
                headers=auth_headers,
                json={
                    "security_id": security["id"],
                    "transaction_type": "buy",
                    "quantity": txn["quantity"],
                    "price": txn["price"],
                    "trade_date": "2024-01-15"
                }
            )
            assert txn_response.status_code == 201

        # Step 3: Verify holdings
        holdings_response = await client.get(
            f"/portfolios/{portfolio['id']}/holdings",
            headers=auth_headers
        )
        assert holdings_response.status_code == 200
        holdings = holdings_response.json()["items"]
        assert len(holdings) == 3

        # Step 4: Trigger ratio calculation
        calc_response = await client.post(
            "/analytics/calculate-ratios",
            headers=auth_headers,
            json={"portfolio_id": portfolio["id"]}
        )
        assert calc_response.status_code == 202

        # Wait for calculation to complete
        import asyncio
        await asyncio.sleep(5)

        # Step 5: Run health scan
        scan_response = await client.post(
            f"/portfolios/{portfolio['id']}/health-scan",
            headers=auth_headers
        )
        assert scan_response.status_code == 200
        health = scan_response.json()
        assert "overall_score" in health
        assert 0 <= health["overall_score"] <= 100

        # Step 6: Verify analytics available
        for holding in holdings:
            ratios_response = await client.get(
                f"/analytics/securities/{holding['security_id']}/ratios",
                headers=auth_headers
            )
            assert ratios_response.status_code == 200

    async def test_alert_workflow(
        self,
        client: AsyncClient,
        auth_headers: dict,
        sample_portfolio: dict
    ):
        """
        Test alert workflow:
        1. Configure threshold
        2. Trigger condition
        3. Verify alert created
        4. Acknowledge alert
        """
        # Step 1: Configure threshold
        threshold_response = await client.post(
            "/analytics/thresholds",
            headers=auth_headers,
            json={
                "ratio_name": "current_ratio",
                "lower_threshold": 1.0,
                "portfolio_ids": [sample_portfolio["id"]],
                "alert_channels": ["in_app"]
            }
        )
        assert threshold_response.status_code == 201
        threshold = threshold_response.json()

        # Step 2: Create security with low current ratio
        # (In real test, this would trigger via data sync)

        # Step 3: Trigger threshold check
        check_response = await client.post(
            "/analytics/check-thresholds",
            headers=auth_headers
        )
        assert check_response.status_code == 200

        # Step 4: Verify alerts
        alerts_response = await client.get(
            "/analytics/alerts?status=new",
            headers=auth_headers
        )
        alerts = alerts_response.json()["items"]
        # Verify any new alerts match our threshold
```

### 4.3 Running E2E Tests

```bash
# E2E tests require full infrastructure
docker-compose up -d

# Run E2E tests
pytest tests/e2e -v -m e2e

# Run with timeout for long tests
pytest tests/e2e -v --timeout=120
```

---

## 5. Test Configuration

### 5.1 pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
markers =
    unit: Unit tests (fast, mocked)
    integration: Integration tests (real database)
    e2e: End-to-end tests (full system)
    slow: Slow running tests
filterwarnings =
    ignore::DeprecationWarning
addopts = --strict-markers -v
```

### 5.2 conftest.py (Root)

```python
import pytest
import os

def pytest_configure(config):
    """Configure test environment."""
    # Ensure test database is used
    os.environ.setdefault(
        "DATABASE_URL",
        "postgresql://test:test@localhost:5432/arc_test"
    )
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
    os.environ.setdefault("TESTING", "true")

def pytest_collection_modifyitems(config, items):
    """Automatically mark tests based on location."""
    for item in items:
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
            item.add_marker(pytest.mark.slow)
```

---

## 6. Implementation Checklist

### Phase 1: Infrastructure
- [ ] Set up test database (PostgreSQL + pgvector)
- [ ] Set up test Redis
- [ ] Create docker-compose.test.yml
- [ ] Configure pytest with markers

### Phase 2: Unit Tests
- [ ] Create unit test fixtures
- [ ] Write service calculation tests
- [ ] Write utility function tests
- [ ] Write signature validation tests
- [ ] Achieve 80%+ unit test coverage

### Phase 3: Integration Tests
- [ ] Create integration test fixtures
- [ ] Write DataFlow CRUD tests
- [ ] Write workflow execution tests
- [ ] Write API endpoint tests
- [ ] Write cache operation tests

### Phase 4: E2E Tests
- [ ] Create E2E test infrastructure
- [ ] Write portfolio workflow tests
- [ ] Write alert workflow tests
- [ ] Write intelligence workflow tests
- [ ] Write sync workflow tests

### Phase 5: CI Integration
- [ ] Configure GitHub Actions for tests
- [ ] Set up test coverage reporting
- [ ] Configure test parallelization
- [ ] Add test result notifications
