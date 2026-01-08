# Financial Analyst Agent

This guide covers the FinancialAnalystAgent for comprehensive security and portfolio analysis using LLM-based chain-of-thought reasoning.

## Overview

The FinancialAnalystAgent provides AI-powered financial analysis:

- **Multi-Faceted Analysis**: 5 dimensions (liquidity, profitability, leverage, valuation, growth)
- **Chain-of-Thought Reasoning**: Step-by-step analytical process via LLM
- **Health Score Calculation**: 0-100 score with A-F grade
- **Anomaly Detection**: Identifies unusual patterns with severity scoring
- **Peer Comparison**: Benchmarks against sector peers
- **Portfolio Aggregation**: Security-level analysis rolled up to portfolio

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 FinancialAnalystAgent                       │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SecurityAnalysisSignature                   │  │
│  │  Inputs:                                              │  │
│  │    - company_name, ticker                             │  │
│  │    - financial_data (JSON)                            │  │
│  │    - peer_data (JSON)                                 │  │
│  │    - analysis_type (quick/standard/comprehensive)     │  │
│  │                                                       │  │
│  │  Chain-of-Thought Steps:                              │  │
│  │    Step 1: Liquidity Analysis                         │  │
│  │    Step 2: Profitability Analysis                     │  │
│  │    Step 3: Leverage Analysis                          │  │
│  │    Step 4: Valuation Analysis                         │  │
│  │    Step 5: Growth Analysis                            │  │
│  │                                                       │  │
│  │  Outputs (Structured JSON):                           │  │
│  │    - financial_health: {score, grade, trend}          │  │
│  │    - strengths, concerns                              │  │
│  │    - peer_comparison                                  │  │
│  │    - recommendation                                   │  │
│  │    - confidence (0.0-1.0)                             │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           AnomalyDetectionSignature                   │  │
│  │  Outputs: anomalies with severity scoring             │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PortfolioHealthSignature                    │  │
│  │  Outputs: portfolio-level health aggregation          │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│                    ARCBaseAgent                            │
│  - DataFlow integration                                    │
│  - Portfolio/Security context helpers                      │
│  - Formatting utilities                                    │
└────────────────────────────────────────────────────────────┘
```

## Analysis Dimensions

| Dimension | Metrics Analyzed | Assessment |
|-----------|------------------|------------|
| **Liquidity** | Current ratio, quick ratio, cash ratio, working capital | Strong/Adequate/Weak |
| **Profitability** | Gross margin, operating margin, net margin, ROE, ROA | Strong/Adequate/Weak |
| **Leverage** | Debt-to-equity, debt-to-assets, interest coverage | Conservative/Moderate/Aggressive |
| **Valuation** | P/E, P/B, EV/EBITDA, vs peers | Undervalued/Fairly Valued/Overvalued |
| **Growth** | Revenue growth, earnings growth, outlook | High/Moderate/Low/Declining |

## Configuration

### FinancialAnalystConfig

```python
from arc.agents import FinancialAnalystConfig

config = FinancialAnalystConfig(
    # LLM Settings
    model="gpt-4o",               # Model for analysis
    temperature=0.2,              # Low for consistent analysis
    max_tokens=8000,              # Long for detailed reports

    # Analysis Settings
    analysis_depth="standard",    # quick, standard, comprehensive
    include_peer_comparison=True, # Include peer benchmarking
    include_historical_trends=True,

    # Quality Settings
    min_confidence_threshold=0.6, # Minimum confidence for valid results
    low_confidence_caveat=True,   # Add caveats for low confidence

    # Anomaly Detection
    anomaly_std_threshold=2.0,    # Standard deviations for anomaly
    enable_anomaly_detection=True,

    # Health Score Weights
    health_score_weights={
        "liquidity": 0.20,
        "profitability": 0.25,
        "leverage": 0.20,
        "valuation": 0.15,
        "growth": 0.20,
    },
)
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model` | `"gpt-4o"` | LLM model for analysis |
| `temperature` | `0.2` | Sampling temperature (lower = more consistent) |
| `max_tokens` | `8000` | Maximum response tokens |
| `analysis_depth` | `"standard"` | Analysis depth level |
| `include_peer_comparison` | `True` | Include peer group comparison |
| `min_confidence_threshold` | `0.6` | Minimum confidence for valid results |
| `anomaly_std_threshold` | `2.0` | Std deviations for anomaly detection |

## Agent Initialization

### Basic Initialization

```python
from dataflow import DataFlow
from arc.agents import FinancialAnalystAgent, FinancialAnalystConfig

# Initialize DataFlow
db = DataFlow("postgresql://...")

# Create agent with default config
agent = FinancialAnalystAgent(db=db)

# Or with custom config
config = FinancialAnalystConfig(analysis_depth="comprehensive")
agent = FinancialAnalystAgent(config=config, db=db)
```

### With Shared Memory

```python
from arc.agents import ARCMemoryPool, FinancialAnalystAgent

memory = ARCMemoryPool(db=db, tenant_id="tenant-001")
agent = FinancialAnalystAgent(
    db=db,
    shared_memory=memory,
    agent_id="analyst_001",
)
```

## Security Analysis

### Basic Analysis

```python
# Analyze a single security
result = await agent.analyze_security("AAPL")

# Access results
print(f"Health Score: {result['financial_health']['score']}")
print(f"Grade: {result['financial_health']['grade']}")
print(f"Trend: {result['financial_health']['trend']}")
print(f"Confidence: {result['confidence']}")
```

### Analysis with Options

```python
# Comprehensive analysis with peer comparison
result = await agent.analyze_security(
    security_id="AAPL",
    analysis_type="comprehensive",
    include_peer_comparison=True,
)

# Access chain-of-thought reasoning
for step in result.get("reasoning_steps", []):
    print(step)

# Access analysis dimensions
print("Liquidity:", result["liquidity_analysis"]["assessment"])
print("Profitability:", result["profitability_analysis"]["assessment"])
print("Leverage:", result["leverage_analysis"]["assessment"])

# Access strengths and concerns
for strength in result["strengths"]:
    print(f"+ {strength}")
for concern in result["concerns"]:
    print(f"- {concern}")
```

### Analysis Types

| Type | Description |
|------|-------------|
| `quick` | Fast analysis with key metrics |
| `standard` | Balanced analysis (default) |
| `comprehensive` | Deep analysis with all dimensions |

## Health Score System

### Score to Grade Mapping

| Score Range | Grade | Interpretation |
|-------------|-------|----------------|
| 90-100 | A | Excellent financial health |
| 80-89 | B | Good financial health |
| 70-79 | C | Adequate financial health |
| 60-69 | D | Below average, concerns present |
| 0-59 | F | Poor financial health, significant risks |

### Score Composition

```python
# Health score is weighted average of component scores
health_score_weights = {
    "liquidity": 0.20,      # 20%
    "profitability": 0.25,  # 25%
    "leverage": 0.20,       # 20%
    "valuation": 0.15,      # 15%
    "growth": 0.20,         # 20%
}
```

## Anomaly Detection

### Detecting Anomalies

```python
# Detect anomalies across multiple securities
anomalies = await agent.detect_anomalies(
    security_ids=["AAPL", "MSFT", "GOOGL"],
    lookback_periods=4,  # Quarters to analyze
)

# Filter by severity
high_severity = [a for a in anomalies if a["severity"] == "high"]
for anomaly in high_severity:
    print(f"{anomaly['ticker']}: {anomaly['description']}")
    print(f"  Action: {anomaly['recommended_action']}")
```

### Anomaly Types

| Type | Description | Example |
|------|-------------|---------|
| `sudden_ratio_change` | Metric changed >2 std dev | Current ratio dropped 40% |
| `trend_reversal` | Direction change after 3+ periods | Margin improvement reversed |
| `peer_outlier` | >2 std dev from peer group | P/E 50% above sector median |
| `threshold_breach` | Critical level crossed | Interest coverage below 1.0 |
| `data_quality` | Missing/inconsistent data | Revenue data gap |

### Anomaly Severity Levels

| Severity | Score Range | Description |
|----------|-------------|-------------|
| `low` | 0.0-0.3 | Minor deviation, monitor |
| `medium` | 0.3-0.6 | Notable change, investigate |
| `high` | 0.6-0.8 | Significant concern, action needed |
| `critical` | 0.8-1.0 | Urgent issue, immediate attention |

## Portfolio Analysis

### Analyzing Portfolio Health

```python
# Analyze entire portfolio
result = await agent.analyze_portfolio(
    portfolio_id="port-001",
    include_holdings_analysis=True,  # Analyze individual holdings
)

# Access portfolio health
print(f"Portfolio Grade: {result['portfolio_health']['grade']}")
print(f"Portfolio Score: {result['portfolio_health']['score']}")

# Access recommendations
for rec in result["recommendations"]:
    print(f"- {rec}")

# Access concerns
for concern in result["concerns"]:
    print(f"Concern: {concern['ticker']} - {concern['issues']}")
```

### Portfolio Analysis Output

```json
{
    "portfolio_health": {
        "score": 82,
        "grade": "B",
        "trend": "stable"
    },
    "sector_analysis": [
        {
            "sector": "Technology",
            "weight": 0.45,
            "avg_health_score": 85
        }
    ],
    "concentration_risk": {
        "assessment": "Moderate",
        "top_holdings_weight": 0.35
    },
    "quality_distribution": {
        "grade_a_weight": 0.30,
        "grade_b_weight": 0.45,
        "grade_c_weight": 0.20,
        "grade_d_weight": 0.05,
        "grade_f_weight": 0.00
    },
    "top_performers": [
        {"ticker": "AAPL", "health_score": 92}
    ],
    "concerns": [
        {"ticker": "XYZ", "health_score": 58, "issues": ["High debt"]}
    ],
    "recommendations": [
        "Consider reducing concentration in Technology sector",
        "Review XYZ position due to leverage concerns"
    ],
    "confidence": 0.85
}
```

## Security Analysis Output

### Complete Output Structure

```json
{
    "reasoning_steps": [
        "Step 1: Analyzed liquidity metrics - current ratio of 1.5 indicates adequate coverage",
        "Step 2: Reviewed profitability - margins stable with 25% net margin",
        "Step 3: Assessed leverage - conservative with 0.35 debt-to-equity",
        "Step 4: Evaluated valuation - P/E of 28 premium to peers at 22",
        "Step 5: Examined growth - 8% revenue CAGR, moderate outlook"
    ],

    "summary": "Apple Inc. demonstrates strong financial health...",

    "financial_health": {
        "score": 85,
        "grade": "B",
        "trend": "stable",
        "score_breakdown": {
            "liquidity_score": 82,
            "profitability_score": 92,
            "leverage_score": 88,
            "valuation_score": 72,
            "growth_score": 80
        }
    },

    "liquidity_analysis": {
        "assessment": "Strong",
        "current_ratio": 1.5,
        "quick_ratio": 1.2,
        "cash_ratio": 0.8,
        "insights": ["Adequate working capital", "Strong cash position"],
        "risk_level": "low"
    },

    "profitability_analysis": {
        "assessment": "Strong",
        "gross_margin": 0.43,
        "operating_margin": 0.30,
        "net_margin": 0.25,
        "roe": 0.45,
        "roa": 0.20,
        "insights": ["Industry-leading margins", "Consistent profitability"],
        "trend": "stable"
    },

    "leverage_analysis": {
        "assessment": "Conservative",
        "debt_to_equity": 0.35,
        "debt_to_assets": 0.25,
        "interest_coverage": 15.0,
        "insights": ["Low leverage", "Strong coverage"],
        "risk_level": "low"
    },

    "valuation_analysis": {
        "assessment": "Fairly Valued",
        "pe_ratio": 28.5,
        "pb_ratio": 12.0,
        "ev_ebitda": 20.0,
        "insights": ["Premium to peers justified by margins"],
        "vs_peers": "premium"
    },

    "growth_analysis": {
        "assessment": "Moderate Growth",
        "revenue_growth": 0.08,
        "earnings_growth": 0.10,
        "insights": ["Consistent growth", "Services segment accelerating"],
        "outlook": "positive"
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
        "leverage_percentile": 85,
        "growth_percentile": 68,
        "relative_strengths": ["Superior margins", "Stronger balance sheet"],
        "relative_weaknesses": ["Higher valuation", "Slower growth"]
    },

    "recommendation": "Strong fundamentals support current valuation. Monitor for signs of growth deceleration.",

    "confidence": 0.88,
    "confidence_reasoning": "Complete fundamental data available, strong peer group for comparison",

    "_metadata": {
        "security_id": "AAPL",
        "ticker": "AAPL",
        "analysis_type": "standard",
        "generated_at": "2026-01-07T10:00:00Z",
        "processing_time_ms": 2500,
        "agent_id": "financial_analyst"
    }
}
```

## Convenience Functions

### Quick Security Analysis

```python
from arc.agents import analyze_security

# One-liner for security analysis
result = await analyze_security(
    db=db,
    security_id="AAPL",
    analysis_type="standard",
)
```

### Quick Anomaly Detection

```python
from arc.agents import detect_anomalies

# One-liner for anomaly detection
anomalies = await detect_anomalies(
    db=db,
    security_ids=["AAPL", "MSFT", "GOOGL"],
)
```

### Quick Portfolio Health

```python
from arc.agents import analyze_portfolio_health

# One-liner for portfolio health
result = await analyze_portfolio_health(
    db=db,
    portfolio_id="port-001",
)
```

## Multi-Agent Collaboration

### Sharing Analysis Results

```python
# After analyzing, share insights with other agents
result = await agent.analyze_security("AAPL")

agent.share_insight(
    content=f"AAPL health score: {result['financial_health']['score']}",
    tags=["security_analysis", "AAPL", result['financial_health']['grade']],
    importance=result['confidence'],
    segment="analysis",
)
```

### Using Market Intelligence

```python
# Incorporate market context from other agents
market_insights = agent.get_relevant_insights(
    tags=["market", "technology"],
    min_importance=0.7,
)

# Include in analysis context
```

## Testing

Run financial analyst tests:

```bash
# Run analyst tests only
uv run pytest tests/unit/agents/test_financial_analyst.py -v

# Run all agent tests
uv run pytest tests/unit/agents/ -v

# Run with coverage
uv run pytest tests/unit/agents/ --cov=arc.agents --cov-report=term-missing
```

Test coverage includes:
- Configuration validation
- Enum verification
- Signature field verification
- Agent initialization
- Score-to-grade conversion
- Security analysis flow
- Anomaly detection
- Portfolio analysis
- Peer statistics calculation
- Response parsing
- Edge cases

## Best Practices

### 1. Use Appropriate Analysis Depth

```python
# Quick for screening
result = await agent.analyze_security("AAPL", analysis_type="quick")

# Comprehensive for investment decisions
result = await agent.analyze_security("AAPL", analysis_type="comprehensive")
```

### 2. Monitor Confidence Scores

```python
result = await agent.analyze_security("AAPL")

if result.get("confidence", 0) < 0.6:
    print("Warning: Low confidence analysis - verify findings")
```

### 3. Validate Grade Consistency

```python
# The agent automatically validates grade vs score
# But you can also check
health = result["financial_health"]
expected_grade = "A" if health["score"] >= 90 else "B" if health["score"] >= 80 else ...
assert health["grade"] == expected_grade
```

### 4. Handle Anomalies by Severity

```python
anomalies = await agent.detect_anomalies(["AAPL"])

for anomaly in anomalies:
    if anomaly["severity"] == "critical":
        # Immediate attention required
        send_alert(anomaly)
    elif anomaly["severity"] == "high":
        # Schedule review
        queue_review(anomaly)
```

### 5. Use Peer Comparison for Context

```python
result = await agent.analyze_security("AAPL", include_peer_comparison=True)

peer = result.get("peer_comparison", {})
if peer.get("valuation_percentile", 50) > 90:
    print("Trading at significant premium to peers")
```

## Related Documentation

- [12-agent-infrastructure.md](12-agent-infrastructure.md) - Base agent architecture
- [13-market-intelligence-agent.md](13-market-intelligence-agent.md) - Market intelligence
- [14-portfolio-query-agent.md](14-portfolio-query-agent.md) - Natural language queries
- [05-portfolio-service.md](05-portfolio-service.md) - Portfolio data access
- [Kaizen Documentation](../../../sdk-users/apps/kaizen/) - Kaizen framework guide
