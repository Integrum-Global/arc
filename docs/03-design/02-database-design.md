# Database Design (DataFlow)

> [!IMPORTANT]
> **DataFlow Specialist Directive**: We strictly follow DataFlow patterns. No manual timestamp management.

## Configuration
- **Database**: PostgreSQL (Production), SQLite (Dev/Test)
- **Framework**: Kailash DataFlow
- **Pattern**: Zero-config model-to-node generation.

## Core Models
Models are defined in `src/models/`.

```python
from dataflow import DataFlow

db = DataFlow("postgresql://...")

@db.model
class User:
    id: str         # STRICT: Must be 'id', not 'user_id'
    email: str
    full_name: str
    role: str       # 'investor', 'admin'
    # created_at: auto-managed
    # updated_at: auto-managed

@db.model
class Portfolio:
    id: str
    user_id: str    # Foreign key reference
    name: str
    strategy: str
```

## Directives
1.  **Node Generation**: We rely on auto-generated nodes (`UserCreateNode`, `UserListNode`, etc.).
2.  **Timestamps**: NEVER manually set `created_at` or `updated_at`.
3.  **Performance**: Use `db.express` for high-frequency read endpoints (e.g., mobile app portfolio refresh).
4.  **Migrations**: Use `auto_migrate=True` for Docker convenience, or manual `create_tables_async()` in lifespan for strict control.
