# TODO-BE-014: API Endpoints Implementation

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 12h
**Dependencies**: TODO-BE-012, TODO-BE-010, TODO-BE-011

---

## Objective

Implement all REST API endpoints for the ARC platform, beyond the auto-generated DataFlow CRUD endpoints.

---

## Tasks

### 1. Portfolio Endpoints
- [ ] Create `src/arc/api/routes/portfolios.py`
- [ ] Implement endpoints:
  - `GET /portfolios` - List user's portfolios
  - `POST /portfolios` - Create portfolio
  - `GET /portfolios/{id}` - Get portfolio details
  - `PUT /portfolios/{id}` - Update portfolio
  - `DELETE /portfolios/{id}` - Delete portfolio
  - `GET /portfolios/{id}/holdings` - Get holdings
  - `POST /portfolios/{id}/holdings` - Add holding
  - `POST /portfolios/{id}/transactions` - Record transaction
  - `GET /portfolios/{id}/transactions` - Get transactions
  - `GET /portfolios/{id}/valuations` - Get NAV history
  - `POST /portfolios/{id}/valuations/calculate` - Calculate NAV
  - `GET /portfolios/{id}/health` - Run health scan
  - `GET /portfolios/{id}/allocation/sector` - Sector allocation
  - `GET /portfolios/{id}/allocation/asset` - Asset allocation

### 2. Analytics Endpoints
- [ ] Create `src/arc/api/routes/analytics.py`
- [ ] Implement endpoints:
  - `GET /securities/{id}/ratios` - Get security ratios
  - `GET /securities/{id}/ratios/history` - Get ratio history
  - `POST /analytics/ratios/calculate` - Trigger ratio calculation
  - `GET /alerts` - Get user alerts
  - `PUT /alerts/{id}/acknowledge` - Acknowledge alert
  - `PUT /alerts/{id}/dismiss` - Dismiss alert
  - `GET /thresholds` - Get user thresholds
  - `POST /thresholds` - Create threshold
  - `PUT /thresholds/{id}` - Update threshold
  - `DELETE /thresholds/{id}` - Delete threshold
  - `POST /analytics/thresholds/check` - Check all thresholds
  - `GET /peer-groups` - List peer groups
  - `POST /peer-groups` - Create peer group
  - `GET /securities/{id}/benchmark` - Benchmark vs peers

### 3. Intelligence Endpoints
- [ ] Create `src/arc/api/routes/intelligence.py`
- [ ] Implement endpoints:
  - `POST /intelligence/brief` - Generate market brief
  - `GET /intelligence/brief` - Stream market brief (SSE)
  - `POST /intelligence/query` - Natural language query
  - `GET /intelligence/query/suggestions` - Get query suggestions
  - `POST /intelligence/analysis/{security_id}` - Analyze security
  - `POST /intelligence/anomalies` - Detect anomalies
  - `POST /intelligence/research` - Research topic

### 4. Integration Endpoints
- [ ] Create `src/arc/api/routes/integrations.py`
- [ ] Implement endpoints:
  - `GET /integrations/providers` - List provider connections
  - `POST /integrations/providers` - Configure provider
  - `GET /integrations/providers/{provider}/status` - Provider status
  - `POST /integrations/sync/prices` - Trigger price sync
  - `POST /integrations/sync/fundamentals` - Trigger fundamentals sync
  - `GET /integrations/sync/jobs` - List sync jobs
  - `GET /integrations/sync/jobs/{id}` - Get job details
  - `GET /quotes/{ticker}` - Get real-time quote

### 5. User Endpoints
- [ ] Create `src/arc/api/routes/users.py`
- [ ] Implement endpoints:
  - `GET /users/me` - Get current user
  - `PUT /users/me` - Update current user
  - `GET /users/me/preferences` - Get preferences
  - `PUT /users/me/preferences` - Update preferences
  - `GET /users/me/notifications` - Get notification settings
  - `PUT /users/me/notifications` - Update notifications
  - `GET /users` - List users (admin)
  - `POST /users` - Create user (admin)
  - `PUT /users/{id}` - Update user (admin)
  - `DELETE /users/{id}` - Deactivate user (admin)

### 6. Admin Endpoints
- [ ] Create `src/arc/api/routes/admin.py`
- [ ] Implement endpoints:
  - `GET /admin/tenant` - Get tenant info
  - `PUT /admin/tenant` - Update tenant settings
  - `GET /admin/audit` - Get audit logs
  - `GET /admin/metrics` - Get usage metrics

### 7. Webhook Endpoints
- [ ] Create `src/arc/api/routes/webhooks.py`
- [ ] Implement endpoints:
  - `POST /webhooks/eodhd` - EODHD webhook handler
  - `POST /webhooks/stripe` - Stripe webhook handler
  - `POST /webhooks/slack` - Slack command handler

### 8. Route Registration
- [ ] Register all routes with Nexus
- [ ] Configure route prefixes
- [ ] Apply authentication middleware
- [ ] Apply permission decorators

---

## Acceptance Criteria

- [ ] All endpoints accessible via API
- [ ] Proper HTTP methods used
- [ ] Request validation on all inputs
- [ ] Authentication required on protected endpoints
- [ ] Authorization checked via RBAC
- [ ] Consistent error responses
- [ ] OpenAPI documentation complete
- [ ] Unit test: Request validation
- [ ] Integration test: Each endpoint group
- [ ] E2E test: Full user journey

---

## Response Format

```json
{
    "success": true,
    "data": {...},
    "meta": {
        "page": 1,
        "limit": 20,
        "total": 100
    }
}

// Error response
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid portfolio code",
        "details": [...]
    }
}
```

---

## Technical Notes

- Use Pydantic for request/response models
- Implement pagination consistently (page, limit, offset)
- Use streaming (SSE) for real-time data
- Apply rate limiting per endpoint category
- Log all requests to audit log
