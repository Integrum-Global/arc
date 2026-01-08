# Pitchbook Client

The Pitchbook client provides access to private company data including company profiles, valuations, funding rounds, and ownership structures.

## Overview

The `PitchbookClient` is an async HTTP client that interfaces with the Pitchbook API. It provides:

- Company search with comprehensive filters
- Company profile retrieval
- Valuation history tracking
- Funding round details
- Ownership structure analysis
- Aggressive caching (7-day TTL for expensive data)
- Automatic retry with exponential backoff
- ARC schema mapping for seamless data integration

## Installation

The Pitchbook client is included in the ARC integrations package:

```python
from arc.integrations import PitchbookClient, PitchbookConfig
```

## Configuration

### Basic Configuration

```python
from arc.integrations import PitchbookClient

# Simple initialization with API key
client = PitchbookClient(api_key="your_api_key")
```

### Advanced Configuration

```python
from arc.integrations import PitchbookClient, PitchbookConfig

config = PitchbookConfig(
    api_key="your_api_key",
    base_url="https://api.pitchbook.com/v1",  # Default
    timeout=30.0,                              # Request timeout in seconds
    max_retries=3,                             # Number of retry attempts
    base_delay=1.0,                            # Base delay for exponential backoff
    cache_ttl_seconds=604800,                  # 7 days (default)
)

client = PitchbookClient(config=config)
```

## Usage

### Company Search

Search for private companies with optional filters:

```python
from arc.integrations import SearchFilters, IndustryCategory, CompanyStage

# Basic search
results = await client.search_companies("fintech")

# Search with filters
filters = SearchFilters(
    industry=IndustryCategory.FINTECH,
    stage=CompanyStage.GROWTH,
    location_country="US",
    location_state="CA",
    min_employees=50,
    max_employees=500,
    min_valuation=10_000_000,
    max_valuation=1_000_000_000,
    founded_after=2015,
    founded_before=2023,
)

results = await client.search_companies(
    query="payment processing",
    filters=filters,
    limit=50,
    offset=0,
)

for company in results:
    print(f"{company['name']}: {company['latest_valuation']}")
```

### Company Profile

Retrieve detailed company information:

```python
profile = await client.get_company("pb-12345")

if profile:
    print(f"Company: {profile.name}")
    print(f"Industry: {profile.primary_industry}")
    print(f"Employees: {profile.employee_count}")
    print(f"Latest Valuation: ${profile.latest_valuation:,.0f}")
    print(f"Total Funding: ${profile.total_funding:,.0f}")
```

### Valuation History

Get a company's valuation history:

```python
valuations = await client.get_valuations("pb-12345")

for val in valuations:
    print(f"{val.valuation_date}: ${val.valuation:,.0f} ({val.valuation_type})")
    print(f"  Methodology: {val.methodology}")
    print(f"  Confidence: {val.confidence_level}")
```

### Funding Rounds

Get detailed funding round information:

```python
rounds = await client.get_funding_rounds("pb-12345")

for round in rounds:
    print(f"{round.round_type}: ${round.amount_raised:,.0f}")
    print(f"  Date: {round.round_date}")
    print(f"  Pre-money: ${round.pre_money_valuation:,.0f}")
    print(f"  Post-money: ${round.post_money_valuation:,.0f}")
    print(f"  Lead Investors: {[inv['name'] for inv in round.lead_investors]}")
```

### Ownership Structure

Analyze company ownership:

```python
ownership = await client.get_ownership("pb-12345")

print(f"Total Shares: {ownership.total_shares_outstanding:,}")
print(f"Share Price: ${ownership.latest_share_price:.2f}")

for stake in ownership.stakes:
    print(f"{stake.stakeholder_name} ({stake.stakeholder_type}):")
    print(f"  Ownership: {stake.ownership_percentage:.1f}%")
    print(f"  Board Seats: {stake.board_seats}")
    print(f"  Total Invested: ${stake.investment_amount:,.0f}")
```

### Bulk Operations

Efficiently fetch data for multiple companies:

```python
company_ids = ["pb-001", "pb-002", "pb-003"]

# Get profiles in bulk
profiles = await client.get_bulk_companies(company_ids)

for company_id, profile in profiles.items():
    if profile:
        print(f"{profile.name}: ${profile.latest_valuation:,.0f}")
    else:
        print(f"{company_id}: Not found")

# Get funding rounds in bulk
all_rounds = await client.get_bulk_funding_rounds(company_ids)

for company_id, rounds in all_rounds.items():
    print(f"{company_id}: {len(rounds)} rounds")
```

### Additional Endpoints

```python
# Get investors for a company
investors = await client.get_investors("pb-12345")

# Get similar companies
similar = await client.get_similar_companies("pb-12345", limit=10)
```

## Data Models

### SearchFilters

| Field | Type | Description |
|-------|------|-------------|
| `industry` | `IndustryCategory` | Filter by industry |
| `stage` | `CompanyStage` | Filter by funding stage |
| `location_country` | `str` | Filter by country |
| `location_state` | `str` | Filter by state |
| `min_employees` | `int` | Minimum employee count |
| `max_employees` | `int` | Maximum employee count |
| `min_valuation` | `float` | Minimum valuation |
| `max_valuation` | `float` | Maximum valuation |
| `founded_after` | `int` | Founded year minimum |
| `founded_before` | `int` | Founded year maximum |

### CompanyProfile

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | `str` | Pitchbook company ID |
| `name` | `str` | Company name |
| `description` | `str` | Company description |
| `primary_industry` | `str` | Primary industry |
| `sub_industry` | `str` | Sub-industry |
| `founded_year` | `int` | Year founded |
| `headquarters_city` | `str` | HQ city |
| `headquarters_state` | `str` | HQ state |
| `headquarters_country` | `str` | HQ country |
| `employee_count` | `int` | Employee count |
| `website` | `str` | Company website |
| `linkedin_url` | `str` | LinkedIn profile |
| `latest_valuation` | `float` | Latest valuation (USD) |
| `latest_valuation_date` | `str` | Date of latest valuation |
| `latest_valuation_type` | `str` | Type of valuation |
| `total_funding` | `float` | Total funding raised |
| `funding_rounds_count` | `int` | Number of funding rounds |
| `stage` | `str` | Current funding stage |

### FundingRound

| Field | Type | Description |
|-------|------|-------------|
| `round_id` | `str` | Round identifier |
| `company_id` | `str` | Company ID |
| `round_type` | `str` | Type of round |
| `amount_raised` | `float` | Amount raised |
| `currency` | `str` | Currency (default: USD) |
| `round_date` | `str` | Date of round |
| `pre_money_valuation` | `float` | Pre-money valuation |
| `post_money_valuation` | `float` | Post-money valuation |
| `lead_investors` | `list[dict]` | Lead investor details |
| `participating_investors` | `list[dict]` | All participating investors |
| `announced_date` | `str` | Public announcement date |

### Valuation

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | `str` | Company ID |
| `valuation` | `float` | Valuation amount |
| `currency` | `str` | Currency (default: USD) |
| `valuation_date` | `str` | Date of valuation |
| `valuation_type` | `str` | Type (pre_money, post_money) |
| `methodology` | `str` | Valuation methodology |
| `source` | `str` | Data source (pitchbook) |
| `confidence_level` | `str` | Confidence level |

### OwnershipStructure

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | `str` | Company ID |
| `stakes` | `list[OwnershipStake]` | List of ownership stakes |
| `total_shares_outstanding` | `int` | Total shares |
| `latest_share_price` | `float` | Share price |
| `fully_diluted_shares` | `int` | Fully diluted shares |

### OwnershipStake

| Field | Type | Description |
|-------|------|-------------|
| `stakeholder_id` | `str` | Stakeholder ID |
| `stakeholder_name` | `str` | Name |
| `stakeholder_type` | `str` | Type (investor, founder, employee) |
| `ownership_percentage` | `float` | Ownership % |
| `board_seats` | `int` | Number of board seats |
| `investment_amount` | `float` | Total invested |
| `first_investment_date` | `str` | First investment date |

## Enums

### IndustryCategory

- `SOFTWARE`
- `HEALTHCARE`
- `FINTECH`
- `CONSUMER`
- `ENTERPRISE`
- `BIOTECH`
- `CLEANTECH`
- `HARDWARE`
- `MEDIA`
- `ECOMMERCE`

### CompanyStage

- `SEED`
- `EARLY` (early_stage)
- `GROWTH`
- `LATE` (late_stage)
- `PUBLIC`
- `ACQUIRED`

### RoundType

- `PRE_SEED`
- `SEED`
- `SERIES_A` through `SERIES_F`
- `GROWTH`
- `BRIDGE`
- `CONVERTIBLE`
- `SECONDARY`
- `IPO`
- `ACQUISITION`

## ARC Schema Mapping

The client provides methods to map Pitchbook data to ARC models:

### Map to Security Model

```python
profile = await client.get_company("pb-12345")
security_data = client.map_to_arc_security(profile)

# Returns:
# {
#     "id": "pb-pb-12345",
#     "ticker": None,  # Private companies
#     "name": "Company Name",
#     "security_type": "private_equity",
#     "is_private": True,
#     "sector": "software",
#     "industry": "artificial_intelligence",
#     "external_ids": {"pitchbook": "pb-12345"},
#     ...
# }
```

### Map to Valuation Model

```python
valuations = await client.get_valuations("pb-12345")
valuation_data = client.map_to_arc_valuation(
    valuations[0],
    security_id="sec-001"
)

# Returns:
# {
#     "id": "sec-001_2024-06-15",
#     "security_id": "sec-001",
#     "valuation_date": "2024-06-15",
#     "valuation": "500000000",
#     "valuation_type": "post_money",
#     "source": "pitchbook",
#     ...
# }
```

## Caching

The client implements aggressive caching with a 7-day TTL by default. This is because:

1. Pitchbook data is expensive (per-API-call pricing)
2. Private company data changes infrequently
3. Valuation updates are typically quarterly

### Cache Management

```python
# Get cache statistics
stats = client.get_cache_stats()
print(f"Total entries: {stats['total_entries']}")
print(f"Valid entries: {stats['valid_entries']}")
print(f"Expired entries: {stats['expired_entries']}")

# Clear all cached data
client.clear_cache()

# Bypass cache for a specific request
profile = await client.get_company("pb-12345", use_cache=False)
```

## Error Handling

The client raises specific exceptions for different error conditions:

```python
from arc.core.exceptions import (
    AuthenticationError,
    RateLimitError,
    IntegrationError,
)

try:
    profile = await client.get_company("pb-12345")
except AuthenticationError:
    # Invalid or expired API key
    print("Check your API credentials")
except RateLimitError as e:
    # Rate limit exceeded
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except IntegrationError as e:
    # Other API errors
    print(f"API error: {e.message}")
```

### Automatic Retry

The client automatically retries on:

- Server errors (5xx status codes)
- Connection errors
- Timeout errors

Retry uses exponential backoff: 1s, 2s, 4s (with default settings).

## Credential Validation

Validate API credentials before use:

```python
is_valid = await client.validate_credentials()

if not is_valid:
    print("Invalid API credentials")
```

## Resource Cleanup

Always close the client when done:

```python
try:
    # Use the client
    profile = await client.get_company("pb-12345")
finally:
    await client.close()
```

Or use async context manager pattern:

```python
async def fetch_company_data():
    client = PitchbookClient(api_key="your_key")
    try:
        return await client.get_company("pb-12345")
    finally:
        await client.close()
```

## Field Mappings

The module exports field mapping dictionaries for custom transformations:

```python
from arc.integrations import (
    COMPANY_FIELD_MAPPING,
    VALUATION_FIELD_MAPPING,
    FUNDING_ROUND_MAPPING,
)

# COMPANY_FIELD_MAPPING maps Pitchbook fields to ARC fields
# e.g., "company_name" -> "name", "primary_industry" -> "sector"

# VALUATION_FIELD_MAPPING
# e.g., "value" -> "valuation", "date" -> "valuation_date"

# FUNDING_ROUND_MAPPING
# e.g., "amount_raised" -> "amount", "round_type" -> "round_type"
```

## Best Practices

1. **Use Caching**: Leverage the 7-day cache to minimize API costs
2. **Bulk Operations**: Use bulk methods for fetching multiple companies
3. **Error Handling**: Always handle `AuthenticationError` and `RateLimitError`
4. **Resource Cleanup**: Always close the client when done
5. **Filter Early**: Use search filters to reduce result sets
6. **Validate Credentials**: Check credentials on startup

## Testing

Unit tests are located in `tests/unit/integrations/test_pitchbook_client.py`.

Run tests:

```bash
uv run pytest tests/unit/integrations/test_pitchbook_client.py -v
```

## See Also

- [EODHD Client](18-eodhd-client.md) - Market data integration
- [Capital IQ Client](18-capital-iq-client.md) - Financial data integration
- [Notification Service](19-notification-service.md) - Alert delivery
