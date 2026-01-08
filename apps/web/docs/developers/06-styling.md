# Styling Guide

## Overview

ARC uses TailwindCSS 4.x with CSS custom properties for theming and Shadcn/ui for consistent component styling.

## CSS Architecture

### Global Styles

Located in `src/app/globals.css`:

```css
@import "tailwindcss";

/* CSS Custom Properties for Theming */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### Financial Colors

Additional semantic colors for financial data:

```css
:root {
  /* Performance Colors */
  --positive: 142.1 76.2% 36.3%;      /* Green for gains */
  --negative: 0 84.2% 60.2%;           /* Red for losses */
  --neutral: 215.4 16.3% 46.9%;        /* Gray for no change */

  /* Alert Severity */
  --alert-info: 221.2 83.2% 53.3%;     /* Blue */
  --alert-warning: 38.3 92.1% 50.2%;   /* Amber */
  --alert-critical: 0 84.2% 60.2%;     /* Red */

  /* Health Score */
  --health-good: 142.1 76.2% 36.3%;
  --health-fair: 38.3 92.1% 50.2%;
  --health-poor: 0 84.2% 60.2%;
}
```

## Tailwind Utilities

### Responsive Breakpoints

```typescript
// Default Tailwind breakpoints
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

Usage:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 col mobile, 2 cols tablet, 4 cols desktop */}
</div>
```

### Common Patterns

**Card with hover effect:**
```tsx
<div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
  {/* Content */}
</div>
```

**Responsive text:**
```tsx
<h1 className="text-xl font-bold md:text-2xl lg:text-3xl">
  Title
</h1>
```

**Flexbox layouts:**
```tsx
<div className="flex items-center justify-between gap-4">
  <span>Label</span>
  <span>Value</span>
</div>
```

**Grid layouts:**
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

## Component Styling

### cn() Utility

Combine class names with conditional logic:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage:
```tsx
import { cn } from "@/lib/utils";

<div
  className={cn(
    "rounded-lg p-4",
    isActive && "bg-primary text-primary-foreground",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  {/* Content */}
</div>
```

### Variant Pattern

Using class-variance-authority (cva):

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
```

## Financial Value Styling

### Performance Colors

```tsx
function getPerformanceColor(value: number): string {
  if (value > 0) return "text-green-600 dark:text-green-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

<span className={getPerformanceColor(change)}>
  {change >= 0 ? "+" : ""}{change}%
</span>
```

### Status Badges

```tsx
function getStatusColor(status: "good" | "warning" | "critical") {
  switch (status) {
    case "good":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}
```

## Dark Mode

### Implementation

The app uses a ThemeProvider for dark mode support:

```tsx
// src/providers/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Using Dark Mode Classes

Always include dark mode variants:

```tsx
// Both light and dark variants
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Content</p>
</div>

// Using CSS custom properties (preferred)
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Content</p>
</div>
```

## Animation

### Transitions

```tsx
// Smooth color transitions
<button className="transition-colors hover:bg-primary/90">
  Click me
</button>

// Multiple properties
<div className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
  Card
</div>
```

### Loading States

```tsx
// Skeleton loading
<div className="animate-pulse rounded bg-muted h-4 w-full" />

// Spinner
<div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
```

## Best Practices

1. **Use semantic color variables** (`bg-card`, `text-foreground`) over raw colors
2. **Always include dark mode variants** when using raw colors
3. **Use the `cn()` utility** for conditional classes
4. **Keep component classes organized** - layout, typography, colors, effects
5. **Avoid inline styles** - use Tailwind utilities instead
6. **Test at all breakpoints** - mobile, tablet, desktop
