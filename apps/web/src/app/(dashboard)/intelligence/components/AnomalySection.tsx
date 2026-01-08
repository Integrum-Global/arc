"use client";

/**
 * AnomalySection Component
 *
 * Displays anomaly detection results for portfolio positions,
 * highlighting unusual patterns and potential concerns.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  ChevronRight,
  Shield,
} from "lucide-react";

export interface Anomaly {
  id: string;
  type: "price" | "volume" | "volatility" | "correlation" | "pattern";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  securityId?: string;
  securitySymbol?: string;
  detectedAt: string;
  value?: number;
  expectedValue?: number;
  deviation?: number;
}

export interface AnomalySectionProps {
  /** List of detected anomalies */
  anomalies?: Anomaly[];
  /** Whether anomalies are loading */
  isLoading?: boolean;
  /** Callback when viewing anomaly details */
  onViewDetails?: (anomaly: Anomaly) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Get anomaly type configuration
 */
function getAnomalyTypeConfig(type: Anomaly["type"]) {
  switch (type) {
    case "price":
      return {
        icon: TrendingUp,
        label: "Price",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    case "volume":
      return {
        icon: Activity,
        label: "Volume",
        className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      };
    case "volatility":
      return {
        icon: TrendingDown,
        label: "Volatility",
        className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      };
    case "correlation":
      return {
        icon: Activity,
        label: "Correlation",
        className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      };
    case "pattern":
      return {
        icon: Eye,
        label: "Pattern",
        className: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      };
    default:
      return {
        icon: AlertTriangle,
        label: "Unknown",
        className: "bg-muted text-muted-foreground",
      };
  }
}

/**
 * Get severity configuration
 */
function getSeverityConfig(severity: Anomaly["severity"]) {
  switch (severity) {
    case "high":
      return {
        label: "High",
        className:
          "bg-destructive/10 text-destructive border-destructive/20",
        dotClass: "bg-destructive",
      };
    case "medium":
      return {
        label: "Medium",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        dotClass: "bg-amber-500",
      };
    default:
      return {
        label: "Low",
        className: "bg-muted text-muted-foreground border-muted",
        dotClass: "bg-muted-foreground",
      };
  }
}

/**
 * Loading skeleton for AnomalySection
 */
export function AnomalySectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Anomaly card component
 */
function AnomalyCard({
  anomaly,
  onViewDetails,
}: {
  anomaly: Anomaly;
  onViewDetails?: (anomaly: Anomaly) => void;
}) {
  const typeConfig = getAnomalyTypeConfig(anomaly.type);
  const severityConfig = getSeverityConfig(anomaly.severity);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg shrink-0",
              typeConfig.className.split(" ")[0]
            )}
          >
            <TypeIcon className={cn("h-4 w-4", typeConfig.className.split(" ")[1])} />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium">{anomaly.title}</h4>
              {anomaly.securitySymbol && (
                <Badge variant="outline" className="text-xs">
                  {anomaly.securitySymbol}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {anomaly.description}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-xs", severityConfig.className)}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full mr-1",
              severityConfig.dotClass
            )}
          />
          {severityConfig.label}
        </Badge>
      </div>

      {/* Deviation info */}
      {(anomaly.value !== undefined || anomaly.deviation !== undefined) && (
        <div className="flex items-center gap-4 text-xs">
          {anomaly.value !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Actual:</span>
              <span className="font-medium tabular-nums">
                {anomaly.value.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          {anomaly.expectedValue !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Expected:</span>
              <span className="font-medium tabular-nums">
                {anomaly.expectedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          {anomaly.deviation !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Deviation:</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  anomaly.deviation > 0 ? "text-positive" : "text-negative"
                )}
              >
                {anomaly.deviation > 0 ? "+" : ""}
                {anomaly.deviation.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {new Date(anomaly.detectedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onViewDetails(anomaly)}
          >
            Details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AnomalySection({
  anomalies = [],
  isLoading = false,
  onViewDetails,
  className,
}: AnomalySectionProps) {
  if (isLoading) {
    return <AnomalySectionSkeleton />;
  }

  const hasHighSeverity = anomalies.some((a) => a.severity === "high");
  const anomalyCount = anomalies.length;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Anomaly Detection
          </CardTitle>
          {anomalyCount > 0 ? (
            <Badge
              variant="outline"
              className={cn(
                hasHighSeverity
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              )}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {anomalyCount} {anomalyCount === 1 ? "anomaly" : "anomalies"}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-positive/10 text-positive border-positive/20"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              No anomalies
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <AnomalyCard
                key={anomaly.id}
                anomaly={anomaly}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-positive" />
            <p className="text-sm font-medium">All Clear</p>
            <p className="text-xs mt-1">
              No unusual patterns detected in your portfolio
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

AnomalySection.displayName = "AnomalySection";
AnomalySection.Skeleton = AnomalySectionSkeleton;
