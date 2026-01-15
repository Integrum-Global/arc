# Enterprise SSO Overview

## What is Enterprise SSO?

Single Sign-On (SSO) allows users to authenticate using their existing corporate identity provider (IdP) instead of creating separate passwords for ARC. This provides:

**For Users:**
- Single set of credentials across all business applications
- No password fatigue or password reuse
- Automatic access when hired, revoked when leaving
- Familiar login experience (company Azure AD, Google Workspace, etc.)

**For Organizations:**
- Centralized access control via IdP
- Multi-factor authentication (MFA) enforcement
- Compliance with security policies
- Audit trail of authentication events
- Reduced help desk password reset tickets

## Supported Identity Providers

ARC supports three enterprise identity providers:

| Provider | Use Case | Multi-Tenant | Key Features |
|----------|----------|--------------|--------------|
| **Azure AD** | Microsoft 365 organizations | ✅ Yes | Multi-tenant support, Conditional Access, device compliance |
| **Google Workspace** | Google Workspace organizations | ❌ No (domain-specific) | G Suite integration, domain restrictions |
| **GitHub** | Developer teams, open source | ❌ No | GitHub organizations, repository access |

## OAuth 2.0 Authorization Code Flow

ARC implements the **OAuth 2.0 Authorization Code Flow**, the industry-standard protocol for secure authentication. This flow involves:

### Flow Diagram

```
┌─────────┐                                        ┌──────────────┐
│         │                                        │              │
│ Browser │                                        │   Azure AD   │
│         │                                        │   (IdP)      │
└────┬────┘                                        └──────┬───────┘
     │                                                    │
     │  1. User clicks "Sign in with Azure"              │
     ├──────────────────────────────────────────────────►│
     │                                                    │
     │  2. Redirect to IdP with code_challenge (PKCE)    │
     │◄───────────────────────────────────────────────────┤
     │                                                    │
     │  3. User authenticates with IdP                   │
     ├──────────────────────────────────────────────────►│
     │                                                    │
     │  4. Redirect back with authorization code         │
     │◄───────────────────────────────────────────────────┤
     │                                                    │
     │  5. Exchange code for access token (with code_verifier)
     │    POST /api/v1/auth/oauth/{provider}/callback    │
     ├───────────────────────────┐                       │
     │                           │                       │
     │                    ┌──────▼──────┐                │
     │                    │             │                │
     │                    │  ARC API    │◄───────────────┤
     │                    │  (Backend)  │                │
     │                    └──────┬──────┘                │
     │                           │                       │
     │  6. Return JWT tokens     │                       │
     │◄──────────────────────────┤                       │
     │                                                    │
     │  7. Store tokens, redirect to dashboard           │
     │                                                    │
```

### Key Components

**1. Authorization Code**
- Short-lived one-time-use code returned from IdP
- Exchanged for access token on backend
- Prevents token exposure in browser

**2. PKCE (Proof Key for Code Exchange)**
- Security extension to prevent authorization code interception
- `code_verifier`: Random 32-byte string stored in sessionStorage
- `code_challenge`: SHA256 hash of code_verifier sent to IdP
- IdP verifies match during token exchange

**3. State Parameter**
- Random 32-byte string for CSRF protection
- Stored in sessionStorage before redirect
- Validated when callback returns
- Uses `secrets.compare_digest()` for constant-time comparison

**4. Scopes**
- Permissions requested from IdP
- Azure: `openid profile email User.Read`
- Google: `openid profile email`
- GitHub: `read:user user:email`

## Security Features

### 1. PKCE (RFC 7636)

Prevents authorization code interception attacks:

```python
# Generate PKCE values (start_oauth)
code_verifier = secrets.token_urlsafe(32)  # Random 32-byte string
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")

# Store verifier in sessionStorage (frontend)
sessionStorage.setItem('oauth_code_verifier', code_verifier)

# Send challenge to IdP
params = {
    "code_challenge": code_challenge,
    "code_challenge_method": "S256"
}

# Validate during token exchange (handle_callback)
token_response = await client.post(
    token_endpoint,
    data={
        "code": code,
        "code_verifier": code_verifier  # Prove you initiated the flow
    }
)
```

### 2. State Validation (CSRF Protection)

Prevents cross-site request forgery attacks:

```python
# Generate state (start_oauth)
state = secrets.token_urlsafe(32)

# Store in sessionStorage (frontend)
sessionStorage.setItem('oauth_state', state)

# Validate on callback using constant-time comparison
if not secrets.compare_digest(state, expected_state):
    raise ValueError("Invalid state parameter")
```

### 3. Client Secret Encryption

OAuth client secrets are encrypted at rest using Fernet (symmetric encryption):

```python
from cryptography.fernet import Fernet

class SSOService:
    def __init__(self):
        key = os.environ.get("SSO_SECRET_ENCRYPTION_KEY")
        self.fernet = Fernet(key.encode())

    def _encrypt_secret(self, secret: str) -> str:
        return self.fernet.encrypt(secret.encode()).decode()

    def _decrypt_secret(self, encrypted: str) -> str:
        return self.fernet.decrypt(encrypted.encode()).decode()
```

### 4. JWT Token Authentication

After successful OAuth:
- **Access Token**: 15-minute JWT with user ID, tenant, role, permissions
- **Refresh Token**: 7-day JWT for obtaining new access tokens
- Tokens stored in localStorage/httpOnly cookies
- Backend validates JWT signature on every API request

## User Provisioning

ARC supports three user provisioning modes:

### 1. Auto-Provisioning (JIT)

Users are automatically created on first SSO login:

```python
@db.model
class SSOProvider:
    auto_provision: bool = True  # Enable JIT provisioning
    default_role: str = "viewer"  # Default role for new users
```

**Flow:**
1. User signs in with Azure AD for first time
2. No existing user found with this email
3. ARC creates user automatically with `default_role`
4. LinkedAccount created to link ARC user to Azure identity
5. User redirected to dashboard

### 2. Account Linking

User exists but hasn't linked SSO yet:

```python
# User signs in with Azure AD
# Email matches existing user
# Backend returns link_required action

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

# Frontend shows LinkAccountModal
# User confirms linking
# POST /api/v1/auth/link/azure
# Returns JWT tokens
```

### 3. Pre-Provisioned Users

Users are created manually before SSO:

```python
# Admin creates user
await db.express.create("User", {
    "id": str(uuid4()),
    "tenant_id": "default",
    "email": "alice@example.com",
    "name": "Alice",
    "role": "admin",
    "auth_provider": "azure"
})

# User signs in with Azure AD
# Email matches existing user
# Account linking prompt shown
# After linking, user has Azure AD SSO access
```

## Multi-Tenant Support

### Database Multi-Tenancy

ARC supports multiple customer tenants in a single database:

```python
@db.model
class User:
    id: str
    tenant_id: str  # Isolates users by customer
    email: str
    # ...

@db.model
class SSOProvider:
    id: str
    tenant_id: str  # Each tenant has own SSO config
    provider_type: str
    # ...
```

Each tenant can configure their own SSO providers independently.

### Azure AD Multi-Tenant

Azure AD supports **multi-tenant mode** where a single OAuth app serves multiple Azure AD organizations:

```python
@db.model
class SSOProvider:
    azure_tenant_id: str = "common"  # Multi-tenant mode
```

When `azure_tenant_id="common"`:
- Authorization endpoint: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- Users from ANY Azure AD organization can sign in
- Each user authenticates against their home tenant
- Ideal for SaaS applications

See [03-azure-setup.md](./03-azure-setup.md) for detailed Azure multi-tenant configuration.

## Account Management

### Linking Multiple Providers

Users can link multiple SSO providers to one account:

```python
@db.model
class LinkedAccount:
    id: str
    user_id: str  # References User.id
    provider_type: str  # "azure" | "google" | "github"
    provider_user_id: str  # External user ID from IdP
    provider_email: str
    provider_name: str | None

    __dataflow__ = {
        "indexes": [
            {"fields": ["user_id", "provider_type"], "unique": True}
        ]
    }
```

**Example:**
- User signs in with Azure AD → LinkedAccount created for Azure
- User links Google Workspace → Second LinkedAccount created for Google
- User can now sign in with either Azure or Google
- Both logins access the same ARC user account

### Unlinking Accounts

Users can unlink SSO providers:

```python
async def unlink_account(user_id: str, provider: str) -> bool:
    # Verify user has other auth methods (password or other linked accounts)
    if len(other_links) <= 1 and not user.get("password_hash"):
        raise ValueError("Cannot unlink last authentication method")

    # Delete LinkedAccount
    await db.express.delete("LinkedAccount", linked[0]["id"])
```

**Safety checks:**
- User must have at least one auth method (password OR another linked account)
- Cannot unlink if it's the last authentication method

## Architecture Overview

### Backend Components

```
src/arc/
├── models/
│   └── sso.py                     # DataFlow models
│       ├── SSOProvider            # OAuth provider config per tenant
│       └── LinkedAccount          # User-to-IdP mapping
├── services/
│   └── sso.py                     # OAuth service (495 lines)
│       ├── start_oauth()          # Generate auth URL with PKCE
│       ├── handle_callback()      # Exchange code for tokens
│       ├── link_account()         # Link existing user to provider
│       └── unlink_account()       # Unlink provider from user
└── api/
    └── routes/
        └── oauth.py               # API endpoints
            ├── POST /api/v1/auth/oauth/{provider}
            └── POST /api/v1/auth/oauth/{provider}/callback
```

### Frontend Components

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx           # Login page with SSO buttons
│   └── auth/
│       └── callback/
│           └── page.tsx           # OAuth callback handler
├── components/
│   ├── settings/
│   │   └── LinkedAccountsManager.tsx  # Manage linked accounts
│   ├── auth/
│   │   └── LinkAccountModal.tsx   # Account linking confirmation
│   └── icons/
│       ├── AzureIcon.tsx          # Brand icons
│       ├── GoogleIcon.tsx
│       └── GitHubIcon.tsx
└── hooks/
    └── useLinkedAccounts.ts       # React Query hooks
```

## Environment Configuration

Required environment variables:

```bash
# Azure AD
SSO_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
SSO_AZURE_CLIENT_SECRET=your-secret-value
SSO_AZURE_DEFAULT_TENANT_ID=common  # Multi-tenant

# Google Workspace
SSO_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
SSO_GOOGLE_CLIENT_SECRET=your-secret-value

# GitHub
SSO_GITHUB_CLIENT_ID=Iv1.abcdef123456
SSO_GITHUB_CLIENT_SECRET=your-secret-value

# Encryption
SSO_SECRET_ENCRYPTION_KEY=your-fernet-key-here

# Redirect URLs
SSO_REDIRECT_BASE_URL=http://localhost:3000
```

## Testing Strategy

### Unit Tests (Tier 1)

Test individual components in isolation:
- SSOProvider model validation
- OAuth service methods (start_oauth, handle_callback)
- React components (Login, Callback, LinkedAccountsManager)
- React hooks (useLinkedAccounts)

**Total: 79+ unit tests**

### Integration Tests (Tier 2)

Test with real database (NO MOCKING):
- Full OAuth flow with test IdP
- User provisioning and account linking
- Multiple provider scenarios
- Token generation and validation

### End-to-End Tests (Tier 3)

Test complete user flows with Playwright:
- Sign in with Azure AD → Dashboard
- Account linking flow → Confirmation → JWT tokens
- Manage linked accounts → Unlink → Verify
- Multi-provider support → Link multiple → Switch providers

## Usage Example

### Basic OAuth Flow

```typescript
// User clicks "Sign in with Azure"
const handleSSOLogin = async (provider: 'azure' | 'google' | 'github') => {
  // 1. Start OAuth flow
  const res = await fetch(`/api/v1/auth/oauth/${provider}`, {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: 'default',
      return_url: '/dashboard'
    })
  });
  const data = await res.json();

  // 2. Store PKCE values
  sessionStorage.setItem('oauth_state', data.state);
  sessionStorage.setItem('oauth_code_verifier', data.code_verifier);
  sessionStorage.setItem('oauth_provider', provider);

  // 3. Redirect to IdP
  window.location.href = data.auth_url;
};

// Callback page handles redirect
const handleCallback = async () => {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = sessionStorage.getItem('oauth_state');
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  const provider = sessionStorage.getItem('oauth_provider');

  // 4. Validate state (CSRF)
  if (state !== storedState) {
    throw new Error('Invalid state');
  }

  // 5. Exchange code for tokens
  const res = await fetch(`/api/v1/auth/oauth/${provider}/callback`, {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: 'default',
      code,
      state,
      code_verifier: codeVerifier
    })
  });
  const data = await res.json();

  // 6. Store JWT tokens
  if (data.action === 'login' || data.action === 'created') {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    router.push('/dashboard');
  } else if (data.action === 'link_required') {
    // Show account linking modal
    setShowLinkModal(true);
  }
};
```

## Next Steps

- **[Backend Architecture](./01-backend-architecture.md)** - Deep dive into models, service, routes
- **[Frontend Architecture](./02-frontend-architecture.md)** - Deep dive into components, hooks, flows
- **[Azure Setup](./03-azure-setup.md)** - Configure Azure AD multi-tenant
- **[Google Setup](./04-google-setup.md)** - Configure Google Workspace OAuth
- **[GitHub Setup](./05-github-setup.md)** - Configure GitHub OAuth app
- **[Testing SSO](./06-testing-sso.md)** - Comprehensive testing guide

## References

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
