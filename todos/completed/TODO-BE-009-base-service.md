# TODO-BE-009: Base Service and Registry

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: TODO-BE-002

---

## Objective

Implement the base service class and service registry pattern that provides dependency injection and tenant context management.

---

## Tasks

### 1. Base Service Class
- [ ] Create `src/arc/services/base.py`
- [ ] Implement `BaseService`:
  ```python
  class BaseService(ABC):
      def __init__(self, db: DataFlow, tenant_id: Optional[str] = None):
          self.db = db
          self.tenant_id = tenant_id
          self.runtime = AsyncLocalRuntime()
          self.logger = logging.getLogger(self.__class__.__name__)

      async def execute_workflow(self, workflow, inputs: dict = None):
          """Execute workflow with tenant context."""

      def with_tenant(self, tenant_id: str) -> "BaseService":
          """Create service copy with tenant context."""
  ```
- [ ] Add workflow execution helper with tenant context injection
- [ ] Add logging for all service operations
- [ ] Add error handling wrapper

### 2. Service Registry Pattern
- [ ] Create `src/arc/services/__init__.py`
- [ ] Implement `ServiceRegistry`:
  ```python
  class ServiceRegistry:
      def __init__(self, db: DataFlow, tenant_id: Optional[str] = None):
          self.db = db
          self.tenant_id = tenant_id
          # Lazy-loaded service instances
          self._portfolio = None
          self._analytics = None
          self._intelligence = None
          self._integration = None
          self._user = None

      def with_tenant(self, tenant_id: str) -> "ServiceRegistry":
          """Create registry copy with tenant context."""

      @property
      def portfolio(self) -> PortfolioService:
          """Get portfolio service instance."""

      @property
      def analytics(self) -> AnalyticsService:
          """Get analytics service instance."""
  ```
- [ ] Implement lazy loading for all services
- [ ] Add `create_services()` convenience function

### 3. Service Exports
- [ ] Export `ServiceRegistry`
- [ ] Export `create_services`
- [ ] Export all service classes
- [ ] Create `__all__` list

### 4. Service Base Tests
- [ ] Create `tests/unit/services/test_base.py`
- [ ] Test tenant context propagation
- [ ] Test workflow execution with tenant injection
- [ ] Test service registry lazy loading

---

## Acceptance Criteria

- [ ] BaseService provides common functionality
- [ ] Tenant context flows through all operations
- [ ] ServiceRegistry provides single access point
- [ ] Lazy loading prevents unnecessary initialization
- [ ] Proper logging for debugging
- [ ] Unit test: BaseService tenant context
- [ ] Unit test: ServiceRegistry property access
- [ ] Unit test: with_tenant creates new registry

---

## Usage Example

```python
from arc.services import create_services
from arc.models.database import db

# Create service registry
services = create_services(db)

# Set tenant context
tenant_services = services.with_tenant("tenant-123")

# Use services
portfolio = await tenant_services.portfolio.create_portfolio(
    name="Growth Portfolio",
    code="GP",
    manager_id="user-456"
)

ratios = await tenant_services.analytics.get_security_ratios("AAPL")
```

---

## Technical Notes

- All services should inherit from BaseService
- Tenant context is passed to DataFlow operations automatically
- AsyncLocalRuntime is the default for Docker deployment
- Logger is named after service class for easy filtering
