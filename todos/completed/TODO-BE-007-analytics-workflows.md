# TODO-BE-007: Analytics Workflows

**Priority**: HIGH
**Status**: COMPLETED
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-005
**Completed**: 2026-01-07

---

## Objective

Implement Kailash workflows for financial ratio calculation, threshold alerting, and peer benchmarking.

---

## Tasks

### 1. Financial Ratio Calculation Workflow
- [x] Create `src/arc/workflows/analytics/ratios.py`
- [x] Implement `build_ratio_calculation_workflow()`:
  - Node 1: `SecurityListNode` - Get securities with recent fundamentals
  - Node 2: `CompanyFundamentalsListNode` - Get latest fundamentals
  - Node 3: `PriceHistoryListNode` - Get latest prices (for market-based ratios)
  - Node 4: `PythonCodeNode` - Calculate all 25 ratios
  - Node 5: `SecurityRatioBulkUpsertNode` - Save ratios
- [x] Implement all 25 ratios across 5 classes:
  - **Liquidity** (4): current_ratio, quick_ratio, cash_ratio, working_capital_ratio
  - **Profitability** (6): roe, roa, roic, profit_margin, operating_margin, gross_margin
  - **Leverage** (4): debt_to_equity, debt_ratio, equity_multiplier, debt_to_ebitda
  - **Efficiency** (4): asset_turnover, inventory_turnover, receivables_turnover, fixed_asset_turnover
  - **Valuation** (7): pe_ratio, pb_ratio, ps_ratio, ev_ebitda, ev_revenue, dividend_yield, payout_ratio
- [x] Implement safe division (handle divide by zero)
- [x] Handle null/missing data gracefully

### 2. Threshold Alert Check Workflow
- [x] Create `src/arc/workflows/analytics/alerts.py`
- [x] Implement `build_threshold_alert_workflow()`:
  - Node 1: `ThresholdAlertListNode` - Get active thresholds
  - Node 2: `HoldingListNode` - Get holdings for each user's portfolios
  - Node 3: `SecurityRatioListNode` - Get latest ratios
  - Node 4: `PythonCodeNode` - Check thresholds and generate alerts
  - Node 5: `AlertBulkCreateNode` - Create alert records
  - Node 6: Update last_triggered on thresholds
- [x] Support both lt (less than) and gt (greater than) comparisons
- [x] Support gte and lte comparisons
- [x] Implement cooldown period enforcement
- [x] Severity determination (warning vs critical)
- [x] Implement `build_batch_alert_check_workflow()` for all users
- [x] Implement `build_alert_cleanup_workflow()` for old alert removal

### 3. Peer Benchmarking Workflow
- [x] Create `src/arc/workflows/analytics/benchmarks.py`
- [x] Implement `build_peer_benchmark_workflow()`:
  - Node 1: `PeerGroupReadNode` - Get peer group definition
  - Node 2: `SecurityRatioListNode` - Get security ratios
  - Node 3: `SecurityRatioListNode` - Get peer security ratios
  - Node 4: `PythonCodeNode` - Calculate percentiles and comparisons
  - Node 5: `SecurityRatioBulkUpdateNode` - Update peer_percentile
- [x] Implement `build_batch_peer_benchmark_workflow()` for all in group
- [x] Implement `build_sector_benchmark_workflow()` for sector-based benchmarking
- [x] Calculate:
  - Percentile rank within peer group
  - Peer median, mean, min, max
  - Standard deviation
  - Comparison vs median
  - Rank (considering lower-is-better vs higher-is-better)

### 4. Workflow Registry
- [x] Create `src/arc/workflows/analytics/__init__.py`
- [x] Export all analytics workflows (9 total)

### 5. Tests
- [x] 53 comprehensive unit tests covering:
  - Workflow building with various parameters
  - Ratio calculation logic and formulas
  - Threshold breach detection
  - Cooldown enforcement
  - Percentile and rank calculations
  - Statistics computation
  - Parameter validation

### 6. Documentation
- [x] Created `src/arc/docs/developers/10-analytics-workflows.md`

---

## Acceptance Criteria

- [x] All 25 ratios calculated correctly
- [x] Safe division prevents errors on missing data
- [x] Bulk upsert for performance
- [x] Threshold alerts generated for breaches
- [x] Cooldown periods enforced
- [x] Percentile calculations accurate
- [x] Unit test: Each ratio calculation
- [x] Unit test: Threshold breach detection
- [x] Unit test: Percentile math
- [x] 53 tests passing (100% pass rate)

---

## Implementation Summary

### Files Created
- `src/arc/workflows/analytics/__init__.py` - Package exports
- `src/arc/workflows/analytics/ratios.py` - Ratio calculation workflows (791 lines)
- `src/arc/workflows/analytics/alerts.py` - Threshold alert workflows
- `src/arc/workflows/analytics/benchmarks.py` - Peer benchmark workflows (986 lines)
- `tests/unit/workflows/test_analytics_workflows.py` - 53 unit tests
- `src/arc/docs/developers/10-analytics-workflows.md` - Developer documentation

### Exported Workflows (9 total)
1. `build_ratio_calculation_workflow()` - Calculate 25+ financial ratios
2. `build_valuation_ratio_workflow()` - Convenience wrapper for valuation ratios
3. `build_fundamental_ratio_workflow()` - Convenience wrapper for fundamental ratios
4. `build_threshold_alert_workflow()` - Check thresholds for a user
5. `build_batch_alert_check_workflow()` - Check all users' thresholds
6. `build_alert_cleanup_workflow()` - Clean up old acknowledged alerts
7. `build_peer_benchmark_workflow()` - Benchmark single security against peers
8. `build_batch_peer_benchmark_workflow()` - Benchmark all securities in group
9. `build_sector_benchmark_workflow()` - Dynamic sector-based benchmarking

---

## Technical Notes

- Use `Decimal` for all calculations to avoid floating point errors
- Store ratios as string decimals
- Handle edge cases: negative equity, zero denominators
- Composite IDs: `{security_id}_{calculation_date}_{ratio_name}`
- Rank calculation considers lower-is-better for debt/valuation ratios
