"""
EODHD API client for market data.

Provides access to:
- Historical OHLCV prices
- Real-time quotes
- Fundamental data
- Bulk exchange data

Rate Limits:
- Basic: 5,000/day, 20/min
- Standard: 100,000/day, 100/min
- Enterprise: Unlimited, 1000/min
"""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from arc.core.exceptions import (
    AuthenticationError,
    IntegrationError,
    RateLimitError,
    ValidationError,
)

logger = logging.getLogger(__name__)


class EODHDClient:
    """
    Async client for EODHD API.

    Features:
    - Historical prices with date range filtering
    - Real-time quotes with delay info
    - Fundamental data parsing
    - Bulk operations for efficiency
    - Automatic retry with exponential backoff
    - Rate limit awareness
    """

    BASE_URL = "https://eodhistoricaldata.com/api"

    def __init__(
        self,
        api_key: str,
        timeout: float = 30.0,
        max_retries: int = 3,
        base_delay: float = 1.0,
    ):
        """
        Initialize EODHD client.

        Args:
            api_key: EODHD API key
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for failed requests
            base_delay: Base delay for exponential backoff
        """
        if not api_key:
            raise ValidationError("EODHD API key is required")

        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.base_delay = base_delay
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> "EODHDClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def _request(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> Any:
        """
        Make an API request with retry logic.

        Args:
            endpoint: API endpoint path
            params: Query parameters

        Returns:
            Parsed JSON response

        Raises:
            APIRateLimitError: If rate limited
            AuthenticationError: If API key is invalid
            APIConnectionError: If connection fails after retries
        """
        client = await self._get_client()
        url = f"{self.BASE_URL}{endpoint}"

        # Add API key to params
        request_params = {"api_token": self.api_key, "fmt": "json"}
        if params:
            request_params.update(params)

        last_error: Exception | None = None

        for attempt in range(self.max_retries):
            try:
                response = await client.get(url, params=request_params)

                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    raise AuthenticationError("Invalid EODHD API key")
                elif response.status_code == 429:
                    # Rate limited - calculate backoff
                    delay = self.base_delay * (2**attempt)
                    logger.warning(
                        f"Rate limited by EODHD, waiting {delay:.1f}s (attempt {attempt + 1})"
                    )
                    await asyncio.sleep(delay)
                    continue
                elif response.status_code == 404:
                    # Symbol not found - return empty result
                    return []
                else:
                    error_text = response.text[:200]
                    raise IntegrationError(
                        provider="EODHD",
                        message=f"EODHD API error {response.status_code}: {error_text}",
                        response_code=response.status_code,
                    )

            except httpx.TimeoutException as e:
                last_error = e
                delay = self.base_delay * (2**attempt)
                logger.warning(f"EODHD timeout, retrying in {delay:.1f}s")
                await asyncio.sleep(delay)

            except httpx.RequestError as e:
                last_error = e
                delay = self.base_delay * (2**attempt)
                logger.warning(f"EODHD request error: {e}, retrying in {delay:.1f}s")
                await asyncio.sleep(delay)

        # All retries exhausted
        if last_error:
            raise IntegrationError(
                provider="EODHD",
                message=f"EODHD request failed after {self.max_retries} retries: {last_error}",
            )
        raise RateLimitError(message="EODHD rate limit exceeded")

    async def validate_credentials(self) -> bool:
        """
        Validate API credentials by making a test request.

        Returns:
            True if credentials are valid

        Raises:
            AuthenticationError: If credentials are invalid
        """
        try:
            # Use a simple endpoint to validate
            await self._request("/user")
            return True
        except AuthenticationError:
            return False

    async def get_historical_prices(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: str | None = None,
        end_date: str | None = None,
        period: str = "d",
    ) -> list[dict[str, Any]]:
        """
        Get historical OHLCV price data.

        Args:
            ticker: Stock ticker symbol (e.g., "AAPL")
            exchange: Exchange code (e.g., "US", "LSE", "TO")
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            period: Data period - "d" (daily), "w" (weekly), "m" (monthly)

        Returns:
            List of price records with fields:
            - date: Date string (YYYY-MM-DD)
            - open: Opening price
            - high: High price
            - low: Low price
            - close: Closing price
            - adjusted_close: Split/dividend adjusted close
            - volume: Trading volume
        """
        symbol = f"{ticker}.{exchange}"
        params: dict[str, Any] = {"period": period}

        if start_date:
            params["from"] = start_date
        if end_date:
            params["to"] = end_date

        response = await self._request(f"/eod/{symbol}", params)

        # EODHD returns a list of price objects
        if not isinstance(response, list):
            return []

        return self._parse_historical_prices(response)

    def _parse_historical_prices(self, data: list[dict]) -> list[dict[str, Any]]:
        """Parse historical price response into standard format."""
        results = []
        for item in data:
            results.append(
                {
                    "date": item.get("date"),
                    "open": float(item.get("open", 0)),
                    "high": float(item.get("high", 0)),
                    "low": float(item.get("low", 0)),
                    "close": float(item.get("close", 0)),
                    "adjusted_close": float(item.get("adjusted_close", 0)),
                    "volume": int(item.get("volume", 0)),
                }
            )
        return results

    async def get_real_time_quote(
        self,
        ticker: str,
        exchange: str = "US",
    ) -> dict[str, Any]:
        """
        Get real-time quote for a symbol.

        Note: Real-time data may have 15-20 minute delay depending on plan.

        Args:
            ticker: Stock ticker symbol
            exchange: Exchange code

        Returns:
            Quote data with fields:
            - code: Symbol with exchange
            - timestamp: Unix timestamp
            - open: Opening price
            - high: High price
            - low: Low price
            - close: Current/last price
            - volume: Trading volume
            - previous_close: Previous day close
            - change: Price change
            - change_percent: Percent change
        """
        symbol = f"{ticker}.{exchange}"
        response = await self._request(f"/real-time/{symbol}")

        if not response or not isinstance(response, dict):
            return {}

        return self._parse_real_time_quote(response)

    def _parse_real_time_quote(self, data: dict) -> dict[str, Any]:
        """Parse real-time quote response into standard format."""
        return {
            "code": data.get("code", ""),
            "timestamp": data.get("timestamp", 0),
            "gmt_offset": data.get("gmtoffset", 0),
            "open": float(data.get("open", 0)),
            "high": float(data.get("high", 0)),
            "low": float(data.get("low", 0)),
            "close": float(data.get("close", 0)),
            "volume": int(data.get("volume", 0)),
            "previous_close": float(data.get("previousClose", 0)),
            "change": float(data.get("change", 0)),
            "change_percent": float(data.get("change_p", 0)),
        }

    async def get_fundamentals(
        self,
        ticker: str,
        exchange: str = "US",
    ) -> dict[str, Any]:
        """
        Get fundamental data for a company.

        Args:
            ticker: Stock ticker symbol
            exchange: Exchange code

        Returns:
            Fundamental data including:
            - general: Company info (name, sector, industry)
            - financials: Financial statements
            - balance_sheet: Balance sheet data
            - cash_flow: Cash flow data
            - earnings: Earnings history
            - valuation: Valuation metrics
        """
        symbol = f"{ticker}.{exchange}"
        response = await self._request(f"/fundamentals/{symbol}")

        if not response or not isinstance(response, dict):
            return {}

        return self._parse_fundamentals(response)

    def _parse_fundamentals(self, data: dict) -> dict[str, Any]:
        """Parse fundamentals response into standard format."""
        general = data.get("General", {})
        highlights = data.get("Highlights", {})
        valuation = data.get("Valuation", {})
        financials = data.get("Financials", {})
        balance_sheet = financials.get("Balance_Sheet", {})
        cash_flow = financials.get("Cash_Flow", {})
        income_statement = financials.get("Income_Statement", {})

        return {
            "general": {
                "code": general.get("Code", ""),
                "name": general.get("Name", ""),
                "sector": general.get("Sector", ""),
                "industry": general.get("Industry", ""),
                "description": general.get("Description", ""),
                "exchange": general.get("Exchange", ""),
                "currency": general.get("CurrencyCode", "USD"),
                "country": general.get("CountryName", ""),
                "isin": general.get("ISIN", ""),
                "cusip": general.get("CUSIP", ""),
            },
            "highlights": {
                "market_cap": highlights.get("MarketCapitalization"),
                "pe_ratio": highlights.get("PERatio"),
                "eps": highlights.get("EarningsShare"),
                "dividend_yield": highlights.get("DividendYield"),
                "profit_margin": highlights.get("ProfitMargin"),
                "operating_margin": highlights.get("OperatingMarginTTM"),
                "revenue_ttm": highlights.get("RevenueTTM"),
                "revenue_per_share": highlights.get("RevenuePerShareTTM"),
                "gross_profit_ttm": highlights.get("GrossProfitTTM"),
                "diluted_eps": highlights.get("DilutedEpsTTM"),
            },
            "valuation": {
                "trailing_pe": valuation.get("TrailingPE"),
                "forward_pe": valuation.get("ForwardPE"),
                "price_to_sales": valuation.get("PriceSalesTTM"),
                "price_to_book": valuation.get("PriceBookMRQ"),
                "enterprise_value": valuation.get("EnterpriseValue"),
                "enterprise_to_revenue": valuation.get("EnterpriseValueRevenue"),
                "enterprise_to_ebitda": valuation.get("EnterpriseValueEbitda"),
            },
            "balance_sheet": self._extract_latest_period(balance_sheet),
            "cash_flow": self._extract_latest_period(cash_flow),
            "income_statement": self._extract_latest_period(income_statement),
        }

    def _extract_latest_period(self, data: dict) -> dict[str, Any]:
        """Extract the most recent quarterly or annual data."""
        if not data:
            return {}

        # Try quarterly first, then annual
        for period_type in ["quarterly", "yearly"]:
            periods = data.get(period_type, {})
            if periods:
                # Get the most recent period
                sorted_periods = sorted(periods.keys(), reverse=True)
                if sorted_periods:
                    return periods[sorted_periods[0]]

        return {}

    async def get_bulk_prices(
        self,
        exchange: str,
        date: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get bulk end-of-day prices for an exchange.

        This is more efficient than fetching individual symbols.

        Args:
            exchange: Exchange code (e.g., "US", "LSE")
            date: Date in YYYY-MM-DD format (defaults to latest)

        Returns:
            List of price records for all symbols on the exchange
        """
        params: dict[str, Any] = {}
        if date:
            params["date"] = date

        response = await self._request(f"/eod-bulk-last-day/{exchange}", params)

        if not isinstance(response, list):
            return []

        return self._parse_bulk_prices(response)

    def _parse_bulk_prices(self, data: list[dict]) -> list[dict[str, Any]]:
        """Parse bulk prices response into standard format."""
        results = []
        for item in data:
            results.append(
                {
                    "code": item.get("code", ""),
                    "exchange": item.get("exchange_short_name", ""),
                    "date": item.get("date"),
                    "open": float(item.get("open", 0)),
                    "high": float(item.get("high", 0)),
                    "low": float(item.get("low", 0)),
                    "close": float(item.get("close", 0)),
                    "adjusted_close": float(item.get("adjusted_close", 0)),
                    "volume": int(item.get("volume", 0)),
                }
            )
        return results

    async def get_dividend_history(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get dividend history for a symbol.

        Args:
            ticker: Stock ticker symbol
            exchange: Exchange code
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format

        Returns:
            List of dividend records
        """
        symbol = f"{ticker}.{exchange}"
        params: dict[str, Any] = {}

        if start_date:
            params["from"] = start_date
        if end_date:
            params["to"] = end_date

        response = await self._request(f"/div/{symbol}", params)

        if not isinstance(response, list):
            return []

        return self._parse_dividend_history(response)

    def _parse_dividend_history(self, data: list[dict]) -> list[dict[str, Any]]:
        """Parse dividend history response."""
        results = []
        for item in data:
            results.append(
                {
                    "date": item.get("date"),
                    "declaration_date": item.get("declarationDate"),
                    "record_date": item.get("recordDate"),
                    "payment_date": item.get("paymentDate"),
                    "dividend": float(item.get("value", 0)),
                    "currency": item.get("currency", "USD"),
                }
            )
        return results

    async def get_splits_history(
        self,
        ticker: str,
        exchange: str = "US",
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get stock split history for a symbol.

        Args:
            ticker: Stock ticker symbol
            exchange: Exchange code
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format

        Returns:
            List of split records
        """
        symbol = f"{ticker}.{exchange}"
        params: dict[str, Any] = {}

        if start_date:
            params["from"] = start_date
        if end_date:
            params["to"] = end_date

        response = await self._request(f"/splits/{symbol}", params)

        if not isinstance(response, list):
            return []

        return self._parse_splits_history(response)

    def _parse_splits_history(self, data: list[dict]) -> list[dict[str, Any]]:
        """Parse splits history response."""
        results = []
        for item in data:
            split_str = item.get("split", "")
            results.append(
                {
                    "date": item.get("date"),
                    "split": split_str,
                }
            )
        return results

    async def search_symbols(
        self,
        query: str,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """
        Search for symbols by name or code.

        Args:
            query: Search query
            limit: Maximum results to return

        Returns:
            List of matching symbols
        """
        params = {"query_string": query, "limit": limit}
        response = await self._request("/search", params)

        if not isinstance(response, list):
            return []

        return [
            {
                "code": item.get("Code", ""),
                "name": item.get("Name", ""),
                "exchange": item.get("Exchange", ""),
                "country": item.get("Country", ""),
                "currency": item.get("Currency", ""),
                "isin": item.get("ISIN", ""),
                "type": item.get("Type", ""),
            }
            for item in response
        ]

    async def get_exchanges(self) -> list[dict[str, Any]]:
        """
        Get list of available exchanges.

        Returns:
            List of exchange info
        """
        response = await self._request("/exchanges-list")

        if not isinstance(response, list):
            return []

        return [
            {
                "code": item.get("Code", ""),
                "name": item.get("Name", ""),
                "country": item.get("Country", ""),
                "currency": item.get("Currency", ""),
            }
            for item in response
        ]


# Rate limiter helper
class RateLimiter:
    """Simple rate limiter for API calls."""

    def __init__(self, calls_per_minute: int = 20):
        self.calls_per_minute = calls_per_minute
        self.calls: list[datetime] = []

    async def acquire(self) -> None:
        """Wait if rate limit would be exceeded."""
        now = datetime.now(UTC)
        minute_ago = now - timedelta(minutes=1)

        # Remove old calls
        self.calls = [t for t in self.calls if t > minute_ago]

        # Check if we need to wait
        if len(self.calls) >= self.calls_per_minute:
            oldest = self.calls[0]
            wait_time = (oldest + timedelta(minutes=1) - now).total_seconds()
            if wait_time > 0:
                logger.debug(f"Rate limiting: waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)

        self.calls.append(now)
