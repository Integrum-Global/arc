"use client";

/**
 * SecurityAnalysis Component
 *
 * Displays AI-powered security analysis with health gauge,
 * key metrics, and recommendations.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GaugeChart } from "@/components/charts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

export interface SecurityMetric {
  name: string;
  value: number;
  trend?: "up" | "down" | "stable";
  status?: "good" | "warning" | "critical";
  description?: string;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  action?: string;
}

export interface SecurityAnalysisData {
  securityId: string;
  securityName: string;
  securitySymbol: string;
  overallScore: number;
  overallStatus: "healthy" | "warning" | "critical";
  summary: string;
  metrics: SecurityMetric[];
  recommendations: SecurityRecommendation[];
  generatedAt: string;
}

export interface SecurityAnalysisProps {
  /** Analysis data */
  data: SecurityAnalysisData;
  /** Whether the analysis is loading */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Get status icon and color
 */
function getStatusConfig(status: SecurityAnalysisData["overallStatus"]) {
  switch (status) {
    case "healthy":
      return {
        icon: CheckCircle,
        label: "Healthy",
        className: "text-positive bg-positive/10 border-positive/20",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        label: "Warning",
        className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    case "critical":
      return {
        icon: XCircle,
        label: "Critical",
        className: "text-destructive bg-destructive/10 border-destructive/20",
      };
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend?: SecurityMetric["trend"]) {
  switch (trend) {
    case "up":
      return TrendingUp;
    case "down":
      return TrendingDown;
    default:
      return Minus;
  }
}

/**
 * Get metric status color
 */
function getMetricStatusColor(status?: SecurityMetric["status"]) {
  switch (status) {
    case "good":
      return "text-positive";
    case "warning":
      return "text-amber-500";
    case "critical":
      return "text-destructive";
    default:
      return "text-foreground";
  }
}

/**
 * Get priority badge config
 */
function getPriorityConfig(priority: SecurityRecommendation["priority"]) {
  switch (priority) {
    case "high":
      return {
        label: "High Priority",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    case "medium":
      return {
        label: "Medium",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    default:
      return {
        label: "Low",
        className: "bg-muted text-muted-foreground border-muted",
      };
  }
}

/**
 * Loading skeleton for SecurityAnalysis
 */
export function SecurityAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gauge */}
        <div className="flex justify-center">
          <Skeleton className="h-32 w-48 rounded-full" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SecurityAnalysis({
  data,
  isLoading = false,
  className,
}: SecurityAnalysisProps) {
  if (isLoading) {
    return <SecurityAnalysisSkeleton />;
  }

  const statusConfig = getStatusConfig(data.overallStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{data.securityName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {data.securitySymbol}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("flex items-center gap-1", statusConfig.className)}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Score Gauge */}
        <div className="flex flex-col items-center">
          <GaugeChart
            value={data.overallScore}
            min={0}
            max={100}
            label="Health Score"
            size={180}
            strokeWidth={16}
            simpleThresholds={{
              warning: 70,
              critical: 40,
              isLowerBetter: false,
            }}
          />
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Key Metrics */}
        {data.metrics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {data.metrics.slice(0, 6).map((metric, index) => {
                const TrendIcon = getTrendIcon(metric.trend);
                return (
                  <div
                    key={index}
                    className="bg-muted/30 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {metric.name}
                      </span>
                      <TrendIcon
                        className={cn(
                          "h-3 w-3",
                          metric.trend === "up"
                            ? "text-positive"
                            : metric.trend === "down"
                              ? "text-negative"
                              : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold tabular-nums",
                        getMetricStatusColor(metric.status)
                      )}
                    >
                      {typeof metric.value === "number"
                        ? metric.value.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                        : metric.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recommendations
            </h4>
            <div className="space-y-3">
              {data.recommendations.slice(0, 3).map((rec) => {
                const priorityConfig = getPriorityConfig(rec.priority);
                return (
                  <div
                    key={rec.id}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-medium">{rec.title}</h5>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", priorityConfig.className)}
                      >
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.description}
                    </p>
                    {rec.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                      >
                        {rec.action}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generated timestamp */}
        <div className="pt-2 text-xs text-muted-foreground text-center">
          Generated{" "}
          {new Date(data.generatedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      </CardContent>
    </Card>
  );
}

SecurityAnalysis.displayName = "SecurityAnalysis";
SecurityAnalysis.Skeleton = SecurityAnalysisSkeleton;
