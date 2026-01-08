"use client";

/**
 * BriefSection Component
 *
 * Displays today's market brief with key takeaways,
 * insights, and action items.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  RefreshCw,
  FileText,
  Clock,
  Sun,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { MarketBriefCard } from "./MarketBriefCard";
import { useMorningBrief, useMiddayBrief, useClosingBrief } from "@/hooks/useIntelligence";
import type { BriefType } from "@/types/api";

export interface BriefSectionProps {
  /** Optional portfolio ID to scope the brief */
  portfolioId?: string;
  /** Brief type to display */
  briefType?: BriefType;
  /** Additional class name */
  className?: string;
}

/**
 * Icon mapping for brief types
 */
const briefIconMap: Record<BriefType | "default", LucideIcon> = {
  morning: Sun,
  midday: Clock,
  closing: Sunset,
  weekly: FileText,
  monthly: FileText,
  custom: FileText,
  default: FileText,
};

/**
 * Get brief type label
 */
function getBriefLabel(type: BriefType): string {
  switch (type) {
    case "morning":
      return "Morning Brief";
    case "midday":
      return "Midday Update";
    case "closing":
      return "Closing Summary";
    case "weekly":
      return "Weekly Summary";
    case "monthly":
      return "Monthly Report";
    default:
      return "Market Brief";
  }
}

/**
 * Determine the most relevant brief type based on current time
 */
function getCurrentBriefType(): BriefType {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 16) return "midday";
  return "closing";
}

/**
 * Loading skeleton for BriefSection
 */
export function BriefSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid gap-4 pt-4">
          <MarketBriefCard.Skeleton />
        </div>
      </CardContent>
    </Card>
  );
}

export function BriefSection({
  portfolioId,
  briefType: initialBriefType,
  className,
}: BriefSectionProps) {
  const [selectedType, setSelectedType] = React.useState<BriefType>(
    initialBriefType || getCurrentBriefType()
  );

  // Use the appropriate hook based on selected type
  const { data: morningBrief, isLoading: morningLoading, refetch: refetchMorning } = useMorningBrief(
    portfolioId,
    { enabled: selectedType === "morning" }
  );
  const { data: middayBrief, isLoading: middayLoading, refetch: refetchMidday } = useMiddayBrief(
    portfolioId,
    { enabled: selectedType === "midday" }
  );
  const { data: closingBrief, isLoading: closingLoading, refetch: refetchClosing } = useClosingBrief(
    portfolioId,
    { enabled: selectedType === "closing" }
  );

  // Get the current brief based on selected type
  const currentBrief = React.useMemo(() => {
    switch (selectedType) {
      case "morning":
        return morningBrief;
      case "midday":
        return middayBrief;
      case "closing":
        return closingBrief;
      default:
        return morningBrief;
    }
  }, [selectedType, morningBrief, middayBrief, closingBrief]);

  const isLoading = React.useMemo(() => {
    switch (selectedType) {
      case "morning":
        return morningLoading;
      case "midday":
        return middayLoading;
      case "closing":
        return closingLoading;
      default:
        return false;
    }
  }, [selectedType, morningLoading, middayLoading, closingLoading]);

  const handleRefresh = () => {
    switch (selectedType) {
      case "morning":
        refetchMorning();
        break;
      case "midday":
        refetchMidday();
        break;
      case "closing":
        refetchClosing();
        break;
    }
  };

  const briefTypes: BriefType[] = ["morning", "midday", "closing"];

  // Get icon component for selected type
  const CurrentIcon = briefIconMap[selectedType] || briefIconMap.default;

  if (isLoading) {
    return <BriefSectionSkeleton />;
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CurrentIcon className="h-5 w-5 text-primary" />
            Today&apos;s Brief
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {briefTypes.map((type) => {
                const TypeIcon = briefIconMap[type];
                return (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSelectedType(type)}
                    title={getBriefLabel(type)}
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              title="Refresh brief"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {currentBrief ? (
          <>
            {/* Brief Header */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(currentBrief.generated_at).toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
              <Badge variant="outline">
                {getBriefLabel(selectedType)}
              </Badge>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">{currentBrief.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentBrief.summary}
              </p>
            </div>

            {/* Brief Sections */}
            {currentBrief.sections && currentBrief.sections.length > 0 && (
              <div className="space-y-3">
                {currentBrief.sections
                  .filter((section) => section.type === "text")
                  .slice(0, 2)
                  .map((section, index) => (
                    <MarketBriefCard
                      key={index}
                      title={section.title}
                      content={section.content}
                      sentiment={
                        currentBrief.insights?.[0]?.impact === "positive"
                          ? "positive"
                          : currentBrief.insights?.[0]?.impact === "negative"
                            ? "negative"
                            : "neutral"
                      }
                    />
                  ))}
              </div>
            )}

            {/* Key Insights from Brief */}
            {currentBrief.insights && currentBrief.insights.length > 0 && (
              <MarketBriefCard
                title="Key Insights"
                content="Based on today's market analysis and your portfolio positions."
                insights={currentBrief.insights}
                actionItems={currentBrief.action_items}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No brief available for this time period</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Brief
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

BriefSection.displayName = "BriefSection";
BriefSection.Skeleton = BriefSectionSkeleton;
