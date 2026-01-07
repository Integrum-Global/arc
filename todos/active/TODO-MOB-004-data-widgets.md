# TODO-MOB-004: Data Display Widgets

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-002

---

## Objective

Implement data display widgets for financial metrics, portfolio holdings, alerts, and ratios.

---

## Tasks

### 1. StatCard Widget
- [ ] Create `lib/shared/widgets/stat_card.dart`:
  - Label and value display
  - Optional change indicator (up/down arrow with color)
  - Optional icon with background
  - Tap handler
  - Factory constructors:
    - StatCard.currency()
    - StatCard.percentage()

### 2. Portfolio Summary Card
- [ ] Create `lib/features/dashboard/presentation/widgets/portfolio_summary_card.dart`:
  - Total value with currency formatting
  - Daily change ($ and %)
  - Gradient or elevated background
  - Positive/negative color coding

### 3. Holding List Tile
- [ ] Create `lib/features/portfolio/presentation/widgets/holding_tile.dart`:
  - Ticker and company name
  - Quantity and market value
  - Unrealized P&L ($ and %)
  - Weight percentage
  - Sparkline chart (optional)
  - Tap to navigate to detail

### 4. Transaction Tile
- [ ] Create `lib/features/portfolio/presentation/widgets/transaction_tile.dart`:
  - Transaction type icon (buy/sell/dividend)
  - Security ticker and name
  - Quantity and price
  - Total amount
  - Date
  - Status indicator

### 5. Alert Tile
- [ ] Create `lib/features/analytics/presentation/widgets/alert_tile.dart`:
  - Severity indicator (icon + color)
  - Alert title and message
  - Alert type label (THRESHOLD, ANOMALY, NEWS)
  - Timestamp (relative time)
  - Dismissible (swipe to acknowledge)
  - Compact variant for lists

### 6. Ratio Card
- [ ] Create `lib/features/analytics/presentation/widgets/ratio_card.dart`:
  - Ratio name
  - Current value
  - Threshold status (Good/Warning/Critical with colors)
  - Trend indicator
  - Peer comparison bar (optional)
  - Tap for detail

### 7. Health Score Gauge
- [ ] Create `lib/shared/widgets/health_gauge.dart`:
  - Circular gauge (0-100)
  - Color gradient (red to green)
  - Score text in center
  - Label below

### 8. Percentile Bar
- [ ] Create `lib/shared/widgets/percentile_bar.dart`:
  - Horizontal bar
  - Marker for current percentile
  - Labels (Low, Median, High)
  - Color gradient

### 9. Brief Card
- [ ] Create `lib/features/intelligence/presentation/widgets/brief_card.dart`:
  - Section title
  - Content text
  - Sentiment badge
  - Relevance score
  - Sources list
  - Expand/collapse for long content

### 10. Query Suggestion Chip
- [ ] Create `lib/features/intelligence/presentation/widgets/suggestion_chip.dart`:
  - Suggestion text
  - Tap to execute query
  - Rounded styling
  - Horizontal scrollable list

---

## Acceptance Criteria

- [ ] StatCard displays all variants correctly
- [ ] PortfolioSummaryCard shows positive/negative colors
- [ ] HoldingTile shows all holding data
- [ ] AlertTile severity colors correct
- [ ] RatioCard threshold status accurate
- [ ] HealthGauge animates on value change
- [ ] BriefCard expands/collapses smoothly
- [ ] All widgets support dark mode
- [ ] Formatters display correct formats

---

## Color Coding

### P&L Colors
- Positive: AppColors.success (#4CAF50)
- Negative: AppColors.error (#F44336)
- Neutral: AppColors.textSecondary

### Alert Severity
- Critical: AppColors.error + errorLight background
- Warning: AppColors.warning + warningLight background
- Info: AppColors.info + infoLight background

### Ratio Status
- Good: AppColors.success
- Warning: AppColors.warning
- Critical: AppColors.error

---

## Formatter Specifications

```dart
// Currency
format_currency(1500000) → "$1,500,000"
format_currency_compact(25000) → "$25K"

// Percentage
format_percent(0.0523) → "5.23%"
format_percent_change(0.0169) → "+1.69%"
format_percent_change(-0.05) → "-5.00%"

// Ratio
format_ratio(1.5, 'decimal') → "1.50"
format_ratio(2.5, 'multiple') → "2.5x"

// Time
format_relative_time(5_minutes_ago) → "5m ago"
format_relative_time(2_hours_ago) → "2h ago"
format_relative_time(yesterday) → "Yesterday"
```

---

## Technical Notes

- Use RepaintBoundary for sparklines
- Memoize expensive calculations
- Use Freezed for data models
- Format numbers using intl package
- Support accessibility labels
