"use client";

/**
 * HealthTab Component
 *
 * Displays portfolio health score gauge and issues list.
 */

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
} from "lucide-react";
import { Grid } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { usePortfolioHealth } from "@/hooks/usePortfolios";
import { cn } from "@/lib/utils";
import type { HealthIssue, HealthRecommendation, HealthCategory } from "@/types/api";

interface HealthTabProps {
  portfolioId: string;
}

// Status icon mapping
const statusIcons = {
  healthy: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle,
};

// Status color mapping
const statusColors = {
  healthy: "text-positive",
  warning: "text-amber-500",
  critical: "text-destructive",
};

// Severity config
const severityConfig: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  low: { variant: "secondary", icon: Info },
  medium: { variant: "default", icon: AlertTriangle },
  high: { variant: "destructive", icon: AlertTriangle },
  critical: { variant: "destructive", icon: XCircle },
};

// Priority config
const priorityConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { variant: "secondary" },
  medium: { variant: "default" },
  high: { variant: "destructive" },
};

export function HealthTab({ portfolioId }: HealthTabProps) {
  // Fetch health data
  const { data: healthData, isPending, error } = usePortfolioHealth(portfolioId);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load health data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <Grid cols={{ default: 1, md: 2 }} gap="md">
        {/* Overall Score Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isPending ? (
              <Skeleton className="h-48 w-48 rounded-full" />
            ) : healthData ? (
              <>
                <GaugeChart
                  value={healthData.overall_score}
                  min={0}
                  max={100}
                  simpleThresholds={{
                    warning: 70,
                    critical: 40,
                    isLowerBetter: false,
                  }}
                  label="Health Score"
                  size={200}
                  showValue
                  showMinMax
                />
                <div className="mt-4 flex items-center gap-2">
                  {React.createElement(
                    statusIcons[healthData.overall_status],
                    {
                      className: cn(
                        "h-5 w-5",
                        statusColors[healthData.overall_status]
                      ),
                    }
                  )}
                  <span
                    className={cn(
                      "text-lg font-semibold capitalize",
                      statusColors[healthData.overall_status]
                    )}
                  >
                    {healthData.overall_status}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No health data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : healthData?.categories ? (
              <div className="space-y-4">
                {healthData.categories.map((category) => (
                  <CategoryRow key={category.name} category={category} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No categories available
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Issues</CardTitle>
            {healthData && (
              <Badge variant="secondary">
                {healthData.issues.length} issue{healthData.issues.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : healthData?.issues.length ? (
            <div className="space-y-4">
              {healthData.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-positive mb-4" />
              <p className="text-lg font-semibold text-positive">No Issues Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your portfolio is in great health!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
            {healthData && (
              <Badge variant="secondary">
                {healthData.recommendations.length} recommendation{healthData.recommendations.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : healthData?.recommendations.length ? (
            <div className="space-y-4">
              {healthData.recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No recommendations at this time
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Category row component
function CategoryRow({ category }: { category: HealthCategory }) {
  const StatusIcon = statusIcons[category.status];

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <StatusIcon
          className={cn("h-4 w-4", statusColors[category.status])}
        />
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono tabular-nums">{category.score}/100</span>
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              category.score >= 70
                ? "bg-positive"
                : category.score >= 40
                  ? "bg-amber-500"
                  : "bg-destructive"
            )}
            style={{ width: `${category.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Issue card component
function IssueCard({ issue }: { issue: HealthIssue }) {
  const config = severityConfig[issue.severity] ?? severityConfig.low;
  const Icon = config?.icon ?? Info;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "h-5 w-5 mt-0.5 shrink-0",
            issue.severity === "critical" || issue.severity === "high"
              ? "text-destructive"
              : issue.severity === "medium"
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{issue.title}</p>
              <p className="text-sm text-muted-foreground">{issue.category}</p>
            </div>
            <Badge variant={config?.variant ?? "secondary"} className="shrink-0">
              {issue.severity}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
          {issue.recommended_action && (
            <p className="text-sm">
              <span className="font-medium">Recommended action:</span>{" "}
              {issue.recommended_action}
            </p>
          )}
          {issue.affected_holdings && issue.affected_holdings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {issue.affected_holdings.map((holding) => (
                <Badge key={holding} variant="outline" className="text-xs">
                  {holding}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Recommendation card component
function RecommendationCard({
  recommendation,
}: {
  recommendation: HealthRecommendation;
}) {
  const config = priorityConfig[recommendation.priority] ?? priorityConfig.low;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold">{recommendation.title}</p>
          <p className="text-sm text-muted-foreground">
            {recommendation.category}
          </p>
        </div>
        <Badge variant={config?.variant ?? "secondary"}>{recommendation.priority}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {recommendation.description}
      </p>
      {recommendation.expected_impact && (
        <p className="text-sm mt-2">
          <span className="font-medium">Expected impact:</span>{" "}
          {recommendation.expected_impact}
        </p>
      )}
    </div>
  );
}
