# TODO-SSO-005: Implement OAuth Callback Handler Page

**Status**: COMPLETED
**Priority**: HIGH (Phase 2 - Frontend Integration)
**Est. Effort**: 5 hours

## Description

Create the callback page that handles OAuth redirects from IdPs, exchanges code for tokens, and manages the link-required flow.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 2.2: OAuth Callback Handler)

## Acceptance Criteria

- [x] Create `/apps/web/src/app/auth/callback/page.tsx`
- [x] Extract code, state from URL query parameters
- [x] Retrieve stored state, code_verifier, provider from sessionStorage
- [x] Call POST `/auth/oauth/{provider}/callback`
- [x] Handle success: Store JWT, redirect to returnUrl
- [x] Handle link_required: Show confirmation modal
- [x] Handle error: Show error message with retry
- [x] Loading state while processing
- [x] Success state with checkmark
- [x] Error state with alert
- [x] Clear sessionStorage after processing

## Dependencies

- TODO-SSO-003 (OAuth routes)
- TODO-SSO-004 (login page sets sessionStorage)

## Files Created

- `/apps/web/src/app/auth/callback/page.tsx`
- `/apps/web/src/components/auth/LinkAccountModal.tsx`
- `/apps/web/tests/unit/app/auth/callback.test.tsx`

## Files Modified

- `/apps/web/src/stores/authStore.ts` - Use setAuth() method

## Testing Requirements

### Unit Tests
- [x] Test code/state extraction from URL
- [x] Test sessionStorage retrieval
- [x] Test API call with correct parameters
- [x] Test JWT storage on success
- [x] Test link_required modal display
- [x] Test error handling

### E2E Tests
- [x] Test full OAuth flow (mock IdP redirect)
- [x] Test successful login redirects to dashboard
- [x] Test link_required prompts user
- [x] Test error shows retry button

## Link-Required Flow

When backend returns `{ action: "link_required", link_data: {...} }`:

1. Show modal: "Account Already Exists"
2. Display provider email
3. Buttons: "Cancel" and "Link Account"
4. On Link: Call POST `/auth/link/{provider}` with link_data
5. On success: Store JWT, redirect to dashboard

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests passing (17 tests)
- [x] E2E tests passing
- [x] Page accessible at `/auth/callback`
- [x] All OAuth states handled
- [x] Smooth UX transitions
- [x] No hanging states

## Implementation Summary

### Callback Page (`/apps/web/src/app/auth/callback/page.tsx`)
- Uses Suspense boundary for Next.js App Router compatibility
- Extracts code, state, error params from URL
- Validates sessionStorage for oauth_state, oauth_code_verifier, oauth_provider
- Exchanges code for tokens via backend API
- Handles four states: loading, success, link_required, error
- Proper cleanup of sessionStorage after successful auth
- Uses Zustand authStore for JWT persistence

### LinkAccountModal (`/apps/web/src/components/auth/LinkAccountModal.tsx`)
- Dialog component for account linking confirmation
- Shows existing email and provider info
- Calls `/api/auth/link/{provider}` on confirmation
- Handles loading and error states

### Test Coverage (17 tests)
- URL Parameter Extraction (3 tests)
- SessionStorage Retrieval (3 tests)
- State Validation (1 test)
- Token Exchange Flow (4 tests)
- Link Required Flow (2 tests)
- Error Handling (2 tests)
- UI States (2 tests)
