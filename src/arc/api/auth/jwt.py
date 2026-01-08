"""
JWT token management for ARC authentication.

Provides:
- Access token creation and validation
- Refresh token creation and validation
- Token claim extraction
- Token expiration handling
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from arc.core.config import settings

# Token configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"


class TokenError(Exception):
    """Base exception for token errors."""

    def __init__(self, message: str, code: str = "token_error"):
        self.message = message
        self.code = code
        super().__init__(message)


class TokenExpiredError(TokenError):
    """Raised when token has expired."""

    def __init__(self, message: str = "Token has expired"):
        super().__init__(message, code="token_expired")


class TokenInvalidError(TokenError):
    """Raised when token is invalid."""

    def __init__(self, message: str = "Invalid token"):
        super().__init__(message, code="token_invalid")


def create_access_token(
    user_id: str,
    tenant_id: str,
    role: str,
    permissions: list[str],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: User identifier
        tenant_id: Tenant identifier
        role: User's role
        permissions: List of permission strings
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(UTC)
    expire = now + expires_delta

    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "permissions": permissions,
        "type": "access",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.api.jwt_secret_key.get_secret_value(), algorithm=ALGORITHM)


def create_refresh_token(
    user_id: str,
    tenant_id: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT refresh token.

    Args:
        user_id: User identifier
        tenant_id: Tenant identifier
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta is None:
        expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    now = datetime.now(UTC)
    expire = now + expires_delta

    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "type": "refresh",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.api.jwt_secret_key.get_secret_value(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        TokenExpiredError: If token has expired
        TokenInvalidError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.api.jwt_secret_key.get_secret_value(),
            algorithms=[ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise TokenExpiredError() from e
    except JWTError as e:
        raise TokenInvalidError() from e


def verify_access_token(token: str) -> dict[str, Any]:
    """
    Verify an access token and return its claims.

    Args:
        token: JWT access token string

    Returns:
        Token payload with user claims

    Raises:
        TokenExpiredError: If token has expired
        TokenInvalidError: If token is invalid or not an access token
    """
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise TokenInvalidError("Not an access token")

    return payload


def verify_refresh_token(token: str) -> dict[str, Any]:
    """
    Verify a refresh token and return its claims.

    Args:
        token: JWT refresh token string

    Returns:
        Token payload with user claims

    Raises:
        TokenExpiredError: If token has expired
        TokenInvalidError: If token is invalid or not a refresh token
    """
    payload = decode_token(token)

    if payload.get("type") != "refresh":
        raise TokenInvalidError("Not a refresh token")

    return payload


def refresh_access_token(
    refresh_token: str,
    role: str,
    permissions: list[str],
) -> str:
    """
    Create a new access token from a valid refresh token.

    Args:
        refresh_token: Valid refresh token
        role: Current user role
        permissions: Current user permissions

    Returns:
        New access token

    Raises:
        TokenExpiredError: If refresh token has expired
        TokenInvalidError: If refresh token is invalid
    """
    payload = verify_refresh_token(refresh_token)

    return create_access_token(
        user_id=payload["sub"],
        tenant_id=payload["tenant_id"],
        role=role,
        permissions=permissions,
    )


def get_token_claims(token: str) -> dict[str, Any]:
    """
    Extract claims from a token without full verification.

    Useful for extracting user_id for logging even if token is expired.

    Args:
        token: JWT token string

    Returns:
        Token payload (may be expired)
    """
    try:
        # Decode without verification to extract claims
        payload = jwt.decode(
            token,
            settings.api.jwt_secret_key.get_secret_value(),
            algorithms=[ALGORITHM],
            options={"verify_exp": False},
        )
        return payload
    except JWTError:
        return {}


__all__ = [
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
]
