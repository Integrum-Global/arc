/**
 * Mock Data Toggle Component
 *
 * A toggle switch to enable/disable mock data mode.
 * Only visible in development mode.
 */

"use client";

import * as React from "react";
import { Database, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface MockDataToggleProps {
  /** Whether mock data mode is enabled */
  enabled: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * MockDataToggle - Development-only toggle for mock data mode
 */
export function MockDataToggle({
  enabled,
  onToggle,
  className,
}: MockDataToggleProps) {
  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "relative transition-colors",
              enabled && "text-amber-500 hover:text-amber-600",
              className
            )}
          >
            {enabled ? (
              <DatabaseZap className="h-5 w-5" />
            ) : (
              <Database className="h-5 w-5" />
            )}
            {enabled && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[8px] bg-amber-500 text-white"
              >
                M
              </Badge>
            )}
            <span className="sr-only">
              {enabled ? "Disable mock data" : "Enable mock data"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">
            {enabled ? (
              <>
                <span className="font-medium text-amber-500">Mock Mode</span>
                <span className="text-muted-foreground"> - Using fake data</span>
              </>
            ) : (
              <>
                <span className="font-medium">Real API</span>
                <span className="text-muted-foreground"> - Click to use mock data</span>
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

MockDataToggle.displayName = "MockDataToggle";
