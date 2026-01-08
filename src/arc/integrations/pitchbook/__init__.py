"""
Pitchbook private company data integration.

This module provides a client for accessing Pitchbook's private company
data including profiles, valuations, funding rounds, and ownership.
"""

from arc.integrations.pitchbook.client import (
    COMPANY_FIELD_MAPPING,
    FUNDING_ROUND_MAPPING,
    VALUATION_FIELD_MAPPING,
    CompanyProfile,
    CompanyStage,
    FundingRound,
    IndustryCategory,
    OwnershipStake,
    OwnershipStructure,
    PitchbookClient,
    PitchbookConfig,
    RoundType,
    SearchFilters,
    Valuation,
)

__all__ = [
    # Client
    "PitchbookClient",
    "PitchbookConfig",
    # Data classes
    "CompanyProfile",
    "FundingRound",
    "Valuation",
    "OwnershipStake",
    "OwnershipStructure",
    "SearchFilters",
    # Enums
    "IndustryCategory",
    "CompanyStage",
    "RoundType",
    # Mappings
    "COMPANY_FIELD_MAPPING",
    "VALUATION_FIELD_MAPPING",
    "FUNDING_ROUND_MAPPING",
]
