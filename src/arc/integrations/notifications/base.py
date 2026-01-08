"""
Base classes for notification handlers.

Provides the abstract interface that all notification channel handlers must implement.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class DeliveryStatus(str, Enum):
    """Notification delivery status."""

    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"
    RATE_LIMITED = "rate_limited"


class NotificationPriority(str, Enum):
    """Notification priority levels."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(str, Enum):
    """Types of notifications."""

    ALERT = "alert"
    BRIEF = "brief"
    SYSTEM = "system"
    ANNOUNCEMENT = "announcement"


class NotificationChannel(str, Enum):
    """Supported notification channels."""

    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"
    SLACK = "slack"
    SMS = "sms"


@dataclass
class NotificationPayload:
    """Standard notification payload for all handlers."""

    notification_id: str
    user_id: str
    title: str
    message: str
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    data: dict = field(default_factory=dict)
    action_url: str | None = None
    related_type: str | None = None
    related_id: str | None = None
    tenant_id: str | None = None


@dataclass
class DeliveryResult:
    """Result of a notification delivery attempt."""

    channel: NotificationChannel
    status: DeliveryStatus
    message_id: str | None = None
    error: str | None = None
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    metadata: dict = field(default_factory=dict)

    @property
    def success(self) -> bool:
        """Check if delivery was successful."""
        return self.status in (DeliveryStatus.SENT, DeliveryStatus.DELIVERED)


class BaseNotificationHandler(ABC):
    """
    Abstract base class for notification channel handlers.

    All notification handlers must implement this interface.
    """

    channel: NotificationChannel

    def __init__(self):
        """Initialize the handler."""
        self._enabled = True

    @property
    def enabled(self) -> bool:
        """Check if handler is enabled."""
        return self._enabled

    def enable(self) -> None:
        """Enable the handler."""
        self._enabled = True

    def disable(self) -> None:
        """Disable the handler."""
        self._enabled = False

    @abstractmethod
    async def send(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Send a notification.

        Args:
            payload: The notification payload to send
            destination: Channel-specific destination (email, device token, etc.)
            **kwargs: Additional channel-specific options

        Returns:
            DeliveryResult with status and any error information
        """
        pass

    @abstractmethod
    async def validate_destination(self, destination: str) -> bool:
        """
        Validate a destination address.

        Args:
            destination: The destination to validate

        Returns:
            True if destination is valid
        """
        pass

    async def send_batch(
        self,
        payloads: list[tuple[NotificationPayload, str]],
        **kwargs: Any,
    ) -> list[DeliveryResult]:
        """
        Send multiple notifications.

        Default implementation sends sequentially.
        Override for batch-optimized implementations.

        Args:
            payloads: List of (payload, destination) tuples
            **kwargs: Additional channel-specific options

        Returns:
            List of DeliveryResults
        """
        results = []
        for payload, destination in payloads:
            try:
                result = await self.send(payload, destination, **kwargs)
            except Exception as e:
                result = DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=str(e),
                )
            results.append(result)
        return results
