# TODO-BE-008: Portfolio Workflows

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-003

---

## Objective

Implement Kailash workflows for portfolio NAV calculation, health scans, and valuation.

---

## Tasks

### 1. NAV Calculation Workflow
- [ ] Create `src/arc/workflows/portfolio/valuation.py`
- [ ] Implement `create_nav_calculation_workflow()`:
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
  - Node 8: `PythonCodeNode` - Update holding current values
- [ ] Support multi-currency portfolios (FX conversion)
- [ ] Handle missing prices gracefully
- [ ] Calculate all return periods (daily, MTD, QTD, YTD, inception)

### 2. Portfolio Health Scan Workflow
- [ ] Create `src/arc/workflows/portfolio/health_scan.py`
- [ ] Implement `create_portfolio_health_scan_workflow()`:
  - Node 1: `PortfolioReadNode` - Get portfolio
  - Node 2: `HoldingListNode` - Get holdings
  - Node 3: `AlertThresholdListNode` - Get user thresholds
  - Node 4: `SecurityRatioListNode` - Get ratios for holdings
  - Node 5: `PythonCodeNode` - Calculate health scores:
    - Check each ratio against thresholds
    - Calculate per-class scores (0-100)
    - Calculate overall score (weighted average)
    - Identify issues by severity
- [ ] Implement scoring algorithm:
  - -15 points per critical issue
  - -5 points per warning issue
- [ ] Weights: liquidity 20%, profitability 25%, utilization 15%, leverage 25%, valuation 15%

**Outputs**:
```python
{
    "overall_score": int,  # 0-100
    "ratio_class_scores": {
        "liquidity": {"score": int, "issues": [...]},
        "profitability": {...},
        ...
    },
    "issues": [
        {
            "security_id": str,
            "ratio_name": str,
            "severity": str,
            "current_value": float,
            "threshold": float
        }
    ],
    "summary": str
}
```

### 3. Portfolio Rebalance Workflow (Skeleton)
- [ ] Create `src/arc/workflows/portfolio/rebalance.py`
- [ ] Implement skeleton for `create_rebalance_workflow()`:
  - Calculate current weights
  - Compare to target weights
  - Generate rebalance trades
- [ ] (Full implementation in later phase)

### 4. Workflow Registry
- [ ] Create `src/arc/workflows/portfolio/__init__.py`
- [ ] Export all portfolio workflows

---

## Acceptance Criteria

- [ ] Accurate NAV calculation
- [ ] Multi-currency support with FX conversion
- [ ] Return calculations for all periods
- [ ] Missing price handling (use last available)
- [ ] Health score 0-100 with clear algorithm
- [ ] Per-class breakdown
- [ ] Issue severity classification
- [ ] Default thresholds for unconfigured users
- [ ] Unit test: NAV math
- [ ] Unit test: Return calculations
- [ ] Unit test: Score calculation
- [ ] Integration test: Full valuation
- [ ] Integration test: Full health scan

---

## Technical Notes

- Valuations should be idempotent (re-running for same date updates existing)
- Use `is_final=False` initially, set `True` after market close reconciliation
- Health scan can be triggered on-demand or after ratio recalculation
- Consider caching NAV calculations for performance
