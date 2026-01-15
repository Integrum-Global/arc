# ARC Alert Strategy Component Specifications

## Overview

This document provides detailed specifications for all UI components in the alert system. Each component includes wireframes, props, behavior, and implementation code.

---

## 1. CriticalAlertBanner

### Purpose
Fixed banner at the top of the viewport for Tier 1 critical alerts requiring immediate attention.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠ CRITICAL │ Margin call on AAPL: Current margin 142% exceeds 140% limit   │
│            │ Portfolio: Growth Equity │ Triggered 5 min ago                 │
│            │                                    [View Details] [Acknowledge]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multiple Alerts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠ 3 CRITICAL ALERTS                                            [View All ▼]│
│                                                                              │
│ • Margin call on AAPL (5 min ago)                                           │
│ • Position limit breach on NVDA (12 min ago)                                │
│ • System: Database connection lost (2 min ago)              [Acknowledge All]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Props

```typescript
interface CriticalAlertBannerProps {
  /** Array of critical alerts to display */
  alerts: Alert[];
  /** Callback when user acknowledges an alert */
  onAcknowledge?: (alertId: string) => void;
  /** Callback when user clicks View Details */
  onViewDetails?: (alert: Alert) => void;
  /** Whether to collapse into summary when multiple alerts */
  collapseMultiple?: boolean;
}
```

### Behavior

| State | Display |
|-------|---------|
| No critical alerts | Hidden (not rendered) |
| 1 critical alert | Full banner with details |
| 2+ critical alerts | Collapsed summary, expandable |
| Alert acknowledged | Removed from banner with fade animation |

### Implementation

```typescript
// src/components/alerts/CriticalAlertBanner.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useCriticalAlerts } from "@/stores/alertStore";
import type { Alert } from "@/types/api";

export function CriticalAlertBanner() {
  const alerts = useCriticalAlerts();
  const [isExpanded, setIsExpanded] = useState(false);

  if (alerts.length === 0) return null;

  const showSingle = alerts.length === 1;
  const firstAlert = alerts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-destructive text-destructive-foreground sticky top-0 z-50"
        role="alert"
        aria-live="assertive"
      >
        {showSingle ? (
          <SingleAlertContent alert={firstAlert!} />
        ) : (
          <MultiAlertContent
            alerts={alerts}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function SingleAlertContent({ alert }: { alert: Alert }) {
  const { acknowledgeAlert } = useAlertStore();

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>CRITICAL</span>
            <span className="opacity-70">|</span>
            <span className="truncate">{alert.message}</span>
          </div>
          <div className="text-sm opacity-80 mt-0.5">
            {alert.portfolio_name && (
              <span>Portfolio: {alert.portfolio_name} • </span>
            )}
            <span>Triggered {formatRelativeTime(new Date(alert.created_at))}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={() => window.location.href = `/alerts/${alert.id}`}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive-foreground/30 text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={() => acknowledgeAlert(alert.id)}
          >
            Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}

function MultiAlertContent({
  alerts,
  isExpanded,
  onToggle
}: {
  alerts: Alert[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { acknowledgeAlert } = useAlertStore();

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-semibold hover:opacity-80"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>{alerts.length} CRITICAL ALERTS</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive-foreground/30 text-destructive-foreground"
          onClick={() => alerts.forEach(a => acknowledgeAlert(a.id))}
        >
          Acknowledge All
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2"
          >
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center justify-between text-sm bg-destructive-foreground/10 rounded px-3 py-2"
              >
                <span>• {alert.message}</span>
                <span className="opacity-70 ml-2">
                  ({formatRelativeTime(new Date(alert.created_at))})
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 2. Alert Command Center

### Purpose
Dedicated page for comprehensive alert management with filtering, sorting, and bulk actions.

### Route
`/alerts`

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Alerts                                              [Mark All Read] [Settings]│
│ Manage and review all portfolio alerts                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [All] [Critical (2)] [Actionable (8)] [Informational (24)] [Resolved]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌───────────────────────────────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ 🔍 Search alerts...                   │ │ Type ▼       │ │ Sort: Recent ▼│ │
│ └───────────────────────────────────────┘ └──────────────┘ └──────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ │ ⚠ │ Margin call on AAPL: Current margin exceeds limit              │ │
│ │   │ 🔴│ Portfolio: Growth Equity │ 5 min ago           [View] [Ack] [...]│ │
│ ├───┼───┼──────────────────────────────────────────────────────────────────┤ │
│ │ ☐ │ ⚠ │ P/E ratio exceeds threshold: MSFT at 32.5 (limit: 30)          │ │
│ │   │ 🟠│ Portfolio: Tech Fund │ 2 hours ago             [View] [Ack] [...]│ │
│ ├───┼───┼──────────────────────────────────────────────────────────────────┤ │
│ │ ☐ │ ℹ │ Weekly performance summary available                            │ │
│ │   │ 🔵│ All Portfolios │ Yesterday                    [View] [Dismiss]  │ │
│ └───┴───┴──────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                         [1] [2] [3] ... [12] →                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Page Implementation

```typescript
// src/app/(dashboard)/alerts/page.tsx
"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Settings, CheckCheck } from "lucide-react";
import { useAlerts, useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import { AlertTable } from "./components/AlertTable";
import { AlertFilters, AlertSortOptions } from "@/types/api";

type TabValue = "all" | "critical" | "actionable" | "informational" | "resolved";

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [alertType, setAlertType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "severity" | "portfolio">("recent");

  // Build filters based on tab and selections
  const filters: AlertFilters = {
    status: activeTab === "resolved" ? "resolved" : "active",
    severity: getSeverityFromTab(activeTab),
    search: search || undefined,
    alert_type: alertType !== "all" ? alertType : undefined,
  };

  const { data, isLoading } = useAlerts(filters);
  const acknowledgeAll = useAcknowledgeAlert();

  const counts = {
    critical: data?.counts?.critical ?? 0,
    actionable: data?.counts?.actionable ?? 0,
    informational: data?.counts?.informational ?? 0,
    resolved: data?.counts?.resolved ?? 0,
  };

  return (
    <PageContainer
      title="Alerts"
      subtitle="Manage and review all portfolio alerts"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => acknowledgeAll.mutate({})}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/settings/notifications">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </a>
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({counts.critical})
          </TabsTrigger>
          <TabsTrigger value="actionable">
            Actionable ({counts.actionable})
          </TabsTrigger>
          <TabsTrigger value="informational">
            Informational ({counts.informational})
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {/* Filters Row */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={alertType} onValueChange={setAlertType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alert Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="threshold_breach">Threshold Breach</SelectItem>
              <SelectItem value="health_issue">Health Issue</SelectItem>
              <SelectItem value="concentration">Concentration</SelectItem>
              <SelectItem value="margin_call">Margin Call</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AlertTable
          alerts={data?.items ?? []}
          loading={isLoading}
          sortBy={sortBy}
        />
      </Tabs>
    </PageContainer>
  );
}

function getSeverityFromTab(tab: TabValue): string | undefined {
  switch (tab) {
    case "critical": return "critical";
    case "actionable": return "high,medium";
    case "informational": return "low";
    default: return undefined;
  }
}
```

---

## 3. ActionableAlertsWidget

### Purpose
Dashboard widget showing Tier 2 alerts with actionable CTAs. Replaces current generic AlertsSection.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Actionable Alerts                          [3 unread] [View Command Center →]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 P/E ratio exceeds threshold                                          │ │
│ │    MSFT at 32.5 (limit: 30)                                             │ │
│ │    Growth Equity • 2 hours ago                        [Review] [Dismiss]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 Health scan found 3 issues                                           │ │
│ │    Sector concentration, Liquidity warning, Correlation risk           │ │
│ │    Tech Fund • Yesterday                          [View Scan] [Dismiss] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 Dividend payment pending approval                                    │ │
│ │    AAPL $0.24/share for 500 shares                                      │ │
│ │    Income Fund • 3 hours ago                       [Approve] [Details] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/app/(dashboard)/dashboard/components/ActionableAlertsWidget.tsx
"use client";

import { Section } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/api";

interface ActionableAlertsWidgetProps {
  loading?: boolean;
  maxAlerts?: number;
}

const SEVERITY_STYLES = {
  high: { bg: "bg-orange-500/10", icon: "text-orange-500", badge: "bg-orange-500" },
  medium: { bg: "bg-yellow-500/10", icon: "text-yellow-500", badge: "bg-yellow-500" },
} as const;

export function ActionableAlertsWidget({
  loading,
  maxAlerts = 5,
}: ActionableAlertsWidgetProps) {
  const actionableAlerts = useAlertStore((state) => state.actionableAlerts);
  const { acknowledgeAlert, dismissAlert } = useAlertStore();

  const displayAlerts = actionableAlerts.slice(0, maxAlerts);
  const unreadCount = actionableAlerts.filter(a => a.status === "active").length;

  if (loading) {
    return (
      <Section title="Actionable Alerts">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Actionable Alerts"
      actions={
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
          <Button variant="ghost" size="sm" asChild>
            <a href="/alerts">
              View Command Center
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      }
    >
      {displayAlerts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No actionable alerts</p>
          <p className="text-sm">All caught up!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
}: {
  alert: Alert;
  onAcknowledge: () => void;
  onDismiss: () => void;
}) {
  const severity = alert.severity as "high" | "medium";
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;

  // Determine action buttons based on alert type
  const actions = getAlertActions(alert);

  return (
    <Card className={cn("p-4", styles.bg)}>
      <div className="flex items-start gap-3">
        <AlertCircle className={cn("h-5 w-5 mt-0.5 shrink-0", styles.icon)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{alert.message}</p>
          {alert.details && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {alert.details}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {alert.portfolio_name && <span>{alert.portfolio_name} • </span>}
            {formatRelativeTime(new Date(alert.created_at))}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions.primary && (
            <Button size="sm" variant="outline" asChild>
              <a href={actions.primary.href}>{actions.primary.label}</a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getAlertActions(alert: Alert) {
  switch (alert.alert_type) {
    case "threshold_breach":
      return {
        primary: { label: "Review", href: `/analytics/ratios?security=${alert.security_id}` }
      };
    case "health_issue":
      return {
        primary: { label: "View Scan", href: `/portfolios/${alert.portfolio_id}/health` }
      };
    case "concentration_warning":
      return {
        primary: { label: "Rebalance", href: `/portfolios/${alert.portfolio_id}/allocations` }
      };
    default:
      return { primary: { label: "View", href: `/alerts/${alert.id}` } };
  }
}
```

---

## 4. NotificationCenter

### Purpose
Header dropdown for quick access to recent alerts across all tiers.

### Wireframe

```
                                          ┌────────────────────────────────────┐
                                          │ Notifications                      │
                                          ├────────────────────────────────────┤
                                          │ ┌──────────────────────────────┐  │
     [🔔 3]  ◄── Click ──────────────────▶│ │ CRITICAL                     │  │
                                          │ │ • Margin call on AAPL       🔴│  │
                                          │ │   5 min ago                   │  │
                                          │ └──────────────────────────────┘  │
                                          │ ┌──────────────────────────────┐  │
                                          │ │ TODAY                         │  │
                                          │ │ • P/E ratio exceeded         🟠│  │
                                          │ │   2 hours ago                  │  │
                                          │ │ • Health scan complete       🟡│  │
                                          │ │   4 hours ago                  │  │
                                          │ └──────────────────────────────┘  │
                                          │ ┌──────────────────────────────┐  │
                                          │ │ EARLIER                       │  │
                                          │ │ • Weekly report ready        🔵│  │
                                          │ │   Yesterday                    │  │
                                          │ └──────────────────────────────┘  │
                                          │                                    │
                                          │ [Mark All Read]  [View All →]      │
                                          └────────────────────────────────────┘
```

### Implementation

```typescript
// src/components/layout/NotificationCenter.tsx
"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/api";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const alerts = useAlertStore((state) => state.alerts);
  const criticalAlerts = useAlertStore((state) => state.criticalAlerts);
  const unreadCount = useAlertStore((state) => state.unreadCount);
  const { markAllRead } = useAlertStore();

  // Group alerts by time
  const grouped = groupAlertsByTime(alerts.slice(0, 20));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Critical Section */}
          {criticalAlerts.length > 0 && (
            <AlertSection
              title="CRITICAL"
              alerts={criticalAlerts}
              className="bg-destructive/5"
            />
          )}

          {/* Grouped by Time */}
          {Object.entries(grouped).map(([label, items]) => (
            <AlertSection key={label} title={label} alerts={items} />
          ))}

          {alerts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t flex justify-end">
          <Button variant="link" size="sm" asChild>
            <a href="/alerts">
              View all alerts
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AlertSection({
  title,
  alerts,
  className,
}: {
  title: string;
  alerts: Alert[];
  className?: string;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className={cn("py-2", className)}>
      <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase">
        {title}
      </p>
      {alerts.map((alert) => (
        <NotificationItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function NotificationItem({ alert }: { alert: Alert }) {
  const severityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <a
      href={`/alerts/${alert.id}`}
      className="flex items-start gap-3 px-4 py-2 hover:bg-muted transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{alert.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(alert.created_at))}
        </p>
      </div>
      <div
        className={cn(
          "w-2 h-2 rounded-full mt-2 shrink-0",
          severityColors[alert.severity as keyof typeof severityColors]
        )}
      />
    </a>
  );
}

function groupAlertsByTime(alerts: Alert[]): Record<string, Alert[]> {
  const groups: Record<string, Alert[]> = {};
  const now = new Date();

  for (const alert of alerts) {
    const date = new Date(alert.created_at);
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    let label: string;
    if (diffHours < 24) {
      label = "TODAY";
    } else if (diffHours < 48) {
      label = "YESTERDAY";
    } else {
      label = "EARLIER";
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(alert);
  }

  return groups;
}
```

---

## 5. Notification Preferences

### Purpose
Self-service configuration for alert channels, quiet hours, and per-type settings.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Notification Settings                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Global Settings                                                              │
│ ────────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ Sound Notifications                               [====○====] On            │
│ Play sound for critical alerts                                              │
│                                                                              │
│ Browser Notifications                             [====○====] On            │
│ Show desktop notifications (requires permission)                            │
│                                                                              │
│ Quiet Hours                                       [====○====] Off           │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Start Time: [22:00 ▼]    End Time: [07:00 ▼]                          │  │
│ │ During quiet hours, only critical alerts will notify                   │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ Alert Type Settings                                                          │
│ ────────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ ┌──────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐ │
│ │ Alert Type           │ Enabled │ Sound   │ Toast   │ Email   │ Badge   │ │
│ ├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤ │
│ │ Margin Call          │ ✓ Lock  │ ✓ Lock  │ ✓ Lock  │ ✓       │ ✓ Lock  │ │
│ │ Position Limit       │ ✓       │ ✓       │ ✓       │ ✓       │ ✓       │ │
│ │ Threshold Breach     │ ✓       │ ○       │ ✓       │ ○       │ ✓       │ │
│ │ Health Issue         │ ✓       │ ○       │ ✓       │ ○       │ ✓       │ │
│ │ Price Change         │ ✓       │ ○       │ ○       │ ○       │ ○       │ │
│ │ Performance Update   │ ○       │ ○       │ ○       │ ○       │ ○       │ │
│ └──────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘ │
│                                                                              │
│                                                    [Cancel] [Save Changes]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Responsive Behavior

### Breakpoints

| Component | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|-----------|-------------------|---------------------|-----------------|
| CriticalAlertBanner | Full width, inline actions | Full width, stacked | Full width, stacked, smaller text |
| Alert Command Center | 3-column layout | 2-column | Single column, simplified filters |
| ActionableAlertsWidget | Full card display | Full card | Compact cards, swipe actions |
| NotificationCenter | 384px dropdown | 384px dropdown | Full screen modal |

### Mobile-Specific Adaptations

```typescript
// Mobile swipe-to-dismiss for ActionableAlertsWidget
<SwipeableCard onSwipeRight={onAcknowledge} onSwipeLeft={onDismiss}>
  <AlertCard alert={alert} />
</SwipeableCard>

// Mobile full-screen notification center
{isMobile && (
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="right" className="w-full">
      <NotificationCenterContent />
    </SheetContent>
  </Sheet>
)}
```

---

## 7. Implementation Checklist

### Components

- [ ] `CriticalAlertBanner.tsx` - Fixed banner for Tier 1
- [ ] `AlertCommandCenter/page.tsx` - Full alerts page
- [ ] `AlertTable.tsx` - Paginated alert list
- [ ] `ActionableAlertsWidget.tsx` - Dashboard widget
- [ ] `NotificationCenter.tsx` - Header dropdown
- [ ] `NotificationPreferences.tsx` - Settings form
- [ ] `AlertDetailModal.tsx` - Full alert details

### Integration

- [ ] Add `CriticalAlertBanner` to `AppShell.tsx`
- [ ] Replace `AlertsSection` with `ActionableAlertsWidget` in dashboard
- [ ] Add `NotificationCenter` to `Header.tsx`
- [ ] Create `/alerts` route
- [ ] Add `/settings/notifications` route

### Testing

- [ ] Unit tests for priority calculation
- [ ] Integration tests for SSE alert updates
- [ ] E2E tests for acknowledge/dismiss flows
- [ ] Accessibility audit (screen reader, keyboard)
