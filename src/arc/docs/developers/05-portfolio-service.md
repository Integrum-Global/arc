# Portfolio Service

## Overview

The PortfolioService provides comprehensive portfolio management functionality including:

- Portfolio CRUD with code uniqueness checking
- Holdings management with tax lot tracking
- Transaction recording with automatic holding updates
- NAV (Net Asset Value) calculation and history
- Health scan for compliance monitoring
- Allocation analytics

## Architecture

```
src/arc/services/
├── base.py               # BaseService, errors, decorators
├── portfolio_service.py  # PortfolioService implementation
└── registry.py          # ServiceRegistry for dependency injection
```

The service uses:
- **DataFlow Express API**: For simple CRUD operations (fast, efficient)
- **Self-contained logic**: For complex operations like NAV calculation

## Usage

### Basic Setup

```python
from arc.services import PortfolioService, create_services
from arc.models.database import db

# Option 1: Direct instantiation
service = PortfolioService(
    db=db,
    tenant_id="tenant-123",
    user_id="user-456"
)

# Option 2: Via service registry
services = create_services(db).with_context(
    tenant_id="tenant-123",
    user_id="user-456"
)
portfolio_service = services.portfolio
```

### Portfolio CRUD

```python
# Create portfolio
portfolio = await service.create_portfolio(
    name="Growth Portfolio",
    code="GROWTH",
    inception_date="2024-01-01",
    description="Long-term growth strategy",
    portfolio_type="managed",
    strategy="growth",
    risk_profile="moderate",
)

# Get portfolio
portfolio = await service.get_portfolio("port-001")

# List portfolios
portfolios = await service.list_portfolios(
    manager_id="user-456",
    portfolio_type="managed",
    active_only=True,
    limit=50,
)

# Update portfolio
updated = await service.update_portfolio(
    "port-001",
    {"name": "Updated Portfolio Name"}
)

# Delete portfolio (soft delete)
success = await service.delete_portfolio("port-001")
```

### Holdings Management

```python
# Add holding to portfolio
holding = await service.add_holding(
    portfolio_id="port-001",
    security_id="sec-AAPL",
    quantity="100",
    cost_basis="150.00",
    acquisition_date="2024-01-15",
)

# Get holdings
holdings = await service.get_holdings(
    portfolio_id="port-001",
    include_closed=False,
)

# Update holding
updated = await service.update_holding(
    "hold-001",
    {"quantity": "200", "cost_basis": "155.00"}
)

# Close holding
closed = await service.close_holding("hold-001")
```

### Transaction Recording

```python
# Record buy transaction (auto-updates holdings)
transaction = await service.record_transaction(
    portfolio_id="port-001",
    security_id="sec-AAPL",
    transaction_type="buy",
    transaction_date="2024-01-15",
    settlement_date="2024-01-17",
    quantity="100",
    price="150.00",
    commission="10.00",
    fees="5.00",
)

# Record sell transaction (auto-updates holdings)
transaction = await service.record_transaction(
    portfolio_id="port-001",
    security_id="sec-AAPL",
    transaction_type="sell",
    transaction_date="2024-01-20",
    settlement_date="2024-01-22",
    quantity="-50",  # Negative for sells
    price="175.00",
)

# Get transactions
transactions = await service.get_transactions(
    portfolio_id="port-001",
    start_date="2024-01-01",
    end_date="2024-12-31",
    transaction_type="buy",
)
```

### NAV Operations

```python
# Calculate NAV
nav_result = await service.calculate_nav(
    portfolio_id="port-001",
    valuation_date="2024-01-15",  # Optional, defaults to today
)
# Returns: {
#     "portfolio_id": "port-001",
#     "total_value": "100000.00",
#     "securities_value": "95000.00",
#     "cash_value": "5000.00",
#     "holding_count": 15
# }

# Get NAV history
history = await service.get_nav_history(
    portfolio_id="port-001",
    start_date="2024-01-01",
    limit=30,
)
```

### Health Scan

```python
# Run compliance health scan
health = await service.run_health_scan("port-001")
# Returns: {
#     "portfolio_id": "port-001",
#     "score": 85,
#     "issues": [
#         {"type": "concentration", "severity": "warning", "message": "..."},
#         {"type": "diversification", "severity": "info", "message": "..."}
#     ],
#     "metrics": {
#         "total_value": "100000",
#         "position_count": 15,
#         "cash_percentage": "0.05"
#     }
# }
```

### Allocation Analytics

```python
# Get sector allocation
sectors = await service.get_sector_allocation("port-001")
# Returns: [{"sector": "Technology", "value": "30000", "weight": "0.30"}]

# Get asset class allocation
assets = await service.get_asset_allocation("port-001")
# Returns: [{"asset_class": "Equity", "value": "95000", "weight": "0.95"}]

# Get top holdings
top = await service.get_top_holdings("port-001", limit=10)
```

## API Reference

### Portfolio Operations

| Method | Description |
|--------|-------------|
| `create_portfolio()` | Create new portfolio with validation |
| `get_portfolio(id)` | Get portfolio by ID |
| `list_portfolios()` | List portfolios with filters |
| `update_portfolio(id, updates)` | Update mutable fields |
| `delete_portfolio(id)` | Soft-delete portfolio |

### Holdings Operations

| Method | Description |
|--------|-------------|
| `get_holdings(portfolio_id)` | Get all holdings |
| `add_holding()` | Add or update position |
| `update_holding(id, updates)` | Update holding fields |
| `close_holding(id)` | Close position |

### Transaction Operations

| Method | Description |
|--------|-------------|
| `record_transaction()` | Record transaction with auto holding update |
| `get_transactions()` | Get transactions with filters |

### NAV Operations

| Method | Description |
|--------|-------------|
| `calculate_nav(portfolio_id)` | Calculate and store NAV |
| `get_nav_history(portfolio_id)` | Get historical NAV values |

### Analytics Operations

| Method | Description |
|--------|-------------|
| `run_health_scan(portfolio_id)` | Run compliance scan |
| `get_sector_allocation(portfolio_id)` | Get sector breakdown |
| `get_asset_allocation(portfolio_id)` | Get asset class breakdown |
| `get_top_holdings(portfolio_id)` | Get top N holdings |

## Error Handling

```python
from arc.services import (
    NotFoundError,
    ValidationError,
    ConflictError,
    ServiceError,
)

try:
    portfolio = await service.get_portfolio("nonexistent")
except NotFoundError as e:
    print(f"Not found: {e.message}")

try:
    await service.create_portfolio(name="Test", code="EXISTING", ...)
except ConflictError as e:
    print(f"Conflict: {e.message}")

try:
    await service.update_portfolio("port-001", {"code": "NEW"})
except ValidationError as e:
    print(f"Validation error: {e.message}")
```

## Health Scan Checks

The health scan monitors:

1. **Concentration Risk**: Single holdings exceeding 10% weight
2. **Diversification**: Position count within limits (10-50)
3. **Cash Levels**: Cash percentage within 2-10%
4. **Sector Limits**: Sector weights within constraints

## Testing

```bash
# Run portfolio service tests
uv run pytest tests/unit/services/test_portfolio_service.py -v

# Run with coverage
uv run pytest tests/unit/services/test_portfolio_service.py --cov=arc.services
```

## Module Exports

```python
from arc.services import (
    # Service
    PortfolioService,

    # Registry
    ServiceRegistry,
    create_services,

    # Base
    BaseService,
    service_operation,

    # Errors
    ServiceError,
    NotFoundError,
    ValidationError,
    ConflictError,
)
```
