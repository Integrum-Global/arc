# ARC Unified Design System

## Overview

This document establishes the canonical design system for the ARC Investment Management Platform, ensuring visual and experiential consistency across:

- **React Web Application** (`apps/web`)
- **Flutter Mobile Application** (`apps/mobile`)

**Target Audience**: Investment managers and family offices managing $100M-$500M+ AUM

**Design Philosophy**: Professional, data-rich, trustworthy, efficient

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design Tokens](#2-design-tokens)
3. [Component Naming Conventions](#3-component-naming-conventions)
4. [Financial Data Display Patterns](#4-financial-data-display-patterns)
5. [Modern UI/UX Principles (2024-2025)](#5-modern-uiux-principles-2024-2025)
6. [Accessibility Standards](#6-accessibility-standards)
7. [Dark Mode Strategy](#7-dark-mode-strategy)
8. [Platform-Specific Adaptations](#8-platform-specific-adaptations)

---

## 1. Design Principles

### 1.1 Core Principles (Cross-Platform)

These principles MUST be followed by both web and mobile implementations:

#### Principle 1: Data Density Over Decoration

Investment professionals work with large datasets daily. Optimize for information density, not visual flair.

```
DO:  Show 30+ portfolio positions on screen with key metrics
DON'T: Show 5 positions with large hero images and excessive whitespace
```

**Metrics**:
- Dashboard should display 8-12 key metrics above the fold
- Portfolio list should show 15-30 positions per viewport
- Ratio cards should display 4-6 per row on desktop, 2 per row on mobile

#### Principle 2: Glanceability

Financial data must be digestible in 2-3 seconds. Use visual encoding (color, size, position) to convey meaning instantly.

```
DO:  Use red/green color coding for gains/losses WITH directional arrows
DON'T: Rely solely on numbers (requires cognitive processing)
```

**Implementation**:
- Positive values: Green color + upward arrow
- Negative values: Red color + downward arrow
- Neutral/unchanged: Gray color + horizontal dash
- Always include both color AND icon (accessibility)

#### Principle 3: Hierarchy Through Restraint

Use a maximum of 3 visual weights per screen. More creates noise.

```
Visual Weight Hierarchy:
LEVEL 1: Page title, key metric values (32-48px, bold)
LEVEL 2: Section headers, card titles (18-24px, semibold)
LEVEL 3: Body text, data labels (14-16px, regular)
```

#### Principle 4: Progressive Disclosure

Show summary first, details on demand. Never overwhelm with data upfront.

```
Layer 1: Portfolio overview (total value, day change, top movers)
Layer 2: Sector breakdown, ratio summaries
Layer 3: Individual position details
Layer 4: Full historical data, transaction history
```

#### Principle 5: Consistent Mental Models

Same concept = same visual treatment everywhere.

```
Ratios always use: [icon] [name] [value] [status badge]
Positions always use: [symbol] [name] [price] [change] [weight]
Alerts always use: [severity icon] [title] [timestamp] [action]
```

#### Principle 6: Error Prevention Over Error Recovery

Guide users to correct inputs proactively.

```
DO:  Disable submit button until form is valid with inline validation
DON'T: Allow submission then show error page
```

---

### 1.2 Enterprise Financial Software Principles

#### Trust Indicators

Financial software requires explicit trust signals:

| Signal | Implementation |
|--------|----------------|
| Data freshness | "Last updated: 2 min ago" with refresh indicator |
| Source attribution | "Data: EODHD, Capital IQ" badges |
| Calculation transparency | "?" icon reveals formula on hover/tap |
| Audit trail | Every action shows who/when/what |

#### Professional Tone

| Aspect | Guideline |
|--------|-----------|
| Language | Formal but not stuffy ("Your portfolio" not "Hey there!") |
| Terminology | Use industry terms (alpha, beta, Sharpe) without explanation |
| Precision | Show 2 decimal places for ratios, 4 for FX rates |
| Abbreviations | Use standard: P/E, ROE, CAGR, AUM, NAV |

#### Performance Perception

| Action | Maximum Wait | Feedback Required |
|--------|--------------|-------------------|
| Navigation | 100ms | Instant transition |
| Data load | 1s | Skeleton screen |
| Complex calculation | 3s | Progress indicator |
| Report generation | 30s | Progress bar + cancel option |

---

## 2. Design Tokens

### 2.1 Color System

**Unified color palette for both platforms:**

#### Primary Colors (Brand)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary.50` | `#EFF6FF` | 239, 246, 255 | Primary backgrounds |
| `primary.100` | `#DBEAFE` | 219, 234, 254 | Hover states |
| `primary.200` | `#BFDBFE` | 191, 219, 254 | Active states |
| `primary.300` | `#93C5FD` | 147, 197, 253 | Borders |
| `primary.400` | `#60A5FA` | 96, 165, 250 | Secondary elements |
| `primary.500` | `#3B82F6` | 59, 130, 246 | **Primary brand** |
| `primary.600` | `#2563EB` | 37, 99, 235 | Hover on primary |
| `primary.700` | `#1D4ED8` | 29, 78, 216 | Active on primary |
| `primary.800` | `#1E40AF` | 30, 64, 175 | Dark accents |
| `primary.900` | `#1E3A8A` | 30, 58, 138 | Darkest accent |

#### Financial Colors (Semantic)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `positive.main` | `#16A34A` | `#4ADE80` | Gains, success |
| `positive.bg` | `#DCFCE7` | `#166534` | Positive backgrounds |
| `negative.main` | `#DC2626` | `#F87171` | Losses, errors |
| `negative.bg` | `#FEE2E2` | `#991B1B` | Negative backgrounds |
| `warning.main` | `#D97706` | `#FBBF24` | Alerts, cautions |
| `warning.bg` | `#FEF3C7` | `#92400E` | Warning backgrounds |
| `neutral.main` | `#6B7280` | `#9CA3AF` | Unchanged values |
| `neutral.bg` | `#F3F4F6` | `#374151` | Neutral backgrounds |

#### Neutral Grays (UI)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `gray.50` | `#FAFAFA` | `#18181B` | Page backgrounds |
| `gray.100` | `#F4F4F5` | `#27272A` | Card backgrounds |
| `gray.200` | `#E4E4E7` | `#3F3F46` | Borders, dividers |
| `gray.300` | `#D4D4D8` | `#52525B` | Disabled text |
| `gray.400` | `#A1A1AA` | `#71717A` | Placeholder text |
| `gray.500` | `#71717A` | `#A1A1AA` | Secondary text |
| `gray.600` | `#52525B` | `#D4D4D8` | Body text |
| `gray.700` | `#3F3F46` | `#E4E4E7` | Headings |
| `gray.800` | `#27272A` | `#F4F4F5` | Primary text |
| `gray.900` | `#18181B` | `#FAFAFA` | Emphasis text |

#### Chart Colors (Data Visualization)

```
chart.1: #3B82F6 (Blue)
chart.2: #10B981 (Emerald)
chart.3: #F59E0B (Amber)
chart.4: #EF4444 (Red)
chart.5: #8B5CF6 (Purple)
chart.6: #EC4899 (Pink)
chart.7: #06B6D4 (Cyan)
chart.8: #84CC16 (Lime)
```

---

### 2.2 Typography

**Font Stack:**
- Primary: Inter (cross-platform, highly legible)
- Monospace: JetBrains Mono (numbers, code)
- Fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

#### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 48px | 700 | 1.1 | -0.02em | Hero metrics |
| `h1` | 32px | 700 | 1.2 | -0.01em | Page titles |
| `h2` | 24px | 600 | 1.25 | 0 | Section titles |
| `h3` | 20px | 600 | 1.3 | 0 | Card titles |
| `h4` | 18px | 600 | 1.35 | 0 | Subsections |
| `h5` | 16px | 600 | 1.4 | 0 | Labels |
| `body.lg` | 16px | 400 | 1.6 | 0 | Primary content |
| `body.md` | 14px | 400 | 1.5 | 0 | Secondary content |
| `body.sm` | 12px | 400 | 1.5 | 0 | Captions |
| `label` | 12px | 500 | 1.4 | 0.02em | Form labels |
| `mono` | 14px | 400 | 1.5 | 0 | Numbers, data |

#### Financial Number Formatting

```
Currency: $1,234,567.89 (2 decimals, comma separators)
Percentage: 12.34% (2 decimals)
Ratio: 15.67x (2 decimals + "x" suffix)
Large numbers: $1.23M, $4.56B (abbreviate > $100K)
Change: +2.34% / -1.56% (always show sign)
```

---

### 2.3 Spacing

**Base Unit: 4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space.0` | 0px | Reset |
| `space.1` | 4px | Tight inline spacing |
| `space.2` | 8px | Related element spacing |
| `space.3` | 12px | Component internal padding |
| `space.4` | 16px | Default padding |
| `space.5` | 20px | Card padding |
| `space.6` | 24px | Section spacing |
| `space.8` | 32px | Large section gaps |
| `space.10` | 40px | Page sections |
| `space.12` | 48px | Major sections |
| `space.16` | 64px | Page margins |

#### Spacing Patterns

| Context | Vertical | Horizontal |
|---------|----------|------------|
| Card padding | 16-24px | 16-24px |
| Card gap | 16px | 16px |
| Section gap | 32-48px | - |
| Form field gap | 16px | - |
| Inline elements | - | 8px |
| Button icon gap | - | 8px |
| List item padding | 12px | 16px |

---

### 2.4 Elevation & Shadows

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `shadow.none` | none | none | Flat elements |
| `shadow.sm` | 0 1px 2px rgba(0,0,0,0.05) | 0 1px 2px rgba(0,0,0,0.3) | Subtle lift |
| `shadow.md` | 0 4px 6px rgba(0,0,0,0.07) | 0 4px 6px rgba(0,0,0,0.4) | Cards |
| `shadow.lg` | 0 10px 15px rgba(0,0,0,0.1) | 0 10px 15px rgba(0,0,0,0.5) | Dropdowns |
| `shadow.xl` | 0 20px 25px rgba(0,0,0,0.15) | 0 20px 25px rgba(0,0,0,0.6) | Modals |

---

### 2.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius.none` | 0px | Square elements |
| `radius.sm` | 4px | Chips, badges |
| `radius.md` | 6px | Buttons, inputs |
| `radius.lg` | 8px | Cards |
| `radius.xl` | 12px | Modals, panels |
| `radius.full` | 9999px | Pills, avatars |

---

### 2.6 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z.base` | 0 | Default content |
| `z.dropdown` | 1000 | Dropdowns, tooltips |
| `z.sticky` | 1100 | Sticky headers |
| `z.drawer` | 1200 | Side panels |
| `z.modal` | 1300 | Modals |
| `z.toast` | 1400 | Toast notifications |
| `z.overlay` | 1500 | Full-screen overlays |

---

## 3. Component Naming Conventions

### 3.1 Naming Pattern

Use consistent naming across platforms:

```
[Platform Prefix][Component Name]
```

| Concept | React (Web) | Flutter (Mobile) |
|---------|-------------|------------------|
| Button | `Button` | `ArcButton` |
| Card | `Card` | `ArcCard` |
| Input | `Input` | `ArcTextField` |
| Avatar | `Avatar` | `ArcAvatar` |
| Badge | `Badge` | `ArcBadge` |
| Chip | `Chip` | `ArcChip` |

### 3.2 Component Categories

#### Layout Components

| Category | React | Flutter | Purpose |
|----------|-------|---------|---------|
| Page wrapper | `PageContainer` | `ArcScaffold` | Main page structure |
| Content area | `ContentSection` | `ArcSection` | Semantic sections |
| Card | `Card` | `ArcCard` | Content containers |
| List | `List` | `ArcList` | Item collections |
| Grid | `Grid` | `ArcGrid` | Grid layouts |
| Divider | `Divider` | `ArcDivider` | Visual separators |

#### Data Display Components

| Category | React | Flutter | Purpose |
|----------|-------|---------|---------|
| Metric card | `MetricCard` | `ArcMetricCard` | Single KPI display |
| Data table | `DataTable` | `ArcDataTable` | Tabular data |
| Chart | `Chart` | `ArcChart` | Visualizations |
| Ratio display | `RatioDisplay` | `ArcRatioDisplay` | Financial ratios |
| Position row | `PositionRow` | `ArcPositionRow` | Portfolio position |
| Price display | `PriceDisplay` | `ArcPriceDisplay` | Price with change |
| Sparkline | `Sparkline` | `ArcSparkline` | Mini charts |

#### Input Components

| Category | React | Flutter | Purpose |
|----------|-------|---------|---------|
| Text input | `Input` | `ArcTextField` | Text entry |
| Select | `Select` | `ArcDropdown` | Single selection |
| Multi-select | `MultiSelect` | `ArcMultiSelect` | Multiple selection |
| Date picker | `DatePicker` | `ArcDatePicker` | Date selection |
| Range slider | `RangeSlider` | `ArcRangeSlider` | Range selection |
| Search | `SearchInput` | `ArcSearchField` | Search input |

#### Feedback Components

| Category | React | Flutter | Purpose |
|----------|-------|---------|---------|
| Alert | `Alert` | `ArcAlert` | Inline messages |
| Toast | `Toast` | `ArcSnackbar` | Temporary messages |
| Modal | `Modal` | `ArcDialog` | Overlay dialogs |
| Loading | `Skeleton` | `ArcSkeleton` | Loading states |
| Empty state | `EmptyState` | `ArcEmptyState` | No data states |
| Progress | `Progress` | `ArcProgress` | Progress indicators |

#### Navigation Components

| Category | React | Flutter | Purpose |
|----------|-------|---------|---------|
| Navbar | `Navbar` | `ArcAppBar` | Top navigation |
| Sidebar | `Sidebar` | `ArcDrawer` | Side navigation |
| Tabs | `Tabs` | `ArcTabBar` | Tab navigation |
| Breadcrumb | `Breadcrumb` | `ArcBreadcrumb` | Location trail |
| Bottom nav | `BottomNav` | `ArcBottomNav` | Mobile nav |

### 3.3 Prop/Parameter Naming

Use consistent naming for equivalent functionality:

| Concept | React Prop | Flutter Parameter |
|---------|------------|-------------------|
| Size | `size="sm" \| "md" \| "lg"` | `size: ArcSize.sm \| .md \| .lg` |
| Variant | `variant="primary" \| "outline"` | `variant: ArcVariant.primary \| .outline` |
| State | `isLoading`, `isDisabled` | `isLoading`, `isDisabled` |
| Handler | `onClick`, `onChange` | `onTap`, `onChanged` |
| Content | `children` | `child` or named |
| Class/style | `className` | `style` or theme |

---

## 4. Financial Data Display Patterns

### 4.1 Metric Cards

Used for displaying single KPIs on dashboards.

```
Structure:
┌─────────────────────────────────┐
│ [Icon] Label            [Info] │
│                                 │
│ $1,234,567                      │  <- Large value
│ +$12,345 (+1.01%)   [Trend]    │  <- Change + sparkline
└─────────────────────────────────┘
```

**Variants:**

| Variant | Usage |
|---------|-------|
| Default | Standard metric display |
| Compact | Dashboard grids (no icon) |
| Hero | Page headers (extra large) |
| Trend | Includes sparkline chart |

**States:**

| State | Treatment |
|-------|-----------|
| Positive | Green value, green change, up arrow |
| Negative | Red value, red change, down arrow |
| Neutral | Gray value, gray change, dash |
| Loading | Skeleton animation |

### 4.2 Ratio Display

Used for financial ratios with context.

```
Structure:
┌─────────────────────────────────────────┐
│ P/E Ratio                    [?] [Peer] │
│                                         │
│ 15.67x                                  │
│ ████████░░ vs Sector: 18.2x            │  <- Progress bar showing position
│                                         │
│ [Low: 8x] ─────●───── [High: 25x]      │  <- Range indicator
└─────────────────────────────────────────┘
```

**Key elements:**
- Ratio name + info tooltip
- Current value (large)
- Comparison bar (vs benchmark)
- Historical range indicator
- Peer comparison toggle

### 4.3 Position Row

Used in portfolio lists.

```
Structure:
┌────────────────────────────────────────────────────────────┐
│ [Logo] AAPL    │ $193.42  │ +$2.15 (+1.12%)  │ 8.5% │ [$] │
│        Apple   │ 500 sh   │ [Sparkline]       │      │ [>] │
└────────────────────────────────────────────────────────────┘
```

| Column | Width | Content |
|--------|-------|---------|
| Symbol/Name | 25% | Ticker + company name |
| Price | 15% | Current + shares held |
| Change | 25% | Dollar + percent change |
| Weight | 10% | Portfolio percentage |
| Actions | 10% | Quick actions |

### 4.4 Alert Card

Used for displaying financial alerts and notifications.

```
Structure:
┌─────────────────────────────────────────────────────────────┐
│ [!] Threshold Exceeded                          2 min ago  │
│                                                             │
│ MSFT P/E ratio (35.2x) exceeded your threshold of 30x      │
│                                                             │
│ [View Details]                                   [Dismiss]  │
└─────────────────────────────────────────────────────────────┘
```

**Severity levels:**

| Level | Icon | Color | Usage |
|-------|------|-------|-------|
| Critical | Circle exclamation | Red | Immediate action required |
| Warning | Triangle exclamation | Orange | Attention needed |
| Info | Info circle | Blue | FYI notification |
| Success | Checkmark | Green | Confirmation |

### 4.5 Chart Patterns

#### Sparkline (Inline mini-chart)
- Size: 80x24px (web), 60x20px (mobile)
- No axes, labels, or gridlines
- Single color based on trend (green/red)
- Used inline with metrics

#### Area Chart (Portfolio value)
- Show last 30/90/365 days
- Gradient fill from line to axis
- Interactive tooltip on hover
- Benchmark overlay optional

#### Bar Chart (Sector allocation)
- Horizontal bars preferred
- Sorted by value descending
- Show percentage labels
- Max 10 categories (group "Other")

#### Pie/Donut Chart (Allocation breakdown)
- Use donut (not pie) for cleaner look
- Center hole shows total/key metric
- Maximum 8 segments
- Interactive hover/tap for details

---

## 5. Modern UI/UX Principles (2024-2025)

### 5.1 Design Trends to Adopt

#### Bento Grid Layouts

Modern dashboards use asymmetric grid layouts ("bento box" style):

```
┌─────────────────┬─────────┬─────────┐
│                 │         │         │
│    Large        │  Small  │  Small  │
│    Feature      │         │         │
│                 ├─────────┴─────────┤
│                 │                   │
│                 │    Medium         │
├─────────────────┼───────────────────┤
│      Medium     │                   │
│                 │    Large          │
└─────────────────┴───────────────────┘
```

**Implementation:**
- CSS Grid (web): `grid-template-columns: repeat(4, 1fr)`
- Flutter: `SliverGrid` with custom delegates

#### Glass Morphism (Subtle)

Use sparingly for overlay elements:
- Background: `rgba(255,255,255,0.7)` or dark equivalent
- Backdrop blur: `blur(12px)`
- Border: `1px solid rgba(255,255,255,0.2)`
- Apply to: Modals, floating cards, overlays

#### Micro-animations

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Page transition | Fade + slide | 200ms | ease-out |
| Card hover | Lift (translateY -2px) | 150ms | ease-out |
| Button press | Scale (0.98) | 100ms | ease-in-out |
| Loading | Pulse/shimmer | 1.5s | linear |
| Data change | Highlight flash | 500ms | ease-in-out |

#### Command Palette (Keyboard Navigation)

Implement `Cmd+K` / `Ctrl+K` for power users:
- Global search across portfolios, positions, ratios
- Recent actions
- Quick navigation
- Keyboard-only operation

### 5.2 Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Better Approach |
|--------------|--------------|-----------------|
| Excessive animations | Distracts from data | Subtle, purposeful motion |
| Dark patterns | Erodes trust | Transparent, honest UI |
| Information hiding | Frustrates power users | Progressive disclosure |
| Hamburger menus (desktop) | Hides navigation | Visible nav, command palette |
| Auto-play videos | Annoys, wastes bandwidth | User-initiated media |
| Infinite scroll (data) | Hard to navigate large sets | Pagination with jump-to |
| Modal overuse | Interrupts workflow | Inline editing, slide-overs |

### 5.3 Performance-First Design

| Metric | Target | Implementation |
|--------|--------|----------------|
| First Contentful Paint | <1.5s | SSR, code splitting |
| Largest Contentful Paint | <2.5s | Image optimization, lazy load |
| Time to Interactive | <3.5s | Bundle optimization |
| Cumulative Layout Shift | <0.1 | Skeleton screens, reserved space |
| First Input Delay | <100ms | Debounce handlers, web workers |

---

## 6. Accessibility Standards

### 6.1 WCAG 2.1 AA Compliance (Required)

#### Color Contrast

| Text Type | Minimum Ratio | Tool |
|-----------|---------------|------|
| Normal text (< 18px) | 4.5:1 | WebAIM Contrast Checker |
| Large text (>= 18px bold) | 3:1 | WebAIM Contrast Checker |
| UI components | 3:1 | Focus indicators, borders |

**Financial color accessibility:**
- NEVER use color alone to convey gain/loss
- ALWAYS pair with: icon (arrow), text label, or pattern

```
DO:  +2.34% [up arrow] (green)
DON'T: 2.34% (green only)
```

#### Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements focusable | `tabIndex={0}` / `focusable: true` |
| Logical tab order | DOM order matches visual |
| Visible focus indicator | 2px outline, offset 2px |
| Skip links | "Skip to main content" link |
| Escape closes modals | `onKeyDown` handler |
| Enter/Space activates | Button elements |
| Arrow keys for lists | Custom focus management |

#### Screen Reader Support

| Element | ARIA/Semantics |
|---------|----------------|
| Page regions | `<main>`, `<nav>`, `<aside>` |
| Headings | Proper h1-h6 hierarchy |
| Buttons | `<button>` not `<div onClick>` |
| Images | `alt` text (informative) |
| Icon buttons | `aria-label` |
| Loading | `aria-live="polite"` |
| Errors | `aria-describedby` |
| Tables | `<th scope="col/row">` |

#### Motion Preferences

```css
/* Web */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```dart
// Flutter
final reduceMotion = MediaQuery.of(context).disableAnimations;
AnimatedContainer(
  duration: reduceMotion ? Duration.zero : Duration(milliseconds: 200),
  ...
)
```

### 6.2 Financial Accessibility Patterns

| Pattern | Implementation |
|---------|----------------|
| Number formatting | Use locale-aware formatters |
| Currency symbols | Prefix with symbol, not suffix |
| Percentage signs | Include in screen reader text |
| Trend indicators | "increased by" / "decreased by" in SR |
| Chart data | Provide tabular alternative |

---

## 7. Dark Mode Strategy

### 7.1 Implementation Approach

**Method: Semantic Color Tokens**

Define colors by purpose, not by value. Each semantic token has light and dark variants.

```typescript
// Web (CSS Variables)
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #18181b;
  --color-positive: #16a34a;
}

[data-theme="dark"] {
  --color-bg-primary: #18181b;
  --color-text-primary: #fafafa;
  --color-positive: #4ade80;
}
```

```dart
// Flutter (ThemeData)
final lightTheme = ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: Color(0xFFFFFFFF),
  // ...
);

final darkTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: Color(0xFF18181B),
  // ...
);
```

### 7.2 Color Adaptation Rules

| Element | Light Mode | Dark Mode | Rule |
|---------|------------|-----------|------|
| Backgrounds | White/light grays | Dark grays/black | Invert gray scale |
| Text | Dark grays/black | White/light grays | Invert gray scale |
| Primary brand | Same blue | Lighter blue | Increase lightness |
| Positive (green) | `#16A34A` | `#4ADE80` | Increase lightness |
| Negative (red) | `#DC2626` | `#F87171` | Increase lightness |
| Borders | Light gray | Dark gray | Subtle contrast |
| Shadows | Black @ 10% | Black @ 40% | Stronger in dark |

### 7.3 Dark Mode Best Practices

| Practice | Guideline |
|----------|-----------|
| Default | Follow system preference initially |
| Toggle | Provide manual toggle in settings |
| Persist | Save preference to localStorage/device |
| Charts | Adjust chart colors for visibility |
| Images | Provide dark variants or apply filter |
| Elevation | Use lighter surfaces for elevation |

### 7.4 Testing Checklist

- [ ] All text meets contrast requirements (4.5:1)
- [ ] Focus indicators visible in dark mode
- [ ] Charts/graphs readable
- [ ] Images don't appear "harsh" (reduce brightness if needed)
- [ ] No pure black backgrounds (use `#18181B` instead)
- [ ] Semantic colors adjusted (green, red, yellow)
- [ ] Form inputs visible and distinguishable
- [ ] Loading skeletons have appropriate contrast

---

## 8. Platform-Specific Adaptations

### 8.1 Web-Specific Guidelines

#### Responsive Breakpoints

| Breakpoint | Range | Target |
|------------|-------|--------|
| Mobile | < 640px | Phone portrait |
| Tablet | 640-1023px | Tablet/small laptop |
| Desktop | 1024-1439px | Standard desktop |
| Wide | >= 1440px | Large monitors |

#### Web Navigation

```
Desktop (>= 1024px):
┌─────────────────────────────────────────────────┐
│ [Logo] Dashboard | Portfolios | Intelligence    │
│                              [Search] [Profile] │
├─────────────────────────────────────────────────┤
│ SIDEBAR │                                       │
│ (240px) │           CONTENT                     │
│         │                                       │
└─────────────────────────────────────────────────┘

Tablet (640-1023px):
┌─────────────────────────────────────────────────┐
│ [Menu] [Logo]           [Search] [Profile]      │
├─────────────────────────────────────────────────┤
│ [Icon] │                                        │
│  Nav   │           CONTENT                      │
│ (64px) │                                        │
└─────────────────────────────────────────────────┘

Mobile (< 640px):
┌─────────────────────────────────────────────────┐
│ [Menu] [Logo]                     [Profile]     │
├─────────────────────────────────────────────────┤
│                                                 │
│                 CONTENT                         │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Home] [Portfolio] [Intel] [Alerts] [More]      │
└─────────────────────────────────────────────────┘
```

#### Web-Specific Features

| Feature | Implementation |
|---------|----------------|
| Keyboard shortcuts | `Cmd/Ctrl+K` command palette |
| Right-click context | Custom context menus |
| Hover states | Card lifts, tooltip reveals |
| Drag-and-drop | Reorder dashboard widgets |
| Browser tabs | Multiple portfolio views |

### 8.2 Mobile-Specific Guidelines (Flutter)

#### Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Buttons | 44x44px | 48x48px |
| List items | 48px height | 56px height |
| Icons | 24x24px | Touch area 44x44px |
| Input fields | 48px height | 56px height |

#### Mobile Navigation

```
Default State:
┌─────────────────────────────────────────────────┐
│ < Back     Portfolio Overview        [Settings] │
├─────────────────────────────────────────────────┤
│                                                 │
│                 CONTENT                         │
│           (Scrollable area)                     │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Home] [Portfolio] [Intel] [Alerts] [Profile]   │
└─────────────────────────────────────────────────┘
                              [+] FAB (Add action)
```

#### Mobile-Specific Features

| Feature | Implementation |
|---------|----------------|
| Pull to refresh | `RefreshIndicator` |
| Swipe actions | Swipe-to-delete, swipe-to-archive |
| Bottom sheets | Filter panels, quick actions |
| Haptic feedback | On successful actions |
| Biometric auth | FaceID/TouchID for login |
| Offline mode | Local cache with sync indicator |

#### Mobile Data Display Adaptations

| Desktop Pattern | Mobile Adaptation |
|-----------------|-------------------|
| Data table (5+ cols) | Card list with key fields |
| Horizontal tabs (5+) | Scrollable tabs or dropdown |
| Side-by-side charts | Stacked vertically |
| Hover tooltips | Tap-and-hold or info icons |
| Multi-select grid | Checkbox list |

### 8.3 Cross-Platform Consistency

Despite platform differences, maintain consistency in:

| Element | Consistency Rule |
|---------|------------------|
| Brand colors | Same hex values (adjusted for dark mode) |
| Typography scale | Same ratios (may adjust base size) |
| Iconography | Same icon set (Lucide/Material symbols) |
| Spacing rhythm | Same 4px base unit |
| Component anatomy | Same structure, platform styling |
| Data formatting | Same number formats everywhere |
| Error messages | Same copy, same severity levels |
| Empty states | Same illustrations, same messaging |

---

## Appendix A: Token Reference Files

### A.1 React (Web) Implementation

**File: `apps/web/src/styles/tokens.css`**

```css
:root {
  /* Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* Financial */
  --color-positive: #16a34a;
  --color-positive-bg: #dcfce7;
  --color-negative: #dc2626;
  --color-negative-bg: #fee2e2;
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;

  /* Gray */
  --color-gray-50: #fafafa;
  --color-gray-100: #f4f4f5;
  --color-gray-200: #e4e4e7;
  --color-gray-300: #d4d4d8;
  --color-gray-400: #a1a1aa;
  --color-gray-500: #71717a;
  --color-gray-600: #52525b;
  --color-gray-700: #3f3f46;
  --color-gray-800: #27272a;
  --color-gray-900: #18181b;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.15);
}

[data-theme="dark"] {
  --color-positive: #4ade80;
  --color-positive-bg: #166534;
  --color-negative: #f87171;
  --color-negative-bg: #991b1b;
  --color-warning: #fbbf24;
  --color-warning-bg: #92400e;

  --color-gray-50: #18181b;
  --color-gray-100: #27272a;
  --color-gray-200: #3f3f46;
  --color-gray-300: #52525b;
  --color-gray-400: #71717a;
  --color-gray-500: #a1a1aa;
  --color-gray-600: #d4d4d8;
  --color-gray-700: #e4e4e7;
  --color-gray-800: #f4f4f5;
  --color-gray-900: #fafafa;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);
}
```

### A.2 Flutter (Mobile) Implementation

**File: `apps/mobile/lib/core/design/tokens.dart`**

```dart
import 'package:flutter/material.dart';

abstract class ArcColors {
  // Primary
  static const Color primary50 = Color(0xFFEFF6FF);
  static const Color primary100 = Color(0xFFDBEAFE);
  static const Color primary500 = Color(0xFF3B82F6);
  static const Color primary600 = Color(0xFF2563EB);
  static const Color primary700 = Color(0xFF1D4ED8);

  // Financial - Light
  static const Color positiveLight = Color(0xFF16A34A);
  static const Color positiveBgLight = Color(0xFFDCFCE7);
  static const Color negativeLight = Color(0xFFDC2626);
  static const Color negativeBgLight = Color(0xFFFEE2E2);

  // Financial - Dark
  static const Color positiveDark = Color(0xFF4ADE80);
  static const Color positiveBgDark = Color(0xFF166534);
  static const Color negativeDark = Color(0xFFF87171);
  static const Color negativeBgDark = Color(0xFF991B1B);

  // Gray - Light
  static const Color gray50Light = Color(0xFFFAFAFA);
  static const Color gray100Light = Color(0xFFF4F4F5);
  static const Color gray200Light = Color(0xFFE4E4E7);
  static const Color gray500Light = Color(0xFF71717A);
  static const Color gray800Light = Color(0xFF27272A);
  static const Color gray900Light = Color(0xFF18181B);

  // Gray - Dark
  static const Color gray50Dark = Color(0xFF18181B);
  static const Color gray100Dark = Color(0xFF27272A);
  static const Color gray200Dark = Color(0xFF3F3F46);
  static const Color gray500Dark = Color(0xFFA1A1AA);
  static const Color gray800Dark = Color(0xFFF4F4F5);
  static const Color gray900Dark = Color(0xFFFAFAFA);
}

abstract class ArcSpacing {
  static const double space1 = 4.0;
  static const double space2 = 8.0;
  static const double space3 = 12.0;
  static const double space4 = 16.0;
  static const double space5 = 20.0;
  static const double space6 = 24.0;
  static const double space8 = 32.0;
  static const double space10 = 40.0;
  static const double space12 = 48.0;
  static const double space16 = 64.0;
}

abstract class ArcRadius {
  static const double sm = 4.0;
  static const double md = 6.0;
  static const double lg = 8.0;
  static const double xl = 12.0;
  static const double full = 9999.0;
}
```

---

## Appendix B: Design System Checklist

### Before Implementation

- [ ] Review this document with all developers
- [ ] Set up token files in both projects
- [ ] Create component stubs following naming conventions
- [ ] Configure theme switching infrastructure
- [ ] Set up accessibility testing tools

### During Implementation

- [ ] Reference tokens, never hardcode values
- [ ] Test at all breakpoints (mobile/tablet/desktop)
- [ ] Verify dark mode appearance
- [ ] Run accessibility audit on each component
- [ ] Document component props/API

### Before Release

- [ ] Full accessibility audit (aXe, Lighthouse)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Cross-device testing (iOS, Android)
- [ ] Performance testing (Core Web Vitals)
- [ ] Design review with stakeholders

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-07 | UI/UX Designer Agent | Initial unified design system |

---

## Related Documents

- `docs/02-plans/04-web-frontend/03-component-library.md` - React component specs
- `docs/02-plans/05-mobile-frontend/03-widget-library.md` - Flutter widget specs
- `.claude/guides/uiux-design-principles.md` - General UI/UX principles
