"use client";

/**
 * Analytics Page
 *
 * Main analytics page with tabbed interface for:
 * - Ratios: Financial ratio cards grouped by class
 * - Alerts: Active alerts list with filters
 * - Thresholds: Threshold configuration list
 * - Benchmarking: Peer comparison view
 */

import * as React from "react";
import { PageContainer } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { RatiosTab } from "./components/RatiosTab";
import { AlertsTab } from "./components/AlertsTab";
import { ThresholdsTab } from "./components/ThresholdsTab";
import { BenchmarkingTab } from "./components/BenchmarkingTab";
import { useInvalidateAnalytics } from "@/hooks";

export default function AnalyticsPage() {
  const invalidateAnalytics = useInvalidateAnalytics();
  const [activeTab, setActiveTab] = React.useState("ratios");

  const handleRefresh = () => {
    invalidateAnalytics();
  };

  return (
    <PageContainer
      title="Analytics"
      subtitle="Financial ratios, alerts, and benchmarking tools"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {activeTab === "thresholds" && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Threshold
            </Button>
          )}
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
        </TabsList>

        <TabsContent value="ratios">
          <RatiosTab />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>

        <TabsContent value="thresholds">
          <ThresholdsTab />
        </TabsContent>

        <TabsContent value="benchmarking">
          <BenchmarkingTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
