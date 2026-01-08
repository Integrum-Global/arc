"""
Notification delivery handlers.

Provides multi-channel notification delivery:
- Email (SMTP, SendGrid, AWS SES)
- Push (Firebase Cloud Messaging)
- Slack (Webhook and API)
- In-App (Database storage with WebSocket broadcast)

All handlers implement the BaseNotificationHandler interface.
"""

from arc.integrations.notifications.base import (
    BaseNotificationHandler,
    DeliveryResult,
    DeliveryStatus,
    NotificationChannel,
    NotificationPayload,
    NotificationPriority,
    NotificationType,
)
from arc.integrations.notifications.email import EmailConfig, EmailHandler
from arc.integrations.notifications.in_app import InAppConfig, InAppHandler
from arc.integrations.notifications.push import PushConfig, PushHandler
from arc.integrations.notifications.slack import SlackConfig, SlackHandler

__all__ = [
    # Base classes
    "BaseNotificationHandler",
    "DeliveryResult",
    "DeliveryStatus",
    "NotificationChannel",
    "NotificationPayload",
    "NotificationPriority",
    "NotificationType",
    # Email
    "EmailHandler",
    "EmailConfig",
    # Push
    "PushHandler",
    "PushConfig",
    # Slack
    "SlackHandler",
    "SlackConfig",
    # In-App
    "InAppHandler",
    "InAppConfig",
]
