"""Unit tests for Pitchbook client."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from arc.core.exceptions import (
    AuthenticationError,
    IntegrationError,
    RateLimitError,
)
from arc.integrations.pitchbook import (
    COMPANY_FIELD_MAPPING,
    FUNDING_ROUND_MAPPING,
    VALUATION_FIELD_MAPPING,
    CompanyProfile,
    CompanyStage,
    FundingRound,
    IndustryCategory,
    OwnershipStake,
    OwnershipStructure,
    PitchbookClient,
    PitchbookConfig,
    RoundType,
    SearchFilters,
    Valuation,
)
from arc.integrations.pitchbook.client import CacheEntry

# =============================================================================
# TEST FIXTURES
# =============================================================================


@pytest.fixture
def api_key():
    """Test API key."""
    return "test_api_key_pitchbook_123"


@pytest.fixture
def config(api_key):
    """Test configuration."""
    return PitchbookConfig(api_key=api_key)


@pytest.fixture
def client(api_key):
    """Create Pitchbook client."""
    return PitchbookClient(api_key=api_key)


@pytest.fixture
def client_with_config(config):
    """Create Pitchbook client with config."""
    return PitchbookClient(config=config)


@pytest.fixture
def mock_http_client():
    """Create a mock HTTP client."""
    return AsyncMock(spec=httpx.AsyncClient)


@pytest.fixture
def sample_company_data():
    """Sample company API response."""
    return {
        "company_id": "pb-123456",
        "company_name": "TechStartup Inc",
        "description": "A leading AI company",
        "primary_industry": "software",
        "sub_industry": "artificial_intelligence",
        "founded_year": 2018,
        "headquarters": {
            "city": "San Francisco",
            "state": "CA",
            "country": "US",
        },
        "employee_count": 250,
        "website": "https://techstartup.com",
        "linkedin": "https://linkedin.com/company/techstartup",
        "latest_valuation": {
            "value": 500000000,
            "date": "2024-06-15",
            "type": "post_money",
        },
        "total_funding": 150000000,
        "funding_rounds_count": 4,
        "stage": "growth",
    }


@pytest.fixture
def sample_funding_round():
    """Sample funding round API response."""
    return {
        "round_id": "round-001",
        "round_type": "series_b",
        "amount_raised": 50000000,
        "currency": "USD",
        "date": "2024-01-15",
        "pre_money_valuation": 200000000,
        "post_money_valuation": 250000000,
        "lead_investors": [{"id": "inv-001", "name": "Top VC Fund"}],
        "participating_investors": [{"id": "inv-002", "name": "Angel Investor"}],
        "announced_date": "2024-01-20",
    }


@pytest.fixture
def sample_valuation():
    """Sample valuation API response."""
    return {
        "value": 500000000,
        "currency": "USD",
        "date": "2024-06-15",
        "type": "post_money",
        "methodology": "comparable_transactions",
        "confidence": "high",
    }


@pytest.fixture
def sample_ownership_stake():
    """Sample ownership stake API response."""
    return {
        "id": "stake-001",
        "name": "Founder 1",
        "type": "founder",
        "percentage": 25.5,
        "board_seats": 1,
        "total_invested": 5000000,
        "first_investment_date": "2018-01-01",
    }


# =============================================================================
# ENUM TESTS
# =============================================================================


class TestIndustryCategory:
    """Test IndustryCategory enum."""

    def test_software_value(self):
        """Test SOFTWARE enum value."""
        assert IndustryCategory.SOFTWARE.value == "software"

    def test_healthcare_value(self):
        """Test HEALTHCARE enum value."""
        assert IndustryCategory.HEALTHCARE.value == "healthcare"

    def test_fintech_value(self):
        """Test FINTECH enum value."""
        assert IndustryCategory.FINTECH.value == "fintech"

    def test_all_categories_are_strings(self):
        """Test all categories are string enums."""
        for category in IndustryCategory:
            assert isinstance(category.value, str)

    def test_category_count(self):
        """Test we have expected number of categories."""
        assert len(IndustryCategory) == 10


class TestCompanyStage:
    """Test CompanyStage enum."""

    def test_seed_value(self):
        """Test SEED enum value."""
        assert CompanyStage.SEED.value == "seed"

    def test_growth_value(self):
        """Test GROWTH enum value."""
        assert CompanyStage.GROWTH.value == "growth"

    def test_public_value(self):
        """Test PUBLIC enum value."""
        assert CompanyStage.PUBLIC.value == "public"

    def test_all_stages_are_strings(self):
        """Test all stages are string enums."""
        for stage in CompanyStage:
            assert isinstance(stage.value, str)

    def test_stage_count(self):
        """Test we have expected number of stages."""
        assert len(CompanyStage) == 6


class TestRoundType:
    """Test RoundType enum."""

    def test_seed_value(self):
        """Test SEED round type value."""
        assert RoundType.SEED.value == "seed"

    def test_series_a_value(self):
        """Test SERIES_A round type value."""
        assert RoundType.SERIES_A.value == "series_a"

    def test_ipo_value(self):
        """Test IPO round type value."""
        assert RoundType.IPO.value == "ipo"

    def test_all_types_are_strings(self):
        """Test all round types are string enums."""
        for round_type in RoundType:
            assert isinstance(round_type.value, str)

    def test_round_type_count(self):
        """Test we have expected number of round types."""
        assert len(RoundType) == 14


# =============================================================================
# DATACLASS TESTS
# =============================================================================


class TestPitchbookConfig:
    """Test PitchbookConfig dataclass."""

    def test_minimal_config(self, api_key):
        """Test config with just API key."""
        config = PitchbookConfig(api_key=api_key)
        assert config.api_key == api_key
        assert config.base_url == "https://api.pitchbook.com/v1"
        assert config.timeout == 30.0
        assert config.max_retries == 3
        assert config.base_delay == 1.0
        assert config.cache_ttl_seconds == 604800  # 7 days

    def test_custom_config(self, api_key):
        """Test config with custom values."""
        config = PitchbookConfig(
            api_key=api_key,
            base_url="https://custom.pitchbook.com/v2",
            timeout=60.0,
            max_retries=5,
            base_delay=2.0,
            cache_ttl_seconds=86400,
        )
        assert config.base_url == "https://custom.pitchbook.com/v2"
        assert config.timeout == 60.0
        assert config.max_retries == 5
        assert config.base_delay == 2.0
        assert config.cache_ttl_seconds == 86400


class TestCacheEntry:
    """Test CacheEntry dataclass."""

    def test_entry_not_expired(self):
        """Test cache entry that is not expired."""
        entry = CacheEntry(
            data={"test": "data"},
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        assert not entry.is_expired
        assert entry.data == {"test": "data"}

    def test_entry_expired(self):
        """Test cache entry that is expired."""
        entry = CacheEntry(
            data={"test": "data"},
            expires_at=datetime.now(UTC) - timedelta(hours=1),
        )
        assert entry.is_expired

    def test_entry_exact_expiry(self):
        """Test cache entry at exact expiry time."""
        now = datetime.now(UTC)
        entry = CacheEntry(data={"test": "data"}, expires_at=now)
        # At exact expiry time, should be considered expired
        assert entry.is_expired


class TestSearchFilters:
    """Test SearchFilters dataclass."""

    def test_empty_filters(self):
        """Test empty filters."""
        filters = SearchFilters()
        assert filters.to_dict() == {}

    def test_industry_filter(self):
        """Test industry filter."""
        filters = SearchFilters(industry=IndustryCategory.SOFTWARE)
        assert filters.to_dict() == {"industry": "software"}

    def test_stage_filter(self):
        """Test stage filter."""
        filters = SearchFilters(stage=CompanyStage.GROWTH)
        assert filters.to_dict() == {"stage": "growth"}

    def test_location_filters(self):
        """Test location filters."""
        filters = SearchFilters(
            location_country="US",
            location_state="CA",
        )
        result = filters.to_dict()
        assert result["country"] == "US"
        assert result["state"] == "CA"

    def test_employee_filters(self):
        """Test employee range filters."""
        filters = SearchFilters(
            min_employees=50,
            max_employees=500,
        )
        result = filters.to_dict()
        assert result["min_employees"] == 50
        assert result["max_employees"] == 500

    def test_valuation_filters(self):
        """Test valuation range filters."""
        filters = SearchFilters(
            min_valuation=10000000,
            max_valuation=100000000,
        )
        result = filters.to_dict()
        assert result["min_valuation"] == 10000000
        assert result["max_valuation"] == 100000000

    def test_founded_filters(self):
        """Test founded year range filters."""
        filters = SearchFilters(
            founded_after=2015,
            founded_before=2023,
        )
        result = filters.to_dict()
        assert result["founded_after"] == 2015
        assert result["founded_before"] == 2023

    def test_combined_filters(self):
        """Test multiple filters combined."""
        filters = SearchFilters(
            industry=IndustryCategory.FINTECH,
            stage=CompanyStage.EARLY,
            location_country="US",
            min_employees=10,
            min_valuation=5000000,
        )
        result = filters.to_dict()
        assert len(result) == 5
        assert result["industry"] == "fintech"
        assert result["stage"] == "early_stage"


class TestCompanyProfile:
    """Test CompanyProfile dataclass."""

    def test_minimal_profile(self):
        """Test profile with minimal fields."""
        profile = CompanyProfile(
            company_id="pb-123",
            name="Test Company",
        )
        assert profile.company_id == "pb-123"
        assert profile.name == "Test Company"
        assert profile.description is None
        assert profile.employee_count is None

    def test_full_profile(self, sample_company_data):
        """Test profile with all fields."""
        profile = CompanyProfile(
            company_id=sample_company_data["company_id"],
            name=sample_company_data["company_name"],
            description=sample_company_data["description"],
            primary_industry=sample_company_data["primary_industry"],
            sub_industry=sample_company_data["sub_industry"],
            founded_year=sample_company_data["founded_year"],
            headquarters_city=sample_company_data["headquarters"]["city"],
            headquarters_state=sample_company_data["headquarters"]["state"],
            headquarters_country=sample_company_data["headquarters"]["country"],
            employee_count=sample_company_data["employee_count"],
            website=sample_company_data["website"],
            latest_valuation=sample_company_data["latest_valuation"]["value"],
            total_funding=sample_company_data["total_funding"],
            stage=sample_company_data["stage"],
        )
        assert profile.company_id == "pb-123456"
        assert profile.name == "TechStartup Inc"
        assert profile.employee_count == 250
        assert profile.latest_valuation == 500000000


class TestFundingRound:
    """Test FundingRound dataclass."""

    def test_minimal_round(self):
        """Test funding round with minimal fields."""
        round = FundingRound(
            round_id="round-001",
            company_id="pb-123",
            round_type="seed",
        )
        assert round.round_id == "round-001"
        assert round.company_id == "pb-123"
        assert round.round_type == "seed"
        assert round.currency == "USD"
        assert round.lead_investors == []

    def test_full_round(self, sample_funding_round):
        """Test funding round with all fields."""
        round = FundingRound(
            round_id=sample_funding_round["round_id"],
            company_id="pb-123",
            round_type=sample_funding_round["round_type"],
            amount_raised=sample_funding_round["amount_raised"],
            currency=sample_funding_round["currency"],
            round_date=sample_funding_round["date"],
            pre_money_valuation=sample_funding_round["pre_money_valuation"],
            post_money_valuation=sample_funding_round["post_money_valuation"],
            lead_investors=sample_funding_round["lead_investors"],
        )
        assert round.amount_raised == 50000000
        assert round.pre_money_valuation == 200000000
        assert len(round.lead_investors) == 1


class TestValuation:
    """Test Valuation dataclass."""

    def test_minimal_valuation(self):
        """Test valuation with minimal fields."""
        valuation = Valuation(
            company_id="pb-123",
            valuation=100000000,
        )
        assert valuation.company_id == "pb-123"
        assert valuation.valuation == 100000000
        assert valuation.currency == "USD"
        assert valuation.source == "pitchbook"

    def test_full_valuation(self, sample_valuation):
        """Test valuation with all fields."""
        valuation = Valuation(
            company_id="pb-123",
            valuation=sample_valuation["value"],
            currency=sample_valuation["currency"],
            valuation_date=sample_valuation["date"],
            valuation_type=sample_valuation["type"],
            methodology=sample_valuation["methodology"],
            confidence_level=sample_valuation["confidence"],
        )
        assert valuation.valuation == 500000000
        assert valuation.valuation_type == "post_money"
        assert valuation.methodology == "comparable_transactions"


class TestOwnershipStake:
    """Test OwnershipStake dataclass."""

    def test_minimal_stake(self):
        """Test ownership stake with minimal fields."""
        stake = OwnershipStake(
            stakeholder_id="stake-001",
            stakeholder_name="Investor A",
            stakeholder_type="investor",
        )
        assert stake.stakeholder_id == "stake-001"
        assert stake.stakeholder_name == "Investor A"
        assert stake.board_seats == 0
        assert stake.ownership_percentage is None

    def test_full_stake(self, sample_ownership_stake):
        """Test ownership stake with all fields."""
        stake = OwnershipStake(
            stakeholder_id=sample_ownership_stake["id"],
            stakeholder_name=sample_ownership_stake["name"],
            stakeholder_type=sample_ownership_stake["type"],
            ownership_percentage=sample_ownership_stake["percentage"],
            board_seats=sample_ownership_stake["board_seats"],
            investment_amount=sample_ownership_stake["total_invested"],
            first_investment_date=sample_ownership_stake["first_investment_date"],
        )
        assert stake.ownership_percentage == 25.5
        assert stake.board_seats == 1
        assert stake.investment_amount == 5000000


class TestOwnershipStructure:
    """Test OwnershipStructure dataclass."""

    def test_minimal_structure(self):
        """Test ownership structure with minimal fields."""
        structure = OwnershipStructure(company_id="pb-123")
        assert structure.company_id == "pb-123"
        assert structure.stakes == []
        assert structure.total_shares_outstanding is None

    def test_structure_with_stakes(self):
        """Test ownership structure with stakes."""
        stakes = [
            OwnershipStake(
                stakeholder_id="s1",
                stakeholder_name="Founder",
                stakeholder_type="founder",
                ownership_percentage=30.0,
            ),
            OwnershipStake(
                stakeholder_id="s2",
                stakeholder_name="VC Fund",
                stakeholder_type="investor",
                ownership_percentage=20.0,
            ),
        ]
        structure = OwnershipStructure(
            company_id="pb-123",
            stakes=stakes,
            total_shares_outstanding=10000000,
            latest_share_price=50.0,
        )
        assert len(structure.stakes) == 2
        assert structure.total_shares_outstanding == 10000000


# =============================================================================
# FIELD MAPPING TESTS
# =============================================================================


class TestFieldMappings:
    """Test field mappings."""

    def test_company_field_mapping_has_key_fields(self):
        """Test company field mapping contains key fields."""
        assert "company_id" in COMPANY_FIELD_MAPPING
        assert "company_name" in COMPANY_FIELD_MAPPING
        assert COMPANY_FIELD_MAPPING["company_id"] == "external_id"
        assert COMPANY_FIELD_MAPPING["company_name"] == "name"
        assert COMPANY_FIELD_MAPPING["primary_industry"] == "sector"

    def test_valuation_field_mapping_has_key_fields(self):
        """Test valuation field mapping contains key fields."""
        assert "value" in VALUATION_FIELD_MAPPING
        assert "currency" in VALUATION_FIELD_MAPPING
        assert VALUATION_FIELD_MAPPING["value"] == "valuation"
        assert VALUATION_FIELD_MAPPING["date"] == "valuation_date"

    def test_funding_round_mapping_has_key_fields(self):
        """Test funding round mapping contains key fields."""
        assert "round_id" in FUNDING_ROUND_MAPPING
        assert "round_type" in FUNDING_ROUND_MAPPING
        assert "amount_raised" in FUNDING_ROUND_MAPPING
        assert FUNDING_ROUND_MAPPING["amount_raised"] == "amount"


# =============================================================================
# CLIENT INITIALIZATION TESTS
# =============================================================================


class TestPitchbookClientInit:
    """Test client initialization."""

    def test_init_with_api_key(self, api_key):
        """Test client initialization with API key."""
        client = PitchbookClient(api_key=api_key)
        assert client.config.api_key == api_key
        assert client.config.timeout == 30.0

    def test_init_with_config(self, config):
        """Test client initialization with config."""
        client = PitchbookClient(config=config)
        assert client.config == config

    def test_init_without_credentials_raises(self):
        """Test client raises error without credentials."""
        with pytest.raises(ValueError, match="Either config or api_key must be provided"):
            PitchbookClient()

    def test_init_client_not_created_yet(self, client):
        """Test HTTP client is not created at init."""
        assert client._client is None

    def test_init_cache_is_empty(self, client):
        """Test cache is empty at init."""
        assert len(client._cache) == 0


# =============================================================================
# CACHING TESTS
# =============================================================================


class TestCaching:
    """Test caching functionality."""

    def test_get_cache_key_basic(self, client):
        """Test cache key generation."""
        key1 = client._get_cache_key("/companies/123")
        key2 = client._get_cache_key("/companies/123")
        assert key1 == key2

    def test_get_cache_key_different_endpoints(self, client):
        """Test different endpoints produce different keys."""
        key1 = client._get_cache_key("/companies/123")
        key2 = client._get_cache_key("/companies/456")
        assert key1 != key2

    def test_get_cache_key_with_params(self, client):
        """Test cache key includes params."""
        key1 = client._get_cache_key("/search", {"q": "tech"})
        key2 = client._get_cache_key("/search", {"q": "health"})
        assert key1 != key2

    def test_get_cache_key_params_order_independent(self, client):
        """Test param order doesn't affect cache key."""
        key1 = client._get_cache_key("/search", {"a": "1", "b": "2"})
        key2 = client._get_cache_key("/search", {"b": "2", "a": "1"})
        assert key1 == key2

    def test_set_and_get_cache(self, client):
        """Test setting and getting cache."""
        client._set_cache("test_key", {"data": "value"})
        cached = client._get_cached("test_key")
        assert cached == {"data": "value"}

    def test_get_cache_miss(self, client):
        """Test cache miss returns None."""
        cached = client._get_cached("nonexistent")
        assert cached is None

    def test_get_cache_expired(self, client):
        """Test expired cache returns None."""
        # Manually set an expired entry
        client._cache["expired_key"] = CacheEntry(
            data={"test": "data"},
            expires_at=datetime.now(UTC) - timedelta(hours=1),
        )
        cached = client._get_cached("expired_key")
        assert cached is None
        # Expired entry should be removed
        assert "expired_key" not in client._cache

    def test_clear_cache(self, client):
        """Test clearing cache."""
        client._set_cache("key1", "value1")
        client._set_cache("key2", "value2")
        assert len(client._cache) == 2

        client.clear_cache()
        assert len(client._cache) == 0

    def test_get_cache_stats(self, client):
        """Test cache statistics."""
        # Add some entries
        client._set_cache("valid1", "data1")
        client._set_cache("valid2", "data2")

        # Add an expired entry
        client._cache["expired"] = CacheEntry(
            data="old_data",
            expires_at=datetime.now(UTC) - timedelta(hours=1),
        )

        stats = client.get_cache_stats()
        assert stats["total_entries"] == 3
        assert stats["expired_entries"] == 1
        assert stats["valid_entries"] == 2


# =============================================================================
# HTTP CLIENT TESTS
# =============================================================================


class TestHTTPClient:
    """Test HTTP client management."""

    @pytest.mark.asyncio
    async def test_get_client_creates_client(self, client):
        """Test _get_client creates HTTP client."""
        http_client = await client._get_client()
        assert http_client is not None
        assert isinstance(http_client, httpx.AsyncClient)
        await client.close()

    @pytest.mark.asyncio
    async def test_get_client_reuses_client(self, client):
        """Test _get_client reuses existing client."""
        http_client1 = await client._get_client()
        http_client2 = await client._get_client()
        assert http_client1 is http_client2
        await client.close()

    @pytest.mark.asyncio
    async def test_close_client(self, client):
        """Test closing HTTP client."""
        await client._get_client()
        assert client._client is not None

        await client.close()
        assert client._client is None

    @pytest.mark.asyncio
    async def test_close_when_no_client(self, client):
        """Test closing when no client exists doesn't error."""
        await client.close()  # Should not raise


# =============================================================================
# COMPANY SEARCH TESTS
# =============================================================================


class TestCompanySearch:
    """Test company search functionality."""

    @pytest.mark.asyncio
    async def test_search_companies_basic(self, client):
        """Test basic company search."""
        mock_response = {
            "results": [
                {
                    "id": "pb-001",
                    "name": "Tech Corp",
                    "description": "A tech company",
                    "primary_industry": "software",
                    "hq_city": "SF",
                    "hq_state": "CA",
                    "hq_country": "US",
                    "employees": 100,
                    "latest_valuation": 50000000,
                    "stage": "growth",
                    "total_raised": 20000000,
                }
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response

            results = await client.search_companies("tech")

            mock_request.assert_called_once()
            call_args = mock_request.call_args
            assert call_args[0][0] == "GET"
            assert call_args[0][1] == "/companies/search"
            assert call_args[1]["params"]["q"] == "tech"

            assert len(results) == 1
            assert results[0]["company_id"] == "pb-001"
            assert results[0]["name"] == "Tech Corp"

        await client.close()

    @pytest.mark.asyncio
    async def test_search_companies_with_filters(self, client):
        """Test company search with filters."""
        filters = SearchFilters(
            industry=IndustryCategory.FINTECH,
            stage=CompanyStage.GROWTH,
            location_country="US",
        )

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"results": []}

            await client.search_companies("fintech", filters=filters)

            params = mock_request.call_args[1]["params"]
            assert params["q"] == "fintech"
            assert params["industry"] == "fintech"
            assert params["stage"] == "growth"
            assert params["country"] == "US"

        await client.close()

    @pytest.mark.asyncio
    async def test_search_companies_pagination(self, client):
        """Test company search with pagination."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"results": []}

            await client.search_companies("tech", limit=50, offset=100)

            params = mock_request.call_args[1]["params"]
            assert params["limit"] == 50
            assert params["offset"] == 100

        await client.close()

    @pytest.mark.asyncio
    async def test_search_companies_limit_capped(self, client):
        """Test search limit is capped at 100."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"results": []}

            await client.search_companies("tech", limit=500)

            params = mock_request.call_args[1]["params"]
            assert params["limit"] == 100  # Capped

        await client.close()

    @pytest.mark.asyncio
    async def test_search_companies_empty_results(self, client):
        """Test search with no results."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"results": []}

            results = await client.search_companies("nonexistent")
            assert results == []

        await client.close()


# =============================================================================
# COMPANY PROFILE TESTS
# =============================================================================


class TestCompanyProfileRetrieval:
    """Test company profile retrieval."""

    @pytest.mark.asyncio
    async def test_get_company_success(self, client, sample_company_data):
        """Test successful company profile retrieval."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_company_data

            profile = await client.get_company("pb-123456")

            assert profile is not None
            assert profile.company_id == "pb-123456"
            assert profile.name == "TechStartup Inc"
            assert profile.description == "A leading AI company"
            assert profile.employee_count == 250
            assert profile.headquarters_city == "San Francisco"

        await client.close()

    @pytest.mark.asyncio
    async def test_get_company_not_found(self, client):
        """Test company not found returns None."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {}

            profile = await client.get_company("nonexistent")
            assert profile is None

        await client.close()

    @pytest.mark.asyncio
    async def test_get_company_uses_cache(self, client, sample_company_data):
        """Test company retrieval uses cache."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_company_data

            # First call
            await client.get_company("pb-123")
            assert mock_request.call_count == 1

            # Second call should use cache
            call_args = mock_request.call_args
            assert call_args[1]["use_cache"] is True

        await client.close()

    @pytest.mark.asyncio
    async def test_get_company_bypass_cache(self, client, sample_company_data):
        """Test company retrieval can bypass cache."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_company_data

            await client.get_company("pb-123", use_cache=False)

            call_args = mock_request.call_args
            assert call_args[1]["use_cache"] is False

        await client.close()


# =============================================================================
# VALUATION TESTS
# =============================================================================


class TestValuations:
    """Test valuation retrieval."""

    @pytest.mark.asyncio
    async def test_get_valuations_success(self, client, sample_valuation):
        """Test successful valuation retrieval."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"valuations": [sample_valuation]}

            valuations = await client.get_valuations("pb-123")

            assert len(valuations) == 1
            assert valuations[0].company_id == "pb-123"
            assert valuations[0].valuation == 500000000
            assert valuations[0].valuation_type == "post_money"
            assert valuations[0].source == "pitchbook"

        await client.close()

    @pytest.mark.asyncio
    async def test_get_valuations_empty(self, client):
        """Test no valuations returns empty list."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"valuations": []}

            valuations = await client.get_valuations("pb-123")
            assert valuations == []

        await client.close()

    @pytest.mark.asyncio
    async def test_get_valuations_multiple(self, client):
        """Test multiple valuations returned."""
        valuations_data = [
            {"value": 500000000, "date": "2024-06-01", "type": "post_money"},
            {"value": 300000000, "date": "2023-06-01", "type": "post_money"},
            {"value": 100000000, "date": "2022-06-01", "type": "post_money"},
        ]

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"valuations": valuations_data}

            valuations = await client.get_valuations("pb-123")

            assert len(valuations) == 3
            assert valuations[0].valuation == 500000000
            assert valuations[2].valuation == 100000000

        await client.close()


# =============================================================================
# FUNDING ROUND TESTS
# =============================================================================


class TestFundingRounds:
    """Test funding round retrieval."""

    @pytest.mark.asyncio
    async def test_get_funding_rounds_success(self, client, sample_funding_round):
        """Test successful funding round retrieval."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"rounds": [sample_funding_round]}

            rounds = await client.get_funding_rounds("pb-123")

            assert len(rounds) == 1
            assert rounds[0].round_id == "round-001"
            assert rounds[0].company_id == "pb-123"
            assert rounds[0].round_type == "series_b"
            assert rounds[0].amount_raised == 50000000

        await client.close()

    @pytest.mark.asyncio
    async def test_get_funding_rounds_with_investors(self, client, sample_funding_round):
        """Test funding rounds include investor info."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"rounds": [sample_funding_round]}

            rounds = await client.get_funding_rounds("pb-123")

            assert len(rounds[0].lead_investors) == 1
            assert rounds[0].lead_investors[0]["name"] == "Top VC Fund"

        await client.close()

    @pytest.mark.asyncio
    async def test_get_funding_rounds_empty(self, client):
        """Test no funding rounds returns empty list."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"rounds": []}

            rounds = await client.get_funding_rounds("pb-123")
            assert rounds == []

        await client.close()


# =============================================================================
# OWNERSHIP TESTS
# =============================================================================


class TestOwnership:
    """Test ownership retrieval."""

    @pytest.mark.asyncio
    async def test_get_ownership_success(self, client, sample_ownership_stake):
        """Test successful ownership retrieval."""
        ownership_data = {
            "stakeholders": [sample_ownership_stake],
            "total_shares": 10000000,
            "latest_share_price": 50.0,
            "fully_diluted_shares": 12000000,
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = ownership_data

            ownership = await client.get_ownership("pb-123")

            assert ownership.company_id == "pb-123"
            assert len(ownership.stakes) == 1
            assert ownership.stakes[0].stakeholder_name == "Founder 1"
            assert ownership.stakes[0].ownership_percentage == 25.5
            assert ownership.total_shares_outstanding == 10000000
            assert ownership.latest_share_price == 50.0

        await client.close()

    @pytest.mark.asyncio
    async def test_get_ownership_empty(self, client):
        """Test ownership with no stakeholders."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"stakeholders": []}

            ownership = await client.get_ownership("pb-123")

            assert ownership.company_id == "pb-123"
            assert ownership.stakes == []

        await client.close()


# =============================================================================
# ADDITIONAL ENDPOINT TESTS
# =============================================================================


class TestAdditionalEndpoints:
    """Test additional API endpoints."""

    @pytest.mark.asyncio
    async def test_get_investors(self, client):
        """Test get investors endpoint."""
        investors_data = {
            "investors": [
                {"id": "inv-001", "name": "Top VC", "type": "venture_capital"},
                {"id": "inv-002", "name": "Angel", "type": "angel"},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = investors_data

            investors = await client.get_investors("pb-123")

            assert len(investors) == 2
            assert investors[0]["name"] == "Top VC"

        await client.close()

    @pytest.mark.asyncio
    async def test_get_similar_companies(self, client):
        """Test get similar companies endpoint."""
        similar_data = {
            "companies": [
                {"id": "pb-001", "name": "Similar Corp 1"},
                {"id": "pb-002", "name": "Similar Corp 2"},
            ]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = similar_data

            similar = await client.get_similar_companies("pb-123", limit=5)

            call_args = mock_request.call_args
            assert call_args[1]["params"]["limit"] == 5
            assert len(similar) == 2

        await client.close()


# =============================================================================
# BULK OPERATION TESTS
# =============================================================================


class TestBulkOperations:
    """Test bulk operation functionality."""

    @pytest.mark.asyncio
    async def test_get_bulk_companies(self, client, sample_company_data):
        """Test bulk company retrieval."""
        with patch.object(client, "get_company", new_callable=AsyncMock) as mock_get:
            profile = CompanyProfile(
                company_id=sample_company_data["company_id"],
                name=sample_company_data["company_name"],
            )
            mock_get.return_value = profile

            results = await client.get_bulk_companies(["pb-001", "pb-002", "pb-003"])

            assert len(results) == 3
            assert mock_get.call_count == 3
            assert all(p is not None for p in results.values())

        await client.close()

    @pytest.mark.asyncio
    async def test_get_bulk_companies_with_errors(self, client, sample_company_data):
        """Test bulk companies handles errors gracefully."""

        async def mock_get(company_id, use_cache=True):
            if company_id == "pb-error":
                raise IntegrationError(provider="Pitchbook", message="API Error")
            return CompanyProfile(company_id=company_id, name="Test")

        with patch.object(client, "get_company", side_effect=mock_get):
            results = await client.get_bulk_companies(["pb-001", "pb-error", "pb-003"])

            assert results["pb-001"] is not None
            assert results["pb-error"] is None  # Error handled
            assert results["pb-003"] is not None

        await client.close()

    @pytest.mark.asyncio
    async def test_get_bulk_funding_rounds(self, client, sample_funding_round):
        """Test bulk funding round retrieval."""
        with patch.object(
            client, "get_funding_rounds", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [
                FundingRound(round_id="r1", company_id="pb-001", round_type="seed")
            ]

            results = await client.get_bulk_funding_rounds(["pb-001", "pb-002"])

            assert len(results) == 2
            assert mock_get.call_count == 2
            assert len(results["pb-001"]) == 1

        await client.close()

    @pytest.mark.asyncio
    async def test_get_bulk_funding_rounds_with_errors(self, client):
        """Test bulk funding rounds handles errors gracefully."""

        async def mock_get(company_id, use_cache=True):
            if company_id == "pb-error":
                raise IntegrationError(provider="Pitchbook", message="API Error")
            return [FundingRound(round_id="r1", company_id=company_id, round_type="seed")]

        with patch.object(client, "get_funding_rounds", side_effect=mock_get):
            results = await client.get_bulk_funding_rounds(["pb-001", "pb-error"])

            assert len(results["pb-001"]) == 1
            assert results["pb-error"] == []  # Error handled

        await client.close()


# =============================================================================
# MAPPING TESTS
# =============================================================================


class TestMappingToARC:
    """Test mapping Pitchbook data to ARC models."""

    def test_map_to_arc_security(self, client, sample_company_data):
        """Test mapping company to ARC Security model."""
        profile = CompanyProfile(
            company_id=sample_company_data["company_id"],
            name=sample_company_data["company_name"],
            description=sample_company_data["description"],
            primary_industry=sample_company_data["primary_industry"],
            sub_industry=sample_company_data["sub_industry"],
            founded_year=sample_company_data["founded_year"],
            headquarters_city=sample_company_data["headquarters"]["city"],
            headquarters_state=sample_company_data["headquarters"]["state"],
            headquarters_country=sample_company_data["headquarters"]["country"],
            employee_count=sample_company_data["employee_count"],
            website=sample_company_data["website"],
        )

        mapped = client.map_to_arc_security(profile)

        assert mapped["id"] == "pb-pb-123456"
        assert mapped["name"] == "TechStartup Inc"
        assert mapped["ticker"] is None
        assert mapped["security_type"] == "private_equity"
        assert mapped["is_private"] is True
        assert mapped["sector"] == "software"
        assert mapped["industry"] == "artificial_intelligence"
        assert mapped["headquarters_country"] == "US"
        assert mapped["employee_count"] == 250
        assert mapped["external_ids"]["pitchbook"] == "pb-123456"

    def test_map_to_arc_valuation(self, client):
        """Test mapping valuation to ARC model."""
        valuation = Valuation(
            company_id="pb-123",
            valuation=500000000,
            currency="USD",
            valuation_date="2024-06-15",
            valuation_type="post_money",
            methodology="comparable_transactions",
        )

        mapped = client.map_to_arc_valuation(valuation, security_id="sec-001")

        assert mapped["id"] == "sec-001_2024-06-15"
        assert mapped["security_id"] == "sec-001"
        assert mapped["valuation_date"] == "2024-06-15"
        assert mapped["valuation"] == "500000000"
        assert mapped["valuation_type"] == "post_money"
        assert mapped["source"] == "pitchbook"

    def test_map_to_arc_valuation_no_date(self, client):
        """Test mapping valuation without date uses today."""
        valuation = Valuation(
            company_id="pb-123",
            valuation=100000000,
        )

        mapped = client.map_to_arc_valuation(valuation, security_id="sec-001")

        # Should have today's date
        assert mapped["valuation_date"] == datetime.now(UTC).strftime("%Y-%m-%d")


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================


class TestErrorHandling:
    """Test error handling."""

    @pytest.mark.asyncio
    async def test_authentication_error(self, client):
        """Test authentication error handling."""
        mock_response = AsyncMock()
        mock_response.status_code = 401

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            with pytest.raises(AuthenticationError) as exc_info:
                await client._request("GET", "/test")

            assert "Pitchbook" in str(exc_info.value)
            assert "Invalid or expired API key" in str(exc_info.value)
            assert exc_info.value.auth_type == "api_key"

        await client.close()

    @pytest.mark.asyncio
    async def test_rate_limit_error(self, client):
        """Test rate limit error handling."""
        mock_response = AsyncMock()
        mock_response.status_code = 429
        mock_response.headers = {"Retry-After": "120"}

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            with pytest.raises(RateLimitError) as exc_info:
                await client._request("GET", "/test")

            assert exc_info.value.retry_after == 120
            assert "Pitchbook" in str(exc_info.value)

        await client.close()

    @pytest.mark.asyncio
    async def test_not_found_returns_empty(self, client):
        """Test 404 returns empty dict."""
        mock_response = AsyncMock()
        mock_response.status_code = 404

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await client._request("GET", "/test")
            assert result == {}

        await client.close()

    @pytest.mark.asyncio
    async def test_server_error_retry(self, client):
        """Test server error triggers retry."""
        call_count = 0

        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                response = AsyncMock()
                response.status_code = 500
                response.text = "Internal Server Error"
                return response
            response = AsyncMock()
            response.status_code = 200
            response.json = lambda: {"success": True}
            return response

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = mock_request
            mock_get.return_value = mock_client

            # Mock sleep to speed up test
            with patch("asyncio.sleep", new_callable=AsyncMock):
                result = await client._request("GET", "/test", use_cache=False)

            assert result == {"success": True}
            assert call_count == 3

        await client.close()

    @pytest.mark.asyncio
    async def test_server_error_max_retries(self, client):
        """Test server error after max retries raises error."""
        mock_response = AsyncMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            with patch("asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(IntegrationError) as exc_info:
                    await client._request("GET", "/test", use_cache=False)

            assert "Server error: 500" in str(exc_info.value)
            assert exc_info.value.provider == "Pitchbook"
            assert exc_info.value.response_code == 500

        await client.close()

    @pytest.mark.asyncio
    async def test_request_error_retry(self, client):
        """Test request error triggers retry."""
        call_count = 0

        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise httpx.RequestError("Connection failed")
            response = AsyncMock()
            response.status_code = 200
            response.json = lambda: {"success": True}
            return response

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = mock_request
            mock_get.return_value = mock_client

            with patch("asyncio.sleep", new_callable=AsyncMock):
                result = await client._request("GET", "/test", use_cache=False)

            assert result == {"success": True}
            assert call_count == 3

        await client.close()

    @pytest.mark.asyncio
    async def test_request_error_max_retries(self, client):
        """Test request error after max retries raises."""
        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(
                side_effect=httpx.RequestError("Connection failed")
            )
            mock_get.return_value = mock_client

            with patch("asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(IntegrationError) as exc_info:
                    await client._request("GET", "/test", use_cache=False)

            assert "Request failed" in str(exc_info.value)

        await client.close()

    @pytest.mark.asyncio
    async def test_unexpected_status_code(self, client):
        """Test unexpected status code raises error."""
        mock_response = AsyncMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"

        with patch.object(client, "_get_client", new_callable=AsyncMock) as mock_get:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            with pytest.raises(IntegrationError) as exc_info:
                await client._request("GET", "/test")

            assert "Unexpected status: 403" in str(exc_info.value)
            assert exc_info.value.provider == "Pitchbook"
            assert exc_info.value.response_code == 403

        await client.close()


# =============================================================================
# CREDENTIAL VALIDATION TESTS
# =============================================================================


class TestCredentialValidation:
    """Test credential validation."""

    @pytest.mark.asyncio
    async def test_validate_credentials_success(self, client):
        """Test successful credential validation."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"valid": True}

            result = await client.validate_credentials()
            assert result is True

            mock_request.assert_called_once_with(
                "GET", "/auth/validate", use_cache=False
            )

        await client.close()

    @pytest.mark.asyncio
    async def test_validate_credentials_invalid(self, client):
        """Test invalid credentials."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = AuthenticationError(
                message="Pitchbook: Invalid API key",
                auth_type="api_key",
            )

            result = await client.validate_credentials()
            assert result is False

        await client.close()

    @pytest.mark.asyncio
    async def test_validate_credentials_error(self, client):
        """Test credential validation with other error."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = IntegrationError(
                provider="Pitchbook",
                message="Server error",
            )

            result = await client.validate_credentials()
            assert result is False

        await client.close()


# =============================================================================
# SEARCH RESULT MAPPING TESTS
# =============================================================================


class TestSearchResultMapping:
    """Test search result mapping."""

    def test_map_search_result_complete(self, client):
        """Test mapping complete search result."""
        raw = {
            "id": "pb-001",
            "name": "Test Corp",
            "description": "A test company",
            "primary_industry": "software",
            "hq_city": "New York",
            "hq_state": "NY",
            "hq_country": "US",
            "employees": 500,
            "latest_valuation": 100000000,
            "stage": "growth",
            "total_raised": 50000000,
        }

        mapped = client._map_search_result(raw)

        assert mapped["company_id"] == "pb-001"
        assert mapped["name"] == "Test Corp"
        assert mapped["description"] == "A test company"
        assert mapped["industry"] == "software"
        assert mapped["location"]["city"] == "New York"
        assert mapped["location"]["state"] == "NY"
        assert mapped["location"]["country"] == "US"
        assert mapped["employee_count"] == 500
        assert mapped["latest_valuation"] == 100000000
        assert mapped["stage"] == "growth"
        assert mapped["total_funding"] == 50000000

    def test_map_search_result_minimal(self, client):
        """Test mapping minimal search result."""
        raw = {"id": "pb-001", "name": "Test Corp"}

        mapped = client._map_search_result(raw)

        assert mapped["company_id"] == "pb-001"
        assert mapped["name"] == "Test Corp"
        assert mapped["description"] is None
        assert mapped["location"]["city"] is None


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestClientIntegration:
    """Integration-style tests for client workflow."""

    @pytest.mark.asyncio
    async def test_full_company_workflow(self, client, sample_company_data):
        """Test full workflow: search -> profile -> valuations."""
        # Mock all endpoints
        search_response = {
            "results": [{"id": "pb-123456", "name": "TechStartup Inc"}]
        }
        valuations_response = {
            "valuations": [{"value": 500000000, "date": "2024-06-15"}]
        }
        funding_response = {
            "rounds": [{"round_id": "r1", "round_type": "series_b", "amount_raised": 50000000}]
        }

        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:

            async def route_request(method, endpoint, **kwargs):
                if "search" in endpoint:
                    return search_response
                elif "valuations" in endpoint:
                    return valuations_response
                elif "funding" in endpoint:
                    return funding_response
                else:
                    return sample_company_data

            mock_request.side_effect = route_request

            # Execute workflow
            search_results = await client.search_companies("tech")
            assert len(search_results) == 1

            company_id = search_results[0]["company_id"]
            profile = await client.get_company(company_id)
            assert profile.name == "TechStartup Inc"

            valuations = await client.get_valuations(company_id)
            assert len(valuations) == 1
            assert valuations[0].valuation == 500000000

            rounds = await client.get_funding_rounds(company_id)
            assert len(rounds) == 1
            assert rounds[0].amount_raised == 50000000

        await client.close()

    @pytest.mark.asyncio
    async def test_cache_hit_workflow(self, client, sample_company_data):
        """Test that cache is utilized in workflow."""
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_company_data

            # First call
            await client.get_company("pb-123")

            # Second call should hit cache (mocked at _request level, so
            # we verify by checking use_cache=True was passed)
            await client.get_company("pb-123")

            assert mock_request.call_args[1]["use_cache"] is True

        await client.close()
