"""
Email notification handler.

Supports SMTP and email service providers (SendGrid, AWS SES).
"""

import logging
import re
import smtplib
import ssl
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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

# Email validation regex
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


@dataclass
class EmailConfig:
    """Configuration for email handler."""

    # SMTP settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True

    # SendGrid settings
    sendgrid_api_key: str | None = None

    # AWS SES settings
    ses_region: str = "us-east-1"
    ses_access_key: str | None = None
    ses_secret_key: str | None = None

    # Common settings
    from_email: str = "noreply@example.com"
    from_name: str = "ARC Platform"
    reply_to: str | None = None

    # Provider selection
    provider: str = "smtp"  # "smtp" | "sendgrid" | "ses"


class EmailHandler(BaseNotificationHandler):
    """
    Email notification handler.

    Supports multiple providers:
    - SMTP (default)
    - SendGrid API
    - AWS SES
    """

    channel = NotificationChannel.EMAIL

    def __init__(self, config: EmailConfig | None = None):
        """
        Initialize email handler.

        Args:
            config: Email configuration
        """
        super().__init__()
        self.config = config or EmailConfig()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for API calls."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def validate_destination(self, destination: str) -> bool:
        """Validate email address format."""
        return bool(EMAIL_REGEX.match(destination))

    async def send(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """
        Send email notification.

        Args:
            payload: Notification payload
            destination: Email address
            **kwargs: Additional options:
                - html_content: Optional HTML body
                - template_id: SendGrid template ID
                - cc: List of CC addresses
                - bcc: List of BCC addresses
                - attachments: List of attachments

        Returns:
            DeliveryResult with status
        """
        if not self.enabled:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="Email handler is disabled",
            )

        if not await self.validate_destination(destination):
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Invalid email address: {destination}",
            )

        try:
            if self.config.provider == "sendgrid":
                return await self._send_sendgrid(payload, destination, **kwargs)
            elif self.config.provider == "ses":
                return await self._send_ses(payload, destination, **kwargs)
            else:
                return await self._send_smtp(payload, destination, **kwargs)
        except Exception as e:
            logger.error(f"Failed to send email to {destination}: {e}")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=str(e),
            )

    async def _send_smtp(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send email via SMTP."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = self._format_subject(payload)
        msg["From"] = f"{self.config.from_name} <{self.config.from_email}>"
        msg["To"] = destination

        if self.config.reply_to:
            msg["Reply-To"] = self.config.reply_to

        # Add CC/BCC if provided
        cc = kwargs.get("cc", [])
        bcc = kwargs.get("bcc", [])
        if cc:
            msg["Cc"] = ", ".join(cc)

        # Plain text body
        plain_body = self._format_plain_body(payload)
        msg.attach(MIMEText(plain_body, "plain"))

        # HTML body (if provided)
        html_content = kwargs.get("html_content")
        if html_content:
            msg.attach(MIMEText(html_content, "html"))
        else:
            html_body = self._format_html_body(payload)
            msg.attach(MIMEText(html_body, "html"))

        # Connect and send
        context = ssl.create_default_context()
        all_recipients = [destination] + cc + bcc

        try:
            if self.config.smtp_use_tls:
                with smtplib.SMTP(
                    self.config.smtp_host, self.config.smtp_port
                ) as server:
                    server.starttls(context=context)
                    if self.config.smtp_username and self.config.smtp_password:
                        server.login(
                            self.config.smtp_username, self.config.smtp_password
                        )
                    server.sendmail(
                        self.config.from_email, all_recipients, msg.as_string()
                    )
            else:
                with smtplib.SMTP_SSL(
                    self.config.smtp_host, self.config.smtp_port, context=context
                ) as server:
                    if self.config.smtp_username and self.config.smtp_password:
                        server.login(
                            self.config.smtp_username, self.config.smtp_password
                        )
                    server.sendmail(
                        self.config.from_email, all_recipients, msg.as_string()
                    )

            logger.info(f"Email sent to {destination} via SMTP")
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.SENT,
                metadata={"provider": "smtp"},
            )
        except smtplib.SMTPRecipientsRefused:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.BOUNCED,
                error="Recipient refused",
            )
        except smtplib.SMTPAuthenticationError:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="SMTP authentication failed",
            )

    async def _send_sendgrid(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send email via SendGrid API."""
        if not self.config.sendgrid_api_key:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error="SendGrid API key not configured",
            )

        client = await self._get_client()

        # Build SendGrid request
        data: dict[str, Any] = {
            "personalizations": [
                {
                    "to": [{"email": destination}],
                }
            ],
            "from": {
                "email": self.config.from_email,
                "name": self.config.from_name,
            },
            "subject": self._format_subject(payload),
        }

        # Add CC/BCC
        cc = kwargs.get("cc", [])
        bcc = kwargs.get("bcc", [])
        if cc:
            data["personalizations"][0]["cc"] = [{"email": e} for e in cc]
        if bcc:
            data["personalizations"][0]["bcc"] = [{"email": e} for e in bcc]

        # Add reply-to
        if self.config.reply_to:
            data["reply_to"] = {"email": self.config.reply_to}

        # Use template or content
        template_id = kwargs.get("template_id")
        if template_id:
            data["template_id"] = template_id
            data["personalizations"][0]["dynamic_template_data"] = {
                "title": payload.title,
                "message": payload.message,
                "action_url": payload.action_url,
                **payload.data,
            }
        else:
            html_content = kwargs.get("html_content") or self._format_html_body(payload)
            data["content"] = [
                {"type": "text/plain", "value": self._format_plain_body(payload)},
                {"type": "text/html", "value": html_content},
            ]

        try:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=data,
                headers={
                    "Authorization": f"Bearer {self.config.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code in (200, 201, 202):
                message_id = response.headers.get("X-Message-Id")
                logger.info(f"Email sent to {destination} via SendGrid: {message_id}")
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.SENT,
                    message_id=message_id,
                    metadata={"provider": "sendgrid"},
                )
            else:
                error = response.text[:200]
                logger.error(f"SendGrid error: {response.status_code} - {error}")
                return DeliveryResult(
                    channel=self.channel,
                    status=DeliveryStatus.FAILED,
                    error=f"SendGrid API error: {response.status_code}",
                )
        except httpx.RequestError as e:
            return DeliveryResult(
                channel=self.channel,
                status=DeliveryStatus.FAILED,
                error=f"Request error: {e}",
            )

    async def _send_ses(
        self,
        payload: NotificationPayload,
        destination: str,
        **kwargs: Any,
    ) -> DeliveryResult:
        """Send email via AWS SES."""
        # AWS SES implementation would use boto3
        # For now, return a placeholder
        return DeliveryResult(
            channel=self.channel,
            status=DeliveryStatus.FAILED,
            error="AWS SES not implemented - use SMTP or SendGrid",
        )

    def _format_subject(self, payload: NotificationPayload) -> str:
        """Format email subject based on priority."""
        prefix = ""
        if payload.priority == NotificationPriority.URGENT:
            prefix = "[URGENT] "
        elif payload.priority == NotificationPriority.HIGH:
            prefix = "[IMPORTANT] "
        return f"{prefix}{payload.title}"

    def _format_plain_body(self, payload: NotificationPayload) -> str:
        """Format plain text email body."""
        body = f"{payload.title}\n\n{payload.message}"
        if payload.action_url:
            body += f"\n\nView details: {payload.action_url}"
        return body

    def _format_html_body(self, payload: NotificationPayload) -> str:
        """Format HTML email body."""
        action_html = ""
        if payload.action_url:
            action_html = f"""
            <p style="margin-top: 20px;">
                <a href="{payload.action_url}"
                   style="background-color: #007bff; color: white; padding: 10px 20px;
                          text-decoration: none; border-radius: 5px;">
                    View Details
                </a>
            </p>
            """

        priority_color = "#333"
        if payload.priority == NotificationPriority.URGENT:
            priority_color = "#dc3545"
        elif payload.priority == NotificationPriority.HIGH:
            priority_color = "#fd7e14"

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: {priority_color}; margin-bottom: 10px;">{payload.title}</h2>
            <p style="margin-bottom: 20px;">{payload.message}</p>
            {action_html}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
                This is an automated notification from ARC Platform.
            </p>
        </body>
        </html>
        """
