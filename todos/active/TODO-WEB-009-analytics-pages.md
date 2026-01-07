# TODO-WEB-009: Analytics Pages

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-WEB-005, TODO-WEB-006

---

## Objective

Implement the analytics pages for viewing financial ratios, managing alert thresholds, and peer benchmarking.

---

## Tasks

### 1. Analytics Dashboard Page
- [ ] Create `src/pages/analytics/index.tsx`:
  ```typescript
  export default function AnalyticsPage() {
    return (
      <PageContainer title="Analytics">
        <Tabs defaultValue="ratios">
          <TabsList>
            <Tab value="ratios">Financial Ratios</Tab>
            <Tab value="alerts">Alerts</Tab>
            <Tab value="thresholds">Thresholds</Tab>
            <Tab value="benchmarking">Benchmarking</Tab>
          </TabsList>
          {/* Tab Content */}
        </Tabs>
      </PageContainer>
    );
  }
  ```

### 2. Financial Ratios Tab
- [ ] Create `src/pages/analytics/components/RatiosTab.tsx`:
  - Portfolio/Security selector
  - Ratio cards grouped by class:
    - Liquidity (5 ratios)
    - Profitability (5 ratios)
    - Leverage (5 ratios)
    - Utilization (5 ratios)
    - Valuation (5 ratios)
  - Click ratio for detail view
  - Threshold status indicators

### 3. Ratio Detail View
- [ ] Create `src/pages/analytics/components/RatioDetailSheet.tsx`:
  - Current value with status
  - Historical trend chart
  - Peer comparison bar
  - Threshold configuration
  - Related holdings
  - AI explanation

### 4. Alerts Tab
- [ ] Create `src/pages/analytics/components/AlertsTab.tsx`:
  - Active alerts list
  - Filter by:
    - Severity (info, warning, critical)
    - Type (threshold, anomaly, news)
    - Status (active, acknowledged, dismissed)
    - Date range
  - Bulk actions (acknowledge, dismiss)
  - Alert detail expansion

### 5. Alert Detail Card
- [ ] Create `src/pages/analytics/components/AlertDetailCard.tsx`:
  - Severity indicator
  - Title and message
  - Trigger value vs threshold
  - Related security link
  - AI explanation (if available)
  - Action buttons

### 6. Thresholds Tab
- [ ] Create `src/pages/analytics/components/ThresholdsTab.tsx`:
  - List of configured thresholds
  - Add threshold button
  - Edit/delete actions
  - Enable/disable toggle
  - Last triggered info

### 7. Threshold Configuration Form
- [ ] Create `src/pages/analytics/components/ThresholdForm.tsx`:
  - Form fields:
    - Ratio selection (grouped by class)
    - Warning threshold
    - Critical threshold
    - Comparison (lt/gt)
    - Apply to (all/specific portfolio)
    - Alert channels
    - Cooldown period
  - Preview of affected securities
  - Submit mutation

### 8. Benchmarking Tab
- [ ] Create `src/pages/analytics/components/BenchmarkingTab.tsx`:
  - Peer group selector
  - Security selector
  - Comparison table:
    - Ratio name
    - Security value
    - Peer median
    - Percentile rank
    - vs Median
  - Visual comparison charts
  - Create peer group button

### 9. Peer Group Management
- [ ] Create `src/pages/analytics/components/PeerGroupForm.tsx`:
  - Name and description
  - Criteria-based:
    - Sector filter
    - Market cap range
    - Geography
  - Manual selection:
    - Security search
    - Add/remove securities
  - Member preview
  - Save mutation

### 10. Ratio Heatmap View
- [ ] Create `src/pages/analytics/components/RatioHeatmap.tsx`:
  - All securities as rows
  - Ratio classes as columns
  - Color by threshold status
  - Click for detail

---

## Acceptance Criteria

- [ ] Ratio cards display correctly
- [ ] Ratio detail with history chart
- [ ] Alerts list with filters
- [ ] Alert acknowledge/dismiss
- [ ] Threshold CRUD
- [ ] Peer group management
- [ ] Benchmarking comparison
- [ ] Ratio heatmap
- [ ] Unit test: Components
- [ ] Integration test: Threshold config

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                                                      │
├─────────────────────────────────────────────────────────────────┤
│  [Ratios] [Alerts] [Thresholds] [Benchmarking]                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Portfolio: [Growth Portfolio ▼]                               │
│                                                                 │
│  Liquidity                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Current  │ │ Quick    │ │ Cash     │ │ OCF      │          │
│  │ Ratio    │ │ Ratio    │ │ Ratio    │ │ Ratio    │          │
│  │   1.8    │ │   1.2    │ │   0.4    │ │   1.5    │          │
│  │ ✓ Good   │ │ ⚠️ Warn  │ │ ✓ Good   │ │ ✓ Good   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  Profitability                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ ROE      │ │ ROA      │ │ Gross    │ │ Net      │          │
│  │          │ │          │ │ Margin   │ │ Margin   │          │
│  │  22.5%   │ │  12.3%   │ │  42.1%   │ │  18.5%   │          │
│  │ ✓ Good   │ │ ✓ Good   │ │ ✓ Good   │ │ ✓ Good   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  [Leverage] [Utilization] [Valuation]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

- Group ratios by class for clarity
- Color-code threshold status
- Support batch threshold configuration
- Cache ratio data (5 min stale time)
- Real-time alert updates via WebSocket
