"""
Integration tests for OAuth API endpoints.

Tests the full OAuth flow with real HTTP requests using FastAPI TestClient.
Uses real SSO service but mocks external IdP calls.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import UTC, datetime


@pytest.fixture
def client():
    """Create test client for API."""
    from arc.api.app import app
    return TestClient(app)


@pytest.fixture
def mock_sso_service():
    """Mock SSO service for all tests."""
    with patch("arc.services.sso.sso_service") as mock_sso:
        yield mock_sso


class TestOAuthStartEndpoint:
    """Test POST /api/v1/auth/oauth/{provider} endpoint."""

    def test_oauth_start_azure_success(self, client, mock_sso_service):
        """Test OAuth start for Azure provider."""
        # Mock SSO service response
        mock_sso_service.start_oauth = AsyncMock(return_value={
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=test",
            "state": "random-state-32-bytes",
            "code_verifier": "random-verifier-32-bytes",
            "return_url": "/dashboard",
        })

        # Make request with query parameters (Nexus pattern)
        response = client.post(
            "/api/v1/auth/oauth/azure?tenant_id=tenant-123&return_url=/dashboard",
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "state" in data
        assert data["auth_url"].startswith("https://login.microsoftonline.com")
        assert len(data["state"]) > 0

    def test_oauth_start_google_success(self, client, mock_sso_service):
        """Test OAuth start for Google provider."""
        mock_sso_service.start_oauth = AsyncMock(return_value={
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=test",
            "state": "google-state-123",
            "code_verifier": "google-verifier-456",
            "return_url": "/portfolio",
        })

        response = client.post(
            "/api/v1/auth/oauth/google",
            json={
                "tenant_id": "tenant-456",
                "return_url": "/portfolio",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["auth_url"].startswith("https://accounts.google.com")

    def test_oauth_start_github_success(self, client, mock_sso_service):
        """Test OAuth start for GitHub provider."""
        mock_sso_service.start_oauth = AsyncMock(return_value={
            "auth_url": "https://github.com/login/oauth/authorize?client_id=test",
            "state": "github-state-789",
            "code_verifier": "github-verifier-012",
            "return_url": "/analytics",
        })

        response = client.post(
            "/api/v1/auth/oauth/github",
            json={
                "tenant_id": "tenant-789",
                "return_url": "/analytics",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["auth_url"].startswith("https://github.com")

    def test_oauth_start_invalid_provider(self, client, mock_sso_service):
        """Test OAuth start with invalid provider."""
        mock_sso_service.start_oauth = AsyncMock(
            side_effect=ValueError("Provider invalid not configured or disabled")
        )

        response = client.post(
            "/api/v1/auth/oauth/invalid",
            json={
                "tenant_id": "tenant-123",
                "return_url": "/dashboard",
            },
        )

        # Should return error
        assert response.status_code in [400, 500]

    def test_oauth_start_missing_tenant_id(self, client):
        """Test OAuth start without tenant_id."""
        response = client.post(
            "/api/v1/auth/oauth/azure",
            json={
                "return_url": "/dashboard",
            },
        )

        # Should return validation error
        assert response.status_code in [400, 422]

    def test_oauth_start_default_return_url(self, client, mock_sso_service):
        """Test OAuth start without return_url (should use default)."""
        mock_sso_service.start_oauth = AsyncMock(return_value={
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "state": "state-123",
            "code_verifier": "verifier-456",
            "return_url": "/dashboard",
        })

        response = client.post(
            "/api/v1/auth/oauth/azure",
            json={
                "tenant_id": "tenant-123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data


class TestOAuthCallbackEndpoint:
    """Test POST /api/v1/auth/oauth/{provider}/callback endpoint."""

    def test_oauth_callback_new_user_success(self, client, mock_sso_service):
        """Test OAuth callback for new user (auto-provision)."""
        # Mock SSO service
        mock_sso_service.handle_callback = AsyncMock(return_value={
            "action": "created",
            "user": {
                "id": "user-new-123",
                "email": "newuser@example.com",
                "name": "New User",
                "role": "viewer",
                "tenant_id": "tenant-123",
            },
        })

        # Mock token creation
        with patch("arc.api.auth.create_access_token") as mock_access, \
             patch("arc.api.auth.create_refresh_token") as mock_refresh:

            mock_access.return_value = "access-token-xyz"
            mock_refresh.return_value = "refresh-token-abc"

            response = client.post(
                "/api/v1/auth/oauth/azure/callback",
                json={
                    "tenant_id": "tenant-123",
                    "code": "auth-code-from-azure",
                    "state": "expected-state-123",
                    "code_verifier": "verifier-from-start",
                },
            )

            assert response.status_code == 200
            data = response.json()

            # Verify response structure
            assert data["action"] == "created"
            assert data["access_token"] == "access-token-xyz"
            assert data["refresh_token"] == "refresh-token-abc"
            assert data["expires_in"] == 900
            assert data["user"]["id"] == "user-new-123"
            assert data["user"]["email"] == "newuser@example.com"

    def test_oauth_callback_existing_linked_user(self, client, mock_sso_service):
        """Test OAuth callback for existing linked user."""
        mock_sso_service.handle_callback = AsyncMock(return_value={
            "action": "login",
            "user": {
                "id": "user-existing-456",
                "email": "existing@example.com",
                "name": "Existing User",
                "role": "admin",
                "tenant_id": "tenant-123",
            },
        })

        with patch("arc.api.auth.create_access_token") as mock_access, \
             patch("arc.api.auth.create_refresh_token") as mock_refresh:

            mock_access.return_value = "access-token-existing"
            mock_refresh.return_value = "refresh-token-existing"

            response = client.post(
                "/api/v1/auth/oauth/google/callback",
                json={
                    "tenant_id": "tenant-123",
                    "code": "google-auth-code",
                    "state": "google-state",
                    "code_verifier": "google-verifier",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["action"] == "login"
            assert data["user"]["role"] == "admin"

    def test_oauth_callback_link_required(self, client, mock_sso_service):
        """Test OAuth callback when account linking is required."""
        mock_sso_service.handle_callback = AsyncMock(return_value={
            "action": "link_required",
            "user_id": "user-unlinked-789",
            "provider": "github",
            "provider_user_id": "github-123456",
            "provider_email": "user@example.com",
            "provider_name": "GitHub User",
        })

        response = client.post(
            "/api/v1/auth/oauth/github/callback",
            json={
                "tenant_id": "tenant-123",
                "code": "github-code",
                "state": "github-state",
                "code_verifier": "github-verifier",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Verify link_required response
        assert data["action"] == "link_required"
        assert "link_data" in data
        assert data["link_data"]["user_id"] == "user-unlinked-789"
        assert data["link_data"]["provider"] == "github"
        assert data["link_data"]["provider_email"] == "user@example.com"

    def test_oauth_callback_invalid_state(self, client, mock_sso_service):
        """Test OAuth callback with invalid state parameter."""
        mock_sso_service.handle_callback = AsyncMock(
            side_effect=ValueError("Invalid state parameter")
        )

        response = client.post(
            "/api/v1/auth/oauth/azure/callback",
            json={
                "tenant_id": "tenant-123",
                "code": "auth-code",
                "state": "wrong-state",
                "code_verifier": "verifier",
            },
        )

        # Should return error
        assert response.status_code in [401, 500]

    def test_oauth_callback_exchange_failure(self, client, mock_sso_service):
        """Test OAuth callback when token exchange fails."""
        mock_sso_service.handle_callback = AsyncMock(
            side_effect=ValueError("Token exchange failed: invalid_grant")
        )

        response = client.post(
            "/api/v1/auth/oauth/google/callback",
            json={
                "tenant_id": "tenant-123",
                "code": "expired-code",
                "state": "valid-state",
                "code_verifier": "verifier",
            },
        )

        # Should return 502 Bad Gateway or 500
        assert response.status_code in [500, 502]

    def test_oauth_callback_missing_parameters(self, client):
        """Test OAuth callback with missing required parameters."""
        # Missing code
        response = client.post(
            "/api/v1/auth/oauth/azure/callback",
            json={
                "tenant_id": "tenant-123",
                "state": "state",
                "code_verifier": "verifier",
            },
        )
        assert response.status_code in [400, 422]

        # Missing state
        response = client.post(
            "/api/v1/auth/oauth/azure/callback",
            json={
                "tenant_id": "tenant-123",
                "code": "code",
                "code_verifier": "verifier",
            },
        )
        assert response.status_code in [400, 422]

        # Missing code_verifier
        response = client.post(
            "/api/v1/auth/oauth/azure/callback",
            json={
                "tenant_id": "tenant-123",
                "code": "code",
                "state": "state",
            },
        )
        assert response.status_code in [400, 422]


class TestOAuthFlowIntegration:
    """Test complete OAuth flow from start to callback."""

    def test_complete_oauth_flow(self, client, mock_sso_service):
        """Test complete OAuth flow: start -> redirect -> callback -> tokens."""
        # Step 1: Start OAuth flow
        mock_sso_service.start_oauth = AsyncMock(return_value={
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "state": "flow-state-123",
            "code_verifier": "flow-verifier-456",
            "return_url": "/dashboard",
        })

        start_response = client.post(
            "/api/v1/auth/oauth/azure",
            json={
                "tenant_id": "tenant-123",
                "return_url": "/dashboard",
            },
        )

        assert start_response.status_code == 200
        start_data = start_response.json()
        state = start_data["state"]

        # In real flow, user would be redirected to auth_url and return with code

        # Step 2: Handle callback
        mock_sso_service.handle_callback = AsyncMock(return_value={
            "action": "created",
            "user": {
                "id": "user-flow-789",
                "email": "flowuser@example.com",
                "name": "Flow User",
                "role": "viewer",
                "tenant_id": "tenant-123",
            },
        })

        with patch("arc.api.auth.create_access_token") as mock_access, \
             patch("arc.api.auth.create_refresh_token") as mock_refresh:

            mock_access.return_value = "flow-access-token"
            mock_refresh.return_value = "flow-refresh-token"

            callback_response = client.post(
                "/api/v1/auth/oauth/azure/callback",
                json={
                    "tenant_id": "tenant-123",
                    "code": "auth-code-from-idp",
                    "state": state,  # Use state from start
                    "code_verifier": "flow-verifier-456",
                },
            )

            assert callback_response.status_code == 200
            callback_data = callback_response.json()

            # Verify tokens were issued
            assert callback_data["access_token"] == "flow-access-token"
            assert callback_data["refresh_token"] == "flow-refresh-token"
            assert callback_data["user"]["email"] == "flowuser@example.com"

    def test_all_providers_flow(self, client, mock_sso_service):
        """Test OAuth flow works for all three providers."""
        providers = ["azure", "google", "github"]

        for provider in providers:
            # Start flow
            mock_sso_service.start_oauth = AsyncMock(return_value={
                "auth_url": f"https://{provider}.example.com/oauth",
                "state": f"{provider}-state",
                "code_verifier": f"{provider}-verifier",
                "return_url": "/dashboard",
            })

            start_response = client.post(
                f"/api/v1/auth/oauth/{provider}",
                json={
                    "tenant_id": "tenant-multi",
                    "return_url": "/dashboard",
                },
            )

            assert start_response.status_code == 200, f"Failed for {provider}"

            # Callback
            mock_sso_service.handle_callback = AsyncMock(return_value={
                "action": "login",
                "user": {
                    "id": f"user-{provider}",
                    "email": f"{provider}@example.com",
                    "name": f"{provider.title()} User",
                    "role": "viewer",
                    "tenant_id": "tenant-multi",
                },
            })

            with patch("arc.api.auth.create_access_token") as mock_access, \
                 patch("arc.api.auth.create_refresh_token") as mock_refresh:

                mock_access.return_value = f"{provider}-access-token"
                mock_refresh.return_value = f"{provider}-refresh-token"

                callback_response = client.post(
                    f"/api/v1/auth/oauth/{provider}/callback",
                    json={
                        "tenant_id": "tenant-multi",
                        "code": f"{provider}-code",
                        "state": f"{provider}-state",
                        "code_verifier": f"{provider}-verifier",
                    },
                )

                assert callback_response.status_code == 200, f"Failed callback for {provider}"
                data = callback_response.json()
                assert data["user"]["email"] == f"{provider}@example.com"
