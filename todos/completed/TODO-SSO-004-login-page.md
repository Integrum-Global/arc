# TODO-SSO-004: Create Login Page with SSO Buttons

**Status**: ACTIVE
**Priority**: HIGH (Phase 2 - Frontend Integration)
**Est. Effort**: 4 hours

## Description

Build a login page with SSO provider buttons (Azure, Google, GitHub) and traditional email/password form.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 2.1: Login Page)

## Acceptance Criteria

- [ ] Create `/apps/web/src/app/(auth)/login/page.tsx`
- [ ] SSO buttons for Azure, Google, GitHub with brand icons
- [ ] Email/password form below SSO buttons
- [ ] "OR" separator between SSO and email
- [ ] Forgot password link
- [ ] Sign up link
- [ ] Loading states for each SSO provider
- [ ] Store OAuth state/verifier in sessionStorage
- [ ] Redirect to IdP on SSO button click
- [ ] Return URL support via query parameter

## Dependencies

- TODO-SSO-003 (OAuth routes)
- Provider icons: AzureIcon, GoogleIcon, GitHubIcon

## Files to Create

- `/apps/web/src/app/(auth)/login/page.tsx`
- `/apps/web/src/components/icons/AzureIcon.tsx`
- `/apps/web/src/components/icons/GoogleIcon.tsx`
- `/apps/web/src/components/icons/GitHubIcon.tsx`

## Testing Requirements

### Unit Tests
- [ ] Test SSO buttons render correctly
- [ ] Test email form validation
- [ ] Test loading states
- [ ] Test sessionStorage values set on SSO click

### E2E Tests
- [ ] Test clicking Azure button redirects to Microsoft
- [ ] Test clicking Google button redirects to Google
- [ ] Test clicking GitHub button redirects to GitHub
- [ ] Test email/password login still works

## Implementation Notes

```typescript
const handleSSOLogin = async (provider: string) => {
  setSsoLoading(provider);

  const response = await fetch(`/api/auth/oauth/${provider}`, {
    method: "POST",
    body: JSON.stringify({ return_url: returnUrl }),
  });

  const data = await response.json();

  // Store for callback verification
  sessionStorage.setItem("oauth_state", data.state);
  sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
  sessionStorage.setItem("oauth_provider", provider);

  // Redirect to IdP
  window.location.href = data.auth_url;
};
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Page accessible at `/login`
- [ ] SSO redirects work correctly
- [ ] Email/password login preserved
- [ ] Responsive on mobile
