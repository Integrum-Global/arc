"""
Authentication and authorization for ARC API.

This package provides:
- OAuth2 authentication (Google, Microsoft, Okta)
- JWT token management
- Role-based access control (RBAC)
- Password hashing utilities
- FastAPI dependencies for auth

Usage:
    from arc.api.auth import verify_token, require_permission, CurrentUser
    from arc.api.auth.rbac import Permission, Role

    @app.endpoint("/admin-only")
    @require_permission(Permission.ADMIN_USERS)
    async def admin_endpoint(current_user: CurrentUser) -> dict:
        return {"message": "Admin access granted"}
"""

from arc.api.auth.dependencies import (
    AuthenticationError,
    AuthorizationError,
    CurrentUser,
    OptionalUser,
    get_current_user,
    get_current_user_optional,
    get_token,
    require_permission_dependency,
)
from arc.api.auth.jwt import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REFRESH_TOKEN_EXPIRE_DAYS,
    TokenError,
    TokenExpiredError,
    TokenInvalidError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_claims,
    refresh_access_token,
    verify_access_token,
    verify_refresh_token,
)
from arc.api.auth.password import hash_password, needs_rehash, verify_password
from arc.api.auth.rbac import (
    ROLE_PERMISSIONS,
    Permission,
    PermissionDeniedError,
    Role,
    get_role_permissions,
    has_all_permissions,
    has_any_permission,
    has_permission,
    require_any_permission,
    require_permission,
    require_role,
)

__all__ = [
    # JWT
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS",
    "ALGORITHM",
    "TokenError",
    "TokenExpiredError",
    "TokenInvalidError",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "verify_access_token",
    "verify_refresh_token",
    "refresh_access_token",
    "get_token_claims",
    # Password
    "hash_password",
    "verify_password",
    "needs_rehash",
    # RBAC
    "Permission",
    "Role",
    "ROLE_PERMISSIONS",
    "get_role_permissions",
    "has_permission",
    "has_any_permission",
    "has_all_permissions",
    "PermissionDeniedError",
    "require_permission",
    "require_any_permission",
    "require_role",
    # Dependencies
    "AuthenticationError",
    "AuthorizationError",
    "get_token",
    "get_current_user",
    "get_current_user_optional",
    "require_permission_dependency",
    "CurrentUser",
    "OptionalUser",
]
