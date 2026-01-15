"use client";

/**
 * RatiosTab Component
 *
 * Displays financial ratio cards grouped by class:
 * - Liquidity: Current, Quick, Cash, OCF, Working Capital
 * - Profitability: ROE, ROA, Gross Margin, Net Margin, EBITDA Margin
 * - Leverage: Debt/Equity, Debt/EBITDA, Interest Coverage, Debt/Assets, Equity Ratio
 * - Utilization: Asset Turnover, Inventory Turnover, Receivables Turnover, Payables Turnover, Cash Conversion
 * - Valuation: P/E, P/B, P/S, EV/EBITDA, Dividend Yield
 */

import * as React from "react";
import { Section, Grid } from "@/components/layout";
import { RatioCard, type RatioClass, type TrendDirection } from "@/components/data/RatioCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatioDetailSheet } from "./RatioDetailSheet";

/**
 * Ratio definition with metadata
 */
interface RatioDefinition {
  id: string;
  name: string;
  class: RatioClass;
  suffix: string;
  decimals: number;
  thresholds?: {
    good: number;
    bad: number;
    higherIsBetter?: boolean;
  };
  description: string;
}

/**
 * Complete ratio definitions by class
 */
const RATIO_DEFINITIONS: Record<string, RatioDefinition[]> = {
  liquidity: [
    {
      id: "current_ratio",
      name: "Current Ratio",
      class: "liquidity",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 2.0, bad: 1.0, higherIsBetter: true },
      description: "Measures ability to pay short-term obligations",
    },
    {
      id: "quick_ratio",
      name: "Quick Ratio",
      class: "liquidity",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 1.5, bad: 0.8, higherIsBetter: true },
      description: "Measures immediate liquidity excluding inventory",
    },
    {
      id: "cash_ratio",
      name: "Cash Ratio",
      class: "liquidity",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 0.5, bad: 0.2, higherIsBetter: true },
      description: "Most conservative liquidity measure",
    },
    {
      id: "ocf_ratio",
      name: "OCF Ratio",
      class: "liquidity",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 1.0, bad: 0.5, higherIsBetter: true },
      description: "Operating cash flow to current liabilities",
    },
    {
      id: "working_capital",
      name: "Working Capital",
      class: "liquidity",
      suffix: "M",
      decimals: 1,
      description: "Current assets minus current liabilities",
    },
  ],
  profitability: [
    {
      id: "roe",
      name: "ROE",
      class: "profitability",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 15, bad: 5, higherIsBetter: true },
      description: "Return on equity",
    },
    {
      id: "roa",
      name: "ROA",
      class: "profitability",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 10, bad: 3, higherIsBetter: true },
      description: "Return on assets",
    },
    {
      id: "gross_margin",
      name: "Gross Margin",
      class: "profitability",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 40, bad: 20, higherIsBetter: true },
      description: "Gross profit as percentage of revenue",
    },
    {
      id: "net_margin",
      name: "Net Margin",
      class: "profitability",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 15, bad: 5, higherIsBetter: true },
      description: "Net income as percentage of revenue",
    },
    {
      id: "ebitda_margin",
      name: "EBITDA Margin",
      class: "profitability",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 25, bad: 10, higherIsBetter: true },
      description: "EBITDA as percentage of revenue",
    },
  ],
  leverage: [
    {
      id: "debt_equity",
      name: "Debt/Equity",
      class: "leverage",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 0.5, bad: 2.0, higherIsBetter: false },
      description: "Total debt to shareholder equity",
    },
    {
      id: "debt_ebitda",
      name: "Debt/EBITDA",
      class: "leverage",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 2.0, bad: 4.0, higherIsBetter: false },
      description: "Total debt to EBITDA",
    },
    {
      id: "interest_coverage",
      name: "Interest Coverage",
      class: "leverage",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 5.0, bad: 2.0, higherIsBetter: true },
      description: "EBIT to interest expense",
    },
    {
      id: "debt_assets",
      name: "Debt/Assets",
      class: "leverage",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 30, bad: 60, higherIsBetter: false },
      description: "Total debt to total assets",
    },
    {
      id: "equity_ratio",
      name: "Equity Ratio",
      class: "leverage",
      suffix: "%",
      decimals: 1,
      thresholds: { good: 50, bad: 25, higherIsBetter: true },
      description: "Shareholder equity to total assets",
    },
  ],
  efficiency: [
    {
      id: "asset_turnover",
      name: "Asset Turnover",
      class: "efficiency",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 1.0, bad: 0.5, higherIsBetter: true },
      description: "Revenue generated per dollar of assets",
    },
    {
      id: "inventory_turnover",
      name: "Inventory Turnover",
      class: "efficiency",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 8.0, bad: 4.0, higherIsBetter: true },
      description: "How often inventory is sold and replaced",
    },
    {
      id: "receivables_turnover",
      name: "Receivables Turnover",
      class: "efficiency",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 10.0, bad: 5.0, higherIsBetter: true },
      description: "How efficiently receivables are collected",
    },
    {
      id: "payables_turnover",
      name: "Payables Turnover",
      class: "efficiency",
      suffix: "x",
      decimals: 1,
      description: "How quickly payables are paid",
    },
    {
      id: "cash_conversion",
      name: "Cash Conversion",
      class: "efficiency",
      suffix: " days",
      decimals: 0,
      thresholds: { good: 30, bad: 60, higherIsBetter: false },
      description: "Days to convert investments to cash",
    },
  ],
  valuation: [
    {
      id: "pe_ratio",
      name: "P/E Ratio",
      class: "valuation",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 15, bad: 30, higherIsBetter: false },
      description: "Price to earnings ratio",
    },
    {
      id: "pb_ratio",
      name: "P/B Ratio",
      class: "valuation",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 1.5, bad: 4.0, higherIsBetter: false },
      description: "Price to book value ratio",
    },
    {
      id: "ps_ratio",
      name: "P/S Ratio",
      class: "valuation",
      suffix: "x",
      decimals: 2,
      thresholds: { good: 2.0, bad: 5.0, higherIsBetter: false },
      description: "Price to sales ratio",
    },
    {
      id: "ev_ebitda",
      name: "EV/EBITDA",
      class: "valuation",
      suffix: "x",
      decimals: 1,
      thresholds: { good: 10, bad: 20, higherIsBetter: false },
      description: "Enterprise value to EBITDA",
    },
    {
      id: "dividend_yield",
      name: "Dividend Yield",
      class: "valuation",
      suffix: "%",
      decimals: 2,
      thresholds: { good: 3.0, bad: 0.5, higherIsBetter: true },
      description: "Annual dividend as percentage of price",
    },
  ],
};

/**
 * Mock ratio data for demo purposes
 */
interface RatioData {
  value: number;
  trend: TrendDirection;
  peerPercentile: number;
  sparklineData: { value: number }[];
}

function generateMockRatioData(def: RatioDefinition): RatioData {
  // Generate mock values based on the ratio type
  let baseValue: number;

  switch (def.id) {
    case "current_ratio":
      baseValue = 1.5 + Math.random() * 1.0;
      break;
    case "quick_ratio":
      baseValue = 1.0 + Math.random() * 0.8;
      break;
    case "cash_ratio":
      baseValue = 0.3 + Math.random() * 0.4;
      break;
    case "ocf_ratio":
      baseValue = 0.6 + Math.random() * 0.6;
      break;
    case "working_capital":
      baseValue = 50 + Math.random() * 100;
      break;
    case "roe":
      baseValue = 8 + Math.random() * 15;
      break;
    case "roa":
      baseValue = 4 + Math.random() * 8;
      break;
    case "gross_margin":
      baseValue = 25 + Math.random() * 25;
      break;
    case "net_margin":
      baseValue = 5 + Math.random() * 15;
      break;
    case "ebitda_margin":
      baseValue = 12 + Math.random() * 18;
      break;
    case "debt_equity":
      baseValue = 0.3 + Math.random() * 1.5;
      break;
    case "debt_ebitda":
      baseValue = 1.5 + Math.random() * 3;
      break;
    case "interest_coverage":
      baseValue = 3 + Math.random() * 6;
      break;
    case "debt_assets":
      baseValue = 25 + Math.random() * 35;
      break;
    case "equity_ratio":
      baseValue = 30 + Math.random() * 30;
      break;
    case "asset_turnover":
      baseValue = 0.5 + Math.random() * 0.8;
      break;
    case "inventory_turnover":
      baseValue = 4 + Math.random() * 8;
      break;
    case "receivables_turnover":
      baseValue = 5 + Math.random() * 8;
      break;
    case "payables_turnover":
      baseValue = 6 + Math.random() * 6;
      break;
    case "cash_conversion":
      baseValue = 25 + Math.random() * 40;
      break;
    case "pe_ratio":
      baseValue = 12 + Math.random() * 18;
      break;
    case "pb_ratio":
      baseValue = 1.0 + Math.random() * 3;
      break;
    case "ps_ratio":
      baseValue = 1.5 + Math.random() * 4;
      break;
    case "ev_ebitda":
      baseValue = 8 + Math.random() * 12;
      break;
    case "dividend_yield":
      baseValue = 1 + Math.random() * 4;
      break;
    default:
      baseValue = Math.random() * 10;
  }

  const trends: TrendDirection[] = ["up", "down", "neutral"];
  const trend = trends[Math.floor(Math.random() * 3)] as TrendDirection;

  const sparklineData = Array.from({ length: 8 }, (_, i) => ({
    value: baseValue * (0.85 + Math.random() * 0.3),
  }));

  return {
    value: baseValue,
    trend,
    peerPercentile: Math.random() * 100,
    sparklineData,
  };
}

/**
 * Class label mapping
 */
const CLASS_LABELS: Record<string, string> = {
  liquidity: "Liquidity Ratios",
  profitability: "Profitability Ratios",
  leverage: "Leverage Ratios",
  efficiency: "Utilization Ratios",
  valuation: "Valuation Ratios",
};

/**
 * Loading skeleton for the ratios tab
 */
function RatiosTabSkeleton() {
  return (
    <div className="space-y-8">
      {Object.keys(RATIO_DEFINITIONS).map((category) => (
        <Section key={category} title={CLASS_LABELS[category]}>
          <Grid cols={{ default: 1, sm: 2, lg: 3, xl: 5 }} gap="md">
            {Array.from({ length: 5 }).map((_, i) => (
              <RatioCard.Skeleton key={i} />
            ))}
          </Grid>
        </Section>
      ))}
    </div>
  );
}

/**
 * Mock securities list
 */
const MOCK_SECURITIES = [
  { id: "AAPL", name: "Apple Inc.", ticker: "AAPL" },
  { id: "MSFT", name: "Microsoft Corporation", ticker: "MSFT" },
  { id: "GOOGL", name: "Alphabet Inc.", ticker: "GOOGL" },
  { id: "AMZN", name: "Amazon.com, Inc.", ticker: "AMZN" },
  { id: "META", name: "Meta Platforms, Inc.", ticker: "META" },
  { id: "NVDA", name: "NVIDIA Corporation", ticker: "NVDA" },
  { id: "TSLA", name: "Tesla, Inc.", ticker: "TSLA" },
  { id: "BRK.B", name: "Berkshire Hathaway Inc.", ticker: "BRK.B" },
];

export function RatiosTab() {
  const [selectedSecurity, setSelectedSecurity] = React.useState("AAPL");
  const [selectedRatio, setSelectedRatio] = React.useState<RatioDefinition | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [ratioData, setRatioData] = React.useState<Record<string, RatioData>>({});

  // Get selected security info
  const selectedSecurityInfo = MOCK_SECURITIES.find(s => s.id === selectedSecurity);

  // Simulate loading data - separate initial load from updates
  React.useEffect(() => {
    // Only show full loading skeleton on initial load
    if (Object.keys(ratioData).length === 0) {
      setIsInitialLoad(true);
    } else {
      setIsUpdating(true);
    }

    const timer = setTimeout(() => {
      const data: Record<string, RatioData> = {};
      Object.values(RATIO_DEFINITIONS).flat().forEach((def) => {
        data[def.id] = generateMockRatioData(def);
      });
      setRatioData(data);
      setIsInitialLoad(false);
      setIsUpdating(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedSecurity]);

  const handleRatioClick = (ratio: RatioDefinition) => {
    setSelectedRatio(ratio);
    setIsSheetOpen(true);
  };

  // Only show skeleton on initial load, not when changing securities
  if (isInitialLoad && Object.keys(ratioData).length === 0) {
    return <RatiosTabSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Security Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">
            Security:
          </label>
          <Select value={selectedSecurity} onValueChange={setSelectedSecurity}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select security">
                {selectedSecurityInfo && (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{selectedSecurityInfo.ticker}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="truncate">{selectedSecurityInfo.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-80">
              {MOCK_SECURITIES.map((security) => (
                <SelectItem
                  key={security.id}
                  value={security.id}
                  className="py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium w-14">{security.ticker}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{security.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isUpdating && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Updating...
            </span>
          )}
        </div>

        {/* Ratio Groups */}
        {Object.entries(RATIO_DEFINITIONS).map(([category, ratios]) => (
          <Section key={category} title={CLASS_LABELS[category]}>
            <Grid cols={{ default: 1, sm: 2, lg: 3, xl: 5 }} gap="md">
              {ratios.map((ratio) => {
                const data = ratioData[ratio.id];
                return (
                  <RatioCard
                    key={ratio.id}
                    ratioName={ratio.name}
                    ratioClass={ratio.class}
                    value={data?.value ?? null}
                    trend={data?.trend}
                    peerPercentile={data?.peerPercentile}
                    thresholds={ratio.thresholds}
                    sparklineData={data?.sparklineData}
                    suffix={ratio.suffix}
                    decimals={ratio.decimals}
                    onClick={() => handleRatioClick(ratio)}
                  />
                );
              })}
            </Grid>
          </Section>
        ))}
      </div>

      {/* Detail Sheet */}
      <RatioDetailSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        ratio={selectedRatio}
        securityId={selectedSecurity}
        data={selectedRatio ? ratioData[selectedRatio.id] : undefined}
      />
    </>
  );
}

RatiosTab.displayName = "RatiosTab";
