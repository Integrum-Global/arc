# TODO-BE-001-03: Core Configuration Module

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 1.5h
**Dependencies**: TODO-BE-001-01 (Project Structure)

---

## Objective

Create a comprehensive configuration module that loads settings from environment variables and provides type-safe access to all application configuration.

---

## Description

Implement `src/arc/core/config.py` with Pydantic-based settings management. The module should support:
- Environment variable loading from `.env` files
- Type validation and conversion
- Default values for development
- Separate configuration classes for different concerns
- Docker/FastAPI compatibility (async-first patterns)

---

## Acceptance Criteria

- [ ] `src/arc/core/config.py` exists with all configuration classes
- [ ] `DatabaseConfig` class with PostgreSQL connection settings
- [ ] `APIConfig` class with Nexus API settings
- [ ] `ProviderConfig` class with data provider credentials
- [ ] `KaizenConfig` class with AI agent settings
- [ ] `Settings` class aggregating all configs
- [ ] `.env.example` template file created
- [ ] Environment variables load correctly from `.env`
- [ ] Default values work when env vars not set
- [ ] Unit test passes for config loading

---

## Subtasks

- [ ] Create `src/arc/core/config.py` base structure (Est: 10m)
  - Import pydantic-settings BaseSettings
  - Set up environment file loading
  - Verification: File imports without errors

- [ ] Implement `DatabaseConfig` class (Est: 15m)
  - host, port, database, username, password fields
  - connection_url computed property
  - pool_size, max_overflow settings
  - Verification: Config loads from env vars

- [ ] Implement `APIConfig` class (Est: 10m)
  - host, port, debug, cors_origins fields
  - api_prefix, docs_url settings
  - rate_limit settings
  - Verification: Config loads from env vars

- [ ] Implement `ProviderConfig` class (Est: 15m)
  - EODHD API key and base URL
  - Capital IQ credentials
  - Pitchbook credentials
  - Verification: Sensitive fields properly masked

- [ ] Implement `KaizenConfig` class (Est: 15m)
  - LLM provider and model settings
  - API keys (OpenAI, Anthropic)
  - Temperature, max_tokens defaults
  - Memory and context settings
  - Verification: Config loads from env vars

- [ ] Implement `Settings` class (Est: 10m)
  - Aggregate all config classes
  - Singleton pattern with caching
  - Environment detection (dev/staging/prod)
  - Verification: `from arc.core.config import settings`

- [ ] Create `.env.example` template (Est: 15m)
  - All environment variables documented
  - Safe default values (no real credentials)
  - Comments explaining each variable
  - Verification: File is complete and well-documented

- [ ] Update `src/arc/core/__init__.py` exports (Est: 5m)
  - Export `settings` singleton
  - Export config classes
  - Verification: `from arc.core import settings`

---

## Configuration Classes Structure

```python
# src/arc/core/config.py

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


class APIConfig(BaseSettings):
    """Nexus API configuration."""
    model_config = SettingsConfigDict(env_prefix="API_")

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    api_prefix: str = "/api/v1"
    docs_url: str = "/docs"
    rate_limit_requests: int = 100
    rate_limit_period: int = 60


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
    model: str = "claude-3-5-sonnet-latest"

    # API Keys
    openai_api_key: SecretStr = SecretStr("")
    anthropic_api_key: SecretStr = SecretStr("")

    # Model Settings
    temperature: float = 0.7
    max_tokens: int = 4096

    # Memory Settings
    memory_type: Literal["buffer", "summary", "vector"] = "buffer"
    max_memory_items: int = 100


class Settings(BaseSettings):
    """Application settings aggregating all configurations."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Environment
    environment: Literal["development", "staging", "production"] = "development"
    app_name: str = "ARC Investment Platform"

    # Sub-configurations (loaded from env vars)
    @computed_field
    @property
    def database(self) -> DatabaseConfig:
        return DatabaseConfig()

    @computed_field
    @property
    def api(self) -> APIConfig:
        return APIConfig()

    @computed_field
    @property
    def providers(self) -> ProviderConfig:
        return ProviderConfig()

    @computed_field
    @property
    def kaizen(self) -> KaizenConfig:
        return KaizenConfig()

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Singleton for easy import
settings = get_settings()
```

---

## .env.example Template

```bash
# ARC Investment Platform - Environment Configuration
# Copy this file to .env and fill in your values

# =============================================================================
# ENVIRONMENT
# =============================================================================
ENVIRONMENT=development
APP_NAME="ARC Investment Platform"

# =============================================================================
# DATABASE (PostgreSQL)
# =============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=arc
DB_USERNAME=arc
DB_PASSWORD=your_secure_password_here
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# =============================================================================
# API (Nexus)
# =============================================================================
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false
API_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
API_PREFIX=/api/v1
API_DOCS_URL=/docs
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_PERIOD=60

# =============================================================================
# DATA PROVIDERS
# =============================================================================
# EODHD (Market Data)
PROVIDER_EODHD_API_KEY=your_eodhd_api_key
PROVIDER_EODHD_BASE_URL=https://eodhd.com/api

# Capital IQ (Fundamentals)
PROVIDER_CAPITALIQ_USERNAME=
PROVIDER_CAPITALIQ_PASSWORD=
PROVIDER_CAPITALIQ_BASE_URL=

# Pitchbook (Private Markets)
PROVIDER_PITCHBOOK_API_KEY=
PROVIDER_PITCHBOOK_BASE_URL=

# =============================================================================
# KAIZEN (AI Agents)
# =============================================================================
KAIZEN_PROVIDER=anthropic
KAIZEN_MODEL=claude-3-5-sonnet-latest
KAIZEN_OPENAI_API_KEY=your_openai_api_key
KAIZEN_ANTHROPIC_API_KEY=your_anthropic_api_key
KAIZEN_TEMPERATURE=0.7
KAIZEN_MAX_TOKENS=4096
KAIZEN_MEMORY_TYPE=buffer
KAIZEN_MAX_MEMORY_ITEMS=100
```

---

## Risk Assessment

- **LOW**: Standard configuration pattern
- **MEDIUM**: SecretStr handling for sensitive data
- **MITIGATION**: Use pydantic-settings for proper env loading

---

## Testing Requirements

- [ ] Unit test: Config loads with default values
- [ ] Unit test: Config loads from environment variables
- [ ] Unit test: SecretStr fields are properly masked
- [ ] Unit test: Connection URL is correctly computed
- [ ] Unit test: Settings singleton caching works

---

## Definition of Done

- [ ] `config.py` module created and functional
- [ ] All configuration classes implemented
- [ ] `.env.example` template created
- [ ] `src/arc/core/__init__.py` exports settings
- [ ] Unit tests pass for config loading
- [ ] Parent todo TODO-BE-001 updated with completion status
