# Data Sync Workflows

This guide covers the sync workflows for fetching and storing market data from external APIs.

## Overview

The ARC platform uses Kailash SDK workflows to sync data from external providers like EODHD:

- **Price Sync**: Historical and real-time price data for securities
- **Bulk Price Sync**: End-of-day prices for entire exchanges
- **Fundamentals Sync**: Company financial statements and metrics
- **Ratio Calculation**: Automated financial ratio computation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SyncService                               │
│  - sync_prices()                                                │
│  - sync_exchange_prices()                                        │
│  - sync_fundamentals()                                          │
│  - full_sync()                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Price Sync    │ │ Bulk Price    │ │ Fundamentals  │
    │ Workflow      │ │ Workflow      │ │ Workflow      │
    └───────────────┘ └───────────────┘ └───────────────┘
```

## Sync Service

The `SyncService` provides a high-level API for all sync operations:

```python
from arc.services import SyncService, create_services
from arc.models.database import db

# Create services
services = create_services(db)

# Sync prices for specific securities
result = await services.sync.sync_prices(
    security_ids=["AAPL", "MSFT"],
    start_date="2024-01-01",
    end_date="2024-12-31"
)

# Sync all prices for an exchange
result = await services.sync.sync_exchange_prices(
    exchange="US",
    date="2024-12-31"
)

# Sync fundamentals
result = await services.sync.sync_fundamentals(
    security_ids=["AAPL"],
    sync_annual=True,
    sync_quarterly=True,
    trigger_ratio_calc=True
)

# Full sync (prices + fundamentals)
result = await services.sync.full_sync(
    security_ids=["AAPL", "MSFT"]
)
```

## Price Sync Workflow

### Building the Workflow

```python
from arc.workflows.sync import build_eodhd_price_sync_workflow
from kailash.runtime import AsyncLocalRuntime

# Build workflow for specific securities
workflow = build_eodhd_price_sync_workflow(
    security_ids=["AAPL", "MSFT", "GOOGL"],
    start_date="2024-01-01",
    end_date="2024-12-31",
    batch_size=1000
)

# Execute
runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

# Access results
summary = results["compile_summary"]["result"]
print(f"Prices saved: {summary['prices_saved']}")
print(f"Status: {summary['status']}")
```

### Workflow Steps

1. **Get Securities**: Either use provided IDs or query active securities from database
2. **Fetch Prices**: Call EODHD API for historical prices
3. **Transform Prices**: Convert to PriceHistory format with composite IDs
4. **Save Prices**: BulkUpsert to database with conflict resolution
5. **Update Securities**: Update `last_price_date` on each security
6. **Compile Summary**: Return sync results

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security_ids` | `list[str]` | `None` | Securities to sync (None = all active) |
| `start_date` | `str` | `None` | Start date (YYYY-MM-DD, None = last 30 days) |
| `end_date` | `str` | `None` | End date (YYYY-MM-DD, None = today) |
| `batch_size` | `int` | `1000` | Records per batch for bulk ops |

## Bulk Price Sync Workflow

For end-of-day syncs of entire exchanges:

```python
from arc.workflows.sync import build_eodhd_bulk_price_sync_workflow

# Sync all US exchange prices
workflow = build_eodhd_bulk_price_sync_workflow(
    exchange="US",
    date="2024-12-31",
    batch_size=2000
)

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Matched/Saved: {summary['matched_saved']}")
print(f"Unmatched/Skipped: {summary['unmatched_skipped']}")
```

### Supported Exchanges

- `US` - US exchanges (NYSE, NASDAQ)
- `LSE` - London Stock Exchange
- `TO` - Toronto Stock Exchange
- `PA` - Euronext Paris
- `XETRA` - Frankfurt Stock Exchange
- `HK` - Hong Kong Stock Exchange
- `AU` - Australian Securities Exchange

## Fundamentals Sync Workflow

### Building the Workflow

```python
from arc.workflows.sync import build_fundamentals_sync_workflow

# Sync annual and quarterly fundamentals with ratio calculation
workflow = build_fundamentals_sync_workflow(
    security_ids=["AAPL", "MSFT"],
    sync_annual=True,
    sync_quarterly=True,
    trigger_ratio_calc=True,
    batch_size=500
)

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())

summary = results["compile_summary"]["result"]
print(f"Fundamentals saved: {summary['fundamentals_saved']}")
print(f"Ratios calculated: {summary['ratios_calculated']}")
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security_ids` | `list[str]` | `None` | Securities to sync (None = all equities) |
| `sync_annual` | `bool` | `True` | Sync annual statements |
| `sync_quarterly` | `bool` | `True` | Sync quarterly statements |
| `batch_size` | `int` | `500` | Records per batch |
| `trigger_ratio_calc` | `bool` | `True` | Calculate financial ratios |

### Financial Ratios Calculated

**Liquidity Ratios:**
- Current Ratio = Current Assets / Current Liabilities
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities

**Profitability Ratios:**
- ROE (Return on Equity) = Net Income / Total Equity
- ROA (Return on Assets) = Net Income / Total Assets
- Profit Margin = Net Income / Revenue
- Operating Margin = Operating Income / Revenue

**Leverage Ratios:**
- Debt to Equity = Total Debt / Total Equity
- Debt Ratio = Total Liabilities / Total Assets

## Ratio Recalculation Workflow

Recalculate ratios from existing fundamentals:

```python
from arc.workflows.sync import build_ratio_recalculation_workflow

workflow = build_ratio_recalculation_workflow(
    security_ids=["AAPL", "MSFT"],
    calculation_date="2024-12-31",
    batch_size=1000
)

runtime = AsyncLocalRuntime()
results, run_id = await runtime.execute_workflow_async(workflow.build())
```

## Data Transformation

### Price Records

Prices are transformed to the PriceHistory model format:

```python
{
    "id": "AAPL_2024-12-31",  # Composite ID
    "security_id": "AAPL",
    "price_date": "2024-12-31",
    "open_price": "185.50",    # String decimals
    "high_price": "186.25",
    "low_price": "184.00",
    "close_price": "185.75",
    "adjusted_close": "185.75",
    "volume": 45000000,        # Integer
    "daily_return": "0.0125",  # Calculated
    "source": "eodhd",
    "currency": "USD",
    "is_adjusted": True
}
```

### Fundamentals Records

```python
{
    "id": "AAPL_2024_FY",  # Composite ID: security_fiscalyear_period
    "security_id": "AAPL",
    "fiscal_year": 2024,
    "fiscal_quarter": None,
    "period_type": "annual",
    "period_end_date": "2024-12-31",
    "revenue": "394328000000",
    "net_income": "96995000000",
    "total_assets": "352755000000",
    # ... more fields
    "source": "eodhd",
    "currency": "USD"
}
```

## Error Handling

Sync workflows handle errors gracefully:

```python
# Results include error details
summary = results["compile_summary"]["result"]

if summary["status"] == "partial_success":
    print(f"Errors: {summary['securities_failed']}")
    for error in summary["errors"][:10]:
        print(f"  - {error['security_id']}: {error['error']}")
```

## Environment Configuration

Required environment variables:

```bash
# .env file
EODHD_API_KEY=your_api_key_here
```

## Testing

Run sync workflow tests:

```bash
uv run pytest tests/unit/workflows/test_sync_workflows.py -v
uv run pytest tests/unit/services/test_sync_service.py -v
```

## Best Practices

### 1. Use Batch Sizes Appropriately

```python
# Smaller batches for price history (many records)
build_eodhd_price_sync_workflow(batch_size=1000)

# Larger batches for bulk sync (fewer unique securities)
build_eodhd_bulk_price_sync_workflow(batch_size=2000)

# Smaller batches for fundamentals (complex records)
build_fundamentals_sync_workflow(batch_size=500)
```

### 2. Handle Rate Limits

The EODHD API has rate limits. For large syncs, consider:

```python
# Sync in smaller batches
security_chunks = [securities[i:i+100] for i in range(0, len(securities), 100)]

for chunk in security_chunks:
    await services.sync.sync_prices(security_ids=chunk)
    await asyncio.sleep(1)  # Rate limit buffer
```

### 3. Schedule Regular Syncs

```python
# End-of-day sync (run after market close)
await services.sync.sync_exchange_prices(
    exchange="US",
    date=datetime.now().strftime("%Y-%m-%d")
)

# Weekly fundamentals sync
await services.sync.sync_fundamentals(
    security_ids=active_security_ids,
    trigger_ratio_calc=True
)
```

### 4. Monitor Sync Results

```python
result = await services.sync.sync_prices(security_ids=ids)

# Check for issues
if result["status"] != "success":
    logger.warning(f"Sync completed with errors: {result['errors']}")

# Track metrics
logger.info(
    f"Sync complete: {result['prices_saved']} prices, "
    f"{result['securities_success']}/{result['securities_requested']} securities"
)
```

## Troubleshooting

### Common Issues

**"EODHD_API_KEY environment variable not set"**
- Ensure `.env` file contains `EODHD_API_KEY`
- Verify environment is loaded before workflow execution

**"No prices returned"**
- Check security ticker format (should be "AAPL" or "AAPL.US")
- Verify date range is valid
- Check EODHD subscription has access to requested data

**"Bulk upsert failed"**
- Verify database connection
- Check composite ID format matches model expectations
- Ensure no duplicate IDs in batch

### Debug Mode

Enable debug logging for workflow execution:

```python
runtime = AsyncLocalRuntime(debug=True)
results, run_id = await runtime.execute_workflow_async(workflow.build())
```

## Related Documentation

- [07-api-endpoints.md](07-api-endpoints.md) - API endpoints for sync operations
- [08-eodhd-client.md](08-eodhd-client.md) - EODHD client implementation
- [04-database-models.md](04-database-models.md) - PriceHistory, CompanyFundamentals models
