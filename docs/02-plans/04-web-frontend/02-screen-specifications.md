# ARC Web Frontend Screen Specifications

## Overview

This document provides detailed specifications for all screens in the ARC investment management platform. Each screen includes:

- Purpose and user goals
- Wireframe layout (ASCII)
- Component breakdown
- Data requirements
- User interactions
- Responsive behavior
- Implementation code

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Portfolio Management](#2-portfolio-management)
3. [Analytics](#3-analytics)
4. [Intelligence](#4-intelligence)
5. [Alerts](#5-alerts)
6. [Settings](#6-settings)
7. [Admin](#7-admin)

---

## 1. Dashboard

### 1.1 Dashboard Overview

**Route**: `/dashboard`

**Purpose**: Provide a comprehensive, at-a-glance view of the user's investment portfolio status, recent activity, and actionable alerts.

**User Goals**:
- Quickly assess overall portfolio health
- Identify urgent alerts requiring attention
- Access recent activity and trends
- Navigate to detailed sections

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ARC                                             [Search] [Notifications] [Profile] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐                                                                          │
│ │ Dashboard│  Dashboard                                              [Export] [...]  │
│ │ Portfol.│  Good morning, John. Here's your portfolio overview.                    │
│ │ Analytics│ ────────────────────────────────────────────────────────────────────────│
│ │ Intell. │                                                                          │
│ │ Alerts  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────│
│ │ Settings│  │ Total AUM       │ │ Daily Return    │ │ YTD Return      │ │ Active  │
│ │ Admin   │  │ $45.2M          │ │ +0.85%          │ │ +12.4%          │ │ Alerts  │
│ │         │  │ +$1.2M today    │ │ ▲ vs benchmark  │ │ ▲ 3.2% vs S&P   │ │ 5       │
│ │         │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────│
│ │         │                                                                          │
│ │         │  ┌────────────────────────────────────────┐ ┌────────────────────────────│
│ │         │  │ Portfolio Performance (30 Days)        │ │ Asset Allocation           │
│ │         │  │                                        │ │                            │
│ │         │  │    ╭───────────────────────╮           │ │      [PIE CHART]          │
│ │         │  │   ╱                         ╲          │ │                            │
│ │         │  │  ╱            ───────        ╲         │ │  Equity      65%           │
│ │         │  │ ╱   Portfolio ─────────       ╲        │ │  Fixed Inc.  25%           │
│ │         │  │╱    Benchmark                  ╲       │ │  Cash        7%            │
│ │         │  │                                        │ │  Other       3%            │
│ │         │  └────────────────────────────────────────┘ └────────────────────────────│
│ │         │                                                                          │
│ │         │  ┌────────────────────────────────────────┐ ┌────────────────────────────│
│ │         │  │ Active Alerts                [View All]│ │ Recent Activity            │
│ │         │  │                                        │ │                            │
│ │         │  │ ⚠ AAPL: Debt/Equity exceeds 1.0       │ │ • Bought 100 NVDA @ $875   │
│ │         │  │   Triggered 2 hours ago               │ │   Yesterday, 3:45 PM       │
│ │         │  │                                        │ │                            │
│ │         │  │ ⚠ MSFT: P/E ratio above threshold     │ │ • Sold 50 TSLA @ $245      │
│ │         │  │   Triggered 4 hours ago               │ │   Jan 5, 2026 10:30 AM     │
│ │         │  │                                        │ │                            │
│ │         │  │ ⚠ Portfolio: Tech sector over 42%     │ │ • Dividend: AAPL $0.24/sh  │
│ │         │  │   Triggered yesterday                 │ │   Jan 3, 2026              │
│ │         │  └────────────────────────────────────────┘ └────────────────────────────│
│ │         │                                                                          │
│ │         │  ┌───────────────────────────────────────────────────────────────────────│
│ │         │  │ Portfolio Summary                                                     │
│ │         │  ├───────────────────────────────────────────────────────────────────────│
│ │         │  │ Portfolio          │ Value      │ Daily  │ YTD    │ Holdings │ Health │
│ │         │  │────────────────────┼────────────┼────────┼────────┼──────────┼────────│
│ │         │  │ Growth Equity      │ $15.0M     │ +1.2%  │ +14.5% │ 35       │ A-     │
│ │         │  │ Income Fund        │ $22.5M     │ +0.3%  │ +8.2%  │ 42       │ B+     │
│ │         │  │ Balanced Portfolio │ $7.7M      │ +0.8%  │ +11.1% │ 28       │ A      │
│ └─────────┘  └───────────────────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Data Requirements**:

| Data | API Endpoint | Update Frequency |
|------|-------------|------------------|
| Total AUM | `/portfolios` (aggregated) | Real-time SSE |
| Daily/YTD Returns | `/portfolios/{id}/valuation` | Real-time SSE |
| Active Alerts | `/analytics/alerts?status=active` | Real-time SSE |
| Portfolio List | `/portfolios` | On load |
| Performance Chart | `/portfolios/{id}/valuation?range=30d` | 5 min |
| Allocation | `/portfolios/{id}?include_holdings=true` | 5 min |
| Recent Activity | `/portfolios/{id}/transactions?limit=5` | On load |

**Implementation**:

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuickMetrics } from "./elements/QuickMetrics";
import { PerformanceChart } from "./elements/PerformanceChart";
import { AllocationChart } from "./elements/AllocationChart";
import { AlertsWidget } from "./elements/AlertsWidget";
import { RecentActivity } from "./elements/RecentActivity";
import { PortfolioSummaryTable } from "./elements/PortfolioSummaryTable";
import { QuickMetricsSkeleton } from "./elements/QuickMetricsSkeleton";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import { TableSkeleton } from "@/components/data-display/TableSkeleton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Good morning, John. Here's your portfolio overview."
        actions={[
          { label: "Export", icon: "download", onClick: () => {} },
        ]}
      />

      {/* Quick Metrics Row */}
      <Suspense fallback={<QuickMetricsSkeleton />}>
        <QuickMetrics />
      </Suspense>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton height={300} />}>
            <PerformanceChart />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<ChartSkeleton height={300} />}>
            <AllocationChart />
          </Suspense>
        </div>
      </div>

      {/* Alerts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<TableSkeleton rows={3} />}>
          <AlertsWidget />
        </Suspense>
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <RecentActivity />
        </Suspense>
      </div>

      {/* Portfolio Summary Table */}
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <PortfolioSummaryTable />
      </Suspense>
    </div>
  );
}
```

```typescript
// src/app/(dashboard)/dashboard/elements/QuickMetrics.tsx
"use client";

import { usePortfolios } from "@/hooks/usePortfolio";
import { useAlerts } from "@/hooks/useAlerts";
import { StatCard } from "@/components/data-display/StatCard";
import { formatCurrency, formatPercentage } from "@/lib/formatting";
import { DollarSign, TrendingUp, Target, AlertTriangle } from "lucide-react";

export function QuickMetrics() {
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const { data: alerts, isLoading: alertsLoading } = useAlerts({
    status: "active",
  });

  // Calculate aggregated metrics
  const totalAUM = portfolios?.portfolios.reduce(
    (sum, p) => sum + (p.summary?.total_value || 0),
    0
  ) || 0;

  const avgDailyReturn = portfolios?.portfolios.reduce(
    (sum, p) => sum + (p.summary?.daily_return || 0),
    0
  ) / (portfolios?.portfolios.length || 1);

  const avgYtdReturn = portfolios?.portfolios.reduce(
    (sum, p) => sum + (p.summary?.ytd_return || 0),
    0
  ) / (portfolios?.portfolios.length || 1);

  const activeAlertsCount = alerts?.summary?.total_active || 0;

  const isLoading = portfoliosLoading || alertsLoading;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total AUM"
        value={formatCurrency(totalAUM)}
        change="+$1.2M today"
        changeType="positive"
        icon={<DollarSign className="h-4 w-4" />}
        loading={isLoading}
      />
      <StatCard
        title="Daily Return"
        value={formatPercentage(avgDailyReturn)}
        change="vs benchmark"
        changeType={avgDailyReturn > 0 ? "positive" : "negative"}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={isLoading}
      />
      <StatCard
        title="YTD Return"
        value={formatPercentage(avgYtdReturn)}
        change="+3.2% vs S&P"
        changeType="positive"
        icon={<Target className="h-4 w-4" />}
        loading={isLoading}
      />
      <StatCard
        title="Active Alerts"
        value={activeAlertsCount.toString()}
        change={activeAlertsCount > 0 ? "Requires attention" : "All clear"}
        changeType={activeAlertsCount > 0 ? "warning" : "positive"}
        icon={<AlertTriangle className="h-4 w-4" />}
        loading={isLoading}
        href="/alerts"
      />
    </div>
  );
}
```

**Responsive Behavior**:

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked cards |
| Tablet (640-1024px) | 2 columns for cards, single for charts |
| Desktop (>1024px) | Full layout as wireframe |

---

## 2. Portfolio Management

### 2.1 Portfolio List

**Route**: `/portfolios`

**Purpose**: Display all portfolios with key metrics, enabling filtering, sorting, and quick actions.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Portfolios                                     [+ New Portfolio] [Export] [...]     │
│  Manage your investment portfolios                                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [All Types ▼] [All Managers ▼] [Active Only ✓]        [Search portfolios...] 🔍││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ ○ │ Name              │ Type    │ Value      │ Daily │ YTD    │ Health │ ...│ ││
│  │ ├───┼───────────────────┼─────────┼────────────┼───────┼────────┼────────┼────┤ ││
│  │ │   │ Growth Equity     │ Managed │ $15.0M     │ +1.2% │ +14.5% │ A-     │ ⋮  │ ││
│  │ │   │ Portfolio         │         │            │   ▲   │   ▲    │        │    │ ││
│  │ ├───┼───────────────────┼─────────┼────────────┼───────┼────────┼────────┼────┤ ││
│  │ │   │ Income Fund       │ Managed │ $22.5M     │ +0.3% │ +8.2%  │ B+     │ ⋮  │ ││
│  │ │   │                   │         │            │   ▲   │   ▲    │        │    │ ││
│  │ ├───┼───────────────────┼─────────┼────────────┼───────┼────────┼────────┼────┤ ││
│  │ │   │ Balanced          │ Model   │ $7.7M      │ +0.8% │ +11.1% │ A      │ ⋮  │ ││
│  │ │   │ Portfolio         │         │            │   ▲   │   ▲    │        │    │ ││
│  │ ├───┼───────────────────┼─────────┼────────────┼───────┼────────┼────────┼────┤ ││
│  │ │   │ S&P 500 Index     │ Bench.  │ -          │ +0.9% │ +12.0% │ -      │ ⋮  │ ││
│  │ │   │                   │         │            │   ▲   │   ▲    │        │    │ ││
│  │ └─────────────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                                  ││
│  │  Showing 4 of 4 portfolios                        [< Prev] [1] [Next >]          ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/portfolios/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioTable } from "./elements/PortfolioTable";
import { PortfolioFilters } from "./elements/PortfolioFilters";
import { CreatePortfolioDialog } from "./elements/CreatePortfolioDialog";
import { usePortfolios } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function PortfoliosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Parse URL params for filters
  const filters = {
    type: searchParams.get("type") || undefined,
    managerId: searchParams.get("manager") || undefined,
    active: searchParams.get("active") !== "false",
    limit: parseInt(searchParams.get("limit") || "20"),
    offset: parseInt(searchParams.get("offset") || "0"),
    sort: searchParams.get("sort") || "-created_at",
  };

  const { data, isLoading, error } = usePortfolios(filters);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    router.push(`/portfolios?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolios"
        description="Manage your investment portfolios"
        actions={[
          {
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            onClick: () => {},
          },
          {
            label: "New Portfolio",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => setCreateDialogOpen(true),
          },
        ]}
      />

      <PortfolioFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <PortfolioTable
        portfolios={data?.portfolios || []}
        loading={isLoading}
        error={error}
        total={data?.total || 0}
        pagination={{
          page: Math.floor(filters.offset / filters.limit) + 1,
          pageSize: filters.limit,
          total: data?.total || 0,
          onPageChange: (page) =>
            handleFilterChange({ offset: (page - 1) * filters.limit }),
        }}
        onRowClick={(portfolio) => router.push(`/portfolios/${portfolio.id}`)}
      />

      <CreatePortfolioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
```

### 2.2 Portfolio Detail

**Route**: `/portfolios/[id]`

**Purpose**: Comprehensive view of a single portfolio including holdings, transactions, performance, and analytics.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Portfolios                                                                │
│                                                                                      │
│  Growth Equity Portfolio                                   [Edit] [Health Scan] [...] │
│  Managed by John Smith · Inception: Jan 2020 · Benchmark: S&P 500                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Total Value     │ │ Daily Return    │ │ YTD Return      │ │ Health Score    │    │
│  │ $15,000,000     │ │ +1.25%          │ │ +14.5%          │ │ A- (85/100)     │    │
│  │ 35 holdings     │ │ +$185,250       │ │ +2.5% vs bench. │ │ 2 warnings      │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Overview] [Holdings] [Transactions] [Analytics] [Settings]                      ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌────────────────────────────────────────┐ ┌────────────────────────────────────┐  │
│  │ Performance History                    │ │ Sector Allocation                  │  │
│  │                                        │ │                                    │  │
│  │   [1M] [3M] [6M] [1Y] [YTD] [ALL]     │ │      ┌──────────────────┐          │  │
│  │                                        │ │      │                  │          │  │
│  │    ╭───────────────────────╮           │ │      │   [PIE CHART]   │          │  │
│  │   ╱                         ╲          │ │      │                  │          │  │
│  │  ╱            ───────        ╲         │ │      └──────────────────┘          │  │
│  │ ╱   Portfolio ─────────       ╲        │ │                                    │  │
│  │╱    Benchmark                  ╲       │ │  Technology    42%  ████████████   │  │
│  │                                        │ │  Healthcare    18%  ██████         │  │
│  │                                        │ │  Financials    15%  █████          │  │
│  │                                        │ │  Consumer      12%  ████           │  │
│  │                                        │ │  Other         13%  ████           │  │
│  └────────────────────────────────────────┘ └────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Top Holdings                                                      [View All →]  ││
│  ├─────────────────────────────────────────────────────────────────────────────────┤│
│  │ Symbol │ Name             │ Shares │ Price   │ Value    │ Weight │ P&L    │ ...││
│  │────────┼──────────────────┼────────┼─────────┼──────────┼────────┼────────┼────││
│  │ AAPL   │ Apple Inc.       │ 10,000 │ $185.50 │ $1.85M   │ 12.3%  │ +$350K │ ⋮  ││
│  │ MSFT   │ Microsoft Corp.  │ 3,000  │ $400.25 │ $1.20M   │ 8.0%   │ +$180K │ ⋮  ││
│  │ NVDA   │ NVIDIA Corp.     │ 1,100  │ $875.00 │ $962.5K  │ 6.4%   │ +$450K │ ⋮  ││
│  │ GOOGL  │ Alphabet Inc.    │ 5,500  │ $145.00 │ $797.5K  │ 5.3%   │ +$85K  │ ⋮  ││
│  │ AMZN   │ Amazon.com Inc.  │ 4,000  │ $185.00 │ $740.0K  │ 4.9%   │ +$120K │ ⋮  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/portfolios/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PortfolioMetrics } from "./elements/PortfolioMetrics";
import { PerformanceChart } from "./elements/PerformanceChart";
import { SectorAllocation } from "./elements/SectorAllocation";
import { TopHoldings } from "./elements/TopHoldings";
import { ChevronLeft, Edit, Activity } from "lucide-react";
import { getPortfolio } from "@/api/portfolios";

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function PortfolioDetailPage({
  params,
  searchParams,
}: PageProps) {
  const portfolio = await getPortfolio(params.id, {
    includeValuation: true,
    includeHoldings: true,
  });

  if (!portfolio) {
    notFound();
  }

  const activeTab = searchParams.tab || "overview";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portfolios"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Portfolios
      </Link>

      {/* Header */}
      <PageHeader
        title={portfolio.name}
        description={`Managed by ${portfolio.manager?.name} · Inception: ${portfolio.inception_date} · Benchmark: ${portfolio.benchmark?.name || "None"}`}
        actions={[
          {
            label: "Edit",
            icon: <Edit className="h-4 w-4" />,
            variant: "outline",
            onClick: () => {},
          },
          {
            label: "Health Scan",
            icon: <Activity className="h-4 w-4" />,
            onClick: () => {},
          },
        ]}
      />

      {/* Key Metrics */}
      <PortfolioMetrics portfolio={portfolio} />

      {/* Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <PerformanceChart portfolioId={params.id} />
            </div>
            <div className="lg:col-span-2">
              <SectorAllocation portfolioId={params.id} />
            </div>
          </div>

          {/* Top Holdings */}
          <TopHoldings portfolioId={params.id} limit={5} />
        </TabsContent>

        <TabsContent value="holdings">
          <Suspense fallback={<div>Loading holdings...</div>}>
            <HoldingsTab portfolioId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="transactions">
          <Suspense fallback={<div>Loading transactions...</div>}>
            <TransactionsTab portfolioId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={<div>Loading analytics...</div>}>
            <AnalyticsTab portfolioId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings">
          <PortfolioSettingsTab portfolio={portfolio} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2.3 Holdings Tab

**Route**: `/portfolios/[id]/holdings`

**Purpose**: Detailed view of all holdings with sorting, filtering, and bulk actions.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Holdings                                          [+ Add Position] [Export] [...]   │
│  35 positions · $15M total value                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [All Sectors ▼] [All Tags ▼]                        [Search securities...] 🔍   ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ ☐ │ Symbol │ Name           │ Sector   │ Qty    │ Avg Cost │ Price   │ Value   ││
│  │   │        │                │          │        │          │         │         ││
│  │   │        │                │          │        │          │         │ Weight  ││
│  │   │        │                │          │        │          │         │ P&L     ││
│  ├───┼────────┼────────────────┼──────────┼────────┼──────────┼─────────┼─────────┤│
│  │ ☐ │ AAPL   │ Apple Inc.     │ Tech     │ 10,000 │ $150.25  │ $185.50 │ $1.85M  ││
│  │   │        │                │          │        │          │         │ 12.3%   ││
│  │   │        │                │          │        │          │         │ +$352K  ││
│  ├───┼────────┼────────────────┼──────────┼────────┼──────────┼─────────┼─────────┤│
│  │ ☐ │ MSFT   │ Microsoft      │ Tech     │ 3,000  │ $340.00  │ $400.25 │ $1.20M  ││
│  │   │        │ Corp.          │          │        │          │         │ 8.0%    ││
│  │   │        │                │          │        │          │         │ +$180K  ││
│  ├───┼────────┼────────────────┼──────────┼────────┼──────────┼─────────┼─────────┤│
│  │ ☐ │ NVDA   │ NVIDIA Corp.   │ Tech     │ 1,100  │ $450.00  │ $875.00 │ $962K   ││
│  │   │        │                │          │        │          │         │ 6.4%    ││
│  │   │        │                │          │        │          │         │ +$467K  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  [With selected: Analyze ▼]         [< Prev] Page 1 of 4 [Next >]                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/portfolios/[id]/holdings/elements/HoldingsTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PercentageChange } from "@/components/data-display/PercentageChange";
import { CurrencyDisplay } from "@/components/data-display/CurrencyDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import type { Holding } from "@/types/portfolio";

interface HoldingsTableProps {
  holdings: Holding[];
  loading?: boolean;
}

export function HoldingsTable({ holdings, loading }: HoldingsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Holding>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "security.ticker",
      header: "Symbol",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.security?.ticker}</div>
      ),
    },
    {
      accessorKey: "security.name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.security?.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.security?.sector}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {Number(row.original.quantity).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "cost_basis",
      header: "Avg Cost",
      cell: ({ row }) => (
        <CurrencyDisplay
          value={Number(row.original.cost_basis)}
          className="text-right"
        />
      ),
    },
    {
      accessorKey: "current_price",
      header: "Price",
      cell: ({ row }) => (
        <CurrencyDisplay
          value={Number(row.original.current_price)}
          className="text-right"
        />
      ),
    },
    {
      accessorKey: "market_value",
      header: () => <div className="text-right">Value / Weight / P&L</div>,
      cell: ({ row }) => {
        const pnl = Number(row.original.unrealized_pnl) || 0;
        const pnlPct = Number(row.original.unrealized_pnl_pct) || 0;

        return (
          <div className="text-right space-y-1">
            <CurrencyDisplay
              value={Number(row.original.market_value)}
              className="font-medium"
            />
            <div className="text-xs text-muted-foreground">
              {(Number(row.original.weight) * 100).toFixed(1)}%
            </div>
            <PercentageChange
              value={pnlPct}
              prefix={pnl >= 0 ? "+$" : "-$"}
              showValue={Math.abs(pnl)}
              size="sm"
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/analytics/securities/${row.original.security_id}`)
              }
            >
              View Ratios
            </DropdownMenuItem>
            <DropdownMenuItem>Add Transaction</DropdownMenuItem>
            <DropdownMenuItem>Set Alert</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: holdings,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No holdings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Analytics

### 3.1 Analytics Overview

**Route**: `/analytics`

**Purpose**: Provide a consolidated view of financial ratio analysis, health scores, and peer benchmarking across all portfolios.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Analytics                                                    [Run Health Scan] [...] │
│  Financial ratio analysis and benchmarking                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [All Portfolios ▼]                                                               ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Avg Health      │ │ Warnings        │ │ Critical        │ │ Holdings        │    │
│  │ Score           │ │                 │ │ Issues          │ │ Analyzed        │    │
│  │ B+ (82/100)     │ │ 15              │ │ 0               │ │ 105             │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Health by Ratio Class                                                            ││
│  │                                                                                  ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐││
│  │  │ Liquidity      [████████████░░░░░░░░] 85/100  A-   2 warnings              │││
│  │  │ Profitability  [██████████████░░░░░░] 92/100  A    0 issues                │││
│  │  │ Leverage       [██████████░░░░░░░░░░] 65/100  C+   8 warnings              │││
│  │  │ Utilization    [████████████████░░░░] 88/100  A    1 warning               │││
│  │  │ Valuation      [████████████░░░░░░░░] 78/100  B    4 warnings              │││
│  │  └─────────────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Issues Requiring Attention                                        [View All →]   ││
│  ├─────────────────────────────────────────────────────────────────────────────────┤│
│  │ Severity │ Security  │ Ratio        │ Value │ Threshold │ Message             ││
│  │──────────┼───────────┼──────────────┼───────┼───────────┼─────────────────────││
│  │ ⚠ Warn  │ AAPL      │ Debt/Equity  │ 1.81  │ > 1.0     │ Leverage elevated   ││
│  │ ⚠ Warn  │ MSFT      │ P/E Ratio    │ 35.2  │ > 30.0    │ Valuation high      ││
│  │ ⚠ Warn  │ GOOGL     │ Current Ratio│ 1.12  │ < 1.5     │ Liquidity tight     ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌────────────────────────────────────────┐ ┌────────────────────────────────────┐  │
│  │ Ratio Trends (30 Days)                 │ │ Peer Comparison                    │  │
│  │                                        │ │                                    │  │
│  │   [Select Ratio ▼]                     │ │   Portfolio vs Large Cap Tech     │  │
│  │                                        │ │                                    │  │
│  │    ╭───────────────────────╮           │ │   P/E:    [████░░░░░░] 42nd pctl  │  │
│  │   ╱                         ╲          │ │   ROE:    [████████░░] 78th pctl  │  │
│  │  ╱            ───────        ╲         │ │   D/E:    [██░░░░░░░░] 25th pctl  │  │
│  │ ╱   Average ─────────         ╲        │ │   Margin: [████████░░] 85th pctl  │  │
│  │╱                               ╲       │ │                                    │  │
│  └────────────────────────────────────────┘ └────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/analytics/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/data-display/StatCard";
import { HealthScoreBar } from "./elements/HealthScoreBar";
import { IssuesTable } from "./elements/IssuesTable";
import { RatioTrendChart } from "./elements/RatioTrendChart";
import { PeerComparisonChart } from "./elements/PeerComparisonChart";
import { usePortfolios } from "@/hooks/usePortfolio";
import { useHealthScan } from "@/hooks/useAnalytics";
import { Activity, AlertTriangle, AlertOctagon, BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");
  const { data: portfolios } = usePortfolios();

  // Aggregate health scan data for all portfolios or selected
  const portfolioIds =
    selectedPortfolio === "all"
      ? portfolios?.portfolios.map((p) => p.id) || []
      : [selectedPortfolio];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Financial ratio analysis and benchmarking"
        actions={[
          {
            label: "Run Health Scan",
            icon: <Activity className="h-4 w-4" />,
            onClick: () => {},
          },
        ]}
      />

      {/* Portfolio Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select portfolio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Portfolios</SelectItem>
            {portfolios?.portfolios.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Health Score"
          value="B+ (82/100)"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Warnings"
          value="15"
          icon={<AlertTriangle className="h-4 w-4" />}
          changeType="warning"
        />
        <StatCard
          title="Critical Issues"
          value="0"
          icon={<AlertOctagon className="h-4 w-4" />}
          changeType="positive"
        />
        <StatCard
          title="Holdings Analyzed"
          value="105"
          icon={<BarChart2 className="h-4 w-4" />}
        />
      </div>

      {/* Health by Ratio Class */}
      <Card>
        <CardHeader>
          <CardTitle>Health by Ratio Class</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <HealthScoreBar
            label="Liquidity"
            score={85}
            grade="A-"
            issues={2}
            issueSeverity="warning"
          />
          <HealthScoreBar
            label="Profitability"
            score={92}
            grade="A"
            issues={0}
          />
          <HealthScoreBar
            label="Leverage"
            score={65}
            grade="C+"
            issues={8}
            issueSeverity="warning"
          />
          <HealthScoreBar
            label="Utilization"
            score={88}
            grade="A"
            issues={1}
            issueSeverity="warning"
          />
          <HealthScoreBar
            label="Valuation"
            score={78}
            grade="B"
            issues={4}
            issueSeverity="warning"
          />
        </CardContent>
      </Card>

      {/* Issues Table */}
      <IssuesTable portfolioIds={portfolioIds} limit={5} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatioTrendChart portfolioId={selectedPortfolio} />
        <PeerComparisonChart portfolioId={selectedPortfolio} />
      </div>
    </div>
  );
}
```

### 3.2 Security Ratios Detail

**Route**: `/analytics/securities/[id]`

**Purpose**: Deep dive into all financial ratios for a specific security with historical trends and peer comparisons.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Analytics                                                                 │
│                                                                                      │
│  AAPL - Apple Inc.                                      [Benchmark] [Set Alert] [...] │
│  Technology · NASDAQ · $3.0T Market Cap                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Health Score    │ │ Peer Ranking    │ │ Trend           │ │ Warnings        │    │
│  │ A- (85/100)     │ │ Top 15%         │ │ Stable          │ │ 2               │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Liquidity] [Profitability] [Leverage] [Utilization] [Valuation]                 ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  LIQUIDITY RATIOS                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────┐ ││
│  │ │ Current Ratio           │ │ Quick Ratio             │ │ Cash Ratio          │ ││
│  │ │                         │ │                         │ │                     │ ││
│  │ │        1.04             │ │        0.92             │ │        0.35         │ ││
│  │ │                         │ │                         │ │                     │ ││
│  │ │ ▼ Peer: 1.25            │ │ ≈ Peer: 0.90            │ │ ▲ Peer: 0.28        │ ││
│  │ │ 45th percentile         │ │ 52nd percentile         │ │ 65th percentile     │ ││
│  │ │                         │ │                         │ │                     │ ││
│  │ │ Trend: Stable →         │ │ Trend: Improving ▲      │ │ Trend: Stable →     │ ││
│  │ │                         │ │                         │ │                     │ ││
│  │ │ ╭────────────────────╮  │ │ ╭────────────────────╮  │ │ ╭────────────────╮  │ ││
│  │ │ │  ─────────────     │  │ │ │    ───────────    │  │ │ │ ───────────    │  │ ││
│  │ │ ╰────────────────────╯  │ │ ╰────────────────────╯  │ │ ╰────────────────╯  │ ││
│  │ └─────────────────────────┘ └─────────────────────────┘ └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Historical Comparison                                                            ││
│  │                                                                                  ││
│  │ Ratio        │ Current │ 3M Ago │ 6M Ago │ 1Y Ago │ Trend    │ Peer Median     ││
│  │──────────────┼─────────┼────────┼────────┼────────┼──────────┼─────────────────││
│  │ Current Ratio│ 1.04    │ 1.02   │ 1.06   │ 1.08   │ Stable → │ 1.25            ││
│  │ Quick Ratio  │ 0.92    │ 0.88   │ 0.85   │ 0.80   │ Up ▲     │ 0.90            ││
│  │ Cash Ratio   │ 0.35    │ 0.33   │ 0.32   │ 0.30   │ Up ▲     │ 0.28            ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/analytics/securities/[id]/elements/RatioCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/data-display/TrendIndicator";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatioCardProps {
  name: string;
  value: number;
  peerMedian: number;
  percentile: number;
  trend: "improving" | "stable" | "declining";
  history: { date: string; value: number }[];
  format?: "decimal" | "percentage" | "ratio";
}

export function RatioCard({
  name,
  value,
  peerMedian,
  percentile,
  trend,
  history,
  format = "decimal",
}: RatioCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${(val * 100).toFixed(1)}%`;
      case "ratio":
        return `${val.toFixed(2)}x`;
      default:
        return val.toFixed(2);
    }
  };

  const vsPeer = value - peerMedian;
  const vsPeerPct = ((value - peerMedian) / peerMedian) * 100;

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case "declining":
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPercentileColor = () => {
    if (percentile >= 75) return "text-green-600";
    if (percentile >= 50) return "text-blue-600";
    if (percentile >= 25) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Value */}
        <div className="text-3xl font-bold">{formatValue(value)}</div>

        {/* Peer Comparison */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              vsPeer >= 0 ? "text-green-600" : "text-red-600",
              "flex items-center gap-1"
            )}
          >
            {vsPeer >= 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            Peer: {formatValue(peerMedian)}
          </span>
        </div>

        {/* Percentile */}
        <div className="text-sm">
          <span className={getPercentileColor()}>
            {percentile}th percentile
          </span>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Trend:</span>
          <span className="capitalize">{trend}</span>
          {getTrendIcon()}
        </div>

        {/* Sparkline */}
        <div className="h-12">
          <SparklineChart
            data={history.map((h) => ({ x: h.date, y: h.value }))}
            color={trend === "improving" ? "green" : trend === "declining" ? "red" : "blue"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Intelligence

### 4.1 Market Brief

**Route**: `/intelligence/briefs`

**Purpose**: Display AI-generated market intelligence briefs with portfolio-specific insights.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Market Intelligence                                      [Generate New] [History]   │
│  AI-powered market insights                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Daily Market Brief                                        Jan 7, 2026 · 7:00 AM ││
│  │ Personalized for: Growth Equity Portfolio                                        ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ 📊 MARKET OVERVIEW                                                               ││
│  │                                                                                  ││
│  │ US markets opened higher on Tuesday following strong manufacturing data.         ││
│  │ The S&P 500 gained 0.8% while the Nasdaq advanced 1.2%, led by semiconductor    ││
│  │ stocks reaching new highs. The VIX fell to 13.5, its lowest level in 3 months.  ││
│  │                                                                                  ││
│  │ Sentiment: Positive 📈                                      Relevance: 95%       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ 💻 TECHNOLOGY SECTOR                                                             ││
│  │                                                                                  ││
│  │ The technology sector continues to lead, with semiconductor stocks reaching     ││
│  │ new all-time highs. NVIDIA gained 4.2% on strong AI demand outlook. Apple       ││
│  │ announced expanded manufacturing in India, potentially reducing China risk.      ││
│  │                                                                                  ││
│  │ Portfolio Impact: HIGH - 42% of your portfolio is in technology                 ││
│  │                                                                                  ││
│  │ Sentiment: Positive 📈                                      Relevance: 92%       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ 📅 EARNINGS WATCH                                                                ││
│  │                                                                                  ││
│  │ 5 of your holdings report earnings this week:                                   ││
│  │   • AAPL - Wednesday after close (consensus: $2.10 EPS)                         ││
│  │   • MSFT - Thursday after close (consensus: $2.85 EPS)                          ││
│  │   • GOOGL - Thursday after close (consensus: $1.65 EPS)                         ││
│  │                                                                                  ││
│  │ Sentiment: Neutral ➡️                                       Relevance: 88%       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ 💡 KEY TAKEAWAYS                                                                 ││
│  │                                                                                  ││
│  │ • Market sentiment remains bullish with VIX at multi-month lows                 ││
│  │ • Your top holding AAPL reports Wednesday - consensus expects strong sales      ││
│  │ • Consider reviewing healthcare exposure given proposed regulatory changes       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ ⚡ ACTION ITEMS                                                                   ││
│  │                                                                                  ││
│  │ 🔴 HIGH: Review AAPL position ahead of earnings                                  ││
│  │    Stock has run up 15% into earnings, consider trimming                        ││
│  │                                                                                  ││
│  │ 🟡 MEDIUM: Monitor semiconductor positions                                       ││
│  │    Valuations stretched but momentum remains strong                             ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/intelligence/briefs/elements/MarketBrief.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Calendar,
} from "lucide-react";

interface BriefSection {
  title: string;
  icon: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  relevanceScore: number;
  portfolioImpact?: string;
}

interface ActionItem {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
}

interface MarketBriefProps {
  generatedAt: string;
  portfolioName?: string;
  sections: BriefSection[];
  keyTakeaways: string[];
  actionItems: ActionItem[];
}

export function MarketBrief({
  generatedAt,
  portfolioName,
  sections,
  keyTakeaways,
  actionItems,
}: MarketBriefProps) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "Positive";
      case "negative":
        return "Negative";
      default:
        return "Neutral";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Market Brief</CardTitle>
              <p className="text-sm text-muted-foreground">
                {portfolioName && `Personalized for: ${portfolioName}`}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">{generatedAt}</div>
          </div>
        </CardHeader>
      </Card>

      {/* Sections */}
      {sections.map((section, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{section.icon}</span>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{section.content}</p>

            {section.portfolioImpact && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Portfolio Impact: {section.portfolioImpact}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Sentiment:</span>
                <span className="flex items-center gap-1">
                  {getSentimentEmoji(section.sentiment)}
                  {getSentimentIcon(section.sentiment)}
                </span>
              </div>
              <div className="text-muted-foreground">
                Relevance: {section.relevanceScore}%
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Key Takeaways */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Key Takeaways</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Action Items</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "rounded-md border p-4",
                getPriorityColor(item.priority)
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "uppercase text-xs",
                    getPriorityColor(item.priority)
                  )}
                >
                  {item.priority}
                </Badge>
                <span className="font-medium">{item.action}</span>
              </div>
              <p className="text-sm">{item.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 Natural Language Query

**Route**: `/intelligence/query`

**Purpose**: Allow users to ask natural language questions about their portfolios and get AI-powered responses.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Portfolio Query                                                         [History]   │
│  Ask questions about your portfolio in plain English                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                                  ││
│  │  "What's my exposure to the technology sector?"                          [Ask]  ││
│  │                                                                                  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Suggested questions:                                                             ││
│  │                                                                                  ││
│  │ [Which holdings have the highest P/E ratios?]                                   ││
│  │ [How does my portfolio compare to the S&P 500?]                                 ││
│  │ [What are my most profitable positions this year?]                              ││
│  │ [Are any of my holdings exceeding their sector limits?]                         ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ╔═════════════════════════════════════════════════════════════════════════════════╗│
│  ║ RESPONSE                                                        Confidence: 95% ║│
│  ╠═════════════════════════════════════════════════════════════════════════════════╣│
│  ║                                                                                  ║│
│  ║ Your Growth Equity Portfolio has **40.2% exposure** to the technology sector,  ║│
│  ║ representing **$6.03M** of your $15M portfolio. This is allocated across 12     ║│
│  ║ holdings, with your largest positions being:                                    ║│
│  ║                                                                                  ║│
│  ║ 1. **Apple (AAPL)** - $1.85M (12.3%)                                           ║│
│  ║ 2. **Microsoft (MSFT)** - $1.20M (8.0%)                                        ║│
│  ║ 3. **NVIDIA (NVDA)** - $0.95M (6.3%)                                           ║│
│  ║                                                                                  ║│
│  ║ ⚠️ Your technology allocation exceeds your constraint limit of 40%, which may   ║│
│  ║ warrant attention.                                                               ║│
│  ║                                                                                  ║│
│  ╟─────────────────────────────────────────────────────────────────────────────────╢│
│  ║ DATA                                                                             ║│
│  ║                                                                                  ║│
│  ║ ┌─────────────────────────────────────────────────────────────────────────────┐ ║│
│  ║ │ Technology Holdings                                                          │ ║│
│  ║ ├───────────┬────────────────┬──────────────┬──────────────┐                  │ ║│
│  ║ │ Ticker    │ Name           │ Value        │ Weight       │                  │ ║│
│  ║ ├───────────┼────────────────┼──────────────┼──────────────┤                  │ ║│
│  ║ │ AAPL      │ Apple Inc.     │ $1.85M       │ 12.3%        │                  │ ║│
│  ║ │ MSFT      │ Microsoft      │ $1.20M       │ 8.0%         │                  │ ║│
│  ║ │ NVDA      │ NVIDIA         │ $0.95M       │ 6.3%         │                  │ ║│
│  ║ │ ...       │ ...            │ ...          │ ...          │                  │ ║│
│  ║ └───────────┴────────────────┴──────────────┴──────────────┘                  │ ║│
│  ║                                                                                  ║│
│  ╟─────────────────────────────────────────────────────────────────────────────────╢│
│  ║ FOLLOW-UP QUESTIONS                                                              ║│
│  ║                                                                                  ║│
│  ║ [How has my tech exposure changed over the last year?]                          ║│
│  ║ [Which tech holdings have the best performance?]                                ║│
│  ║ [Should I rebalance to meet my sector constraints?]                             ║│
│  ╚═════════════════════════════════════════════════════════════════════════════════╝│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// src/app/(dashboard)/intelligence/query/elements/QueryInterface.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryPortfolio } from "@/api/intelligence";
import { Send, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Which holdings have the highest P/E ratios?",
  "How does my portfolio compare to the S&P 500?",
  "What are my most profitable positions this year?",
  "Are any of my holdings exceeding their sector limits?",
];

export function QueryInterface() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["intelligence", "query", submittedQuestion],
    queryFn: () => queryPortfolio(submittedQuestion!),
    enabled: !!submittedQuestion,
  });

  const handleSubmit = () => {
    if (question.trim()) {
      setSubmittedQuestion(question.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setSubmittedQuestion(suggestion);
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Textarea
              placeholder="Ask a question about your portfolio..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Ask
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      {!submittedQuestion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suggested questions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">
                Analyzing your portfolio...
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && !isLoading && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Response</CardTitle>
              <Badge variant="secondary">
                Confidence: {Math.round(response.confidence * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Answer */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: response.answer.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </div>

            {/* Data Table (if available) */}
            {response.data?.top_holdings && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2">
                  <span className="text-sm font-medium">
                    {response.data.sector} Holdings
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Ticker</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-right">Value</th>
                      <th className="px-4 py-2 text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.data.top_holdings.map((holding: any) => (
                      <tr key={holding.ticker} className="border-t">
                        <td className="px-4 py-2 font-medium">
                          {holding.ticker}
                        </td>
                        <td className="px-4 py-2">{holding.name}</td>
                        <td className="px-4 py-2 text-right">
                          ${(holding.value / 1000000).toFixed(2)}M
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(holding.weight * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Follow-up Questions */}
            {response.follow_up_questions?.length > 0 && (
              <div className="border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Follow-up questions
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {response.follow_up_questions.map(
                    (followUp: string, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(followUp)}
                      >
                        {followUp}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 5. Alerts

### 5.1 Alerts List

**Route**: `/alerts`

**Purpose**: Centralized view of all alerts with filtering, acknowledgment, and threshold management.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Alerts                                             [Configure Thresholds] [Export]  │
│  Monitor ratio thresholds and anomalies                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                        │
│  │ Active          │ │ Warnings        │ │ Critical        │                        │
│  │ 15              │ │ 14              │ │ 1               │                        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Active ▼] [All Severities ▼] [All Portfolios ▼]        [Search alerts...] 🔍   ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ 🔴 CRITICAL                                                   2 hours ago   │ ││
│  │ │                                                                              │ ││
│  │ │ XYZ Corp: Debt/EBITDA at 4.5 (threshold: 4.0)                              │ ││
│  │ │ Portfolio: Growth Equity                                                    │ ││
│  │ │                                                                              │ ││
│  │ │ The company's leverage has increased significantly following their recent   │ ││
│  │ │ acquisition. While cash flows remain stable, the elevated debt levels       │ ││
│  │ │ warrant close monitoring.                                                   │ ││
│  │ │                                                                              │ ││
│  │ │ [Acknowledge]  [View Security]  [Dismiss]                                   │ ││
│  │ └─────────────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                                  ││
│  │ ┌─────────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ 🟡 WARNING                                                    4 hours ago   │ ││
│  │ │                                                                              │ ││
│  │ │ AAPL: Debt/Equity at 1.81 (threshold: 1.0)                                 │ ││
│  │ │ Portfolio: Growth Equity                                                    │ ││
│  │ │                                                                              │ ││
│  │ │ Apple's debt levels have increased due to recent bond issuances for share  │ ││
│  │ │ buybacks. While leverage is elevated, the company maintains strong cash     │ ││
│  │ │ flows and interest coverage, suggesting manageable risk.                    │ ││
│  │ │                                                                              │ ││
│  │ │ [Acknowledge]  [View Security]  [Dismiss]                                   │ ││
│  │ └─────────────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                                  ││
│  │ ┌─────────────────────────────────────────────────────────────────────────────┐ ││
│  │ │ 🟡 WARNING                                                    Yesterday    │ ││
│  │ │                                                                              │ ││
│  │ │ MSFT: P/E Ratio at 35.2 (threshold: 30.0)                                  │ ││
│  │ │ Portfolio: Growth Equity                                                    │ ││
│  │ │                                                                              │ ││
│  │ │ [Acknowledge]  [View Security]  [Dismiss]                                   │ ││
│  │ └─────────────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  [< Prev] Page 1 of 3 [Next >]                                                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Settings

### 6.1 Settings Overview

**Route**: `/settings`

**Purpose**: Centralized user preferences and account settings.

**Sub-Routes**:
- `/settings/profile` - User profile
- `/settings/preferences` - Display preferences
- `/settings/notifications` - Notification channels
- `/settings/integrations` - Data provider connections

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                            │
│  Manage your account and preferences                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Profile] [Preferences] [Notifications] [Integrations]                           ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  PROFILE                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                                  ││
│  │  ┌─────────┐                                                                     ││
│  │  │         │  John Smith                                                         ││
│  │  │  [IMG]  │  john@example.com                                                  ││
│  │  │         │  Investment Manager                                                 ││
│  │  └─────────┘                                                                     ││
│  │                                                                                  ││
│  │  ─────────────────────────────────────────────────────────────────────          ││
│  │                                                                                  ││
│  │  Name                                                                            ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐││
│  │  │ John Smith                                                                   │││
│  │  └─────────────────────────────────────────────────────────────────────────────┘││
│  │                                                                                  ││
│  │  Email                                                                           ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐││
│  │  │ john@example.com                                                             │││
│  │  └─────────────────────────────────────────────────────────────────────────────┘││
│  │                                                                                  ││
│  │  Timezone                                                                        ││
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐││
│  │  │ America/New_York (EST)                                             [▼]      │││
│  │  └─────────────────────────────────────────────────────────────────────────────┘││
│  │                                                                                  ││
│  │                                                          [Cancel]  [Save Changes]││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Admin

### 7.1 User Management

**Route**: `/admin/users`

**Authorization**: `admin` role only

**Purpose**: Manage users within the tenant including invitations, role assignments, and deactivation.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  User Management                                                      [+ Invite User] │
│  Manage team members and permissions                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                        │
│  │ Total Users     │ │ Active          │ │ Pending         │                        │
│  │ 8               │ │ 7               │ │ 1               │                        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [All Roles ▼] [All Status ▼]                            [Search users...] 🔍    ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ User              │ Email                 │ Role           │ Status │ Actions   ││
│  │───────────────────┼───────────────────────┼────────────────┼────────┼───────────││
│  │ ○ John Smith      │ john@example.com      │ Admin          │ Active │ ⋮         ││
│  │ ○ Jane Doe        │ jane@example.com      │ Inv. Manager   │ Active │ ⋮         ││
│  │ ○ Bob Johnson     │ bob@example.com       │ Family Office  │ Active │ ⋮         ││
│  │ ○ Alice Williams  │ alice@example.com     │ Analyst        │ Active │ ⋮         ││
│  │ ○ New User        │ newuser@example.com   │ Viewer         │ Pending│ ⋮         ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Audit Log

**Route**: `/admin/audit`

**Authorization**: `admin` or `compliance` role

**Purpose**: Review audit trail of all user actions for compliance and security monitoring.

**Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Audit Log                                                               [Export]    │
│  Review user activity and system events                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [All Users ▼] [All Actions ▼] [Date Range: Last 7 Days ▼]  [Search...] 🔍       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ Timestamp          │ User         │ Action  │ Entity       │ Details    │ IP    ││
│  │────────────────────┼──────────────┼─────────┼──────────────┼────────────┼───────││
│  │ Today 2:30 PM      │ John Smith   │ CREATE  │ Transaction  │ Bought...  │ 192...││
│  │ Today 2:15 PM      │ John Smith   │ UPDATE  │ Portfolio    │ Changed... │ 192...││
│  │ Today 10:00 AM     │ Jane Doe     │ READ    │ Analytics    │ Viewed...  │ 10....││
│  │ Yesterday 4:30 PM  │ Bob Johnson  │ CREATE  │ Alert        │ New thre...│ 172...││
│  │ Yesterday 9:00 AM  │ System       │ EXECUTE │ Sync Job     │ Price syn..│ -     ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  [< Prev] Page 1 of 50 [Next >]                                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Checklist

### Phase 1: Core Screens (Week 1-2)

- [ ] **SCREEN-001**: Dashboard page with QuickMetrics
- [ ] **SCREEN-002**: Dashboard PerformanceChart
- [ ] **SCREEN-003**: Dashboard AllocationChart
- [ ] **SCREEN-004**: Dashboard AlertsWidget
- [ ] **SCREEN-005**: Dashboard RecentActivity
- [ ] **SCREEN-006**: Dashboard PortfolioSummaryTable

### Phase 2: Portfolio Management (Week 3-4)

- [ ] **SCREEN-007**: Portfolio list page with filters
- [ ] **SCREEN-008**: Portfolio detail page with tabs
- [ ] **SCREEN-009**: Holdings tab with HoldingsTable
- [ ] **SCREEN-010**: Transactions tab with TransactionTable
- [ ] **SCREEN-011**: CreatePortfolioDialog
- [ ] **SCREEN-012**: AddTransactionDialog

### Phase 3: Analytics (Week 5-6)

- [ ] **SCREEN-013**: Analytics overview page
- [ ] **SCREEN-014**: HealthScoreBar components
- [ ] **SCREEN-015**: IssuesTable component
- [ ] **SCREEN-016**: Security ratios detail page
- [ ] **SCREEN-017**: RatioCard components
- [ ] **SCREEN-018**: PeerComparisonChart

### Phase 4: Intelligence (Week 7-8)

- [ ] **SCREEN-019**: Market briefs page
- [ ] **SCREEN-020**: MarketBrief component
- [ ] **SCREEN-021**: BriefSection component
- [ ] **SCREEN-022**: Query interface page
- [ ] **SCREEN-023**: QueryInterface component
- [ ] **SCREEN-024**: QueryResponse component

### Phase 5: Alerts & Settings (Week 9-10)

- [ ] **SCREEN-025**: Alerts list page
- [ ] **SCREEN-026**: AlertCard component
- [ ] **SCREEN-027**: ThresholdConfigDialog
- [ ] **SCREEN-028**: Settings profile page
- [ ] **SCREEN-029**: Settings preferences page
- [ ] **SCREEN-030**: Settings notifications page
- [ ] **SCREEN-031**: Settings integrations page

### Phase 6: Admin (Week 11-12)

- [ ] **SCREEN-032**: User management page
- [ ] **SCREEN-033**: InviteUserDialog
- [ ] **SCREEN-034**: UserRoleDialog
- [ ] **SCREEN-035**: Tenant settings page
- [ ] **SCREEN-036**: Audit log page

---

## 9. Acceptance Criteria

### All Screens

- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Loading states with skeletons
- [ ] Error states with retry actions
- [ ] Empty states with guidance
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

### Performance

- [ ] Initial load < 2 seconds
- [ ] Route transitions < 500ms
- [ ] No layout shift (CLS < 0.1)
- [ ] Smooth scrolling and animations

### User Experience

- [ ] Consistent navigation patterns
- [ ] Clear visual hierarchy
- [ ] Appropriate feedback for actions
- [ ] Undo capability for destructive actions
