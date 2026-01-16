"use client";

/**
 * BriefSettings
 *
 * Settings component for the Market Brief widget.
 * Allows configuration of:
 * - Brief type (morning, midday, evening, custom)
 * - Show insights toggle
 * - Show actions toggle
 * - Update frequency
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WidgetSettingsProps } from "@/components/dashboard/widgets/types";

/**
 * Configuration interface for Market Brief widget
 */
export interface BriefConfig {
  briefType: "morning" | "midday" | "evening" | "custom";
  showInsights: boolean;
  showActions: boolean;
  updateFrequency: "realtime" | "hourly" | "daily";
}

const BRIEF_TYPES = [
  { value: "morning", label: "Morning Brief" },
  { value: "midday", label: "Midday Update" },
  { value: "evening", label: "Evening Recap" },
  { value: "custom", label: "Custom Schedule" },
] as const;

const UPDATE_FREQUENCIES = [
  { value: "realtime", label: "Real-time" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
] as const;

export function BriefSettings({
  config,
  onConfigChange,
}: WidgetSettingsProps) {
  const typedConfig = config as unknown as BriefConfig;

  const handleBriefTypeChange = (value: string) => {
    onConfigChange({ ...config, briefType: value });
  };

  const handleShowInsightsChange = (checked: boolean) => {
    onConfigChange({ ...config, showInsights: checked });
  };

  const handleShowActionsChange = (checked: boolean) => {
    onConfigChange({ ...config, showActions: checked });
  };

  const handleUpdateFrequencyChange = (value: string) => {
    onConfigChange({ ...config, updateFrequency: value });
  };

  return (
    <div className="space-y-6">
      {/* Brief Type Select */}
      <div className="space-y-2">
        <Label>Brief Type</Label>
        <Select
          value={typedConfig.briefType ?? "morning"}
          onValueChange={handleBriefTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select brief type" />
          </SelectTrigger>
          <SelectContent>
            {BRIEF_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose when you want to receive your market brief
        </p>
      </div>

      {/* Show Insights Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showInsights">Show Insights</Label>
          <p className="text-xs text-muted-foreground">
            Display AI-generated market insights
          </p>
        </div>
        <Switch
          id="showInsights"
          checked={typedConfig.showInsights ?? true}
          onCheckedChange={handleShowInsightsChange}
        />
      </div>

      {/* Show Actions Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showActions">Show Actions</Label>
          <p className="text-xs text-muted-foreground">
            Display recommended actions based on market conditions
          </p>
        </div>
        <Switch
          id="showActions"
          checked={typedConfig.showActions ?? true}
          onCheckedChange={handleShowActionsChange}
        />
      </div>

      {/* Update Frequency Select */}
      <div className="space-y-2">
        <Label>Update Frequency</Label>
        <Select
          value={typedConfig.updateFrequency ?? "daily"}
          onValueChange={handleUpdateFrequencyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {UPDATE_FREQUENCIES.map((freq) => (
              <SelectItem key={freq.value} value={freq.value}>
                {freq.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
