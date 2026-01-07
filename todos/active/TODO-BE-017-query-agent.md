# TODO-BE-017: Portfolio Query Agent

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-015

---

## Objective

Implement the Portfolio Query Agent that answers natural language questions about portfolios and securities.

---

## Tasks

### 1. Agent Signature Definition
- [ ] Create `src/arc/agents/portfolio_query.py`
- [ ] Define `PortfolioQuerySignature`:
  ```python
  class PortfolioQuerySignature(Signature):
      query: str = InputField(description="User's natural language question")
      portfolios: List[dict] = InputField(description="User's portfolio data")
      include_sources: bool = InputField(description="Include data sources in response")

      answer: str = OutputField(description="Natural language answer")
      confidence: float = OutputField(description="Answer confidence 0-1")
      data: dict = OutputField(description="Structured data backing answer")
      sources: List[str] = OutputField(description="Data sources used")
      follow_up_questions: List[str] = OutputField(description="Suggested follow-ups")
  ```

### 2. Query Agent Implementation
- [ ] Implement `PortfolioQueryAgent`:
  ```python
  class PortfolioQueryAgent(ARCBaseAgent):
      def __init__(self, db: DataFlow):
          config = QueryAgentConfig(
              model="gpt-4",
              temperature=0.3,  # More deterministic
              max_tokens=2000
          )
          super().__init__(db, config)

      async def answer(self, query: str, portfolios: List[dict], ...) -> dict:
          """Answer natural language query."""
          pass

      async def suggest_queries(self, recent_queries: List[str], ...) -> List[str]:
          """Suggest relevant follow-up queries."""
          pass

      def _classify_query(self, query: str) -> str:
          """Classify query type for routing."""
          pass
  ```

### 3. Query Classification
- [ ] Implement query type classification:
  - `allocation` - "What's my tech exposure?"
  - `performance` - "How has my portfolio performed?"
  - `holdings` - "What are my top holdings?"
  - `ratios` - "Which holdings have low P/E?"
  - `comparison` - "How do I compare to S&P?"
  - `alerts` - "Show me holdings with concerns"
  - `general` - Other queries

### 4. Data Retrieval
- [ ] Implement data fetchers per query type:
  - Holdings with enriched security data
  - Latest valuations and returns
  - Security ratios
  - Alerts and issues
  - Benchmark comparisons
- [ ] Build context from retrieved data

### 5. Answer Generation
- [ ] Generate natural language answers
- [ ] Include structured data backing
- [ ] Calculate confidence score
- [ ] Generate follow-up suggestions
- [ ] Handle "I don't know" gracefully

### 6. Query Logging
- [ ] Log all queries for learning
- [ ] Track confidence levels
- [ ] Identify frequently asked questions
- [ ] Support query analytics

---

## Acceptance Criteria

- [ ] Answers portfolio questions accurately
- [ ] Confidence scores reflect answer quality
- [ ] Structured data backs answers
- [ ] Follow-up suggestions relevant
- [ ] Query logging works
- [ ] Handles unknown queries gracefully
- [ ] Unit test: Query classification
- [ ] Unit test: Answer generation
- [ ] Integration test: Full query flow

---

## Query Examples

| Query | Type | Expected Answer |
|-------|------|-----------------|
| "What's my exposure to technology?" | allocation | "Your technology sector exposure is 35.2% ($1.2M across 8 holdings). Top holdings: AAPL (12%), MSFT (10%), GOOGL (8%)." |
| "Which holdings have declining profitability?" | ratios | "3 holdings show declining profitability trends: XYZ Corp (ROE dropped from 15% to 10%), ABC Inc (margins compressed 2%)..." |
| "How has my portfolio performed this year?" | performance | "Your portfolio is up 8.5% YTD, outperforming the S&P 500 (+7.2%) by 1.3%. Best performer: NVDA (+45%)." |
| "Show me holdings with concerns" | alerts | "2 holdings have active warnings: DEF Inc (debt/EBITDA above threshold), GHI Corp (current ratio below 1.0)." |

---

## Answer Structure

```json
{
    "query": "What's my tech exposure?",
    "answer": "Your technology sector exposure is 35.2%...",
    "confidence": 0.95,
    "data": {
        "sector_exposure": {
            "Technology": {"weight": 0.352, "value": 1200000},
            "Healthcare": {"weight": 0.15, "value": 512000}
        },
        "top_tech_holdings": [
            {"ticker": "AAPL", "weight": 0.12, "value": 408000},
            {"ticker": "MSFT", "weight": 0.10, "value": 340000}
        ]
    },
    "sources": ["holdings", "security_master", "latest_prices"],
    "follow_up_questions": [
        "How does my tech exposure compare to the benchmark?",
        "Which tech holdings have the best valuations?",
        "Should I rebalance my tech allocation?"
    ]
}
```

---

## Technical Notes

- Lower temperature (0.3) for more consistent answers
- Use RAG pattern for data retrieval
- Cache frequently asked query patterns
- Track query latency for optimization
