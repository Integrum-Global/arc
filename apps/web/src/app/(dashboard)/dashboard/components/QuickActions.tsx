"use client";

/**
 * QuickActions Component
 *
 * Quick action buttons for common dashboard operations:
 * - Record Transaction
 * - Run Health Scan
 * - Refresh Data
 */

import { useState } from "react";
import { Section } from "@/components/layout";
import { Card } from "@/components/ui/card";
import {
  PlusCircle,
  Activity,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickActionsProps {
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Whether data is currently refreshing */
  isRefreshing?: boolean;
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
 * QuickActions component showing common action buttons
 */
export function QuickActions({
  onRefresh,
  isRefreshing = false,
}: QuickActionsProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleHealthScan = () => {
    setIsScanning(true);
    // Simulate health scan
    setTimeout(() => setIsScanning(false), 2000);
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
      label: "Run Health Scan",
      description: "Check portfolio for issues",
      icon: Activity,
      onClick: handleHealthScan,
      variant: "outline",
    },
    {
      id: "refresh",
      label: "Refresh Data",
      description: "Update prices and metrics",
      icon: RefreshCw,
      onClick: handleRefresh,
      variant: "outline",
    },
  ];

  return (
    <Section title="Quick Actions">
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
