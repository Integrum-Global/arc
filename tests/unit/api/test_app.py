"""Unit tests for ARC Nexus application setup.

Tests:
- Application configuration and initialization
- Model registration with Nexus
- Health endpoint response structure
- Model groupings and organization
- Database initialization functions
"""

from datetime import datetime

import pytest


class TestNexusConfiguration:
    """Tests for Nexus application configuration."""

    def test_nexus_is_nexus_instance(self) -> None:
        """Nexus should be a Nexus instance."""
        from nexus import Nexus

        from arc.api.app import nexus

        # Nexus should be a Nexus instance
        assert nexus is not None
        assert isinstance(nexus, Nexus)

    def test_nexus_has_nexus_name(self) -> None:
        """Nexus should have nexus name attribute."""
        from arc.api.app import nexus

        # Nexus hardcodes name="nexus"
        assert hasattr(nexus, "name")
        assert nexus.name == "nexus"

    def test_nexus_has_endpoint_decorator(self) -> None:
        """Nexus should have endpoint decorator for routes."""
        from arc.api.app import nexus

        assert hasattr(nexus, "endpoint")
        assert callable(nexus.endpoint)

    def test_nexus_has_register_method(self) -> None:
        """Nexus should have register method for workflows."""
        from arc.api.app import nexus

        assert hasattr(nexus, "register")
        assert callable(nexus.register)

    def test_nexus_has_run_method(self) -> None:
        """Nexus should have start method for running server."""
        from arc.api.app import nexus

        # Nexus uses start() to run the server
        assert hasattr(nexus, "start")
        assert callable(nexus.start)

    def test_app_is_fastapi_instance(self) -> None:
        """App should be the underlying FastAPI instance."""
        from fastapi import FastAPI

        from arc.api.app import app

        # app is the FastAPI instance exposed for uvicorn ASGI compatibility
        assert app is not None
        assert isinstance(app, FastAPI)


class TestModelRegistration:
    """Tests for DataFlow model registration."""

    def test_core_models_defined(self) -> None:
        """Core models should be defined."""
        from arc.api.app import CORE_MODELS

        assert len(CORE_MODELS) == 6
        endpoint_names = [name for name, _ in CORE_MODELS]
        assert "tenants" in endpoint_names
        assert "users" in endpoint_names
        assert "user-preferences" in endpoint_names
        assert "notification-preferences" in endpoint_names
        assert "audit-logs" in endpoint_names
        assert "dashboard-layouts" in endpoint_names

    def test_portfolio_models_defined(self) -> None:
        """Portfolio models should be defined."""
        from arc.api.app import PORTFOLIO_MODELS

        assert len(PORTFOLIO_MODELS) == 6
        endpoint_names = [name for name, _ in PORTFOLIO_MODELS]
        assert "portfolios" in endpoint_names
        assert "holdings" in endpoint_names
        assert "transactions" in endpoint_names
        assert "portfolio-valuations" in endpoint_names
        assert "cash-accounts" in endpoint_names
        assert "benchmarks" in endpoint_names

    def test_security_models_defined(self) -> None:
        """Security models should be defined."""
        from arc.api.app import SECURITY_MODELS

        assert len(SECURITY_MODELS) == 6
        endpoint_names = [name for name, _ in SECURITY_MODELS]
        assert "securities" in endpoint_names
        assert "price-history" in endpoint_names
        assert "company-fundamentals" in endpoint_names
        assert "security-ratios" in endpoint_names
        assert "corporate-actions" in endpoint_names
        assert "dividends" in endpoint_names

    def test_analytics_models_defined(self) -> None:
        """Analytics models should be defined."""
        from arc.api.app import ANALYTICS_MODELS

        assert len(ANALYTICS_MODELS) == 6
        endpoint_names = [name for name, _ in ANALYTICS_MODELS]
        assert "alerts" in endpoint_names
        assert "alert-thresholds" in endpoint_names
        assert "peer-groups" in endpoint_names
        assert "reports" in endpoint_names
        assert "watchlists" in endpoint_names
        assert "watchlist-items" in endpoint_names

    def test_all_models_combined(self) -> None:
        """ALL_MODELS should combine all model groups."""
        from arc.api.app import (
            ALL_MODELS,
            ANALYTICS_MODELS,
            CORE_MODELS,
            PORTFOLIO_MODELS,
            SECURITY_MODELS,
        )

        expected_count = (
            len(CORE_MODELS) + len(PORTFOLIO_MODELS) + len(SECURITY_MODELS) + len(ANALYTICS_MODELS)
        )
        assert len(ALL_MODELS) == expected_count
        assert len(ALL_MODELS) == 24  # 6 + 6 + 6 + 6

    def test_all_models_have_valid_structure(self) -> None:
        """All model entries should have (endpoint_name, model_class) structure."""
        from arc.api.app import ALL_MODELS

        for entry in ALL_MODELS:
            assert isinstance(entry, tuple)
            assert len(entry) == 2
            endpoint_name, model_class = entry
            assert isinstance(endpoint_name, str)
            assert len(endpoint_name) > 0
            # Model class should have __name__ attribute
            assert hasattr(model_class, "__name__")

    def test_endpoint_names_use_kebab_case(self) -> None:
        """Endpoint names should use kebab-case."""
        from arc.api.app import ALL_MODELS

        for endpoint_name, _ in ALL_MODELS:
            # Should not contain underscores (use dashes instead)
            assert "_" not in endpoint_name, f"Endpoint {endpoint_name} should use kebab-case"
            # Should be lowercase
            assert endpoint_name == endpoint_name.lower()


class TestModelClasses:
    """Tests for model class imports."""

    def test_core_model_classes_exist(self) -> None:
        """Core model classes should be properly imported."""
        from arc.api.app import CORE_MODELS
        from arc.models import (
            AuditLog,
            NotificationPreference,
            Tenant,
            User,
            UserPreference,
        )

        model_classes = [cls for _, cls in CORE_MODELS]
        assert Tenant in model_classes
        assert User in model_classes
        assert UserPreference in model_classes
        assert NotificationPreference in model_classes
        assert AuditLog in model_classes

    def test_portfolio_model_classes_exist(self) -> None:
        """Portfolio model classes should be properly imported."""
        from arc.api.app import PORTFOLIO_MODELS
        from arc.models import (
            Benchmark,
            CashAccount,
            Holding,
            Portfolio,
            PortfolioValuation,
            Transaction,
        )

        model_classes = [cls for _, cls in PORTFOLIO_MODELS]
        assert Portfolio in model_classes
        assert Holding in model_classes
        assert Transaction in model_classes
        assert PortfolioValuation in model_classes
        assert CashAccount in model_classes
        assert Benchmark in model_classes

    def test_security_model_classes_exist(self) -> None:
        """Security model classes should be properly imported."""
        from arc.api.app import SECURITY_MODELS
        from arc.models import (
            CompanyFundamentals,
            CorporateAction,
            Dividend,
            PriceHistory,
            Security,
            SecurityRatio,
        )

        model_classes = [cls for _, cls in SECURITY_MODELS]
        assert Security in model_classes
        assert PriceHistory in model_classes
        assert CompanyFundamentals in model_classes
        assert SecurityRatio in model_classes
        assert CorporateAction in model_classes
        assert Dividend in model_classes

    def test_analytics_model_classes_exist(self) -> None:
        """Analytics model classes should be properly imported."""
        from arc.api.app import ANALYTICS_MODELS
        from arc.models import (
            Alert,
            AlertThreshold,
            PeerGroup,
            Report,
            Watchlist,
            WatchlistItem,
        )

        model_classes = [cls for _, cls in ANALYTICS_MODELS]
        assert Alert in model_classes
        assert AlertThreshold in model_classes
        assert PeerGroup in model_classes
        assert Report in model_classes
        assert Watchlist in model_classes
        assert WatchlistItem in model_classes


class TestHealthEndpointStructure:
    """Tests for health endpoint response structure."""

    @pytest.mark.asyncio
    async def test_liveness_check_structure(self) -> None:
        """Liveness check should return correct structure."""
        from arc.api.app import liveness_check

        result = await liveness_check()

        assert "alive" in result
        assert result["alive"] is True
        assert "timestamp" in result
        # Timestamp should be ISO format
        datetime.fromisoformat(result["timestamp"].replace("Z", "+00:00"))

    def test_health_check_function_exists(self) -> None:
        """Health check function should exist."""
        from arc.api.app import health_check

        assert callable(health_check)

    def test_readiness_check_function_exists(self) -> None:
        """Readiness check function should exist."""
        from arc.api.app import readiness_check

        assert callable(readiness_check)

    def test_liveness_check_function_exists(self) -> None:
        """Liveness check function should exist."""
        from arc.api.app import liveness_check

        assert callable(liveness_check)


class TestDatabaseConfiguration:
    """Tests for database configuration."""

    def test_db_is_exported(self) -> None:
        """Database instance should be exported."""
        from arc.api.app import db

        assert db is not None

    def test_create_tables_function_exists(self) -> None:
        """create_tables function should be importable."""
        from arc.models import create_tables

        assert callable(create_tables)

    def test_close_database_function_exists(self) -> None:
        """close_database function should be importable."""
        from arc.models import close_database

        assert callable(close_database)


class TestDatabaseFunctions:
    """Tests for database initialization functions."""

    def test_initialize_database_function_exists(self) -> None:
        """initialize_database function should exist."""
        from arc.api.app import initialize_database

        assert initialize_database is not None
        assert callable(initialize_database)

    def test_shutdown_database_function_exists(self) -> None:
        """shutdown_database function should exist."""
        from arc.api.app import shutdown_database

        assert shutdown_database is not None
        assert callable(shutdown_database)

    def test_initialize_database_is_async(self) -> None:
        """initialize_database should be an async function."""
        import asyncio

        from arc.api.app import initialize_database

        assert asyncio.iscoroutinefunction(initialize_database)

    def test_shutdown_database_is_async(self) -> None:
        """shutdown_database should be an async function."""
        import asyncio

        from arc.api.app import shutdown_database

        assert asyncio.iscoroutinefunction(shutdown_database)


class TestWorkflowRegistration:
    """Tests for workflow registration."""

    def test_register_workflows_exists(self) -> None:
        """register_workflows function should exist."""
        from arc.api.app import register_workflows

        assert callable(register_workflows)

    def test_register_workflows_is_callable(self) -> None:
        """register_workflows should be callable without error."""
        from arc.api.app import register_workflows

        # Should not raise
        register_workflows()


class TestModuleExports:
    """Tests for module exports."""

    def test_all_exports_defined(self) -> None:
        """__all__ should be defined with expected exports."""
        import arc.api as api_module

        # Check that key exports are available
        assert hasattr(api_module, "app")
        assert hasattr(api_module, "nexus")
        assert hasattr(api_module, "db")
        assert hasattr(api_module, "ALL_MODELS")
        assert hasattr(api_module, "initialize_database")
        assert hasattr(api_module, "shutdown_database")

    def test_app_importable_from_arc_api(self) -> None:
        """App should be importable from arc.api."""
        from arc.api import app

        assert app is not None

    def test_db_importable_from_arc_api(self) -> None:
        """Database should be importable from arc.api."""
        from arc.api import db

        assert db is not None

    def test_all_models_importable_from_arc_api(self) -> None:
        """ALL_MODELS should be importable from arc.api."""
        from arc.api import ALL_MODELS

        assert ALL_MODELS is not None
        assert len(ALL_MODELS) == 24

    def test_initialize_database_importable(self) -> None:
        """initialize_database should be importable from arc.api."""
        from arc.api import initialize_database

        assert initialize_database is not None
        assert callable(initialize_database)

    def test_shutdown_database_importable(self) -> None:
        """shutdown_database should be importable from arc.api."""
        from arc.api import shutdown_database

        assert shutdown_database is not None
        assert callable(shutdown_database)


class TestSettingsIntegration:
    """Tests for settings integration."""

    def test_settings_imported(self) -> None:
        """Settings should be properly imported."""
        from arc.core.config import settings

        assert settings is not None

    def test_environment_accessible(self) -> None:
        """Environment setting should be accessible."""
        from arc.core.config import settings

        assert hasattr(settings, "environment")

    def test_api_port_accessible(self) -> None:
        """API port setting should be accessible."""
        from arc.core.config import settings

        assert hasattr(settings, "api")
        assert hasattr(settings.api, "port")


class TestModelCounts:
    """Tests for model count verification."""

    def test_total_model_count(self) -> None:
        """Total model count should be 24."""
        from arc.api.app import ALL_MODELS

        # 6 core + 6 portfolio + 6 security + 6 analytics = 24
        assert len(ALL_MODELS) == 24

    def test_core_model_count(self) -> None:
        """Core models should have 6 entries."""
        from arc.api.app import CORE_MODELS

        assert len(CORE_MODELS) == 6

    def test_portfolio_model_count(self) -> None:
        """Portfolio models should have 6 entries."""
        from arc.api.app import PORTFOLIO_MODELS

        assert len(PORTFOLIO_MODELS) == 6

    def test_security_model_count(self) -> None:
        """Security models should have 6 entries."""
        from arc.api.app import SECURITY_MODELS

        assert len(SECURITY_MODELS) == 6

    def test_analytics_model_count(self) -> None:
        """Analytics models should have 6 entries."""
        from arc.api.app import ANALYTICS_MODELS

        assert len(ANALYTICS_MODELS) == 6
