"""
Authentication API routes for ARC.

Endpoints:
- POST /auth/login - Email/password login
- POST /auth/register - User registration
- GET /auth/me - Get current user
- POST /auth/refresh - Refresh access token
- POST /auth/logout - Invalidate tokens
- GET /auth/oauth/{provider} - OAuth initiation (TODO)
- GET /auth/oauth/{provider}/callback - OAuth callback (TODO)
"""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from arc.api.auth import (
    AuthenticationError,
    CurrentUser,
    create_access_token,
    create_refresh_token,
    get_role_permissions,
    hash_password,
    verify_password,
    verify_refresh_token,
)
from arc.api.auth.jwt import TokenExpiredError, TokenInvalidError
from arc.models import db

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class LoginRequest(BaseModel):
    """Login request body."""

    email: EmailStr
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    """Registration request body."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    tenant_id: str | None = None


class TokenResponse(BaseModel):
    """Token response body."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    """Token refresh request body."""

    refresh_token: str


class UserResponse(BaseModel):
    """User profile response."""

    user_id: str
    email: str
    name: str
    role: str
    tenant_id: str
    permissions: list[str]


# =============================================================================
# AUTH ENDPOINTS
# =============================================================================


async def login(data: LoginRequest) -> dict[str, Any]:
    """
    Authenticate user with email and password.

    Args:
        data: Login credentials

    Returns:
        Access and refresh tokens

    Raises:
        AuthenticationError: If credentials are invalid
    """
    # Find user by email
    try:
        users = await db.express.list(
            "User",
            filter={"email": data.email},
            limit=1,
        )
    except Exception as e:
        raise AuthenticationError("Invalid credentials") from e

    if not users:
        raise AuthenticationError("Invalid credentials")

    user = users[0]

    # Verify password
    if not user.get("password_hash"):
        raise AuthenticationError("Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise AuthenticationError("Invalid credentials")

    # Check if user is active
    if user.get("status") != "active":
        raise AuthenticationError("Account is not active")

    # Get role permissions
    role = user.get("role", "viewer")
    permissions = [p.value for p in get_role_permissions(role)]

    # Create tokens
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
        role=role,
        permissions=permissions,
    )

    refresh_token = create_refresh_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
    )

    # Update last login timestamp
    try:
        await db.express.update(
            "User",
            user["id"],
            {"last_login_at": datetime.now(UTC).isoformat()},
        )
    except Exception:
        pass  # Non-critical, continue

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900,  # 15 minutes
    }


async def register(data: RegisterRequest) -> dict[str, Any]:
    """
    Register a new user.

    Args:
        data: Registration data

    Returns:
        Access and refresh tokens

    Raises:
        AuthenticationError: If registration fails
    """
    # Check if email already exists
    try:
        existing = await db.express.list(
            "User",
            filter={"email": data.email},
            limit=1,
        )
        if existing:
            raise AuthenticationError("Email already registered")
    except AuthenticationError:
        raise
    except Exception:
        pass  # Continue with registration

    # Hash password
    password_hash = hash_password(data.password)

    # Determine tenant - for now, require tenant_id
    tenant_id = data.tenant_id
    if not tenant_id:
        # Create a default tenant for the user
        try:
            tenant = await db.express.create(
                "Tenant",
                {
                    "id": f"tenant-{datetime.now(UTC).timestamp()}",
                    "name": f"{data.name}'s Organization",
                    "status": "active",
                    "plan": "free",
                    "settings": {},
                },
            )
            tenant_id = tenant["id"]
        except Exception as e:
            raise AuthenticationError(f"Failed to create tenant: {str(e)}") from e

    # Create user
    try:
        user_id = f"user-{datetime.now(UTC).timestamp()}"
        user = await db.express.create(
            "User",
            {
                "id": user_id,
                "tenant_id": tenant_id,
                "email": data.email,
                "name": data.name,
                "password_hash": password_hash,
                "role": "viewer",  # Default role
                "status": "active",
                "preferences": {},
            },
        )
    except Exception as e:
        raise AuthenticationError(f"Failed to create user: {str(e)}") from e

    # Get role permissions
    role = "viewer"
    permissions = [p.value for p in get_role_permissions(role)]

    # Create tokens
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=tenant_id,
        role=role,
        permissions=permissions,
    )

    refresh_token = create_refresh_token(
        user_id=user["id"],
        tenant_id=tenant_id,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900,
        "user": {
            "user_id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": role,
            "tenant_id": tenant_id,
        },
    }


async def get_me(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get current user profile.

    Args:
        current_user: Authenticated user from token

    Returns:
        User profile data
    """
    # Fetch full user data
    try:
        user = await db.express.read("User", current_user["user_id"])
    except Exception as e:
        raise AuthenticationError("User not found") from e

    if not user:
        raise AuthenticationError("User not found")

    return {
        "user_id": user["id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "role": current_user["role"],
        "tenant_id": current_user["tenant_id"],
        "permissions": current_user["permissions"],
        "status": user.get("status", "active"),
        "created_at": user.get("created_at"),
        "last_login_at": user.get("last_login_at"),
    }


async def refresh_tokens(data: RefreshRequest) -> dict[str, Any]:
    """
    Refresh access token using refresh token.

    Args:
        data: Refresh token

    Returns:
        New access and refresh tokens

    Raises:
        AuthenticationError: If refresh token is invalid
    """
    try:
        payload = verify_refresh_token(data.refresh_token)
    except TokenExpiredError as e:
        raise AuthenticationError("Refresh token expired") from e
    except TokenInvalidError as e:
        raise AuthenticationError("Invalid refresh token") from e

    # Get current user data to refresh role/permissions
    try:
        user = await db.express.read("User", payload["sub"])
    except Exception as e:
        raise AuthenticationError("User not found") from e

    if not user:
        raise AuthenticationError("User not found")

    if user.get("status") != "active":
        raise AuthenticationError("Account is not active")

    # Get role permissions
    role = user.get("role", "viewer")
    permissions = [p.value for p in get_role_permissions(role)]

    # Create new tokens
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=payload["tenant_id"],
        role=role,
        permissions=permissions,
    )

    new_refresh_token = create_refresh_token(
        user_id=user["id"],
        tenant_id=payload["tenant_id"],
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": 900,
    }


async def logout(current_user: CurrentUser) -> dict[str, Any]:
    """
    Logout user and invalidate tokens.

    Note: With stateless JWT, we can't truly invalidate tokens.
    This endpoint is provided for API completeness.
    In production, consider using a token blacklist with Redis.

    Args:
        current_user: Authenticated user

    Returns:
        Logout confirmation
    """
    # In a stateful implementation, you would:
    # 1. Add token to blacklist
    # 2. Clear session data
    # 3. Update last logout timestamp

    return {
        "message": "Logged out successfully",
        "user_id": current_user["user_id"],
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "RefreshRequest",
    "UserResponse",
    "login",
    "register",
    "get_me",
    "refresh_tokens",
    "logout",
]
