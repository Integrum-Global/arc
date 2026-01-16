"use client";

/**
 * AllocationChartSettings
 *
 * Settings component for the Asset Allocation widget.
 * Allows configuration of:
 * - Show legend toggle
 * - Color scheme selection
 * - Maximum items slider (5-20)
 * - Show percentages toggle
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
 * Configuration interface for Allocation Chart widget
 */
export interface AllocationChartConfig {
  showLegend: boolean;
  colorScheme: "default" | "monochrome" | "colorblind";
  maxItems: number;
  showPercentages: boolean;
}

const COLOR_SCHEMES = [
  { value: "default", label: "Default" },
  { value: "monochrome", label: "Monochrome" },
  { value: "colorblind", label: "Colorblind-friendly" },
] as const;

export function AllocationChartSettings({
  config,
  onConfigChange,
}: WidgetSettingsProps) {
  const typedConfig = config as unknown as AllocationChartConfig;

  const handleShowLegendChange = (checked: boolean) => {
    onConfigChange({ ...config, showLegend: checked });
  };

  const handleColorSchemeChange = (value: string) => {
    onConfigChange({ ...config, colorScheme: value });
  };

  const handleMaxItemsChange = (value: number[]) => {
    onConfigChange({ ...config, maxItems: value[0] });
  };

  const handleShowPercentagesChange = (checked: boolean) => {
    onConfigChange({ ...config, showPercentages: checked });
  };

  return (
    <div className="space-y-6">
      {/* Show Legend Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="showLegend">Show Legend</Label>
        <Switch
          id="showLegend"
          checked={typedConfig.showLegend ?? true}
          onCheckedChange={handleShowLegendChange}
        />
      </div>

      {/* Color Scheme Select */}
      <div className="space-y-2">
        <Label>Color Scheme</Label>
        <Select
          value={typedConfig.colorScheme ?? "default"}
          onValueChange={handleColorSchemeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color scheme" />
          </SelectTrigger>
          <SelectContent>
            {COLOR_SCHEMES.map((scheme) => (
              <SelectItem key={scheme.value} value={scheme.value}>
                {scheme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Maximum Items Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Maximum Items</Label>
          <span className="text-sm font-medium tabular-nums">
            {typedConfig.maxItems ?? 10}
          </span>
        </div>
        <Slider
          value={[typedConfig.maxItems ?? 10]}
          onValueChange={handleMaxItemsChange}
          min={5}
          max={20}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Show top {typedConfig.maxItems ?? 10} allocations by percentage
        </p>
      </div>

      {/* Show Percentages Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showPercentages">Show Percentages</Label>
          <p className="text-xs text-muted-foreground">
            Display percentage values on chart
          </p>
        </div>
        <Switch
          id="showPercentages"
          checked={typedConfig.showPercentages ?? true}
          onCheckedChange={handleShowPercentagesChange}
        />
      </div>
    </div>
  );
}
