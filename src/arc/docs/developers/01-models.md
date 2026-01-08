# DataFlow Models

ARC uses Kailash DataFlow for database operations. Models are defined with the `@db.model` decorator and automatically generate 11 CRUD workflow nodes per model.

## Model Categories

### Core Models (`arc.models.core`)

| Model | Description | Multi-Tenant | Features |
|-------|-------------|--------------|----------|
| `Tenant` | Organization root | `tenant_root=True` | audit_log, soft_delete |
| `User` | User accounts | `multi_tenant=True` | audit_log, soft_delete |
| `UserPreference` | User settings (1:1) | `multi_tenant=True` | - |
| `NotificationPreference` | Alert channels | `multi_tenant=True` | audit_log |
| `AuditLog` | Change tracking | `multi_tenant=True` | - |

### Portfolio Models (`arc.models.portfolio`)

| Model | Description | Multi-Tenant | Features |
|-------|-------------|--------------|----------|
| `Portfolio` | Investment containers | `multi_tenant=True` | audit_log, soft_delete |
| `Holding` | Portfolio positions | `multi_tenant=True` | versioned, audit_log |
| `Transaction` | Buy/sell records | `multi_tenant=True` | audit_log (immutable) |
| `PortfolioValuation` | Daily NAV/returns | `multi_tenant=True` | audit_log |
| `CashAccount` | Cash balances | `multi_tenant=True` | versioned, audit_log |
| `Benchmark` | Performance indices | `multi_tenant=False` | audit_log, soft_delete |

### Security Models (`arc.models.security`)

| Model | Description | Multi-Tenant | Features |
|-------|-------------|--------------|----------|
| `Security` | Master instrument data | `multi_tenant=False` | audit_log, soft_delete |
| `PriceHistory` | OHLCV price data | `multi_tenant=False` | - |
| `CompanyFundamentals` | Financial statements | `multi_tenant=False` | audit_log |
| `SecurityRatio` | Calculated ratios | `multi_tenant=False` | - |
| `CorporateAction` | Splits, dividends | `multi_tenant=False` | audit_log |
| `Dividend` | Dividend history | `multi_tenant=False` | - |

### Analytics Models (`arc.models.analytics`)

| Model | Description | Multi-Tenant | Features |
|-------|-------------|--------------|----------|
| `Alert` | User notifications | `multi_tenant=True` | audit_log |
| `AlertThreshold` | User thresholds | `multi_tenant=True` | audit_log |
| `PeerGroup` | Security groupings | `multi_tenant=True` | audit_log |
| `Report` | Generated reports | `multi_tenant=True` | audit_log |
| `Watchlist` | Named watchlists | `multi_tenant=True` | - |
| `WatchlistItem` | Watched securities | `multi_tenant=True` | - |

## Usage

### Importing Models

```python
from arc.models import (
    # Core
    Tenant, User, UserPreference, AuditLog,
    # Portfolio
    Portfolio, Holding, Transaction,
    # Security
    Security, PriceHistory, CompanyFundamentals,
    # Analytics
    Alert, AlertThreshold, PeerGroup, Report,
)
```

### Database Initialization

```python
from arc.models import db, database_lifespan
from fastapi import FastAPI

# For FastAPI/Docker (async context)
app = FastAPI(lifespan=database_lifespan)

# For scripts (sync context)
from arc.models import create_tables, close_database
await create_tables()
# ... operations ...
await close_database()
```

## Critical Rules

1. **Never manually set `created_at` or `updated_at`** - DataFlow manages these automatically
2. **Primary key must be named `id`** - Not `user_id`, `portfolio_id`, etc.
3. **CreateNode uses flat fields, UpdateNode uses nested `filter` + `fields`**
4. **`soft_delete` only affects DeleteNode** - Manually filter `deleted_at` in ListNode queries
5. **Use string decimals for monetary values** - Preserves precision (e.g., `"150.25"`)

## Generated Nodes

Each model generates 11 workflow nodes:

| Node | Description |
|------|-------------|
| `{Model}CreateNode` | Create single record |
| `{Model}ReadNode` | Read by ID |
| `{Model}UpdateNode` | Update record |
| `{Model}DeleteNode` | Delete record |
| `{Model}ListNode` | List with filters |
| `{Model}UpsertNode` | Insert or update |
| `{Model}CountNode` | Count records |
| `{Model}BulkCreateNode` | Bulk insert |
| `{Model}BulkUpdateNode` | Bulk update |
| `{Model}BulkDeleteNode` | Bulk delete |
| `{Model}BulkUpsertNode` | Bulk upsert |

## Multi-Tenancy

- Models with `multi_tenant=True` automatically get a `tenant_id` field
- All queries are automatically scoped to the current tenant context
- `Tenant` model uses `tenant_root=True` to define the tenant boundary
- Shared data (securities, benchmarks) uses `multi_tenant=False`

## Indexes

All models define appropriate indexes via `__indexes__`. Examples:

```python
__indexes__ = [
    {"fields": ["email"], "unique": True},        # Unique index
    {"fields": ["status", "created_at"]},         # Composite index
    {"fields": ["user_id", "security_id"], "unique": True},  # Unique composite
]
```
