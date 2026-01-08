# TODO-BE-001-05: Constants and Enums Module

**Parent**: TODO-BE-001 (Backend Project Initialization)
**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 45m
**Dependencies**: TODO-BE-001-01 (Project Structure)

---

## Objective

Create a comprehensive constants and enums module that defines all domain-specific enumerated types for the ARC investment platform.

---

## Description

Implement `src/arc/core/constants.py` with Python enums for all business domain concepts. These enums will be used throughout the codebase for:
- Type-safe value constraints
- Database field validation
- API request/response validation
- Clear documentation of allowed values

---

## Acceptance Criteria

- [ ] `src/arc/core/constants.py` exists with all enum classes
- [ ] `PortfolioType` enum with all portfolio types
- [ ] `TransactionType` enum with all transaction types
- [ ] `AlertSeverity` enum with severity levels
- [ ] `RatioClass` enum with financial ratio classifications
- [ ] `UserRole` enum with all user roles
- [ ] All enums use StrEnum for JSON serialization
- [ ] Unit tests pass for enum validation

---

## Subtasks

- [ ] Create base enum utilities (Est: 5m)
  - Use StrEnum for JSON-serializable enums
  - Helper for enum validation
  - Verification: Enums serialize to strings

- [ ] Create `PortfolioType` enum (Est: 5m)
  - MANAGED, MODEL, BENCHMARK, COMPOSITE
  - Verification: All portfolio types defined

- [ ] Create `TransactionType` enum (Est: 5m)
  - BUY, SELL, DIVIDEND, INTEREST, TRANSFER_IN, TRANSFER_OUT, FEE, SPLIT, MERGER
  - Verification: All transaction types defined

- [ ] Create `AlertSeverity` enum (Est: 5m)
  - INFO, WARNING, CRITICAL
  - Verification: Ordered severity levels

- [ ] Create `RatioClass` enum (Est: 5m)
  - LIQUIDITY, PROFITABILITY, LEVERAGE, EFFICIENCY, VALUATION, GROWTH
  - Verification: All ratio classes defined

- [ ] Create `UserRole` enum (Est: 5m)
  - ADMIN, INVESTMENT_MANAGER, FAMILY_OFFICE, COMPLIANCE, ANALYST, VIEWER
  - Verification: Role hierarchy clear

- [ ] Create `AssetClass` enum (Est: 5m)
  - EQUITY, FIXED_INCOME, CASH, REAL_ESTATE, COMMODITIES, ALTERNATIVES, CRYPTO
  - Verification: All asset classes defined

- [ ] Create `SecurityType` enum (Est: 5m)
  - STOCK, ETF, MUTUAL_FUND, BOND, OPTION, FUTURE, REIT, ADR
  - Verification: All security types defined

- [ ] Create `MarketStatus` enum (Est: 5m)
  - OPEN, CLOSED, PRE_MARKET, AFTER_HOURS
  - Verification: Market states defined

- [ ] Create `DataProvider` enum (Est: 5m)
  - EODHD, CAPITAL_IQ, PITCHBOOK, MANUAL
  - Verification: All providers defined

- [ ] Create `SyncStatus` enum (Est: 5m)
  - PENDING, IN_PROGRESS, COMPLETED, FAILED
  - Verification: Status flow clear

- [ ] Update `src/arc/core/__init__.py` exports (Est: 5m)
  - Export all enum classes
  - Verification: `from arc.core import PortfolioType`

---

## Enum Class Structure

```python
# src/arc/core/constants.py

from enum import StrEnum, auto


class PortfolioType(StrEnum):
    """Types of portfolios in the ARC platform."""

    MANAGED = "managed"          # Actively managed portfolios
    MODEL = "model"              # Model/strategy portfolios
    BENCHMARK = "benchmark"      # Benchmark portfolios for comparison
    COMPOSITE = "composite"      # Composite of multiple portfolios


class TransactionType(StrEnum):
    """Types of portfolio transactions."""

    BUY = "buy"
    SELL = "sell"
    DIVIDEND = "dividend"
    INTEREST = "interest"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    FEE = "fee"
    SPLIT = "split"
    MERGER = "merger"
    SPINOFF = "spinoff"
    RIGHTS_ISSUE = "rights_issue"


class AlertSeverity(StrEnum):
    """Severity levels for alerts and notifications."""

    INFO = "info"           # Informational, no action required
    WARNING = "warning"     # Requires attention
    CRITICAL = "critical"   # Immediate action required


class RatioClass(StrEnum):
    """Classifications for financial ratios."""

    LIQUIDITY = "liquidity"         # Current ratio, quick ratio
    PROFITABILITY = "profitability" # ROE, ROA, margins
    LEVERAGE = "leverage"           # Debt ratios
    EFFICIENCY = "efficiency"       # Asset turnover, inventory turnover
    VALUATION = "valuation"         # P/E, P/B, EV/EBITDA
    GROWTH = "growth"               # Revenue growth, earnings growth


class UserRole(StrEnum):
    """User roles and permission levels."""

    ADMIN = "admin"                         # Full system access
    INVESTMENT_MANAGER = "investment_manager"  # Portfolio management
    FAMILY_OFFICE = "family_office"         # Client-level access
    COMPLIANCE = "compliance"               # Compliance and audit
    ANALYST = "analyst"                     # Research and analysis
    VIEWER = "viewer"                       # Read-only access


class AssetClass(StrEnum):
    """Asset class categorization."""

    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    CASH = "cash"
    REAL_ESTATE = "real_estate"
    COMMODITIES = "commodities"
    ALTERNATIVES = "alternatives"
    CRYPTO = "crypto"
    PRIVATE_EQUITY = "private_equity"
    HEDGE_FUND = "hedge_fund"


class SecurityType(StrEnum):
    """Types of securities."""

    STOCK = "stock"             # Common stock
    PREFERRED = "preferred"     # Preferred stock
    ETF = "etf"                 # Exchange-traded fund
    MUTUAL_FUND = "mutual_fund" # Mutual fund
    BOND = "bond"               # Bond/fixed income
    OPTION = "option"           # Option contract
    FUTURE = "future"           # Futures contract
    REIT = "reit"               # Real estate investment trust
    ADR = "adr"                 # American depositary receipt
    WARRANT = "warrant"         # Stock warrant
    RIGHT = "right"             # Subscription right


class MarketStatus(StrEnum):
    """Market trading status."""

    OPEN = "open"
    CLOSED = "closed"
    PRE_MARKET = "pre_market"
    AFTER_HOURS = "after_hours"
    HALTED = "halted"


class DataProvider(StrEnum):
    """External data provider sources."""

    EODHD = "eodhd"             # EODHD market data
    CAPITAL_IQ = "capital_iq"   # S&P Capital IQ
    PITCHBOOK = "pitchbook"     # Pitchbook private markets
    MANUAL = "manual"           # Manually entered data
    INTERNAL = "internal"       # Internal calculations


class SyncStatus(StrEnum):
    """Data synchronization status."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Currency(StrEnum):
    """Supported currencies."""

    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    HKD = "HKD"
    SGD = "SGD"


class TimeHorizon(StrEnum):
    """Investment time horizons."""

    INTRADAY = "intraday"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    YTD = "ytd"                 # Year-to-date
    MTD = "mtd"                 # Month-to-date
    QTD = "qtd"                 # Quarter-to-date


class ReportType(StrEnum):
    """Types of reports generated."""

    PERFORMANCE = "performance"
    HOLDINGS = "holdings"
    TRANSACTIONS = "transactions"
    ATTRIBUTION = "attribution"
    RISK = "risk"
    COMPLIANCE = "compliance"
    TAX = "tax"
    CUSTOM = "custom"


# =============================================================================
# CONSTANTS
# =============================================================================

# API Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cache TTL (seconds)
CACHE_TTL_SHORT = 60          # 1 minute
CACHE_TTL_MEDIUM = 300        # 5 minutes
CACHE_TTL_LONG = 3600         # 1 hour
CACHE_TTL_MARKET_DATA = 900   # 15 minutes (market data)

# Rate Limits
RATE_LIMIT_DEFAULT = 100      # requests per minute
RATE_LIMIT_HEAVY = 10         # requests per minute for heavy operations

# Date Formats
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
DATETIME_FORMAT_MS = "%Y-%m-%dT%H:%M:%S.%fZ"
```

---

## Risk Assessment

- **LOW**: Standard enum pattern, no external dependencies
- **MEDIUM**: Ensure enums cover all business requirements
- **MITIGATION**: Enums can be extended as needed

---

## Testing Requirements

- [ ] Unit test: All enums serialize to strings
- [ ] Unit test: Enum values are unique within each class
- [ ] Unit test: Enums can be deserialized from strings
- [ ] Unit test: Invalid values raise ValueError
- [ ] Unit test: Constants have expected values

---

## Definition of Done

- [ ] `constants.py` module created and functional
- [ ] All enum classes implemented
- [ ] All constants defined
- [ ] `src/arc/core/__init__.py` exports all enums
- [ ] Unit tests pass for all enums
- [ ] Parent todo TODO-BE-001 updated with completion status
