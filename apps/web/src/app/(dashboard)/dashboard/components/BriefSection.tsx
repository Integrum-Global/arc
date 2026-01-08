"use client";

/**
 * BriefSection Component
 *
 * Displays today's morning brief summary with key takeaways.
 */

import { Section } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatting";
import Link from "next/link";
import type { MarketBrief } from "@/types/api";

export interface BriefSectionProps {
  /** Market brief data */
  brief: MarketBrief | null;
  /** Loading state */
  loading?: boolean;
}

/**
 * Impact icon component
 */
function ImpactIcon({ impact }: { impact: "positive" | "negative" | "neutral" }) {
  const icons = {
    positive: <TrendingUp className="h-4 w-4 text-positive" />,
    negative: <TrendingDown className="h-4 w-4 text-negative" />,
    neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
  };
  return icons[impact];
}

/**
 * Single insight item
 */
function InsightItem({
  insight,
}: {
  insight: {
    category: string;
    insight: string;
    impact: "positive" | "negative" | "neutral";
    confidence: number;
  };
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="mt-0.5">
        <ImpactIcon impact={insight.impact} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{insight.insight}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {insight.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Action item component
 */
function ActionItemCard({
  action,
}: {
  action: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
  };
}) {
  const priorityColors = {
    low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    high: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <CheckCircle2
        className={`h-4 w-4 mt-0.5 ${action.completed ? "text-positive" : "text-muted-foreground"}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${action.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
        >
          {action.title}
        </p>
        <Badge className={`mt-1 text-xs ${priorityColors[action.priority]}`}>
          {action.priority}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Empty state when there's no brief
 */
function EmptyBrief() {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Newspaper className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No brief available</p>
          <p className="text-sm text-muted-foreground">
            Check back later for your morning brief
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Brief section skeleton
 */
function BriefSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Insights */}
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * BriefSection component showing today's morning brief
 */
export function BriefSection({ brief, loading = false }: BriefSectionProps) {
  if (loading) {
    return (
      <Section title="Morning Brief" subtitle="AI-generated market insights">
        <BriefSkeleton />
      </Section>
    );
  }

  if (!brief) {
    return (
      <Section title="Morning Brief" subtitle="AI-generated market insights">
        <EmptyBrief />
      </Section>
    );
  }

  // Get top 3 insights
  const topInsights = brief.insights?.slice(0, 3) ?? [];

  // Get pending action items
  const pendingActions = brief.action_items?.filter((a) => !a.completed).slice(0, 2) ?? [];

  return (
    <Section
      title="Morning Brief"
      subtitle={`Generated ${formatDateTime(brief.generated_at)}`}
      actions={
        <Link href="/intelligence/briefs">
          <Button variant="ghost" size="sm" className="h-8">
            Full Brief
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      <Card className="p-4">
        {/* Summary */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground">{brief.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {brief.summary}
          </p>
        </div>

        {/* Key Insights */}
        {topInsights.length > 0 && (
          <div className="border-t border-border pt-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium text-sm text-foreground">
                Key Insights
              </h4>
            </div>
            <div className="space-y-0">
              {topInsights.map((insight, index) => (
                <InsightItem key={index} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {pendingActions.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm text-foreground">
                Suggested Actions
              </h4>
            </div>
            <div className="space-y-0">
              {pendingActions.map((action) => (
                <ActionItemCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}
      </Card>
    </Section>
  );
}

BriefSection.displayName = "BriefSection";

export default BriefSection;
