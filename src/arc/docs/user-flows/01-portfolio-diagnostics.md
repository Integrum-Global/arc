# User Flow: Portfolio Financial Diagnostics

## Overview

This document describes the user flows for running financial health scans and viewing diagnostic analytics.

---

## Flow 1: Quick Portfolio Health Scan

### Trigger
- User clicks "Run Health Scan" button
- Scheduled daily scan (automated)
- Alert investigation (reactive)

### User Journey

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         PORTFOLIO HEALTH SCAN FLOW                                    │
└──────────────────────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────┐
│  Dashboard View             │
│  "Run Health Scan" button   │
└──────────────┬──────────────┘
               │ Click
               ▼
┌─────────────────────────────┐
│  Select Scope Dialog        │
│  ○ Single Portfolio         │
│  ○ All Portfolios           │
│  ○ Watchlist                │
└──────────────┬──────────────┘
               │ Select + Confirm
               ▼
┌─────────────────────────────┐
│  Processing Indicator       │
│  "Calculating 25 ratios     │
│   for 47 holdings..."       │
└──────────────┬──────────────┘
               │ ~5 seconds
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HEALTH SCAN RESULTS                                 │
│                                                                          │
│  Overall Health Score: 78/100  [████████░░]                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  RATIO CLASSES                                                      │ │
│  │                                                                     │ │
│  │  Liquidity       [████████░░] 82%    3 issues                      │ │
│  │  Profitability   [███████░░░] 75%    5 issues                      │ │
│  │  Utilization     [█████████░] 88%    1 issue                       │ │
│  │  Leverage        [██████░░░░] 65%    7 issues ⚠️                   │ │
│  │  Valuation       [████████░░] 80%    2 issues                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ATTENTION REQUIRED (18 issues)                      [View All]    │ │
│  │                                                                     │ │
│  │  🔴 CRITICAL (3)                                                   │ │
│  │     • XYZ Corp - Debt/EBITDA > 6x (threshold: 4x)                 │ │
│  │     • ABC Inc - Current Ratio < 1.0                               │ │
│  │     • DEF Ltd - Negative equity                                    │ │
│  │                                                                     │ │
│  │  🟡 WARNING (15)                                                   │ │
│  │     • 8 holdings with declining margins (QoQ)                     │ │
│  │     • 4 holdings with elevated P/E vs peers                       │ │
│  │     • 3 holdings with rising leverage                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [Export Report]  [Set Alerts]  [View Details]  [Dismiss]               │
└─────────────────────────────────────────────────────────────────────────┘
               │
               │ Click "View Details"
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HOLDING DETAIL VIEW (XYZ Corp)                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  KEY RATIOS                                   vs Peers  Trend    │   │
│  │                                                                   │   │
│  │  Liquidity                                                        │   │
│  │    Current Ratio:     1.2      [▬▬▬▬●▬▬]    📉 -15% QoQ        │   │
│  │    Quick Ratio:       0.8      [▬▬▬●▬▬▬]    📉 -12% QoQ        │   │
│  │                                                                   │   │
│  │  Profitability                                                    │   │
│  │    ROE:              12.5%     [▬▬▬▬▬●▬]    📈 +2% YoY         │   │
│  │    Net Margin:        8.2%     [▬▬▬▬●▬▬]    ➡️ Flat             │   │
│  │                                                                   │   │
│  │  Leverage ⚠️                                                      │   │
│  │    Debt/EBITDA:       6.2x     [▬●▬▬▬▬▬]    📈 +1.5x YoY  🔴   │   │
│  │    Interest Cover:    2.1x     [▬▬●▬▬▬▬]    📉 -0.8x YoY       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI ANALYSIS                                                       │   │
│  │                                                                   │   │
│  │  "XYZ Corp's leverage has increased significantly due to the     │   │
│  │   Q2 acquisition of Widget Co. While debt/EBITDA at 6.2x is      │   │
│  │   above your 4x threshold, management has committed to           │   │
│  │   deleveraging to 4x within 18 months through FCF generation.    │   │
│  │   Monitor quarterly progress."                                    │   │
│  │                                                                   │   │
│  │  Sources: [Q2 Earnings Call] [Debt Covenant Filing]              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Set Custom Alert]  [Add to Watchlist]  [View Full Analysis]  [Back]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Calls

```
1. POST /api/analytics/health-scan
   Body: { portfolio_id: "port-001", ratio_classes: ["all"] }
   Response: { score: 78, issues: [...], ratios: {...} }

2. GET /api/portfolios/port-001/holdings/xyz-corp/ratios
   Response: { liquidity: {...}, profitability: {...}, ... }

3. POST /api/intelligence/explain
   Body: { holding_id: "xyz-corp", issue_type: "leverage" }
   Response: { explanation: "...", sources: [...] }
```

---

## Flow 2: Configure Alert Thresholds

### Trigger
- User clicks "Settings > Alert Thresholds"
- From health scan results "Set Alerts"

### User Journey

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         ALERT THRESHOLD CONFIGURATION                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ALERT THRESHOLDS                                    [Reset Defaults]   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LIQUIDITY RATIOS                                                 │   │
│  │                                        Warning    Critical        │   │
│  │  Current Ratio                         < [1.5]    < [1.0]        │   │
│  │  Quick Ratio                           < [1.0]    < [0.5]        │   │
│  │  Cash Ratio                            < [0.3]    < [0.1]        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  PROFITABILITY RATIOS                                             │   │
│  │                                        Warning    Critical        │   │
│  │  ROE                                   < [10%]    < [5%]         │   │
│  │  Net Margin                            < [5%]     < [0%]         │   │
│  │  QoQ Margin Decline                    > [2%]     > [5%]         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LEVERAGE RATIOS                                                  │   │
│  │                                        Warning    Critical        │   │
│  │  Debt/Equity                           > [1.0]    > [2.0]        │   │
│  │  Debt/EBITDA                           > [3.0]    > [4.0]        │   │
│  │  Interest Coverage                     < [3.0]    < [2.0]        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  NOTIFICATION PREFERENCES                                         │   │
│  │                                                                   │   │
│  │  ☑️ Email (daily digest)               john@example.com           │   │
│  │  ☑️ Email (critical - immediate)       john@example.com           │   │
│  │  ☐ SMS (critical only)                 +1 555-1234                │   │
│  │  ☑️ In-app notifications               Always                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Cancel]                                              [Save Thresholds] │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model

```python
@db.model
class AlertThreshold:
    id: str
    user_id: str
    ratio_name: str           # current_ratio, debt_ebitda, etc.
    warning_threshold: Decimal
    critical_threshold: Decimal
    comparison: str           # lt, gt, eq
    enabled: bool = True

@db.model
class NotificationPreference:
    id: str
    user_id: str
    channel: str              # email, sms, in_app
    severity: str             # all, warning, critical
    frequency: str            # immediate, daily_digest, weekly
    destination: str          # email/phone
```

---

## Flow 3: Ratio Trend Analysis

### Trigger
- Click on any ratio in health scan
- Dashboard widget "Ratio Trends"

### User Journey

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         RATIO TREND ANALYSIS                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CURRENT RATIO TREND - Portfolio "Growth Equity"                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  2.0 ─┼───────────────────────────────────────────────────────   │   │
│  │       │                                 ●                         │   │
│  │  1.8 ─┼───────────────────────────●────────────────────────────   │   │
│  │       │              ●──────●                      ●              │   │
│  │  1.6 ─┼─────────●──────────────────────────────────────────────   │   │
│  │       │    ●                                            ●  ●      │   │
│  │  1.4 ─┼─●──────────────────────────────────────────────────────   │   │
│  │       │                                                      ↓    │   │
│  │  1.2 ─┼─────────────────────────────────────────────────────●─   │   │
│  │       │                                          Alert Zone       │   │
│  │  1.0 ─┼─────────────────────────────────────────────────────────  │   │
│  │       │                                                           │   │
│  │       └───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───   │   │
│  │         Q1  Q2  Q3  Q4  Q1  Q2  Q3  Q4  Q1  Q2  Q3  Q4  Q1  Q2    │   │
│  │         2023            2024            2025            2026       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Timeframe: [3M] [6M] [1Y] [3Y] [All]         Compare: [+ Add Holding]  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STATISTICAL SUMMARY                                              │   │
│  │                                                                   │   │
│  │  Current:    1.22        Mean (3Y):   1.62        Trend: 📉       │   │
│  │  Min:        1.18        Std Dev:     0.21        vs Peers: 35th  │   │
│  │  Max:        1.95        Z-Score:    -1.9         Status: ⚠️      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI INSIGHT                                                        │   │
│  │                                                                   │   │
│  │  "The declining current ratio trend is primarily driven by:       │   │
│  │   • Working capital expansion for growth initiatives              │   │
│  │   • Increased inventory build ahead of product launch            │   │
│  │   • Timing of receivables collection                              │   │
│  │                                                                   │   │
│  │   The ratio is approaching your warning threshold (1.5).         │   │
│  │   Recommend reviewing inventory management."                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Export Data]  [Set Alert]  [Compare to Benchmark]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Peer Comparison View

### Trigger
- From ratio analysis "Compare to Benchmark"
- Main menu "Analytics > Peer Comparison"

### User Journey

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PEER COMPARISON                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PEER BENCHMARK ANALYSIS - XYZ Corp                                      │
│                                                                          │
│  Peer Group: [Large Cap Tech ▼]   Period: [TTM ▼]   [Edit Peer Group]   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        RATIO COMPARISON                           │   │
│  │                                                                   │   │
│  │               XYZ    Peer Median   Peer Range      Percentile    │   │
│  │  ─────────────────────────────────────────────────────────────   │   │
│  │  Current      1.22   1.85          1.1 - 2.8       35th          │   │
│  │  Quick        0.82   1.42          0.6 - 2.1       28th          │   │
│  │  ROE         12.5%   15.2%         8% - 28%        42nd          │   │
│  │  Net Margin   8.2%   11.5%         4% - 22%        38th          │   │
│  │  D/E          1.8x   0.8x          0.1 - 2.5x      78th ⚠️       │   │
│  │  D/EBITDA     6.2x   2.5x          0.5 - 5.0x      92nd 🔴       │   │
│  │  P/E         22.5x   28.0x         15x - 45x       32nd          │   │
│  │  EV/EBITDA   14.2x   16.5x         10x - 25x       38th          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  PEER GROUP (8 companies)                                         │   │
│  │                                                                   │   │
│  │  Company        Mkt Cap    Revenue    Sector      Include        │   │
│  │  ───────────────────────────────────────────────────────────────  │   │
│  │  Apple Inc      $2.8T      $394B      Tech        ☑️             │   │
│  │  Microsoft      $2.5T      $212B      Tech        ☑️             │   │
│  │  Google         $1.7T      $307B      Tech        ☑️             │   │
│  │  Meta           $850B      $135B      Tech        ☑️             │   │
│  │  ...                                              [Edit Group]    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI SUMMARY                                                        │   │
│  │                                                                   │   │
│  │  "XYZ Corp ranks below median on liquidity and profitability     │   │
│  │   metrics but is valued at a discount to peers (P/E 32nd         │   │
│  │   percentile). The elevated leverage (92nd percentile) is the    │   │
│  │   primary concern limiting valuation expansion."                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Generate Report]  [Export to Excel]  [Save Custom Peer Group]         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Implementation

```python
# src/arc/workflows/analytics/ratios.py
from kailash.workflow.builder import WorkflowBuilder
from kailash.runtime import AsyncLocalRuntime

def create_ratio_workflow():
    """Calculate financial ratios for portfolio holdings."""
    workflow = WorkflowBuilder()

    # Step 1: Get holdings
    workflow.add_node("HoldingListNode", "holdings", {
        "filter": {"portfolio_id": "${portfolio_id}"}
    })

    # Step 2: Get fundamentals for each holding
    workflow.add_node("CompanyFundamentalsListNode", "fundamentals", {
        "filter": {"security_id": {"$in": "${holdings_security_ids}"}}
    })

    # Step 3: Calculate ratios
    workflow.add_node("PythonCodeNode", "calculate_ratios", {
        "code": """
from decimal import Decimal

ratios = []
for fund in fundamentals:
    security_id = fund['security_id']

    # Liquidity ratios
    current_ratio = fund['current_assets'] / fund['current_liabilities'] if fund['current_liabilities'] else None
    quick_ratio = (fund['current_assets'] - fund.get('inventory', 0)) / fund['current_liabilities'] if fund['current_liabilities'] else None

    # Profitability ratios
    roe = fund['net_income'] / fund['total_equity'] if fund['total_equity'] else None
    net_margin = fund['net_income'] / fund['revenue'] if fund['revenue'] else None

    # Leverage ratios
    debt_equity = fund['total_debt'] / fund['total_equity'] if fund['total_equity'] else None

    ratios.append({
        'security_id': security_id,
        'current_ratio': str(current_ratio) if current_ratio else None,
        'quick_ratio': str(quick_ratio) if quick_ratio else None,
        'roe': str(roe) if roe else None,
        'net_margin': str(net_margin) if net_margin else None,
        'debt_equity': str(debt_equity) if debt_equity else None,
    })

result = {'ratios': ratios}
        """
    })
    workflow.add_connection("fundamentals", "records", "calculate_ratios", "fundamentals")

    # Step 4: Check thresholds
    workflow.add_node("PythonCodeNode", "check_thresholds", {
        "code": """
# Compare ratios to user thresholds
alerts = []
for ratio in ratios:
    if ratio['current_ratio'] and float(ratio['current_ratio']) < 1.5:
        alerts.append({
            'security_id': ratio['security_id'],
            'ratio': 'current_ratio',
            'value': ratio['current_ratio'],
            'threshold': '1.5',
            'severity': 'warning' if float(ratio['current_ratio']) >= 1.0 else 'critical'
        })
    # ... more threshold checks

result = {'ratios': ratios, 'alerts': alerts}
        """
    })
    workflow.add_connection("calculate_ratios", "ratios", "check_thresholds", "ratios")

    return workflow.build()
```

---

## Component Specifications

### Health Score Card Component (React)

```tsx
// apps/web/src/features/analytics/HealthScoreCard.tsx
interface HealthScoreProps {
  score: number;
  ratioClasses: RatioClass[];
  issues: Issue[];
}

export function HealthScoreCard({ score, ratioClasses, issues }: HealthScoreProps) {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <CircularProgress value={score} max={100} />
          <div>
            <p className="text-3xl font-bold">{score}/100</p>
            <p className="text-sm text-muted-foreground">
              {criticalIssues.length} critical, {warningIssues.length} warnings
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {ratioClasses.map(rc => (
            <RatioClassBar key={rc.name} ratioClass={rc} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Health Score Card Component (Flutter)

```dart
// apps/mobile/lib/features/analytics/widgets/health_score_card.dart
class HealthScoreCard extends StatelessWidget {
  final int score;
  final List<RatioClass> ratioClasses;
  final List<Issue> issues;

  const HealthScoreCard({
    required this.score,
    required this.ratioClasses,
    required this.issues,
  });

  @override
  Widget build(BuildContext context) {
    final criticalCount = issues.where((i) => i.severity == 'critical').length;
    final warningCount = issues.where((i) => i.severity == 'warning').length;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Portfolio Health Score',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Row(
              children: [
                CircularProgressIndicator(
                  value: score / 100,
                  strokeWidth: 8,
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$score/100',
                        style: Theme.of(context).textTheme.headlineMedium),
                    Text('$criticalCount critical, $warningCount warnings',
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            ...ratioClasses.map((rc) => RatioClassBar(ratioClass: rc)),
          ],
        ),
      ),
    );
  }
}
```
