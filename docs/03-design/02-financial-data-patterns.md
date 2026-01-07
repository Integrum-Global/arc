# Financial Data Display Patterns

## Overview

This guide covers specialized UI patterns for displaying financial data in the ARC platform. These patterns ensure consistency, accuracy, and professional presentation across web and mobile.

---

## 1. Number Formatting Standards

### 1.1 Currency Values

| Context | Format | Example |
|---------|--------|---------|
| Exact amounts | 2 decimals | $1,234,567.89 |
| Large amounts (>$100K) | Abbreviated | $1.23M, $4.56B |
| Basis points | Integer | 125 bps |
| Per share | 2 decimals | $193.42 |

**Abbreviation Rules:**

```
Value < $100,000:      $99,999.00
$100K - $999K:         $500.00K
$1M - $999M:           $50.00M
$1B+:                  $1.23B
```

### 1.2 Percentages

| Context | Format | Example |
|---------|--------|---------|
| Returns/changes | 2 decimals + sign | +12.34%, -5.67% |
| Allocations | 1 decimal | 25.5% |
| Interest rates | 2-4 decimals | 5.25%, 4.3750% |

### 1.3 Ratios

| Ratio Type | Format | Example |
|------------|--------|---------|
| Price ratios (P/E, P/B) | 2 decimals + "x" | 15.67x |
| Debt ratios | 2 decimals + "x" | 2.50x |
| Percentages (ROE, margin) | 2 decimals + "%" | 18.45% |
| Beta | 2 decimals | 1.25 |
| Sharpe | 2 decimals | 0.85 |

### 1.4 Quantities

| Context | Format | Example |
|---------|--------|---------|
| Shares | Integer with commas | 10,500 |
| Days | Integer | 365 |
| Count | Integer with commas | 1,247 |

---

## 2. Value Change Display

### 2.1 Price Change Component

Always show three elements: absolute change, percentage change, and directional indicator.

```
┌──────────────────────────────────────────────────────┐
│  $193.42   +$2.15 (+1.12%)  [up-arrow]              │
│  ^^^^^^^^  ^^^^^^ ^^^^^^^^   ^^^^^^^^^^             │
│  Current   Dollar  Percent    Direction             │
│  Price     Change  Change     Indicator             │
└──────────────────────────────────────────────────────┘

Color coding:
- Positive: green (#16A34A light / #4ADE80 dark)
- Negative: red (#DC2626 light / #F87171 dark)
- Unchanged: gray (#6B7280 light / #9CA3AF dark)

Icons:
- Positive: ArrowUp or TrendingUp
- Negative: ArrowDown or TrendingDown
- Unchanged: Minus or TrendingFlat
```

**Implementation (React):**

```tsx
<PriceChange
  value={193.42}
  change={2.15}
  percentChange={1.12}
  direction="up"
/>
```

**Implementation (Flutter):**

```dart
ArcPriceChange(
  value: 193.42,
  change: 2.15,
  percentChange: 1.12,
  direction: TrendDirection.up,
)
```

### 2.2 Compact Change Display

For tables and lists where space is limited:

```
+1.12%  [small up-arrow]
```

Or with background:

```
┌────────────────┐
│  +1.12%  [^]   │  (green background)
└────────────────┘
```

---

## 3. Ratio Display Components

### 3.1 Ratio Card (Dashboard)

Full-featured ratio display for dashboard grids:

```
┌─────────────────────────────────────────────────────┐
│  P/E Ratio                            [?] [Compare] │
│                                                     │
│  15.67x                                             │  <- Value (display font)
│                                                     │
│  ████████████░░░░░░░░  vs Sector: 18.2x            │  <- Benchmark bar
│                                                     │
│  [8x]──────────●──────────[25x]                    │  <- Historical range
│  Low          Current      High                     │
│                                                     │
│  ⚠ Below sector median                             │  <- Status message
└─────────────────────────────────────────────────────┘
```

**Components:**
1. **Header**: Ratio name + info tooltip + compare toggle
2. **Value**: Large display, monospace font
3. **Benchmark bar**: Progress bar showing position vs benchmark
4. **Range indicator**: Historical min/max with current marker
5. **Status**: Contextual insight or warning

### 3.2 Ratio Row (List)

Compact display for ratio lists:

```
┌─────────────────────────────────────────────────────────┐
│  [icon] P/E Ratio        15.67x    vs 18.2x    [Good]  │
│         ^^^^^            ^^^^^^    ^^^^^^^^    ^^^^^^   │
│         Name             Value     Benchmark   Status   │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Ratio Mini Card (Grid)

3-4 per row on dashboard:

```
┌─────────────────────┐
│  P/E Ratio          │
│  15.67x             │
│  Sector: 18.2x      │
└─────────────────────┘
```

---

## 4. Portfolio Position Display

### 4.1 Position Row (Desktop Table)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ □ │ [Logo] │ Symbol/Name     │ Price    │ Change      │ Value    │ Weight │
├───┼────────┼─────────────────┼──────────┼─────────────┼──────────┼────────┤
│ □ │ [AAPL] │ AAPL            │ $193.42  │ +$2.15      │ $96,710  │ 8.5%   │
│   │        │ Apple Inc.      │ 500 sh   │ +1.12%  [^] │          │ ████░  │
├───┼────────┼─────────────────┼──────────┼─────────────┼──────────┼────────┤
│ □ │ [MSFT] │ MSFT            │ $378.91  │ -$3.42      │ $75,782  │ 6.7%   │
│   │        │ Microsoft Corp. │ 200 sh   │ -0.89%  [v] │          │ ███░░  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Select | 48px | Checkbox |
| Logo | 48px | Company logo |
| Symbol/Name | 20% | Ticker + full name |
| Price | 15% | Price + shares |
| Change | 15% | Dollar + percent + icon |
| Value | 15% | Position value |
| Weight | 10% | % of portfolio + mini bar |
| Actions | 48px | Menu trigger |

### 4.2 Position Card (Mobile)

```
┌─────────────────────────────────────────────┐
│  [AAPL Logo]  AAPL              $193.42    │
│               Apple Inc.        +$2.15 [^] │
│                                 +1.12%     │
│  ──────────────────────────────────────    │
│  500 shares     $96,710     8.5% of portfolio│
└─────────────────────────────────────────────┘
```

### 4.3 Position Summary (Watchlist)

```
┌─────────────────────────────────────────────┐
│  AAPL   $193.42   +1.12%  [^]  [Sparkline] │
└─────────────────────────────────────────────┘
```

---

## 5. Chart Patterns

### 5.1 Sparkline (Inline Mini Chart)

```
Size: 80x24px (web), 60x20px (mobile)
Data points: 20-30
No axes, labels, or gridlines
Color: Based on overall trend
Animation: Draw on mount (200ms)
```

**Usage:** Inline with prices, in table cells, in metric cards

### 5.2 Portfolio Value Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Portfolio Value                                                        │
│  ───────────────────────────────────────────────────────────────────── │
│  $1.25M                                                 •  $1.24M      │
│  $1.20M                                    •          •                │
│  $1.15M                         •        •                             │
│  $1.10M              •        •                                        │
│  $1.05M    •       •                                                   │
│  $1.00M  •                                                             │
│  ───────────────────────────────────────────────────────────────────── │
│           Jan      Feb     Mar     Apr     May     Jun                 │
│                                                                         │
│  [1D] [1W] [1M] [3M] [1Y] [ALL]              +$240,000 (+24.0%) YTD   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Area chart with gradient fill
- Time range selector pills
- Hover tooltip with exact values
- Optional benchmark overlay (dotted line)
- Summary stats (YTD return)

### 5.3 Allocation Donut Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sector Allocation                                                      │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│          ████████████████                                               │
│       ███                 ███         Technology    35.2%  ███████     │
│     ██                       ██       Healthcare    22.1%  ████        │
│    █                           █      Financials    18.5%  ████        │
│   █     Total: $1.24M          █      Consumer      12.8%  ███         │
│    █                           █      Industrial     8.2%  ██          │
│     ██                       ██       Other          3.2%  █           │
│       ███                 ███                                           │
│          ████████████████                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Donut with center metric (total value)
- Maximum 6-8 segments (group "Other")
- Legend with values and mini bars
- Interactive: hover/tap shows detailed breakdown
- Sorted by value descending

### 5.4 Ratio Comparison Bar Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│  P/E Ratio Comparison                                                   │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  AAPL     █████████████████████████████████████  35.2x                 │
│  GOOGL    ████████████████████████  24.5x                              │
│  MSFT     ██████████████████████████████  30.1x                        │
│  Sector   ███████████████████  18.2x                                   │
│                                                                         │
│  0x          10x          20x          30x          40x                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal bars (easier to read labels)
- Benchmark line (sector average)
- Values at bar ends
- Color coding by status (above/below threshold)

---

## 6. Alert Display Patterns

### 6.1 Alert Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [!] Threshold Exceeded                                      2 min ago │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  MSFT P/E ratio (35.2x) exceeded your threshold of 30x                 │
│                                                                         │
│  Current: 35.2x  |  Threshold: 30x  |  Exceeded by: 17.3%              │
│                                                                         │
│                                           [View Details]   [Dismiss]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Alert Severity Levels

| Severity | Color | Icon | Use |
|----------|-------|------|-----|
| Critical | Red bg | AlertCircle | Immediate action required |
| Warning | Orange bg | AlertTriangle | Attention needed soon |
| Info | Blue bg | Info | FYI, no action needed |
| Success | Green bg | CheckCircle | Confirmation |

### 6.3 Alert Row (List)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [!] │ Threshold Exceeded │ MSFT P/E > 30x    │ 2 min ago │ [>]        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Alert Badge (Inline)

```
Portfolio A  [2 alerts]
             ^^^^^^^^^^
             Red badge with count
```

---

## 7. Metric Cards

### 7.1 Hero Metric (Large)

```
┌─────────────────────────────────────────────┐
│  [icon]  Portfolio Value                    │
│                                             │
│          $1,247,892.34                      │  <- 48px display
│          +$24,567 (+2.01%)  [^]            │  <- 16px with icon
│                                             │
│          [Sparkline ~~~~~~~~]               │
└─────────────────────────────────────────────┘
```

### 7.2 Standard Metric

```
┌─────────────────────────────────┐
│  [icon] Day Change              │
│                                 │
│  +$24,567                       │  <- 24px
│  +2.01%  [^]                    │  <- 14px
└─────────────────────────────────┘
```

### 7.3 Compact Metric (Grid)

```
┌─────────────────────┐
│  Day Change         │
│  +$24,567 (+2.01%) │
└─────────────────────┘
```

### 7.4 Metric Variants

| Variant | Width | Height | Use |
|---------|-------|--------|-----|
| Hero | 100% | 180px | Page header metric |
| Standard | 280px | 120px | Dashboard grid |
| Compact | 200px | 80px | Dense dashboards |
| Inline | fit | 48px | Within content |

---

## 8. Table Patterns

### 8.1 Financial Data Table

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Ratio Analysis                                          [Export] [Customize] │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                               │
│  Ratio          │ Current │ 1Y Ago │ Change   │ Sector │ Status             │
│  ───────────────┼─────────┼────────┼──────────┼────────┼────────────────────│
│  P/E Ratio      │ 15.67x  │ 14.23x │ +1.44x   │ 18.2x  │ [Good] Below avg   │
│  P/B Ratio      │  3.45x  │  3.12x │ +0.33x   │  4.1x  │ [Good] Below avg   │
│  Debt/Equity    │  1.25x  │  1.45x │ -0.20x   │  1.8x  │ [Good] Below avg   │
│  ROE            │ 18.45%  │ 16.23% │ +2.22%   │ 15.0%  │ [Good] Above avg   │
│  Current Ratio  │  1.85x  │  1.72x │ +0.13x   │  1.5x  │ [Good] Above avg   │
│  ───────────────────────────────────────────────────────────────────────────  │
│  Showing 5 of 24 ratios                                    [Load More]       │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Table Features

| Feature | Implementation |
|---------|----------------|
| Sorting | Click header to sort, show direction arrow |
| Filtering | Dropdown per column or global search |
| Pagination | "Showing X-Y of Z" with page controls |
| Row selection | Checkbox column, bulk actions toolbar |
| Fixed headers | Sticky header on scroll |
| Column resize | Draggable dividers |
| Export | CSV, Excel, PDF buttons |

### 8.3 Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        [Empty inbox icon]                                   │
│                                                                             │
│                    No alerts to display                                     │
│                                                                             │
│         Your portfolio is within all configured thresholds                  │
│                                                                             │
│                     [Configure Alerts]                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Loading States

### 9.1 Skeleton Patterns

**Metric Card Skeleton:**
```
┌─────────────────────────────┐
│  ██████████                 │  <- Label placeholder
│                             │
│  ████████████████████       │  <- Value placeholder
│  ████████  ████             │  <- Change placeholder
└─────────────────────────────┘

Animation: Shimmer left-to-right, 1.5s duration
```

**Table Row Skeleton:**
```
│ █ │ ██████████████ │ ██████ │ ████████ │ █████ │
Animation: Shimmer
```

**Chart Skeleton:**
```
┌─────────────────────────────────────────────┐
│  ████████████████████████████████████████   │
│  ██████████████████████████████████████     │
│  ████████████████████████████████           │
│  ██████████████████████████                 │
│  ████████████████████                       │
│  ███████████████                            │
│  ──────────────────────────────────────     │
│  ████  ████  ████  ████  ████  ████        │
└─────────────────────────────────────────────┘
```

### 9.2 Loading Indicators

| Context | Indicator | Duration |
|---------|-----------|----------|
| Button action | Spinner inside button | < 3s |
| Data fetch | Skeleton screens | < 5s |
| Heavy calculation | Progress bar | > 5s |
| Full page load | Centered spinner | Any |

---

## 10. Number Animation

### 10.1 Value Counting Animation

When displaying live or updated values:

```
Duration: 500ms
Easing: ease-out
Start: Previous value (or 0)
End: New value

Example: $1,000 -> $1,250
Frame 1 (0ms):   $1,000
Frame 2 (125ms): $1,062
Frame 3 (250ms): $1,156
Frame 4 (375ms): $1,219
Frame 5 (500ms): $1,250
```

### 10.2 Highlight Flash

When value changes:

```
Sequence:
1. Briefly highlight background (200ms)
   - Increase: light green flash
   - Decrease: light red flash
2. Fade to normal (300ms)

Total duration: 500ms
```

### 10.3 When NOT to Animate

- Initial page load (show final values immediately)
- Bulk data updates (too distracting)
- Tables with many rows (performance)
- User preference: reduced motion

---

## 11. Responsive Adaptations

### 11.1 Ratio Cards

| Breakpoint | Cards per row | Card style |
|------------|---------------|------------|
| Mobile | 1 | Full width, expanded |
| Tablet | 2 | Standard |
| Desktop | 3-4 | Standard |
| Wide | 4-6 | Compact or standard |

### 11.2 Position Tables

| Breakpoint | Display | Columns |
|------------|---------|---------|
| Mobile | Card list | Symbol, price, change |
| Tablet | Compact table | + Value, weight |
| Desktop | Full table | All columns |

### 11.3 Charts

| Breakpoint | Chart behavior |
|------------|----------------|
| Mobile | Full width, stacked |
| Tablet | 2-up layout |
| Desktop | Dashboard grid |

---

## 12. Implementation Checklists

### Metric Card Checklist
- [ ] Value formatted correctly (currency, percentage, ratio)
- [ ] Change shows sign (+ or -)
- [ ] Direction icon matches value
- [ ] Color matches direction (green/red/gray)
- [ ] Loading state (skeleton)
- [ ] Hover tooltip for full precision
- [ ] Responsive sizing

### Table Checklist
- [ ] Numeric columns right-aligned
- [ ] Text columns left-aligned
- [ ] Monospace font for numbers
- [ ] Sortable headers with indicators
- [ ] Row hover state
- [ ] Fixed header on scroll
- [ ] Empty state
- [ ] Loading state (skeleton rows)
- [ ] Pagination or infinite scroll

### Chart Checklist
- [ ] Responsive container
- [ ] Appropriate chart type
- [ ] Clear axis labels
- [ ] Tooltip on hover/tap
- [ ] Legend for multiple series
- [ ] Loading state
- [ ] Empty state
- [ ] Color-blind friendly palette
- [ ] Tabular data alternative (accessibility)
