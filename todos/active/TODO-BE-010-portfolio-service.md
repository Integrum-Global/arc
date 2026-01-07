# TODO-BE-010: Portfolio Service

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-009, TODO-BE-003

---

## Objective

Implement the PortfolioService that provides portfolio management, holdings operations, transactions, and NAV calculations.

---

## Tasks

### 1. Portfolio CRUD Operations
- [ ] Create `src/arc/services/portfolio_service.py`
- [ ] Implement `create_portfolio()`:
  - Check for duplicate code
  - Generate portfolio ID
  - Set default constraints
  - Create via DataFlow Express
- [ ] Implement `get_portfolio()`:
  - Read by ID
  - Exclude soft-deleted
- [ ] Implement `list_portfolios()`:
  - Filter by manager_id, portfolio_type
  - Active only option
  - Pagination (limit, offset)
- [ ] Implement `update_portfolio()`:
  - Prevent immutable field updates (id, code, inception_date)
- [ ] Implement `delete_portfolio()`:
  - Soft delete

### 2. Holdings Management
- [ ] Implement `get_holdings()`:
  - Filter by portfolio_id
  - Option to include closed positions
  - Enrich with security data
- [ ] Implement `add_holding()`:
  - Check if holding exists
  - Update existing (average cost basis)
  - Create new if not exists
  - Support tax lot tracking
- [ ] Implement `update_holding()`:
  - Update quantity, cost basis
  - Handle versioning conflicts
- [ ] Implement `close_holding()`:
  - Set quantity to 0
  - Mark as inactive

### 3. Transaction Recording
- [ ] Implement `record_transaction()`:
  - Support all transaction types (buy, sell, dividend, transfer)
  - Calculate gross/net amounts
  - Create transaction record
  - Automatically update holdings:
    - Buy: Add to holding
    - Sell: Reduce holding
    - Dividend: Record only
- [ ] Implement `get_transactions()`:
  - Filter by date range
  - Filter by transaction type
  - Filter by security

### 4. NAV Operations
- [ ] Implement `calculate_nav()`:
  - Execute NAV calculation workflow
  - Store valuation record
  - Return NAV summary
- [ ] Implement `get_nav_history()`:
  - Get historical valuations
  - Support date range
  - Calculate returns

### 5. Health Scan
- [ ] Implement `run_health_scan()`:
  - Execute health scan workflow
  - Return health scores and issues

### 6. Analytics
- [ ] Implement `get_sector_allocation()`:
  - Group holdings by sector
  - Calculate weights
- [ ] Implement `get_asset_allocation()`:
  - Group holdings by asset class
  - Calculate weights
- [ ] Implement `get_top_holdings()`:
  - Sort by market value
  - Return top N

---

## Acceptance Criteria

- [ ] Portfolio CRUD with code uniqueness
- [ ] Holdings with lot tracking
- [ ] Transaction recording with auto holding updates
- [ ] NAV calculation with history storage
- [ ] Health scan with scores
- [ ] Allocation analytics
- [ ] Multi-tenant isolation
- [ ] Unit test: Create portfolio with validation
- [ ] Unit test: Add holding to existing position
- [ ] Unit test: Record buy/sell transactions
- [ ] Unit test: NAV calculation logic
- [ ] Integration test: Full portfolio lifecycle
- [ ] Integration test: Holdings management

---

## API Signatures

```python
class PortfolioService(BaseService):
    # Portfolio CRUD
    async def create_portfolio(self, name: str, code: str, manager_id: str, ...) -> dict
    async def get_portfolio(self, portfolio_id: str) -> Optional[dict]
    async def list_portfolios(self, manager_id: str = None, ...) -> List[dict]
    async def update_portfolio(self, portfolio_id: str, updates: dict) -> dict
    async def delete_portfolio(self, portfolio_id: str) -> bool

    # Holdings
    async def get_holdings(self, portfolio_id: str, ...) -> List[dict]
    async def add_holding(self, portfolio_id: str, security_id: str, ...) -> dict
    async def record_transaction(self, portfolio_id: str, ...) -> dict

    # NAV
    async def calculate_nav(self, portfolio_id: str, ...) -> dict

    # Health
    async def run_health_scan(self, portfolio_id: str) -> dict

    # Analytics
    async def get_sector_allocation(self, portfolio_id: str) -> List[dict]
    async def get_asset_allocation(self, portfolio_id: str) -> List[dict]
    async def get_top_holdings(self, portfolio_id: str, limit: int = 10) -> List[dict]
```
