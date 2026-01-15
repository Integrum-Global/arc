"""
Integration test fixtures with real infrastructure.

NO MOCKING POLICY: These tests use real PostgreSQL and Redis instances.
"""

import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio

# Configure test environment BEFORE importing arc modules
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5433"  # Test PostgreSQL port
os.environ["DB_DATABASE"] = "arc_test"
os.environ["DB_USERNAME"] = "arc_test"
os.environ["DB_PASSWORD"] = "arc_test_password"
os.environ["REDIS_HOST"] = "localhost"
os.environ["REDIS_PORT"] = "6380"  # Test Redis port
os.environ["ENVIRONMENT"] = "development"  # Valid environment for testing


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_db_url() -> str:
    """Get test database URL."""
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5433")
    database = os.environ.get("DB_DATABASE", "arc_test")
    username = os.environ.get("DB_USERNAME", "arc_test")
    password = os.environ.get("DB_PASSWORD", "arc_test_password")
    return f"postgresql://{username}:{password}@{host}:{port}/{database}"


@pytest_asyncio.fixture(scope="function")
async def db_setup() -> AsyncGenerator[None, None]:
    """Set up and tear down database for each test.

    Uses the arc.models.db instance which is already configured
    with the test database settings from environment variables.
    """
    from arc.models import create_tables, close_database

    # Create tables
    await create_tables()

    yield

    # Cleanup
    await close_database()


@pytest_asyncio.fixture(scope="function")
async def dataflow(db_setup: None) -> AsyncGenerator:
    """Provide the DataFlow instance for tests.

    Tables are already created by db_setup fixture.
    Use db.express for CRUD operations to avoid event loop issues.
    """
    from arc.models import db

    # Initialize express API
    await db.initialize()

    yield db


@pytest_asyncio.fixture(scope="function")
async def sample_tenant(dataflow) -> dict:
    """Create a sample tenant for testing."""
    tenant_data = {
        "id": "tenant-test-001",
        "name": "Test Tenant",
        "subdomain": "test-tenant",  # Required field
        "plan": "professional",
        "active": True,
    }
    result = await dataflow.express.create("Tenant", tenant_data)
    return result


@pytest_asyncio.fixture(scope="function")
async def sample_user(dataflow, sample_tenant: dict) -> dict:
    """Create a sample user for testing."""
    user_data = {
        "id": "user-test-001",
        "tenant_id": sample_tenant["id"],
        "email": "test@example.com",
        "name": "Test User",
        "role": "user",
        "status": "active",
        "password_hash": "hashed_password",
    }
    result = await dataflow.express.create("User", user_data)
    return result


@pytest_asyncio.fixture(scope="function")
async def sample_portfolio(dataflow, sample_tenant: dict, sample_user: dict) -> dict:
    """Create a sample portfolio for testing."""
    portfolio_data = {
        "id": "portfolio-test-001",
        "tenant_id": sample_tenant["id"],
        "user_id": sample_user["id"],
        "name": "Test Portfolio",
        "code": "TEST",
        "portfolio_type": "individual",
        "base_currency": "USD",
        "active": True,
    }
    result = await dataflow.express.create("Portfolio", portfolio_data)
    return result


def pytest_configure(config: pytest.Config) -> None:
    """Configure pytest markers for integration tests."""
    config.addinivalue_line(
        "markers",
        "integration: marks tests as integration tests (require docker-compose.test.yml)",
    )


def pytest_collection_modifyitems(
    config: pytest.Config, items: list[pytest.Item]
) -> None:
    """Add integration marker to all tests in integration directory."""
    for item in items:
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
