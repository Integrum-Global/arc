# TODO-BE-003: Portfolio Domain Models

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-002

---

## Objective

Implement DataFlow models for portfolio management including portfolios, holdings, transactions, valuations, and cash accounts.

---

## Tasks

### 1. Portfolio Model
- [ ] Create `src/arc/models/portfolio.py`
- [ ] Implement `Portfolio` model:
  - `id: str` - UUID (e.g., "port-001")
  - `name: str` - "Growth Equity Portfolio"
  - `code: str` - Short code "GEP"
  - `description: Optional[str]`
  - `portfolio_type: str` - managed, model, benchmark, composite
  - `strategy: Optional[str]` - growth, value, income, balanced
  - `asset_class_focus: str` - equity, fixed_income, multi, alternative
  - `inception_date: str` - ISO date
  - `termination_date: Optional[str]`
  - `base_currency: str` - Default USD
  - `manager_id: str` - FK to User
  - `benchmark_id: Optional[str]` - FK to Benchmark
  - `risk_profile: str` - conservative, moderate, aggressive
  - `investment_objective: Optional[str]`
  - `constraints: dict` - sector_limits, single_name_limit, min/max positions
  - `active: bool`
- [ ] Configure `multi_tenant=True`, `audit_log=True`, `soft_delete=True`
- [ ] Add indexes on manager_id, portfolio_type+active, inception_date, code

### 2. Holding Model
- [ ] Implement `Holding` model:
  - `id: str` - UUID
  - `portfolio_id: str` - FK to Portfolio
  - `security_id: str` - FK to Security
  - `quantity: str` - Decimal as string
  - `cost_basis: str` - Per-share cost
  - `total_cost: str` - Total cost basis
  - `lot_id: Optional[str]` - Tax lot tracking
  - `acquisition_date: str` - ISO date
  - `holding_period: str` - short or long
  - `current_price: Optional[str]`
  - `market_value: Optional[str]`
  - `unrealized_pnl: Optional[str]`
  - `unrealized_pnl_pct: Optional[str]`
  - `weight: Optional[str]` - % of portfolio
  - `notes: Optional[str]`
  - `tags: List[str]`
  - `active: bool`
- [ ] Configure `multi_tenant=True`, `versioned=True`, `audit_log=True`
- [ ] Add indexes on portfolio_id+security_id, security_id, acquisition_date, active

### 3. Transaction Model
- [ ] Implement `Transaction` model:
  - `id: str` - UUID
  - `portfolio_id: str` - FK to Portfolio
  - `security_id: str` - FK to Security
  - `holding_id: Optional[str]` - FK to Holding
  - `transaction_type: str` - buy, sell, dividend, split, transfer_in, transfer_out
  - `transaction_date: str` - Trade date
  - `settlement_date: str` - Settlement date
  - `quantity: str` - Decimal string
  - `price: str` - Per-share price
  - `gross_amount: str`
  - `commission: str` - Default "0"
  - `fees: str` - Default "0"
  - `taxes: str` - Default "0"
  - `net_amount: str`
  - `currency: str` - Default USD
  - `fx_rate: str` - Default "1.0"
  - `order_id: Optional[str]`
  - `broker: Optional[str]`
  - `compliance_status: str` - pending, approved, rejected
  - `compliance_notes: Optional[str]`
  - `created_by: Optional[str]`
- [ ] Configure `multi_tenant=True`, `audit_log=True`
- [ ] Add indexes on portfolio_id+transaction_date, security_id+transaction_date, transaction_type, settlement_date, compliance_status

### 4. PortfolioValuation Model
- [ ] Implement `PortfolioValuation` model:
  - `id: str` - "port-001_2026-01-07"
  - `portfolio_id: str`
  - `valuation_date: str` - ISO date
  - `total_value: str` - Total NAV
  - `securities_value: str`
  - `cash_value: str`
  - `accrued_income: str` - Default "0"
  - `contributions: str` - Default "0"
  - `withdrawals: str` - Default "0"
  - `daily_return: Optional[str]`
  - `mtd_return: Optional[str]`
  - `qtd_return: Optional[str]`
  - `ytd_return: Optional[str]`
  - `inception_return: Optional[str]`
  - `volatility_30d: Optional[str]`
  - `sharpe_ratio_30d: Optional[str]`
  - `max_drawdown_ytd: Optional[str]`
  - `benchmark_return: Optional[str]`
  - `tracking_error: Optional[str]`
  - `alpha: Optional[str]`
  - `beta: Optional[str]`
  - `pricing_source: str` - Default "eodhd"
  - `is_final: bool` - Default False
- [ ] Add unique constraint on portfolio_id+valuation_date

### 5. CashAccount Model
- [ ] Implement `CashAccount` model:
  - `id: str` - UUID
  - `portfolio_id: str`
  - `currency: str` - USD, EUR, etc.
  - `balance: str`
  - `interest_rate: str` - Default "0"
  - `accrued_interest: str` - Default "0"
  - `last_updated: str`
- [ ] Add unique constraint on portfolio_id+currency

### 6. Model Exports
- [ ] Update `src/arc/models/__init__.py`

---

## Acceptance Criteria

- [ ] All models with versioning for concurrent updates where needed
- [ ] Tax lot tracking support via lot_id
- [ ] Calculated fields for current values
- [ ] Multi-tenant with audit logging
- [ ] Unit test: Create portfolio with all fields
- [ ] Unit test: Add/update holdings
- [ ] Unit test: Record buy/sell transactions
- [ ] Unit test: Versioning conflict detection
- [ ] Integration test: Portfolio-holding relationship
- [ ] Integration test: Transaction history query
- [ ] Integration test: Historical NAV query

---

## Notes

- Use string decimals for all monetary values
- Holding versioning prevents concurrent update conflicts
- Transactions are immutable after creation
- Valuations can be updated until `is_final=True`
