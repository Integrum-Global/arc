"""
Portfolio domain models for ARC investment platform.

This module contains models for:
- Portfolio: Investment portfolio container
- Holding: Position in a portfolio
- Transaction: Buy/sell/dividend transactions
- PortfolioValuation: Daily NAV and performance metrics
- CashAccount: Cash balances by currency

DataFlow automatically generates 11 nodes per model for CRUD operations.

CRITICAL RULES:
- NEVER manually set created_at or updated_at - DataFlow manages these
- Primary key MUST be named 'id'
- Use string decimals for all monetary/numeric values
- Transactions are immutable after creation
- Holdings use versioning to prevent concurrent update conflicts
"""

from arc.models.database import db


@db.model
class Portfolio:
    """
    Investment portfolio container.

    Represents a managed portfolio, model portfolio, benchmark,
    or composite portfolio within the ARC platform.
    """

    # Primary Key
    id: str  # UUID, e.g., "port-001"

    # Core Fields
    name: str  # "Growth Equity Portfolio"
    code: str  # Short code "GEP" (unique within tenant)
    description: str | None = None

    # Classification
    portfolio_type: str = "managed"  # "managed" | "model" | "benchmark" | "composite"
    strategy: str | None = None  # "growth" | "value" | "income" | "balanced"
    asset_class_focus: str = "multi"  # "equity" | "fixed_income" | "multi" | "alternative"

    # Dates (ISO format strings)
    inception_date: str  # "2020-01-15" - when portfolio was created
    termination_date: str | None = None  # Set when portfolio is closed

    # Currency
    base_currency: str = "USD"

    # Relationships
    manager_id: str  # FK to User (investment manager)
    benchmark_id: str | None = None  # FK to Portfolio (benchmark portfolio)

    # Risk Profile
    risk_profile: str = "moderate"  # "conservative" | "moderate" | "aggressive"
    investment_objective: str | None = None  # Long-form objective statement

    # Constraints (JSON object)
    constraints: dict = {
        "sector_limits": {},  # {"technology": 0.25, "financials": 0.20}
        "single_name_limit": 0.10,  # Max 10% in single security
        "min_positions": 10,
        "max_positions": 50,
        "cash_minimum": 0.02,  # Min 2% cash
        "cash_maximum": 0.10,  # Max 10% cash
    }

    # Status
    active: bool = True
    deleted_at: str | None = None

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
        "soft_delete": True,
    }

    __indexes__ = [
        {"fields": ["manager_id"]},
        {"fields": ["portfolio_type", "active"]},
        {"fields": ["inception_date"]},
        {"fields": ["code"]},  # For lookup by short code
    ]


@db.model
class Holding:
    """
    Position in a portfolio.

    Represents ownership of a security within a portfolio.
    Uses versioning to prevent concurrent update conflicts when
    multiple processes update holdings simultaneously.
    """

    # Primary Key
    id: str  # UUID

    # Foreign Keys
    portfolio_id: str  # FK to Portfolio
    security_id: str  # FK to Security (from security models)

    # Position (decimals as strings for precision)
    quantity: str  # "1000.00" - Number of shares/units
    cost_basis: str  # "150.25" - Per-share average cost
    total_cost: str  # "150250.00" - Total cost basis

    # Tax Lot Tracking
    lot_id: str | None = None  # For specific lot identification
    acquisition_date: str  # ISO date when position was opened
    holding_period: str = "long"  # "short" | "long" (tax classification)

    # Current Values (updated by valuation workflows)
    current_price: str | None = None  # Latest price
    market_value: str | None = None  # quantity * current_price
    unrealized_pnl: str | None = None  # market_value - total_cost
    unrealized_pnl_pct: str | None = None  # PnL as percentage
    weight: str | None = None  # Position weight as % of portfolio

    # Metadata
    notes: str | None = None
    tags: list[str] = []  # For categorization/filtering

    # Status
    active: bool = True  # False when position is closed

    __dataflow__ = {
        "multi_tenant": True,
        "versioned": True,  # Optimistic locking for concurrent updates
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "security_id"]},  # Main lookup pattern
        {"fields": ["security_id"]},  # Cross-portfolio position lookup
        {"fields": ["acquisition_date"]},  # Tax lot queries
        {"fields": ["active"]},
    ]


@db.model
class Transaction:
    """
    Portfolio transaction record.

    Captures all buy, sell, dividend, and corporate action transactions.
    Transactions are immutable after creation - corrections should be
    made via reversal transactions.
    """

    # Primary Key
    id: str  # UUID

    # Foreign Keys
    portfolio_id: str  # FK to Portfolio
    security_id: str  # FK to Security
    holding_id: str | None = None  # FK to Holding (optional, for lot matching)

    # Transaction Details
    transaction_type: str  # "buy" | "sell" | "dividend" | "interest" | "split" | "transfer_in" | "transfer_out" | "fee"
    transaction_date: str  # Trade date (ISO format)
    settlement_date: str  # Settlement date (T+1, T+2, etc.)

    # Amounts (decimals as strings)
    quantity: str  # Number of shares (negative for sells)
    price: str  # Per-share price
    gross_amount: str  # quantity * price
    commission: str = "0"  # Broker commission
    fees: str = "0"  # Exchange fees, SEC fees, etc.
    taxes: str = "0"  # Withholding taxes (for dividends)
    net_amount: str  # gross_amount - commission - fees - taxes

    # Currency
    currency: str = "USD"
    fx_rate: str = "1.0"  # Exchange rate to base currency

    # Order/Execution Details
    order_id: str | None = None  # External order reference
    broker: str | None = None  # Executing broker
    execution_venue: str | None = None  # Exchange/dark pool

    # Compliance
    compliance_status: str = "approved"  # "pending" | "approved" | "rejected"
    compliance_notes: str | None = None

    # Audit Trail
    created_by: str | None = None  # User ID who created the transaction

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
        # Note: No versioning or soft_delete - transactions are immutable
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "transaction_date"]},
        {"fields": ["security_id", "transaction_date"]},
        {"fields": ["transaction_type"]},
        {"fields": ["settlement_date"]},
        {"fields": ["compliance_status"]},
    ]


@db.model
class PortfolioValuation:
    """
    Daily portfolio valuation and performance metrics.

    Stores point-in-time NAV, returns, and risk metrics.
    Valuations can be updated until marked as final.
    """

    # Primary Key - composite format for uniqueness
    id: str  # "port-001_2026-01-07" (portfolio_id + date)

    # Foreign Key
    portfolio_id: str  # FK to Portfolio

    # Valuation Date
    valuation_date: str  # ISO date

    # Values (decimals as strings)
    total_value: str  # Total NAV
    securities_value: str  # Value of securities
    cash_value: str  # Cash balance
    accrued_income: str = "0"  # Accrued interest/dividends
    contributions: str = "0"  # Day's contributions
    withdrawals: str = "0"  # Day's withdrawals

    # Performance Metrics (decimals as strings, percentages)
    daily_return: str | None = None  # Day's return
    mtd_return: str | None = None  # Month-to-date return
    qtd_return: str | None = None  # Quarter-to-date return
    ytd_return: str | None = None  # Year-to-date return
    inception_return: str | None = None  # Since inception return

    # Risk Metrics
    volatility_30d: str | None = None  # 30-day rolling volatility
    sharpe_ratio_30d: str | None = None  # 30-day Sharpe ratio
    max_drawdown_ytd: str | None = None  # Max drawdown YTD

    # Benchmark Comparison
    benchmark_return: str | None = None  # Benchmark return for period
    tracking_error: str | None = None  # Tracking error vs benchmark
    alpha: str | None = None  # Jensen's alpha
    beta: str | None = None  # Portfolio beta

    # Metadata
    pricing_source: str = "eodhd"  # Data source used
    is_final: bool = False  # Once True, valuation is locked

    __dataflow__ = {
        "multi_tenant": True,
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "valuation_date"], "unique": True},
        {"fields": ["valuation_date"]},
        {"fields": ["is_final"]},
    ]


@db.model
class CashAccount:
    """
    Cash balance by currency within a portfolio.

    Each portfolio can have multiple cash accounts in different currencies.
    """

    # Primary Key
    id: str  # UUID

    # Foreign Key
    portfolio_id: str  # FK to Portfolio

    # Currency
    currency: str  # "USD", "EUR", "GBP", etc.

    # Balance (decimal as string)
    balance: str  # Current balance
    available_balance: str | None = None  # Available for trading (excludes pending)

    # Interest
    interest_rate: str = "0"  # Annual interest rate
    accrued_interest: str = "0"  # Accrued but not paid

    # Metadata
    last_updated: str  # ISO datetime of last balance update
    account_number: str | None = None  # External account reference

    __dataflow__ = {
        "multi_tenant": True,
        "versioned": True,  # Concurrent balance updates
        "audit_log": True,
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "currency"], "unique": True},
        {"fields": ["currency"]},
    ]


@db.model
class Benchmark:
    """
    Benchmark portfolio for performance comparison.

    Can represent an index (S&P 500), a custom benchmark,
    or a composite of multiple benchmarks.
    """

    # Primary Key
    id: str  # UUID, e.g., "bench-sp500"

    # Core Fields
    name: str  # "S&P 500 Total Return"
    code: str  # "SPX" or ticker symbol
    description: str | None = None

    # Classification
    benchmark_type: str = "index"  # "index" | "custom" | "composite" | "peer_group"
    asset_class: str = "equity"  # "equity" | "fixed_income" | "multi"
    geography: str = "us"  # "us" | "international" | "emerging" | "global"

    # Data Source
    provider: str = "eodhd"  # Data provider
    ticker: str | None = None  # Provider ticker symbol
    security_id: str | None = None  # FK to Security if we track it

    # Composite Weights (for composite benchmarks)
    weights: dict = {}  # {"bench-sp500": 0.6, "bench-agg": 0.4}

    # Status
    active: bool = True
    deleted_at: str | None = None

    __dataflow__ = {
        "multi_tenant": False,  # Benchmarks are shared across tenants
        "audit_log": True,
        "soft_delete": True,
    }

    __indexes__ = [
        {"fields": ["code"], "unique": True},
        {"fields": ["benchmark_type", "active"]},
        {"fields": ["asset_class"]},
    ]
