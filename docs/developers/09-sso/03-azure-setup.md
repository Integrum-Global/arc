# Azure AD Multi-Tenant Setup Guide

## Overview

This guide walks through setting up Azure Active Directory (Azure AD) OAuth integration with multi-tenant support for the ARC investment platform. Multi-tenant support allows a single Azure AD application registration to authenticate users from any Azure AD tenant, making it ideal for SaaS applications.

## Prerequisites

- Azure account with permissions to register applications
- Azure AD tenant (or access to test with multiple tenants)
- ARC backend deployed and accessible
- Access to Azure Portal: https://portal.azure.com

## What is Multi-Tenant?

Azure AD supports three tenant types:

| Type | Tenant ID | Use Case |
|------|-----------|----------|
| **Single-tenant** | Specific GUID | Internal apps for one organization |
| **Multi-tenant** | `common` | SaaS apps serving multiple organizations |
| **Multi-tenant + Personal** | `common` | SaaS apps allowing Microsoft personal accounts |

For ARC, we use **multi-tenant** mode with `tenant_id="common"` to support any Azure AD organization.

## Step 1: Register Azure AD Application

1. Navigate to [Azure Portal](https://portal.azure.com)

2. Go to **Azure Active Directory** → **App registrations** → **New registration**

3. Fill in the application details:
   ```
   Name: ARC Investment Platform
   Supported account types: Accounts in any organizational directory (Any Azure AD directory - Multitenant)
   Redirect URI: Web → http://localhost:3000/auth/callback (for development)
   ```

4. Click **Register**

5. **Save the following values** (you'll need them for configuration):
   - **Application (client) ID** - This is your `SSO_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** - Your home tenant (NOT used in multi-tenant, but useful for testing)

## Step 2: Create Client Secret

1. In your app registration, go to **Certificates & secrets**

2. Click **New client secret**

3. Fill in the details:
   ```
   Description: ARC Backend Secret
   Expires: 24 months (recommended for production)
   ```

4. Click **Add**

5. **IMMEDIATELY COPY THE SECRET VALUE** - This is your `SSO_AZURE_CLIENT_SECRET`
   - ⚠️ **WARNING**: You can only see the secret once. If you lose it, you must create a new one.

## Step 3: Configure API Permissions

1. Go to **API permissions** → **Add a permission**

2. Select **Microsoft Graph** → **Delegated permissions**

3. Add the following permissions:
   ```
   openid         - Basic OpenID Connect
   profile        - User's profile information
   email          - User's email address
   User.Read      - Read user's basic profile (name, email, photo)
   ```

4. Click **Add permissions**

5. **Admin Consent** (if required by your organization):
   - Click **Grant admin consent for [Your Org]**
   - This allows all users in your tenant to use the app without individual consent

## Step 4: Configure Redirect URIs

1. Go to **Authentication** → **Platform configurations** → **Add a platform** → **Web**

2. Add all environments:
   ```
   Development: http://localhost:3000/auth/callback
   Staging:     https://staging.arc.example.com/auth/callback
   Production:  https://app.arc.example.com/auth/callback
   ```

3. Under **Implicit grant and hybrid flows**, leave all unchecked (we use Authorization Code Flow with PKCE)

4. Click **Configure**

## Step 5: Enable Multi-Tenant Support

1. Go to **Authentication** → **Supported account types**

2. Verify **Accounts in any organizational directory (Any Azure AD directory - Multitenant)** is selected

3. Under **Advanced settings**, ensure:
   ```
   Allow public client flows: No
   ```

4. Click **Save**

## Step 6: Configure ARC Backend

Add the Azure credentials to your `.env` file:

```bash
# Azure AD OAuth Configuration
SSO_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
SSO_AZURE_CLIENT_SECRET=your-secret-value-here
SSO_AZURE_DEFAULT_TENANT_ID=common

# Encryption key for storing client secrets (32-byte Fernet key)
SSO_SECRET_ENCRYPTION_KEY=your-fernet-key-here

# Redirect base URL (where your frontend is hosted)
SSO_REDIRECT_BASE_URL=http://localhost:3000
```

### Generate Fernet Encryption Key

The `SSO_SECRET_ENCRYPTION_KEY` is used to encrypt OAuth client secrets at rest in the database:

```python
from cryptography.fernet import Fernet

# Generate a new Fernet key
key = Fernet.generate_key()
print(key.decode())
# Example output: dGVzdF9rZXlfZm9yX2VuY3J5cHRpb25fMzJfYnl0ZXM=
```

Add this key to your `.env` file.

## Step 7: Configure SSO Provider in Database

Use the ARC API or database console to create an `SSOProvider` record:

```python
from arc.models.database import db
from arc.services.sso import sso_service
from uuid import uuid4

# Encrypt the client secret
encrypted_secret = sso_service._encrypt_secret(
    "your-azure-client-secret-here"
)

# Create SSO provider configuration
await db.express.create("SSOProvider", {
    "id": str(uuid4()),
    "tenant_id": "default",  # Your ARC tenant ID
    "provider_type": "azure",
    "display_name": "Company Azure AD",
    "client_id": "12345678-1234-1234-1234-123456789abc",
    "client_secret_encrypted": encrypted_secret,
    "azure_tenant_id": "common",  # Multi-tenant support!
    "is_enabled": True,
    "auto_provision": True,
    "default_role": "viewer"
})
```

Or via SQL:

```sql
INSERT INTO sso_providers (
    id,
    tenant_id,
    provider_type,
    display_name,
    client_id,
    client_secret_encrypted,
    azure_tenant_id,
    is_enabled,
    auto_provision,
    default_role
) VALUES (
    gen_random_uuid(),
    'default',
    'azure',
    'Company Azure AD',
    '12345678-1234-1234-1234-123456789abc',
    'encrypted-secret-here',
    'common',
    true,
    true,
    'viewer'
);
```

## Step 8: Test Single-Tenant Authentication

Before testing multi-tenant, verify single-tenant works with your home tenant:

1. Update the SSO provider to use your specific tenant ID:
   ```python
   await db.express.update("SSOProvider", provider_id, {
       "azure_tenant_id": "your-tenant-guid-here"
   })
   ```

2. Navigate to `http://localhost:3000/login`

3. Click **Sign in with Azure AD**

4. You should be redirected to Azure login

5. After authentication, you should be redirected back to ARC dashboard

6. Verify user was created in database:
   ```python
   users = await db.express.list("User", filter={"auth_provider": "azure"})
   print(users)
   ```

## Step 9: Enable Multi-Tenant

Once single-tenant works, enable multi-tenant mode:

1. Update the SSO provider to use "common":
   ```python
   await db.express.update("SSOProvider", provider_id, {
       "azure_tenant_id": "common"
   })
   ```

2. Test with users from different Azure AD tenants:
   - Ask users from partner organizations to sign in
   - Each user will see their own organization's Azure AD login
   - Users authenticate against their home tenant
   - ARC provisions accounts automatically (if `auto_provision=True`)

## Step 10: Test Account Linking

Test the account linking flow for users with existing accounts:

1. Create a user manually:
   ```python
   await db.express.create("User", {
       "id": str(uuid4()),
       "tenant_id": "default",
       "email": "alice@example.com",
       "name": "Alice",
       "password_hash": "hashed-password",
       "role": "admin"
   })
   ```

2. Have Alice sign in with Azure AD using the same email

3. She should see the **Link Account** modal

4. After linking, verify `LinkedAccount` was created:
   ```python
   links = await db.express.list("LinkedAccount", filter={
       "provider_type": "azure",
       "provider_email": "alice@example.com"
   })
   print(links)
   ```

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"

**Cause**: Redirect URI not configured in Azure Portal

**Fix**: Add the exact redirect URI to **Authentication** → **Redirect URIs** in Azure Portal

### Error: "AADSTS90012: The request must be submitted to the tenant 'common'"

**Cause**: Using wrong authorization endpoint

**Fix**: Verify `azure_tenant_id="common"` in SSO provider configuration

### Error: "User provisioning disabled for this tenant"

**Cause**: `auto_provision=False` and user doesn't exist

**Fix**: Either:
1. Set `auto_provision=True` in SSO provider config, OR
2. Pre-create users manually before they sign in

### Error: "Invalid state parameter"

**Cause**: State mismatch between start and callback (CSRF protection)

**Fix**:
- Clear browser sessionStorage
- Check that `oauth_state` is being stored in sessionStorage
- Verify `secrets.compare_digest()` is being used for comparison

### Error: "Token exchange failed: invalid_client"

**Cause**: Incorrect client ID or client secret

**Fix**:
- Verify `SSO_AZURE_CLIENT_ID` matches Azure Portal
- Verify `SSO_AZURE_CLIENT_SECRET` is correct
- Check if client secret has expired in Azure Portal

## Security Considerations

### 1. Client Secret Rotation

Azure client secrets expire. Set up rotation:

1. Create a new client secret in Azure Portal (keep old one active)
2. Update ARC configuration with new secret
3. Test thoroughly
4. Delete old secret from Azure Portal

### 2. Admin Consent

For some organizations, admin consent is required before users can sign in:

1. Go to **API permissions** in Azure Portal
2. Click **Grant admin consent for [Your Org]**
3. Share consent URL with partner organizations:
   ```
   https://login.microsoftonline.com/{tenant}/adminconsent?client_id={client_id}
   ```

### 3. Tenant Restrictions

To limit which tenants can sign in, implement tenant allowlist:

```python
@db.model
class SSOProvider:
    # ... existing fields ...
    allowed_tenant_ids: list[str] | None = None  # None = allow all

# In sso.py service:
if sso_config.get("allowed_tenant_ids"):
    # Verify tenant during callback
    id_token_claims = jwt.decode(id_token, options={"verify_signature": False})
    tenant_id = id_token_claims.get("tid")
    if tenant_id not in sso_config["allowed_tenant_ids"]:
        raise ValueError("Tenant not allowed")
```

### 4. Conditional Access

Leverage Azure AD Conditional Access policies:

- Require MFA for external users
- Restrict access by IP address
- Require compliant devices
- Block risky sign-ins

Configure in Azure Portal: **Azure AD** → **Security** → **Conditional Access**

## Testing with Multiple Tenants

### Option 1: Azure AD B2C Trial Tenants

1. Go to https://azure.microsoft.com/free/
2. Create a free Azure account
3. Create a new Azure AD tenant
4. Invite test users
5. Test sign-in from different tenant

### Option 2: Partner Organizations

1. Share your app's sign-in URL with partners
2. Have users from partner organizations test
3. Monitor user provisioning and linked accounts

### Option 3: Azure AD Emulator (Development Only)

For local development without Azure AD:

1. Use mock OAuth provider:
   ```python
   # .env.development
   SSO_AZURE_MOCK_MODE=true
   ```

2. Implement mock OAuth flow in `sso.py`:
   ```python
   if os.getenv("SSO_AZURE_MOCK_MODE") == "true":
       # Return mock user info
       return {
           "sub": "mock-user-123",
           "email": "test@example.com",
           "name": "Test User"
       }
   ```

## Production Checklist

Before deploying to production:

- [ ] Client secret expiration set to 24 months
- [ ] Redirect URIs configured for all environments
- [ ] `SSO_SECRET_ENCRYPTION_KEY` is 32-byte Fernet key
- [ ] Client secret encrypted in database
- [ ] `auto_provision` set according to business requirements
- [ ] `default_role` set to appropriate value (usually "viewer")
- [ ] Admin consent granted (if required)
- [ ] Conditional Access policies configured
- [ ] Monitor Azure AD sign-in logs regularly
- [ ] Set up client secret expiration alerts
- [ ] Document tenant allowlist/blocklist policy
- [ ] Test account linking flow with existing users
- [ ] Verify unlink flow works (users keep password auth)

## Monitoring and Maintenance

### Azure AD Sign-in Logs

Monitor authentication issues in Azure Portal:

1. Go to **Azure Active Directory** → **Sign-in logs**
2. Filter by **Application: ARC Investment Platform**
3. Review failed sign-ins and error codes
4. Set up alerts for authentication failures

### ARC Audit Logs

Monitor SSO events in ARC:

```python
from arc.models.database import db

# List recent SSO logins
recent_logins = await db.express.list("AuditLog", filter={
    "event_type": "sso_login",
    "created_at": {"$gte": "2024-01-01T00:00:00Z"}
}, limit=100, order_by=["-created_at"])

# Count logins by provider
from collections import Counter
providers = [log["metadata"]["provider"] for log in recent_logins]
print(Counter(providers))
# Output: {'azure': 42, 'google': 18, 'github': 5}
```

## Additional Resources

- [Azure AD Multi-tenant Apps Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant)
- [Microsoft Graph API Reference](https://learn.microsoft.com/en-us/graph/api/overview)
- [OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [Azure AD Error Codes](https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)

## Summary

You've successfully configured Azure AD multi-tenant OAuth for ARC:

1. ✅ Registered Azure AD application with multi-tenant support
2. ✅ Created client secret and configured permissions
3. ✅ Configured redirect URIs for all environments
4. ✅ Set up ARC backend with encrypted credentials
5. ✅ Tested single-tenant and multi-tenant authentication
6. ✅ Verified account linking and provisioning
7. ✅ Implemented security best practices

Users from any Azure AD organization can now sign in to ARC using their existing corporate credentials!
