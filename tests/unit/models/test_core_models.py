"""Unit tests for core domain models.

These tests verify model structure, field definitions, and DataFlow configuration
without requiring a running database. Integration tests with real database
operations are in tests/integration/models/.
"""


class TestTenantModel:
    """Tests for Tenant model structure."""

    def test_tenant_has_required_fields(self) -> None:
        """Test Tenant model has all required fields."""
        from arc.models.core import Tenant

        # Check required fields exist
        annotations = Tenant.__annotations__
        assert "id" in annotations, "Tenant must have 'id' field"
        assert "name" in annotations, "Tenant must have 'name' field"
        assert "subdomain" in annotations, "Tenant must have 'subdomain' field"
        assert "plan" in annotations, "Tenant must have 'plan' field"

    def test_tenant_has_limit_fields(self) -> None:
        """Test Tenant model has limit fields."""
        from arc.models.core import Tenant

        annotations = Tenant.__annotations__
        assert "max_users" in annotations, "Tenant must have 'max_users' field"
        assert "max_portfolios" in annotations, "Tenant must have 'max_portfolios' field"

    def test_tenant_has_settings_fields(self) -> None:
        """Test Tenant model has settings fields."""
        from arc.models.core import Tenant

        annotations = Tenant.__annotations__
        assert "reporting_currency" in annotations
        assert "data_providers" in annotations
        assert "features_enabled" in annotations

    def test_tenant_has_status_fields(self) -> None:
        """Test Tenant model has status fields."""
        from arc.models.core import Tenant

        annotations = Tenant.__annotations__
        assert "active" in annotations
        assert "trial_ends_at" in annotations
        assert "deleted_at" in annotations

    def test_tenant_dataflow_config(self) -> None:
        """Test Tenant has correct DataFlow configuration."""
        from arc.models.core import Tenant

        config = getattr(Tenant, "__dataflow__", {})
        assert config.get("tenant_root") is True, "Tenant must be tenant_root"
        assert config.get("audit_log") is True, "Tenant should have audit_log"
        assert config.get("soft_delete") is True, "Tenant should have soft_delete"

    def test_tenant_indexes(self) -> None:
        """Test Tenant has correct indexes defined."""
        from arc.models.core import Tenant

        indexes = getattr(Tenant, "__indexes__", [])
        assert len(indexes) >= 1, "Tenant should have at least 1 index"

        # Check subdomain has unique index
        subdomain_index = next(
            (idx for idx in indexes if "subdomain" in idx.get("fields", [])), None
        )
        assert subdomain_index is not None, "Tenant should have subdomain index"
        assert subdomain_index.get("unique") is True, "Subdomain index should be unique"


class TestUserModel:
    """Tests for User model structure."""

    def test_user_has_identity_fields(self) -> None:
        """Test User model has identity fields."""
        from arc.models.core import User

        annotations = User.__annotations__
        assert "id" in annotations, "User must have 'id' field"
        assert "email" in annotations, "User must have 'email' field"
        assert "name" in annotations, "User must have 'name' field"

    def test_user_has_auth_fields(self) -> None:
        """Test User model has authentication fields."""
        from arc.models.core import User

        annotations = User.__annotations__
        assert "auth_provider" in annotations
        assert "auth_provider_id" in annotations
        assert "password_hash" in annotations

    def test_user_has_authorization_fields(self) -> None:
        """Test User model has authorization fields."""
        from arc.models.core import User

        annotations = User.__annotations__
        assert "role" in annotations
        assert "permissions_override" in annotations

    def test_user_has_preference_fields(self) -> None:
        """Test User model has preference fields."""
        from arc.models.core import User

        annotations = User.__annotations__
        assert "timezone" in annotations
        assert "locale" in annotations

    def test_user_has_status_fields(self) -> None:
        """Test User model has status fields."""
        from arc.models.core import User

        annotations = User.__annotations__
        assert "active" in annotations
        assert "email_verified" in annotations
        assert "last_login_at" in annotations
        assert "deleted_at" in annotations

    def test_user_dataflow_config(self) -> None:
        """Test User has correct DataFlow configuration."""
        from arc.models.core import User

        config = getattr(User, "__dataflow__", {})
        assert config.get("multi_tenant") is True, "User must be multi_tenant"
        assert config.get("audit_log") is True, "User should have audit_log"
        assert config.get("soft_delete") is True, "User should have soft_delete"

    def test_user_indexes(self) -> None:
        """Test User has correct indexes defined."""
        from arc.models.core import User

        indexes = getattr(User, "__indexes__", [])
        assert len(indexes) >= 2, "User should have at least 2 indexes"

        # Check email index exists
        email_index = next((idx for idx in indexes if "email" in idx.get("fields", [])), None)
        assert email_index is not None, "User should have email index"


class TestUserPreferenceModel:
    """Tests for UserPreference model structure."""

    def test_user_preference_has_required_fields(self) -> None:
        """Test UserPreference model has required fields."""
        from arc.models.core import UserPreference

        annotations = UserPreference.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations

    def test_user_preference_has_config_fields(self) -> None:
        """Test UserPreference model has configuration fields."""
        from arc.models.core import UserPreference

        annotations = UserPreference.__annotations__
        assert "dashboard_layout" in annotations
        assert "brief_settings" in annotations
        assert "alert_thresholds" in annotations

    def test_user_preference_has_display_fields(self) -> None:
        """Test UserPreference model has display preference fields."""
        from arc.models.core import UserPreference

        annotations = UserPreference.__annotations__
        assert "number_format" in annotations
        assert "date_format" in annotations
        assert "theme" in annotations

    def test_user_preference_dataflow_config(self) -> None:
        """Test UserPreference has correct DataFlow configuration."""
        from arc.models.core import UserPreference

        config = getattr(UserPreference, "__dataflow__", {})
        assert config.get("multi_tenant") is True, "UserPreference must be multi_tenant"
        # Audit log can be False for preferences - not critical data
        assert config.get("audit_log") is False

    def test_user_preference_indexes(self) -> None:
        """Test UserPreference has unique user_id index."""
        from arc.models.core import UserPreference

        indexes = getattr(UserPreference, "__indexes__", [])
        user_id_index = next((idx for idx in indexes if "user_id" in idx.get("fields", [])), None)
        assert user_id_index is not None, "UserPreference should have user_id index"
        assert user_id_index.get("unique") is True, "user_id index should be unique"


class TestNotificationPreferenceModel:
    """Tests for NotificationPreference model structure."""

    def test_notification_preference_has_required_fields(self) -> None:
        """Test NotificationPreference model has required fields."""
        from arc.models.core import NotificationPreference

        annotations = NotificationPreference.__annotations__
        assert "id" in annotations
        assert "user_id" in annotations
        assert "channel" in annotations
        assert "destination" in annotations

    def test_notification_preference_has_filter_fields(self) -> None:
        """Test NotificationPreference model has filtering fields."""
        from arc.models.core import NotificationPreference

        annotations = NotificationPreference.__annotations__
        assert "severity_filter" in annotations
        assert "alert_types" in annotations
        assert "frequency" in annotations

    def test_notification_preference_has_quiet_hours(self) -> None:
        """Test NotificationPreference model has quiet hours fields."""
        from arc.models.core import NotificationPreference

        annotations = NotificationPreference.__annotations__
        assert "quiet_hours_start" in annotations
        assert "quiet_hours_end" in annotations

    def test_notification_preference_has_status_fields(self) -> None:
        """Test NotificationPreference model has status fields."""
        from arc.models.core import NotificationPreference

        annotations = NotificationPreference.__annotations__
        assert "enabled" in annotations
        assert "verified" in annotations

    def test_notification_preference_dataflow_config(self) -> None:
        """Test NotificationPreference has correct DataFlow configuration."""
        from arc.models.core import NotificationPreference

        config = getattr(NotificationPreference, "__dataflow__", {})
        assert config.get("multi_tenant") is True, "NotificationPreference must be multi_tenant"


class TestAuditLogModel:
    """Tests for AuditLog model structure."""

    def test_audit_log_has_required_fields(self) -> None:
        """Test AuditLog model has required fields."""
        from arc.models.core import AuditLog

        annotations = AuditLog.__annotations__
        assert "id" in annotations
        assert "model_name" in annotations
        assert "record_id" in annotations
        assert "operation" in annotations

    def test_audit_log_has_change_fields(self) -> None:
        """Test AuditLog model has change tracking fields."""
        from arc.models.core import AuditLog

        annotations = AuditLog.__annotations__
        assert "changes" in annotations
        assert "snapshot" in annotations

    def test_audit_log_has_user_fields(self) -> None:
        """Test AuditLog model has user tracking fields."""
        from arc.models.core import AuditLog

        annotations = AuditLog.__annotations__
        assert "user_id" in annotations
        assert "user_email" in annotations
        assert "ip_address" in annotations

    def test_audit_log_has_context_fields(self) -> None:
        """Test AuditLog model has context fields."""
        from arc.models.core import AuditLog

        annotations = AuditLog.__annotations__
        assert "request_id" in annotations
        assert "reason" in annotations

    def test_audit_log_dataflow_config(self) -> None:
        """Test AuditLog has correct DataFlow configuration."""
        from arc.models.core import AuditLog

        config = getattr(AuditLog, "__dataflow__", {})
        assert config.get("multi_tenant") is True, "AuditLog must be multi_tenant"
        # Audit log should NOT audit itself to prevent infinite loops
        assert config.get("audit_log") is False, "AuditLog must not audit itself"


class TestModelExports:
    """Tests for model exports from package."""

    def test_all_core_models_exported(self) -> None:
        """Test all core models are exported from arc.models."""
        from arc.models import (
            AuditLog,
            NotificationPreference,
            Tenant,
            User,
            UserPreference,
        )

        # Just verify they're importable
        assert Tenant is not None
        assert User is not None
        assert UserPreference is not None
        assert NotificationPreference is not None
        assert AuditLog is not None

    def test_database_utilities_exported(self) -> None:
        """Test database utilities are exported from arc.models."""
        from arc.models import close_database, create_tables, database_lifespan, db

        assert db is not None
        assert create_tables is not None
        assert close_database is not None
        assert database_lifespan is not None


class TestModelFieldTypes:
    """Tests for correct field type annotations."""

    def test_tenant_field_types(self) -> None:
        """Test Tenant fields have correct types."""
        from arc.models.core import Tenant

        annotations = Tenant.__annotations__

        # Required fields should be plain types
        assert annotations["id"] is str
        assert annotations["name"] is str
        assert annotations["subdomain"] is str

        # Optional fields should have union type (X | None)
        trial_ends_type = str(annotations.get("trial_ends_at", ""))
        deleted_type = str(annotations.get("deleted_at", ""))
        assert "None" in trial_ends_type or "Optional" in trial_ends_type
        assert "None" in deleted_type or "Optional" in deleted_type

        # Collection fields
        assert "list" in str(annotations.get("data_providers", "")).lower()
        assert annotations.get("features_enabled") is dict

    def test_user_field_types(self) -> None:
        """Test User fields have correct types."""
        from arc.models.core import User

        annotations = User.__annotations__

        # Required fields
        assert annotations["id"] is str
        assert annotations["email"] is str
        assert annotations["name"] is str

        # Boolean fields
        assert annotations["active"] is bool
        assert annotations["email_verified"] is bool

        # Integer fields
        assert annotations["failed_login_attempts"] is int
