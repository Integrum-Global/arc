"use client";

/**
 * AlertsWidgetSettings
 *
 * Settings component for the Alerts widget.
 * Allows configuration of:
 * - Maximum alerts slider (3-15)
 * - Show critical only toggle
 * - Auto refresh toggle
 * - Refresh interval (when auto refresh is enabled)
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WidgetSettingsProps } from "@/components/dashboard/widgets/types";

/**
 * Configuration interface for Alerts widget
 */
export interface AlertsWidgetConfig {
  maxAlerts: number;
  showCriticalOnly: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

const REFRESH_INTERVALS = [
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
] as const;

export function AlertsWidgetSettings({
  config,
  onConfigChange,
}: WidgetSettingsProps) {
  const typedConfig = config as unknown as AlertsWidgetConfig;

  const handleMaxAlertsChange = (value: number[]) => {
    onConfigChange({ ...config, maxAlerts: value[0] });
  };

  const handleShowCriticalOnlyChange = (checked: boolean) => {
    onConfigChange({ ...config, showCriticalOnly: checked });
  };

  const handleAutoRefreshChange = (checked: boolean) => {
    onConfigChange({ ...config, autoRefresh: checked });
  };

  const handleRefreshIntervalChange = (value: string) => {
    onConfigChange({ ...config, refreshInterval: parseInt(value, 10) });
  };

  return (
    <div className="space-y-6">
      {/* Maximum Alerts Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Maximum Alerts</Label>
          <span className="text-sm font-medium tabular-nums">
            {typedConfig.maxAlerts ?? 5}
          </span>
        </div>
        <Slider
          value={[typedConfig.maxAlerts ?? 5]}
          onValueChange={handleMaxAlertsChange}
          min={3}
          max={15}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Display up to {typedConfig.maxAlerts ?? 5} alerts in the widget
        </p>
      </div>

      {/* Show Critical Only Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showCriticalOnly">Show Critical Only</Label>
          <p className="text-xs text-muted-foreground">
            Filter to show only critical priority alerts
          </p>
        </div>
        <Switch
          id="showCriticalOnly"
          checked={typedConfig.showCriticalOnly ?? false}
          onCheckedChange={handleShowCriticalOnlyChange}
        />
      </div>

      {/* Auto Refresh Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="autoRefresh">Auto Refresh</Label>
          <p className="text-xs text-muted-foreground">
            Automatically fetch new alerts
          </p>
        </div>
        <Switch
          id="autoRefresh"
          checked={typedConfig.autoRefresh ?? true}
          onCheckedChange={handleAutoRefreshChange}
        />
      </div>

      {/* Refresh Interval Select (conditional) */}
      {typedConfig.autoRefresh && (
        <div className="space-y-2">
          <Label>Refresh Interval</Label>
          <Select
            value={String(typedConfig.refreshInterval ?? 30)}
            onValueChange={handleRefreshIntervalChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_INTERVALS.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
