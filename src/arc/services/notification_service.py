"""
Notification service for multi-channel delivery.

Provides a unified interface for sending notifications across
email, push, Slack, and in-app channels.
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from arc.integrations.notifications import (
    DeliveryResult,
    DeliveryStatus,
    EmailConfig,
    EmailHandler,
    InAppConfig,
    InAppHandler,
    NotificationChannel,
    NotificationPayload,
    NotificationPriority,
    NotificationType,
    PushConfig,
    PushHandler,
    SlackConfig,
    SlackHandler,
)
from arc.services.base import BaseService, ServiceError, service_operation

logger = logging.getLogger(__name__)


@dataclass
class NotificationConfig:
    """Configuration for notification service."""

    # Handler configs
    email_config: EmailConfig | None = None
    push_config: PushConfig | None = None
    slack_config: SlackConfig | None = None
    in_app_config: InAppConfig | None = None

    # Default channels by notification type
    default_channels: dict[str, list[str]] = field(
        default_factory=lambda: {
            "alert": ["in_app", "push"],
            "brief": ["email", "in_app"],
            "system": ["in_app"],
            "announcement": ["email", "in_app", "push"],
        }
    )

    # Retry settings
    max_retries: int = 3
    retry_delay_seconds: float = 1.0

    # Digest settings
    enable_digest: bool = True
    digest_hour: int = 8  # 8 AM in user timezone

    # Rate limiting
    max_notifications_per_hour: int = 100


class NotificationService(BaseService):
    """
    Notification service for multi-channel delivery.

    Features:
    - Multi-channel delivery (email, push, Slack, in-app)
    - User preference respecting
    - Quiet hours support
    - Priority-based routing
    - Delivery tracking
    - Digest aggregation
    """

    def __init__(
        self,
        db: Any,
        tenant_id: str | None = None,
        user_id: str | None = None,
        config: NotificationConfig | None = None,
    ):
        """
        Initialize notification service.

        Args:
            db: DataFlow database instance
            tenant_id: Current tenant context
            user_id: Current user context
            config: Service configuration
        """
        super().__init__(db, tenant_id, user_id)
        self.config = config or NotificationConfig()

        # Initialize handlers
        self._email_handler: EmailHandler | None = None
        self._push_handler: PushHandler | None = None
        self._slack_handler: SlackHandler | None = None
        self._in_app_handler: InAppHandler | None = None

    @property
    def email_handler(self) -> EmailHandler:
        """Lazy-load email handler."""
        if self._email_handler is None:
            self._email_handler = EmailHandler(self.config.email_config)
        return self._email_handler

    @property
    def push_handler(self) -> PushHandler:
        """Lazy-load push handler."""
        if self._push_handler is None:
            self._push_handler = PushHandler(self.config.push_config)
        return self._push_handler

    @property
    def slack_handler(self) -> SlackHandler:
        """Lazy-load Slack handler."""
        if self._slack_handler is None:
            self._slack_handler = SlackHandler(self.config.slack_config)
        return self._slack_handler

    @property
    def in_app_handler(self) -> InAppHandler:
        """Lazy-load in-app handler."""
        if self._in_app_handler is None:
            self._in_app_handler = InAppHandler(self.config.in_app_config, self.db)
        return self._in_app_handler

    @service_operation("send_notification")
    async def send_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        data: dict | None = None,
        priority: str = "normal",
        channels: list[str] | None = None,
        action_url: str | None = None,
        related_type: str | None = None,
        related_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Send notification to a user.

        Args:
            user_id: Target user ID
            notification_type: Type of notification (alert, brief, system, announcement)
            title: Notification title
            message: Notification message
            data: Additional data payload
            priority: Priority level (low, normal, high, urgent)
            channels: Channels to use (overrides defaults)
            action_url: URL for action button
            related_type: Type of related entity
            related_id: ID of related entity

        Returns:
            Dict with notification_id and delivery results per channel
        """
        notification_id = str(uuid.uuid4())

        # Build payload
        payload = NotificationPayload(
            notification_id=notification_id,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=NotificationType(notification_type),
            priority=NotificationPriority(priority),
            data=data or {},
            action_url=action_url,
            related_type=related_type,
            related_id=related_id,
            tenant_id=self.tenant_id,
        )

        # Determine channels
        target_channels = channels or self.config.default_channels.get(
            notification_type, ["in_app"]
        )

        # Get user preferences and filter channels
        effective_channels = await self._filter_channels_by_preferences(
            user_id, target_channels, payload
        )

        # Send to each channel
        results: dict[str, DeliveryResult] = {}
        for channel in effective_channels:
            result = await self._send_to_channel(payload, user_id, channel)
            results[channel] = result

        # Store notification record
        await self._store_notification_record(
            notification_id, user_id, payload, target_channels, results
        )

        return {
            "notification_id": notification_id,
            "channels_requested": target_channels,
            "channels_sent": effective_channels,
            "delivery_status": {
                channel: result.status.value for channel, result in results.items()
            },
            "success": any(r.success for r in results.values()),
        }

    @service_operation("send_alert_notification")
    async def send_alert_notification(
        self,
        alert: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Send notification for an alert.

        Args:
            alert: Alert data containing user_id, title, message, severity, etc.

        Returns:
            Notification result
        """
        user_id = alert.get("user_id")
        if not user_id:
            raise ServiceError(
                service="NotificationService",
                operation="send_alert_notification",
                message="Alert must have user_id",
            )

        # Map severity to priority
        severity = alert.get("severity", "medium")
        priority_map = {
            "low": "low",
            "medium": "normal",
            "high": "high",
            "critical": "urgent",
        }
        priority = priority_map.get(severity, "normal")

        return await self.send_notification(
            user_id=user_id,
            notification_type="alert",
            title=alert.get("title", "Alert"),
            message=alert.get("message", "You have a new alert"),
            data=alert,
            priority=priority,
            action_url=alert.get("action_url"),
            related_type="alert",
            related_id=alert.get("id"),
        )

    @service_operation("send_brief_notification")
    async def send_brief_notification(
        self,
        user_id: str,
        brief: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Send morning brief notification.

        Args:
            user_id: Target user ID
            brief: Brief data containing summary, highlights, etc.

        Returns:
            Notification result
        """
        return await self.send_notification(
            user_id=user_id,
            notification_type="brief",
            title=brief.get("title", "Your Morning Brief"),
            message=brief.get("summary", "Your daily market brief is ready"),
            data=brief,
            priority="normal",
            channels=["email", "in_app"],
            action_url=brief.get("view_url"),
        )

    @service_operation("send_bulk_notification")
    async def send_bulk_notification(
        self,
        user_ids: list[str],
        notification_type: str,
        title: str,
        message: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Send notification to multiple users.

        Args:
            user_ids: List of target user IDs
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            **kwargs: Additional options passed to send_notification

        Returns:
            Summary of delivery results
        """
        results = []
        for user_id in user_ids:
            try:
                result = await self.send_notification(
                    user_id=user_id,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    **kwargs,
                )
                results.append({"user_id": user_id, "success": result["success"]})
            except Exception as e:
                logger.error(f"Failed to notify user {user_id}: {e}")
                results.append({"user_id": user_id, "success": False, "error": str(e)})

        successful = sum(1 for r in results if r["success"])
        return {
            "total": len(user_ids),
            "successful": successful,
            "failed": len(user_ids) - successful,
            "results": results,
        }

    async def _filter_channels_by_preferences(
        self,
        user_id: str,
        requested_channels: list[str],
        payload: NotificationPayload,
    ) -> list[str]:
        """Filter channels based on user preferences."""
        try:
            # Get user's notification preferences
            preferences = await self.db.express.list(
                "NotificationPreference",
                filter={"user_id": user_id, "enabled": True},
            )

            if not preferences:
                # No preferences set - use all requested channels
                return requested_channels

            # Build preference map
            pref_map: dict[str, dict] = {}
            for pref in preferences:
                pref_map[pref["channel"]] = pref

            effective_channels = []
            for channel in requested_channels:
                pref = pref_map.get(channel)

                # If no preference for channel, include it
                if not pref:
                    effective_channels.append(channel)
                    continue

                # Check severity filter
                severity_filter = pref.get("severity_filter", "all")
                if severity_filter != "all":
                    if severity_filter == "critical" and payload.priority not in (
                        NotificationPriority.URGENT,
                    ):
                        continue
                    if severity_filter == "warning" and payload.priority not in (
                        NotificationPriority.HIGH,
                        NotificationPriority.URGENT,
                    ):
                        continue

                # Check quiet hours
                if await self._is_quiet_hours(pref):
                    # Queue for digest instead
                    continue

                effective_channels.append(channel)

            return effective_channels

        except Exception as e:
            logger.warning(f"Failed to get user preferences: {e}")
            return requested_channels

    async def _is_quiet_hours(self, preference: dict) -> bool:
        """Check if current time is within quiet hours."""
        quiet_start = preference.get("quiet_hours_start")
        quiet_end = preference.get("quiet_hours_end")

        if not quiet_start or not quiet_end:
            return False

        try:
            # Parse quiet hours
            start = datetime.strptime(quiet_start, "%H:%M").time()
            end = datetime.strptime(quiet_end, "%H:%M").time()

            # Get current time in user's timezone
            # For simplicity, using UTC; in production, use user's timezone
            now = datetime.now(UTC).time()

            # Handle overnight quiet hours (e.g., 22:00 - 07:00)
            if start > end:
                return now >= start or now <= end
            else:
                return start <= now <= end

        except Exception:
            return False

    async def _send_to_channel(
        self,
        payload: NotificationPayload,
        user_id: str,
        channel: str,
    ) -> DeliveryResult:
        """Send notification to a specific channel."""
        try:
            if channel == "email":
                # Get user's email
                user = await self.db.express.read("User", user_id)
                if not user or not user.get("email"):
                    return DeliveryResult(
                        channel=NotificationChannel.EMAIL,
                        status=DeliveryStatus.FAILED,
                        error="User email not found",
                    )
                return await self.email_handler.send(payload, user["email"])

            elif channel == "push":
                # Get user's device tokens
                tokens = await self._get_device_tokens(user_id)
                if not tokens:
                    return DeliveryResult(
                        channel=NotificationChannel.PUSH,
                        status=DeliveryStatus.FAILED,
                        error="No device tokens registered",
                    )
                # Send to first token (in production, send to all)
                return await self.push_handler.send(payload, tokens[0])

            elif channel == "slack":
                # Get user's Slack destination
                pref = await self._get_channel_preference(user_id, "slack")
                if not pref or not pref.get("destination"):
                    return DeliveryResult(
                        channel=NotificationChannel.SLACK,
                        status=DeliveryStatus.FAILED,
                        error="Slack destination not configured",
                    )
                return await self.slack_handler.send(payload, pref["destination"])

            elif channel == "in_app":
                return await self.in_app_handler.send(payload, user_id)

            else:
                return DeliveryResult(
                    channel=NotificationChannel(channel),
                    status=DeliveryStatus.FAILED,
                    error=f"Unknown channel: {channel}",
                )

        except Exception as e:
            logger.error(f"Failed to send to {channel}: {e}")
            return DeliveryResult(
                channel=NotificationChannel(channel) if channel in NotificationChannel.__members__.values() else NotificationChannel.IN_APP,
                status=DeliveryStatus.FAILED,
                error=str(e),
            )

    async def _get_device_tokens(self, user_id: str) -> list[str]:
        """Get push notification device tokens for user."""
        # In production, this would query a device tokens table
        # For now, return empty list
        return []

    async def _get_channel_preference(
        self, user_id: str, channel: str
    ) -> dict | None:
        """Get user's preference for a specific channel."""
        try:
            preferences = await self.db.express.list(
                "NotificationPreference",
                filter={"user_id": user_id, "channel": channel},
                limit=1,
            )
            return preferences[0] if preferences else None
        except Exception:
            return None

    async def _store_notification_record(
        self,
        notification_id: str,
        user_id: str,
        payload: NotificationPayload,
        channels_requested: list[str],
        results: dict[str, DeliveryResult],
    ) -> None:
        """Store notification record in database."""
        try:
            # Skip if already stored by in_app handler
            if "in_app" in results and results["in_app"].success:
                return

            delivery_status = {
                channel: result.status.value for channel, result in results.items()
            }

            await self.db.express.create(
                "Notification",
                {
                    "id": notification_id,
                    "user_id": user_id,
                    "notification_type": payload.notification_type.value,
                    "title": payload.title,
                    "message": payload.message,
                    "data": payload.data,
                    "priority": payload.priority.value,
                    "channels_requested": channels_requested,
                    "delivery_status": delivery_status,
                    "related_type": payload.related_type,
                    "related_id": payload.related_id,
                    "action_url": payload.action_url,
                },
            )
        except Exception as e:
            logger.error(f"Failed to store notification record: {e}")

    @service_operation("get_notifications")
    async def get_notifications(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
    ) -> list[dict[str, Any]]:
        """
        Get notifications for a user.

        Args:
            user_id: User ID
            limit: Maximum notifications to return
            offset: Pagination offset
            unread_only: Only return unread notifications

        Returns:
            List of notification records
        """
        return await self.in_app_handler.get_notifications(
            user_id, limit, offset, unread_only
        )

    @service_operation("get_unread_count")
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for user."""
        return await self.in_app_handler.get_unread_count(user_id)

    @service_operation("mark_as_read")
    async def mark_as_read(
        self,
        notification_id: str,
        user_id: str,
    ) -> bool:
        """Mark notification as read."""
        return await self.in_app_handler.mark_as_read(notification_id, user_id)

    @service_operation("mark_all_as_read")
    async def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications as read for a user.

        Returns:
            Number of notifications marked as read
        """
        try:
            # Get all unread notifications
            unread = await self.db.express.list(
                "Notification",
                filter={"user_id": user_id, "read_at": {"$null": True}},
            )

            now = datetime.now(UTC).isoformat()
            count = 0

            for notification in unread:
                await self.db.express.update(
                    "Notification",
                    notification["id"],
                    {"read_at": now},
                )
                count += 1

            return count
        except Exception as e:
            logger.error(f"Failed to mark all as read: {e}")
            return 0

    @service_operation("dismiss")
    async def dismiss(
        self,
        notification_id: str,
        user_id: str,
    ) -> bool:
        """Dismiss notification."""
        return await self.in_app_handler.dismiss(notification_id, user_id)

    async def close(self) -> None:
        """Close all handlers."""
        if self._email_handler:
            await self._email_handler.close()
        if self._push_handler:
            await self._push_handler.close()
        if self._slack_handler:
            await self._slack_handler.close()
