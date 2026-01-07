# TODO-WEB-008: Portfolio Pages

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 12h
**Dependencies**: TODO-WEB-003, TODO-WEB-004, TODO-WEB-006

---

## Objective

Implement the portfolio management pages including list view, detail view, holdings management, and transaction recording.

---

## Tasks

### 1. Portfolio List Page
- [ ] Create `src/pages/portfolios/index.tsx`:
  ```typescript
  export default function PortfolioListPage() {
    const { data: portfolios, isLoading } = usePortfolios();

    return (
      <PageContainer
        title="Portfolios"
        actions={<CreatePortfolioButton />}
      >
        {/* Portfolio Cards/Table */}
      </PageContainer>
    );
  }
  ```
- [ ] Display portfolio cards:
  - Name and code
  - Total value
  - Day/YTD performance
  - Holdings count
  - Health score
- [ ] Filter by type (managed, model, benchmark)
- [ ] Sort options

### 2. Portfolio Detail Page
- [ ] Create `src/pages/portfolios/[id]/index.tsx`:
  ```typescript
  export default function PortfolioDetailPage() {
    const { id } = useParams();
    const { data: portfolio } = usePortfolio(id);

    return (
      <PageContainer title={portfolio?.name}>
        <Tabs defaultValue="overview">
          <TabsList>
            <Tab value="overview">Overview</Tab>
            <Tab value="holdings">Holdings</Tab>
            <Tab value="transactions">Transactions</Tab>
            <Tab value="performance">Performance</Tab>
            <Tab value="health">Health</Tab>
          </TabsList>
          {/* Tab Content */}
        </Tabs>
      </PageContainer>
    );
  }
  ```

### 3. Overview Tab
- [ ] Create `src/pages/portfolios/[id]/components/OverviewTab.tsx`:
  - Summary stats (value, P&L, cash)
  - Allocation chart (sector)
  - Top 5 holdings
  - Recent transactions
  - Quick actions

### 4. Holdings Tab
- [ ] Create `src/pages/portfolios/[id]/components/HoldingsTab.tsx`:
  - Holdings table with:
    - Ticker, Name
    - Quantity, Avg Cost
    - Current Price, Market Value
    - Unrealized P&L ($, %)
    - Weight
    - Day Change
  - Sorting by any column
  - Filter by sector, P&L status
  - Export to CSV
  - Click to view security detail

### 5. Transactions Tab
- [ ] Create `src/pages/portfolios/[id]/components/TransactionsTab.tsx`:
  - Transaction history table
  - Filter by:
    - Date range
    - Transaction type
    - Security
  - Columns:
    - Date, Type, Security
    - Quantity, Price
    - Amount, Fees
    - Status
  - Add transaction button

### 6. Performance Tab
- [ ] Create `src/pages/portfolios/[id]/components/PerformanceTab.tsx`:
  - Performance chart (full width)
  - Returns table:
    - 1D, 1W, 1M, 3M, 6M, YTD, 1Y, ITD
  - Benchmark comparison
  - Risk metrics:
    - Volatility
    - Sharpe ratio
    - Max drawdown
    - Alpha, Beta

### 7. Health Tab
- [ ] Create `src/pages/portfolios/[id]/components/HealthTab.tsx`:
  - Overall health score gauge
  - Per-class score cards:
    - Liquidity
    - Profitability
    - Leverage
    - Utilization
    - Valuation
  - Issues list with severity
  - Run scan button

### 8. Add Transaction Dialog
- [ ] Create `src/pages/portfolios/components/AddTransactionDialog.tsx`:
  - Form fields:
    - Transaction type (buy/sell/dividend)
    - Security (searchable)
    - Quantity
    - Price
    - Date
    - Fees
    - Notes
  - Validation
  - Submit mutation

### 9. Create Portfolio Dialog
- [ ] Create `src/pages/portfolios/components/CreatePortfolioDialog.tsx`:
  - Form fields:
    - Name
    - Code
    - Type
    - Currency
    - Benchmark
    - Risk profile
  - Validation
  - Submit mutation

### 10. Security Detail Sheet
- [ ] Create `src/pages/portfolios/components/SecurityDetailSheet.tsx`:
  - Slide-out panel showing:
    - Security info
    - Current price and change
    - All ratios by class
    - Ratio trend charts
    - AI analysis button

---

## Acceptance Criteria

- [ ] Portfolio list with filtering and sorting
- [ ] Portfolio detail with tabbed interface
- [ ] Holdings table with all columns
- [ ] Transactions table with filters
- [ ] Performance charts and metrics
- [ ] Health scan display
- [ ] Add transaction flow
- [ ] Create portfolio flow
- [ ] Security detail sheet
- [ ] Unit test: Components render
- [ ] Integration test: CRUD operations

---

## URL Structure

```
/portfolios                    - List all portfolios
/portfolios?type=managed       - Filtered list
/portfolios/new                - Create new (or dialog)
/portfolios/:id                - Portfolio detail (overview)
/portfolios/:id/holdings       - Holdings tab
/portfolios/:id/transactions   - Transactions tab
/portfolios/:id/performance    - Performance tab
/portfolios/:id/health         - Health tab
```

---

## Technical Notes

- Use URL params for active tab
- Implement data table with virtualization for large holdings
- Support keyboard navigation
- Cache portfolio data with 1 min stale time
- Optimistic updates for transactions
