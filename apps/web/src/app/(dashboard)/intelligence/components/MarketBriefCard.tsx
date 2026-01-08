"use client";

/**
 * MarketBriefCard Component
 *
 * Displays a market brief section with sentiment badge,
 * title, and content.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  CheckSquare,
} from "lucide-react";
import type { BriefInsight, ActionItem } from "@/types/api";

export interface MarketBriefCardProps {
  /** Section title */
  title: string;
  /** Section content */
  content: string;
  /** Market sentiment/impact */
  sentiment?: "positive" | "negative" | "neutral";
  /** Key insights */
  insights?: BriefInsight[];
  /** Action items */
  actionItems?: ActionItem[];
  /** Additional class name */
  className?: string;
}

/**
 * Get sentiment badge configuration
 */
function getSentimentConfig(sentiment: MarketBriefCardProps["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return {
        icon: TrendingUp,
        label: "Bullish",
        className:
          "bg-positive/10 text-positive border-positive/20 hover:bg-positive/20",
      };
    case "negative":
      return {
        icon: TrendingDown,
        label: "Bearish",
        className:
          "bg-negative/10 text-negative border-negative/20 hover:bg-negative/20",
      };
    default:
      return {
        icon: Minus,
        label: "Neutral",
        className:
          "bg-neutral/10 text-neutral border-neutral/20 hover:bg-neutral/20",
      };
  }
}

/**
 * Loading skeleton for MarketBriefCard
 */
export function MarketBriefCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function MarketBriefCard({
  title,
  content,
  sentiment,
  insights,
  actionItems,
  className,
}: MarketBriefCardProps) {
  const sentimentConfig = sentiment ? getSentimentConfig(sentiment) : null;
  const SentimentIcon = sentimentConfig?.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {sentimentConfig && (
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1 shrink-0",
                sentimentConfig.className
              )}
            >
              {SentimentIcon && <SentimentIcon className="h-3 w-3" />}
              {sentimentConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Content */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {content}
        </p>

        {/* Key Insights */}
        {insights && insights.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Key Insights
            </h4>
            <ul className="space-y-1.5">
              {insights.slice(0, 3).map((insight, index) => (
                <li
                  key={index}
                  className="text-xs flex items-start gap-2"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                      insight.impact === "positive"
                        ? "bg-positive"
                        : insight.impact === "negative"
                          ? "bg-negative"
                          : "bg-neutral"
                    )}
                  />
                  <span>{insight.insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {actionItems && actionItems.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              Action Items
            </h4>
            <ul className="space-y-1.5">
              {actionItems.slice(0, 3).map((item) => (
                <li
                  key={item.id}
                  className="text-xs flex items-start gap-2"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                      item.priority === "high"
                        ? "bg-destructive"
                        : item.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

MarketBriefCard.displayName = "MarketBriefCard";
MarketBriefCard.Skeleton = MarketBriefCardSkeleton;
