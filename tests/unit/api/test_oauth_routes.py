"""
Unit tests for OAuth API routes.

Tests the OAuth route functions using mocked SSO service.
TDD pattern: Tests written before implementation.
"""

import pytest
from unittest.mock import AsyncMock, patch


class TestOAuthStartFunction:
    """Test OAuth start function."""

    @pytest.mark.asyncio
    async def test_oauth_start_azure_success(self):
        """Test OAuth start for Azure provider."""
        from arc.api.routes.oauth import start_oauth

        # Mock SSO service
        mock_result = {
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...",
            "state": "test-state-123",
            "code_verifier": "test-verifier-456",
            "return_url": "/dashboard",
        }

        with patch("arc.services.sso.sso_service.start_oauth", new_callable=AsyncMock) as mock_start:
            mock_start.return_value = mock_result

            # Call function
            result = await start_oauth(
                provider="azure",
                tenant_id="tenant-123",
                return_url="/dashboard",
            )

            # Verify SSO service was called correctly
            mock_start.assert_called_once_with(
                provider="azure",
                tenant_id="tenant-123",
                return_url="/dashboard",
            )

            # Verify result
            assert result["auth_url"] == mock_result["auth_url"]
            assert result["state"] == mock_result["state"]
            assert result["code_verifier"] == mock_result["code_verifier"]

    @pytest.mark.asyncio
    async def test_oauth_start_google_success(self):
        """Test OAuth start for Google provider."""
        from arc.api.routes.oauth import start_oauth

        mock_result = {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
            "state": "test-state-google",
            "code_verifier": "test-verifier-google",
            "return_url": "/portfolio",
        }

        with patch("arc.services.sso.sso_service.start_oauth", new_callable=AsyncMock) as mock_start:
            mock_start.return_value = mock_result

            result = await start_oauth(
                provider="google",
                tenant_id="tenant-456",
                return_url="/portfolio",
            )

            mock_start.assert_called_once_with(
                provider="google",
                tenant_id="tenant-456",
                return_url="/portfolio",
            )

            assert result["auth_url"] == mock_result["auth_url"]
            assert result["state"] == mock_result["state"]

    @pytest.mark.asyncio
    async def test_oauth_start_github_success(self):
        """Test OAuth start for GitHub provider."""
        from arc.api.routes.oauth import start_oauth

        mock_result = {
            "auth_url": "https://github.com/login/oauth/authorize?...",
            "state": "test-state-github",
            "code_verifier": "test-verifier-github",
            "return_url": "/analytics",
        }

        with patch("arc.services.sso.sso_service.start_oauth", new_callable=AsyncMock) as mock_start:
            mock_start.return_value = mock_result

            result = await start_oauth(
                provider="github",
                tenant_id="tenant-789",
                return_url="/analytics",
            )

            mock_start.assert_called_once_with(
                provider="github",
                tenant_id="tenant-789",
                return_url="/analytics",
            )

            assert result["state"] == mock_result["state"]

    @pytest.mark.asyncio
    async def test_oauth_start_invalid_provider(self):
        """Test OAuth start with invalid provider."""
        from arc.api.routes.oauth import start_oauth

        with patch(
            "arc.services.sso.sso_service.start_oauth",
            new_callable=AsyncMock,
            side_effect=ValueError("Provider invalid-provider not configured or disabled"),
        ):
            with pytest.raises(ValueError) as exc_info:
                await start_oauth(
                    provider="invalid-provider",
                    tenant_id="tenant-123",
                    return_url="/dashboard",
                )

            assert "not configured or disabled" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_oauth_start_default_return_url(self):
        """Test OAuth start with default return URL."""
        from arc.api.routes.oauth import start_oauth

        mock_result = {
            "auth_url": "https://login.microsoftonline.com/...",
            "state": "test-state",
            "code_verifier": "test-verifier",
            "return_url": "/dashboard",
        }

        with patch("arc.services.sso.sso_service.start_oauth", new_callable=AsyncMock) as mock_start:
            mock_start.return_value = mock_result

            result = await start_oauth(
                provider="azure",
                tenant_id="tenant-123",
                # return_url not provided - should use None
            )

            # Verify that None was passed (service will use default)
            mock_start.assert_called_once_with(
                provider="azure",
                tenant_id="tenant-123",
                return_url=None,
            )


class TestOAuthCallbackFunction:
    """Test OAuth callback function."""

    @pytest.mark.asyncio
    async def test_oauth_callback_new_user_success(self):
        """Test OAuth callback for new user (auto-provision)."""
        from arc.api.routes.oauth import handle_oauth_callback

        # Mock SSO service
        mock_sso_result = {
            "action": "created",
            "user": {
                "id": "user-new-123",
                "email": "newuser@example.com",
                "name": "New User",
                "role": "viewer",
                "tenant_id": "tenant-123",
            },
        }

        with patch("arc.services.sso.sso_service.handle_callback", new_callable=AsyncMock) as mock_callback, \
             patch("arc.api.auth.create_access_token") as mock_access_token, \
             patch("arc.api.auth.create_refresh_token") as mock_refresh_token, \
             patch("arc.api.auth.get_role_permissions") as mock_get_perms:

            mock_callback.return_value = mock_sso_result
            mock_access_token.return_value = "access-token-xyz"
            mock_refresh_token.return_value = "refresh-token-abc"
            mock_get_perms.return_value = []

            result = await handle_oauth_callback(
                provider="azure",
                tenant_id="tenant-123",
                code="auth-code-123",
                state="returned-state",
                code_verifier="verifier-123",
            )

            # Verify SSO service was called
            mock_callback.assert_called_once_with(
                provider="azure",
                tenant_id="tenant-123",
                code="auth-code-123",
                state="returned-state",
                code_verifier="verifier-123",
                expected_state="returned-state",
            )

            # Verify tokens were created
            mock_access_token.assert_called_once()
            mock_refresh_token.assert_called_once()

            # Verify result
            assert result["action"] == "created"
            assert result["access_token"] == "access-token-xyz"
            assert result["refresh_token"] == "refresh-token-abc"
            assert result["expires_in"] == 900
            assert result["user"]["id"] == "user-new-123"
            assert result["user"]["email"] == "newuser@example.com"

    @pytest.mark.asyncio
    async def test_oauth_callback_existing_linked_user(self):
        """Test OAuth callback for existing linked user."""
        from arc.api.routes.oauth import handle_oauth_callback

        mock_sso_result = {
            "action": "login",
            "user": {
                "id": "user-existing-456",
                "email": "existing@example.com",
                "name": "Existing User",
                "role": "admin",
                "tenant_id": "tenant-123",
            },
        }

        with patch("arc.services.sso.sso_service.handle_callback", new_callable=AsyncMock) as mock_callback, \
             patch("arc.api.auth.create_access_token") as mock_access_token, \
             patch("arc.api.auth.create_refresh_token") as mock_refresh_token, \
             patch("arc.api.auth.get_role_permissions") as mock_get_perms:

            mock_callback.return_value = mock_sso_result
            mock_access_token.return_value = "access-token-existing"
            mock_refresh_token.return_value = "refresh-token-existing"
            mock_get_perms.return_value = []

            result = await handle_oauth_callback(
                provider="google",
                tenant_id="tenant-123",
                code="google-auth-code",
                state="google-state",
                code_verifier="google-verifier",
            )

            assert result["action"] == "login"
            assert result["access_token"] == "access-token-existing"
            assert result["user"]["id"] == "user-existing-456"
            assert result["user"]["role"] == "admin"

    @pytest.mark.asyncio
    async def test_oauth_callback_link_required(self):
        """Test OAuth callback when account linking is required."""
        from arc.api.routes.oauth import handle_oauth_callback

        mock_sso_result = {
            "action": "link_required",
            "user_id": "user-unlinked-789",
            "provider": "github",
            "provider_user_id": "github-123456",
            "provider_email": "user@example.com",
            "provider_name": "GitHub User",
        }

        with patch("arc.services.sso.sso_service.handle_callback", new_callable=AsyncMock) as mock_callback:
            mock_callback.return_value = mock_sso_result

            result = await handle_oauth_callback(
                provider="github",
                tenant_id="tenant-123",
                code="github-code",
                state="github-state",
                code_verifier="github-verifier",
            )

            assert result["action"] == "link_required"
            assert "link_data" in result
            assert result["link_data"]["user_id"] == "user-unlinked-789"
            assert result["link_data"]["provider"] == "github"
            assert result["link_data"]["provider_email"] == "user@example.com"

    @pytest.mark.asyncio
    async def test_oauth_callback_invalid_state(self):
        """Test OAuth callback with invalid state parameter."""
        from arc.api.routes.oauth import handle_oauth_callback

        with patch(
            "arc.services.sso.sso_service.handle_callback",
            new_callable=AsyncMock,
            side_effect=ValueError("Invalid state parameter"),
        ):
            with pytest.raises(ValueError) as exc_info:
                await handle_oauth_callback(
                    provider="azure",
                    tenant_id="tenant-123",
                    code="auth-code",
                    state="wrong-state",
                    code_verifier="verifier",
                )

            assert "Invalid state parameter" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_oauth_callback_exchange_failure(self):
        """Test OAuth callback when token exchange fails."""
        from arc.api.routes.oauth import handle_oauth_callback

        with patch(
            "arc.services.sso.sso_service.handle_callback",
            new_callable=AsyncMock,
            side_effect=ValueError("Token exchange failed: invalid_grant"),
        ):
            with pytest.raises(ValueError) as exc_info:
                await handle_oauth_callback(
                    provider="google",
                    tenant_id="tenant-123",
                    code="expired-code",
                    state="valid-state",
                    code_verifier="verifier",
                )

            assert "Token exchange failed" in str(exc_info.value)
