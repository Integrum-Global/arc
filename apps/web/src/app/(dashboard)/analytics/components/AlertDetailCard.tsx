"use client";

/**
 * AlertDetailCard Component
 *
 * Expandable alert card with detailed information,
 * historical context, and action buttons.
 */

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";

type AlertSeverity = "info" | "warning" | "critical";
type AlertStatus = "active" | "acknowledged" | "dismissed";

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  securityTicker?: string;
  securityId?: string;
  triggeredAt: Date | string | number;
  status: AlertStatus;
  source?: string;
}

export interface AlertDetailCardProps {
  alert: Alert;
  expanded: boolean;
  onToggle: () => void;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onSecurityClick?: (securityId: string, ticker: string) => void;
}

const severityConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertCircle;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    label: string;
  }
> = {
  info: {
    icon: Info,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-l-blue-500",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-l-amber-500",
    label: "Warning",
  },
  critical: {
    icon: AlertCircle,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-l-red-500",
    label: "Critical",
  },
};

const statusStyles: Record<AlertStatus, string> = {
  active: "",
  acknowledged: "opacity-75",
  dismissed: "opacity-50",
};

/**
 * Generate mock threshold data for expanded view
 */
function getMockThresholdData(alert: Alert) {
  // Generate some mock context data
  const isRatio = alert.message.toLowerCase().includes("ratio");
  const isPercentage = alert.message.toLowerCase().includes("%") || alert.message.toLowerCase().includes("margin");

  if (isRatio) {
    const match = alert.message.match(/(\d+\.?\d*)x/);
    const currentValue = match?.[1] ? parseFloat(match[1]) : 1.5;
    return {
      currentValue: `${currentValue.toFixed(2)}x`,
      thresholdValue: alert.severity === "critical" ? "1.0x" : "1.5x",
      previousValue: `${(currentValue * 1.15).toFixed(2)}x`,
      changePercent: -15,
    };
  }

  if (isPercentage) {
    const match = alert.message.match(/(\d+\.?\d*)%/);
    const currentValue = match?.[1] ? parseFloat(match[1]) : 25;
    return {
      currentValue: `${currentValue.toFixed(1)}%`,
      thresholdValue: alert.severity === "critical" ? "20%" : "25%",
      previousValue: `${(currentValue * 1.1).toFixed(1)}%`,
      changePercent: -10,
    };
  }

  return {
    currentValue: "N/A",
    thresholdValue: "N/A",
    previousValue: "N/A",
    changePercent: 0,
  };
}

export function AlertDetailCard({
  alert,
  expanded,
  onToggle,
  onAcknowledge,
  onDismiss,
  onSecurityClick,
}: AlertDetailCardProps) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;
  const relativeTime = formatRelativeTime(alert.triggeredAt);
  const thresholdData = getMockThresholdData(alert);

  const isActionable = alert.status === "active" && (!!onAcknowledge || !!onDismiss);

  return (
    <Card
      className={cn(
        "gap-0 border-l-4 transition-all overflow-hidden",
        config.borderClass,
        statusStyles[alert.status]
      )}
    >
      {/* Header - Always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex gap-3">
          {/* Severity Icon */}
          <div
            className={cn(
              "flex items-center justify-center rounded-full shrink-0 h-8 w-8",
              config.bgClass
            )}
          >
            <Icon className={cn("h-4 w-4", config.colorClass)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Title and time */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{alert.title}</h3>
                {alert.status === "acknowledged" && (
                  <Badge variant="secondary" className="text-xs">
                    Acknowledged
                  </Badge>
                )}
                {alert.status === "dismissed" && (
                  <Badge variant="secondary" className="text-xs opacity-75">
                    Dismissed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground">{relativeTime}</span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {alert.securityTicker && (
                <Badge variant="outline" className={cn("gap-1", config.colorClass)}>
                  {alert.securityTicker}
                </Badge>
              )}
              {alert.source && (
                <Badge variant="secondary" className="text-xs">
                  {alert.source}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <>
          <Separator />
          <div className="p-4 bg-muted/30 space-y-4">
            {/* Threshold Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                <p className="font-semibold tabular-nums">{thresholdData.currentValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Threshold</p>
                <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {thresholdData.thresholdValue}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Previous Value</p>
                <p className="font-semibold tabular-nums">{thresholdData.previousValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Change</p>
                <div className="flex items-center gap-1">
                  {thresholdData.changePercent < 0 ? (
                    <TrendingDown className="h-4 w-4 text-negative" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-positive" />
                  )}
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      thresholdData.changePercent < 0 ? "text-negative" : "text-positive"
                    )}
                  >
                    {thresholdData.changePercent > 0 ? "+" : ""}
                    {thresholdData.changePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Triggered {new Date(alert.triggeredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {alert.securityId && alert.securityTicker && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSecurityClick?.(alert.securityId!, alert.securityTicker!);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View {alert.securityTicker}
                </Button>
              )}
              {isActionable && (
                <>
                  {onAcknowledge && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledge(alert.id);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Acknowledge
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(alert.id);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

AlertDetailCard.displayName = "AlertDetailCard";
