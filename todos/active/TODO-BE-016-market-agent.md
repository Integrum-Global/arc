# TODO-BE-016: Market Intelligence Agent

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-015

---

## Objective

Implement the Market Intelligence Agent that generates AI-powered market briefs and research synthesis.

---

## Tasks

### 1. Agent Signature Definition
- [ ] Create `src/arc/agents/market_intelligence.py`
- [ ] Define `MarketBriefSignature`:
  ```python
  class MarketBriefSignature(Signature):
      brief_type: str = InputField(description="Brief type: daily, weekly, custom")
      topics: List[str] = InputField(description="Focus topics")
      portfolio_context: Optional[dict] = InputField(description="User portfolio context")
      format: str = InputField(description="Output format: summary, detailed, executive")

      sections: List[dict] = OutputField(description="Brief sections with content")
      key_takeaways: List[str] = OutputField(description="Key takeaways")
      action_items: List[str] = OutputField(description="Recommended actions")
  ```
- [ ] Define `ResearchSignature`:
  ```python
  class ResearchSignature(Signature):
      topic: str = InputField(description="Research topic")
      depth: str = InputField(description="Research depth: quick, standard, comprehensive")

      summary: str = OutputField(description="Research summary")
      key_points: List[str] = OutputField(description="Key points")
      sources: List[dict] = OutputField(description="Source attributions")
  ```

### 2. Market Intelligence Agent Implementation
- [ ] Implement `MarketIntelligenceAgent`:
  ```python
  class MarketIntelligenceAgent(ARCBaseAgent):
      def __init__(self, db: DataFlow):
          config = MarketAgentConfig(
              model="gpt-4",
              temperature=0.7,
              max_tokens=4000
          )
          super().__init__(db, config)

      def get_signature(self) -> Signature:
          return MarketBriefSignature()

      async def generate_brief(self, brief_type: str, ...) -> dict:
          """Generate market brief."""
          pass

      async def stream_brief(self, brief_type: str, ...) -> AsyncIterator[str]:
          """Stream brief generation."""
          pass

      async def research(self, topic: str, ...) -> dict:
          """Research and synthesize topic."""
          pass
  ```

### 3. Brief Generation Logic
- [ ] Implement brief section generation:
  - Market overview
  - Sector analysis
  - Holdings impact (if portfolio context)
  - Economic indicators
  - Upcoming events
- [ ] Add sentiment analysis per section
- [ ] Calculate relevance scores
- [ ] Generate actionable takeaways

### 4. Data Source Integration
- [ ] Integrate with market data (prices, news)
- [ ] Pull recent security fundamentals
- [ ] Access portfolio holdings for context
- [ ] Fetch economic calendar events

### 5. Streaming Support
- [ ] Implement SSE streaming for real-time output
- [ ] Handle streaming tokens
- [ ] Support graceful interruption

### 6. Caching
- [ ] Cache daily briefs
- [ ] Invalidate on significant market moves
- [ ] Store generated briefs for history

---

## Acceptance Criteria

- [ ] Generate coherent market briefs
- [ ] Sections organized by topic
- [ ] Portfolio context influences content
- [ ] Sentiment analysis per section
- [ ] Streaming works for real-time UI
- [ ] Research synthesis with sources
- [ ] Unit test: Brief generation
- [ ] Unit test: Streaming tokens
- [ ] Integration test: Full brief with portfolio context

---

## Brief Output Structure

```json
{
    "id": "brief-20260107-daily",
    "type": "daily",
    "generated_at": "2026-01-07T07:00:00Z",
    "sections": [
        {
            "title": "Market Overview",
            "content": "Markets opened higher following...",
            "sentiment": "positive",
            "relevance_score": 0.95,
            "sources": ["Bloomberg", "Reuters"]
        },
        {
            "title": "Tech Sector Update",
            "content": "Your portfolio has significant exposure...",
            "sentiment": "neutral",
            "relevance_score": 0.88,
            "holdings_mentioned": ["AAPL", "MSFT", "GOOGL"]
        }
    ],
    "key_takeaways": [
        "Fed rate decision expected to maintain current levels",
        "Tech sector showing resilience despite concerns",
        "Your AAPL position up 2.3% in pre-market"
    ],
    "action_items": [
        "Review MSFT position ahead of earnings",
        "Consider rebalancing tech exposure"
    ]
}
```

---

## Technical Notes

- Use chain-of-thought for comprehensive analysis
- Enable cost tracking per brief
- Cache briefs at tenant level
- Support user preference for brief length
