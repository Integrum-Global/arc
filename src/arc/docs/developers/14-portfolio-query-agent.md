# Portfolio Query Agent

This guide covers the PortfolioQueryAgent for natural language portfolio queries using LLM-based classification.

## Overview

The PortfolioQueryAgent enables natural language interactions with portfolio data:

- **LLM-Based Classification**: Semantic query understanding (NOT keyword/regex matching)
- **RAG Pattern**: Classify → Retrieve → Generate architecture
- **Type-Specific Retrieval**: Optimized data fetching per query type
- **Confidence Scoring**: Transparent reasoning with confidence levels
- **Query Analytics**: Logging and FAQ detection for optimization

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  PortfolioQueryAgent                       │
├────────────────────────────────────────────────────────────┤
│  Step 1: Classification (LLM-Based)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ClassifyQuerySignature                      │  │
│  │  Inputs:                                              │  │
│  │    - query (natural language question)                │  │
│  │    - portfolio_context (JSON summary)                 │  │
│  │                                                       │  │
│  │  Outputs (Structured JSON):                           │  │
│  │    - query_type: enum (7 types)                       │  │
│  │    - confidence: 0.0-1.0                              │  │
│  │    - reasoning: brief explanation                     │  │
│  │    - entities: {securities, timeframe, metrics}       │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  Step 2: Data Retrieval (Type-Specific)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  allocation  → sectors, asset classes, top holdings   │  │
│  │  performance → returns, P&L, benchmark comparison     │  │
│  │  holdings    → positions, cost basis, gains/losses    │  │
│  │  ratios      → valuation, risk metrics, beta          │  │
│  │  comparison  → vs benchmark, vs previous period       │  │
│  │  alerts      → recent changes, events, warnings       │  │
│  │  general     → portfolio summary, quick overview      │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  Step 3: Answer Generation                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PortfolioAnswerSignature                      │  │
│  │  Inputs:                                              │  │
│  │    - query (original question)                        │  │
│  │    - query_type (classification result)               │  │
│  │    - retrieved_data (JSON from step 2)                │  │
│  │                                                       │  │
│  │  Outputs (Structured JSON):                           │  │
│  │    - answer: natural language response                │  │
│  │    - confidence: 0.0-1.0                              │  │
│  │    - data_points: supporting facts                    │  │
│  │    - follow_up_suggestions: related queries           │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│                    ARCBaseAgent                            │
│  - DataFlow integration                                    │
│  - Portfolio/Security context helpers                      │
│  - Formatting utilities                                    │
├────────────────────────────────────────────────────────────┤
│                    Kaizen BaseAgent                        │
│  - Signature-based programming                             │
│  - Cost tracking hooks                                     │
│  - Streaming support                                       │
└────────────────────────────────────────────────────────────┘
```

## Query Types

The agent classifies queries into 7 semantic categories:

| Type | Example Queries |
|------|-----------------|
| `allocation` | "What's my sector breakdown?", "How much is in tech stocks?" |
| `performance` | "How is my portfolio performing?", "What's my YTD return?" |
| `holdings` | "What are my top holdings?", "How much AAPL do I own?" |
| `ratios` | "What's my portfolio beta?", "Show me P/E ratios" |
| `comparison` | "How do I compare to S&P 500?", "Am I beating the market?" |
| `alerts` | "Any recent changes?", "What events affected my portfolio?" |
| `general` | "Give me an overview", "Summarize my portfolio" |

## Configuration

### PortfolioQueryConfig

```python
from arc.agents import PortfolioQueryConfig

config = PortfolioQueryConfig(
    # LLM Settings
    model="gpt-4o-mini",              # Main answer model
    temperature=0.1,                   # Low for consistent answers
    max_tokens=2000,                   # Response length limit

    # Classification Settings
    classification_model="gpt-4o-mini", # Model for query classification
    classification_temperature=0.0,     # Zero for deterministic classification

    # Quality Settings
    min_confidence_threshold=0.5,      # Below this uses "general" type
    low_confidence_caveat=True,        # Add caveats for low confidence

    # Data Retrieval
    max_holdings=50,                   # Max holdings to retrieve
    include_cost_basis=True,           # Include cost basis in holdings
    include_unrealized_gains=True,     # Calculate unrealized P&L

    # Analytics
    enable_query_logging=True,         # Log queries for FAQ detection
    max_query_log_size=1000,           # Max log entries
)
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model` | `"gpt-4o-mini"` | LLM for answer generation |
| `temperature` | `0.1` | Sampling temperature for answers |
| `classification_model` | `"gpt-4o-mini"` | LLM for classification |
| `classification_temperature` | `0.0` | Temperature for classification (0 = deterministic) |
| `min_confidence_threshold` | `0.5` | Minimum confidence before fallback to general |
| `max_holdings` | `50` | Maximum holdings to retrieve |
| `enable_query_logging` | `True` | Enable query analytics |

## Agent Initialization

### Basic Initialization

```python
from dataflow import DataFlow
from arc.agents import PortfolioQueryAgent, PortfolioQueryConfig

# Initialize DataFlow
db = DataFlow("postgresql://...")

# Create agent with default config
agent = PortfolioQueryAgent(db=db)

# Or with custom config
config = PortfolioQueryConfig(min_confidence_threshold=0.6)
agent = PortfolioQueryAgent(config=config, db=db)
```

### With Shared Memory

```python
from arc.agents import ARCMemoryPool, PortfolioQueryAgent

memory = ARCMemoryPool(db=db, tenant_id="tenant-001")
agent = PortfolioQueryAgent(
    db=db,
    shared_memory=memory,
    agent_id="query_agent_001",
)
```

## Querying Portfolios

### Basic Query

```python
# Ask a natural language question
result = await agent.query(
    portfolio_id="port-001",
    question="What's my current allocation by sector?"
)

# Access results
print(result["answer"])
print(f"Confidence: {result['confidence']}")
print(f"Query Type: {result['query_type']}")
```

### Query with Context

```python
# Provide additional context
result = await agent.query(
    portfolio_id="port-001",
    question="How is my tech exposure compared to last month?",
    context="I'm concerned about concentration risk",
)

# Access supporting data points
for point in result.get("data_points", []):
    print(f"- {point}")
```

### Using the Convenience Function

```python
from arc.agents import query_portfolio

# One-liner for simple queries
result = await query_portfolio(
    db=db,
    portfolio_id="port-001",
    question="What are my top 5 holdings?",
)
```

## Response Structure

```json
{
    "answer": "Your portfolio has 45% allocated to Technology, 25% to Healthcare, 15% to Financials, and 15% to other sectors. Your largest holdings are AAPL (15%), MSFT (12%), and NVDA (8%).",

    "query_type": "allocation",

    "confidence": 0.92,

    "data_points": [
        "Technology: 45% ($225,000)",
        "Healthcare: 25% ($125,000)",
        "Financials: 15% ($75,000)",
        "AAPL: 15% weight",
        "MSFT: 12% weight"
    ],

    "follow_up_suggestions": [
        "How does this compare to my target allocation?",
        "What's the performance of my tech holdings?",
        "Should I rebalance?"
    ],

    "classification": {
        "query_type": "allocation",
        "confidence": 0.95,
        "reasoning": "User asking about sector breakdown which is an allocation question",
        "entities": {
            "securities": [],
            "timeframe": null,
            "metrics": ["sector", "allocation"]
        }
    },

    "_metadata": {
        "processing_time_ms": 450,
        "agent_id": "portfolio_query",
        "model": "gpt-4o-mini"
    }
}
```

## Query Classification (LLM-Based)

### Why LLM Classification?

The agent uses LLM-based semantic classification instead of keyword/regex matching:

| Approach | Query: "How much NVDA do I have?" |
|----------|-----------------------------------|
| Keywords | Might match "have" → wrong category |
| Regex | Complex patterns, brittle |
| **LLM** | Understands intent → `holdings` with entity `NVDA` |

### Classification Process

```python
# Internal classification flow
classification = await agent._classify_query(
    question="What's my exposure to semiconductors?",
    portfolio_context={"name": "Growth Portfolio", "sectors": ["Tech", "Healthcare"]}
)

# Returns structured classification
{
    "query_type": "allocation",
    "confidence": 0.88,
    "reasoning": "User asking about sector/industry exposure (semiconductors)",
    "entities": {
        "securities": [],
        "timeframe": null,
        "metrics": ["exposure", "semiconductor"]
    }
}
```

### Low Confidence Handling

```python
# When classification confidence is below threshold
if classification["confidence"] < config.min_confidence_threshold:
    # Falls back to "general" query type
    # Retrieves portfolio summary data
    # Adds caveat to response
```

## Data Retrieval

### Type-Specific Data

Each query type retrieves optimized data:

```python
# Allocation queries
{
    "sectors": {"Technology": 0.45, "Healthcare": 0.25, ...},
    "asset_classes": {"Equity": 0.85, "Fixed Income": 0.15},
    "top_holdings": [{"symbol": "AAPL", "weight": 0.15}, ...]
}

# Performance queries
{
    "total_value": 500000.00,
    "total_cost": 425000.00,
    "total_gain_loss": 75000.00,
    "return_pct": 17.65,
    "period_returns": {"1D": 0.5, "1W": 2.1, "1M": 5.2, ...}
}

# Holdings queries
{
    "holdings_count": 25,
    "holdings": [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "quantity": 100,
            "cost_basis": 150.00,
            "market_value": 19500.00,
            "unrealized_pnl": 4500.00,
            "unrealized_pnl_pct": 30.0
        },
        ...
    ]
}
```

### Entity-Based Filtering

When entities are detected, data is filtered accordingly:

```python
# Query: "How is AAPL performing?"
# Entities: {"securities": ["AAPL"]}
# Result: Only AAPL data retrieved

# Query: "Show me this month's performance"
# Entities: {"timeframe": "1M"}
# Result: Data filtered to 1-month period
```

## Query Analytics

### Accessing Query Log

```python
# Get all logged queries
log = agent.get_query_log()

for entry in log:
    print(f"{entry.timestamp}: {entry.query}")
    print(f"  Type: {entry.query_type}, Success: {entry.success}")
```

### Analytics Summary

```python
# Get analytics for optimization
analytics = agent.get_query_analytics()

print(f"Total Queries: {analytics['total_queries']}")
print(f"Success Rate: {analytics['success_rate']:.1%}")
print(f"Avg Confidence: {analytics['average_classification_confidence']:.2f}")
print(f"Avg Response Time: {analytics['average_processing_time_ms']}ms")

# Query type distribution
for query_type, count in analytics['query_type_distribution'].items():
    print(f"  {query_type}: {count}")
```

### FAQ Detection

Query analytics enable FAQ detection for optimization:

```python
# Identify frequently asked queries
faq_candidates = [
    entry for entry in agent.get_query_log()
    if entry.query_type == "allocation"
]

# Consider caching responses for top FAQs
```

## Query Suggestions

### Get Contextual Suggestions

```python
# Get suggested queries based on portfolio
suggestions = await agent.suggest_queries(
    portfolio_id="port-001",
    recent_queries=["What's my allocation?"],  # Exclude recently asked
)

# Returns context-aware suggestions
[
    "How has your portfolio performed this month?",
    "What are your top performing holdings?",
    "How does your Technology allocation compare to the benchmark?"
]
```

## Cost Tracking

### Per-Query Costs

```python
# Query includes cost metadata
result = await agent.query(portfolio_id="port-001", question="...")

# Costs tracked internally
costs = agent.get_call_costs()
for cost in costs:
    print(f"{cost['operation']}: ${cost['cost_usd']:.4f}")
```

### Session Summary

```python
# Get total costs for session
summary = agent.get_session_cost_summary()

print(f"Total Cost: ${summary['total_cost_usd']:.4f}")
print(f"Queries: {summary['call_count']}")
print(f"Avg per Query: ${summary['average_cost_per_call']:.4f}")
```

## Error Handling

### Portfolio Not Found

```python
result = await agent.query(
    portfolio_id="nonexistent",
    question="What's my allocation?"
)

# Returns error response
{
    "answer": "Unable to process query. Please try again.",
    "error": "Portfolio nonexistent not found",
    "query_type": "error",
    "confidence": 0.0
}
```

### Low Confidence Response

When confidence is below threshold, the response includes a caveat:

```python
# Low confidence response
{
    "answer": "Based on available data, your portfolio appears to be... Note: This response has lower confidence. Please verify the information.",
    "confidence": 0.45,
    "query_type": "general"  # Fell back from original classification
}
```

## Testing

Run portfolio query tests:

```bash
# Run query agent tests only
uv run pytest tests/unit/agents/test_portfolio_query.py -v

# Run all agent tests
uv run pytest tests/unit/agents/ -v

# Run with coverage
uv run pytest tests/unit/agents/ --cov=arc.agents --cov-report=term-missing
```

Test coverage includes:
- Configuration validation
- Query type enumeration
- Signature field verification
- Agent initialization
- LLM-based classification
- Data retrieval per query type
- Answer generation with confidence
- Query analytics
- Edge cases

## Best Practices

### 1. Use Appropriate Classification Model

```python
# For production: Use capable model for classification
config = PortfolioQueryConfig(
    classification_model="gpt-4o-mini",  # Good balance of cost/quality
    classification_temperature=0.0,       # Deterministic
)
```

### 2. Monitor Confidence Scores

```python
result = await agent.query(portfolio_id="port-001", question="...")

if result.get("confidence", 0) < 0.6:
    # Consider asking for clarification
    print("Low confidence response - may need refinement")
```

### 3. Provide Context When Helpful

```python
# Better results with context
result = await agent.query(
    portfolio_id="port-001",
    question="Should I rebalance?",
    context="My target allocation is 60% stocks, 40% bonds",
)
```

### 4. Use Analytics for Optimization

```python
# Periodically review analytics
analytics = agent.get_query_analytics()

# Identify common query types for optimization
if analytics['query_type_distribution'].get('allocation', 0) > 100:
    # Consider pre-computing allocation summaries
    pass
```

### 5. Handle Follow-Up Suggestions

```python
result = await agent.query(portfolio_id="port-001", question="...")

# Use follow-up suggestions for conversational flow
if result.get("follow_up_suggestions"):
    print("You might also want to ask:")
    for suggestion in result["follow_up_suggestions"]:
        print(f"  - {suggestion}")
```

## Multi-Agent Collaboration

### Sharing Query Insights

```python
# After answering, share insights with other agents
result = await agent.query(portfolio_id="port-001", question="...")

if result.get("confidence", 0) > 0.8:
    agent.share_insight(
        content=result["answer"],
        tags=["query_response", result["query_type"]],
        importance=result["confidence"],
        segment="queries",
    )
```

### Using Insights from Market Agent

```python
# Incorporate market insights for better answers
market_insights = agent.get_relevant_insights(
    tags=["market", "daily_brief"],
    min_importance=0.7,
    limit=3,
)

# Include in context for better responses
context = f"Recent market insights: {market_insights}"
result = await agent.query(
    portfolio_id="port-001",
    question="How is the market affecting my portfolio?",
    context=context,
)
```

## Related Documentation

- [12-agent-infrastructure.md](12-agent-infrastructure.md) - Base agent architecture
- [13-market-intelligence-agent.md](13-market-intelligence-agent.md) - Market intelligence agent
- [05-portfolio-service.md](05-portfolio-service.md) - Portfolio data access
- [Kaizen Documentation](../../../sdk-users/apps/kaizen/) - Kaizen framework guide
