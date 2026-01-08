"""
User API routes for ARC.

Endpoints:
- GET /users/me - Get current user
- PUT /users/me - Update current user
- GET /users/me/preferences - Get preferences
- PUT /users/me/preferences - Update preferences
- GET /users - List users (admin)
- POST /users - Create user (admin)
- PUT /users/{id} - Update user (admin)
- DELETE /users/{id} - Deactivate user (admin)
"""

from typing import Any

from pydantic import BaseModel, EmailStr, Field

from arc.api.auth import CurrentUser, hash_password
from arc.models import db
from arc.services import NotFoundError, ValidationError

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class UpdateMeRequest(BaseModel):
    """Update current user request body."""

    name: str | None = None
    phone: str | None = None
    timezone: str | None = None


class UpdatePreferencesRequest(BaseModel):
    """Update preferences request body."""

    theme: str | None = None
    language: str | None = None
    default_portfolio_view: str | None = None
    date_format: str | None = None
    number_format: str | None = None
    default_dashboard: str | None = None


class CreateUserRequest(BaseModel):
    """Create user request body (admin)."""

    email: EmailStr
    name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8)
    role: str = "viewer"


class UpdateUserRequest(BaseModel):
    """Update user request body (admin)."""

    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    status: str | None = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def format_error(e: Exception) -> dict[str, Any]:
    """Format exception as error response."""
    if isinstance(e, NotFoundError):
        return {"success": False, "error": {"code": "NOT_FOUND", "message": str(e)}}
    if isinstance(e, ValidationError):
        return {"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}
    return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}


def generate_id(prefix: str = "user-") -> str:
    """Generate a unique ID with prefix."""
    import uuid
    from datetime import UTC, datetime

    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"{prefix}{timestamp}-{short_uuid}"


# =============================================================================
# CURRENT USER ENDPOINTS
# =============================================================================


async def get_me(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get current user profile.

    Args:
        current_user: Authenticated user

    Returns:
        User profile data
    """
    try:
        user = await db.express.read("User", current_user["user_id"])
        if not user:
            return format_error(NotFoundError("User not found"))

        return {
            "success": True,
            "data": {
                "id": user["id"],
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role"),
                "tenant_id": user.get("tenant_id"),
                "status": user.get("status"),
                "phone": user.get("phone"),
                "timezone": user.get("timezone"),
                "created_at": user.get("created_at"),
                "last_login_at": user.get("last_login_at"),
            },
        }
    except Exception as e:
        return format_error(e)


async def update_me(
    current_user: CurrentUser,
    data: UpdateMeRequest,
) -> dict[str, Any]:
    """
    Update current user profile.

    Args:
        current_user: Authenticated user
        data: Update data

    Returns:
        Updated user profile
    """
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "No updates provided"},
            }

        user = await db.express.update(
            "User",
            filter={"id": current_user["user_id"]},
            fields=updates,
        )

        if not user:
            return format_error(NotFoundError("User not found"))

        return {
            "success": True,
            "data": {
                "id": user["id"],
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role"),
                "phone": user.get("phone"),
                "timezone": user.get("timezone"),
            },
        }
    except Exception as e:
        return format_error(e)


async def get_preferences(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get user preferences.

    Args:
        current_user: Authenticated user

    Returns:
        User preferences
    """
    try:
        prefs = await db.express.list(
            "UserPreference",
            filter={"user_id": current_user["user_id"]},
            limit=1,
        )

        if not prefs:
            # Return defaults
            return {
                "success": True,
                "data": {
                    "theme": "light",
                    "language": "en",
                    "default_portfolio_view": "summary",
                    "date_format": "YYYY-MM-DD",
                    "number_format": "en-US",
                    "default_dashboard": "overview",
                },
            }

        pref = prefs[0]
        return {
            "success": True,
            "data": {
                "theme": pref.get("theme", "light"),
                "language": pref.get("language", "en"),
                "default_portfolio_view": pref.get("default_portfolio_view", "summary"),
                "date_format": pref.get("date_format", "YYYY-MM-DD"),
                "number_format": pref.get("number_format", "en-US"),
                "default_dashboard": pref.get("default_dashboard", "overview"),
            },
        }
    except Exception as e:
        return format_error(e)


async def update_preferences(
    current_user: CurrentUser,
    data: UpdatePreferencesRequest,
) -> dict[str, Any]:
    """
    Update user preferences.

    Args:
        current_user: Authenticated user
        data: Preference updates

    Returns:
        Updated preferences
    """
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "No updates provided"},
            }

        # Check if preferences exist
        prefs = await db.express.list(
            "UserPreference",
            filter={"user_id": current_user["user_id"]},
            limit=1,
        )

        if prefs:
            # Update existing
            pref = await db.express.update(
                "UserPreference",
                filter={"id": prefs[0]["id"]},
                fields=updates,
            )
        else:
            # Create new
            pref = await db.express.create(
                "UserPreference",
                {
                    "id": generate_id("pref-"),
                    "user_id": current_user["user_id"],
                    "tenant_id": current_user["tenant_id"],
                    **updates,
                },
            )

        return {
            "success": True,
            "data": {
                "theme": pref.get("theme", "light"),
                "language": pref.get("language", "en"),
                "default_portfolio_view": pref.get("default_portfolio_view", "summary"),
                "date_format": pref.get("date_format", "YYYY-MM-DD"),
                "number_format": pref.get("number_format", "en-US"),
                "default_dashboard": pref.get("default_dashboard", "overview"),
            },
        }
    except Exception as e:
        return format_error(e)


# =============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# =============================================================================


async def list_users(
    current_user: CurrentUser,
    status: str | None = None,
    role: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> dict[str, Any]:
    """
    List users in tenant (admin only).

    Args:
        current_user: Authenticated user
        status: Filter by status
        role: Filter by role
        limit: Maximum results
        offset: Skip results

    Returns:
        List of users
    """
    # Check admin permission
    if "admin:manage_users" not in current_user.get("permissions", []):
        return {
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "Admin permission required"},
        }

    try:
        filter_dict: dict[str, Any] = {
            "tenant_id": current_user["tenant_id"],
            "deleted_at": {"$null": True},
        }

        if status:
            filter_dict["status"] = status
        if role:
            filter_dict["role"] = role

        users = await db.express.list("User", filter=filter_dict, limit=limit)

        # Remove sensitive fields
        sanitized = []
        for user in users:
            sanitized.append(
                {
                    "id": user["id"],
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "role": user.get("role"),
                    "status": user.get("status"),
                    "created_at": user.get("created_at"),
                    "last_login_at": user.get("last_login_at"),
                }
            )

        return {
            "success": True,
            "data": sanitized,
            "meta": {"limit": limit, "offset": offset, "count": len(sanitized)},
        }
    except Exception as e:
        return format_error(e)


async def create_user(
    current_user: CurrentUser,
    data: CreateUserRequest,
) -> dict[str, Any]:
    """
    Create a new user (admin only).

    Args:
        current_user: Authenticated user
        data: User creation data

    Returns:
        Created user
    """
    # Check admin permission
    if "admin:manage_users" not in current_user.get("permissions", []):
        return {
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "Admin permission required"},
        }

    try:
        # Check for duplicate email
        existing = await db.express.list(
            "User",
            filter={"email": data.email, "tenant_id": current_user["tenant_id"]},
            limit=1,
        )
        if existing:
            return {
                "success": False,
                "error": {"code": "CONFLICT", "message": "Email already exists"},
            }

        # Create user
        user_id = generate_id("user-")
        password_hash = hash_password(data.password)

        user = await db.express.create(
            "User",
            {
                "id": user_id,
                "tenant_id": current_user["tenant_id"],
                "email": data.email,
                "name": data.name,
                "password_hash": password_hash,
                "role": data.role,
                "status": "active",
            },
        )

        return {
            "success": True,
            "data": {
                "id": user["id"],
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role"),
                "status": user.get("status"),
            },
        }
    except Exception as e:
        return format_error(e)


async def update_user(
    current_user: CurrentUser,
    user_id: str,
    data: UpdateUserRequest,
) -> dict[str, Any]:
    """
    Update a user (admin only).

    Args:
        current_user: Authenticated user
        user_id: User ID to update
        data: Update data

    Returns:
        Updated user
    """
    # Check admin permission
    if "admin:manage_users" not in current_user.get("permissions", []):
        return {
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "Admin permission required"},
        }

    try:
        # Verify user exists and is in same tenant
        user = await db.express.read("User", user_id)
        if not user:
            return format_error(NotFoundError("User not found"))

        if user.get("tenant_id") != current_user["tenant_id"]:
            return {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Cannot modify user from other tenant"},
            }

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "No updates provided"},
            }

        updated = await db.express.update("User", filter={"id": user_id}, fields=updates)

        return {
            "success": True,
            "data": {
                "id": updated["id"],
                "email": updated.get("email"),
                "name": updated.get("name"),
                "role": updated.get("role"),
                "status": updated.get("status"),
            },
        }
    except Exception as e:
        return format_error(e)


async def deactivate_user(
    current_user: CurrentUser,
    user_id: str,
) -> dict[str, Any]:
    """
    Deactivate a user (admin only).

    Args:
        current_user: Authenticated user
        user_id: User ID to deactivate

    Returns:
        Deactivation confirmation
    """
    # Check admin permission
    if "admin:manage_users" not in current_user.get("permissions", []):
        return {
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "Admin permission required"},
        }

    try:
        # Verify user exists and is in same tenant
        user = await db.express.read("User", user_id)
        if not user:
            return format_error(NotFoundError("User not found"))

        if user.get("tenant_id") != current_user["tenant_id"]:
            return {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Cannot modify user from other tenant"},
            }

        # Cannot deactivate yourself
        if user_id == current_user["user_id"]:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "Cannot deactivate yourself"},
            }

        await db.express.update("User", filter={"id": user_id}, fields={"status": "inactive"})

        return {"success": True, "data": {"deactivated": True, "user_id": user_id}}
    except Exception as e:
        return format_error(e)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "UpdateMeRequest",
    "UpdatePreferencesRequest",
    "CreateUserRequest",
    "UpdateUserRequest",
    "get_me",
    "update_me",
    "get_preferences",
    "update_preferences",
    "list_users",
    "create_user",
    "update_user",
    "deactivate_user",
]
