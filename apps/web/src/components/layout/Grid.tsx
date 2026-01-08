/**
 * Grid System Components
 *
 * A flexible grid system using CSS Grid with Tailwind classes.
 * Supports responsive columns and custom gaps.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Column count type (1-12)
 */
export type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Gap size options
 */
export type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Responsive columns configuration
 */
export interface ResponsiveColumns {
  /** Default columns (mobile first) */
  default?: Columns;
  /** Small screens (sm: 640px+) */
  sm?: Columns;
  /** Medium screens (md: 768px+) */
  md?: Columns;
  /** Large screens (lg: 1024px+) */
  lg?: Columns;
  /** Extra large screens (xl: 1280px+) */
  xl?: Columns;
  /** 2XL screens (2xl: 1536px+) */
  "2xl"?: Columns;
}

/**
 * Grid Props
 */
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns or responsive configuration */
  cols?: Columns | ResponsiveColumns;
  /** Gap between grid items */
  gap?: GapSize;
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Column count to Tailwind class mapping
 */
const columnClasses: Record<Columns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

/**
 * Responsive column classes
 */
const responsiveColumnClasses: Record<
  keyof Omit<ResponsiveColumns, "default">,
  Record<Columns, string>
> = {
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
    7: "sm:grid-cols-7",
    8: "sm:grid-cols-8",
    9: "sm:grid-cols-9",
    10: "sm:grid-cols-10",
    11: "sm:grid-cols-11",
    12: "sm:grid-cols-12",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    7: "md:grid-cols-7",
    8: "md:grid-cols-8",
    9: "md:grid-cols-9",
    10: "md:grid-cols-10",
    11: "md:grid-cols-11",
    12: "md:grid-cols-12",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
    7: "lg:grid-cols-7",
    8: "lg:grid-cols-8",
    9: "lg:grid-cols-9",
    10: "lg:grid-cols-10",
    11: "lg:grid-cols-11",
    12: "lg:grid-cols-12",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
    7: "xl:grid-cols-7",
    8: "xl:grid-cols-8",
    9: "xl:grid-cols-9",
    10: "xl:grid-cols-10",
    11: "xl:grid-cols-11",
    12: "xl:grid-cols-12",
  },
  "2xl": {
    1: "2xl:grid-cols-1",
    2: "2xl:grid-cols-2",
    3: "2xl:grid-cols-3",
    4: "2xl:grid-cols-4",
    5: "2xl:grid-cols-5",
    6: "2xl:grid-cols-6",
    7: "2xl:grid-cols-7",
    8: "2xl:grid-cols-8",
    9: "2xl:grid-cols-9",
    10: "2xl:grid-cols-10",
    11: "2xl:grid-cols-11",
    12: "2xl:grid-cols-12",
  },
};

/**
 * Gap size to Tailwind class mapping
 */
const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

/**
 * Build column classes from configuration
 */
function buildColumnClasses(cols: Columns | ResponsiveColumns): string {
  if (typeof cols === "number") {
    return columnClasses[cols];
  }

  const classes: string[] = [];

  // Default (mobile-first)
  if (cols.default) {
    classes.push(columnClasses[cols.default]);
  }

  // Responsive breakpoints
  (["sm", "md", "lg", "xl", "2xl"] as const).forEach((breakpoint) => {
    const value = cols[breakpoint];
    if (value) {
      classes.push(responsiveColumnClasses[breakpoint][value]);
    }
  });

  return classes.join(" ");
}

/**
 * Grid Component
 *
 * A CSS Grid container with configurable columns and gap.
 *
 * @example
 * ```tsx
 * // Simple 3-column grid
 * <Grid cols={3} gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * // Responsive grid
 * <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 * ```
 */
export function Grid({
  cols = 1,
  gap = "md",
  className,
  children,
  ...props
}: GridProps) {
  return (
    <div
      className={cn("grid", buildColumnClasses(cols), gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

Grid.displayName = "Grid";

/**
 * Span count type (1-12)
 */
export type SpanCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "full";

/**
 * Responsive span configuration
 */
export interface ResponsiveSpan {
  /** Default span (mobile first) */
  default?: SpanCount;
  /** Small screens (sm: 640px+) */
  sm?: SpanCount;
  /** Medium screens (md: 768px+) */
  md?: SpanCount;
  /** Large screens (lg: 1024px+) */
  lg?: SpanCount;
  /** Extra large screens (xl: 1280px+) */
  xl?: SpanCount;
  /** 2XL screens (2xl: 1536px+) */
  "2xl"?: SpanCount;
}

/**
 * GridItem Props
 */
export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns to span or responsive configuration */
  span?: SpanCount | ResponsiveSpan;
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Span to Tailwind class mapping
 */
const spanClasses: Record<SpanCount, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
  full: "col-span-full",
};

/**
 * Responsive span classes
 */
const responsiveSpanClasses: Record<
  keyof Omit<ResponsiveSpan, "default">,
  Record<SpanCount, string>
> = {
  sm: {
    1: "sm:col-span-1",
    2: "sm:col-span-2",
    3: "sm:col-span-3",
    4: "sm:col-span-4",
    5: "sm:col-span-5",
    6: "sm:col-span-6",
    7: "sm:col-span-7",
    8: "sm:col-span-8",
    9: "sm:col-span-9",
    10: "sm:col-span-10",
    11: "sm:col-span-11",
    12: "sm:col-span-12",
    full: "sm:col-span-full",
  },
  md: {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
    full: "md:col-span-full",
  },
  lg: {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
    full: "lg:col-span-full",
  },
  xl: {
    1: "xl:col-span-1",
    2: "xl:col-span-2",
    3: "xl:col-span-3",
    4: "xl:col-span-4",
    5: "xl:col-span-5",
    6: "xl:col-span-6",
    7: "xl:col-span-7",
    8: "xl:col-span-8",
    9: "xl:col-span-9",
    10: "xl:col-span-10",
    11: "xl:col-span-11",
    12: "xl:col-span-12",
    full: "xl:col-span-full",
  },
  "2xl": {
    1: "2xl:col-span-1",
    2: "2xl:col-span-2",
    3: "2xl:col-span-3",
    4: "2xl:col-span-4",
    5: "2xl:col-span-5",
    6: "2xl:col-span-6",
    7: "2xl:col-span-7",
    8: "2xl:col-span-8",
    9: "2xl:col-span-9",
    10: "2xl:col-span-10",
    11: "2xl:col-span-11",
    12: "2xl:col-span-12",
    full: "2xl:col-span-full",
  },
};

/**
 * Build span classes from configuration
 */
function buildSpanClasses(span: SpanCount | ResponsiveSpan): string {
  if (typeof span === "number" || span === "full") {
    return spanClasses[span];
  }

  const classes: string[] = [];

  // Default (mobile-first)
  if (span.default) {
    classes.push(spanClasses[span.default]);
  }

  // Responsive breakpoints
  (["sm", "md", "lg", "xl", "2xl"] as const).forEach((breakpoint) => {
    const value = span[breakpoint];
    if (value) {
      classes.push(responsiveSpanClasses[breakpoint][value]);
    }
  });

  return classes.join(" ");
}

/**
 * GridItem Component
 *
 * A grid item that can span multiple columns.
 *
 * @example
 * ```tsx
 * <Grid cols={12} gap="md">
 *   <GridItem span={8}>Main content</GridItem>
 *   <GridItem span={4}>Sidebar</GridItem>
 *   <GridItem span={{ default: "full", md: 6 }}>Responsive item</GridItem>
 * </Grid>
 * ```
 */
export function GridItem({
  span = 1,
  className,
  children,
  ...props
}: GridItemProps) {
  return (
    <div className={cn(buildSpanClasses(span), className)} {...props}>
      {children}
    </div>
  );
}

GridItem.displayName = "GridItem";
