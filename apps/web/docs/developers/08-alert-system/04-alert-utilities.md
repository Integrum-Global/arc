# Alert Utilities

## Purpose

The alert system provides two core utilities:

1. **calculateAlertPriority** - Determines alert tier, score, and display channels
2. **soundManager** - Manages alert sound notifications

---

## calculateAlertPriority

### Purpose

Calculates alert priority tier (1/2/3), urgency score (0-100), and display channels based on severity, age, impact, portfolio value, and acknowledgement status.

### Location

```
src/lib/alertPriority.ts
```

### API Reference

```typescript
function calculateAlertPriority(input: AlertPriorityInput): AlertPriorityOutput

interface AlertPriorityInput {
  /** Alert severity level */
  severity: "critical" | "high" | "medium" | "low";

  /** Type of alert (e.g., margin_call, threshold_breach) */
  alertType: string;

  /** When the alert was created */
  createdAt: Date;

  /** Total portfolio value in dollars */
  portfolioValue: number;

  /** Percentage impact on portfolio (0-100) */
  impactPercentage?: number;

  /** Whether the alert has been acknowledged */
  isAcknowledged: boolean;
}

interface AlertPriorityOutput {
  /** Alert tier: 1 (critical), 2 (actionable), 3 (informational) */
  tier: 1 | 2 | 3;

  /** Priority score (0-100, higher = more urgent) */
  score: number;

  /** Display channels for this alert */
  displayChannels: ("banner" | "toast" | "sound" | "badge" | "widget" | "center")[];
}
```

### Algorithm

```
Score = Base Severity
      - Time Decay
      + Impact Boost
      + Portfolio Value Bonus
      - Acknowledgement Penalty
```

**1. Base Severity:**

| Severity | Base Score |
|----------|------------|
| critical | 90 |
| high | 70 |
| medium | 50 |
| low | 20 |

**2. Time Decay:** `-0.5 points/hour` (max `-20`)

```typescript
const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
const timeDecay = Math.min(hoursOld * 0.5, 20);
score -= timeDecay;

// Examples:
// 1 hour old:  -0.5 points
// 10 hours old: -5.0 points
// 40+ hours old: -20 points (capped)
```

**3. Impact Boost:** `+2 points per %` (max `+15`)

```typescript
if (impactPercentage > 0) {
  const impactBoost = Math.min(impactPercentage * 2, 15);
  score += impactBoost;
}

// Examples:
// 1% impact:  +2 points
// 5% impact:  +10 points
// 10% impact: +15 points (capped)
```

**4. Portfolio Value Bonus:** `+5 for portfolios >$10M`

```typescript
if (portfolioValue > 10000000) {
  score += 5;
}
```

**5. Acknowledgement Penalty:** `-30 points`

```typescript
if (isAcknowledged) {
  score -= 30;
}
```

**6. Tier Mapping:**

| Score | Tier | Display Channels |
|-------|------|------------------|
| ≥80 | 1 (critical) | banner, toast, sound, badge, widget, center |
| ≥40 | 2 (actionable) | badge, widget, center |
| <40 | 3 (informational) | center |

### Usage Examples

**Example 1: Fresh Critical Alert**

```typescript
import { calculateAlertPriority } from "@/lib/alertPriority";

const result = calculateAlertPriority({
  severity: "critical",
  alertType: "margin_call",
  createdAt: new Date(), // Now
  portfolioValue: 15000000, // $15M
  impactPercentage: 8, // 8% impact
  isAcknowledged: false,
});

console.log(result);
// {
//   tier: 1,
//   score: 100, // 90 + 0 (time) + 15 (impact capped) + 5 (large portfolio) - 0 (not ack) = 110 → clamped to 100
//   displayChannels: ["banner", "toast", "sound", "badge", "widget", "center"]
// }
```

**Example 2: Old High Alert**

```typescript
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); // 48 hours ago

const result = calculateAlertPriority({
  severity: "high",
  alertType: "threshold_breach",
  createdAt: twoDaysAgo,
  portfolioValue: 5000000, // $5M
  impactPercentage: 3, // 3% impact
  isAcknowledged: false,
});

console.log(result);
// {
//   tier: 2,
//   score: 62, // 70 + (-20) (time decay capped) + 6 (impact) + 0 (small portfolio) - 0 (not ack) = 56
//   displayChannels: ["badge", "widget", "center"]
// }
```

**Example 3: Acknowledged Medium Alert**

```typescript
const result = calculateAlertPriority({
  severity: "medium",
  alertType: "health_issue",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  portfolioValue: 2000000, // $2M
  impactPercentage: undefined, // No impact percentage
  isAcknowledged: true, // Already acknowledged
});

console.log(result);
// {
//   tier: 3,
//   score: 17.5, // 50 + (-2.5) (time) + 0 (no impact) + 0 (small portfolio) - 30 (acknowledged) = 17.5
//   displayChannels: ["center"]
// }
```

**Example 4: Low Priority Info Alert**

```typescript
const result = calculateAlertPriority({
  severity: "low",
  alertType: "price_change",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 hours ago
  portfolioValue: 1000000, // $1M
  impactPercentage: 0.5, // 0.5% impact
  isAcknowledged: false,
});

console.log(result);
// {
//   tier: 3,
//   score: 16, // 20 + (-5) (time) + 1 (impact) + 0 (small portfolio) - 0 (not ack) = 16
//   displayChannels: ["center"]
// }
```

### Integration with Components

```typescript
import { calculateAlertPriority } from "@/lib/alertPriority";

function AlertPriorityBadge({ alert }: { alert: Alert }) {
  const priority = calculateAlertPriority({
    severity: alert.severity,
    alertType: alert.alert_type,
    createdAt: new Date(alert.created_at),
    portfolioValue: 5000000, // From context
    impactPercentage: undefined, // Calculate if available
    isAcknowledged: alert.status === "acknowledged",
  });

  return (
    <div>
      <span>Tier {priority.tier}</span>
      <span>Score: {priority.score.toFixed(1)}</span>
      <span>
        Channels: {priority.displayChannels.join(", ")}
      </span>
    </div>
  );
}
```

### Testing

```typescript
import { calculateAlertPriority } from "@/lib/alertPriority";
import { describe, it, expect } from "vitest";

describe("calculateAlertPriority", () => {
  it("returns tier 1 for critical severity with fresh alert", () => {
    const result = calculateAlertPriority({
      severity: "critical",
      alertType: "margin_call",
      createdAt: new Date(),
      portfolioValue: 1000000,
      isAcknowledged: false,
    });

    expect(result.tier).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.displayChannels).toContain("banner");
  });

  it("applies time decay correctly", () => {
    const tenHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 10);

    const result = calculateAlertPriority({
      severity: "high",
      alertType: "test",
      createdAt: tenHoursAgo,
      portfolioValue: 1000000,
      isAcknowledged: false,
    });

    // high = 70, time decay = -5 (10 hours * 0.5)
    expect(result.score).toBe(65);
  });

  it("applies acknowledgement penalty", () => {
    const result = calculateAlertPriority({
      severity: "critical",
      alertType: "test",
      createdAt: new Date(),
      portfolioValue: 1000000,
      isAcknowledged: true,
    });

    // critical = 90, acknowledged = -30
    expect(result.score).toBe(60);
    expect(result.tier).toBe(2); // Dropped from tier 1 to tier 2
  });
});
```

---

## soundManager

### Purpose

Manages alert sound notifications with volume control, quiet hours, and graceful autoplay blocking handling.

### Location

```
src/lib/soundManager.ts
```

### API Reference

```typescript
class SoundManager {
  /** Play an alert sound based on severity type */
  play(type: "critical" | "warning" | "info"): void;

  /** Enable or disable sound playback */
  setEnabled(enabled: boolean): void;

  /** Set volume level (0.0 - 1.0) */
  setVolume(volume: number): void;

  /** Set quiet hours (overnight ranges supported) */
  setQuietHours(start: string, end: string): void;

  /** Clear quiet hours configuration */
  clearQuietHours(): void;
}

// Singleton instance
export const soundManager: SoundManager;
```

### Sound Types

| Type | File | Use Case |
|------|------|----------|
| `critical` | `/sounds/alert-critical.mp3` | Tier 1 critical alerts |
| `warning` | `/sounds/alert-warning.mp3` | Tier 2 high severity alerts |
| `info` | `/sounds/alert-info.mp3` | Tier 3 informational alerts |

### Usage Examples

**Basic Usage:**

```typescript
import { soundManager } from "@/lib/soundManager";

// Play critical alert sound
soundManager.play("critical");

// Play warning sound
soundManager.play("warning");

// Play info sound
soundManager.play("info");
```

**Volume Control:**

```typescript
import { soundManager } from "@/lib/soundManager";

// Set volume to 50%
soundManager.setVolume(0.5);

// Set volume to max
soundManager.setVolume(1.0);

// Mute (without disabling)
soundManager.setVolume(0.0);
```

**Enable/Disable:**

```typescript
import { soundManager } from "@/lib/soundManager";

// Disable all sounds
soundManager.setEnabled(false);

// Re-enable sounds
soundManager.setEnabled(true);
```

**Quiet Hours:**

```typescript
import { soundManager } from "@/lib/soundManager";

// Overnight quiet hours (22:00 - 07:00)
soundManager.setQuietHours("22:00", "07:00");

// Daytime quiet hours (09:00 - 17:00)
soundManager.setQuietHours("09:00", "17:00");

// Clear quiet hours
soundManager.clearQuietHours();
```

### Quiet Hours Logic

**Overnight Range (start > end):**

```typescript
// Example: 22:00 - 07:00
soundManager.setQuietHours("22:00", "07:00");

// Quiet if:
// - Current time >= 22:00 (10pm - midnight)
// - OR current time < 07:00 (midnight - 7am)

// Active:
// - 22:30 ✓
// - 01:00 ✓
// - 06:30 ✓

// Not active:
// - 07:00 ✗
// - 12:00 ✗
// - 21:59 ✗
```

**Daytime Range (start < end):**

```typescript
// Example: 09:00 - 17:00
soundManager.setQuietHours("09:00", "17:00");

// Quiet if:
// - Current time >= 09:00 AND < 17:00

// Active:
// - 09:00 ✓
// - 12:00 ✓
// - 16:59 ✓

// Not active:
// - 08:59 ✗
// - 17:00 ✗
// - 20:00 ✗
```

### Integration with useAlertStream

```typescript
// src/hooks/useAlertStream.ts
import { soundManager } from "@/lib/soundManager";

eventSource.addEventListener("alert:new", (event: MessageEvent) => {
  const alert = JSON.parse(event.data);
  addAlert(alert);

  // Play sound based on severity
  if (alert.severity === "critical") {
    soundManager.play("critical");
  } else if (alert.severity === "high") {
    soundManager.play("warning");
  }
  // Medium/low alerts: no sound
});
```

### User Preferences Integration

```typescript
// Example: Settings page
import { soundManager } from "@/lib/soundManager";
import { useState } from "react";

function NotificationSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.setEnabled(enabled);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    soundManager.setVolume(value);
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    setQuietStart(start);
    setQuietEnd(end);
    soundManager.setQuietHours(start, end);
  };

  return (
    <div>
      <Switch checked={soundEnabled} onChange={handleSoundToggle} />
      <Slider value={volume} onChange={handleVolumeChange} min={0} max={1} step={0.1} />
      <TimePicker value={quietStart} onChange={(v) => handleQuietHoursChange(v, quietEnd)} />
      <TimePicker value={quietEnd} onChange={(v) => handleQuietHoursChange(quietStart, v)} />
    </div>
  );
}
```

### Autoplay Blocking

Modern browsers block autoplay until user interaction. The sound manager handles this gracefully:

```typescript
play(type: SoundType): void {
  if (!this.enabled) return;
  if (this.isQuietHours()) return;

  const audio = new Audio(this.sounds[type]);
  audio.volume = this.volume;

  audio.play().catch(() => {
    // Browser blocked autoplay - expected on first page load
    console.debug("Sound blocked by browser autoplay policy");
    // No error thrown, no user disruption
  });
}
```

**Solution:** Sounds will work automatically after first user interaction (click, keypress, etc.).

### Testing

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SoundManager } from "@/lib/soundManager";

describe("SoundManager", () => {
  let soundManager: SoundManager;

  beforeEach(() => {
    soundManager = new SoundManager();
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      volume: 0,
    }));
  });

  it("plays critical sound", async () => {
    soundManager.play("critical");

    expect(global.Audio).toHaveBeenCalledWith("/sounds/alert-critical.mp3");
  });

  it("respects quiet hours", () => {
    soundManager.setQuietHours("22:00", "07:00");

    // Mock current time to be within quiet hours
    vi.setSystemTime(new Date("2026-01-15T23:00:00Z"));

    soundManager.play("critical");

    // Sound should not play
    expect(global.Audio).not.toHaveBeenCalled();
  });

  it("applies volume setting", () => {
    soundManager.setVolume(0.5);
    soundManager.play("warning");

    const audioInstance = (global.Audio as any).mock.results[0].value;
    expect(audioInstance.volume).toBe(0.5);
  });
});
```

### Sound File Setup

Ensure sound files exist in your public directory:

```
public/
└── sounds/
    ├── alert-critical.mp3
    ├── alert-warning.mp3
    └── alert-info.mp3
```

**Sound Recommendations:**
- **Critical:** Urgent, attention-grabbing tone (e.g., alarm beep)
- **Warning:** Moderate alert tone (e.g., notification chime)
- **Info:** Subtle, gentle tone (e.g., soft ding)

**Duration:** Keep sounds short (0.5-2 seconds) to avoid disruption.

---

## Next Steps

- **[05-alert-customization.md](./05-alert-customization.md)** - Extending the alert system
