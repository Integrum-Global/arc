"""Unit tests for configuration module."""

import pytest
from pydantic import SecretStr


class TestDatabaseConfig:
    """Tests for DatabaseConfig."""

    def test_default_values(self, clean_env: None) -> None:
        """Test default configuration values."""
        # Clear cache before importing to get fresh instance
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()

        assert config.host == "localhost"
        assert config.port == 5432
        assert config.database == "arc"
        assert config.username == "arc"
        assert config.pool_size == 10
        assert config.max_overflow == 20

    def test_connection_url_format(self, clean_env: None) -> None:
        """Test connection URL is properly formatted."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig(
            host="db.example.com",
            port=5433,
            database="testdb",
            username="testuser",
            password=SecretStr("testpass"),
        )

        assert config.connection_url == "postgresql://testuser:testpass@db.example.com:5433/testdb"

    def test_async_connection_url_format(self, clean_env: None) -> None:
        """Test async connection URL includes asyncpg driver."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig(
            host="db.example.com",
            port=5433,
            database="testdb",
            username="testuser",
            password=SecretStr("testpass"),
        )

        assert config.async_connection_url == (
            "postgresql+asyncpg://testuser:testpass@db.example.com:5433/testdb"
        )

    def test_loads_from_environment(self, monkeypatch: pytest.MonkeyPatch, clean_env: None) -> None:
        """Test configuration loads from environment variables."""
        monkeypatch.setenv("DB_HOST", "env-host")
        monkeypatch.setenv("DB_PORT", "5434")
        monkeypatch.setenv("DB_DATABASE", "env-db")

        from arc.core.config import DatabaseConfig

        config = DatabaseConfig()

        assert config.host == "env-host"
        assert config.port == 5434
        assert config.database == "env-db"


class TestAPIConfig:
    """Tests for APIConfig."""

    def test_default_values(self, clean_env: None) -> None:
        """Test default API configuration."""
        from arc.core.config import APIConfig

        config = APIConfig()

        assert config.host == "0.0.0.0"
        assert config.port == 8000
        assert config.debug is False
        assert config.api_prefix == "/api/v1"
        assert config.docs_url == "/docs"

    def test_rate_limit_defaults(self, clean_env: None) -> None:
        """Test rate limiting configuration defaults."""
        from arc.core.config import APIConfig

        config = APIConfig()

        assert config.rate_limit_requests == 100
        assert config.rate_limit_period == 60

    def test_jwt_configuration(self, clean_env: None) -> None:
        """Test JWT configuration defaults."""
        from arc.core.config import APIConfig

        config = APIConfig()

        assert config.jwt_algorithm == "HS256"
        assert config.jwt_expiration_minutes == 60
        assert config.jwt_refresh_expiration_days == 7


class TestKaizenConfig:
    """Tests for KaizenConfig."""

    def test_default_provider(self, clean_env: None) -> None:
        """Test default AI provider is Anthropic."""
        from arc.core.config import KaizenConfig

        config = KaizenConfig()

        assert config.provider == "anthropic"
        assert "claude" in config.model.lower()

    def test_model_settings(self, clean_env: None) -> None:
        """Test model configuration defaults."""
        from arc.core.config import KaizenConfig

        config = KaizenConfig()

        assert config.temperature == 0.7
        assert config.max_tokens == 4096

    def test_memory_settings(self, clean_env: None) -> None:
        """Test memory configuration defaults."""
        from arc.core.config import KaizenConfig

        config = KaizenConfig()

        assert config.memory_type == "buffer"
        assert config.max_memory_items == 100


class TestSettings:
    """Tests for aggregated Settings."""

    def test_settings_singleton(self) -> None:
        """Test settings returns cached instance."""
        from arc.core.config import get_settings

        # Clear cache for fresh test
        get_settings.cache_clear()

        settings1 = get_settings()
        settings2 = get_settings()

        assert settings1 is settings2

    def test_environment_detection(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test environment detection properties."""
        from arc.core.config import Settings

        # Test development
        settings = Settings(environment="development")
        assert settings.is_development is True
        assert settings.is_production is False
        assert settings.is_staging is False

        # Test production
        settings = Settings(environment="production")
        assert settings.is_development is False
        assert settings.is_production is True
        assert settings.is_staging is False

    def test_sub_configurations_accessible(self) -> None:
        """Test sub-configurations are accessible."""
        from arc.core.config import Settings

        settings = Settings()

        assert settings.database is not None
        assert settings.api is not None
        assert settings.providers is not None
        assert settings.kaizen is not None
        assert settings.logging is not None

    def test_app_name_default(self) -> None:
        """Test default app name."""
        from arc.core.config import Settings

        settings = Settings()

        assert settings.app_name == "ARC Investment Platform"


class TestSecretHandling:
    """Tests for secret value handling."""

    def test_password_is_secret(self, clean_env: None) -> None:
        """Test password fields use SecretStr."""
        from arc.core.config import DatabaseConfig

        config = DatabaseConfig(password=SecretStr("secret123"))

        # SecretStr should not reveal value in string representation
        assert "secret123" not in str(config.password)
        assert "secret123" not in repr(config.password)

        # But value should be accessible via get_secret_value
        assert config.password.get_secret_value() == "secret123"

    def test_api_keys_are_secret(self, clean_env: None) -> None:
        """Test API keys use SecretStr."""
        from arc.core.config import KaizenConfig

        config = KaizenConfig(
            anthropic_api_key=SecretStr("sk-ant-secret"),
            openai_api_key=SecretStr("sk-openai-secret"),
        )

        assert "sk-ant-secret" not in str(config.anthropic_api_key)
        assert "sk-openai-secret" not in str(config.openai_api_key)
