# Backend SSO Documentation

This document covers the backend implementation of enterprise SSO for the ARC Investment Platform.

---

## Table of Contents

1. [DataFlow Models](#1-dataflow-models)
2. [SSOService API](#2-ssoservice-api)
3. [API Routes](#3-api-routes)
4. [Integration Guide](#4-integration-guide)
5. [Error Handling](#5-error-handling)

---

## 1. DataFlow Models

**File**: `src/arc/models/sso.py`

### SSOProvider Model

Stores OAuth provider configuration per tenant.

```python
from arc.models.database import db

@db.model
class SSOProvider:
    """OAuth provider configuration per tenant."""

    # Primary Key - MUST be named 'id' (DataFlow requirement)
    id: str                          # UUID format

    # Foreign Key
    tenant_id: str                   # References Tenant.id

    # OAuth Provider Configuration
    provider_type: str               # "azure" | "google" | "github"
    display_name: str                # "Company Azure AD" - shown in UI
    client_id: str                   # OAuth client ID from provider
    client_secret_encrypted: str     # Encrypted client secret

    # Provider-Specific Settings (optional)
    azure_tenant_id: str | None = None   # Azure: "common" for multi-tenant
    google_domain: str | None = None     # Google: domain restriction

    # Behavioral Settings
    is_enabled: bool = True          # Enable/disable provider
    auto_provision: bool = True      # Create user on first SSO login
    default_role: str = "viewer"     # Role for auto-provisioned users

    __dataflow__ = {
        "indexes": [
            {"fields": ["tenant_id", "provider_type"], "unique": True}
        ]
    }
```

### LinkedAccount Model

Links ARC users to external OAuth identities.

```python
@db.model
class LinkedAccount:
    """Links ARC user to external OAuth identity."""

    id: str                          # UUID
    user_id: str                     # FK to User
    provider_type: str               # "azure" | "google" | "github"
    provider_user_id: str            # External user ID (sub claim)
    provider_email: str              # Email from provider
    provider_name: str | None = None # Display name (optional)
    linked_at: str                   # ISO timestamp when linked
    last_login_at: str | None = None # Last SSO login time

    __dataflow__ = {
        "indexes": [
            {"fields": ["user_id", "provider_type"], "unique": True},
            {"fields": ["provider_type", "provider_user_id"], "unique": True}
        ]
    }
```

### Usage Examples

```python
from arc.models.database import db

# Create SSO provider configuration
provider = await db.express.create("SSOProvider", {
    "id": str(uuid4()),
    "tenant_id": "tenant-123",
    "provider_type": "azure",
    "display_name": "Acme Corp Azure AD",
    "client_id": "azure-client-id",
    "client_secret_encrypted": encrypted_secret,
    "azure_tenant_id": "common",
    "is_enabled": True,
    "auto_provision": True,
    "default_role": "viewer",
})

# List linked accounts for a user
linked = await db.express.list("LinkedAccount", filter={
    "user_id": "user-456"
})

# Update last login time
await db.express.update("LinkedAccount", linked[0]["id"], {
    "last_login_at": datetime.now(UTC).isoformat()
})
```

---

## 2. SSOService API

**File**: `src/arc/services/sso.py`

### Initialization

```python
from arc.services.sso import sso_service

# Service is a singleton, configured from environment variables:
# - SSO_REDIRECT_BASE_URL: Base URL for OAuth callbacks
# - SSO_SECRET_ENCRYPTION_KEY: Fernet key for encrypting client secrets
```

### start_oauth()

Generates an OAuth authorization URL with PKCE.

```python
async def start_oauth(
    provider: str,       # "azure" | "google" | "github"
    tenant_id: str,      # Tenant ID for config lookup
    return_url: str | None = None  # Redirect after OAuth
) -> dict[str, str]:
    """
    Returns:
        {
            "auth_url": "https://login.microsoftonline.com/...",
            "state": "random-state-for-csrf",
            "code_verifier": "pkce-code-verifier",
            "return_url": "/dashboard"
        }

    Raises:
        ValueError: If provider not configured or disabled
    """
```

**Example**:

```python
result = await sso_service.start_oauth(
    provider="azure",
    tenant_id="tenant-123",
    return_url="/dashboard"
)

# Store state and code_verifier (frontend stores in sessionStorage)
# Redirect user to result["auth_url"]
```

### handle_callback()

Exchanges authorization code for tokens and handles user provisioning.

```python
async def handle_callback(
    provider: str,           # OAuth provider
    tenant_id: str,          # Tenant ID
    code: str,               # Authorization code from callback
    state: str,              # State from callback URL
    code_verifier: str,      # PKCE verifier from start_oauth
    expected_state: str,     # Stored state for validation
) -> dict[str, Any]:
    """
    Returns one of:
        {"action": "login", "user": {...}}
        {"action": "created", "user": {...}}
        {"action": "link_required", "user_id": "...", ...}

    Raises:
        ValueError: If state invalid or token exchange fails
    """
```

**Example**:

```python
result = await sso_service.handle_callback(
    provider="azure",
    tenant_id="tenant-123",
    code="auth-code-from-url",
    state="state-from-url",
    code_verifier="stored-verifier",
    expected_state="stored-state",
)

if result["action"] == "login":
    # Existing linked user - issue JWT
    user = result["user"]

elif result["action"] == "created":
    # New user auto-provisioned - issue JWT
    user = result["user"]

elif result["action"] == "link_required":
    # Existing user found by email - prompt to link
    link_data = {
        "user_id": result["user_id"],
        "provider": result["provider"],
        "provider_user_id": result["provider_user_id"],
    }
```

### link_account()

Links an existing user to an SSO provider.

```python
async def link_account(
    user_id: str,
    provider: str,
    provider_user_id: str,
    provider_email: str,
    provider_name: str | None = None,
) -> dict[str, Any]:
    """
    Returns: LinkedAccount record
    Raises: ValueError if already linked
    """
```

**Example**:

```python
linked = await sso_service.link_account(
    user_id="user-123",
    provider="google",
    provider_user_id="google-user-456",
    provider_email="user@example.com",
    provider_name="John Doe",
)
```

### unlink_account()

Removes SSO link from a user account.

```python
async def unlink_account(user_id: str, provider: str) -> bool:
    """
    Returns: True if unlinked
    Raises: ValueError if last auth method
    """
```

**Example**:

```python
# Only works if user has password OR other linked accounts
success = await sso_service.unlink_account(
    user_id="user-123",
    provider="github",
)
```

---

## 3. API Routes

**File**: `src/arc/api/routes/oauth.py`

### Request/Response Schemas

```python
from pydantic import BaseModel, Field

class OAuthStartRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant ID")
    return_url: str | None = Field(None, description="Post-login redirect")

class OAuthStartResponse(BaseModel):
    auth_url: str = Field(..., description="OAuth authorization URL")
    state: str = Field(..., description="CSRF state parameter")
    code_verifier: str = Field(..., description="PKCE code verifier")

class OAuthCallbackRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant ID")
    code: str = Field(..., description="Authorization code")
    state: str = Field(..., description="State parameter")
    code_verifier: str = Field(..., description="PKCE verifier")

class OAuthCallbackSuccessResponse(BaseModel):
    action: str = Field(..., description="login | created")
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token")
    token_type: str = Field(default="Bearer")
    expires_in: int = Field(default=900)
    user: dict = Field(..., description="User profile")

class OAuthCallbackLinkRequiredResponse(BaseModel):
    action: str = Field(default="link_required")
    link_data: dict = Field(..., description="Account link data")
```

### Route Functions

```python
async def start_oauth(
    provider: str,
    tenant_id: str,
    return_url: str | None = None
) -> dict[str, Any]:
    """
    POST /api/v1/auth/oauth/{provider}

    Initiates OAuth 2.0 authorization flow with PKCE.
    """
    from arc.services.sso import sso_service

    result = await sso_service.start_oauth(
        provider=provider,
        tenant_id=tenant_id,
        return_url=return_url,
    )

    return {
        "auth_url": result["auth_url"],
        "state": result["state"],
        "code_verifier": result["code_verifier"],
    }


async def handle_oauth_callback(
    provider: str,
    tenant_id: str,
    code: str,
    state: str,
    code_verifier: str,
) -> dict[str, Any]:
    """
    POST /api/v1/auth/oauth/{provider}/callback

    Exchanges authorization code for tokens.
    """
    from arc.services.sso import sso_service
    from arc.api.auth import create_access_token, create_refresh_token

    result = await sso_service.handle_callback(
        provider=provider,
        tenant_id=tenant_id,
        code=code,
        state=state,
        code_verifier=code_verifier,
        expected_state=state,
    )

    if result["action"] == "link_required":
        return {
            "action": "link_required",
            "link_data": {...}
        }

    # Generate JWT tokens for login/created
    user = result["user"]
    access_token = create_access_token(user_id=user["id"], ...)
    refresh_token = create_refresh_token(user_id=user["id"], ...)

    return {
        "action": result["action"],
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,
        "user": {...}
    }
```

---

## 4. Integration Guide

### Adding SSO to Your Service

```python
from arc.services.sso import sso_service
from arc.api.auth import create_access_token

async def my_sso_endpoint(provider: str, request: OAuthCallbackRequest):
    """Example integration of SSO service."""

    # 1. Handle OAuth callback
    result = await sso_service.handle_callback(
        provider=provider,
        tenant_id=request.tenant_id,
        code=request.code,
        state=request.state,
        code_verifier=request.code_verifier,
        expected_state=request.state,
    )

    # 2. Handle different outcomes
    if result["action"] == "link_required":
        # Return link data to frontend for confirmation
        return {"action": "link_required", "link_data": result}

    # 3. Issue JWT for authenticated user
    user = result["user"]
    token = create_access_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
        role=user["role"],
    )

    return {"access_token": token, "user": user}
```

### Creating SSO Provider Configuration

```python
from arc.models.database import db
from arc.services.sso import sso_service

async def setup_tenant_sso(tenant_id: str, azure_config: dict):
    """Set up Azure AD SSO for a tenant."""

    # Encrypt client secret
    encrypted_secret = sso_service._encrypt_secret(
        azure_config["client_secret"]
    )

    # Create provider config
    provider = await db.express.create("SSOProvider", {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "provider_type": "azure",
        "display_name": azure_config["display_name"],
        "client_id": azure_config["client_id"],
        "client_secret_encrypted": encrypted_secret,
        "azure_tenant_id": azure_config.get("azure_tenant_id", "common"),
        "is_enabled": True,
        "auto_provision": True,
        "default_role": "viewer",
    })

    return provider
```

---

## 5. Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Provider not configured or disabled` | No SSOProvider record or `is_enabled=False` | Create/enable provider config |
| `Invalid state parameter` | CSRF validation failed | Ensure state stored/compared correctly |
| `Token exchange failed` | OAuth provider rejected request | Check client_id/secret, redirect_uri |
| `User provisioning disabled` | `auto_provision=False` and no matching user | Enable auto-provision or create user |
| `Account already linked` | Duplicate LinkedAccount | User already has this provider |
| `Cannot unlink last authentication method` | No password and single LinkedAccount | Add password or keep linked |

### Error Handling Pattern

```python
from fastapi import HTTPException

async def safe_sso_callback(provider: str, request: OAuthCallbackRequest):
    try:
        result = await sso_service.handle_callback(...)
        return result
    except ValueError as e:
        if "Invalid state" in str(e):
            raise HTTPException(400, "Session expired. Please try again.")
        elif "not configured" in str(e):
            raise HTTPException(400, f"SSO provider {provider} not available.")
        elif "Token exchange failed" in str(e):
            raise HTTPException(500, "Authentication failed. Please try again.")
        else:
            raise HTTPException(400, str(e))
```

---

## Environment Variables

```bash
# Required for SSO service
SSO_REDIRECT_BASE_URL=https://app.arc-invest.com  # Your app's base URL
SSO_SECRET_ENCRYPTION_KEY=<fernet-key>             # For encrypting client secrets

# Provider credentials (per-environment)
SSO_AZURE_CLIENT_ID=<azure-app-client-id>
SSO_AZURE_CLIENT_SECRET=<azure-client-secret>
SSO_AZURE_TENANT_ID=common

SSO_GOOGLE_CLIENT_ID=<google-client-id>
SSO_GOOGLE_CLIENT_SECRET=<google-client-secret>

SSO_GITHUB_CLIENT_ID=<github-client-id>
SSO_GITHUB_CLIENT_SECRET=<github-client-secret>
```

### Generate Encryption Key

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Related Documentation

- [SSO Overview](/docs/developers/00-sso-overview.md) - Architecture diagrams
- [Azure AD Setup](/docs/deployment/azure-ad-setup.md) - Provider configuration
- [Frontend SSO](/docs/developers/02-sso-frontend.md) - React components
- [SSO Testing](/docs/developers/03-sso-testing.md) - Test strategies
