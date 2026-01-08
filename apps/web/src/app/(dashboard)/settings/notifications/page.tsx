/**
 * Notifications Settings Page
 *
 * Allows users to configure notification channels and alert preferences.
 */

"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  SettingsSection,
  SettingsToggle,
  SaveIndicator,
} from "../components";
import { useAutoSave } from "../hooks";

interface NotificationFormData {
  // Channels
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  // Alert types
  priceAlerts: boolean;
  portfolioAlerts: boolean;
  riskAlerts: boolean;
  complianceAlerts: boolean;
  newsAlerts: boolean;
  marketBriefs: boolean;
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-4 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();

  const [formData, setFormData] = useState<NotificationFormData>({
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
    priceAlerts: true,
    portfolioAlerts: true,
    riskAlerts: true,
    complianceAlerts: true,
    newsAlerts: false,
    marketBriefs: true,
  });

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData((prev) => ({
        ...prev,
        emailEnabled: preferences.email_notifications ?? true,
        inAppEnabled: preferences.notifications_enabled ?? true,
      }));
    }
  }, [preferences]);

  const handleSave = useCallback(
    async (data: NotificationFormData) => {
      await updatePreferences.mutateAsync({
        email_notifications: data.emailEnabled,
        notifications_enabled: data.inAppEnabled,
      });
    },
    [updatePreferences]
  );

  const { status, error } = useAutoSave({
    data: formData,
    onSave: handleSave,
    delay: 1000,
    enabled: !!preferences,
  });

  const handleToggle = useCallback(
    <K extends keyof NotificationFormData>(field: K, value: boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Configure how you receive alerts and updates
          </p>
        </div>
        <SaveIndicator status={status} errorMessage={error || undefined} />
      </div>

      <SettingsSection
        title="Notification Channels"
        description="Choose how you want to receive notifications"
      >
        <SettingsToggle
          label="Email Notifications"
          description="Receive notifications via email"
          name="emailEnabled"
          checked={formData.emailEnabled}
          onCheckedChange={(checked) => handleToggle("emailEnabled", checked)}
        />
        <Separator />

        <SettingsToggle
          label="Push Notifications"
          description="Receive browser push notifications"
          name="pushEnabled"
          checked={formData.pushEnabled}
          onCheckedChange={(checked) => handleToggle("pushEnabled", checked)}
        />
        <Separator />

        <SettingsToggle
          label="In-App Notifications"
          description="Show notifications within the application"
          name="inAppEnabled"
          checked={formData.inAppEnabled}
          onCheckedChange={(checked) => handleToggle("inAppEnabled", checked)}
        />
      </SettingsSection>

      <SettingsSection
        title="Alert Types"
        description="Choose which types of alerts you want to receive"
      >
        <SettingsToggle
          label="Price Alerts"
          description="Notifications when price thresholds are reached"
          name="priceAlerts"
          checked={formData.priceAlerts}
          onCheckedChange={(checked) => handleToggle("priceAlerts", checked)}
        />
        <Separator />

        <SettingsToggle
          label="Portfolio Alerts"
          description="Notifications about portfolio changes and drift"
          name="portfolioAlerts"
          checked={formData.portfolioAlerts}
          onCheckedChange={(checked) => handleToggle("portfolioAlerts", checked)}
        />
        <Separator />

        <SettingsToggle
          label="Risk Warnings"
          description="Alerts when risk thresholds are exceeded"
          name="riskAlerts"
          checked={formData.riskAlerts}
          onCheckedChange={(checked) => handleToggle("riskAlerts", checked)}
        />
        <Separator />

        <SettingsToggle
          label="Compliance Alerts"
          description="Notifications about compliance issues"
          name="complianceAlerts"
          checked={formData.complianceAlerts}
          onCheckedChange={(checked) => handleToggle("complianceAlerts", checked)}
        />
        <Separator />

        <SettingsToggle
          label="News Alerts"
          description="Breaking news about your holdings"
          name="newsAlerts"
          checked={formData.newsAlerts}
          onCheckedChange={(checked) => handleToggle("newsAlerts", checked)}
        />
        <Separator />

        <SettingsToggle
          label="Market Briefs"
          description="Daily and weekly market summaries"
          name="marketBriefs"
          checked={formData.marketBriefs}
          onCheckedChange={(checked) => handleToggle("marketBriefs", checked)}
        />
      </SettingsSection>
    </div>
  );
}
