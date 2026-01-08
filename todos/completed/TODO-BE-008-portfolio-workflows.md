# TODO-BE-008: Portfolio Workflows

**Priority**: MEDIUM
**Status**: COMPLETED
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-003
**Completed**: 2026-01-07

---

## Objective

Implement Kailash workflows for portfolio NAV calculation, health scans, and valuation.

---

## Tasks

### 1. NAV Calculation Workflow
- [x] Create `src/arc/workflows/portfolio/valuation.py`
- [x] Implement `build_nav_calculation_workflow()`:
  - Node 1: `PortfolioListNode` - Get portfolios to value
  - Node 2: `HoldingListNode` - Get all active holdings
  - Node 3: `PriceHistoryListNode` - Get latest prices
  - Node 4: `CashAccountListNode` - Get cash balances
  - Node 5: `PortfolioValuationListNode` - Get previous valuations
  - Node 6: `PythonCodeNode` - Calculate NAV:
    - Sum securities value (quantity × price)
    - Add cash balances
    - Calculate returns vs previous day
  - Node 7: `PortfolioValuationBulkUpsertNode` - Save valuations
  - Node 8: `HoldingBulkUpdateNode` - Update holding current values
- [x] Support multi-currency portfolios (FX conversion)
- [x] Handle missing prices gracefully
- [x] Calculate all return periods (daily, MTD, QTD, YTD, inception)
- [x] Implement `build_portfolio_valuation_workflow()` convenience wrapper

### 2. Portfolio Health Scan Workflow
- [x] Create `src/arc/workflows/portfolio/health_scan.py`
- [x] Implement `build_portfolio_health_scan_workflow()`:
  - Node 1: `PortfolioReadNode` - Get portfolio
  - Node 2: `HoldingListNode` - Get holdings
  - Node 3: `AlertThresholdListNode` - Get user thresholds (optional)
  - Node 4: `SecurityRatioListNode` - Get ratios for holdings
  - Node 5: `PythonCodeNode` - Calculate health scores
- [x] Implement scoring algorithm:
  - Start at 100 points
  - -15 points per critical issue
  - -5 points per warning issue
  - Minimum score is 0
- [x] Weights: liquidity 20%, profitability 25%, efficiency 15%, leverage 25%, valuation 15%
- [x] Default thresholds for 9 common ratios
- [x] Implement `build_batch_health_scan_workflow()` for multiple portfolios

### 3. Portfolio Rebalance Workflow (Analysis)
- [x] Create `src/arc/workflows/portfolio/rebalance.py`
- [x] Implement `build_rebalance_analysis_workflow()`:
  - Get portfolio and target allocation
  - Get holdings with current values
  - Calculate current weights
  - Compare to target weights
  - Generate drift analysis
  - Generate rebalance recommendations
- [x] Tolerance band support (default 5%)
- [x] Minimum trade value filter (default $100)
- [x] Note: Analysis only, trade execution not implemented

### 4. Workflow Registry
- [x] Create `src/arc/workflows/portfolio/__init__.py`
- [x] Export all 5 portfolio workflows
- [x] Update main workflows `__init__.py`

### 5. Tests
- [x] 52 comprehensive unit tests covering:
  - Workflow building with various parameters
  - NAV calculation logic (values, returns, FX)
  - Health score calculation (deductions, weights)
  - Rebalance analysis (drift, recommendations)
  - Parameter validation

### 6. Documentation
- [x] Created `src/arc/docs/developers/11-portfolio-workflows.md`

---

## Acceptance Criteria

- [x] Accurate NAV calculation
- [x] Multi-currency support with FX conversion
- [x] Return calculations for all periods
- [x] Missing price handling (use last available)
- [x] Health score 0-100 with clear algorithm
- [x] Per-class breakdown
- [x] Issue severity classification (critical vs warning)
- [x] Default thresholds for unconfigured users
- [x] Unit tests for NAV math
- [x] Unit tests for return calculations
- [x] Unit tests for score calculation
- [x] 52 tests passing (100% pass rate)

---

## Implementation Summary

### Files Created
- `src/arc/workflows/portfolio/__init__.py` - Package exports
- `src/arc/workflows/portfolio/valuation.py` - NAV calculation workflows
- `src/arc/workflows/portfolio/health_scan.py` - Health scan workflows with default thresholds
- `src/arc/workflows/portfolio/rebalance.py` - Rebalance analysis workflow
- `tests/unit/workflows/test_portfolio_workflows.py` - 52 unit tests
- `src/arc/docs/developers/11-portfolio-workflows.md` - Developer documentation

### Exported Workflows (5 total)
1. `build_nav_calculation_workflow()` - Calculate NAV for multiple portfolios
2. `build_portfolio_valuation_workflow()` - Convenience wrapper for single portfolio
3. `build_portfolio_health_scan_workflow()` - Health score for single portfolio
4. `build_batch_health_scan_workflow()` - Health scores for multiple portfolios
5. `build_rebalance_analysis_workflow()` - Rebalance recommendations

---

## Technical Notes

- Valuations are idempotent (composite ID: portfolio_id + date)
- Use `is_final=False` initially, set `True` after reconciliation
- Health scan uses default thresholds unless `use_default_thresholds=False`
- FX conversion uses placeholder rates (production would fetch from FX data)
- Rebalance workflow generates recommendations, not actual trades
