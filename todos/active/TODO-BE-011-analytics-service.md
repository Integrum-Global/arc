# TODO-BE-011: Analytics Service

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-009, TODO-BE-007

---

## Objective

Implement the AnalyticsService that provides financial ratio calculations, threshold alerting, and peer benchmarking.

---

## Tasks

### 1. Ratio Calculations
- [ ] Create `src/arc/services/analytics_service.py`
- [ ] Implement `calculate_ratios()`:
  - Execute ratio calculation workflow
  - Support specific security IDs or all
  - Return summary stats
- [ ] Implement `get_security_ratios()`:
  - Get all ratios for a security
  - Organize by ratio class
  - Support as_of_date
- [ ] Implement `get_ratio_history()`:
  - Get historical values for a ratio
  - Support interval aggregation (daily, weekly, monthly, quarterly)
  - Filter by date range

### 2. Threshold Alerting
- [ ] Implement `configure_threshold()`:
  - Create/update threshold config
  - Support lower and upper thresholds
  - Configure alert channels
- [ ] Implement `get_thresholds()`:
  - List user's configured thresholds
  - Filter by ratio, portfolio
- [ ] Implement `delete_threshold()`:
  - Remove threshold config
- [ ] Implement `check_thresholds()`:
  - Execute threshold check workflow
  - Return generated alerts
- [ ] Implement `get_user_alerts()`:
  - List alerts for user
  - Filter by status
- [ ] Implement `acknowledge_alert()`:
  - Mark alert as acknowledged
- [ ] Implement `dismiss_alert()`:
  - Mark alert as dismissed
- [ ] Implement `resolve_alert()`:
  - Mark alert as resolved

### 3. Peer Benchmarking
- [ ] Implement `create_peer_group()`:
  - Create custom peer group
  - Support criteria-based definition
- [ ] Implement `get_peer_groups()`:
  - List user's peer groups
  - Include system-defined groups
- [ ] Implement `update_peer_group()`:
  - Modify peer group members
- [ ] Implement `delete_peer_group()`:
  - Remove user-created peer group
- [ ] Implement `benchmark_against_peers()`:
  - Execute peer benchmark workflow
  - Calculate percentiles and comparisons
- [ ] Implement `get_peer_comparison_report()`:
  - Generate comprehensive report
  - Compare all holdings against peers

### 4. Trend Analysis
- [ ] Implement `get_ratio_trend()`:
  - Calculate trend direction
  - Determine trend magnitude
- [ ] Implement `compare_periods()`:
  - Compare current vs historical
  - Calculate changes

---

## Acceptance Criteria

- [ ] All 25 ratios retrievable
- [ ] Ratio history with interval aggregation
- [ ] User-configurable thresholds
- [ ] Automatic alert generation
- [ ] Alert lifecycle management
- [ ] Peer group creation/management
- [ ] Percentile ranking within peers
- [ ] Unit test: Ratio retrieval
- [ ] Unit test: Threshold configuration
- [ ] Unit test: Alert acknowledgment
- [ ] Unit test: Peer group creation
- [ ] Integration test: Full threshold alerting
- [ ] Integration test: Peer benchmarking

---

## API Signatures

```python
class AnalyticsService(BaseService):
    # Ratios
    async def calculate_ratios(self, security_ids: List[str] = None, ...) -> dict
    async def get_security_ratios(self, security_id: str, ...) -> Optional[dict]
    async def get_ratio_history(self, security_id: str, ratio_name: str, ...) -> List[dict]

    # Thresholds
    async def configure_threshold(self, user_id: str, ratio_name: str, ...) -> dict
    async def check_thresholds(self, user_id: str = None) -> dict

    # Alerts
    async def get_user_alerts(self, user_id: str, status: str = None, ...) -> List[dict]
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> dict

    # Peer Groups
    async def create_peer_group(self, name: str, security_ids: List[str], ...) -> dict
    async def benchmark_against_peers(self, security_id: str, peer_group_id: str, ...) -> dict
    async def get_peer_comparison_report(self, portfolio_id: str, ...) -> dict
```

---

## Return Structures

```python
# get_security_ratios return
{
    "security_id": str,
    "calculation_date": str,
    "liquidity": {
        "current_ratio": float,
        "quick_ratio": float,
        ...
    },
    "profitability": {...},
    "leverage": {...},
    "utilization": {...},
    "valuation": {...}
}

# benchmark_against_peers return
{
    "security_id": str,
    "peer_group_id": str,
    "comparisons": {
        "ratio_name": {
            "security_value": float,
            "peer_average": float,
            "peer_median": float,
            "percentile": float,
            "rank": int,
            "peer_count": int
        }
    }
}
```
