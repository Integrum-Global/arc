"use client";

/**
 * ThresholdForm Component
 *
 * Form for creating/editing alert thresholds with validation.
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Form data type
 */
export interface ThresholdFormData {
  name: string;
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value: number;
  severity: "low" | "medium" | "high" | "critical";
  securityTicker?: string;
}

export interface ThresholdFormProps {
  initialData?: ThresholdFormData;
  onSubmit: (data: ThresholdFormData) => void;
  onCancel: () => void;
}

/**
 * Available metrics
 */
const METRICS = [
  // Liquidity
  { value: "current_ratio", label: "Current Ratio", suffix: "x" },
  { value: "quick_ratio", label: "Quick Ratio", suffix: "x" },
  { value: "cash_ratio", label: "Cash Ratio", suffix: "x" },
  // Profitability
  { value: "roe", label: "ROE", suffix: "%" },
  { value: "roa", label: "ROA", suffix: "%" },
  { value: "gross_margin", label: "Gross Margin", suffix: "%" },
  { value: "net_margin", label: "Net Margin", suffix: "%" },
  { value: "ebitda_margin", label: "EBITDA Margin", suffix: "%" },
  // Leverage
  { value: "debt_equity", label: "Debt/Equity", suffix: "x" },
  { value: "debt_ebitda", label: "Debt/EBITDA", suffix: "x" },
  { value: "interest_coverage", label: "Interest Coverage", suffix: "x" },
  // Valuation
  { value: "pe_ratio", label: "P/E Ratio", suffix: "x" },
  { value: "pb_ratio", label: "P/B Ratio", suffix: "x" },
  { value: "ps_ratio", label: "P/S Ratio", suffix: "x" },
  { value: "ev_ebitda", label: "EV/EBITDA", suffix: "x" },
  { value: "dividend_yield", label: "Dividend Yield", suffix: "%" },
  // Efficiency
  { value: "asset_turnover", label: "Asset Turnover", suffix: "x" },
  { value: "inventory_turnover", label: "Inventory Turnover", suffix: "x" },
];

/**
 * Operators
 */
const OPERATORS = [
  { value: "gt", label: "> Greater than" },
  { value: "gte", label: ">= Greater than or equal" },
  { value: "lt", label: "< Less than" },
  { value: "lte", label: "<= Less than or equal" },
  { value: "eq", label: "= Equal to" },
  { value: "neq", label: "!= Not equal to" },
];

/**
 * Severities
 */
const SEVERITIES = [
  { value: "low", label: "Low", color: "text-blue-600" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
];

/**
 * Mock securities
 */
const SECURITIES = [
  { value: "", label: "All Securities" },
  { value: "AAPL", label: "Apple Inc. (AAPL)" },
  { value: "MSFT", label: "Microsoft Corp. (MSFT)" },
  { value: "GOOGL", label: "Alphabet Inc. (GOOGL)" },
  { value: "AMZN", label: "Amazon.com Inc. (AMZN)" },
  { value: "META", label: "Meta Platforms (META)" },
];

export function ThresholdForm({ initialData, onSubmit, onCancel }: ThresholdFormProps) {
  const [formData, setFormData] = React.useState<ThresholdFormData>({
    name: initialData?.name ?? "",
    metric: initialData?.metric ?? "",
    operator: initialData?.operator ?? "lt",
    value: initialData?.value ?? 0,
    severity: initialData?.severity ?? "medium",
    securityTicker: initialData?.securityTicker ?? "",
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof ThresholdFormData, string>>>({});

  // Get the selected metric's suffix
  const selectedMetric = METRICS.find((m) => m.value === formData.metric || m.label === formData.metric);

  const handleChange = <K extends keyof ThresholdFormData>(key: K, value: ThresholdFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ThresholdFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.metric) {
      newErrors.metric = "Metric is required";
    }

    if (formData.value === undefined || formData.value === null || isNaN(formData.value)) {
      newErrors.value = "Value is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      ...formData,
      metric: selectedMetric?.label ?? formData.metric,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Threshold Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Current Ratio Warning"
          className={cn(errors.name && "border-destructive")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      {/* Metric */}
      <div className="space-y-2">
        <Label htmlFor="metric">
          Metric <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.metric}
          onValueChange={(value) => handleChange("metric", value)}
        >
          <SelectTrigger className={cn(errors.metric && "border-destructive")}>
            <SelectValue placeholder="Select a metric" />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((metric) => (
              <SelectItem key={metric.value} value={metric.value}>
                {metric.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.metric && <p className="text-sm text-destructive">{errors.metric}</p>}
      </div>

      {/* Operator and Value */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="operator">Condition</Label>
          <Select
            value={formData.operator}
            onValueChange={(value) =>
              handleChange("operator", value as ThresholdFormData["operator"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">
            Value <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => handleChange("value", parseFloat(e.target.value))}
              className={cn(errors.value && "border-destructive", "pr-8")}
            />
            {selectedMetric && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {selectedMetric.suffix}
              </span>
            )}
          </div>
          {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
        </div>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <Label htmlFor="severity">Severity</Label>
        <Select
          value={formData.severity}
          onValueChange={(value) =>
            handleChange("severity", value as ThresholdFormData["severity"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((sev) => (
              <SelectItem key={sev.value} value={sev.value}>
                <span className={cn(sev.color)}>{sev.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Determines the alert priority and notification urgency
        </p>
      </div>

      {/* Security (optional) */}
      <div className="space-y-2">
        <Label htmlFor="security">Security (optional)</Label>
        <Select
          value={formData.securityTicker ?? ""}
          onValueChange={(value) => handleChange("securityTicker", value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Securities" />
          </SelectTrigger>
          <SelectContent>
            {SECURITIES.map((sec) => (
              <SelectItem key={sec.value || "all"} value={sec.value}>
                {sec.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Leave empty to apply threshold to all securities
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Save Changes" : "Create Threshold"}
        </Button>
      </div>
    </form>
  );
}

ThresholdForm.displayName = "ThresholdForm";
