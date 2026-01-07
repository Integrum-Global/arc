# TODO-BE-023: Pitchbook Client Implementation

**Priority**: LOW
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: None

---

## Objective

Implement the Pitchbook client for fetching private company data including valuations, funding rounds, and ownership.

---

## Tasks

### 1. Client Structure
- [ ] Create `src/arc/integrations/pitchbook/__init__.py`
- [ ] Create `src/arc/integrations/pitchbook/client.py`
- [ ] Implement `PitchbookClient`:
  ```python
  class PitchbookClient:
      BASE_URL = "https://api.pitchbook.com/v1"

      def __init__(self, api_key: str = None):
          self.api_key = api_key or settings.PITCHBOOK_API_KEY
          self.client = httpx.AsyncClient(timeout=30)

      async def validate_credentials(self, api_key: str) -> bool:
          """Validate API key."""
          pass

      async def search_companies(
          self,
          query: str,
          filters: dict = None
      ) -> List[dict]:
          """Search for private companies."""
          pass

      async def get_company(self, company_id: str) -> dict:
          """Get company details."""
          pass

      async def get_valuations(self, company_id: str) -> List[dict]:
          """Get company valuation history."""
          pass

      async def get_funding_rounds(self, company_id: str) -> List[dict]:
          """Get funding round history."""
          pass

      async def get_ownership(self, company_id: str) -> dict:
          """Get ownership structure."""
          pass
  ```

### 2. Company Search
- [ ] Implement `search_companies()`:
  - Search by name, keywords
  - Filter by industry, location, stage
  - Return list with basic info
- [ ] Handle pagination

### 3. Company Profile
- [ ] Implement `get_company()`:
  - Company name, description
  - Industry classification
  - Founding date, headquarters
  - Website, LinkedIn
  - Employee count
  - Latest valuation

### 4. Valuations
- [ ] Implement `get_valuations()`:
  - Valuation date
  - Pre/post-money valuation
  - Methodology (VC, secondary, etc.)
  - Source/round association

### 5. Funding Rounds
- [ ] Implement `get_funding_rounds()`:
  - Round type (Seed, Series A, etc.)
  - Amount raised
  - Lead investors
  - Participating investors
  - Date

### 6. Ownership
- [ ] Implement `get_ownership()`:
  - Shareholder list
  - Ownership percentages
  - Board representation

### 7. Data Mapping
- [ ] Map Pitchbook fields to Security model:
  - Create Security with `is_private=True`
  - Store valuation in separate model
  - Map investors to related entities

### 8. Error Handling
- [ ] Handle API errors
- [ ] Implement rate limiting
- [ ] Retry logic for transient failures

---

## Acceptance Criteria

- [ ] Company search works
- [ ] Company profile retrieval
- [ ] Valuation history
- [ ] Funding rounds
- [ ] Ownership data
- [ ] Mapping to ARC models
- [ ] Unit test: Response parsing
- [ ] Integration test: API calls (with mock)

---

## Response Formats

### Company Profile Response
```json
{
    "company_id": "pb-12345",
    "company_name": "TechStartup Inc",
    "description": "AI-powered platform for...",
    "primary_industry": "Software",
    "sub_industry": "Enterprise Software",
    "founded_year": 2020,
    "headquarters": {
        "city": "San Francisco",
        "state": "CA",
        "country": "USA"
    },
    "employee_count": 150,
    "latest_valuation": {
        "value": 500000000,
        "currency": "USD",
        "date": "2025-06-15",
        "type": "Series C"
    },
    "website": "https://techstartup.com"
}
```

### Funding Rounds Response
```json
{
    "company_id": "pb-12345",
    "rounds": [
        {
            "round_id": "fr-001",
            "round_type": "Series C",
            "amount_raised": 100000000,
            "currency": "USD",
            "date": "2025-06-15",
            "pre_money_valuation": 400000000,
            "post_money_valuation": 500000000,
            "lead_investors": [
                {"name": "Sequoia Capital", "id": "inv-001"}
            ],
            "participating_investors": [
                {"name": "a16z", "id": "inv-002"},
                {"name": "Tiger Global", "id": "inv-003"}
            ]
        }
    ]
}
```

---

## Private Company Model Extension

```python
@db.model
class PrivateCompanyValuation:
    """Valuation history for private companies."""
    id: str  # "pb-12345_2025-06-15"
    security_id: str  # FK to Security (is_private=True)
    valuation_date: str
    valuation: str  # Decimal string
    valuation_type: str  # "Series C", "Secondary", etc.
    methodology: Optional[str]
    source: str = "pitchbook"
```

---

## Technical Notes

- Pitchbook data is premium and expensive
- Implement aggressive caching (7 day TTL)
- Store all fetched data locally
- Respect API quota limits
- This is lower priority - implement skeleton first
