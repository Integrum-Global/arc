"""
Role-Based Access Control (RBAC) for ARC.

Defines:
- Role hierarchy
- Permission definitions
- Permission checking utilities
- Permission decorator for endpoints
"""

from collections.abc import Callable
from enum import Enum
from functools import wraps
from typing import Any


class Permission(str, Enum):
    """Permission definitions for ARC platform."""

    # Portfolio permissions
    PORTFOLIO_CREATE = "portfolio:create"
    PORTFOLIO_READ = "portfolio:read"
    PORTFOLIO_UPDATE = "portfolio:update"
    PORTFOLIO_DELETE = "portfolio:delete"
    HOLDINGS_MANAGE = "holdings:manage"

    # Analytics permissions
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_CONFIGURE = "analytics:configure"

    # Intelligence permissions
    INTELLIGENCE_QUERY = "intelligence:query"
    INTELLIGENCE_BRIEF = "intelligence:brief"

    # Admin permissions
    ADMIN_USERS = "admin:users"
    ADMIN_TENANT = "admin:tenant"

    # Audit permissions
    AUDIT_VIEW = "audit:view"

    # Integration permissions
    INTEGRATION_CONFIGURE = "integration:configure"
    INTEGRATION_SYNC = "integration:sync"
    INTEGRATION_VIEW = "integration:view"


class Role(str, Enum):
    """Role definitions for ARC platform."""

    ADMIN = "admin"
    INVESTMENT_MANAGER = "investment_manager"
    FAMILY_OFFICE = "family_office"
    COMPLIANCE = "compliance"
    VIEWER = "viewer"


# Role-to-permission mapping
ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.ADMIN: {
        Permission.PORTFOLIO_CREATE,
        Permission.PORTFOLIO_READ,
        Permission.PORTFOLIO_UPDATE,
        Permission.PORTFOLIO_DELETE,
        Permission.HOLDINGS_MANAGE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_CONFIGURE,
        Permission.INTELLIGENCE_QUERY,
        Permission.INTELLIGENCE_BRIEF,
        Permission.ADMIN_USERS,
        Permission.ADMIN_TENANT,
        Permission.AUDIT_VIEW,
        Permission.INTEGRATION_CONFIGURE,
        Permission.INTEGRATION_SYNC,
        Permission.INTEGRATION_VIEW,
    },
    Role.INVESTMENT_MANAGER: {
        Permission.PORTFOLIO_CREATE,
        Permission.PORTFOLIO_READ,
        Permission.PORTFOLIO_UPDATE,
        Permission.PORTFOLIO_DELETE,
        Permission.HOLDINGS_MANAGE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_CONFIGURE,
        Permission.INTELLIGENCE_QUERY,
        Permission.INTELLIGENCE_BRIEF,
        Permission.INTEGRATION_VIEW,
    },
    Role.FAMILY_OFFICE: {
        Permission.PORTFOLIO_READ,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_CONFIGURE,
        Permission.INTELLIGENCE_QUERY,
        Permission.INTELLIGENCE_BRIEF,
        Permission.INTEGRATION_VIEW,
    },
    Role.COMPLIANCE: {
        Permission.PORTFOLIO_READ,
        Permission.ANALYTICS_READ,
        Permission.INTELLIGENCE_QUERY,
        Permission.AUDIT_VIEW,
        Permission.INTEGRATION_VIEW,
    },
    Role.VIEWER: {
        Permission.PORTFOLIO_READ,
        Permission.ANALYTICS_READ,
        Permission.INTELLIGENCE_QUERY,
        Permission.INTEGRATION_VIEW,
    },
}


def get_role_permissions(role: Role | str) -> set[Permission]:
    """
    Get all permissions for a role.

    Args:
        role: Role enum or string

    Returns:
        Set of permissions for the role
    """
    if isinstance(role, str):
        try:
            role = Role(role)
        except ValueError:
            return set()

    return ROLE_PERMISSIONS.get(role, set())


def has_permission(
    user_permissions: list[str] | set[str],
    required_permission: Permission | str,
) -> bool:
    """
    Check if user has a specific permission.

    Args:
        user_permissions: List of user's permissions
        required_permission: Permission to check

    Returns:
        True if user has the permission
    """
    if isinstance(required_permission, Permission):
        required_permission = required_permission.value

    return required_permission in user_permissions


def has_any_permission(
    user_permissions: list[str] | set[str],
    required_permissions: list[Permission | str],
) -> bool:
    """
    Check if user has any of the specified permissions.

    Args:
        user_permissions: List of user's permissions
        required_permissions: Permissions to check (any one)

    Returns:
        True if user has at least one of the permissions
    """
    return any(has_permission(user_permissions, perm) for perm in required_permissions)


def has_all_permissions(
    user_permissions: list[str] | set[str],
    required_permissions: list[Permission | str],
) -> bool:
    """
    Check if user has all of the specified permissions.

    Args:
        user_permissions: List of user's permissions
        required_permissions: Permissions to check (all required)

    Returns:
        True if user has all of the permissions
    """
    return all(has_permission(user_permissions, perm) for perm in required_permissions)


class PermissionDeniedError(Exception):
    """Raised when user lacks required permission."""

    def __init__(self, permission: str, message: str | None = None):
        self.permission = permission
        self.message = message or f"Missing required permission: {permission}"
        super().__init__(self.message)


def require_permission(permission: Permission | str) -> Callable:
    """
    Decorator to require a specific permission for an endpoint.

    Usage:
        @require_permission(Permission.PORTFOLIO_CREATE)
        async def create_portfolio(current_user: dict, ...):
            ...

    The decorated function must accept a `current_user` parameter
    that contains a `permissions` list.

    Args:
        permission: Required permission

    Returns:
        Decorator function
    """
    if isinstance(permission, Permission):
        permission_value = permission.value
    else:
        permission_value = permission

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract current_user from kwargs
            current_user = kwargs.get("current_user")
            if current_user is None:
                raise PermissionDeniedError(
                    permission_value,
                    "Authentication required",
                )

            user_permissions = current_user.get("permissions", [])

            if not has_permission(user_permissions, permission_value):
                raise PermissionDeniedError(permission_value)

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_any_permission(*permissions: Permission | str) -> Callable:
    """
    Decorator to require any one of the specified permissions.

    Usage:
        @require_any_permission(Permission.PORTFOLIO_READ, Permission.ANALYTICS_READ)
        async def view_data(current_user: dict, ...):
            ...

    Args:
        permissions: Required permissions (any one)

    Returns:
        Decorator function
    """
    permission_values = [p.value if isinstance(p, Permission) else p for p in permissions]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user = kwargs.get("current_user")
            if current_user is None:
                raise PermissionDeniedError(
                    ", ".join(permission_values),
                    "Authentication required",
                )

            user_permissions = current_user.get("permissions", [])

            if not has_any_permission(user_permissions, permission_values):
                raise PermissionDeniedError(
                    ", ".join(permission_values),
                    f"Requires one of: {', '.join(permission_values)}",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_role(role: Role | str) -> Callable:
    """
    Decorator to require a specific role.

    Usage:
        @require_role(Role.ADMIN)
        async def admin_endpoint(current_user: dict, ...):
            ...

    Args:
        role: Required role

    Returns:
        Decorator function
    """
    if isinstance(role, Role):
        role_value = role.value
    else:
        role_value = role

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user = kwargs.get("current_user")
            if current_user is None:
                raise PermissionDeniedError(
                    role_value,
                    "Authentication required",
                )

            user_role = current_user.get("role")

            if user_role != role_value:
                raise PermissionDeniedError(
                    role_value,
                    f"Requires role: {role_value}",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


__all__ = [
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
]
