"use client";

/**
 * Intelligence Page
 *
 * AI-powered intelligence hub with natural language queries,
 * market briefs, security analysis, and anomaly detection.
 */

import * as React from "react";
import { PageContainer, Grid, GridItem, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import {
  QuerySection,
  BriefSection,
  AnalysisSection,
  AnomalySection,
  type Anomaly,
} from "./components";

/**
 * Mock anomalies for demonstration
 * In production, these would come from an API
 */
const mockAnomalies: Anomaly[] = [
  {
    id: "1",
    type: "price",
    severity: "high",
    title: "Unusual price movement detected",
    description:
      "AAPL experienced a 5.2% price drop in the last hour, which is 3 standard deviations from the expected range.",
    securitySymbol: "AAPL",
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    value: 178.5,
    expectedValue: 188.3,
    deviation: -5.2,
  },
  {
    id: "2",
    type: "volume",
    severity: "medium",
    title: "Abnormal trading volume",
    description:
      "Trading volume for MSFT is 4x higher than the 30-day average, indicating increased market activity.",
    securitySymbol: "MSFT",
    detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    value: 45000000,
    expectedValue: 11250000,
    deviation: 300,
  },
  {
    id: "3",
    type: "correlation",
    severity: "low",
    title: "Sector correlation shift",
    description:
      "Technology sector showing decreased correlation with broader market. May indicate sector-specific factors.",
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    deviation: -15.3,
  },
];

export default function IntelligencePage() {
  const [selectedPortfolioId] = React.useState<string | undefined>(undefined);
  const [anomalies] = React.useState<Anomaly[]>(mockAnomalies);

  const handleViewAnomalyDetails = (anomaly: Anomaly) => {
    // In production, this would open a detail modal or navigate to details
    console.log("View anomaly details:", anomaly);
  };

  return (
    <PageContainer
      title="Intelligence"
      subtitle="AI-powered insights and analysis for your portfolio"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Content - Query and Brief */}
        <Grid cols={{ default: 1, lg: 2 }} gap="lg">
          <GridItem>
            <QuerySection
              portfolioId={selectedPortfolioId}
              className="h-full min-h-[500px]"
            />
          </GridItem>
          <GridItem>
            <BriefSection
              portfolioId={selectedPortfolioId}
              className="h-full min-h-[500px]"
            />
          </GridItem>
        </Grid>

        {/* Security Analysis Section */}
        <Section title="Security Analysis" subtitle="AI-powered analysis for individual securities">
          <Grid cols={{ default: 1, xl: 2 }} gap="lg">
            <GridItem>
              <AnalysisSection />
            </GridItem>
            <GridItem>
              <AnomalySection
                anomalies={anomalies}
                onViewDetails={handleViewAnomalyDetails}
              />
            </GridItem>
          </Grid>
        </Section>
      </div>
    </PageContainer>
  );
}
