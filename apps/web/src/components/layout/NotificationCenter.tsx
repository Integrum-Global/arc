/**
 * NotificationCenter Component
 *
 * Header dropdown for quick access to recent alerts across all tiers.
 * Based on docs/02-plans/09-alert-strategy/02-components.md (Section 4)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { Alert } from "@/types/alert";

/**
 * Group alerts by time period
 */
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
    groups[label]!.push(alert); // Safe: we just initialized it above
  }

  return groups;
}

/**
 * NotificationCenter Component
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const alerts = useAlertStore((state) => state.alerts);
  const criticalAlerts = useAlertStore((state) => state.criticalAlerts);
  const unreadCount = useAlertStore((state) => state.unreadCount);
  const markAllRead = useAlertStore((state) => state.markAllRead);

  // Get latest 20 alerts
  const recentAlerts = alerts.slice(0, 20);

  // Group non-critical alerts by time
  const nonCriticalAlerts = recentAlerts.filter(
    (alert) => alert.severity !== "critical"
  );
  const grouped = groupAlertsByTime(nonCriticalAlerts);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
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

          {/* Empty State */}
          {recentAlerts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t flex justify-end">
          <Button variant="link" size="sm" asChild>
            <Link href="/alerts">
              View all alerts
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * AlertSection Component - Groups alerts under a label
 */
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

/**
 * NotificationItem Component - Individual alert item
 */
function NotificationItem({ alert }: { alert: Alert }) {
  const severityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <Link
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
    </Link>
  );
}
