# API Endpoints

## Overview

The ARC API provides RESTful endpoints for:

- **Portfolio Management**: CRUD operations, holdings, transactions, NAV
- **Analytics**: Ratios, thresholds, alerts, peer groups, trends
- **User Management**: Profile, preferences, admin operations
- **Administration**: Tenant settings, audit logs, metrics

All endpoints require authentication via JWT token (except `/auth/*` endpoints).

## Authentication

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/register` | Register new user |
| GET | `/auth/me` | Get current user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |

### Usage

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}

# Authenticated request
curl http://localhost:8000/portfolios \
  -H "Authorization: Bearer eyJ..."
```

## Portfolio Endpoints

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portfolios` | List portfolios |
| POST | `/portfolios` | Create portfolio |
| GET | `/portfolios/{id}` | Get portfolio |
| PUT | `/portfolios/{id}` | Update portfolio |
| DELETE | `/portfolios/{id}` | Delete portfolio |
| GET | `/portfolios/{id}/holdings` | Get holdings |
| POST | `/portfolios/{id}/holdings` | Add holding |
| GET | `/portfolios/{id}/transactions` | Get transactions |
| POST | `/portfolios/{id}/transactions` | Record transaction |
| GET | `/portfolios/{id}/valuations` | Get NAV history |
| POST | `/portfolios/{id}/valuations/calculate` | Calculate NAV |
| GET | `/portfolios/{id}/health` | Run health scan |
| GET | `/portfolios/{id}/allocation/sector` | Sector allocation |
| GET | `/portfolios/{id}/allocation/asset` | Asset allocation |
| GET | `/portfolios/{id}/top-holdings` | Top holdings |

### Examples

```bash
# Create portfolio
curl -X POST http://localhost:8000/portfolios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Growth Portfolio",
    "code": "GROWTH",
    "inception_date": "2024-01-01",
    "portfolio_type": "managed",
    "risk_profile": "aggressive"
  }'

# List portfolios
curl http://localhost:8000/portfolios?active_only=true&limit=50 \
  -H "Authorization: Bearer $TOKEN"

# Add holding
curl -X POST http://localhost:8000/portfolios/port-001/holdings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "security_id": "sec-AAPL",
    "quantity": "100",
    "cost_basis": "150.00",
    "acquisition_date": "2024-01-15"
  }'

# Record transaction
curl -X POST http://localhost:8000/portfolios/port-001/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "security_id": "sec-AAPL",
    "transaction_type": "buy",
    "transaction_date": "2024-01-15",
    "quantity": "100",
    "price": "150.00",
    "commission": "10.00"
  }'

# Calculate NAV
curl -X POST http://localhost:8000/portfolios/port-001/valuations/calculate \
  -H "Authorization: Bearer $TOKEN"

# Get health scan
curl http://localhost:8000/portfolios/port-001/health \
  -H "Authorization: Bearer $TOKEN"
```

## Analytics Endpoints

### Ratios

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/securities/{id}/ratios` | Get security ratios |
| GET | `/securities/{id}/ratios/history` | Get ratio history |
| POST | `/analytics/ratios/calculate` | Calculate ratios |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Get user alerts |
| PUT | `/alerts/{id}/acknowledge` | Acknowledge alert |
| PUT | `/alerts/{id}/dismiss` | Dismiss alert |
| PUT | `/alerts/{id}/resolve` | Resolve alert |

### Thresholds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/thresholds` | Get thresholds |
| POST | `/thresholds` | Create/update threshold |
| DELETE | `/thresholds/{id}` | Delete threshold |
| POST | `/analytics/thresholds/check` | Check all thresholds |

### Peer Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/peer-groups` | List peer groups |
| POST | `/peer-groups` | Create peer group |
| PUT | `/peer-groups/{id}` | Update peer group |
| DELETE | `/peer-groups/{id}` | Delete peer group |

### Benchmarking & Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/securities/{id}/benchmark` | Benchmark vs peers |
| GET | `/securities/{id}/trend` | Get ratio trend |

### Examples

```bash
# Get security ratios
curl http://localhost:8000/securities/sec-AAPL/ratios \
  -H "Authorization: Bearer $TOKEN"

# Configure threshold
curl -X POST http://localhost:8000/thresholds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ratio_class": "liquidity",
    "ratio_name": "current_ratio",
    "warning_threshold": "1.5",
    "critical_threshold": "1.0",
    "comparison": "lt"
  }'

# Get alerts
curl "http://localhost:8000/alerts?status=active&severity=critical" \
  -H "Authorization: Bearer $TOKEN"

# Acknowledge alert
curl -X PUT http://localhost:8000/alerts/alert-001/acknowledge \
  -H "Authorization: Bearer $TOKEN"

# Create peer group
curl -X POST http://localhost:8000/peer-groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Giants",
    "security_ids": ["sec-AAPL", "sec-MSFT", "sec-GOOGL"],
    "group_type": "custom"
  }'

# Benchmark security
curl "http://localhost:8000/securities/sec-AAPL/benchmark?peer_group_id=peer-001" \
  -H "Authorization: Bearer $TOKEN"
```

## User Endpoints

### Current User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update current user |
| GET | `/users/me/preferences` | Get preferences |
| PUT | `/users/me/preferences` | Update preferences |

### User Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Deactivate user |

### Examples

```bash
# Get current user
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer $TOKEN"

# Update preferences
curl -X PUT http://localhost:8000/users/me/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "en",
    "default_dashboard": "analytics"
  }'

# Create user (admin)
curl -X POST http://localhost:8000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "securepass123",
    "role": "viewer"
  }'
```

## Admin Endpoints

All admin endpoints require admin role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tenant` | Get tenant info |
| PUT | `/admin/tenant` | Update tenant settings |
| GET | `/admin/audit` | Get audit logs |
| GET | `/admin/metrics` | Get usage metrics |

### Examples

```bash
# Get tenant info
curl http://localhost:8000/admin/tenant \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs
curl "http://localhost:8000/admin/audit?limit=100&action=create" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get metrics
curl http://localhost:8000/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "meta": {
    "limit": 50,
    "offset": 0,
    "count": 25
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid portfolio code"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `CONFLICT` | Resource already exists |
| `FORBIDDEN` | Permission denied |
| `INTERNAL_ERROR` | Server error |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

## File Structure

```
src/arc/api/
├── __init__.py
├── app.py              # Nexus app with endpoint registration
├── auth/
│   ├── __init__.py
│   ├── dependencies.py # FastAPI dependencies
│   ├── jwt.py         # Token creation/validation
│   ├── password.py    # Password hashing
│   └── rbac.py        # Role-based access control
├── middleware/
│   └── __init__.py
└── routes/
    ├── __init__.py
    ├── admin.py       # Admin endpoints
    ├── analytics.py   # Analytics endpoints
    ├── auth.py        # Auth endpoints
    ├── portfolios.py  # Portfolio endpoints
    └── users.py       # User endpoints
```

## Running the API

```bash
# Development
uvicorn arc.api.app:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn arc.api.app:app --host 0.0.0.0 --port 8000 --workers 4
```

## Endpoint Count Summary

| Category | Endpoints |
|----------|-----------|
| Auth | 5 |
| Portfolio | 15 |
| Analytics | 20 |
| User | 8 |
| Admin | 4 |
| Health | 3 |
| **Total** | **55** |
