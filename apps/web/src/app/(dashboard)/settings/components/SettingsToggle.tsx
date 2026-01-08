/**
 * SettingsToggle Component
 *
 * A switch toggle with label and description for boolean settings.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface SettingsToggleProps {
  /** Toggle label */
  label: string;
  /** Toggle description */
  description?: string;
  /** Toggle name/id */
  name: string;
  /** Whether the toggle is checked */
  checked: boolean;
  /** Change handler */
  onCheckedChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export function SettingsToggle({
  label,
  description,
  name,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SettingsToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2",
        className
      )}
    >
      <div className="space-y-0.5">
        <Label
          htmlFor={name}
          className="text-sm font-medium cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${name}-description` : undefined}
      />
    </div>
  );
}

SettingsToggle.displayName = "SettingsToggle";
