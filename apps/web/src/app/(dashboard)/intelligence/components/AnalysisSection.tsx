"use client";

/**
 * AnalysisSection Component
 *
 * Security search with AI analysis generation.
 * Allows users to search for a security and generate
 * comprehensive AI analysis.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Sparkles,
  Loader2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  SecurityAnalysis,
  SecurityAnalysisSkeleton,
  type SecurityAnalysisData,
} from "./SecurityAnalysis";
import { useSecurityAnalysis } from "@/hooks/useIntelligence";

export interface AnalysisSectionProps {
  /** Initial security ID to analyze */
  initialSecurityId?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Loading skeleton for AnalysisSection
 */
export function AnalysisSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <SecurityAnalysisSkeleton />
      </CardContent>
    </Card>
  );
}

/**
 * Mock function to transform API response to SecurityAnalysisData
 * In production, this would map the actual API response structure
 */
function transformAnalysisData(
  securityId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData: Record<string, any>
): SecurityAnalysisData {
  return {
    securityId,
    securityName: rawData.security_name || "Unknown Security",
    securitySymbol: rawData.security_symbol || securityId.toUpperCase(),
    overallScore: rawData.overall_score ?? 75,
    overallStatus: rawData.overall_status || "healthy",
    summary:
      rawData.summary ||
      "AI analysis is being generated. This security shows moderate performance with balanced risk metrics.",
    metrics: rawData.metrics || [
      { name: "P/E Ratio", value: 22.5, trend: "stable", status: "good" },
      { name: "Revenue Growth", value: 12.3, trend: "up", status: "good" },
      { name: "Debt/Equity", value: 0.45, trend: "down", status: "good" },
      { name: "ROE", value: 18.7, trend: "up", status: "good" },
    ],
    recommendations: rawData.recommendations || [
      {
        id: "1",
        title: "Consider current valuation",
        description:
          "The stock is trading near its 52-week average. Monitor for better entry points.",
        priority: "medium" as const,
        action: "Set Alert",
      },
      {
        id: "2",
        title: "Review sector exposure",
        description:
          "Your portfolio may benefit from diversification in this sector.",
        priority: "low" as const,
      },
    ],
    generatedAt: rawData.generated_at || new Date().toISOString(),
  };
}

export function AnalysisSection({
  initialSecurityId,
  className,
}: AnalysisSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState(initialSecurityId || "");
  const [selectedSecurityId, setSelectedSecurityId] = React.useState<
    string | null
  >(initialSecurityId || null);

  // Fetch analysis for selected security
  const {
    data: analysisData,
    isLoading,
    isFetching,
    refetch,
  } = useSecurityAnalysis(selectedSecurityId || "", {
    enabled: !!selectedSecurityId,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedSecurityId(searchQuery.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleGenerateAnalysis = () => {
    if (selectedSecurityId) {
      refetch();
    }
  };

  // Transform the raw data to our component's expected format
  const transformedData = React.useMemo(() => {
    if (!analysisData || !selectedSecurityId) return null;
    return transformAnalysisData(selectedSecurityId, analysisData);
  }, [analysisData, selectedSecurityId]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Security Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by ticker (e.g., AAPL, MSFT)"
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            {isLoading && !transformedData ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Analyze
          </Button>
        </div>

        {/* Analysis Content */}
        {selectedSecurityId && (
          <div className="space-y-4">
            {/* Generate/Refresh button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Analyzing:{" "}
                <span className="font-medium text-foreground">
                  {selectedSecurityId}
                </span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAnalysis}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {transformedData ? "Refresh" : "Generate"} Analysis
              </Button>
            </div>

            {/* Analysis Result */}
            {isLoading && !transformedData ? (
              <SecurityAnalysisSkeleton />
            ) : transformedData ? (
              <SecurityAnalysis data={transformedData} isLoading={isFetching} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Click &quot;Generate Analysis&quot; to get AI-powered insights
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedSecurityId && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Enter a stock ticker to get AI-powered analysis
            </p>
            <p className="text-xs mt-1">
              Includes health score, key metrics, and recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

AnalysisSection.displayName = "AnalysisSection";
AnalysisSection.Skeleton = AnalysisSectionSkeleton;
