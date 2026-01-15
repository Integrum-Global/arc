/**
 * Dashboard Data Hook
 *
 * Aggregates data from multiple hooks for the dashboard page.
 * Provides combined loading, error, and data states.
 * Tracks data freshness and staleness indicators.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import { usePortfolios, usePortfolioHealth } from "./usePortfolios";
import { useAlerts } from "./useAnalytics";
import { useMorningBrief } from "./useIntelligence";
import type {
  Alert,
  MarketBrief,
  SectorAllocation,
} from "@/types/api";

/** Data staleness threshold in milliseconds (5 minutes) */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Dashboard summary metrics
 */
export interface DashboardSummary {
  /** Total value across all portfolios */
  totalValue: number;
  /** Day change in currency */
  dayChange: number;
  /** Day change percentage */
  dayChangePct: number;
  /** Year-to-date return */
  ytdReturn: number;
  /** Benchmark YTD return for comparison */
  benchmarkYtdReturn: number;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Health status */
  healthStatus: "healthy" | "warning" | "critical";
}

/**
 * Holding data for top holdings display
 */
export interface TopHolding {
  id: string;
  name: string;
  ticker: string;
  value: number;
  weight: number;
  change: number;
}

/**
 * Performance data point for chart
 */
export interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

/**
 * Data freshness information
 */
export interface DataFreshness {
  /** Timestamp of last successful data fetch */
  lastUpdated: Date | null;
  /** Whether the data is considered stale */
  isStale: boolean;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
}

/**
 * Dashboard data hook return type
 */
export interface DashboardData {
  /** Summary metrics */
  summary: DashboardSummary | null;
  /** Sector allocations for chart */
  allocations: SectorAllocation[];
  /** Top 5 holdings */
  topHoldings: TopHolding[];
  /** Performance history data */
  performanceHistory: PerformanceDataPoint[];
  /** Active alerts (max 5) */
  activeAlerts: Alert[];
  /** Morning brief */
  brief: MarketBrief | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Individual loading states */
  loadingStates: {
    portfolios: boolean;
    alerts: boolean;
    brief: boolean;
    health: boolean;
  };
  /** Data freshness information */
  freshness: DataFreshness;
  /** Refresh all data */
  refetch: () => void;
}

/**
 * Mock data generators for development
 */
function generateMockPerformanceHistory(): PerformanceDataPoint[] {
  const data: PerformanceDataPoint[] = [];
  const now = new Date();
  let portfolioValue = 0;
  let benchmarkValue = 0;

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate random daily returns
    portfolioValue += (Math.random() - 0.48) * 0.5;
    benchmarkValue += (Math.random() - 0.48) * 0.4;

    data.push({
      date: date.toISOString().split("T")[0] ?? "",
      value: portfolioValue,
      benchmark: benchmarkValue,
    });
  }

  return data;
}

function generateMockAllocations(): SectorAllocation[] {
  return [
    { sector: "Technology", value: 450000, weight: 0.35, holdings_count: 12 },
    { sector: "Healthcare", value: 250000, weight: 0.19, holdings_count: 8 },
    { sector: "Financials", value: 200000, weight: 0.15, holdings_count: 6 },
    { sector: "Consumer", value: 180000, weight: 0.14, holdings_count: 5 },
    { sector: "Energy", value: 120000, weight: 0.09, holdings_count: 4 },
    { sector: "Other", value: 100000, weight: 0.08, holdings_count: 3 },
  ];
}

function generateMockTopHoldings(): TopHolding[] {
  return [
    { id: "1", name: "Apple Inc", ticker: "AAPL", value: 125000, weight: 0.097, change: 0.0245 },
    { id: "2", name: "Microsoft Corp", ticker: "MSFT", value: 98000, weight: 0.076, change: 0.0156 },
    { id: "3", name: "Amazon.com Inc", ticker: "AMZN", value: 87000, weight: 0.067, change: -0.0089 },
    { id: "4", name: "NVIDIA Corp", ticker: "NVDA", value: 76000, weight: 0.059, change: 0.0312 },
    { id: "5", name: "Alphabet Inc", ticker: "GOOGL", value: 65000, weight: 0.05, change: 0.0078 },
  ];
}

/**
 * Hook to fetch and aggregate all dashboard data
 */
export function useDashboardData(): DashboardData {
  // Track last successful update and refresh state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Fetch portfolios
  const {
    data: portfoliosData,
    isLoading: portfoliosLoading,
    error: portfoliosError,
    refetch: refetchPortfolios,
    dataUpdatedAt: portfoliosUpdatedAt,
  } = usePortfolios({ status: "active" });

  // Get first portfolio ID for health check (if available)
  const firstPortfolioId = portfoliosData?.items?.[0]?.id;

  // Fetch health for first portfolio
  const {
    data: healthData,
    isLoading: healthLoading,
  } = usePortfolioHealth(firstPortfolioId ?? "", {
    enabled: !!firstPortfolioId,
  });

  // Fetch active alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts({ status: "active", page_size: 5 });

  // Fetch morning brief
  const {
    data: briefData,
    isLoading: briefLoading,
    error: briefError,
    refetch: refetchBrief,
  } = useMorningBrief();

  // Calculate summary from portfolios
  const summary = useMemo<DashboardSummary | null>(() => {
    const portfolios = portfoliosData?.items;
    if (!portfolios || portfolios.length === 0) {
      // Return mock data for development
      return {
        totalValue: 1287500,
        dayChange: 12450,
        dayChangePct: 0.0097,
        ytdReturn: 0.1234,
        benchmarkYtdReturn: 0.0987,
        healthScore: healthData?.overall_score ?? 78,
        healthStatus: healthData?.overall_status ?? "healthy",
      };
    }

    const totalValue = portfolios.reduce(
      (sum, p) => sum + (p.total_value ?? 0),
      0
    );

    // Calculate day change (mock for now since we don't have daily data)
    const dayChange = totalValue * 0.0097;
    const dayChangePct = 0.0097;

    // Calculate YTD return (average across portfolios)
    const ytdReturn =
      portfolios.reduce((sum, p) => sum + (p.ytd_return ?? 0), 0) /
      portfolios.length;

    return {
      totalValue,
      dayChange,
      dayChangePct,
      ytdReturn,
      benchmarkYtdReturn: ytdReturn * 0.8, // Mock benchmark
      healthScore: healthData?.overall_score ?? 75,
      healthStatus: healthData?.overall_status ?? "healthy",
    };
  }, [portfoliosData, healthData]);

  // Get allocations (mock for now)
  const allocations = useMemo<SectorAllocation[]>(() => {
    return generateMockAllocations();
  }, []);

  // Get top holdings (mock for now)
  const topHoldings = useMemo<TopHolding[]>(() => {
    return generateMockTopHoldings();
  }, []);

  // Get performance history (mock for now)
  const performanceHistory = useMemo<PerformanceDataPoint[]>(() => {
    return generateMockPerformanceHistory();
  }, []);

  // Map alerts to the expected format
  const activeAlerts = useMemo<Alert[]>(() => {
    return alertsData?.items?.slice(0, 5) ?? [];
  }, [alertsData]);

  // Combined loading state
  const isLoading = portfoliosLoading || alertsLoading || briefLoading;

  // Combined error state
  const error = portfoliosError || alertsError || briefError || null;

  // Track when data was last updated
  useEffect(() => {
    if (portfoliosUpdatedAt && !portfoliosLoading) {
      setLastUpdated(new Date(portfoliosUpdatedAt));
      setIsRefreshing(false);
    }
  }, [portfoliosUpdatedAt, portfoliosLoading]);

  // Check for staleness periodically
  useEffect(() => {
    if (!lastUpdated) return;

    const checkStaleness = () => {
      const now = Date.now();
      const elapsed = now - lastUpdated.getTime();
      setIsStale(elapsed > STALE_THRESHOLD_MS);
    };

    // Check immediately and then every minute
    checkStaleness();
    const interval = setInterval(checkStaleness, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Refetch all data with tracking
  const refetch = useCallback(() => {
    setIsRefreshing(true);
    refetchPortfolios();
    refetchAlerts();
    refetchBrief();
  }, [refetchPortfolios, refetchAlerts, refetchBrief]);

  // Freshness information
  const freshness: DataFreshness = useMemo(() => ({
    lastUpdated,
    isStale,
    isRefreshing,
  }), [lastUpdated, isStale, isRefreshing]);

  return {
    summary,
    allocations,
    topHoldings,
    performanceHistory,
    activeAlerts,
    brief: briefData ?? null,
    isLoading,
    error: error as Error | null,
    loadingStates: {
      portfolios: portfoliosLoading,
      alerts: alertsLoading,
      brief: briefLoading,
      health: healthLoading,
    },
    freshness,
    refetch,
  };
}
