# TODO-SSO-001: Create SSOProvider and LinkedAccount DataFlow Models

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Backend Foundation)
**Est. Effort**: 2 hours

## Description

Create DataFlow models for storing OAuth provider configurations (per-tenant) and linked account mappings.

## Reference Documentation

- **Plan**: `/docs/02-plans/10-enterprise-sso/01-architecture.md` (Section 4: Data Model)
- **Implementation**: `/docs/02-plans/10-enterprise-sso/02-implementation.md` (Section 1.1)

## Acceptance Criteria

- [ ] Create `/src/arc/models/sso.py`
- [ ] Implement `SSOProvider` model with fields: id, tenant_id, provider_type, display_name, client_id, client_secret_encrypted, azure_tenant_id, google_domain, is_enabled, auto_provision, default_role
- [ ] Add unique index on (tenant_id, provider_type)
- [ ] Implement `LinkedAccount` model with fields: id, user_id, provider_type, provider_user_id, provider_email, provider_name, linked_at, last_login_at
- [ ] Add unique indexes: (user_id, provider_type) and (provider_type, provider_user_id)
- [ ] All timestamp fields use ISO format
- [ ] DataFlow auto_migrate=False for Docker compatibility

## Dependencies

- Existing User model (already has auth_provider and auth_provider_id fields)

## Files to Create

- `/src/arc/models/sso.py`

## Files to Modify

- `/src/arc/models/__init__.py` - Export new models
- `/src/arc/models/database.py` - Register models if needed

## Testing Requirements

### Unit Tests (`tests/unit/models/test_sso.py`)
- [ ] Test SSOProvider creation
- [ ] Test unique constraint on (tenant_id, provider_type)
- [ ] Test LinkedAccount creation
- [ ] Test unique constraints work
- [ ] Test timestamp auto-population

### Integration Tests (`tests/integration/models/test_sso_crud.py`)
- [ ] Test CRUD operations on SSOProvider
- [ ] Test CRUD operations on LinkedAccount
- [ ] Test querying by tenant_id
- [ ] Test querying linked accounts by user_id

## Implementation Notes

```python
# Key constraints:
# - SSOProvider: One config per (tenant, provider) pair
# - LinkedAccount: One link per (user, provider) pair
# - LinkedAccount: Unique (provider, provider_user_id) for global uniqueness
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Models registered in DataFlow
- [ ] Migration creates tables successfully
- [ ] Indexes created correctly
