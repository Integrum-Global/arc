# Authentication & Authorization

## Overview

ARC uses JWT-based authentication with Role-Based Access Control (RBAC). The auth system provides:

- **JWT Tokens**: Access tokens (15 min) and refresh tokens (7 days)
- **Password Hashing**: bcrypt with configurable work factor
- **RBAC**: Role-based permissions for fine-grained access control
- **FastAPI Integration**: Dependencies and decorators for endpoint protection

## Architecture

```
src/arc/api/auth/
├── __init__.py      # Module exports
├── jwt.py           # JWT token management
├── password.py      # Password hashing (bcrypt)
├── rbac.py          # Role-Based Access Control
└── dependencies.py  # FastAPI auth dependencies

src/arc/api/routes/
└── auth.py          # Auth endpoints
```

## JWT Token Management

### Token Types

| Type | Expiration | Purpose |
|------|------------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Obtain new access tokens |

### Creating Tokens

```python
from arc.api.auth import create_access_token, create_refresh_token

# Create access token with user claims
access_token = create_access_token(
    user_id="user-123",
    tenant_id="tenant-456",
    role="investment_manager",
    permissions=["portfolio:read", "portfolio:create"]
)

# Create refresh token
refresh_token = create_refresh_token(
    user_id="user-123",
    tenant_id="tenant-456"
)
```

### Verifying Tokens

```python
from arc.api.auth import verify_access_token, verify_refresh_token

try:
    # Verify and decode access token
    payload = verify_access_token(token)
    user_id = payload["sub"]
    tenant_id = payload["tenant_id"]
    role = payload["role"]
    permissions = payload["permissions"]
except TokenExpiredError:
    # Token has expired
    pass
except TokenInvalidError:
    # Token is invalid or malformed
    pass
```

### Token Claims Structure

**Access Token Claims**:
```json
{
  "sub": "user-123",
  "tenant_id": "tenant-456",
  "role": "investment_manager",
  "permissions": ["portfolio:read", "portfolio:create"],
  "type": "access",
  "iat": 1704067200,
  "exp": 1704068100
}
```

**Refresh Token Claims**:
```json
{
  "sub": "user-123",
  "tenant_id": "tenant-456",
  "type": "refresh",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## Password Hashing

Uses bcrypt directly for secure password hashing:

```python
from arc.api.auth import hash_password, verify_password, needs_rehash

# Hash a password
hashed = hash_password("user_password")
# Returns: "$2b$12$..."

# Verify password
if verify_password("user_password", hashed):
    print("Password correct")

# Check if hash needs upgrade (cost factor changed)
if needs_rehash(hashed):
    new_hash = hash_password("user_password")
```

### Cost Factor

Default bcrypt cost factor is 12 (4096 iterations). This provides:
- ~250ms hash time on modern hardware
- Good balance of security and performance
- Configurable via `_BCRYPT_ROUNDS` constant

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `investment_manager` | Manage portfolios and holdings |
| `family_office` | View portfolios, query analytics |
| `compliance` | Audit access, read-only portfolios |
| `viewer` | Read-only access |

### Permissions

```python
from arc.api.auth import Permission

# Portfolio permissions
Permission.PORTFOLIO_CREATE   # "portfolio:create"
Permission.PORTFOLIO_READ     # "portfolio:read"
Permission.PORTFOLIO_UPDATE   # "portfolio:update"
Permission.PORTFOLIO_DELETE   # "portfolio:delete"
Permission.HOLDINGS_MANAGE    # "holdings:manage"

# Analytics permissions
Permission.ANALYTICS_READ      # "analytics:read"
Permission.ANALYTICS_CONFIGURE # "analytics:configure"

# Intelligence permissions
Permission.INTELLIGENCE_QUERY  # "intelligence:query"
Permission.INTELLIGENCE_BRIEF  # "intelligence:brief"

# Admin permissions
Permission.ADMIN_USERS   # "admin:users"
Permission.ADMIN_TENANT  # "admin:tenant"
Permission.AUDIT_VIEW    # "audit:view"
```

### Permission Checking

```python
from arc.api.auth import (
    has_permission,
    has_any_permission,
    has_all_permissions,
    get_role_permissions
)

user_perms = ["portfolio:read", "portfolio:create"]

# Check single permission
if has_permission(user_perms, Permission.PORTFOLIO_READ):
    print("Can read portfolios")

# Check any of multiple permissions
if has_any_permission(user_perms, [Permission.ADMIN_USERS, Permission.PORTFOLIO_CREATE]):
    print("Has at least one required permission")

# Check all permissions
if has_all_permissions(user_perms, [Permission.PORTFOLIO_READ, Permission.PORTFOLIO_CREATE]):
    print("Has all required permissions")

# Get permissions for a role
admin_perms = get_role_permissions("admin")
```

## FastAPI Integration

### Auth Dependencies

```python
from arc.api.auth import CurrentUser, OptionalUser, get_current_user

@app.get("/protected")
async def protected_endpoint(current_user: CurrentUser):
    """Requires authentication."""
    return {"user_id": current_user["user_id"]}

@app.get("/optional")
async def optional_endpoint(user: OptionalUser):
    """Authentication optional."""
    if user:
        return {"user_id": user["user_id"]}
    return {"message": "anonymous"}
```

### Permission Decorators

```python
from arc.api.auth import require_permission, require_any_permission, require_role

@require_permission(Permission.PORTFOLIO_READ)
async def get_portfolio(current_user: CurrentUser):
    """Requires portfolio:read permission."""
    pass

@require_any_permission(Permission.ADMIN_USERS, Permission.ADMIN_TENANT)
async def admin_action(current_user: CurrentUser):
    """Requires any admin permission."""
    pass

@require_role(Role.ADMIN)
async def admin_only(current_user: CurrentUser):
    """Requires admin role."""
    pass
```

### Error Handling

```python
from arc.api.auth import (
    AuthenticationError,
    AuthorizationError,
    PermissionDeniedError,
    TokenExpiredError,
    TokenInvalidError
)

# Authentication errors (401)
try:
    user = await get_current_user(token)
except AuthenticationError as e:
    # Invalid or expired token
    pass

# Authorization errors (403)
try:
    await protected_endpoint(user)
except AuthorizationError as e:
    # User lacks required permissions
    pass
except PermissionDeniedError as e:
    # Specific permission denied
    print(f"Missing permission: {e.permission}")
```

## Auth Endpoints

### POST /auth/login

Authenticate user and return tokens:

```bash
curl -X POST /auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### POST /auth/register

Register new user:

```bash
curl -X POST /auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### GET /auth/me

Get current user info (requires auth):

```bash
curl -X GET /auth/me \
  -H "Authorization: Bearer eyJ..."
```

Response:
```json
{
  "user_id": "user-123",
  "tenant_id": "tenant-456",
  "email": "user@example.com",
  "role": "investment_manager",
  "permissions": ["portfolio:read", "portfolio:create"]
}
```

### POST /auth/refresh

Refresh access token:

```bash
curl -X POST /auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### POST /auth/logout

Logout (invalidate refresh token):

```bash
curl -X POST /auth/logout \
  -H "Authorization: Bearer eyJ..."
```

## Configuration

JWT configuration in `src/arc/core/config.py`:

```python
class APIConfig(BaseModel):
    jwt_secret_key: SecretStr = Field(
        default=SecretStr("change-me-in-production"),
        description="Secret key for JWT signing"
    )
```

Set via environment variable:
```bash
export ARC_API__JWT_SECRET_KEY="your-secure-secret-key-here"
```

## Security Best Practices

1. **JWT Secret**: Use a strong, random secret key (32+ bytes)
2. **Token Storage**: Store tokens securely (httpOnly cookies or secure storage)
3. **HTTPS**: Always use HTTPS in production
4. **Token Refresh**: Implement token rotation on refresh
5. **Rate Limiting**: Protect auth endpoints from brute force
6. **Password Policy**: Enforce minimum password requirements

## Testing

```bash
# Run auth tests
uv run pytest tests/unit/api/auth/ -v

# Test specific module
uv run pytest tests/unit/api/auth/test_jwt.py -v
uv run pytest tests/unit/api/auth/test_rbac.py -v
uv run pytest tests/unit/api/auth/test_password.py -v
```

## Module Exports

All auth components are exported from `arc.api.auth`:

```python
from arc.api.auth import (
    # JWT
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token,
    decode_token,
    refresh_access_token,
    get_token_claims,
    TokenError,
    TokenExpiredError,
    TokenInvalidError,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    ALGORITHM,

    # Password
    hash_password,
    verify_password,
    needs_rehash,

    # RBAC
    Permission,
    Role,
    ROLE_PERMISSIONS,
    has_permission,
    has_any_permission,
    has_all_permissions,
    get_role_permissions,
    require_permission,
    require_any_permission,
    require_role,
    PermissionDeniedError,

    # Dependencies
    get_current_user,
    get_current_user_optional,
    CurrentUser,
    OptionalUser,
    AuthenticationError,
    AuthorizationError,
)
```
