# ARC Data Provider Integrations

## Overview

This document defines the integration specifications for external data providers powering the ARC platform.

---

## 1. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARC Integration Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   EODHD     │  │ Capital IQ  │  │  Pitchbook  │             │
│  │   Client    │  │   Client    │  │   Client    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────▼────────────────▼────────────────▼──────┐             │
│  │              Provider Interface               │             │
│  │   - Rate Limiting    - Retry Logic           │             │
│  │   - Error Handling   - Credential Mgmt       │             │
│  └──────────────────────┬────────────────────────┘             │
│                         │                                       │
├─────────────────────────▼───────────────────────────────────────┤
│                    DataFlow Models                              │
│  Security │ PriceHistory │ CompanyFundamentals │ SecurityRatio │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. EODHD Integration

### 2.1 Client Implementation

**File**: `src/arc/integrations/eodhd/client.py`

```python
import httpx
import asyncio
from typing import Optional, List, Dict
from datetime import datetime, date
from dataclasses import dataclass
import os

@dataclass
class EODHDConfig:
    """EODHD API configuration."""
    api_key: str
    base_url: str = "https://eodhd.com/api"
    timeout: int = 30
    max_retries: int = 3
    rate_limit_per_minute: int = 1000

class EODHDClient:
    """
    EODHD API client for market data.

    Capabilities:
    - End-of-day prices for 70+ exchanges
    - Real-time quotes
    - Fundamental data
    - Dividends and splits
    """

    def __init__(self, config: Optional[EODHDConfig] = None):
        self.config = config or EODHDConfig(
            api_key=os.getenv("EODHD_API_KEY")
        )
        self._client: Optional[httpx.AsyncClient] = None
        self._rate_limiter = RateLimiter(self.config.rate_limit_per_minute)

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            headers={"Accept": "application/json"}
        )
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict] = None
    ) -> Dict:
        """Make API request with rate limiting and retry."""
        await self._rate_limiter.acquire()

        params = params or {}
        params["api_token"] = self.config.api_key
        params["fmt"] = "json"

        for attempt in range(self.config.max_retries):
            try:
                response = await self._client.get(endpoint, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    # Rate limited - wait and retry
                    await asyncio.sleep(60)
                    continue
                elif e.response.status_code >= 500:
                    # Server error - retry with backoff
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise
            except httpx.RequestError as e:
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise

        raise Exception("Max retries exceeded")

    # ========== Price Data ==========

    async def get_eod_prices(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Get end-of-day price history.

        Args:
            ticker: Stock symbol (e.g., "AAPL")
            exchange: Exchange code (e.g., "US", "LSE")
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            [
                {
                    "date": "2024-01-15",
                    "open": 180.50,
                    "high": 182.00,
                    "low": 179.25,
                    "close": 181.75,
                    "adjusted_close": 181.75,
                    "volume": 45000000
                },
                ...
            ]
        """
        endpoint = f"/eod/{ticker}.{exchange}"
        params = {}

        if start_date:
            params["from"] = start_date
        if end_date:
            params["to"] = end_date

        data = await self._request(endpoint, params)

        return [
            {
                "date": item["date"],
                "open": item["open"],
                "high": item["high"],
                "low": item["low"],
                "close": item["close"],
                "adjusted_close": item.get("adjusted_close", item["close"]),
                "volume": item["volume"]
            }
            for item in data
        ]

    async def get_real_time_quote(
        self,
        ticker: str,
        exchange: str = "US"
    ) -> Dict:
        """
        Get real-time or delayed quote.

        Returns:
            {
                "ticker": "AAPL",
                "timestamp": 1705329600,
                "open": 180.50,
                "high": 182.00,
                "low": 179.25,
                "close": 181.75,
                "volume": 45000000,
                "previousClose": 180.00,
                "change": 1.75,
                "change_p": 0.97
            }
        """
        endpoint = f"/real-time/{ticker}.{exchange}"
        return await self._request(endpoint)

    async def get_bulk_eod(
        self,
        exchange: str = "US",
        date: Optional[str] = None
    ) -> List[Dict]:
        """
        Get bulk EOD data for entire exchange.

        Efficient for syncing all securities at once.
        """
        endpoint = f"/eod-bulk-last-day/{exchange}"
        params = {}
        if date:
            params["date"] = date

        return await self._request(endpoint, params)

    # ========== Fundamental Data ==========

    async def get_fundamentals(
        self,
        ticker: str,
        exchange: str = "US"
    ) -> Dict:
        """
        Get fundamental data for a security.

        Returns comprehensive fundamental data including:
        - General info
        - Financial statements
        - Valuation metrics
        - Earnings history
        """
        endpoint = f"/fundamentals/{ticker}.{exchange}"
        return await self._request(endpoint)

    async def get_dividends(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: Optional[str] = None
    ) -> List[Dict]:
        """Get dividend history."""
        endpoint = f"/div/{ticker}.{exchange}"
        params = {}
        if start_date:
            params["from"] = start_date

        return await self._request(endpoint, params)

    async def get_splits(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: Optional[str] = None
    ) -> List[Dict]:
        """Get stock split history."""
        endpoint = f"/splits/{ticker}.{exchange}"
        params = {}
        if start_date:
            params["from"] = start_date

        return await self._request(endpoint, params)

    # ========== Search & Discovery ==========

    async def search_securities(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Search for securities by name or ticker.

        Returns:
            [
                {
                    "Code": "AAPL",
                    "Exchange": "US",
                    "Name": "Apple Inc",
                    "Type": "Common Stock",
                    "Country": "USA",
                    "Currency": "USD"
                },
                ...
            ]
        """
        endpoint = "/search"
        params = {"q": query, "limit": limit}
        return await self._request(endpoint, params)

    async def get_exchange_symbols(
        self,
        exchange: str = "US"
    ) -> List[Dict]:
        """Get all symbols for an exchange."""
        endpoint = f"/exchange-symbol-list/{exchange}"
        return await self._request(endpoint)

    # ========== Validation ==========

    async def validate_credentials(self, api_key: Optional[str] = None) -> bool:
        """Validate API credentials."""
        try:
            # Try a simple API call
            original_key = self.config.api_key
            if api_key:
                self.config.api_key = api_key

            await self.get_real_time_quote("AAPL", "US")

            if api_key:
                self.config.api_key = original_key

            return True
        except Exception:
            return False


class RateLimiter:
    """Simple rate limiter for API calls."""

    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.tokens = requests_per_minute
        self.last_update = datetime.now()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = datetime.now()
            elapsed = (now - self.last_update).total_seconds()

            # Refill tokens
            self.tokens = min(
                self.requests_per_minute,
                self.tokens + (elapsed * self.requests_per_minute / 60)
            )
            self.last_update = now

            if self.tokens < 1:
                # Wait for token
                wait_time = (1 - self.tokens) * 60 / self.requests_per_minute
                await asyncio.sleep(wait_time)
                self.tokens = 0
            else:
                self.tokens -= 1
```

### 2.2 Data Mapping

| EODHD Field | ARC Model | ARC Field |
|-------------|-----------|-----------|
| `date` | PriceHistory | price_date |
| `open` | PriceHistory | open |
| `high` | PriceHistory | high |
| `low` | PriceHistory | low |
| `close` | PriceHistory | close |
| `adjusted_close` | PriceHistory | adjusted_close |
| `volume` | PriceHistory | volume |

### 2.3 Sync Workflow

```python
# src/arc/workflows/sync/eodhd_sync.py
from kailash.workflow.builder import WorkflowBuilder
from arc.integrations.eodhd import EODHDClient

def create_eodhd_price_sync_workflow():
    """Create workflow for syncing EODHD price data."""
    workflow = WorkflowBuilder()

    # Node 1: Get securities to sync
    workflow.add_node("SecurityListNode", "get_securities", {
        "filter": {
            "data_source": "eodhd",
            "active": True
        },
        "limit": 5000
    })

    # Node 2: Fetch prices from EODHD
    workflow.add_node("PythonCodeNode", "fetch_prices", {
        "code": '''
import asyncio
from arc.integrations.eodhd import EODHDClient
from datetime import datetime, timedelta

async def fetch_all_prices(securities, start_date, end_date):
    async with EODHDClient() as client:
        results = []
        errors = []

        for security in securities:
            ticker = security.get("ticker")
            exchange = security.get("exchange", "US")

            try:
                prices = await client.get_eod_prices(
                    ticker=ticker,
                    exchange=exchange,
                    start_date=start_date,
                    end_date=end_date
                )

                for price in prices:
                    results.append({
                        "security_id": security["id"],
                        "price_date": price["date"],
                        "open": price["open"],
                        "high": price["high"],
                        "low": price["low"],
                        "close": price["close"],
                        "adjusted_close": price["adjusted_close"],
                        "volume": price["volume"],
                        "source": "eodhd"
                    })
            except Exception as e:
                errors.append({"ticker": ticker, "error": str(e)})

        return {"prices": results, "errors": errors}

securities = get_securities["records"]
start_date = inputs.get("start_date", (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
end_date = inputs.get("end_date", datetime.now().strftime("%Y-%m-%d"))

result = asyncio.run(fetch_all_prices(securities, start_date, end_date))
prices = result["prices"]
errors = result["errors"]
''',
        "inputs": ["get_securities"]
    })

    # Node 3: Bulk upsert prices
    workflow.add_node("PriceHistoryBulkUpsertNode", "save_prices", {
        "records": "{{fetch_prices.prices}}",
        "conflict_keys": ["security_id", "price_date"]
    })

    # Node 4: Generate summary
    workflow.add_node("PythonCodeNode", "generate_summary", {
        "code": '''
summary = {
    "securities_processed": len(get_securities["records"]),
    "records_synced": len(fetch_prices["prices"]),
    "errors": fetch_prices["errors"],
    "status": "completed" if not fetch_prices["errors"] else "partial"
}
sync_summary = summary
''',
        "inputs": ["get_securities", "fetch_prices", "save_prices"]
    })

    # Connect nodes
    workflow.connect("get_securities", "fetch_prices")
    workflow.connect("fetch_prices", "save_prices")
    workflow.connect("save_prices", "generate_summary")

    return workflow.build()
```

### 2.4 Acceptance Criteria

- [ ] Fetch EOD prices for all exchanges
- [ ] Real-time quote retrieval
- [ ] Bulk sync for entire exchange
- [ ] Rate limiting (1000 req/min)
- [ ] Retry logic with exponential backoff
- [ ] Credential validation
- [ ] Error handling with detailed logging

---

## 3. Capital IQ Integration

### 3.1 Client Implementation

**File**: `src/arc/integrations/capital_iq/client.py`

```python
import httpx
import asyncio
from typing import Optional, List, Dict
from dataclasses import dataclass
import os

@dataclass
class CapitalIQConfig:
    """Capital IQ API configuration."""
    username: str
    password: str
    base_url: str = "https://api.capitaliq.com/v1"
    timeout: int = 60
    max_retries: int = 3

class CapitalIQClient:
    """
    Capital IQ API client for fundamental data.

    Capabilities:
    - Company financials (income statement, balance sheet, cash flow)
    - Valuation multiples
    - Segment data
    - Estimates and consensus
    - M&A transactions
    """

    def __init__(self, config: Optional[CapitalIQConfig] = None):
        self.config = config or CapitalIQConfig(
            username=os.getenv("CAPITALIQ_USERNAME"),
            password=os.getenv("CAPITALIQ_PASSWORD")
        )
        self._client: Optional[httpx.AsyncClient] = None
        self._token: Optional[str] = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout
        )
        await self._authenticate()
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    async def _authenticate(self):
        """Authenticate and get access token."""
        response = await self._client.post("/auth/token", data={
            "username": self.config.username,
            "password": self.config.password
        })
        response.raise_for_status()
        data = response.json()
        self._token = data["access_token"]

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """Make authenticated API request."""
        headers = {"Authorization": f"Bearer {self._token}"}

        for attempt in range(self.config.max_retries):
            try:
                if method == "GET":
                    response = await self._client.get(
                        endpoint, headers=headers, params=data
                    )
                else:
                    response = await self._client.post(
                        endpoint, headers=headers, json=data
                    )

                if response.status_code == 401:
                    await self._authenticate()
                    continue

                response.raise_for_status()
                return response.json()
            except httpx.RequestError:
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise

        raise Exception("Max retries exceeded")

    # ========== Financial Statements ==========

    async def get_income_statement(
        self,
        company_id: str,
        period_type: str = "quarterly",  # "quarterly" | "annual"
        periods: int = 4
    ) -> List[Dict]:
        """
        Get income statement data.

        Returns:
            [
                {
                    "period_end_date": "2024-03-31",
                    "period_type": "quarterly",
                    "revenue": 94836000000,
                    "cost_of_revenue": 53270000000,
                    "gross_profit": 41566000000,
                    "operating_expenses": 14370000000,
                    "operating_income": 27196000000,
                    "interest_expense": 1150000000,
                    "pretax_income": 27500000000,
                    "income_tax": 4450000000,
                    "net_income": 23050000000,
                    "eps_basic": 1.52,
                    "eps_diluted": 1.50,
                    "shares_outstanding": 15200000000,
                    "ebitda": 29500000000
                },
                ...
            ]
        """
        endpoint = f"/companies/{company_id}/financials/income-statement"
        return await self._request("GET", endpoint, {
            "period_type": period_type,
            "periods": periods
        })

    async def get_balance_sheet(
        self,
        company_id: str,
        period_type: str = "quarterly",
        periods: int = 4
    ) -> List[Dict]:
        """
        Get balance sheet data.

        Returns:
            [
                {
                    "period_end_date": "2024-03-31",
                    "total_assets": 352583000000,
                    "current_assets": 143692000000,
                    "cash_and_equivalents": 29965000000,
                    "short_term_investments": 35228000000,
                    "accounts_receivable": 28184000000,
                    "inventory": 6511000000,
                    "total_liabilities": 290437000000,
                    "current_liabilities": 145308000000,
                    "accounts_payable": 58146000000,
                    "short_term_debt": 15000000000,
                    "long_term_debt": 98959000000,
                    "total_equity": 62146000000,
                    "retained_earnings": 4336000000
                },
                ...
            ]
        """
        endpoint = f"/companies/{company_id}/financials/balance-sheet"
        return await self._request("GET", endpoint, {
            "period_type": period_type,
            "periods": periods
        })

    async def get_cash_flow(
        self,
        company_id: str,
        period_type: str = "quarterly",
        periods: int = 4
    ) -> List[Dict]:
        """
        Get cash flow statement data.

        Returns:
            [
                {
                    "period_end_date": "2024-03-31",
                    "operating_cash_flow": 26385000000,
                    "capital_expenditure": -2150000000,
                    "free_cash_flow": 24235000000,
                    "dividends_paid": -3750000000,
                    "share_repurchases": -23000000000,
                    "debt_repayment": -2500000000,
                    "investing_cash_flow": -5680000000,
                    "financing_cash_flow": -28750000000
                },
                ...
            ]
        """
        endpoint = f"/companies/{company_id}/financials/cash-flow"
        return await self._request("GET", endpoint, {
            "period_type": period_type,
            "periods": periods
        })

    # ========== Company Data ==========

    async def get_company_profile(
        self,
        company_id: str
    ) -> Dict:
        """Get company profile and metadata."""
        endpoint = f"/companies/{company_id}/profile"
        return await self._request("GET", endpoint)

    async def get_key_metrics(
        self,
        company_id: str
    ) -> Dict:
        """
        Get key financial metrics and ratios.

        Returns pre-calculated ratios from Capital IQ.
        """
        endpoint = f"/companies/{company_id}/metrics"
        return await self._request("GET", endpoint)

    async def get_estimates(
        self,
        company_id: str,
        metric: str = "eps"
    ) -> Dict:
        """Get analyst estimates and consensus."""
        endpoint = f"/companies/{company_id}/estimates"
        return await self._request("GET", endpoint, {"metric": metric})

    # ========== Search ==========

    async def search_companies(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict]:
        """Search for companies by name or ticker."""
        endpoint = "/search/companies"
        return await self._request("GET", endpoint, {
            "q": query,
            "limit": limit
        })

    async def get_company_by_ticker(
        self,
        ticker: str,
        exchange: Optional[str] = None
    ) -> Optional[Dict]:
        """Get company by ticker symbol."""
        results = await self.search_companies(ticker, limit=5)
        for company in results:
            if company.get("ticker") == ticker:
                if exchange and company.get("exchange") != exchange:
                    continue
                return company
        return None

    # ========== Validation ==========

    async def validate_credentials(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None
    ) -> bool:
        """Validate API credentials."""
        try:
            if username and password:
                original = (self.config.username, self.config.password)
                self.config.username = username
                self.config.password = password

            await self._authenticate()

            if username and password:
                self.config.username, self.config.password = original

            return True
        except Exception:
            return False
```

### 3.2 Data Mapping

| Capital IQ Field | ARC Model | ARC Field |
|------------------|-----------|-----------|
| `revenue` | CompanyFundamentals | revenue |
| `net_income` | CompanyFundamentals | net_income |
| `total_assets` | CompanyFundamentals | total_assets |
| `total_liabilities` | CompanyFundamentals | total_liabilities |
| `total_equity` | CompanyFundamentals | total_equity |
| `operating_cash_flow` | CompanyFundamentals | operating_cash_flow |
| `ebitda` | CompanyFundamentals | ebitda |

### 3.3 Acceptance Criteria

- [ ] Fetch income statement, balance sheet, cash flow
- [ ] Support quarterly and annual periods
- [ ] Company search by ticker
- [ ] Key metrics retrieval
- [ ] Analyst estimates
- [ ] Authentication with token refresh
- [ ] Error handling with retry logic

---

## 4. Pitchbook Integration

### 4.1 Client Implementation

**File**: `src/arc/integrations/pitchbook/client.py`

```python
import httpx
import asyncio
from typing import Optional, List, Dict
from dataclasses import dataclass
import os

@dataclass
class PitchbookConfig:
    """Pitchbook API configuration."""
    api_key: str
    base_url: str = "https://api.pitchbook.com/v2"
    timeout: int = 60
    max_retries: int = 3

class PitchbookClient:
    """
    Pitchbook API client for private company data.

    Capabilities:
    - Private company profiles
    - Funding rounds and valuations
    - Investor information
    - Deal pipeline
    - Comparable public companies
    """

    def __init__(self, config: Optional[PitchbookConfig] = None):
        self.config = config or PitchbookConfig(
            api_key=os.getenv("PITCHBOOK_API_KEY")
        )
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Accept": "application/json"
            }
        )
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict] = None
    ) -> Dict:
        """Make API request with retry logic."""
        for attempt in range(self.config.max_retries):
            try:
                response = await self._client.get(endpoint, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    await asyncio.sleep(60)
                    continue
                raise
            except httpx.RequestError:
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise

        raise Exception("Max retries exceeded")

    # ========== Company Data ==========

    async def get_company(
        self,
        company_id: str
    ) -> Dict:
        """
        Get private company profile.

        Returns:
            {
                "id": "pb-12345",
                "name": "Stripe Inc",
                "description": "...",
                "founded_date": "2010-01-01",
                "headquarters": "San Francisco, CA",
                "industry": "Fintech",
                "sub_industry": "Payments",
                "employee_count": 8000,
                "website": "https://stripe.com",
                "status": "private",
                "latest_valuation": {
                    "value": 95000000000,
                    "date": "2023-03-15",
                    "round": "Series I"
                },
                "total_funding": 8700000000,
                "investors_count": 45
            }
        """
        endpoint = f"/companies/{company_id}"
        return await self._request(endpoint)

    async def search_companies(
        self,
        query: Optional[str] = None,
        industry: Optional[str] = None,
        location: Optional[str] = None,
        min_valuation: Optional[float] = None,
        max_valuation: Optional[float] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Search for private companies."""
        endpoint = "/companies/search"
        params = {"limit": limit}

        if query:
            params["q"] = query
        if industry:
            params["industry"] = industry
        if location:
            params["location"] = location
        if min_valuation:
            params["min_valuation"] = min_valuation
        if max_valuation:
            params["max_valuation"] = max_valuation

        result = await self._request(endpoint, params)
        return result.get("companies", [])

    # ========== Funding & Valuations ==========

    async def get_funding_rounds(
        self,
        company_id: str
    ) -> List[Dict]:
        """
        Get funding history for a company.

        Returns:
            [
                {
                    "round_id": "round-123",
                    "round_type": "Series I",
                    "date": "2023-03-15",
                    "amount_raised": 6500000000,
                    "pre_money_valuation": 88500000000,
                    "post_money_valuation": 95000000000,
                    "lead_investors": ["Andreessen Horowitz"],
                    "all_investors": ["a16z", "Sequoia", "..."],
                    "status": "completed"
                },
                ...
            ]
        """
        endpoint = f"/companies/{company_id}/funding"
        result = await self._request(endpoint)
        return result.get("rounds", [])

    async def get_valuation_history(
        self,
        company_id: str
    ) -> List[Dict]:
        """Get historical valuations."""
        endpoint = f"/companies/{company_id}/valuations"
        result = await self._request(endpoint)
        return result.get("valuations", [])

    # ========== Investors ==========

    async def get_company_investors(
        self,
        company_id: str
    ) -> List[Dict]:
        """Get investors in a company."""
        endpoint = f"/companies/{company_id}/investors"
        result = await self._request(endpoint)
        return result.get("investors", [])

    async def get_investor(
        self,
        investor_id: str
    ) -> Dict:
        """Get investor profile."""
        endpoint = f"/investors/{investor_id}"
        return await self._request(endpoint)

    # ========== Comparables ==========

    async def get_public_comparables(
        self,
        company_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get comparable public companies.

        Returns public companies similar to the private company
        for valuation benchmarking.
        """
        endpoint = f"/companies/{company_id}/comparables/public"
        result = await self._request(endpoint, {"limit": limit})
        return result.get("comparables", [])

    async def get_private_comparables(
        self,
        company_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get comparable private companies."""
        endpoint = f"/companies/{company_id}/comparables/private"
        result = await self._request(endpoint, {"limit": limit})
        return result.get("comparables", [])

    # ========== Deals ==========

    async def get_recent_deals(
        self,
        industry: Optional[str] = None,
        deal_type: Optional[str] = None,  # "venture" | "pe" | "ma"
        min_size: Optional[float] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Get recent deal activity."""
        endpoint = "/deals"
        params = {"limit": limit}

        if industry:
            params["industry"] = industry
        if deal_type:
            params["deal_type"] = deal_type
        if min_size:
            params["min_size"] = min_size

        result = await self._request(endpoint, params)
        return result.get("deals", [])

    # ========== Validation ==========

    async def validate_credentials(self, api_key: Optional[str] = None) -> bool:
        """Validate API credentials."""
        try:
            original_key = self.config.api_key
            if api_key:
                self.config.api_key = api_key

            await self.search_companies(limit=1)

            if api_key:
                self.config.api_key = original_key

            return True
        except Exception:
            return False
```

### 4.2 Acceptance Criteria

- [ ] Private company profile retrieval
- [ ] Funding round history
- [ ] Valuation history
- [ ] Investor information
- [ ] Public and private comparables
- [ ] Deal pipeline tracking
- [ ] Search with filters
- [ ] Credential validation

---

## 5. Notification Integration

### 5.1 Notification Service

**File**: `src/arc/integrations/notifications/service.py`

```python
from typing import Optional, List, Dict
from dataclasses import dataclass
from enum import Enum
import asyncio

class NotificationChannel(Enum):
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"
    SLACK = "slack"

@dataclass
class Notification:
    """Notification data structure."""
    id: str
    user_id: str
    title: str
    message: str
    category: str  # "alert" | "brief" | "system" | "report"
    priority: str  # "high" | "medium" | "low"
    data: Optional[Dict] = None
    channels: Optional[List[NotificationChannel]] = None

class NotificationService:
    """
    Unified notification service.

    Channels:
    - Email (SendGrid)
    - Push (Firebase FCM)
    - In-App (Database)
    - Slack (Webhook)
    """

    def __init__(self, db):
        self.db = db
        self.email_client = EmailClient()
        self.push_client = PushClient()
        self.slack_client = SlackClient()

    async def send(
        self,
        notification: Notification
    ) -> Dict:
        """
        Send notification across configured channels.

        Returns:
            {
                "notification_id": str,
                "channels": {
                    "email": {"status": "sent" | "failed", "message_id": str},
                    "push": {"status": "sent" | "failed"},
                    "in_app": {"status": "created"},
                    "slack": {"status": "sent" | "failed"}
                }
            }
        """
        # Get user notification preferences
        user = await self.db.express.read("User", notification.user_id)
        preferences = user.get("preferences", {}).get("notifications", {})

        channels = notification.channels or [
            NotificationChannel(c) for c, enabled in preferences.items() if enabled
        ]

        results = {"notification_id": notification.id, "channels": {}}

        # Send in parallel
        tasks = []
        for channel in channels:
            if channel == NotificationChannel.EMAIL and preferences.get("email"):
                tasks.append(self._send_email(notification, results))
            elif channel == NotificationChannel.PUSH and preferences.get("push"):
                tasks.append(self._send_push(notification, results))
            elif channel == NotificationChannel.IN_APP:
                tasks.append(self._create_in_app(notification, results))
            elif channel == NotificationChannel.SLACK and preferences.get("slack"):
                tasks.append(self._send_slack(notification, results))

        await asyncio.gather(*tasks)

        return results

    async def _send_email(self, notification: Notification, results: Dict):
        """Send email notification."""
        try:
            user = await self.db.express.read("User", notification.user_id)
            message_id = await self.email_client.send(
                to=user["email"],
                subject=notification.title,
                body=notification.message,
                template=f"notification_{notification.category}"
            )
            results["channels"]["email"] = {"status": "sent", "message_id": message_id}
        except Exception as e:
            results["channels"]["email"] = {"status": "failed", "error": str(e)}

    async def _send_push(self, notification: Notification, results: Dict):
        """Send push notification."""
        try:
            # Get user's device tokens
            devices = await self.db.express.list(
                "UserDevice",
                filter={"user_id": notification.user_id, "push_enabled": True}
            )
            tokens = [d["push_token"] for d in devices]

            if tokens:
                await self.push_client.send_multicast(
                    tokens=tokens,
                    title=notification.title,
                    body=notification.message,
                    data=notification.data
                )
                results["channels"]["push"] = {"status": "sent", "devices": len(tokens)}
            else:
                results["channels"]["push"] = {"status": "skipped", "reason": "no_devices"}
        except Exception as e:
            results["channels"]["push"] = {"status": "failed", "error": str(e)}

    async def _create_in_app(self, notification: Notification, results: Dict):
        """Create in-app notification."""
        try:
            await self.db.express.create("Notification", {
                "id": notification.id,
                "user_id": notification.user_id,
                "title": notification.title,
                "message": notification.message,
                "category": notification.category,
                "priority": notification.priority,
                "data": notification.data,
                "read": False
            })
            results["channels"]["in_app"] = {"status": "created"}
        except Exception as e:
            results["channels"]["in_app"] = {"status": "failed", "error": str(e)}

    async def _send_slack(self, notification: Notification, results: Dict):
        """Send Slack notification."""
        try:
            # Get user's Slack webhook
            integration = await self.db.express.list(
                "UserIntegration",
                filter={"user_id": notification.user_id, "type": "slack"},
                limit=1
            )

            if integration:
                await self.slack_client.send_webhook(
                    webhook_url=integration[0]["webhook_url"],
                    text=f"*{notification.title}*\n{notification.message}"
                )
                results["channels"]["slack"] = {"status": "sent"}
            else:
                results["channels"]["slack"] = {"status": "skipped", "reason": "no_integration"}
        except Exception as e:
            results["channels"]["slack"] = {"status": "failed", "error": str(e)}

    async def mark_read(
        self,
        notification_ids: List[str],
        user_id: str
    ) -> int:
        """Mark notifications as read."""
        count = 0
        for nid in notification_ids:
            await self.db.express.update("Notification", nid, {"read": True})
            count += 1
        return count

    async def get_unread_count(self, user_id: str) -> int:
        """Get unread notification count."""
        result = await self.db.express.count(
            "Notification",
            filter={"user_id": user_id, "read": False}
        )
        return result
```

### 5.2 Acceptance Criteria

- [ ] Email notifications via SendGrid
- [ ] Push notifications via Firebase FCM
- [ ] In-app notifications stored in database
- [ ] Slack webhook integration
- [ ] Respect user notification preferences
- [ ] Mark as read functionality
- [ ] Unread count retrieval
- [ ] Priority-based delivery

---

## 6. Implementation Checklist

### Phase 1: EODHD Integration
- [ ] Implement EODHDClient with rate limiting
- [ ] Create price sync workflow
- [ ] Test EOD price retrieval
- [ ] Test bulk sync
- [ ] Implement error handling

### Phase 2: Capital IQ Integration
- [ ] Implement CapitalIQClient with auth
- [ ] Create fundamentals sync workflow
- [ ] Test financial statement retrieval
- [ ] Map data to ARC models

### Phase 3: Pitchbook Integration
- [ ] Implement PitchbookClient
- [ ] Create private company sync workflow
- [ ] Test funding round retrieval
- [ ] Implement comparables lookup

### Phase 4: Notifications
- [ ] Implement NotificationService
- [ ] Set up SendGrid email
- [ ] Set up Firebase FCM
- [ ] Implement Slack webhook
- [ ] Test multi-channel delivery
