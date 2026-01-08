"use client";

/**
 * AlertsSection Component
 *
 * Displays active alerts list (max 5) with severity badges and acknowledge action.
 */

import { Section } from "@/components/layout";
import { AlertCard, AlertCardSkeleton } from "@/components/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import { Bell, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Alert } from "@/types/api";

export interface AlertsSectionProps {
  /** Active alerts to display */
  alerts: Alert[];
  /** Loading state */
  loading?: boolean;
}

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
  const acknowledgeAlert = useAcknowledgeAlert();
  const dismissAlert = useDismissAlert();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleDismiss = (alertId: string) => {
    dismissAlert.mutate(alertId);
  };

  // Filter to only show active alerts
  const activeAlerts = alerts.filter((alert) => alert.status === "active");

  return (
    <Section
      title="Active Alerts"
      subtitle={
        activeAlerts.length > 0
          ? `${activeAlerts.length} alert${activeAlerts.length !== 1 ? "s" : ""} requiring attention`
          : undefined
      }
      actions={
        <Link href="/alerts">
          <Button variant="ghost" size="sm" className="h-8">
            View All
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      {loading ? (
        <AlertsListSkeleton />
      ) : activeAlerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <div className="space-y-3">
          {activeAlerts.slice(0, 5).map((alert) => {
            const cardAlert = mapAlertToCardFormat(alert);
            return (
              <AlertCard
                key={alert.id}
                alert={cardAlert}
                onAcknowledge={handleAcknowledge}
                onDismiss={handleDismiss}
                compact
                showActions
              />
            );
          })}
        </div>
      )}
    </Section>
  );
}

AlertsSection.displayName = "AlertsSection";

export default AlertsSection;
