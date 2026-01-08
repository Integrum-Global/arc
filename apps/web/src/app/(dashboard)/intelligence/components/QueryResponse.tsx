"use client";

/**
 * QueryResponse Component
 *
 * Displays streaming text response with confidence score,
 * sources, and follow-up questions.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  TrendingUp,
  Newspaper,
  Building,
  BarChart3,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import type { QuerySource, PortfolioQueryResponse } from "@/types/api";

export interface QueryResponseProps {
  /** Response data */
  response?: PortfolioQueryResponse | null;
  /** Whether response is streaming/loading */
  isStreaming?: boolean;
  /** Streaming text (for typing effect) */
  streamingText?: string;
  /** Callback when follow-up question is clicked */
  onFollowUpClick?: (question: string) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Get icon for source type
 */
function getSourceIcon(type: QuerySource["type"]) {
  switch (type) {
    case "portfolio":
      return Building;
    case "security":
      return TrendingUp;
    case "market":
      return BarChart3;
    case "news":
      return Newspaper;
    case "analysis":
      return FileText;
    default:
      return FileText;
  }
}

/**
 * Get confidence color based on score
 */
function getConfidenceVariant(
  confidence: number
): "default" | "secondary" | "destructive" {
  if (confidence >= 0.8) return "default";
  if (confidence >= 0.5) return "secondary";
  return "destructive";
}

/**
 * Get confidence label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High Confidence";
  if (confidence >= 0.5) return "Medium Confidence";
  return "Low Confidence";
}

/**
 * Loading skeleton for QueryResponse
 */
export function QueryResponseSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Streaming text display with typing effect
 */
function StreamingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 15); // Adjust speed as needed
      return () => clearTimeout(timer);
    }
  }, [text, currentIndex]);

  // Reset when text changes completely (new query)
  React.useEffect(() => {
    if (!text.startsWith(displayedText.slice(0, -1))) {
      setDisplayedText("");
      setCurrentIndex(0);
    }
  }, [text, displayedText]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="whitespace-pre-wrap">{displayedText}</p>
      {currentIndex < text.length && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
      )}
    </div>
  );
}

export function QueryResponse({
  response,
  isStreaming = false,
  streamingText,
  onFollowUpClick,
  className,
}: QueryResponseProps) {
  if (isStreaming && !response) {
    return <QueryResponseSkeleton />;
  }

  if (!response && !streamingText) {
    return null;
  }

  const displayText = streamingText || response?.answer || "";
  const showStreaming = isStreaming || (streamingText && !response);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {showStreaming ? (
              <>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-positive" />
                <span>Response</span>
              </>
            )}
          </CardTitle>
          {response?.confidence !== undefined && (
            <Badge variant={getConfidenceVariant(response.confidence)}>
              {getConfidenceLabel(response.confidence)} (
              {Math.round(response.confidence * 100)}%)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Answer */}
        <div className="text-sm leading-relaxed">
          {showStreaming ? (
            <StreamingText text={displayText} />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{displayText}</p>
            </div>
          )}
        </div>

        {/* Sources */}
        {response?.sources && response.sources.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {response.sources.map((source, index) => {
                const Icon = getSourceIcon(source.type);
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {source.title}
                    </span>
                    {source.reference && (
                      <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        {response?.follow_up_questions &&
          response.follow_up_questions.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Related Questions
              </h4>
              <div className="flex flex-wrap gap-2">
                {response.follow_up_questions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => onFollowUpClick?.(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Processing Time */}
        {response?.processing_time_ms !== undefined && (
          <div className="pt-2 text-xs text-muted-foreground">
            Processed in {response.processing_time_ms}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
}

QueryResponse.displayName = "QueryResponse";
QueryResponse.Skeleton = QueryResponseSkeleton;
