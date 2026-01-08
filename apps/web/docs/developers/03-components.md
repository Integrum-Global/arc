# Component Library

## Overview

The ARC web frontend uses a layered component architecture:

1. **UI Primitives** - Shadcn/ui base components
2. **Layout Components** - App structure patterns
3. **Data Components** - Business data display
4. **Chart Components** - Data visualization

## UI Primitives (Shadcn/ui)

Located in `src/components/ui/`, these are the base building blocks:

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Tabs
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## Layout Components

### PageContainer
Wraps page content with consistent header and loading states.

```tsx
import { PageContainer } from "@/components/layout";

<PageContainer
  title="Portfolio Overview"
  subtitle="View your investment performance"
  actions={<Button>Export</Button>}
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Portfolios" }
  ]}
  isLoading={isLoading}
>
  {/* Page content */}
</PageContainer>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| title | string | Page title |
| subtitle | string? | Optional subtitle |
| actions | ReactNode? | Action buttons |
| breadcrumbs | Breadcrumb[]? | Breadcrumb items |
| isLoading | boolean? | Show loading state |

### Grid
Responsive grid system with breakpoint-aware columns.

```tsx
import { Grid } from "@/components/layout";

<Grid cols={{ default: 1, md: 2, lg: 4 }} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</Grid>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| cols | number \| ResponsiveCols | Column count |
| gap | "sm" \| "md" \| "lg" | Gap size |

### Section
Collapsible content section with optional styling.

```tsx
import { Section } from "@/components/layout";

<Section
  title="Financial Ratios"
  subtitle="Key metrics for analysis"
  collapsible
  defaultCollapsed={false}
  bordered
  padded
>
  {/* Section content */}
</Section>
```

## Data Components

### StatCard
Display key metrics with trend indicators.

```tsx
import { StatCard } from "@/components/data";

<StatCard
  title="Total Value"
  value={1234567.89}
  format="currency"
  change={2.5}
  changeFormat="percent"
  trend="up"
  icon={<DollarSign />}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| title | string | Metric title |
| value | number | Primary value |
| format | "currency" \| "percent" \| "number" \| "ratio" | Value format |
| change | number? | Change value |
| changeFormat | string? | Change format |
| trend | "up" \| "down" \| "neutral"? | Trend direction |

### RatioCard
Display financial ratios with threshold status.

```tsx
import { RatioCard } from "@/components/data";

<RatioCard
  name="Current Ratio"
  value={1.85}
  status="good"
  threshold={{ warning: 1.5, critical: 1.0 }}
  sparkline={[1.2, 1.4, 1.6, 1.7, 1.85]}
  onClick={() => openDetail()}
/>
```

### AlertCard
Display alert/notification with severity and actions.

```tsx
import { AlertCard } from "@/components/data";

<AlertCard
  alert={{
    id: "1",
    title: "Current Ratio Below Threshold",
    message: "AAPL current ratio has dropped below warning level",
    severity: "warning",
    timestamp: "2024-01-15T10:30:00Z",
    acknowledged: false
  }}
  onAcknowledge={handleAcknowledge}
  onDismiss={handleDismiss}
/>
```

### DataTable
Generic data table with sorting and filtering.

```tsx
import { DataTable } from "@/components/data";

<DataTable
  columns={[
    { key: "ticker", header: "Ticker", sortable: true },
    { key: "name", header: "Name" },
    { key: "value", header: "Value", format: "currency", align: "right" }
  ]}
  data={holdings}
  sortBy="value"
  sortOrder="desc"
  onSort={handleSort}
/>
```

## Chart Components

### PerformanceChart
Line chart for portfolio/security performance over time.

```tsx
import { PerformanceChart } from "@/components/charts";

<PerformanceChart
  data={performanceData}
  showBenchmark
  benchmarkData={benchmarkData}
  period="1Y"
  height={300}
/>
```

### AllocationChart
Pie/donut chart for allocation breakdowns.

```tsx
import { AllocationChart } from "@/components/charts";

<AllocationChart
  data={[
    { name: "Technology", value: 35, color: "#3b82f6" },
    { name: "Healthcare", value: 25, color: "#22c55e" },
    { name: "Finance", value: 20, color: "#f59e0b" }
  ]}
  type="donut"
  showLegend
  showLabels
/>
```

### GaugeChart
Gauge visualization for scores and ratings.

```tsx
import { GaugeChart } from "@/components/charts";

<GaugeChart
  value={85}
  min={0}
  max={100}
  thresholds={[
    { value: 60, color: "#ef4444", label: "Poor" },
    { value: 80, color: "#f59e0b", label: "Fair" },
    { value: 100, color: "#22c55e", label: "Good" }
  ]}
  label="Health Score"
/>
```

### Heatmap
Matrix visualization for correlations or ratios.

```tsx
import { Heatmap } from "@/components/charts";

<Heatmap
  data={correlationMatrix}
  xLabels={securities}
  yLabels={securities}
  colorScale="correlation"
  showValues
/>
```

## Best Practices

1. **Always handle loading states**
```tsx
if (isLoading) return <Skeleton className="h-24 w-full" />;
```

2. **Handle empty states**
```tsx
if (!data || data.length === 0) {
  return <EmptyState message="No holdings found" />;
}
```

3. **Use TypeScript generics for reusable components**
```tsx
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}
```

4. **Memoize expensive computations**
```tsx
const processedData = useMemo(() =>
  data.map(transformFn),
  [data]
);
```
