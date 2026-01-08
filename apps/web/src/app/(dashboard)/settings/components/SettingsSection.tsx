/**
 * SettingsSection Component
 *
 * A section wrapper with title and description for grouping related settings.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Whether to show separator after content */
  showSeparator?: boolean;
  /** Whether to use card wrapper */
  asCard?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
  showSeparator = false,
  asCard = true,
}: SettingsSectionProps) {
  if (asCard) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
      {showSeparator && <Separator className="mt-6" />}
    </div>
  );
}

SettingsSection.displayName = "SettingsSection";
