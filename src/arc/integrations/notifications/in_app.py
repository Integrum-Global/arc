"""
In-app notification handler.

Stores notifications in database for retrieval by the client application.
"""

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from arc.integrations.notifications.base import (
    BaseNotificationHandler,
    DeliveryResult,
    DeliveryStatus,
    NotificationChannel,
    NotificationPayload,
)

logger = logging.getLogger(__name__)


@dataclass
class InAppConfig:
    """Configuration for in-app notification handler."""

    # Maximum notifications to keep per user
    max_notifications_per_user: int = 100

    # Auto-dismiss after days (0 = never)
    auto_dismiss_days: int = 30

    # Enable real-time WebSocket delivery
    enable_websocket: bool = True


class InAppHandler(BaseNotificationHandler):
    """
    In-app notification handler.

    Stores notifications in the database for retrieval by client applications.
    Optionally broadcasts via WebSocket for real-time delivery.
    """

    channel = NotificationChannel.IN_APP

    def __init__(self, config: InAppConfig | None = None, db: Any = None):
        """
        Initialize in-app handler.

        Args:
            config: In-app configuration
            db: DataFlow database instance for storing notifications
        """
        super().__init__()
        self.config = config or InAppConfig()
        self.db = db
        self._websocket_manager: Any = None

    def set_db(self, db: Any) -> None:
        """Set the database instance."""
        self.db = db

    def set_websocket_manager(self, manager: Any) -> None:
        """Set WebSocket manager for real-time delivery."""
        self._websocket_manager = manager

    async def validate_destination(self, destination: str) -> bool:
        """
        Validate user ID.

        Args:
            destination: User ID

        Returns:
            True if user ID is valid
        """
        # Basic validation - non-empty string
        return bool(destination and len(destination) >= 1)

    async def send(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Store in-app notification.

        Args:
            payload: Notification payload
            destination: User ID
            **kwargs: Additional options:
                - persist: Whether to store in database (default: True)
                - broadcast_only: Only broadcast via WebSocket, don't persist

        Returns:
            DeliveryResult with status
        """
        if not self.enabled:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="In-app handler is disabled",
            )

        if not await self.validate_destination(destination):
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Invalid user ID",
            )

        try:
            persist = kwargs.get("persist", True)
            broadcast_only = kwargs.get("broadcast_only", False)

            notification_id = payload.notification_id or str(uuid.uuid4())

            # Store in database unless broadcast_only
            if persist and not broadcast_only:
                await self._store_notification(payload, destination, notification_id)

            # Broadcast via WebSocket if enabled
            if self.config.enable_websocket and self._websocket_manager:
                await self._broadcast_notification(payload, destination)

            logger.info(f"In-app notification stored for user {destination}")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.DELIVERED,
                message_id=notification_id,
                metadata={
                    "persisted": persist and not broadcast_only,
                    "broadcast": self.config.enable_websocket,
                },
            )

        except Exception as e:
            logger.error(f"Failed to store in-app notification: {e}")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=str(e),
            )

    async def _store_notification(
        self,
        payload: NotificationPayload,
        user_id: str,
        notification_id: str,
    ) -> None:
        """Store notification in database."""
        if not self.db:
            logger.warning("No database configured for in-app notifications")
            return

        # Build notification record
        notification_data = {
            "id": notification_id,
            "user_id": user_id,
            "notification_type": payload.notification_type.value,
            "title": payload.title,
            "message": payload.message,
            "data": payload.data or {},
            "priority": payload.priority.value,
            "channels_requested": ["in_app"],
            "delivery_status": {"in_app": "delivered"},
            "related_type": payload.related_type,
            "related_id": payload.related_id,
            "action_url": payload.action_url,
        }

        # Use DataFlow Express for direct creation
        try:
            await self.db.express.create("Notification", notification_data)
        except Exception as e:
            logger.error(f"Failed to store notification in database: {e}")
            raise

    async def _broadcast_notification(
        self,
        payload: NotificationPayload,
        user_id: str,
    ) -> None:
        """Broadcast notification via WebSocket."""
        if not self._websocket_manager:
            return

        try:
            await self._websocket_manager.send_to_user(
                user_id,
                {
                    "type": "notification",
                    "data": {
                        "id": payload.notification_id,
                        "title": payload.title,
                        "message": payload.message,
                        "notification_type": payload.notification_type.value,
                        "priority": payload.priority.value,
                        "action_url": payload.action_url,
                        "data": payload.data,
                        "timestamp": datetime.now(UTC).isoformat(),
                    },
                },
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast notification: {e}")

    async def mark_as_read(
        self,
        notification_id: str,
        user_id: str,
    ) -> bool:
        """
        Mark notification as read.

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            True if notification was marked as read
        """
        if not self.db:
            return False

        try:
            await self.db.express.update(
                "Notification",
                notification_id,
                {"read_at": datetime.now(UTC).isoformat()},
            )
            return True
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {e}")
            return False

    async def dismiss(
        self,
        notification_id: str,
        user_id: str,
    ) -> bool:
        """
        Dismiss notification.

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            True if notification was dismissed
        """
        if not self.db:
            return False

        try:
            await self.db.express.update(
                "Notification",
                notification_id,
                {"dismissed_at": datetime.now(UTC).isoformat()},
            )
            return True
        except Exception as e:
            logger.error(f"Failed to dismiss notification: {e}")
            return False

    async def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for user.

        Args:
            user_id: User ID

        Returns:
            Number of unread notifications
        """
        if not self.db:
            return 0

        try:
            return await self.db.express.count(
                "Notification",
                filter={"user_id": user_id, "read_at": {"$null": True}},
            )
        except Exception as e:
            logger.error(f"Failed to get unread count: {e}")
            return 0

    async def get_notifications(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
    ) -> list[dict[str, Any]]:
        """
        Get notifications for user.

        Args:
            user_id: User ID
            limit: Maximum notifications to return
            offset: Pagination offset
            unread_only: Only return unread notifications

        Returns:
            List of notification records
        """
        if not self.db:
            return []

        try:
            filter_params: dict[str, Any] = {
                "user_id": user_id,
                "dismissed_at": {"$null": True},
            }

            if unread_only:
                filter_params["read_at"] = {"$null": True}

            result = await self.db.express.list(
                "Notification",
                filter=filter_params,
                limit=limit,
                offset=offset,
                order_by=["-created_at"],
            )
            return result
        except Exception as e:
            logger.error(f"Failed to get notifications: {e}")
            return []
