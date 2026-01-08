"""
Security domain models for ARC investment platform.

This module contains models for:
- Security: Master security/instrument data
- PriceHistory: Historical OHLCV price data
- CompanyFundamentals: Financial statement data
- SecurityRatio: Calculated financial ratios

DataFlow automatically generates 11 nodes per model for CRUD operations.

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id'
- Use string decimals for all monetary/numeric values
- Securities are SHARED across tenants (multi_tenant=False)
"""

from arc.models.database import db


@db.model
class Security:
    """
    Master security/instrument data.

    Represents any tradeable or trackable financial instrument.
    Shared across all tenants - not tenant-specific.
    """

    # Primary Key
    id: str  # ISIN, CUSIP, or internal ID

    # Identifiers
    ticker: str  # "AAPL"
    isin: str | None = None  # "US0378331005"
    cusip: str | None = None  # "037833100"
    sedol: str | None = None  # "2046251"
    figi: str | None = None  # Bloomberg FIGI
    ric: str | None = None  # Reuters Instrument Code

    # Basic Info
    name: str  # "Apple Inc."
    short_name: str | None = None  # "Apple"

    # Classification
    security_type: str = (
        "equity"  # equity, fixed_income, etf, mutual_fund, option, future, crypto, cash
    )
    asset_class: str = "equity"  # equity, fixed_income, alternative, cash

    # Exchange/Market
    exchange: str  # NASDAQ, NYSE, LSE
    mic: str | None = None  # Market Identifier Code (XNAS, XNYS)
    currency: str = "USD"
    country: str = "US"

    # GICS Classification (Global Industry Classification Standard)
    sector: str | None = None  # "Information Technology"
    industry_group: str | None = None  # "Technology Hardware & Equipment"
    industry: str | None = None  # "Technology Hardware, Storage & Peripherals"
    sub_industry: str | None = None  # "Technology Hardware, Storage & Peripherals"

    # Market Cap
    market_cap: str | None = None  # As string decimal
    market_cap_category: str | None = None  # mega, large, mid, small, micro

    # Company Info
    employees: int | None = None
    website: str | None = None
    description: str | None = None
    headquarters_city: str | None = None
    headquarters_country: str | None = None
    founded_year: int | None = None
    ceo_name: str | None = None

    # Private Company (Pitchbook)
    is_private: bool = False

    # Status
    active: bool = True
    delisted_date: str | None = None  # ISO date

    # Data Freshness
    last_price_date: str | None = None  # ISO date
    last_fundamental_date: str | None = None  # ISO date

    # Soft delete
    deleted_at: str | None = None

    __dataflow__ = {
        "multi_tenant": False,  # Securities are shared across tenants
        "audit_log": True,
        "soft_delete": True,
    }

    __indexes__ = [
        {"fields": ["ticker"], "unique": True},
        {"fields": ["isin"]},
        {"fields": ["cusip"]},
        {"fields": ["security_type", "active"]},
        {"fields": ["sector", "industry"]},
        {"fields": ["exchange", "currency"]},
        {"fields": ["market_cap_category"]},
        {"fields": ["is_private", "active"]},
        {"fields": ["country", "active"]},
    ]


@db.model
class PriceHistory:
    """
    Historical price data for a security.

    Stores OHLCV data with adjustment factors for splits and dividends.
    Composite ID format: "{security_id}_{price_date}"
    """

    # Primary Key - composite format
    id: str  # "AAPL_2026-01-07"

    # Foreign Key
    security_id: str  # FK to Security

    # Date
    price_date: str  # ISO date "2026-01-07"

    # OHLCV Data (decimals as strings)
    open_price: str | None = None
    high_price: str | None = None
    low_price: str | None = None
    close_price: str  # Required
    adjusted_close: str  # Adjusted for splits/dividends

    # Volume
    volume: int = 0
    volume_weighted_price: str | None = None  # VWAP

    # Calculated Fields
    daily_return: str | None = None  # (close - prev_close) / prev_close
    intraday_range: str | None = None  # (high - low) / low

    # Adjustment Factors
    split_factor: str = "1.0"
    dividend_factor: str = "1.0"
    is_adjusted: bool = True

    # Metadata
    source: str = "eodhd"  # eodhd, capitaliq, manual
    currency: str = "USD"

    __dataflow__ = {
        "multi_tenant": False,  # Prices are shared
        "audit_log": False,  # High volume - skip audit
    }

    __indexes__ = [
        {"fields": ["security_id", "price_date"], "unique": True},
        {"fields": ["price_date"]},
        {"fields": ["source"]},
        {"fields": ["security_id"]},  # For time series queries
    ]


@db.model
class CompanyFundamentals:
    """
    Company financial statement data.

    Stores income statement, balance sheet, and cash flow data
    for both quarterly and annual periods.
    Composite ID format: "{security_id}_{fiscal_year}_{fiscal_quarter or 'FY'}"
    """

    # Primary Key - composite format
    id: str  # "AAPL_2025_Q4" or "AAPL_2025_FY"

    # Foreign Key
    security_id: str  # FK to Security

    # Period Info
    fiscal_year: int  # 2025
    fiscal_quarter: int | None = None  # 1-4 or None for annual
    period_end_date: str  # ISO date "2025-12-31"
    report_date: str | None = None  # When filed with SEC
    period_type: str = "quarterly"  # quarterly, annual, ttm

    # === INCOME STATEMENT === (strings for precision)

    # Revenue
    revenue: str | None = None
    cost_of_revenue: str | None = None
    gross_profit: str | None = None

    # Operating
    research_and_development: str | None = None
    selling_general_admin: str | None = None
    operating_expenses: str | None = None
    operating_income: str | None = None

    # EBITDA/EBIT
    depreciation_amortization: str | None = None
    ebitda: str | None = None
    ebit: str | None = None

    # Below Operating
    interest_income: str | None = None
    interest_expense: str | None = None
    other_income_expense: str | None = None
    pretax_income: str | None = None
    income_tax: str | None = None
    net_income: str | None = None

    # Per Share
    eps_basic: str | None = None
    eps_diluted: str | None = None
    shares_basic: str | None = None
    shares_diluted: str | None = None
    dividend_per_share: str | None = None

    # === BALANCE SHEET ===

    # Assets - Current
    total_assets: str | None = None
    current_assets: str | None = None
    cash_and_equivalents: str | None = None
    short_term_investments: str | None = None
    accounts_receivable: str | None = None
    inventory: str | None = None
    other_current_assets: str | None = None

    # Assets - Non-Current
    non_current_assets: str | None = None
    property_plant_equipment: str | None = None
    goodwill: str | None = None
    intangible_assets: str | None = None
    long_term_investments: str | None = None
    other_non_current_assets: str | None = None

    # Liabilities - Current
    total_liabilities: str | None = None
    current_liabilities: str | None = None
    accounts_payable: str | None = None
    accrued_expenses: str | None = None
    short_term_debt: str | None = None
    current_portion_long_term_debt: str | None = None
    deferred_revenue: str | None = None
    other_current_liabilities: str | None = None

    # Liabilities - Non-Current
    non_current_liabilities: str | None = None
    long_term_debt: str | None = None
    total_debt: str | None = None
    deferred_tax_liabilities: str | None = None
    other_non_current_liabilities: str | None = None

    # Equity
    total_equity: str | None = None
    common_stock: str | None = None
    additional_paid_in_capital: str | None = None
    retained_earnings: str | None = None
    treasury_stock: str | None = None
    accumulated_other_comprehensive_income: str | None = None
    minority_interest: str | None = None

    # === CASH FLOW ===

    # Operating
    operating_cash_flow: str | None = None
    change_in_working_capital: str | None = None

    # Investing
    capital_expenditures: str | None = None
    acquisitions: str | None = None
    divestitures: str | None = None
    investing_cash_flow: str | None = None

    # Financing
    dividends_paid: str | None = None
    share_repurchases: str | None = None
    debt_issued: str | None = None
    debt_repaid: str | None = None
    financing_cash_flow: str | None = None

    # Free Cash Flow
    free_cash_flow: str | None = None

    # Metadata
    source: str = "eodhd"  # capitaliq, eodhd, manual
    currency: str = "USD"
    is_restated: bool = False  # True if restated figures

    __dataflow__ = {
        "multi_tenant": False,  # Fundamentals are shared
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["security_id", "fiscal_year", "fiscal_quarter"], "unique": True},
        {"fields": ["security_id", "period_end_date"]},
        {"fields": ["fiscal_year", "period_type"]},
        {"fields": ["report_date"]},
        {"fields": ["source"]},
    ]


@db.model
class SecurityRatio:
    """
    Calculated financial ratios for a security.

    Stores point-in-time ratio calculations with peer comparisons.
    Composite ID format: "{security_id}_{calculation_date}_{ratio_name}"
    """

    # Primary Key - composite format
    id: str  # "AAPL_2026-01-07_current_ratio"

    # Foreign Key
    security_id: str  # FK to Security

    # Date
    calculation_date: str  # ISO date

    # Ratio Classification
    ratio_class: str  # liquidity, profitability, efficiency, leverage, valuation, growth
    ratio_name: str  # current_ratio, quick_ratio, roe, roa, etc.

    # Value
    ratio_value: str  # Calculated value as string decimal

    # Peer Comparison
    peer_percentile: int | None = None  # 0-100
    sector_average: str | None = None
    industry_average: str | None = None
    market_average: str | None = None

    # Historical Values
    value_1m_ago: str | None = None
    value_3m_ago: str | None = None
    value_6m_ago: str | None = None
    value_1y_ago: str | None = None

    # Trend Analysis
    trend_direction: str | None = None  # improving, stable, declining
    trend_magnitude: str | None = None  # % change

    # Source Reference
    source_fundamentals_id: str | None = None  # FK to CompanyFundamentals

    __dataflow__ = {
        "multi_tenant": False,  # Ratios are shared
        "audit_log": False,  # High volume - skip audit
    }

    __indexes__ = [
        {"fields": ["security_id", "calculation_date", "ratio_name"], "unique": True},
        {"fields": ["calculation_date"]},
        {"fields": ["ratio_class"]},
        {"fields": ["ratio_name"]},
        {"fields": ["security_id", "ratio_class"]},  # Ratio groupings
    ]


@db.model
class CorporateAction:
    """
    Corporate action events affecting securities.

    Tracks splits, dividends, mergers, spinoffs, and other corporate events.
    """

    # Primary Key
    id: str  # UUID or "{security_id}_{action_type}_{ex_date}"

    # Foreign Key
    security_id: str  # FK to Security

    # Action Details
    action_type: str  # split, dividend, merger, spinoff, rights_issue, name_change, delisting
    announcement_date: str | None = None  # When announced
    ex_date: str  # Ex-dividend/ex-split date
    record_date: str | None = None  # Record date
    payment_date: str | None = None  # Payment/effective date

    # Split/Dividend Details
    split_ratio: str | None = None  # "2:1" for 2-for-1 split
    dividend_amount: str | None = None  # Per share amount
    dividend_type: str | None = None  # regular, special, interim, final
    dividend_currency: str | None = None

    # Merger/Acquisition Details
    target_security_id: str | None = None  # FK to Security
    acquirer_security_id: str | None = None  # FK to Security
    exchange_ratio: str | None = None  # Shares exchanged
    cash_component: str | None = None  # Cash per share

    # Status
    status: str = "announced"  # announced, confirmed, completed, cancelled

    # Metadata
    description: str | None = None
    source: str = "eodhd"

    __dataflow__ = {
        "multi_tenant": False,  # Corporate actions are shared
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["security_id", "action_type", "ex_date"]},
        {"fields": ["ex_date"]},
        {"fields": ["action_type", "status"]},
        {"fields": ["payment_date"]},
    ]


@db.model
class Dividend:
    """
    Detailed dividend history for income tracking.

    Separate from CorporateAction for easier dividend-specific queries.
    """

    # Primary Key
    id: str  # "{security_id}_{ex_date}"

    # Foreign Key
    security_id: str  # FK to Security

    # Dates
    declaration_date: str | None = None  # When declared
    ex_date: str  # Ex-dividend date
    record_date: str | None = None
    payment_date: str | None = None

    # Amount
    amount: str  # Per share dividend amount
    currency: str = "USD"

    # Classification
    dividend_type: str = "regular"  # regular, special, interim, final, liquidating
    frequency: str | None = None  # monthly, quarterly, semi-annual, annual

    # Tax
    qualified: bool | None = None  # Qualified dividend for tax purposes
    tax_withholding_rate: str | None = None

    # Yield (at time of payment)
    dividend_yield: str | None = None  # Annual yield at ex-date price

    # Metadata
    source: str = "eodhd"

    __dataflow__ = {
        "multi_tenant": False,  # Dividends are shared
        "audit_log": False,  # High volume
    }

    __indexes__ = [
        {"fields": ["security_id", "ex_date"], "unique": True},
        {"fields": ["ex_date"]},
        {"fields": ["payment_date"]},
        {"fields": ["dividend_type"]},
    ]
