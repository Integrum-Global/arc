/**
 * SettingsNav Component
 *
 * Navigation sidebar for settings pages with role-gated admin section.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAuth";
import {
  User,
  Settings,
  Bell,
  Database,
  Shield,
  Users,
  Building2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const userNavItems: NavItem[] = [
  {
    href: "/settings/profile",
    label: "Profile",
    icon: User,
    description: "Your personal information",
  },
  {
    href: "/settings/preferences",
    label: "Preferences",
    icon: Settings,
    description: "Theme, formats, and defaults",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alert and notification settings",
  },
  {
    href: "/settings/providers",
    label: "Data Providers",
    icon: Database,
    description: "API keys and connections",
  },
  {
    href: "/settings/security",
    label: "Security",
    icon: Shield,
    description: "Password and authentication",
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/settings/admin/users",
    label: "Users",
    icon: Users,
    description: "Manage user accounts",
  },
  {
    href: "/settings/admin/tenant",
    label: "Tenant",
    icon: Building2,
    description: "Organization settings",
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function SettingsNav() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  const isActive = (href: string) => {
    // Exact match or starts with (for nested routes)
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="w-full space-y-6" aria-label="Settings navigation">
      {/* User Settings Section */}
      <div className="space-y-1">
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h3>
        <div className="space-y-1">
          {userNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}
        </div>
      </div>

      {/* Admin Section - Role Gated */}
      {isAdmin && (
        <>
          <Separator />
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </h3>
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

SettingsNav.displayName = "SettingsNav";
