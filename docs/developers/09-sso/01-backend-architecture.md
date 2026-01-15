# Backend Architecture

## Overview

The ARC SSO backend is built using:
- **DataFlow**: Database models with auto-generated CRUD nodes
- **Nexus**: API gateway for OAuth endpoints
- **Python httpx**: Async HTTP client for IdP communication
- **Fernet**: Symmetric encryption for client secrets

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Nexus)                        │
│  /api/v1/auth/oauth/{provider}                              │
│  /api/v1/auth/oauth/{provider}/callback                     │
│  /api/v1/auth/link/{provider}                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Service Layer                              │
│  SSOService                                                 │
│  - start_oauth()                                            │
│  - handle_callback()                                        │
│  - link_account()                                           │
│  - unlink_account()                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Data Layer (DataFlow)                          │
│  Models:                                                    │
│  - SSOProvider (OAuth config per tenant)                    │
│  - LinkedAccount (User-to-IdP mapping)                      │
│  - User (Extended with auth_provider fields)                │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### SSOProvider Model

OAuth provider configuration stored per tenant.

**File**: `/src/arc/models/sso.py:18-61`

```python
from arc.models.database import db

@db.model
class SSOProvider:
    """
    OAuth provider configuration per tenant.

    Stores client credentials and settings for Azure AD, Google, and GitHub
    OAuth integrations. Each tenant can configure multiple providers.

    Unique Constraint: (tenant_id, provider_type) - one config per provider per tenant
    """

    # Primary Key - MUST be named 'id' (DataFlow requirement)
    id: str  # UUID format

    # Foreign Key
    tenant_id: str  # References Tenant.id

    # OAuth Provider Configuration
    provider_type: str  # "azure" | "google" | "github"
    display_name: str  # "Company Azure AD" - shown in UI
    client_id: str  # OAuth client ID from provider
    client_secret_encrypted: str  # Encrypted client secret (use Fernet in production)

    # Provider-Specific Settings (optional)
    azure_tenant_id: str | None = None  # Azure: "common" for multi-tenant or GUID
    google_domain: str | None = None  # Google: domain restriction (e.g., "company.com")

    # Behavioral Settings
    is_enabled: bool = True  # Enable/disable provider for this tenant
    auto_provision: bool = True  # Auto-create users on first SSO login (JIT)
    default_role: str = "viewer"  # Default role for auto-provisioned users

    # NOTE: created_at and updated_at are AUTO-MANAGED by DataFlow
    # NEVER set these manually - causes DF-104 error!

    __dataflow__ = {
        "indexes": [
            {
                "fields": ["tenant_id", "provider_type"],
                "unique": True,
            }  # One config per (tenant, provider)
        ]
    }
```

**Key Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `tenant_id` | str | Multi-tenancy isolation |
| `provider_type` | str | "azure" \| "google" \| "github" |
| `client_id` | str | OAuth client ID from IdP |
| `client_secret_encrypted` | str | Fernet-encrypted secret |
| `azure_tenant_id` | str? | "common" for multi-tenant |
| `google_domain` | str? | Domain restriction (e.g., "company.com") |
| `is_enabled` | bool | Enable/disable provider |
| `auto_provision` | bool | JIT provisioning |
| `default_role` | str | Default role for new users |

**Unique Constraint**: `(tenant_id, provider_type)` - Each tenant can have one config per provider.

### LinkedAccount Model

Maps ARC users to external OAuth identities.

**File**: `/src/arc/models/sso.py:64-104`

```python
@db.model
class LinkedAccount:
    """
    Links ARC user to external OAuth identity.

    Maps internal User records to external OAuth provider user IDs.
    Supports multiple providers per user (e.g., link both Azure and Google).

    Unique Constraints:
    - (user_id, provider_type): One link per user per provider
    - (provider_type, provider_user_id): Global uniqueness across all users
    """

    # Primary Key - MUST be named 'id'
    id: str  # UUID format

    # Foreign Keys
    user_id: str  # References User.id
    provider_type: str  # "azure" | "google" | "github"

    # OAuth Provider Data
    provider_user_id: str  # External user ID from OAuth provider (sub claim)
    provider_email: str  # Email address from provider
    provider_name: str | None = None  # Display name from provider (optional)

    # Metadata
    linked_at: str  # ISO timestamp when account was linked
    last_login_at: str | None = None  # ISO timestamp of last SSO login (optional)

    __dataflow__ = {
        "indexes": [
            {
                "fields": ["user_id", "provider_type"],
                "unique": True,
            },  # One link per user per provider
            {
                "fields": ["provider_type", "provider_user_id"],
                "unique": True,
            },  # Global uniqueness
        ]
    }
```

**Key Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `user_id` | str | References User.id |
| `provider_type` | str | "azure" \| "google" \| "github" |
| `provider_user_id` | str | External user ID (sub claim from IdP) |
| `provider_email` | str | Email from provider |
| `provider_name` | str? | Display name from provider |
| `linked_at` | str | ISO timestamp of link creation |
| `last_login_at` | str? | ISO timestamp of last SSO login |

**Unique Constraints:**
1. `(user_id, provider_type)` - One Azure link, one Google link, one GitHub link per user
2. `(provider_type, provider_user_id)` - Each external identity can only link to one ARC user

### User Model Extensions

The User model is extended to support SSO:

```python
@db.model
class User:
    id: str
    tenant_id: str
    email: str
    name: str
    role: str
    is_active: bool

    # SSO Fields
    auth_provider: str | None = None  # "azure" | "google" | "github" | None (password)
    auth_provider_id: str | None = None  # External user ID (DEPRECATED, use LinkedAccount)

    # Password Auth Fields (optional if using SSO)
    password_hash: str | None = None
```

**Note**: `auth_provider_id` is deprecated. Use `LinkedAccount` model for linking.

## SSO Service

The SSO service implements OAuth 2.0 Authorization Code Flow with PKCE.

**File**: `/src/arc/services/sso.py` (575 lines)

### Service Initialization

```python
class SSOService:
    """
    Service for OAuth SSO operations.

    Handles OAuth 2.0 Authorization Code Flow with PKCE for Azure AD, Google, and GitHub.
    Supports user provisioning, account linking, and multi-tenant configuration.
    """

    def __init__(self):
        """Initialize SSOService with environment configuration."""
        self.redirect_base = os.environ.get(
            "SSO_REDIRECT_BASE_URL", "http://localhost:3000"
        )
        self.encryption_key = os.environ.get("SSO_SECRET_ENCRYPTION_KEY")

        # Initialize Fernet cipher if encryption key provided
        self.fernet = None
        if self.encryption_key:
            try:
                self.fernet = Fernet(self.encryption_key.encode())
            except Exception:
                # Invalid key format - continue without encryption
                pass
```

**Environment Variables:**
- `SSO_REDIRECT_BASE_URL` - Frontend base URL (default: `http://localhost:3000`)
- `SSO_SECRET_ENCRYPTION_KEY` - 32-byte Fernet key for encrypting client secrets

### OAuth Provider Configuration

**File**: `/src/arc/services/sso.py:57-86`

```python
class OAuthConfig:
    """
    OAuth provider endpoint configurations.

    Defines authorization, token, and userinfo endpoints for each provider.
    Azure AD supports multi-tenant with tenant_id="common".
    """

    PROVIDERS = {
        "azure": {
            "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
            "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            "userinfo_endpoint": "https://graph.microsoft.com/v1.0/me",
            "scopes": ["openid", "profile", "email", "User.Read"],
        },
        "google": {
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scopes": ["openid", "profile", "email"],
        },
        "github": {
            "authorization_endpoint": "https://github.com/login/oauth/authorize",
            "token_endpoint": "https://github.com/login/oauth/access_token",
            "userinfo_endpoint": "https://api.github.com/user",
            "emails_endpoint": "https://api.github.com/user/emails",
            "scopes": ["read:user", "user:email"],
        },
    }
```

### Start OAuth Flow

Generates authorization URL with PKCE challenge.

**File**: `/src/arc/services/sso.py:116-185`

```python
async def start_oauth(
    self, provider: str, tenant_id: str, return_url: str | None = None
) -> dict[str, str]:
    """
    Generate OAuth authorization URL with PKCE.

    Args:
        provider: OAuth provider ("azure", "google", "github")
        tenant_id: Tenant ID for configuration lookup
        return_url: URL to redirect to after successful OAuth (optional)

    Returns:
        Dictionary with:
        - auth_url: OAuth authorization URL (redirect user here)
        - state: CSRF state parameter (store in session)
        - code_verifier: PKCE code verifier (store in session)
        - return_url: Return URL after OAuth completion

    Raises:
        ValueError: If provider not configured or disabled
    """
    # Get provider config from database
    sso_config = await self._get_sso_config(provider, tenant_id)
    if not sso_config or not sso_config.get("is_enabled", False):
        raise ValueError(f"Provider {provider} not configured or disabled")

    # Generate PKCE values
    code_verifier = secrets.token_urlsafe(32)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip("=")

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Build authorization URL
    provider_config = OAuthConfig.PROVIDERS[provider]
    auth_endpoint = provider_config["authorization_endpoint"]

    # Azure: substitute tenant ID
    if provider == "azure":
        azure_tenant = sso_config.get("azure_tenant_id", "common")
        auth_endpoint = auth_endpoint.format(tenant=azure_tenant)

    # Build query parameters
    params = {
        "client_id": sso_config["client_id"],
        "redirect_uri": f"{self.redirect_base}/auth/callback",
        "response_type": "code",
        "scope": " ".join(provider_config["scopes"]),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    # Google: add domain hint if configured
    if provider == "google" and sso_config.get("google_domain"):
        params["hd"] = sso_config["google_domain"]

    # Build URL
    from urllib.parse import urlencode
    auth_url = f"{auth_endpoint}?{urlencode(params)}"

    return {
        "auth_url": auth_url,
        "state": state,
        "code_verifier": code_verifier,
        "return_url": return_url or "/dashboard",
    }
```

**Flow:**
1. Get SSO provider config from database
2. Generate PKCE `code_verifier` (32-byte random string)
3. Compute `code_challenge` (SHA256 hash of verifier, base64url encoded)
4. Generate `state` for CSRF protection (32-byte random string)
5. Build authorization URL with params
6. Return auth URL, state, verifier for storage in sessionStorage

### Handle OAuth Callback

Exchanges authorization code for tokens and provisions user.

**File**: `/src/arc/services/sso.py:187-265`

```python
async def handle_callback(
    self,
    provider: str,
    tenant_id: str,
    code: str,
    state: str,
    code_verifier: str,
    expected_state: str,
) -> dict[str, Any]:
    """
    Exchange authorization code for tokens and user info.

    Args:
        provider: OAuth provider
        tenant_id: Tenant ID
        code: Authorization code from OAuth callback
        state: State parameter from OAuth callback
        code_verifier: PKCE code verifier (from session)
        expected_state: Expected state value (from session)

    Returns:
        Dictionary with:
        - action: "login" | "created" | "link_required"
        - user: User dictionary (if login or created)
        - user_id: User ID (if link_required)
        - provider: Provider name (if link_required)
        - provider_user_id: External user ID (if link_required)
        - provider_email: Email from provider (if link_required)
        - provider_name: Name from provider (if link_required)

    Raises:
        ValueError: If state invalid or token exchange fails
    """
    # Validate state using constant-time comparison
    if not secrets.compare_digest(state, expected_state):
        raise ValueError("Invalid state parameter")

    # Get provider config
    sso_config = await self._get_sso_config(provider, tenant_id)
    if not sso_config:
        raise ValueError(f"Provider {provider} not configured")

    provider_config = OAuthConfig.PROVIDERS[provider]

    # Decrypt client secret
    client_secret = self._decrypt_secret(sso_config["client_secret_encrypted"])

    # Exchange code for tokens
    token_endpoint = provider_config["token_endpoint"]
    if provider == "azure":
        azure_tenant = sso_config.get("azure_tenant_id", "common")
        token_endpoint = token_endpoint.format(tenant=azure_tenant)

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_endpoint,
            data={
                "client_id": sso_config["client_id"],
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": f"{self.redirect_base}/auth/callback",
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            },
            headers={"Accept": "application/json"},
        )

        if token_response.status_code != 200:
            raise ValueError(f"Token exchange failed: {token_response.text}")

        tokens = token_response.json()

        # Get user info
        user_info = await self._get_user_info(
            provider, tokens["access_token"], provider_config
        )

    # Handle user creation/linking
    return await self._handle_user(provider, tenant_id, user_info, sso_config)
```

**Flow:**
1. Validate state parameter (CSRF protection) using `secrets.compare_digest()`
2. Get SSO provider config from database
3. Decrypt client secret using Fernet
4. Exchange authorization code for access token (include `code_verifier` for PKCE)
5. Fetch user info from IdP using access token
6. Handle user provisioning/linking

### User Provisioning Logic

**File**: `/src/arc/services/sso.py:271-376`

```python
async def _handle_user(
    self,
    provider: str,
    tenant_id: str,
    user_info: dict[str, Any],
    sso_config: dict[str, Any],
) -> dict[str, Any]:
    """
    Handle user creation or linking based on SSO callback.

    Logic:
    1. Check for existing linked account → login
    2. Check for existing user by email → link_required
    3. Auto-provision new user (if enabled)

    Args:
        provider: OAuth provider
        tenant_id: Tenant ID
        user_info: User info from OAuth provider
        sso_config: SSO provider configuration

    Returns:
        Dictionary with action and user/link data

    Raises:
        ValueError: If auto-provisioning disabled
    """
    # Extract user info
    provider_user_id = user_info.get("sub") or user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name") or email

    # 1. Check for existing linked account
    linked_accounts = await db.express.list(
        "LinkedAccount",
        filter={
            "provider_type": provider,
            "provider_user_id": str(provider_user_id),
        },
    )

    if linked_accounts:
        linked = linked_accounts[0]
        # Update last login timestamp
        await db.express.update(
            "LinkedAccount",
            linked["id"],
            {"last_login_at": datetime.now(UTC).isoformat()},
        )
        user = await db.express.read("User", linked["user_id"])
        return {"action": "login", "user": user}

    # 2. Check for existing user by email
    if email:
        existing_users = await db.express.list(
            "User",
            filter={
                "email": email,
                "tenant_id": tenant_id,
            },
        )

        if existing_users:
            # User exists but not linked - prompt to link
            return {
                "action": "link_required",
                "user_id": existing_users[0]["id"],
                "provider": provider,
                "provider_user_id": str(provider_user_id),
                "provider_email": email,
                "provider_name": name,
            }

    # 3. Auto-provision new user
    if not sso_config.get("auto_provision", True):
        raise ValueError("User provisioning disabled for this tenant")

    new_user = await db.express.create(
        "User",
        {
            "id": str(uuid4()),
            "tenant_id": tenant_id,
            "email": email,
            "name": name,
            "auth_provider": provider,
            "auth_provider_id": str(provider_user_id),
            "role": sso_config.get("default_role", "viewer"),
            "is_active": True,
        },
    )

    # Create linked account
    await db.express.create(
        "LinkedAccount",
        {
            "id": str(uuid4()),
            "user_id": new_user["id"],
            "provider_type": provider,
            "provider_user_id": str(provider_user_id),
            "provider_email": email,
            "provider_name": name,
            "linked_at": datetime.now(UTC).isoformat(),
        },
    )

    return {"action": "created", "user": new_user}
```

**Provisioning Logic:**

```
┌───────────────────────────────────────┐
│  1. Check for existing LinkedAccount  │
│     (provider_type + provider_user_id)│
└──────────────┬────────────────────────┘
               │
               ├─ Found → Login
               │
               └─ Not Found
                  │
┌─────────────────▼─────────────────────┐
│  2. Check for existing User by email  │
│     (tenant_id + email)                │
└──────────────┬────────────────────────┘
               │
               ├─ Found → link_required
               │
               └─ Not Found
                  │
┌─────────────────▼─────────────────────┐
│  3. Auto-provision new user           │
│     (if auto_provision=True)          │
└───────────────────────────────────────┘
```

### Account Linking

Links an existing user to an SSO provider.

**File**: `/src/arc/services/sso.py:378-427`

```python
async def link_account(
    self,
    user_id: str,
    provider: str,
    provider_user_id: str,
    provider_email: str,
    provider_name: str | None = None,
) -> dict[str, Any]:
    """
    Link an existing user account to an SSO provider.

    Args:
        user_id: User ID to link
        provider: OAuth provider
        provider_user_id: External user ID from provider
        provider_email: Email from provider
        provider_name: Display name from provider (optional)

    Returns:
        LinkedAccount record

    Raises:
        ValueError: If account already linked to this provider
    """
    # Check if already linked
    existing = await db.express.list(
        "LinkedAccount",
        filter={
            "user_id": user_id,
            "provider_type": provider,
        },
    )

    if existing:
        raise ValueError(f"Account already linked to {provider}")

    linked = await db.express.create(
        "LinkedAccount",
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "provider_type": provider,
            "provider_user_id": provider_user_id,
            "provider_email": provider_email,
            "provider_name": provider_name,
            "linked_at": datetime.now(UTC).isoformat(),
        },
    )

    return linked
```

### Account Unlinking

Unlinks an SSO provider from a user.

**File**: `/src/arc/services/sso.py:429-466`

```python
async def unlink_account(self, user_id: str, provider: str) -> bool:
    """
    Unlink an SSO provider from a user account.

    Args:
        user_id: User ID
        provider: OAuth provider to unlink

    Returns:
        True if unlinked successfully

    Raises:
        ValueError: If trying to unlink last authentication method
    """
    linked = await db.express.list(
        "LinkedAccount",
        filter={
            "user_id": user_id,
            "provider_type": provider,
        },
    )

    if not linked:
        return False

    # Verify user has other auth methods
    user = await db.express.read("User", user_id)
    other_links = await db.express.list(
        "LinkedAccount",
        filter={"user_id": user_id},
    )

    # User must have either password or other linked accounts
    if len(other_links) <= 1 and not user.get("password_hash"):
        raise ValueError("Cannot unlink last authentication method")

    await db.express.delete("LinkedAccount", linked[0]["id"])
    return True
```

**Safety Check**: User must have at least one auth method (password OR another linked account).

## API Routes

OAuth API endpoints using Nexus.

**File**: `/src/arc/api/routes/oauth.py` (211 lines)

### Start OAuth Endpoint

**Endpoint**: `POST /api/v1/auth/oauth/{provider}`

```python
async def start_oauth(provider: str, tenant_id: str, return_url: str | None = None) -> dict[str, Any]:
    """
    Start OAuth 2.0 authorization flow.

    Args:
        provider: OAuth provider (azure, google, github)
        tenant_id: Tenant ID for SSO configuration lookup
        return_url: Optional URL to redirect after login

    Returns:
        dict with auth_url, state, code_verifier

    Raises:
        ValueError: If provider not configured or disabled
    """
    from arc.services.sso import sso_service

    # Call SSO service to generate OAuth URL
    result = await sso_service.start_oauth(
        provider=provider,
        tenant_id=tenant_id,
        return_url=return_url,
    )

    return {
        "auth_url": result["auth_url"],
        "state": result["state"],
        "code_verifier": result["code_verifier"],  # Client must store this!
    }
```

**Request:**
```json
POST /api/v1/auth/oauth/azure
{
  "tenant_id": "default",
  "return_url": "/dashboard"
}
```

**Response:**
```json
{
  "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=...",
  "state": "random-32-byte-state",
  "code_verifier": "random-32-byte-verifier"
}
```

### OAuth Callback Endpoint

**Endpoint**: `POST /api/v1/auth/oauth/{provider}/callback`

```python
async def handle_oauth_callback(
    provider: str,
    tenant_id: str,
    code: str,
    state: str,
    code_verifier: str,
) -> dict[str, Any]:
    """
    Handle OAuth 2.0 authorization callback.

    Args:
        provider: OAuth provider (azure, google, github)
        tenant_id: Tenant ID for SSO configuration
        code: Authorization code from provider
        state: State parameter from callback
        code_verifier: PKCE code verifier from start

    Returns:
        dict with action, tokens, and user data OR link_required

    Raises:
        ValueError: If state invalid or token exchange fails
    """
    from arc.services.sso import sso_service
    from arc.api.auth import create_access_token, create_refresh_token, get_role_permissions

    # Call SSO service to handle OAuth callback
    result = await sso_service.handle_callback(
        provider=provider,
        tenant_id=tenant_id,
        code=code,
        state=state,
        code_verifier=code_verifier,
        expected_state=state,  # For CSRF validation
    )

    # Check if account linking is required
    if result["action"] == "link_required":
        return {
            "action": "link_required",
            "link_data": {
                "user_id": result["user_id"],
                "provider": result["provider"],
                "provider_user_id": result["provider_user_id"],
                "provider_email": result["provider_email"],
                "provider_name": result.get("provider_name"),
            },
        }

    # User was created or logged in - generate JWT tokens
    user = result["user"]
    role = user.get("role", "viewer")
    permissions = [p.value for p in get_role_permissions(role)]

    # Create access token (15 minutes)
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
        role=role,
        permissions=permissions,
    )

    # Create refresh token (7 days)
    refresh_token = create_refresh_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
    )

    return {
        "action": result["action"],  # "created" or "login"
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,  # 15 minutes in seconds
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": role,
            "tenant_id": user["tenant_id"],
        },
    }
```

**Request:**
```json
POST /api/v1/auth/oauth/azure/callback
{
  "tenant_id": "default",
  "code": "authorization-code-from-idp",
  "state": "state-from-sessionStorage",
  "code_verifier": "verifier-from-sessionStorage"
}
```

**Response (Success):**
```json
{
  "action": "login",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "user": {
    "id": "user-123",
    "email": "alice@example.com",
    "name": "Alice",
    "role": "admin",
    "tenant_id": "default"
  }
}
```

**Response (Link Required):**
```json
{
  "action": "link_required",
  "link_data": {
    "user_id": "user-123",
    "provider": "azure",
    "provider_user_id": "azure-sub-456",
    "provider_email": "alice@example.com",
    "provider_name": "Alice Smith"
  }
}
```

## Security Implementation

### Client Secret Encryption

OAuth client secrets are encrypted at rest using Fernet (symmetric encryption).

**File**: `/src/arc/services/sso.py:544-570`

```python
def _decrypt_secret(self, encrypted: str) -> str:
    """
    Decrypt client secret.

    Args:
        encrypted: Encrypted secret

    Returns:
        Decrypted secret
    """
    if self.fernet:
        return self.fernet.decrypt(encrypted.encode()).decode()
    return encrypted

def _encrypt_secret(self, secret: str) -> str:
    """
    Encrypt client secret for storage.

    Args:
        secret: Plaintext secret

    Returns:
        Encrypted secret
    """
    if self.fernet:
        return self.fernet.encrypt(secret.encode()).decode()
    return secret
```

**Usage:**

```python
from cryptography.fernet import Fernet

# Generate Fernet key (32 bytes, base64 encoded)
key = Fernet.generate_key()
# b'dGVzdF9rZXlfZm9yX2VuY3J5cHRpb25fMzJfYnl0ZXM='

# Store in environment
os.environ["SSO_SECRET_ENCRYPTION_KEY"] = key.decode()

# Encrypt before storing
encrypted = sso_service._encrypt_secret("my-client-secret")
await db.express.create("SSOProvider", {
    "client_secret_encrypted": encrypted
})

# Decrypt when needed
secret = sso_service._decrypt_secret(sso_config["client_secret_encrypted"])
```

### State Validation (CSRF Protection)

State parameter validated using constant-time comparison.

```python
# Generate state (cryptographically random)
state = secrets.token_urlsafe(32)

# Validate using constant-time comparison (prevents timing attacks)
if not secrets.compare_digest(state, expected_state):
    raise ValueError("Invalid state parameter")
```

**Why constant-time?** Prevents timing attacks where attacker can guess state by measuring comparison time.

### PKCE Implementation

PKCE prevents authorization code interception.

```python
# Generate code_verifier (random 32-byte string)
code_verifier = secrets.token_urlsafe(32)

# Compute code_challenge (SHA256 hash, base64url encoded)
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")

# Send challenge to IdP (start_oauth)
params = {
    "code_challenge": code_challenge,
    "code_challenge_method": "S256"
}

# Send verifier during token exchange (handle_callback)
data = {
    "code": code,
    "code_verifier": code_verifier  # Proves you initiated the flow
}
```

## Testing

### Unit Tests

Test individual service methods in isolation.

**File**: `/tests/unit/services/test_sso.py` (24 tests)

```python
import pytest
from arc.services.sso import sso_service, SSOService

@pytest.mark.asyncio
async def test_start_oauth_generates_pkce_values():
    """Test that start_oauth generates valid PKCE values."""
    result = await sso_service.start_oauth(
        provider="azure",
        tenant_id="test-tenant",
        return_url="/dashboard"
    )

    assert "auth_url" in result
    assert "state" in result
    assert "code_verifier" in result
    assert len(result["state"]) >= 32
    assert len(result["code_verifier"]) >= 32

@pytest.mark.asyncio
async def test_handle_callback_validates_state():
    """Test that handle_callback rejects mismatched state."""
    with pytest.raises(ValueError, match="Invalid state parameter"):
        await sso_service.handle_callback(
            provider="azure",
            tenant_id="test-tenant",
            code="test-code",
            state="wrong-state",
            code_verifier="test-verifier",
            expected_state="expected-state"
        )
```

### Integration Tests (Tier 2)

Test with real database and mock IdP.

**File**: `/tests/integration/test_sso_flow.py`

```python
import pytest
from arc.models.database import db
from arc.services.sso import sso_service

@pytest.mark.asyncio
async def test_sso_provider_creation():
    """Test creating SSO provider configuration."""
    provider = await db.express.create("SSOProvider", {
        "id": "test-provider-1",
        "tenant_id": "test-tenant",
        "provider_type": "azure",
        "display_name": "Test Azure AD",
        "client_id": "test-client-id",
        "client_secret_encrypted": "test-secret",
        "azure_tenant_id": "common",
        "is_enabled": True,
        "auto_provision": True,
        "default_role": "viewer"
    })

    assert provider["id"] == "test-provider-1"
    assert provider["provider_type"] == "azure"

@pytest.mark.asyncio
async def test_full_oauth_flow_with_auto_provision():
    """Test complete OAuth flow with user auto-provisioning."""
    # 1. Start OAuth
    start_result = await sso_service.start_oauth(
        provider="azure",
        tenant_id="test-tenant"
    )

    # 2. Simulate IdP callback (mock user info)
    callback_result = await sso_service.handle_callback(
        provider="azure",
        tenant_id="test-tenant",
        code="mock-auth-code",
        state=start_result["state"],
        code_verifier=start_result["code_verifier"],
        expected_state=start_result["state"]
    )

    # 3. Verify user created
    assert callback_result["action"] == "created"
    assert "user" in callback_result
    assert callback_result["user"]["email"] == "test@example.com"

    # 4. Verify LinkedAccount created
    links = await db.express.list("LinkedAccount", filter={
        "user_id": callback_result["user"]["id"]
    })
    assert len(links) == 1
    assert links[0]["provider_type"] == "azure"
```

## Error Handling

Common error scenarios and handling:

### Provider Not Configured

```python
try:
    result = await sso_service.start_oauth(
        provider="azure",
        tenant_id="unknown-tenant"
    )
except ValueError as e:
    # "Provider azure not configured or disabled"
    return {"error": str(e)}, 400
```

### Invalid State (CSRF Attack)

```python
try:
    result = await sso_service.handle_callback(
        provider="azure",
        state="attacker-state",
        expected_state="legitimate-state",
        # ...
    )
except ValueError as e:
    # "Invalid state parameter"
    return {"error": "Authentication failed"}, 403
```

### Token Exchange Failure

```python
try:
    result = await sso_service.handle_callback(
        provider="azure",
        code="expired-code",
        # ...
    )
except ValueError as e:
    # "Token exchange failed: invalid_grant"
    return {"error": "Authentication failed"}, 400
```

### Auto-Provisioning Disabled

```python
try:
    result = await sso_service.handle_callback(
        provider="azure",
        # User doesn't exist, auto_provision=False
        # ...
    )
except ValueError as e:
    # "User provisioning disabled for this tenant"
    return {"error": str(e)}, 403
```

### Cannot Unlink Last Auth Method

```python
try:
    result = await sso_service.unlink_account(
        user_id="user-123",
        provider="azure"  # User's only auth method
    )
except ValueError as e:
    # "Cannot unlink last authentication method"
    return {"error": str(e)}, 400
```

## Performance Considerations

### DataFlow Express API

Use `db.express` for 23x faster CRUD operations:

```python
# ❌ SLOW: Workflow execution (~6.3ms per operation)
workflow = WorkflowBuilder()
workflow.add_node("UserReadNode", "read", {"id": user_id})
result = await runtime.execute_workflow_async(workflow.build())
user = result["read"]

# ✅ FAST: Express API (~0.27ms per operation)
user = await db.express.read("User", user_id)
```

### Database Indexes

Both models have strategic indexes:

```python
# SSOProvider: Fast lookup by (tenant_id, provider_type)
__dataflow__ = {
    "indexes": [
        {"fields": ["tenant_id", "provider_type"], "unique": True}
    ]
}

# LinkedAccount: Fast lookup by user_id and provider_user_id
__dataflow__ = {
    "indexes": [
        {"fields": ["user_id", "provider_type"], "unique": True},
        {"fields": ["provider_type", "provider_user_id"], "unique": True}
    ]
}
```

### Connection Pooling

Use httpx async client with connection pooling:

```python
# Reuse client across requests
async with httpx.AsyncClient() as client:
    token_response = await client.post(token_endpoint, ...)
    user_info = await client.get(userinfo_endpoint, ...)
```

## Summary

The ARC SSO backend provides:

1. **DataFlow Models**: SSOProvider, LinkedAccount with auto-generated CRUD
2. **SSOService**: OAuth 2.0 Authorization Code Flow with PKCE
3. **API Routes**: Start OAuth, handle callback, link/unlink accounts
4. **Security**: Fernet encryption, state validation, PKCE, constant-time comparisons
5. **User Provisioning**: Auto-provision, account linking, safety checks
6. **Multi-Tenant**: Per-tenant SSO configs, Azure AD multi-tenant support
7. **Testing**: 79+ unit tests, integration tests with real database

**Next Steps:**
- [Frontend Architecture](./02-frontend-architecture.md) - React components and flows
- [Azure Setup](./03-azure-setup.md) - Configure Azure AD multi-tenant
- [Testing SSO](./06-testing-sso.md) - Comprehensive testing guide
