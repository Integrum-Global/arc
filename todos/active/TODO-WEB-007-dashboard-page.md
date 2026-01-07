# TODO-WEB-007: Dashboard Page

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-003, TODO-WEB-004, TODO-WEB-006

---

## Objective

Implement the main dashboard page displaying portfolio overview, key metrics, alerts, and morning brief summary.

---

## Tasks

### 1. Dashboard Layout
- [ ] Create `src/pages/dashboard/index.tsx`:
  ```typescript
  export default function DashboardPage() {
    return (
      <PageContainer title="Dashboard">
        <Grid cols={4} gap="md">
          {/* Summary Cards Row */}
          {/* Charts Row */}
          {/* Alerts and Brief Row */}
        </Grid>
      </PageContainer>
    );
  }
  ```
- [ ] Define responsive layout:
  - 4 columns on desktop
  - 2 columns on tablet
  - 1 column on mobile

### 2. Summary Cards Section
- [ ] Create `src/pages/dashboard/components/SummaryCards.tsx`:
  - Total Portfolio Value
  - Day Change ($ and %)
  - YTD Return
  - Portfolio Health Score
- [ ] Use StatCard component
- [ ] Fetch aggregated data

### 3. Allocation Chart Section
- [ ] Create `src/pages/dashboard/components/AllocationSection.tsx`:
  - Sector allocation donut chart
  - Top 5 holdings list
  - "View all" link to portfolio page
- [ ] Toggle between sector/asset class view

### 4. Performance Chart Section
- [ ] Create `src/pages/dashboard/components/PerformanceSection.tsx`:
  - Performance line chart
  - Period selector (1M, 3M, YTD, 1Y)
  - Benchmark comparison toggle
  - Portfolio selector (if multiple)

### 5. Alerts Section
- [ ] Create `src/pages/dashboard/components/AlertsSection.tsx`:
  - List of active alerts (max 5)
  - Filter by severity
  - Quick acknowledge action
  - "View all" link to alerts page
- [ ] Real-time updates

### 6. Morning Brief Section
- [ ] Create `src/pages/dashboard/components/BriefSection.tsx`:
  - Today's brief summary
  - Key takeaways list
  - "Read full brief" link
  - Generate button if not available
- [ ] Stream brief if generating

### 7. Quick Actions Section
- [ ] Create `src/pages/dashboard/components/QuickActions.tsx`:
  - Record transaction button
  - Run health scan button
  - Ask AI query input
  - Refresh data button

### 8. Recent Activity Section
- [ ] Create `src/pages/dashboard/components/RecentActivity.tsx`:
  - Recent transactions (last 5)
  - Recent alerts
  - Recent queries
- [ ] Tabbed interface

### 9. Data Fetching
- [ ] Implement dashboard data hooks:
  ```typescript
  function useDashboardData() {
    const portfolios = usePortfolios();
    const alerts = useAlerts({ status: 'active', limit: 5 });
    const brief = useMarketBrief({ type: 'daily' });
    // Aggregate and transform
    return { ... };
  }
  ```
- [ ] Handle loading states
- [ ] Handle empty states

---

## Acceptance Criteria

- [ ] Summary cards display key metrics
- [ ] Allocation chart renders correctly
- [ ] Performance chart with period selection
- [ ] Alerts list with actions
- [ ] Brief summary displays
- [ ] Responsive layout works
- [ ] Loading states shown
- [ ] Empty states handled
- [ ] Unit test: Dashboard components
- [ ] Integration test: Data loading

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                        [🔄 Refresh]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Total    │ │ Day      │ │ YTD      │ │ Health   │          │
│  │ Value    │ │ Change   │ │ Return   │ │ Score    │          │
│  │ $1.2M    │ │ +$12,450 │ │ +8.5%    │ │ 85/100   │          │
│  │ ▲ 1.05%  │ │ ▲ 1.05%  │ │ vs 7.2%  │ │ Good     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Allocation              │ │ Performance             │       │
│  │   [Donut Chart]         │ │   [Line Chart]          │       │
│  │                         │ │   [1M] [3M] [YTD] [1Y]  │       │
│  │   Tech   35%            │ │                         │       │
│  │   Health 20%            │ │   — Portfolio           │       │
│  │   Fin    15%            │ │   --- Benchmark         │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Active Alerts        [→]│ │ Morning Brief        [→]│       │
│  │ ─────────────────────── │ │ ─────────────────────── │       │
│  │ ⚠️ AAPL: Current ratio  │ │ Today's Key Takeaways:  │       │
│  │    below threshold      │ │ • Markets up on Fed...  │       │
│  │ ⚠️ MSFT: Debt/EBITDA   │ │ • Tech sector shows...  │       │
│  │    approaching limit    │ │ • Your portfolio...     │       │
│  │                         │ │                         │       │
│  │         [View All]      │ │      [Read Full Brief]  │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

- Use React.Suspense for lazy loading sections
- Implement skeleton loaders
- Cache dashboard data (1 min stale time)
- Support portfolio selector for multi-portfolio users
- Auto-refresh alerts every 30 seconds
