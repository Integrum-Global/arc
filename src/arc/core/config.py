"""
Application configuration and settings management.

This module provides type-safe configuration loading from environment variables
using Pydantic settings. All configurations support:
- Environment variable loading from .env files
- Type validation and conversion
- Default values for development
- Docker/FastAPI compatibility (async-first patterns)
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseSettings):
    """PostgreSQL database configuration."""

    model_config = SettingsConfigDict(env_prefix="DB_")

    host: str = "localhost"
    port: int = 5432
    database: str = "arc"
    username: str = "arc"
    password: SecretStr = SecretStr("")
    pool_size: int = 10
    max_overflow: int = 20

    @computed_field
    @property
    def connection_url(self) -> str:
        """Build PostgreSQL connection URL."""
        password = self.password.get_secret_value()
        return f"postgresql://{self.username}:{password}@{self.host}:{self.port}/{self.database}"

    @computed_field
    @property
    def async_connection_url(self) -> str:
        """Build async PostgreSQL connection URL for asyncpg."""
        password = self.password.get_secret_value()
        return f"postgresql+asyncpg://{self.username}:{password}@{self.host}:{self.port}/{self.database}"


class RedisConfig(BaseSettings):
    """Redis cache configuration."""

    model_config = SettingsConfigDict(env_prefix="REDIS_")

    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: SecretStr = SecretStr("")

    @computed_field
    @property
    def connection_url(self) -> str:
        """Build Redis connection URL."""
        password = self.password.get_secret_value()
        if password:
            return f"redis://:{password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"


class APIConfig(BaseSettings):
    """Nexus API configuration."""

    model_config = SettingsConfigDict(env_prefix="API_")

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    api_prefix: str = "/api/v1"
    docs_url: str = "/docs"
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # seconds
    jwt_secret_key: SecretStr = SecretStr("development-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    jwt_refresh_expiration_days: int = 7


class ProviderConfig(BaseSettings):
    """External data provider configuration."""

    model_config = SettingsConfigDict(env_prefix="PROVIDER_")

    # EODHD
    eodhd_api_key: SecretStr = SecretStr("")
    eodhd_base_url: str = "https://eodhd.com/api"

    # Capital IQ
    capitaliq_username: str = ""
    capitaliq_password: SecretStr = SecretStr("")
    capitaliq_base_url: str = ""

    # Pitchbook
    pitchbook_api_key: SecretStr = SecretStr("")
    pitchbook_base_url: str = ""


class KaizenConfig(BaseSettings):
    """Kaizen AI agent configuration."""

    model_config = SettingsConfigDict(env_prefix="KAIZEN_")

    # LLM Provider
    provider: Literal["openai", "anthropic", "ollama"] = "anthropic"
    model: str = "claude-sonnet-4-20250514"

    # API Keys
    openai_api_key: SecretStr = SecretStr("")
    anthropic_api_key: SecretStr = SecretStr("")

    # Ollama settings
    ollama_base_url: str = "http://localhost:11434"

    # Model Settings
    temperature: float = 0.7
    max_tokens: int = 4096

    # Memory Settings
    memory_type: Literal["buffer", "summary", "vector"] = "buffer"
    max_memory_items: int = 100


class LoggingConfig(BaseSettings):
    """Logging configuration."""

    model_config = SettingsConfigDict(env_prefix="LOG_")

    level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    format: str = "json"  # json or text
    include_timestamp: bool = True


class Settings(BaseSettings):
    """Application settings aggregating all configurations."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment
    environment: Literal["development", "staging", "production"] = "development"
    app_name: str = "ARC Investment Platform"

    # Sub-configurations (loaded from env vars)
    @computed_field
    @property
    def database(self) -> DatabaseConfig:
        """Database configuration."""
        return DatabaseConfig()

    @computed_field
    @property
    def redis(self) -> RedisConfig:
        """Redis configuration."""
        return RedisConfig()

    @computed_field
    @property
    def api(self) -> APIConfig:
        """API configuration."""
        return APIConfig()

    @computed_field
    @property
    def providers(self) -> ProviderConfig:
        """External provider configuration."""
        return ProviderConfig()

    @computed_field
    @property
    def kaizen(self) -> KaizenConfig:
        """Kaizen AI configuration."""
        return KaizenConfig()

    @computed_field
    @property
    def logging(self) -> LoggingConfig:
        """Logging configuration."""
        return LoggingConfig()

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"

    @property
    def is_staging(self) -> bool:
        """Check if running in staging mode."""
        return self.environment == "staging"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Singleton for easy import
settings = get_settings()
