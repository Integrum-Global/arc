"use client";

/**
 * AlertsSection Component
 *
 * Displays active alerts with expandable list and detail modal.
 * Features:
 * - Show top 5 by default with "Show More" option
 * - Click-to-expand alert detail modal
 * - Acknowledge/dismiss actions
 */

import { useState } from "react";
import { Section } from "@/components/layout";
import { AlertCard, AlertCardSkeleton } from "@/components/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import { formatRelativeTime, formatDateTime } from "@/lib/formatting";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types/api";

export interface AlertsSectionProps {
  /** Active alerts to display */
  alerts: Alert[];
  /** Loading state */
  loading?: boolean;
}

const DEFAULT_DISPLAY_COUNT = 5;
const EXPANDED_DISPLAY_COUNT = 15;

/**
 * Map API alert type to AlertCard format
 */
function mapAlertToCardFormat(alert: Alert) {
  // Map API severity to AlertCard severity
  const severityMap: Record<string, "info" | "warning" | "critical"> = {
    low: "info",
    medium: "warning",
    high: "warning",
    critical: "critical",
  };

  // Map API status to AlertCard status
  const statusMap: Record<string, "active" | "acknowledged" | "dismissed"> = {
    active: "active",
    acknowledged: "acknowledged",
    dismissed: "dismissed",
    resolved: "dismissed",
    expired: "dismissed",
  };

  return {
    id: alert.id,
    severity: severityMap[alert.severity] ?? "info",
    title: alert.title,
    message: alert.message,
    securityTicker: alert.security_symbol,
    securityId: alert.security_id,
    triggeredAt: alert.triggered_at,
    status: statusMap[alert.status] ?? "active",
    source: alert.type,
  };
}

/**
 * Severity configuration for icons and colors
 */
const severityConfig = {
  low: {
    icon: Info,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    label: "Info",
  },
  medium: {
    icon: AlertTriangle,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    label: "Warning",
  },
  high: {
    icon: AlertTriangle,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    label: "High",
  },
  critical: {
    icon: AlertCircle,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
    label: "Critical",
  },
};

/**
 * Alert detail modal component
 */
function AlertDetailModal({
  alert,
  open,
  onOpenChange,
  onAcknowledge,
  onDismiss,
}: {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!alert) return null;

  const config = severityConfig[alert.severity] ?? severityConfig.low;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full",
                config.bgClass
              )}
            >
              <Icon className={cn("h-5 w-5", config.colorClass)} />
            </div>
            <div>
              <DialogTitle className="text-lg">{alert.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded",
                    config.bgClass,
                    config.colorClass
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(alert.triggered_at)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-sm text-foreground">{alert.message}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{alert.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{alert.status}</p>
              </div>
              {alert.security_symbol && (
                <div>
                  <p className="text-muted-foreground">Security</p>
                  <p className="font-medium">{alert.security_symbol}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Triggered</p>
                <p className="font-medium">{formatDateTime(alert.triggered_at)}</p>
              </div>
            </div>

            {(alert.threshold_value !== undefined || alert.current_value !== undefined) && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <p className="text-muted-foreground mb-1">Value Details</p>
                {alert.current_value !== undefined && (
                  <p>
                    Current: <span className="font-mono font-medium">{alert.current_value}</span>
                  </p>
                )}
                {alert.threshold_value !== undefined && (
                  <p>
                    Threshold: <span className="font-mono font-medium">{alert.threshold_value}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogDescription>

        {alert.status === "active" && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onDismiss(alert.id)}>
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button onClick={() => onAcknowledge(alert.id)}>
              <Check className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Empty state when there are no alerts
 */
function EmptyAlerts() {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No active alerts</p>
          <p className="text-sm text-muted-foreground">
            Your portfolio is in good standing
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Alerts list skeleton
 */
function AlertsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <AlertCardSkeleton key={i} compact />
      ))}
    </div>
  );
}

/**
 * AlertsSection component showing active alerts
 */
export function AlertsSection({ alerts, loading = false }: AlertsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const acknowledgeAlert = useAcknowledgeAlert();
  const dismissAlert = useDismissAlert();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
    setIsModalOpen(false);
  };

  const handleDismiss = (alertId: string) => {
    dismissAlert.mutate(alertId);
    setIsModalOpen(false);
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  // Filter to only show active alerts
  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const displayCount = isExpanded ? EXPANDED_DISPLAY_COUNT : DEFAULT_DISPLAY_COUNT;
  const displayedAlerts = activeAlerts.slice(0, displayCount);
  const hasMore = activeAlerts.length > DEFAULT_DISPLAY_COUNT;
  const remainingCount = activeAlerts.length - DEFAULT_DISPLAY_COUNT;

  return (
    <>
      <Section
        title="Active Alerts"
        subtitle={
          activeAlerts.length > 0
            ? `${activeAlerts.length} alert${activeAlerts.length !== 1 ? "s" : ""} requiring attention`
            : undefined
        }
      >
        {loading ? (
          <AlertsListSkeleton />
        ) : activeAlerts.length === 0 ? (
          <EmptyAlerts />
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((alert) => {
              const cardAlert = mapAlertToCardFormat(alert);
              return (
                <AlertCard
                  key={alert.id}
                  alert={cardAlert}
                  onAcknowledge={handleAcknowledge}
                  onDismiss={handleDismiss}
                  onClick={() => handleAlertClick(alert)}
                  compact
                  showActions
                />
              );
            })}

            {/* Show More/Less toggle */}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full h-9 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show {Math.min(remainingCount, EXPANDED_DISPLAY_COUNT - DEFAULT_DISPLAY_COUNT)} More
                    {activeAlerts.length > EXPANDED_DISPLAY_COUNT && (
                      <span className="ml-1 text-xs">
                        ({activeAlerts.length - EXPANDED_DISPLAY_COUNT} hidden)
                      </span>
                    )}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Section>

      {/* Alert detail modal */}
      <AlertDetailModal
        alert={selectedAlert}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAcknowledge={handleAcknowledge}
        onDismiss={handleDismiss}
      />
    </>
  );
}

AlertsSection.displayName = "AlertsSection";

export default AlertsSection;
