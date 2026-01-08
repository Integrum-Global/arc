"use client";

/**
 * AlertsTab Component
 *
 * Filterable alerts list with acknowledge/dismiss functionality.
 * Displays alerts grouped by severity with filtering options.
 */

import * as React from "react";
import { Section, Grid } from "@/components/layout";
import { AlertCard } from "@/components/data/AlertCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDetailCard } from "./AlertDetailCard";
import { useAlerts, useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import type { Alert as ApiAlert, AlertSeverity, AlertStatus } from "@/types/api";

/**
 * Local Alert type for component compatibility
 */
interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  securityTicker?: string;
  securityId?: string;
  triggeredAt: Date | string | number;
  status: "active" | "acknowledged" | "dismissed";
  source?: string;
}

/**
 * Convert API alert to local alert format
 */
function convertApiAlert(apiAlert: ApiAlert): Alert {
  const severityMap: Record<AlertSeverity, "info" | "warning" | "critical"> = {
    low: "info",
    medium: "warning",
    high: "critical",
    critical: "critical",
  };

  const statusMap: Record<AlertStatus, "active" | "acknowledged" | "dismissed"> = {
    active: "active",
    acknowledged: "acknowledged",
    dismissed: "dismissed",
    resolved: "dismissed",
    expired: "dismissed",
  };

  return {
    id: apiAlert.id,
    severity: severityMap[apiAlert.severity],
    title: apiAlert.title,
    message: apiAlert.message,
    securityTicker: apiAlert.security_symbol,
    securityId: apiAlert.security_id,
    triggeredAt: apiAlert.triggered_at,
    status: statusMap[apiAlert.status],
    source: apiAlert.type,
  };
}

/**
 * Mock alerts for demo
 */
const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Current Ratio Below Critical Threshold",
    message: "Apple Inc. (AAPL) current ratio has fallen to 0.85x, below the critical threshold of 1.0x.",
    securityTicker: "AAPL",
    securityId: "sec-aapl",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    status: "active",
    source: "Threshold Breach",
  },
  {
    id: "alert-2",
    severity: "warning",
    title: "Debt/EBITDA Approaching Warning Level",
    message: "Microsoft Corp. (MSFT) debt-to-EBITDA ratio is at 3.2x, approaching the warning threshold of 3.5x.",
    securityTicker: "MSFT",
    securityId: "sec-msft",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: "active",
    source: "Threshold Breach",
  },
  {
    id: "alert-3",
    severity: "critical",
    title: "P/E Ratio Spike Detected",
    message: "Amazon.com Inc. (AMZN) P/E ratio has increased significantly to 95x, well above historical norms.",
    securityTicker: "AMZN",
    securityId: "sec-amzn",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: "acknowledged",
    source: "Valuation Alert",
  },
  {
    id: "alert-4",
    severity: "info",
    title: "ROE Improved Above Target",
    message: "Alphabet Inc. (GOOGL) ROE has improved to 28%, exceeding the target of 25%.",
    securityTicker: "GOOGL",
    securityId: "sec-googl",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: "active",
    source: "Performance Alert",
  },
  {
    id: "alert-5",
    severity: "warning",
    title: "Gross Margin Declining",
    message: "Meta Platforms (META) gross margin has declined to 78% from 82% over the past quarter.",
    securityTicker: "META",
    securityId: "sec-meta",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    status: "active",
    source: "Profitability Alert",
  },
  {
    id: "alert-6",
    severity: "info",
    title: "Dividend Yield Increase",
    message: "Apple Inc. (AAPL) dividend yield has increased to 0.6% following the latest dividend raise.",
    securityTicker: "AAPL",
    securityId: "sec-aapl",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: "dismissed",
    source: "Dividend Alert",
  },
];

/**
 * Filter options type
 */
interface FilterOptions {
  severity: "all" | "info" | "warning" | "critical";
  status: "all" | "active" | "acknowledged" | "dismissed";
  search: string;
}

/**
 * Loading skeleton
 */
function AlertsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 flex-1 max-w-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <AlertCard.Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Alert summary badges
 */
function AlertSummary({ alerts }: { alerts: Alert[] }) {
  const critical = alerts.filter((a) => a.severity === "critical" && a.status === "active").length;
  const warning = alerts.filter((a) => a.severity === "warning" && a.status === "active").length;
  const info = alerts.filter((a) => a.severity === "info" && a.status === "active").length;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">Active Alerts:</span>
      <div className="flex gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "gap-1",
            critical > 0 && "bg-red-500/10 text-red-600 dark:text-red-400"
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {critical} Critical
        </Badge>
        <Badge
          variant="secondary"
          className={cn(
            "gap-1",
            warning > 0 && "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {warning} Warning
        </Badge>
        <Badge variant="secondary" className="gap-1">
          {info} Info
        </Badge>
      </div>
    </div>
  );
}

export function AlertsTab() {
  const [filters, setFilters] = React.useState<FilterOptions>({
    severity: "all",
    status: "all",
    search: "",
  });
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  // Load mock data (replace with real API call)
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setAlerts(MOCK_ALERTS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((alert) => {
      // Severity filter
      if (filters.severity !== "all" && alert.severity !== filters.severity) {
        return false;
      }
      // Status filter
      if (filters.status !== "all" && alert.status !== filters.status) {
        return false;
      }
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          alert.title.toLowerCase().includes(searchLower) ||
          alert.message.toLowerCase().includes(searchLower) ||
          alert.securityTicker?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [alerts, filters]);

  // Handlers
  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: "acknowledged" as const } : a
      )
    );
  };

  const handleDismiss = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: "dismissed" as const } : a
      )
    );
  };

  const handleAlertClick = (alert: Alert) => {
    setExpandedId((prev) => (prev === alert.id ? null : alert.id));
  };

  if (loading) {
    return <AlertsTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <AlertSummary alerts={alerts} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.severity}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, severity: value as FilterOptions["severity"] }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value as FilterOptions["status"] }))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>

        {/* Bulk actions */}
        {filteredAlerts.filter((a) => a.status === "active").length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                filteredAlerts
                  .filter((a) => a.status === "active")
                  .forEach((a) => handleAcknowledge(a.id));
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Acknowledge All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                filteredAlerts
                  .filter((a) => a.status === "active")
                  .forEach((a) => handleDismiss(a.id));
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Dismiss All
            </Button>
          </div>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No alerts found</p>
            <p className="text-sm">
              {filters.search || filters.severity !== "all" || filters.status !== "all"
                ? "Try adjusting your filters"
                : "All clear! No active alerts at this time."}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertDetailCard
              key={alert.id}
              alert={alert}
              expanded={expandedId === alert.id}
              onToggle={() => handleAlertClick(alert)}
              onAcknowledge={handleAcknowledge}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}

AlertsTab.displayName = "AlertsTab";
