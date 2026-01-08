# TODO-BE-021: EODHD Client Implementation

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: None

---

## Objective

Implement the EODHD client for fetching market data including prices, fundamentals, and real-time quotes.

---

## Tasks

### 1. Client Structure
- [ ] Create `src/arc/integrations/eodhd/__init__.py`
- [ ] Create `src/arc/integrations/eodhd/client.py`
- [ ] Implement `EODHDClient`:
  ```python
  class EODHDClient:
      BASE_URL = "https://eodhistoricaldata.com/api"

      def __init__(self, api_key: str = None):
          self.api_key = api_key or settings.EODHD_API_KEY
          self.client = httpx.AsyncClient(timeout=30)

      async def validate_credentials(self, api_key: str) -> bool:
          """Validate API key by making test request."""
          pass

      async def get_historical_prices(
          self,
          ticker: str,
          exchange: str = "US",
          start_date: str = None,
          end_date: str = None
      ) -> List[dict]:
          """Get historical OHLCV data."""
          pass

      async def get_real_time_quote(self, ticker: str) -> dict:
          """Get real-time quote."""
          pass

      async def get_fundamentals(self, ticker: str) -> dict:
          """Get fundamental data."""
          pass

      async def get_bulk_prices(
          self,
          exchange: str,
          date: str
      ) -> List[dict]:
          """Get all prices for exchange on date."""
          pass
  ```

### 2. Historical Prices
- [ ] Implement `get_historical_prices()`:
  - Endpoint: `/eod/{ticker}.{exchange}`
  - Parameters: from, to, period (d/w/m)
  - Return OHLCV data with adjustments
- [ ] Handle pagination for large date ranges
- [ ] Parse response into standard format

### 3. Real-Time Quotes
- [ ] Implement `get_real_time_quote()`:
  - Endpoint: `/real-time/{ticker}`
  - Return current price, change, volume
- [ ] Handle after-hours/pre-market data

### 4. Fundamental Data
- [ ] Implement `get_fundamentals()`:
  - Endpoint: `/fundamentals/{ticker}`
  - Extract financials, balance sheet, cash flow
  - Parse into CompanyFundamentals format

### 5. Bulk Operations
- [ ] Implement `get_bulk_prices()`:
  - Endpoint: `/eod-bulk-last-day/{exchange}`
  - Efficient for syncing entire exchange
- [ ] Implement `get_bulk_fundamentals()`:
  - Batch fundamental fetching

### 6. Error Handling
- [ ] Handle rate limiting (429)
- [ ] Handle authentication errors (401)
- [ ] Implement retry with exponential backoff
- [ ] Log all errors with context

### 7. Caching
- [ ] Cache real-time quotes (15s TTL)
- [ ] Cache fundamentals (24h TTL)
- [ ] Cache historical data appropriately

---

## Acceptance Criteria

- [ ] Credentials validation works
- [ ] Historical prices with date range
- [ ] Real-time quotes
- [ ] Fundamentals parsing
- [ ] Bulk operations for efficiency
- [ ] Error handling with retries
- [ ] Rate limiting respected
- [ ] Unit test: Response parsing
- [ ] Integration test: API calls (with mock)

---

## Response Formats

### Historical Prices Response
```json
[
    {
        "date": "2026-01-06",
        "open": 150.25,
        "high": 152.50,
        "low": 149.80,
        "close": 151.75,
        "adjusted_close": 151.75,
        "volume": 45000000
    }
]
```

### Real-Time Quote Response
```json
{
    "code": "AAPL.US",
    "timestamp": 1704600000,
    "gmtoffset": -18000,
    "open": 150.25,
    "high": 152.50,
    "low": 149.80,
    "close": 151.75,
    "volume": 45000000,
    "previousClose": 150.00,
    "change": 1.75,
    "change_p": 1.17
}
```

### Fundamentals Response (Simplified)
```json
{
    "General": {
        "Code": "AAPL",
        "Name": "Apple Inc",
        "Sector": "Technology",
        "Industry": "Consumer Electronics"
    },
    "Financials": {
        "Balance_Sheet": {...},
        "Cash_Flow": {...},
        "Income_Statement": {...}
    }
}
```

---

## Rate Limiting

| Plan | Requests/Day | Requests/Min |
|------|--------------|--------------|
| Basic | 5,000 | 20 |
| Standard | 100,000 | 100 |
| Enterprise | Unlimited | 1000 |

Implement exponential backoff with jitter for 429 responses.

---

## Technical Notes

- Use httpx for async HTTP client
- Implement connection pooling
- Parse dates in consistent format
- Handle exchange suffixes (AAPL.US, MSFT.US)
- Log all API calls for debugging
