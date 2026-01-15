"use client";

/**
 * ActionableAlertsWidget Component
 *
 * Dashboard widget showing Tier 2 actionable alerts (severity: high | medium)
 * with context-aware action buttons.
 *
 * Features:
 * - Display up to 5 actionable alerts (configurable)
 * - Severity color accent (4px left border)
 * - Context-aware action buttons based on alert_type
 * - Empty state when no alerts
 * - Unread badge count
 * - View Command Center link
 * - Relative timestamps
 * - Dismiss functionality
 */

import Link from "next/link";
import { Section } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

export interface ActionableAlertsWidgetProps {
  /** Loading state */
  loading?: boolean;
  /** Maximum number of alerts to display */
  maxAlerts?: number;
}

/**
 * Severity color configuration for left border accent
 */
const SEVERITY_STYLES = {
  high: {
    border: "border-amber-500",
    bg: "bg-amber-500/10",
    icon: "text-amber-500",
  },
  medium: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
  },
} as const;

/**
 * Get action button configuration based on alert type
 */
function getAlertAction(alert: Alert): {
  label: string;
  href: string;
} | null {
  switch (alert.alert_type) {
    case "threshold_breach":
      return {
        label: "Review",
        href: `/analytics/ratios?security=${alert.security_id}`,
      };
    case "health_issue":
      return {
        label: "View Scan",
        href: `/portfolios/${alert.portfolio_id}/health`,
      };
    case "concentration_warning":
      return {
        label: "Rebalance",
        href: `/portfolios/${alert.portfolio_id}/allocations`,
      };
    default:
      return null;
  }
}

/**
 * Alert Card Component
 */
interface AlertCardProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const severity = alert.severity as "high" | "medium";
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  const action = getAlertAction(alert);

  return (
    <Card
      data-testid="alert-card"
      className={cn(
        "p-4 border-l-4 flex items-start gap-3 shadow-sm",
        styles.border,
        styles.bg
      )}
    >
      {/* Alert Icon */}
      <AlertCircle className={cn("h-5 w-5 mt-0.5 shrink-0", styles.icon)} />

      {/* Alert Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground leading-snug">
          {alert.message}
        </p>
        {alert.details && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {alert.details}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {alert.portfolio_name && (
            <>
              <span>{alert.portfolio_name}</span>
              <span>•</span>
            </>
          )}
          <span>{formatRelativeTime(alert.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <Button size="sm" variant="outline" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDismiss(alert.id)}
          title="Dismiss alert"
        >
          Dismiss
        </Button>
      </div>
    </Card>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-foreground">All clear!</p>
          <p className="text-sm text-muted-foreground">
            No actionable alerts at this time.
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

/**
 * ActionableAlertsWidget Component
 */
export function ActionableAlertsWidget({
  loading = false,
  maxAlerts = 5,
}: ActionableAlertsWidgetProps) {
  // Get actionable alerts from store (Tier 2: high | medium severity)
  const actionableAlerts = useAlertStore((state) => state.actionableAlerts);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);

  // Limit alerts to maxAlerts
  const displayAlerts = actionableAlerts.slice(0, maxAlerts);

  // Calculate unread count (active status)
  const unreadCount = actionableAlerts.filter(
    (alert) => alert.status === "active"
  ).length;

  return (
    <Section
      title="Actionable Alerts"
      actions={
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/alerts">
              View Command Center
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : displayAlerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

ActionableAlertsWidget.displayName = "ActionableAlertsWidget";

export default ActionableAlertsWidget;
