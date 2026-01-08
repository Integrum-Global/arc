# Analytics Service

## Overview

The AnalyticsService provides comprehensive financial analytics functionality including:

- Financial ratio calculations (liquidity, profitability, efficiency, leverage, valuation, growth)
- Threshold-based alerting with configurable rules
- Alert management (acknowledge, dismiss, resolve)
- Peer group management and benchmarking
- Trend analysis and period comparisons

## Architecture

```
src/arc/services/
├── base.py                # BaseService, errors, decorators
├── analytics_service.py   # AnalyticsService implementation
└── registry.py           # ServiceRegistry for dependency injection
```

The service uses:
- **DataFlow Express API**: For simple CRUD operations (fast, efficient)
- **Self-contained logic**: For complex operations like benchmarking and trend analysis

## Usage

### Basic Setup

```python
from arc.services import AnalyticsService, create_services
from arc.models.database import db

# Option 1: Direct instantiation
service = AnalyticsService(
    db=db,
    tenant_id="tenant-123",
    user_id="user-456"
)

# Option 2: Via service registry
services = create_services(db).with_context(
    tenant_id="tenant-123",
    user_id="user-456"
)
analytics_service = services.analytics
```

## Ratio Calculations

### Supported Ratios

The service supports 30+ financial ratios organized by class:

| Class | Ratios |
|-------|--------|
| **Liquidity** | current_ratio, quick_ratio, cash_ratio, working_capital_ratio |
| **Profitability** | gross_margin, operating_margin, net_margin, return_on_equity, return_on_assets, return_on_invested_capital |
| **Efficiency** | asset_turnover, inventory_turnover, receivables_turnover, payables_turnover, working_capital_turnover |
| **Leverage** | debt_to_equity, debt_to_assets, interest_coverage, debt_to_ebitda, equity_multiplier |
| **Valuation** | price_to_earnings, price_to_book, price_to_sales, price_to_cash_flow, ev_to_ebitda, dividend_yield |
| **Growth** | revenue_growth, earnings_growth, book_value_growth, dividend_growth |

### Calculate Ratios

```python
# Calculate ratios for specific securities
result = await service.calculate_ratios(
    security_ids=["sec-AAPL", "sec-MSFT"],
    ratio_names=["current_ratio", "gross_margin"],
    force_recalculate=False,
)
# Returns: {
#     "securities_processed": 2,
#     "ratios_calculated": 4,
#     "errors": 0,
#     "calculation_date": "2024-01-15"
# }

# Calculate all ratios for all active securities
result = await service.calculate_ratios()
```

### Get Security Ratios

```python
# Get all ratios for a security organized by class
ratios = await service.get_security_ratios("sec-AAPL")
# Returns: {
#     "security_id": "sec-AAPL",
#     "calculation_date": "2024-01-15",
#     "liquidity": {
#         "current_ratio": {"value": "2.0", "peer_percentile": 75},
#     },
#     "profitability": {...},
#     "efficiency": {...},
#     "leverage": {...},
#     "valuation": {...},
#     "growth": {...}
# }

# Get ratios as of a specific date
ratios = await service.get_security_ratios("sec-AAPL", as_of_date="2024-01-01")
```

### Get Ratio History

```python
# Get historical values for a specific ratio
history = await service.get_ratio_history(
    security_id="sec-AAPL",
    ratio_name="current_ratio",
    start_date="2023-01-01",
    end_date="2024-01-01",
    limit=100,
)
# Returns: [{"calculation_date": "2024-01-01", "ratio_value": "2.0"}, ...]
```

## Threshold Alerting

### Configure Thresholds

```python
# Create a threshold for current ratio
threshold = await service.configure_threshold(
    ratio_class="liquidity",
    ratio_name="current_ratio",
    warning_threshold="1.5",
    critical_threshold="1.0",
    comparison="lt",  # Alert when ratio is LESS THAN threshold
    security_id="sec-AAPL",  # Optional: specific security
    portfolio_id="port-001",  # Optional: specific portfolio
    cooldown_hours=24,  # Don't re-alert for 24 hours
    alert_on_improvement=False,
)
```

### Comparison Operators

| Operator | Meaning |
|----------|---------|
| `lt` | Less than |
| `gt` | Greater than |
| `eq` | Equal to |
| `lte` | Less than or equal |
| `gte` | Greater than or equal |

### Get Thresholds

```python
# Get all user's thresholds
thresholds = await service.get_thresholds()

# Get thresholds for specific ratio
thresholds = await service.get_thresholds(
    ratio_name="current_ratio",
    enabled_only=True,
)
```

### Delete Threshold

```python
success = await service.delete_threshold("thresh-001")
```

### Check Thresholds

```python
# Run threshold checks and generate alerts
result = await service.check_thresholds()
# Returns: {
#     "thresholds_checked": 10,
#     "alerts_generated": 2,
#     "checked_at": "2024-01-15T10:00:00+00:00"
# }
```

## Alert Management

### Get Alerts

```python
# Get all active alerts
alerts = await service.get_user_alerts(status="active")

# Get alerts with filters
alerts = await service.get_user_alerts(
    status="active",
    alert_type="threshold",
    severity="critical",
    limit=50,
)
```

### Acknowledge Alert

```python
alert = await service.acknowledge_alert("alert-001")
# Sets status to "acknowledged", records acknowledged_at timestamp
```

### Dismiss Alert

```python
alert = await service.dismiss_alert(
    "alert-001",
    reason="False positive - data error",
)
# Sets status to "dismissed", records reason
```

### Resolve Alert

```python
alert = await service.resolve_alert(
    "alert-001",
    resolution_notes="Ratio improved after capital injection",
)
# Sets status to "resolved", records notes
```

## Peer Groups

### Create Peer Group

```python
peer_group = await service.create_peer_group(
    name="Tech Giants",
    security_ids=["sec-AAPL", "sec-MSFT", "sec-GOOGL", "sec-AMZN"],
    description="Large cap technology companies",
    group_type="sector",  # custom, sector, industry
    criteria={"market_cap": ">500B"},  # For auto-refresh
)
```

### Get Peer Groups

```python
# Get user's groups plus system groups
groups = await service.get_peer_groups(include_system=True)

# Get only custom groups
groups = await service.get_peer_groups(
    include_system=False,
    group_type="custom",
)
```

### Update Peer Group

```python
updated = await service.update_peer_group(
    "peer-001",
    {
        "name": "Updated Name",
        "security_ids": ["sec-AAPL", "sec-MSFT"],  # Updates member_count
    }
)
```

### Delete Peer Group

```python
success = await service.delete_peer_group("peer-001")
# Note: Cannot delete system peer groups
```

### Benchmark Against Peers

```python
comparison = await service.benchmark_against_peers(
    security_id="sec-AAPL",
    peer_group_id="peer-001",
    ratio_names=["current_ratio", "gross_margin"],
)
# Returns: {
#     "security_id": "sec-AAPL",
#     "peer_group_id": "peer-001",
#     "peer_group_name": "Tech Giants",
#     "comparison_date": "2024-01-15",
#     "comparisons": {
#         "current_ratio": {
#             "security_value": 2.0,
#             "peer_average": 1.8,
#             "peer_median": 1.75,
#             "peer_min": 1.2,
#             "peer_max": 2.5,
#             "percentile": 75.0,
#             "rank": 2,
#             "peer_count": 4
#         }
#     }
# }
```

## Trend Analysis

### Get Ratio Trend

```python
trend = await service.get_ratio_trend(
    security_id="sec-AAPL",
    ratio_name="current_ratio",
    periods=4,
)
# Returns: {
#     "security_id": "sec-AAPL",
#     "ratio_name": "current_ratio",
#     "trend_direction": "improving",  # improving, declining, stable, unknown
#     "trend_magnitude": "15.5",  # percent change
#     "first_value": "1.8",
#     "last_value": "2.0",
#     "first_date": "2023-01-15",
#     "last_date": "2024-01-15",
#     "data_points": 4
# }
```

### Trend Directions

| Direction | Criteria |
|-----------|----------|
| `improving` | Change > +5% |
| `declining` | Change < -5% |
| `stable` | Change between -5% and +5% |
| `unknown` | Insufficient data |

### Compare Periods

```python
comparison = await service.compare_periods(
    security_id="sec-AAPL",
    ratio_name="current_ratio",
    current_date="2024-01-15",
    comparison_date="2023-01-15",
)
# Returns: {
#     "security_id": "sec-AAPL",
#     "ratio_name": "current_ratio",
#     "current_value": "2.0",
#     "current_date": "2024-01-15",
#     "comparison_value": "1.8",
#     "comparison_date": "2023-01-15",
#     "absolute_change": "0.2",
#     "percent_change": "11.11"
# }
```

## API Reference

### Ratio Operations

| Method | Description |
|--------|-------------|
| `calculate_ratios()` | Calculate ratios for securities |
| `get_security_ratios(security_id)` | Get all ratios for a security |
| `get_ratio_history(security_id, ratio_name)` | Get historical ratio values |

### Threshold Operations

| Method | Description |
|--------|-------------|
| `configure_threshold()` | Create or update threshold |
| `get_thresholds()` | Get user's thresholds |
| `delete_threshold(threshold_id)` | Delete a threshold |
| `check_thresholds()` | Check thresholds and generate alerts |

### Alert Operations

| Method | Description |
|--------|-------------|
| `get_user_alerts()` | Get user's alerts |
| `acknowledge_alert(alert_id)` | Mark alert as acknowledged |
| `dismiss_alert(alert_id, reason)` | Dismiss an alert |
| `resolve_alert(alert_id, notes)` | Mark alert as resolved |

### Peer Group Operations

| Method | Description |
|--------|-------------|
| `create_peer_group()` | Create a peer group |
| `get_peer_groups()` | Get user's and system groups |
| `update_peer_group(peer_group_id, updates)` | Update a peer group |
| `delete_peer_group(peer_group_id)` | Delete a peer group |
| `benchmark_against_peers()` | Compare security to peers |

### Trend Operations

| Method | Description |
|--------|-------------|
| `get_ratio_trend(security_id, ratio_name)` | Analyze ratio trend |
| `compare_periods()` | Compare ratios between periods |

## Error Handling

```python
from arc.services import (
    NotFoundError,
    ValidationError,
    ConflictError,
    ServiceError,
)

try:
    ratios = await service.get_security_ratios("sec-NOTFOUND")
except NotFoundError as e:
    print(f"Not found: {e.message}")

try:
    await service.configure_threshold(
        ratio_class="liquidity",
        ratio_name="invalid_ratio",  # Not a valid ratio
        warning_threshold="1.5",
        critical_threshold="1.0",
    )
except ValidationError as e:
    print(f"Validation error: {e.message}")

try:
    await service.create_peer_group(
        name="Existing Group",  # Already exists
        security_ids=["sec-AAPL"],
    )
except ConflictError as e:
    print(f"Conflict: {e.message}")
```

## Testing

```bash
# Run analytics service tests
uv run pytest tests/unit/services/test_analytics_service.py -v

# Run with coverage
uv run pytest tests/unit/services/test_analytics_service.py --cov=arc.services.analytics_service
```

## Module Exports

```python
from arc.services import (
    # Service
    AnalyticsService,

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
