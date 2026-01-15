"""
Unit tests for SSOService.

Tests cover:
- PKCE generation and validation
- State parameter generation and validation
- OAuth URL generation for all providers
- User provisioning logic
- Account linking and unlinking
- Client secret encryption/decryption

Test Strategy:
- Tier 1: Unit tests with mocked external services (httpx)
- NO MOCKING of DataFlow Express API (use real database)
- All crypto operations use real implementations
"""

import hashlib
import base64
import secrets
from datetime import datetime
from unittest.mock import AsyncMock, patch, Mock
from uuid import uuid4

import pytest
from cryptography.fernet import Fernet

from arc.services.sso import SSOService, OAuthConfig
from arc.models.database import db


@pytest.fixture
def encryption_key():
    """Generate a valid Fernet encryption key."""
    return Fernet.generate_key().decode()


@pytest.fixture
def sso_service(encryption_key, monkeypatch):
    """Create SSOService instance with test encryption key."""
    monkeypatch.setenv("SSO_SECRET_ENCRYPTION_KEY", encryption_key)
    monkeypatch.setenv("SSO_REDIRECT_BASE_URL", "http://localhost:3000")
    return SSOService()


@pytest.fixture
async def test_tenant():
    """Create test tenant."""
    tenant_id = f"tenant-{uuid4()}"
    tenant = await db.express.create("Tenant", {
        "id": tenant_id,
        "name": "Test Tenant",
        "subdomain": f"test-{uuid4().hex[:8]}",
    })
    return tenant


@pytest.fixture
async def test_sso_provider(test_tenant, encryption_key):
    """Create test SSO provider configuration."""
    fernet = Fernet(encryption_key.encode())
    encrypted_secret = fernet.encrypt(b"test-client-secret").decode()

    provider = await db.express.create("SSOProvider", {
        "id": str(uuid4()),
        "tenant_id": test_tenant["id"],
        "provider_type": "azure",
        "display_name": "Test Azure AD",
        "client_id": "test-client-id",
        "client_secret_encrypted": encrypted_secret,
        "azure_tenant_id": "common",
        "is_enabled": True,
        "auto_provision": True,
        "default_role": "viewer",
    })
    return provider


@pytest.fixture
async def test_user(test_tenant):
    """Create test user."""
    user = await db.express.create("User", {
        "id": str(uuid4()),
        "tenant_id": test_tenant["id"],
        "email": "test@example.com",
        "name": "Test User",
        "auth_provider": "email",
        "role": "viewer",
        "is_active": True,
    })
    return user


# =============================================================================
# PKCE Tests
# =============================================================================


class TestPKCEGeneration:
    """Test PKCE code verifier and challenge generation."""

    def test_code_verifier_length(self):
        """Test that code verifier is 32 bytes base64url encoded."""
        verifier = secrets.token_urlsafe(32)
        # token_urlsafe(32) generates 43 characters (32 bytes base64url)
        assert len(verifier) == 43
        # Verify it's base64url safe (no + or / or =)
        assert "+" not in verifier
        assert "/" not in verifier

    def test_code_challenge_from_verifier(self):
        """Test SHA256 code challenge generation."""
        verifier = secrets.token_urlsafe(32)

        # Generate challenge
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode()).digest()
        ).decode().rstrip("=")

        # Verify format
        assert len(challenge) == 43  # SHA256 base64url without padding
        assert challenge != verifier  # Challenge differs from verifier

    def test_code_verifier_uniqueness(self):
        """Test that code verifiers are unique."""
        verifiers = {secrets.token_urlsafe(32) for _ in range(100)}
        assert len(verifiers) == 100  # All unique


# =============================================================================
# State Parameter Tests
# =============================================================================


class TestStateParameter:
    """Test state parameter generation and validation."""

    def test_state_generation(self):
        """Test that state is cryptographically random."""
        state = secrets.token_urlsafe(32)
        assert len(state) == 43

    def test_state_uniqueness(self):
        """Test that states are unique."""
        states = {secrets.token_urlsafe(32) for _ in range(100)}
        assert len(states) == 100

    def test_state_comparison(self):
        """Test constant-time state comparison."""
        state1 = "test-state-value"
        state2 = "test-state-value"
        state3 = "different-state"

        # Use secrets.compare_digest for constant-time comparison
        assert secrets.compare_digest(state1, state2) is True
        assert secrets.compare_digest(state1, state3) is False


# =============================================================================
# OAuth URL Generation Tests
# =============================================================================


class TestOAuthURLGeneration:
    """Test OAuth authorization URL generation."""

    @pytest.mark.asyncio
    async def test_start_oauth_azure(self, sso_service, test_sso_provider):
        """Test Azure AD OAuth URL generation."""
        result = await sso_service.start_oauth(
            provider="azure",
            tenant_id=test_sso_provider["tenant_id"],
            return_url="/dashboard"
        )

        # Verify response structure
        assert "auth_url" in result
        assert "state" in result
        assert "code_verifier" in result
        assert "return_url" in result

        # Verify auth URL structure
        auth_url = result["auth_url"]
        assert "login.microsoftonline.com/common/oauth2/v2.0/authorize" in auth_url
        assert "client_id=test-client-id" in auth_url
        assert "redirect_uri=" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=" in auth_url
        assert "state=" in auth_url
        assert "code_challenge=" in auth_url
        assert "code_challenge_method=S256" in auth_url

        # Verify state and verifier
        assert len(result["state"]) == 43
        assert len(result["code_verifier"]) == 43

    @pytest.mark.asyncio
    async def test_start_oauth_google(self, sso_service, test_tenant):
        """Test Google OAuth URL generation."""
        # Create Google provider
        provider = await db.express.create("SSOProvider", {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "google",
            "display_name": "Test Google",
            "client_id": "google-client-id",
            "client_secret_encrypted": "encrypted-secret",
            "google_domain": "example.com",
            "is_enabled": True,
        })

        result = await sso_service.start_oauth(
            provider="google",
            tenant_id=test_tenant["id"],
            return_url="/dashboard"
        )

        auth_url = result["auth_url"]
        assert "accounts.google.com/o/oauth2/v2/auth" in auth_url
        assert "hd=example.com" in auth_url  # Domain hint

    @pytest.mark.asyncio
    async def test_start_oauth_github(self, sso_service, test_tenant):
        """Test GitHub OAuth URL generation."""
        # Create GitHub provider
        provider = await db.express.create("SSOProvider", {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "github",
            "display_name": "Test GitHub",
            "client_id": "github-client-id",
            "client_secret_encrypted": "encrypted-secret",
            "is_enabled": True,
        })

        result = await sso_service.start_oauth(
            provider="github",
            tenant_id=test_tenant["id"],
        )

        auth_url = result["auth_url"]
        assert "github.com/login/oauth/authorize" in auth_url

    @pytest.mark.asyncio
    async def test_start_oauth_disabled_provider(self, sso_service, test_tenant):
        """Test error when provider is disabled."""
        # Create disabled provider
        await db.express.create("SSOProvider", {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "azure",
            "display_name": "Disabled",
            "client_id": "client-id",
            "client_secret_encrypted": "encrypted",
            "is_enabled": False,  # Disabled
        })

        with pytest.raises(ValueError, match="not configured or disabled"):
            await sso_service.start_oauth(
                provider="azure",
                tenant_id=test_tenant["id"]
            )


# =============================================================================
# Token Exchange Tests (Mocked HTTP)
# =============================================================================


class TestTokenExchange:
    """Test OAuth token exchange with mocked HTTP."""

    @pytest.mark.asyncio
    async def test_handle_callback_success(self, sso_service, test_sso_provider):
        """Test successful OAuth callback handling."""
        state = secrets.token_urlsafe(32)
        code_verifier = secrets.token_urlsafe(32)

        # Mock httpx responses
        mock_token_response = Mock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {
            "access_token": "test-access-token",
            "token_type": "Bearer",
            "expires_in": 3600,
        }

        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "sub": "azure-user-123",
            "email": "newuser@example.com",
            "name": "New User",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.post.return_value = mock_token_response
            mock_instance.get.return_value = mock_userinfo_response

            result = await sso_service.handle_callback(
                provider="azure",
                tenant_id=test_sso_provider["tenant_id"],
                code="test-auth-code",
                state=state,
                code_verifier=code_verifier,
                expected_state=state,
            )

        # Verify auto-provisioning
        assert result["action"] == "created"
        assert result["user"]["email"] == "newuser@example.com"
        assert result["user"]["name"] == "New User"

    @pytest.mark.asyncio
    async def test_handle_callback_invalid_state(self, sso_service, test_sso_provider):
        """Test callback rejection with invalid state."""
        with pytest.raises(ValueError, match="Invalid state parameter"):
            await sso_service.handle_callback(
                provider="azure",
                tenant_id=test_sso_provider["tenant_id"],
                code="test-code",
                state="wrong-state",
                code_verifier="verifier",
                expected_state="correct-state",
            )


# =============================================================================
# User Provisioning Tests
# =============================================================================


class TestUserProvisioning:
    """Test user creation and linking logic."""

    @pytest.mark.asyncio
    async def test_auto_provision_new_user(self, sso_service, test_sso_provider):
        """Test auto-provisioning a new user."""
        user_info = {
            "sub": "provider-user-456",
            "email": "autoprovision@example.com",
            "name": "Auto User",
        }

        result = await sso_service._handle_user(
            provider="azure",
            tenant_id=test_sso_provider["tenant_id"],
            user_info=user_info,
            sso_config=test_sso_provider,
        )

        assert result["action"] == "created"
        assert result["user"]["email"] == "autoprovision@example.com"
        assert result["user"]["auth_provider"] == "azure"
        assert result["user"]["role"] == "viewer"  # default_role

    @pytest.mark.asyncio
    async def test_existing_linked_account_login(
        self, sso_service, test_user, test_sso_provider
    ):
        """Test login with existing linked account."""
        # Create linked account
        await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": test_user["id"],
            "provider_type": "azure",
            "provider_user_id": "existing-provider-id",
            "provider_email": test_user["email"],
            "linked_at": datetime.utcnow().isoformat(),
        })

        user_info = {
            "sub": "existing-provider-id",
            "email": test_user["email"],
            "name": test_user["name"],
        }

        result = await sso_service._handle_user(
            provider="azure",
            tenant_id=test_sso_provider["tenant_id"],
            user_info=user_info,
            sso_config=test_sso_provider,
        )

        assert result["action"] == "login"
        assert result["user"]["id"] == test_user["id"]

    @pytest.mark.asyncio
    async def test_existing_user_link_required(
        self, sso_service, test_user, test_sso_provider
    ):
        """Test link_required action when user exists but not linked."""
        user_info = {
            "sub": "new-provider-id",
            "email": test_user["email"],  # Email matches existing user
            "name": "Provider Name",
        }

        result = await sso_service._handle_user(
            provider="azure",
            tenant_id=test_sso_provider["tenant_id"],
            user_info=user_info,
            sso_config=test_sso_provider,
        )

        assert result["action"] == "link_required"
        assert result["user_id"] == test_user["id"]
        assert result["provider"] == "azure"

    @pytest.mark.asyncio
    async def test_auto_provision_disabled(self, sso_service, test_tenant):
        """Test error when auto-provisioning is disabled."""
        # Create provider with auto_provision=False
        provider = await db.express.create("SSOProvider", {
            "id": str(uuid4()),
            "tenant_id": test_tenant["id"],
            "provider_type": "google",
            "display_name": "No Auto Provision",
            "client_id": "client-id",
            "client_secret_encrypted": "encrypted",
            "auto_provision": False,
            "is_enabled": True,
        })

        user_info = {
            "sub": "new-user-789",
            "email": "newuser@example.com",
            "name": "New User",
        }

        with pytest.raises(ValueError, match="User provisioning disabled"):
            await sso_service._handle_user(
                provider="google",
                tenant_id=test_tenant["id"],
                user_info=user_info,
                sso_config=provider,
            )


# =============================================================================
# Account Linking Tests
# =============================================================================


class TestAccountLinking:
    """Test account linking and unlinking."""

    @pytest.mark.asyncio
    async def test_link_account(self, sso_service, test_user):
        """Test linking an SSO provider to existing user."""
        result = await sso_service.link_account(
            user_id=test_user["id"],
            provider="google",
            provider_user_id="google-user-123",
            provider_email="test@example.com",
            provider_name="Test User",
        )

        assert result["user_id"] == test_user["id"]
        assert result["provider_type"] == "google"
        assert result["provider_user_id"] == "google-user-123"

    @pytest.mark.asyncio
    async def test_link_account_already_linked(self, sso_service, test_user):
        """Test error when account is already linked."""
        # Create existing link
        await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": test_user["id"],
            "provider_type": "azure",
            "provider_user_id": "azure-123",
            "provider_email": test_user["email"],
            "linked_at": datetime.utcnow().isoformat(),
        })

        with pytest.raises(ValueError, match="already linked"):
            await sso_service.link_account(
                user_id=test_user["id"],
                provider="azure",
                provider_user_id="different-id",
                provider_email=test_user["email"],
            )

    @pytest.mark.asyncio
    async def test_unlink_account(self, sso_service, test_user):
        """Test unlinking an SSO provider."""
        # Create linked account
        await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": test_user["id"],
            "provider_type": "github",
            "provider_user_id": "github-123",
            "provider_email": test_user["email"],
            "linked_at": datetime.utcnow().isoformat(),
        })

        # Ensure user has password (alternate auth method)
        await db.express.update("User", test_user["id"], {
            "password_hash": "hashed-password",
        })

        result = await sso_service.unlink_account(
            user_id=test_user["id"],
            provider="github",
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_unlink_last_auth_method(self, sso_service, test_user):
        """Test error when trying to unlink last auth method."""
        # Create single linked account
        await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": test_user["id"],
            "provider_type": "azure",
            "provider_user_id": "azure-123",
            "provider_email": test_user["email"],
            "linked_at": datetime.utcnow().isoformat(),
        })

        # User has no password
        await db.express.update("User", test_user["id"], {
            "password_hash": None,
        })

        with pytest.raises(ValueError, match="Cannot unlink last authentication method"):
            await sso_service.unlink_account(
                user_id=test_user["id"],
                provider="azure",
            )


# =============================================================================
# Secret Encryption Tests
# =============================================================================


class TestSecretEncryption:
    """Test client secret encryption/decryption."""

    def test_encrypt_decrypt_secret(self, sso_service):
        """Test secret encryption and decryption."""
        original_secret = "my-oauth-client-secret"

        # Encrypt
        encrypted = sso_service._encrypt_secret(original_secret)
        assert encrypted != original_secret

        # Decrypt
        decrypted = sso_service._decrypt_secret(encrypted)
        assert decrypted == original_secret

    def test_encryption_key_required(self, monkeypatch):
        """Test that encryption key is properly configured."""
        monkeypatch.delenv("SSO_SECRET_ENCRYPTION_KEY", raising=False)
        service = SSOService()

        # Without encryption key, should still work (passthrough)
        secret = "test-secret"
        encrypted = service._encrypt_secret(secret)
        assert encrypted == secret  # No encryption


# =============================================================================
# Provider-Specific Tests
# =============================================================================


class TestProviderSpecifics:
    """Test provider-specific behaviors."""

    @pytest.mark.asyncio
    async def test_github_email_fetching(self, sso_service):
        """Test GitHub email endpoint fallback."""
        access_token = "github-token"

        # Mock primary user info response (no email)
        mock_userinfo = Mock()
        mock_userinfo.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "name": "Test User",
            # No email field
        }

        # Mock emails endpoint response
        mock_emails = Mock()
        mock_emails.json.return_value = [
            {"email": "secondary@example.com", "primary": False, "verified": True},
            {"email": "primary@example.com", "primary": True, "verified": True},
        ]

        provider_config = OAuthConfig.PROVIDERS["github"]

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = mock_client.return_value.__aenter__.return_value
            mock_instance.get.side_effect = [mock_userinfo, mock_emails]

            result = await sso_service._get_user_info(
                provider="github",
                access_token=access_token,
                provider_config=provider_config,
            )

        # Should have fetched primary email
        assert result["email"] == "primary@example.com"

    def test_oauth_config_completeness(self):
        """Test that all providers have complete configurations."""
        for provider, config in OAuthConfig.PROVIDERS.items():
            assert "authorization_endpoint" in config
            assert "token_endpoint" in config
            assert "userinfo_endpoint" in config
            assert "scopes" in config
            assert isinstance(config["scopes"], list)
            assert len(config["scopes"]) > 0
