# Analytics Workflows

This guide covers the analytics workflows for calculating financial ratios, monitoring thresholds, and benchmarking securities against peers.

## Overview

The ARC platform uses Kailash SDK workflows for analytics calculations:

- **Ratio Calculation**: Calculate 25+ financial ratios across 5 classes
- **Threshold Alerts**: Monitor ratios against user-defined thresholds
- **Peer Benchmarks**: Compare securities against peer groups and sectors

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AnalyticsService                           │
│  - calculate_ratios()                                           │
│  - check_alerts()                                               │
│  - calculate_peer_benchmarks()                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Ratio Calc    │ │ Threshold     │ │ Peer          │
    │ Workflows     │ │ Alert Wfs     │ │ Benchmark Wfs │
    └───────────────┘ └───────────────┘ └───────────────┘
```

## Financial Ratio Calculation

### Ratio Classes and Formulas

**Liquidity Ratios (4):**
| Ratio | Formula |
|-------|---------|
| Current Ratio | Current Assets / Current Liabilities |
| Quick Ratio | (Current Assets - Inventory) / Current Liabilities |
| Cash Ratio | Cash / Current Liabilities |
| Working Capital Ratio | (Current Assets - Current Liabilities) / Total Assets |

**Profitability Ratios (6):**
| Ratio | Formula |
|-------|---------|
| ROE | Net Income / Total Equity |
| ROA | Net Income / Total Assets |
| ROIC | Net Income / (Total Equity + Long-term Debt) |
| Profit Margin | Net Income / Revenue |
| Operating Margin | Operating Income / Revenue |
| Gross Margin | Gross Profit / Revenue |

**Leverage Ratios (4):**
| Ratio | Formula |
|-------|---------|
| Debt to Equity | Total Debt / Total Equity |
| Debt Ratio | Total Liabilities / Total Assets |
| Equity Multiplier | Total Assets / Total Equity |
| Debt to EBITDA | Total Debt / EBITDA |

**Efficiency Ratios (4):**
| Ratio | Formula |
|-------|---------|
| Asset Turnover | Revenue / Total Assets |
| Inventory Turnover | Cost of Revenue / Inventory |
| Receivables Turnover | Revenue / Accounts Receivable |
| Fixed Asset Turnover | Revenue / Net Fixed Assets |

**Valuation Ratios (7):**
| Ratio | Formula |
|-------|---------|
| P/E Ratio | Market Cap / Net Income |
| P/B Ratio | Market Cap / Book Value |
| P/S Ratio | Market Cap / Revenue |
| EV/EBITDA | Enterprise Value / EBITDA |
| EV/Revenue | Enterprise Value / Revenue |
| Dividend Yield | Dividends Per Share / Price |
| Payout Ratio | Dividends / Net Income |

### Building the Workflow

```python
from arc.workflows.analytics import build_ratio_calculation_workflow
from kailash.runtime import AsyncLocalRuntime

# Calculate all ratios for specific securities
workflow = build_ratio_calculation_workflow(
    security_ids=["AAPL", "MSFT", "GOOGL"],
    calculation_date="2024-12-31",
    ratio_classes=None,  # All classes
    batch_size=1000
)

# Execute
runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

# Access results
summary = results["compile_summary"]["result"]
print(f"Ratios calculated: {summary['ratios_calculated']}")
print(f"Ratios saved: {summary['ratios_saved']}")
print(f"Status: {summary['status']}")
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security_ids` | `list[str]` | `None` | Securities to analyze (None = all active) |
| `calculation_date` | `str` | `None` | Calculation date (YYYY-MM-DD, None = today) |
| `ratio_classes` | `list[str]` | `None` | Ratio classes to calculate (None = all) |
| `batch_size` | `int` | `1000` | Records per batch for bulk ops |

### Convenience Wrappers

```python
from arc.workflows.analytics import (
    build_valuation_ratio_workflow,
    build_fundamental_ratio_workflow
)

# Calculate only valuation ratios (P/E, P/B, etc.)
workflow = build_valuation_ratio_workflow(
    security_ids=["AAPL"],
    calculation_date="2024-12-31"
)

# Calculate fundamental ratios (liquidity, profitability, leverage, efficiency)
workflow = build_fundamental_ratio_workflow(
    security_ids=["AAPL"],
    calculation_date="2024-12-31"
)
```

### Workflow Steps

1. **Get Fundamentals**: Query latest fundamentals for securities
2. **Get Price Data**: Query latest prices for market cap calculation
3. **Calculate Ratios**: Compute all ratios using Decimal math
4. **Save Ratios**: BulkUpsert ratio records with composite IDs
5. **Compile Summary**: Return calculation results

### Composite ID Format

Ratios use composite IDs: `{security_id}_{calculation_date}_{ratio_name}`

Example: `AAPL_2024-12-31_pe_ratio`

## Threshold Alert Workflows

### Building the Workflow

```python
from arc.workflows.analytics import build_threshold_alert_workflow

# Check thresholds for a specific user
workflow = build_threshold_alert_workflow(
    user_id="user-123",
    security_ids=["AAPL", "MSFT"],  # Optional filter
    batch_size=500
)

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Thresholds checked: {summary['thresholds_checked']}")
print(f"Alerts created: {summary['alerts_created']}")
```

### Batch Alert Check

Check all users' thresholds:

```python
from arc.workflows.analytics import build_batch_alert_check_workflow

workflow = build_batch_alert_check_workflow(
    check_date="2024-12-31"
)

results, run_id = await runtime.execute_workflow_async(workflow.build())
```

### Alert Cleanup

Remove old, acknowledged alerts:

```python
from arc.workflows.analytics import build_alert_cleanup_workflow

workflow = build_alert_cleanup_workflow(
    retention_days=90,  # Delete acknowledged alerts older than 90 days
    batch_size=1000
)

results, run_id = await runtime.execute_workflow_async(workflow.build())
```

### Threshold Configuration

Thresholds are defined in `ThresholdAlert` model:

```python
{
    "id": "threshold-001",
    "user_id": "user-123",
    "security_id": "AAPL",
    "ratio_name": "pe_ratio",
    "threshold_value": "30.0",
    "comparison": "gt",  # gt, lt, gte, lte
    "severity": "warning",  # warning, critical
    "cooldown_hours": 24,  # Don't re-alert within 24 hours
    "active": True
}
```

### Comparison Operators

| Operator | Description | Alert When |
|----------|-------------|------------|
| `gt` | Greater than | ratio > threshold |
| `lt` | Less than | ratio < threshold |
| `gte` | Greater or equal | ratio >= threshold |
| `lte` | Less or equal | ratio <= threshold |

### Cooldown Enforcement

The workflow automatically enforces cooldowns:

1. Check if threshold was recently triggered
2. If triggered within `cooldown_hours`, skip alert
3. If cooldown expired, create new alert
4. Update `last_triggered_at` on threshold

## Peer Benchmark Workflows

### Single Security Benchmark

```python
from arc.workflows.analytics import build_peer_benchmark_workflow

# Benchmark AAPL against its peer group
workflow = build_peer_benchmark_workflow(
    security_id="AAPL",
    peer_group_id="tech_mega_cap",
    ratio_names=["pe_ratio", "roe", "profit_margin"],  # Optional filter
    calculation_date="2024-12-31",
    update_ratios=True  # Update SecurityRatio with peer_percentile
)

results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
for benchmark in summary["benchmarks"]:
    print(f"{benchmark['ratio_name']}: {benchmark['percentile']}th percentile")
    print(f"  Rank: {benchmark['rank']} of {benchmark['rank_of']}")
```

### Batch Peer Benchmark

Benchmark all securities in a peer group:

```python
from arc.workflows.analytics import build_batch_peer_benchmark_workflow

workflow = build_batch_peer_benchmark_workflow(
    peer_group_id="tech_mega_cap",
    ratio_names=None,  # All ratios
    calculation_date="2024-12-31"
)

results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Securities benchmarked: {summary['securities_in_group']}")
print(f"Ratios analyzed: {summary['ratios_analyzed']}")
print(f"Records updated: {summary['ratio_records_updated']}")
```

### Sector Benchmark

Dynamic benchmarking by sector:

```python
from arc.workflows.analytics import build_sector_benchmark_workflow

workflow = build_sector_benchmark_workflow(
    sector="Information Technology",
    ratio_names=["pe_ratio", "roe"],
    calculation_date="2024-12-31"
)

results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Sector: {summary['sector']}")
print(f"Securities: {summary['securities_in_sector']}")

# Sector-wide statistics
for ratio_name, stats in summary["sector_statistics"].items():
    print(f"{ratio_name}: mean={stats['mean']}, median={stats['median']}")
```

### Benchmark Output

Each benchmark result includes:

```python
{
    "ratio_name": "pe_ratio",
    "ratio_class": "valuation",
    "target_value": "25.5",
    "percentile": 75,          # 75th percentile
    "rank": 3,                  # 3rd place
    "rank_of": 12,              # Out of 12 peers
    "peer_count": 11,           # Excluding target
    "peer_stats": {
        "count": 11,
        "min": "12.5",
        "max": "45.2",
        "mean": "28.3",
        "median": "26.1",
        "stdev": "8.7"
    },
    "vs_mean": "-2.8",         # Below mean by 2.8
    "vs_median": "-0.6"        # Below median by 0.6
}
```

### Rank Calculation

Ranking considers whether lower or higher is better:

**Lower is Better** (rank 1 = lowest value):
- P/E Ratio, P/B Ratio, P/S Ratio
- EV/EBITDA, EV/Revenue
- Debt to Equity, Debt Ratio, Debt to EBITDA

**Higher is Better** (rank 1 = highest value):
- All profitability ratios (ROE, ROA, margins)
- All liquidity ratios
- All efficiency ratios

## Workflow Exports

All analytics workflows are exported from the main package:

```python
from arc.workflows import (
    # Ratio calculation
    build_ratio_calculation_workflow,
    build_valuation_ratio_workflow,
    build_fundamental_ratio_workflow,

    # Threshold alerts
    build_threshold_alert_workflow,
    build_batch_alert_check_workflow,
    build_alert_cleanup_workflow,

    # Peer benchmarks
    build_peer_benchmark_workflow,
    build_batch_peer_benchmark_workflow,
    build_sector_benchmark_workflow,
)
```

## Testing

Run analytics workflow tests:

```bash
uv run pytest tests/unit/workflows/test_analytics_workflows.py -v
```

Test coverage includes:
- Workflow building with various parameters
- Ratio calculation logic (safe division, formulas)
- Threshold breach detection
- Cooldown enforcement
- Percentile and rank calculations
- Statistics computation

## Best Practices

### 1. Use Appropriate Batch Sizes

```python
# Standard ratio calculation
build_ratio_calculation_workflow(batch_size=1000)

# Benchmark with many peers
build_batch_peer_benchmark_workflow(batch_size=500)

# Alert cleanup (simple operations)
build_alert_cleanup_workflow(batch_size=2000)
```

### 2. Handle Zero Denominators

All ratio calculations use safe division:

```python
def safe_divide(numerator, denominator):
    """Divide with zero protection, returns None if denominator is 0."""
    if denominator is None or denominator == 0:
        return None
    return Decimal(str(numerator)) / Decimal(str(denominator))
```

### 3. Schedule Analytics Appropriately

```python
# After fundamentals sync - recalculate ratios
await services.sync.sync_fundamentals(
    security_ids=ids,
    trigger_ratio_calc=True  # Automatic ratio calculation
)

# Daily alert check (after market close)
workflow = build_batch_alert_check_workflow(
    check_date=today.strftime("%Y-%m-%d")
)

# Weekly peer benchmarking
workflow = build_batch_peer_benchmark_workflow(
    peer_group_id="tech_mega_cap",
    calculation_date=today.strftime("%Y-%m-%d")
)
```

### 4. Monitor Alert Volume

```python
result = await runtime.execute_workflow_async(workflow.build())
summary = result["compile_summary"]["result"]

if summary["alerts_created"] > 100:
    logger.warning(
        f"High alert volume: {summary['alerts_created']} alerts created. "
        "Consider adjusting threshold sensitivity."
    )
```

## Troubleshooting

### Common Issues

**"No fundamentals found for security"**
- Ensure fundamentals have been synced before ratio calculation
- Check `sync_fundamentals()` was run successfully

**"Peer group has no securities"**
- Verify peer group exists with `security_ids` populated
- Check that securities in group have ratio data

**"All ratios are None"**
- Check fundamentals data has required fields (revenue, net_income, etc.)
- Verify price data exists for valuation ratios

### Debug Mode

```python
runtime = AsyncLocalRuntime(debug=True)
results, run_id = await runtime.execute_workflow_async(workflow.build())

# Results include detailed execution info
print(f"Run ID: {run_id}")
```

## Related Documentation

- [06-analytics-service.md](06-analytics-service.md) - AnalyticsService implementation
- [09-sync-workflows.md](09-sync-workflows.md) - Data sync workflows (fundamentals)
- [01-models.md](01-models.md) - SecurityRatio, ThresholdAlert models
