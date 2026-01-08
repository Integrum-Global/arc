"""
Pytest configuration and fixtures.

This file provides shared fixtures for all tests in the ARC platform.
"""

import os
import sys
from pathlib import Path

import pytest

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Set test environment
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_DATABASE", "arc_test")
os.environ.setdefault("DB_USERNAME", "arc")
os.environ.setdefault("DB_PASSWORD", "test_password")


@pytest.fixture
def test_env() -> dict[str, str]:
    """Provide test environment variables."""
    return {
        "ENVIRONMENT": "development",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_DATABASE": "arc_test",
        "DB_USERNAME": "arc_test",
        "DB_PASSWORD": "test_password",
        "API_HOST": "127.0.0.1",
        "API_PORT": "8001",
        "API_DEBUG": "true",
        "KAIZEN_PROVIDER": "anthropic",
        "KAIZEN_MODEL": "claude-sonnet-4-20250514",
    }


@pytest.fixture
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Clean environment for testing default values."""
    env_vars_to_clear = [
        "ENVIRONMENT",
        "DB_HOST",
        "DB_PORT",
        "DB_DATABASE",
        "DB_USERNAME",
        "DB_PASSWORD",
        "API_HOST",
        "API_PORT",
        "KAIZEN_PROVIDER",
    ]
    for var in env_vars_to_clear:
        monkeypatch.delenv(var, raising=False)
