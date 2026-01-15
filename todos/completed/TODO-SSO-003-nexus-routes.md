# TODO-SSO-003: Create OAuth API Routes with Nexus

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Backend Foundation)
**Est. Effort**: 4 hours

## Description

Create Nexus workflow-based API routes for OAuth start and callback endpoints.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/01-architecture.md` (Section 7: API Design)
- **Implementation**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 1.3)

## Acceptance Criteria

- [ ] Create `/src/arc/api/routes/oauth.py`
- [ ] Create workflow: `oauth_start` (POST `/auth/oauth/{provider}`)
- [ ] Create workflow: `oauth_callback` (POST `/auth/oauth/{provider}/callback`)
- [ ] Request/response schemas using Pydantic
- [ ] Handle provider parameter: azure, google, github
- [ ] Return auth_url, state, code_verifier from start
- [ ] Accept code, state, code_verifier in callback
- [ ] Return access_token, refresh_token, user on success
- [ ] Return link_required action when account exists
- [ ] Set refresh token in httpOnly cookie
- [ ] Integrate with existing JWT auth service

## Dependencies

- TODO-SSO-002 (OAuth service)
- Existing auth service for JWT token generation

## Files to Create

- `/src/arc/api/routes/oauth.py`

## Files to Modify

- `/src/arc/api/app.py` - Register OAuth workflows with Nexus

## API Endpoints

```python
POST /api/v1/auth/oauth/{provider}
Body: { "return_url": "/dashboard" }
Response: { "auth_url": "https://...", "state": "..." }

POST /api/v1/auth/oauth/{provider}/callback
Body: { "code": "...", "state": "...", "code_verifier": "..." }
Response: { "access_token": "...", "expires_in": 900, "user": {...} }
OR: { "action": "link_required", "link_data": {...} }
```

## Testing Requirements

### Unit Tests (`tests/unit/api/test_oauth_routes.py`)
- [ ] Test oauth_start workflow execution
- [ ] Test oauth_callback workflow execution
- [ ] Test invalid provider returns 400
- [ ] Test missing parameters return 400
- [ ] Test link_required response structure

### Integration Tests (`tests/integration/api/test_oauth_api.py`)
- [ ] Test POST /auth/oauth/azure
- [ ] Test POST /auth/oauth/google
- [ ] Test POST /auth/oauth/github
- [ ] Test callback with valid code
- [ ] Test callback with invalid state
- [ ] Test callback returns JWT token
- [ ] Test refresh token in cookie

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Routes registered in Nexus
- [ ] OpenAPI docs generated
- [ ] Manual testing with Postman/curl
