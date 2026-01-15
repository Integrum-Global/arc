/**
 * CriticalAlertBanner Component
 * Fixed banner at top of viewport for Tier 1 critical alerts
 *
 * Features:
 * - Single alert mode: Full banner with details
 * - Multiple alerts mode: Collapsed summary, expandable
 * - Acknowledge/View Details actions
 * - Animate in/out with framer-motion
 * - ARIA live region for accessibility
 * - Responsive: stacked layout on mobile
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatting";
import { useCriticalAlerts, useAlertStore } from "@/stores/alertStore";
import type { Alert } from "@/types/alert";

/**
 * Main CriticalAlertBanner component
 * Renders null when no critical alerts, single alert view, or multiple alerts view
 */
export function CriticalAlertBanner() {
  const criticalAlerts = useCriticalAlerts();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no critical alerts
  if (criticalAlerts.length === 0) {
    return null;
  }

  const showSingle = criticalAlerts.length === 1;
  const firstAlert = criticalAlerts[0]!; // Safe: we already checked length > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-red-600 text-white sticky top-0 z-50 shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        {showSingle ? (
          <SingleAlertContent alert={firstAlert} />
        ) : (
          <MultiAlertContent
            alerts={criticalAlerts}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Single Alert Content
 * Full banner display for a single critical alert
 */
interface SingleAlertContentProps {
  alert: Alert;
}

function SingleAlertContent({ alert }: SingleAlertContentProps) {
  const router = useRouter();
  const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);

  const handleViewDetails = () => {
    router.push(`/alerts/${alert.id}`);
  };

  const handleAcknowledge = () => {
    acknowledgeAlert(alert.id);
  };

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-start gap-3 flex-col sm:flex-row">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>CRITICAL</span>
              <span className="opacity-70 hidden sm:inline">|</span>
              <span className="truncate">{alert.message}</span>
            </div>
            <div className="text-sm opacity-90 mt-0.5">
              {alert.portfolio_name && (
                <>
                  <span>Portfolio: {alert.portfolio_name}</span>
                  <span className="mx-1">•</span>
                </>
              )}
              <span>Triggered {formatRelativeTime(new Date(alert.created_at))}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 flex-1 sm:flex-initial"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-initial"
            onClick={handleAcknowledge}
          >
            Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple Alerts Content
 * Collapsed summary with expandable list of all critical alerts
 */
interface MultiAlertContentProps {
  alerts: Alert[];
  isExpanded: boolean;
  onToggle: () => void;
}

function MultiAlertContent({
  alerts,
  isExpanded,
  onToggle,
}: MultiAlertContentProps) {
  const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);

  const handleAcknowledgeAll = () => {
    alerts.forEach((alert) => acknowledgeAlert(alert.id));
  };

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity w-full sm:w-auto"
          aria-expanded={isExpanded}
          aria-controls="critical-alerts-list"
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span>{alerts.length} CRITICAL ALERTS</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
        <Button
          variant="outline"
          size="sm"
          className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
          onClick={handleAcknowledgeAll}
        >
          Acknowledge All
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="critical-alerts-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between text-sm bg-white/10 rounded px-3 py-2 flex-col sm:flex-row gap-1"
              >
                <span className="truncate w-full sm:w-auto">• {alert.message}</span>
                <span className="opacity-80 text-xs sm:text-sm whitespace-nowrap">
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
