# TODO-WEB-005: Chart Components

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-002

---

## Objective

Implement chart components for visualizing portfolio allocation, performance, and ratio trends using Recharts.

---

## Tasks

### 1. AllocationChart Component
- [ ] Create `src/components/charts/AllocationChart.tsx`:
  ```typescript
  interface AllocationChartProps {
    data: Array<{
      name: string;
      value: number;
      color?: string;
    }>;
    type?: 'pie' | 'donut' | 'treemap';
    showLegend?: boolean;
    showLabels?: boolean;
    interactive?: boolean;
    onSegmentClick?: (segment: string) => void;
  }
  ```
- [ ] Features:
  - Pie chart (default)
  - Donut chart variant
  - Treemap for many segments
  - Interactive tooltips
  - Click to drill down
  - Responsive sizing

### 2. PerformanceChart Component
- [ ] Create `src/components/charts/PerformanceChart.tsx`:
  ```typescript
  interface PerformanceChartProps {
    data: Array<{
      date: string;
      portfolio: number;
      benchmark?: number;
    }>;
    period?: '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';
    showBenchmark?: boolean;
    benchmarkLabel?: string;
    showArea?: boolean;
    interactive?: boolean;
  }
  ```
- [ ] Features:
  - Line chart with area fill
  - Benchmark comparison line
  - Period selector
  - Crosshair on hover
  - Point details tooltip
  - Positive/negative coloring

### 3. RatioTrendChart Component
- [ ] Create `src/components/charts/RatioTrendChart.tsx`:
  ```typescript
  interface RatioTrendChartProps {
    data: Array<{
      date: string;
      value: number;
    }>;
    thresholds?: {
      warning: number;
      critical: number;
    };
    ratioName: string;
    showThresholdLines?: boolean;
    showPoints?: boolean;
  }
  ```
- [ ] Features:
  - Line chart with points
  - Threshold reference lines
  - Zone coloring (good/warning/critical)
  - Date range filtering
  - Annotations for events

### 4. BarChart Component
- [ ] Create `src/components/charts/BarChart.tsx`:
  ```typescript
  interface BarChartProps {
    data: Array<{
      label: string;
      value: number;
      color?: string;
    }>;
    orientation?: 'vertical' | 'horizontal';
    showValues?: boolean;
    colorByValue?: boolean;  // Green positive, red negative
    sortBy?: 'value' | 'label' | 'none';
  }
  ```
- [ ] Use cases:
  - Top holdings by value
  - Holdings by gain/loss
  - Sector contribution

### 5. SparklineChart Component
- [ ] Create `src/components/charts/SparklineChart.tsx`:
  ```typescript
  interface SparklineChartProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    showEndPoint?: boolean;
    trend?: 'up' | 'down' | 'neutral';
  }
  ```
- [ ] Features:
  - Minimal inline chart
  - Auto color by trend
  - Used in cards/tables

### 6. GaugeChart Component
- [ ] Create `src/components/charts/GaugeChart.tsx`:
  ```typescript
  interface GaugeChartProps {
    value: number;
    min?: number;
    max?: number;
    thresholds?: Array<{
      value: number;
      color: string;
    }>;
    label?: string;
    format?: 'percent' | 'number';
  }
  ```
- [ ] Use cases:
  - Portfolio health score
  - Risk gauge
  - Capacity utilization

### 7. Heatmap Component
- [ ] Create `src/components/charts/Heatmap.tsx`:
  ```typescript
  interface HeatmapProps {
    data: Array<{
      x: string;
      y: string;
      value: number;
    }>;
    xLabels: string[];
    yLabels: string[];
    colorScale?: 'diverging' | 'sequential';
  }
  ```
- [ ] Use cases:
  - Correlation matrix
  - Sector/asset class returns

### 8. Chart Utilities
- [ ] Create `src/lib/utils/chartUtils.ts`:
  - Color scales for financial data
  - Number formatters for axes
  - Date formatters for time series
  - Responsive breakpoint handling

---

## Acceptance Criteria

- [ ] AllocationChart with pie/donut/treemap
- [ ] PerformanceChart with benchmark comparison
- [ ] RatioTrendChart with thresholds
- [ ] BarChart with value coloring
- [ ] SparklineChart for inline use
- [ ] GaugeChart for scores
- [ ] All charts responsive
- [ ] All charts support dark mode
- [ ] Unit test: Data transformation
- [ ] Visual test: Chart rendering

---

## Color Palette for Charts

```typescript
const CHART_COLORS = {
  // Sector colors (12)
  sectors: [
    '#3B82F6', // Technology
    '#10B981', // Healthcare
    '#F59E0B', // Financials
    '#8B5CF6', // Consumer
    '#EC4899', // Energy
    '#06B6D4', // Industrials
    '#84CC16', // Materials
    '#F97316', // Real Estate
    '#6366F1', // Utilities
    '#14B8A6', // Communication
    '#A855F7', // Staples
    '#64748B', // Other
  ],

  // Performance
  positive: '#10B981',
  negative: '#EF4444',
  benchmark: '#6B7280',

  // Thresholds
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
};
```

---

## Usage Examples

```tsx
// AllocationChart
<AllocationChart
  data={[
    { name: 'Technology', value: 35 },
    { name: 'Healthcare', value: 20 },
    { name: 'Financials', value: 15 },
  ]}
  type="donut"
  showLegend
  onSegmentClick={handleDrillDown}
/>

// PerformanceChart
<PerformanceChart
  data={performanceData}
  period="YTD"
  showBenchmark
  benchmarkLabel="S&P 500"
/>

// RatioTrendChart
<RatioTrendChart
  data={ratioHistory}
  ratioName="Current Ratio"
  thresholds={{ warning: 1.5, critical: 1.0 }}
  showThresholdLines
/>
```

---

## Technical Notes

- Use Recharts as base library
- Implement responsive container wrapper
- Support SVG export for reports
- Handle empty data gracefully
- Animate on data change
- Accessible with aria-labels
