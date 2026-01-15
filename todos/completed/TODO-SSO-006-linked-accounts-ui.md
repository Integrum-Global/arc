# TODO-SSO-006: Create Linked Accounts Manager Component

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 3 - Account Management)
**Est. Effort**: 4 hours

## Description

Build a settings component for users to view, link, and unlink SSO providers from their account.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 2.3: Linked Accounts Manager)

## Acceptance Criteria

- [ ] Create `/apps/web/src/components/settings/LinkedAccountsManager.tsx`
- [ ] Display all available providers (Azure, Google, GitHub)
- [ ] Show "Connected" badge with email for linked accounts
- [ ] Show "Not connected" for unlinked providers
- [ ] "Connect" button initiates OAuth flow
- [ ] "Unlink" button with confirmation dialog
- [ ] Prevent unlinking last auth method
- [ ] Loading states for link/unlink operations
- [ ] Success/error toasts

## Dependencies

- TODO-SSO-003 (OAuth routes)
- Backend: GET/DELETE `/auth/link/{provider}` endpoints

## Files to Create

- `/apps/web/src/components/settings/LinkedAccountsManager.tsx`
- `/apps/web/src/hooks/useLinkedAccounts.ts` (React Query)

## Files to Modify

- `/apps/web/src/app/(dashboard)/settings/security/page.tsx` - Add component

## API Integration

```typescript
// GET /api/v1/auth/linked-accounts
interface LinkedAccount {
  id: string;
  provider_type: string;
  provider_email: string;
  provider_name?: string;
  linked_at: string;
  last_login_at?: string;
}

// DELETE /api/v1/auth/link/{provider}
// Requires user has password OR other linked accounts
```

## Testing Requirements

### Unit Tests
- [ ] Test provider list renders
- [ ] Test linked accounts show Connected badge
- [ ] Test unlinked accounts show Connect button
- [ ] Test unlink confirmation dialog
- [ ] Test prevent unlinking last method

### E2E Tests
- [ ] Test linking a new provider
- [ ] Test unlinking a provider
- [ ] Test cannot unlink last auth method

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Component in security settings
- [ ] Link/unlink workflows tested
- [ ] Error handling complete
