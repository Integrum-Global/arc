"use client";

/**
 * Dashboard Page
 *
 * Main dashboard view for the ARC Investment Platform.
 * Displays portfolio summary, allocations, performance, alerts, and briefs.
 */

import { PageContainer, Grid, GridItem, SectionGroup } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { useDashboardData } from "@/hooks";
import {
  SummaryCards,
  AllocationSection,
  PerformanceSection,
  ActionableAlertsWidget,
  BriefSection,
  QuickActions,
} from "./components";

export default function DashboardPage() {
  const {
    summary,
    allocations,
    topHoldings,
    performanceHistory,
    activeAlerts,
    brief,
    isLoading,
    loadingStates,
    freshness,
    refetch,
  } = useDashboardData();

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Overview of your portfolio performance"
      data-testid="dashboard-page"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      }
    >
      <SectionGroup gap="lg">
        {/* Summary Stats Row */}
        <SummaryCards
          summary={summary}
          loading={loadingStates.portfolios}
        />

        {/* Allocation and Performance Row */}
        <Grid cols={{ default: 1, xl: 2 }} gap="lg">
          <GridItem>
            <AllocationSection
              allocations={allocations}
              topHoldings={topHoldings}
              loading={loadingStates.portfolios}
            />
          </GridItem>
          <GridItem>
            <PerformanceSection
              data={performanceHistory}
              loading={loadingStates.portfolios}
            />
          </GridItem>
        </Grid>

        {/* Alerts and Brief Row */}
        <Grid cols={{ default: 1, lg: 2 }} gap="lg">
          <GridItem>
            <ActionableAlertsWidget loading={loadingStates.alerts} />
          </GridItem>
          <GridItem>
            <BriefSection
              brief={brief}
              loading={loadingStates.brief}
            />
          </GridItem>
        </Grid>

        {/* Quick Actions */}
        <QuickActions
          onRefresh={refetch}
          isRefreshing={freshness.isRefreshing}
          freshness={freshness}
        />
      </SectionGroup>
    </PageContainer>
  );
}
