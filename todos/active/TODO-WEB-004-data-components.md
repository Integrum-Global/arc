# TODO-WEB-004: Data Display Components

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-002

---

## Objective

Implement reusable data display components for financial data including stat cards, ratio cards, alert cards, and holding rows.

---

## Tasks

### 1. StatCard Component
- [ ] Create `src/components/data/StatCard.tsx`:
  ```typescript
  interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
  }
  ```
- [ ] Display features:
  - Title label
  - Main value (formatted)
  - Change indicator with color
  - Optional icon
  - Loading skeleton

### 2. RatioCard Component
- [ ] Create `src/components/data/RatioCard.tsx`:
  ```typescript
  interface RatioCardProps {
    ratioName: string;
    ratioClass: 'liquidity' | 'profitability' | 'leverage' | 'utilization' | 'valuation';
    value: number;
    trend?: 'improving' | 'stable' | 'declining';
    peerPercentile?: number;
    thresholds?: {
      warning: number;
      critical: number;
      comparison: 'lt' | 'gt';
    };
    sparklineData?: number[];
    onClick?: () => void;
  }
  ```
- [ ] Display features:
  - Ratio name with class badge
  - Value with threshold coloring
  - Trend arrow
  - Peer percentile bar
  - Optional sparkline

### 3. AlertCard Component
- [ ] Create `src/components/data/AlertCard.tsx`:
  ```typescript
  interface AlertCardProps {
    alert: {
      id: string;
      severity: 'info' | 'warning' | 'critical';
      title: string;
      message: string;
      securityTicker?: string;
      triggeredAt: string;
      status: 'active' | 'acknowledged' | 'dismissed';
    };
    onAcknowledge?: (id: string) => void;
    onDismiss?: (id: string) => void;
    onClick?: () => void;
  }
  ```
- [ ] Display features:
  - Severity indicator (color + icon)
  - Title and message
  - Related security link
  - Time ago display
  - Action buttons

### 4. HoldingRow Component
- [ ] Create `src/components/data/HoldingRow.tsx`:
  ```typescript
  interface HoldingRowProps {
    holding: {
      securityId: string;
      ticker: string;
      name: string;
      quantity: number;
      costBasis: number;
      currentPrice: number;
      marketValue: number;
      unrealizedPnl: number;
      unrealizedPnlPct: number;
      weight: number;
      dayChange?: number;
      dayChangePct?: number;
    };
    onClick?: () => void;
    selected?: boolean;
  }
  ```
- [ ] Display features:
  - Security ticker and name
  - Quantity
  - Cost basis vs current price
  - Market value
  - P&L with color
  - Weight in portfolio
  - Day change

### 5. MetricRow Component
- [ ] Create `src/components/data/MetricRow.tsx`:
  ```typescript
  interface MetricRowProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    format?: 'currency' | 'percent' | 'ratio' | 'number';
  }
  ```

### 6. DataTable Component
- [ ] Create `src/components/data/DataTable.tsx`:
  ```typescript
  interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    loading?: boolean;
    emptyMessage?: string;
    sortable?: boolean;
    onRowClick?: (row: T) => void;
  }
  ```
- [ ] Features:
  - Sortable columns
  - Loading skeleton
  - Empty state
  - Row hover/click
  - Column resizing

### 7. ValueDisplay Component
- [ ] Create `src/components/data/ValueDisplay.tsx`:
  ```typescript
  interface ValueDisplayProps {
    value: number;
    format: 'currency' | 'percent' | 'ratio' | 'number';
    showSign?: boolean;
    colorize?: boolean;
    size?: 'sm' | 'md' | 'lg';
    currency?: string;
  }
  ```

### 8. Badge Components
- [ ] Create status badges:
  - SeverityBadge (info, warning, critical)
  - TrendBadge (up, down, neutral)
  - RatioClassBadge (liquidity, profitability, etc.)

---

## Acceptance Criteria

- [ ] StatCard displays values with trends
- [ ] RatioCard shows threshold coloring
- [ ] AlertCard with severity indicators
- [ ] HoldingRow with P&L coloring
- [ ] DataTable with sorting
- [ ] All components handle loading state
- [ ] Unit test: Value formatting
- [ ] Unit test: Threshold coloring logic
- [ ] Visual test: Component rendering

---

## Color Rules for Financial Data

| Scenario | Color | Tailwind Class |
|----------|-------|----------------|
| Positive value/gain | Green | text-success-600 |
| Negative value/loss | Red | text-danger-600 |
| Neutral/zero | Gray | text-neutral-500 |
| Critical alert | Red | bg-danger-50 border-danger-500 |
| Warning alert | Amber | bg-warning-50 border-warning-500 |
| Info alert | Blue | bg-primary-50 border-primary-500 |

---

## Usage Examples

```tsx
// StatCard
<StatCard
  title="Total Portfolio Value"
  value={1234567.89}
  change={2.5}
  changeLabel="vs yesterday"
  trend="up"
/>

// RatioCard
<RatioCard
  ratioName="Current Ratio"
  ratioClass="liquidity"
  value={1.8}
  trend="stable"
  peerPercentile={65}
  thresholds={{ warning: 1.5, critical: 1.0, comparison: 'lt' }}
/>

// AlertCard
<AlertCard
  alert={{
    severity: 'warning',
    title: 'Liquidity Alert',
    message: 'Current ratio below threshold',
    securityTicker: 'AAPL',
    triggeredAt: '2026-01-07T10:00:00Z',
    status: 'active'
  }}
  onAcknowledge={handleAcknowledge}
/>
```

---

## Technical Notes

- Use decimal.js for financial calculations
- Format numbers with proper locale
- Handle null/undefined gracefully
- Support both light and dark mode
- Make all values accessible (aria-labels)
