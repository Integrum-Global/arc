# TODO-BE-005: Analytics Domain Models

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: TODO-BE-003, TODO-BE-004

---

## Objective

Implement DataFlow models for analytics features including alerts, thresholds, peer groups, and benchmarks.

---

## Tasks

### 1. Alert Model
- [ ] Create `src/arc/models/analytics.py`
- [ ] Implement `Alert` model:
  - `id: str` - UUID
  - `user_id: str` - FK to User (recipient)
  - `portfolio_id: Optional[str]` - Related portfolio
  - `security_id: Optional[str]` - Related security
  - `alert_type: str` - threshold, anomaly, news, earnings, compliance, system
  - `severity: str` - info, warning, critical
  - `title: str` - Short title
  - `message: str` - Full message
  - `explanation: Optional[str]` - AI-generated explanation
  - `trigger_value: Optional[str]` - Value that triggered
  - `threshold_value: Optional[str]` - Threshold breached
  - `ratio_name: Optional[str]` - For ratio alerts
  - `suggested_actions: List[str]` - Recommended actions
  - `action_url: Optional[str]` - Deep link
  - `triggered_at: str` - ISO datetime
  - `expires_at: Optional[str]` - Auto-dismiss after
  - `status: str` - active, acknowledged, dismissed, resolved
  - `acknowledged_at: Optional[str]`
  - `acknowledged_by: Optional[str]`
  - `dismissed_at: Optional[str]`
  - `delivery_status: dict` - {"email": "sent", "sms": "pending"}
  - `metadata: dict` - Additional context
- [ ] Configure `multi_tenant=True`, `audit_log=True`
- [ ] Add indexes: user_id+status, portfolio_id, security_id, alert_type+severity, triggered_at, status

### 2. AlertThreshold Model
- [ ] Implement `AlertThreshold` model:
  - `id: str` - UUID
  - `user_id: str` - FK to User
  - `portfolio_id: Optional[str]` - Portfolio-specific threshold
  - `ratio_class: str` - liquidity, profitability, etc.
  - `ratio_name: str` - current_ratio, roe, etc.
  - `warning_threshold: str` - Decimal string
  - `critical_threshold: str` - Decimal string
  - `comparison: str` - lt, gt, eq, lte, gte
  - `enabled: bool` - Default True
  - `alert_on_improvement: bool` - Default False
  - `cooldown_hours: int` - Default 24
  - `last_triggered_at: Optional[str]`
  - `last_triggered_value: Optional[str]`
- [ ] Configure `multi_tenant=True`
- [ ] Add indexes: user_id+ratio_name, portfolio_id, enabled

### 3. PeerGroup Model
- [ ] Implement `PeerGroup` model:
  - `id: str` - UUID or "sector_technology_large"
  - `user_id: Optional[str]` - None for system-defined
  - `name: str` - "Large Cap Technology"
  - `description: Optional[str]`
  - `group_type: str` - sector, industry, market_cap, custom
  - `criteria: dict`:
    - `sector: Optional[str]`
    - `industry: Optional[str]`
    - `market_cap_min: Optional[str]`
    - `market_cap_max: Optional[str]`
    - `country: Optional[str]`
    - `exchange: Optional[str]`
  - `security_ids: List[str]` - Explicit members
  - `exclude_security_ids: List[str]` - Excluded from auto
  - `auto_refresh: bool` - Default False
  - `last_refreshed_at: Optional[str]`
  - `member_count: int` - Default 0
  - `stats_date: Optional[str]`
- [ ] Configure `multi_tenant=True`
- [ ] Add indexes: user_id, group_type

### 4. Benchmark Model
- [ ] Implement `Benchmark` model:
  - `id: str` - "SPX", "NDX", "CUSTOM-001"
  - `name: str` - "S&P 500 Index"
  - `ticker: str` - "^GSPC"
  - `description: Optional[str]`
  - `benchmark_type: str` - index, etf, custom
  - `composition: dict` - {"SPY": 0.6, "QQQ": 0.4} for custom
  - `price_security_id: Optional[str]` - FK to Security
  - `return_1d: Optional[str]`
  - `return_mtd: Optional[str]`
  - `return_qtd: Optional[str]`
  - `return_ytd: Optional[str]`
  - `return_1y: Optional[str]`
- [ ] Configure `multi_tenant=False` (system-wide)
- [ ] Add unique constraint on ticker
- [ ] Add index on benchmark_type

### 5. Model Exports
- [ ] Update `src/arc/models/__init__.py`

---

## Acceptance Criteria

- [ ] All alert types supported
- [ ] Alert delivery status tracking
- [ ] Status workflow (active → acknowledged → resolved)
- [ ] User-configurable thresholds per ratio
- [ ] Cooldown period support for thresholds
- [ ] Peer group with auto-refresh capability
- [ ] System and custom benchmarks
- [ ] Unit test: Create threshold alert
- [ ] Unit test: Update alert status
- [ ] Unit test: Create peer group with criteria
- [ ] Unit test: Create custom benchmark
- [ ] Integration test: Alert threshold triggering
- [ ] Integration test: Peer group member query

---

## Notes

- Alerts are tenant-specific via user_id
- Benchmarks are shared across tenants
- Peer groups can be system-defined (user_id=None) or user-specific
- Threshold cooldown prevents alert spam
