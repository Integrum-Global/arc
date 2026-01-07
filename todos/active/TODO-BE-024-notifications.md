# TODO-BE-024: Notification Service

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-002

---

## Objective

Implement the notification service for delivering alerts across multiple channels (email, push, in-app, Slack).

---

## Tasks

### 1. Service Structure
- [ ] Create `src/arc/integrations/notifications/__init__.py`
- [ ] Create notification channel handlers:
  - `email.py` - Email notifications
  - `push.py` - Push notifications
  - `slack.py` - Slack notifications
  - `in_app.py` - In-app notifications

### 2. Notification Service
- [ ] Create `src/arc/services/notification_service.py`
- [ ] Implement `NotificationService`:
  ```python
  class NotificationService(BaseService):
      def __init__(self, db: DataFlow, tenant_id: str = None):
          super().__init__(db, tenant_id)
          self.email_handler = EmailHandler()
          self.push_handler = PushHandler()
          self.slack_handler = SlackHandler()
          self.in_app_handler = InAppHandler()

      async def send_notification(
          self,
          user_id: str,
          notification_type: str,
          title: str,
          message: str,
          data: dict = None,
          priority: str = "normal"
      ) -> dict:
          """Send notification to user via configured channels."""
          pass

      async def send_alert_notification(
          self,
          alert: dict
      ) -> dict:
          """Send alert-triggered notification."""
          pass

      async def send_brief_notification(
          self,
          user_id: str,
          brief: dict
      ) -> dict:
          """Send morning brief notification."""
          pass
  ```

### 3. Email Handler
- [ ] Create `src/arc/integrations/notifications/email.py`
- [ ] Implement `EmailHandler`:
  - Support SMTP and SendGrid/SES
  - HTML email templates
  - Plain text fallback
  - Unsubscribe links
- [ ] Email templates:
  - Alert notification
  - Daily brief summary
  - Weekly digest
  - Welcome email

### 4. Push Handler
- [ ] Create `src/arc/integrations/notifications/push.py`
- [ ] Implement `PushHandler`:
  - Firebase Cloud Messaging (FCM)
  - Apple Push Notifications (APNs)
  - Device token management
- [ ] Badge count management

### 5. Slack Handler
- [ ] Create `src/arc/integrations/notifications/slack.py`
- [ ] Implement `SlackHandler`:
  - Webhook integration
  - Rich message formatting
  - Interactive buttons
- [ ] Channel configuration per tenant

### 6. In-App Handler
- [ ] Create `src/arc/integrations/notifications/in_app.py`
- [ ] Implement `InAppHandler`:
  - Store notifications in database
  - Real-time WebSocket delivery
  - Mark as read/unread
  - Notification center support

### 7. User Preferences
- [ ] Implement preference-based routing:
  - Check user notification preferences
  - Apply quiet hours
  - Apply severity filters
  - Handle digest aggregation
- [ ] Implement digest generation:
  - Collect pending notifications
  - Generate summary
  - Send at configured time

### 8. Delivery Tracking
- [ ] Track delivery status per channel
- [ ] Handle failures and retries
- [ ] Log all notifications

---

## Acceptance Criteria

- [ ] Email notifications with templates
- [ ] Push notifications (FCM/APNs)
- [ ] Slack webhook integration
- [ ] In-app notification storage
- [ ] User preference respecting
- [ ] Quiet hours support
- [ ] Digest aggregation
- [ ] Delivery tracking
- [ ] Unit test: Channel handlers
- [ ] Integration test: Full notification flow

---

## Notification Model

```python
@db.model
class Notification:
    id: str  # UUID
    user_id: str  # FK to User
    notification_type: str  # "alert", "brief", "system"
    title: str
    message: str
    data: dict = {}
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    channels_requested: List[str] = []  # ["email", "push"]
    delivery_status: dict = {}  # {"email": "sent", "push": "failed"}
    created_at: Optional[str] = None
    read_at: Optional[str] = None
    dismissed_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id", "created_at"]},
        {"fields": ["read_at"]}
    ]
```

---

## Email Templates

```
templates/
├── email/
│   ├── base.html           # Base template with header/footer
│   ├── alert.html          # Alert notification
│   ├── daily_brief.html    # Morning brief summary
│   ├── weekly_digest.html  # Weekly digest
│   └── welcome.html        # Welcome email
```

### Alert Email Template
```html
<h2>Alert: {{ title }}</h2>
<p>{{ message }}</p>

{% if alert_type == "threshold" %}
<div class="metric-card">
    <span class="ratio">{{ ratio_name }}</span>
    <span class="value {{ severity }}">{{ trigger_value }}</span>
    <span class="threshold">Threshold: {{ threshold_value }}</span>
</div>
{% endif %}

<a href="{{ action_url }}" class="button">View Details</a>
```

---

## Technical Notes

- Use async for all channel handlers
- Implement circuit breaker for external services
- Queue high-volume notifications
- Apply rate limiting per channel
- Store templates in database for customization
