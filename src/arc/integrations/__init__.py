"""
External data provider integrations.

This package contains client implementations for external data sources.
Each integration handles authentication, rate limiting, and data transformation.

Submodules:
    - eodhd: EODHD market data client
    - capital_iq: Capital IQ financial data client
    - pitchbook: PitchBook private market data client
    - notifications: Multi-channel notification handlers
"""

from arc.integrations.capital_iq import (
    CapitalIQClient,
    CapitalIQConfig,
    PeriodType,
    StatementType,
)
from arc.integrations.eodhd import EODHDClient, RateLimiter
from arc.integrations.pitchbook import (
    CompanyProfile,
    CompanyStage,
    FundingRound,
    IndustryCategory,
    OwnershipStructure,
    PitchbookClient,
    PitchbookConfig,
    RoundType,
    SearchFilters,
    Valuation,
)
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

__all__ = [
    # EODHD
    "EODHDClient",
    "RateLimiter",
    # Capital IQ
    "CapitalIQClient",
    "CapitalIQConfig",
    "PeriodType",
    "StatementType",
    # Pitchbook
    "PitchbookClient",
    "PitchbookConfig",
    "CompanyProfile",
    "FundingRound",
    "Valuation",
    "OwnershipStructure",
    "SearchFilters",
    "IndustryCategory",
    "CompanyStage",
    "RoundType",
    # Notifications
    "DeliveryResult",
    "DeliveryStatus",
    "EmailConfig",
    "EmailHandler",
    "InAppConfig",
    "InAppHandler",
    "NotificationChannel",
    "NotificationPayload",
    "NotificationPriority",
    "NotificationType",
    "PushConfig",
    "PushHandler",
    "SlackConfig",
    "SlackHandler",
]
