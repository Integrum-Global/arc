/**
 * Dashboard Layout
 *
 * Layout wrapper for all dashboard pages.
 * Provides the AppShell with sidebar, header, and content area.
 */

import { AppShell } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
