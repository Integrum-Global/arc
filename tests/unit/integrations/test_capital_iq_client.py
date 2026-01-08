"""Unit tests for Capital IQ client."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from arc.core.exceptions import (
    AuthenticationError,
    IntegrationError,
    RateLimitError,
)
from arc.integrations.capital_iq import (
    ALL_FIELD_MAPPINGS,
    BALANCE_SHEET_MAPPING,
    CASH_FLOW_MAPPING,
    INCOME_STATEMENT_MAPPING,
    CapitalIQClient,
    CapitalIQConfig,
    OAuthToken,
    PeriodType,
    StatementType,
)


# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def api_credentials():
    """Test API credentials."""
    return {
        "api_key": "test_api_key_123",
        "api_secret": "test_api_secret_456",
    }


@pytest.fixture
def client(api_credentials):
    """Create Capital IQ client."""
    return CapitalIQClient(
        api_key=api_credentials["api_key"],
        api_secret=api_credentials["api_secret"],
    )


@pytest.fixture
def mock_token():
    """Create a mock valid OAuth token."""
    return OAuthToken(
        access_token="mock_access_token_xyz",
        expires_at=datetime.now(UTC) + timedelta(hours=1),
        token_type="Bearer",
    )


@pytest.fixture
def mock_http_client():
    """Create a mock HTTP client."""
    return AsyncMock(spec=httpx.AsyncClient)


# =============================================================================
# OAUTH TOKEN TESTS
# =============================================================================


class TestOAuthToken:
    """Test OAuth token dataclass."""

    def test_token_not_expired(self):
        """Test token that is not expired."""
        token = OAuthToken(
            access_token="test",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        assert not token.is_expired

    def test_token_expired(self):
        """Test token that is expired."""
        token = OAuthToken(
            access_token="test",
            expires_at=datetime.now(UTC) - timedelta(hours=1),
        )
        assert token.is_expired

    def test_token_expires_within_buffer(self):
        """Test token that expires within 60s buffer is considered expired."""
        token = OAuthToken(
            access_token="test",
            expires_at=datetime.now(UTC) + timedelta(seconds=30),  # Within 60s buffer
        )
        assert token.is_expired

    def test_token_default_type(self):
        """Test token default type is Bearer."""
        token = OAuthToken(
            access_token="test",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        assert token.token_type == "Bearer"


# =============================================================================
# FIELD MAPPINGS TESTS
# =============================================================================


class TestFieldMappings:
    """Test field mappings."""

    def test_income_statement_mapping_has_key_fields(self):
        """Test income statement mapping contains key fields."""
        assert "IQ_TOTAL_REV" in INCOME_STATEMENT_MAPPING
        assert "IQ_NI" in INCOME_STATEMENT_MAPPING
        assert "IQ_EBITDA" in INCOME_STATEMENT_MAPPING
        assert INCOME_STATEMENT_MAPPING["IQ_TOTAL_REV"] == "revenue"
        assert INCOME_STATEMENT_MAPPING["IQ_NI"] == "net_income"

    def test_balance_sheet_mapping_has_key_fields(self):
        """Test balance sheet mapping contains key fields."""
        assert "IQ_TOTAL_ASSETS" in BALANCE_SHEET_MAPPING
        assert "IQ_TOTAL_DEBT" in BALANCE_SHEET_MAPPING
        assert "IQ_TOTAL_EQUITY" in BALANCE_SHEET_MAPPING
        assert BALANCE_SHEET_MAPPING["IQ_TOTAL_ASSETS"] == "total_assets"
        assert BALANCE_SHEET_MAPPING["IQ_TOTAL_DEBT"] == "total_debt"

    def test_cash_flow_mapping_has_key_fields(self):
        """Test cash flow mapping contains key fields."""
        assert "IQ_CFO" in CASH_FLOW_MAPPING
        assert "IQ_FCF" in CASH_FLOW_MAPPING
        assert "IQ_CAPEX" in CASH_FLOW_MAPPING
        assert CASH_FLOW_MAPPING["IQ_CFO"] == "operating_cash_flow"
        assert CASH_FLOW_MAPPING["IQ_FCF"] == "free_cash_flow"

    def test_all_mappings_combined(self):
        """Test all mappings are combined correctly."""
        assert len(ALL_FIELD_MAPPINGS) == (
            len(INCOME_STATEMENT_MAPPING)
            + len(BALANCE_SHEET_MAPPING)
            + len(CASH_FLOW_MAPPING)
        )


# =============================================================================
# CLIENT INITIALIZATION TESTS
# =============================================================================


class TestCapitalIQClientInit:
    """Test client initialization."""

    def test_init_with_credentials(self, api_credentials):
        """Test client initialization with credentials."""
        client = CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
        )
        assert client.api_key == api_credentials["api_key"]
        assert client.api_secret == api_credentials["api_secret"]
        assert client.timeout == 30.0
        assert client.max_retries == 3
        assert client.base_delay == 1.0

    def test_init_with_custom_timeout(self, api_credentials):
        """Test client with custom timeout."""
        client = CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
            timeout=60.0,
        )
        assert client.timeout == 60.0

    def test_init_with_custom_retries(self, api_credentials):
        """Test client with custom retry count."""
        client = CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
            max_retries=5,
        )
        assert client.max_retries == 5

    def test_init_with_custom_base_url(self, api_credentials):
        """Test client with custom base URL."""
        client = CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
            base_url="https://custom.api.example.com/",
        )
        assert client.base_url == "https://custom.api.example.com"

    def test_init_strips_trailing_slash(self, api_credentials):
        """Test that trailing slash is stripped from base URL."""
        client = CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
            base_url="https://api.example.com/",
        )
        assert client.base_url == "https://api.example.com"

    def test_init_without_credentials(self):
        """Test client can be initialized without credentials (for env var usage)."""
        client = CapitalIQClient()
        assert client.api_key is None
        assert client.api_secret is None


# =============================================================================
# CONFIG TESTS
# =============================================================================


class TestCapitalIQConfig:
    """Test Capital IQ configuration."""

    def test_config_defaults(self):
        """Test config defaults."""
        config = CapitalIQConfig(api_key="key", api_secret="secret")
        assert config.timeout == 30.0
        assert config.max_retries == 3
        assert config.base_delay == 1.0
        assert config.cache_ttl_seconds == 86400

    def test_config_custom_values(self):
        """Test config with custom values."""
        config = CapitalIQConfig(
            api_key="key",
            api_secret="secret",
            timeout=60.0,
            max_retries=5,
            cache_ttl_seconds=3600,
        )
        assert config.timeout == 60.0
        assert config.max_retries == 5
        assert config.cache_ttl_seconds == 3600


# =============================================================================
# AUTHENTICATION TESTS
# =============================================================================


class TestAuthentication:
    """Test OAuth authentication."""

    @pytest.mark.asyncio
    async def test_ensure_token_success(self, client):
        """Test successful token acquisition."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_token",
            "expires_in": 3600,
            "token_type": "Bearer",
        }

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            token = await client._ensure_token()

        assert token == "new_token"
        assert client._token is not None
        assert client._token.access_token == "new_token"

    @pytest.mark.asyncio
    async def test_ensure_token_uses_cached_token(self, client, mock_token):
        """Test that valid cached token is reused."""
        client._token = mock_token

        token = await client._ensure_token()

        assert token == mock_token.access_token

    @pytest.mark.asyncio
    async def test_ensure_token_refreshes_expired_token(self, client):
        """Test that expired token triggers refresh."""
        expired_token = OAuthToken(
            access_token="old_token",
            expires_at=datetime.now(UTC) - timedelta(hours=1),
        )
        client._token = expired_token

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_token",
            "expires_in": 3600,
        }

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            token = await client._ensure_token()

        assert token == "new_token"

    @pytest.mark.asyncio
    async def test_ensure_token_no_credentials_raises_error(self):
        """Test that missing credentials raises AuthenticationError."""
        client = CapitalIQClient()

        with pytest.raises(AuthenticationError, match="API key and secret are required"):
            await client._ensure_token()

    @pytest.mark.asyncio
    async def test_ensure_token_invalid_credentials(self, client):
        """Test that invalid credentials raises AuthenticationError."""
        mock_response = MagicMock()
        mock_response.status_code = 401

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            with pytest.raises(AuthenticationError, match="Invalid Capital IQ credentials"):
                await client._ensure_token()

    @pytest.mark.asyncio
    async def test_validate_credentials_success(self, client, mock_token):
        """Test successful credential validation."""
        client._token = mock_token
        result = await client.validate_credentials()
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_credentials_failure(self):
        """Test failed credential validation."""
        client = CapitalIQClient()
        result = await client.validate_credentials()
        assert result is False


# =============================================================================
# HTTP REQUEST TESTS
# =============================================================================


class TestHttpRequest:
    """Test HTTP request handling."""

    @pytest.mark.asyncio
    async def test_request_success(self, client, mock_token):
        """Test successful HTTP request."""
        client._token = mock_token

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.return_value = mock_response
            mock_get.return_value = mock_http

            result = await client._request("GET", "/test")

        assert result == {"data": "test"}

    @pytest.mark.asyncio
    async def test_request_post_with_json(self, client, mock_token):
        """Test POST request with JSON body."""
        client._token = mock_token

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await client._request(
                "POST", "/test", json_data={"key": "value"}
            )

        assert result == {"success": True}

    @pytest.mark.asyncio
    async def test_request_404_returns_empty(self, client, mock_token):
        """Test that 404 response returns empty dict."""
        client._token = mock_token

        mock_response = MagicMock()
        mock_response.status_code = 404

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.return_value = mock_response
            mock_get.return_value = mock_http

            result = await client._request("GET", "/test")

        assert result == {}

    @pytest.mark.asyncio
    async def test_request_rate_limit_retries(self, client, mock_token):
        """Test that rate limit triggers retry."""
        client._token = mock_token
        client.base_delay = 0.01  # Faster for testing

        rate_limit_response = MagicMock()
        rate_limit_response.status_code = 429

        success_response = MagicMock()
        success_response.status_code = 200
        success_response.json.return_value = {"data": "success"}

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.side_effect = [rate_limit_response, success_response]
            mock_get.return_value = mock_http

            result = await client._request("GET", "/test")

        assert result == {"data": "success"}
        assert mock_http.get.call_count == 2

    @pytest.mark.asyncio
    async def test_request_api_error_raises_integration_error(self, client, mock_token):
        """Test that API error raises IntegrationError."""
        client._token = mock_token

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.return_value = mock_response
            mock_get.return_value = mock_http

            with pytest.raises(IntegrationError, match="Capital IQ API error 500"):
                await client._request("GET", "/test")


# =============================================================================
# COMPANY PROFILE TESTS
# =============================================================================


class TestCompanyProfile:
    """Test company profile retrieval."""

    @pytest.mark.asyncio
    async def test_get_company_profile_success(self, client):
        """Test successful company profile retrieval."""
        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "Rows": [{"Row": ["Apple Inc."]}]},
                {"Mnemonic": "IQ_GVKEY", "Rows": [{"Row": ["001690"]}]},
                {"Mnemonic": "IQ_PRIMARY_TICKER", "Rows": [{"Row": ["AAPL"]}]},
                {"Mnemonic": "IQ_SECTOR", "Rows": [{"Row": ["Technology"]}]},
                {"Mnemonic": "IQ_INDUSTRY", "Rows": [{"Row": ["Consumer Electronics"]}]},
                {"Mnemonic": "IQ_COUNTRY_ISO", "Rows": [{"Row": ["US"]}]},
                {"Mnemonic": "IQ_TOTAL_EMPLOYEES", "Rows": [{"Row": [164000]}]},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_company_profile("AAPL")

        assert result["name"] == "Apple Inc."
        assert result["gvkey"] == "001690"
        assert result["ticker"] == "AAPL"
        assert result["sector"] == "Technology"
        assert result["industry"] == "Consumer Electronics"
        assert result["employees"] == 164000

    @pytest.mark.asyncio
    async def test_get_company_profile_with_cache(self, client):
        """Test that profile is cached."""
        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "Rows": [{"Row": ["Apple Inc."]}]},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response

            # First call
            await client.get_company_profile("AAPL", use_cache=True)
            # Second call should use cache
            await client.get_company_profile("AAPL", use_cache=True)

        # Should only be called once due to cache
        assert mock_req.call_count == 1

    @pytest.mark.asyncio
    async def test_get_company_profile_cache_bypass(self, client):
        """Test that cache can be bypassed."""
        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "Rows": [{"Row": ["Apple Inc."]}]},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response

            await client.get_company_profile("AAPL", use_cache=False)
            await client.get_company_profile("AAPL", use_cache=False)

        # Should be called twice (no caching)
        assert mock_req.call_count == 2

    @pytest.mark.asyncio
    async def test_get_company_profile_empty_response(self, client):
        """Test handling of empty response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = {}
            result = await client.get_company_profile("INVALID")

        assert result == {}

    @pytest.mark.asyncio
    async def test_get_company_profile_identifier_types(self, client):
        """Test different identifier types."""
        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "Rows": [{"Row": ["Apple Inc."]}]},
            ]
        }

        for id_type in ["ticker", "gvkey", "isin", "cusip"]:
            with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
                mock_req.return_value = mock_response
                result = await client.get_company_profile(
                    "TEST", identifier_type=id_type, use_cache=False
                )

            assert result["name"] == "Apple Inc."
            # Check that identifier type was passed in request
            call_args = mock_req.call_args
            assert call_args[1]["json_data"]["inputRequests"][0]["identifierType"] == id_type.upper()


# =============================================================================
# FINANCIAL STATEMENTS TESTS
# =============================================================================


class TestFinancialStatements:
    """Test financial statement retrieval."""

    @pytest.mark.asyncio
    async def test_get_financials_quarterly(self, client):
        """Test quarterly financials retrieval."""
        mock_response = {
            "GDSHEOutputs": [
                {
                    "Mnemonic": "IQ_TOTAL_REV",
                    "Rows": [{"Row": [100000000]}, {"Row": [95000000]}],
                },
                {
                    "Mnemonic": "IQ_NI",
                    "Rows": [{"Row": [25000000]}, {"Row": [22000000]}],
                },
                {
                    "Mnemonic": "IQ_PERIODDATE",
                    "Rows": [{"Row": ["2025-12-31"]}, {"Row": ["2025-09-30"]}],
                },
                {
                    "Mnemonic": "IQ_FISCAL_YEAR",
                    "Rows": [{"Row": [2025]}, {"Row": [2025]}],
                },
                {
                    "Mnemonic": "IQ_FISCAL_QUARTER",
                    "Rows": [{"Row": [4]}, {"Row": [3]}],
                },
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_financials(
                "AAPL", period_type=PeriodType.QUARTERLY, num_periods=4
            )

        assert len(result) == 2
        assert result[0]["revenue"] == 100000000
        assert result[0]["net_income"] == 25000000
        assert result[0]["period_date"] == "2025-12-31"
        assert result[0]["fiscal_quarter"] == 4
        assert result[1]["revenue"] == 95000000

    @pytest.mark.asyncio
    async def test_get_financials_annual(self, client):
        """Test annual financials retrieval."""
        mock_response = {
            "GDSHEOutputs": [
                {
                    "Mnemonic": "IQ_TOTAL_REV",
                    "Rows": [{"Row": [400000000]}, {"Row": [380000000]}],
                },
                {
                    "Mnemonic": "IQ_FISCAL_YEAR",
                    "Rows": [{"Row": [2025]}, {"Row": [2024]}],
                },
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_financials(
                "AAPL", period_type=PeriodType.ANNUAL, num_periods=2
            )

        assert len(result) == 2
        assert result[0]["revenue"] == 400000000
        assert result[0]["period_type"] == "annual"

    @pytest.mark.asyncio
    async def test_get_income_statement_only(self, client):
        """Test income statement only."""
        mock_response = {"GDSHEOutputs": []}

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            await client.get_income_statement("AAPL")

        call_args = mock_req.call_args
        mnemonics = call_args[1]["json_data"]["inputRequests"][0]["mnemonics"]
        # Should include income statement fields
        assert "IQ_TOTAL_REV" in mnemonics
        assert "IQ_NI" in mnemonics
        # Should NOT include balance sheet fields
        assert "IQ_TOTAL_ASSETS" not in mnemonics

    @pytest.mark.asyncio
    async def test_get_balance_sheet_only(self, client):
        """Test balance sheet only."""
        mock_response = {"GDSHEOutputs": []}

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            await client.get_balance_sheet("AAPL")

        call_args = mock_req.call_args
        mnemonics = call_args[1]["json_data"]["inputRequests"][0]["mnemonics"]
        # Should include balance sheet fields
        assert "IQ_TOTAL_ASSETS" in mnemonics
        assert "IQ_TOTAL_DEBT" in mnemonics
        # Should NOT include income statement fields
        assert "IQ_TOTAL_REV" not in mnemonics

    @pytest.mark.asyncio
    async def test_get_cash_flow_only(self, client):
        """Test cash flow only."""
        mock_response = {"GDSHEOutputs": []}

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            await client.get_cash_flow("AAPL")

        call_args = mock_req.call_args
        mnemonics = call_args[1]["json_data"]["inputRequests"][0]["mnemonics"]
        # Should include cash flow fields
        assert "IQ_CFO" in mnemonics
        assert "IQ_FCF" in mnemonics
        # Should NOT include balance sheet fields
        assert "IQ_TOTAL_ASSETS" not in mnemonics

    @pytest.mark.asyncio
    async def test_get_financials_empty_response(self, client):
        """Test handling of empty financials response."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = {}
            result = await client.get_financials("INVALID")

        assert result == []


# =============================================================================
# BULK OPERATIONS TESTS
# =============================================================================


class TestBulkOperations:
    """Test bulk operations."""

    @pytest.mark.asyncio
    async def test_get_bulk_profiles(self, client):
        """Test bulk profile retrieval."""
        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "InputIndex": 0, "Rows": [{"Row": ["Apple Inc."]}]},
                {"Mnemonic": "IQ_GVKEY", "InputIndex": 0, "Rows": [{"Row": ["001690"]}]},
                {"Mnemonic": "IQ_COMPANY_NAME", "InputIndex": 1, "Rows": [{"Row": ["Microsoft Corp"]}]},
                {"Mnemonic": "IQ_GVKEY", "InputIndex": 1, "Rows": [{"Row": ["002410"]}]},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_bulk_profiles(["AAPL", "MSFT"], use_cache=False)

        assert "AAPL" in result
        assert "MSFT" in result
        assert result["AAPL"]["name"] == "Apple Inc."
        assert result["MSFT"]["name"] == "Microsoft Corp"

    @pytest.mark.asyncio
    async def test_get_bulk_profiles_uses_cache(self, client):
        """Test bulk profiles uses cache for known entries."""
        # Pre-populate cache
        client._profile_cache["profile:ticker:AAPL"] = (
            {"name": "Apple Inc."},
            datetime.now(UTC),
        )

        mock_response = {
            "GDSPOutputs": [
                {"Mnemonic": "IQ_COMPANY_NAME", "InputIndex": 0, "Rows": [{"Row": ["Microsoft Corp"]}]},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_bulk_profiles(["AAPL", "MSFT"], use_cache=True)

        assert result["AAPL"]["name"] == "Apple Inc."
        assert result["MSFT"]["name"] == "Microsoft Corp"
        # Only MSFT should be in the request
        call_args = mock_req.call_args
        identifiers = [
            r["identifier"] for r in call_args[1]["json_data"]["inputRequests"]
        ]
        assert "AAPL" not in identifiers
        assert "MSFT" in identifiers

    @pytest.mark.asyncio
    async def test_get_bulk_financials(self, client):
        """Test bulk financials retrieval."""
        mock_response = {
            "GDSHEOutputs": [
                {
                    "Mnemonic": "IQ_TOTAL_REV",
                    "InputIndex": 0,
                    "Rows": [{"Row": [100000000]}],
                },
                {
                    "Mnemonic": "IQ_TOTAL_REV",
                    "InputIndex": 1,
                    "Rows": [{"Row": [200000000]}],
                },
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.get_bulk_financials(
                ["AAPL", "MSFT"], period_type=PeriodType.QUARTERLY
            )

        assert "AAPL" in result
        assert "MSFT" in result
        assert result["AAPL"][0]["revenue"] == 100000000
        assert result["MSFT"][0]["revenue"] == 200000000

    @pytest.mark.asyncio
    async def test_get_bulk_financials_error_returns_empty(self, client):
        """Test bulk financials error handling."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.side_effect = IntegrationError(
                provider="CapitalIQ", message="Error"
            )
            result = await client.get_bulk_financials(["AAPL", "MSFT"])

        assert result == {}


# =============================================================================
# IDENTIFIER LOOKUP TESTS
# =============================================================================


class TestIdentifierLookup:
    """Test identifier lookup."""

    @pytest.mark.asyncio
    async def test_lookup_identifier_success(self, client):
        """Test successful identifier lookup."""
        mock_response = {
            "results": [
                {
                    "gvkey": "001690",
                    "companyId": "12345",
                    "companyName": "Apple Inc.",
                    "ticker": "AAPL",
                    "exchange": "NASDAQ",
                    "country": "US",
                },
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.lookup_identifier("Apple")

        assert len(result) == 1
        assert result[0]["name"] == "Apple Inc."
        assert result[0]["ticker"] == "AAPL"
        assert result[0]["gvkey"] == "001690"

    @pytest.mark.asyncio
    async def test_lookup_identifier_empty(self, client):
        """Test lookup with no results."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = {"results": []}
            result = await client.lookup_identifier("NonexistentCompany")

        assert result == []

    @pytest.mark.asyncio
    async def test_lookup_identifier_error(self, client):
        """Test lookup error handling."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.side_effect = IntegrationError(
                provider="CapitalIQ", message="Error"
            )
            result = await client.lookup_identifier("Test")

        assert result == []


# =============================================================================
# CACHE TESTS
# =============================================================================


class TestCache:
    """Test cache functionality."""

    def test_clear_cache(self, client):
        """Test cache clearing."""
        client._profile_cache["key1"] = ({"data": 1}, datetime.now(UTC))
        client._profile_cache["key2"] = ({"data": 2}, datetime.now(UTC))

        client.clear_cache()

        assert len(client._profile_cache) == 0

    def test_get_cache_stats(self, client):
        """Test cache stats."""
        # Add valid entry
        client._profile_cache["valid"] = ({"data": 1}, datetime.now(UTC))
        # Add expired entry
        client._profile_cache["expired"] = (
            {"data": 2},
            datetime.now(UTC) - timedelta(days=2),
        )

        stats = client.get_cache_stats()

        assert stats["total_entries"] == 2
        assert stats["valid_entries"] == 1
        assert stats["expired_entries"] == 1

    def test_cache_check_expired(self, client):
        """Test that expired cache entries return None."""
        client._profile_cache["expired"] = (
            {"data": 1},
            datetime.now(UTC) - timedelta(days=2),
        )

        result = client._check_cache("expired")

        assert result is None
        # Entry should be removed
        assert "expired" not in client._profile_cache

    def test_cache_check_valid(self, client):
        """Test that valid cache entries are returned."""
        client._profile_cache["valid"] = ({"data": 1}, datetime.now(UTC))

        result = client._check_cache("valid")

        assert result == {"data": 1}


# =============================================================================
# UTILITY METHOD TESTS
# =============================================================================


class TestUtilityMethods:
    """Test utility methods."""

    def test_safe_float_valid(self):
        """Test safe_float with valid input."""
        assert CapitalIQClient._safe_float(100.5) == 100.5
        assert CapitalIQClient._safe_float("100.5") == 100.5
        assert CapitalIQClient._safe_float(100) == 100.0

    def test_safe_float_invalid(self):
        """Test safe_float with invalid input."""
        assert CapitalIQClient._safe_float(None) is None
        assert CapitalIQClient._safe_float("invalid") is None
        assert CapitalIQClient._safe_float({}) is None

    def test_safe_int_valid(self):
        """Test safe_int with valid input."""
        assert CapitalIQClient._safe_int(100) == 100
        assert CapitalIQClient._safe_int(100.5) == 100
        assert CapitalIQClient._safe_int("100") == 100

    def test_safe_int_invalid(self):
        """Test safe_int with invalid input."""
        assert CapitalIQClient._safe_int(None) is None
        assert CapitalIQClient._safe_int("invalid") is None
        assert CapitalIQClient._safe_int({}) is None


# =============================================================================
# PERIOD TYPE AND STATEMENT TYPE TESTS
# =============================================================================


class TestEnums:
    """Test enum values."""

    def test_period_type_values(self):
        """Test PeriodType enum values."""
        assert PeriodType.QUARTERLY.value == "quarterly"
        assert PeriodType.ANNUAL.value == "annual"

    def test_statement_type_values(self):
        """Test StatementType enum values."""
        assert StatementType.INCOME.value == "income_statement"
        assert StatementType.BALANCE_SHEET.value == "balance_sheet"
        assert StatementType.CASH_FLOW.value == "cash_flow"
        assert StatementType.ALL.value == "all"


# =============================================================================
# CONTEXT MANAGER TESTS
# =============================================================================


class TestContextManager:
    """Test async context manager."""

    @pytest.mark.asyncio
    async def test_context_manager_enter_exit(self, api_credentials):
        """Test async context manager enter and exit."""
        async with CapitalIQClient(
            api_key=api_credentials["api_key"],
            api_secret=api_credentials["api_secret"],
        ) as client:
            assert isinstance(client, CapitalIQClient)

    @pytest.mark.asyncio
    async def test_close_cleans_up_client(self, client):
        """Test that close properly cleans up HTTP client."""
        # Create a mock client
        mock_http = MagicMock()
        mock_http.is_closed = False
        mock_http.aclose = AsyncMock()
        client._client = mock_http

        await client.close()

        mock_http.aclose.assert_called_once()
        assert client._client is None

    @pytest.mark.asyncio
    async def test_close_handles_already_closed(self, client):
        """Test that close handles already closed client."""
        mock_http = MagicMock()
        mock_http.is_closed = True
        client._client = mock_http

        await client.close()  # Should not raise


# =============================================================================
# TIMEOUT AND RETRY TESTS
# =============================================================================


class TestTimeoutAndRetry:
    """Test timeout and retry behavior."""

    @pytest.mark.asyncio
    async def test_request_timeout_retries(self, client, mock_token):
        """Test that timeout triggers retry."""
        client._token = mock_token
        client.base_delay = 0.01  # Faster for testing

        success_response = MagicMock()
        success_response.status_code = 200
        success_response.json.return_value = {"data": "success"}

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.side_effect = [
                httpx.TimeoutException("Timeout"),
                success_response,
            ]
            mock_get.return_value = mock_http

            result = await client._request("GET", "/test")

        assert result == {"data": "success"}
        assert mock_http.get.call_count == 2

    @pytest.mark.asyncio
    async def test_request_max_retries_exceeded(self, client, mock_token):
        """Test that max retries raises error."""
        client._token = mock_token
        client.max_retries = 2
        client.base_delay = 0.01

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.side_effect = httpx.TimeoutException("Timeout")
            mock_get.return_value = mock_http

            with pytest.raises(IntegrationError, match="failed after"):
                await client._request("GET", "/test")

    @pytest.mark.asyncio
    async def test_request_rate_limit_max_retries(self, client, mock_token):
        """Test rate limit with max retries exceeded."""
        client._token = mock_token
        client.max_retries = 2
        client.base_delay = 0.01

        rate_limit_response = MagicMock()
        rate_limit_response.status_code = 429

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_http = AsyncMock()
            mock_http.get.return_value = rate_limit_response
            mock_get.return_value = mock_http

            with pytest.raises(RateLimitError, match="rate limit exceeded"):
                await client._request("GET", "/test")
