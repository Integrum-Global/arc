"""
Password hashing utilities for ARC authentication.

Uses bcrypt directly for secure password hashing.
"""

import bcrypt

# Default bcrypt cost factor (log2 of iterations)
# 12 = 4096 iterations, good balance between security and speed
_BCRYPT_ROUNDS = 12


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    # bcrypt requires bytes
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to check against

    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    """
    Check if a password hash needs to be updated.

    This checks if the hash uses a lower cost factor than current default.

    Args:
        hashed_password: Existing hashed password

    Returns:
        True if password should be rehashed
    """
    try:
        # Extract cost factor from hash
        # bcrypt hash format: $2b$XX$...
        # where XX is the cost factor
        parts = hashed_password.split("$")
        if len(parts) >= 3:
            cost = int(parts[2])
            return cost < _BCRYPT_ROUNDS
        return True
    except (ValueError, IndexError):
        return True


__all__ = [
    "hash_password",
    "verify_password",
    "needs_rehash",
]
