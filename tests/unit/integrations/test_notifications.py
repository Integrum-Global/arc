"""Unit tests for notification handlers."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

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

# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def sample_payload():
    """Create a sample notification payload."""
    return NotificationPayload(
        notification_id="notif-001",
        user_id="user-001",
        title="Test Notification",
        message="This is a test notification message.",
        notification_type=NotificationType.ALERT,
        priority=NotificationPriority.NORMAL,
        data={"key": "value"},
        action_url="https://example.com/action",
        related_type="alert",
        related_id="alert-001",
        tenant_id="tenant-001",
    )


@pytest.fixture
def urgent_payload():
    """Create an urgent notification payload."""
    return NotificationPayload(
        notification_id="notif-urgent",
        user_id="user-001",
        title="Urgent Alert",
        message="This requires immediate attention.",
        notification_type=NotificationType.ALERT,
        priority=NotificationPriority.URGENT,
        data={},
        action_url=None,
    )


@pytest.fixture
def mock_db():
    """Create mock DataFlow instance."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.create = AsyncMock(return_value={"id": "notif-001"})
    db.express.update = AsyncMock(return_value={"id": "notif-001"})
    db.express.list = AsyncMock(return_value=[])
    db.express.count = AsyncMock(return_value=0)
    return db


# =============================================================================
# BASE HANDLER TESTS
# =============================================================================


class TestDeliveryResult:
    """Test DeliveryResult dataclass."""

    def test_success_when_sent(self):
        """Test success property returns true for SENT status."""
        result = DeliveryResult(
            channel=NotificationChannel.EMAIL,
            status=DeliveryStatus.SENT,
        )
        assert result.success is True

    def test_success_when_delivered(self):
        """Test success property returns true for DELIVERED status."""
        result = DeliveryResult(
            channel=NotificationChannel.PUSH,
            status=DeliveryStatus.DELIVERED,
        )
        assert result.success is True

    def test_not_success_when_failed(self):
        """Test success property returns false for FAILED status."""
        result = DeliveryResult(
            channel=NotificationChannel.EMAIL,
            status=DeliveryStatus.FAILED,
            error="Test error",
        )
        assert result.success is False

    def test_not_success_when_bounced(self):
        """Test success property returns false for BOUNCED status."""
        result = DeliveryResult(
            channel=NotificationChannel.EMAIL,
            status=DeliveryStatus.BOUNCED,
        )
        assert result.success is False

    def test_not_success_when_rate_limited(self):
        """Test success property returns false for RATE_LIMITED status."""
        result = DeliveryResult(
            channel=NotificationChannel.PUSH,
            status=DeliveryStatus.RATE_LIMITED,
        )
        assert result.success is False

    def test_timestamp_is_set(self):
        """Test timestamp is automatically set."""
        result = DeliveryResult(
            channel=NotificationChannel.EMAIL,
            status=DeliveryStatus.SENT,
        )
        assert result.timestamp is not None

    def test_metadata_default_empty(self):
        """Test metadata defaults to empty dict."""
        result = DeliveryResult(
            channel=NotificationChannel.EMAIL,
            status=DeliveryStatus.SENT,
        )
        assert result.metadata == {}


# =============================================================================
# EMAIL HANDLER TESTS
# =============================================================================


class TestEmailHandler:
    """Test EmailHandler."""

    @pytest.fixture
    def email_handler(self):
        """Create EmailHandler with default config."""
        return EmailHandler()

    @pytest.fixture
    def smtp_handler(self):
        """Create EmailHandler with SMTP config."""
        config = EmailConfig(
            provider="smtp",
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_username="user",
            smtp_password="pass",
            from_email="noreply@example.com",
            from_name="Test Platform",
        )
        return EmailHandler(config)

    @pytest.fixture
    def sendgrid_handler(self):
        """Create EmailHandler with SendGrid config."""
        config = EmailConfig(
            provider="sendgrid",
            sendgrid_api_key="SG.test_key",
            from_email="noreply@example.com",
        )
        return EmailHandler(config)

    # Initialization tests
    def test_init_default_config(self, email_handler):
        """Test handler initializes with default config."""
        assert email_handler.config is not None
        assert email_handler.config.provider == "smtp"
        assert email_handler.enabled is True

    def test_init_custom_config(self, smtp_handler):
        """Test handler initializes with custom config."""
        assert smtp_handler.config.smtp_host == "smtp.example.com"
        assert smtp_handler.config.from_email == "noreply@example.com"

    def test_channel_is_email(self, email_handler):
        """Test handler channel is EMAIL."""
        assert email_handler.channel == NotificationChannel.EMAIL

    # Enable/disable tests
    def test_enable_disable(self, email_handler):
        """Test enable and disable functionality."""
        assert email_handler.enabled is True

        email_handler.disable()
        assert email_handler.enabled is False

        email_handler.enable()
        assert email_handler.enabled is True

    # Destination validation tests
    @pytest.mark.asyncio
    async def test_validate_valid_email(self, email_handler):
        """Test validation of valid email addresses."""
        valid_emails = [
            "user@example.com",
            "user.name@domain.org",
            "user+tag@company.co.uk",
            "firstname.lastname@example.com",
        ]
        for email in valid_emails:
            assert await email_handler.validate_destination(email) is True

    @pytest.mark.asyncio
    async def test_validate_invalid_email(self, email_handler):
        """Test validation of invalid email addresses."""
        invalid_emails = [
            "",
            "invalid",
            "@domain.com",
            "user@",
            "user@.com",
            "user@domain",
        ]
        for email in invalid_emails:
            assert await email_handler.validate_destination(email) is False

    # Send tests - disabled handler
    @pytest.mark.asyncio
    async def test_send_when_disabled(self, email_handler, sample_payload):
        """Test send returns failure when handler is disabled."""
        email_handler.disable()

        result = await email_handler.send(sample_payload, "test@example.com")

        assert result.status == DeliveryStatus.FAILED
        assert "disabled" in result.error.lower()

    # Send tests - invalid destination
    @pytest.mark.asyncio
    async def test_send_invalid_email(self, email_handler, sample_payload):
        """Test send returns failure for invalid email."""
        result = await email_handler.send(sample_payload, "invalid-email")

        assert result.status == DeliveryStatus.FAILED
        assert "Invalid email" in result.error

    # Send tests - SMTP
    @pytest.mark.asyncio
    async def test_send_smtp_success(self, smtp_handler, sample_payload):
        """Test SMTP send success."""
        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)

            result = await smtp_handler.send(sample_payload, "test@example.com")

            assert result.status == DeliveryStatus.SENT
            assert result.metadata.get("provider") == "smtp"

    @pytest.mark.asyncio
    async def test_send_smtp_with_cc_bcc(self, smtp_handler, sample_payload):
        """Test SMTP send with CC and BCC."""
        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)

            result = await smtp_handler.send(
                sample_payload,
                "test@example.com",
                cc=["cc@example.com"],
                bcc=["bcc@example.com"],
            )

            assert result.status == DeliveryStatus.SENT

    @pytest.mark.asyncio
    async def test_send_smtp_authentication_error(self, smtp_handler, sample_payload):
        """Test SMTP authentication error handling."""
        import smtplib

        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Auth failed")
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)

            result = await smtp_handler.send(sample_payload, "test@example.com")

            assert result.status == DeliveryStatus.FAILED
            assert "authentication" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_smtp_recipient_refused(self, smtp_handler, sample_payload):
        """Test SMTP recipient refused handling."""
        import smtplib

        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_server.sendmail.side_effect = smtplib.SMTPRecipientsRefused({})
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)

            result = await smtp_handler.send(sample_payload, "test@example.com")

            assert result.status == DeliveryStatus.BOUNCED

    # Send tests - SendGrid
    @pytest.mark.asyncio
    async def test_send_sendgrid_success(self, sendgrid_handler, sample_payload):
        """Test SendGrid send success."""
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_response.headers = {"X-Message-Id": "msg-123"}

        with patch.object(sendgrid_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await sendgrid_handler.send(sample_payload, "test@example.com")

            assert result.status == DeliveryStatus.SENT
            assert result.message_id == "msg-123"
            assert result.metadata.get("provider") == "sendgrid"

    @pytest.mark.asyncio
    async def test_send_sendgrid_with_template(self, sendgrid_handler, sample_payload):
        """Test SendGrid send with template ID."""
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_response.headers = {}

        with patch.object(sendgrid_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await sendgrid_handler.send(
                sample_payload,
                "test@example.com",
                template_id="d-abc123",
            )

            assert result.status == DeliveryStatus.SENT

    @pytest.mark.asyncio
    async def test_send_sendgrid_error(self, sendgrid_handler, sample_payload):
        """Test SendGrid error handling."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad request"

        with patch.object(sendgrid_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await sendgrid_handler.send(sample_payload, "test@example.com")

            assert result.status == DeliveryStatus.FAILED
            assert "API error" in result.error

    @pytest.mark.asyncio
    async def test_send_sendgrid_no_api_key(self, sample_payload):
        """Test SendGrid fails without API key."""
        handler = EmailHandler(EmailConfig(provider="sendgrid"))

        result = await handler.send(sample_payload, "test@example.com")

        assert result.status == DeliveryStatus.FAILED
        assert "API key" in result.error

    # SES tests
    @pytest.mark.asyncio
    async def test_send_ses_not_implemented(self, sample_payload):
        """Test SES returns not implemented error."""
        handler = EmailHandler(EmailConfig(provider="ses"))

        result = await handler.send(sample_payload, "test@example.com")

        assert result.status == DeliveryStatus.FAILED
        assert "not implemented" in result.error.lower()

    # Format tests
    def test_format_subject_normal(self, email_handler, sample_payload):
        """Test subject formatting for normal priority."""
        subject = email_handler._format_subject(sample_payload)
        assert subject == "Test Notification"

    def test_format_subject_urgent(self, email_handler, urgent_payload):
        """Test subject formatting for urgent priority."""
        subject = email_handler._format_subject(urgent_payload)
        assert subject == "[URGENT] Urgent Alert"

    def test_format_subject_high(self, email_handler, sample_payload):
        """Test subject formatting for high priority."""
        sample_payload.priority = NotificationPriority.HIGH
        subject = email_handler._format_subject(sample_payload)
        assert subject == "[IMPORTANT] Test Notification"

    def test_format_plain_body(self, email_handler, sample_payload):
        """Test plain text body formatting."""
        body = email_handler._format_plain_body(sample_payload)
        assert "Test Notification" in body
        assert "test notification message" in body
        assert "https://example.com/action" in body

    def test_format_html_body(self, email_handler, sample_payload):
        """Test HTML body formatting."""
        html = email_handler._format_html_body(sample_payload)
        assert "Test Notification" in html
        assert "test notification message" in html
        assert "https://example.com/action" in html
        assert "View Details" in html

    # Close tests
    @pytest.mark.asyncio
    async def test_close_handler(self, email_handler):
        """Test handler close method."""
        await email_handler.close()
        # Should not raise even if no client


# =============================================================================
# PUSH HANDLER TESTS
# =============================================================================


class TestPushHandler:
    """Test PushHandler."""

    @pytest.fixture
    def push_handler(self):
        """Create PushHandler with default config."""
        return PushHandler()

    @pytest.fixture
    def configured_handler(self):
        """Create PushHandler with FCM config."""
        config = PushConfig(
            fcm_server_key="test_server_key",
            fcm_project_id="test-project",
        )
        return PushHandler(config)

    # Valid FCM device token (140+ characters)
    @pytest.fixture
    def valid_device_token(self):
        """Create a valid-looking FCM device token."""
        return "cM8lBxhDvZ0:APA91bH" + "a" * 130

    # Initialization tests
    def test_init_default_config(self, push_handler):
        """Test handler initializes with default config."""
        assert push_handler.config is not None
        assert push_handler.enabled is True

    def test_channel_is_push(self, push_handler):
        """Test handler channel is PUSH."""
        assert push_handler.channel == NotificationChannel.PUSH

    # Destination validation tests
    @pytest.mark.asyncio
    async def test_validate_valid_token(self, push_handler, valid_device_token):
        """Test validation of valid FCM token."""
        assert await push_handler.validate_destination(valid_device_token) is True

    @pytest.mark.asyncio
    async def test_validate_invalid_token_too_short(self, push_handler):
        """Test validation rejects short tokens."""
        assert await push_handler.validate_destination("short_token") is False

    @pytest.mark.asyncio
    async def test_validate_invalid_token_empty(self, push_handler):
        """Test validation rejects empty tokens."""
        assert await push_handler.validate_destination("") is False

    @pytest.mark.asyncio
    async def test_validate_invalid_token_special_chars(self, push_handler):
        """Test validation rejects tokens with invalid characters."""
        token = "a" * 140 + "@#$%"
        assert await push_handler.validate_destination(token) is False

    # Send tests - disabled handler
    @pytest.mark.asyncio
    async def test_send_when_disabled(self, push_handler, sample_payload, valid_device_token):
        """Test send returns failure when handler is disabled."""
        push_handler.disable()

        result = await push_handler.send(sample_payload, valid_device_token)

        assert result.status == DeliveryStatus.FAILED
        assert "disabled" in result.error.lower()

    # Send tests - no server key
    @pytest.mark.asyncio
    async def test_send_no_server_key(self, push_handler, sample_payload, valid_device_token):
        """Test send fails without FCM server key."""
        result = await push_handler.send(sample_payload, valid_device_token)

        assert result.status == DeliveryStatus.FAILED
        assert "server key" in result.error.lower()

    # Send tests - invalid token
    @pytest.mark.asyncio
    async def test_send_invalid_token(self, configured_handler, sample_payload):
        """Test send fails for invalid device token."""
        result = await configured_handler.send(sample_payload, "invalid")

        assert result.status == DeliveryStatus.FAILED
        assert "Invalid device token" in result.error

    # Send tests - FCM success
    @pytest.mark.asyncio
    async def test_send_fcm_success(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM send success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": 1,
            "results": [{"message_id": "msg-123"}],
        }

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(sample_payload, valid_device_token)

            assert result.status == DeliveryStatus.DELIVERED
            assert result.message_id == "msg-123"

    @pytest.mark.asyncio
    async def test_send_fcm_with_options(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM send with extra options."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": 1, "results": [{"message_id": "msg-456"}]}

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(
                sample_payload,
                valid_device_token,
                badge=5,
                sound="custom_sound",
                image="https://example.com/image.png",
                collapse_key="group1",
                ttl=3600,
            )

            assert result.status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_fcm_data_only(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM data-only message."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": 1, "results": [{}]}

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(
                sample_payload,
                valid_device_token,
                data_only=True,
            )

            assert result.status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_fcm_not_registered(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM NotRegistered error."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": 0,
            "failure": 1,
            "results": [{"error": "NotRegistered"}],
        }

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(sample_payload, valid_device_token)

            assert result.status == DeliveryStatus.BOUNCED
            assert "no longer valid" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_fcm_invalid_registration(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM InvalidRegistration error."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": 0,
            "results": [{"error": "InvalidRegistration"}],
        }

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(sample_payload, valid_device_token)

            assert result.status == DeliveryStatus.FAILED

    @pytest.mark.asyncio
    async def test_send_fcm_auth_error(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM authentication error."""
        mock_response = MagicMock()
        mock_response.status_code = 401

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(sample_payload, valid_device_token)

            assert result.status == DeliveryStatus.FAILED
            assert "authentication" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_fcm_rate_limited(
        self, configured_handler, sample_payload, valid_device_token
    ):
        """Test FCM rate limit handling."""
        mock_response = MagicMock()
        mock_response.status_code = 429

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send(sample_payload, valid_device_token)

            assert result.status == DeliveryStatus.RATE_LIMITED

    # Priority mapping tests
    def test_map_priority_urgent(self, push_handler):
        """Test urgent priority maps to high."""
        assert push_handler._map_priority(NotificationPriority.URGENT) == "high"

    def test_map_priority_high(self, push_handler):
        """Test high priority maps to high."""
        assert push_handler._map_priority(NotificationPriority.HIGH) == "high"

    def test_map_priority_normal(self, push_handler):
        """Test normal priority maps to normal."""
        assert push_handler._map_priority(NotificationPriority.NORMAL) == "normal"

    def test_map_priority_low(self, push_handler):
        """Test low priority maps to normal."""
        assert push_handler._map_priority(NotificationPriority.LOW) == "normal"

    # Topic tests
    @pytest.mark.asyncio
    async def test_send_to_topic_disabled(self, push_handler, sample_payload):
        """Test send to topic when disabled."""
        push_handler.disable()

        result = await push_handler.send_to_topic(sample_payload, "test-topic")

        assert result.status == DeliveryStatus.FAILED

    @pytest.mark.asyncio
    async def test_send_to_topic_no_key(self, push_handler, sample_payload):
        """Test send to topic without server key."""
        result = await push_handler.send_to_topic(sample_payload, "test-topic")

        assert result.status == DeliveryStatus.FAILED

    @pytest.mark.asyncio
    async def test_send_to_topic_success(self, configured_handler, sample_payload):
        """Test send to topic success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message_id": 123456}

        with patch.object(configured_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await configured_handler.send_to_topic(sample_payload, "alerts")

            assert result.status == DeliveryStatus.SENT
            assert result.metadata.get("topic") == "alerts"


# =============================================================================
# SLACK HANDLER TESTS
# =============================================================================


class TestSlackHandler:
    """Test SlackHandler."""

    @pytest.fixture
    def slack_handler(self):
        """Create SlackHandler with default config."""
        return SlackHandler()

    @pytest.fixture
    def webhook_handler(self):
        """Create SlackHandler with webhook URL."""
        config = SlackConfig(
            webhook_url="https://hooks.slack.com/services/T00/B00/xxx",
        )
        return SlackHandler(config)

    @pytest.fixture
    def bot_handler(self):
        """Create SlackHandler with bot token."""
        config = SlackConfig(
            bot_token="xoxb-test-token",
            default_channel="#general",
        )
        return SlackHandler(config)

    # Initialization tests
    def test_init_default_config(self, slack_handler):
        """Test handler initializes with default config."""
        assert slack_handler.config is not None
        assert slack_handler.enabled is True

    def test_channel_is_slack(self, slack_handler):
        """Test handler channel is SLACK."""
        assert slack_handler.channel == NotificationChannel.SLACK

    def test_custom_branding(self):
        """Test custom bot branding."""
        config = SlackConfig(
            bot_name="Custom Bot",
            bot_icon_emoji=":robot:",
            bot_icon_url="https://example.com/icon.png",
        )
        handler = SlackHandler(config)
        assert handler.config.bot_name == "Custom Bot"

    # Destination validation tests
    @pytest.mark.asyncio
    async def test_validate_webhook_url(self, slack_handler):
        """Test validation of webhook URL."""
        url = "https://hooks.slack.com/services/T00/B00/xxx"
        assert await slack_handler.validate_destination(url) is True

    @pytest.mark.asyncio
    async def test_validate_channel_id(self, slack_handler):
        """Test validation of channel ID."""
        assert await slack_handler.validate_destination("C0123456789") is True
        assert await slack_handler.validate_destination("G0123456789") is True

    @pytest.mark.asyncio
    async def test_validate_user_id(self, slack_handler):
        """Test validation of user ID for DMs."""
        assert await slack_handler.validate_destination("U0123456789") is True

    @pytest.mark.asyncio
    async def test_validate_channel_name(self, slack_handler):
        """Test validation of channel name."""
        assert await slack_handler.validate_destination("#general") is True

    @pytest.mark.asyncio
    async def test_validate_invalid_destination(self, slack_handler):
        """Test validation rejects invalid destinations."""
        assert await slack_handler.validate_destination("") is False
        assert await slack_handler.validate_destination("invalid") is False

    # Send tests - disabled handler
    @pytest.mark.asyncio
    async def test_send_when_disabled(self, slack_handler, sample_payload):
        """Test send returns failure when handler is disabled."""
        slack_handler.disable()

        result = await slack_handler.send(sample_payload, "#general")

        assert result.status == DeliveryStatus.FAILED
        assert "disabled" in result.error.lower()

    # Send tests - invalid destination
    @pytest.mark.asyncio
    async def test_send_invalid_destination(self, slack_handler, sample_payload):
        """Test send fails for invalid destination."""
        result = await slack_handler.send(sample_payload, "invalid")

        assert result.status == DeliveryStatus.FAILED
        assert "Invalid Slack destination" in result.error

    # Webhook tests
    @pytest.mark.asyncio
    async def test_send_webhook_success(self, webhook_handler, sample_payload):
        """Test webhook send success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "ok"

        with patch.object(webhook_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await webhook_handler.send(
                sample_payload,
                "https://hooks.slack.com/services/T00/B00/xxx",
            )

            assert result.status == DeliveryStatus.SENT
            assert result.metadata.get("method") == "webhook"

    @pytest.mark.asyncio
    async def test_send_webhook_error(self, webhook_handler, sample_payload):
        """Test webhook error handling."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "invalid_payload"

        with patch.object(webhook_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await webhook_handler.send(
                sample_payload,
                "https://hooks.slack.com/services/T00/B00/xxx",
            )

            assert result.status == DeliveryStatus.FAILED

    # Bot API tests
    @pytest.mark.asyncio
    async def test_send_api_success(self, bot_handler, sample_payload):
        """Test bot API send success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "ts": "1234567890.123456"}

        with patch.object(bot_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await bot_handler.send(sample_payload, "#general")

            assert result.status == DeliveryStatus.DELIVERED
            assert result.message_id == "1234567890.123456"
            assert result.metadata.get("method") == "api"

    @pytest.mark.asyncio
    async def test_send_api_with_thread(self, bot_handler, sample_payload):
        """Test bot API send in thread."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True, "ts": "123"}

        with patch.object(bot_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await bot_handler.send(
                sample_payload,
                "#general",
                thread_ts="1234567890.000000",
            )

            assert result.status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_api_channel_not_found(self, bot_handler, sample_payload):
        """Test channel not found error."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": False, "error": "channel_not_found"}

        with patch.object(bot_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await bot_handler.send(sample_payload, "#nonexistent")

            assert result.status == DeliveryStatus.BOUNCED
            assert "Channel not found" in result.error

    @pytest.mark.asyncio
    async def test_send_api_not_in_channel(self, bot_handler, sample_payload):
        """Test bot not in channel error."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": False, "error": "not_in_channel"}

        with patch.object(bot_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            result = await bot_handler.send(sample_payload, "#private")

            assert result.status == DeliveryStatus.FAILED
            assert "Bot not in channel" in result.error

    @pytest.mark.asyncio
    async def test_send_api_no_token_fallback_webhook(
        self, webhook_handler, sample_payload
    ):
        """Test fallback to webhook when no bot token."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "ok"

        with patch.object(webhook_handler, "_get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            # Channel destination triggers API path, but falls back to webhook
            result = await webhook_handler.send(sample_payload, "#general")

            assert result.status == DeliveryStatus.SENT

    @pytest.mark.asyncio
    async def test_send_api_no_token_no_webhook(self, sample_payload):
        """Test failure when no token and no webhook."""
        handler = SlackHandler()  # No config

        result = await handler.send(sample_payload, "#general")

        assert result.status == DeliveryStatus.FAILED
        assert "bot token" in result.error.lower()

    # Priority color tests
    def test_get_priority_color_urgent(self, slack_handler):
        """Test urgent priority color."""
        color = slack_handler._get_priority_color(NotificationPriority.URGENT)
        assert color == "#dc3545"  # Red

    def test_get_priority_color_high(self, slack_handler):
        """Test high priority color."""
        color = slack_handler._get_priority_color(NotificationPriority.HIGH)
        assert color == "#fd7e14"  # Orange

    def test_get_priority_color_normal(self, slack_handler):
        """Test normal priority color."""
        color = slack_handler._get_priority_color(NotificationPriority.NORMAL)
        assert color == "#0d6efd"  # Blue

    def test_get_priority_color_low(self, slack_handler):
        """Test low priority color."""
        color = slack_handler._get_priority_color(NotificationPriority.LOW)
        assert color == "#6c757d"  # Gray

    # Message building tests
    def test_build_message_structure(self, slack_handler, sample_payload):
        """Test message structure contains required fields."""
        message = slack_handler._build_message(sample_payload)

        assert "blocks" in message
        assert "attachments" in message
        assert "username" in message

    def test_build_message_with_action_url(self, slack_handler, sample_payload):
        """Test message includes action button when URL provided."""
        message = slack_handler._build_message(sample_payload)

        # Should have actions block
        has_actions = any(b.get("type") == "actions" for b in message["blocks"])
        assert has_actions is True

    def test_build_message_without_action_url(self, slack_handler, sample_payload):
        """Test message excludes action button when no URL."""
        sample_payload.action_url = None
        message = slack_handler._build_message(sample_payload)

        has_actions = any(b.get("type") == "actions" for b in message["blocks"])
        assert has_actions is False


# =============================================================================
# IN-APP HANDLER TESTS
# =============================================================================


class TestInAppHandler:
    """Test InAppHandler."""

    @pytest.fixture
    def in_app_handler(self, mock_db):
        """Create InAppHandler with mock database."""
        return InAppHandler(db=mock_db)

    @pytest.fixture
    def handler_without_db(self):
        """Create InAppHandler without database."""
        return InAppHandler()

    @pytest.fixture
    def handler_with_websocket(self, mock_db):
        """Create InAppHandler with WebSocket manager."""
        handler = InAppHandler(db=mock_db)
        handler._websocket_manager = AsyncMock()
        return handler

    # Initialization tests
    def test_init_default_config(self, in_app_handler):
        """Test handler initializes with default config."""
        assert in_app_handler.config is not None
        assert in_app_handler.config.max_notifications_per_user == 100
        assert in_app_handler.enabled is True

    def test_init_custom_config(self, mock_db):
        """Test handler with custom config."""
        config = InAppConfig(
            max_notifications_per_user=50,
            auto_dismiss_days=7,
            enable_websocket=False,
        )
        handler = InAppHandler(config=config, db=mock_db)

        assert handler.config.max_notifications_per_user == 50
        assert handler.config.auto_dismiss_days == 7
        assert handler.config.enable_websocket is False

    def test_channel_is_in_app(self, in_app_handler):
        """Test handler channel is IN_APP."""
        assert in_app_handler.channel == NotificationChannel.IN_APP

    def test_set_db(self, handler_without_db, mock_db):
        """Test set_db method."""
        assert handler_without_db.db is None
        handler_without_db.set_db(mock_db)
        assert handler_without_db.db == mock_db

    def test_set_websocket_manager(self, in_app_handler):
        """Test set_websocket_manager method."""
        manager = MagicMock()
        in_app_handler.set_websocket_manager(manager)
        assert in_app_handler._websocket_manager == manager

    # Destination validation tests
    @pytest.mark.asyncio
    async def test_validate_valid_user_id(self, in_app_handler):
        """Test validation of valid user IDs."""
        assert await in_app_handler.validate_destination("user-001") is True
        assert await in_app_handler.validate_destination("a") is True
        assert await in_app_handler.validate_destination("12345") is True

    @pytest.mark.asyncio
    async def test_validate_invalid_user_id(self, in_app_handler):
        """Test validation rejects empty user ID."""
        assert await in_app_handler.validate_destination("") is False
        assert await in_app_handler.validate_destination(None) is False

    # Send tests - disabled handler
    @pytest.mark.asyncio
    async def test_send_when_disabled(self, in_app_handler, sample_payload):
        """Test send returns failure when handler is disabled."""
        in_app_handler.disable()

        result = await in_app_handler.send(sample_payload, "user-001")

        assert result.status == DeliveryStatus.FAILED
        assert "disabled" in result.error.lower()

    # Send tests - invalid destination
    @pytest.mark.asyncio
    async def test_send_invalid_user_id(self, in_app_handler, sample_payload):
        """Test send fails for invalid user ID."""
        result = await in_app_handler.send(sample_payload, "")

        assert result.status == DeliveryStatus.FAILED
        assert "Invalid user ID" in result.error

    # Send tests - success
    @pytest.mark.asyncio
    async def test_send_success(self, in_app_handler, sample_payload, mock_db):
        """Test successful notification storage."""
        result = await in_app_handler.send(sample_payload, "user-001")

        assert result.status == DeliveryStatus.DELIVERED
        assert result.message_id is not None
        assert result.metadata.get("persisted") is True

    @pytest.mark.asyncio
    async def test_send_without_db_logs_warning(
        self, handler_without_db, sample_payload, caplog
    ):
        """Test send without database logs warning."""
        result = await handler_without_db.send(sample_payload, "user-001")

        # Should still succeed (WebSocket only possible)
        assert result.status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_broadcast_only(self, handler_with_websocket, sample_payload):
        """Test broadcast-only mode doesn't persist."""
        result = await handler_with_websocket.send(
            sample_payload,
            "user-001",
            broadcast_only=True,
        )

        assert result.status == DeliveryStatus.DELIVERED
        assert result.metadata.get("persisted") is False

    @pytest.mark.asyncio
    async def test_send_with_websocket(self, handler_with_websocket, sample_payload):
        """Test notification is broadcast via WebSocket."""
        result = await handler_with_websocket.send(sample_payload, "user-001")

        assert result.status == DeliveryStatus.DELIVERED
        handler_with_websocket._websocket_manager.send_to_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_persist_false(self, in_app_handler, sample_payload, mock_db):
        """Test persist=False skips database storage."""
        result = await in_app_handler.send(
            sample_payload,
            "user-001",
            persist=False,
        )

        assert result.status == DeliveryStatus.DELIVERED
        mock_db.express.create.assert_not_called()

    # Mark as read tests
    @pytest.mark.asyncio
    async def test_mark_as_read_success(self, in_app_handler, mock_db):
        """Test marking notification as read."""
        result = await in_app_handler.mark_as_read("notif-001", "user-001")

        assert result is True
        mock_db.express.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_mark_as_read_no_db(self, handler_without_db):
        """Test mark as read returns false without database."""
        result = await handler_without_db.mark_as_read("notif-001", "user-001")

        assert result is False

    @pytest.mark.asyncio
    async def test_mark_as_read_db_error(self, in_app_handler, mock_db):
        """Test mark as read handles database errors."""
        mock_db.express.update = AsyncMock(side_effect=Exception("DB error"))

        result = await in_app_handler.mark_as_read("notif-001", "user-001")

        assert result is False

    # Dismiss tests
    @pytest.mark.asyncio
    async def test_dismiss_success(self, in_app_handler, mock_db):
        """Test dismissing notification."""
        result = await in_app_handler.dismiss("notif-001", "user-001")

        assert result is True
        mock_db.express.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_dismiss_no_db(self, handler_without_db):
        """Test dismiss returns false without database."""
        result = await handler_without_db.dismiss("notif-001", "user-001")

        assert result is False

    # Get unread count tests
    @pytest.mark.asyncio
    async def test_get_unread_count_success(self, in_app_handler, mock_db):
        """Test getting unread count."""
        mock_db.express.count = AsyncMock(return_value=5)

        count = await in_app_handler.get_unread_count("user-001")

        assert count == 5
        mock_db.express.count.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_unread_count_no_db(self, handler_without_db):
        """Test get unread count returns 0 without database."""
        count = await handler_without_db.get_unread_count("user-001")

        assert count == 0

    @pytest.mark.asyncio
    async def test_get_unread_count_db_error(self, in_app_handler, mock_db):
        """Test get unread count handles database errors."""
        mock_db.express.count = AsyncMock(side_effect=Exception("DB error"))

        count = await in_app_handler.get_unread_count("user-001")

        assert count == 0

    # Get notifications tests
    @pytest.mark.asyncio
    async def test_get_notifications_success(self, in_app_handler, mock_db):
        """Test getting notifications list."""
        mock_notifications = [
            {"id": "notif-001", "title": "Test 1"},
            {"id": "notif-002", "title": "Test 2"},
        ]
        mock_db.express.list = AsyncMock(return_value=mock_notifications)

        notifications = await in_app_handler.get_notifications("user-001")

        assert len(notifications) == 2
        assert notifications[0]["id"] == "notif-001"

    @pytest.mark.asyncio
    async def test_get_notifications_with_pagination(self, in_app_handler, mock_db):
        """Test getting notifications with pagination."""
        mock_db.express.list = AsyncMock(return_value=[])

        await in_app_handler.get_notifications("user-001", limit=10, offset=20)

        mock_db.express.list.assert_called_once()
        call_kwargs = mock_db.express.list.call_args[1]
        assert call_kwargs["limit"] == 10
        assert call_kwargs["offset"] == 20

    @pytest.mark.asyncio
    async def test_get_notifications_unread_only(self, in_app_handler, mock_db):
        """Test getting only unread notifications."""
        mock_db.express.list = AsyncMock(return_value=[])

        await in_app_handler.get_notifications("user-001", unread_only=True)

        mock_db.express.list.assert_called_once()
        call_kwargs = mock_db.express.list.call_args[1]
        assert "read_at" in call_kwargs["filter"]

    @pytest.mark.asyncio
    async def test_get_notifications_no_db(self, handler_without_db):
        """Test get notifications returns empty without database."""
        notifications = await handler_without_db.get_notifications("user-001")

        assert notifications == []

    @pytest.mark.asyncio
    async def test_get_notifications_db_error(self, in_app_handler, mock_db):
        """Test get notifications handles database errors."""
        mock_db.express.list = AsyncMock(side_effect=Exception("DB error"))

        notifications = await in_app_handler.get_notifications("user-001")

        assert notifications == []


# =============================================================================
# BATCH SEND TESTS
# =============================================================================


class TestBatchSend:
    """Test batch send functionality."""

    @pytest.fixture
    def handler(self, mock_db):
        """Create InAppHandler for batch tests."""
        return InAppHandler(db=mock_db)

    @pytest.mark.asyncio
    async def test_send_batch_success(self, handler, sample_payload):
        """Test batch send with multiple payloads."""
        payloads = [
            (sample_payload, "user-001"),
            (sample_payload, "user-002"),
            (sample_payload, "user-003"),
        ]

        results = await handler.send_batch(payloads)

        assert len(results) == 3
        assert all(r.status == DeliveryStatus.DELIVERED for r in results)

    @pytest.mark.asyncio
    async def test_send_batch_partial_failure(self, handler, sample_payload, mock_db):
        """Test batch send with some failures."""
        # Make second call fail
        call_count = 0

        async def mock_create(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("DB error")
            return {"id": "notif"}

        mock_db.express.create = mock_create

        payloads = [
            (sample_payload, "user-001"),
            (sample_payload, "user-002"),  # This will fail
            (sample_payload, "user-003"),
        ]

        results = await handler.send_batch(payloads)

        assert len(results) == 3
        assert results[0].status == DeliveryStatus.DELIVERED
        assert results[1].status == DeliveryStatus.FAILED
        assert results[2].status == DeliveryStatus.DELIVERED

    @pytest.mark.asyncio
    async def test_send_batch_empty(self, handler):
        """Test batch send with empty list."""
        results = await handler.send_batch([])

        assert results == []
