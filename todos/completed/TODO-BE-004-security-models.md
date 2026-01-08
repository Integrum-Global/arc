# TODO-BE-004: Security Domain Models

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-002

---

## Objective

Implement DataFlow models for securities including master data, price history, fundamentals, and calculated ratios.

---

## Tasks

### 1. Security Model
- [ ] Create `src/arc/models/security.py`
- [ ] Implement `Security` model (shared across tenants):
  - `id: str` - ISIN, CUSIP, or internal ID
  - `ticker: str` - "AAPL"
  - `isin: Optional[str]` - "US0378331005"
  - `cusip: Optional[str]` - "037833100"
  - `sedol: Optional[str]` - "2046251"
  - `name: str` - "Apple Inc."
  - `short_name: Optional[str]`
  - `security_type: str` - equity, fixed_income, etf, mutual_fund, option, future, crypto, cash
  - `asset_class: str` - equity, fixed_income, alternative, cash
  - `exchange: str` - NASDAQ, NYSE
  - `currency: str` - USD
  - `country: str` - US
  - `sector: Optional[str]` - GICS sector
  - `industry_group: Optional[str]`
  - `industry: Optional[str]`
  - `sub_industry: Optional[str]`
  - `market_cap: Optional[str]`
  - `market_cap_category: Optional[str]` - mega, large, mid, small, micro
  - `employees: Optional[int]`
  - `website: Optional[str]`
  - `description: Optional[str]`
  - `is_private: bool` - True for Pitchbook companies
  - `active: bool`
  - `delisted_date: Optional[str]`
  - `last_price_date: Optional[str]`
  - `last_fundamental_date: Optional[str]`
- [ ] Configure `multi_tenant=False` (shared)
- [ ] Add indexes: ticker (unique), isin, security_type+active, sector+industry, exchange+currency, market_cap_category, is_private

### 2. PriceHistory Model
- [ ] Implement `PriceHistory` model:
  - `id: str` - "AAPL_2026-01-07"
  - `security_id: str`
  - `price_date: str` - ISO date
  - `open_price: Optional[str]`
  - `high_price: Optional[str]`
  - `low_price: Optional[str]`
  - `close_price: str` - Required
  - `adjusted_close: str` - Adjusted for splits/dividends
  - `volume: int` - Default 0
  - `daily_return: Optional[str]`
  - `source: str` - Default "eodhd"
  - `currency: str` - Default "USD"
  - `is_adjusted: bool` - Default True
  - `split_factor: str` - Default "1.0"
  - `dividend_factor: str` - Default "1.0"
- [ ] Configure `multi_tenant=False`
- [ ] Add unique constraint on security_id+price_date
- [ ] Add indexes on price_date, source

### 3. CompanyFundamentals Model
- [ ] Implement `CompanyFundamentals` model:
  - `id: str` - "AAPL_2025_Q4"
  - `security_id: str`
  - `fiscal_year: int`
  - `fiscal_quarter: Optional[int]` - 1-4 or None for annual
  - `period_end_date: str`
  - `report_date: Optional[str]`
  - **Income Statement fields** (15+):
    - revenue, cost_of_revenue, gross_profit
    - operating_expenses, operating_income
    - ebitda, ebit, interest_expense
    - pretax_income, income_tax, net_income
    - eps_basic, eps_diluted
    - shares_basic, shares_diluted
  - **Balance Sheet fields** (20+):
    - total_assets, current_assets
    - cash_and_equivalents, short_term_investments
    - accounts_receivable, inventory, other_current_assets
    - non_current_assets, property_plant_equipment
    - goodwill, intangible_assets
    - total_liabilities, current_liabilities
    - accounts_payable, short_term_debt, current_portion_long_term_debt
    - non_current_liabilities, long_term_debt, total_debt
    - total_equity, retained_earnings
  - **Cash Flow fields** (7):
    - operating_cash_flow, capital_expenditures
    - free_cash_flow, dividends_paid
    - share_repurchases, financing_cash_flow, investing_cash_flow
  - `source: str` - capitaliq, eodhd, manual
  - `currency: str` - Default USD
- [ ] Add unique constraint on security_id+fiscal_year+fiscal_quarter

### 4. SecurityRatio Model
- [ ] Implement `SecurityRatio` model:
  - `id: str` - "AAPL_2026-01-07_current_ratio"
  - `security_id: str`
  - `calculation_date: str` - ISO date
  - `ratio_class: str` - liquidity, profitability, utilization, leverage, valuation
  - `ratio_name: str` - current_ratio, roe, etc.
  - `ratio_value: str` - Calculated value
  - `peer_percentile: Optional[int]` - 0-100
  - `sector_average: Optional[str]`
  - `industry_average: Optional[str]`
  - `value_3m_ago: Optional[str]`
  - `value_6m_ago: Optional[str]`
  - `value_1y_ago: Optional[str]`
  - `trend_direction: Optional[str]` - improving, stable, declining
  - `trend_magnitude: Optional[str]`
  - `source_fundamentals_id: Optional[str]`
- [ ] Add unique constraint on security_id+calculation_date+ratio_name
- [ ] Add indexes on calculation_date, ratio_class, ratio_name

### 5. Model Exports
- [ ] Update `src/arc/models/__init__.py`

---

## Acceptance Criteria

- [ ] Security model with all identifier fields
- [ ] GICS classification hierarchy
- [ ] Private company support (is_private flag)
- [ ] NOT multi-tenant (shared across tenants)
- [ ] PriceHistory with OHLCV and adjustments
- [ ] CompanyFundamentals with full 3-statement coverage
- [ ] SecurityRatio with trend tracking
- [ ] Unit test: Create security with all identifiers
- [ ] Unit test: Bulk upsert prices
- [ ] Unit test: Query date range for prices
- [ ] Unit test: Create fundamentals with all fields
- [ ] Unit test: Bulk create ratios
- [ ] Integration test: Get latest price
- [ ] Integration test: Query latest fundamentals
- [ ] Integration test: Query all ratios for security

---

## Notes

- Securities are shared across tenants - no tenant_id
- Use composite IDs for PriceHistory and SecurityRatio
- Support both quarterly and annual fundamentals
- All monetary values as string decimals
