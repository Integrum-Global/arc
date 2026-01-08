"""
Core domain models: Tenant and User.

DataFlow automatically generates 11 nodes per model:
- {Model}CreateNode, {Model}ReadNode, {Model}UpdateNode, {Model}DeleteNode
- {Model}ListNode, {Model}CountNode, {Model}UpsertNode
- {Model}BulkCreateNode, {Model}BulkUpdateNode, {Model}BulkDeleteNode, {Model}BulkUpsertNode

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id' - not user_id, tenant_id, etc.
- CreateNode uses FLAT fields, UpdateNode uses NESTED filter+fields
- soft_delete only affects DeleteNode - manually filter deleted_at in ListNode queries
"""

from arc.models.database import db


@db.model
class Tenant:
    """
    Organization/company using ARC platform (multi-tenant root).

    This model defines the tenant boundary for all multi_tenant=True models.
    All tenant-scoped data will be isolated by tenant_id.
    """

    # Primary Key - MUST be named 'id' (DataFlow requirement)
    id: str  # UUID format, e.g., "tenant-001"

    # Core Fields
    name: str  # "Smith Family Office"
    subdomain: str  # "smith" (unique identifier for routing)

    # Subscription
    plan: str = "professional"  # "trial" | "professional" | "enterprise" | "private"

    # Limits (based on plan tier)
    max_users: int = 10
    max_portfolios: int = 50

    # Settings
    reporting_currency: str = "USD"

    # Data Provider Access (stored as JSON array)
    data_providers: list[str] = []  # ["eodhd", "capitaliq", "pitchbook"]

    # Feature Flags (stored as JSON object)
    features_enabled: dict = {}  # {"ai_intelligence": true, "advanced_analytics": true}

    # Contact Information
    contact_email: str | None = None
    contact_phone: str | None = None

    # Status
    active: bool = True
    trial_ends_at: str | None = None  # ISO datetime string

    # Soft delete field (required when soft_delete=True)
    deleted_at: str | None = None

    # NOTE: created_at and updated_at are AUTO-MANAGED by DataFlow
    # NEVER set these manually - causes DF-104 error!

    __dataflow__ = {
        "tenant_root": True,  # This IS the tenant definition
        "audit_log": True,  # Track all changes
        "soft_delete": True,  # Use deleted_at instead of hard delete
    }

    __indexes__ = [
        {"fields": ["subdomain"], "unique": True},  # Unique subdomain
        {"fields": ["plan", "active"]},  # Query by plan + status
    ]


@db.model
class User:
    """
    User account within a tenant.

    Multi-tenant model - DataFlow automatically adds tenant_id field and filters
    all queries by the current tenant context.
    """

    # Primary Key - MUST be named 'id'
    id: str  # UUID format

    # Identity
    email: str  # Unique within tenant
    name: str  # Display name
    avatar_url: str | None = None  # Profile picture URL

    # Authentication
    auth_provider: str = "email"  # "email" | "google" | "microsoft" | "okta"
    auth_provider_id: str | None = None  # External OAuth ID
    password_hash: str | None = None  # Only for email auth (bcrypt hash)

    # Authorization
    role: str = (
        "viewer"  # "admin" | "investment_manager" | "family_office" | "compliance" | "analyst" | "viewer"
    )
    permissions_override: dict = {}  # Custom permission overrides (JSON)

    # Preferences
    timezone: str = "UTC"
    locale: str = "en-US"

    # Status
    active: bool = True
    email_verified: bool = False
    last_login_at: str | None = None  # ISO datetime string
    failed_login_attempts: int = 0
    locked_until: str | None = None  # ISO datetime string for account lockout

    # Soft delete
    deleted_at: str | None = None

    # NOTE: tenant_id is AUTO-ADDED by DataFlow when multi_tenant=True
    # NOTE: created_at, updated_at are AUTO-MANAGED - never set manually!

    __dataflow__ = {
        "multi_tenant": True,  # Auto tenant_id + isolation
        "audit_log": True,
        "soft_delete": True,
    }

    __indexes__ = [
        {"fields": ["email"]},  # Lookup by email (tenant-scoped)
        {"fields": ["role", "active"]},
        {"fields": ["auth_provider", "auth_provider_id"]},
    ]


@db.model
class UserPreference:
    """
    User preferences and settings (1:1 with User).

    Stores personalization settings, dashboard configuration, and default values.
    """

    # Primary Key - same as user_id for 1:1 relationship
    id: str  # Same as user_id

    # Foreign Key
    user_id: str  # FK to User

    # Default Selections
    default_portfolio_id: str | None = None  # Last viewed or preferred portfolio

    # Dashboard Configuration (JSON)
    dashboard_layout: dict = {
        "widgets": [
            {"type": "portfolio_summary", "position": 0},
            {"type": "market_overview", "position": 1},
            {"type": "alerts", "position": 2},
            {"type": "recent_activity", "position": 3},
        ]
    }

    # Morning Brief Configuration (JSON)
    brief_settings: dict = {
        "enabled": True,
        "delivery_time": "07:00",
        "include_market_summary": True,
        "include_portfolio_changes": True,
        "include_alerts": True,
        "include_ai_insights": True,
    }

    # Alert Thresholds (JSON)
    alert_thresholds: dict = {
        "price_change_pct": 5.0,  # Alert on 5% price change
        "volume_spike_multiplier": 2.0,  # Alert on 2x avg volume
        "position_drift_pct": 2.0,  # Alert on 2% drift from target
    }

    # Display Preferences
    number_format: str = "us"  # "us" (1,234.56) or "eu" (1.234,56)
    date_format: str = "MM/DD/YYYY"  # Date display format
    theme: str = "system"  # "light" | "dark" | "system"

    # NOTE: Multi-tenant via user relationship
    # NOTE: created_at, updated_at are AUTO-MANAGED

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": False,  # Don't audit preference changes
    }

    __indexes__ = [
        {"fields": ["user_id"], "unique": True},  # 1:1 with User
    ]


@db.model
class NotificationPreference:
    """
    Notification channel preferences for a user.

    Each user can have multiple notification channels configured
    (email, SMS, push, Slack, etc.) with different settings.
    """

    # Primary Key
    id: str  # UUID

    # Foreign Key
    user_id: str  # FK to User

    # Channel Configuration
    channel: str  # "email" | "sms" | "in_app" | "push" | "slack" | "teams"
    destination: str  # Target address (email, phone, webhook URL, etc.)

    # Filtering
    severity_filter: str = "all"  # "all" | "warning" | "critical"
    alert_types: list[str] = []  # Empty = all types, or specific types

    # Delivery Settings
    frequency: str = "immediate"  # "immediate" | "hourly_digest" | "daily_digest"

    # Quiet Hours (optional)
    quiet_hours_start: str | None = None  # "22:00"
    quiet_hours_end: str | None = None  # "07:00"
    quiet_hours_timezone: str | None = None  # Defaults to user timezone

    # Status
    enabled: bool = True
    verified: bool = False  # Channel verified (email confirmed, SMS verified)

    # NOTE: created_at, updated_at are AUTO-MANAGED

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["user_id", "channel"]},  # Query by user and channel
        {"fields": ["channel", "enabled"]},
    ]


@db.model
class Notification:
    """
    Notification record for delivery tracking.

    Stores notifications sent to users across all channels,
    with delivery status tracking and read/dismiss state.
    """

    # Primary Key
    id: str  # UUID format

    # Foreign Key
    user_id: str  # FK to User

    # Notification Content
    notification_type: str  # "alert" | "brief" | "system" | "announcement"
    title: str
    message: str
    data: dict = {}  # Additional structured data (JSON)

    # Priority
    priority: str = "normal"  # "low" | "normal" | "high" | "urgent"

    # Channels
    channels_requested: list[str] = []  # ["email", "push", "in_app"]
    delivery_status: dict = {}  # {"email": "sent", "push": "failed", "in_app": "delivered"}

    # Related Entity (optional)
    related_type: str | None = None  # "alert" | "portfolio" | "security"
    related_id: str | None = None  # ID of related entity

    # Action URL (optional)
    action_url: str | None = None  # Deep link for action

    # User Interaction
    read_at: str | None = None  # ISO datetime when user read it
    dismissed_at: str | None = None  # ISO datetime when user dismissed it

    # NOTE: created_at, updated_at are AUTO-MANAGED by DataFlow

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": False,  # Don't audit notification deliveries
    }

    __indexes__ = [
        {"fields": ["user_id", "read_at"]},  # Unread notifications for user
        {"fields": ["notification_type", "priority"]},
        {"fields": ["related_type", "related_id"]},  # Notifications for entity
    ]


@db.model
class AuditLog:
    """
    Audit trail for tracking changes to tenant data.

    Automatically populated by DataFlow when audit_log=True on models.
    This model stores the change history for compliance and debugging.
    """

    # Primary Key
    id: str  # UUID

    # What Changed
    model_name: str  # "User", "Portfolio", "Transaction"
    record_id: str  # ID of the affected record
    operation: str  # "create" | "update" | "delete"

    # Change Details (JSON)
    changes: dict = {}  # {"field": {"old": "value", "new": "value"}}
    snapshot: dict = {}  # Full record snapshot at time of change

    # Who Made the Change
    user_id: str | None = None  # May be None for system operations
    user_email: str | None = None  # Denormalized for display
    ip_address: str | None = None
    user_agent: str | None = None

    # Context
    request_id: str | None = None  # Correlation ID for tracing
    reason: str | None = None  # Optional reason/comment

    # Timestamp is auto-managed by DataFlow
    # created_at will be the audit timestamp

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": False,  # Don't audit the audit log!
    }

    __indexes__ = [
        {"fields": ["model_name", "record_id"]},  # Query by entity
        {"fields": ["user_id"]},  # Query by user
        {"fields": ["operation"]},
    ]
