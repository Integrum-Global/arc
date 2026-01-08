"""
Pitchbook API client for private company data.

Provides access to:
- Company search and profiles
- Valuation history
- Funding rounds
- Ownership structure

Authentication: API Key based
"""

import asyncio
import hashlib
import logging
from dataclasses import dataclass, field
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


class IndustryCategory(str, Enum):
    """Pitchbook industry categories."""

    SOFTWARE = "software"
    HEALTHCARE = "healthcare"
    FINTECH = "fintech"
    CONSUMER = "consumer"
    ENTERPRISE = "enterprise"
    BIOTECH = "biotech"
    CLEANTECH = "cleantech"
    HARDWARE = "hardware"
    MEDIA = "media"
    ECOMMERCE = "ecommerce"


class CompanyStage(str, Enum):
    """Company funding stage."""

    SEED = "seed"
    EARLY = "early_stage"
    GROWTH = "growth"
    LATE = "late_stage"
    PUBLIC = "public"
    ACQUIRED = "acquired"


class RoundType(str, Enum):
    """Funding round types."""

    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"
    SERIES_D = "series_d"
    SERIES_E = "series_e"
    SERIES_F = "series_f"
    GROWTH = "growth"
    BRIDGE = "bridge"
    CONVERTIBLE = "convertible"
    SECONDARY = "secondary"
    IPO = "ipo"
    ACQUISITION = "acquisition"


@dataclass
class PitchbookConfig:
    """Configuration for Pitchbook client."""

    api_key: str
    base_url: str = "https://api.pitchbook.com/v1"
    timeout: float = 30.0
    max_retries: int = 3
    base_delay: float = 1.0
    cache_ttl_seconds: int = 604800  # 7 days - Pitchbook data is expensive


@dataclass
class CacheEntry:
    """Cache entry with expiry."""

    data: Any
    expires_at: datetime

    @property
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        return datetime.now(UTC) >= self.expires_at


# Field mappings from Pitchbook to ARC schema
COMPANY_FIELD_MAPPING: dict[str, str] = {
    "company_id": "external_id",
    "company_name": "name",
    "description": "description",
    "primary_industry": "sector",
    "sub_industry": "industry",
    "founded_year": "founded_year",
    "employee_count": "employees",
    "website": "website",
}

VALUATION_FIELD_MAPPING: dict[str, str] = {
    "value": "valuation",
    "currency": "currency",
    "date": "valuation_date",
    "type": "valuation_type",
    "methodology": "methodology",
}

FUNDING_ROUND_MAPPING: dict[str, str] = {
    "round_id": "round_id",
    "round_type": "round_type",
    "amount_raised": "amount",
    "currency": "currency",
    "date": "round_date",
    "pre_money_valuation": "pre_money_valuation",
    "post_money_valuation": "post_money_valuation",
}


@dataclass
class SearchFilters:
    """Filters for company search."""

    industry: IndustryCategory | None = None
    stage: CompanyStage | None = None
    location_country: str | None = None
    location_state: str | None = None
    min_employees: int | None = None
    max_employees: int | None = None
    min_valuation: float | None = None
    max_valuation: float | None = None
    founded_after: int | None = None
    founded_before: int | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert filters to API parameters."""
        params: dict[str, Any] = {}

        if self.industry:
            params["industry"] = self.industry.value
        if self.stage:
            params["stage"] = self.stage.value
        if self.location_country:
            params["country"] = self.location_country
        if self.location_state:
            params["state"] = self.location_state
        if self.min_employees is not None:
            params["min_employees"] = self.min_employees
        if self.max_employees is not None:
            params["max_employees"] = self.max_employees
        if self.min_valuation is not None:
            params["min_valuation"] = self.min_valuation
        if self.max_valuation is not None:
            params["max_valuation"] = self.max_valuation
        if self.founded_after is not None:
            params["founded_after"] = self.founded_after
        if self.founded_before is not None:
            params["founded_before"] = self.founded_before

        return params


@dataclass
class CompanyProfile:
    """Private company profile."""

    company_id: str
    name: str
    description: str | None = None
    primary_industry: str | None = None
    sub_industry: str | None = None
    founded_year: int | None = None
    headquarters_city: str | None = None
    headquarters_state: str | None = None
    headquarters_country: str | None = None
    employee_count: int | None = None
    website: str | None = None
    linkedin_url: str | None = None
    latest_valuation: float | None = None
    latest_valuation_date: str | None = None
    latest_valuation_type: str | None = None
    total_funding: float | None = None
    funding_rounds_count: int | None = None
    stage: str | None = None


@dataclass
class FundingRound:
    """Funding round details."""

    round_id: str
    company_id: str
    round_type: str
    amount_raised: float | None = None
    currency: str = "USD"
    round_date: str | None = None
    pre_money_valuation: float | None = None
    post_money_valuation: float | None = None
    lead_investors: list[dict] = field(default_factory=list)
    participating_investors: list[dict] = field(default_factory=list)
    announced_date: str | None = None


@dataclass
class Valuation:
    """Company valuation record."""

    company_id: str
    valuation: float
    currency: str = "USD"
    valuation_date: str | None = None
    valuation_type: str | None = None
    methodology: str | None = None
    source: str = "pitchbook"
    confidence_level: str | None = None


@dataclass
class OwnershipStake:
    """Ownership stake in a company."""

    stakeholder_id: str
    stakeholder_name: str
    stakeholder_type: str  # "investor", "founder", "employee"
    ownership_percentage: float | None = None
    board_seats: int = 0
    investment_amount: float | None = None
    first_investment_date: str | None = None


@dataclass
class OwnershipStructure:
    """Company ownership structure."""

    company_id: str
    stakes: list[OwnershipStake] = field(default_factory=list)
    total_shares_outstanding: int | None = None
    latest_share_price: float | None = None
    fully_diluted_shares: int | None = None


class PitchbookClient:
    """
    Async client for Pitchbook API.

    Features:
    - Company search with filters
    - Company profile retrieval
    - Valuation history
    - Funding rounds
    - Ownership structure
    - Aggressive caching (7 day TTL)
    - Automatic retry with exponential backoff
    - Rate limit awareness
    """

    def __init__(self, config: PitchbookConfig | None = None, api_key: str | None = None):
        """
        Initialize Pitchbook client.

        Args:
            config: Full configuration object
            api_key: API key (if not using config)
        """
        if config:
            self.config = config
        elif api_key:
            self.config = PitchbookConfig(api_key=api_key)
        else:
            raise ValueError("Either config or api_key must be provided")

        self._client: httpx.AsyncClient | None = None
        self._cache: dict[str, CacheEntry] = {}

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=self.config.timeout,
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _get_cache_key(self, endpoint: str, params: dict | None = None) -> str:
        """Generate cache key for request."""
        key_data = endpoint
        if params:
            key_data += str(sorted(params.items()))
        return hashlib.md5(key_data.encode()).hexdigest()

    def _get_cached(self, cache_key: str) -> Any | None:
        """Get cached data if not expired."""
        entry = self._cache.get(cache_key)
        if entry and not entry.is_expired:
            return entry.data
        elif entry:
            # Remove expired entry
            del self._cache[cache_key]
        return None

    def _set_cache(self, cache_key: str, data: Any) -> None:
        """Cache data with TTL."""
        expires_at = datetime.now(UTC) + timedelta(seconds=self.config.cache_ttl_seconds)
        self._cache[cache_key] = CacheEntry(data=data, expires_at=expires_at)

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict | None = None,
        json_data: dict | None = None,
        use_cache: bool = True,
    ) -> dict[str, Any]:
        """
        Make HTTP request with retry and caching.

        Args:
            method: HTTP method
            endpoint: API endpoint
            params: Query parameters
            json_data: JSON body
            use_cache: Whether to use cache for GET requests

        Returns:
            Response data as dictionary
        """
        # Check cache for GET requests
        if method == "GET" and use_cache:
            cache_key = self._get_cache_key(endpoint, params)
            cached = self._get_cached(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {endpoint}")
                return cached

        client = await self._get_client()

        for attempt in range(self.config.max_retries):
            try:
                response = await client.request(
                    method=method,
                    url=endpoint,
                    params=params,
                    json=json_data,
                )

                if response.status_code == 200:
                    data = response.json()

                    # Cache successful GET responses
                    if method == "GET" and use_cache:
                        cache_key = self._get_cache_key(endpoint, params)
                        self._set_cache(cache_key, data)

                    return data

                elif response.status_code == 401:
                    raise AuthenticationError(
                        message="Pitchbook: Invalid or expired API key",
                        auth_type="api_key",
                    )

                elif response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    raise RateLimitError(
                        message=f"Pitchbook: Rate limit exceeded. Retry after {retry_after}s",
                        retry_after=retry_after,
                    )

                elif response.status_code == 404:
                    return {}  # Return empty for not found

                elif response.status_code >= 500:
                    # Server error - retry
                    if attempt < self.config.max_retries - 1:
                        delay = self.config.base_delay * (2**attempt)
                        logger.warning(
                            f"Pitchbook server error {response.status_code}, "
                            f"retrying in {delay}s (attempt {attempt + 1})"
                        )
                        await asyncio.sleep(delay)
                        continue
                    raise IntegrationError(
                        provider="Pitchbook",
                        message=f"Server error: {response.status_code}",
                        response_code=response.status_code,
                    )

                else:
                    raise IntegrationError(
                        provider="Pitchbook",
                        message=f"Unexpected status: {response.status_code}",
                        response_code=response.status_code,
                    )

            except httpx.RequestError as e:
                if attempt < self.config.max_retries - 1:
                    delay = self.config.base_delay * (2**attempt)
                    logger.warning(
                        f"Pitchbook request error: {e}, retrying in {delay}s"
                    )
                    await asyncio.sleep(delay)
                else:
                    raise IntegrationError(
                        provider="Pitchbook",
                        message=f"Request failed: {e}",
                    ) from e

        raise IntegrationError(
            provider="Pitchbook",
            message="Max retries exceeded",
        )

    async def validate_credentials(self) -> bool:
        """
        Validate API credentials.

        Returns:
            True if credentials are valid
        """
        try:
            await self._request("GET", "/auth/validate", use_cache=False)
            return True
        except AuthenticationError:
            return False
        except Exception as e:
            logger.error(f"Error validating Pitchbook credentials: {e}")
            return False

    async def search_companies(
        self,
        query: str,
        filters: SearchFilters | None = None,
        limit: int = 25,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Search for private companies.

        Args:
            query: Search query (company name, keywords)
            filters: Optional search filters
            limit: Maximum results to return
            offset: Pagination offset

        Returns:
            List of company search results
        """
        params: dict[str, Any] = {
            "q": query,
            "limit": min(limit, 100),
            "offset": offset,
        }

        if filters:
            params.update(filters.to_dict())

        data = await self._request("GET", "/companies/search", params=params)

        results = data.get("results", [])
        return [self._map_search_result(r) for r in results]

    def _map_search_result(self, result: dict) -> dict[str, Any]:
        """Map search result to standardized format."""
        return {
            "company_id": result.get("id"),
            "name": result.get("name"),
            "description": result.get("description"),
            "industry": result.get("primary_industry"),
            "location": {
                "city": result.get("hq_city"),
                "state": result.get("hq_state"),
                "country": result.get("hq_country"),
            },
            "employee_count": result.get("employees"),
            "latest_valuation": result.get("latest_valuation"),
            "stage": result.get("stage"),
            "total_funding": result.get("total_raised"),
        }

    async def get_company(
        self,
        company_id: str,
        use_cache: bool = True,
    ) -> CompanyProfile | None:
        """
        Get company profile.

        Args:
            company_id: Pitchbook company ID
            use_cache: Whether to use cached data

        Returns:
            CompanyProfile or None if not found
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}",
            use_cache=use_cache,
        )

        if not data:
            return None

        return self._parse_company_profile(data)

    def _parse_company_profile(self, data: dict) -> CompanyProfile:
        """Parse company profile from API response."""
        headquarters = data.get("headquarters", {})
        latest_val = data.get("latest_valuation", {})

        return CompanyProfile(
            company_id=data.get("company_id", ""),
            name=data.get("company_name", ""),
            description=data.get("description"),
            primary_industry=data.get("primary_industry"),
            sub_industry=data.get("sub_industry"),
            founded_year=data.get("founded_year"),
            headquarters_city=headquarters.get("city"),
            headquarters_state=headquarters.get("state"),
            headquarters_country=headquarters.get("country"),
            employee_count=data.get("employee_count"),
            website=data.get("website"),
            linkedin_url=data.get("linkedin"),
            latest_valuation=latest_val.get("value"),
            latest_valuation_date=latest_val.get("date"),
            latest_valuation_type=latest_val.get("type"),
            total_funding=data.get("total_funding"),
            funding_rounds_count=data.get("funding_rounds_count"),
            stage=data.get("stage"),
        )

    async def get_valuations(
        self,
        company_id: str,
        use_cache: bool = True,
    ) -> list[Valuation]:
        """
        Get company valuation history.

        Args:
            company_id: Pitchbook company ID
            use_cache: Whether to use cached data

        Returns:
            List of valuations sorted by date (newest first)
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}/valuations",
            use_cache=use_cache,
        )

        valuations = data.get("valuations", [])
        return [self._parse_valuation(v, company_id) for v in valuations]

    def _parse_valuation(self, data: dict, company_id: str) -> Valuation:
        """Parse valuation from API response."""
        return Valuation(
            company_id=company_id,
            valuation=data.get("value", 0),
            currency=data.get("currency", "USD"),
            valuation_date=data.get("date"),
            valuation_type=data.get("type"),
            methodology=data.get("methodology"),
            source="pitchbook",
            confidence_level=data.get("confidence"),
        )

    async def get_funding_rounds(
        self,
        company_id: str,
        use_cache: bool = True,
    ) -> list[FundingRound]:
        """
        Get company funding round history.

        Args:
            company_id: Pitchbook company ID
            use_cache: Whether to use cached data

        Returns:
            List of funding rounds sorted by date (newest first)
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}/funding",
            use_cache=use_cache,
        )

        rounds = data.get("rounds", [])
        return [self._parse_funding_round(r, company_id) for r in rounds]

    def _parse_funding_round(self, data: dict, company_id: str) -> FundingRound:
        """Parse funding round from API response."""
        return FundingRound(
            round_id=data.get("round_id", ""),
            company_id=company_id,
            round_type=data.get("round_type", ""),
            amount_raised=data.get("amount_raised"),
            currency=data.get("currency", "USD"),
            round_date=data.get("date"),
            pre_money_valuation=data.get("pre_money_valuation"),
            post_money_valuation=data.get("post_money_valuation"),
            lead_investors=data.get("lead_investors", []),
            participating_investors=data.get("participating_investors", []),
            announced_date=data.get("announced_date"),
        )

    async def get_ownership(
        self,
        company_id: str,
        use_cache: bool = True,
    ) -> OwnershipStructure:
        """
        Get company ownership structure.

        Args:
            company_id: Pitchbook company ID
            use_cache: Whether to use cached data

        Returns:
            OwnershipStructure with stakeholder details
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}/ownership",
            use_cache=use_cache,
        )

        stakes = []
        for stake_data in data.get("stakeholders", []):
            stakes.append(self._parse_ownership_stake(stake_data))

        return OwnershipStructure(
            company_id=company_id,
            stakes=stakes,
            total_shares_outstanding=data.get("total_shares"),
            latest_share_price=data.get("latest_share_price"),
            fully_diluted_shares=data.get("fully_diluted_shares"),
        )

    def _parse_ownership_stake(self, data: dict) -> OwnershipStake:
        """Parse ownership stake from API response."""
        return OwnershipStake(
            stakeholder_id=data.get("id", ""),
            stakeholder_name=data.get("name", ""),
            stakeholder_type=data.get("type", "investor"),
            ownership_percentage=data.get("percentage"),
            board_seats=data.get("board_seats", 0),
            investment_amount=data.get("total_invested"),
            first_investment_date=data.get("first_investment_date"),
        )

    async def get_investors(
        self,
        company_id: str,
        use_cache: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Get company's investors.

        Args:
            company_id: Pitchbook company ID
            use_cache: Whether to use cached data

        Returns:
            List of investor details
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}/investors",
            use_cache=use_cache,
        )

        return data.get("investors", [])

    async def get_similar_companies(
        self,
        company_id: str,
        limit: int = 10,
        use_cache: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Get similar companies based on industry, stage, and other factors.

        Args:
            company_id: Pitchbook company ID
            limit: Maximum number of similar companies
            use_cache: Whether to use cached data

        Returns:
            List of similar company profiles
        """
        data = await self._request(
            "GET",
            f"/companies/{company_id}/similar",
            params={"limit": limit},
            use_cache=use_cache,
        )

        return data.get("companies", [])

    async def get_bulk_companies(
        self,
        company_ids: list[str],
        use_cache: bool = True,
    ) -> dict[str, CompanyProfile | None]:
        """
        Get multiple company profiles in bulk.

        Args:
            company_ids: List of Pitchbook company IDs
            use_cache: Whether to use cached data

        Returns:
            Dictionary mapping company_id to CompanyProfile
        """
        results: dict[str, CompanyProfile | None] = {}

        # Fetch companies concurrently
        tasks = [
            self.get_company(cid, use_cache=use_cache) for cid in company_ids
        ]
        profiles = await asyncio.gather(*tasks, return_exceptions=True)

        for company_id, profile in zip(company_ids, profiles, strict=True):
            if isinstance(profile, Exception):
                logger.error(f"Error fetching company {company_id}: {profile}")
                results[company_id] = None
            else:
                results[company_id] = profile

        return results

    async def get_bulk_funding_rounds(
        self,
        company_ids: list[str],
        use_cache: bool = True,
    ) -> dict[str, list[FundingRound]]:
        """
        Get funding rounds for multiple companies in bulk.

        Args:
            company_ids: List of Pitchbook company IDs
            use_cache: Whether to use cached data

        Returns:
            Dictionary mapping company_id to list of FundingRounds
        """
        results: dict[str, list[FundingRound]] = {}

        tasks = [
            self.get_funding_rounds(cid, use_cache=use_cache) for cid in company_ids
        ]
        rounds_list = await asyncio.gather(*tasks, return_exceptions=True)

        for company_id, rounds in zip(company_ids, rounds_list, strict=True):
            if isinstance(rounds, Exception):
                logger.error(f"Error fetching rounds for {company_id}: {rounds}")
                results[company_id] = []
            else:
                results[company_id] = rounds

        return results

    def map_to_arc_security(self, profile: CompanyProfile) -> dict[str, Any]:
        """
        Map Pitchbook company profile to ARC Security model fields.

        Args:
            profile: CompanyProfile from Pitchbook

        Returns:
            Dictionary of Security model fields
        """
        return {
            "id": f"pb-{profile.company_id}",
            "ticker": None,  # Private companies don't have tickers
            "name": profile.name,
            "security_type": "private_equity",
            "exchange": None,
            "currency": "USD",
            "is_active": True,
            "is_private": True,
            "sector": profile.primary_industry,
            "industry": profile.sub_industry,
            "description": profile.description,
            "headquarters_country": profile.headquarters_country,
            "headquarters_state": profile.headquarters_state,
            "headquarters_city": profile.headquarters_city,
            "website": profile.website,
            "founded_year": profile.founded_year,
            "employee_count": profile.employee_count,
            "external_ids": {"pitchbook": profile.company_id},
        }

    def map_to_arc_valuation(
        self,
        valuation: Valuation,
        security_id: str,
    ) -> dict[str, Any]:
        """
        Map Pitchbook valuation to ARC PrivateCompanyValuation model fields.

        Args:
            valuation: Valuation from Pitchbook
            security_id: ARC Security ID

        Returns:
            Dictionary of PrivateCompanyValuation model fields
        """
        date_str = valuation.valuation_date or datetime.now(UTC).strftime("%Y-%m-%d")
        return {
            "id": f"{security_id}_{date_str}",
            "security_id": security_id,
            "valuation_date": date_str,
            "valuation": str(valuation.valuation),
            "valuation_type": valuation.valuation_type,
            "methodology": valuation.methodology,
            "currency": valuation.currency,
            "source": "pitchbook",
        }

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._cache.clear()

    def get_cache_stats(self) -> dict[str, int]:
        """Get cache statistics."""
        total = len(self._cache)
        expired = sum(1 for entry in self._cache.values() if entry.is_expired)
        return {
            "total_entries": total,
            "expired_entries": expired,
            "valid_entries": total - expired,
        }
