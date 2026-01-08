/**
 * Profile Settings Page
 *
 * Allows users to update their profile information.
 */

"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SettingsSection,
  SettingsField,
  SettingsSelect,
  SaveIndicator,
} from "../components";
import { useAutoSave } from "../hooks";

// Timezone options
const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "UTC", label: "UTC" },
];

// Language options
const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

interface ProfileFormData {
  name: string;
  timezone: string;
  language: string;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    timezone: "America/New_York",
    language: "en",
  });

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        timezone: "America/New_York", // Default since not in user type
        language: "en", // Default since not in user type
      });
    }
  }, [user]);

  const handleSave = useCallback(
    async (data: ProfileFormData) => {
      await updateProfile.mutateAsync({
        name: data.name,
      });
    },
    [updateProfile]
  );

  const { status, error } = useAutoSave({
    data: formData,
    onSave: handleSave,
    delay: 1000,
    enabled: !!user,
  });

  const handleFieldChange = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal information
          </p>
        </div>
        <SaveIndicator status={status} errorMessage={error || undefined} />
      </div>

      <SettingsSection
        title="Personal Information"
        description="Update your personal details"
      >
        <SettingsField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={(value) => handleFieldChange("name", value)}
          placeholder="Enter your name"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Timezone"
            name="timezone"
            value={formData.timezone}
            onValueChange={(value) => handleFieldChange("timezone", value)}
            options={timezoneOptions}
            helpText="Used for displaying dates and times"
          />

          <SettingsSelect
            label="Language"
            name="language"
            value={formData.language}
            onValueChange={(value) => handleFieldChange("language", value)}
            options={languageOptions}
            helpText="Preferred display language"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Account Information"
        description="View your account details"
      >
        <SettingsField
          label="Email"
          name="email"
          value={user?.email || ""}
          onChange={() => {}}
          disabled
          helpText="Contact support to change your email address"
        />

        <SettingsField
          label="Role"
          name="role"
          value={user?.role || ""}
          onChange={() => {}}
          disabled
          helpText="Your account role determines your permissions"
        />
      </SettingsSection>
    </div>
  );
}
