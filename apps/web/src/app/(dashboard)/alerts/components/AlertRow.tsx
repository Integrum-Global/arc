/**
 * AlertRow Component
 *
 * Renders a single alert row with severity badge, message, actions.
 * Can be used in table or card layout.
 *
 * Features:
 * - Severity badge with color coding
 * - Truncated message with tooltip
 * - Portfolio and security links
 * - Action buttons (View, Acknowledge, Dismiss, More)
 * - Relative timestamps
 * - Compact mode for mobile
 */

"use client";

import Link from "next/link";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Check, X, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import type { Alert, AlertSeverity } from "@/types/alert";

export interface AlertRowProps {
  /** Alert data */
  alert: Alert;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Optional handlers (for testing) */
  onAcknowledge?: () => void;
  onDismiss?: () => void;
}

/**
 * Severity badge configuration
 */
const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; variant: "destructive" | "default" | "secondary"; className: string }
> = {
  critical: {
    label: "Critical",
    variant: "destructive",
    className: "bg-red-500 hover:bg-red-600",
  },
  high: {
    label: "High",
    variant: "default",
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  medium: {
    label: "Medium",
    variant: "default",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  low: {
    label: "Low",
    variant: "secondary",
    className: "bg-gray-500 hover:bg-gray-600 text-white",
  },
};

/**
 * Format alert type for display
 */
function formatAlertType(alertType: string): string {
  return alertType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Severity Badge Component
 */
function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <Badge variant={config.variant} className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Compact Mode (Mobile Card)
 */
function CompactAlertRow({ alert, onAcknowledge, onDismiss }: AlertRowProps) {
  const acknowledgeAlert = useAcknowledgeAlert();
  const dismissAlert = useDismissAlert();

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge();
    } else {
      acknowledgeAlert.mutate(alert.id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      dismissAlert.mutate(alert.id);
    }
  };

  return (
    <div className="flex-1">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(alert.created_at)}
        </span>
      </div>

      {/* Message */}
      <p className="font-medium text-foreground mb-1">{alert.message}</p>

      {/* Details */}
      {alert.details && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {alert.details}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        {alert.portfolio_name && (
          <>
            <Link
              href={`/portfolios/${alert.portfolio_id}`}
              className="hover:underline"
            >
              {alert.portfolio_name}
            </Link>
            <span>•</span>
          </>
        )}
        <span>{formatAlertType(alert.alert_type)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/alerts/${alert.id}`}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Link>
        </Button>
        {alert.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAcknowledge}
            disabled={acknowledgeAlert.isPending}
          >
            <Check className="h-3 w-3 mr-1" />
            Acknowledge
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          disabled={dismissAlert.isPending}
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/**
 * Table Row Mode (Desktop)
 */
function TableAlertRow({ alert, onAcknowledge, onDismiss }: AlertRowProps) {
  const acknowledgeAlert = useAcknowledgeAlert();
  const dismissAlert = useDismissAlert();

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge();
    } else {
      acknowledgeAlert.mutate(alert.id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      dismissAlert.mutate(alert.id);
    }
  };

  return (
    <>
      {/* Severity */}
      <TableCell>
        <SeverityBadge severity={alert.severity} />
      </TableCell>

      {/* Message */}
      <TableCell>
        <div>
          <p className="font-medium text-foreground">{alert.message}</p>
          {alert.details && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {alert.details}
            </p>
          )}
        </div>
      </TableCell>

      {/* Portfolio */}
      <TableCell>
        {alert.portfolio_name && alert.portfolio_id ? (
          <Link
            href={`/portfolios/${alert.portfolio_id}`}
            className="text-sm hover:underline"
          >
            {alert.portfolio_name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Type */}
      <TableCell>
        <span className="text-sm">{formatAlertType(alert.alert_type)}</span>
      </TableCell>

      {/* Time */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(alert.created_at)}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Link href={`/alerts/${alert.id}`}>
            <Button size="sm" variant="ghost" aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>

          {alert.status === "active" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAcknowledge}
              disabled={acknowledgeAlert.isPending}
              aria-label="Acknowledge"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissAlert.isPending}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" aria-label="More">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/alerts/${alert.id}`}>View Details</Link>
              </DropdownMenuItem>
              {alert.portfolio_id && (
                <DropdownMenuItem asChild>
                  <Link href={`/portfolios/${alert.portfolio_id}`}>
                    View Portfolio
                  </Link>
                </DropdownMenuItem>
              )}
              {alert.security_id && (
                <DropdownMenuItem asChild>
                  <Link href={`/securities/${alert.security_id}`}>
                    View Security
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDismiss}>
                Dismiss Alert
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </>
  );
}

/**
 * AlertRow Component
 */
export function AlertRow(props: AlertRowProps) {
  if (props.compact) {
    return <CompactAlertRow {...props} />;
  }
  return <TableAlertRow {...props} />;
}

AlertRow.displayName = "AlertRow";
