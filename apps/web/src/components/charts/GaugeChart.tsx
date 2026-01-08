"use client";

/**
 * GaugeChart Component
 *
 * A semi-circular gauge chart for displaying single values with thresholds.
 * Ideal for showing scores, ratios, or progress towards targets.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { CHART_COLORS, getThresholdColor, formatChartValue } from "@/lib/chartUtils";

/**
 * Threshold configuration for gauge zones
 */
export interface GaugeThreshold {
  /** Value at which this threshold starts */
  value: number;
  /** Color for this zone */
  color: string;
  /** Optional label for the zone */
  label?: string;
}

/**
 * GaugeChart props
 */
export interface GaugeChartProps {
  /** Current value to display */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Threshold zones (optional - will use default good/warning/critical if not provided) */
  thresholds?: GaugeThreshold[];
  /** Simple threshold values (alternative to full thresholds config) */
  simpleThresholds?: {
    warning: number;
    critical: number;
    isLowerBetter?: boolean;
  };
  /** Label below the value */
  label?: string;
  /** Value format type */
  format?: "currency" | "percent" | "number" | "ratio";
  /** Currency for formatting */
  currency?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Size of the gauge (width) */
  size?: number;
  /** Stroke width of the gauge arc */
  strokeWidth?: number;
  /** Show value in center */
  showValue?: boolean;
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Show threshold markers */
  showThresholdMarkers?: boolean;
  /** Additional class name */
  className?: string;
  /** Animation duration (ms) */
  animationDuration?: number;
}

/**
 * Convert value to angle (0-180 degrees for semi-circle)
 */
function valueToAngle(value: number, min: number, max: number): number {
  const normalized = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, normalized));
  return clamped * 180;
}

/**
 * Convert polar coordinates to cartesian
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = ((angleDegrees - 180) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians),
  };
}

/**
 * Create SVG arc path
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

/**
 * Default thresholds based on simple threshold config
 */
function getDefaultThresholds(
  simpleThresholds: { warning: number; critical: number; isLowerBetter?: boolean },
  min: number
): GaugeThreshold[] {
  const { warning, critical, isLowerBetter } = simpleThresholds;

  if (isLowerBetter) {
    return [
      { value: min, color: CHART_COLORS.thresholds.good, label: "Good" },
      { value: warning, color: CHART_COLORS.thresholds.warning, label: "Warning" },
      { value: critical, color: CHART_COLORS.thresholds.critical, label: "Critical" },
    ];
  }

  return [
    { value: min, color: CHART_COLORS.thresholds.critical, label: "Critical" },
    { value: critical, color: CHART_COLORS.thresholds.warning, label: "Warning" },
    { value: warning, color: CHART_COLORS.thresholds.good, label: "Good" },
  ];
}

/**
 * GaugeChart component for displaying single values with threshold zones
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  thresholds,
  simpleThresholds,
  label,
  format = "number",
  currency = "USD",
  decimals = 1,
  size = 200,
  strokeWidth = 20,
  showValue = true,
  showMinMax = true,
  showThresholdMarkers = false,
  className,
  animationDuration = 500,
}: GaugeChartProps) {
  // Calculate dimensions
  const cx = size / 2;
  const cy = size / 2 + strokeWidth / 2;
  const radius = (size - strokeWidth) / 2;
  const height = size / 2 + strokeWidth + 40; // Extra space for labels

  // Get thresholds configuration
  const zones = React.useMemo(() => {
    if (thresholds && thresholds.length > 0) {
      return thresholds;
    }
    if (simpleThresholds) {
      return getDefaultThresholds(simpleThresholds, min);
    }
    // Default: single color gauge
    return [{ value: min, color: CHART_COLORS.performance.portfolio }];
  }, [thresholds, simpleThresholds, min, max]);

  // Calculate value angle with animation
  const [animatedValue, setAnimatedValue] = React.useState(min);
  const animatedValueRef = React.useRef(min);

  React.useEffect(() => {
    if (animationDuration <= 0) {
      setAnimatedValue(value);
      animatedValueRef.current = value;
      return;
    }

    const startTime = Date.now();
    const startValue = animatedValueRef.current;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setAnimatedValue(current);
      animatedValueRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animationDuration]);

  const valueAngle = valueToAngle(animatedValue, min, max);

  // Get current zone color
  const currentColor = React.useMemo(() => {
    if (simpleThresholds) {
      return getThresholdColor(
        value,
        simpleThresholds,
        false,
        simpleThresholds.isLowerBetter
      );
    }

    // Find the zone for current value
    const firstZone = zones[0];
    if (!firstZone) {
      return "#3b82f6"; // fallback color
    }
    let color = firstZone.color;
    for (const zone of zones) {
      if (value >= zone.value) {
        color = zone.color;
      }
    }
    return color;
  }, [value, zones, simpleThresholds]);

  // Format the display value
  const displayValue = formatChartValue(value, format, {
    currency,
    decimals,
  });

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg width={size} height={height} className="overflow-visible">
        {/* Background track */}
        <path
          d={describeArc(cx, cy, radius, 0, 180)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Threshold zone arcs */}
        {zones.length > 1 &&
          zones.map((zone, index) => {
            const nextZone = zones[index + 1];
            const startAngle = valueToAngle(zone.value, min, max);
            const endAngle = nextZone
              ? valueToAngle(nextZone.value, min, max)
              : 180;

            if (startAngle >= endAngle) return null;

            return (
              <path
                key={index}
                d={describeArc(cx, cy, radius, startAngle, endAngle)}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                opacity={0.3}
              />
            );
          })}

        {/* Value arc */}
        {valueAngle > 0 && (
          <path
            d={describeArc(cx, cy, radius, 0, valueAngle)}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Needle/indicator */}
        {valueAngle > 0 && (
          <circle
            cx={polarToCartesian(cx, cy, radius, valueAngle).x}
            cy={polarToCartesian(cx, cy, radius, valueAngle).y}
            r={strokeWidth / 2 + 2}
            fill={currentColor}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        )}

        {/* Threshold markers */}
        {showThresholdMarkers &&
          zones.slice(1).map((zone, index) => {
            const angle = valueToAngle(zone.value, min, max);
            const pos = polarToCartesian(cx, cy, radius, angle);
            return (
              <g key={`marker-${index}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={4}
                  fill={zone.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              </g>
            );
          })}

        {/* Min/Max labels */}
        {showMinMax && (
          <>
            <text
              x={cx - radius - 5}
              y={cy + 15}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {min}
            </text>
            <text
              x={cx + radius + 5}
              y={cy + 15}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {max}
            </text>
          </>
        )}

        {/* Value display */}
        {showValue && (
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="fill-foreground font-semibold"
            style={{ fontSize: size / 8, fill: currentColor }}
          >
            {displayValue}
          </text>
        )}

        {/* Label */}
        {label && (
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            className="fill-muted-foreground text-sm"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

GaugeChart.displayName = "GaugeChart";

export default GaugeChart;
