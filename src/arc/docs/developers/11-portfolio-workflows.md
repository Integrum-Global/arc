# Portfolio Workflows

This guide covers the portfolio management workflows for NAV calculation, health scanning, and rebalance analysis.

## Overview

The ARC platform uses Kailash SDK workflows for portfolio operations:

- **NAV Calculation**: Calculate portfolio Net Asset Value and returns
- **Health Scan**: Analyze portfolio holdings against financial thresholds
- **Rebalance Analysis**: Compare current weights to target allocation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PortfolioService                            │
│  - calculate_nav()                                              │
│  - get_health_score()                                           │
│  - analyze_rebalance()                                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ NAV Calc      │ │ Health Scan   │ │ Rebalance     │
    │ Workflow      │ │ Workflow      │ │ Workflow      │
    └───────────────┘ └───────────────┘ └───────────────┘
```

## NAV Calculation Workflow

### Building the Workflow

```python
from arc.workflows.portfolio import build_nav_calculation_workflow
from kailash.runtime import AsyncLocalRuntime

# Calculate NAV for specific portfolios
workflow = build_nav_calculation_workflow(
    portfolio_ids=["port-001", "port-002"],
    valuation_date="2024-12-31",
    base_currency="USD",
    batch_size=1000
)

# Execute
runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

# Access results
summary = results["compile_summary"]["result"]
print(f"Portfolios valued: {summary['portfolios_valued']}")
print(f"Valuations saved: {summary['valuations_saved']}")
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `portfolio_ids` | `list[str]` | `None` | Portfolios to value (None = all active) |
| `valuation_date` | `str` | `None` | Valuation date (YYYY-MM-DD, None = today) |
| `base_currency` | `str` | `"USD"` | Base currency for multi-currency portfolios |
| `batch_size` | `int` | `1000` | Records per batch for bulk ops |

### Workflow Steps

1. **Get Portfolios**: Query portfolios to value
2. **Get Holdings**: Get all active holdings with quantities
3. **Get Prices**: Get latest prices for all securities
4. **Get Cash**: Get cash balances by currency
5. **Get Previous Valuations**: For return calculations
6. **Calculate NAV**: Compute NAV and returns
7. **Save Valuations**: Upsert PortfolioValuation records
8. **Update Holdings**: Update current_value on holdings

### NAV Calculation

```
Total NAV = Securities Value + Cash Value

Securities Value = Σ (quantity × price × fx_rate)
Cash Value = Σ (balance × fx_rate)
```

### Return Periods

The workflow calculates returns for multiple periods:

| Period | Description |
|--------|-------------|
| `daily_return` | Day-over-day change |
| `mtd_return` | Month-to-date |
| `qtd_return` | Quarter-to-date |
| `ytd_return` | Year-to-date |
| `inception_return` | Since portfolio inception |

### Multi-Currency Support

```python
# FX conversion is automatic
workflow = build_nav_calculation_workflow(
    portfolio_ids=["global-port"],
    base_currency="EUR"  # Convert all values to EUR
)
```

### Single Portfolio Convenience

```python
from arc.workflows.portfolio import build_portfolio_valuation_workflow

# Convenience wrapper for single portfolio
workflow = build_portfolio_valuation_workflow(
    portfolio_id="port-001",
    valuation_date="2024-12-31"
)
```

## Health Scan Workflow

### Building the Workflow

```python
from arc.workflows.portfolio import build_portfolio_health_scan_workflow

# Scan portfolio health
workflow = build_portfolio_health_scan_workflow(
    portfolio_id="port-001",
    user_id="user-123",  # Optional: for custom thresholds
    use_default_thresholds=True
)

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

# Access results
result = results["compile_results"]["result"]
print(f"Overall Score: {result['overall_score']}/100")
print(f"Issues Found: {result['issue_count']}")
print(f"Summary: {result['summary']}")
```

### Health Score Algorithm

**Starting Score**: 100 points

**Deductions**:
- Critical issue: -15 points
- Warning issue: -5 points

**Minimum Score**: 0 points

### Ratio Class Weights

| Class | Weight | Description |
|-------|--------|-------------|
| Liquidity | 20% | Current ratio, quick ratio |
| Profitability | 25% | ROE, ROA, margins |
| Leverage | 25% | Debt ratios |
| Efficiency | 15% | Turnover ratios |
| Valuation | 15% | P/E, P/B ratios |

### Default Thresholds

**Higher is Better** (check min):
- `current_ratio`: min 1.0, warning 1.5, target 2.0
- `quick_ratio`: min 0.5, warning 1.0, target 1.5
- `roe`: min 5%, warning 10%, target 15%
- `roa`: min 2%, warning 5%, target 8%
- `profit_margin`: min 3%, warning 8%, target 15%

**Lower is Better** (check max):
- `debt_to_equity`: max 2.0, warning 1.5, target 1.0
- `debt_ratio`: max 0.7, warning 0.5, target 0.4
- `pe_ratio`: max 40, warning 25, target 15
- `pb_ratio`: max 5.0, warning 3.0, target 2.0

### Output Structure

```python
{
    "overall_score": 75,  # 0-100
    "ratio_class_scores": {
        "liquidity": {"score": 85, "issue_count": 1, "issues": [...]},
        "profitability": {"score": 90, "issue_count": 0, "issues": []},
        "leverage": {"score": 55, "issue_count": 3, "issues": [...]},
        "efficiency": {"score": 100, "issue_count": 0, "issues": []},
        "valuation": {"score": 60, "issue_count": 2, "issues": [...]},
    },
    "issues": [
        {
            "security_id": "AAPL",
            "ratio_name": "pe_ratio",
            "ratio_class": "valuation",
            "current_value": 32.5,
            "threshold": 25.0,
            "severity": "warning",
            "message": "pe_ratio (32.50) above warning level (25.0)"
        }
    ],
    "summary": "Good portfolio health with 6 warnings."
}
```

### Batch Health Scan

```python
from arc.workflows.portfolio import build_batch_health_scan_workflow

# Scan multiple portfolios
workflow = build_batch_health_scan_workflow(
    portfolio_ids=["port-001", "port-002", "port-003"]
)

results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Average Score: {summary['average_health_score']}")
print(f"Critical Issues: {summary['total_critical_issues']}")
```

## Rebalance Analysis Workflow

### Building the Workflow

```python
from arc.workflows.portfolio import build_rebalance_analysis_workflow

# Analyze rebalancing needs
workflow = build_rebalance_analysis_workflow(
    portfolio_id="port-001",
    target_allocation={
        "AAPL": 25.0,
        "MSFT": 25.0,
        "GOOGL": 25.0,
        "cash": 25.0,
    },
    tolerance_pct=5.0,  # 5% tolerance band
    min_trade_value=100.0  # Minimum $100 trades
)

results, run_id = await runtime.execute_workflow_async(workflow.build())

result = results["compile_results"]["result"]
print(f"Needs Rebalancing: {result['needs_rebalancing']}")
print(f"Recommendations: {result['recommendation_count']}")
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `portfolio_id` | `str` | Required | Portfolio to analyze |
| `target_allocation` | `dict` | `None` | Target weights (None = use portfolio's stored weights) |
| `tolerance_pct` | `float` | `5.0` | Tolerance band percentage |
| `min_trade_value` | `float` | `100.0` | Minimum trade value to recommend |

### Drift Calculation

```
Drift = Current Weight - Target Weight

Within Tolerance: |Drift| <= tolerance_pct
```

### Output Structure

```python
{
    "portfolio_value": 125000.00,
    "current_weights": {
        "AAPL": 30.0,
        "MSFT": 20.0,
        "GOOGL": 28.0,
        "cash": 22.0
    },
    "target_weights": {
        "AAPL": 25.0,
        "MSFT": 25.0,
        "GOOGL": 25.0,
        "cash": 25.0
    },
    "drift_analysis": [
        {
            "asset_id": "AAPL",
            "target_weight": 25.0,
            "current_weight": 30.0,
            "drift": 5.0,
            "within_tolerance": False
        },
        # ... more assets
    ],
    "needs_rebalancing": True,
    "recommendations": [
        {
            "asset_id": "AAPL",
            "action": "sell",
            "trade_value": 6250.0,
            "reason": "AAPL is 5.0% overweight"
        },
        # ... more recommendations
    ]
}
```

## Workflow Exports

All portfolio workflows are exported from the main package:

```python
from arc.workflows import (
    # NAV calculation
    build_nav_calculation_workflow,
    build_portfolio_valuation_workflow,
    # Health scan
    build_portfolio_health_scan_workflow,
    build_batch_health_scan_workflow,
    # Rebalance
    build_rebalance_analysis_workflow,
)
```

## Testing

Run portfolio workflow tests:

```bash
uv run pytest tests/unit/workflows/test_portfolio_workflows.py -v
```

Test coverage includes:
- Workflow building with various parameters
- NAV calculation logic (values, returns, FX)
- Health score calculation (deductions, weights)
- Rebalance analysis (drift, recommendations)
- Parameter validation

## Best Practices

### 1. Schedule NAV Calculations

```python
# Daily NAV calculation after market close
workflow = build_nav_calculation_workflow(
    valuation_date=today.strftime("%Y-%m-%d")
)

# Mark as final after reconciliation
```

### 2. Handle Missing Prices

The workflow uses the last available price if current price is missing:

```python
# Latest prices are used automatically
# Missing prices don't cause failures
```

### 3. Use Appropriate Tolerances

```python
# Tighter tolerance for actively managed portfolios
build_rebalance_analysis_workflow(
    portfolio_id="active-port",
    tolerance_pct=3.0  # Stricter
)

# Wider tolerance for passive portfolios
build_rebalance_analysis_workflow(
    portfolio_id="passive-port",
    tolerance_pct=10.0  # More relaxed
)
```

### 4. Monitor Health Trends

```python
# Regular health scans
workflow = build_batch_health_scan_workflow()

result = await runtime.execute_workflow_async(workflow.build())

# Alert on declining health
for portfolio in result["portfolio_results"]:
    if portfolio["overall_score"] < 50:
        alert_portfolio_manager(portfolio)
```

## Troubleshooting

### Common Issues

**"No holdings found for portfolio"**
- Verify portfolio has active holdings
- Check `deleted_at` is null on holdings

**"Missing price for security"**
- Ensure price sync has run for the securities
- Check security IDs match between holdings and prices

**"Health score is 0"**
- Too many critical issues (-15 each)
- Review threshold configurations

### Debug Mode

```python
runtime = AsyncLocalRuntime(debug=True)
results, run_id = await runtime.execute_workflow_async(workflow.build())
```

## Related Documentation

- [05-portfolio-service.md](05-portfolio-service.md) - PortfolioService implementation
- [09-sync-workflows.md](09-sync-workflows.md) - Price data synchronization
- [10-analytics-workflows.md](10-analytics-workflows.md) - Ratio calculation workflows
