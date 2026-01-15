# ARC Enterprise SSO Architecture

## Overview

This document defines the OAuth 2.0 single sign-on architecture for the ARC investment management platform. The implementation supports Azure AD (with multi-tenant), Google Workspace, and GitHub for enterprise authentication.

---

## 1. Problem Statement

### Current State
- Only email/password authentication exists
- No SSO integration for enterprise customers
- Users must create separate ARC accounts
- No centralized identity management

### Enterprise Requirements

| Requirement | Priority | Rationale |
|-------------|----------|-----------|
| Azure AD SSO | Critical | Most enterprise customers use M365 |
| Google SSO | High | Tech companies, smaller teams |
| GitHub SSO | Medium | Developer teams, open-source workflows |
| Multi-tenancy | Critical | Different orgs, different IdPs |
| Account linking | High | Connect existing ARC accounts to SSO |
| JIT provisioning | High | Auto-create users on first SSO login |

---

## 2. OAuth 2.0 Authorization Code Flow

### 2.1 Flow Diagram

```
┌────────┐          ┌────────────┐          ┌─────────────┐          ┌────────┐
│ User   │          │  Frontend  │          │   Backend   │          │  IdP   │
└───┬────┘          └─────┬──────┘          └──────┬──────┘          └───┬────┘
    │                     │                        │                     │
    │  1. Click "Sign in  │                        │                     │
    │     with Azure"     │                        │                     │
    │────────────────────▶│                        │                     │
    │                     │                        │                     │
    │                     │  2. GET /auth/oauth/   │                     │
    │                     │     azure?tenant=...   │                     │
    │                     │───────────────────────▶│                     │
    │                     │                        │                     │
    │                     │  3. Return auth URL    │                     │
    │                     │     with state, PKCE   │                     │
    │                     │◀───────────────────────│                     │
    │                     │                        │                     │
    │  4. Redirect to IdP │                        │                     │
    │◀────────────────────│                        │                     │
    │                     │                        │                     │
    │  5. Authenticate    │                        │                     │
    │     at IdP          │                        │                     │
    │─────────────────────┼────────────────────────┼────────────────────▶│
    │                     │                        │                     │
    │  6. Redirect back   │                        │                     │
    │     with code       │                        │                     │
    │◀────────────────────┼────────────────────────┼─────────────────────│
    │                     │                        │                     │
    │  7. Send code to    │  8. POST /auth/oauth/  │                     │
    │     callback        │     azure/callback     │                     │
    │────────────────────▶│───────────────────────▶│                     │
    │                     │                        │                     │
    │                     │                        │  9. Exchange code   │
    │                     │                        │     for tokens      │
    │                     │                        │────────────────────▶│
    │                     │                        │                     │
    │                     │                        │  10. Return tokens  │
    │                     │                        │◀────────────────────│
    │                     │                        │                     │
    │                     │                        │  11. Validate ID    │
    │                     │                        │      token, get     │
    │                     │                        │      user info      │
    │                     │                        │                     │
    │                     │  12. Create/link user  │                     │
    │                     │      Return JWT        │                     │
    │                     │◀───────────────────────│                     │
    │                     │                        │                     │
    │  13. Store JWT,     │                        │                     │
    │      redirect to    │                        │                     │
    │      dashboard      │                        │                     │
    │◀────────────────────│                        │                     │
```

### 2.2 Security Considerations

| Security Feature | Implementation |
|-----------------|----------------|
| **PKCE** | Required for all OAuth flows (code_challenge, code_verifier) |
| **State Parameter** | Random 32-byte value, stored in session, validated on callback |
| **Token Storage** | Access token in memory, refresh token in httpOnly cookie |
| **ID Token Validation** | Verify signature, issuer, audience, expiry, nonce |
| **HTTPS Only** | All OAuth endpoints require HTTPS in production |

---

## 3. Provider Configuration

### 3.1 Azure AD (Multi-Tenant)

```python
# Azure AD supports multi-tenant apps with tenant_id="common"
AZURE_CONFIG = {
    "client_id": os.environ["SSO_AZURE_CLIENT_ID"],
    "client_secret": os.environ["SSO_AZURE_CLIENT_SECRET"],
    "tenant_id": os.environ.get("SSO_AZURE_TENANT_ID", "common"),
    "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "userinfo_endpoint": "https://graph.microsoft.com/v1.0/me",
    "scopes": ["openid", "profile", "email", "User.Read"],
}

# For multi-tenant: tenant_id="common"
# For single-tenant: tenant_id="your-tenant-guid"
```

**Azure AD Multi-Tenant Setup:**
1. Register app in Azure Portal → App registrations
2. Set "Supported account types" to "Accounts in any organizational directory"
3. Configure redirect URI: `https://app.arc-invest.com/auth/callback`
4. Add API permissions: `User.Read`, `openid`, `profile`, `email`
5. Create client secret in "Certificates & secrets"

### 3.2 Google Workspace

```python
GOOGLE_CONFIG = {
    "client_id": os.environ["SSO_GOOGLE_CLIENT_ID"],
    "client_secret": os.environ["SSO_GOOGLE_CLIENT_SECRET"],
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_endpoint": "https://oauth2.googleapis.com/token",
    "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
    "scopes": ["openid", "profile", "email"],
}
```

### 3.3 GitHub

```python
GITHUB_CONFIG = {
    "client_id": os.environ["SSO_GITHUB_CLIENT_ID"],
    "client_secret": os.environ["SSO_GITHUB_CLIENT_SECRET"],
    "authorization_endpoint": "https://github.com/login/oauth/authorize",
    "token_endpoint": "https://github.com/login/oauth/access_token",
    "userinfo_endpoint": "https://api.github.com/user",
    "emails_endpoint": "https://api.github.com/user/emails",  # GitHub-specific
    "scopes": ["read:user", "user:email"],
}
```

---

## 4. Data Model

### 4.1 SSOProvider Model (DataFlow)

```python
# src/arc/models/sso.py
from dataflow import DataFlow
from typing import Optional
from datetime import datetime

db = DataFlow(...)

@db.model
class SSOProvider:
    """OAuth provider configuration per tenant."""
    id: str                          # UUID
    tenant_id: str                   # Which tenant this config belongs to
    provider_type: str               # "azure", "google", "github"
    display_name: str                # "Company Azure AD"
    client_id: str                   # OAuth client ID
    client_secret_encrypted: str     # Encrypted client secret

    # Provider-specific settings
    azure_tenant_id: Optional[str]   # For Azure: tenant GUID or "common"
    google_domain: Optional[str]     # For Google: restrict to domain

    # Behavioral settings
    is_enabled: bool = True
    auto_provision: bool = True      # Create user on first login
    default_role: str = "viewer"     # Role for auto-provisioned users

    # Metadata
    created_at: Optional[str]
    updated_at: Optional[str]

    __dataflow__ = {
        "indexes": [
            {"fields": ["tenant_id", "provider_type"], "unique": True}
        ]
    }

@db.model
class LinkedAccount:
    """Links ARC user to external OAuth identity."""
    id: str
    user_id: str                     # FK to User
    provider_type: str               # "azure", "google", "github"
    provider_user_id: str            # External user ID (sub claim)
    provider_email: str              # Email from provider
    provider_name: Optional[str]     # Display name from provider

    # Metadata
    linked_at: str
    last_login_at: Optional[str]

    __dataflow__ = {
        "indexes": [
            {"fields": ["user_id", "provider_type"], "unique": True},
            {"fields": ["provider_type", "provider_user_id"], "unique": True}
        ]
    }
```

### 4.2 Existing User Model Extension

The existing `User` model already has SSO-ready fields:

```python
@db.model
class User:
    id: str
    email: str
    name: str
    auth_provider: Optional[str]        # "local", "azure", "google", "github"
    auth_provider_id: Optional[str]     # External ID for SSO users
    # ... other fields
```

---

## 5. Token Lifecycle

### 5.1 Token Types

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token** (ARC) | 15 min | Memory (Zustand) | API authentication |
| **Refresh Token** (ARC) | 7 days | httpOnly cookie | Token renewal |
| **ID Token** (IdP) | N/A | Not stored | User identity verification |

### 5.2 Token Refresh Flow

```
┌──────────┐          ┌──────────────┐          ┌─────────────┐
│ Frontend │          │   Backend    │          │   IdP       │
└────┬─────┘          └──────┬───────┘          └──────┬──────┘
     │                       │                         │
     │  1. API call fails    │                         │
     │     (401 expired)     │                         │
     │                       │                         │
     │  2. POST /auth/refresh│                         │
     │     (refresh cookie)  │                         │
     │──────────────────────▶│                         │
     │                       │                         │
     │                       │  3. Validate refresh    │
     │                       │     token, check user   │
     │                       │     still exists        │
     │                       │                         │
     │  4. New access token  │                         │
     │◀──────────────────────│                         │
     │                       │                         │
     │  5. Retry original    │                         │
     │     API call          │                         │
     │──────────────────────▶│                         │
```

---

## 6. Account Linking Strategy

### 6.1 Scenarios

| Scenario | Behavior |
|----------|----------|
| **New user, SSO first login** | Auto-provision user, link account |
| **Existing user, SSO login** | Match by email, prompt to link |
| **Linked user, SSO login** | Direct login via linked account |
| **User adds SSO in settings** | Create LinkedAccount record |
| **User removes SSO in settings** | Delete LinkedAccount, keep user |

### 6.2 Email Matching

```python
async def handle_sso_callback(provider: str, user_info: dict) -> User:
    """Handle SSO callback and return/create user."""

    # 1. Check for existing linked account
    linked = await db.express.read("LinkedAccount", filter={
        "provider_type": provider,
        "provider_user_id": user_info["sub"]
    })

    if linked:
        # User already linked, update last login
        await db.express.update("LinkedAccount", linked["id"], {
            "last_login_at": datetime.utcnow().isoformat()
        })
        return await db.express.read("User", linked["user_id"])

    # 2. Check for existing user by email
    email = user_info.get("email")
    if email:
        existing_user = await db.express.list("User", filter={"email": email})
        if existing_user:
            # Prompt to link (return flag, frontend handles)
            return {"action": "link_required", "user_id": existing_user[0]["id"]}

    # 3. Auto-provision new user
    sso_config = await get_sso_config(provider)
    if not sso_config.auto_provision:
        raise HTTPException(403, "User provisioning disabled")

    new_user = await db.express.create("User", {
        "id": str(uuid4()),
        "email": email,
        "name": user_info.get("name", email),
        "auth_provider": provider,
        "auth_provider_id": user_info["sub"],
        "role": sso_config.default_role,
        "tenant_id": sso_config.tenant_id
    })

    # Create linked account
    await db.express.create("LinkedAccount", {
        "id": str(uuid4()),
        "user_id": new_user["id"],
        "provider_type": provider,
        "provider_user_id": user_info["sub"],
        "provider_email": email,
        "provider_name": user_info.get("name"),
        "linked_at": datetime.utcnow().isoformat()
    })

    return new_user
```

---

## 7. API Design

### 7.1 OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/oauth/{provider}` | Start OAuth flow, return redirect URL |
| `POST` | `/auth/oauth/{provider}/callback` | Exchange code for tokens |
| `GET` | `/auth/oauth/providers` | List enabled providers for tenant |
| `POST` | `/auth/link/{provider}` | Link existing account to SSO (authenticated) |
| `DELETE` | `/auth/link/{provider}` | Unlink SSO from account (authenticated) |

### 7.2 Endpoint Schemas

```python
# Request to start OAuth
class OAuthStartRequest:
    return_url: Optional[str]  # Where to redirect after login

# Response with auth URL
class OAuthStartResponse:
    auth_url: str              # Redirect user here
    state: str                 # For CSRF validation

# Callback request
class OAuthCallbackRequest:
    code: str                  # Authorization code
    state: str                 # CSRF validation
    code_verifier: str         # PKCE verifier

# Callback response
class OAuthCallbackResponse:
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse
    # refresh_token sent in httpOnly cookie
```

---

## 8. Environment Configuration

### 8.1 Required Variables

```bash
# .env

# Azure AD
SSO_AZURE_CLIENT_ID=your-azure-app-client-id
SSO_AZURE_CLIENT_SECRET=your-azure-client-secret
SSO_AZURE_TENANT_ID=common  # "common" for multi-tenant

# Google
SSO_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SSO_GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub
SSO_GITHUB_CLIENT_ID=your-github-oauth-app-id
SSO_GITHUB_CLIENT_SECRET=your-github-oauth-secret

# General
SSO_REDIRECT_BASE_URL=https://app.arc-invest.com
SSO_SECRET_ENCRYPTION_KEY=32-byte-base64-key  # For encrypting client secrets
```

### 8.2 Per-Tenant Configuration

Tenant-specific SSO settings are stored in the `SSOProvider` model, allowing:
- Different Azure tenants per customer
- Domain restrictions for Google
- Feature flags per provider

---

## 9. Implementation Checklist

### Phase 1: Backend Foundation

- [ ] **SSO-001**: Create `SSOProvider` and `LinkedAccount` models
- [ ] **SSO-002**: Implement OAuth service with PKCE support
- [ ] **SSO-003**: Create `/auth/oauth/{provider}` start endpoint
- [ ] **SSO-004**: Create `/auth/oauth/{provider}/callback` endpoint
- [ ] **SSO-005**: Implement token exchange and validation
- [ ] **SSO-006**: Add account linking logic

### Phase 2: Frontend Integration

- [ ] **SSO-007**: Create login page with SSO buttons
- [ ] **SSO-008**: Implement OAuth callback handler page
- [ ] **SSO-009**: Handle link-required flow (prompt modal)
- [ ] **SSO-010**: Update auth store for SSO tokens
- [ ] **SSO-011**: Add refresh token handling

### Phase 3: Account Management

- [ ] **SSO-012**: Create Linked Accounts Manager component
- [ ] **SSO-013**: Add link/unlink functionality in settings
- [ ] **SSO-014**: Show linked providers on profile page
- [ ] **SSO-015**: Admin: manage tenant SSO configurations

### Phase 4: Azure Multi-Tenant

- [ ] **SSO-016**: Test with "common" tenant ID
- [ ] **SSO-017**: Document Azure app registration steps
- [ ] **SSO-018**: Add tenant-specific configuration UI
- [ ] **SSO-019**: Implement domain hint for known tenants

---

## 10. Acceptance Criteria

### Functional Requirements

- [ ] Users can sign in via Azure AD, Google, or GitHub
- [ ] Azure AD works with multi-tenant configuration
- [ ] New users are auto-provisioned on first SSO login
- [ ] Existing users can link SSO to their account
- [ ] Users can unlink SSO from settings
- [ ] Token refresh works transparently

### Security Requirements

- [ ] PKCE enforced for all OAuth flows
- [ ] State parameter validated on callback
- [ ] ID tokens validated (signature, claims)
- [ ] Client secrets encrypted at rest
- [ ] Refresh tokens in httpOnly cookies
- [ ] HTTPS required in production

### Integration Requirements

- [ ] Works with existing RBAC system
- [ ] Respects tenant isolation (DataFlow multi-tenancy)
- [ ] Audit logs capture SSO events
- [ ] Admin can enable/disable providers per tenant
