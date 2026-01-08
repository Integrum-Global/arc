/**
 * Admin Tenant Settings Page
 *
 * Allows administrators to configure organization-wide settings.
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  SettingsSection,
  SettingsField,
  SettingsSelect,
  SettingsToggle,
  SaveIndicator,
} from "../../components";
import { useAutoSave } from "../../hooks";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Building2, Globe, Shield, Loader2, AlertTriangle } from "lucide-react";

interface TenantFormData {
  organizationName: string;
  subdomain: string;
  industry: string;
  companySize: string;
  defaultCurrency: string;
  defaultTimezone: string;
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: string;
  maxFailedLoginAttempts: string;
}

// Industry options
const industryOptions = [
  { value: "asset_management", label: "Asset Management" },
  { value: "wealth_management", label: "Wealth Management" },
  { value: "hedge_fund", label: "Hedge Fund" },
  { value: "private_equity", label: "Private Equity" },
  { value: "family_office", label: "Family Office" },
  { value: "bank", label: "Bank/Financial Institution" },
  { value: "insurance", label: "Insurance" },
  { value: "pension_fund", label: "Pension Fund" },
  { value: "endowment", label: "Endowment" },
  { value: "other", label: "Other" },
];

// Company size options
const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

// Currency options
const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
];

// Timezone options
const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "UTC", label: "UTC" },
];

export default function AdminTenantPage() {
  const isAdmin = useIsAdmin();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<TenantFormData>({
    organizationName: "Acme Investments",
    subdomain: "acme",
    industry: "asset_management",
    companySize: "51-200",
    defaultCurrency: "USD",
    defaultTimezone: "America/New_York",
    allowPublicRegistration: false,
    requireEmailVerification: true,
    sessionTimeoutMinutes: "30",
    maxFailedLoginAttempts: "5",
  });

  // Redirect non-admins
  if (!isAdmin) {
    redirect("/settings/profile");
  }

  const handleSave = useCallback(async (data: TenantFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, []);

  const { status, error } = useAutoSave({
    data: formData,
    onSave: handleSave,
    delay: 1500,
    enabled: true,
  });

  const handleFieldChange = useCallback(
    <K extends keyof TenantFormData>(field: K, value: TenantFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleExportData = useCallback(async () => {
    setIsSaving(true);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSaving(false);
    toast.success("Data export initiated", {
      description: "You will receive an email when the export is ready",
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tenant Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure organization-wide settings
          </p>
        </div>
        <SaveIndicator status={status} errorMessage={error || undefined} />
      </div>

      <SettingsSection
        title="Organization Details"
        description="Basic information about your organization"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Organization Logo</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 2MB. Recommended size: 256x256px
            </p>
            <Button variant="outline" size="sm">
              Upload Logo
            </Button>
          </div>
        </div>

        <SettingsField
          label="Organization Name"
          name="organizationName"
          value={formData.organizationName}
          onChange={(value) => handleFieldChange("organizationName", value)}
          required
        />

        <SettingsField
          label="Subdomain"
          name="subdomain"
          value={formData.subdomain}
          onChange={(value) => handleFieldChange("subdomain", value)}
          helpText="Your organization's unique URL: acme.arc-platform.com"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Industry"
            name="industry"
            value={formData.industry}
            onValueChange={(value) => handleFieldChange("industry", value)}
            options={industryOptions}
          />

          <SettingsSelect
            label="Company Size"
            name="companySize"
            value={formData.companySize}
            onValueChange={(value) => handleFieldChange("companySize", value)}
            options={companySizeOptions}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Default Settings"
        description="Organization-wide default values"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Default Currency"
            name="defaultCurrency"
            value={formData.defaultCurrency}
            onValueChange={(value) => handleFieldChange("defaultCurrency", value)}
            options={currencyOptions}
            helpText="Default currency for new portfolios"
          />

          <SettingsSelect
            label="Default Timezone"
            name="defaultTimezone"
            value={formData.defaultTimezone}
            onValueChange={(value) => handleFieldChange("defaultTimezone", value)}
            options={timezoneOptions}
            helpText="Default timezone for new users"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Security Settings"
        description="Organization-wide security policies"
      >
        <SettingsToggle
          label="Allow Public Registration"
          description="Allow anyone to create an account (not recommended)"
          name="allowPublicRegistration"
          checked={formData.allowPublicRegistration}
          onCheckedChange={(checked) =>
            handleFieldChange("allowPublicRegistration", checked)
          }
        />
        <Separator />

        <SettingsToggle
          label="Require Email Verification"
          description="Users must verify their email before accessing the platform"
          name="requireEmailVerification"
          checked={formData.requireEmailVerification}
          onCheckedChange={(checked) =>
            handleFieldChange("requireEmailVerification", checked)
          }
        />
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Session Timeout (minutes)"
            name="sessionTimeoutMinutes"
            value={formData.sessionTimeoutMinutes}
            onChange={(value) => handleFieldChange("sessionTimeoutMinutes", value)}
            type="number"
            helpText="Automatically log out inactive users"
          />

          <SettingsField
            label="Max Failed Login Attempts"
            name="maxFailedLoginAttempts"
            value={formData.maxFailedLoginAttempts}
            onChange={(value) => handleFieldChange("maxFailedLoginAttempts", value)}
            type="number"
            helpText="Lock account after failed attempts"
          />
        </div>
      </SettingsSection>

      {/* Data Management */}
      <Card className="border-yellow-200 dark:border-yellow-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle className="text-base">Data Management</CardTitle>
              <CardDescription>
                Export or delete organization data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-sm text-muted-foreground">
                Download all organization data in CSV format
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export Data"
              )}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all organization data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
