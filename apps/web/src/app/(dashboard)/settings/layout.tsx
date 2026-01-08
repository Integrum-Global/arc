/**
 * Settings Layout
 *
 * Layout wrapper for all settings pages with sidebar navigation.
 */

import * as React from "react";
import { PageContainer } from "@/components/layout";
import { SettingsNav } from "./components";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer
      title="Settings"
      subtitle="Manage your account settings and preferences"
      maxWidth="xl"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="sticky top-4">
            <SettingsNav />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </PageContainer>
  );
}
