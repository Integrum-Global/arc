"""
Capital IQ API client for company fundamentals and financial data.

Provides access to:
- Company profiles
- Financial statements (Income, Balance Sheet, Cash Flow)
- Quarterly and annual data
- Bulk operations for efficiency

Authentication: OAuth 2.0 Client Credentials Flow
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

import httpx

from arc.core.exceptions import (
    AuthenticationError,
    IntegrationError,
    RateLimitError,
)

logger = logging.getLogger(__name__)


class PeriodType(str, Enum):
    """Financial statement period types."""

    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class StatementType(str, Enum):
    """Financial statement types."""

    INCOME = "income_statement"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"
    ALL = "all"


@dataclass
class OAuthToken:
    """OAuth token with expiry tracking."""

    access_token: str
    expires_at: datetime
    token_type: str = "Bearer"

    @property
    def is_expired(self) -> bool:
        """Check if token is expired (with 60s buffer)."""
        return datetime.now(UTC) >= (self.expires_at - timedelta(seconds=60))


# Field mappings from Capital IQ to ARC schema
INCOME_STATEMENT_MAPPING: dict[str, str] = {
    "IQ_TOTAL_REV": "revenue",
    "IQ_COST_OF_REV": "cost_of_revenue",
    "IQ_GROSS_PROFIT": "gross_profit",
    "IQ_OPER_INC": "operating_income",
    "IQ_EBITDA": "ebitda",
    "IQ_EBIT": "ebit",
    "IQ_NI": "net_income",
    "IQ_BASIC_EPS": "eps_basic",
    "IQ_DILUT_EPS": "eps_diluted",
    "IQ_TOTAL_OP_EXP": "operating_expenses",
    "IQ_RD_EXP": "research_development",
    "IQ_SGA": "sga_expense",
    "IQ_INT_EXP": "interest_expense",
    "IQ_INC_TAX": "income_tax_expense",
}

BALANCE_SHEET_MAPPING: dict[str, str] = {
    "IQ_TOTAL_ASSETS": "total_assets",
    "IQ_TOTAL_CURR_ASSETS": "current_assets",
    "IQ_CASH_ST_INVEST": "cash_and_equivalents",
    "IQ_AR": "accounts_receivable",
    "IQ_INV": "inventory",
    "IQ_PREPAID": "prepaid_expenses",
    "IQ_PP_AND_EQ": "property_plant_equipment",
    "IQ_GOODWILL": "goodwill",
    "IQ_INTANGIBLES": "intangible_assets",
    "IQ_TOTAL_LIAB": "total_liabilities",
    "IQ_TOTAL_CURR_LIAB": "current_liabilities",
    "IQ_AP": "accounts_payable",
    "IQ_ST_DEBT": "short_term_debt",
    "IQ_LT_DEBT": "long_term_debt",
    "IQ_TOTAL_DEBT": "total_debt",
    "IQ_TOTAL_EQUITY": "total_equity",
    "IQ_COMMON_EQUITY": "common_equity",
    "IQ_RETAINED_EARN": "retained_earnings",
    "IQ_COMMON_SHARES_OUT": "shares_outstanding",
}

CASH_FLOW_MAPPING: dict[str, str] = {
    "IQ_CFO": "operating_cash_flow",
    "IQ_CAPEX": "capital_expenditures",
    "IQ_FCF": "free_cash_flow",
    "IQ_DIV_PAID": "dividends_paid",
    "IQ_DEPR_AMORT": "depreciation_amortization",
    "IQ_STOCK_BASED_COMP": "stock_based_compensation",
    "IQ_CHANGE_WC": "change_in_working_capital",
    "IQ_ACQUIS": "acquisitions",
    "IQ_DEBT_ISSUED": "debt_issuance",
    "IQ_DEBT_REPAID": "debt_repayment",
    "IQ_SHARES_REPURCHASED": "share_repurchases",
    "IQ_CFI": "investing_cash_flow",
    "IQ_CFF": "financing_cash_flow",
}

# Combined mapping for all fields
ALL_FIELD_MAPPINGS: dict[str, str] = {
    **INCOME_STATEMENT_MAPPING,
    **BALANCE_SHEET_MAPPING,
    **CASH_FLOW_MAPPING,
}


@dataclass
class CapitalIQConfig:
    """Configuration for Capital IQ client."""

    api_key: str
    api_secret: str
    base_url: str = "https://api-ciq.spglobal.com"
    timeout: float = 30.0
    max_retries: int = 3
    base_delay: float = 1.0
    cache_ttl_seconds: int = 86400  # 24 hours for company profiles


class CapitalIQClient:
    """
    Async client for Capital IQ API.

    Features:
    - OAuth 2.0 token management with automatic refresh
    - Company profile retrieval
    - Financial statements (quarterly/annual)
    - Field mapping to ARC schema
    - Bulk operations for efficiency
    - Automatic retry with exponential backoff
    - Rate limit awareness
    """

    def __init__(
        self,
        api_key: str | None = None,
        api_secret: str | None = None,
        base_url: str = "https://api-ciq.spglobal.com",
        timeout: float = 30.0,
        max_retries: int = 3,
        base_delay: float = 1.0,
    ):
        """
        Initialize Capital IQ client.

        Args:
            api_key: Capital IQ API key (or use CAPITALIQ_API_KEY env var)
            api_secret: Capital IQ API secret (or use CAPITALIQ_API_SECRET env var)
            base_url: API base URL
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for failed requests
            base_delay: Base delay for exponential backoff
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.base_delay = base_delay

        self._client: httpx.AsyncClient | None = None
        self._token: OAuthToken | None = None
        self._token_lock = asyncio.Lock()

        # Profile cache with TTL
        self._profile_cache: dict[str, tuple[dict, datetime]] = {}
        self._cache_ttl = timedelta(hours=24)

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

    async def __aenter__(self) -> "CapitalIQClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_token(self) -> str:
        """
        Ensure valid OAuth token exists.

        Returns:
            Valid access token

        Raises:
            AuthenticationError: If credentials are invalid or missing
        """
        async with self._token_lock:
            if self._token and not self._token.is_expired:
                return self._token.access_token

            # Need to get new token
            if not self.api_key or not self.api_secret:
                raise AuthenticationError(
                    "Capital IQ API key and secret are required"
                )

            client = await self._get_client()
            token_url = f"{self.base_url}/oauth/token"

            try:
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.api_key,
                        "client_secret": self.api_secret,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if response.status_code == 200:
                    data = response.json()
                    expires_in = data.get("expires_in", 3600)
                    self._token = OAuthToken(
                        access_token=data["access_token"],
                        expires_at=datetime.now(UTC) + timedelta(seconds=expires_in),
                        token_type=data.get("token_type", "Bearer"),
                    )
                    logger.info("Capital IQ OAuth token obtained successfully")
                    return self._token.access_token
                elif response.status_code == 401:
                    raise AuthenticationError("Invalid Capital IQ credentials")
                else:
                    raise AuthenticationError(
                        f"Capital IQ token request failed: {response.status_code}"
                    )

            except httpx.RequestError as e:
                raise IntegrationError(
                    provider="CapitalIQ",
                    message=f"Failed to obtain OAuth token: {e}",
                ) from e

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: dict[str, Any] | None = None,
    ) -> Any:
        """
        Make an authenticated API request with retry logic.

        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint path
            params: Query parameters
            json_data: JSON body data

        Returns:
            Parsed JSON response

        Raises:
            RateLimitError: If rate limited
            AuthenticationError: If token is invalid
            IntegrationError: If request fails after retries
        """
        token = await self._ensure_token()
        client = await self._get_client()
        url = f"{self.base_url}{endpoint}"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        last_error: Exception | None = None

        for attempt in range(self.max_retries):
            try:
                if method.upper() == "GET":
                    response = await client.get(url, params=params, headers=headers)
                else:
                    response = await client.post(
                        url, params=params, json=json_data, headers=headers
                    )

                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    # Token expired - clear and retry once
                    self._token = None
                    if attempt == 0:
                        token = await self._ensure_token()
                        headers["Authorization"] = f"Bearer {token}"
                        continue
                    raise AuthenticationError("Capital IQ authentication failed")
                elif response.status_code == 429:
                    # Rate limited - wait with exponential backoff
                    delay = self.base_delay * (2**attempt)
                    logger.warning(
                        f"Rate limited by Capital IQ, waiting {delay:.1f}s "
                        f"(attempt {attempt + 1})"
                    )
                    await asyncio.sleep(delay)
                    continue
                elif response.status_code == 404:
                    # Entity not found - return empty
                    return {}
                else:
                    error_text = response.text[:200]
                    raise IntegrationError(
                        provider="CapitalIQ",
                        message=f"Capital IQ API error {response.status_code}: {error_text}",
                        response_code=response.status_code,
                    )

            except httpx.TimeoutException as e:
                last_error = e
                delay = self.base_delay * (2**attempt)
                logger.warning(f"Capital IQ timeout, retrying in {delay:.1f}s")
                await asyncio.sleep(delay)

            except httpx.RequestError as e:
                last_error = e
                delay = self.base_delay * (2**attempt)
                logger.warning(
                    f"Capital IQ request error: {e}, retrying in {delay:.1f}s"
                )
                await asyncio.sleep(delay)

        # All retries exhausted
        if last_error:
            raise IntegrationError(
                provider="CapitalIQ",
                message=f"Capital IQ request failed after {self.max_retries} retries: {last_error}",
            )
        raise RateLimitError(message="Capital IQ rate limit exceeded")

    async def validate_credentials(self) -> bool:
        """
        Validate API credentials by attempting to get OAuth token.

        Returns:
            True if credentials are valid

        Raises:
            AuthenticationError: If credentials are invalid
        """
        try:
            await self._ensure_token()
            return True
        except AuthenticationError:
            return False

    def _check_cache(self, cache_key: str) -> dict | None:
        """Check if cache entry exists and is not expired."""
        if cache_key in self._profile_cache:
            data, cached_at = self._profile_cache[cache_key]
            if datetime.now(UTC) - cached_at < self._cache_ttl:
                return data
            # Expired - remove from cache
            del self._profile_cache[cache_key]
        return None

    def _set_cache(self, cache_key: str, data: dict) -> None:
        """Set cache entry."""
        self._profile_cache[cache_key] = (data, datetime.now(UTC))

    async def get_company_profile(
        self,
        identifier: str,
        identifier_type: str = "ticker",
        use_cache: bool = True,
    ) -> dict[str, Any]:
        """
        Get company profile data.

        Args:
            identifier: Company identifier (ticker, GVKEY, ISIN, CUSIP)
            identifier_type: Type of identifier ("ticker", "gvkey", "isin", "cusip")
            use_cache: Whether to use cache (24h TTL)

        Returns:
            Company profile with fields:
            - gvkey: Capital IQ GVKEY identifier
            - iq_id: IQ Company ID
            - name: Company name
            - ticker: Primary ticker symbol
            - exchange: Primary exchange
            - sector: GICS sector
            - industry: GICS industry
            - country: Headquarters country
            - description: Business description
            - employees: Employee count
            - website: Company website
            - isin: ISIN code
            - cusip: CUSIP code
        """
        cache_key = f"profile:{identifier_type}:{identifier}"

        if use_cache:
            cached = self._check_cache(cache_key)
            if cached:
                logger.debug(f"Returning cached profile for {identifier}")
                return cached

        # Build request
        request_data = {
            "inputRequests": [
                {
                    "identifier": identifier,
                    "identifierType": identifier_type.upper(),
                    "function": "GDSP",  # Get Data Single Point
                    "mnemonics": [
                        "IQ_COMPANY_NAME",
                        "IQ_COMPANY_ID",
                        "IQ_GVKEY",
                        "IQ_PRIMARY_TICKER",
                        "IQ_PRIMARY_EXCHANGE",
                        "IQ_SECTOR",
                        "IQ_INDUSTRY",
                        "IQ_COUNTRY_ISO",
                        "IQ_BUSINESS_DESC",
                        "IQ_TOTAL_EMPLOYEES",
                        "IQ_COMPANY_WEBSITE",
                        "IQ_ISIN",
                        "IQ_CUSIP",
                    ],
                }
            ]
        }

        response = await self._request("POST", "/v1/companies/data", json_data=request_data)

        profile = self._parse_company_profile(response)

        if profile and use_cache:
            self._set_cache(cache_key, profile)

        return profile

    def _parse_company_profile(self, response: dict) -> dict[str, Any]:
        """Parse company profile response."""
        if not response or "GDSPOutputs" not in response:
            return {}

        outputs = response.get("GDSPOutputs", [])
        if not outputs:
            return {}

        data = {}
        for output in outputs:
            mnemonic = output.get("Mnemonic", "")
            rows = output.get("Rows", [])
            if rows:
                value = rows[0].get("Row", [None])[0]
                data[mnemonic] = value

        return {
            "gvkey": data.get("IQ_GVKEY"),
            "iq_id": data.get("IQ_COMPANY_ID"),
            "name": data.get("IQ_COMPANY_NAME"),
            "ticker": data.get("IQ_PRIMARY_TICKER"),
            "exchange": data.get("IQ_PRIMARY_EXCHANGE"),
            "sector": data.get("IQ_SECTOR"),
            "industry": data.get("IQ_INDUSTRY"),
            "country": data.get("IQ_COUNTRY_ISO"),
            "description": data.get("IQ_BUSINESS_DESC"),
            "employees": self._safe_int(data.get("IQ_TOTAL_EMPLOYEES")),
            "website": data.get("IQ_COMPANY_WEBSITE"),
            "isin": data.get("IQ_ISIN"),
            "cusip": data.get("IQ_CUSIP"),
        }

    async def get_financials(
        self,
        identifier: str,
        identifier_type: str = "ticker",
        period_type: PeriodType = PeriodType.QUARTERLY,
        num_periods: int = 4,
        statement_type: StatementType = StatementType.ALL,
    ) -> list[dict[str, Any]]:
        """
        Get financial statement data.

        Args:
            identifier: Company identifier
            identifier_type: Type of identifier
            period_type: Quarterly or annual data
            num_periods: Number of historical periods
            statement_type: Which statements to fetch (income, balance_sheet, cash_flow, all)

        Returns:
            List of financial data records, one per period, with fields
            mapped to ARC schema
        """
        # Select mnemonics based on statement type
        mnemonics: list[str] = []
        if statement_type in (StatementType.ALL, StatementType.INCOME):
            mnemonics.extend(INCOME_STATEMENT_MAPPING.keys())
        if statement_type in (StatementType.ALL, StatementType.BALANCE_SHEET):
            mnemonics.extend(BALANCE_SHEET_MAPPING.keys())
        if statement_type in (StatementType.ALL, StatementType.CASH_FLOW):
            mnemonics.extend(CASH_FLOW_MAPPING.keys())

        # Also include period identifiers
        mnemonics.extend(["IQ_PERIODDATE", "IQ_FISCAL_YEAR", "IQ_FISCAL_QUARTER"])

        # Build request
        period_code = "FQ" if period_type == PeriodType.QUARTERLY else "FY"
        request_data = {
            "inputRequests": [
                {
                    "identifier": identifier,
                    "identifierType": identifier_type.upper(),
                    "function": "GDSHE",  # Get Data Series Historical End
                    "mnemonics": mnemonics,
                    "properties": {
                        "periodType": period_code,
                        "numberOfPeriods": str(num_periods),
                    },
                }
            ]
        }

        response = await self._request("POST", "/v1/companies/data", json_data=request_data)

        return self._parse_financials(response, period_type)

    def _parse_financials(
        self, response: dict, period_type: PeriodType
    ) -> list[dict[str, Any]]:
        """Parse financial data response into ARC schema."""
        if not response or "GDSHEOutputs" not in response:
            return []

        outputs = response.get("GDSHEOutputs", [])
        if not outputs:
            return []

        # Organize data by period
        periods: dict[int, dict[str, Any]] = {}

        for output in outputs:
            mnemonic = output.get("Mnemonic", "")
            rows = output.get("Rows", [])

            for idx, row in enumerate(rows):
                if idx not in periods:
                    periods[idx] = {
                        "period_type": period_type.value,
                        "period_index": idx,
                    }

                value = row.get("Row", [None])[0] if row.get("Row") else None

                # Map to ARC field name if it's a financial field
                arc_field = ALL_FIELD_MAPPINGS.get(mnemonic)
                if arc_field:
                    periods[idx][arc_field] = self._safe_float(value)
                elif mnemonic == "IQ_PERIODDATE":
                    periods[idx]["period_date"] = value
                elif mnemonic == "IQ_FISCAL_YEAR":
                    periods[idx]["fiscal_year"] = self._safe_int(value)
                elif mnemonic == "IQ_FISCAL_QUARTER":
                    periods[idx]["fiscal_quarter"] = self._safe_int(value)

        # Sort by period index (most recent first)
        return [periods[i] for i in sorted(periods.keys())]

    async def get_income_statement(
        self,
        identifier: str,
        identifier_type: str = "ticker",
        period_type: PeriodType = PeriodType.QUARTERLY,
        num_periods: int = 4,
    ) -> list[dict[str, Any]]:
        """Get income statement data only."""
        return await self.get_financials(
            identifier=identifier,
            identifier_type=identifier_type,
            period_type=period_type,
            num_periods=num_periods,
            statement_type=StatementType.INCOME,
        )

    async def get_balance_sheet(
        self,
        identifier: str,
        identifier_type: str = "ticker",
        period_type: PeriodType = PeriodType.QUARTERLY,
        num_periods: int = 4,
    ) -> list[dict[str, Any]]:
        """Get balance sheet data only."""
        return await self.get_financials(
            identifier=identifier,
            identifier_type=identifier_type,
            period_type=period_type,
            num_periods=num_periods,
            statement_type=StatementType.BALANCE_SHEET,
        )

    async def get_cash_flow(
        self,
        identifier: str,
        identifier_type: str = "ticker",
        period_type: PeriodType = PeriodType.QUARTERLY,
        num_periods: int = 4,
    ) -> list[dict[str, Any]]:
        """Get cash flow statement data only."""
        return await self.get_financials(
            identifier=identifier,
            identifier_type=identifier_type,
            period_type=period_type,
            num_periods=num_periods,
            statement_type=StatementType.CASH_FLOW,
        )

    async def get_bulk_profiles(
        self,
        identifiers: list[str],
        identifier_type: str = "ticker",
        use_cache: bool = True,
    ) -> dict[str, dict[str, Any]]:
        """
        Get company profiles for multiple identifiers in a single request.

        Args:
            identifiers: List of company identifiers
            identifier_type: Type of identifier
            use_cache: Whether to use cache

        Returns:
            Dictionary mapping identifier to profile data
        """
        results: dict[str, dict[str, Any]] = {}
        identifiers_to_fetch: list[str] = []

        # Check cache first
        for identifier in identifiers:
            cache_key = f"profile:{identifier_type}:{identifier}"
            if use_cache:
                cached = self._check_cache(cache_key)
                if cached:
                    results[identifier] = cached
                    continue
            identifiers_to_fetch.append(identifier)

        if not identifiers_to_fetch:
            return results

        # Build bulk request
        input_requests = [
            {
                "identifier": identifier,
                "identifierType": identifier_type.upper(),
                "function": "GDSP",
                "mnemonics": [
                    "IQ_COMPANY_NAME",
                    "IQ_COMPANY_ID",
                    "IQ_GVKEY",
                    "IQ_PRIMARY_TICKER",
                    "IQ_PRIMARY_EXCHANGE",
                    "IQ_SECTOR",
                    "IQ_INDUSTRY",
                    "IQ_COUNTRY_ISO",
                    "IQ_BUSINESS_DESC",
                    "IQ_TOTAL_EMPLOYEES",
                    "IQ_COMPANY_WEBSITE",
                    "IQ_ISIN",
                    "IQ_CUSIP",
                ],
            }
            for identifier in identifiers_to_fetch
        ]

        request_data = {"inputRequests": input_requests}

        try:
            response = await self._request(
                "POST", "/v1/companies/data", json_data=request_data
            )
        except IntegrationError as e:
            logger.warning(f"Bulk profile request failed: {e}")
            return results

        # Parse response - each identifier gets its own output set
        self._parse_bulk_profiles(
            response, identifiers_to_fetch, identifier_type, use_cache, results
        )

        return results

    def _parse_bulk_profiles(
        self,
        response: dict,
        identifiers: list[str],
        identifier_type: str,
        use_cache: bool,
        results: dict[str, dict[str, Any]],
    ) -> None:
        """Parse bulk profile response."""
        if not response or "GDSPOutputs" not in response:
            return

        # Group outputs by identifier index
        outputs = response.get("GDSPOutputs", [])

        # Capital IQ returns outputs grouped by request
        # We need to parse each group
        current_idx = 0
        data: dict[str, Any] = {}

        for output in outputs:
            mnemonic = output.get("Mnemonic", "")
            identifier_idx = output.get("InputIndex", current_idx)

            # New identifier group
            if identifier_idx != current_idx and data:
                if current_idx < len(identifiers):
                    profile = self._build_profile_from_data(data)
                    identifier = identifiers[current_idx]
                    results[identifier] = profile
                    if use_cache:
                        cache_key = f"profile:{identifier_type}:{identifier}"
                        self._set_cache(cache_key, profile)
                data = {}
                current_idx = identifier_idx

            rows = output.get("Rows", [])
            if rows:
                value = rows[0].get("Row", [None])[0]
                data[mnemonic] = value

        # Handle last identifier
        if data and current_idx < len(identifiers):
            profile = self._build_profile_from_data(data)
            identifier = identifiers[current_idx]
            results[identifier] = profile
            if use_cache:
                cache_key = f"profile:{identifier_type}:{identifier}"
                self._set_cache(cache_key, profile)

    def _build_profile_from_data(self, data: dict) -> dict[str, Any]:
        """Build profile dict from parsed data."""
        return {
            "gvkey": data.get("IQ_GVKEY"),
            "iq_id": data.get("IQ_COMPANY_ID"),
            "name": data.get("IQ_COMPANY_NAME"),
            "ticker": data.get("IQ_PRIMARY_TICKER"),
            "exchange": data.get("IQ_PRIMARY_EXCHANGE"),
            "sector": data.get("IQ_SECTOR"),
            "industry": data.get("IQ_INDUSTRY"),
            "country": data.get("IQ_COUNTRY_ISO"),
            "description": data.get("IQ_BUSINESS_DESC"),
            "employees": self._safe_int(data.get("IQ_TOTAL_EMPLOYEES")),
            "website": data.get("IQ_COMPANY_WEBSITE"),
            "isin": data.get("IQ_ISIN"),
            "cusip": data.get("IQ_CUSIP"),
        }

    async def get_bulk_financials(
        self,
        identifiers: list[str],
        identifier_type: str = "ticker",
        period_type: PeriodType = PeriodType.QUARTERLY,
        num_periods: int = 4,
        statement_type: StatementType = StatementType.ALL,
    ) -> dict[str, list[dict[str, Any]]]:
        """
        Get financial data for multiple companies in a single request.

        Args:
            identifiers: List of company identifiers
            identifier_type: Type of identifier
            period_type: Quarterly or annual data
            num_periods: Number of historical periods
            statement_type: Which statements to fetch

        Returns:
            Dictionary mapping identifier to list of financial records
        """
        # Select mnemonics based on statement type
        mnemonics: list[str] = []
        if statement_type in (StatementType.ALL, StatementType.INCOME):
            mnemonics.extend(INCOME_STATEMENT_MAPPING.keys())
        if statement_type in (StatementType.ALL, StatementType.BALANCE_SHEET):
            mnemonics.extend(BALANCE_SHEET_MAPPING.keys())
        if statement_type in (StatementType.ALL, StatementType.CASH_FLOW):
            mnemonics.extend(CASH_FLOW_MAPPING.keys())
        mnemonics.extend(["IQ_PERIODDATE", "IQ_FISCAL_YEAR", "IQ_FISCAL_QUARTER"])

        period_code = "FQ" if period_type == PeriodType.QUARTERLY else "FY"

        input_requests = [
            {
                "identifier": identifier,
                "identifierType": identifier_type.upper(),
                "function": "GDSHE",
                "mnemonics": mnemonics,
                "properties": {
                    "periodType": period_code,
                    "numberOfPeriods": str(num_periods),
                },
            }
            for identifier in identifiers
        ]

        request_data = {"inputRequests": input_requests}

        try:
            response = await self._request(
                "POST", "/v1/companies/data", json_data=request_data
            )
        except IntegrationError as e:
            logger.warning(f"Bulk financials request failed: {e}")
            return {}

        return self._parse_bulk_financials(response, identifiers, period_type)

    def _parse_bulk_financials(
        self,
        response: dict,
        identifiers: list[str],
        period_type: PeriodType,
    ) -> dict[str, list[dict[str, Any]]]:
        """Parse bulk financial data response."""
        if not response or "GDSHEOutputs" not in response:
            return {}

        outputs = response.get("GDSHEOutputs", [])

        # Group data by identifier and period
        identifier_data: dict[int, dict[int, dict[str, Any]]] = {}

        for output in outputs:
            mnemonic = output.get("Mnemonic", "")
            input_idx = output.get("InputIndex", 0)
            rows = output.get("Rows", [])

            if input_idx not in identifier_data:
                identifier_data[input_idx] = {}

            for period_idx, row in enumerate(rows):
                if period_idx not in identifier_data[input_idx]:
                    identifier_data[input_idx][period_idx] = {
                        "period_type": period_type.value,
                        "period_index": period_idx,
                    }

                value = row.get("Row", [None])[0] if row.get("Row") else None

                arc_field = ALL_FIELD_MAPPINGS.get(mnemonic)
                if arc_field:
                    identifier_data[input_idx][period_idx][arc_field] = self._safe_float(
                        value
                    )
                elif mnemonic == "IQ_PERIODDATE":
                    identifier_data[input_idx][period_idx]["period_date"] = value
                elif mnemonic == "IQ_FISCAL_YEAR":
                    identifier_data[input_idx][period_idx]["fiscal_year"] = self._safe_int(
                        value
                    )
                elif mnemonic == "IQ_FISCAL_QUARTER":
                    identifier_data[input_idx][period_idx][
                        "fiscal_quarter"
                    ] = self._safe_int(value)

        # Build result dictionary
        results: dict[str, list[dict[str, Any]]] = {}
        for idx, periods in identifier_data.items():
            if idx < len(identifiers):
                identifier = identifiers[idx]
                results[identifier] = [
                    periods[i] for i in sorted(periods.keys())
                ]

        return results

    async def lookup_identifier(
        self,
        query: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Search for companies by name or ticker.

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List of matching companies with basic info
        """
        request_data = {
            "query": query,
            "limit": limit,
        }

        try:
            response = await self._request(
                "GET", "/v1/companies/search", params=request_data
            )
        except IntegrationError:
            return []

        if not response or "results" not in response:
            return []

        return [
            {
                "gvkey": item.get("gvkey"),
                "iq_id": item.get("companyId"),
                "name": item.get("companyName"),
                "ticker": item.get("ticker"),
                "exchange": item.get("exchange"),
                "country": item.get("country"),
            }
            for item in response.get("results", [])
        ]

    @staticmethod
    def _safe_float(value: Any) -> float | None:
        """Safely convert value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_int(value: Any) -> int | None:
        """Safely convert value to int."""
        if value is None:
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    def clear_cache(self) -> None:
        """Clear the profile cache."""
        self._profile_cache.clear()
        logger.info("Capital IQ profile cache cleared")

    def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        now = datetime.now(UTC)
        valid_count = sum(
            1 for _, (_, cached_at) in self._profile_cache.items()
            if now - cached_at < self._cache_ttl
        )
        return {
            "total_entries": len(self._profile_cache),
            "valid_entries": valid_count,
            "expired_entries": len(self._profile_cache) - valid_count,
        }
