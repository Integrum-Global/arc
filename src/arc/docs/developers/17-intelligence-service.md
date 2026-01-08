# Intelligence Service

The IntelligenceService provides a unified interface to all Kaizen AI agents for market analysis, portfolio queries, security analysis, and investment recommendations.

## Overview

The IntelligenceService acts as the central hub for AI-powered features in ARC:

1. **Aggregates** all AI agents into a single service interface
2. **Tracks** AI usage for cost management and billing
3. **Caches** frequent queries to reduce costs
4. **Enforces** tenant-level usage limits
5. **Streams** long-running operations for real-time UI

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   IntelligenceService                        │
│              (Unified AI Interface)                         │
├─────────────────────────────────────────────────────────────┤
│  Usage Tracking  │  Caching  │  Tenant Limits              │
└──────────────┬────────────────────────────┬─────────────────┘
               │ Lazy Loading                │
    ┌──────────┼──────────┐                  │
    ▼          ▼          ▼                  ▼
┌────────┐ ┌────────┐ ┌────────┐     ┌─────────────┐
│ Market │ │ Query  │ │Analyst │     │  Committee  │
│ Intel  │ │ Agent  │ │ Agent  │     │    Agent    │
│ Agent  │ │        │ │        │     │ (Supervisor)│
└────────┘ └────────┘ └────────┘     └─────────────┘
```

## Quick Start

```python
from arc.services import create_services

# Create service registry
services = create_services(db, tenant_id="tenant-001", user_id="user-001")
intelligence = services.intelligence

# Generate market brief
brief = await intelligence.generate_market_brief(
    brief_type="daily",
    portfolio_id="port-001"
)

# Query portfolio in natural language
answer = await intelligence.query_portfolio(
    user_id="user-001",
    query="What is my tech sector allocation?"
)

# Analyze a security
analysis = await intelligence.analyze_security("AAPL")

# Get committee recommendation
decision = await intelligence.get_committee_recommendation(
    portfolio_id="port-001",
    request_type="rebalance"
)
```

## Service Methods

### Market Intelligence

#### generate_market_brief()

Generate a comprehensive market intelligence brief.

```python
brief = await intelligence.generate_market_brief(
    brief_type="daily",         # daily, weekly, event, portfolio
    topics=["Earnings", "Fed"], # Optional topics to cover
    portfolio_id="port-001",    # Optional portfolio context
    output_format="summary"     # summary, detailed, executive
)

# Response includes
print(brief["executive_summary"])
print(brief["key_themes"])
print(brief["market_summary"]["sentiment"])  # bullish, neutral, bearish
print(brief["recommendations"])
```

#### stream_market_brief()

Stream a brief for real-time UI updates.

```python
async for chunk in intelligence.stream_market_brief(
    brief_type="daily",
    portfolio_id="port-001"
):
    print(chunk, end="", flush=True)
```

#### get_brief_history()

Retrieve historical briefs.

```python
history = await intelligence.get_brief_history(
    brief_type="daily",
    start_date="2026-01-01",
    end_date="2026-01-31",
    limit=20
)
```

### Natural Language Queries

#### query_portfolio()

Answer natural language questions about portfolios.

```python
result = await intelligence.query_portfolio(
    user_id="user-001",
    query="What is my total exposure to tech stocks?",
    portfolio_id="port-001",      # Optional - uses first portfolio if not specified
    include_sources=True
)

print(result["answer"])            # "Your tech allocation is 35%..."
print(result["confidence"])        # 0.92
print(result["query_type"])        # allocation, performance, holdings, etc.
print(result["data_points"])       # Supporting data
```

#### suggest_queries()

Get contextual query suggestions for a user.

```python
suggestions = await intelligence.suggest_queries(
    user_id="user-001",
    context="portfolio review",   # Optional context hint
    limit=5
)
# ["What are my top holdings?", "How has my portfolio performed?", ...]
```

### Security Analysis

#### analyze_security()

Perform comprehensive security analysis.

```python
analysis = await intelligence.analyze_security(
    security_id="AAPL",
    analysis_type="standard",     # quick, standard, comprehensive
    include_peer_comparison=True
)

print(analysis["financial_health"]["score"])    # 85
print(analysis["financial_health"]["grade"])    # "A"
print(analysis["strengths"])                    # ["Strong liquidity", ...]
print(analysis["concerns"])                     # ["High valuation", ...]
print(analysis["recommendation"])               # "Hold"
```

#### analyze_portfolio()

Analyze portfolio-level financial health.

```python
analysis = await intelligence.analyze_portfolio(
    portfolio_id="port-001",
    include_holdings_analysis=True
)

print(analysis["portfolio_health"]["grade"])    # "B+"
print(analysis["quality_distribution"])         # {"A": 5, "B": 3, "C": 2}
print(analysis["recommendations"])              # ["Reduce tech concentration", ...]
```

#### detect_anomalies()

Detect financial anomalies in securities.

```python
anomalies = await intelligence.detect_anomalies(
    portfolio_id="port-001",      # Or specify security_ids
    lookback_periods=4,
    create_alerts=True            # Create alerts for high severity
)

for anomaly in anomalies:
    if anomaly["severity"] == "high":
        print(f"HIGH: {anomaly['ticker']} - {anomaly['description']}")
        print(f"Action: {anomaly['recommended_action']}")
```

### Research

#### research_topic()

Research a financial topic.

```python
research = await intelligence.research_topic(
    topic="Impact of rising interest rates on tech stocks",
    depth="standard"              # quick, standard, comprehensive
)

print(research["synthesis"])
print(research["key_points"])
print(research["sources"])
```

### Investment Committee

#### get_committee_recommendation()

Get orchestrated investment recommendations.

```python
decision = await intelligence.get_committee_recommendation(
    portfolio_id="port-001",
    request_type="rebalance",     # rebalance, buy, sell, hold, risk_assessment, opportunity
    constraints={
        "max_position_size_pct": 10,
        "max_sector_concentration_pct": 30,
        "risk_tolerance": "moderate"
    },
    target_securities=["AAPL", "MSFT"]   # Optional focus
)

print(decision["recommendation"])
print(decision["conviction"])             # high, medium, low
print(decision["confidence"])             # 0.0-1.0
print(decision["action_items"])
print(decision["consensus_analysis"]["agreement_level"])  # full, partial, split
print(decision["dissenting_views"])
print(decision["audit_trail"])
```

## Configuration

```python
from arc.services import IntelligenceConfig, IntelligenceService

config = IntelligenceConfig(
    # Usage limits per tenant
    monthly_token_limit=1_000_000,    # Max tokens per month
    monthly_cost_limit_usd=100.0,     # Max cost per month

    # Caching
    cache_ttl_seconds=300,            # 5 minute cache TTL
    enable_caching=True,              # Enable response caching

    # Defaults
    default_brief_type="daily",
    default_analysis_type="standard",
    default_research_depth="standard",

    # Timeouts
    agent_timeout_seconds=120.0,      # Agent operation timeout
)

# Use custom config
intelligence = IntelligenceService(
    db=db,
    tenant_id="tenant-001",
    config=config
)
```

## Usage Tracking

The service tracks all AI usage for billing and analytics.

### Get Usage Summary

```python
# Get usage for date range
summary = await intelligence.get_usage_summary(
    start_date="2026-01-01",
    end_date="2026-01-31"
)

print(f"Total Calls: {summary['total_calls']}")
print(f"Total Tokens: {summary['total_tokens']}")
print(f"Total Cost: ${summary['total_cost_usd']:.2f}")

# Breakdown by agent
for agent, data in summary["by_agent"].items():
    print(f"  {agent}: {data['calls']} calls, ${data['cost_usd']:.2f}")
```

### Monthly Usage

```python
# Get current month's usage for limit checking
monthly = await intelligence.get_monthly_usage()
print(f"Tokens Used: {monthly['total_tokens']:,}")
print(f"Cost: ${monthly['total_cost_usd']:.2f}")
```

### Usage Record Structure

Each AI operation creates a usage record:

```python
{
    "id": "usage-abc123",
    "tenant_id": "tenant-001",
    "user_id": "user-001",
    "agent": "market_intelligence",
    "method": "generate_brief",
    "input_tokens": 500,
    "output_tokens": 1500,
    "total_tokens": 2000,
    "cost_usd": 0.05,
    "latency_ms": 3500,
    "timestamp": "2026-01-08T10:00:00Z",
    "metadata": {"brief_type": "daily"}
}
```

## Caching

The service caches frequent queries to reduce costs:

- **Market Briefs**: Cached by type and portfolio for 5 minutes
- **Quick Analyses**: Cached by security for 5 minutes
- **Suggestions**: Not cached (context-dependent)

### Disable Caching

```python
config = IntelligenceConfig(enable_caching=False)
intelligence = IntelligenceService(db=db, config=config)
```

### Custom TTL

```python
config = IntelligenceConfig(cache_ttl_seconds=120)  # 2 minutes
```

## Usage Limits

Tenant-level limits prevent runaway costs:

### Token Limit Exceeded

```python
try:
    await intelligence.generate_market_brief()
except ServiceError as e:
    if "token limit exceeded" in str(e).lower():
        print(f"Monthly tokens: {e.details['used']}/{e.details['limit']}")
```

### Cost Limit Exceeded

```python
try:
    await intelligence.get_committee_recommendation(...)
except ServiceError as e:
    if "cost limit exceeded" in str(e).lower():
        print(f"Monthly cost: ${e.details['used']:.2f}/${e.details['limit']:.2f}")
```

## Lazy Agent Loading

Agents are loaded on-demand to minimize resource usage:

```python
# Service created - no agents loaded yet
intelligence = services.intelligence

# First market brief loads MarketIntelligenceAgent
await intelligence.generate_market_brief()

# First query loads PortfolioQueryAgent
await intelligence.query_portfolio(...)

# Committee recommendation loads InvestmentCommitteeAgent
# which internally loads all worker agents
await intelligence.get_committee_recommendation(...)
```

## Error Handling

All errors include service context for debugging:

```python
try:
    await intelligence.query_portfolio(user_id="u1", query="...")
except ServiceError as e:
    print(f"Service: {e.service}")         # IntelligenceService
    print(f"Operation: {e.operation}")     # query_portfolio
    print(f"Details: {e.details}")         # {"query": "...", "portfolio_id": "..."}
    print(f"Message: {e}")                 # Portfolio query failed: ...
```

## Integration with Service Registry

The IntelligenceService is available through the ServiceRegistry:

```python
from arc.services import create_services

# Create registry with context
services = create_services(
    db=db,
    tenant_id="tenant-001",
    user_id="user-001"
)

# Access via property
intelligence = services.intelligence

# Or create new context
tenant_services = services.with_tenant("tenant-002")
other_intelligence = tenant_services.intelligence
```

## Best Practices

1. **Use Tenant Context**: Always provide tenant_id for usage tracking and limits
2. **Cache When Possible**: Enable caching for frequently requested data
3. **Monitor Usage**: Track monthly usage to stay within limits
4. **Handle Errors**: Wrap AI operations in try/except for graceful degradation
5. **Stream Long Operations**: Use streaming for briefs to improve UX
6. **Set Appropriate Limits**: Configure limits based on tenant plan tier

## Related Documentation

- [MarketIntelligenceAgent](12-market-intelligence-agent.md) - Market analysis agent
- [PortfolioQueryAgent](14-portfolio-query-agent.md) - Natural language query agent
- [FinancialAnalystAgent](15-financial-analyst-agent.md) - Security analysis agent
- [InvestmentCommitteeAgent](16-investment-committee-agent.md) - Multi-agent orchestration
