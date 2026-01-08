# TODO-BE-001-07: Core Module Unit Tests

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 1h
**Dependencies**: TODO-BE-001-01, TODO-BE-001-03, TODO-BE-001-04, TODO-BE-001-05

---

## Objective

Create unit tests for all core module components following the Kailash SDK 3-tier testing strategy (Tier 1: Unit Tests).

---

## Description

Implement comprehensive unit tests for:
- Configuration loading and validation
- Exception hierarchy and serialization
- Constants and enum validation

These are Tier 1 tests - no external dependencies, no database, pure unit tests.

---

## Acceptance Criteria

- [ ] `tests/` directory structure created
- [ ] `tests/__init__.py` exists
- [ ] `tests/conftest.py` with shared fixtures exists
- [ ] `tests/unit/` directory exists
- [ ] `tests/unit/core/test_config.py` with config tests
- [ ] `tests/unit/core/test_exceptions.py` with exception tests
- [ ] `tests/unit/core/test_constants.py` with enum tests
- [ ] All tests pass with `pytest tests/unit/`
- [ ] Test coverage > 80% for core module

---

## Subtasks

- [ ] Create test directory structure (Est: 5m)
  - `tests/__init__.py`
  - `tests/unit/__init__.py`
  - `tests/unit/core/__init__.py`
  - Verification: Directories exist

- [ ] Create `tests/conftest.py` (Est: 10m)
  - Environment setup fixture
  - Temporary directory fixture
  - Clean environment fixture
  - Verification: Fixtures available in tests

- [ ] Create `tests/unit/core/test_config.py` (Est: 20m)
  - Test default values load correctly
  - Test environment variable override
  - Test SecretStr masking
  - Test connection URL computation
  - Test settings caching
  - Verification: `pytest tests/unit/core/test_config.py` passes

- [ ] Create `tests/unit/core/test_exceptions.py` (Est: 15m)
  - Test ARCException base functionality
  - Test all exception types have correct HTTP status
  - Test to_dict() serialization
  - Test exception string formatting
  - Test field-specific errors in ValidationError
  - Verification: `pytest tests/unit/core/test_exceptions.py` passes

- [ ] Create `tests/unit/core/test_constants.py` (Est: 10m)
  - Test all enums serialize to strings
  - Test enum uniqueness
  - Test enum from string conversion
  - Test constant values
  - Verification: `pytest tests/unit/core/test_constants.py` passes

- [ ] Run full test suite (Est: 5m)
  - `pytest tests/unit/ -v`
  - Verify all tests pass
  - Verification: Exit code 0

---

## Test File Structure

```python
# tests/conftest.py
"""Shared test fixtures for ARC platform."""
import os
from collections.abc import Generator
from typing import Any

import pytest


@pytest.fixture
def clean_env() -> Generator[None, None, None]:
    """Fixture that clears ARC-related environment variables."""
    # Store original values
    original = {}
    arc_vars = [k for k in os.environ if k.startswith(("DB_", "API_", "PROVIDER_", "KAIZEN_"))]
    for key in arc_vars:
        original[key] = os.environ.pop(key)

    yield

    # Restore original values
    for key, value in original.items():
        os.environ[key] = value


@pytest.fixture
def sample_env_vars() -> dict[str, str]:
    """Sample environment variables for testing."""
    return {
        "ENVIRONMENT": "testing",
        "DB_HOST": "testhost",
        "DB_PORT": "5433",
        "DB_DATABASE": "testdb",
        "DB_USERNAME": "testuser",
        "DB_PASSWORD": "testpass",
        "API_PORT": "8001",
        "API_DEBUG": "true",
    }


@pytest.fixture
def set_env_vars(sample_env_vars: dict[str, str]) -> Generator[None, None, None]:
    """Set sample environment variables for testing."""
    original = {}
    for key, value in sample_env_vars.items():
        original[key] = os.environ.get(key)
        os.environ[key] = value

    yield

    for key, orig_value in original.items():
        if orig_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = orig_value
```

```python
# tests/unit/core/test_config.py
"""Unit tests for arc.core.config module."""
import os

import pytest


class TestDatabaseConfig:
    """Tests for DatabaseConfig class."""

    def test_default_values(self, clean_env):
        """Test default configuration values."""
        # Import inside test to get fresh config
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()
        assert config.host == "localhost"
        assert config.port == 5432
        assert config.database == "arc"
        assert config.pool_size == 10

    def test_env_override(self, set_env_vars):
        """Test environment variable override."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()
        assert config.host == "testhost"
        assert config.port == 5433

    def test_connection_url(self, clean_env):
        """Test connection URL computation."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()
        url = config.connection_url
        assert "postgresql://" in url
        assert "localhost:5432" in url

    def test_secret_password(self, set_env_vars):
        """Test password is SecretStr."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()
        # Should not expose password in repr
        assert "testpass" not in repr(config)
        # But can get secret value
        assert config.password.get_secret_value() == "testpass"


class TestAPIConfig:
    """Tests for APIConfig class."""

    def test_default_values(self, clean_env):
        """Test default API configuration."""
        from arc.core.config import APIConfig

        config = APIConfig()
        assert config.host == "0.0.0.0"
        assert config.port == 8000
        assert config.debug is False

    def test_debug_mode(self, set_env_vars):
        """Test debug mode from env."""
        from arc.core.config import APIConfig

        config = APIConfig()
        assert config.debug is True


class TestSettings:
    """Tests for Settings singleton."""

    def test_singleton_caching(self, clean_env):
        """Test settings are cached."""
        from arc.core.config import get_settings

        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2

    def test_environment_detection(self, clean_env):
        """Test environment property."""
        from arc.core.config import Settings

        settings = Settings()
        assert settings.is_development is True
        assert settings.is_production is False
```

```python
# tests/unit/core/test_exceptions.py
"""Unit tests for arc.core.exceptions module."""
import pytest

from arc.core.exceptions import (
    ARCException,
    AuthenticationError,
    AuthorizationError,
    ConfigurationError,
    DatabaseError,
    IntegrationError,
    NotFoundError,
    ValidationError,
    WorkflowError,
)


class TestARCException:
    """Tests for base ARCException."""

    def test_default_values(self):
        """Test default exception values."""
        exc = ARCException()
        assert exc.error_code == "ARC_ERROR"
        assert exc.http_status == 500
        assert "unexpected error" in exc.message.lower()

    def test_custom_message(self):
        """Test custom message."""
        exc = ARCException(message="Custom error")
        assert exc.message == "Custom error"
        assert str(exc) == "[ARC_ERROR] Custom error"

    def test_to_dict(self):
        """Test JSON serialization."""
        exc = ARCException(message="Test", details={"key": "value"})
        result = exc.to_dict()
        assert "error" in result
        assert result["error"]["code"] == "ARC_ERROR"
        assert result["error"]["message"] == "Test"
        assert result["error"]["details"]["key"] == "value"


class TestValidationError:
    """Tests for ValidationError."""

    def test_http_status(self):
        """Test HTTP 400 status."""
        exc = ValidationError()
        assert exc.http_status == 400

    def test_field_errors(self):
        """Test field-specific errors."""
        exc = ValidationError(
            message="Invalid input",
            field_errors={"email": ["Invalid format"], "name": ["Required"]},
        )
        assert exc.field_errors["email"] == ["Invalid format"]
        assert len(exc.field_errors) == 2


class TestNotFoundError:
    """Tests for NotFoundError."""

    def test_http_status(self):
        """Test HTTP 404 status."""
        exc = NotFoundError(resource_type="User")
        assert exc.http_status == 404

    def test_resource_info(self):
        """Test resource type and ID in message."""
        exc = NotFoundError(resource_type="Portfolio", resource_id="port-123")
        assert "Portfolio" in exc.message
        assert "port-123" in exc.message


class TestAuthenticationError:
    """Tests for AuthenticationError."""

    def test_http_status(self):
        """Test HTTP 401 status."""
        exc = AuthenticationError()
        assert exc.http_status == 401


class TestAuthorizationError:
    """Tests for AuthorizationError."""

    def test_http_status(self):
        """Test HTTP 403 status."""
        exc = AuthorizationError()
        assert exc.http_status == 403

    def test_permission_info(self):
        """Test permission details."""
        exc = AuthorizationError(
            required_permission="admin:write",
            user_permissions=["viewer:read"],
        )
        assert exc.required_permission == "admin:write"
        assert "viewer:read" in exc.user_permissions


class TestIntegrationError:
    """Tests for IntegrationError."""

    def test_http_status(self):
        """Test HTTP 502 status."""
        exc = IntegrationError(provider="EODHD")
        assert exc.http_status == 502

    def test_provider_details(self):
        """Test provider info captured."""
        exc = IntegrationError(
            provider="Capital IQ",
            operation="fetch_fundamentals",
            response_code=503,
        )
        assert exc.provider == "Capital IQ"
        assert exc.operation == "fetch_fundamentals"
        assert exc.response_code == 503


class TestWorkflowError:
    """Tests for WorkflowError."""

    def test_workflow_details(self):
        """Test workflow context captured."""
        exc = WorkflowError(
            message="Node failed",
            workflow_id="wf-123",
            node_id="node-456",
            run_id="run-789",
        )
        assert exc.workflow_id == "wf-123"
        assert exc.node_id == "node-456"
        assert exc.run_id == "run-789"
```

```python
# tests/unit/core/test_constants.py
"""Unit tests for arc.core.constants module."""
import pytest

from arc.core.constants import (
    AlertSeverity,
    AssetClass,
    Currency,
    DataProvider,
    MarketStatus,
    PortfolioType,
    RatioClass,
    SecurityType,
    SyncStatus,
    TransactionType,
    UserRole,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)


class TestPortfolioType:
    """Tests for PortfolioType enum."""

    def test_values_exist(self):
        """Test all expected values exist."""
        assert PortfolioType.MANAGED == "managed"
        assert PortfolioType.MODEL == "model"
        assert PortfolioType.BENCHMARK == "benchmark"
        assert PortfolioType.COMPOSITE == "composite"

    def test_string_serialization(self):
        """Test enum serializes to string."""
        assert str(PortfolioType.MANAGED) == "managed"

    def test_from_string(self):
        """Test enum from string."""
        assert PortfolioType("managed") == PortfolioType.MANAGED


class TestTransactionType:
    """Tests for TransactionType enum."""

    def test_core_types(self):
        """Test core transaction types exist."""
        assert TransactionType.BUY == "buy"
        assert TransactionType.SELL == "sell"
        assert TransactionType.DIVIDEND == "dividend"

    def test_all_unique(self):
        """Test all values are unique."""
        values = [t.value for t in TransactionType]
        assert len(values) == len(set(values))


class TestAlertSeverity:
    """Tests for AlertSeverity enum."""

    def test_severity_levels(self):
        """Test severity levels exist."""
        assert AlertSeverity.INFO == "info"
        assert AlertSeverity.WARNING == "warning"
        assert AlertSeverity.CRITICAL == "critical"


class TestUserRole:
    """Tests for UserRole enum."""

    def test_roles_exist(self):
        """Test all roles exist."""
        roles = [r.value for r in UserRole]
        assert "admin" in roles
        assert "investment_manager" in roles
        assert "viewer" in roles


class TestConstants:
    """Tests for constant values."""

    def test_pagination_defaults(self):
        """Test pagination constants."""
        assert DEFAULT_PAGE_SIZE == 20
        assert MAX_PAGE_SIZE == 100
        assert DEFAULT_PAGE_SIZE < MAX_PAGE_SIZE
```

---

## Risk Assessment

- **LOW**: Standard test patterns
- **MEDIUM**: Tests depend on implementation being complete
- **MITIGATION**: Create tests alongside implementation

---

## Testing Requirements

- [ ] All tests pass: `pytest tests/unit/ -v`
- [ ] Coverage check: `pytest tests/unit/ --cov=src/arc/core`
- [ ] No skipped tests (unless explicitly marked)

---

## Definition of Done

- [ ] All test files created
- [ ] All tests pass
- [ ] Coverage > 80% for core module
- [ ] `conftest.py` has reusable fixtures
- [ ] Parent todo TODO-BE-001 updated with completion status
