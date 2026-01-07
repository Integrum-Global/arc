# ARC Web Frontend - Component Library

## Overview

This document defines the reusable React component library for the ARC investment management platform using Shadcn UI as the foundation.

---

## 1. Design System Foundation

### 1.1 Theme Configuration

**File**: `apps/web/src/lib/theme.ts`

```typescript
export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    // Semantic colors
    success: {
      light: '#dcfce7',
      main: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      light: '#fef9c3',
      main: '#eab308',
      dark: '#a16207',
    },
    danger: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#b91c1c',
    },
    // Financial colors
    positive: '#22c55e',  // Gains
    negative: '#ef4444',  // Losses
    neutral: '#6b7280',   // Unchanged
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
};

export type Theme = typeof theme;
```

### 1.2 Typography Scale

```typescript
// apps/web/src/lib/typography.ts
export const typography = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',
  body: 'text-base',
  bodySmall: 'text-sm',
  caption: 'text-xs text-muted-foreground',
  mono: 'font-mono text-sm',
};
```

---

## 2. Layout Components

### 2.1 PageContainer

**File**: `apps/web/src/components/layout/PageContainer.tsx`

```tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  title,
  subtitle,
  actions,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div className={cn(
      'flex flex-col min-h-screen',
      !fullWidth && 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      className
    )}>
      {(title || actions) && (
        <header className="py-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-foreground">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </header>
      )}
      <main className="flex-1 py-6">
        {children}
      </main>
    </div>
  );
}
```

### 2.2 Card

**File**: `apps/web/src/components/ui/Card.tsx`

```tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-card border',
  outlined: 'border-2',
  elevated: 'bg-card shadow-md',
};

export function Card({
  children,
  title,
  subtitle,
  actions,
  className,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <div className={cn(
      'rounded-lg',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
```

### 2.3 Grid

```tsx
// apps/web/src/components/layout/Grid.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function Grid({
  children,
  cols = 3,
  gap = 'md',
  className,
}: GridProps) {
  return (
    <div className={cn(
      'grid',
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}
```

---

## 3. Data Display Components

### 3.1 StatCard

**File**: `apps/web/src/components/data/StatCard.tsx`

```tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'currency' | 'percentage';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
  size = 'md',
  className,
}: StatCardProps) {
  const formattedValue = formatValue(value, variant);
  const changeColor = change
    ? change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
    : undefined;

  const ChangeIcon = change
    ? change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
    : null;

  const sizeClasses = {
    sm: { value: 'text-xl', label: 'text-xs' },
    md: { value: 'text-2xl', label: 'text-sm' },
    lg: { value: 'text-3xl', label: 'text-base' },
  };

  return (
    <div className={cn(
      'bg-card rounded-lg border p-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-muted-foreground',
          sizeClasses[size].label
        )}>
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>

      <div className="mt-2">
        <span className={cn(
          'font-bold',
          sizeClasses[size].value
        )}>
          {formattedValue}
        </span>
      </div>

      {change !== undefined && (
        <div className={cn(
          'flex items-center mt-2 text-sm',
          changeColor
        )}>
          {ChangeIcon && <ChangeIcon className="w-4 h-4 mr-1" />}
          <span>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="ml-1 text-muted-foreground">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(value: string | number, variant: string): string {
  if (typeof value === 'string') return value;

  switch (variant) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}
```

### 3.2 RatioCard

**File**: `apps/web/src/components/data/RatioCard.tsx`

```tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RatioCardProps {
  name: string;
  value: number | null;
  percentile?: number;
  trend?: 'up' | 'down' | 'stable';
  benchmark?: {
    label: string;
    value: number;
  };
  format?: 'decimal' | 'percentage' | 'multiple';
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
};

export function RatioCard({
  name,
  value,
  percentile,
  trend,
  benchmark,
  format = 'decimal',
  className,
}: RatioCardProps) {
  const formattedValue = formatRatio(value, format);
  const TrendIcon = trend ? trendIcons[trend] : null;

  const getPercentileColor = (p: number) => {
    if (p >= 75) return 'bg-green-500';
    if (p >= 50) return 'bg-blue-500';
    if (p >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn(
      'bg-card rounded-lg border p-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{name}</span>
        {trend && TrendIcon && (
          <TrendIcon className={cn('w-4 h-4', trendColors[trend])} />
        )}
      </div>

      <div className="mt-2">
        <span className="text-2xl font-bold">
          {formattedValue}
        </span>
      </div>

      {percentile !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Percentile</span>
            <Badge variant="outline" className="text-xs">
              {percentile}th
            </Badge>
          </div>
          <Progress
            value={percentile}
            className="h-2"
            indicatorClassName={getPercentileColor(percentile)}
          />
        </div>
      )}

      {benchmark && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{benchmark.label}</span>
            <span className="font-medium">
              {formatRatio(benchmark.value, format)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRatio(value: number | null, format: string): string {
  if (value === null) return 'N/A';

  switch (format) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'multiple':
      return `${value.toFixed(1)}x`;
    default:
      return value.toFixed(2);
  }
}
```

### 3.3 AlertCard

**File**: `apps/web/src/components/data/AlertCard.tsx`

```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

interface AlertCardProps {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  security?: {
    ticker: string;
    name: string;
  };
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600',
  },
  high: {
    icon: AlertCircle,
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600',
  },
  medium: {
    icon: AlertCircle,
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600',
  },
  low: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600',
  },
  info: {
    icon: CheckCircle,
    bg: 'bg-gray-50 dark:bg-gray-900',
    border: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-600',
  },
};

export function AlertCard({
  id,
  title,
  message,
  severity,
  timestamp,
  security,
  onAcknowledge,
  onDismiss,
  className,
}: AlertCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5', config.iconColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDismiss(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {message}
          </p>

          {security && (
            <p className="text-xs text-muted-foreground mt-2">
              {security.ticker} - {security.name}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(timestamp)}
            </span>
            {onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(id)}
              >
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
```

### 3.4 HoldingRow

**File**: `apps/web/src/components/data/HoldingRow.tsx`

```tsx
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HoldingRowProps {
  ticker: string;
  name: string;
  quantity: number;
  price: number;
  marketValue: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
  costBasis: number;
  unrealizedPL: number;
  onClick?: () => void;
  className?: string;
}

export function HoldingRow({
  ticker,
  name,
  quantity,
  price,
  marketValue,
  weight,
  dayChange,
  dayChangePercent,
  costBasis,
  unrealizedPL,
  onClick,
  className,
}: HoldingRowProps) {
  const isPositive = dayChange >= 0;
  const isUnrealizedPositive = unrealizedPL >= 0;

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0',
        className
      )}
      onClick={onClick}
    >
      {/* Security Info */}
      <div className="col-span-3">
        <div className="font-medium">{ticker}</div>
        <div className="text-sm text-muted-foreground truncate">{name}</div>
      </div>

      {/* Quantity & Price */}
      <div className="col-span-2 text-right">
        <div className="font-medium">{formatNumber(quantity)}</div>
        <div className="text-sm text-muted-foreground">
          @ ${formatNumber(price, 2)}
        </div>
      </div>

      {/* Market Value & Weight */}
      <div className="col-span-2 text-right">
        <div className="font-medium">${formatNumber(marketValue)}</div>
        <Badge variant="outline" className="text-xs">
          {weight.toFixed(1)}%
        </Badge>
      </div>

      {/* Day Change */}
      <div className={cn(
        'col-span-2 text-right flex items-center justify-end gap-1',
        isPositive ? 'text-green-600' : 'text-red-600'
      )}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <div>
          <div className="font-medium">
            {isPositive ? '+' : ''}{formatNumber(dayChange, 2)}
          </div>
          <div className="text-sm">
            ({isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Unrealized P&L */}
      <div className={cn(
        'col-span-3 text-right',
        isUnrealizedPositive ? 'text-green-600' : 'text-red-600'
      )}>
        <div className="font-medium">
          {isUnrealizedPositive ? '+' : ''}${formatNumber(unrealizedPL)}
        </div>
        <div className="text-sm text-muted-foreground">
          Cost: ${formatNumber(costBasis)}
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
```

---

## 4. Chart Components

### 4.1 AllocationChart

**File**: `apps/web/src/components/charts/AllocationChart.tsx`

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AllocationData {
  name: string;
  value: number;
  color?: string;
}

interface AllocationChartProps {
  data: AllocationData[];
  title?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function AllocationChart({
  data,
  title,
  showLegend = true,
  showLabels = false,
  innerRadius = 60,
  outerRadius = 100,
  height = 300,
}: AllocationChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = ({ name, percent }: any) => {
    if (!showLabels || percent < 0.05) return null;
    return `${name} (${(percent * 100).toFixed(1)}%)`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            ${item.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            label={showLabels ? renderLabel : false}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 4.2 PerformanceChart

**File**: `apps/web/src/components/charts/PerformanceChart.tsx`

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PerformanceData {
  date: string;
  value: number;
  benchmark?: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  showBenchmark?: boolean;
  benchmarkLabel?: string;
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export function PerformanceChart({
  data,
  title,
  showBenchmark = false,
  benchmarkLabel = 'Benchmark',
  height = 300,
  showGrid = true,
  animate = true,
}: PerformanceChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <p className="text-sm text-primary">
            Portfolio: {formatValue(payload[0].value)}
          </p>
          {showBenchmark && payload[1] && (
            <p className="text-sm text-muted-foreground">
              {benchmarkLabel}: {formatValue(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          )}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickFormatter={formatValue}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--muted))" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
          />
          {showBenchmark && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={animate}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 4.3 RatioTrendChart

**File**: `apps/web/src/components/charts/RatioTrendChart.tsx`

```tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface RatioTrendData {
  date: string;
  value: number;
}

interface RatioTrendChartProps {
  data: RatioTrendData[];
  ratioName: string;
  thresholds?: {
    lower?: number;
    upper?: number;
  };
  format?: 'decimal' | 'percentage' | 'multiple';
  height?: number;
}

export function RatioTrendChart({
  data,
  ratioName,
  thresholds,
  format = 'decimal',
  height = 200,
}: RatioTrendChartProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'multiple':
        return `${value.toFixed(1)}x`;
      default:
        return value.toFixed(2);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Determine color based on trend
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositive = lastValue >= firstValue;
  const gradientId = `gradient-${ratioName.replace(/\s/g, '')}`;

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{ratioName}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={50}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), ratioName]}
            labelFormatter={formatDate}
          />
          {thresholds?.lower && (
            <ReferenceLine
              y={thresholds.lower}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Lower', fontSize: 10, fill: '#ef4444' }}
            />
          )}
          {thresholds?.upper && (
            <ReferenceLine
              y={thresholds.upper}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{ value: 'Upper', fontSize: 10, fill: '#22c55e' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 5. Intelligence Components

### 5.1 ChatMessage

**File**: `apps/web/src/components/intelligence/ChatMessage.tsx`

```tsx
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  confidence?: number;
  sources?: string[];
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isLoading,
  confidence,
  sources,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      'flex gap-3 py-4',
      isUser && 'flex-row-reverse'
    )}>
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn(
        'flex-1 space-y-2',
        isUser && 'text-right'
      )}>
        <div className={cn(
          'inline-block rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <div className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              isUser && 'prose-invert'
            )}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && confidence !== undefined && (
          <div className="text-xs text-muted-foreground">
            Confidence: {(confidence * 100).toFixed(0)}%
          </div>
        )}

        {!isUser && sources && sources.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Sources: {sources.join(', ')}
          </div>
        )}

        {timestamp && (
          <div className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.2 QueryInput

**File**: `apps/web/src/components/intelligence/QueryInput.tsx`

```tsx
import { useState, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Sparkles } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export function QueryInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Ask about your portfolio...',
  suggestions = [],
  className,
}: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setQuery(suggestion)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[80px] pr-10 resize-none"
            rows={2}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2"
            disabled={isLoading}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          size="icon"
          className="h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 5.3 MarketBriefCard

**File**: `apps/web/src/components/intelligence/MarketBriefCard.tsx`

```tsx
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  Share2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BriefSection {
  title: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number;
}

interface MarketBriefCardProps {
  type: 'daily' | 'weekly';
  generatedAt: string;
  sections: BriefSection[];
  keyTakeaways: string[];
  actionItems: string[];
  onRefresh?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
  className?: string;
}

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  neutral: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-50' },
  negative: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
};

export function MarketBriefCard({
  type,
  generatedAt,
  sections,
  keyTakeaways,
  actionItems,
  onRefresh,
  onDownload,
  onShare,
  isLoading,
  className,
}: MarketBriefCardProps) {
  return (
    <Card
      className={cn('', className)}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Market Brief`}
      subtitle={`Generated ${new Date(generatedAt).toLocaleString()}`}
      actions={
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          {onShare && (
            <Button variant="ghost" size="icon" onClick={onShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sections */}
        {sections.map((section, index) => {
          const sentiment = sentimentConfig[section.sentiment];
          const SentimentIcon = sentiment.icon;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  {section.title}
                  <SentimentIcon className={cn('w-4 h-4', sentiment.color)} />
                </h4>
                <Badge variant="outline" className="text-xs">
                  {Math.round(section.relevanceScore * 100)}% relevant
                </Badge>
              </div>
              <div className={cn('rounded-lg p-3', sentiment.bg)}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Key Takeaways</h4>
            <ul className="space-y-1">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Suggested Actions</h4>
            <ul className="space-y-2">
              {actionItems.map((action, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg px-3 py-2"
                >
                  <span className="font-medium text-primary">{index + 1}.</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## 6. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up theme configuration
- [ ] Configure typography scale
- [ ] Implement `PageContainer` layout
- [ ] Implement `Card` component
- [ ] Implement `Grid` layout

### Phase 2: Data Display
- [ ] Implement `StatCard` with variants
- [ ] Implement `RatioCard` with percentile
- [ ] Implement `AlertCard` with severity
- [ ] Implement `HoldingRow` for tables

### Phase 3: Charts
- [ ] Implement `AllocationChart` (pie)
- [ ] Implement `PerformanceChart` (line)
- [ ] Implement `RatioTrendChart` (area)
- [ ] Add chart loading states

### Phase 4: Intelligence
- [ ] Implement `ChatMessage` with markdown
- [ ] Implement `QueryInput` with suggestions
- [ ] Implement `MarketBriefCard`
- [ ] Add streaming support for AI responses

### Phase 5: Integration
- [ ] Connect components to React Query hooks
- [ ] Add error states to all components
- [ ] Add loading skeletons
- [ ] Implement responsive variants
