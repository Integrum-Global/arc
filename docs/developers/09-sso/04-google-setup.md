# Google Workspace OAuth Setup Guide

## Overview

This guide walks through setting up Google Workspace OAuth integration for the ARC investment platform. Google Workspace OAuth allows users to sign in using their corporate Google accounts while providing domain-level access controls through the `hd` (hosted domain) parameter.

## Prerequisites

- Google Workspace admin account (or Google Cloud Console access)
- Domain ownership verification in Google Workspace
- ARC backend deployed and accessible
- Access to Google Cloud Console: https://console.cloud.google.com

## What is the `hd` Parameter?

Google's `hd` (hosted domain) parameter restricts authentication to specific Google Workspace domains:

| Configuration | Behavior | Use Case |
|---------------|----------|----------|
| **No `hd` parameter** | Any Google account (personal or workspace) | Public SaaS with Google login |
| **`hd=example.com`** | Only `@example.com` Workspace accounts | Single organization |
| **`hd=*`** | Any Workspace account (no personal) | Multi-tenant SaaS requiring corporate accounts |

For ARC, we use **`hd=*`** to support any Google Workspace organization while blocking personal Gmail accounts.

## Step 1: Create Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)

2. Click **Select a project** → **New Project**

3. Fill in the project details:
   ```
   Project name: ARC Investment Platform
   Organization: [Your organization]
   Location: [Your organization]
   ```

4. Click **Create**

5. Wait for project creation (takes ~30 seconds)

6. **Select your new project** from the project dropdown

## Step 2: Enable Google+ API

Google OAuth requires the Google+ API for profile information:

1. Go to **APIs & Services** → **Library**

2. Search for **"Google+ API"**

3. Click **Google+ API** → **Enable**

4. Wait for activation (takes ~10 seconds)

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**

2. Select **External** user type:
   ```
   External: Available to any Google account
   Internal: Only available to users in your Google Workspace
   ```

3. Click **Create**

4. Fill in **App information**:
   ```
   App name: ARC Investment Platform
   User support email: support@your-domain.com
   App logo: [Upload ARC logo - 120x120px PNG]
   ```

5. Fill in **App domain**:
   ```
   Application home page: https://app.arc.example.com
   Application privacy policy: https://app.arc.example.com/privacy
   Application terms of service: https://app.arc.example.com/terms
   ```

6. Fill in **Authorized domains**:
   ```
   arc.example.com
   staging.arc.example.com
   ```

7. Fill in **Developer contact information**:
   ```
   Email addresses: dev@your-domain.com
   ```

8. Click **Save and Continue**

## Step 4: Configure OAuth Scopes

1. Click **Add or Remove Scopes**

2. Add the following scopes:
   ```
   openid                           - Basic OpenID Connect
   profile                          - User's profile information
   email                            - User's email address
   https://www.googleapis.com/auth/userinfo.email   - Email access
   https://www.googleapis.com/auth/userinfo.profile - Profile access
   ```

3. Click **Update** → **Save and Continue**

4. Review summary and click **Back to Dashboard**

## Step 5: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**

2. Click **Create Credentials** → **OAuth client ID**

3. Select application type:
   ```
   Application type: Web application
   Name: ARC Backend
   ```

4. Add **Authorized JavaScript origins** (optional, for direct client-side auth):
   ```
   http://localhost:3000
   https://staging.arc.example.com
   https://app.arc.example.com
   ```

5. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://staging.arc.example.com/auth/callback
   https://app.arc.example.com/auth/callback
   ```

6. Click **Create**

7. **SAVE THE CREDENTIALS** (you'll need them for configuration):
   - **Client ID** - This is your `SSO_GOOGLE_CLIENT_ID`
   - **Client Secret** - This is your `SSO_GOOGLE_CLIENT_SECRET`

8. Click **OK**

## Step 6: Configure Domain Restrictions

To restrict sign-ins to Google Workspace accounts (blocking personal Gmail):

1. The `hd` parameter is configured in the OAuth authorization URL

2. Options:
   ```python
   # Option 1: No restriction (allows personal Gmail)
   hd = None

   # Option 2: Single domain (only @example.com)
   hd = "example.com"

   # Option 3: Any Workspace domain (no personal Gmail)
   hd = "*"
   ```

3. For ARC, we recommend **`hd="*"`** to support multiple organizations

4. The backend validates the `hd` claim in the ID token:
   ```python
   # In OAuth callback
   id_token_claims = jwt.decode(id_token, options={"verify_signature": False})
   hosted_domain = id_token_claims.get("hd")

   if not hosted_domain:
       raise ValueError("Personal Gmail accounts not allowed")
   ```

## Step 7: Configure ARC Backend

Add the Google credentials to your `.env` file:

```bash
# Google Workspace OAuth Configuration
SSO_GOOGLE_CLIENT_ID=123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
SSO_GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-value-here
SSO_GOOGLE_HD_PARAMETER=*

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

## Step 8: Configure SSO Provider in Database

Use the ARC API or database console to create an `SSOProvider` record:

```python
from arc.models.database import db
from arc.services.sso import sso_service
from uuid import uuid4

# Encrypt the client secret
encrypted_secret = sso_service._encrypt_secret(
    "GOCSPX-your-google-client-secret-here"
)

# Create SSO provider configuration
await db.express.create("SSOProvider", {
    "id": str(uuid4()),
    "tenant_id": "default",  # Your ARC tenant ID
    "provider_type": "google",
    "display_name": "Google Workspace",
    "client_id": "123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com",
    "client_secret_encrypted": encrypted_secret,
    "google_hd": "*",  # Any Workspace domain
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
    google_hd,
    is_enabled,
    auto_provision,
    default_role
) VALUES (
    gen_random_uuid(),
    'default',
    'google',
    'Google Workspace',
    '123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com',
    'encrypted-secret-here',
    '*',
    true,
    true,
    'viewer'
);
```

## Step 9: Test Google Workspace Sign-In

1. Navigate to `http://localhost:3000/login`

2. Click **Sign in with Google**

3. You should be redirected to Google's OAuth consent screen

4. Sign in with a Google Workspace account (e.g., `alice@company.com`)

5. Review permissions and click **Allow**

6. After authentication, you should be redirected back to ARC dashboard

7. Verify user was created in database:
   ```python
   users = await db.express.list("User", filter={"auth_provider": "google"})
   print(users)
   # Output: [{'id': '...', 'email': 'alice@company.com', ...}]
   ```

## Step 10: Test Domain Restriction

Verify that personal Gmail accounts are blocked:

1. Try signing in with a personal Gmail account (e.g., `user@gmail.com`)

2. You should see an error after Google authentication:
   ```
   Error: Personal Gmail accounts not allowed. Please use your company Google Workspace account.
   ```

3. The ID token will NOT contain an `hd` claim for personal accounts

4. Verify the backend validation logic:
   ```python
   # In sso.py callback handler
   id_token_claims = jwt.decode(id_token, options={"verify_signature": False})
   hosted_domain = id_token_claims.get("hd")

   if sso_config.get("google_hd") == "*" and not hosted_domain:
       raise ValueError("Personal Gmail accounts not allowed")
   ```

## Step 11: Test Account Linking

Test the account linking flow for users with existing accounts:

1. Create a user manually:
   ```python
   await db.express.create("User", {
       "id": str(uuid4()),
       "tenant_id": "default",
       "email": "alice@company.com",
       "name": "Alice",
       "password_hash": "hashed-password",
       "role": "admin"
   })
   ```

2. Have Alice sign in with Google Workspace using the same email

3. She should see the **Link Account** modal

4. After linking, verify `LinkedAccount` was created:
   ```python
   links = await db.express.list("LinkedAccount", filter={
       "provider_type": "google",
       "provider_email": "alice@company.com"
   })
   print(links)
   ```

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI not configured in Google Cloud Console

**Fix**: Add the exact redirect URI to **Credentials** → **OAuth 2.0 Client IDs** → **Authorized redirect URIs**

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured or missing required scopes

**Fix**:
1. Go to **OAuth consent screen**
2. Verify app name, support email, and developer contact are filled
3. Add required scopes: `openid`, `profile`, `email`

### Error: "Personal Gmail accounts not allowed"

**Cause**: User tried to sign in with personal Gmail account when `hd="*"` is configured

**Fix**: This is expected behavior. User must sign in with Google Workspace account.

### Error: "Invalid hosted domain: example.com"

**Cause**: User's Workspace domain doesn't match configured `google_hd`

**Fix**: Either:
1. Update `google_hd` to `"*"` to allow any Workspace domain, OR
2. Add user's domain to allowed list

### Error: "Token exchange failed: invalid_client"

**Cause**: Incorrect client ID or client secret

**Fix**:
- Verify `SSO_GOOGLE_CLIENT_ID` matches Google Cloud Console
- Verify `SSO_GOOGLE_CLIENT_SECRET` is correct
- Check if client secret was regenerated in Google Cloud Console

### Error: "idpiframe_initialization_failed"

**Cause**: Third-party cookies blocked in browser

**Fix**: This is a non-critical warning. OAuth will still work, but "One Tap" sign-in may not work.

## Security Considerations

### 1. Client Secret Rotation

Google client secrets don't expire, but should be rotated regularly:

1. Go to **Credentials** → **OAuth 2.0 Client IDs**
2. Click your client ID
3. Click **Reset Secret** (keep old one active for now)
4. Update ARC configuration with new secret
5. Test thoroughly
6. Old secret is automatically invalidated after reset

### 2. Domain Allowlisting

To restrict sign-ins to specific Workspace domains:

```python
@db.model
class SSOProvider:
    # ... existing fields ...
    google_hd: str | None = None  # "*", "example.com", or None
    allowed_domains: list[str] | None = None  # Additional validation

# In sso.py service:
id_token_claims = jwt.decode(id_token, options={"verify_signature": False})
hosted_domain = id_token_claims.get("hd")

# Validate against allowed domains
if sso_config.get("allowed_domains"):
    if hosted_domain not in sso_config["allowed_domains"]:
        raise ValueError(f"Domain {hosted_domain} not allowed")
```

### 3. OAuth Consent Screen Review

For production apps with many users, submit for Google verification:

1. Go to **OAuth consent screen**
2. Click **Prepare for verification**
3. Complete verification form
4. Submit for review (takes 2-7 days)
5. Benefits:
   - Remove "unverified app" warning
   - Increase user trust
   - Access to sensitive/restricted scopes

### 4. Admin Control via Google Workspace

Google Workspace admins can control OAuth app access:

1. **Block third-party apps**:
   - Go to Google Admin Console → **Security** → **API controls**
   - Disable **Allow users to access third-party apps**

2. **Allowlist specific apps**:
   - Add your ARC app client ID to allowlist
   - Users can only sign in to approved apps

3. **Monitor sign-ins**:
   - Go to **Reporting** → **Audit and investigation**
   - Filter by **OAuth2 apps**

## Testing with Multiple Domains

### Option 1: Multiple Google Workspace Accounts

1. Sign in with different Workspace accounts:
   ```
   alice@company-a.com
   bob@company-b.com
   charlie@company-c.com
   ```

2. Verify each user gets provisioned in ARC

3. Check that `hd` claim is validated correctly

### Option 2: Partner Organizations

1. Share your app's sign-in URL with partners
2. Have users from partner Workspace organizations test
3. Monitor user provisioning and linked accounts

### Option 3: Google OAuth Playground (Testing Only)

For token inspection without sign-in:

1. Go to https://developers.google.com/oauthplayground
2. Select **Google OAuth2 API v2**
3. Select scopes: `openid`, `profile`, `email`
4. Click **Authorize APIs**
5. Exchange authorization code for tokens
6. Inspect ID token claims (including `hd`)

## Production Checklist

Before deploying to production:

- [ ] OAuth consent screen fully configured (name, logo, domains)
- [ ] All required scopes added (`openid`, `profile`, `email`)
- [ ] Redirect URIs configured for all environments
- [ ] `SSO_SECRET_ENCRYPTION_KEY` is 32-byte Fernet key
- [ ] Client secret encrypted in database
- [ ] `google_hd` parameter configured correctly (`"*"` for multi-tenant)
- [ ] Domain validation logic tested (block personal Gmail)
- [ ] `auto_provision` set according to business requirements
- [ ] `default_role` set to appropriate value (usually "viewer")
- [ ] OAuth consent screen submitted for verification (if required)
- [ ] Google Workspace admin allowlist configured (if applicable)
- [ ] Monitor sign-in errors in Google Cloud Console logs
- [ ] Test account linking flow with existing users
- [ ] Verify unlink flow works (users keep password auth)
- [ ] Document allowed domains policy

## Monitoring and Maintenance

### Google Cloud Console Logs

Monitor authentication issues in Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Click **OAuth 2.0 Client IDs** → Select your client
3. Review **Metrics** tab for usage statistics
4. Go to **Logs Explorer** for detailed error logs:
   ```
   resource.type="oauth_client"
   resource.labels.client_id="your-client-id"
   severity >= WARNING
   ```

### ARC Audit Logs

Monitor SSO events in ARC:

```python
from arc.models.database import db

# List recent Google Workspace logins
recent_logins = await db.express.list("AuditLog", filter={
    "event_type": "sso_login",
    "metadata.provider": "google",
    "created_at": {"$gte": "2024-01-01T00:00:00Z"}
}, limit=100, order_by=["-created_at"])

# Count logins by domain
from collections import Counter
domains = [log["metadata"]["email"].split("@")[1] for log in recent_logins]
print(Counter(domains))
# Output: {'company-a.com': 25, 'company-b.com': 18, 'company-c.com': 12}
```

### Track Domain Usage

Monitor which Workspace domains are using ARC:

```python
# Get unique Workspace domains
users = await db.express.list("User", filter={"auth_provider": "google"})
domains = set(user["email"].split("@")[1] for user in users)
print(f"Active Workspace domains: {domains}")
# Output: {'company-a.com', 'company-b.com', 'company-c.com'}

# Count users per domain
from collections import Counter
domain_counts = Counter(user["email"].split("@")[1] for user in users)
print(domain_counts)
# Output: {'company-a.com': 42, 'company-b.com': 28, 'company-c.com': 15}
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OpenID Connect with Google](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google+ API Reference](https://developers.google.com/+/web/api/rest)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
- [Google Workspace Admin SDK](https://developers.google.com/admin-sdk)
- [Hosted Domain Parameter (`hd`)](https://developers.google.com/identity/protocols/oauth2/openid-connect#hd-param)

## Summary

You've successfully configured Google Workspace OAuth for ARC:

1. ✅ Created Google Cloud project and enabled Google+ API
2. ✅ Configured OAuth consent screen with app information
3. ✅ Created OAuth 2.0 credentials with redirect URIs
4. ✅ Configured domain restrictions with `hd` parameter
5. ✅ Set up ARC backend with encrypted credentials
6. ✅ Tested Workspace authentication and domain validation
7. ✅ Verified account linking and provisioning
8. ✅ Implemented security best practices

Users from any Google Workspace organization can now sign in to ARC using their corporate Google accounts, while personal Gmail accounts are blocked!
