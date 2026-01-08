"""
FastAPI dependencies for authentication.

Provides:
- Token extraction from headers
- Current user dependency injection
- Permission checking dependencies
"""

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from arc.api.auth.jwt import (
    TokenExpiredError,
    TokenInvalidError,
    verify_access_token,
)
from arc.api.auth.rbac import Permission, has_permission

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


class AuthenticationError(HTTPException):
    """Authentication failed."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Authorization failed - insufficient permissions."""

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


async def get_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    """
    Extract Bearer token from Authorization header.

    Args:
        credentials: HTTP authorization credentials

    Returns:
        Token string

    Raises:
        AuthenticationError: If no token provided
    """
    if credentials is None:
        raise AuthenticationError("No authorization header")

    return credentials.credentials


async def get_current_user(
    token: Annotated[str, Depends(get_token)],
) -> dict[str, Any]:
    """
    Get current user from JWT token.

    Args:
        token: JWT access token

    Returns:
        User claims dictionary with:
        - user_id: User identifier
        - tenant_id: Tenant identifier
        - role: User role
        - permissions: List of permissions

    Raises:
        AuthenticationError: If token is invalid or expired
    """
    try:
        payload = verify_access_token(token)
        return {
            "user_id": payload["sub"],
            "tenant_id": payload["tenant_id"],
            "role": payload["role"],
            "permissions": payload["permissions"],
        }
    except TokenExpiredError as e:
        raise AuthenticationError("Token has expired") from e
    except TokenInvalidError as e:
        raise AuthenticationError("Invalid token") from e


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any] | None:
    """
    Get current user if authenticated, None otherwise.

    Useful for endpoints that work both authenticated and unauthenticated.

    Args:
        credentials: HTTP authorization credentials

    Returns:
        User claims dictionary or None
    """
    if credentials is None:
        return None

    try:
        payload = verify_access_token(credentials.credentials)
        return {
            "user_id": payload["sub"],
            "tenant_id": payload["tenant_id"],
            "role": payload["role"],
            "permissions": payload["permissions"],
        }
    except (TokenExpiredError, TokenInvalidError):
        return None


def require_permission_dependency(permission: Permission | str):
    """
    Create a dependency that requires a specific permission.

    Usage:
        @app.get("/portfolios")
        async def list_portfolios(
            _: None = Depends(require_permission_dependency(Permission.PORTFOLIO_READ)),
            current_user: dict = Depends(get_current_user),
        ):
            ...

    Args:
        permission: Required permission

    Returns:
        FastAPI dependency function
    """
    if isinstance(permission, Permission):
        permission_value = permission.value
    else:
        permission_value = permission

    async def check_permission(
        current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ) -> None:
        user_permissions = current_user.get("permissions", [])
        if not has_permission(user_permissions, permission_value):
            raise AuthorizationError(f"Missing permission: {permission_value}")

    return check_permission


# Type aliases for dependency injection
CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
OptionalUser = Annotated[dict[str, Any] | None, Depends(get_current_user_optional)]


__all__ = [
    "AuthenticationError",
    "AuthorizationError",
    "get_token",
    "get_current_user",
    "get_current_user_optional",
    "require_permission_dependency",
    "CurrentUser",
    "OptionalUser",
]
