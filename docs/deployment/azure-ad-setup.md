# Azure AD Multi-Tenant Setup Guide

This guide covers configuring Azure Active Directory (Azure AD) for enterprise single sign-on (SSO) with the ARC Investment Platform.

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Azure Subscription | Active Azure subscription (free tier works for app registration) |
| Azure AD Access | Global Administrator or Application Administrator role |
| ARC Backend | Running instance with SSO service configured |

---

## 1. Create App Registration

### 1.1 Navigate to App Registrations

1. Open [Azure Portal](https://portal.azure.com)
2. Search for "App registrations" in the top search bar
3. Click **New registration**

<!-- [Screenshot placeholder: Azure Portal App registrations page] -->

### 1.2 Configure Registration

| Field | Value | Description |
|-------|-------|-------------|
| **Name** | `ARC Investment Platform` | Display name in Azure AD |
| **Supported account types** | Accounts in any organizational directory (Any Azure AD directory - Multitenant) | Required for multi-tenant SSO |
| **Redirect URI** | Platform: `Web` | OAuth callback type |
| | URI: `https://app.arc-invest.com/auth/callback` | Callback URL for OAuth flow |

<!-- [Screenshot placeholder: App registration form] -->

Click **Register** to create the application.

### 1.3 Note Your Application IDs

After registration, note these values from the **Overview** page:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID: (use "common" for multi-tenant)
```

---

## 2. Configure API Permissions

### 2.1 Add Required Permissions

1. Navigate to **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:

| Permission | Type | Purpose |
|------------|------|---------|
| `openid` | Delegated | Basic sign-in |
| `profile` | Delegated | User profile information |
| `email` | Delegated | User email address |
| `User.Read` | Delegated | Read user profile from Graph API |

<!-- [Screenshot placeholder: API permissions page] -->

### 2.2 Admin Consent (If Required)

For multi-tenant apps, admin consent is generally **not required** for these basic permissions. However, if your organization requires admin consent:

1. Click **Grant admin consent for [Organization]**
2. Confirm the consent dialog

**Note**: Users from other tenants will be prompted for consent on first login.

---

## 3. Create Client Secret

### 3.1 Generate Secret

1. Navigate to **Certificates & secrets**
2. Click **New client secret**
3. Configure:

| Field | Value |
|-------|-------|
| Description | `ARC Production Secret` |
| Expires | `24 months` (recommended) |

4. Click **Add**

### 3.2 Copy Secret Value

**CRITICAL**: Copy the secret **Value** immediately. It will only be shown once.

```
Secret Value: your-client-secret-value-here
Secret ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3.3 Secret Rotation Schedule

Set a calendar reminder to rotate secrets before expiration:

| Environment | Secret Expiration | Rotation Reminder |
|-------------|------------------|-------------------|
| Production | 24 months | 23 months |
| Staging | 12 months | 11 months |

---

## 4. Environment Variables

Add these variables to your `.env` file:

```bash
# Azure AD Multi-Tenant Configuration
SSO_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  # Application (client) ID
SSO_AZURE_CLIENT_SECRET=your-client-secret-value           # Client secret value
SSO_AZURE_TENANT_ID=common                                  # "common" for multi-tenant

# General SSO Settings
SSO_REDIRECT_BASE_URL=https://app.arc-invest.com           # Your app base URL
SSO_SECRET_ENCRYPTION_KEY=                                  # See encryption key generation
```

### Generate Encryption Key

The SSO service encrypts client secrets at rest. Generate a key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 5. Multi-Tenant Configuration

### 5.1 Tenant ID Options

| Value | Behavior |
|-------|----------|
| `common` | Users from any Azure AD tenant OR personal Microsoft accounts |
| `organizations` | Users from any Azure AD tenant only (no personal accounts) |
| `consumers` | Personal Microsoft accounts only (Outlook.com, Xbox, etc.) |
| `{guid}` | Specific tenant GUID (single-tenant only) |

### 5.2 Domain Hints (Optional)

For organizations with known tenant domains, add domain hints to speed up login:

```python
# In SSO configuration
{
    "domain_hint": "company.com"  # Pre-selects organization
}
```

### 5.3 Tenant Isolation

The ARC platform isolates data by tenant:

1. Each Azure AD tenant gets a unique `tenant_id` in ARC
2. Users from different Azure AD tenants are isolated
3. SSO configuration is per-tenant

```
Azure AD Tenant A (Acme Corp)    ARC Tenant: "tenant-acme"
Azure AD Tenant B (Beta Inc)     ARC Tenant: "tenant-beta"
```

---

## 6. Testing Multi-Tenant SSO

### 6.1 Test Accounts

Test with these account types:

| Account Type | Example | Expected Behavior |
|--------------|---------|-------------------|
| Personal Microsoft | `user@outlook.com` | Creates new ARC user (if `common` tenant) |
| Work Account (Tenant A) | `user@companya.com` | Creates ARC user in Tenant A |
| Work Account (Tenant B) | `user@companyb.com` | Creates ARC user in Tenant B |

### 6.2 Verification Checklist

- [ ] OAuth flow completes without errors
- [ ] User profile populated correctly (email, name)
- [ ] JWT tokens issued successfully
- [ ] User isolated to correct tenant
- [ ] Linked account created in database

### 6.3 Test Commands

```bash
# Check linked accounts in database
psql -d arc -c "SELECT * FROM linked_account WHERE provider_type = 'azure';"

# Check user tenant assignment
psql -d arc -c "SELECT id, email, tenant_id, auth_provider FROM \"user\" WHERE auth_provider = 'azure';"
```

---

## 7. Admin Consent Flow

### 7.1 When Admin Consent is Required

Admin consent may be required when:

1. Organization policy requires admin approval for all apps
2. App requests permissions beyond basic profile (e.g., `Directory.Read.All`)
3. Enterprise application assignment is enforced

### 7.2 Handling Admin Consent

If a user sees "Need admin approval":

1. **Option A**: Have IT admin grant consent in Azure Portal
   - Azure Portal > Enterprise Applications > [ARC App] > Permissions > Grant admin consent

2. **Option B**: Use admin consent URL
   ```
   https://login.microsoftonline.com/{tenant-id}/adminconsent
   ?client_id={client-id}
   &redirect_uri={callback-url}
   &scope=openid profile email User.Read
   ```

3. **Option C**: Request individual user consent (if policy allows)

---

## 8. Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AADSTS50011: Reply URL does not match` | Redirect URI mismatch | Check redirect URI in Azure matches exactly |
| `AADSTS700016: Application not found` | Invalid client ID | Verify `SSO_AZURE_CLIENT_ID` value |
| `AADSTS7000215: Invalid client secret` | Wrong or expired secret | Regenerate client secret |
| `AADSTS65001: User consent required` | Missing consent | Grant admin consent or enable user consent |
| `AADSTS90002: Tenant not found` | Invalid tenant ID | Use `common` for multi-tenant |

### Debug Mode

Enable debug logging for SSO operations:

```bash
# Add to .env
LOG_LEVEL=DEBUG
```

Check logs for OAuth flow details:

```bash
# View recent SSO logs
tail -f logs/arc.log | grep -i sso
```

### Verify Configuration

```python
# Python verification script
import os
from arc.services.sso import sso_service

# Check configuration
print(f"Redirect Base: {sso_service.redirect_base}")
print(f"Encryption Key Set: {sso_service.fernet is not None}")

# Check provider config
config = await sso_service._get_sso_config("azure", "your-tenant-id")
print(f"Azure Config Found: {config is not None}")
print(f"Azure Tenant ID: {config.get('azure_tenant_id')}")
```

---

## 9. Security Best Practices

### 9.1 Secret Management

| Practice | Description |
|----------|-------------|
| Never commit secrets | Use environment variables or secrets manager |
| Rotate regularly | Rotate secrets before expiration (every 12-24 months) |
| Use separate secrets | Different secrets for dev/staging/prod |
| Monitor usage | Review Azure AD sign-in logs for anomalies |

### 9.2 Token Validation

The ARC SSO service validates:

1. **ID Token signature** - Verifies token from Microsoft
2. **Issuer claim** - Validates `iss` matches expected value
3. **Audience claim** - Validates `aud` matches client ID
4. **Expiration** - Rejects expired tokens
5. **State parameter** - Constant-time comparison prevents timing attacks

### 9.3 Audit Logging

Monitor SSO activity:

```sql
-- Recent SSO logins
SELECT u.email, la.provider_type, la.last_login_at
FROM linked_account la
JOIN "user" u ON la.user_id = u.id
WHERE la.last_login_at > NOW() - INTERVAL '7 days'
ORDER BY la.last_login_at DESC;
```

---

## 10. Azure CLI Reference

Alternative setup using Azure CLI:

```bash
# Login to Azure
az login

# Create app registration (multi-tenant)
az ad app create \
  --display-name "ARC Investment Platform" \
  --sign-in-audience "AzureADMultipleOrgs" \
  --web-redirect-uris "https://app.arc-invest.com/auth/callback" \
  --enable-id-token-issuance true

# Get Application ID
APP_ID=$(az ad app list --display-name "ARC Investment Platform" --query "[0].appId" -o tsv)

# Create client secret
az ad app credential reset \
  --id $APP_ID \
  --append \
  --display-name "Production Secret" \
  --years 2

# Add API permissions (User.Read = e1fe6dd8-ba31-4d61-89e7-88639da4683d)
az ad app permission add \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Grant admin consent (requires admin role)
az ad app permission admin-consent --id $APP_ID
```

---

## Related Documentation

- [SSO Architecture](/docs/02-plans/10-enterprise-sso/01-architecture.md)
- [SSO Implementation Guide](/docs/02-plans/10-enterprise-sso/02-implementation.md)
- [Backend SSO Documentation](/docs/developers/01-sso-backend.md)
- [Frontend SSO Documentation](/docs/developers/02-sso-frontend.md)
