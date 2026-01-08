"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Check,
  ExternalLink,
} from "lucide-react";

/**
 * AlertCard Component
 *
 * A card component for displaying alerts with severity indicators,
 * related security links, timestamps, and action buttons.
 */

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "dismissed";

export interface Alert {
  /** Unique alert identifier */
  id: string;
  /** Alert severity level */
  severity: AlertSeverity;
  /** Alert title */
  title: string;
  /** Alert message/description */
  message: string;
  /** Related security ticker (optional) */
  securityTicker?: string;
  /** Related security ID for navigation (optional) */
  securityId?: string;
  /** When the alert was triggered */
  triggeredAt: Date | string | number;
  /** Current alert status */
  status: AlertStatus;
  /** Optional source/category */
  source?: string;
}

export interface AlertCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** The alert data */
  alert: Alert;
  /** Callback when alert is acknowledged */
  onAcknowledge?: (alertId: string) => void;
  /** Callback when alert is dismissed */
  onDismiss?: (alertId: string) => void;
  /** Callback when card is clicked */
  onClick?: (alert: Alert) => void;
  /** Callback when security ticker is clicked */
  onSecurityClick?: (securityId: string, ticker: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Compact mode (less padding, smaller text) */
  compact?: boolean;
  /** Show action buttons */
  showActions?: boolean;
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
 * Loading skeleton for AlertCard
 */
export function AlertCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 border-l-4 border-l-muted",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex gap-3">
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
  onClick,
  onSecurityClick,
  loading = false,
  compact = false,
  showActions = true,
  className,
  ...props
}: AlertCardProps) {
  if (loading) {
    return <AlertCardSkeleton compact={compact} className={className} />;
  }

  const config = severityConfig[alert.severity];
  const Icon = config.icon;
  const relativeTime = formatRelativeTime(alert.triggeredAt);
  const isClickable = !!onClick;
  const isActionable =
    showActions &&
    alert.status === "active" &&
    (!!onAcknowledge || !!onDismiss);

  const handleCardClick = () => {
    if (onClick) {
      onClick(alert);
    }
  };

  const handleSecurityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSecurityClick && alert.securityId && alert.securityTicker) {
      onSecurityClick(alert.securityId, alert.securityTicker);
    }
  };

  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAcknowledge?.(alert.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(alert.id);
  };

  return (
    <Card
      className={cn(
        "gap-0 border-l-4 transition-all",
        config.borderClass,
        statusStyles[alert.status],
        compact ? "p-3" : "p-4",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary/20",
        className
      )}
      onClick={isClickable ? handleCardClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }
          : undefined
      }
      {...props}
    >
      <div className="flex gap-3">
        {/* Severity Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full shrink-0",
            compact ? "h-6 w-6" : "h-8 w-8",
            config.bgClass
          )}
        >
          <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", config.colorClass)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header: Title and time */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-foreground truncate",
                  compact ? "text-sm" : "text-base"
                )}
              >
                {alert.title}
              </h3>
              {alert.status === "acknowledged" && (
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                  Acknowledged
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-muted-foreground shrink-0",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {relativeTime}
            </span>
          </div>

          {/* Message */}
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "text-xs line-clamp-2" : "text-sm"
            )}
          >
            {alert.message}
          </p>

          {/* Security Link */}
          {alert.securityTicker && (
            <button
              onClick={handleSecurityClick}
              className={cn(
                "inline-flex items-center gap-1 font-medium hover:underline",
                config.colorClass,
                compact ? "text-xs" : "text-sm"
              )}
              disabled={!onSecurityClick}
            >
              {alert.securityTicker}
              <ExternalLink className="h-3 w-3" />
            </button>
          )}

          {/* Source Tag */}
          {alert.source && (
            <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {alert.source}
            </span>
          )}

          {/* Action Buttons */}
          {isActionable && (
            <div className="flex gap-2 pt-1">
              {onAcknowledge && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcknowledge}
                  className="h-8"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Acknowledge
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

AlertCard.displayName = "AlertCard";
AlertCard.Skeleton = AlertCardSkeleton;
