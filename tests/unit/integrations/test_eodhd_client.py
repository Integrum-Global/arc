"""Unit tests for EODHD client."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.core.exceptions import (
    AuthenticationError,
    ValidationError,
)
from arc.integrations.eodhd import EODHDClient, RateLimiter

# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def api_key():
    """Test API key."""
    return "test_api_key_123"


@pytest.fixture
def client(api_key):
    """Create EODHD client."""
    return EODHDClient(api_key=api_key)


@pytest.fixture
def mock_response():
    """Create mock HTTP response."""
    response = MagicMock()
    response.status_code = 200
    return response


# =============================================================================
# CLIENT INITIALIZATION TESTS
# =============================================================================


class TestEODHDClientInit:
    """Test client initialization."""

    def test_init_with_api_key(self, api_key):
        """Test client initialization with API key."""
        client = EODHDClient(api_key=api_key)
        assert client.api_key == api_key
        assert client.timeout == 30.0
        assert client.max_retries == 3
        assert client.base_delay == 1.0

    def test_init_with_custom_timeout(self, api_key):
        """Test client with custom timeout."""
        client = EODHDClient(api_key=api_key, timeout=60.0)
        assert client.timeout == 60.0

    def test_init_with_custom_retries(self, api_key):
        """Test client with custom retry count."""
        client = EODHDClient(api_key=api_key, max_retries=5)
        assert client.max_retries == 5

    def test_init_without_api_key_raises_error(self):
        """Test that missing API key raises ValidationError."""
        with pytest.raises(ValidationError, match="EODHD API key is required"):
            EODHDClient(api_key="")

    def test_init_with_none_api_key_raises_error(self):
        """Test that None API key raises ValidationError."""
        with pytest.raises(ValidationError, match="EODHD API key is required"):
            EODHDClient(api_key=None)


# =============================================================================
# HISTORICAL PRICES TESTS
# =============================================================================


class TestHistoricalPrices:
    """Test historical price retrieval."""

    @pytest.mark.asyncio
    async def test_get_historical_prices_success(self, client):
        """Test successful historical prices retrieval."""
        mock_data = [
            {
                "date": "2026-01-06",
                "open": 150.25,
                "high": 152.50,
                "low": 149.80,
                "close": 151.75,
                "adjusted_close": 151.75,
                "volume": 45000000,
            },
            {
                "date": "2026-01-07",
                "open": 151.75,
                "high": 153.00,
                "low": 151.00,
                "close": 152.50,
                "adjusted_close": 152.50,
                "volume": 42000000,
            },
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_historical_prices("AAPL", exchange="US")

        assert len(result) == 2
        assert result[0]["date"] == "2026-01-06"
        assert result[0]["open"] == 150.25
        assert result[0]["high"] == 152.50
        assert result[0]["close"] == 151.75
        assert result[0]["volume"] == 45000000

    @pytest.mark.asyncio
    async def test_get_historical_prices_with_date_range(self, client):
        """Test historical prices with date range."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = []
            await client.get_historical_prices(
                "AAPL",
                exchange="US",
                start_date="2026-01-01",
                end_date="2026-01-07",
            )

        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert "/eod/AAPL.US" in call_args[0]

    @pytest.mark.asyncio
    async def test_get_historical_prices_empty_response(self, client):
        """Test handling of empty response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = []
            result = await client.get_historical_prices("INVALID")

        assert result == []

    @pytest.mark.asyncio
    async def test_get_historical_prices_non_list_response(self, client):
        """Test handling of non-list response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"error": "something"}
            result = await client.get_historical_prices("AAPL")

        assert result == []


# =============================================================================
# REAL-TIME QUOTES TESTS
# =============================================================================


class TestRealTimeQuotes:
    """Test real-time quote retrieval."""

    @pytest.mark.asyncio
    async def test_get_real_time_quote_success(self, client):
        """Test successful real-time quote retrieval."""
        mock_data = {
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
            "change_p": 1.17,
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_real_time_quote("AAPL")

        assert result["code"] == "AAPL.US"
        assert result["close"] == 151.75
        assert result["change"] == 1.75
        assert result["change_percent"] == 1.17
        assert result["previous_close"] == 150.00

    @pytest.mark.asyncio
    async def test_get_real_time_quote_empty_response(self, client):
        """Test handling of empty quote response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = None
            result = await client.get_real_time_quote("INVALID")

        assert result == {}

    @pytest.mark.asyncio
    async def test_get_real_time_quote_with_exchange(self, client):
        """Test quote with specific exchange."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"code": "VOD.LSE"}
            await client.get_real_time_quote("VOD", exchange="LSE")

        mock_request.assert_called_once()
        assert "VOD.LSE" in str(mock_request.call_args)


# =============================================================================
# FUNDAMENTALS TESTS
# =============================================================================


class TestFundamentals:
    """Test fundamental data retrieval."""

    @pytest.mark.asyncio
    async def test_get_fundamentals_success(self, client):
        """Test successful fundamentals retrieval."""
        mock_data = {
            "General": {
                "Code": "AAPL",
                "Name": "Apple Inc",
                "Sector": "Technology",
                "Industry": "Consumer Electronics",
                "Description": "Apple designs and manufactures...",
                "Exchange": "NASDAQ",
                "CurrencyCode": "USD",
                "CountryName": "United States",
                "ISIN": "US0378331005",
                "CUSIP": "037833100",
            },
            "Highlights": {
                "MarketCapitalization": 2500000000000,
                "PERatio": 28.5,
                "EarningsShare": 6.15,
                "DividendYield": 0.55,
                "ProfitMargin": 0.25,
                "OperatingMarginTTM": 0.30,
                "RevenueTTM": 380000000000,
            },
            "Valuation": {
                "TrailingPE": 28.5,
                "ForwardPE": 25.0,
                "PriceSalesTTM": 7.5,
                "PriceBookMRQ": 45.0,
            },
            "Financials": {
                "Balance_Sheet": {
                    "quarterly": {
                        "2025-12-31": {
                            "totalAssets": 350000000000,
                            "totalLiabilities": 250000000000,
                        },
                    },
                },
            },
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_fundamentals("AAPL")

        assert result["general"]["code"] == "AAPL"
        assert result["general"]["name"] == "Apple Inc"
        assert result["general"]["sector"] == "Technology"
        assert result["highlights"]["market_cap"] == 2500000000000
        assert result["highlights"]["pe_ratio"] == 28.5
        assert result["valuation"]["trailing_pe"] == 28.5

    @pytest.mark.asyncio
    async def test_get_fundamentals_empty_response(self, client):
        """Test handling of empty fundamentals response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {}
            result = await client.get_fundamentals("INVALID")

        assert result == {}


# =============================================================================
# BULK OPERATIONS TESTS
# =============================================================================


class TestBulkOperations:
    """Test bulk data operations."""

    @pytest.mark.asyncio
    async def test_get_bulk_prices_success(self, client):
        """Test successful bulk prices retrieval."""
        mock_data = [
            {
                "code": "AAPL",
                "exchange_short_name": "US",
                "date": "2026-01-07",
                "open": 150.25,
                "high": 152.50,
                "low": 149.80,
                "close": 151.75,
                "adjusted_close": 151.75,
                "volume": 45000000,
            },
            {
                "code": "MSFT",
                "exchange_short_name": "US",
                "date": "2026-01-07",
                "open": 380.00,
                "high": 385.00,
                "low": 378.00,
                "close": 383.50,
                "adjusted_close": 383.50,
                "volume": 25000000,
            },
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_bulk_prices("US")

        assert len(result) == 2
        assert result[0]["code"] == "AAPL"
        assert result[1]["code"] == "MSFT"
        assert result[0]["exchange"] == "US"

    @pytest.mark.asyncio
    async def test_get_bulk_prices_with_date(self, client):
        """Test bulk prices with specific date."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = []
            await client.get_bulk_prices("US", date="2026-01-07")

        mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_bulk_prices_empty_response(self, client):
        """Test handling of empty bulk response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = []
            result = await client.get_bulk_prices("INVALID")

        assert result == []


# =============================================================================
# DIVIDEND AND SPLITS TESTS
# =============================================================================


class TestDividendsAndSplits:
    """Test dividend and split history."""

    @pytest.mark.asyncio
    async def test_get_dividend_history_success(self, client):
        """Test successful dividend history retrieval."""
        mock_data = [
            {
                "date": "2025-11-10",
                "declarationDate": "2025-10-30",
                "recordDate": "2025-11-08",
                "paymentDate": "2025-11-14",
                "value": 0.24,
                "currency": "USD",
            },
            {
                "date": "2025-08-10",
                "declarationDate": "2025-07-30",
                "recordDate": "2025-08-08",
                "paymentDate": "2025-08-14",
                "value": 0.24,
                "currency": "USD",
            },
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_dividend_history("AAPL")

        assert len(result) == 2
        assert result[0]["dividend"] == 0.24
        assert result[0]["payment_date"] == "2025-11-14"
        assert result[0]["currency"] == "USD"

    @pytest.mark.asyncio
    async def test_get_splits_history_success(self, client):
        """Test successful splits history retrieval."""
        mock_data = [
            {"date": "2020-08-31", "split": "4/1"},
            {"date": "2014-06-09", "split": "7/1"},
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_splits_history("AAPL")

        assert len(result) == 2
        assert result[0]["split"] == "4/1"
        assert result[0]["date"] == "2020-08-31"


# =============================================================================
# SEARCH AND EXCHANGES TESTS
# =============================================================================


class TestSearchAndExchanges:
    """Test symbol search and exchange listing."""

    @pytest.mark.asyncio
    async def test_search_symbols_success(self, client):
        """Test successful symbol search."""
        mock_data = [
            {
                "Code": "AAPL",
                "Name": "Apple Inc",
                "Exchange": "NASDAQ",
                "Country": "USA",
                "Currency": "USD",
                "ISIN": "US0378331005",
                "Type": "Common Stock",
            },
            {
                "Code": "AAPL",
                "Name": "Apple Inc",
                "Exchange": "LSE",
                "Country": "UK",
                "Currency": "GBP",
                "ISIN": "US0378331005",
                "Type": "Common Stock",
            },
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.search_symbols("AAPL")

        assert len(result) == 2
        assert result[0]["code"] == "AAPL"
        assert result[0]["name"] == "Apple Inc"
        assert result[0]["exchange"] == "NASDAQ"

    @pytest.mark.asyncio
    async def test_get_exchanges_success(self, client):
        """Test successful exchange listing."""
        mock_data = [
            {"Code": "US", "Name": "US Exchanges", "Country": "USA", "Currency": "USD"},
            {"Code": "LSE", "Name": "London Stock Exchange", "Country": "UK", "Currency": "GBP"},
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_data
            result = await client.get_exchanges()

        assert len(result) == 2
        assert result[0]["code"] == "US"
        assert result[1]["code"] == "LSE"


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestErrorHandling:
    """Test error handling and retries."""

    @pytest.mark.asyncio
    async def test_authentication_error(self, client):
        """Test handling of authentication error."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Invalid API key"

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_client
            with pytest.raises(AuthenticationError, match="Invalid EODHD API key"):
                await client._request("/test")

    @pytest.mark.asyncio
    async def test_not_found_returns_empty(self, client):
        """Test that 404 returns empty list."""
        mock_response = MagicMock()
        mock_response.status_code = 404

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.is_closed = False

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_client
            result = await client._request("/test")

        assert result == []

    @pytest.mark.asyncio
    async def test_validate_credentials_success(self, client):
        """Test credential validation success."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"api_key": "valid"}
            result = await client.validate_credentials()

        assert result is True

    @pytest.mark.asyncio
    async def test_validate_credentials_failure(self, client):
        """Test credential validation failure."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = AuthenticationError("Invalid key")
            result = await client.validate_credentials()

        assert result is False


# =============================================================================
# CONTEXT MANAGER TESTS
# =============================================================================


class TestContextManager:
    """Test async context manager behavior."""

    @pytest.mark.asyncio
    async def test_async_context_manager(self, api_key):
        """Test client as async context manager."""
        async with EODHDClient(api_key=api_key) as client:
            assert client.api_key == api_key

    @pytest.mark.asyncio
    async def test_close_client(self, client):
        """Test closing the client."""
        # Create internal client
        await client._get_client()
        assert client._client is not None

        # Close it
        await client.close()
        assert client._client is None


# =============================================================================
# RATE LIMITER TESTS
# =============================================================================


class TestRateLimiter:
    """Test rate limiter functionality."""

    def test_rate_limiter_init(self):
        """Test rate limiter initialization."""
        limiter = RateLimiter(calls_per_minute=30)
        assert limiter.calls_per_minute == 30
        assert limiter.calls == []

    @pytest.mark.asyncio
    async def test_rate_limiter_acquire(self):
        """Test acquiring rate limit slot."""
        limiter = RateLimiter(calls_per_minute=100)
        await limiter.acquire()
        assert len(limiter.calls) == 1

    @pytest.mark.asyncio
    async def test_rate_limiter_multiple_acquires(self):
        """Test multiple rate limit acquisitions."""
        limiter = RateLimiter(calls_per_minute=100)
        for _ in range(5):
            await limiter.acquire()
        assert len(limiter.calls) == 5


# =============================================================================
# PARSER TESTS
# =============================================================================


class TestParsers:
    """Test response parser methods."""

    def test_parse_historical_prices(self, client):
        """Test historical price parsing."""
        data = [
            {
                "date": "2026-01-07",
                "open": 100.0,
                "high": 105.0,
                "low": 99.0,
                "close": 104.0,
                "adjusted_close": 104.0,
                "volume": 1000000,
            }
        ]
        result = client._parse_historical_prices(data)

        assert len(result) == 1
        assert result[0]["open"] == 100.0
        assert result[0]["volume"] == 1000000

    def test_parse_historical_prices_missing_fields(self, client):
        """Test parsing with missing fields uses defaults."""
        data = [{"date": "2026-01-07"}]
        result = client._parse_historical_prices(data)

        assert result[0]["open"] == 0.0
        assert result[0]["volume"] == 0

    def test_parse_real_time_quote(self, client):
        """Test real-time quote parsing."""
        data = {
            "code": "AAPL.US",
            "timestamp": 1704600000,
            "gmtoffset": -18000,
            "open": 150.0,
            "high": 155.0,
            "low": 149.0,
            "close": 154.0,
            "volume": 50000000,
            "previousClose": 150.0,
            "change": 4.0,
            "change_p": 2.67,
        }
        result = client._parse_real_time_quote(data)

        assert result["code"] == "AAPL.US"
        assert result["gmt_offset"] == -18000
        assert result["change_percent"] == 2.67

    def test_extract_latest_period_quarterly(self, client):
        """Test extracting latest quarterly period."""
        data = {
            "quarterly": {
                "2025-12-31": {"assets": 100},
                "2025-09-30": {"assets": 95},
            },
            "yearly": {
                "2024-12-31": {"assets": 90},
            },
        }
        result = client._extract_latest_period(data)

        assert result["assets"] == 100  # Most recent quarterly

    def test_extract_latest_period_yearly_only(self, client):
        """Test extracting when only yearly available."""
        data = {
            "yearly": {
                "2024-12-31": {"revenue": 1000000},
            },
        }
        result = client._extract_latest_period(data)

        assert result["revenue"] == 1000000

    def test_extract_latest_period_empty(self, client):
        """Test extracting from empty data."""
        result = client._extract_latest_period({})
        assert result == {}

    def test_parse_bulk_prices(self, client):
        """Test bulk prices parsing."""
        data = [
            {
                "code": "AAPL",
                "exchange_short_name": "US",
                "date": "2026-01-07",
                "close": 150.0,
                "volume": 1000000,
            }
        ]
        result = client._parse_bulk_prices(data)

        assert len(result) == 1
        assert result[0]["code"] == "AAPL"
        assert result[0]["exchange"] == "US"

    def test_parse_dividend_history(self, client):
        """Test dividend history parsing."""
        data = [
            {
                "date": "2025-11-10",
                "declarationDate": "2025-10-30",
                "recordDate": "2025-11-08",
                "paymentDate": "2025-11-14",
                "value": 0.24,
                "currency": "USD",
            }
        ]
        result = client._parse_dividend_history(data)

        assert len(result) == 1
        assert result[0]["dividend"] == 0.24
        assert result[0]["declaration_date"] == "2025-10-30"

    def test_parse_splits_history(self, client):
        """Test splits history parsing."""
        data = [{"date": "2020-08-31", "split": "4/1"}]
        result = client._parse_splits_history(data)

        assert len(result) == 1
        assert result[0]["split"] == "4/1"
