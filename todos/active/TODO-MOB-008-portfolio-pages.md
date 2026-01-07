# TODO-MOB-008: Portfolio Pages

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-MOB-003, TODO-MOB-004, TODO-MOB-006

---

## Objective

Implement portfolio management screens including list view, detail view with tabs, holdings display, and transaction recording.

---

## Tasks

### 1. Portfolio List Screen
- [ ] Create `lib/features/portfolio/presentation/screens/portfolio_list_screen.dart`:
  - List of portfolio cards
  - Filter by type (managed, model, benchmark)
  - Sort options
  - FAB for create portfolio
  - Pull to refresh
  - Empty state

### 2. Portfolio Card
- [ ] Create `lib/features/portfolio/presentation/widgets/portfolio_card.dart`:
  - Portfolio name and code
  - Total value
  - Day change ($ and %)
  - Holdings count
  - Health score badge
  - Tap to navigate to detail

### 3. Portfolio Detail Screen
- [ ] Create `lib/features/portfolio/presentation/screens/portfolio_detail_screen.dart`:
  - App bar with portfolio name
  - Tab bar navigation:
    - Overview
    - Holdings
    - Transactions
    - Performance
    - Health

### 4. Overview Tab
- [ ] Create `lib/features/portfolio/presentation/widgets/tabs/overview_tab.dart`:
  - Summary stats (value, P&L, cash)
  - Allocation pie chart
  - Top 5 holdings list
  - Recent transactions (last 5)
  - Quick action buttons

### 5. Holdings Tab
- [ ] Create `lib/features/portfolio/presentation/widgets/tabs/holdings_tab.dart`:
  - Holdings list with HoldingTile
  - Sort by: value, P&L, weight
  - Filter by: sector, P&L status
  - Search by ticker/name
  - Total row at bottom
  - Tap to view holding detail

### 6. Transactions Tab
- [ ] Create `lib/features/portfolio/presentation/widgets/tabs/transactions_tab.dart`:
  - Transaction list with TransactionTile
  - Filter by:
    - Date range
    - Transaction type (buy/sell/dividend)
    - Security
  - Add transaction FAB
  - Grouped by date

### 7. Performance Tab
- [ ] Create `lib/features/portfolio/presentation/widgets/tabs/performance_tab.dart`:
  - Full-width performance chart
  - Period selector
  - Returns table (1D, 1W, 1M, 3M, YTD, 1Y, ITD)
  - Benchmark comparison
  - Risk metrics:
    - Volatility
    - Sharpe ratio
    - Max drawdown
    - Alpha/Beta

### 8. Health Tab
- [ ] Create `lib/features/portfolio/presentation/widgets/tabs/health_tab.dart`:
  - Overall health gauge
  - Category score cards (5 categories)
  - Issues list with severity
  - Run scan button
  - Last scan timestamp

### 9. Add Transaction Sheet
- [ ] Create `lib/features/portfolio/presentation/widgets/add_transaction_sheet.dart`:
  - Transaction type selector
  - Security search/select
  - Quantity input
  - Price input
  - Date picker
  - Fees input
  - Notes (optional)
  - Submit button with loading

### 10. Holding Detail Screen
- [ ] Create `lib/features/portfolio/presentation/screens/holding_detail_screen.dart`:
  - Security info (ticker, name, sector)
  - Current price and day change
  - Position details (quantity, cost, value, P&L)
  - Price chart
  - Financial ratios by category
  - Transaction history for this holding
  - AI analysis button

---

## Acceptance Criteria

- [ ] Portfolio list displays all portfolios
- [ ] Filter and sort work correctly
- [ ] Portfolio detail shows all tabs
- [ ] Holdings list is sortable and filterable
- [ ] Transactions list is filterable
- [ ] Performance chart shows all periods
- [ ] Health scan displays correctly
- [ ] Add transaction flow works
- [ ] Holding detail shows all data
- [ ] Navigation between screens smooth

---

## URL Structure

```
/portfolios                    - List all portfolios
/portfolios/:id                - Portfolio detail (overview tab)
/portfolios/:id/holdings       - Holdings tab
/portfolios/:id/transactions   - Transactions tab
/portfolios/:id/performance    - Performance tab
/portfolios/:id/health         - Health tab
/portfolios/:id/holding/:hid   - Holding detail
```

---

## Portfolio Card Layout

```
┌─────────────────────────────────────┐
│  Growth Portfolio        [85] ●     │
│  PORT001                            │
│                                     │
│  $1,250,000                         │
│  ▲ $15,200 (1.23%)      12 holdings │
└─────────────────────────────────────┘
```

---

## Holding Tile Layout

```
┌─────────────────────────────────────┐
│  AAPL           [Sparkline]  15.2%  │
│  Apple Inc                          │
│                                     │
│  100 shares @ $150.00               │
│  $17,500          +$2,500 (+16.7%)  │
└─────────────────────────────────────┘
```

---

## Technical Notes

- Use TabController for detail tabs
- Persist tab selection in URL params
- Virtualize long lists (ListView.builder)
- Debounce search input
- Cache portfolio data (1 min stale)
- Optimistic updates for transactions
