"use client";

/**
 * QueryInput Component
 *
 * Text input field for submitting natural language queries
 * with suggested queries dropdown.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Send, ChevronDown, Loader2, Sparkles } from "lucide-react";
import type { QuerySuggestion } from "@/types/api";

export interface QueryInputProps {
  /** Current query value */
  value: string;
  /** On change callback */
  onChange: (value: string) => void;
  /** On submit callback */
  onSubmit: () => void;
  /** Whether query is being processed */
  isLoading?: boolean;
  /** Suggested queries to show */
  suggestions?: QuerySuggestion[];
  /** Placeholder text */
  placeholder?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Group suggestions by category
 */
function groupSuggestions(
  suggestions: QuerySuggestion[]
): Record<string, QuerySuggestion[]> {
  return suggestions.reduce(
    (acc, suggestion) => {
      const category = suggestion.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(suggestion);
      return acc;
    },
    {} as Record<string, QuerySuggestion[]>
  );
}

export function QueryInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  suggestions = [],
  placeholder = "Ask about your portfolio, market conditions, or get investment insights...",
  className,
}: QueryInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const groupedSuggestions = React.useMemo(
    () => groupSuggestions(suggestions),
    [suggestions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleSuggestionClick = (question: string) => {
    onChange(question);
    // Focus the textarea after selecting a suggestion
    textareaRef.current?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[80px] resize-none pr-12"
            rows={3}
          />
          {suggestions.length > 0 && (
            <div className="absolute right-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    <Sparkles className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Suggested Questions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(groupedSuggestions).map(
                    ([category, items], index) => (
                      <React.Fragment key={category}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                          {category}
                        </DropdownMenuLabel>
                        {items.map((suggestion, itemIndex) => (
                          <DropdownMenuItem
                            key={`${category}-${itemIndex}`}
                            onClick={() =>
                              handleSuggestionClick(suggestion.question)
                            }
                            className="cursor-pointer"
                          >
                            <span className="line-clamp-2">
                              {suggestion.question}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </React.Fragment>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          size="lg"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Ask</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

QueryInput.displayName = "QueryInput";
