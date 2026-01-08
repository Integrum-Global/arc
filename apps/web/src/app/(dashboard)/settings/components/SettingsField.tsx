/**
 * SettingsField Component
 *
 * A form field with label, input, and help text for settings forms.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface SettingsFieldProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Field value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type */
  type?: "text" | "email" | "password" | "url" | "number";
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Additional class name */
  className?: string;
  /** Input class name */
  inputClassName?: string;
}

export function SettingsField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  helpText,
  error,
  disabled = false,
  required = false,
  className,
  inputClassName,
}: SettingsFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          helpText ? `${name}-help` : error ? `${name}-error` : undefined
        }
        className={cn(error && "border-destructive", inputClassName)}
      />
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

SettingsField.displayName = "SettingsField";
