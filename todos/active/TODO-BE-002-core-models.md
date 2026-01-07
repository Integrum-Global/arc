# TODO-BE-002: Core Domain Models (User, Tenant)

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: TODO-BE-001

---

## Objective

Implement the core DataFlow models for user and tenant management, establishing the multi-tenant foundation for the ARC platform.

---

## Tasks

### 1. Database Initialization
- [ ] Create `src/arc/models/database.py`
- [ ] Initialize DataFlow with PostgreSQL connection
- [ ] Configure `auto_migrate=False` for Docker compatibility
- [ ] Create async lifespan handler for table creation

```python
from dataflow import DataFlow

db = DataFlow(
    "postgresql://...",
    auto_migrate=False  # CRITICAL for Docker
)
```

### 2. Tenant Model
- [ ] Create `src/arc/models/user.py`
- [ ] Implement `Tenant` model:
  - `id: str` - UUID primary key
  - `name: str` - Organization name
  - `subdomain: str` - Unique subdomain
  - `plan: str` - subscription tier
  - `max_users: int` - User limit
  - `max_portfolios: int` - Portfolio limit
  - `reporting_currency: str` - Default USD
  - `data_providers: List[str]` - Enabled providers
  - `features_enabled: dict` - Feature flags
  - `active: bool` - Active status
  - `trial_ends_at: Optional[datetime]`
- [ ] Configure `tenant_root=True` in `__dataflow__`
- [ ] Add unique index on `subdomain`

### 3. User Model
- [ ] Implement `User` model:
  - `id: str` - UUID primary key
  - `email: str` - Unique within tenant
  - `name: str` - Display name
  - `avatar_url: Optional[str]`
  - `auth_provider: str` - email, google, microsoft, okta
  - `auth_provider_id: Optional[str]`
  - `password_hash: Optional[str]`
  - `role: str` - admin, investment_manager, family_office, compliance, viewer
  - `permissions_override: dict`
  - `timezone: str` - Default UTC
  - `locale: str` - Default en-US
  - `active: bool`
  - `email_verified: bool`
  - `last_login_at: Optional[datetime]`
- [ ] Configure `multi_tenant=True`
- [ ] Add indexes on email, role+active, auth_provider+auth_provider_id

### 4. UserPreference Model
- [ ] Implement `UserPreference` model (1:1 with User):
  - `id: str` - Same as user_id
  - `user_id: str` - FK to User
  - `default_portfolio_id: Optional[str]`
  - `dashboard_layout: dict`
  - `brief_settings: dict` - Morning brief configuration
  - `alert_thresholds: dict` - Default thresholds
  - `number_format: str` - us or eu
  - `date_format: str`
- [ ] Add unique constraint on user_id

### 5. NotificationPreference Model
- [ ] Implement `NotificationPreference` model:
  - `id: str` - UUID
  - `user_id: str` - FK to User
  - `channel: str` - email, sms, in_app, push, slack
  - `destination: str` - Target address
  - `severity_filter: str` - all, warning, critical
  - `alert_types: List[str]`
  - `frequency: str` - immediate, hourly_digest, daily_digest
  - `quiet_hours_start: Optional[str]`
  - `quiet_hours_end: Optional[str]`
  - `enabled: bool`
  - `verified: bool`

### 6. Model Exports
- [ ] Update `src/arc/models/__init__.py` with all exports
- [ ] Ensure models are registered with DataFlow

---

## Acceptance Criteria

- [ ] All models created with correct types
- [ ] Tenant model has `tenant_root=True` flag
- [ ] User model has `multi_tenant=True` flag
- [ ] All indexes defined in `__indexes__`
- [ ] Soft delete configured where needed
- [ ] Unit test: Create tenant with all fields
- [ ] Unit test: Create user with all fields
- [ ] Integration test: Multi-tenant isolation verification
- [ ] Integration test: Subdomain uniqueness constraint

---

## Test Cases

```python
# tests/unit/models/test_user.py
async def test_create_tenant():
    """Test tenant creation with all fields."""
    pass

async def test_create_user():
    """Test user creation with defaults."""
    pass

# tests/integration/models/test_user.py
async def test_user_tenant_isolation():
    """Verify users cannot access other tenant data."""
    pass

async def test_subdomain_uniqueness():
    """Verify subdomain unique constraint."""
    pass
```

---

## Notes

- NEVER manually set `created_at` or `updated_at` - DataFlow manages these
- Use string IDs for all primary keys
- Follow Kailash DataFlow patterns for Docker deployment
