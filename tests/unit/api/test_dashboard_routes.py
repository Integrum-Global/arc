"""
Unit tests for Dashboard Layout API routes.

Tests the dashboard layout route functions using mocked DataFlow.
TDD pattern: Tests written before implementation.
"""

import json
import pytest
from unittest.mock import AsyncMock, patch


# =============================================================================
# TEST FIXTURES
# =============================================================================

DEFAULT_WIDGETS = [
    {
        "id": "inst-1",
        "widgetId": "summary-cards",
        "position": {"x": 0, "y": 0},
        "size": {"cols": 4, "rows": 1},
        "config": {},
    },
    {
        "id": "inst-2",
        "widgetId": "allocation-chart",
        "position": {"x": 0, "y": 1},
        "size": {"cols": 2, "rows": 2},
        "config": {"chartType": "pie", "showLegend": True},
    },
    {
        "id": "inst-3",
        "widgetId": "performance-chart",
        "position": {"x": 2, "y": 1},
        "size": {"cols": 2, "rows": 2},
        "config": {"period": "1Y", "showBenchmark": True},
    },
    {
        "id": "inst-4",
        "widgetId": "alerts",
        "position": {"x": 0, "y": 3},
        "size": {"cols": 2, "rows": 2},
        "config": {"maxAlerts": 5},
    },
    {
        "id": "inst-5",
        "widgetId": "market-brief",
        "position": {"x": 2, "y": 3},
        "size": {"cols": 2, "rows": 2},
        "config": {"briefType": "morning"},
    },
    {
        "id": "inst-6",
        "widgetId": "quick-actions",
        "position": {"x": 0, "y": 5},
        "size": {"cols": 4, "rows": 1},
        "config": {},
    },
]


def create_mock_user(user_id: str = "user-123", tenant_id: str = "tenant-456") -> dict:
    """Create a mock CurrentUser for testing."""
    return {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role": "admin",
        "permissions": ["admin:manage_users", "dashboard:edit"],
    }


def create_mock_layout(
    layout_id: str = "layout-001",
    user_id: str = "user-123",
    name: str = "default",
    is_active: bool = True,
    widgets: list | None = None,
) -> dict:
    """Create a mock DashboardLayout record."""
    return {
        "id": layout_id,
        "user_id": user_id,
        "name": name,
        "is_active": is_active,
        "widgets": json.dumps(widgets or DEFAULT_WIDGETS),
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }


# =============================================================================
# GET LAYOUTS TESTS
# =============================================================================


class TestGetLayouts:
    """Test getting all layouts for a user."""

    @pytest.mark.asyncio
    async def test_get_layouts_returns_all_user_layouts(self):
        """GET layouts should return all layouts for the current user."""
        from arc.api.routes.dashboard import get_layouts

        mock_user = create_mock_user()
        mock_layouts = [
            create_mock_layout("layout-001", name="default", is_active=True),
            create_mock_layout("layout-002", name="analytics-focus", is_active=False),
        ]

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = mock_layouts

            result = await get_layouts(mock_user)

            # Verify DataFlow was called correctly
            mock_list.assert_called_once_with(
                "DashboardLayout",
                filter={"user_id": "user-123"},
                limit=100,
            )

            # Verify response structure
            assert result["success"] is True
            assert len(result["data"]) == 2
            assert result["data"][0]["name"] == "default"
            assert result["data"][0]["is_active"] is True
            assert result["data"][1]["name"] == "analytics-focus"

    @pytest.mark.asyncio
    async def test_get_layouts_creates_default_if_none_exist(self):
        """GET layouts should create default layout if user has none."""
        from arc.api.routes.dashboard import get_layouts

        mock_user = create_mock_user()
        created_layout = create_mock_layout(name="Default")

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list, \
             patch("arc.models.db.express.create", new_callable=AsyncMock) as mock_create:
            mock_list.return_value = []
            mock_create.return_value = created_layout

            result = await get_layouts(mock_user)

            # Verify default was created
            mock_create.assert_called_once()
            call_args = mock_create.call_args[0]
            assert call_args[0] == "DashboardLayout"
            assert call_args[1]["user_id"] == "user-123"
            assert call_args[1]["name"] == "Default"
            assert call_args[1]["is_active"] is True

            # Verify response
            assert result["success"] is True
            assert len(result["data"]) == 1

    @pytest.mark.asyncio
    async def test_get_layouts_deserializes_widgets_json(self):
        """GET layouts should deserialize widgets JSON to list."""
        from arc.api.routes.dashboard import get_layouts

        mock_user = create_mock_user()
        mock_layout = create_mock_layout(widgets=DEFAULT_WIDGETS)

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = [mock_layout]

            result = await get_layouts(mock_user)

            # Verify widgets are deserialized
            assert isinstance(result["data"][0]["widgets"], list)
            assert len(result["data"][0]["widgets"]) == 6
            assert result["data"][0]["widgets"][0]["widgetId"] == "summary-cards"


# =============================================================================
# GET ACTIVE LAYOUT TESTS
# =============================================================================


class TestGetActiveLayout:
    """Test getting the active layout for a user."""

    @pytest.mark.asyncio
    async def test_get_active_layout_returns_active(self):
        """GET active layout should return the layout where is_active=True."""
        from arc.api.routes.dashboard import get_active_layout

        mock_user = create_mock_user()
        mock_layout = create_mock_layout(is_active=True)

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = [mock_layout]

            result = await get_active_layout(mock_user)

            mock_list.assert_called_once_with(
                "DashboardLayout",
                filter={"user_id": "user-123", "is_active": True},
                limit=1,
            )

            assert result["success"] is True
            assert result["data"]["is_active"] is True

    @pytest.mark.asyncio
    async def test_get_active_layout_creates_default_if_none(self):
        """GET active layout should create default if no active layout exists."""
        from arc.api.routes.dashboard import get_active_layout

        mock_user = create_mock_user()
        created_layout = create_mock_layout(name="Default", is_active=True)

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list, \
             patch("arc.models.db.express.create", new_callable=AsyncMock) as mock_create:
            mock_list.return_value = []
            mock_create.return_value = created_layout

            result = await get_active_layout(mock_user)

            mock_create.assert_called_once()
            assert result["success"] is True
            assert result["data"]["name"] == "Default"


# =============================================================================
# CREATE LAYOUT TESTS
# =============================================================================


class TestCreateLayout:
    """Test creating a new layout."""

    @pytest.mark.asyncio
    async def test_create_layout_success(self):
        """POST layout should create a new layout."""
        from arc.api.routes.dashboard import create_layout, CreateLayoutRequest

        mock_user = create_mock_user()
        request = CreateLayoutRequest(name="My Custom Layout", widgets=DEFAULT_WIDGETS)
        created_layout = create_mock_layout(
            layout_id="layout-new",
            name="My Custom Layout",
            is_active=False,
        )

        with patch("arc.models.db.express.create", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = created_layout

            result = await create_layout(mock_user, request)

            mock_create.assert_called_once()
            call_args = mock_create.call_args[0]
            assert call_args[0] == "DashboardLayout"
            assert call_args[1]["user_id"] == "user-123"
            assert call_args[1]["name"] == "My Custom Layout"
            assert call_args[1]["is_active"] is False  # New layouts are not active

            assert result["success"] is True
            assert result["data"]["name"] == "My Custom Layout"

    @pytest.mark.asyncio
    async def test_create_layout_serializes_widgets(self):
        """POST layout should serialize widgets to JSON."""
        from arc.api.routes.dashboard import create_layout, CreateLayoutRequest

        mock_user = create_mock_user()
        widgets = [{"id": "test-1", "widgetId": "alerts", "position": {"x": 0, "y": 0}, "size": {"cols": 2, "rows": 2}, "config": {}}]
        request = CreateLayoutRequest(name="Test Layout", widgets=widgets)
        created_layout = create_mock_layout(name="Test Layout", widgets=widgets)

        with patch("arc.models.db.express.create", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = created_layout

            await create_layout(mock_user, request)

            # Verify widgets were serialized to JSON string
            call_args = mock_create.call_args[0]
            assert isinstance(call_args[1]["widgets"], str)
            parsed = json.loads(call_args[1]["widgets"])
            assert parsed[0]["widgetId"] == "alerts"

    @pytest.mark.asyncio
    async def test_create_layout_validates_name(self):
        """POST layout should reject empty name."""
        from arc.api.routes.dashboard import create_layout, CreateLayoutRequest

        mock_user = create_mock_user()

        # Pydantic should enforce min_length
        with pytest.raises(ValueError):
            CreateLayoutRequest(name="", widgets=DEFAULT_WIDGETS)


# =============================================================================
# UPDATE LAYOUT TESTS
# =============================================================================


class TestUpdateLayout:
    """Test updating an existing layout."""

    @pytest.mark.asyncio
    async def test_update_layout_success(self):
        """PUT layout should update an existing layout."""
        from arc.api.routes.dashboard import update_layout, UpdateLayoutRequest

        mock_user = create_mock_user()
        layout_id = "layout-001"
        request = UpdateLayoutRequest(name="Updated Name")
        existing_layout = create_mock_layout(layout_id)
        updated_layout = create_mock_layout(layout_id, name="Updated Name")

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.update", new_callable=AsyncMock) as mock_update:
            mock_read.return_value = existing_layout
            mock_update.return_value = updated_layout

            result = await update_layout(mock_user, layout_id, request)

            mock_read.assert_called_once_with("DashboardLayout", layout_id)
            mock_update.assert_called_once()

            assert result["success"] is True
            assert result["data"]["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_layout_not_found(self):
        """PUT layout should return error for non-existent layout."""
        from arc.api.routes.dashboard import update_layout, UpdateLayoutRequest

        mock_user = create_mock_user()
        request = UpdateLayoutRequest(name="Updated")

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = None

            result = await update_layout(mock_user, "non-existent", request)

            assert result["success"] is False
            assert result["error"]["code"] == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_update_layout_wrong_user(self):
        """PUT layout should reject update for other user's layout."""
        from arc.api.routes.dashboard import update_layout, UpdateLayoutRequest

        mock_user = create_mock_user(user_id="user-123")
        layout_id = "layout-001"
        request = UpdateLayoutRequest(name="Hacked Name")
        other_user_layout = create_mock_layout(layout_id, user_id="other-user-999")

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = other_user_layout

            result = await update_layout(mock_user, layout_id, request)

            assert result["success"] is False
            assert result["error"]["code"] == "FORBIDDEN"

    @pytest.mark.asyncio
    async def test_update_layout_can_update_widgets(self):
        """PUT layout should allow updating widgets."""
        from arc.api.routes.dashboard import update_layout, UpdateLayoutRequest

        mock_user = create_mock_user()
        layout_id = "layout-001"
        new_widgets = [{"id": "new-1", "widgetId": "alerts", "position": {"x": 0, "y": 0}, "size": {"cols": 4, "rows": 2}, "config": {}}]
        request = UpdateLayoutRequest(widgets=new_widgets)
        existing_layout = create_mock_layout(layout_id)
        updated_layout = create_mock_layout(layout_id, widgets=new_widgets)

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.update", new_callable=AsyncMock) as mock_update:
            mock_read.return_value = existing_layout
            mock_update.return_value = updated_layout

            result = await update_layout(mock_user, layout_id, request)

            # Verify widgets were serialized in update
            call_args = mock_update.call_args
            fields = call_args[1]["fields"]
            assert "widgets" in fields
            assert isinstance(fields["widgets"], str)

            assert result["success"] is True


# =============================================================================
# DELETE LAYOUT TESTS
# =============================================================================


class TestDeleteLayout:
    """Test deleting a layout."""

    @pytest.mark.asyncio
    async def test_delete_layout_success(self):
        """DELETE layout should delete an existing layout."""
        from arc.api.routes.dashboard import delete_layout

        mock_user = create_mock_user()
        layout_id = "layout-002"
        layout_to_delete = create_mock_layout(layout_id, is_active=False)
        other_layout = create_mock_layout("layout-001", is_active=True)

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list, \
             patch("arc.models.db.express.delete", new_callable=AsyncMock) as mock_delete:
            mock_read.return_value = layout_to_delete
            mock_list.return_value = [other_layout, layout_to_delete]  # 2 layouts exist
            mock_delete.return_value = True

            result = await delete_layout(mock_user, layout_id)

            mock_delete.assert_called_once_with("DashboardLayout", layout_id)
            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_delete_layout_not_found(self):
        """DELETE layout should return error for non-existent layout."""
        from arc.api.routes.dashboard import delete_layout

        mock_user = create_mock_user()

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = None

            result = await delete_layout(mock_user, "non-existent")

            assert result["success"] is False
            assert result["error"]["code"] == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_delete_layout_wrong_user(self):
        """DELETE layout should reject deleting other user's layout."""
        from arc.api.routes.dashboard import delete_layout

        mock_user = create_mock_user(user_id="user-123")
        layout_id = "layout-001"
        other_user_layout = create_mock_layout(layout_id, user_id="other-user-999")

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = other_user_layout

            result = await delete_layout(mock_user, layout_id)

            assert result["success"] is False
            assert result["error"]["code"] == "FORBIDDEN"

    @pytest.mark.asyncio
    async def test_delete_layout_cannot_delete_last(self):
        """DELETE layout should prevent deleting last layout."""
        from arc.api.routes.dashboard import delete_layout

        mock_user = create_mock_user()
        layout_id = "layout-001"
        only_layout = create_mock_layout(layout_id)

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_read.return_value = only_layout
            mock_list.return_value = [only_layout]  # Only 1 layout exists

            result = await delete_layout(mock_user, layout_id)

            assert result["success"] is False
            assert result["error"]["code"] == "VALIDATION_ERROR"
            assert "last layout" in result["error"]["message"].lower()


# =============================================================================
# ACTIVATE LAYOUT TESTS
# =============================================================================


class TestActivateLayout:
    """Test activating a layout."""

    @pytest.mark.asyncio
    async def test_activate_layout_success(self):
        """POST activate should set layout as active and deactivate others."""
        from arc.api.routes.dashboard import activate_layout

        mock_user = create_mock_user()
        layout_id = "layout-002"
        current_active = create_mock_layout("layout-001", is_active=True)
        layout_to_activate = create_mock_layout(layout_id, is_active=False)
        activated_layout = create_mock_layout(layout_id, is_active=True)

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list, \
             patch("arc.models.db.express.update", new_callable=AsyncMock) as mock_update:
            mock_read.return_value = layout_to_activate
            mock_list.return_value = [current_active]  # Current active layout
            mock_update.return_value = activated_layout

            result = await activate_layout(mock_user, layout_id)

            # Should deactivate old and activate new
            assert mock_update.call_count == 2
            assert result["success"] is True
            assert result["data"]["is_active"] is True

    @pytest.mark.asyncio
    async def test_activate_layout_not_found(self):
        """POST activate should return error for non-existent layout."""
        from arc.api.routes.dashboard import activate_layout

        mock_user = create_mock_user()

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = None

            result = await activate_layout(mock_user, "non-existent")

            assert result["success"] is False
            assert result["error"]["code"] == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_activate_layout_wrong_user(self):
        """POST activate should reject activating other user's layout."""
        from arc.api.routes.dashboard import activate_layout

        mock_user = create_mock_user(user_id="user-123")
        layout_id = "layout-001"
        other_user_layout = create_mock_layout(layout_id, user_id="other-user-999")

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read:
            mock_read.return_value = other_user_layout

            result = await activate_layout(mock_user, layout_id)

            assert result["success"] is False
            assert result["error"]["code"] == "FORBIDDEN"

    @pytest.mark.asyncio
    async def test_activate_already_active_layout(self):
        """POST activate on already active layout should succeed without changes."""
        from arc.api.routes.dashboard import activate_layout

        mock_user = create_mock_user()
        layout_id = "layout-001"
        already_active = create_mock_layout(layout_id, is_active=True)

        with patch("arc.models.db.express.read", new_callable=AsyncMock) as mock_read, \
             patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_read.return_value = already_active
            mock_list.return_value = [already_active]

            result = await activate_layout(mock_user, layout_id)

            assert result["success"] is True
            assert result["data"]["is_active"] is True


# =============================================================================
# PYDANTIC SCHEMA TESTS
# =============================================================================


class TestSchemas:
    """Test Pydantic schemas for request/response validation."""

    def test_create_layout_request_valid(self):
        """CreateLayoutRequest should accept valid data."""
        from arc.api.routes.dashboard import CreateLayoutRequest

        request = CreateLayoutRequest(
            name="My Layout",
            widgets=[
                {
                    "id": "inst-1",
                    "widgetId": "alerts",
                    "position": {"x": 0, "y": 0},
                    "size": {"cols": 2, "rows": 2},
                    "config": {"maxAlerts": 10},
                }
            ],
        )

        assert request.name == "My Layout"
        assert len(request.widgets) == 1
        assert request.widgets[0].widgetId == "alerts"

    def test_create_layout_request_empty_widgets(self):
        """CreateLayoutRequest should allow empty widgets list."""
        from arc.api.routes.dashboard import CreateLayoutRequest

        request = CreateLayoutRequest(name="Empty Layout", widgets=[])
        assert request.widgets == []

    def test_update_layout_request_all_optional(self):
        """UpdateLayoutRequest should allow partial updates."""
        from arc.api.routes.dashboard import UpdateLayoutRequest

        # Only update name
        request1 = UpdateLayoutRequest(name="New Name")
        assert request1.name == "New Name"
        assert request1.widgets is None

        # Only update widgets
        request2 = UpdateLayoutRequest(widgets=[])
        assert request2.name is None
        assert request2.widgets == []

        # Only update is_active
        request3 = UpdateLayoutRequest(is_active=True)
        assert request3.name is None
        assert request3.is_active is True

    def test_widget_position_schema(self):
        """WidgetPosition should validate x and y as integers."""
        from arc.api.routes.dashboard import WidgetPosition

        pos = WidgetPosition(x=2, y=3)
        assert pos.x == 2
        assert pos.y == 3

    def test_widget_size_schema(self):
        """WidgetSize should validate cols and rows as integers."""
        from arc.api.routes.dashboard import WidgetSize

        size = WidgetSize(cols=2, rows=2)
        assert size.cols == 2
        assert size.rows == 2

    def test_widget_instance_schema(self):
        """WidgetInstance should have all required fields."""
        from arc.api.routes.dashboard import WidgetInstance, WidgetPosition, WidgetSize

        widget = WidgetInstance(
            id="inst-1",
            widgetId="summary-cards",
            position=WidgetPosition(x=0, y=0),
            size=WidgetSize(cols=4, rows=1),
        )

        assert widget.id == "inst-1"
        assert widget.widgetId == "summary-cards"
        assert widget.position.x == 0
        assert widget.size.cols == 4
        assert widget.config == {}  # Default empty dict

    def test_widget_instance_with_config(self):
        """WidgetInstance should accept custom config."""
        from arc.api.routes.dashboard import WidgetInstance, WidgetPosition, WidgetSize

        widget = WidgetInstance(
            id="inst-1",
            widgetId="alerts",
            position=WidgetPosition(x=0, y=0),
            size=WidgetSize(cols=2, rows=2),
            config={"maxAlerts": 10, "showDismissed": False},
        )

        assert widget.config["maxAlerts"] == 10
        assert widget.config["showDismissed"] is False


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestErrorHandling:
    """Test error handling in dashboard routes."""

    @pytest.mark.asyncio
    async def test_get_layouts_handles_db_error(self):
        """GET layouts should handle database errors gracefully."""
        from arc.api.routes.dashboard import get_layouts

        mock_user = create_mock_user()

        with patch("arc.models.db.express.list", new_callable=AsyncMock) as mock_list:
            mock_list.side_effect = Exception("Database connection failed")

            result = await get_layouts(mock_user)

            assert result["success"] is False
            assert result["error"]["code"] == "INTERNAL_ERROR"

    @pytest.mark.asyncio
    async def test_create_layout_handles_db_error(self):
        """POST layout should handle database errors gracefully."""
        from arc.api.routes.dashboard import create_layout, CreateLayoutRequest

        mock_user = create_mock_user()
        request = CreateLayoutRequest(name="Test", widgets=[])

        with patch("arc.models.db.express.create", new_callable=AsyncMock) as mock_create:
            mock_create.side_effect = Exception("Insert failed")

            result = await create_layout(mock_user, request)

            assert result["success"] is False
            assert result["error"]["code"] == "INTERNAL_ERROR"


# =============================================================================
# MODEL TESTS
# =============================================================================


class TestDashboardLayoutModel:
    """Test DashboardLayout DataFlow model."""

    def test_model_is_registered(self):
        """DashboardLayout should be registered with DataFlow."""
        from arc.models import DashboardLayout

        assert DashboardLayout is not None

    def test_model_has_required_fields(self):
        """DashboardLayout should have all required fields."""
        from arc.models.dashboard import DashboardLayout

        # Check class annotations for required fields
        annotations = DashboardLayout.__annotations__

        assert "id" in annotations
        assert "user_id" in annotations
        assert "name" in annotations
        assert "is_active" in annotations
        assert "widgets" in annotations

    def test_model_has_multi_tenant_config(self):
        """DashboardLayout should have multi_tenant=True."""
        from arc.models.dashboard import DashboardLayout

        config = getattr(DashboardLayout, "__dataflow__", {})
        assert config.get("multi_tenant") is True
