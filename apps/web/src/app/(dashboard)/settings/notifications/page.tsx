/**
 * Notifications Settings Page
 *
 * Allows users to configure notification channels, quiet hours, and per-alert-type preferences.
 */

"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SettingsSection, SettingsToggle } from "../components";
import { soundManager } from "@/lib/soundManager";
import { Lock, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NotificationPreferences,
  NotificationChannel,
  AlertTypeNotificationSettings,
} from "@/types/api";

// Alert type display names
const ALERT_TYPES = [
  { id: "margin_call", label: "Margin Call", locked: true },
  { id: "position_limit", label: "Position Limit", locked: false },
  { id: "system_failure", label: "System Failure", locked: true },
  { id: "threshold_breach", label: "Threshold Breach", locked: false },
  { id: "health_issue", label: "Health Issue", locked: false },
  { id: "concentration_warning", label: "Concentration Warning", locked: false },
  { id: "price_change", label: "Price Change", locked: false },
  { id: "ratio_update", label: "Ratio Update", locked: false },
  { id: "performance_milestone", label: "Performance Milestone", locked: false },
] as const;

// Time options for quiet hours (in 30-minute intervals)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * 30;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return {
    value: minutes,
    label: `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`,
  };
});

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-4 pt-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const { data: preferences, isPending, isError } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Form state
  const [formData, setFormData] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences && !formData) {
      setFormData(preferences);
    }
  }, [preferences, formData]);

  // Detect changes
  useEffect(() => {
    if (preferences && formData) {
      setHasChanges(JSON.stringify(preferences) !== JSON.stringify(formData));
    }
  }, [preferences, formData]);

  const handleSave = useCallback(() => {
    if (!formData) return;

    // Validation: Check if quiet hours start and end are the same
    if (
      formData.quietHours.enabled &&
      formData.quietHours.start === formData.quietHours.end
    ) {
      setValidationError("Start and end times cannot be the same");
      return;
    }

    setValidationError(null);

    updatePreferences.mutate(formData, {
      onSuccess: (data) => {
        // Apply settings to soundManager
        soundManager.setEnabled(data.soundEnabled);

        if (data.quietHours.enabled) {
          const startTime = minutesToTimeString(data.quietHours.start);
          const endTime = minutesToTimeString(data.quietHours.end);
          soundManager.setQuietHours(startTime, endTime);
        } else {
          soundManager.clearQuietHours();
        }

        setHasChanges(false);
      },
    });
  }, [formData, updatePreferences]);

  const handleReset = useCallback(() => {
    if (preferences) {
      setFormData(preferences);
      setHasChanges(false);
      setValidationError(null);
    }
  }, [preferences]);

  const handleGlobalToggle = useCallback(
    (field: "soundEnabled" | "browserNotificationsEnabled", value: boolean) => {
      if (!formData) return;
      setFormData({ ...formData, [field]: value });
    },
    [formData]
  );

  const handleQuietHoursToggle = useCallback(
    (enabled: boolean) => {
      if (!formData) return;
      setFormData({
        ...formData,
        quietHours: { ...formData.quietHours, enabled },
      });
    },
    [formData]
  );

  const handleQuietHoursTimeChange = useCallback(
    (field: "start" | "end", value: number) => {
      if (!formData) return;
      setFormData({
        ...formData,
        quietHours: { ...formData.quietHours, [field]: value },
      });
    },
    [formData]
  );

  const handleAlertTypeToggle = useCallback(
    (alertType: string, field: "enabled", value: boolean) => {
      if (!formData) return;

      const currentSettings = formData.alertTypeSettings[alertType] || {
        enabled: false,
        channels: [],
      };

      setFormData({
        ...formData,
        alertTypeSettings: {
          ...formData.alertTypeSettings,
          [alertType]: {
            ...currentSettings,
            enabled: value,
          },
        },
      });
    },
    [formData]
  );

  const handleChannelToggle = useCallback(
    (alertType: string, channel: NotificationChannel, value: boolean) => {
      if (!formData) return;

      const currentSettings = formData.alertTypeSettings[alertType] || {
        enabled: false,
        channels: [],
      };

      const channels = value
        ? [...currentSettings.channels, channel]
        : currentSettings.channels.filter((c) => c !== channel);

      setFormData({
        ...formData,
        alertTypeSettings: {
          ...formData.alertTypeSettings,
          [alertType]: {
            ...currentSettings,
            channels,
          },
        },
      });
    },
    [formData]
  );

  if (isPending) {
    return <NotificationsSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center text-destructive py-8">
        Failed to load notification preferences. Please try again.
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notification Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure notification channels, quiet hours, and alert preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updatePreferences.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {validationError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
          {validationError}
        </div>
      )}

      {/* Global Settings */}
      <SettingsSection
        title="Global Settings"
        description="Configure general notification behavior"
      >
        <SettingsToggle
          label="Sound Notifications"
          description="Play sound for critical alerts"
          name="soundEnabled"
          checked={formData.soundEnabled}
          onCheckedChange={(checked) =>
            handleGlobalToggle("soundEnabled", checked)
          }
        />
        <Separator />

        <SettingsToggle
          label="Browser Notifications"
          description="Show desktop notifications (requires permission)"
          name="browserNotificationsEnabled"
          checked={formData.browserNotificationsEnabled}
          onCheckedChange={(checked) =>
            handleGlobalToggle("browserNotificationsEnabled", checked)
          }
        />
        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="quietHours" className="text-sm font-medium">
                Quiet Hours
              </Label>
              <p className="text-sm text-muted-foreground">
                During quiet hours, only critical alerts will notify
              </p>
            </div>
            <SettingsToggle
              label=""
              name="quietHours"
              checked={formData.quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>

          {formData.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart" className="text-sm">
                  Start Time
                </Label>
                <Select
                  value={formData.quietHours.start.toString()}
                  onValueChange={(value) =>
                    handleQuietHoursTimeChange("start", parseInt(value))
                  }
                >
                  <SelectTrigger id="quietHoursStart">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd" className="text-sm">
                  End Time
                </Label>
                <Select
                  value={formData.quietHours.end.toString()}
                  onValueChange={(value) =>
                    handleQuietHoursTimeChange("end", parseInt(value))
                  }
                >
                  <SelectTrigger id="quietHoursEnd">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Alert Type Settings */}
      <SettingsSection
        title="Alert Type Settings"
        description="Configure notification channels for each alert type"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert Type</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
                <TableHead className="text-center">Sound</TableHead>
                <TableHead className="text-center">Toast</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Badge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALERT_TYPES.map((alertType) => {
                const settings = formData.alertTypeSettings[alertType.id] || {
                  enabled: false,
                  channels: [],
                };

                return (
                  <TableRow key={alertType.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {alertType.label}
                        {alertType.locked && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={settings.enabled}
                        onCheckedChange={(checked) =>
                          !alertType.locked &&
                          handleAlertTypeToggle(
                            alertType.id,
                            "enabled",
                            checked as boolean
                          )
                        }
                        disabled={alertType.locked}
                        aria-label={`${alertType.label} enabled`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={settings.channels.includes("sound")}
                        onCheckedChange={(checked) =>
                          !alertType.locked &&
                          handleChannelToggle(
                            alertType.id,
                            "sound",
                            checked as boolean
                          )
                        }
                        disabled={alertType.locked || !settings.enabled}
                        aria-label={`${alertType.label} sound`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={settings.channels.includes("toast")}
                        onCheckedChange={(checked) =>
                          !alertType.locked &&
                          handleChannelToggle(
                            alertType.id,
                            "toast",
                            checked as boolean
                          )
                        }
                        disabled={alertType.locked || !settings.enabled}
                        aria-label={`${alertType.label} toast`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={settings.channels.includes("email")}
                        onCheckedChange={(checked) =>
                          !alertType.locked &&
                          handleChannelToggle(
                            alertType.id,
                            "email",
                            checked as boolean
                          )
                        }
                        disabled={alertType.locked || !settings.enabled}
                        aria-label={`${alertType.label} email`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={settings.channels.includes("badge")}
                        onCheckedChange={(checked) =>
                          !alertType.locked &&
                          handleChannelToggle(
                            alertType.id,
                            "badge",
                            checked as boolean
                          )
                        }
                        disabled={alertType.locked || !settings.enabled}
                        aria-label={`${alertType.label} badge`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SettingsSection>
    </div>
  );
}

// Helper to convert minutes since midnight to HH:MM format
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
