# TODO-BE-018: Financial Analyst Agent

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-015

---

## Objective

Implement the Financial Analyst Agent that performs comprehensive security analysis and anomaly detection using the PEV (Plan-Execute-Verify) pattern.

---

## Tasks

### 1. Agent Signature Definition
- [ ] Create `src/arc/agents/financial_analyst.py`
- [ ] Define `SecurityAnalysisSignature`:
  ```python
  class SecurityAnalysisSignature(Signature):
      security: dict = InputField(description="Security master data")
      fundamentals: List[dict] = InputField(description="Historical fundamentals")
      ratios: List[dict] = InputField(description="Calculated ratios")
      analysis_type: str = InputField(description="Analysis depth")

      summary: str = OutputField(description="Analysis summary")
      financial_health: dict = OutputField(description="Health score and grade")
      key_metrics: dict = OutputField(description="Key metrics")
      strengths: List[str] = OutputField(description="Identified strengths")
      concerns: List[str] = OutputField(description="Identified concerns")
      peer_comparison: dict = OutputField(description="Peer comparison")
      recommendation: str = OutputField(description="Overall recommendation")
      confidence: float = OutputField(description="Analysis confidence")
  ```
- [ ] Define `AnomalyDetectionSignature`:
  ```python
  class AnomalyDetectionSignature(Signature):
      security_ids: List[str] = InputField(description="Securities to analyze")
      lookback_days: int = InputField(description="Historical lookback period")

      anomalies: List[dict] = OutputField(description="Detected anomalies")
  ```

### 2. Financial Analyst Agent Implementation
- [ ] Implement `FinancialAnalystAgent` using PEV pattern:
  ```python
  class FinancialAnalystAgent(ARCBaseAgent):
      def __init__(self, db: DataFlow):
          config = AnalystAgentConfig(
              model="gpt-4",
              temperature=0.5,
              max_tokens=3000
          )
          super().__init__(db, config)
          self.pev_agent = PEVAgent(self)  # Plan-Execute-Verify

      async def analyze(self, security: dict, ...) -> dict:
          """Perform comprehensive security analysis."""
          # 1. Plan: Determine analysis approach
          # 2. Execute: Run analysis steps
          # 3. Verify: Validate findings
          pass

      async def detect_anomalies(self, security_ids: List[str], ...) -> List[dict]:
          """Detect anomalies in securities."""
          pass
  ```

### 3. Analysis Logic
- [ ] Implement multi-faceted analysis:
  - **Liquidity Analysis**: Current ratio trend, cash position
  - **Profitability Analysis**: Margin trends, ROE/ROA
  - **Leverage Analysis**: Debt levels, coverage ratios
  - **Valuation Analysis**: P/E, P/B, EV/EBITDA vs peers
  - **Growth Analysis**: Revenue/earnings growth rates
- [ ] Calculate financial health score (0-100)
- [ ] Assign grade (A-F)
- [ ] Determine trend (improving/stable/declining)

### 4. Anomaly Detection
- [ ] Implement anomaly types:
  - **Sudden ratio changes**: >2 std dev from mean
  - **Trend reversals**: Direction change after 3+ periods
  - **Peer outliers**: >2 std dev from peer group
  - **Threshold breaches**: Ratio crosses critical level
  - **Data quality issues**: Missing/inconsistent data
- [ ] Calculate severity (high/medium/low)
- [ ] Generate descriptions

### 5. Peer Comparison
- [ ] Fetch peer group data
- [ ] Calculate percentile rankings
- [ ] Identify relative strengths/weaknesses
- [ ] Compare vs sector/industry averages

### 6. PEV Pattern Implementation
- [ ] Plan phase: Determine analysis scope
- [ ] Execute phase: Run analysis steps
- [ ] Verify phase: Cross-check findings
- [ ] Iterate if needed

---

## Acceptance Criteria

- [ ] Comprehensive security analysis
- [ ] Financial health score 0-100
- [ ] Grade assignment A-F
- [ ] Trend detection
- [ ] Anomaly detection with severity
- [ ] Peer comparison integration
- [ ] PEV pattern for accuracy
- [ ] Unit test: Health score calculation
- [ ] Unit test: Anomaly detection
- [ ] Integration test: Full security analysis

---

## Analysis Output Structure

```json
{
    "security_id": "AAPL",
    "analysis_type": "comprehensive",
    "generated_at": "2026-01-07T10:00:00Z",
    "summary": "Apple Inc. demonstrates strong financial health with excellent liquidity, stable profitability, and conservative leverage. The company trades at a premium to peers, justified by superior margins.",
    "financial_health": {
        "score": 85,
        "grade": "A",
        "trend": "stable"
    },
    "key_metrics": {
        "current_ratio": 1.5,
        "roe": 0.45,
        "debt_to_equity": 0.35,
        "pe_ratio": 28.5
    },
    "strengths": [
        "Industry-leading profit margins (25% net margin)",
        "Strong cash position ($50B net cash)",
        "Consistent revenue growth (8% CAGR)"
    ],
    "concerns": [
        "Trading at premium valuation (P/E 28x vs peer median 22x)",
        "iPhone revenue concentration (52% of total)"
    ],
    "peer_comparison": {
        "peer_group": "Large Cap Technology",
        "profitability_percentile": 92,
        "valuation_percentile": 75,
        "leverage_percentile": 85
    },
    "recommendation": "Strong fundamentals support current valuation. Monitor for signs of growth deceleration.",
    "confidence": 0.88
}
```

---

## Anomaly Output Structure

```json
{
    "security_id": "XYZ",
    "anomaly_type": "sudden_ratio_change",
    "severity": "high",
    "description": "Current ratio dropped from 1.8 to 1.1 in Q4 2025, a 39% decline representing 3.2 standard deviations from historical mean",
    "detected_at": "2026-01-07T10:00:00Z",
    "metrics": {
        "current_value": 1.1,
        "previous_value": 1.8,
        "change_percent": -39,
        "std_deviations": 3.2
    }
}
```

---

## Technical Notes

- PEV pattern ensures analysis accuracy
- Use chain-of-thought for complex reasoning
- Cache analysis results (refresh daily)
- Generate alerts for high-severity anomalies
