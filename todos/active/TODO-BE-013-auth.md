# TODO-BE-013: Authentication & Authorization

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-012

---

## Objective

Implement authentication (OAuth, JWT) and authorization (RBAC) for the ARC platform.

---

## Tasks

### 1. OAuth Integration
- [ ] Create `src/arc/api/auth/oauth.py`
- [ ] Implement OAuth provider handlers:
  - Google OAuth
  - Microsoft OAuth
  - Okta OIDC
- [ ] Create OAuth callback endpoints
- [ ] Handle user creation/linking on first OAuth login
- [ ] Store OAuth tokens securely (encrypted)

### 2. JWT Token Management
- [ ] Create `src/arc/api/auth/jwt.py`
- [ ] Implement JWT utilities:
  - `create_access_token()` - Generate access token
  - `create_refresh_token()` - Generate refresh token
  - `decode_token()` - Validate and decode token
  - `refresh_access_token()` - Issue new access from refresh
- [ ] Configure token expiration:
  - Access token: 15 minutes
  - Refresh token: 7 days
- [ ] Add token claims:
  - `sub` - User ID
  - `tenant_id` - Tenant ID
  - `role` - User role
  - `permissions` - Permission list

### 3. Role-Based Access Control (RBAC)
- [ ] Create `src/arc/api/auth/rbac.py`
- [ ] Define role hierarchy:
  - `admin` - Full access
  - `investment_manager` - Portfolio management
  - `family_office` - Read + basic operations
  - `compliance` - Read + audit access
  - `viewer` - Read-only
- [ ] Define permission matrix:
  - Portfolio: create, read, update, delete, manage_holdings
  - Analytics: read, configure_thresholds, manage_alerts
  - Intelligence: query, generate_briefs
  - Integration: configure, sync, view_status
  - Admin: manage_users, manage_tenant, view_audit
- [ ] Implement permission checker decorator:
  ```python
  @require_permission("portfolio:create")
  async def create_portfolio(request, ...):
      ...
  ```

### 4. Authentication Middleware
- [ ] Create `src/arc/api/middleware/auth.py`
- [ ] Implement JWT validation middleware
- [ ] Extract user context from token
- [ ] Handle token refresh transparently

### 5. Auth Endpoints
- [ ] Create `src/arc/api/routes/auth.py`
- [ ] Implement endpoints:
  - `POST /auth/login` - Email/password login
  - `POST /auth/register` - User registration
  - `GET /auth/oauth/{provider}` - OAuth initiation
  - `GET /auth/oauth/{provider}/callback` - OAuth callback
  - `POST /auth/refresh` - Refresh access token
  - `POST /auth/logout` - Invalidate tokens
  - `GET /auth/me` - Get current user
  - `POST /auth/password/reset` - Request password reset
  - `POST /auth/password/reset/confirm` - Confirm reset

### 6. Session Management
- [ ] Implement session tracking
- [ ] Support concurrent session limits
- [ ] Add session revocation

---

## Acceptance Criteria

- [ ] Email/password authentication works
- [ ] OAuth with Google, Microsoft, Okta
- [ ] JWT tokens with proper claims
- [ ] Token refresh flow
- [ ] Role-based access control
- [ ] Permission decorators on endpoints
- [ ] Session tracking
- [ ] Unit test: JWT creation/validation
- [ ] Unit test: Permission checking
- [ ] Integration test: Login flow
- [ ] Integration test: OAuth flow
- [ ] Integration test: Protected endpoint access

---

## Role Permission Matrix

| Permission | admin | investment_manager | family_office | compliance | viewer |
|------------|-------|-------------------|---------------|------------|--------|
| portfolio:create | ✓ | ✓ | ✗ | ✗ | ✗ |
| portfolio:read | ✓ | ✓ | ✓ | ✓ | ✓ |
| portfolio:update | ✓ | ✓ | ✗ | ✗ | ✗ |
| portfolio:delete | ✓ | ✓ | ✗ | ✗ | ✗ |
| holdings:manage | ✓ | ✓ | ✗ | ✗ | ✗ |
| analytics:read | ✓ | ✓ | ✓ | ✓ | ✓ |
| analytics:configure | ✓ | ✓ | ✓ | ✗ | ✗ |
| intelligence:query | ✓ | ✓ | ✓ | ✓ | ✓ |
| intelligence:brief | ✓ | ✓ | ✓ | ✗ | ✗ |
| admin:users | ✓ | ✗ | ✗ | ✗ | ✗ |
| admin:tenant | ✓ | ✗ | ✗ | ✗ | ✗ |
| audit:view | ✓ | ✗ | ✗ | ✓ | ✗ |

---

## Technical Notes

- Use `python-jose` for JWT handling
- Store password hashes with bcrypt
- Never log tokens or passwords
- OAuth tokens should be encrypted at rest
- Consider API key authentication for programmatic access
