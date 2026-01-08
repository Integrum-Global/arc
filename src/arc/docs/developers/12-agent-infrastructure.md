# Agent Infrastructure

This guide covers the base Kaizen agent infrastructure for ARC AI-powered investment analysis.

## Overview

The ARC platform uses Kailash Kaizen for AI agents. The agent infrastructure provides:

- **ARCBaseAgent**: Foundation class extending Kaizen's BaseAgent with DataFlow integration
- **ARCMemoryPool**: Shared memory for multi-agent collaboration with persistence
- **ARCAgentRegistry**: Lifecycle management for agent instances
- **Cost Tracking**: LLM usage monitoring with budget limits

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Agent Registry                       │
├────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │  Market    │ │  Query     │ │  Analyst   │   ...   │
│  │  Agent     │ │  Agent     │ │  Agent     │         │
│  └────────────┘ └────────────┘ └────────────┘         │
├────────────────────────────────────────────────────────┤
│               ARCBaseAgent (Common)                     │
│  - Portfolio context loading                           │
│  - Security context loading                            │
│  - Formatting helpers                                  │
├────────────────────────────────────────────────────────┤
│               Shared Memory Pool                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│  │   Hot   │→│  Warm   │→│  Cold   │                  │
│  │ (RAM)   │ │(DataFlow)│ │  (S3)   │                  │
│  └─────────┘ └─────────┘ └─────────┘                  │
└────────────────────────────────────────────────────────┘
```

## Agent Configuration

### ARCAgentConfig

Base configuration for all ARC agents:

```python
from arc.agents import ARCAgentConfig

config = ARCAgentConfig(
    llm_provider="openai",      # "openai" | "anthropic" | "azure"
    model="gpt-4o",             # Model name
    temperature=0.2,            # Low for consistent analysis
    max_tokens=4096,            # Max response tokens
    use_async_llm=True,         # True for Docker/FastAPI
    budget_limit_usd=10.0,      # Max spend per session
    hooks_enabled=True,         # Enable cost tracking
    memory_enabled=True,        # Enable conversation memory
)
```

### Specialized Configs

| Config | Use Case | Key Differences |
|--------|----------|-----------------|
| `MarketAgentConfig` | Market intelligence | Higher temp (0.3), 6K tokens, multi_cycle |
| `QueryAgentConfig` | Portfolio queries | gpt-4o-mini, low temp (0.1), 2K tokens |
| `AnalystAgentConfig` | Deep analysis | 8K tokens, multi_cycle, 10 max_cycles |
| `CommitteeAgentConfig` | Multi-agent decisions | 10K tokens, $25 budget, 15 max_cycles |

```python
from arc.agents import AnalystAgentConfig

analyst_config = AnalystAgentConfig(
    analysis_depth="comprehensive",
    include_peer_comparison=True,
    include_historical_trends=True,
)
```

## ARCBaseAgent

### Initialization

```python
from dataflow import DataFlow
from arc.agents import ARCBaseAgent, ARCAgentConfig, PortfolioAnalysisSignature

# Initialize DataFlow
db = DataFlow("postgresql://...")

# Create agent
agent = ARCBaseAgent(
    config=ARCAgentConfig(),
    signature=PortfolioAnalysisSignature(),
    db=db,
    agent_id="portfolio_analyst",
)
```

### Portfolio Context

Get comprehensive portfolio data for analysis:

```python
context = await agent.get_portfolio_context("port-001")

# Returns:
# {
#     "portfolio": {...},
#     "holdings": [...],
#     "recent_transactions": [...],
#     "latest_valuation": {...},
#     "summary": {
#         "total_value": 125000.00,
#         "total_cost": 100000.00,
#         "total_gain_loss": 25000.00,
#         "total_gain_loss_pct": 25.0,
#         "holdings_count": 15,
#         "active_positions": 12,
#     }
# }
```

### Security Context

Get security data for analysis:

```python
context = await agent.get_security_context("AAPL")

# Returns:
# {
#     "security": {...},
#     "prices": [...],
#     "current_price": {...},
#     "fundamentals": [...],
#     "ratios": {...}
# }
```

### Formatting Helpers

```python
# Currency formatting
ARCBaseAgent.format_currency(1234.56, "USD")  # "$1,234.56"
ARCBaseAgent.format_currency(1234.56, "EUR")  # "€1,234.56"

# Percentage formatting
ARCBaseAgent.format_percentage(5.25)          # "5.25%"

# Ratio formatting
ARCBaseAgent.format_ratio(1.5)                # "1.50x"

# Large number formatting
ARCBaseAgent.format_large_number(1_500_000_000)  # "1.5B"
ARCBaseAgent.format_large_number(250_000_000)    # "250.0M"
```

## Investment Signatures

Kaizen signatures define agent inputs/outputs:

### PortfolioAnalysisSignature

```python
from arc.agents import PortfolioAnalysisSignature

# Inputs
portfolio_id: str      # Portfolio to analyze
analysis_type: str     # "performance" | "risk" | "allocation" | "health" | "all"
time_period: str       # "1d" | "1w" | "1m" | "3m" | "1y" | "ytd" | "inception"

# Outputs
summary: str           # Executive summary
metrics: str           # JSON with calculated metrics
recommendations: str   # Actionable recommendations
risk_warnings: str     # Important risk factors
```

### SecurityAnalysisSignature

```python
from arc.agents import SecurityAnalysisSignature

# Inputs
symbol: str           # Ticker symbol
analysis_type: str    # "fundamental" | "technical" | "valuation" | "all"

# Outputs
summary: str          # Investment thesis
metrics: str          # Key metrics JSON
rating: str           # "strong_buy" | "buy" | "hold" | "sell" | "strong_sell"
price_target: str     # Price target with rationale
risks: str            # Key risk factors
```

### MarketQuerySignature

```python
from arc.agents import MarketQuerySignature

# Inputs
query: str            # Natural language query
context: str          # Additional context (optional)

# Outputs
answer: str           # Direct answer
data_sources: str     # Sources used
confidence: str       # "high" | "medium" | "low"
```

## ARCMemoryPool

Shared memory for multi-agent collaboration:

### Initialization

```python
from arc.agents import ARCMemoryPool, MemoryConfig

# Default configuration
memory = ARCMemoryPool(db=db, tenant_id="tenant-001")

# Custom configuration
config = MemoryConfig(
    hot_tier_max_insights=100,       # Max in-memory insights
    hot_tier_max_age_seconds=3600.0, # 1 hour in hot tier
    warm_tier_enabled=True,          # Enable DataFlow persistence
    persist_on_write=True,           # Persist immediately
)
memory = ARCMemoryPool(db=db, tenant_id="tenant-001", config=config)
```

### Writing Insights

```python
memory.write_insight({
    "agent_id": "analyst_001",
    "content": "Portfolio shows high concentration risk in tech sector (65%)",
    "tags": ["portfolio", "risk", "tech", "concentration"],
    "importance": 0.9,
    "segment": "analysis",
})
```

### Reading Insights

```python
# Read relevant insights
insights = memory.read_relevant(
    tags=["portfolio", "risk"],
    min_importance=0.7,
    exclude_own=True,    # Exclude insights from querying agent
    limit=10,
)

# Read all insights
all_insights = memory.read_all()
```

### Conversation Memory

```python
# Add message to conversation
memory.add_conversation_message(
    user_id="user-001",
    role="user",
    content="Analyze my portfolio performance",
    session_id="session-001",
    agent_id="analyst",
)

# Get conversation history
history = memory.get_conversation_history(
    user_id="user-001",
    session_id="session-001",
    limit=50,
)
```

### Portfolio-Specific Memory

```python
# Add portfolio insight
memory.add_portfolio_insight(
    portfolio_id="port-001",
    content="High concentration risk in technology sector",
    insight_type="risk",
    importance=0.9,
    agent_id="analyst",
    metadata={"sector": "technology", "concentration": 0.65},
)

# Get portfolio insights
insights = memory.get_portfolio_insights(
    portfolio_id="port-001",
    min_importance=0.7,
    limit=20,
)
```

## ARCAgentRegistry

Agent lifecycle management:

### Initialization

```python
from arc.agents import ARCAgentRegistry, AgentType

registry = ARCAgentRegistry(
    db=db,
    tenant_id="tenant-001",
)
```

### Getting Agents

```python
# Get agent (creates if not exists)
analyst = registry.get_agent(AgentType.ANALYST)
market = registry.get_agent(AgentType.MARKET)
query = registry.get_agent(AgentType.QUERY)
committee = registry.get_agent(AgentType.COMMITTEE)

# Force new instance
new_analyst = registry.get_agent(AgentType.ANALYST, create_new=True)
```

### Agent Types

| Type | Purpose |
|------|---------|
| `AgentType.MARKET` | Market intelligence and news analysis |
| `AgentType.QUERY` | Natural language portfolio queries |
| `AgentType.ANALYST` | Deep financial analysis |
| `AgentType.COMMITTEE` | Multi-agent investment decisions |

### Cost Tracking

```python
# Get total cost across all agents
total_cost = registry.get_total_cost()

# Get cost breakdown by agent type
costs_by_type = registry.get_cost_by_type()
# {"analyst": 0.15, "market": 0.08, "query": 0.02}

# Reset costs
registry.reset_costs()
```

### Statistics

```python
stats = registry.get_stats()
# {
#     "tenant_id": "tenant-001",
#     "registered_types": 4,
#     "active_agents": 2,
#     "total_cost_usd": 0.23,
#     "cost_by_type": {...},
#     "memory_stats": {...},
#     "agents": {...}
# }
```

### Lifecycle

```python
# Application startup
await registry.start()

# Application shutdown
await registry.shutdown()
```

## Complete Example

```python
from dataflow import DataFlow
from arc.agents import (
    ARCAgentRegistry,
    AgentType,
    AnalystAgentConfig,
)

# Initialize
db = DataFlow("postgresql://...", auto_migrate=False)
await db.create_tables_async()

registry = ARCAgentRegistry(db=db, tenant_id="tenant-001")
await registry.start()

# Get analyst agent
analyst = registry.get_agent(AgentType.ANALYST)

# Get portfolio context
context = await analyst.get_portfolio_context("port-001")

if "error" not in context:
    # Share insight with other agents
    analyst.shared_memory.write_insight({
        "agent_id": analyst.agent_id,
        "content": f"Portfolio value: ${context['summary']['total_value']:,.2f}",
        "tags": ["portfolio", "valuation"],
        "importance": 0.7,
        "segment": "analysis",
    })

# Check costs
print(f"Total cost: ${registry.get_total_cost():.4f}")

# Shutdown
await registry.shutdown()
```

## Testing

Run agent tests:

```bash
uv run pytest tests/unit/agents/ -v
```

Test coverage includes:
- Configuration creation and conversion
- Agent initialization with DataFlow
- Context helpers (portfolio, security, market)
- Formatting utilities
- Memory pool operations
- Registry lifecycle management
- Cost tracking

## Best Practices

### 1. Use Appropriate Configs

```python
# For quick queries - use QueryAgentConfig
config = QueryAgentConfig()  # Fast model, low tokens

# For deep analysis - use AnalystAgentConfig
config = AnalystAgentConfig()  # Full model, high tokens
```

### 2. Always Include Risk Warnings

ARCBaseAgent automatically ensures risk warnings are present in recommendations.

### 3. Share Insights for Multi-Agent Collaboration

```python
# Agent 1 shares insight
analyst.share_insight(
    content="Portfolio needs rebalancing",
    tags=["portfolio", "rebalance"],
    importance=0.85,
)

# Agent 2 reads insights
insights = market.get_relevant_insights(tags=["portfolio"])
```

### 4. Track Costs

```python
# Set budget limit
config = ARCAgentConfig(budget_limit_usd=5.0)

# Monitor costs
print(f"Session cost: ${agent.get_total_cost():.4f}")
```

### 5. Use Async for Docker/FastAPI

```python
# For Docker deployments
config = ARCAgentConfig(use_async_llm=True)
```

## Related Documentation

- [05-portfolio-service.md](05-portfolio-service.md) - Portfolio data access
- [06-analytics-service.md](06-analytics-service.md) - Analytics integration
- [Kaizen Documentation](../../../sdk-users/apps/kaizen/) - Kaizen framework guide
