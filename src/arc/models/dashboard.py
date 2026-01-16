"""
Dashboard domain models for user dashboard layout customization.

DataFlow automatically generates 11 nodes per model:
- {Model}CreateNode, {Model}ReadNode, {Model}UpdateNode, {Model}DeleteNode
- {Model}ListNode, {Model}CountNode, {Model}UpsertNode
- {Model}BulkCreateNode, {Model}BulkUpdateNode, {Model}BulkDeleteNode, {Model}BulkUpsertNode

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id' - not layout_id, dashboard_id, etc.
- CreateNode uses FLAT fields, UpdateNode uses NESTED filter+fields
"""

from arc.models.database import db


@db.model
class DashboardLayout:
    """
    User's saved dashboard layout configuration.

    Stores the widget arrangement, configuration, and active state for
    a user's customized dashboard view. Each user can have multiple
    layouts (e.g., "default", "analytics-focus") with one active at a time.

    The widgets field stores a JSON string of WidgetInstance[] containing:
    - Widget positions (x, y grid coordinates)
    - Widget sizes (cols, rows)
    - Widget configurations (per-widget settings)

    Multi-tenant model - DataFlow automatically adds tenant_id field and filters
    all queries by the current tenant context.
    """

    # Primary Key - MUST be named 'id' (DataFlow requirement)
    id: str  # UUID format, e.g., "layout-001"

    # Foreign Key
    user_id: str  # FK to User

    # Layout Identity
    name: str  # "Default", "Analytics Focus", etc.

    # Active State
    is_active: bool = False  # Only one layout per user should be active

    # Widget Configuration (JSON string)
    # Stores serialized WidgetInstance[] array with:
    # - id: unique instance identifier
    # - widgetId: reference to widget registry
    # - position: {x: number, y: number}
    # - size: {cols: number, rows: number}
    # - config: widget-specific configuration
    widgets: str = "[]"  # JSON-serialized widget instances

    # NOTE: tenant_id is AUTO-ADDED by DataFlow when multi_tenant=True
    # NOTE: created_at, updated_at are AUTO-MANAGED - never set manually!

    __dataflow__ = {
        "multi_tenant": True,  # Auto tenant_id + isolation
        "audit_log": False,  # Don't audit layout changes (frequent saves)
    }

    __indexes__ = [
        {"fields": ["user_id", "name"], "unique": True},  # One layout per name per user
        {"fields": ["user_id", "is_active"]},  # Quick lookup of active layout
    ]


# Default widget layout for new users
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
