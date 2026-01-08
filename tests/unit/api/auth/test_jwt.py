"""Unit tests for JWT token management."""

from datetime import timedelta

import pytest

from arc.api.auth.jwt import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REFRESH_TOKEN_EXPIRE_DAYS,
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


class TestJWTConstants:
    """Tests for JWT constants."""

    def test_access_token_expire_minutes(self) -> None:
        """Access token should expire in 15 minutes."""
        assert ACCESS_TOKEN_EXPIRE_MINUTES == 15

    def test_refresh_token_expire_days(self) -> None:
        """Refresh token should expire in 7 days."""
        assert REFRESH_TOKEN_EXPIRE_DAYS == 7

    def test_algorithm(self) -> None:
        """Algorithm should be HS256."""
        assert ALGORITHM == "HS256"


class TestCreateAccessToken:
    """Tests for access token creation."""

    def test_create_access_token_returns_string(self) -> None:
        """create_access_token should return a string."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=["portfolio:read"],
        )
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_contains_claims(self) -> None:
        """Access token should contain correct claims."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=["portfolio:read", "portfolio:create"],
        )
        claims = get_token_claims(token)

        assert claims["sub"] == "user-123"
        assert claims["tenant_id"] == "tenant-456"
        assert claims["role"] == "admin"
        assert claims["permissions"] == ["portfolio:read", "portfolio:create"]
        assert claims["type"] == "access"

    def test_create_access_token_with_custom_expiry(self) -> None:
        """Access token should support custom expiry."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="viewer",
            permissions=[],
            expires_delta=timedelta(hours=1),
        )
        claims = get_token_claims(token)
        assert claims["type"] == "access"


class TestCreateRefreshToken:
    """Tests for refresh token creation."""

    def test_create_refresh_token_returns_string(self) -> None:
        """create_refresh_token should return a string."""
        token = create_refresh_token(
            user_id="user-123",
            tenant_id="tenant-456",
        )
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token_contains_claims(self) -> None:
        """Refresh token should contain correct claims."""
        token = create_refresh_token(
            user_id="user-123",
            tenant_id="tenant-456",
        )
        claims = get_token_claims(token)

        assert claims["sub"] == "user-123"
        assert claims["tenant_id"] == "tenant-456"
        assert claims["type"] == "refresh"
        # Refresh tokens should not contain role/permissions
        assert "role" not in claims
        assert "permissions" not in claims


class TestVerifyAccessToken:
    """Tests for access token verification."""

    def test_verify_valid_access_token(self) -> None:
        """Valid access token should be verified successfully."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=["portfolio:read"],
        )
        payload = verify_access_token(token)

        assert payload["sub"] == "user-123"
        assert payload["tenant_id"] == "tenant-456"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"

    def test_verify_access_token_rejects_refresh_token(self) -> None:
        """verify_access_token should reject refresh tokens."""
        refresh_token = create_refresh_token(
            user_id="user-123",
            tenant_id="tenant-456",
        )

        with pytest.raises(TokenInvalidError) as exc_info:
            verify_access_token(refresh_token)

        assert "Not an access token" in str(exc_info.value)

    def test_verify_access_token_rejects_invalid_token(self) -> None:
        """verify_access_token should reject invalid tokens."""
        with pytest.raises(TokenInvalidError):
            verify_access_token("invalid-token")

    def test_verify_expired_access_token(self) -> None:
        """verify_access_token should reject expired tokens."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=[],
            expires_delta=timedelta(seconds=-1),  # Already expired
        )

        with pytest.raises(TokenExpiredError):
            verify_access_token(token)


class TestVerifyRefreshToken:
    """Tests for refresh token verification."""

    def test_verify_valid_refresh_token(self) -> None:
        """Valid refresh token should be verified successfully."""
        token = create_refresh_token(
            user_id="user-123",
            tenant_id="tenant-456",
        )
        payload = verify_refresh_token(token)

        assert payload["sub"] == "user-123"
        assert payload["tenant_id"] == "tenant-456"
        assert payload["type"] == "refresh"

    def test_verify_refresh_token_rejects_access_token(self) -> None:
        """verify_refresh_token should reject access tokens."""
        access_token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=[],
        )

        with pytest.raises(TokenInvalidError) as exc_info:
            verify_refresh_token(access_token)

        assert "Not a refresh token" in str(exc_info.value)


class TestDecodeToken:
    """Tests for token decoding."""

    def test_decode_valid_token(self) -> None:
        """decode_token should decode valid tokens."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=["test"],
        )
        payload = decode_token(token)
        assert payload["sub"] == "user-123"

    def test_decode_invalid_token_raises_error(self) -> None:
        """decode_token should raise TokenInvalidError for invalid tokens."""
        with pytest.raises(TokenInvalidError):
            decode_token("not.a.valid.token")


class TestRefreshAccessToken:
    """Tests for refreshing access tokens."""

    def test_refresh_access_token_creates_new_token(self) -> None:
        """refresh_access_token should create new access token."""
        refresh_token = create_refresh_token(
            user_id="user-123",
            tenant_id="tenant-456",
        )

        new_access_token = refresh_access_token(
            refresh_token=refresh_token,
            role="admin",
            permissions=["new:permission"],
        )

        payload = verify_access_token(new_access_token)
        assert payload["sub"] == "user-123"
        assert payload["tenant_id"] == "tenant-456"
        assert payload["role"] == "admin"
        assert payload["permissions"] == ["new:permission"]

    def test_refresh_with_invalid_token_raises_error(self) -> None:
        """refresh_access_token should raise error for invalid refresh token."""
        with pytest.raises(TokenInvalidError):
            refresh_access_token(
                refresh_token="invalid-token",
                role="admin",
                permissions=[],
            )


class TestGetTokenClaims:
    """Tests for extracting token claims."""

    def test_get_claims_from_valid_token(self) -> None:
        """get_token_claims should extract claims from valid token."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=["test"],
        )
        claims = get_token_claims(token)

        assert claims["sub"] == "user-123"
        assert claims["tenant_id"] == "tenant-456"

    def test_get_claims_from_expired_token(self) -> None:
        """get_token_claims should extract claims even from expired tokens."""
        token = create_access_token(
            user_id="user-123",
            tenant_id="tenant-456",
            role="admin",
            permissions=[],
            expires_delta=timedelta(seconds=-1),
        )
        claims = get_token_claims(token)

        # Should still get claims even if expired
        assert claims["sub"] == "user-123"

    def test_get_claims_from_invalid_token_returns_empty(self) -> None:
        """get_token_claims should return empty dict for invalid tokens."""
        claims = get_token_claims("invalid-token")
        assert claims == {}


class TestTokenErrors:
    """Tests for token error classes."""

    def test_token_error_has_message_and_code(self) -> None:
        """TokenError should have message and code."""
        from arc.api.auth.jwt import TokenError

        error = TokenError("Test message", "test_code")
        assert error.message == "Test message"
        assert error.code == "test_code"

    def test_token_expired_error_defaults(self) -> None:
        """TokenExpiredError should have default message and code."""
        error = TokenExpiredError()
        assert error.message == "Token has expired"
        assert error.code == "token_expired"

    def test_token_invalid_error_defaults(self) -> None:
        """TokenInvalidError should have default message and code."""
        error = TokenInvalidError()
        assert error.message == "Invalid token"
        assert error.code == "token_invalid"
