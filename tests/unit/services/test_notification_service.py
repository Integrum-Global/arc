"""Unit tests for NotificationService."""

from datetime import UTC, datetime, time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.integrations.notifications import (
    DeliveryResult,
    DeliveryStatus,
    NotificationChannel,
    NotificationPayload,
    NotificationPriority,
    NotificationType,
)
from arc.services.notification_service import (
    NotificationConfig,
    NotificationService,
)

# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def mock_db():
    """Create mock DataFlow instance."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.list = AsyncMock(return_value=[])
    db.express.read = AsyncMock(return_value={"id": "user-001", "email": "user@example.com"})
    db.express.create = AsyncMock(return_value={"id": "notif-001"})
    db.express.update = AsyncMock(return_value={"id": "notif-001"})
    db.express.count = AsyncMock(return_value=0)
    return db


@pytest.fixture
def notification_service(mock_db):
    """Create NotificationService with mock database."""
    return NotificationService(db=mock_db, tenant_id="tenant-001")


@pytest.fixture
def configured_service(mock_db):
    """Create NotificationService with full configuration."""
    from arc.integrations.notifications import (
        EmailConfig,
        InAppConfig,
        PushConfig,
        SlackConfig,
    )

    config = NotificationConfig(
        email_config=EmailConfig(
            provider="smtp",
            smtp_host="smtp.example.com",
            from_email="noreply@example.com",
        ),
        push_config=PushConfig(fcm_server_key="test_key"),
        slack_config=SlackConfig(bot_token="xoxb-test"),
        in_app_config=InAppConfig(enable_websocket=False),
    )
    return NotificationService(db=mock_db, config=config)


@pytest.fixture
def mock_email_result():
    """Create successful email delivery result."""
    return DeliveryResult(
        channel=NotificationChannel.EMAIL,
        status=DeliveryStatus.SENT,
        message_id="msg-001",
    )


@pytest.fixture
def mock_push_result():
    """Create successful push delivery result."""
    return DeliveryResult(
        channel=NotificationChannel.PUSH,
        status=DeliveryStatus.DELIVERED,
        message_id="push-001",
    )


@pytest.fixture
def mock_in_app_result():
    """Create successful in-app delivery result."""
    return DeliveryResult(
        channel=NotificationChannel.IN_APP,
        status=DeliveryStatus.DELIVERED,
        message_id="notif-001",
    )


# =============================================================================
# INITIALIZATION TESTS
# =============================================================================


class TestNotificationServiceInit:
    """Test NotificationService initialization."""

    def test_init_with_db(self, mock_db):
        """Test service initializes with database."""
        service = NotificationService(db=mock_db)

        assert service.db == mock_db

    def test_init_with_tenant(self, mock_db):
        """Test service initializes with tenant context."""
        service = NotificationService(db=mock_db, tenant_id="tenant-001")

        assert service.tenant_id == "tenant-001"

    def test_init_with_user(self, mock_db):
        """Test service initializes with user context."""
        service = NotificationService(db=mock_db, user_id="user-001")

        assert service.user_id == "user-001"

    def test_init_default_config(self, mock_db):
        """Test service uses default config when none provided."""
        service = NotificationService(db=mock_db)

        assert service.config is not None
        assert service.config.max_retries == 3
        assert service.config.enable_digest is True

    def test_init_custom_config(self, mock_db):
        """Test service uses custom config."""
        config = NotificationConfig(
            max_retries=5,
            enable_digest=False,
        )
        service = NotificationService(db=mock_db, config=config)

        assert service.config.max_retries == 5
        assert service.config.enable_digest is False

    def test_handlers_lazy_loaded(self, mock_db):
        """Test handlers are not initialized until accessed."""
        service = NotificationService(db=mock_db)

        assert service._email_handler is None
        assert service._push_handler is None
        assert service._slack_handler is None
        assert service._in_app_handler is None


class TestHandlerProperties:
    """Test handler property accessors."""

    def test_email_handler_lazy_load(self, notification_service):
        """Test email handler is created on first access."""
        handler = notification_service.email_handler

        assert handler is not None
        assert notification_service._email_handler is handler
        # Second access returns same instance
        assert notification_service.email_handler is handler

    def test_push_handler_lazy_load(self, notification_service):
        """Test push handler is created on first access."""
        handler = notification_service.push_handler

        assert handler is not None
        assert notification_service._push_handler is handler

    def test_slack_handler_lazy_load(self, notification_service):
        """Test Slack handler is created on first access."""
        handler = notification_service.slack_handler

        assert handler is not None
        assert notification_service._slack_handler is handler

    def test_in_app_handler_lazy_load(self, notification_service):
        """Test in-app handler is created on first access."""
        handler = notification_service.in_app_handler

        assert handler is not None
        assert notification_service._in_app_handler is handler

    def test_in_app_handler_receives_db(self, notification_service, mock_db):
        """Test in-app handler receives database instance."""
        handler = notification_service.in_app_handler

        assert handler.db == mock_db


# =============================================================================
# SEND NOTIFICATION TESTS
# =============================================================================


class TestSendNotification:
    """Test send_notification method."""

    @pytest.mark.asyncio
    async def test_send_notification_returns_dict(self, notification_service, mock_in_app_result):
        """Test send_notification returns a dictionary."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="alert",
                title="Test Alert",
                message="This is a test",
            )

            assert isinstance(result, dict)
            assert "notification_id" in result
            assert "channels_requested" in result
            assert "success" in result

    @pytest.mark.asyncio
    async def test_send_notification_uses_default_channels(
        self, notification_service, mock_in_app_result
    ):
        """Test default channels are used based on notification type."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="alert",
                title="Alert",
                message="Test",
            )

            # Alert type defaults to ["in_app", "push"]
            assert "in_app" in result["channels_requested"]
            assert "push" in result["channels_requested"]

    @pytest.mark.asyncio
    async def test_send_notification_custom_channels(
        self, notification_service, mock_email_result
    ):
        """Test custom channels override defaults."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_email_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="alert",
                title="Alert",
                message="Test",
                channels=["email"],
            )

            assert result["channels_requested"] == ["email"]

    @pytest.mark.asyncio
    async def test_send_notification_with_data(
        self, notification_service, mock_in_app_result
    ):
        """Test notification with additional data."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="alert",
                title="Alert",
                message="Test",
                data={"key": "value"},
                priority="high",
                action_url="https://example.com",
                related_type="portfolio",
                related_id="port-001",
            )

            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_send_notification_tracks_delivery_status(
        self, notification_service, mock_in_app_result
    ):
        """Test delivery status is tracked per channel."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="system",
                title="System",
                message="Test",
            )

            assert "delivery_status" in result
            assert isinstance(result["delivery_status"], dict)

    @pytest.mark.asyncio
    async def test_send_notification_partial_success(self, notification_service):
        """Test notification with mixed channel results."""
        results = [
            DeliveryResult(
                channel=NotificationChannel.IN_APP,
                status=DeliveryStatus.DELIVERED,
            ),
            DeliveryResult(
                channel=NotificationChannel.PUSH,
                status=DeliveryStatus.FAILED,
                error="No device token",
            ),
        ]
        call_count = 0

        async def mock_send(*args, **kwargs):
            nonlocal call_count
            result = results[call_count]
            call_count += 1
            return result

        with patch.object(
            notification_service, "_send_to_channel", side_effect=mock_send
        ):
            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="alert",
                title="Alert",
                message="Test",
            )

            # Should still be successful if at least one channel succeeded
            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_send_notification_all_failed(self, notification_service):
        """Test notification when all channels fail."""
        failed_result = DeliveryResult(
            channel=NotificationChannel.IN_APP,
            status=DeliveryStatus.FAILED,
            error="Test error",
        )

        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = failed_result

            result = await notification_service.send_notification(
                user_id="user-001",
                notification_type="system",
                title="System",
                message="Test",
            )

            assert result["success"] is False


# =============================================================================
# ALERT NOTIFICATION TESTS
# =============================================================================


class TestSendAlertNotification:
    """Test send_alert_notification method."""

    @pytest.mark.asyncio
    async def test_send_alert_notification(self, notification_service, mock_in_app_result):
        """Test sending alert notification."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            alert = {
                "id": "alert-001",
                "user_id": "user-001",
                "title": "Price Alert",
                "message": "AAPL crossed $150",
                "severity": "high",
                "action_url": "https://example.com/alert/001",
            }

            result = await notification_service.send_alert_notification(alert)

            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_send_alert_maps_severity_to_priority(
        self, notification_service, mock_in_app_result
    ):
        """Test severity is mapped to priority."""
        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            # Test critical severity
            await notification_service.send_alert_notification({
                "user_id": "user-001",
                "severity": "critical",
            })

            call_kwargs = mock_send.call_args[1]
            assert call_kwargs["priority"] == "urgent"

    @pytest.mark.asyncio
    async def test_send_alert_missing_user_id(self, notification_service):
        """Test alert without user_id raises error."""
        from arc.services.base import ServiceError

        with pytest.raises(ServiceError) as exc_info:
            await notification_service.send_alert_notification({"title": "No user"})

        assert "user_id" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_send_alert_severity_mapping(self, notification_service):
        """Test all severity levels are mapped correctly."""
        severity_priority_map = [
            ("low", "low"),
            ("medium", "normal"),
            ("high", "high"),
            ("critical", "urgent"),
            ("unknown", "normal"),  # Default
        ]

        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            for severity, expected_priority in severity_priority_map:
                await notification_service.send_alert_notification({
                    "user_id": "user-001",
                    "severity": severity,
                })

                call_kwargs = mock_send.call_args[1]
                assert call_kwargs["priority"] == expected_priority, f"Severity {severity}"


# =============================================================================
# BRIEF NOTIFICATION TESTS
# =============================================================================


class TestSendBriefNotification:
    """Test send_brief_notification method."""

    @pytest.mark.asyncio
    async def test_send_brief_notification(self, notification_service, mock_email_result):
        """Test sending morning brief notification."""
        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            brief = {
                "title": "Your Morning Brief",
                "summary": "Markets are up today",
                "view_url": "https://example.com/brief/001",
            }

            result = await notification_service.send_brief_notification(
                user_id="user-001",
                brief=brief,
            )

            assert result["success"] is True

    @pytest.mark.asyncio
    async def test_send_brief_uses_correct_channels(self, notification_service):
        """Test brief uses email and in_app channels."""
        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            await notification_service.send_brief_notification(
                user_id="user-001",
                brief={"summary": "Test"},
            )

            call_kwargs = mock_send.call_args[1]
            assert call_kwargs["channels"] == ["email", "in_app"]

    @pytest.mark.asyncio
    async def test_send_brief_uses_defaults(self, notification_service):
        """Test brief uses default values for missing fields."""
        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            await notification_service.send_brief_notification(
                user_id="user-001",
                brief={},  # Empty brief
            )

            call_kwargs = mock_send.call_args[1]
            assert call_kwargs["title"] == "Your Morning Brief"


# =============================================================================
# BULK NOTIFICATION TESTS
# =============================================================================


class TestSendBulkNotification:
    """Test send_bulk_notification method."""

    @pytest.mark.asyncio
    async def test_send_bulk_notification(self, notification_service, mock_in_app_result):
        """Test sending notification to multiple users."""
        with patch.object(
            notification_service, "_send_to_channel", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = mock_in_app_result

            result = await notification_service.send_bulk_notification(
                user_ids=["user-001", "user-002", "user-003"],
                notification_type="announcement",
                title="Announcement",
                message="Important update",
            )

            assert result["total"] == 3
            assert result["successful"] == 3
            assert result["failed"] == 0

    @pytest.mark.asyncio
    async def test_send_bulk_partial_failure(self, notification_service):
        """Test bulk send with some failures."""
        call_count = 0

        async def mock_send_notification(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("User not found")
            return {"success": True}

        with patch.object(
            notification_service,
            "send_notification",
            side_effect=mock_send_notification,
        ):
            result = await notification_service.send_bulk_notification(
                user_ids=["user-001", "user-002", "user-003"],
                notification_type="system",
                title="System",
                message="Test",
            )

            assert result["total"] == 3
            assert result["successful"] == 2
            assert result["failed"] == 1

    @pytest.mark.asyncio
    async def test_send_bulk_empty_list(self, notification_service):
        """Test bulk send with empty user list."""
        result = await notification_service.send_bulk_notification(
            user_ids=[],
            notification_type="system",
            title="System",
            message="Test",
        )

        assert result["total"] == 0
        assert result["successful"] == 0

    @pytest.mark.asyncio
    async def test_send_bulk_passes_kwargs(self, notification_service):
        """Test bulk send passes additional kwargs."""
        with patch.object(
            notification_service, "send_notification", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = {"success": True}

            await notification_service.send_bulk_notification(
                user_ids=["user-001"],
                notification_type="alert",
                title="Alert",
                message="Test",
                priority="high",
                data={"key": "value"},
            )

            call_kwargs = mock_send.call_args[1]
            assert call_kwargs["priority"] == "high"
            assert call_kwargs["data"] == {"key": "value"}


# =============================================================================
# CHANNEL FILTERING TESTS
# =============================================================================


class TestFilterChannelsByPreferences:
    """Test _filter_channels_by_preferences method."""

    @pytest.mark.asyncio
    async def test_no_preferences_returns_all(self, notification_service, mock_db):
        """Test all channels returned when no preferences set."""
        mock_db.express.list = AsyncMock(return_value=[])

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        channels = await notification_service._filter_channels_by_preferences(
            "user-001",
            ["email", "push", "in_app"],
            payload,
        )

        assert channels == ["email", "push", "in_app"]

    @pytest.mark.asyncio
    async def test_respects_enabled_preference(self, notification_service, mock_db):
        """Test channels are filtered by enabled preference."""
        mock_db.express.list = AsyncMock(
            return_value=[
                {"channel": "email", "enabled": True},
                {"channel": "push", "enabled": True},
                # No preference for in_app
            ]
        )

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        channels = await notification_service._filter_channels_by_preferences(
            "user-001",
            ["email", "push", "in_app"],
            payload,
        )

        # All should be included
        assert "email" in channels
        assert "push" in channels
        assert "in_app" in channels

    @pytest.mark.asyncio
    async def test_severity_filter_critical(self, notification_service, mock_db):
        """Test severity filter for critical-only preference."""
        mock_db.express.list = AsyncMock(
            return_value=[
                {"channel": "push", "enabled": True, "severity_filter": "critical"},
            ]
        )

        # Normal priority notification
        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
            priority=NotificationPriority.NORMAL,
        )

        channels = await notification_service._filter_channels_by_preferences(
            "user-001",
            ["push"],
            payload,
        )

        # Push should be excluded for normal priority
        assert "push" not in channels

    @pytest.mark.asyncio
    async def test_severity_filter_allows_urgent(self, notification_service, mock_db):
        """Test severity filter allows urgent notifications."""
        mock_db.express.list = AsyncMock(
            return_value=[
                {"channel": "push", "enabled": True, "severity_filter": "critical"},
            ]
        )

        # Urgent priority notification
        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
            priority=NotificationPriority.URGENT,
        )

        channels = await notification_service._filter_channels_by_preferences(
            "user-001",
            ["push"],
            payload,
        )

        # Push should be included for urgent
        assert "push" in channels

    @pytest.mark.asyncio
    async def test_database_error_returns_all(self, notification_service, mock_db):
        """Test all channels returned on database error."""
        mock_db.express.list = AsyncMock(side_effect=Exception("DB error"))

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        channels = await notification_service._filter_channels_by_preferences(
            "user-001",
            ["email", "push"],
            payload,
        )

        # Should return all requested channels on error
        assert channels == ["email", "push"]


# =============================================================================
# QUIET HOURS TESTS
# =============================================================================


class TestIsQuietHours:
    """Test _is_quiet_hours method."""

    @pytest.mark.asyncio
    async def test_no_quiet_hours_set(self, notification_service):
        """Test returns false when quiet hours not set."""
        preference = {"channel": "push"}

        result = await notification_service._is_quiet_hours(preference)

        assert result is False

    @pytest.mark.asyncio
    async def test_quiet_hours_active(self, notification_service):
        """Test returns true during quiet hours."""
        # Get current hour and set quiet hours around it
        now = datetime.now(UTC)
        current_hour = now.hour

        preference = {
            "quiet_hours_start": f"{current_hour:02d}:00",
            "quiet_hours_end": f"{(current_hour + 2) % 24:02d}:00",
        }

        result = await notification_service._is_quiet_hours(preference)

        assert result is True

    @pytest.mark.asyncio
    async def test_quiet_hours_inactive(self, notification_service):
        """Test returns false outside quiet hours."""
        now = datetime.now(UTC)
        # Set quiet hours to a time definitely not now
        future_hour = (now.hour + 12) % 24

        preference = {
            "quiet_hours_start": f"{future_hour:02d}:00",
            "quiet_hours_end": f"{(future_hour + 2) % 24:02d}:00",
        }

        result = await notification_service._is_quiet_hours(preference)

        assert result is False

    @pytest.mark.asyncio
    async def test_overnight_quiet_hours(self, notification_service):
        """Test overnight quiet hours (e.g., 22:00 - 07:00)."""
        now = datetime.now(UTC)

        # Test case: if it's currently 23:00, quiet hours 22:00-07:00 should be active
        # We test this by mocking datetime
        with patch(
            "arc.services.notification_service.datetime"
        ) as mock_datetime:
            mock_now = MagicMock()
            mock_now.time.return_value = time(23, 0)
            mock_datetime.now.return_value = mock_now
            mock_datetime.strptime = datetime.strptime

            preference = {
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00",
            }

            result = await notification_service._is_quiet_hours(preference)

            assert result is True

    @pytest.mark.asyncio
    async def test_invalid_quiet_hours_format(self, notification_service):
        """Test returns false for invalid time format."""
        preference = {
            "quiet_hours_start": "invalid",
            "quiet_hours_end": "also_invalid",
        }

        result = await notification_service._is_quiet_hours(preference)

        assert result is False


# =============================================================================
# SEND TO CHANNEL TESTS
# =============================================================================


class TestSendToChannel:
    """Test _send_to_channel method."""

    @pytest.mark.asyncio
    async def test_send_to_email_channel(self, notification_service, mock_db):
        """Test sending to email channel."""
        mock_db.express.read = AsyncMock(
            return_value={"id": "user-001", "email": "user@example.com"}
        )

        with patch.object(
            notification_service.email_handler, "send", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = DeliveryResult(
                channel=NotificationChannel.EMAIL,
                status=DeliveryStatus.SENT,
            )

            payload = NotificationPayload(
                notification_id="test",
                user_id="user-001",
                title="Test",
                message="Test",
                notification_type=NotificationType.ALERT,
            )

            result = await notification_service._send_to_channel(
                payload, "user-001", "email"
            )

            assert result.status == DeliveryStatus.SENT
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_to_email_no_email(self, notification_service, mock_db):
        """Test email channel fails when user has no email."""
        mock_db.express.read = AsyncMock(return_value={"id": "user-001"})  # No email

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        result = await notification_service._send_to_channel(
            payload, "user-001", "email"
        )

        assert result.status == DeliveryStatus.FAILED
        assert "email not found" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_to_push_no_tokens(self, notification_service):
        """Test push channel fails when no device tokens."""
        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        result = await notification_service._send_to_channel(
            payload, "user-001", "push"
        )

        assert result.status == DeliveryStatus.FAILED
        assert "device tokens" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_to_slack_no_destination(self, notification_service, mock_db):
        """Test Slack channel fails when no destination configured."""
        mock_db.express.list = AsyncMock(return_value=[])

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        result = await notification_service._send_to_channel(
            payload, "user-001", "slack"
        )

        assert result.status == DeliveryStatus.FAILED
        assert "destination" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_to_in_app_channel(self, notification_service):
        """Test sending to in-app channel."""
        with patch.object(
            notification_service.in_app_handler, "send", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = DeliveryResult(
                channel=NotificationChannel.IN_APP,
                status=DeliveryStatus.DELIVERED,
            )

            payload = NotificationPayload(
                notification_id="test",
                user_id="user-001",
                title="Test",
                message="Test",
                notification_type=NotificationType.ALERT,
            )

            result = await notification_service._send_to_channel(
                payload, "user-001", "in_app"
            )

            assert result.status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_to_unknown_channel(self, notification_service):
        """Test sending to unknown channel fails."""
        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        result = await notification_service._send_to_channel(
            payload, "user-001", "unknown"
        )

        assert result.status == DeliveryStatus.FAILED
        # Error message comes from ValueError or our code
        assert "unknown" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_to_channel_exception_handling(
        self, notification_service, mock_db
    ):
        """Test channel exceptions are handled gracefully."""
        mock_db.express.read = AsyncMock(side_effect=Exception("DB error"))

        payload = NotificationPayload(
            notification_id="test",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        result = await notification_service._send_to_channel(
            payload, "user-001", "email"
        )

        assert result.status == DeliveryStatus.FAILED


# =============================================================================
# NOTIFICATION RETRIEVAL TESTS
# =============================================================================


class TestGetNotifications:
    """Test get_notifications method."""

    @pytest.mark.asyncio
    async def test_get_notifications(self, notification_service):
        """Test getting user notifications."""
        mock_notifications = [
            {"id": "notif-001", "title": "Test 1"},
            {"id": "notif-002", "title": "Test 2"},
        ]

        with patch.object(
            notification_service.in_app_handler,
            "get_notifications",
            new_callable=AsyncMock,
        ) as mock_get:
            mock_get.return_value = mock_notifications

            result = await notification_service.get_notifications("user-001")

            assert len(result) == 2
            mock_get.assert_called_once_with("user-001", 20, 0, False)

    @pytest.mark.asyncio
    async def test_get_notifications_with_pagination(self, notification_service):
        """Test getting notifications with pagination."""
        with patch.object(
            notification_service.in_app_handler,
            "get_notifications",
            new_callable=AsyncMock,
        ) as mock_get:
            mock_get.return_value = []

            await notification_service.get_notifications(
                "user-001", limit=10, offset=20
            )

            mock_get.assert_called_once_with("user-001", 10, 20, False)

    @pytest.mark.asyncio
    async def test_get_notifications_unread_only(self, notification_service):
        """Test getting only unread notifications."""
        with patch.object(
            notification_service.in_app_handler,
            "get_notifications",
            new_callable=AsyncMock,
        ) as mock_get:
            mock_get.return_value = []

            await notification_service.get_notifications(
                "user-001", unread_only=True
            )

            mock_get.assert_called_once_with("user-001", 20, 0, True)


class TestGetUnreadCount:
    """Test get_unread_count method."""

    @pytest.mark.asyncio
    async def test_get_unread_count(self, notification_service):
        """Test getting unread notification count."""
        with patch.object(
            notification_service.in_app_handler,
            "get_unread_count",
            new_callable=AsyncMock,
        ) as mock_count:
            mock_count.return_value = 5

            count = await notification_service.get_unread_count("user-001")

            assert count == 5


# =============================================================================
# MARK AS READ TESTS
# =============================================================================


class TestMarkAsRead:
    """Test mark_as_read method."""

    @pytest.mark.asyncio
    async def test_mark_as_read(self, notification_service):
        """Test marking notification as read."""
        with patch.object(
            notification_service.in_app_handler,
            "mark_as_read",
            new_callable=AsyncMock,
        ) as mock_mark:
            mock_mark.return_value = True

            result = await notification_service.mark_as_read(
                "notif-001", "user-001"
            )

            assert result is True
            mock_mark.assert_called_once_with("notif-001", "user-001")


class TestMarkAllAsRead:
    """Test mark_all_as_read method."""

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, notification_service, mock_db):
        """Test marking all notifications as read."""
        mock_db.express.list = AsyncMock(
            return_value=[
                {"id": "notif-001"},
                {"id": "notif-002"},
                {"id": "notif-003"},
            ]
        )

        count = await notification_service.mark_all_as_read("user-001")

        assert count == 3
        assert mock_db.express.update.call_count == 3

    @pytest.mark.asyncio
    async def test_mark_all_as_read_no_unread(self, notification_service, mock_db):
        """Test mark all when no unread notifications."""
        mock_db.express.list = AsyncMock(return_value=[])

        count = await notification_service.mark_all_as_read("user-001")

        assert count == 0

    @pytest.mark.asyncio
    async def test_mark_all_as_read_db_error(self, notification_service, mock_db):
        """Test mark all handles database errors."""
        mock_db.express.list = AsyncMock(side_effect=Exception("DB error"))

        count = await notification_service.mark_all_as_read("user-001")

        assert count == 0


# =============================================================================
# DISMISS TESTS
# =============================================================================


class TestDismiss:
    """Test dismiss method."""

    @pytest.mark.asyncio
    async def test_dismiss(self, notification_service):
        """Test dismissing notification."""
        with patch.object(
            notification_service.in_app_handler,
            "dismiss",
            new_callable=AsyncMock,
        ) as mock_dismiss:
            mock_dismiss.return_value = True

            result = await notification_service.dismiss("notif-001", "user-001")

            assert result is True
            mock_dismiss.assert_called_once_with("notif-001", "user-001")


# =============================================================================
# CLOSE TESTS
# =============================================================================


class TestClose:
    """Test close method."""

    @pytest.mark.asyncio
    async def test_close_all_handlers(self, notification_service):
        """Test closing all initialized handlers."""
        # Initialize handlers
        _ = notification_service.email_handler
        _ = notification_service.push_handler
        _ = notification_service.slack_handler

        # Mock close methods
        notification_service._email_handler.close = AsyncMock()
        notification_service._push_handler.close = AsyncMock()
        notification_service._slack_handler.close = AsyncMock()

        await notification_service.close()

        notification_service._email_handler.close.assert_called_once()
        notification_service._push_handler.close.assert_called_once()
        notification_service._slack_handler.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_uninitialized_handlers(self, notification_service):
        """Test close handles uninitialized handlers."""
        # Don't initialize any handlers
        await notification_service.close()  # Should not raise


# =============================================================================
# NOTIFICATION RECORD STORAGE TESTS
# =============================================================================


class TestStoreNotificationRecord:
    """Test _store_notification_record method."""

    @pytest.mark.asyncio
    async def test_store_record(self, notification_service, mock_db):
        """Test storing notification record."""
        payload = NotificationPayload(
            notification_id="notif-001",
            user_id="user-001",
            title="Test",
            message="Test message",
            notification_type=NotificationType.ALERT,
            priority=NotificationPriority.HIGH,
        )

        results = {
            "email": DeliveryResult(
                channel=NotificationChannel.EMAIL,
                status=DeliveryStatus.SENT,
            )
        }

        await notification_service._store_notification_record(
            "notif-001",
            "user-001",
            payload,
            ["email"],
            results,
        )

        mock_db.express.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_skip_store_if_in_app_success(self, notification_service, mock_db):
        """Test skipping storage if in_app already stored."""
        payload = NotificationPayload(
            notification_id="notif-001",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        results = {
            "in_app": DeliveryResult(
                channel=NotificationChannel.IN_APP,
                status=DeliveryStatus.DELIVERED,
            )
        }

        await notification_service._store_notification_record(
            "notif-001",
            "user-001",
            payload,
            ["in_app"],
            results,
        )

        # Should not call create since in_app already stored it
        mock_db.express.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_store_record_db_error(self, notification_service, mock_db):
        """Test store record handles database errors."""
        mock_db.express.create = AsyncMock(side_effect=Exception("DB error"))

        payload = NotificationPayload(
            notification_id="notif-001",
            user_id="user-001",
            title="Test",
            message="Test",
            notification_type=NotificationType.ALERT,
        )

        results = {
            "email": DeliveryResult(
                channel=NotificationChannel.EMAIL,
                status=DeliveryStatus.SENT,
            )
        }

        # Should not raise
        await notification_service._store_notification_record(
            "notif-001",
            "user-001",
            payload,
            ["email"],
            results,
        )


# =============================================================================
# DEFAULT CHANNELS CONFIG TESTS
# =============================================================================


class TestDefaultChannelsConfig:
    """Test default channel configuration."""

    def test_default_channels_for_alert(self):
        """Test default channels for alert type."""
        config = NotificationConfig()
        assert config.default_channels["alert"] == ["in_app", "push"]

    def test_default_channels_for_brief(self):
        """Test default channels for brief type."""
        config = NotificationConfig()
        assert config.default_channels["brief"] == ["email", "in_app"]

    def test_default_channels_for_system(self):
        """Test default channels for system type."""
        config = NotificationConfig()
        assert config.default_channels["system"] == ["in_app"]

    def test_default_channels_for_announcement(self):
        """Test default channels for announcement type."""
        config = NotificationConfig()
        assert config.default_channels["announcement"] == ["email", "in_app", "push"]

    def test_custom_default_channels(self, mock_db):
        """Test custom default channels configuration."""
        config = NotificationConfig(
            default_channels={
                "alert": ["email", "slack"],
                "system": ["in_app", "push"],
            }
        )
        service = NotificationService(db=mock_db, config=config)

        assert service.config.default_channels["alert"] == ["email", "slack"]
        assert service.config.default_channels["system"] == ["in_app", "push"]
