# TODO-SSO-007: Azure AD Multi-Tenant Configuration and Testing

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 4 - Azure Multi-Tenant)
**Est. Effort**: 3 hours

## Description

Configure and test Azure AD with multi-tenant support (tenant_id="common") and document the setup process.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 3: Azure AD Multi-Tenant Setup)

## Acceptance Criteria

- [ ] Register Azure app with "Accounts in any organizational directory"
- [ ] Configure redirect URI: `https://app.arc-invest.com/auth/callback`
- [ ] Add API permissions: User.Read, openid, profile, email
- [ ] Create client secret with 2-year expiration
- [ ] Document app registration steps
- [ ] Test with personal Microsoft account
- [ ] Test with organizational account (different tenant)
- [ ] Test with work/school account
- [ ] Verify tenant isolation in database

## Dependencies

- TODO-SSO-002 (OAuth service with Azure support)
- Azure subscription (for app registration)

## Files to Create

- `/docs/deployment/azure-ad-setup.md` - Step-by-step guide

## Files to Modify

- `.env.example` - Add Azure AD variables
- `/docs/02-plans/10-enterprise-sso/02-implementation.md` - Update with findings

## Environment Variables

```bash
SSO_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SSO_AZURE_CLIENT_SECRET=your-client-secret-value
SSO_AZURE_TENANT_ID=common  # "common" for multi-tenant
```

## Azure CLI Commands

```bash
# Create app registration
az ad app create \
  --display-name "ARC Investment Platform" \
  --sign-in-audience "AzureADMultipleOrgs" \
  --web-redirect-uris "https://app.arc-invest.com/auth/callback" \
  --enable-id-token-issuance true

# Add API permissions
az ad app permission add \
  --id <app-id> \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
```

## Testing Requirements

### Manual Testing
- [ ] Login with personal@outlook.com account
- [ ] Login with user@companyA.com account
- [ ] Login with user@companyB.com account
- [ ] Verify all create separate tenant records
- [ ] Test admin consent flow (if required)

### Integration Tests
- [ ] Mock Azure AD token endpoint responses
- [ ] Test tenant ID extraction from ID token
- [ ] Test user provisioning creates correct tenant_id

## Risk Assessment

- **HIGH**: Multi-tenant app requires admin consent in some orgs
- **MEDIUM**: Tenant isolation must be verified thoroughly

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Azure app registered and configured
- [ ] Documentation complete
- [ ] Multi-tenant login tested with 2+ tenants
- [ ] Tenant isolation verified
- [ ] Admin consent process documented
