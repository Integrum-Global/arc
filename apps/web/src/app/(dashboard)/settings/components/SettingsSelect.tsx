/**
 * SettingsSelect Component
 *
 * A select dropdown with label for settings forms.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SettingsSelectProps {
  /** Select label */
  label: string;
  /** Select name/id */
  name: string;
  /** Selected value */
  value: string;
  /** Change handler */
  onValueChange: (value: string) => void;
  /** Options list */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below the select */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Additional class name */
  className?: string;
}

export function SettingsSelect({
  label,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  helpText,
  error,
  disabled = false,
  required = false,
  className,
}: SettingsSelectProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={name}
          className={cn("w-full", error && "border-destructive")}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

SettingsSelect.displayName = "SettingsSelect";
