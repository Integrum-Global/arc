# Notification Service

Multi-channel notification system for delivering alerts, briefs, and announcements to users across email, push, Slack, and in-app channels.

## Overview

The notification system consists of:

1. **Notification Model** - Database model for storing notification records
2. **Notification Handlers** - Channel-specific delivery handlers
3. **NotificationService** - Unified interface for multi-channel delivery

## Architecture

```
NotificationService
├── EmailHandler      - SMTP, SendGrid, AWS SES
├── PushHandler       - Firebase Cloud Messaging
├── SlackHandler      - Webhook and Bot API
└── InAppHandler      - Database storage, WebSocket
```

## Notification Model

The `Notification` model stores all notification records:

```python
from arc.models import Notification

# Fields
Notification:
    id: str                    # Unique notification ID
    user_id: str               # Target user
    notification_type: str     # "alert" | "brief" | "system" | "announcement"
    title: str                 # Notification title
    message: str               # Notification body
    data: dict                 # Additional payload data
    priority: str              # "low" | "normal" | "high" | "urgent"
    channels_requested: list   # Requested delivery channels
    delivery_status: dict      # Status per channel
    related_type: str | None   # Related entity type
    related_id: str | None     # Related entity ID
    action_url: str | None     # Action button URL
    read_at: str | None        # When read by user
    dismissed_at: str | None   # When dismissed
```

## Notification Types

| Type | Default Channels | Purpose |
|------|------------------|---------|
| `alert` | in_app, push | Price alerts, portfolio alerts |
| `brief` | email, in_app | Morning briefs, summaries |
| `system` | in_app | System messages, updates |
| `announcement` | email, in_app, push | Platform announcements |

## Priority Levels

| Priority | Email Subject | Slack Color | FCM Priority |
|----------|--------------|-------------|--------------|
| `low` | (none) | Gray | normal |
| `normal` | (none) | Blue | normal |
| `high` | [IMPORTANT] | Orange | high |
| `urgent` | [URGENT] | Red | high |

## Notification Handlers

### EmailHandler

Supports multiple providers: SMTP, SendGrid, AWS SES.

```python
from arc.integrations.notifications import EmailHandler, EmailConfig

# SMTP Configuration
config = EmailConfig(
    provider="smtp",
    smtp_host="smtp.example.com",
    smtp_port=587,
    smtp_username="user",
    smtp_password="password",
    from_email="noreply@example.com",
    from_name="ARC Platform",
)

handler = EmailHandler(config)
result = await handler.send(payload, "user@example.com")
```

#### SendGrid Configuration

```python
config = EmailConfig(
    provider="sendgrid",
    sendgrid_api_key="SG.xxxxx",
    from_email="noreply@example.com",
)

# Send with template
result = await handler.send(
    payload,
    "user@example.com",
    template_id="d-abc123",
)
```

### PushHandler

Firebase Cloud Messaging for Android, iOS, and Web.

```python
from arc.integrations.notifications import PushHandler, PushConfig

config = PushConfig(
    fcm_server_key="your_server_key",
    fcm_project_id="your-project-id",
)

handler = PushHandler(config)

# Send to device
result = await handler.send(payload, device_token)

# Send to topic
result = await handler.send_to_topic(payload, "alerts")
```

#### Push Options

```python
# Rich notification with badge and image
result = await handler.send(
    payload,
    device_token,
    badge=5,                    # Badge count
    sound="custom_sound",       # Sound to play
    image="https://...",        # Image URL
    collapse_key="group1",      # Group notifications
    ttl=3600,                   # Time-to-live (seconds)
)

# Data-only message (silent)
result = await handler.send(
    payload,
    device_token,
    data_only=True,
)
```

### SlackHandler

Webhook and Bot API support.

```python
from arc.integrations.notifications import SlackHandler, SlackConfig

# Webhook configuration
config = SlackConfig(
    webhook_url="https://hooks.slack.com/services/...",
)

# Bot API configuration
config = SlackConfig(
    bot_token="xoxb-xxxxx",
    default_channel="#alerts",
    bot_name="ARC Platform",
    bot_icon_emoji=":chart_with_upwards_trend:",
)

handler = SlackHandler(config)

# Send to channel
result = await handler.send(payload, "#general")

# Send to user (DM)
result = await handler.send(payload, "U0123456789")

# Reply in thread
result = await handler.send(
    payload,
    "#alerts",
    thread_ts="1234567890.123456",
)
```

### InAppHandler

Database storage with optional WebSocket broadcast.

```python
from arc.integrations.notifications import InAppHandler, InAppConfig

config = InAppConfig(
    max_notifications_per_user=100,
    auto_dismiss_days=30,
    enable_websocket=True,
)

handler = InAppHandler(config=config, db=db)

# Store notification
result = await handler.send(payload, user_id)

# Get notifications
notifications = await handler.get_notifications(
    user_id,
    limit=20,
    offset=0,
    unread_only=False,
)

# Mark as read
await handler.mark_as_read(notification_id, user_id)

# Dismiss
await handler.dismiss(notification_id, user_id)

# Get unread count
count = await handler.get_unread_count(user_id)
```

## NotificationService

Unified service for multi-channel delivery.

### Basic Usage

```python
from arc.services import NotificationService, create_services

# Via service registry
services = create_services(db)
notification = services.notification

# Send notification
result = await notification.send_notification(
    user_id="user-001",
    notification_type="alert",
    title="Price Alert",
    message="AAPL crossed $150",
    priority="high",
    action_url="https://app.example.com/alerts/001",
)

# Response
{
    "notification_id": "uuid",
    "channels_requested": ["in_app", "push"],
    "channels_sent": ["in_app", "push"],
    "delivery_status": {
        "in_app": "delivered",
        "push": "delivered"
    },
    "success": True
}
```

### Alert Notifications

```python
# From alert object
alert = {
    "id": "alert-001",
    "user_id": "user-001",
    "title": "Price Alert Triggered",
    "message": "AAPL crossed your target price of $150",
    "severity": "high",  # Maps to priority
    "action_url": "https://app.example.com/alerts/001",
}

result = await notification.send_alert_notification(alert)
```

### Brief Notifications

```python
# Morning brief
brief = {
    "title": "Your Morning Brief",
    "summary": "Markets are up. Your portfolio gained 1.2%.",
    "view_url": "https://app.example.com/brief/today",
}

result = await notification.send_brief_notification(
    user_id="user-001",
    brief=brief,
)
```

### Bulk Notifications

```python
# Send to multiple users
result = await notification.send_bulk_notification(
    user_ids=["user-001", "user-002", "user-003"],
    notification_type="announcement",
    title="Platform Update",
    message="New features are now available!",
)

# Response
{
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
        {"user_id": "user-001", "success": True},
        {"user_id": "user-002", "success": True},
        {"user_id": "user-003", "success": True},
    ]
}
```

### Reading Notifications

```python
# Get user's notifications
notifications = await notification.get_notifications(
    user_id="user-001",
    limit=20,
    offset=0,
    unread_only=False,
)

# Get unread count
count = await notification.get_unread_count("user-001")

# Mark as read
await notification.mark_as_read("notif-001", "user-001")

# Mark all as read
count = await notification.mark_all_as_read("user-001")

# Dismiss notification
await notification.dismiss("notif-001", "user-001")
```

## Configuration

### NotificationConfig

```python
from arc.services.notification_service import NotificationConfig
from arc.integrations.notifications import (
    EmailConfig,
    PushConfig,
    SlackConfig,
    InAppConfig,
)

config = NotificationConfig(
    # Handler configs
    email_config=EmailConfig(
        provider="sendgrid",
        sendgrid_api_key="...",
    ),
    push_config=PushConfig(
        fcm_server_key="...",
    ),
    slack_config=SlackConfig(
        bot_token="...",
    ),
    in_app_config=InAppConfig(
        enable_websocket=True,
    ),

    # Default channels by notification type
    default_channels={
        "alert": ["in_app", "push"],
        "brief": ["email", "in_app"],
        "system": ["in_app"],
        "announcement": ["email", "in_app", "push"],
    },

    # Retry settings
    max_retries=3,
    retry_delay_seconds=1.0,

    # Digest settings
    enable_digest=True,
    digest_hour=8,  # 8 AM

    # Rate limiting
    max_notifications_per_hour=100,
)

service = NotificationService(db=db, config=config)
```

## User Preferences

The service respects user notification preferences stored in `NotificationPreference` model:

| Field | Description |
|-------|-------------|
| `channel` | email, push, slack, in_app |
| `enabled` | Channel enabled/disabled |
| `severity_filter` | all, warning, critical |
| `quiet_hours_start` | Start of quiet hours (HH:MM) |
| `quiet_hours_end` | End of quiet hours (HH:MM) |
| `destination` | Channel-specific destination (e.g., Slack channel) |

### Severity Filtering

```python
# User preference
{
    "channel": "push",
    "enabled": True,
    "severity_filter": "critical",  # Only urgent notifications
}

# Normal priority notifications will be filtered out
# Only urgent notifications will be sent to push
```

### Quiet Hours

```python
# User preference
{
    "channel": "push",
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00",
}

# Notifications during quiet hours will be:
# - Queued for digest (if enabled)
# - Sent to other channels
```

## DeliveryResult

All handlers return a `DeliveryResult`:

```python
from arc.integrations.notifications import DeliveryResult, DeliveryStatus

# Structure
DeliveryResult:
    channel: NotificationChannel  # EMAIL, PUSH, IN_APP, SLACK
    status: DeliveryStatus        # PENDING, SENT, DELIVERED, FAILED, BOUNCED, RATE_LIMITED
    message_id: str | None        # Provider message ID
    error: str | None             # Error message if failed
    timestamp: str                # ISO timestamp
    metadata: dict                # Additional info

# Check success
if result.success:  # True for SENT or DELIVERED
    print(f"Delivered: {result.message_id}")
```

## Error Handling

```python
from arc.services.base import ServiceError

try:
    result = await notification.send_alert_notification(alert)
except ServiceError as e:
    print(f"Service error: {e}")

# Check partial failures
result = await notification.send_notification(...)
if not result["success"]:
    for channel, status in result["delivery_status"].items():
        if status == "failed":
            print(f"Failed to send to {channel}")
```

## Testing

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_db():
    db = MagicMock()
    db.express = MagicMock()
    db.express.create = AsyncMock(return_value={"id": "notif-001"})
    return db

@pytest.fixture
def notification_service(mock_db):
    return NotificationService(db=mock_db)

@pytest.mark.asyncio
async def test_send_notification(notification_service):
    result = await notification_service.send_notification(
        user_id="user-001",
        notification_type="system",
        title="Test",
        message="Test message",
    )

    assert result["success"] is True
    assert "notification_id" in result
```

## File Structure

```
src/arc/
├── integrations/
│   └── notifications/
│       ├── __init__.py          # Package exports
│       ├── base.py              # Base classes, enums
│       ├── email.py             # EmailHandler
│       ├── push.py              # PushHandler
│       ├── slack.py             # SlackHandler
│       └── in_app.py            # InAppHandler
├── models/
│   └── core.py                  # Notification model
└── services/
    ├── notification_service.py  # NotificationService
    └── registry.py              # Service registry
```

## Related Documentation

- [02-services.md](02-services.md) - Service architecture
- [17-intelligence-service.md](17-intelligence-service.md) - AI integration
- [07-api-endpoints.md](07-api-endpoints.md) - API endpoints
