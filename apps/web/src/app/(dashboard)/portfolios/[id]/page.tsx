"use client";

/**
 * Portfolio Detail Page
 *
 * Displays detailed portfolio information with tabbed interface.
 */

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, useInvalidatePortfolios } from "@/hooks/usePortfolios";
import { OverviewTab } from "../components/OverviewTab";
import { HoldingsTab } from "../components/HoldingsTab";
import { TransactionsTab } from "../components/TransactionsTab";
import { PerformanceTab } from "../components/PerformanceTab";
import { HealthTab } from "../components/HealthTab";
import { AddTransactionDialog } from "../components/AddTransactionDialog";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "holdings", label: "Holdings" },
  { value: "transactions", label: "Transactions" },
  { value: "performance", label: "Performance" },
  { value: "health", label: "Health" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

function PortfolioDetailSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-96" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}

function PortfolioDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const portfolioId = params.id as string;

  // Get active tab from URL or default to overview
  const activeTab = (searchParams.get("tab") as TabValue) || "overview";

  // Fetch portfolio data
  const { data: portfolio, isPending, error, refetch } = usePortfolio(portfolioId);

  // Invalidate portfolios
  const invalidatePortfolios = useInvalidatePortfolios();

  // Dialog state
  const [addTransactionOpen, setAddTransactionOpen] = React.useState(false);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const queryString = params.toString();
    router.push(`/portfolios/${portfolioId}${queryString ? `?${queryString}` : ""}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    invalidatePortfolios();
  };

  // Back navigation
  const handleBack = () => {
    router.push("/portfolios");
  };

  // Loading state
  if (isPending) {
    return (
      <PageContainer>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-96" />
          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !portfolio) {
    return (
      <PageContainer
        title="Portfolio Not Found"
        error={error?.message || "The requested portfolio could not be found."}
      >
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolios
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={portfolio.name}
      subtitle={portfolio.description || `${portfolio.type.replace("_", " ")} portfolio`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddTransactionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Back link */}
        <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolios
        </Button>

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab portfolioId={portfolioId} portfolio={portfolio} />
          </TabsContent>

          <TabsContent value="holdings" className="mt-6">
            <HoldingsTab portfolioId={portfolioId} currency={portfolio.currency} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsTab
              portfolioId={portfolioId}
              currency={portfolio.currency}
              onAddTransaction={() => setAddTransactionOpen(true)}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceTab portfolioId={portfolioId} portfolio={portfolio} />
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <HealthTab portfolioId={portfolioId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        portfolioId={portfolioId}
        currency={portfolio.currency}
      />
    </PageContainer>
  );
}

export default function PortfolioDetailPage() {
  return (
    <Suspense fallback={<PortfolioDetailSkeleton />}>
      <PortfolioDetailContent />
    </Suspense>
  );
}
