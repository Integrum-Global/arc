# TODO-MOB-009: Analytics Page

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-005, TODO-MOB-006

---

## Objective

Implement the analytics screen for viewing financial ratios, managing alerts, configuring thresholds, and peer benchmarking.

---

## Tasks

### 1. Analytics Screen
- [ ] Create `lib/features/analytics/presentation/screens/analytics_screen.dart`:
  - Tab bar: Ratios, Alerts, Thresholds, Benchmarking
  - Portfolio/security selector
  - Tab content areas

### 2. Ratios Tab
- [ ] Create `lib/features/analytics/presentation/widgets/tabs/ratios_tab.dart`:
  - Portfolio selector dropdown
  - Ratio cards grouped by category:
    - Liquidity (5 ratios)
    - Profitability (5 ratios)
    - Leverage (5 ratios)
    - Utilization (5 ratios)
    - Valuation (5 ratios)
  - Threshold status indicators
  - Tap for ratio detail

### 3. Ratio Card
- [ ] Create `lib/features/analytics/presentation/widgets/ratio_card.dart`:
  - Ratio name
  - Current value (formatted)
  - Status badge (Good/Warning/Critical)
  - Trend sparkline (optional)
  - Tap handler

### 4. Ratio Detail Sheet
- [ ] Create `lib/features/analytics/presentation/widgets/ratio_detail_sheet.dart`:
  - Full ratio name and description
  - Current value with status
  - Historical trend chart
  - Peer comparison bar
  - Threshold configuration
  - Related holdings list
  - AI explanation (optional)

### 5. Alerts Tab
- [ ] Create `lib/features/analytics/presentation/widgets/tabs/alerts_tab.dart`:
  - Filter chips:
    - Severity (Info, Warning, Critical)
    - Type (Threshold, Anomaly, News)
    - Status (New, Acknowledged, Dismissed)
  - Alert list with AlertTile
  - Bulk actions (acknowledge all)
  - Empty state

### 6. Alerts Screen
- [ ] Create `lib/features/analytics/presentation/screens/alerts_screen.dart`:
  - Full-page alerts list
  - Advanced filtering
  - Date range selector
  - Search by security

### 7. Thresholds Tab
- [ ] Create `lib/features/analytics/presentation/widgets/tabs/thresholds_tab.dart`:
  - List of configured thresholds
  - Enable/disable toggles
  - Last triggered info
  - Add threshold FAB
  - Edit/delete actions

### 8. Threshold Form Sheet
- [ ] Create `lib/features/analytics/presentation/widgets/threshold_form_sheet.dart`:
  - Ratio selection (grouped dropdown)
  - Warning threshold input
  - Critical threshold input
  - Comparison operator (< or >)
  - Apply to (all/specific portfolios)
  - Alert channels
  - Cooldown period
  - Preview affected securities

### 9. Benchmarking Tab
- [ ] Create `lib/features/analytics/presentation/widgets/tabs/benchmarking_tab.dart`:
  - Security selector
  - Peer group selector
  - Comparison table:
    - Ratio name
    - Security value
    - Peer median
    - Percentile rank
    - vs Median (+ or -)
  - Visual comparison chart
  - Create peer group button

### 10. Peer Group Form Sheet
- [ ] Create `lib/features/analytics/presentation/widgets/peer_group_form_sheet.dart`:
  - Name and description
  - Criteria-based selection:
    - Sector filter
    - Market cap range
    - Geography
  - Manual member selection
  - Preview members
  - Save action

---

## Acceptance Criteria

- [ ] Ratio cards display correctly
- [ ] Ratios grouped by category
- [ ] Ratio detail shows history and peers
- [ ] Alerts list filters work
- [ ] Alert acknowledge updates state
- [ ] Thresholds CRUD works
- [ ] Benchmarking comparison displays
- [ ] Peer group creation works
- [ ] All tabs navigate correctly
- [ ] Loading and error states handled

---

## Analytics Screen Layout

```
┌─────────────────────────────────────┐
│  Analytics                          │
├─────────────────────────────────────┤
│  [Ratios] [Alerts] [Thresholds] [..│
├─────────────────────────────────────┤
│  Portfolio: [Growth Portfolio ▼]    │
├─────────────────────────────────────┤
│                                     │
│  Liquidity                          │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Curr. │ │Quick │ │Cash  │        │
│  │Ratio │ │Ratio │ │Ratio │        │
│  │ 1.8  │ │ 1.2  │ │ 0.4  │        │
│  │ ✓    │ │ ⚠️   │ │ ✓    │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  Profitability                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ ROE  │ │ ROA  │ │Gross │        │
│  │      │ │      │ │Margin│        │
│  │22.5% │ │12.3% │ │42.1% │        │
│  │ ✓    │ │ ✓    │ │ ✓    │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  [Leverage] [Efficiency] [Value]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 25 Financial Ratios

| Category | Ratios |
|----------|--------|
| Liquidity | Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, Working Capital |
| Profitability | ROE, ROA, Gross Margin, Net Margin, Operating Margin |
| Leverage | Debt/Equity, Debt/EBITDA, Interest Coverage, Debt/Assets, Equity Multiplier |
| Efficiency | Asset Turnover, Inventory Turnover, Receivables Turnover, Payables Turnover, Cash Conversion |
| Valuation | P/E, P/B, P/S, EV/EBITDA, Dividend Yield |

---

## Technical Notes

- Use GridView for ratio cards
- Expandable category sections
- Cache ratio data (5 min stale)
- Real-time alert updates (consider WebSocket)
- Form validation for thresholds
- Accessible color coding
