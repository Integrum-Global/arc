# EODHD Client

## Overview

The EODHD client provides async access to EODHD market data API for:

- **Historical Prices**: Daily/weekly/monthly OHLCV data
- **Real-Time Quotes**: Current price, change, volume
- **Fundamentals**: Financial statements, ratios, company info
- **Bulk Operations**: Efficient exchange-wide data retrieval
- **Dividends & Splits**: Corporate action history
- **Symbol Search**: Find securities by name or code

## Quick Start

```python
from arc.integrations import EODHDClient

# Initialize client
async with EODHDClient(api_key="your_api_key") as client:
    # Get historical prices
    prices = await client.get_historical_prices(
        ticker="AAPL",
        exchange="US",
        start_date="2025-01-01",
        end_date="2025-12-31"
    )

    # Get real-time quote
    quote = await client.get_real_time_quote("AAPL")

    # Get fundamentals
    fundamentals = await client.get_fundamentals("AAPL")
```

## Configuration

```python
client = EODHDClient(
    api_key="your_api_key",  # Required
    timeout=30.0,            # Request timeout (seconds)
    max_retries=3,           # Retry attempts for failed requests
    base_delay=1.0           # Base delay for exponential backoff
)
```

## API Methods

### Historical Prices

```python
prices = await client.get_historical_prices(
    ticker="AAPL",
    exchange="US",        # Default: "US"
    start_date="2025-01-01",
    end_date="2025-12-31",
    period="d"            # "d" (daily), "w" (weekly), "m" (monthly)
)

# Returns:
[
    {
        "date": "2025-01-02",
        "open": 150.25,
        "high": 152.50,
        "low": 149.80,
        "close": 151.75,
        "adjusted_close": 151.75,
        "volume": 45000000
    }
]
```

### Real-Time Quotes

```python
quote = await client.get_real_time_quote("AAPL", exchange="US")

# Returns:
{
    "code": "AAPL.US",
    "timestamp": 1704600000,
    "gmt_offset": -18000,
    "open": 150.25,
    "high": 152.50,
    "low": 149.80,
    "close": 151.75,
    "volume": 45000000,
    "previous_close": 150.00,
    "change": 1.75,
    "change_percent": 1.17
}
```

### Fundamentals

```python
data = await client.get_fundamentals("AAPL")

# Returns structured data:
{
    "general": {
        "code": "AAPL",
        "name": "Apple Inc",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "exchange": "NASDAQ",
        "currency": "USD",
        "country": "United States",
        "isin": "US0378331005",
        "cusip": "037833100"
    },
    "highlights": {
        "market_cap": 2500000000000,
        "pe_ratio": 28.5,
        "eps": 6.15,
        "dividend_yield": 0.55,
        "profit_margin": 0.25,
        "revenue_ttm": 380000000000
    },
    "valuation": {
        "trailing_pe": 28.5,
        "forward_pe": 25.0,
        "price_to_sales": 7.5,
        "price_to_book": 45.0
    },
    "balance_sheet": {...},  # Latest quarterly/annual data
    "cash_flow": {...},
    "income_statement": {...}
}
```

### Bulk Operations

```python
# Get all end-of-day prices for an exchange
prices = await client.get_bulk_prices(
    exchange="US",
    date="2025-01-07"  # Optional, defaults to latest
)

# Returns:
[
    {
        "code": "AAPL",
        "exchange": "US",
        "date": "2025-01-07",
        "open": 150.25,
        "high": 152.50,
        "low": 149.80,
        "close": 151.75,
        "adjusted_close": 151.75,
        "volume": 45000000
    }
]
```

### Dividends & Splits

```python
# Dividend history
dividends = await client.get_dividend_history(
    ticker="AAPL",
    start_date="2024-01-01"
)

# Returns:
[
    {
        "date": "2025-11-10",
        "declaration_date": "2025-10-30",
        "record_date": "2025-11-08",
        "payment_date": "2025-11-14",
        "dividend": 0.24,
        "currency": "USD"
    }
]

# Stock splits
splits = await client.get_splits_history("AAPL")

# Returns:
[
    {"date": "2020-08-31", "split": "4/1"},
    {"date": "2014-06-09", "split": "7/1"}
]
```

### Symbol Search

```python
# Search symbols
results = await client.search_symbols("Apple", limit=10)

# Returns:
[
    {
        "code": "AAPL",
        "name": "Apple Inc",
        "exchange": "NASDAQ",
        "country": "USA",
        "currency": "USD",
        "isin": "US0378331005",
        "type": "Common Stock"
    }
]

# List exchanges
exchanges = await client.get_exchanges()

# Returns:
[
    {"code": "US", "name": "US Exchanges", "country": "USA", "currency": "USD"},
    {"code": "LSE", "name": "London Stock Exchange", "country": "UK", "currency": "GBP"}
]
```

### Credential Validation

```python
is_valid = await client.validate_credentials()
# Returns True if API key is valid
```

## Error Handling

The client raises specific exceptions:

| Exception | Status Code | Description |
|-----------|-------------|-------------|
| `ValidationError` | - | Invalid input (e.g., missing API key) |
| `AuthenticationError` | 401 | Invalid API key |
| `RateLimitError` | 429 | Rate limit exceeded |
| `IntegrationError` | 502 | API connection or other error |

```python
from arc.core.exceptions import (
    AuthenticationError,
    RateLimitError,
    IntegrationError
)

try:
    prices = await client.get_historical_prices("AAPL")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded, retry later")
except IntegrationError as e:
    print(f"API error: {e.message}")
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:

1. **Timeout**: Retries with delay
2. **Rate Limit (429)**: Waits and retries
3. **Connection Error**: Retries with delay
4. **404 Not Found**: Returns empty result (no retry)
5. **401 Unauthorized**: Raises `AuthenticationError` immediately

Delay formula: `base_delay * (2 ^ attempt)`

## Rate Limits

| Plan | Daily Limit | Per Minute |
|------|-------------|------------|
| Basic | 5,000 | 20 |
| Standard | 100,000 | 100 |
| Enterprise | Unlimited | 1,000 |

Use `RateLimiter` for client-side rate limiting:

```python
from arc.integrations import RateLimiter

limiter = RateLimiter(calls_per_minute=20)

async def fetch_with_rate_limit():
    await limiter.acquire()
    return await client.get_real_time_quote("AAPL")
```

## Exchange Codes

Common exchange codes:

| Code | Exchange |
|------|----------|
| US | US Exchanges (NYSE, NASDAQ) |
| LSE | London Stock Exchange |
| TO | Toronto Stock Exchange |
| PA | Euronext Paris |
| XETRA | Deutsche Börse |
| HK | Hong Kong Stock Exchange |
| AU | Australian Stock Exchange |

## File Structure

```
src/arc/integrations/
├── __init__.py           # Exports EODHDClient, RateLimiter
└── eodhd/
    ├── __init__.py       # Package exports
    └── client.py         # EODHDClient implementation
```

## Testing

```bash
# Run EODHD client tests
uv run pytest tests/unit/integrations/test_eodhd_client.py -v

# 39 tests covering:
# - Client initialization
# - Historical prices
# - Real-time quotes
# - Fundamentals
# - Bulk operations
# - Dividends & splits
# - Search & exchanges
# - Error handling
# - Context manager
# - Rate limiting
# - Response parsers
```

## Integration with Workflows

The EODHD client can be used in Kailash workflows via `PythonCodeNode`:

```python
from kailash.workflow.builder import WorkflowBuilder
from arc.integrations import EODHDClient

workflow = WorkflowBuilder()
workflow.add_node("PythonCodeNode", "fetch_prices", {
    "code": '''
async def execute(inputs):
    client = EODHDClient(api_key=inputs["api_key"])
    prices = await client.get_historical_prices(
        ticker=inputs["ticker"],
        start_date=inputs["start_date"]
    )
    await client.close()
    return {"prices": prices}
''',
    "inputs": {
        "api_key": "your_key",
        "ticker": "AAPL",
        "start_date": "2025-01-01"
    }
})
```

## Best Practices

1. **Use context manager** for automatic cleanup:
   ```python
   async with EODHDClient(api_key=key) as client:
       # Client automatically closed on exit
   ```

2. **Batch requests** using bulk endpoints when possible

3. **Handle errors** appropriately for your use case

4. **Respect rate limits** - use RateLimiter for high-volume operations

5. **Cache fundamentals** (they don't change frequently)

6. **Use appropriate period** for historical data:
   - "d" for daily trading analysis
   - "w" for weekly trends
   - "m" for long-term analysis
