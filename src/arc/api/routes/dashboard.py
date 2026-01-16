"""
Dashboard Layout API routes for ARC.

Endpoints for managing user dashboard layouts with widget configurations.

Endpoints:
- GET /api/v1/dashboard/layouts - Get all layouts for current user
- GET /api/v1/dashboard/layouts/active - Get active layout
- POST /api/v1/dashboard/layouts - Create new layout
- PUT /api/v1/dashboard/layouts/{id} - Update layout
- DELETE /api/v1/dashboard/layouts/{id} - Delete layout
- POST /api/v1/dashboard/layouts/{id}/activate - Set layout as active

Architecture:
- Direct async functions using DataFlow Express API for CRUD operations
- JSON serialization/deserialization for widgets field
- User isolation enforced at route level
"""

import json
import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from arc.api.auth import CurrentUser
from arc.models import db
from arc.models.dashboard import DEFAULT_WIDGETS
from arc.services import NotFoundError, ValidationError


# =============================================================================
# REQUEST/RESPONSE SCHEMAS
# =============================================================================


class WidgetPosition(BaseModel):
    """Position of a widget in the grid."""

    x: int = Field(..., ge=0, description="Column position (0-based)")
    y: int = Field(..., ge=0, description="Row position (0-based)")


class WidgetSize(BaseModel):
    """Size of a widget in grid units."""

    cols: int = Field(..., ge=1, le=4, description="Column span (1-4)")
    rows: int = Field(..., ge=1, le=4, description="Row span (1-4)")


class WidgetInstance(BaseModel):
    """A widget instance with position, size, and configuration."""

    id: str = Field(..., description="Unique instance ID")
    widgetId: str = Field(..., description="Widget type ID from registry")
    position: WidgetPosition = Field(..., description="Grid position")
    size: WidgetSize = Field(..., description="Grid size")
    config: dict = Field(default_factory=dict, description="Widget-specific config")


class CreateLayoutRequest(BaseModel):
    """Request to create a new dashboard layout."""

    name: str = Field(..., min_length=1, max_length=100, description="Layout name")
    widgets: list[WidgetInstance] = Field(..., description="Widget instances")


class UpdateLayoutRequest(BaseModel):
    """Request to update an existing dashboard layout."""

    name: str | None = Field(None, min_length=1, max_length=100, description="New name")
    widgets: list[WidgetInstance] | None = Field(None, description="New widget instances")
    is_active: bool | None = Field(None, description="Set as active layout")


class LayoutResponse(BaseModel):
    """Response containing a dashboard layout."""

    id: str
    user_id: str
    name: str
    is_active: bool
    widgets: list[WidgetInstance]
    created_at: str
    updated_at: str


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def format_error(e: Exception) -> dict[str, Any]:
    """Format exception as error response."""
    if isinstance(e, NotFoundError):
        return {"success": False, "error": {"code": "NOT_FOUND", "message": str(e)}}
    if isinstance(e, ValidationError):
        return {"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}
    return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}


def generate_id(prefix: str = "layout-") -> str:
    """Generate a unique ID with prefix."""
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"{prefix}{timestamp}-{short_uuid}"


def serialize_layout(layout: dict) -> dict[str, Any]:
    """Convert database layout to API response format."""
    widgets_str = layout.get("widgets", "[]")
    if isinstance(widgets_str, str):
        widgets = json.loads(widgets_str)
    else:
        widgets = widgets_str

    return {
        "id": layout["id"],
        "user_id": layout.get("user_id", ""),
        "name": layout.get("name", ""),
        "is_active": layout.get("is_active", False),
        "widgets": widgets,
        "created_at": layout.get("created_at", ""),
        "updated_at": layout.get("updated_at", ""),
    }


def widgets_to_json(widgets: list[WidgetInstance]) -> str:
    """Serialize WidgetInstance list to JSON string."""
    return json.dumps([w.model_dump() for w in widgets])


async def create_default_layout(user_id: str, tenant_id: str) -> dict:
    """Create a default layout for a new user."""
    layout_id = generate_id()

    layout = await db.express.create(
        "DashboardLayout",
        {
            "id": layout_id,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "name": "Default",
            "is_active": True,
            "widgets": json.dumps(DEFAULT_WIDGETS),
        },
    )

    return layout


# =============================================================================
# API ROUTE FUNCTIONS
# =============================================================================


async def get_layouts(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get all dashboard layouts for the current user.

    If user has no layouts, creates a default layout automatically.

    Args:
        current_user: Authenticated user

    Returns:
        List of all user's dashboard layouts
    """
    try:
        layouts = await db.express.list(
            "DashboardLayout",
            filter={"user_id": current_user["user_id"]},
            limit=100,
        )

        # Create default layout if user has none
        if not layouts:
            default_layout = await create_default_layout(
                current_user["user_id"],
                current_user["tenant_id"],
            )
            layouts = [default_layout]

        return {
            "success": True,
            "data": [serialize_layout(layout) for layout in layouts],
        }
    except Exception as e:
        return format_error(e)


async def get_active_layout(current_user: CurrentUser) -> dict[str, Any]:
    """
    Get the active dashboard layout for the current user.

    If no active layout exists, creates a default layout.

    Args:
        current_user: Authenticated user

    Returns:
        The active dashboard layout
    """
    try:
        layouts = await db.express.list(
            "DashboardLayout",
            filter={"user_id": current_user["user_id"], "is_active": True},
            limit=1,
        )

        if not layouts:
            # Create default layout
            default_layout = await create_default_layout(
                current_user["user_id"],
                current_user["tenant_id"],
            )
            return {
                "success": True,
                "data": serialize_layout(default_layout),
            }

        return {
            "success": True,
            "data": serialize_layout(layouts[0]),
        }
    except Exception as e:
        return format_error(e)


async def create_layout(
    current_user: CurrentUser,
    data: CreateLayoutRequest,
) -> dict[str, Any]:
    """
    Create a new dashboard layout.

    New layouts are created as inactive by default.

    Args:
        current_user: Authenticated user
        data: Layout creation data

    Returns:
        Created layout
    """
    try:
        layout_id = generate_id()

        layout = await db.express.create(
            "DashboardLayout",
            {
                "id": layout_id,
                "user_id": current_user["user_id"],
                "tenant_id": current_user["tenant_id"],
                "name": data.name,
                "is_active": False,  # New layouts are not active
                "widgets": widgets_to_json(data.widgets),
            },
        )

        return {
            "success": True,
            "data": serialize_layout(layout),
        }
    except Exception as e:
        return format_error(e)


async def update_layout(
    current_user: CurrentUser,
    layout_id: str,
    data: UpdateLayoutRequest,
) -> dict[str, Any]:
    """
    Update an existing dashboard layout.

    Args:
        current_user: Authenticated user
        layout_id: Layout ID to update
        data: Update data

    Returns:
        Updated layout
    """
    try:
        # Verify layout exists
        layout = await db.express.read("DashboardLayout", layout_id)
        if not layout:
            return format_error(NotFoundError("Layout not found"))

        # Verify ownership
        if layout.get("user_id") != current_user["user_id"]:
            return {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Cannot modify other user's layout"},
            }

        # Build update fields
        fields: dict[str, Any] = {}
        if data.name is not None:
            fields["name"] = data.name
        if data.widgets is not None:
            fields["widgets"] = widgets_to_json(data.widgets)
        if data.is_active is not None:
            fields["is_active"] = data.is_active

        if not fields:
            return {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "No updates provided"},
            }

        # If setting as active, deactivate other layouts first
        if data.is_active is True:
            # Get current active layout
            active_layouts = await db.express.list(
                "DashboardLayout",
                filter={"user_id": current_user["user_id"], "is_active": True},
                limit=10,
            )
            for active in active_layouts:
                if active["id"] != layout_id:
                    await db.express.update(
                        "DashboardLayout",
                        filter={"id": active["id"]},
                        fields={"is_active": False},
                    )

        updated = await db.express.update(
            "DashboardLayout",
            filter={"id": layout_id},
            fields=fields,
        )

        return {
            "success": True,
            "data": serialize_layout(updated),
        }
    except Exception as e:
        return format_error(e)


async def delete_layout(
    current_user: CurrentUser,
    layout_id: str,
) -> dict[str, Any]:
    """
    Delete a dashboard layout.

    Cannot delete the last remaining layout.

    Args:
        current_user: Authenticated user
        layout_id: Layout ID to delete

    Returns:
        Deletion confirmation
    """
    try:
        # Verify layout exists
        layout = await db.express.read("DashboardLayout", layout_id)
        if not layout:
            return format_error(NotFoundError("Layout not found"))

        # Verify ownership
        if layout.get("user_id") != current_user["user_id"]:
            return {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Cannot delete other user's layout"},
            }

        # Check if this is the last layout
        all_layouts = await db.express.list(
            "DashboardLayout",
            filter={"user_id": current_user["user_id"]},
            limit=10,
        )

        if len(all_layouts) <= 1:
            return {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Cannot delete the last layout. Users must have at least one layout.",
                },
            }

        await db.express.delete("DashboardLayout", layout_id)

        return {
            "success": True,
            "data": {"deleted": True, "layout_id": layout_id},
        }
    except Exception as e:
        return format_error(e)


async def activate_layout(
    current_user: CurrentUser,
    layout_id: str,
) -> dict[str, Any]:
    """
    Set a layout as the active layout.

    Deactivates all other layouts for the user.

    Args:
        current_user: Authenticated user
        layout_id: Layout ID to activate

    Returns:
        Activated layout
    """
    try:
        # Verify layout exists
        layout = await db.express.read("DashboardLayout", layout_id)
        if not layout:
            return format_error(NotFoundError("Layout not found"))

        # Verify ownership
        if layout.get("user_id") != current_user["user_id"]:
            return {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Cannot activate other user's layout"},
            }

        # If already active, just return it
        if layout.get("is_active"):
            return {
                "success": True,
                "data": serialize_layout(layout),
            }

        # Deactivate all other layouts
        active_layouts = await db.express.list(
            "DashboardLayout",
            filter={"user_id": current_user["user_id"], "is_active": True},
            limit=10,
        )

        for active in active_layouts:
            await db.express.update(
                "DashboardLayout",
                filter={"id": active["id"]},
                fields={"is_active": False},
            )

        # Activate the requested layout
        updated = await db.express.update(
            "DashboardLayout",
            filter={"id": layout_id},
            fields={"is_active": True},
        )

        return {
            "success": True,
            "data": serialize_layout(updated),
        }
    except Exception as e:
        return format_error(e)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Schemas
    "WidgetPosition",
    "WidgetSize",
    "WidgetInstance",
    "CreateLayoutRequest",
    "UpdateLayoutRequest",
    "LayoutResponse",
    # Functions
    "get_layouts",
    "get_active_layout",
    "create_layout",
    "update_layout",
    "delete_layout",
    "activate_layout",
]
