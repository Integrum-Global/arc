/**
 * Preferences Settings Page
 *
 * Allows users to customize theme, defaults, and display formats.
 */

"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/useAuth";
import { usePortfolios } from "@/hooks/usePortfolios";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  SettingsSection,
  SettingsSelect,
  SaveIndicator,
} from "../components";
import { useAutoSave } from "../hooks";
import { Sun, Moon, Monitor } from "lucide-react";

// Date format options
const dateFormatOptions = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/15/2024)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (15/01/2024)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-01-15)" },
  { value: "MMM DD, YYYY", label: "MMM DD, YYYY (Jan 15, 2024)" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY (15 Jan 2024)" },
];

// Number format options
const numberFormatOptions = [
  { value: "en-US", label: "US (1,234.56)" },
  { value: "en-GB", label: "UK (1,234.56)" },
  { value: "de-DE", label: "German (1.234,56)" },
  { value: "fr-FR", label: "French (1 234,56)" },
  { value: "ja-JP", label: "Japanese (1,234.56)" },
];

// Currency options
const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
];

interface PreferencesFormData {
  theme: "light" | "dark" | "system";
  defaultPortfolio: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}

interface ThemeOptionProps {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ElementType;
  isSelected: boolean;
}

function ThemeOption({ value, label, icon: Icon, isSelected }: ThemeOptionProps) {
  return (
    <Label
      htmlFor={`theme-${value}`}
      className={`
        flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors
        ${isSelected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/25"
        }
      `}
    >
      <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
      <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
        {label}
      </span>
    </Label>
  );
}

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: preferences, isLoading: preferencesLoading } = useUserPreferences();
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const updatePreferences = useUpdatePreferences();

  const [formData, setFormData] = useState<PreferencesFormData>({
    theme: "system",
    defaultPortfolio: "",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
    currency: "USD",
  });

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        theme: preferences.theme || "system",
        defaultPortfolio: "",
        dateFormat: preferences.date_format || "MM/DD/YYYY",
        numberFormat: "en-US",
        currency: preferences.currency || "USD",
      });
    }
  }, [preferences]);

  // Keep theme in sync with provider
  useEffect(() => {
    setFormData((prev) => ({ ...prev, theme }));
  }, [theme]);

  const handleSave = useCallback(
    async (data: PreferencesFormData) => {
      await updatePreferences.mutateAsync({
        theme: data.theme,
        date_format: data.dateFormat,
        currency: data.currency,
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

  const handleThemeChange = useCallback(
    (value: string) => {
      const newTheme = value as "light" | "dark" | "system";
      setTheme(newTheme);
      setFormData((prev) => ({ ...prev, theme: newTheme }));
    },
    [setTheme]
  );

  const handleFieldChange = useCallback(
    <K extends keyof PreferencesFormData>(field: K, value: PreferencesFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const isLoading = preferencesLoading || portfoliosLoading;

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  // Create portfolio options from data
  const portfolioOptions = [
    { value: "", label: "No default" },
    ...(portfolios?.items?.map((p) => ({
      value: p.id,
      label: p.name,
    })) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Customize your experience
          </p>
        </div>
        <SaveIndicator status={status} errorMessage={error || undefined} />
      </div>

      <SettingsSection
        title="Appearance"
        description="Choose your preferred color theme"
      >
        <RadioGroup
          value={formData.theme}
          onValueChange={handleThemeChange}
          className="grid grid-cols-3 gap-4"
        >
          <ThemeOption
            value="light"
            label="Light"
            icon={Sun}
            isSelected={formData.theme === "light"}
          />
          <ThemeOption
            value="dark"
            label="Dark"
            icon={Moon}
            isSelected={formData.theme === "dark"}
          />
          <ThemeOption
            value="system"
            label="System"
            icon={Monitor}
            isSelected={formData.theme === "system"}
          />
        </RadioGroup>
      </SettingsSection>

      <SettingsSection
        title="Default Portfolio"
        description="Set your default portfolio for the dashboard"
      >
        <SettingsSelect
          label="Default Portfolio"
          name="defaultPortfolio"
          value={formData.defaultPortfolio}
          onValueChange={(value) => handleFieldChange("defaultPortfolio", value)}
          options={portfolioOptions}
          helpText="This portfolio will be shown by default on the dashboard"
        />
      </SettingsSection>

      <SettingsSection
        title="Display Formats"
        description="Configure how data is displayed"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Date Format"
            name="dateFormat"
            value={formData.dateFormat}
            onValueChange={(value) => handleFieldChange("dateFormat", value)}
            options={dateFormatOptions}
          />

          <SettingsSelect
            label="Number Format"
            name="numberFormat"
            value={formData.numberFormat}
            onValueChange={(value) => handleFieldChange("numberFormat", value)}
            options={numberFormatOptions}
          />
        </div>

        <SettingsSelect
          label="Default Currency"
          name="currency"
          value={formData.currency}
          onValueChange={(value) => handleFieldChange("currency", value)}
          options={currencyOptions}
          helpText="Used for displaying monetary values"
        />
      </SettingsSection>
    </div>
  );
}
