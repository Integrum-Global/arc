# TODO-SSO-002: Implement OAuth Service with PKCE Support

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Backend Foundation)
**Est. Effort**: 6 hours

## Description

Implement the SSOService class that handles OAuth 2.0 Authorization Code Flow with PKCE for Azure AD, Google, and GitHub.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/01-architecture.md` (Section 2: OAuth Flow)
- **Implementation**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 1.2)

## Acceptance Criteria

- [ ] Create `/src/arc/services/sso.py`
- [ ] Implement `OAuthConfig` class with provider configurations
- [ ] Implement `SSOService` class with methods:
  - `start_oauth()` - Generate auth URL with PKCE
  - `handle_callback()` - Exchange code for tokens
  - `_handle_user()` - User provisioning/linking logic
  - `link_account()` - Link existing user to SSO
  - `unlink_account()` - Unlink SSO from user
- [ ] Support Azure AD with multi-tenant (tenant_id="common")
- [ ] Support Google with optional domain hint
- [ ] Support GitHub with email endpoint fallback
- [ ] Implement PKCE code challenge generation (SHA256)
- [ ] Implement state parameter for CSRF protection
- [ ] Client secret encryption/decryption using Fernet
- [ ] Handle user info fetching for each provider

## Dependencies

- TODO-SSO-001 (models)
- Environment variables: SSO_*_CLIENT_ID, SSO_*_CLIENT_SECRET, SSO_SECRET_ENCRYPTION_KEY

## Files to Create

- `/src/arc/services/sso.py`

## Files to Modify

- `/src/arc/services/__init__.py` - Export sso_service singleton

## Testing Requirements

### Unit Tests (`tests/unit/services/test_sso.py`)
- [ ] Test start_oauth generates valid PKCE challenge
- [ ] Test start_oauth generates unique state
- [ ] Test handle_callback validates state
- [ ] Test handle_callback exchanges code
- [ ] Test user provisioning creates new user
- [ ] Test user linking returns link_required action
- [ ] Test link_account creates LinkedAccount
- [ ] Test unlink_account validates other auth methods exist
- [ ] Test secret encryption/decryption

### Integration Tests (`tests/integration/sso/test_oauth_flow.py`)
- [ ] Test full OAuth flow with mocked IdP
- [ ] Test Azure AD token exchange
- [ ] Test Google token exchange
- [ ] Test GitHub email fetching
- [ ] Test auto-provisioning workflow
- [ ] Test account linking workflow

## Security Requirements

- [ ] PKCE code verifier: 32 bytes, base64url encoded
- [ ] PKCE code challenge: SHA256(verifier), base64url encoded
- [ ] State parameter: 32 bytes, cryptographically random
- [ ] State comparison uses secrets.compare_digest()
- [ ] Client secrets encrypted with Fernet at rest
- [ ] ID token signature validation (if available)

## Risk Assessment

- **HIGH**: OAuth provider API changes could break integration
- **HIGH**: Security vulnerabilities if PKCE/state not validated correctly
- **MEDIUM**: Multi-tenant Azure AD configuration complexity

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing with >90% coverage
- [ ] Integration tests passing
- [ ] Security review completed
- [ ] All three providers tested (Azure, Google, GitHub)
- [ ] Error handling for all failure scenarios
