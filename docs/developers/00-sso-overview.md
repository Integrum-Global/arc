# Enterprise SSO Overview

The ARC Investment Platform implements OAuth 2.0 single sign-on (SSO) with PKCE support for enterprise authentication. This document provides an architectural overview of the SSO system.

---

## Architecture Overview

```
                              ARC SSO Architecture

+-------------+      +----------------+      +------------------+      +-------------+
|   Browser   |      |   Next.js      |      |   FastAPI        |      |   OAuth     |
|   (User)    |      |   Frontend     |      |   Backend        |      |   Provider  |
+------+------+      +-------+--------+      +--------+---------+      +------+------+
       |                     |                        |                       |
       |  1. Click SSO       |                        |                       |
       |-------------------->|                        |                       |
       |                     |  2. POST /auth/oauth/  |                       |
       |                     |     {provider}         |                       |
       |                     |----------------------->|                       |
       |                     |                        |                       |
       |                     |  3. {auth_url, state,  |                       |
       |                     |      code_verifier}    |                       |
       |                     |<-----------------------|                       |
       |                     |                        |                       |
       |  4. Store state,    |                        |                       |
       |     redirect to IdP |                        |                       |
       |<--------------------|                        |                       |
       |                     |                        |                       |
       |  5. Authenticate    |                        |                       |
       |---------------------------------------------------------->|
       |                     |                        |                       |
       |  6. Callback with   |                        |                       |
       |     code            |                        |                       |
       |<----------------------------------------------------------|
       |                     |                        |                       |
       |  7. POST /auth/     |                        |                       |
       |     callback        |                        |                       |
       |-------------------->|                        |                       |
       |                     |  8. Exchange code      |                       |
       |                     |     + verify state     |                       |
       |                     |----------------------->|                       |
       |                     |                        |  9. Token exchange    |
       |                     |                        |---------------------->|
       |                     |                        |                       |
       |                     |                        |  10. Tokens + user    |
       |                     |                        |<----------------------|
       |                     |                        |                       |
       |                     |  11. JWT + user        |                       |
       |                     |<-----------------------|                       |
       |                     |                        |                       |
       |  12. Store token,   |                        |                       |
       |      redirect       |                        |                       |
       |<--------------------|                        |                       |
```

---

## Supported Providers

| Provider | Use Case | Multi-Tenant | Scopes |
|----------|----------|--------------|--------|
| **Azure AD** | Enterprise organizations using Microsoft 365 | Yes (`common`) | `openid`, `profile`, `email`, `User.Read` |
| **Google Workspace** | Tech companies, startups | No | `openid`, `profile`, `email` |
| **GitHub** | Developer teams | No | `read:user`, `user:email` |

---

## Security Features

### PKCE (Proof Key for Code Exchange)

PKCE protects against authorization code interception attacks:

```
1. Generate code_verifier (43-character random string)
2. Create code_challenge = BASE64URL(SHA256(code_verifier))
3. Send code_challenge in authorization request
4. Send code_verifier in token exchange
5. Provider verifies SHA256(code_verifier) == stored challenge
```

**Implementation (from `src/arc/services/sso.py`)**:

```python
# Generate PKCE values
code_verifier = secrets.token_urlsafe(32)  # 43 chars
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")
```

### State Parameter (CSRF Protection)

Prevents cross-site request forgery:

```python
# Generate state
state = secrets.token_urlsafe(32)

# Constant-time validation (prevents timing attacks)
if not secrets.compare_digest(returned_state, expected_state):
    raise ValueError("Invalid state parameter")
```

### Token Security

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token (ARC) | 15 minutes | Zustand store (memory) | API authentication |
| Refresh Token (ARC) | 7 days | httpOnly cookie | Token renewal |
| ID Token (IdP) | N/A | Not stored | Identity verification |

---

## Data Model

### SSOProvider

Stores OAuth provider configuration per tenant:

```python
@db.model
class SSOProvider:
    id: str                          # UUID
    tenant_id: str                   # Foreign key to Tenant
    provider_type: str               # "azure" | "google" | "github"
    display_name: str                # UI display name
    client_id: str                   # OAuth client ID
    client_secret_encrypted: str     # Encrypted client secret
    azure_tenant_id: str | None      # Azure: "common" or GUID
    google_domain: str | None        # Google: domain restriction
    is_enabled: bool                 # Enable/disable provider
    auto_provision: bool             # Auto-create users on SSO
    default_role: str                # Role for new users
```

### LinkedAccount

Links ARC users to external OAuth identities:

```python
@db.model
class LinkedAccount:
    id: str
    user_id: str                     # Foreign key to User
    provider_type: str               # Provider name
    provider_user_id: str            # External user ID (sub claim)
    provider_email: str              # Email from provider
    provider_name: str | None        # Display name from provider
    linked_at: str                   # ISO timestamp
    last_login_at: str | None        # Last SSO login time
```

---

## Authentication Flow Scenarios

### Scenario 1: New User, SSO First Login

```
1. User clicks "Sign in with Azure"
2. Redirected to Azure AD login
3. Azure returns authorization code
4. Backend exchanges code for tokens
5. Backend queries LinkedAccount: NOT FOUND
6. Backend queries User by email: NOT FOUND
7. Backend auto-provisions new User + LinkedAccount
8. Returns JWT tokens to frontend
```

### Scenario 2: Existing User, SSO Login (Already Linked)

```
1. User clicks "Sign in with Azure"
2. Redirected to Azure AD login
3. Azure returns authorization code
4. Backend exchanges code for tokens
5. Backend queries LinkedAccount: FOUND
6. Updates last_login_at
7. Returns JWT tokens to frontend
```

### Scenario 3: Existing User, SSO Login (Not Linked)

```
1. User clicks "Sign in with Azure"
2. Redirected to Azure AD login
3. Azure returns authorization code
4. Backend exchanges code for tokens
5. Backend queries LinkedAccount: NOT FOUND
6. Backend queries User by email: FOUND
7. Returns action: "link_required"
8. Frontend shows link confirmation modal
9. User confirms, backend creates LinkedAccount
```

### Scenario 4: User Links SSO in Settings

```
1. Authenticated user navigates to Settings > Security
2. Clicks "Connect" next to Azure AD
3. OAuth flow initiated (same as login)
4. Backend verifies user is authenticated
5. Creates LinkedAccount for existing user
```

---

## Provider Configuration

### Azure AD

```python
{
    "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "userinfo_endpoint": "https://graph.microsoft.com/v1.0/me",
    "scopes": ["openid", "profile", "email", "User.Read"],
}
```

**Multi-Tenant Support**: Use `tenant_id="common"` to accept users from any Azure AD tenant.

### Google Workspace

```python
{
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_endpoint": "https://oauth2.googleapis.com/token",
    "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
    "scopes": ["openid", "profile", "email"],
}
```

**Domain Restriction**: Set `google_domain` to restrict to specific workspace domain.

### GitHub

```python
{
    "authorization_endpoint": "https://github.com/login/oauth/authorize",
    "token_endpoint": "https://github.com/login/oauth/access_token",
    "userinfo_endpoint": "https://api.github.com/user",
    "emails_endpoint": "https://api.github.com/user/emails",  # Fallback for email
    "scopes": ["read:user", "user:email"],
}
```

**Email Handling**: GitHub may not return email in profile; service fetches from `/user/emails` endpoint.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/oauth/{provider}` | Start OAuth flow | No |
| `POST` | `/api/v1/auth/oauth/{provider}/callback` | Handle OAuth callback | No |
| `GET` | `/api/v1/auth/linked-accounts` | List user's linked accounts | Yes |
| `POST` | `/api/v1/auth/link/{provider}` | Link account to SSO | Yes |
| `DELETE` | `/api/v1/auth/link/{provider}` | Unlink account from SSO | Yes |

---

## Environment Configuration

```bash
# Required for all SSO
SSO_REDIRECT_BASE_URL=https://app.arc-invest.com
SSO_SECRET_ENCRYPTION_KEY=<fernet-key>

# Azure AD (multi-tenant)
SSO_AZURE_CLIENT_ID=<client-id>
SSO_AZURE_CLIENT_SECRET=<client-secret>
SSO_AZURE_TENANT_ID=common

# Google Workspace
SSO_GOOGLE_CLIENT_ID=<client-id>
SSO_GOOGLE_CLIENT_SECRET=<client-secret>

# GitHub
SSO_GITHUB_CLIENT_ID=<client-id>
SSO_GITHUB_CLIENT_SECRET=<client-secret>
```

---

## Component Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| **SSOProvider model** | `src/arc/models/sso.py` | DataFlow model for provider config |
| **LinkedAccount model** | `src/arc/models/sso.py` | DataFlow model for user links |
| **SSOService** | `src/arc/services/sso.py` | OAuth flow logic, user handling |
| **OAuth routes** | `src/arc/api/routes/oauth.py` | API endpoint schemas and handlers |
| **Login page** | `apps/web/src/app/(auth)/login/page.tsx` | SSO button UI |
| **Callback handler** | `apps/web/src/app/auth/callback/page.tsx` | OAuth callback processing |
| **Linked Accounts** | `apps/web/src/components/settings/LinkedAccountsManager.tsx` | Account management UI |

---

## Related Documentation

- [Azure AD Setup Guide](/docs/deployment/azure-ad-setup.md) - Azure app registration
- [Backend SSO Documentation](/docs/developers/01-sso-backend.md) - Service implementation
- [Frontend SSO Documentation](/docs/developers/02-sso-frontend.md) - React components
- [SSO Testing Guide](/docs/developers/03-sso-testing.md) - Test strategies
