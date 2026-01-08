# Market Intelligence Agent

This guide covers the MarketIntelligenceAgent for AI-powered market briefs and research synthesis.

## Overview

The MarketIntelligenceAgent provides AI-powered market analysis using:

- **Chain-of-Thought Reasoning**: Explicit step-by-step analysis via signature fields
- **Portfolio-Aware Analysis**: Personalized insights based on user holdings
- **Streaming Responses**: Real-time brief generation for SSE endpoints
- **Research Synthesis**: Deep-dive research on specific market topics
- **Cost Tracking**: Per-call LLM cost monitoring

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 MarketIntelligenceAgent                     │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MarketBriefSignature                     │  │
│  │  Inputs:                                              │  │
│  │    - portfolio_context (JSON)                         │  │
│  │    - market_data (JSON)                               │  │
│  │    - news_context                                     │  │
│  │    - user_preferences                                 │  │
│  │                                                       │  │
│  │  Chain-of-Thought Steps:                              │  │
│  │    Step 1: Market Assessment                          │  │
│  │    Step 2: Portfolio Analysis                         │  │
│  │    Step 3: Sentiment Analysis                         │  │
│  │    Step 4: Opportunity/Risk Identification            │  │
│  │    Step 5: Actionable Synthesis                       │  │
│  │                                                       │  │
│  │  Outputs:                                             │  │
│  │    - executive_summary                                │  │
│  │    - sections (JSON array)                            │  │
│  │    - actionable_takeaways (JSON array)                │  │
│  │    - risk_warnings                                    │  │
│  │    - confidence (0.0-1.0)                             │  │
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

## Configuration

### MarketIntelligenceConfig

```python
from arc.agents import MarketIntelligenceConfig

config = MarketIntelligenceConfig(
    # LLM Settings
    model="gpt-4o",              # Model for analysis
    temperature=0.25,            # Low for consistent analysis
    max_tokens=8000,             # Long for comprehensive briefs

    # Market-Specific Settings
    include_sentiment=True,      # Enable sentiment analysis
    include_technicals=True,     # Include technical indicators
    news_lookback_days=3,        # Days of news to consider
    confidence_threshold=0.6,    # Minimum confidence for valid results

    # Streaming
    enable_streaming=True,       # Enable streaming responses
    chunk_size=5,                # Tokens per streaming chunk
)
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model` | `"gpt-4o"` | LLM model for analysis |
| `temperature` | `0.25` | Sampling temperature (lower = more consistent) |
| `max_tokens` | `8000` | Maximum response tokens |
| `include_sentiment` | `True` | Include sentiment analysis in briefs |
| `include_technicals` | `True` | Include technical indicators |
| `news_lookback_days` | `3` | Days of news to consider |
| `confidence_threshold` | `0.6` | Minimum confidence for valid results |
| `enable_streaming` | `True` | Enable streaming responses |

## Agent Initialization

### Basic Initialization

```python
from dataflow import DataFlow
from arc.agents import MarketIntelligenceAgent, MarketIntelligenceConfig

# Initialize DataFlow
db = DataFlow("postgresql://...")

# Create agent with default config
agent = MarketIntelligenceAgent(db=db)

# Or with custom config
config = MarketIntelligenceConfig(confidence_threshold=0.7)
agent = MarketIntelligenceAgent(config=config, db=db)
```

### With Shared Memory

```python
from arc.agents import ARCMemoryPool, MarketIntelligenceAgent

memory = ARCMemoryPool(db=db, tenant_id="tenant-001")
agent = MarketIntelligenceAgent(
    db=db,
    shared_memory=memory,
    agent_id="market_intel_001",
)
```

## Generating Market Briefs

### Basic Brief Generation

```python
# Generate market-only brief (no portfolio context)
brief = await agent.generate_brief()

# Access results
print(brief["executive_summary"])
print(f"Confidence: {brief['confidence']}")
```

### Portfolio-Aware Brief

```python
# Generate brief with portfolio context
brief = await agent.generate_brief(
    portfolio_id="port-001",
    brief_type="daily",
    output_format="summary",
)

# Access chain-of-thought reasoning
print("Market Assessment:", brief["step1_market_assessment"])
print("Portfolio Analysis:", brief["step2_portfolio_analysis"])
print("Sentiment Analysis:", brief["step3_sentiment_analysis"])

# Access final outputs
print("Executive Summary:", brief["executive_summary"])
for section in brief["sections"]:
    print(f"- {section['title']}: {section['sentiment']}")
```

### Brief Types

| Type | Description |
|------|-------------|
| `daily` | Quick daily morning briefing |
| `weekly` | Weekly market summary |
| `monthly` | Monthly performance review |
| `custom` | Custom analysis based on user preferences |

### Output Formats

| Format | Description |
|--------|-------------|
| `summary` | Concise 3-5 sentence brief |
| `detailed` | Full analysis with all sections |
| `executive` | Executive-level summary |

## Streaming Responses

### SSE Pattern for FastAPI

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

@app.get("/api/intelligence/brief/{portfolio_id}/stream")
async def stream_brief(portfolio_id: str):
    agent = MarketIntelligenceAgent(config=config, db=db)

    async def event_generator():
        async for chunk in agent.stream_brief(portfolio_id):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
```

### Streaming Output Structure

The stream yields JSON chunks in sequence:

```json
// Progress updates
{"status": "gathering_context", "progress": 0.2}
{"status": "analyzing", "progress": 0.4}
{"status": "synthesizing", "progress": 0.8}

// Content
{"type": "executive_summary", "content": "Markets opened higher..."}
{"type": "section", "content": {"title": "Market Overview", ...}}
{"type": "section", "content": {"title": "Sector Analysis", ...}}
{"type": "takeaway", "content": {"action": "Review AAPL position", ...}}
{"type": "risk_warnings", "content": "Past performance..."}

// Completion
{"status": "complete", "progress": 1.0, "confidence": 0.85}
```

### JavaScript Client

```javascript
const eventSource = new EventSource('/api/intelligence/brief/port-001/stream');

eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
        eventSource.close();
        return;
    }

    const data = JSON.parse(event.data);

    if (data.status) {
        updateProgress(data.progress);
    } else if (data.type === 'executive_summary') {
        displaySummary(data.content);
    } else if (data.type === 'section') {
        appendSection(data.content);
    }
};
```

## Research Synthesis

### Basic Research

```python
# Research a specific topic
result = await agent.research(
    topic="Impact of Fed rate decisions on tech valuations",
    depth="comprehensive",
)

print(result["summary"])
for point in result["key_points"]:
    print(f"- {point['point']} (confidence: {point['confidence']})")
```

### Research with Portfolio Relevance

```python
# Research with portfolio context for relevance scoring
result = await agent.research(
    topic="AI chip demand outlook 2026",
    depth="standard",
    portfolio_id="port-001",  # Will highlight relevance to holdings
)

print(result["implications"])  # Portfolio-specific implications
```

### Research Depth Levels

| Depth | Description |
|-------|-------------|
| `quick` | 1-2 paragraphs, fast response |
| `standard` | 3-5 paragraphs, balanced analysis |
| `comprehensive` | Full deep-dive with sources |

## Brief Output Structure

```json
{
    "step1_market_assessment": "Current market shows...",
    "step2_portfolio_analysis": "Portfolio holdings are positioned...",
    "step3_sentiment_analysis": "Sentiment scores: {\"overall\": 0.65, ...}",
    "step4_opportunity_risk": "Key opportunities include...",
    "step5_actionable_synthesis": "Top priorities: 1) ...",

    "executive_summary": "Markets opened higher following positive...",

    "sections": [
        {
            "title": "Market Overview",
            "content": "Major indices showed mixed performance...",
            "sentiment": "positive",
            "importance": 0.95,
            "holdings_mentioned": ["AAPL", "MSFT"]
        },
        {
            "title": "Sector Analysis",
            "content": "Technology sector continues to lead...",
            "sentiment": "neutral",
            "importance": 0.85,
            "holdings_mentioned": ["NVDA", "AMD"]
        }
    ],

    "actionable_takeaways": [
        {
            "action": "Review MSFT position ahead of earnings",
            "rationale": "Q4 results expected to beat estimates",
            "priority": "high",
            "tickers": ["MSFT"],
            "timeframe": "This week"
        },
        {
            "action": "Consider adding to energy exposure",
            "rationale": "Sector rotation indicates value opportunity",
            "priority": "medium",
            "tickers": ["XOM", "CVX"],
            "timeframe": "Next 2 weeks"
        }
    ],

    "risk_warnings": "Past performance does not guarantee future results...",

    "confidence": 0.85,

    "_metadata": {
        "generated_at": "2026-01-07T10:30:00Z",
        "agent_id": "market_intelligence",
        "model": "gpt-4o",
        "brief_type": "daily"
    }
}
```

## Cost Tracking

### Per-Call Cost Tracking

```python
# Get costs for individual calls
costs = agent.get_call_costs()
for cost in costs:
    print(f"{cost['operation']}: ${cost['cost_usd']:.4f}")
```

### Session Summary

```python
# Get comprehensive session summary
summary = agent.get_session_cost_summary()

print(f"Total Cost: ${summary['total_cost_usd']:.4f}")
print(f"Call Count: {summary['call_count']}")
print(f"Average per Call: ${summary['average_cost_per_call']:.4f}")
```

## Convenience Functions

### Quick Brief Generation

```python
from arc.agents import generate_market_brief

# One-liner for generating a brief
brief = await generate_market_brief(
    db=db,
    portfolio_id="port-001",
    brief_type="daily",
)
```

### Quick Research

```python
from arc.agents import research_topic

# One-liner for research
result = await research_topic(
    db=db,
    topic="Fed policy impact on bonds",
    depth="standard",
)
```

## Multi-Agent Collaboration

### Sharing Insights

```python
# After generating a brief, share key insights
brief = await agent.generate_brief(portfolio_id="port-001")

# Share with other agents via memory pool
agent.share_insight(
    content=brief["executive_summary"],
    tags=["market", "daily_brief", "portfolio"],
    importance=0.9,
    segment="analysis",
)
```

### Reading Insights from Other Agents

```python
# Read insights from analyst agents
insights = agent.get_relevant_insights(
    tags=["portfolio", "recommendation"],
    min_importance=0.7,
    limit=5,
)

for insight in insights:
    print(f"From {insight['agent_type']}: {insight['content']}")
```

## Testing

Run market intelligence tests:

```bash
# Run market intelligence tests only
uv run pytest tests/unit/agents/test_market_intelligence.py -v

# Run all agent tests
uv run pytest tests/unit/agents/ -v

# Run with coverage
uv run pytest tests/unit/agents/ --cov=arc.agents --cov-report=term-missing
```

Test coverage includes:
- Configuration validation
- Signature field verification
- Agent initialization
- Brief generation flow
- Streaming responses
- Research synthesis
- Cost tracking
- Post-processing
- Edge cases

## Best Practices

### 1. Use Appropriate Brief Types

```python
# Morning overview
brief = await agent.generate_brief(brief_type="daily")

# End of week summary
brief = await agent.generate_brief(brief_type="weekly")
```

### 2. Monitor Confidence Scores

```python
brief = await agent.generate_brief(portfolio_id="port-001")

if brief.get("confidence", 0) < 0.6:
    # Consider this analysis preliminary
    print("Warning: Low confidence analysis")
```

### 3. Track Costs in Production

```python
# Always check costs after generation
brief = await agent.generate_brief(portfolio_id="port-001")
print(f"Brief cost: ${agent.get_total_cost():.4f}")
```

### 4. Use Streaming for Long Operations

```python
# Use streaming for better UX on long analyses
async for chunk in agent.stream_brief(portfolio_id="port-001"):
    update_ui(chunk)
```

### 5. Include Risk Warnings

The agent automatically includes risk warnings, but verify they're present:

```python
assert brief.get("risk_warnings"), "Risk warnings must be present"
```

## Related Documentation

- [12-agent-infrastructure.md](12-agent-infrastructure.md) - Base agent architecture
- [05-portfolio-service.md](05-portfolio-service.md) - Portfolio data access
- [Kaizen Documentation](../../../sdk-users/apps/kaizen/) - Kaizen framework guide
