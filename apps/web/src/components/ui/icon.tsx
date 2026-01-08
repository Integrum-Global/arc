"use client";

import * as React from "react";
import { type LucideIcon, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  icons,
  type IconCategory,
  type FinancialIconName,
  type AlertIconName,
  type NavIconName,
  type ActionIconName,
  type DataIconName,
  type UserIconName,
  type CommunicationIconName,
  type TimeIconName,
  type ThemeIconName,
  type MiscIconName,
  type LoadingIconName,
} from "@/lib/icons";

/**
 * Icon Component
 *
 * A wrapper component for lucide-react icons that provides
 * consistent sizing and styling throughout the application.
 */

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-10 w-10",
};

export interface IconProps extends Omit<LucideProps, "ref"> {
  /** The lucide icon component to render */
  icon: LucideIcon;
  /** Size variant */
  size?: IconSize;
  /** Additional class names */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
  label,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      aria-hidden={!label}
      aria-label={label}
      {...props}
    />
  );
}

Icon.displayName = "Icon";

/**
 * Type-safe icon name union for getIcon
 */
type IconNameMap = {
  financial: FinancialIconName;
  alert: AlertIconName;
  nav: NavIconName;
  action: ActionIconName;
  data: DataIconName;
  user: UserIconName;
  communication: CommunicationIconName;
  time: TimeIconName;
  theme: ThemeIconName;
  misc: MiscIconName;
  loading: LoadingIconName;
};

/**
 * Get an icon component by category and name
 *
 * @param category - The icon category
 * @param name - The icon name within the category
 * @returns The lucide icon component
 *
 * @example
 * const TrendUpIcon = getIcon("financial", "trendUp");
 * <TrendUpIcon className="h-4 w-4" />
 */
export function getIcon<C extends IconCategory>(
  category: C,
  name: IconNameMap[C]
): LucideIcon {
  const categoryIcons = icons[category] as Record<string, LucideIcon>;
  const icon = categoryIcons[name as string];
  if (!icon) {
    throw new Error(`Icon not found: ${category}.${String(name)}`);
  }
  return icon;
}

/**
 * NamedIcon Component
 *
 * Renders an icon by category and name strings.
 * Useful when icon selection is dynamic.
 */
export interface NamedIconProps extends Omit<IconProps, "icon"> {
  /** Icon category */
  category: IconCategory;
  /** Icon name within category */
  name: string;
}

export function NamedIcon({
  category,
  name,
  ...props
}: NamedIconProps) {
  const categoryIcons = icons[category] as Record<string, LucideIcon> | undefined;
  const IconComponent = categoryIcons?.[name] as LucideIcon | undefined;

  if (!IconComponent) {
    console.warn(`Icon not found: ${category}.${name}`);
    return null;
  }

  return <Icon icon={IconComponent} {...props} />;
}

NamedIcon.displayName = "NamedIcon";

/**
 * Spinner Component
 *
 * An animated loading spinner using the Loader2 icon.
 */
export interface SpinnerProps {
  /** Size variant */
  size?: IconSize;
  /** Additional class names */
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Icon
      icon={icons.loading.loader2}
      size={size}
      className={cn("animate-spin", className)}
      label="Loading"
    />
  );
}

Spinner.displayName = "Spinner";

/**
 * IconButton wrapper for common icon-only button pattern
 */
export interface IconWithBackgroundProps extends IconProps {
  /** Background variant */
  variant?: "default" | "muted" | "primary" | "success" | "warning" | "danger";
}

const variantClasses = {
  default: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-positive/10 text-positive",
  warning: "bg-warning/10 text-warning-foreground",
  danger: "bg-negative/10 text-negative",
};

export function IconWithBackground({
  variant = "default",
  className,
  ...props
}: IconWithBackgroundProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2",
        variantClasses[variant],
        className
      )}
    >
      <Icon {...props} />
    </div>
  );
}

IconWithBackground.displayName = "IconWithBackground";
