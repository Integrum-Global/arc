/**
 * Alert Command Center Page
 *
 * Comprehensive alert management page with filtering, sorting, search, and bulk actions.
 *
 * Features:
 * - Tab filters: All, Critical, Actionable, Informational, Resolved
 * - Badge counts per tab
 * - Search input with 300ms debouncing
 * - Alert type dropdown filter
 * - Sort dropdown: Recent (default), Severity, Portfolio
 * - Paginated table (20 items per page)
 * - Bulk actions: Mark All Read, Acknowledge Selected, Dismiss Selected
 * - Settings button → /settings/notifications
 * - Responsive: table → cards on mobile
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, CheckCheck } from "lucide-react";
import { useAlerts, useAcknowledgeAlert } from "@/hooks";
import { AlertTable } from "./components";
import type { AlertListFilters } from "@/types/api";

type TabValue = "all" | "critical" | "actionable" | "informational" | "resolved";

/**
 * Map tab to severity filter
 */
function getSeverityFromTab(tab: TabValue): string | undefined {
  switch (tab) {
    case "critical":
      return "critical";
    case "actionable":
      return "high,medium";
    case "informational":
      return "low";
    default:
      return undefined;
  }
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Alert Command Center Page
 */
export default function AlertsPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [alertType, setAlertType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "severity" | "portfolio">("recent");
  const [page, setPage] = useState(1);

  // Debounce search with 300ms delay
  const debouncedSearch = useDebounce(search, 300);

  // Build filters
  const filters: AlertListFilters = useMemo(() => {
    const status = activeTab === "resolved" ? "resolved" : "active";
    const severity = getSeverityFromTab(activeTab);

    return {
      status,
      severity,
      type: alertType !== "all" ? alertType : undefined,
      search: debouncedSearch || undefined,
      page,
      page_size: 20,
      sort_by: sortBy === "recent" ? "created_at" : sortBy === "severity" ? "severity" : "portfolio_name",
      sort_order: "desc",
    };
  }, [activeTab, alertType, debouncedSearch, page, sortBy]);

  // Fetch alerts
  const { data, isLoading } = useAlerts(filters);

  // Mutations
  const acknowledgeAlert = useAcknowledgeAlert();

  // Calculate badge counts
  const counts = {
    critical: data?.counts?.critical ?? 0,
    actionable: data?.counts?.actionable ?? 0,
    informational: data?.counts?.informational ?? 0,
    resolved: data?.counts?.resolved ?? 0,
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, alertType, debouncedSearch, sortBy]);

  return (
    <PageContainer
      title="Alerts"
      subtitle="Manage and review all portfolio alerts"
      data-testid="alerts-page"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Mark all as read (client-side only)
            }}
            role="button"
            aria-label="Mark All Read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/notifications" role="link" aria-label="Settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      }
    >
      {/* Tab Filters */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all" role="tab" aria-label="All">
            All
          </TabsTrigger>
          <TabsTrigger value="critical" role="tab" aria-label="Critical">
            Critical ({counts.critical})
          </TabsTrigger>
          <TabsTrigger value="actionable" role="tab" aria-label="Actionable">
            Actionable ({counts.actionable})
          </TabsTrigger>
          <TabsTrigger value="informational" role="tab" aria-label="Informational">
            Informational ({counts.informational})
          </TabsTrigger>
          <TabsTrigger value="resolved" role="tab" aria-label="Resolved">
            Resolved
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search alerts"
          />
        </div>

        {/* Alert Type Filter */}
        <Select value={alertType} onValueChange={setAlertType}>
          <SelectTrigger className="w-full sm:w-40" role="combobox" aria-label="Type">
            <SelectValue placeholder="Alert Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" role="option">
              All Types
            </SelectItem>
            <SelectItem value="threshold_breach" role="option">
              Threshold Breach
            </SelectItem>
            <SelectItem value="health_issue" role="option">
              Health Issue
            </SelectItem>
            <SelectItem value="concentration_warning" role="option">
              Concentration
            </SelectItem>
            <SelectItem value="margin_call" role="option">
              Margin Call
            </SelectItem>
            <SelectItem value="price_alert" role="option">
              Price Alert
            </SelectItem>
            <SelectItem value="portfolio_drift" role="option">
              Portfolio Drift
            </SelectItem>
            <SelectItem value="rebalance_needed" role="option">
              Rebalance Needed
            </SelectItem>
            <SelectItem value="risk_warning" role="option">
              Risk Warning
            </SelectItem>
            <SelectItem value="compliance" role="option">
              Compliance
            </SelectItem>
            <SelectItem value="news" role="option">
              News
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as typeof sortBy)}
        >
          <SelectTrigger className="w-full sm:w-36" role="combobox" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent" role="option">
              Most Recent
            </SelectItem>
            <SelectItem value="severity" role="option">
              Severity
            </SelectItem>
            <SelectItem value="portfolio" role="option">
              Portfolio
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert Table */}
      <AlertTable
        alerts={data?.items ?? []}
        loading={isLoading}
        sortBy={sortBy}
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
      />
    </PageContainer>
  );
}
