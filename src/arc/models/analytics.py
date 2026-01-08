"""
Analytics domain models for ARC investment platform.

This module contains models for:
- Alert: User notifications and alerts
- AlertThreshold: User-configurable ratio thresholds
- PeerGroup: Security groupings for comparison

DataFlow automatically generates 11 nodes per model for CRUD operations.

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id'
- Alerts are tenant-scoped via user_id
- PeerGroups can be system-defined (user_id=None) or user-specific
"""

from arc.models.database import db


@db.model
class Alert:
    """
    User notification/alert record.

    Represents alerts triggered by thresholds, anomalies, news,
    earnings, compliance violations, or system events.
    """

    # Primary Key
    id: str  # UUID

    # Relationships
    user_id: str  # FK to User (recipient)
    portfolio_id: str | None = None  # Related portfolio
    security_id: str | None = None  # Related security

    # Alert Classification
    alert_type: str  # threshold, anomaly, news, earnings, compliance, system, rebalance
    severity: str = "info"  # info, warning, critical

    # Content
    title: str  # "AAPL: Current Ratio Below Threshold"
    message: str  # Full alert message
    explanation: str | None = None  # AI-generated explanation

    # Trigger Details
    trigger_value: str | None = None  # Value that triggered the alert
    threshold_value: str | None = None  # Threshold that was breached
    ratio_name: str | None = None  # For ratio-based alerts
    metric_name: str | None = None  # For other metric alerts
    comparison: str | None = None  # lt, gt, eq, lte, gte

    # Suggested Actions
    suggested_actions: list[str] = []  # Recommended actions
    action_url: str | None = None  # Deep link to relevant page

    # Timing
    triggered_at: str  # ISO datetime when alert was triggered
    expires_at: str | None = None  # Auto-dismiss after this time

    # Status Workflow: active → acknowledged → dismissed/resolved
    status: str = "active"  # active, acknowledged, dismissed, resolved

    # Acknowledgment
    acknowledged_at: str | None = None
    acknowledged_by: str | None = None  # User ID who acknowledged

    # Dismissal
    dismissed_at: str | None = None
    dismissed_by: str | None = None
    dismiss_reason: str | None = None

    # Resolution
    resolved_at: str | None = None
    resolved_by: str | None = None
    resolution_notes: str | None = None

    # Delivery Tracking
    delivery_status: dict = {}  # {"email": "sent", "sms": "pending", "in_app": "delivered"}

    # Metadata
    metadata: dict = {}  # Additional context
    source: str = "system"  # system, workflow, agent, user

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["user_id", "status"]},
        {"fields": ["portfolio_id"]},
        {"fields": ["security_id"]},
        {"fields": ["alert_type", "severity"]},
        {"fields": ["triggered_at"]},
        {"fields": ["status"]},
        {"fields": ["expires_at"]},
    ]


@db.model
class AlertThreshold:
    """
    User-configurable alert threshold.

    Defines when alerts should be triggered based on ratio/metric values.
    Supports cooldown periods to prevent alert spam.
    """

    # Primary Key
    id: str  # UUID

    # Ownership
    user_id: str  # FK to User

    # Scope
    portfolio_id: str | None = None  # Portfolio-specific, or None for all portfolios
    security_id: str | None = None  # Security-specific, or None for all securities

    # Ratio/Metric Definition
    ratio_class: str  # liquidity, profitability, efficiency, leverage, valuation, growth
    ratio_name: str  # current_ratio, quick_ratio, roe, roa, etc.

    # Thresholds (as string decimals)
    warning_threshold: str  # Value for warning alert
    critical_threshold: str  # Value for critical alert

    # Comparison
    comparison: str  # lt, gt, eq, lte, gte

    # Settings
    enabled: bool = True
    alert_on_improvement: bool = False  # Also alert when ratio improves
    include_peer_comparison: bool = True  # Include peer percentile

    # Cooldown (prevent alert spam)
    cooldown_hours: int = 24  # Hours before re-alerting
    last_triggered_at: str | None = None  # Last alert time
    last_triggered_value: str | None = None  # Last value that triggered

    # Tracking
    times_triggered: int = 0  # Total times this threshold triggered

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["user_id", "ratio_name"]},
        {"fields": ["user_id", "portfolio_id"]},
        {"fields": ["enabled"]},
        {"fields": ["ratio_class"]},
    ]


@db.model
class PeerGroup:
    """
    Security peer group for comparison analysis.

    Can be system-defined (user_id=None) or user-specific.
    Supports criteria-based auto-refresh or explicit membership.
    """

    # Primary Key
    id: str  # UUID or "sector_technology_large"

    # Ownership (None for system-defined groups)
    user_id: str | None = None  # FK to User, or None for system groups

    # Basic Info
    name: str  # "Large Cap Technology"
    description: str | None = None
    group_type: str = "custom"  # sector, industry, market_cap, custom, index

    # Criteria for Auto-Generated Groups (JSON)
    criteria: dict = {
        # "sector": "Information Technology",
        # "industry": None,
        # "market_cap_min": "10000000000",  # $10B
        # "market_cap_max": None,
        # "country": "US",
        # "exchange": None,
    }

    # Explicit Membership
    security_ids: list[str] = []  # Explicit members
    exclude_security_ids: list[str] = []  # Excluded from auto-generated

    # Auto-Refresh Settings
    auto_refresh: bool = False  # Auto-update membership based on criteria
    refresh_frequency: str = "daily"  # daily, weekly, monthly
    last_refreshed_at: str | None = None

    # Statistics
    member_count: int = 0
    stats_date: str | None = None  # When stats were calculated

    # Aggregate Statistics (populated by workflows)
    avg_market_cap: str | None = None
    avg_pe_ratio: str | None = None
    avg_roe: str | None = None
    avg_revenue_growth: str | None = None

    # Status
    active: bool = True

    __dataflow__ = {
        "multi_tenant": True,  # Multi-tenant but user_id can be None for system groups
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["user_id"]},
        {"fields": ["group_type"]},
        {"fields": ["active"]},
    ]


@db.model
class Report:
    """
    Generated report record.

    Tracks report generation requests and their outputs.
    Supports various report types and formats.
    """

    # Primary Key
    id: str  # UUID

    # Ownership
    user_id: str  # FK to User who requested

    # Scope
    portfolio_id: str | None = None  # Portfolio report
    security_id: str | None = None  # Security report

    # Report Definition
    report_type: (
        str  # portfolio_summary, performance, holdings, transactions, tax_lots, compliance, custom
    )
    report_name: str  # User-friendly name
    description: str | None = None

    # Parameters
    parameters: dict = {}  # Report-specific parameters
    date_range_start: str | None = None  # ISO date
    date_range_end: str | None = None  # ISO date
    as_of_date: str | None = None  # Point-in-time date

    # Format
    output_format: str = "pdf"  # pdf, xlsx, csv, html, json

    # Status
    status: str = "pending"  # pending, generating, completed, failed
    progress_percent: int = 0  # 0-100
    error_message: str | None = None

    # Output
    output_url: str | None = None  # URL to download report
    output_size_bytes: int | None = None
    page_count: int | None = None

    # Timing
    requested_at: str  # ISO datetime
    started_at: str | None = None
    completed_at: str | None = None
    expires_at: str | None = None  # When download link expires

    # Scheduling
    is_scheduled: bool = False
    schedule_cron: str | None = None  # Cron expression
    schedule_timezone: str | None = None
    next_run_at: str | None = None

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["user_id", "status"]},
        {"fields": ["portfolio_id"]},
        {"fields": ["report_type"]},
        {"fields": ["status"]},
        {"fields": ["requested_at"]},
        {"fields": ["is_scheduled", "next_run_at"]},
    ]


@db.model
class WatchlistItem:
    """
    User's watchlist item.

    Tracks securities a user is monitoring without holding.
    """

    # Primary Key
    id: str  # UUID

    # Ownership
    user_id: str  # FK to User
    watchlist_id: str | None = None  # FK to Watchlist (for multiple lists)

    # Security
    security_id: str  # FK to Security

    # Price Targets
    target_price: str | None = None  # Target buy/sell price
    stop_loss: str | None = None  # Stop loss price
    price_at_addition: str | None = None  # Price when added

    # Alerts
    alert_on_target: bool = False
    alert_on_stop: bool = False
    alert_on_news: bool = True
    alert_on_earnings: bool = True

    # Notes
    notes: str | None = None
    tags: list[str] = []

    # Tracking
    added_at: str  # ISO datetime

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": False,  # High frequency updates
    }

    __indexes__ = [
        {"fields": ["user_id", "security_id"], "unique": True},
        {"fields": ["user_id", "watchlist_id"]},
        {"fields": ["security_id"]},
    ]


@db.model
class Watchlist:
    """
    Named watchlist for organizing watched securities.

    Users can have multiple watchlists for different purposes.
    """

    # Primary Key
    id: str  # UUID

    # Ownership
    user_id: str  # FK to User

    # Basic Info
    name: str  # "Tech Stocks to Watch"
    description: str | None = None
    color: str | None = None  # Hex color for UI
    icon: str | None = None  # Icon name

    # Settings
    is_default: bool = False  # Default watchlist for user
    sort_order: int = 0

    # Statistics (populated by workflows)
    item_count: int = 0
    avg_daily_change: str | None = None

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": False,
    }

    __indexes__ = [
        {"fields": ["user_id"]},
        {"fields": ["user_id", "is_default"]},
    ]
