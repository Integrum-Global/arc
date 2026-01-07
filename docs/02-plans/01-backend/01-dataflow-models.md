# Backend Plan: DataFlow Models

## Overview

This document defines ALL DataFlow models required for the ARC platform. Each model includes complete field specifications, relationships, indexes, and DataFlow configurations.

---

## 1. User Domain Models

### 1.1 Tenant Model

**File**: `src/arc/models/user.py`

```python
@db.model
class Tenant:
    """Organization/company using ARC (multi-tenant root)."""

    # Primary Key
    id: str                              # UUID, e.g., "tenant-001"

    # Core Fields
    name: str                            # "Smith Family Office"
    subdomain: str                       # "smith" (unique)
    plan: str                            # "professional" | "enterprise" | "private"

    # Limits
    max_users: int = 10                  # Based on plan
    max_portfolios: int = 50             # Based on plan
    aum_limit: Optional[Decimal] = None  # AUM cap for plan

    # Settings
    reporting_currency: str = "USD"      # Default reporting currency
    compliance_framework: str = "sec"    # "sec" | "mifid" | "custom"

    # Data Provider Access
    data_providers: List[str] = []       # ["eodhd", "capitaliq", "pitchbook"]

    # Feature Flags
    features_enabled: dict = {}          # {"ai_intelligence": true, ...}

    # Status
    active: bool = True
    trial_ends_at: Optional[datetime] = None

    # Audit
    created_at: Optional[str] = None     # Auto-managed
    updated_at: Optional[str] = None     # Auto-managed

    __dataflow__ = {
        'tenant_root': True,              # This IS the tenant definition
        'audit_log': True,
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["subdomain"], "unique": True},
        {"fields": ["plan", "active"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model created in `src/arc/models/user.py`
- [ ] All fields defined with correct types
- [ ] Indexes created for subdomain (unique), plan+active
- [ ] tenant_root flag set for multi-tenant isolation
- [ ] Unit test: Create, read, update tenant
- [ ] Integration test: Subdomain uniqueness constraint

---

### 1.2 User Model

**File**: `src/arc/models/user.py`

```python
@db.model
class User:
    """User account within a tenant."""

    # Primary Key
    id: str                              # UUID

    # Identity
    email: str                           # Unique within tenant
    name: str                            # Display name
    avatar_url: Optional[str] = None     # Profile picture URL

    # Authentication
    auth_provider: str = "email"         # "email" | "google" | "microsoft" | "okta"
    auth_provider_id: Optional[str] = None  # External ID from OAuth
    password_hash: Optional[str] = None  # Only for email auth

    # Authorization
    role: str = "viewer"                 # "admin" | "investment_manager" | "family_office" | "compliance" | "viewer"
    permissions_override: dict = {}      # Custom permission overrides

    # Preferences
    timezone: str = "UTC"                # User's timezone
    locale: str = "en-US"                # Preferred locale

    # Status
    active: bool = True
    email_verified: bool = False
    last_login_at: Optional[datetime] = None

    # Audit
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True,
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["email"]},            # Lookup by email (tenant-scoped)
        {"fields": ["role", "active"]},
        {"fields": ["auth_provider", "auth_provider_id"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model created with all fields
- [ ] Multi-tenant enabled (auto tenant_id)
- [ ] Index on email for fast lookup
- [ ] Unit test: CRUD operations
- [ ] Integration test: Multi-tenant isolation

---

### 1.3 UserPreference Model

**File**: `src/arc/models/user.py`

```python
@db.model
class UserPreference:
    """User-specific preferences and settings."""

    # Primary Key
    id: str                              # Same as user_id (1:1)

    # Foreign Key
    user_id: str                         # FK to User

    # Dashboard Preferences
    default_portfolio_id: Optional[str] = None  # Default selected portfolio
    dashboard_layout: dict = {}          # Widget positions and config

    # Brief Preferences
    brief_settings: dict = {
        "enabled": True,
        "delivery_time": "07:00",
        "detail_level": "standard",      # "executive" | "standard" | "comprehensive"
        "focus_areas": ["holdings", "sector", "earnings", "risk"],
        "custom_topics": []
    }

    # Alert Preferences
    alert_thresholds: dict = {
        "current_ratio": {"warning": 1.5, "critical": 1.0},
        "quick_ratio": {"warning": 1.0, "critical": 0.5},
        "debt_equity": {"warning": 1.0, "critical": 2.0},
        "debt_ebitda": {"warning": 3.0, "critical": 4.0},
        "roe": {"warning": 0.10, "critical": 0.05}
    }

    # Display Preferences
    number_format: str = "us"            # "us" (1,234.56) | "eu" (1.234,56)
    date_format: str = "MM/DD/YYYY"

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id"], "unique": True}
    ]
```

**Acceptance Criteria**:
- [ ] Model created as 1:1 with User
- [ ] Default values for all preference categories
- [ ] Unique constraint on user_id
- [ ] Unit test: Create preference with defaults
- [ ] Unit test: Update individual preference sections

---

### 1.4 NotificationPreference Model

**File**: `src/arc/models/user.py`

```python
@db.model
class NotificationPreference:
    """User notification channel preferences."""

    # Primary Key
    id: str                              # UUID

    # Foreign Key
    user_id: str                         # FK to User

    # Channel Configuration
    channel: str                         # "email" | "sms" | "in_app" | "push" | "slack"
    destination: str                     # Email address, phone, Slack webhook

    # Filtering
    severity_filter: str = "all"         # "all" | "warning" | "critical"
    alert_types: List[str] = []          # ["threshold", "anomaly", "news"] - empty = all

    # Delivery
    frequency: str = "immediate"         # "immediate" | "hourly_digest" | "daily_digest"
    quiet_hours_start: Optional[str] = None  # "22:00"
    quiet_hours_end: Optional[str] = None    # "07:00"

    # Status
    enabled: bool = True
    verified: bool = False               # For email/phone verification

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id", "channel"]},
        {"fields": ["enabled"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model supports multiple channels per user
- [ ] Quiet hours configuration
- [ ] Verification status tracking
- [ ] Unit test: Add multiple notification channels
- [ ] Unit test: Filter by severity

---

## 2. Portfolio Domain Models

### 2.1 Portfolio Model

**File**: `src/arc/models/portfolio.py`

```python
@db.model
class Portfolio:
    """Investment portfolio container."""

    # Primary Key
    id: str                              # UUID, e.g., "port-001"

    # Core Fields
    name: str                            # "Growth Equity Portfolio"
    code: str                            # Short code "GEP" for reports
    description: Optional[str] = None

    # Classification
    portfolio_type: str = "managed"      # "managed" | "model" | "benchmark" | "composite"
    strategy: Optional[str] = None       # "growth" | "value" | "income" | "balanced"
    asset_class_focus: str = "multi"     # "equity" | "fixed_income" | "multi" | "alternative"

    # Dates
    inception_date: str                  # ISO date "2020-01-15"
    termination_date: Optional[str] = None

    # Currency
    base_currency: str = "USD"           # Reporting currency

    # Relationships
    manager_id: str                      # FK to User (portfolio manager)
    benchmark_id: Optional[str] = None   # FK to Benchmark

    # Investment Policy
    risk_profile: str = "moderate"       # "conservative" | "moderate" | "aggressive"
    investment_objective: Optional[str] = None

    # Constraints (for optimization)
    constraints: dict = {
        "sector_limits": {},             # {"Technology": 0.40}
        "single_name_limit": 0.10,       # Max 10% in single position
        "min_positions": 10,
        "max_positions": 50,
        "cash_minimum": 0.02             # 2% cash minimum
    }

    # Status
    active: bool = True

    # Audit
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    deleted_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True,
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["manager_id"]},
        {"fields": ["portfolio_type", "active"]},
        {"fields": ["inception_date"]},
        {"fields": ["code"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model created with all fields
- [ ] Constraints dict for optimization parameters
- [ ] Multi-tenant with audit logging
- [ ] Unit test: Create portfolio with all fields
- [ ] Unit test: Soft delete and restore
- [ ] Integration test: Manager relationship

---

### 2.2 Holding Model

**File**: `src/arc/models/portfolio.py`

```python
@db.model
class Holding:
    """Position in a portfolio (current state)."""

    # Primary Key
    id: str                              # UUID

    # Foreign Keys
    portfolio_id: str                    # FK to Portfolio
    security_id: str                     # FK to Security

    # Position
    quantity: str                        # Decimal as string "1000.00"
    cost_basis: str                      # Per-share cost "150.25"
    total_cost: str                      # Total cost basis "150250.00"

    # Tax Lot Tracking
    lot_id: Optional[str] = None         # For FIFO/LIFO/Specific ID
    acquisition_date: str                # ISO date
    holding_period: str = "long"         # "short" | "long" (>1 year)

    # Current Values (updated by NAV workflow)
    current_price: Optional[str] = None  # Last price
    market_value: Optional[str] = None   # quantity * current_price
    unrealized_pnl: Optional[str] = None # market_value - total_cost
    unrealized_pnl_pct: Optional[str] = None
    weight: Optional[str] = None         # % of portfolio

    # Metadata
    notes: Optional[str] = None
    tags: List[str] = []                 # ["esg", "high_conviction"]

    # Status
    active: bool = True                  # False when position closed

    # Audit
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True,
        'versioned': True,               # Optimistic locking
        'audit_log': True
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "security_id"]},
        {"fields": ["security_id"]},
        {"fields": ["acquisition_date"]},
        {"fields": ["active"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model with versioning for concurrent updates
- [ ] Calculated fields for current values
- [ ] Tax lot tracking support
- [ ] Unit test: Add/update holdings
- [ ] Unit test: Versioning conflict detection
- [ ] Integration test: Portfolio-holding relationship

---

### 2.3 Transaction Model

**File**: `src/arc/models/portfolio.py`

```python
@db.model
class Transaction:
    """Historical transaction record."""

    # Primary Key
    id: str                              # UUID

    # Foreign Keys
    portfolio_id: str                    # FK to Portfolio
    security_id: str                     # FK to Security
    holding_id: Optional[str] = None     # FK to Holding (for lot tracking)

    # Transaction Details
    transaction_type: str                # "buy" | "sell" | "dividend" | "split" | "transfer_in" | "transfer_out"
    transaction_date: str                # Trade date (ISO)
    settlement_date: str                 # Settlement date (ISO)

    # Quantities and Prices
    quantity: str                        # Shares/units as decimal string
    price: str                           # Per-share price

    # Amounts
    gross_amount: str                    # quantity * price
    commission: str = "0"                # Broker commission
    fees: str = "0"                      # Other fees
    taxes: str = "0"                     # Withholding taxes
    net_amount: str                      # Final amount (gross - fees for buys, gross - fees + taxes for sells)

    # Currency
    currency: str = "USD"
    fx_rate: str = "1.0"                 # FX rate to portfolio base currency

    # Compliance
    order_id: Optional[str] = None       # External order ID
    broker: Optional[str] = None         # Broker name
    compliance_status: str = "approved"  # "pending" | "approved" | "rejected"
    compliance_notes: Optional[str] = None

    # Audit
    created_at: Optional[str] = None
    created_by: Optional[str] = None     # User who entered

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "transaction_date"]},
        {"fields": ["security_id", "transaction_date"]},
        {"fields": ["transaction_type"]},
        {"fields": ["settlement_date"]},
        {"fields": ["compliance_status"]}
    ]
```

**Acceptance Criteria**:
- [ ] Model supports all transaction types
- [ ] Currency and FX rate tracking
- [ ] Compliance status workflow
- [ ] Unit test: Record buy/sell transactions
- [ ] Unit test: Calculate net amounts correctly
- [ ] Integration test: Transaction history query

---

### 2.4 PortfolioValuation Model

**File**: `src/arc/models/portfolio.py`

```python
@db.model
class PortfolioValuation:
    """Daily portfolio NAV snapshot."""

    # Primary Key
    id: str                              # "port-001_2026-01-07"

    # Foreign Key
    portfolio_id: str

    # Valuation Date
    valuation_date: str                  # ISO date

    # Values
    total_value: str                     # Total NAV
    securities_value: str                # Market value of holdings
    cash_value: str                      # Cash balance
    accrued_income: str = "0"            # Accrued dividends/interest

    # Flows
    contributions: str = "0"             # Cash added
    withdrawals: str = "0"               # Cash removed

    # Returns (calculated)
    daily_return: Optional[str] = None   # (today - yesterday) / yesterday
    mtd_return: Optional[str] = None     # Month-to-date
    qtd_return: Optional[str] = None     # Quarter-to-date
    ytd_return: Optional[str] = None     # Year-to-date
    inception_return: Optional[str] = None

    # Risk Metrics
    volatility_30d: Optional[str] = None
    sharpe_ratio_30d: Optional[str] = None
    max_drawdown_ytd: Optional[str] = None

    # Benchmark Comparison
    benchmark_return: Optional[str] = None
    tracking_error: Optional[str] = None
    alpha: Optional[str] = None
    beta: Optional[str] = None

    # Metadata
    pricing_source: str = "eodhd"
    is_final: bool = False               # True after market close reconciliation

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "valuation_date"], "unique": True},
        {"fields": ["valuation_date"]},
        {"fields": ["is_final"]}
    ]
```

**Acceptance Criteria**:
- [ ] Unique constraint on portfolio + date
- [ ] All return period calculations
- [ ] Risk metrics storage
- [ ] Unit test: Create daily valuation
- [ ] Unit test: Calculate returns from valuations
- [ ] Integration test: Historical NAV query

---

### 2.5 CashAccount Model

**File**: `src/arc/models/portfolio.py`

```python
@db.model
class CashAccount:
    """Cash holdings within a portfolio."""

    # Primary Key
    id: str                              # UUID

    # Foreign Key
    portfolio_id: str

    # Account Details
    currency: str                        # "USD", "EUR", etc.
    balance: str                         # Current balance

    # Interest
    interest_rate: str = "0"             # Annual rate
    accrued_interest: str = "0"

    # Last Update
    last_updated: str                    # ISO datetime

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "currency"], "unique": True}
    ]
```

---

## 3. Security Domain Models

### 3.1 Security Model

**File**: `src/arc/models/security.py`

```python
@db.model
class Security:
    """Security master data (shared across tenants)."""

    # Primary Key
    id: str                              # ISIN, CUSIP, or internal ID

    # Identifiers
    ticker: str                          # "AAPL"
    isin: Optional[str] = None           # "US0378331005"
    cusip: Optional[str] = None          # "037833100"
    sedol: Optional[str] = None          # "2046251"

    # Basic Info
    name: str                            # "Apple Inc."
    short_name: Optional[str] = None     # "Apple"

    # Classification
    security_type: str                   # "equity" | "fixed_income" | "etf" | "mutual_fund" | "option" | "future" | "crypto" | "cash"
    asset_class: str                     # "equity" | "fixed_income" | "alternative" | "cash"

    # Trading
    exchange: str                        # "NASDAQ", "NYSE"
    currency: str                        # "USD"
    country: str                         # "US"

    # Sector/Industry (GICS)
    sector: Optional[str] = None         # "Information Technology"
    industry_group: Optional[str] = None # "Technology Hardware & Equipment"
    industry: Optional[str] = None       # "Technology Hardware, Storage & Peripherals"
    sub_industry: Optional[str] = None   # "Technology Hardware, Storage & Peripherals"

    # Company Info (for equities)
    market_cap: Optional[str] = None     # Latest market cap
    market_cap_category: Optional[str] = None  # "mega" | "large" | "mid" | "small" | "micro"
    employees: Optional[int] = None
    website: Optional[str] = None
    description: Optional[str] = None

    # Private Company Flag
    is_private: bool = False             # True for Pitchbook companies

    # Status
    active: bool = True
    delisted_date: Optional[str] = None

    # Data Quality
    last_price_date: Optional[str] = None
    last_fundamental_date: Optional[str] = None

    # Audit
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': False,           # Shared across tenants
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["ticker"], "unique": True},
        {"fields": ["isin"]},
        {"fields": ["security_type", "active"]},
        {"fields": ["sector", "industry"]},
        {"fields": ["exchange", "currency"]},
        {"fields": ["market_cap_category"]},
        {"fields": ["is_private"]}
    ]
```

**Acceptance Criteria**:
- [ ] All identifier fields (ticker, ISIN, CUSIP, SEDOL)
- [ ] GICS classification fields
- [ ] Private company support
- [ ] NOT multi-tenant (shared)
- [ ] Unit test: Create security with all identifiers
- [ ] Unit test: Query by sector/industry

---

### 3.2 PriceHistory Model

**File**: `src/arc/models/security.py`

```python
@db.model
class PriceHistory:
    """Historical daily price data."""

    # Primary Key
    id: str                              # "AAPL_2026-01-07"

    # Foreign Key
    security_id: str

    # Date
    price_date: str                      # ISO date

    # OHLCV
    open_price: Optional[str] = None
    high_price: Optional[str] = None
    low_price: Optional[str] = None
    close_price: str                     # Required
    adjusted_close: str                  # Adjusted for splits/dividends
    volume: int = 0

    # Calculated
    daily_return: Optional[str] = None   # (close - prev_close) / prev_close

    # Metadata
    source: str = "eodhd"                # Data provider
    currency: str = "USD"

    # Data Quality
    is_adjusted: bool = True
    split_factor: str = "1.0"
    dividend_factor: str = "1.0"

    __dataflow__ = {
        'multi_tenant': False            # Shared across tenants
    }

    __indexes__ = [
        {"fields": ["security_id", "price_date"], "unique": True},
        {"fields": ["price_date"]},
        {"fields": ["source"]}
    ]
```

**Acceptance Criteria**:
- [ ] Unique constraint on security + date
- [ ] Both close and adjusted_close
- [ ] Source tracking
- [ ] Unit test: Bulk upsert prices
- [ ] Unit test: Query date range
- [ ] Integration test: Get latest price

---

### 3.3 CompanyFundamentals Model

**File**: `src/arc/models/security.py`

```python
@db.model
class CompanyFundamentals:
    """Company financial statement data."""

    # Primary Key
    id: str                              # "AAPL_2025_Q4"

    # Foreign Key
    security_id: str

    # Period
    fiscal_year: int                     # 2025
    fiscal_quarter: Optional[int] = None # 1, 2, 3, 4 or None for annual
    period_end_date: str                 # "2025-12-31"
    report_date: Optional[str] = None    # When filed

    # Income Statement
    revenue: Optional[str] = None
    cost_of_revenue: Optional[str] = None
    gross_profit: Optional[str] = None
    operating_expenses: Optional[str] = None
    operating_income: Optional[str] = None
    ebitda: Optional[str] = None
    ebit: Optional[str] = None
    interest_expense: Optional[str] = None
    pretax_income: Optional[str] = None
    income_tax: Optional[str] = None
    net_income: Optional[str] = None
    eps_basic: Optional[str] = None
    eps_diluted: Optional[str] = None
    shares_basic: Optional[str] = None
    shares_diluted: Optional[str] = None

    # Balance Sheet
    total_assets: Optional[str] = None
    current_assets: Optional[str] = None
    cash_and_equivalents: Optional[str] = None
    short_term_investments: Optional[str] = None
    accounts_receivable: Optional[str] = None
    inventory: Optional[str] = None
    other_current_assets: Optional[str] = None

    non_current_assets: Optional[str] = None
    property_plant_equipment: Optional[str] = None
    goodwill: Optional[str] = None
    intangible_assets: Optional[str] = None

    total_liabilities: Optional[str] = None
    current_liabilities: Optional[str] = None
    accounts_payable: Optional[str] = None
    short_term_debt: Optional[str] = None
    current_portion_long_term_debt: Optional[str] = None
    other_current_liabilities: Optional[str] = None

    non_current_liabilities: Optional[str] = None
    long_term_debt: Optional[str] = None
    total_debt: Optional[str] = None     # Short + long term

    total_equity: Optional[str] = None
    retained_earnings: Optional[str] = None

    # Cash Flow Statement
    operating_cash_flow: Optional[str] = None
    capital_expenditures: Optional[str] = None
    free_cash_flow: Optional[str] = None
    dividends_paid: Optional[str] = None
    share_repurchases: Optional[str] = None
    financing_cash_flow: Optional[str] = None
    investing_cash_flow: Optional[str] = None

    # Metadata
    source: str                          # "capitaliq" | "eodhd" | "manual"
    currency: str = "USD"

    # Audit
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': False
    }

    __indexes__ = [
        {"fields": ["security_id", "fiscal_year", "fiscal_quarter"], "unique": True},
        {"fields": ["fiscal_year"]},
        {"fields": ["source"]},
        {"fields": ["period_end_date"]}
    ]
```

**Acceptance Criteria**:
- [ ] All income statement fields
- [ ] All balance sheet fields
- [ ] All cash flow fields
- [ ] Support for quarterly and annual
- [ ] Unit test: Create with all fields
- [ ] Unit test: Query latest for security

---

### 3.4 SecurityRatio Model

**File**: `src/arc/models/security.py`

```python
@db.model
class SecurityRatio:
    """Pre-calculated financial ratios."""

    # Primary Key
    id: str                              # "AAPL_2026-01-07_current_ratio"

    # Foreign Key
    security_id: str

    # Calculation Date
    calculation_date: str                # ISO date

    # Ratio Identity
    ratio_class: str                     # "liquidity" | "profitability" | "utilization" | "leverage" | "valuation"
    ratio_name: str                      # "current_ratio", "roe", etc.

    # Value
    ratio_value: str                     # Calculated value as string

    # Context
    peer_percentile: Optional[int] = None  # 0-100
    sector_average: Optional[str] = None
    industry_average: Optional[str] = None

    # Historical Context
    value_3m_ago: Optional[str] = None
    value_6m_ago: Optional[str] = None
    value_1y_ago: Optional[str] = None

    # Trend
    trend_direction: Optional[str] = None  # "improving" | "stable" | "declining"
    trend_magnitude: Optional[str] = None  # Percentage change

    # Metadata
    source_fundamentals_id: Optional[str] = None  # FK to CompanyFundamentals used

    __dataflow__ = {
        'multi_tenant': False
    }

    __indexes__ = [
        {"fields": ["security_id", "calculation_date", "ratio_name"], "unique": True},
        {"fields": ["calculation_date"]},
        {"fields": ["ratio_class"]},
        {"fields": ["ratio_name"]}
    ]
```

**Acceptance Criteria**:
- [ ] Unique on security + date + ratio
- [ ] Historical values storage
- [ ] Trend calculation
- [ ] Unit test: Bulk create ratios
- [ ] Unit test: Query all ratios for security

---

## 4. Analytics Domain Models

### 4.1 Alert Model

**File**: `src/arc/models/analytics.py`

```python
@db.model
class Alert:
    """Generated alert notification."""

    # Primary Key
    id: str                              # UUID

    # Targeting
    user_id: str                         # FK to User (recipient)
    portfolio_id: Optional[str] = None   # Related portfolio
    security_id: Optional[str] = None    # Related security

    # Alert Type
    alert_type: str                      # "threshold" | "anomaly" | "news" | "earnings" | "compliance" | "system"
    severity: str                        # "info" | "warning" | "critical"

    # Content
    title: str                           # Short title
    message: str                         # Full message
    explanation: Optional[str] = None    # AI-generated explanation

    # Details
    trigger_value: Optional[str] = None  # Value that triggered alert
    threshold_value: Optional[str] = None # Threshold that was breached
    ratio_name: Optional[str] = None     # For ratio alerts

    # Actions
    suggested_actions: List[str] = []    # Recommended actions
    action_url: Optional[str] = None     # Deep link to related screen

    # Timing
    triggered_at: str                    # ISO datetime
    expires_at: Optional[str] = None     # Auto-dismiss after

    # Status
    status: str = "active"               # "active" | "acknowledged" | "dismissed" | "resolved"
    acknowledged_at: Optional[str] = None
    acknowledged_by: Optional[str] = None
    dismissed_at: Optional[str] = None

    # Delivery
    delivery_status: dict = {}           # {"email": "sent", "sms": "pending"}

    # Metadata
    metadata: dict = {}                  # Additional context

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True
    }

    __indexes__ = [
        {"fields": ["user_id", "status"]},
        {"fields": ["portfolio_id"]},
        {"fields": ["security_id"]},
        {"fields": ["alert_type", "severity"]},
        {"fields": ["triggered_at"]},
        {"fields": ["status"]}
    ]
```

**Acceptance Criteria**:
- [ ] All alert types supported
- [ ] Delivery status tracking
- [ ] Status workflow (active → acknowledged → resolved)
- [ ] Unit test: Create threshold alert
- [ ] Unit test: Update alert status

---

### 4.2 AlertThreshold Model

**File**: `src/arc/models/analytics.py`

```python
@db.model
class AlertThreshold:
    """User-configured alert thresholds."""

    # Primary Key
    id: str                              # UUID

    # Owner
    user_id: str                         # FK to User
    portfolio_id: Optional[str] = None   # Optional portfolio-specific threshold

    # Threshold Definition
    ratio_class: str                     # "liquidity", "profitability", etc.
    ratio_name: str                      # "current_ratio", "roe", etc.

    # Thresholds
    warning_threshold: str               # Decimal string
    critical_threshold: str              # Decimal string
    comparison: str                      # "lt" | "gt" | "eq" | "lte" | "gte"

    # Options
    enabled: bool = True
    alert_on_improvement: bool = False   # Alert when ratio improves past threshold
    cooldown_hours: int = 24             # Minimum hours between alerts

    # Last Triggered
    last_triggered_at: Optional[str] = None
    last_triggered_value: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id", "ratio_name"]},
        {"fields": ["portfolio_id"]},
        {"fields": ["enabled"]}
    ]
```

---

### 4.3 PeerGroup Model

**File**: `src/arc/models/analytics.py`

```python
@db.model
class PeerGroup:
    """Peer comparison group definition."""

    # Primary Key
    id: str                              # UUID or "sector_technology_large"

    # Owner
    user_id: Optional[str] = None        # None for system-defined

    # Definition
    name: str                            # "Large Cap Technology"
    description: Optional[str] = None

    # Type
    group_type: str = "custom"           # "sector" | "industry" | "market_cap" | "custom"

    # Criteria (for auto-population)
    criteria: dict = {
        "sector": None,                  # GICS sector
        "industry": None,                # GICS industry
        "market_cap_min": None,
        "market_cap_max": None,
        "country": None,
        "exchange": None
    }

    # Members
    security_ids: List[str] = []         # Explicit member list
    exclude_security_ids: List[str] = [] # Excluded from auto-population

    # Auto-update
    auto_refresh: bool = False           # Auto-update members based on criteria
    last_refreshed_at: Optional[str] = None

    # Statistics (cached)
    member_count: int = 0
    stats_date: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id"]},
        {"fields": ["group_type"]}
    ]
```

---

### 4.4 Benchmark Model

**File**: `src/arc/models/analytics.py`

```python
@db.model
class Benchmark:
    """Market benchmark definition."""

    # Primary Key
    id: str                              # "SPX", "NDX", "CUSTOM-001"

    # Definition
    name: str                            # "S&P 500 Index"
    ticker: str                          # "^GSPC"
    description: Optional[str] = None

    # Type
    benchmark_type: str                  # "index" | "etf" | "custom"

    # For Custom Benchmarks
    composition: dict = {}               # {"SPY": 0.6, "QQQ": 0.4}

    # Data Source
    price_security_id: Optional[str] = None  # FK to Security for price lookup

    # Returns (cached)
    return_1d: Optional[str] = None
    return_mtd: Optional[str] = None
    return_qtd: Optional[str] = None
    return_ytd: Optional[str] = None
    return_1y: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': False            # System-wide benchmarks
    }

    __indexes__ = [
        {"fields": ["ticker"], "unique": True},
        {"fields": ["benchmark_type"]}
    ]
```

---

## 5. Integration Domain Models

### 5.1 DataProviderConnection Model

**File**: `src/arc/models/integration.py`

```python
@db.model
class DataProviderConnection:
    """External data provider credentials and status."""

    # Primary Key
    id: str                              # UUID

    # Provider
    provider: str                        # "eodhd" | "capitaliq" | "pitchbook" | "yahoo"

    # Credentials (encrypted)
    api_key_encrypted: Optional[str] = None
    oauth_token_encrypted: Optional[str] = None
    oauth_refresh_token_encrypted: Optional[str] = None
    oauth_expires_at: Optional[str] = None

    # Connection Settings
    base_url: Optional[str] = None       # Override default URL
    rate_limit_per_minute: int = 60
    timeout_seconds: int = 30

    # Sync Configuration
    sync_prices: bool = True
    sync_fundamentals: bool = True
    sync_schedule: str = "daily"         # "realtime" | "daily" | "weekly" | "manual"

    # Status
    enabled: bool = True
    connection_status: str = "pending"   # "pending" | "connected" | "error"
    last_test_at: Optional[str] = None
    last_test_result: Optional[str] = None

    # Sync Status
    last_sync_at: Optional[str] = None
    last_sync_status: str = "never"      # "never" | "success" | "partial" | "failed"
    last_sync_records: int = 0
    last_sync_error: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True,
        'encryption': {
            'fields': ['api_key_encrypted', 'oauth_token_encrypted', 'oauth_refresh_token_encrypted'],
            'algorithm': 'AES-256-GCM'
        }
    }

    __indexes__ = [
        {"fields": ["provider"]},
        {"fields": ["enabled", "connection_status"]}
    ]
```

---

### 5.2 SyncJob Model

**File**: `src/arc/models/integration.py`

```python
@db.model
class SyncJob:
    """Data synchronization job tracking."""

    # Primary Key
    id: str                              # UUID

    # Relationship
    connection_id: str                   # FK to DataProviderConnection

    # Job Definition
    job_type: str                        # "prices" | "fundamentals" | "securities" | "private_companies"
    scope: str = "full"                  # "full" | "incremental" | "specific"
    parameters: dict = {}                # {"security_ids": [...], "start_date": "..."}

    # Execution
    started_at: str
    completed_at: Optional[str] = None

    # Status
    status: str = "pending"              # "pending" | "running" | "completed" | "failed" | "cancelled"

    # Progress
    total_records: Optional[int] = None
    processed_records: int = 0
    failed_records: int = 0
    progress_pct: int = 0

    # Errors
    error_message: Optional[str] = None
    error_details: dict = {}

    # Results
    records_created: int = 0
    records_updated: int = 0
    records_skipped: int = 0

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["connection_id", "started_at"]},
        {"fields": ["status"]},
        {"fields": ["job_type"]}
    ]
```

---

### 5.3 AuditLog Model

**File**: `src/arc/models/integration.py`

```python
@db.model
class AuditLog:
    """Complete audit trail of user actions."""

    # Primary Key
    id: str                              # UUID

    # Actor
    user_id: str                         # FK to User

    # Action
    action: str                          # "create" | "read" | "update" | "delete" | "execute" | "login" | "logout"

    # Target
    entity_type: str                     # "Portfolio", "Holding", "Transaction", etc.
    entity_id: str                       # ID of affected entity

    # Details
    changes: dict = {}                   # {"field": {"old": x, "new": y}}
    request_data: dict = {}              # Original request (sanitized)

    # Context
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None

    # Timestamp
    timestamp: str                       # ISO datetime

    # Compliance
    compliance_relevant: bool = False    # Flag for compliance reports

    __dataflow__ = {
        'multi_tenant': True
    }

    __indexes__ = [
        {"fields": ["user_id", "timestamp"]},
        {"fields": ["entity_type", "entity_id"]},
        {"fields": ["action"]},
        {"fields": ["timestamp"]},
        {"fields": ["compliance_relevant"]}
    ]
```

---

## 6. Implementation Checklist

### Phase 1 Models (Weeks 1-2)

- [ ] **USER-001**: Tenant model
- [ ] **USER-002**: User model
- [ ] **USER-003**: UserPreference model
- [ ] **USER-004**: NotificationPreference model
- [ ] **PORT-001**: Portfolio model
- [ ] **PORT-002**: Holding model
- [ ] **PORT-003**: Transaction model
- [ ] **PORT-004**: PortfolioValuation model
- [ ] **PORT-005**: CashAccount model
- [ ] **SEC-001**: Security model
- [ ] **SEC-002**: PriceHistory model
- [ ] **INT-001**: DataProviderConnection model
- [ ] **INT-002**: SyncJob model
- [ ] **INT-003**: AuditLog model

### Phase 2 Models (Weeks 3-4)

- [ ] **SEC-003**: CompanyFundamentals model
- [ ] **SEC-004**: SecurityRatio model
- [ ] **ANAL-001**: Alert model
- [ ] **ANAL-002**: AlertThreshold model
- [ ] **ANAL-003**: PeerGroup model
- [ ] **ANAL-004**: Benchmark model

### Phase 3 Models (As needed)

- [ ] **COLLAB-001**: Workspace model
- [ ] **COLLAB-002**: WorkspaceMember model
- [ ] **COLLAB-003**: Annotation model
- [ ] **COLLAB-004**: ApprovalWorkflow model
- [ ] **COLLAB-005**: ApprovalStep model

---

## 7. Testing Requirements

Each model must have:

1. **Unit Tests** (`tests/unit/models/test_<model>.py`)
   - Create with all required fields
   - Create with optional fields
   - Field validation
   - Default values

2. **Integration Tests** (`tests/integration/models/test_<model>.py`)
   - CRUD operations via DataFlow
   - Index performance
   - Unique constraint enforcement
   - Multi-tenant isolation (where applicable)
   - Relationship integrity
