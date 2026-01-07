# TODO-BE-022: Capital IQ Client Implementation

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: None

---

## Objective

Implement the Capital IQ client for fetching comprehensive company fundamentals and financial data.

---

## Tasks

### 1. Client Structure
- [ ] Create `src/arc/integrations/capital_iq/__init__.py`
- [ ] Create `src/arc/integrations/capital_iq/client.py`
- [ ] Implement `CapitalIQClient`:
  ```python
  class CapitalIQClient:
      BASE_URL = "https://api-ciq.spglobal.com"

      def __init__(self, api_key: str = None, api_secret: str = None):
          self.api_key = api_key or settings.CAPITALIQ_API_KEY
          self.api_secret = api_secret or settings.CAPITALIQ_API_SECRET
          self.access_token = None
          self.token_expires = None

      async def _ensure_token(self):
          """Ensure valid OAuth token."""
          pass

      async def validate_credentials(self, api_key: str) -> bool:
          """Validate API credentials."""
          pass

      async def get_company_profile(self, identifier: str) -> dict:
          """Get company profile data."""
          pass

      async def get_financials(
          self,
          identifier: str,
          period_type: str = "quarterly",
          num_periods: int = 4
      ) -> List[dict]:
          """Get financial statements."""
          pass
  ```

### 2. OAuth Authentication
- [ ] Implement `_ensure_token()`:
  - Endpoint: `/oauth/token`
  - Client credentials flow
  - Token refresh before expiry
- [ ] Store tokens securely
- [ ] Handle token expiration gracefully

### 3. Company Profile
- [ ] Implement `get_company_profile()`:
  - Company name, sector, industry
  - Exchange, country
  - Description, employees
  - Identifiers (GVKEY, IQ_ID)

### 4. Financial Statements
- [ ] Implement `get_financials()`:
  - Income Statement items
  - Balance Sheet items
  - Cash Flow Statement items
  - Support quarterly and annual
  - Return N periods of history

### 5. Data Mapping
- [ ] Map Capital IQ fields to ARC fields:
  ```python
  FIELD_MAPPING = {
      "IQ_TOTAL_REV": "revenue",
      "IQ_GROSS_PROFIT": "gross_profit",
      "IQ_EBITDA": "ebitda",
      "IQ_NET_INCOME": "net_income",
      "IQ_TOTAL_ASSETS": "total_assets",
      "IQ_TOTAL_DEBT": "total_debt",
      ...
  }
  ```

### 6. Bulk Operations
- [ ] Implement `get_bulk_financials()`:
  - Batch multiple companies
  - Efficient for full sync
- [ ] Handle partial failures in batch

### 7. Error Handling
- [ ] Handle authentication errors
- [ ] Handle rate limiting
- [ ] Implement retry logic
- [ ] Log errors with context

---

## Acceptance Criteria

- [ ] OAuth token management
- [ ] Company profile retrieval
- [ ] Financial statements (quarterly/annual)
- [ ] Field mapping to ARC schema
- [ ] Bulk operations
- [ ] Error handling
- [ ] Unit test: Field mapping
- [ ] Integration test: API calls (with mock)

---

## Field Mappings

### Income Statement
| Capital IQ Field | ARC Field |
|-----------------|-----------|
| IQ_TOTAL_REV | revenue |
| IQ_COST_OF_REV | cost_of_revenue |
| IQ_GROSS_PROFIT | gross_profit |
| IQ_OPER_INC | operating_income |
| IQ_EBITDA | ebitda |
| IQ_NI | net_income |
| IQ_BASIC_EPS | eps_basic |
| IQ_DILUT_EPS | eps_diluted |

### Balance Sheet
| Capital IQ Field | ARC Field |
|-----------------|-----------|
| IQ_TOTAL_ASSETS | total_assets |
| IQ_TOTAL_CURR_ASSETS | current_assets |
| IQ_CASH_ST_INVEST | cash_and_equivalents |
| IQ_AR | accounts_receivable |
| IQ_INV | inventory |
| IQ_TOTAL_LIAB | total_liabilities |
| IQ_TOTAL_CURR_LIAB | current_liabilities |
| IQ_TOTAL_DEBT | total_debt |
| IQ_TOTAL_EQUITY | total_equity |

### Cash Flow
| Capital IQ Field | ARC Field |
|-----------------|-----------|
| IQ_CFO | operating_cash_flow |
| IQ_CAPEX | capital_expenditures |
| IQ_FCF | free_cash_flow |
| IQ_DIV_PAID | dividends_paid |

---

## Technical Notes

- Capital IQ uses GVKEY as primary identifier
- Support lookup by ticker, ISIN, CUSIP
- Respect API rate limits (varies by plan)
- Cache company profiles (24h TTL)
- Store last sync date per company
