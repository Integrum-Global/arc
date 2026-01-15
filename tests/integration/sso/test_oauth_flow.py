"""
Integration tests for OAuth SSO flows.

Tests complete OAuth flows with mocked IdP responses:
- Azure AD token exchange and user provisioning
- Google token exchange and domain hints
- GitHub email fetching workflow
- Auto-provisioning vs link-required flows
- Account linking and unlinking workflows

Test Strategy:
- Tier 2: Integration tests with real database (DataFlow)
- NO MOCKING of DataFlow (use real PostgreSQL/SQLite)
- Mock only external HTTP calls (httpx to IdP endpoints)
- Test complete user journeys end-to-end
"""

import secrets
from datetime import datetime
from unittest.mock import Mock, patch
from uuid import uuid4

import pytest
from cryptography.fernet import Fernet

from arc.models.database import db
from arc.services.sso import SSOService


@pytest.fixture
def encryption_key():
    """Generate a valid Fernet encryption key."""
    return Fernet.generate_key().decode()


@pytest.fixture
def sso_service(encryption_key, monkeypatch):
    """Create SSOService instance with test configuration."""
    monkeypatch.setenv("SSO_SECRET_ENCRYPTION_KEY", encryption_key)
    monkeypatch.setenv("SSO_REDIRECT_BASE_URL", "http://localhost:3000")
    return SSOService()


@pytest.fixture
async def test_tenant():
    """Create test tenant for integration tests."""
    tenant_id = f"tenant-{uuid4()}"
    tenant = await db.express.create(
        "Tenant",
        {
            "id": tenant_id,
            "name": "Integration Test Tenant",
            "subdomain": f"integ-{uuid4().hex[:8]}",
        },
    )
    return tenant


@pytest.fixture
async def azure_provider(test_tenant, encryption_key):
    """Create Azure AD SSO provider configuration."""
    fernet = Fernet(encryption_key.encode())
    encrypted_secret = fernet.encrypt(b"azure-client-secret").decode()

    provider = await db.express.create(
        "SSOProvider",
        {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "azure",
            "display_name": "Test Azure AD",
            "client_id": "azure-client-id",
            "client_secret_encrypted": encrypted_secret,
            "azure_tenant_id": "common",
            "is_enabled": True,
            "auto_provision": True,
            "default_role": "viewer",
        },
    )
    return provider


@pytest.fixture
async def google_provider(test_tenant, encryption_key):
    """Create Google SSO provider configuration."""
    fernet = Fernet(encryption_key.encode())
    encrypted_secret = fernet.encrypt(b"google-client-secret").decode()

    provider = await db.express.create(
        "SSOProvider",
        {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "google",
            "display_name": "Test Google",
            "client_id": "google-client-id",
            "client_secret_encrypted": encrypted_secret,
            "google_domain": "testcompany.com",
            "is_enabled": True,
            "auto_provision": True,
            "default_role": "analyst",
        },
    )
    return provider


@pytest.fixture
async def github_provider(test_tenant, encryption_key):
    """Create GitHub SSO provider configuration."""
    fernet = Fernet(encryption_key.encode())
    encrypted_secret = fernet.encrypt(b"github-client-secret").decode()

    provider = await db.express.create(
        "SSOProvider",
        {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "github",
            "display_name": "Test GitHub",
            "client_id": "github-client-id",
            "client_secret_encrypted": encrypted_secret,
            "is_enabled": True,
            "auto_provision": True,
            "default_role": "viewer",
        },
    )
    return provider


# =============================================================================
# Azure AD OAuth Flow Tests
# =============================================================================


class TestAzureOAuthFlow:
    """Test complete Azure AD OAuth flow."""

    @pytest.mark.asyncio
    async def test_azure_new_user_auto_provision(
        self, sso_service, azure_provider
    ):
        """Test Azure AD OAuth with auto-provisioning new user."""
        # Step 1: Start OAuth flow
        oauth_start = await sso_service.start_oauth(
            provider="azure",
            tenant_id=azure_provider["tenant_id"],
            return_url="/dashboard",
        )

        assert "auth_url" in oauth_start
        assert "login.microsoftonline.com/common" in oauth_start["auth_url"]

        # Step 2: Mock token exchange
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {
            "access_token": "azure-access-token",
            "token_type": "Bearer",
            "expires_in": 3600,
            "id_token": "mock-id-token",
        }

        # Step 3: Mock user info
        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "azure-user-sub-001",
            "email": "newuser@testcompany.com",
            "name": "New Azure User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            # Step 4: Handle callback
            result = await sso_service.handle_callback(
                provider="azure",
                tenant_id=azure_provider["tenant_id"],
                code="azure-auth-code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        # Verify auto-provisioning
        assert result["action"] == "created"
        assert result["user"]["email"] == "newuser@testcompany.com"
        assert result["user"]["auth_provider"] == "azure"
        assert result["user"]["role"] == "viewer"  # default_role

        # Verify LinkedAccount created
        links = await db.express.list(
            "LinkedAccount",
            filter={
                "user_id": result["user"]["id"],
                "provider_type": "azure",
            },
        )
        assert len(links) == 1
        assert links[0]["provider_user_id"] == "azure-user-sub-001"

    @pytest.mark.asyncio
    async def test_azure_existing_linked_user_login(
        self, sso_service, azure_provider
    ):
        """Test Azure AD OAuth with existing linked user."""
        # Create user and linked account
        user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": azure_provider["tenant_id"],
                "email": "existing@testcompany.com",
                "name": "Existing User",
                "auth_provider": "azure",
                "is_active": True,
            },
        )

        await db.express.create(
            "LinkedAccount",
            {
                "id": str(uuid4()),
                "user_id": user["id"],
                "provider_type": "azure",
                "provider_user_id": "azure-existing-sub",
                "provider_email": user["email"],
                "linked_at": datetime.utcnow().isoformat(),
            },
        )

        # Start OAuth
        oauth_start = await sso_service.start_oauth(
            provider="azure",
            tenant_id=azure_provider["tenant_id"],
        )

        # Mock responses
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {
            "access_token": "azure-access-token",
            "token_type": "Bearer",
        }

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "azure-existing-sub",  # Matches linked account
            "email": "existing@testcompany.com",
            "name": "Existing User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            result = await sso_service.handle_callback(
                provider="azure",
                tenant_id=azure_provider["tenant_id"],
                code="auth-code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        # Verify login
        assert result["action"] == "login"
        assert result["user"]["id"] == user["id"]
        assert result["user"]["email"] == user["email"]

    @pytest.mark.asyncio
    async def test_azure_existing_user_link_required(
        self, sso_service, azure_provider
    ):
        """Test Azure AD OAuth with existing user (not linked)."""
        # Create user without linked account
        user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": azure_provider["tenant_id"],
                "email": "unlinkuser@testcompany.com",
                "name": "Unlinked User",
                "auth_provider": "email",  # Email auth, not SSO
                "password_hash": "hashed-password",
                "is_active": True,
            },
        )

        # Start OAuth
        oauth_start = await sso_service.start_oauth(
            provider="azure",
            tenant_id=azure_provider["tenant_id"],
        )

        # Mock responses
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "token"}

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "azure-new-sub",
            "email": user["email"],  # Email matches existing user
            "name": "Azure Name",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            result = await sso_service.handle_callback(
                provider="azure",
                tenant_id=azure_provider["tenant_id"],
                code="auth-code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        # Verify link_required
        assert result["action"] == "link_required"
        assert result["user_id"] == user["id"]
        assert result["provider"] == "azure"
        assert result["provider_user_id"] == "azure-new-sub"


# =============================================================================
# Google OAuth Flow Tests
# =============================================================================


class TestGoogleOAuthFlow:
    """Test complete Google OAuth flow."""

    @pytest.mark.asyncio
    async def test_google_domain_hint(self, sso_service, google_provider):
        """Test Google OAuth with domain hint (hd parameter)."""
        oauth_start = await sso_service.start_oauth(
            provider="google",
            tenant_id=google_provider["tenant_id"],
        )

        # Verify domain hint in auth URL
        assert "hd=testcompany.com" in oauth_start["auth_url"]

    @pytest.mark.asyncio
    async def test_google_new_user_provision(
        self, sso_service, google_provider
    ):
        """Test Google OAuth auto-provisioning."""
        oauth_start = await sso_service.start_oauth(
            provider="google",
            tenant_id=google_provider["tenant_id"],
        )

        # Mock responses
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "google-token"}

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "google-user-123",
            "email": "googleuser@testcompany.com",
            "name": "Google User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            result = await sso_service.handle_callback(
                provider="google",
                tenant_id=google_provider["tenant_id"],
                code="google-code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        # Verify provisioning
        assert result["action"] == "created"
        assert result["user"]["email"] == "googleuser@testcompany.com"
        assert result["user"]["role"] == "analyst"  # google_provider default_role


# =============================================================================
# GitHub OAuth Flow Tests
# =============================================================================


class TestGitHubOAuthFlow:
    """Test complete GitHub OAuth flow."""

    @pytest.mark.asyncio
    async def test_github_email_fetching(self, sso_service, github_provider):
        """Test GitHub OAuth with separate email endpoint."""
        oauth_start = await sso_service.start_oauth(
            provider="github",
            tenant_id=github_provider["tenant_id"],
        )

        # Mock token exchange
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "github-token"}

        # Mock user info (no email)
        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "id": 12345,
            "login": "githubuser",
            "name": "GitHub User",
            # No email field
        }

        # Mock emails endpoint
        mock_emails_response = Mock()
        mock_emails_response.json.return_value = [
            {"email": "secondary@example.com", "primary": False, "verified": True},
            {"email": "primary@example.com", "primary": True, "verified": True},
        ]

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            # First GET for userinfo, second GET for emails
            mock_instance.get.side_effect = [mock_userinfo_response, mock_emails_response]

            result = await sso_service.handle_callback(
                provider="github",
                tenant_id=github_provider["tenant_id"],
                code="github-code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        # Verify provisioning with primary email
        assert result["action"] == "created"
        assert result["user"]["email"] == "primary@example.com"


# =============================================================================
# Account Linking Workflow Tests
# =============================================================================


class TestAccountLinkingWorkflow:
    """Test complete account linking workflows."""

    @pytest.mark.asyncio
    async def test_link_account_workflow(self, sso_service, azure_provider):
        """Test linking SSO account to existing user."""
        # Create user with email auth
        user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": azure_provider["tenant_id"],
                "email": "linktest@example.com",
                "name": "Link Test User",
                "auth_provider": "email",
                "password_hash": "hashed-password",
                "is_active": True,
            },
        )

        # Link Azure account
        linked = await sso_service.link_account(
            user_id=user["id"],
            provider="azure",
            provider_user_id="azure-link-123",
            provider_email="linktest@example.com",
            provider_name="Link Test User",
        )

        assert linked["user_id"] == user["id"]
        assert linked["provider_type"] == "azure"
        assert linked["provider_user_id"] == "azure-link-123"

        # Verify subsequent login uses linked account
        oauth_start = await sso_service.start_oauth(
            provider="azure",
            tenant_id=azure_provider["tenant_id"],
        )

        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "token"}

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "azure-link-123",  # Matches linked account
            "email": "linktest@example.com",
            "name": "Link Test User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            result = await sso_service.handle_callback(
                provider="azure",
                tenant_id=azure_provider["tenant_id"],
                code="code",
                state=oauth_start["state"],
                code_verifier=oauth_start["code_verifier"],
                expected_state=oauth_start["state"],
            )

        assert result["action"] == "login"
        assert result["user"]["id"] == user["id"]

    @pytest.mark.asyncio
    async def test_unlink_account_workflow(self, sso_service, azure_provider):
        """Test unlinking SSO account from user."""
        # Create user with linked account AND password
        user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": azure_provider["tenant_id"],
                "email": "unlink@example.com",
                "name": "Unlink Test",
                "auth_provider": "email",
                "password_hash": "hashed-password",
                "is_active": True,
            },
        )

        await db.express.create(
            "LinkedAccount",
            {
                "id": str(uuid4()),
                "user_id": user["id"],
                "provider_type": "azure",
                "provider_user_id": "azure-unlink-123",
                "provider_email": user["email"],
                "linked_at": datetime.utcnow().isoformat(),
            },
        )

        # Unlink account
        result = await sso_service.unlink_account(
            user_id=user["id"],
            provider="azure",
        )

        assert result is True

        # Verify link removed
        links = await db.express.list(
            "LinkedAccount",
            filter={
                "user_id": user["id"],
                "provider_type": "azure",
            },
        )
        assert len(links) == 0

    @pytest.mark.asyncio
    async def test_multiple_provider_linking(
        self, sso_service, azure_provider, google_provider
    ):
        """Test linking multiple providers to same user."""
        user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": azure_provider["tenant_id"],
                "email": "multilink@example.com",
                "name": "Multi Link User",
                "auth_provider": "email",
                "password_hash": "hashed-password",
                "is_active": True,
            },
        )

        # Link Azure
        azure_link = await sso_service.link_account(
            user_id=user["id"],
            provider="azure",
            provider_user_id="azure-multi-123",
            provider_email=user["email"],
        )

        # Link Google
        google_link = await sso_service.link_account(
            user_id=user["id"],
            provider="google",
            provider_user_id="google-multi-456",
            provider_email=user["email"],
        )

        # Verify both linked
        links = await db.express.list(
            "LinkedAccount",
            filter={"user_id": user["id"]},
        )
        assert len(links) == 2
        providers = {link["provider_type"] for link in links}
        assert providers == {"azure", "google"}


# =============================================================================
# Error Handling Tests
# =============================================================================


class TestOAuthErrorHandling:
    """Test error handling in OAuth flows."""

    @pytest.mark.asyncio
    async def test_token_exchange_failure(self, sso_service, azure_provider):
        """Test handling of token exchange failure."""
        oauth_start = await sso_service.start_oauth(
            provider="azure",
            tenant_id=azure_provider["tenant_id"],
        )

        # Mock failed token response
        mock_token_response = Mock()
        mock_token_response.status_code = 400
        mock_token_response.text = "invalid_grant"

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response

            with pytest.raises(ValueError, match="Token exchange failed"):
                await sso_service.handle_callback(
                    provider="azure",
                    tenant_id=azure_provider["tenant_id"],
                    code="invalid-code",
                    state=oauth_start["state"],
                    code_verifier=oauth_start["code_verifier"],
                    expected_state=oauth_start["state"],
                )

    @pytest.mark.asyncio
    async def test_auto_provision_disabled(self, sso_service, test_tenant):
        """Test error when auto-provisioning disabled."""
        # Create provider with auto_provision=False
        fernet = Fernet(Fernet.generate_key())
        provider = await db.express.create(
            "SSOProvider",
            {
                "id": str(uuid4()),
                "tenant_id": test_tenant["id"],
                "provider_type": "google",
                "display_name": "No Auto Provision",
                "client_id": "client-id",
                "client_secret_encrypted": fernet.encrypt(b"secret").decode(),
                "auto_provision": False,
                "is_enabled": True,
            },
        )

        oauth_start = await sso_service.start_oauth(
            provider="google",
            tenant_id=test_tenant["id"],
        )

        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "token"}

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "new-user-789",
            "email": "newuser@example.com",
            "name": "New User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            with pytest.raises(ValueError, match="User provisioning disabled"):
                await sso_service.handle_callback(
                    provider="google",
                    tenant_id=test_tenant["id"],
                    code="code",
                    state=oauth_start["state"],
                    code_verifier=oauth_start["code_verifier"],
                    expected_state=oauth_start["state"],
                )
