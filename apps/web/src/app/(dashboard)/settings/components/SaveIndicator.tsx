/**
 * SaveIndicator Component
 *
 * Shows saving status with auto-save debounce indicator.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Error message when status is error */
  errorMessage?: string;
  /** Additional class name */
  className?: string;
}

export function SaveIndicator({
  status,
  errorMessage,
  className,
}: SaveIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-green-600 dark:text-green-400",
        status === "error" && "text-destructive",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4" />
          <span>Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage || "Failed to save"}</span>
        </>
      )}
    </div>
  );
}

SaveIndicator.displayName = "SaveIndicator";
