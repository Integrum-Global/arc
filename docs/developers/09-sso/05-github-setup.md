# GitHub OAuth Setup Guide

## Overview

This guide walks through setting up GitHub OAuth integration for the ARC investment platform. GitHub OAuth is ideal for developer teams, open-source projects, and organizations already using GitHub for version control and collaboration. Unlike Azure AD and Google, GitHub OAuth does not support multi-tenancy but offers excellent integration with GitHub organizations and teams.

## Prerequisites

- GitHub account (personal or organization)
- Permissions to create OAuth Apps in your GitHub account/organization
- ARC backend deployed and accessible
- Access to GitHub Developer Settings: https://github.com/settings/developers

## GitHub OAuth Features

| Feature | Support | Notes |
|---------|---------|-------|
| **Multi-tenant** | ❌ No | One OAuth App per GitHub account/org |
| **Email verification** | ✅ Yes | Returns only verified emails |
| **Primary email** | ✅ Yes | API returns primary verified email |
| **Organization access** | ✅ Yes | Can restrict by organization membership |
| **Team access** | ✅ Yes | Can read team memberships with additional scopes |
| **Repository access** | ✅ Yes | Can request repo scopes (not recommended for SSO) |

## Step 1: Register GitHub OAuth App

1. Navigate to [GitHub Developer Settings](https://github.com/settings/developers)

2. Click **OAuth Apps** → **New OAuth App**

3. Fill in the application details:
   ```
   Application name: ARC Investment Platform
   Homepage URL: https://app.arc.example.com (or http://localhost:3000 for development)
   Application description: Investment portfolio management and analytics platform
   Authorization callback URL: http://localhost:3000/auth/callback (for development)
   ```

4. Click **Register application**

5. **Save the following values** (you'll need them for configuration):
   - **Client ID** - This is your `SSO_GITHUB_CLIENT_ID`

## Step 2: Generate Client Secret

1. On the OAuth App page, click **Generate a new client secret**

2. **IMMEDIATELY COPY THE SECRET VALUE** - This is your `SSO_GITHUB_CLIENT_SECRET`
   - ⚠️ **WARNING**: You can only see the secret once. If you lose it, you must generate a new one.

3. (Optional) Add a note to identify this secret:
   ```
   Note: ARC Backend Secret - Generated 2024-01-15
   ```

## Step 3: Configure Callback URLs

GitHub OAuth Apps support multiple callback URLs. Add all environments:

1. In your OAuth App settings, update **Authorization callback URL**:
   ```
   Development: http://localhost:3000/auth/callback
   ```

2. For additional environments, you must create separate OAuth Apps:
   ```
   Staging:     Create separate OAuth App for https://staging.arc.example.com
   Production:  Create separate OAuth App for https://app.arc.example.com
   ```

**Note**: Unlike Azure AD and Google, GitHub OAuth Apps only support ONE callback URL per app. For multiple environments, create separate OAuth Apps with different Client IDs and Secrets.

## Step 4: Configure Scopes

GitHub OAuth requires explicit scopes for data access. For ARC SSO, we need:

| Scope | Purpose | Required |
|-------|---------|----------|
| `read:user` | Read basic user profile (name, avatar, bio) | ✅ Yes |
| `user:email` | Read user's verified email addresses | ✅ Yes |

**Optional Scopes** (not needed for basic SSO):
- `read:org` - Read organization membership (for organization restrictions)
- `repo` - Repository access (NOT RECOMMENDED for SSO)
- `admin:org` - Admin organization access (NOT RECOMMENDED)

GitHub automatically requests these scopes during authorization. No additional configuration needed.

## Step 5: GitHub Organization Restrictions (Optional)

If you want to restrict access to users in a specific GitHub organization:

1. Create a GitHub organization if you don't have one:
   - Go to https://github.com/organizations/new
   - Create a free organization

2. Invite users to your organization:
   - Go to **Organization settings** → **People** → **Invite member**
   - Add members who should access ARC

3. In ARC backend, you'll configure organization restrictions in the database (Step 7)

**Note**: Organization restriction requires the `read:org` scope, which must be manually implemented in the SSO service.

## Step 6: Configure ARC Backend

Add the GitHub credentials to your `.env` file:

```bash
# GitHub OAuth Configuration
SSO_GITHUB_CLIENT_ID=Iv1.a629723000000000
SSO_GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

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
    "your-github-client-secret-here"
)

# Create SSO provider configuration
await db.express.create("SSOProvider", {
    "id": str(uuid4()),
    "tenant_id": "default",  # Your ARC tenant ID
    "provider_type": "github",
    "display_name": "GitHub",
    "client_id": "Iv1.a629723000000000",
    "client_secret_encrypted": encrypted_secret,
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
    is_enabled,
    auto_provision,
    default_role
) VALUES (
    gen_random_uuid(),
    'default',
    'github',
    'GitHub',
    'Iv1.a629723000000000',
    'encrypted-secret-here',
    true,
    true,
    'viewer'
);
```

## Step 8: Test GitHub Authentication

1. Navigate to `http://localhost:3000/login`

2. Click **Sign in with GitHub**

3. You should be redirected to GitHub's authorization page:
   - Review the requested permissions (`read:user` and `user:email`)
   - Click **Authorize [Your App Name]**

4. After authorization, you should be redirected back to ARC dashboard

5. Verify user was created in database:
   ```python
   from arc.models.database import db

   users = await db.express.list("User", filter={"auth_provider": "github"})
   print(users)
   # Output: [{'id': '...', 'email': 'user@example.com', 'auth_provider': 'github', ...}]
   ```

## Step 9: Verify Email Handling

GitHub's OAuth flow handles email differently than Azure/Google:

1. **Public Email**: If user's GitHub profile has a public email, it's returned in the user profile
2. **Private Email**: If email is private, ARC fetches it from the `/user/emails` API endpoint
3. **Primary Verified**: ARC selects the primary verified email from the list

Test the flow:

1. Make your GitHub email private:
   - Go to **Settings** → **Emails**
   - Check **Keep my email addresses private**

2. Sign in to ARC with GitHub

3. ARC should still successfully fetch your primary verified email:
   ```python
   # In sso.py service (lines 527-541):
   if provider == "github" and not user_info.get("email"):
       emails_response = await client.get(
           "https://api.github.com/user/emails",
           headers=headers,
       )
       emails = emails_response.json()
       # Find primary verified email
       primary = next(
           (e for e in emails if e.get("primary") and e.get("verified")),
           None,
       )
       if primary:
           user_info["email"] = primary["email"]
   ```

## Step 10: Test Account Linking

Test the account linking flow for users with existing accounts:

1. Create a user manually:
   ```python
   from arc.models.database import db
   from uuid import uuid4
   import bcrypt

   password_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()

   await db.express.create("User", {
       "id": str(uuid4()),
       "tenant_id": "default",
       "email": "developer@example.com",
       "name": "Developer",
       "password_hash": password_hash,
       "role": "admin"
   })
   ```

2. Have the user sign in with GitHub using the same email

3. They should see the **Link Account** modal

4. After linking, verify `LinkedAccount` was created:
   ```python
   links = await db.express.list("LinkedAccount", filter={
       "provider_type": "github",
       "provider_email": "developer@example.com"
   })
   print(links)
   # Output: [{'user_id': '...', 'provider_type': 'github', 'provider_user_id': '123456', ...}]
   ```

## Step 11: Test Account Unlinking

Users should be able to unlink their GitHub account while keeping password authentication:

1. In ARC frontend, go to **Settings** → **Connected Accounts**

2. Click **Unlink** next to GitHub

3. Frontend calls `DELETE /auth/sso/{provider}/link`

4. Verify the `LinkedAccount` record was deleted:
   ```python
   links = await db.express.list("LinkedAccount", filter={
       "provider_type": "github",
       "user_id": user_id
   })
   print(len(links))  # Should be 0
   ```

5. User should still be able to sign in with password

## Troubleshooting

### Error: "The redirect_uri MUST match the registered callback URL"

**Cause**: Callback URL doesn't exactly match the OAuth App configuration

**Fix**:
1. Check the callback URL in GitHub OAuth App settings
2. Ensure exact match including protocol (http vs https), port, and path
3. Common issue: `http://localhost:3000/auth/callback` vs `http://127.0.0.1:3000/auth/callback`

### Error: "Bad verification code"

**Cause**: Authorization code expired or already used

**Fix**:
- Authorization codes expire after 10 minutes
- Codes can only be used once
- Clear browser sessionStorage and try again
- Check system clock is synchronized (time skew causes issues)

### Error: "No verified email found for user"

**Cause**: GitHub account has no verified email addresses

**Fix**:
1. Go to **GitHub Settings** → **Emails**
2. Add an email address if none exists
3. Click **Resend verification email**
4. Verify the email address
5. Try signing in again

**Note**: ARC only accepts **verified** emails for security. Unverified emails are ignored.

### Error: "User provisioning disabled for this tenant"

**Cause**: `auto_provision=False` and user doesn't exist

**Fix**: Either:
1. Set `auto_provision=True` in SSO provider config, OR
2. Pre-create users manually before they sign in

### Error: "Application is suspended"

**Cause**: GitHub suspended your OAuth App (abuse, policy violation, etc.)

**Fix**:
1. Check GitHub email for suspension notice
2. Review [GitHub's OAuth App policies](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps)
3. Contact GitHub Support if suspension was in error

### Error: "Rate limit exceeded"

**Cause**: Too many API requests to GitHub (5,000 requests/hour for authenticated requests)

**Fix**:
1. Implement caching for user profile data
2. Store user info in database instead of fetching every time
3. Use conditional requests with `If-None-Match` header
4. Consider GitHub App instead of OAuth App for higher rate limits

### Warning: "Email privacy settings prevent fetching email"

**Cause**: User has email privacy enabled and hasn't granted `user:email` scope

**Fix**:
1. Verify `user:email` scope is included in authorization request
2. User must explicitly authorize email access
3. Check that GitHub OAuth App hasn't been revoked by user

## Security Considerations

### 1. Client Secret Rotation

GitHub OAuth secrets don't expire, but should be rotated regularly:

1. Generate a new client secret in GitHub OAuth App settings
2. Update ARC configuration with new secret
3. Test thoroughly
4. Delete old secret from GitHub settings

**Recommended rotation**: Every 12 months or after personnel changes

### 2. Email Verification Requirement

ARC only accepts **verified** emails from GitHub:

```python
# In sso.py service:
primary = next(
    (e for e in emails if e.get("primary") and e.get("verified")),
    None,
)
```

This prevents account hijacking via unverified emails.

### 3. Organization Restrictions (Optional)

To limit access to specific GitHub organizations, implement organization checking:

```python
@db.model
class SSOProvider:
    # ... existing fields ...
    github_allowed_orgs: list[str] | None = None  # None = allow all

# In sso.py service (after token exchange):
if sso_config.get("github_allowed_orgs"):
    # Fetch user's organizations (requires read:org scope)
    orgs_response = await client.get(
        "https://api.github.com/user/orgs",
        headers=headers,
    )
    user_orgs = [org["login"] for org in orgs_response.json()]

    # Check if user belongs to allowed org
    allowed = any(
        org in sso_config["github_allowed_orgs"] for org in user_orgs
    )
    if not allowed:
        raise ValueError("User not in allowed organization")
```

**Note**: This requires adding `read:org` scope to the authorization request.

### 4. Scope Minimization

Only request scopes you actually need:

```python
# ✅ GOOD - Minimal scopes for SSO
"scopes": ["read:user", "user:email"]

# ❌ BAD - Excessive scopes
"scopes": ["read:user", "user:email", "repo", "admin:org"]
```

Requesting unnecessary scopes:
- Reduces user trust
- Increases security risk
- May trigger GitHub security reviews
- Violates principle of least privilege

### 5. OAuth App vs GitHub App

For production use, consider GitHub App instead of OAuth App:

| Feature | OAuth App | GitHub App |
|---------|-----------|------------|
| Rate limit | 5,000/hour | 15,000/hour |
| Installation | User-based | Organization-based |
| Permissions | Coarse-grained | Fine-grained |
| Webhooks | Limited | Full support |

**For ARC SSO**: OAuth App is sufficient. GitHub Apps are overkill for simple authentication.

### 6. Token Storage

**NEVER** store GitHub access tokens long-term:

```python
# ❌ BAD - Don't store access token
await db.express.create("User", {
    "github_access_token": access_token  # SECURITY RISK!
})

# ✅ GOOD - Only store user ID
await db.express.create("LinkedAccount", {
    "provider_user_id": github_user_id,  # Safe to store
    "provider_email": email,
})
```

ARC uses access tokens only during the OAuth callback, then discards them. User identity is tracked via `provider_user_id`.

## Production Checklist

Before deploying to production:

- [ ] Separate OAuth Apps created for staging and production
- [ ] Callback URLs configured correctly for each environment
- [ ] `SSO_SECRET_ENCRYPTION_KEY` is 32-byte Fernet key
- [ ] Client secret encrypted in database
- [ ] `auto_provision` set according to business requirements
- [ ] `default_role` set to appropriate value (usually "viewer")
- [ ] Email verification enforcement enabled
- [ ] Organization restrictions configured (if needed)
- [ ] Scope minimization verified (`read:user` and `user:email` only)
- [ ] Rate limit monitoring implemented
- [ ] Test account linking and unlinking flows
- [ ] Test with users who have private email settings
- [ ] Document OAuth App ownership and access
- [ ] Set up client secret rotation schedule (12 months)

## Monitoring and Maintenance

### GitHub OAuth App Metrics

Monitor your OAuth App usage in GitHub settings:

1. Go to **Settings** → **Developer settings** → **OAuth Apps** → **[Your App]**
2. View **Authorization callback URL** activity
3. Monitor active installations (authorized users)

**Note**: GitHub doesn't provide detailed analytics like Azure AD sign-in logs.

### ARC Audit Logs

Monitor SSO events in ARC:

```python
from arc.models.database import db

# List recent GitHub SSO logins
recent_logins = await db.express.list("AuditLog", filter={
    "event_type": "sso_login",
    "metadata": {"provider": "github"},
}, limit=100, order_by=["-created_at"])

# Count by email domain
from collections import Counter
domains = [log["metadata"]["email"].split("@")[1] for log in recent_logins]
print(Counter(domains))
# Output: Counter({'example.com': 42, 'acme.org': 18})
```

### Rate Limit Monitoring

Monitor GitHub API rate limit usage:

```python
# Add to sso.py service after API calls:
rate_limit = response.headers.get("X-RateLimit-Remaining")
rate_reset = response.headers.get("X-RateLimit-Reset")

if int(rate_limit) < 100:
    logger.warning(
        f"GitHub rate limit low: {rate_limit} remaining, resets at {rate_reset}"
    )
```

Set up alerts when rate limit drops below threshold.

## Testing with Private Repositories

For teams using GitHub for private development:

1. **DO NOT** request `repo` scope for SSO - This grants access to all private repositories
2. **Use GitHub Teams** for access control instead
3. **Separate authentication from authorization** - SSO for identity, GitHub permissions for repository access

```python
# ❌ BAD - Don't mix SSO with repo access
"scopes": ["read:user", "user:email", "repo"]

# ✅ GOOD - Keep SSO minimal
"scopes": ["read:user", "user:email"]
```

## Multiple GitHub Accounts

Some developers use multiple GitHub accounts (personal + work). Handle this gracefully:

1. **Account Linking**: Users can link multiple provider accounts to one ARC account
2. **Email Matching**: If work GitHub uses same email as personal, suggest linking
3. **Unique Constraint**: `(user_id, provider_type)` ensures one GitHub link per user

```python
# User can link one GitHub account per provider type
linked_accounts = await db.express.list("LinkedAccount", filter={
    "user_id": user_id
})
# Can have: azure, google, and github simultaneously
```

## Organization-Specific Setup

For GitHub organizations requiring centralized control:

### Option 1: Organization OAuth App

Create OAuth App under organization account:

1. Go to **Organization settings** → **Developer settings** → **OAuth Apps**
2. Create OAuth App owned by organization
3. Organization admins can manage the app
4. Restricts access to organization members

### Option 2: Personal OAuth App with Restrictions

Create personal OAuth App with organization restrictions:

1. Create OAuth App under personal account
2. Implement organization checking (see Security Considerations #3)
3. Only users in specified organization can access ARC

**Recommendation**: Use Option 1 for production. Option 2 for development/testing.

## Additional Resources

- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub API - User Endpoints](https://docs.github.com/en/rest/users/users)
- [GitHub OAuth Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [OAuth 2.0 Authorization Code Flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)
- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

## Summary

You've successfully configured GitHub OAuth for ARC:

1. ✅ Registered GitHub OAuth App with correct callback URL
2. ✅ Generated client secret and configured scopes (`read:user`, `user:email`)
3. ✅ Set up ARC backend with encrypted credentials
4. ✅ Tested authentication with public and private email settings
5. ✅ Verified account linking and unlinking flows
6. ✅ Implemented email verification enforcement
7. ✅ Configured organization restrictions (optional)
8. ✅ Set up monitoring and rate limit tracking

Developers can now sign in to ARC using their GitHub accounts, with full support for private email addresses and verified email enforcement!
