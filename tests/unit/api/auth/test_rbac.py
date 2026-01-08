"""Unit tests for Role-Based Access Control (RBAC)."""

import pytest

from arc.api.auth.rbac import (
    ROLE_PERMISSIONS,
    Permission,
    PermissionDeniedError,
    Role,
    get_role_permissions,
    has_all_permissions,
    has_any_permission,
    has_permission,
    require_any_permission,
    require_permission,
    require_role,
)


class TestPermissionEnum:
    """Tests for Permission enum."""

    def test_permission_enum_has_portfolio_permissions(self) -> None:
        """Permission enum should have portfolio permissions."""
        assert Permission.PORTFOLIO_CREATE.value == "portfolio:create"
        assert Permission.PORTFOLIO_READ.value == "portfolio:read"
        assert Permission.PORTFOLIO_UPDATE.value == "portfolio:update"
        assert Permission.PORTFOLIO_DELETE.value == "portfolio:delete"
        assert Permission.HOLDINGS_MANAGE.value == "holdings:manage"

    def test_permission_enum_has_analytics_permissions(self) -> None:
        """Permission enum should have analytics permissions."""
        assert Permission.ANALYTICS_READ.value == "analytics:read"
        assert Permission.ANALYTICS_CONFIGURE.value == "analytics:configure"

    def test_permission_enum_has_intelligence_permissions(self) -> None:
        """Permission enum should have intelligence permissions."""
        assert Permission.INTELLIGENCE_QUERY.value == "intelligence:query"
        assert Permission.INTELLIGENCE_BRIEF.value == "intelligence:brief"

    def test_permission_enum_has_admin_permissions(self) -> None:
        """Permission enum should have admin permissions."""
        assert Permission.ADMIN_USERS.value == "admin:users"
        assert Permission.ADMIN_TENANT.value == "admin:tenant"
        assert Permission.AUDIT_VIEW.value == "audit:view"


class TestRoleEnum:
    """Tests for Role enum."""

    def test_role_enum_values(self) -> None:
        """Role enum should have correct values."""
        assert Role.ADMIN.value == "admin"
        assert Role.INVESTMENT_MANAGER.value == "investment_manager"
        assert Role.FAMILY_OFFICE.value == "family_office"
        assert Role.COMPLIANCE.value == "compliance"
        assert Role.VIEWER.value == "viewer"


class TestRolePermissions:
    """Tests for role permission mappings."""

    def test_admin_has_all_permissions(self) -> None:
        """Admin role should have all permissions."""
        admin_perms = ROLE_PERMISSIONS[Role.ADMIN]

        # Admin should have all defined permissions
        assert Permission.PORTFOLIO_CREATE in admin_perms
        assert Permission.PORTFOLIO_READ in admin_perms
        assert Permission.ADMIN_USERS in admin_perms
        assert Permission.AUDIT_VIEW in admin_perms

    def test_viewer_has_read_only_permissions(self) -> None:
        """Viewer role should have read-only permissions."""
        viewer_perms = ROLE_PERMISSIONS[Role.VIEWER]

        assert Permission.PORTFOLIO_READ in viewer_perms
        assert Permission.ANALYTICS_READ in viewer_perms
        assert Permission.PORTFOLIO_CREATE not in viewer_perms
        assert Permission.ADMIN_USERS not in viewer_perms

    def test_compliance_has_audit_access(self) -> None:
        """Compliance role should have audit access."""
        compliance_perms = ROLE_PERMISSIONS[Role.COMPLIANCE]

        assert Permission.AUDIT_VIEW in compliance_perms
        assert Permission.PORTFOLIO_READ in compliance_perms
        assert Permission.PORTFOLIO_CREATE not in compliance_perms


class TestGetRolePermissions:
    """Tests for get_role_permissions function."""

    def test_get_permissions_for_role_enum(self) -> None:
        """get_role_permissions should work with Role enum."""
        perms = get_role_permissions(Role.ADMIN)
        assert Permission.ADMIN_USERS in perms

    def test_get_permissions_for_role_string(self) -> None:
        """get_role_permissions should work with role string."""
        perms = get_role_permissions("admin")
        assert Permission.ADMIN_USERS in perms

    def test_get_permissions_for_invalid_role(self) -> None:
        """get_role_permissions should return empty set for invalid role."""
        perms = get_role_permissions("invalid_role")
        assert perms == set()


class TestHasPermission:
    """Tests for has_permission function."""

    def test_has_permission_with_permission_enum(self) -> None:
        """has_permission should work with Permission enum."""
        user_perms = ["portfolio:read", "portfolio:create"]

        assert has_permission(user_perms, Permission.PORTFOLIO_READ) is True
        assert has_permission(user_perms, Permission.PORTFOLIO_DELETE) is False

    def test_has_permission_with_string(self) -> None:
        """has_permission should work with permission string."""
        user_perms = ["portfolio:read", "analytics:read"]

        assert has_permission(user_perms, "portfolio:read") is True
        assert has_permission(user_perms, "admin:users") is False

    def test_has_permission_with_set(self) -> None:
        """has_permission should work with set of permissions."""
        user_perms = {"portfolio:read", "analytics:read"}

        assert has_permission(user_perms, "portfolio:read") is True


class TestHasAnyPermission:
    """Tests for has_any_permission function."""

    def test_has_any_permission_one_match(self) -> None:
        """has_any_permission should return True if one matches."""
        user_perms = ["portfolio:read"]
        required = [Permission.PORTFOLIO_READ, Permission.ANALYTICS_READ]

        assert has_any_permission(user_perms, required) is True

    def test_has_any_permission_no_match(self) -> None:
        """has_any_permission should return False if none match."""
        user_perms = ["portfolio:read"]
        required = [Permission.ADMIN_USERS, Permission.AUDIT_VIEW]

        assert has_any_permission(user_perms, required) is False


class TestHasAllPermissions:
    """Tests for has_all_permissions function."""

    def test_has_all_permissions_all_present(self) -> None:
        """has_all_permissions should return True if all present."""
        user_perms = ["portfolio:read", "portfolio:create", "analytics:read"]
        required = [Permission.PORTFOLIO_READ, Permission.PORTFOLIO_CREATE]

        assert has_all_permissions(user_perms, required) is True

    def test_has_all_permissions_some_missing(self) -> None:
        """has_all_permissions should return False if any missing."""
        user_perms = ["portfolio:read"]
        required = [Permission.PORTFOLIO_READ, Permission.PORTFOLIO_CREATE]

        assert has_all_permissions(user_perms, required) is False


class TestPermissionDeniedError:
    """Tests for PermissionDeniedError."""

    def test_error_with_default_message(self) -> None:
        """PermissionDeniedError should have default message."""
        error = PermissionDeniedError("portfolio:create")

        assert error.permission == "portfolio:create"
        assert "portfolio:create" in error.message

    def test_error_with_custom_message(self) -> None:
        """PermissionDeniedError should support custom message."""
        error = PermissionDeniedError("admin:users", "Custom message")

        assert error.permission == "admin:users"
        assert error.message == "Custom message"


class TestRequirePermissionDecorator:
    """Tests for require_permission decorator."""

    @pytest.mark.asyncio
    async def test_require_permission_allows_valid(self) -> None:
        """require_permission should allow user with permission."""

        @require_permission(Permission.PORTFOLIO_READ)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"permissions": ["portfolio:read"]}
        result = await test_endpoint(current_user=current_user)

        assert result == "success"

    @pytest.mark.asyncio
    async def test_require_permission_denies_missing(self) -> None:
        """require_permission should deny user without permission."""

        @require_permission(Permission.ADMIN_USERS)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"permissions": ["portfolio:read"]}

        with pytest.raises(PermissionDeniedError):
            await test_endpoint(current_user=current_user)

    @pytest.mark.asyncio
    async def test_require_permission_denies_no_user(self) -> None:
        """require_permission should deny when no user."""

        @require_permission(Permission.PORTFOLIO_READ)
        async def test_endpoint(current_user: dict | None = None) -> str:
            return "success"

        with pytest.raises(PermissionDeniedError):
            await test_endpoint()


class TestRequireAnyPermissionDecorator:
    """Tests for require_any_permission decorator."""

    @pytest.mark.asyncio
    async def test_require_any_allows_one_match(self) -> None:
        """require_any_permission should allow if one permission matches."""

        @require_any_permission(Permission.ADMIN_USERS, Permission.PORTFOLIO_READ)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"permissions": ["portfolio:read"]}
        result = await test_endpoint(current_user=current_user)

        assert result == "success"

    @pytest.mark.asyncio
    async def test_require_any_denies_no_match(self) -> None:
        """require_any_permission should deny if no permission matches."""

        @require_any_permission(Permission.ADMIN_USERS, Permission.AUDIT_VIEW)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"permissions": ["portfolio:read"]}

        with pytest.raises(PermissionDeniedError):
            await test_endpoint(current_user=current_user)


class TestRequireRoleDecorator:
    """Tests for require_role decorator."""

    @pytest.mark.asyncio
    async def test_require_role_allows_matching_role(self) -> None:
        """require_role should allow user with matching role."""

        @require_role(Role.ADMIN)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"role": "admin"}
        result = await test_endpoint(current_user=current_user)

        assert result == "success"

    @pytest.mark.asyncio
    async def test_require_role_denies_different_role(self) -> None:
        """require_role should deny user with different role."""

        @require_role(Role.ADMIN)
        async def test_endpoint(current_user: dict) -> str:
            return "success"

        current_user = {"role": "viewer"}

        with pytest.raises(PermissionDeniedError):
            await test_endpoint(current_user=current_user)


class TestRBACExports:
    """Tests for RBAC module exports."""

    def test_permission_exported(self) -> None:
        """Permission should be exported from auth module."""
        from arc.api.auth import Permission as exported

        assert exported is Permission

    def test_role_exported(self) -> None:
        """Role should be exported from auth module."""
        from arc.api.auth import Role as exported

        assert exported is Role

    def test_role_permissions_exported(self) -> None:
        """ROLE_PERMISSIONS should be exported from auth module."""
        from arc.api.auth import ROLE_PERMISSIONS as exported

        assert exported is ROLE_PERMISSIONS
