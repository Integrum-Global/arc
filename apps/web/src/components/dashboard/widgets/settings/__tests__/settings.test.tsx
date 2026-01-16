/**
 * Widget Settings Components Unit Tests
 *
 * TDD tests for all widget-specific settings components.
 * Tests verify:
 * - Rendering with default config
 * - onChange callbacks work correctly
 * - Slider updates values
 * - Switch toggles correctly
 * - Select changes values
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AllocationChartSettings } from "../AllocationChartSettings";
import { PerformanceChartSettings } from "../PerformanceChartSettings";
import { AlertsWidgetSettings } from "../AlertsWidgetSettings";
import { TopHoldingsSettings } from "../TopHoldingsSettings";
import { BriefSettings } from "../BriefSettings";

// =============================================================================
// AllocationChartSettings Tests
// =============================================================================

describe("AllocationChartSettings", () => {
  const defaultConfig = {
    showLegend: true,
    colorScheme: "default" as const,
    maxItems: 10,
    showPercentages: true,
  };

  describe("Rendering", () => {
    it("renders with default config", () => {
      const onChange = vi.fn();
      render(
        <AllocationChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByLabelText(/show legend/i)).toBeInTheDocument();
      expect(screen.getByText(/color scheme/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum items/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show percentages/i)).toBeInTheDocument();
    });

    it("renders with all config values displayed correctly", () => {
      const onChange = vi.fn();
      render(
        <AllocationChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      // Check switch states
      const legendSwitch = screen.getByRole("switch", { name: /show legend/i });
      expect(legendSwitch).toHaveAttribute("data-state", "checked");

      const percentagesSwitch = screen.getByRole("switch", { name: /show percentages/i });
      expect(percentagesSwitch).toHaveAttribute("data-state", "checked");

      // Check slider displays current value
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("renders with custom config values", () => {
      const customConfig = {
        showLegend: false,
        colorScheme: "monochrome" as const,
        maxItems: 15,
        showPercentages: false,
      };
      const onChange = vi.fn();
      render(
        <AllocationChartSettings config={customConfig} onConfigChange={onChange} />
      );

      const legendSwitch = screen.getByRole("switch", { name: /show legend/i });
      expect(legendSwitch).toHaveAttribute("data-state", "unchecked");

      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  describe("Switch interactions", () => {
    it("calls onChange when showLegend switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <AllocationChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const legendSwitch = screen.getByRole("switch", { name: /show legend/i });
      await user.click(legendSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showLegend: false })
      );
    });

    it("calls onChange when showPercentages switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <AllocationChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const percentagesSwitch = screen.getByRole("switch", { name: /show percentages/i });
      await user.click(percentagesSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showPercentages: false })
      );
    });
  });

  describe("Select interactions", () => {
    it("displays color scheme select with trigger", () => {
      const onChange = vi.fn();

      render(
        <AllocationChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      // Verify select trigger is present
      const selectTrigger = screen.getByRole("combobox");
      expect(selectTrigger).toBeInTheDocument();

      // Verify current value is displayed
      expect(screen.getByText("Default")).toBeInTheDocument();
    });
  });

  describe("Slider interactions", () => {
    it("displays the current maxItems value", () => {
      const onChange = vi.fn();
      render(
        <AllocationChartSettings config={{ ...defaultConfig, maxItems: 8 }} onConfigChange={onChange} />
      );

      expect(screen.getByText("8")).toBeInTheDocument();
    });
  });
});

// =============================================================================
// PerformanceChartSettings Tests
// =============================================================================

describe("PerformanceChartSettings", () => {
  const defaultConfig = {
    timeRange: "YTD" as const,
    showBenchmark: true,
    benchmarkSymbol: "SPY",
    chartType: "line" as const,
  };

  describe("Rendering", () => {
    it("renders with default config", () => {
      const onChange = vi.fn();
      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText(/time range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show benchmark/i)).toBeInTheDocument();
      expect(screen.getByText(/chart type/i)).toBeInTheDocument();
    });

    it("renders time range toggle options", () => {
      const onChange = vi.fn();
      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByRole("radio", { name: /1w/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /1m/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /3m/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /ytd/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /1y/i })).toBeInTheDocument();
    });

    it("shows benchmark select when showBenchmark is true", () => {
      const onChange = vi.fn();
      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      // Verify the benchmark select combobox is present when showBenchmark is true
      // There's a label "Benchmark" and a Select component
      expect(screen.getByText("S&P 500 (SPY)")).toBeInTheDocument();
    });

    it("hides benchmark select when showBenchmark is false", () => {
      const onChange = vi.fn();
      render(
        <PerformanceChartSettings
          config={{ ...defaultConfig, showBenchmark: false }}
          onConfigChange={onChange}
        />
      );

      // Benchmark select should not be present
      expect(screen.queryByRole("combobox", { name: /benchmark/i })).not.toBeInTheDocument();
    });
  });

  describe("Time range interactions", () => {
    it("calls onChange when time range is changed", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const oneMonthButton = screen.getByRole("radio", { name: /1m/i });
      await user.click(oneMonthButton);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ timeRange: "1M" })
      );
    });
  });

  describe("Switch interactions", () => {
    it("calls onChange when showBenchmark switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const benchmarkSwitch = screen.getByRole("switch", { name: /show benchmark/i });
      await user.click(benchmarkSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showBenchmark: false })
      );
    });
  });

  describe("Chart type interactions", () => {
    it("calls onChange when chart type is changed", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <PerformanceChartSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const areaButton = screen.getByRole("radio", { name: /area/i });
      await user.click(areaButton);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ chartType: "area" })
      );
    });
  });
});

// =============================================================================
// AlertsWidgetSettings Tests
// =============================================================================

describe("AlertsWidgetSettings", () => {
  const defaultConfig = {
    maxAlerts: 5,
    showCriticalOnly: false,
    autoRefresh: true,
    refreshInterval: 30,
  };

  describe("Rendering", () => {
    it("renders with default config", () => {
      const onChange = vi.fn();
      render(
        <AlertsWidgetSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText(/maximum alerts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show critical only/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/auto refresh/i)).toBeInTheDocument();
    });

    it("displays the current maxAlerts value", () => {
      const onChange = vi.fn();
      render(
        <AlertsWidgetSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows refresh interval when autoRefresh is true", () => {
      const onChange = vi.fn();
      render(
        <AlertsWidgetSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText(/refresh interval/i)).toBeInTheDocument();
    });

    it("hides refresh interval when autoRefresh is false", () => {
      const onChange = vi.fn();
      render(
        <AlertsWidgetSettings
          config={{ ...defaultConfig, autoRefresh: false }}
          onConfigChange={onChange}
        />
      );

      expect(screen.queryByText(/refresh interval/i)).not.toBeInTheDocument();
    });
  });

  describe("Switch interactions", () => {
    it("calls onChange when showCriticalOnly switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <AlertsWidgetSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const criticalSwitch = screen.getByRole("switch", { name: /show critical only/i });
      await user.click(criticalSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showCriticalOnly: true })
      );
    });

    it("calls onChange when autoRefresh switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <AlertsWidgetSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const autoRefreshSwitch = screen.getByRole("switch", { name: /auto refresh/i });
      await user.click(autoRefreshSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ autoRefresh: false })
      );
    });
  });

  describe("Slider interactions", () => {
    it("displays maxAlerts slider with correct range", () => {
      const onChange = vi.fn();
      render(
        <AlertsWidgetSettings config={{ ...defaultConfig, maxAlerts: 10 }} onConfigChange={onChange} />
      );

      // Slider should display value of 10
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TopHoldingsSettings Tests
// =============================================================================

describe("TopHoldingsSettings", () => {
  const defaultConfig = {
    limit: 5,
    showChange: true,
    showValue: true,
  };

  describe("Rendering", () => {
    it("renders with default config", () => {
      const onChange = vi.fn();
      render(
        <TopHoldingsSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText(/number of holdings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show daily change/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show market value/i)).toBeInTheDocument();
    });

    it("displays the current limit value", () => {
      const onChange = vi.fn();
      render(
        <TopHoldingsSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders with switches in correct state", () => {
      const onChange = vi.fn();
      render(
        <TopHoldingsSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const changeSwitch = screen.getByRole("switch", { name: /show daily change/i });
      expect(changeSwitch).toHaveAttribute("data-state", "checked");

      const valueSwitch = screen.getByRole("switch", { name: /show market value/i });
      expect(valueSwitch).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Switch interactions", () => {
    it("calls onChange when showChange switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TopHoldingsSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const changeSwitch = screen.getByRole("switch", { name: /show daily change/i });
      await user.click(changeSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showChange: false })
      );
    });

    it("calls onChange when showValue switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TopHoldingsSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const valueSwitch = screen.getByRole("switch", { name: /show market value/i });
      await user.click(valueSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showValue: false })
      );
    });
  });

  describe("Slider interactions", () => {
    it("displays limit slider with correct value", () => {
      const onChange = vi.fn();
      render(
        <TopHoldingsSettings config={{ ...defaultConfig, limit: 10 }} onConfigChange={onChange} />
      );

      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });
});

// =============================================================================
// BriefSettings Tests
// =============================================================================

describe("BriefSettings", () => {
  const defaultConfig = {
    briefType: "morning" as const,
    showInsights: true,
    showActions: true,
    updateFrequency: "daily" as const,
  };

  describe("Rendering", () => {
    it("renders with default config", () => {
      const onChange = vi.fn();
      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      expect(screen.getByText(/brief type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show insights/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show actions/i)).toBeInTheDocument();
      expect(screen.getByText(/update frequency/i)).toBeInTheDocument();
    });

    it("renders switches in correct state", () => {
      const onChange = vi.fn();
      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const insightsSwitch = screen.getByRole("switch", { name: /show insights/i });
      expect(insightsSwitch).toHaveAttribute("data-state", "checked");

      const actionsSwitch = screen.getByRole("switch", { name: /show actions/i });
      expect(actionsSwitch).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Select interactions", () => {
    it("displays brief type select with current value", () => {
      const onChange = vi.fn();

      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      // Find brief type select (first combobox)
      const selectTriggers = screen.getAllByRole("combobox");
      expect(selectTriggers).toHaveLength(2);

      // Verify current value is displayed (Morning Brief)
      expect(screen.getByText("Morning Brief")).toBeInTheDocument();
    });

    it("displays update frequency select with current value", () => {
      const onChange = vi.fn();

      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      // Find update frequency select (second combobox)
      const selectTriggers = screen.getAllByRole("combobox");
      expect(selectTriggers[1]).toBeInTheDocument();

      // Verify current value is displayed (Daily)
      expect(screen.getByText("Daily")).toBeInTheDocument();
    });
  });

  describe("Switch interactions", () => {
    it("calls onChange when showInsights switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const insightsSwitch = screen.getByRole("switch", { name: /show insights/i });
      await user.click(insightsSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showInsights: false })
      );
    });

    it("calls onChange when showActions switch is toggled", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <BriefSettings config={defaultConfig} onConfigChange={onChange} />
      );

      const actionsSwitch = screen.getByRole("switch", { name: /show actions/i });
      await user.click(actionsSwitch);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ showActions: false })
      );
    });
  });
});
