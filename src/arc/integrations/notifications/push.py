"""
Push notification handler.

Supports Firebase Cloud Messaging (FCM) for Android/iOS/Web.
"""

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from arc.integrations.notifications.base import (
    BaseNotificationHandler,
    DeliveryResult,
    DeliveryStatus,
    NotificationChannel,
    NotificationPayload,
    NotificationPriority,
)

logger = logging.getLogger(__name__)


@dataclass
class PushConfig:
    """Configuration for push notification handler."""

    # Firebase settings
    fcm_server_key: str | None = None
    fcm_project_id: str | None = None
    fcm_service_account_json: str | None = None  # Path to service account JSON

    # APNs settings (for direct Apple Push)
    apns_key_id: str | None = None
    apns_team_id: str | None = None
    apns_bundle_id: str | None = None
    apns_key_path: str | None = None  # Path to .p8 key file

    # Common settings
    default_sound: str = "default"
    default_badge: int | None = None


class PushHandler(BaseNotificationHandler):
    """
    Push notification handler using Firebase Cloud Messaging.

    FCM supports Android, iOS, and Web push notifications.
    """

    channel = NotificationChannel.PUSH

    def __init__(self, config: PushConfig | None = None):
        """
        Initialize push handler.

        Args:
            config: Push notification configuration
        """
        super().__init__()
        self.config = config or PushConfig()
        self._client: httpx.AsyncClient | None = None
        self._access_token: str | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def validate_destination(self, destination: str) -> bool:
        """
        Validate device token format.

        Args:
            destination: FCM device token

        Returns:
            True if token appears valid (basic format check)
        """
        # FCM tokens are typically 140+ characters
        if not destination or len(destination) < 100:
            return False
        # Basic alphanumeric + special chars check
        valid_chars = set(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_-"
        )
        return all(c in valid_chars for c in destination)

    async def send(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Send push notification.

        Args:
            payload: Notification payload
            destination: FCM device token
            **kwargs: Additional options:
                - badge: Badge count to set
                - sound: Sound to play
                - image: Image URL for rich notification
                - collapse_key: Key to collapse notifications
                - ttl: Time-to-live in seconds
                - data_only: Send data-only message (no visible notification)

        Returns:
            DeliveryResult with status
        """
        if not self.enabled:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Push handler is disabled",
            )

        if not self.config.fcm_server_key:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="FCM server key not configured",
            )

        if not await self.validate_destination(destination):
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Invalid device token",
            )

        try:
            return await self._send_fcm_legacy(payload, destination, **kwargs)
        except Exception as e:
            logger.error(f"Failed to send push to {destination[:20]}...: {e}")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=str(e),
            )

    async def _send_fcm_legacy(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send push notification via FCM Legacy HTTP API."""
        client = await self._get_client()

        # Build FCM message
        message: dict[str, Any] = {
            "to": destination,
            "priority": self._map_priority(payload.priority),
        }

        # Data-only message or visible notification
        data_only = kwargs.get("data_only", False)

        if not data_only:
            message["notification"] = {
                "title": payload.title,
                "body": payload.message,
            }

            # Add optional notification fields
            sound = kwargs.get("sound", self.config.default_sound)
            if sound:
                message["notification"]["sound"] = sound

            badge = kwargs.get("badge", self.config.default_badge)
            if badge is not None:
                message["notification"]["badge"] = str(badge)

            image = kwargs.get("image")
            if image:
                message["notification"]["image"] = image

            # Click action (deep link)
            if payload.action_url:
                message["notification"]["click_action"] = payload.action_url

        # Always include data payload
        message["data"] = {
            "notification_id": payload.notification_id,
            "type": payload.notification_type.value,
            "title": payload.title,
            "message": payload.message,
            "priority": payload.priority.value,
            **(payload.data or {}),
        }

        if payload.action_url:
            message["data"]["action_url"] = payload.action_url
        if payload.related_type:
            message["data"]["related_type"] = payload.related_type
        if payload.related_id:
            message["data"]["related_id"] = payload.related_id

        # Collapse key for notification grouping
        collapse_key = kwargs.get("collapse_key")
        if collapse_key:
            message["collapse_key"] = collapse_key

        # TTL (time-to-live)
        ttl = kwargs.get("ttl")
        if ttl:
            message["time_to_live"] = ttl

        # Send to FCM
        try:
            response = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                json=message,
                headers={
                    "Authorization": f"key={self.config.fcm_server_key}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                result = response.json()

                if result.get("success", 0) > 0:
                    message_id = result.get("results", [{}])[0].get("message_id")
                    logger.info(f"Push sent to {destination[:20]}...: {message_id}")
                    return DeliveryResult(
                        channel=self.channel,
                        status=DeliveryStatus.DELIVERED,
                        message_id=message_id,
                        metadata={"provider": "fcm"},
                    )
                else:
                    # Check for specific errors
                    error = result.get("results", [{}])[0].get("error", "Unknown error")
                    if error == "NotRegistered":
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.BOUNCED,
                            error="Device token no longer valid",
                        )
                    elif error == "InvalidRegistration":
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.FAILED,
                            error="Invalid device token format",
                        )
                    else:
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.FAILED,
                            error=error,
                        )
            elif response.status_code == 401:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error="FCM authentication failed",
                )
            elif response.status_code == 429:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.RATE_LIMITED,
                    error="FCM rate limit exceeded",
                )
            else:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=f"FCM error: {response.status_code}",
                )

        except httpx.RequestError as e:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Request error: {e}",
            )

    def _map_priority(self, priority: NotificationPriority) -> str:
        """Map notification priority to FCM priority."""
        if priority in (NotificationPriority.HIGH, NotificationPriority.URGENT):
            return "high"
        return "normal"

    async def send_to_topic(
        self,
        payload: NotificationPayload,
        topic: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Send push notification to a topic.

        Args:
            payload: Notification payload
            topic: FCM topic name
            **kwargs: Additional options

        Returns:
            DeliveryResult with status
        """
        if not self.enabled:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Push handler is disabled",
            )

        if not self.config.fcm_server_key:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="FCM server key not configured",
            )

        client = await self._get_client()

        message: dict[str, Any] = {
            "to": f"/topics/{topic}",
            "priority": self._map_priority(payload.priority),
            "notification": {
                "title": payload.title,
                "body": payload.message,
            },
            "data": {
                "notification_id": payload.notification_id,
                "type": payload.notification_type.value,
                **(payload.data or {}),
            },
        }

        try:
            response = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                json=message,
                headers={
                    "Authorization": f"key={self.config.fcm_server_key}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                result = response.json()
                message_id = result.get("message_id")
                logger.info(f"Push sent to topic {topic}: {message_id}")
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.SENT,
                    message_id=str(message_id) if message_id else None,
                    metadata={"provider": "fcm", "topic": topic},
                )
            else:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=f"FCM error: {response.status_code}",
                )

        except httpx.RequestError as e:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Request error: {e}",
            )
