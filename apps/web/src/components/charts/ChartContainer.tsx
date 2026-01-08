"use client";

/**
 * ChartContainer Component
 *
 * A wrapper component for charts that provides:
 * - Responsive container
 * - Loading state
 * - Empty state
 * - Error boundary
 * - Title/subtitle header
 * - Actions slot
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ChartContainer props
 */
export interface ChartContainerProps {
  /** Chart title */
  title?: string;
  /** Chart subtitle/description */
  subtitle?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Whether there's an error */
  error?: Error | string | null;
  /** Whether data is empty */
  isEmpty?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Actions (buttons, dropdown, etc.) to display in header */
  actions?: React.ReactNode;
  /** Chart height */
  height?: number | string;
  /** Additional class name */
  className?: string;
  /** Content class name */
  contentClassName?: string;
  /** Children (the chart component) */
  children: React.ReactNode;
  /** Use card wrapper */
  asCard?: boolean;
  /** Show skeleton loading state */
  showSkeleton?: boolean;
  /** Retry callback for error state */
  onRetry?: () => void;
}

/**
 * Chart loading skeleton
 */
function ChartSkeleton({ height }: { height?: number | string }) {
  return (
    <div
      className="flex flex-col gap-4 p-4"
      style={{ height: height || 300 }}
    >
      {/* Chart area skeleton */}
      <Skeleton className="flex-1 rounded-lg" />

      {/* Legend skeleton */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/**
 * Chart empty state
 */
function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
      <svg
        className="h-12 w-12 text-muted-foreground/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Chart error state
 */
function ChartErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <svg
        className="h-12 w-12 text-destructive/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Error boundary for chart errors
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ChartContainer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ChartErrorState message="An error occurred while rendering the chart." />
        )
      );
    }

    return this.props.children;
  }
}

/**
 * ChartContainer component - wrapper for chart components
 */
export function ChartContainer({
  title,
  subtitle,
  isLoading = false,
  error,
  isEmpty = false,
  emptyMessage = "No data available",
  errorMessage,
  actions,
  height,
  className,
  contentClassName,
  children,
  asCard = true,
  showSkeleton = true,
  onRetry,
}: ChartContainerProps) {
  // Determine what to render
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return showSkeleton ? (
        <ChartSkeleton height={height} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ height: height || 300 }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    // Error state
    if (error) {
      const message =
        errorMessage ||
        (error instanceof Error ? error.message : String(error)) ||
        "An error occurred";
      return <ChartErrorState message={message} onRetry={onRetry} />;
    }

    // Empty state
    if (isEmpty) {
      return <ChartEmptyState message={emptyMessage} />;
    }

    // Normal state - render chart with error boundary
    return (
      <ChartErrorBoundary>
        <div
          className={cn("w-full", contentClassName)}
          style={height ? { height } : undefined}
        >
          {children}
        </div>
      </ChartErrorBoundary>
    );
  };

  // Render without card wrapper
  if (!asCard) {
    return (
      <div className={cn("w-full", className)}>
        {(title || subtitle || actions) && (
          <div className="mb-4 flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold leading-none">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        )}
        {renderContent()}
      </div>
    );
  }

  // Render with card wrapper
  return (
    <Card className={cn("w-full", className)}>
      {(title || subtitle || actions) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
          {actions && <CardAction>{actions}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !subtitle && !actions && "pt-6")}>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

ChartContainer.displayName = "ChartContainer";

export default ChartContainer;
