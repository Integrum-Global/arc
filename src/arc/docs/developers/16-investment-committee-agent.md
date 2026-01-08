# Investment Committee Agent

The Investment Committee Agent orchestrates multiple specialized agents using the Supervisor-Worker pattern to provide comprehensive investment recommendations with consensus handling, dissent tracking, and compliance-ready audit trails.

## Overview

The InvestmentCommitteeAgent acts as a "committee chair" that:
1. **Delegates** analysis tasks to specialized worker agents in parallel
2. **Synthesizes** diverse perspectives using LLM chain-of-thought reasoning
3. **Tracks** consensus and dissenting views transparently
4. **Validates** recommendations against investment constraints
5. **Generates** compliance-ready audit trails

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Investment Committee Agent                    │
│                  (Supervisor/Chair)                         │
├─────────────────────────────────────────────────────────────┤
│  Request → Validate → Delegate → Synthesize → Audit        │
└──────────────┬────────────────────────────────┬─────────────┘
               │ Parallel Execution              │
    ┌──────────┼──────────┐                     │
    ▼          ▼          ▼                     │
┌────────┐ ┌────────┐ ┌────────┐               │
│ Market │ │Portfolio│ │Analyst │               │
│ Intel  │ │ Query   │ │        │               │
│ Agent  │ │ Agent   │ │ Agent  │               │
└────────┘ └────────┘ └────────┘               │
    │          │          │                     │
    └──────────┼──────────┘                     │
               ▼                                │
    ┌─────────────────────┐                    │
    │  LLM Synthesis      │                    │
    │  (Chain-of-Thought) │                    │
    └──────────┬──────────┘                    │
               │                                │
               ▼                                │
    ┌─────────────────────┐                    │
    │  Audit Trail        │◄───────────────────┘
    └─────────────────────┘
```

## Request Types

The committee supports six request types:

| Request Type | Purpose | Primary Focus Agents |
|-------------|---------|---------------------|
| `rebalance` | Portfolio rebalancing suggestions | Portfolio, Market |
| `buy` | Security purchase recommendations | Analyst, Market |
| `sell` | Security sale recommendations | Analyst, Market |
| `hold` | Hold vs action analysis | All equally |
| `risk_assessment` | Risk evaluation | All equally |
| `opportunity` | Opportunity identification | Market, Analyst |

## Quick Start

```python
from dataflow import DataFlow
from arc.agents import InvestmentCommitteeAgent

# Initialize with database
db = DataFlow("postgresql://...")
committee = InvestmentCommitteeAgent(db=db)

# Request rebalancing recommendation
decision = await committee.recommend(
    portfolio_id="port-001",
    request_type="rebalance",
    constraints={
        "max_position_size_pct": 10,
        "max_sector_concentration_pct": 30,
        "risk_tolerance": "moderate"
    }
)

# Access results
print(f"Recommendation: {decision['recommendation']}")
print(f"Conviction: {decision['conviction']}")
print(f"Confidence: {decision['confidence']}")

# Review action items
for action in decision['action_items']:
    print(f"  {action['action']} {action['security']}: {action['rationale']}")

# Check consensus
consensus = decision['consensus_analysis']
print(f"Agreement Level: {consensus['agreement_level']}")

# Review dissent
for view in decision['dissenting_views']:
    print(f"  {view['agent']}: {view['view']}")
```

## Convenience Methods

```python
# Rebalance recommendation
decision = await committee.recommend_rebalance("port-001", constraints)

# Buy recommendation for specific securities
decision = await committee.recommend_buy(
    portfolio_id="port-001",
    target_securities=["AAPL", "MSFT", "GOOGL"],
    constraints=constraints
)

# Sell recommendation
decision = await committee.recommend_sell(
    portfolio_id="port-001",
    target_securities=["META"],  # Optional
    constraints=constraints
)

# Risk assessment
decision = await committee.assess_risk("port-001", constraints)

# Opportunity identification
decision = await committee.identify_opportunities("port-001", constraints)
```

## Configuration

```python
from arc.agents import InvestmentCommitteeConfig

config = InvestmentCommitteeConfig(
    # LLM settings
    model="gpt-4o",               # Model for synthesis
    temperature=0.3,              # Higher for creative synthesis
    max_tokens=10000,             # Long for comprehensive recommendations

    # Budget control
    budget_limit_usd=25.0,        # Higher for multi-agent coordination

    # Orchestration settings
    worker_timeout_seconds=60.0,  # Timeout per worker agent
    parallel_execution=True,      # Execute workers in parallel
    max_retries=2,                # Retries for failed workers

    # Consensus settings
    require_unanimous=False,      # Don't require full agreement
    min_confidence=0.6,           # Minimum for valid recommendation
    min_agreement_ratio=0.5,      # At least 50% agreement

    # Audit settings
    enable_audit_trail=True,      # Enable compliance logging
    audit_retention_days=365,     # Keep logs for 1 year
)

committee = InvestmentCommitteeAgent(db=db, config=config)
```

## Investment Constraints

Constraints validate recommendations before they're returned:

```python
constraints = {
    # Position limits
    "max_position_size_pct": 10.0,       # Max single position (%)
    "max_sector_concentration_pct": 30.0, # Max sector weight (%)

    # Quality thresholds
    "min_liquidity_ratio": 1.0,          # Minimum current ratio
    "max_debt_to_equity": 2.0,           # Maximum leverage
    "min_health_score": 50,              # Minimum health score for buy

    # Exclusions
    "excluded_sectors": ["Energy"],      # Sectors to avoid
    "excluded_securities": ["COIN", "GME"], # Securities to avoid

    # Risk profile
    "risk_tolerance": "moderate"         # conservative, moderate, aggressive
}
```

## Response Structure

```python
{
    # Identity
    "decision_id": "uuid",
    "portfolio_id": "port-001",
    "request_type": "rebalance",
    "generated_at": "2024-01-15T10:30:00Z",

    # Recommendation
    "recommendation": "Clear, actionable recommendation statement",
    "conviction": "high|medium|low",
    "confidence": 0.85,  # 0.0-1.0
    "confidence_reasoning": "Why this confidence level",

    # Analysis summary
    "analysis_summary": {
        "market_perspective": {
            "summary": "Key market insights",
            "sentiment": "bullish|neutral|bearish",
            "confidence": 0.8
        },
        "portfolio_perspective": {
            "summary": "Key portfolio insights",
            "alignment": "aligned|neutral|misaligned",
            "confidence": 0.9
        },
        "analyst_perspective": {
            "summary": "Key security insights",
            "quality_assessment": "strong|moderate|weak",
            "confidence": 0.85
        }
    },

    # Actions
    "action_items": [
        {
            "action": "buy|sell|hold|rebalance",
            "security": "AAPL",
            "amount": "5% of portfolio",
            "rationale": "Why this action",
            "priority": "high|medium|low",
            "timeframe": "immediate|short_term|medium_term"
        }
    ],

    # Risk
    "risk_considerations": [
        {
            "risk": "Description of risk",
            "severity": "high|medium|low",
            "mitigation": "How to mitigate"
        }
    ],

    # Consensus
    "consensus_analysis": {
        "agreement_level": "full|partial|split",
        "points_of_agreement": ["point1", "point2"],
        "points_of_disagreement": ["point1"]
    },

    # Dissent
    "dissenting_views": [
        {
            "agent": "market|portfolio|analyst",
            "view": "Description of dissenting view",
            "rationale": "Why this view differs",
            "merit": "Why this view has merit"
        }
    ],

    # Validation
    "constraints_validation": {
        "all_constraints_met": true,
        "violated_constraints": [],
        "constraint_notes": "Notes about constraints"
    },

    # Compliance
    "risk_warnings": "Mandatory risk disclosures",

    # Audit (for compliance)
    "audit_trail": {
        "decision_id": "uuid",
        "timestamp": "ISO8601",
        "agents_consulted": ["market", "portfolio", "analyst"],
        "consensus_level": "full|partial|split",
        "confidence_level": 0.85,
        "dissenting_views_count": 0,
        "constraints_validated": true,
        "total_tokens_used": 5000,
        "total_cost_usd": 0.15,
        "compliance_flags": []
    },

    # Metadata
    "_metadata": {
        "total_execution_time_ms": 3500,
        "total_tokens_used": 5000,
        "total_cost_usd": 0.15,
        "workers_consulted": ["market", "portfolio", "analyst"],
        "agent_id": "investment_committee",
        "model": "gpt-4o"
    }
}
```

## Worker Agents

The committee coordinates three specialized worker agents:

### MarketIntelligenceAgent
- **Purpose**: Analyzes market conditions, sentiment, and macro factors
- **Output**: Market brief with sentiment analysis and actionable takeaways
- **Model**: gpt-4o (temperature 0.25)

### PortfolioQueryAgent
- **Purpose**: Queries current portfolio state and context
- **Output**: Data-driven answers about portfolio allocation, positions, risk
- **Model**: gpt-4o-mini (temperature 0.1 for precision)

### FinancialAnalystAgent
- **Purpose**: Analyzes security fundamentals and portfolio health
- **Output**: Health scores, grades, strengths, concerns, recommendations
- **Model**: gpt-4o (temperature 0.2 for consistency)

## Parallel Execution

Workers execute in parallel by default with configurable timeout:

```python
# Default: parallel with 60s timeout
config = InvestmentCommitteeConfig(
    parallel_execution=True,
    worker_timeout_seconds=60.0,
)

# Sequential for debugging
config = InvestmentCommitteeConfig(
    parallel_execution=False,  # Execute one at a time
)
```

Failed workers don't block recommendations - the committee proceeds with available perspectives if at least 2 workers succeed.

## Consensus Handling

The committee tracks agreement across agents:

| Agreement Level | Description |
|-----------------|-------------|
| `full` | All agents agree on direction |
| `partial` | Majority agrees, some nuance |
| `split` | Significant disagreement |

Dissenting views are captured with:
- Which agent dissents
- The dissenting view
- Rationale for disagreement
- Merit of the dissenting view (why it shouldn't be dismissed)

## Compliance & Audit

Every recommendation includes a compliance-ready audit trail:

```python
# Get audit log
audit_log = committee.get_audit_log()

# Get session costs
costs = committee.get_session_costs()  # By agent
total = committee.get_total_session_cost()
```

### Compliance Flags

The audit trail includes compliance flags:

| Flag | Triggered When |
|------|---------------|
| `LOW_CONFIDENCE` | Confidence < min_confidence threshold |
| `CONSTRAINT_VIOLATION` | Recommendation violates constraints |
| `SIGNIFICANT_DISSENT` | 2+ agents have dissenting views |
| `MISSING_RISK_WARNINGS` | Risk warnings not included |
| `ERROR_OCCURRED` | An error occurred during processing |

## Cost Tracking

Track costs across all agents in a session:

```python
# Costs broken down by agent
costs = committee.get_session_costs()
# {"market": 0.05, "portfolio": 0.03, "analyst": 0.10, "synthesis": 0.02}

# Total session cost
total = committee.get_total_session_cost()  # 0.20
```

## Error Handling

The committee handles errors gracefully:

1. **Worker Failures**: If a worker fails, the committee proceeds with remaining perspectives (needs at least 2 successful)
2. **Timeout**: Workers that timeout are marked as failed with error
3. **Invalid Request Type**: Returns error response immediately
4. **Constraint Violations**: Flagged but recommendation still returned with violations noted

```python
# Error responses include
{
    "error": "Description of error",
    "recommendation": "Unable to generate recommendation: [error]",
    "conviction": "low",
    "confidence": 0.0,
    "audit_trail": {
        "compliance_flags": ["ERROR_OCCURRED"]
    }
}
```

## Best Practices

1. **Set Appropriate Timeouts**: Increase `worker_timeout_seconds` for slow networks
2. **Use Constraints**: Always provide constraints to validate recommendations
3. **Review Dissent**: Don't ignore dissenting views - they often highlight real risks
4. **Monitor Costs**: Track session costs to stay within budget
5. **Store Audit Logs**: Persist `audit_trail` for compliance requirements
6. **Check Confidence**: Low confidence recommendations need additional review

## Related Agents

- [MarketIntelligenceAgent](12-market-intelligence-agent.md) - Market analysis and briefs
- [PortfolioQueryAgent](14-portfolio-query-agent.md) - Portfolio data queries
- [FinancialAnalystAgent](15-financial-analyst-agent.md) - Security and portfolio analysis
