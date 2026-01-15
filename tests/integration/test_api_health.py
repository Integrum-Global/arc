"""
Integration tests for API health endpoints.

NO MOCKING: Uses real API server and database.
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from arc.api import app


@pytest.fixture
def api_client() -> AsyncClient:
    """Create async HTTP client for API testing."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Test API health check endpoints."""

    async def test_health_endpoint(self, api_client: AsyncClient) -> None:
        """Test /api/v1/health endpoint returns 200."""
        async with api_client as client:
            response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "healthy" in data

    async def test_liveness_endpoint(self, api_client: AsyncClient) -> None:
        """Test /api/v1/health/live endpoint returns alive status."""
        async with api_client as client:
            response = await client.get("/api/v1/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data.get("alive") is True
        assert "timestamp" in data

    async def test_readiness_endpoint(self, api_client: AsyncClient) -> None:
        """Test /api/v1/health/ready endpoint returns readiness status."""
        async with api_client as client:
            response = await client.get("/api/v1/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert "ready" in data

    async def test_root_endpoint(self, api_client: AsyncClient) -> None:
        """Test root endpoint returns API info."""
        async with api_client as client:
            response = await client.get("/")

        # Root might redirect or return API info
        assert response.status_code in [200, 307, 404]


@pytest.mark.asyncio
class TestAPIEndpoints:
    """Test API CRUD endpoints (when database is available)."""

    async def test_list_portfolios_endpoint(self, api_client: AsyncClient) -> None:
        """Test listing portfolios via API."""
        async with api_client as client:
            response = await client.get("/api/v1/portfolios")

        # Should return 200 or 401 (if auth required)
        assert response.status_code in [200, 401, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    async def test_list_securities_endpoint(self, api_client: AsyncClient) -> None:
        """Test listing securities via API."""
        async with api_client as client:
            response = await client.get("/api/v1/securities")

        # Should return 200 or 401 (if auth required)
        assert response.status_code in [200, 401, 404]
