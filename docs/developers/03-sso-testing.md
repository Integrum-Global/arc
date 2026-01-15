# SSO Testing Documentation

This document covers testing strategies for the enterprise SSO implementation in the ARC Investment Platform.

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [Manual Testing](#4-manual-testing)
5. [Test Fixtures](#5-test-fixtures)

---

## 1. Test Strategy Overview

### Test Tiers

| Tier | Scope | Infrastructure | Mocking Policy |
|------|-------|----------------|----------------|
| **Tier 1** | Unit tests | None | Mock HTTP calls only |
| **Tier 2** | Integration tests | Docker (PostgreSQL) | **NO MOCKING** of DataFlow |
| **Tier 3** | E2E tests | Full stack | **NO MOCKING** |

### Key Principle: NO MOCKING of DataFlow

```python
# CORRECT - Use real database
@pytest.fixture
async def test_user(test_tenant):
    user = await db.express.create("User", {
        "id": str(uuid4()),
        "tenant_id": test_tenant["id"],
        "email": "test@example.com",
        "name": "Test User",
    })
    return user

# WRONG - Never mock DataFlow
@pytest.fixture
def mock_db():
    with patch("arc.models.database.db") as mock:
        mock.express.list.return_value = []  # NO!
        yield mock
```

---

## 2. Unit Tests

**File**: `tests/unit/services/test_sso.py`

### PKCE Tests

```python
import hashlib
import base64
import secrets
import pytest

class TestPKCEGeneration:
    """Test PKCE code verifier and challenge generation."""

    def test_code_verifier_length(self):
        """Test that code verifier is 32 bytes base64url encoded."""
        verifier = secrets.token_urlsafe(32)
        # token_urlsafe(32) generates 43 characters
        assert len(verifier) == 43
        # Verify no unsafe characters
        assert "+" not in verifier
        assert "/" not in verifier

    def test_code_challenge_from_verifier(self):
        """Test SHA256 code challenge generation."""
        verifier = secrets.token_urlsafe(32)

        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode()).digest()
        ).decode().rstrip("=")

        # SHA256 base64url without padding = 43 chars
        assert len(challenge) == 43
        assert challenge != verifier

    def test_code_verifier_uniqueness(self):
        """Test that verifiers are cryptographically unique."""
        verifiers = {secrets.token_urlsafe(32) for _ in range(100)}
        assert len(verifiers) == 100  # All unique
```

### State Parameter Tests

```python
class TestStateParameter:
    """Test state parameter for CSRF protection."""

    def test_state_generation(self):
        """Test cryptographically random state."""
        state = secrets.token_urlsafe(32)
        assert len(state) == 43

    def test_constant_time_comparison(self):
        """Test timing-attack-safe comparison."""
        state1 = "test-state-value"
        state2 = "test-state-value"
        state3 = "different-state"

        # Use secrets.compare_digest (constant-time)
        assert secrets.compare_digest(state1, state2) is True
        assert secrets.compare_digest(state1, state3) is False
```

### OAuth URL Generation Tests

```python
from arc.services.sso import SSOService
from arc.models.database import db
from cryptography.fernet import Fernet
from uuid import uuid4

@pytest.fixture
def encryption_key():
    return Fernet.generate_key().decode()

@pytest.fixture
def sso_service(encryption_key, monkeypatch):
    monkeypatch.setenv("SSO_SECRET_ENCRYPTION_KEY", encryption_key)
    monkeypatch.setenv("SSO_REDIRECT_BASE_URL", "http://localhost:3000")
    return SSOService()

@pytest.fixture
async def test_sso_provider(test_tenant, encryption_key):
    """Create real SSO provider in database."""
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

        # Verify URL components
        auth_url = result["auth_url"]
        assert "login.microsoftonline.com/common/oauth2/v2.0/authorize" in auth_url
        assert "client_id=test-client-id" in auth_url
        assert "response_type=code" in auth_url
        assert "code_challenge=" in auth_url
        assert "code_challenge_method=S256" in auth_url

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
            "is_enabled": False,
        })

        with pytest.raises(ValueError, match="not configured or disabled"):
            await sso_service.start_oauth(
                provider="azure",
                tenant_id=test_tenant["id"]
            )
```

### Token Exchange Tests (Mocked HTTP)

```python
from unittest.mock import AsyncMock, patch, Mock

class TestTokenExchange:
    """Test OAuth token exchange with mocked HTTP."""

    @pytest.mark.asyncio
    async def test_handle_callback_success(self, sso_service, test_sso_provider):
        """Test successful OAuth callback handling."""
        state = secrets.token_urlsafe(32)
        code_verifier = secrets.token_urlsafe(32)

        # Mock HTTP responses (ONLY mock external services)
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

        # Verify auto-provisioning (uses REAL database)
        assert result["action"] == "created"
        assert result["user"]["email"] == "newuser@example.com"

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
```

### User Provisioning Tests

```python
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
        assert result["user"]["role"] == "viewer"

    @pytest.mark.asyncio
    async def test_existing_linked_account_login(
        self, sso_service, test_user, test_sso_provider
    ):
        """Test login with existing linked account."""
        # Create linked account in REAL database
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
        """Test link_required when user exists but not linked."""
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
```

### Account Linking Tests

```python
class TestAccountLinking:
    """Test account linking and unlinking."""

    @pytest.mark.asyncio
    async def test_link_account(self, sso_service, test_user):
        """Test linking SSO provider to existing user."""
        result = await sso_service.link_account(
            user_id=test_user["id"],
            provider="google",
            provider_user_id="google-user-123",
            provider_email="test@example.com",
            provider_name="Test User",
        )

        assert result["user_id"] == test_user["id"]
        assert result["provider_type"] == "google"

    @pytest.mark.asyncio
    async def test_unlink_last_auth_method(self, sso_service, test_user):
        """Test error when unlinking last auth method."""
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

        with pytest.raises(ValueError, match="Cannot unlink last authentication"):
            await sso_service.unlink_account(
                user_id=test_user["id"],
                provider="azure",
            )
```

### Secret Encryption Tests

```python
class TestSecretEncryption:
    """Test client secret encryption/decryption."""

    def test_encrypt_decrypt_secret(self, sso_service):
        """Test secret round-trip."""
        original_secret = "my-oauth-client-secret"

        encrypted = sso_service._encrypt_secret(original_secret)
        assert encrypted != original_secret

        decrypted = sso_service._decrypt_secret(encrypted)
        assert decrypted == original_secret

    def test_no_encryption_key_passthrough(self, monkeypatch):
        """Test passthrough when no encryption key."""
        monkeypatch.delenv("SSO_SECRET_ENCRYPTION_KEY", raising=False)
        service = SSOService()

        secret = "test-secret"
        encrypted = service._encrypt_secret(secret)
        assert encrypted == secret  # Passthrough
```

---

## 3. Integration Tests

### Setup Infrastructure

```bash
# Start test infrastructure
cd tests/utils
./test-env up && ./test-env status

# Expected output:
# PostgreSQL: Ready (localhost:5433)
# Redis: Ready (localhost:6380)
```

### Database Fixtures

```python
# tests/integration/conftest.py
import pytest
from arc.models.database import db

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Create tables once per session."""
    await db.create_tables_async()
    yield
    await db.close_async()

@pytest.fixture
async def test_tenant():
    """Create isolated test tenant."""
    tenant = await db.express.create("Tenant", {
        "id": str(uuid4()),
        "name": f"Test-{uuid4().hex[:8]}",
        "subdomain": f"test-{uuid4().hex[:8]}",
    })
    yield tenant
    # Cleanup
    await db.express.delete("Tenant", tenant["id"])
```

### Full OAuth Flow Test

```python
# tests/integration/test_sso_flow.py
import pytest
from arc.services.sso import sso_service

class TestSSOIntegration:
    """Integration tests with real database."""

    @pytest.mark.asyncio
    async def test_full_provision_flow(self, test_tenant, test_sso_provider):
        """Test complete user provisioning flow."""
        # 1. Start OAuth
        start_result = await sso_service.start_oauth(
            provider="azure",
            tenant_id=test_tenant["id"],
            return_url="/dashboard"
        )

        assert start_result["auth_url"]
        assert start_result["state"]
        assert start_result["code_verifier"]

        # 2. Simulate callback (mocked HTTP only)
        with patch("httpx.AsyncClient") as mock:
            # ... mock HTTP responses ...
            callback_result = await sso_service.handle_callback(...)

        # 3. Verify user created in REAL database
        user = await db.express.read("User", callback_result["user"]["id"])
        assert user["email"] == "test@example.com"

        # 4. Verify linked account created
        linked = await db.express.list("LinkedAccount", filter={
            "user_id": user["id"]
        })
        assert len(linked) == 1
```

---

## 4. Manual Testing

### Test Account Checklist

| Account Type | Example | Test |
|--------------|---------|------|
| Personal Microsoft | `user@outlook.com` | OAuth flow, user created |
| Work Account (Org A) | `user@company-a.com` | OAuth flow, correct tenant |
| Work Account (Org B) | `user@company-b.com` | OAuth flow, different tenant |

### Manual Test Steps

```markdown
## SSO Login Flow

1. [ ] Navigate to /login
2. [ ] Click "Continue with Microsoft"
3. [ ] Verify redirect to Azure AD login
4. [ ] Complete Azure authentication
5. [ ] Verify redirect back to /auth/callback
6. [ ] Verify success message displayed
7. [ ] Verify redirect to /dashboard
8. [ ] Verify user profile in header

## Account Linking Flow

1. [ ] Login with email/password
2. [ ] Navigate to Settings > Security
3. [ ] Click "Connect" next to Azure AD
4. [ ] Complete Azure authentication
5. [ ] Verify "Connected" badge displayed
6. [ ] Click "Unlink"
7. [ ] Verify confirmation dialog
8. [ ] Confirm unlink
9. [ ] Verify "Not connected" status
```

### Database Verification

```sql
-- Check created user
SELECT id, email, name, auth_provider, tenant_id
FROM "user"
WHERE auth_provider = 'azure'
ORDER BY created_at DESC
LIMIT 5;

-- Check linked accounts
SELECT la.*, u.email as user_email
FROM linked_account la
JOIN "user" u ON la.user_id = u.id
WHERE la.provider_type = 'azure'
ORDER BY la.linked_at DESC
LIMIT 5;

-- Check SSO provider configs
SELECT id, tenant_id, provider_type, is_enabled, auto_provision
FROM sso_provider
ORDER BY created_at DESC;
```

---

## 5. Test Fixtures

### Standard Fixtures

```python
# tests/conftest.py
import pytest
from uuid import uuid4
from cryptography.fernet import Fernet
from arc.models.database import db

@pytest.fixture
def encryption_key():
    """Generate valid Fernet encryption key."""
    return Fernet.generate_key().decode()

@pytest.fixture
def sso_service(encryption_key, monkeypatch):
    """Create SSOService with test configuration."""
    monkeypatch.setenv("SSO_SECRET_ENCRYPTION_KEY", encryption_key)
    monkeypatch.setenv("SSO_REDIRECT_BASE_URL", "http://localhost:3000")
    from arc.services.sso import SSOService
    return SSOService()

@pytest.fixture
async def test_tenant():
    """Create test tenant."""
    tenant = await db.express.create("Tenant", {
        "id": str(uuid4()),
        "name": "Test Tenant",
        "subdomain": f"test-{uuid4().hex[:8]}",
    })
    return tenant

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
```

---

## Running Tests

```bash
# Unit tests only
pytest tests/unit/services/test_sso.py -v

# Integration tests (requires Docker)
./tests/utils/test-env up
pytest tests/integration/test_sso_flow.py -v

# All SSO tests
pytest -k "sso" -v

# With coverage
pytest tests/unit/services/test_sso.py --cov=arc.services.sso --cov-report=term-missing
```

---

## Related Documentation

- [SSO Overview](/docs/developers/00-sso-overview.md) - Architecture
- [Backend SSO](/docs/developers/01-sso-backend.md) - Implementation
- [Frontend SSO](/docs/developers/02-sso-frontend.md) - UI components
- [Azure AD Setup](/docs/deployment/azure-ad-setup.md) - Provider configuration
