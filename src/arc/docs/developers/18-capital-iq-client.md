# Capital IQ Client

The Capital IQ client provides access to S&P Global's Capital IQ API for company fundamentals and financial data.

## Overview

The Capital IQ integration enables:

1. **Company Profiles**: Company information including sector, industry, and identifiers
2. **Financial Statements**: Income statement, balance sheet, and cash flow data
3. **Quarterly/Annual Data**: Historical financial periods
4. **Bulk Operations**: Efficient multi-company data retrieval
5. **Field Mapping**: Automatic mapping to ARC schema

## Authentication

Capital IQ uses OAuth 2.0 Client Credentials flow:

```python
from arc.integrations import CapitalIQClient

# Initialize with credentials
client = CapitalIQClient(
    api_key="your_api_key",
    api_secret="your_api_secret"
)

# Validate credentials
is_valid = await client.validate_credentials()
```

### Token Management

- Tokens are automatically refreshed before expiry
- 60-second buffer before expiration triggers refresh
- Token lock ensures thread-safe refresh

## Quick Start

```python
from arc.integrations import CapitalIQClient, PeriodType

async with CapitalIQClient(api_key="key", api_secret="secret") as client:
    # Get company profile
    profile = await client.get_company_profile("AAPL")
    print(f"Company: {profile['name']}")
    print(f"Sector: {profile['sector']}")

    # Get quarterly financials
    financials = await client.get_financials(
        "AAPL",
        period_type=PeriodType.QUARTERLY,
        num_periods=4
    )
    for period in financials:
        print(f"Q{period['fiscal_quarter']} Revenue: ${period['revenue']:,.0f}")
```

## Company Profile

Retrieve company metadata and identifiers.

```python
profile = await client.get_company_profile(
    identifier="AAPL",
    identifier_type="ticker",  # ticker, gvkey, isin, cusip
    use_cache=True            # Cache for 24 hours
)

# Available fields
profile["gvkey"]       # Capital IQ GVKEY
profile["iq_id"]       # IQ Company ID
profile["name"]        # Company name
profile["ticker"]      # Primary ticker
profile["exchange"]    # Primary exchange
profile["sector"]      # GICS sector
profile["industry"]    # GICS industry
profile["country"]     # Headquarters country
profile["description"] # Business description
profile["employees"]   # Employee count
profile["website"]     # Company website
profile["isin"]        # ISIN code
profile["cusip"]       # CUSIP code
```

## Financial Statements

### All Statements

```python
from arc.integrations import PeriodType, StatementType

# Get all financial statements
financials = await client.get_financials(
    identifier="AAPL",
    identifier_type="ticker",
    period_type=PeriodType.QUARTERLY,  # or ANNUAL
    num_periods=4,
    statement_type=StatementType.ALL   # ALL, INCOME, BALANCE_SHEET, CASH_FLOW
)
```

### Income Statement Only

```python
income = await client.get_income_statement("AAPL", num_periods=8)

# Available fields (mapped to ARC schema)
income[0]["revenue"]           # Total revenue
income[0]["cost_of_revenue"]   # Cost of revenue
income[0]["gross_profit"]      # Gross profit
income[0]["operating_income"]  # Operating income
income[0]["ebitda"]            # EBITDA
income[0]["ebit"]              # EBIT
income[0]["net_income"]        # Net income
income[0]["eps_basic"]         # Basic EPS
income[0]["eps_diluted"]       # Diluted EPS
income[0]["operating_expenses"]# Operating expenses
income[0]["interest_expense"]  # Interest expense
income[0]["income_tax_expense"]# Income tax expense
```

### Balance Sheet Only

```python
balance = await client.get_balance_sheet("AAPL", num_periods=4)

# Available fields
balance[0]["total_assets"]        # Total assets
balance[0]["current_assets"]      # Current assets
balance[0]["cash_and_equivalents"]# Cash and equivalents
balance[0]["accounts_receivable"] # Accounts receivable
balance[0]["inventory"]           # Inventory
balance[0]["total_liabilities"]   # Total liabilities
balance[0]["current_liabilities"] # Current liabilities
balance[0]["short_term_debt"]     # Short-term debt
balance[0]["long_term_debt"]      # Long-term debt
balance[0]["total_debt"]          # Total debt
balance[0]["total_equity"]        # Total equity
balance[0]["shares_outstanding"]  # Shares outstanding
```

### Cash Flow Only

```python
cash_flow = await client.get_cash_flow("AAPL", num_periods=4)

# Available fields
cash_flow[0]["operating_cash_flow"]   # Operating cash flow
cash_flow[0]["capital_expenditures"]  # Capital expenditures
cash_flow[0]["free_cash_flow"]        # Free cash flow
cash_flow[0]["dividends_paid"]        # Dividends paid
cash_flow[0]["depreciation_amortization"]  # D&A
cash_flow[0]["stock_based_compensation"]   # Stock comp
cash_flow[0]["change_in_working_capital"]  # Working capital change
cash_flow[0]["investing_cash_flow"]   # Investing cash flow
cash_flow[0]["financing_cash_flow"]   # Financing cash flow
```

## Bulk Operations

For efficient multi-company data retrieval.

### Bulk Profiles

```python
# Get multiple company profiles in one request
profiles = await client.get_bulk_profiles(
    identifiers=["AAPL", "MSFT", "GOOGL"],
    identifier_type="ticker",
    use_cache=True
)

for ticker, profile in profiles.items():
    print(f"{ticker}: {profile['name']} - {profile['sector']}")
```

### Bulk Financials

```python
# Get financials for multiple companies
financials = await client.get_bulk_financials(
    identifiers=["AAPL", "MSFT", "GOOGL"],
    period_type=PeriodType.QUARTERLY,
    num_periods=4,
    statement_type=StatementType.ALL
)

for ticker, periods in financials.items():
    latest = periods[0]
    print(f"{ticker}: Revenue ${latest['revenue']:,.0f}")
```

## Identifier Lookup

Search for companies by name or ticker.

```python
results = await client.lookup_identifier(
    query="Apple",
    limit=10
)

for company in results:
    print(f"{company['ticker']} - {company['name']} ({company['exchange']})")
```

## Field Mappings

Capital IQ fields are automatically mapped to ARC schema:

### Income Statement Mapping
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

### Balance Sheet Mapping
| Capital IQ Field | ARC Field |
|-----------------|-----------|
| IQ_TOTAL_ASSETS | total_assets |
| IQ_TOTAL_CURR_ASSETS | current_assets |
| IQ_CASH_ST_INVEST | cash_and_equivalents |
| IQ_TOTAL_LIAB | total_liabilities |
| IQ_TOTAL_DEBT | total_debt |
| IQ_TOTAL_EQUITY | total_equity |

### Cash Flow Mapping
| Capital IQ Field | ARC Field |
|-----------------|-----------|
| IQ_CFO | operating_cash_flow |
| IQ_CAPEX | capital_expenditures |
| IQ_FCF | free_cash_flow |
| IQ_DIV_PAID | dividends_paid |

## Configuration

```python
from arc.integrations import CapitalIQClient

client = CapitalIQClient(
    api_key="your_key",
    api_secret="your_secret",
    base_url="https://api-ciq.spglobal.com",  # Default
    timeout=30.0,          # Request timeout (seconds)
    max_retries=3,         # Max retry attempts
    base_delay=1.0,        # Base delay for exponential backoff
)
```

## Caching

Company profiles are cached with 24-hour TTL:

```python
# Uses cache (default)
profile = await client.get_company_profile("AAPL", use_cache=True)

# Bypass cache
profile = await client.get_company_profile("AAPL", use_cache=False)

# Clear all cached profiles
client.clear_cache()

# Get cache statistics
stats = client.get_cache_stats()
print(f"Valid entries: {stats['valid_entries']}")
print(f"Expired entries: {stats['expired_entries']}")
```

## Error Handling

```python
from arc.core.exceptions import (
    AuthenticationError,
    IntegrationError,
    RateLimitError,
)

try:
    profile = await client.get_company_profile("AAPL")
except AuthenticationError as e:
    print(f"Invalid credentials: {e}")
except RateLimitError as e:
    print(f"Rate limited - try again later: {e}")
except IntegrationError as e:
    print(f"API error: {e}")
```

## Retry Behavior

The client automatically retries on:

- HTTP 429 (Rate Limited) - Exponential backoff
- Timeout exceptions - Exponential backoff
- Request errors - Exponential backoff

Retry configuration:
- `max_retries`: Maximum retry attempts (default: 3)
- `base_delay`: Base delay in seconds for exponential backoff (default: 1.0)

Delay formula: `base_delay * (2 ** attempt)`

## Context Manager

For proper resource cleanup:

```python
async with CapitalIQClient(api_key="key", api_secret="secret") as client:
    profile = await client.get_company_profile("AAPL")
    # HTTP client automatically closed on exit
```

Or manual cleanup:

```python
client = CapitalIQClient(api_key="key", api_secret="secret")
try:
    profile = await client.get_company_profile("AAPL")
finally:
    await client.close()
```

## Environment Variables

The client can use environment variables (when not passed directly):

```bash
export CAPITALIQ_API_KEY="your_api_key"
export CAPITALIQ_API_SECRET="your_api_secret"
```

Then initialize without credentials:

```python
client = CapitalIQClient()  # Uses env vars
```

## Period and Statement Types

### PeriodType Enum

```python
from arc.integrations import PeriodType

PeriodType.QUARTERLY  # Quarterly data (FQ)
PeriodType.ANNUAL     # Annual data (FY)
```

### StatementType Enum

```python
from arc.integrations import StatementType

StatementType.ALL           # All three statements
StatementType.INCOME        # Income statement only
StatementType.BALANCE_SHEET # Balance sheet only
StatementType.CASH_FLOW     # Cash flow statement only
```

## Related Documentation

- [EODHD Client](08-eodhd-client.md) - Market data and prices
- [Sync Workflows](09-sync-workflows.md) - Data synchronization workflows
- [Analytics Service](10-analytics-workflows.md) - Financial analytics
