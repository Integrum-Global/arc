/**
 * PageContainer Component
 *
 * A consistent page wrapper with title, actions, loading states, and error handling.
 * Provides a scrollable content area with header section.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * PageContainer Props
 */
export interface PageContainerProps {
  /** Page title */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Actions to display in the header (e.g., buttons) */
  actions?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Additional class names for the container */
  className?: string;
  /** Additional class names for the content area */
  contentClassName?: string;
  /** Whether to add padding to the content area */
  padded?: boolean;
  /** Maximum width of the content area */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  /** Data test ID for testing */
  "data-testid"?: string;
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
  none: "",
};

/**
 * Loading skeleton for PageContainer
 */
function PageContainerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Error display component
 */
function PageError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/**
 * PageContainer Component
 *
 * @example
 * ```tsx
 * <PageContainer
 *   title="Dashboard"
 *   subtitle="Overview of your portfolio performance"
 *   actions={<Button>New Report</Button>}
 *   loading={isLoading}
 *   error={error?.message}
 * >
 *   <DashboardContent />
 * </PageContainer>
 * ```
 */
export function PageContainer({
  title,
  subtitle,
  actions,
  children,
  loading = false,
  error = null,
  className,
  contentClassName,
  padded = true,
  maxWidth = "none",
  "data-testid": dataTestId,
}: PageContainerProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col min-h-0",
        padded && "p-4 md:p-6 lg:p-8",
        className
      )}
      data-testid={dataTestId}
    >
      <div
        className={cn(
          "flex flex-1 flex-col min-h-0",
          maxWidthClasses[maxWidth],
          maxWidth !== "none" && "mx-auto w-full"
        )}
      >
        {/* Header */}
        {hasHeader && (
          <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground md:text-base">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </header>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <PageError message={error} />
          </div>
        )}

        {/* Content Area */}
        <main
          className={cn(
            "flex-1 overflow-auto min-h-0",
            contentClassName
          )}
        >
          {loading ? <PageContainerSkeleton /> : children}
        </main>
      </div>
    </div>
  );
}

PageContainer.displayName = "PageContainer";

// Export skeleton for external use
export { PageContainerSkeleton };
