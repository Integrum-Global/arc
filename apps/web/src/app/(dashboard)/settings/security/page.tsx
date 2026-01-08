/**
 * Security Settings Page
 *
 * Allows users to change their password and manage security settings.
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Eye, EyeOff, Loader2, Shield, Key, Smartphone } from "lucide-react";
import { SettingsSection, SettingsToggle } from "../components";
import { Separator } from "@/components/ui/separator";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFieldProps {
  name: keyof PasswordFormData;
  label: string;
  placeholder: string;
  showPassword: boolean;
  onToggleShow: () => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description?: string;
}

function PasswordField({
  name,
  label,
  placeholder,
  showPassword,
  onToggleShow,
  value,
  onChange,
  error,
  description,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          aria-invalid={!!error}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={onToggleShow}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function SecuritySettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});

  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain an uppercase letter";
    } else if (!/[a-z]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain a lowercase letter";
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain a number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Simulate API call (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success("Password updated", {
          description: "Your password has been changed successfully",
        });

        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
      } catch {
        toast.error("Failed to update password", {
          description: "Please check your current password and try again",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm]
  );

  const handleFieldChange = useCallback(
    (field: keyof PasswordFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const toggleShowPassword = useCallback((field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage your password and security settings
        </p>
      </div>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <PasswordField
              name="currentPassword"
              label="Current Password"
              placeholder="Enter your current password"
              showPassword={showPasswords.current}
              onToggleShow={() => toggleShowPassword("current")}
              value={formData.currentPassword}
              onChange={(value) => handleFieldChange("currentPassword", value)}
              error={errors.currentPassword}
            />

            <Separator />

            <PasswordField
              name="newPassword"
              label="New Password"
              placeholder="Enter your new password"
              showPassword={showPasswords.new}
              onToggleShow={() => toggleShowPassword("new")}
              value={formData.newPassword}
              onChange={(value) => handleFieldChange("newPassword", value)}
              error={errors.newPassword}
              description="Must be at least 8 characters with uppercase, lowercase, and numbers"
            />

            <PasswordField
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="Confirm your new password"
              showPassword={showPasswords.confirm}
              onToggleShow={() => toggleShowPassword("confirm")}
              value={formData.confirmPassword}
              onChange={(value) => handleFieldChange("confirmPassword", value)}
              error={errors.confirmPassword}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Security Options */}
      <SettingsSection
        title="Security Options"
        description="Additional security settings for your account"
      >
        <SettingsToggle
          label="Two-Factor Authentication"
          description="Add an extra layer of security with 2FA"
          name="twoFactor"
          checked={twoFactorEnabled}
          onCheckedChange={setTwoFactorEnabled}
        />
        <Separator />

        <SettingsToggle
          label="Session Timeout"
          description="Automatically log out after 30 minutes of inactivity"
          name="sessionTimeout"
          checked={sessionTimeout}
          onCheckedChange={setSessionTimeout}
        />
      </SettingsSection>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you are currently logged in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-muted-foreground">
                  Chrome on macOS - This device
                </p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="text-destructive">
            Sign Out All Other Devices
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Badge component inline since it might have variant issues
function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variant === "secondary"
          ? "bg-secondary text-secondary-foreground"
          : "bg-primary text-primary-foreground"
      }`}
    >
      {children}
    </span>
  );
}
