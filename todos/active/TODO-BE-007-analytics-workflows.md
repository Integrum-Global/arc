# TODO-BE-007: Analytics Workflows

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-005

---

## Objective

Implement Kailash workflows for financial ratio calculation, threshold alerting, and peer benchmarking.

---

## Tasks

### 1. Financial Ratio Calculation Workflow
- [ ] Create `src/arc/workflows/analytics/ratios.py`
- [ ] Implement `create_ratio_calculation_workflow()`:
  - Node 1: `SecurityListNode` - Get securities with recent fundamentals
  - Node 2: `CompanyFundamentalsListNode` - Get latest fundamentals
  - Node 3: `PriceHistoryListNode` - Get latest prices (for market-based ratios)
  - Node 4: `PythonCodeNode` - Calculate all 25 ratios
  - Node 5: `SecurityRatioBulkUpsertNode` - Save ratios
- [ ] Implement all 25 ratios across 5 classes:
  - **Liquidity** (5): current_ratio, quick_ratio, cash_ratio, operating_cash_flow_ratio, working_capital_ratio
  - **Profitability** (5): roe, roa, gross_margin, operating_margin, net_margin, ebitda_margin
  - **Leverage** (5): debt_equity, debt_ebitda, interest_coverage, debt_assets, equity_multiplier
  - **Utilization** (5): asset_turnover, inventory_turnover, receivables_turnover, payables_turnover, fixed_asset_turnover
  - **Valuation** (5): pe_ratio, pb_ratio, ps_ratio, ev_ebitda, dividend_yield
- [ ] Implement safe division (handle divide by zero)
- [ ] Handle null/missing data gracefully

### 2. Threshold Alert Check Workflow
- [ ] Create `src/arc/workflows/analytics/alerts.py`
- [ ] Implement `create_threshold_alert_workflow()`:
  - Node 1: `AlertThresholdListNode` - Get active thresholds
  - Node 2: `HoldingListNode` - Get holdings for each user's portfolios
  - Node 3: `SecurityRatioListNode` - Get latest ratios
  - Node 4: `PythonCodeNode` - Check thresholds and generate alerts
  - Node 5: `AlertBulkCreateNode` - Create alert records
  - Node 6: `PythonCodeNode` - Update last_triggered on thresholds
  - Node 7: `PythonCodeNode` - Group alerts and trigger notifications
- [ ] Support both lt (less than) and gt (greater than) comparisons
- [ ] Implement cooldown period enforcement
- [ ] Severity determination (warning vs critical)

### 3. Peer Benchmarking Workflow
- [ ] Create `src/arc/workflows/analytics/benchmarks.py`
- [ ] Implement `create_peer_benchmark_workflow()`:
  - Node 1: `PeerGroupReadNode` - Get peer group definition
  - Node 2: `SecurityRatioListNode` - Get security ratios
  - Node 3: `SecurityRatioListNode` - Get peer security ratios
  - Node 4: `PythonCodeNode` - Calculate percentiles and comparisons
- [ ] Calculate:
  - Percentile rank within peer group
  - Peer median, mean, min, max
  - Standard deviation
  - Comparison vs median

### 4. Workflow Registry
- [ ] Create `src/arc/workflows/analytics/__init__.py`
- [ ] Export all analytics workflows

---

## Acceptance Criteria

- [ ] All 25 ratios calculated correctly
- [ ] Safe division prevents errors on missing data
- [ ] Bulk upsert for performance
- [ ] Threshold alerts generated for breaches
- [ ] Cooldown periods enforced
- [ ] Notifications grouped by user
- [ ] Percentile calculations accurate
- [ ] Unit test: Each ratio calculation
- [ ] Unit test: Threshold breach detection
- [ ] Unit test: Percentile math
- [ ] Integration test: Full ratio calculation
- [ ] Integration test: Alert generation

---

## Ratio Formulas

| Ratio | Formula |
|-------|---------|
| current_ratio | Current Assets / Current Liabilities |
| quick_ratio | (Current Assets - Inventory) / Current Liabilities |
| roe | Net Income / Total Equity |
| roa | Net Income / Total Assets |
| debt_equity | Total Debt / Total Equity |
| pe_ratio | Market Cap / Net Income |
| ev_ebitda | (Market Cap + Debt - Cash) / EBITDA |

---

## Technical Notes

- Use `Decimal` for all calculations to avoid floating point errors
- Store ratios as string decimals
- Handle edge cases: negative equity, zero denominators
- Trend direction: compare current vs 3m/6m/1y ago values
