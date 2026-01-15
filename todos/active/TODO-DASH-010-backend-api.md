# TODO-DASH-010: Create Backend API for Dashboard Layout Persistence

**Status**: ACTIVE
**Priority**: MEDIUM (Phase 3 - Backend Sync)
**Est. Effort**: 4 hours

## Description

Implement DataFlow model and Nexus API endpoints for saving and loading user dashboard layouts.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Section 6.2: Backend API)

## Acceptance Criteria

- [ ] Create `/src/arc/models/dashboard_layout.py` with `UserDashboardLayout` model
- [ ] Fields: user_id, layouts (JSON), active_layout_id, created_at, updated_at
- [ ] Create `/src/arc/api/routes/dashboard_layout.py` with Nexus workflows
- [ ] Implement GET `/api/v1/users/me/dashboard-layout`
- [ ] Implement PUT `/api/v1/users/me/dashboard-layout`
- [ ] Validate layout JSON structure
- [ ] Handle user not found
- [ ] Use DataFlow Express for fast CRUD
- [ ] Return 200 with layout on GET
- [ ] Return 204 on successful PUT

## Dependencies

- DataFlow (for model)
- Nexus (for API routes)
- Existing User model (for user_id FK)

## Files to Create

- `/src/arc/models/dashboard_layout.py`
- `/src/arc/api/routes/dashboard_layout.py`

## Files to Modify

- `/src/arc/api/app.py` - Register workflows with Nexus

## API Schemas

```python
# GET Response
{
  "layouts": [
    {
      "id": "default",
      "name": "Default",
      "widgets": [...],
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "activeLayoutId": "default"
}

# PUT Request
{
  "layouts": [...],
  "activeLayoutId": "default"
}
```

## Testing Requirements

### Unit Tests (`tests/unit/api/test_dashboard_layout.py`)
- [ ] Test UserDashboardLayout model creation
- [ ] Test layout JSON validation

### Integration Tests (`tests/integration/api/test_dashboard_api.py`)
- [ ] Test GET returns default layout for new user
- [ ] Test GET returns saved layout for existing user
- [ ] Test PUT saves layout
- [ ] Test PUT updates existing layout
- [ ] Test GET after PUT returns saved layout
- [ ] Test invalid user_id returns 404

## Implementation Notes

```python
@db.model
class UserDashboardLayout:
    id: str
    user_id: str  # FK to User
    layouts: str  # JSON string
    active_layout_id: str
    created_at: Optional[str]
    updated_at: Optional[str]

# Use DataFlow Express for performance
layout = await db.express.read("UserDashboardLayout", filter={"user_id": user_id})
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] API endpoints registered in Nexus
- [ ] Manual testing with Postman/curl
- [ ] OpenAPI docs generated
