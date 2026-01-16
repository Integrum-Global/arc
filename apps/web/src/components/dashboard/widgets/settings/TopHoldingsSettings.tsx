"use client";

/**
 * TopHoldingsSettings
 *
 * Settings component for the Top Holdings widget.
 * Allows configuration of:
 * - Number of holdings slider (3-15)
 * - Show daily change toggle
 * - Show market value toggle
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { WidgetSettingsProps } from "@/components/dashboard/widgets/types";

/**
 * Configuration interface for Top Holdings widget
 */
export interface TopHoldingsConfig {
  limit: number;
  showChange: boolean;
  showValue: boolean;
}

export function TopHoldingsSettings({
  config,
  onConfigChange,
}: WidgetSettingsProps) {
  const typedConfig = config as unknown as TopHoldingsConfig;

  const handleLimitChange = (value: number[]) => {
    onConfigChange({ ...config, limit: value[0] });
  };

  const handleShowChangeToggle = (checked: boolean) => {
    onConfigChange({ ...config, showChange: checked });
  };

  const handleShowValueToggle = (checked: boolean) => {
    onConfigChange({ ...config, showValue: checked });
  };

  return (
    <div className="space-y-6">
      {/* Number of Holdings Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Number of Holdings</Label>
          <span className="text-sm font-medium tabular-nums">
            {typedConfig.limit ?? 5}
          </span>
        </div>
        <Slider
          value={[typedConfig.limit ?? 5]}
          onValueChange={handleLimitChange}
          min={3}
          max={15}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Show top {typedConfig.limit ?? 5} holdings by value
        </p>
      </div>

      {/* Show Daily Change Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showChange">Show Daily Change</Label>
          <p className="text-xs text-muted-foreground">
            Display percentage change for each holding
          </p>
        </div>
        <Switch
          id="showChange"
          checked={typedConfig.showChange ?? true}
          onCheckedChange={handleShowChangeToggle}
        />
      </div>

      {/* Show Market Value Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showValue">Show Market Value</Label>
          <p className="text-xs text-muted-foreground">
            Display dollar value for each holding
          </p>
        </div>
        <Switch
          id="showValue"
          checked={typedConfig.showValue ?? true}
          onCheckedChange={handleShowValueToggle}
        />
      </div>
    </div>
  );
}
