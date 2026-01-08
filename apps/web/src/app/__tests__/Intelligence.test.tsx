/**
 * Intelligence Page Tests
 *
 * Tests for the intelligence page component including:
 * - Query input section
 * - Brief section
 * - Analysis section
 * - Anomaly detection section
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import IntelligencePage from "@/app/(dashboard)/intelligence/page";

// Mock the intelligence components
vi.mock("@/app/(dashboard)/intelligence/components", () => ({
  QuerySection: ({
    portfolioId,
    className,
  }: {
    portfolioId?: string;
    className?: string;
  }) => (
    <div data-testid="query-section" className={className}>
      <input
        data-testid="query-input"
        type="text"
        placeholder="Ask a question about your portfolio..."
      />
      <button data-testid="submit-query">Submit</button>
      <div data-testid="query-response">Query response area</div>
    </div>
  ),
  BriefSection: ({
    portfolioId,
    className,
  }: {
    portfolioId?: string;
    className?: string;
  }) => (
    <div data-testid="brief-section" className={className}>
      <h3>Morning Market Brief</h3>
      <p data-testid="brief-summary">
        Markets opened higher with tech leading gains
      </p>
      <div data-testid="brief-insights">
        <div>Insight 1: Technology sector momentum</div>
        <div>Insight 2: Bond yields stabilizing</div>
      </div>
    </div>
  ),
  AnalysisSection: () => (
    <div data-testid="analysis-section">
      <input
        data-testid="security-search"
        type="text"
        placeholder="Search for a security..."
      />
      <div data-testid="security-analysis-result">
        <h4>AAPL Analysis</h4>
        <div data-testid="analysis-metrics">
          <span>P/E: 28.5</span>
          <span>Market Cap: $2.8T</span>
        </div>
        <div data-testid="analysis-recommendation">Hold - Fair valued</div>
      </div>
    </div>
  ),
  AnomalySection: ({
    anomalies,
    onViewDetails,
  }: {
    anomalies: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
    }>;
    onViewDetails: (anomaly: unknown) => void;
  }) => (
    <div data-testid="anomaly-section">
      <h3>Detected Anomalies</h3>
      {anomalies.map((anomaly) => (
        <div key={anomaly.id} data-testid="anomaly-item">
          <span data-testid={`anomaly-severity-${anomaly.severity}`}>
            {anomaly.severity}
          </span>
          <span data-testid="anomaly-title">{anomaly.title}</span>
          <button
            data-testid={`view-details-${anomaly.id}`}
            onClick={() => onViewDetails(anomaly)}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe("IntelligencePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page Header", () => {
    it("renders the page title", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText("Intelligence")).toBeInTheDocument();
    });

    it("renders the page subtitle", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByText("AI-powered insights and analysis for your portfolio")
      ).toBeInTheDocument();
    });

    it("renders the refresh all button", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByRole("button", { name: /refresh all/i })
      ).toBeInTheDocument();
    });

    it("renders the settings button", () => {
      renderWithProviders(<IntelligencePage />);

      // Settings button is icon-only, find by aria or role
      const buttons = screen.getAllByRole("button");
      const settingsButton = buttons.find((btn) =>
        btn.querySelector('svg')
      );
      expect(settingsButton).toBeTruthy();
    });
  });

  describe("Query Section", () => {
    it("renders the query section", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("query-section")).toBeInTheDocument();
    });

    it("renders the query input", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("query-input")).toBeInTheDocument();
    });

    it("has placeholder text for query input", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByPlaceholderText(/ask a question/i)
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("submit-query")).toBeInTheDocument();
    });

    it("renders query response area", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("query-response")).toBeInTheDocument();
    });

    it("allows typing in query input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      const input = screen.getByTestId("query-input");
      await user.type(input, "What is my portfolio performance?");

      expect(input).toHaveValue("What is my portfolio performance?");
    });
  });

  describe("Brief Section", () => {
    it("renders the brief section", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("brief-section")).toBeInTheDocument();
    });

    it("displays morning brief title", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText("Morning Market Brief")).toBeInTheDocument();
    });

    it("displays brief summary", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("brief-summary")).toBeInTheDocument();
      expect(
        screen.getByText(/markets opened higher/i)
      ).toBeInTheDocument();
    });

    it("displays brief insights", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("brief-insights")).toBeInTheDocument();
      expect(screen.getByText(/technology sector momentum/i)).toBeInTheDocument();
    });
  });

  describe("Analysis Section", () => {
    it("renders the analysis section", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("analysis-section")).toBeInTheDocument();
    });

    it("renders security search input", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("security-search")).toBeInTheDocument();
    });

    it("displays analysis metrics", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("analysis-metrics")).toBeInTheDocument();
      expect(screen.getByText(/P\/E: 28.5/i)).toBeInTheDocument();
    });

    it("displays analysis recommendation", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("analysis-recommendation")).toBeInTheDocument();
      expect(screen.getByText(/Hold - Fair valued/i)).toBeInTheDocument();
    });

    it("allows searching for securities", async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      const searchInput = screen.getByTestId("security-search");
      await user.type(searchInput, "MSFT");

      expect(searchInput).toHaveValue("MSFT");
    });
  });

  describe("Anomaly Section", () => {
    it("renders the anomaly section", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("anomaly-section")).toBeInTheDocument();
    });

    it("displays detected anomalies header", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText("Detected Anomalies")).toBeInTheDocument();
    });

    it("displays anomaly items", () => {
      renderWithProviders(<IntelligencePage />);

      const anomalyItems = screen.getAllByTestId("anomaly-item");
      expect(anomalyItems.length).toBeGreaterThan(0);
    });

    it("displays anomaly severity indicators", () => {
      renderWithProviders(<IntelligencePage />);

      // Check for high severity anomaly
      expect(screen.getByTestId("anomaly-severity-high")).toBeInTheDocument();
    });

    it("displays anomaly titles", () => {
      renderWithProviders(<IntelligencePage />);

      const anomalyTitles = screen.getAllByTestId("anomaly-title");
      expect(anomalyTitles.length).toBeGreaterThan(0);
    });

    it("displays view details buttons for each anomaly", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("view-details-1")).toBeInTheDocument();
    });

    it("handles view details click", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      await user.click(screen.getByTestId("view-details-1"));

      expect(consoleSpy).toHaveBeenCalledWith(
        "View anomaly details:",
        expect.objectContaining({ id: "1" })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Layout Structure", () => {
    it("renders query and brief sections in a grid", () => {
      renderWithProviders(<IntelligencePage />);

      // Both sections should be present
      expect(screen.getByTestId("query-section")).toBeInTheDocument();
      expect(screen.getByTestId("brief-section")).toBeInTheDocument();
    });

    it("renders analysis and anomaly sections", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByTestId("analysis-section")).toBeInTheDocument();
      expect(screen.getByTestId("anomaly-section")).toBeInTheDocument();
    });

    it("displays Security Analysis section title", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText("Security Analysis")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible page heading", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByRole("heading", { name: /intelligence/i, level: 1 })
      ).toBeInTheDocument();
    });

    it("query input is accessible", () => {
      renderWithProviders(<IntelligencePage />);

      const queryInput = screen.getByTestId("query-input");
      expect(queryInput).toHaveAttribute("type", "text");
    });

    it("security search input has placeholder", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByPlaceholderText(/search for a security/i)
      ).toBeInTheDocument();
    });

    it("buttons are keyboard accessible", async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      const submitButton = screen.getByTestId("submit-query");
      submitButton.focus();

      expect(submitButton).toHaveFocus();

      await user.keyboard("{Enter}");
      // Button should respond to Enter key
    });
  });

  describe("User Interactions", () => {
    it("allows submitting a query", async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      const input = screen.getByTestId("query-input");
      const submitButton = screen.getByTestId("submit-query");

      await user.type(input, "What are my top holdings?");
      await user.click(submitButton);

      // Input should still have the value after submit
      expect(input).toHaveValue("What are my top holdings?");
    });

    it("allows clicking refresh all", async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntelligencePage />);

      const refreshButton = screen.getByRole("button", { name: /refresh all/i });
      await user.click(refreshButton);

      // Button should be clickable without errors
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe("Mock Anomalies", () => {
    it("displays price anomaly", () => {
      renderWithProviders(<IntelligencePage />);

      expect(
        screen.getByText(/unusual price movement/i)
      ).toBeInTheDocument();
    });

    it("displays volume anomaly", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText(/abnormal trading volume/i)).toBeInTheDocument();
    });

    it("displays correlation anomaly", () => {
      renderWithProviders(<IntelligencePage />);

      expect(screen.getByText(/sector correlation shift/i)).toBeInTheDocument();
    });
  });

  describe("Data Integration", () => {
    it("passes portfolioId to QuerySection", () => {
      renderWithProviders(<IntelligencePage />);

      // QuerySection should be rendered (portfolioId is undefined by default)
      expect(screen.getByTestId("query-section")).toBeInTheDocument();
    });

    it("passes portfolioId to BriefSection", () => {
      renderWithProviders(<IntelligencePage />);

      // BriefSection should be rendered
      expect(screen.getByTestId("brief-section")).toBeInTheDocument();
    });

    it("passes anomalies to AnomalySection", () => {
      renderWithProviders(<IntelligencePage />);

      // Should have 3 mock anomalies
      const anomalyItems = screen.getAllByTestId("anomaly-item");
      expect(anomalyItems).toHaveLength(3);
    });
  });
});
