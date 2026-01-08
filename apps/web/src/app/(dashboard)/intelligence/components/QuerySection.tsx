"use client";

/**
 * QuerySection Component
 *
 * Complete query section with input, suggested queries,
 * and streaming response display.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { QueryInput } from "./QueryInput";
import { QueryResponse } from "./QueryResponse";
import { usePortfolioQuery, useQuerySuggestions } from "@/hooks/useIntelligence";
import type { PortfolioQueryResponse } from "@/types/api";

export interface QuerySectionProps {
  /** Optional portfolio ID to scope queries */
  portfolioId?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Loading skeleton for QuerySection
 */
export function QuerySectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

/**
 * Custom hook for streaming query response
 */
function useStreamingQuery() {
  const [streamingText, setStreamingText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);

  const simulateStreaming = React.useCallback(
    (fullText: string): Promise<void> => {
      return new Promise((resolve) => {
        setIsStreaming(true);
        setStreamingText("");

        let currentIndex = 0;
        const words = fullText.split(" ");

        const streamWords = () => {
          if (currentIndex < words.length) {
            const chunk = words.slice(0, currentIndex + 1).join(" ");
            setStreamingText(chunk);
            currentIndex++;
            setTimeout(streamWords, 30 + Math.random() * 40);
          } else {
            setIsStreaming(false);
            resolve();
          }
        };

        streamWords();
      });
    },
    []
  );

  const reset = React.useCallback(() => {
    setStreamingText("");
    setIsStreaming(false);
  }, []);

  return {
    streamingText,
    isStreaming,
    simulateStreaming,
    reset,
  };
}

export function QuerySection({ portfolioId, className }: QuerySectionProps) {
  const [query, setQuery] = React.useState("");
  const [currentResponse, setCurrentResponse] =
    React.useState<PortfolioQueryResponse | null>(null);

  // Fetch suggestions
  const { data: suggestions } = useQuerySuggestions(portfolioId);

  // Query mutation
  const { mutate: submitQuery, isPending: isQuerying } = usePortfolioQuery();

  // Streaming state
  const { streamingText, isStreaming, simulateStreaming, reset } =
    useStreamingQuery();

  const handleSubmit = () => {
    if (!query.trim() || isQuerying) return;

    reset();
    setCurrentResponse(null);

    submitQuery(
      {
        question: query,
        portfolio_id: portfolioId,
      },
      {
        onSuccess: async (response) => {
          // Simulate streaming for the response
          await simulateStreaming(response.answer);
          setCurrentResponse(response);
        },
      }
    );
  };

  const handleFollowUpClick = (question: string) => {
    setQuery(question);
  };

  const isLoading = isQuerying || isStreaming;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Ask Intelligence
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <QueryInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          suggestions={suggestions}
        />

        {/* Response Area */}
        <div className="pt-4">
          {(isLoading || currentResponse || streamingText) && (
            <QueryResponse
              response={currentResponse}
              isStreaming={isStreaming || isQuerying}
              streamingText={streamingText}
              onFollowUpClick={handleFollowUpClick}
            />
          )}

          {!isLoading && !currentResponse && !streamingText && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Ask a question to get AI-powered insights about your portfolio
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

QuerySection.displayName = "QuerySection";
QuerySection.Skeleton = QuerySectionSkeleton;
