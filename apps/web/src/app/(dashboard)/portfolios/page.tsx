"use client";

/**
 * Portfolio List Page
 *
 * Displays a grid of portfolio cards with filtering and sorting options.
 */

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Filter, SortAsc } from "lucide-react";
import { PageContainer, Grid } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PortfolioCard,
  PortfolioCardSkeleton,
} from "@/components/data/PortfolioCard";
import { usePortfolios, usePrefetchPortfolio } from "@/hooks/usePortfolios";
import { CreatePortfolioDialog } from "./components/CreatePortfolioDialog";
import type { PortfolioType, PortfolioStatus } from "@/types/api";

// Mapping from API portfolio type to UI portfolio type
function mapPortfolioType(
  apiType: PortfolioType
): "individual" | "joint" | "ira" | "401k" | "trust" | "corporate" | "other" {
  const typeMap: Record<PortfolioType, "individual" | "joint" | "ira" | "401k" | "trust" | "corporate" | "other"> = {
    equity: "individual",
    fixed_income: "individual",
    balanced: "joint",
    money_market: "trust",
    alternative: "corporate",
    custom: "other",
  };
  return typeMap[apiType] || "other";
}

// Filter options
const typeOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "equity", label: "Equity" },
  { value: "fixed_income", label: "Fixed Income" },
  { value: "balanced", label: "Balanced" },
  { value: "money_market", label: "Money Market" },
  { value: "alternative", label: "Alternative" },
  { value: "custom", label: "Custom" },
];

const sortOptions: Array<{ value: string; label: string }> = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "value_desc", label: "Value (High-Low)" },
  { value: "value_asc", label: "Value (Low-High)" },
  { value: "return_desc", label: "Return (High-Low)" },
  { value: "return_asc", label: "Return (Low-High)" },
];

function PortfolioListSkeleton() {
  return (
    <PageContainer
      title="Portfolios"
      subtitle="Manage and monitor your investment portfolios"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <PortfolioCardSkeleton key={i} />
          ))}
        </Grid>
      </div>
    </PageContainer>
  );
}

function PortfolioListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from URL
  const typeFilter = searchParams.get("type") || "all";
  const sortBy = searchParams.get("sort") || "name_asc";

  // Parse sort value
  const [sortField, sortOrder] = sortBy.split("_") as [string, "asc" | "desc"];

  // Fetch portfolios
  const {
    data: portfoliosData,
    isPending,
    error,
  } = usePortfolios({
    type: typeFilter !== "all" ? (typeFilter as PortfolioType) : undefined,
    sort_by: sortField === "value" ? "total_value" : sortField === "return" ? "ytd_return" : sortField,
    sort_order: sortOrder,
    status: "active" as PortfolioStatus,
  });

  // Prefetch for hover
  const prefetchPortfolio = usePrefetchPortfolio();

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Update URL params
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/portfolios?${params.toString()}`);
  };

  // Handle portfolio click
  const handlePortfolioClick = (portfolio: { id: string }) => {
    router.push(`/portfolios/${portfolio.id}`);
  };

  // Handle portfolio hover for prefetch
  const handlePortfolioHover = (portfolioId: string) => {
    prefetchPortfolio(portfolioId);
  };

  const portfolios = portfoliosData?.items || [];

  return (
    <PageContainer
      title="Portfolios"
      subtitle="Manage and monitor your investment portfolios"
      error={error?.message}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Portfolio
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={(value) => updateFilter("type", value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => updateFilter("sort", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isPending && (
            <Skeleton className="h-4 w-24" />
          )}
          {!isPending && portfolios.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Portfolio Grid */}
        {isPending ? (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {Array.from({ length: 6 }).map((_, i) => (
              <PortfolioCardSkeleton key={i} />
            ))}
          </Grid>
        ) : portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No portfolios found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {typeFilter !== "all"
                ? "Try changing the filter or create a new portfolio."
                : "Get started by creating your first portfolio."}
            </p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </div>
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                onMouseEnter={() => handlePortfolioHover(portfolio.id)}
              >
                <PortfolioCard
                  portfolio={{
                    id: portfolio.id,
                    name: portfolio.name,
                    type: mapPortfolioType(portfolio.type),
                    totalValue: portfolio.total_value,
                    dayChange: portfolio.unrealized_pnl,
                    dayChangePct: portfolio.ytd_return,
                    allocation: [], // Will be populated from holdings
                    lastUpdated: portfolio.updated_at,
                  }}
                  onClick={() => handlePortfolioClick(portfolio)}
                  showAllocation={false}
                />
              </div>
            ))}
          </Grid>
        )}
      </div>

      {/* Create Portfolio Dialog */}
      <CreatePortfolioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </PageContainer>
  );
}

export default function PortfoliosPage() {
  return (
    <Suspense fallback={<PortfolioListSkeleton />}>
      <PortfolioListContent />
    </Suspense>
  );
}
