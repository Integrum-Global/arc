# TODO-BE-002: Core Domain Models (User, Tenant)

**Priority**: HIGH
**Status**: COMPLETED
**Completed**: 2026-01-07
**Estimated Effort**: 4h
**Actual Effort**: ~4h
**Dependencies**: TODO-BE-001

---

## Objective

Implement the core DataFlow models for user and tenant management, establishing the multi-tenant foundation for the ARC platform.

---

## Completion Summary

### Files Created
- `src/arc/models/database.py` - DataFlow initialization with `auto_migrate=False` for Docker compatibility
- `src/arc/models/core.py` - 5 core domain models
- `src/arc/models/__init__.py` - Updated with all exports
- `tests/unit/models/__init__.py` - Test package init
- `tests/unit/models/test_core_models.py` - 32 unit tests

### Models Implemented

#### 1. Tenant Model
- `id: str` - UUID primary key
- `name: str` - Organization name
- `subdomain: str` - Unique subdomain (indexed)
- `plan: str` - Subscription tier (default: "trial")
- `max_users: int` - User limit (default: 5)
- `max_portfolios: int` - Portfolio limit (default: 10)
- `reporting_currency: str` - Default "USD"
- `data_providers: str` - JSON serialized list (default: '["eodhd"]')
- `features_enabled: str` - JSON serialized dict
- `active: bool` - Active status (default: True)
- `trial_ends_at: Optional[str]` - Trial expiration
- **DataFlow Config**: `tenant_root=True`, `audit_log=True`, `soft_delete=True`

#### 2. User Model
- `id: str` - UUID primary key
- `tenant_id: str` - Foreign key to Tenant
- `email: str` - Unique within tenant
- `name: str` - Display name
- `avatar_url: Optional[str]`
- `auth_provider: str` - Authentication method (default: "email")
- `auth_provider_id: Optional[str]`
- `password_hash: Optional[str]`
- `role: str` - User role (default: "viewer")
- `permissions_override: Optional[str]` - JSON serialized dict
- `timezone: str` - Default "UTC"
- `locale: str` - Default "en-US"
- `active: bool` - Active status (default: True)
- `email_verified: bool` - Verification status (default: False)
- `last_login_at: Optional[str]` - Last login timestamp
- `deleted_at: Optional[str]` - Soft delete timestamp
- **DataFlow Config**: `multi_tenant=True`, `audit_log=True`, `soft_delete=True`
- **Indexes**: `email`, `role+active`, `auth_provider+auth_provider_id`

#### 3. UserPreference Model
- `id: str` - UUID primary key (same as user_id)
- `tenant_id: str` - Foreign key to Tenant
- `user_id: str` - Foreign key to User (unique)
- `default_portfolio_id: Optional[str]`
- `dashboard_layout: Optional[str]` - JSON serialized dict
- `brief_settings: Optional[str]` - JSON serialized dict
- `alert_thresholds: Optional[str]` - JSON serialized dict
- `number_format: str` - Default "us"
- `date_format: str` - Default "YYYY-MM-DD"
- **DataFlow Config**: `multi_tenant=True`

#### 4. NotificationPreference Model
- `id: str` - UUID primary key
- `tenant_id: str` - Foreign key to Tenant
- `user_id: str` - Foreign key to User
- `channel: str` - Notification channel (default: "email")
- `destination: str` - Target address
- `severity_filter: str` - Filter level (default: "all")
- `alert_types: Optional[str]` - JSON serialized list
- `frequency: str` - Delivery frequency (default: "immediate")
- `quiet_hours_start: Optional[str]`
- `quiet_hours_end: Optional[str]`
- `enabled: bool` - Default True
- `verified: bool` - Default False
- **DataFlow Config**: `multi_tenant=True`
- **Indexes**: `user_id+channel` (unique)

#### 5. AuditLog Model
- `id: str` - UUID primary key
- `tenant_id: str` - Foreign key to Tenant
- `user_id: Optional[str]` - Actor user ID
- `action: str` - Action type
- `resource_type: str` - Resource type affected
- `resource_id: Optional[str]` - Resource ID affected
- `old_values: Optional[str]` - JSON serialized previous state
- `new_values: Optional[str]` - JSON serialized new state
- `ip_address: Optional[str]`
- `user_agent: Optional[str]`
- `request_id: Optional[str]`
- **DataFlow Config**: `multi_tenant=True`, `audit_log=False` (prevents recursion)
- **Indexes**: `tenant_id+resource_type+resource_id`, `tenant_id+user_id`, `action`, `created_at`

### Dependencies Added to pyproject.toml
- `motor` - For DataFlow MongoDB support
- `psycopg2-binary` - For PostgreSQL support

---

## Acceptance Criteria - All Met

- [x] All models created with correct types
- [x] Tenant model has `tenant_root=True` flag
- [x] User model has `multi_tenant=True` flag
- [x] All indexes defined in `__indexes__`
- [x] Soft delete configured where needed (Tenant, User)
- [x] Unit tests: 32 tests covering all models
- [x] No manual `created_at`/`updated_at` (DataFlow managed)

---

## Verification

```bash
# All tests pass
uv run pytest tests/unit/ -v
# Result: 109 tests passed

# Code quality checks pass
uv run ruff check src/arc/ tests/
uv run black --check src/arc/ tests/
```

---

## Notes

- Used `auto_migrate=False` in DataFlow initialization for Docker compatibility
- All JSON fields stored as strings (DataFlow pattern for complex types)
- AuditLog has `audit_log=False` to prevent infinite recursion
- Multi-tenant models automatically include `tenant_id` filtering
- Soft delete adds `deleted_at` field and converts DELETE to UPDATE
