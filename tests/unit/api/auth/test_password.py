"""Unit tests for password hashing utilities."""

from arc.api.auth.password import hash_password, needs_rehash, verify_password


class TestHashPassword:
    """Tests for password hashing."""

    def test_hash_password_returns_string(self) -> None:
        """hash_password should return a string."""
        hashed = hash_password("my_secure_password")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_returns_different_hash_each_time(self) -> None:
        """hash_password should return different hash for same password (salt)."""
        password = "my_secure_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Hashes should be different due to random salt
        assert hash1 != hash2

    def test_hash_password_is_bcrypt_format(self) -> None:
        """hash_password should return bcrypt format hash."""
        hashed = hash_password("test_password")

        # bcrypt hashes start with $2b$ or $2a$
        assert hashed.startswith("$2")


class TestVerifyPassword:
    """Tests for password verification."""

    def test_verify_correct_password(self) -> None:
        """verify_password should return True for correct password."""
        password = "my_secure_password"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self) -> None:
        """verify_password should return False for incorrect password."""
        hashed = hash_password("correct_password")

        assert verify_password("wrong_password", hashed) is False

    def test_verify_empty_password(self) -> None:
        """verify_password should handle empty password."""
        hashed = hash_password("some_password")

        assert verify_password("", hashed) is False

    def test_verify_password_case_sensitive(self) -> None:
        """verify_password should be case sensitive."""
        hashed = hash_password("Password123")

        assert verify_password("Password123", hashed) is True
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False


class TestNeedsRehash:
    """Tests for rehash detection."""

    def test_current_hash_does_not_need_rehash(self) -> None:
        """Recently created hash should not need rehash."""
        hashed = hash_password("test_password")

        # Freshly created hashes should not need rehash
        assert needs_rehash(hashed) is False


class TestPasswordExports:
    """Tests for password module exports."""

    def test_hash_password_exported(self) -> None:
        """hash_password should be exported from auth module."""
        from arc.api.auth import hash_password as exported

        assert callable(exported)

    def test_verify_password_exported(self) -> None:
        """verify_password should be exported from auth module."""
        from arc.api.auth import verify_password as exported

        assert callable(exported)

    def test_needs_rehash_exported(self) -> None:
        """needs_rehash should be exported from auth module."""
        from arc.api.auth import needs_rehash as exported

        assert callable(exported)
