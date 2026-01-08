"""
Capital IQ integration for company fundamentals and financial data.

Provides:
- Company profiles with sector/industry
- Financial statements (quarterly/annual)
- Income statement, balance sheet, cash flow
- Bulk operations for efficiency
- Field mapping to ARC schema

Authentication: OAuth 2.0 Client Credentials Flow
"""

from arc.integrations.capital_iq.client import (
    ALL_FIELD_MAPPINGS,
    BALANCE_SHEET_MAPPING,
    CASH_FLOW_MAPPING,
    INCOME_STATEMENT_MAPPING,
    CapitalIQClient,
    CapitalIQConfig,
    OAuthToken,
    PeriodType,
    StatementType,
)

__all__ = [
    "CapitalIQClient",
    "CapitalIQConfig",
    "OAuthToken",
    "PeriodType",
    "StatementType",
    # Field mappings
    "INCOME_STATEMENT_MAPPING",
    "BALANCE_SHEET_MAPPING",
    "CASH_FLOW_MAPPING",
    "ALL_FIELD_MAPPINGS",
]
