"""
Slack notification handler.

Uses Slack webhook and API for channel/DM notifications.
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
class SlackConfig:
    """Configuration for Slack handler."""

    # Webhook URL (simple integration)
    webhook_url: str | None = None

    # Bot token (for API calls)
    bot_token: str | None = None

    # Default channel for notifications
    default_channel: str | None = None

    # Branding
    bot_name: str = "ARC Platform"
    bot_icon_emoji: str = ":chart_with_upwards_trend:"
    bot_icon_url: str | None = None


class SlackHandler(BaseNotificationHandler):
    """
    Slack notification handler.

    Supports:
    - Webhook-based notifications to channels
    - Bot API for direct messages and interactive messages
    - Rich message formatting with blocks
    """

    channel = NotificationChannel.SLACK

    def __init__(self, config: SlackConfig | None = None):
        """
        Initialize Slack handler.

        Args:
            config: Slack configuration
        """
        super().__init__()
        self.config = config or SlackConfig()
        self._client: httpx.AsyncClient | None = None

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
        Validate Slack destination.

        Args:
            destination: Channel ID, channel name, or webhook URL

        Returns:
            True if destination appears valid
        """
        if not destination:
            return False
        # Webhook URL
        if destination.startswith("https://hooks.slack.com/"):
            return True
        # Channel ID (starts with C or G)
        if destination.startswith(("C", "G")) and len(destination) >= 9:
            return True
        # User ID (starts with U)
        if destination.startswith("U") and len(destination) >= 9:
            return True
        # Channel name
        if destination.startswith("#"):
            return True
        return False

    async def send(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Send Slack notification.

        Args:
            payload: Notification payload
            destination: Channel ID, channel name, user ID, or webhook URL
            **kwargs: Additional options:
                - thread_ts: Reply to a thread
                - unfurl_links: Show link previews
                - unfurl_media: Show media previews
                - attachments: Legacy attachments

        Returns:
            DeliveryResult with status
        """
        if not self.enabled:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Slack handler is disabled",
            )

        if not await self.validate_destination(destination):
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Invalid Slack destination: {destination}",
            )

        try:
            # Use webhook if destination is a webhook URL
            if destination.startswith("https://hooks.slack.com/"):
                return await self._send_webhook(payload, destination, **kwargs)
            else:
                return await self._send_api(payload, destination, **kwargs)
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=str(e),
            )

    async def _send_webhook(
        self,
        payload: NotificationPayload,
        webhook_url: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send via Slack webhook."""
        client = await self._get_client()

        message = self._build_message(payload, **kwargs)

        try:
            response = await client.post(
                webhook_url,
                json=message,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200 and response.text == "ok":
                logger.info("Slack notification sent via webhook")
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.SENT,
                    metadata={"method": "webhook"},
                )
            else:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=f"Slack error: {response.text}",
                )

        except httpx.RequestError as e:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Request error: {e}",
            )

    async def _send_api(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send via Slack API (requires bot token)."""
        if not self.config.bot_token:
            # Fall back to default webhook if available
            if self.config.webhook_url:
                return await self._send_webhook(payload, self.config.webhook_url, **kwargs)
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Slack bot token not configured",
            )

        client = await self._get_client()

        message = self._build_message(payload, **kwargs)
        message["channel"] = destination

        # Add thread if specified
        thread_ts = kwargs.get("thread_ts")
        if thread_ts:
            message["thread_ts"] = thread_ts

        try:
            response = await client.post(
                "https://slack.com/api/chat.postMessage",
                json=message,
                headers={
                    "Authorization": f"Bearer {self.config.bot_token}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    message_ts = result.get("ts")
                    logger.info(f"Slack notification sent to {destination}: {message_ts}")
                    return DeliveryResult(
                        channel=self.channel,
                        status=DeliveryStatus.DELIVERED,
                        message_id=message_ts,
                        metadata={"method": "api", "channel": destination},
                    )
                else:
                    error = result.get("error", "Unknown error")
                    if error == "channel_not_found":
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.BOUNCED,
                            error="Channel not found",
                        )
                    elif error == "not_in_channel":
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.FAILED,
                            error="Bot not in channel",
                        )
                    else:
                        return DeliveryResult(
                            channel=self.channel,
                            status=DeliveryStatus.FAILED,
                            error=error,
                        )
            else:
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=f"Slack API error: {response.status_code}",
                )

        except httpx.RequestError as e:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Request error: {e}",
            )

    def _build_message(
        self, payload: NotificationPayload, **kwargs: Any
    ) -> dict[str, Any]:
        """Build Slack message with blocks."""
        # Color based on priority
        color = self._get_priority_color(payload.priority)

        # Build blocks for rich formatting
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": payload.title,
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": payload.message,
                },
            },
        ]

        # Add context (notification type and priority)
        context_elements = [
            {
                "type": "mrkdwn",
                "text": f"*Type:* {payload.notification_type.value.capitalize()}",
            },
        ]

        if payload.priority != NotificationPriority.NORMAL:
            priority_emoji = self._get_priority_emoji(payload.priority)
            context_elements.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Priority:* {priority_emoji} {payload.priority.value.capitalize()}",
                }
            )

        blocks.append({"type": "context", "elements": context_elements})

        # Add action button if URL provided
        if payload.action_url:
            blocks.append(
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Details",
                                "emoji": True,
                            },
                            "url": payload.action_url,
                            "action_id": f"view_{payload.notification_id}",
                        }
                    ],
                }
            )

        message: dict[str, Any] = {
            "blocks": blocks,
            "attachments": [
                {
                    "color": color,
                    "fallback": f"{payload.title}: {payload.message}",
                }
            ],
        }

        # Add bot identity
        if self.config.bot_icon_url:
            message["icon_url"] = self.config.bot_icon_url
        else:
            message["icon_emoji"] = self.config.bot_icon_emoji
        message["username"] = self.config.bot_name

        # Add link preview settings
        message["unfurl_links"] = kwargs.get("unfurl_links", False)
        message["unfurl_media"] = kwargs.get("unfurl_media", True)

        return message

    def _get_priority_color(self, priority: NotificationPriority) -> str:
        """Get color hex for priority."""
        colors = {
            NotificationPriority.LOW: "#6c757d",  # Gray
            NotificationPriority.NORMAL: "#0d6efd",  # Blue
            NotificationPriority.HIGH: "#fd7e14",  # Orange
            NotificationPriority.URGENT: "#dc3545",  # Red
        }
        return colors.get(priority, "#0d6efd")

    def _get_priority_emoji(self, priority: NotificationPriority) -> str:
        """Get emoji for priority."""
        emojis = {
            NotificationPriority.LOW: ":white_circle:",
            NotificationPriority.NORMAL: ":large_blue_circle:",
            NotificationPriority.HIGH: ":large_orange_circle:",
            NotificationPriority.URGENT: ":red_circle:",
        }
        return emojis.get(priority, ":large_blue_circle:")
