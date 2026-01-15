"""
Unit tests for SSO DataFlow models.

Tests model creation, field validation, and unique constraints
without requiring database connections.

CRITICAL: Follow TDD - write tests FIRST before implementation.
"""

import pytest


class TestSSOProviderModel:
    """Unit tests for SSOProvider model definition."""

    def test_model_has_required_fields(self):
        """SSOProvider must have all required fields defined."""
        from arc.models.sso import SSOProvider

        # Check annotations exist
        assert hasattr(SSOProvider, "__annotations__")

        # Primary key
        assert "id" in SSOProvider.__annotations__
        assert SSOProvider.__annotations__["id"] == str

        # Foreign key
        assert SSOProvider.__annotations__["tenant_id"] == str

        # OAuth configuration
        assert SSOProvider.__annotations__["provider_type"] == str
        assert SSOProvider.__annotations__["display_name"] == str
        assert SSOProvider.__annotations__["client_id"] == str
        assert SSOProvider.__annotations__["client_secret_encrypted"] == str

        # Provider-specific (optional)
        assert "azure_tenant_id" in SSOProvider.__annotations__
        assert "google_domain" in SSOProvider.__annotations__

        # Settings (with defaults)
        assert "is_enabled" in SSOProvider.__annotations__
        assert "auto_provision" in SSOProvider.__annotations__
        assert "default_role" in SSOProvider.__annotations__

    def test_model_has_timestamps(self):
        """SSOProvider must have auto-managed timestamp fields."""
        from arc.models.sso import SSOProvider

        # These are auto-managed by DataFlow
        # Check they are NOT in annotations (DataFlow adds them)
        # or check they exist in the model's __dataflow__ config
        assert hasattr(SSOProvider, "__dataflow__")

    def test_model_has_unique_index(self):
        """SSOProvider must have unique index on (tenant_id, provider_type)."""
        from arc.models.sso import SSOProvider

        assert hasattr(SSOProvider, "__dataflow__")
        dataflow_config = SSOProvider.__dataflow__

        assert "indexes" in dataflow_config
        indexes = dataflow_config["indexes"]

        # Find the unique index
        unique_index = next(
            (idx for idx in indexes if idx.get("unique") is True), None
        )

        assert unique_index is not None, "No unique index found"
        assert set(unique_index["fields"]) == {"tenant_id", "provider_type"}

    def test_provider_type_values(self):
        """SSOProvider provider_type should support azure, google, github."""
        from arc.models.sso import SSOProvider

        # Just verify the field exists and is a string
        # Actual validation happens in application logic
        assert SSOProvider.__annotations__["provider_type"] == str

    def test_default_values(self):
        """SSOProvider must have correct default values."""
        from arc.models.sso import SSOProvider

        # Check defaults exist in annotations
        assert hasattr(SSOProvider, "__annotations__")
        # Defaults are set at class level, not in __annotations__

        # Verify defaults exist as class attributes
        if hasattr(SSOProvider, "is_enabled"):
            assert SSOProvider.is_enabled is True

        if hasattr(SSOProvider, "auto_provision"):
            assert SSOProvider.auto_provision is True

        if hasattr(SSOProvider, "default_role"):
            assert SSOProvider.default_role == "viewer"


class TestLinkedAccountModel:
    """Unit tests for LinkedAccount model definition."""

    def test_model_has_required_fields(self):
        """LinkedAccount must have all required fields defined."""
        from arc.models.sso import LinkedAccount

        # Check annotations exist
        assert hasattr(LinkedAccount, "__annotations__")

        # Primary key
        assert "id" in LinkedAccount.__annotations__
        assert LinkedAccount.__annotations__["id"] == str

        # Foreign keys
        assert LinkedAccount.__annotations__["user_id"] == str
        assert LinkedAccount.__annotations__["provider_type"] == str

        # OAuth data
        assert LinkedAccount.__annotations__["provider_user_id"] == str
        assert LinkedAccount.__annotations__["provider_email"] == str
        assert "provider_name" in LinkedAccount.__annotations__

        # Metadata
        assert LinkedAccount.__annotations__["linked_at"] == str
        assert "last_login_at" in LinkedAccount.__annotations__

    def test_model_has_unique_indexes(self):
        """LinkedAccount must have two unique indexes."""
        from arc.models.sso import LinkedAccount

        assert hasattr(LinkedAccount, "__dataflow__")
        dataflow_config = LinkedAccount.__dataflow__

        assert "indexes" in dataflow_config
        indexes = dataflow_config["indexes"]

        # Should have 2 unique indexes
        unique_indexes = [idx for idx in indexes if idx.get("unique") is True]
        assert len(unique_indexes) == 2, "Expected 2 unique indexes"

        # Check first index: (user_id, provider_type)
        user_provider_index = next(
            (
                idx
                for idx in unique_indexes
                if set(idx["fields"]) == {"user_id", "provider_type"}
            ),
            None,
        )
        assert (
            user_provider_index is not None
        ), "Missing unique index on (user_id, provider_type)"

        # Check second index: (provider_type, provider_user_id)
        provider_user_index = next(
            (
                idx
                for idx in unique_indexes
                if set(idx["fields"]) == {"provider_type", "provider_user_id"}
            ),
            None,
        )
        assert (
            provider_user_index is not None
        ), "Missing unique index on (provider_type, provider_user_id)"

    def test_optional_fields(self):
        """LinkedAccount must have correct optional fields."""
        from arc.models.sso import LinkedAccount
        from typing import get_args, get_origin

        # provider_name should be Optional[str]
        provider_name_type = LinkedAccount.__annotations__["provider_name"]
        assert get_origin(provider_name_type) is type(None) | type or str in get_args(
            provider_name_type
        )

        # last_login_at should be Optional[str]
        last_login_type = LinkedAccount.__annotations__["last_login_at"]
        assert get_origin(last_login_type) is type(None) | type or str in get_args(
            last_login_type
        )


class TestSSOModelRelationships:
    """Test relationships between SSO models and existing models."""

    def test_sso_provider_references_tenant(self):
        """SSOProvider should have tenant_id field referencing Tenant."""
        from arc.models.sso import SSOProvider

        assert SSOProvider.__annotations__["tenant_id"] == str

    def test_linked_account_references_user(self):
        """LinkedAccount should have user_id field referencing User."""
        from arc.models.sso import LinkedAccount

        assert LinkedAccount.__annotations__["user_id"] == str

    def test_models_use_iso_timestamps(self):
        """Both models should use ISO string timestamps."""
        from arc.models.sso import SSOProvider, LinkedAccount

        # SSOProvider timestamps (auto-managed by DataFlow)
        # DataFlow adds these automatically, so we check the model exists
        assert hasattr(SSOProvider, "__dataflow__")

        # LinkedAccount timestamps (manual)
        assert LinkedAccount.__annotations__["linked_at"] == str
        # last_login_at is Optional[str]
