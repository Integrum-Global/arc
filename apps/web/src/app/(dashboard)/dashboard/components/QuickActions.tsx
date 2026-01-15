"use client";

/**
 * QuickActions Component
 *
 * Quick action buttons for common dashboard operations:
 * - Record Transaction
 * - Run Health Scan
 * - Refresh Data
 *
 * Features:
 * - Staleness indicator with last updated time
 * - Async feedback for operations
 * - Visual status for data freshness
 */

import { useState } from "react";
import { Section } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusCircle,
  Activity,
  RefreshCw,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import type { DataFreshness } from "@/hooks/useDashboardData";

export interface QuickActionsProps {
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Whether data is currently refreshing */
  isRefreshing?: boolean;
  /** Data freshness information */
  freshness?: DataFreshness;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof PlusCircle;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
}

/**
 * Freshness status indicator component
 */
function FreshnessIndicator({
  freshness,
  isRefreshing,
}: {
  freshness?: DataFreshness;
  isRefreshing: boolean;
}) {
  if (!freshness?.lastUpdated) {
    return null;
  }

  const StatusIcon = freshness.isStale ? AlertCircle : CheckCircle;
  const statusColor = freshness.isStale
    ? "text-amber-500"
    : "text-positive";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              freshness.isStale ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            {isRefreshing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <StatusIcon className={cn("h-3.5 w-3.5", statusColor)} />
            )}
            <Clock className="h-3 w-3" />
            <span>
              {isRefreshing
                ? "Updating..."
                : formatRelativeTime(freshness.lastUpdated)}
            </span>
            {freshness.isStale && !isRefreshing && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-amber-500/50 text-amber-500">
                Stale
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {freshness.isStale ? (
            <p>Data may be outdated. Click Refresh to update.</p>
          ) : (
            <p>Data is fresh. Last updated {formatRelativeTime(freshness.lastUpdated)}.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * QuickActions component showing common action buttons
 */
export function QuickActions({
  onRefresh,
  isRefreshing = false,
  freshness,
}: QuickActionsProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"idle" | "success" | "error">("idle");

  const handleHealthScan = async () => {
    setIsScanning(true);
    setScanResult("idle");
    // Simulate health scan with potential outcome
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setScanResult("success");
      // Reset after showing success
      setTimeout(() => setScanResult("idle"), 3000);
    } catch {
      setScanResult("error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRefresh = () => {
    onRefresh?.();
  };

  const actions: QuickAction[] = [
    {
      id: "transaction",
      label: "Record Transaction",
      description: "Log a new buy, sell, or dividend",
      icon: PlusCircle,
      href: "/transactions/new",
      variant: "default",
    },
    {
      id: "health-scan",
      label: scanResult === "success" ? "Scan Complete" : "Run Health Scan",
      description: scanResult === "success"
        ? "No issues found"
        : "Check portfolio for issues",
      icon: scanResult === "success" ? CheckCircle : Activity,
      onClick: handleHealthScan,
      variant: "outline",
    },
    {
      id: "refresh",
      label: isRefreshing ? "Refreshing..." : "Refresh Data",
      description: freshness?.isStale
        ? "Data is stale - update now"
        : "Update prices and metrics",
      icon: RefreshCw,
      onClick: handleRefresh,
      variant: "outline",
    },
  ];

  return (
    <Section
      title="Quick Actions"
      actions={
        <FreshnessIndicator freshness={freshness} isRefreshing={isRefreshing} />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading =
            (action.id === "health-scan" && isScanning) ||
            (action.id === "refresh" && isRefreshing);

          const content = (
            <Card
              className={cn(
                "p-4 transition-all cursor-pointer hover:shadow-md hover:border-primary/20",
                action.variant === "default" && "bg-primary text-primary-foreground",
                isLoading && "opacity-70"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        action.variant === "default"
                          ? "text-primary-foreground"
                          : "text-primary",
                        isLoading && "animate-spin"
                      )}
                    />
                    <span
                      className={cn(
                        "font-semibold",
                        action.variant === "default"
                          ? "text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {action.label}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      action.variant === "default"
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {action.description}
                  </p>
                </div>
                {action.href && (
                  <ArrowUpRight
                    className={cn(
                      "h-4 w-4 shrink-0",
                      action.variant === "default"
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}
                  />
                )}
              </div>
            </Card>
          );

          if (action.href) {
            return (
              <a key={action.id} href={action.href}>
                {content}
              </a>
            );
          }

          return (
            <div
              key={action.id}
              onClick={!isLoading ? action.onClick : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isLoading) {
                  e.preventDefault();
                  action.onClick?.();
                }
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

QuickActions.displayName = "QuickActions";

export default QuickActions;
