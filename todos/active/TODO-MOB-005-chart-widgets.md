# TODO-MOB-005: Chart Widgets

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-002

---

## Objective

Implement chart widgets for data visualization including allocation, performance, trends, and sparklines using FL Chart.

---

## Tasks

### 1. Allocation Pie Chart
- [ ] Create `lib/shared/widgets/charts/allocation_pie_chart.dart`:
  - Donut chart style
  - Touch interaction (highlight section)
  - Legend with percentages
  - Custom color map
  - Configurable size
  - Empty state handling

### 2. Performance Line Chart
- [ ] Create `lib/shared/widgets/charts/performance_chart.dart`:
  - Time series line chart
  - Period selector (1M, 3M, YTD, 1Y)
  - Benchmark comparison line (optional)
  - Touch tooltip showing value at point
  - Gradient fill under line
  - Positive/negative coloring

### 3. Trend Sparkline
- [ ] Create `lib/shared/widgets/charts/trend_sparkline.dart`:
  - Compact line chart
  - No axes or labels
  - Positive/negative color based on trend
  - Optional fill area
  - Configurable dimensions

### 4. Ratio Trend Chart
- [ ] Create `lib/shared/widgets/charts/ratio_trend_chart.dart`:
  - Historical ratio values
  - Threshold reference lines
  - Time axis
  - Value labels
  - Zoom/pan support

### 5. Bar Chart
- [ ] Create `lib/shared/widgets/charts/bar_chart.dart`:
  - Horizontal and vertical variants
  - Grouped bars (for comparisons)
  - Value labels
  - Custom colors
  - Touch selection

### 6. Peer Comparison Chart
- [ ] Create `lib/shared/widgets/charts/peer_comparison_chart.dart`:
  - Horizontal bar chart
  - Security value highlighted
  - Peer median marker
  - Percentile labels
  - Color coding

### 7. Health Radar Chart
- [ ] Create `lib/shared/widgets/charts/health_radar_chart.dart`:
  - 5 axes (Liquidity, Profitability, Leverage, Efficiency, Valuation)
  - Filled area
  - Score labels
  - Benchmark comparison

### 8. Distribution Chart
- [ ] Create `lib/shared/widgets/charts/distribution_chart.dart`:
  - Histogram style
  - Current value marker
  - Percentile bands
  - Normal distribution overlay (optional)

### 9. Chart Tooltip
- [ ] Create `lib/shared/widgets/charts/chart_tooltip.dart`:
  - Date/time label
  - Value with formatting
  - Optional comparison value
  - Styled container

### 10. Chart Empty/Loading States
- [ ] Create chart placeholder widgets:
  - ChartLoading (skeleton shimmer)
  - ChartEmpty (no data message)
  - ChartError (error with retry)

---

## Acceptance Criteria

- [ ] Pie chart shows allocation with legend
- [ ] Performance chart displays multiple periods
- [ ] Sparkline renders in compact spaces
- [ ] Touch interactions work correctly
- [ ] Charts animate on data change
- [ ] Dark mode colors correct
- [ ] Empty states display properly
- [ ] Charts performant with large datasets

---

## Chart Configurations

### Allocation Pie Chart
```dart
AllocationPieChart(
  allocations: {
    'Technology': 0.35,
    'Healthcare': 0.20,
    'Financials': 0.15,
    'Consumer': 0.15,
    'Other': 0.15,
  },
  colorMap: {
    'Technology': Color(0xFF1976D2),
    'Healthcare': Color(0xFF26A69A),
    // ...
  },
  size: 200,
  showLegend: true,
)
```

### Performance Chart
```dart
PerformanceChart(
  data: [
    PerformancePoint(date: DateTime(2024, 1, 1), value: 1000000),
    PerformancePoint(date: DateTime(2024, 6, 1), value: 1150000),
    // ...
  ],
  benchmarkData: [...],  // Optional
  period: ChartPeriod.ytd,
  showBenchmark: true,
)
```

### Trend Sparkline
```dart
TrendSparkline(
  values: [1.5, 1.6, 1.4, 1.8, 1.9, 2.0],
  height: 40,
  width: 100,
  lineColor: AppColors.success,  // Auto-determined if null
)
```

---

## Color Palette for Charts

```dart
const chartColors = [
  Color(0xFF1976D2),  // Blue
  Color(0xFF26A69A),  // Teal
  Color(0xFFAB47BC),  // Purple
  Color(0xFFFF7043),  // Orange
  Color(0xFF5C6BC0),  // Indigo
  Color(0xFFFFB300),  // Amber
  Color(0xFF66BB6A),  // Green
  Color(0xFFEC407A),  // Pink
];
```

---

## Technical Notes

- Use FL Chart library (fl_chart: ^0.68.0)
- Wrap charts in RepaintBoundary
- Debounce touch interactions
- Use const for static configurations
- Support landscape orientation
- Cache computed chart data
- Animate chart transitions (300ms)
