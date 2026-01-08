/**
 * AppShell Component
 *
 * Main application shell that combines Sidebar, Header, and content area.
 * Handles responsive behavior and sidebar state management.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

/**
 * AppShell Props
 */
export interface AppShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to show the search bar in header */
  showSearch?: boolean;
}

/**
 * AppShell Component
 *
 * Provides the main application layout structure with:
 * - Responsive sidebar (collapsible on desktop, sheet on mobile)
 * - Fixed header with search and user controls
 * - Scrollable content area
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <PageContainer title="Dashboard">
 *     <DashboardContent />
 *   </PageContainer>
 * </AppShell>
 * ```
 */
export function AppShell({ children, className, showSearch = true }: AppShellProps) {
  const isMobile = useIsMobile();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  // Mobile sidebar state
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Handle sidebar collapse toggle
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      )}

      {/* Mobile Navigation Sheet */}
      {isMobile && (
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <Header onMenuToggle={handleMobileMenuToggle} showSearch={showSearch} />

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

AppShell.displayName = "AppShell";
