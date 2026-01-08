# TODO-BE-017: Portfolio Query Agent

**Priority**: MEDIUM
**Status**: COMPLETED
**Actual Effort**: ~6h
**Dependencies**: TODO-BE-015
**Completed**: 2026-01-07

---

## Objective

Implement the Portfolio Query Agent that answers natural language questions about portfolios and securities using LLM-based semantic classification.

---

## Implementation Summary

### Key Decision: LLM-Based Classification (Not Keywords/Regex)

The agent uses semantic LLM classification instead of naive NLP approaches:
- **ClassifyQuerySignature**: Structured JSON output for query classification
- **Semantic Understanding**: LLM understands query intent, not just keywords
- **Entity Extraction**: Extracts securities, timeframes, metrics from queries
- **Confidence Scoring**: Transparent confidence with reasoning

### Architecture: RAG Pattern

```
Query → LLM Classification → Type-Specific Data Retrieval → LLM Answer Generation
         (Step 1)               (Step 2)                      (Step 3)
```

---

## Completed Tasks

### 1. Agent Signature Definitions ✅
- [x] Created `src/arc/agents/portfolio_query.py`
- [x] Defined `ClassifyQuerySignature` for LLM-based classification:
  ```python
  class ClassifyQuerySignature(Signature):
      query: str = InputField(...)
      portfolio_context: str = InputField(...)
      classification: str = OutputField(...)  # JSON: query_type, confidence, reasoning, entities
  ```
- [x] Defined `PortfolioAnswerSignature` for answer generation:
  ```python
  class PortfolioAnswerSignature(Signature):
      query: str = InputField(...)
      query_type: str = InputField(...)
      retrieved_data: str = InputField(...)
      response: str = OutputField(...)  # JSON: answer, confidence, data_points, follow_up_suggestions
  ```

### 2. Query Agent Implementation ✅
- [x] Implemented `PortfolioQueryAgent(ARCBaseAgent)`:
  - Dual-agent architecture: classifier + responder
  - Inherits DataFlow integration from ARCBaseAgent
  - Cost tracking and memory pool support
- [x] Core methods:
  - `query()` - Main entry point for natural language queries
  - `suggest_queries()` - Generate contextual query suggestions

### 3. LLM-Based Query Classification ✅
- [x] Implemented 7 semantic query types:
  - `allocation` - Sector/asset class breakdowns
  - `performance` - Returns, P&L, benchmarks
  - `holdings` - Position details, cost basis
  - `ratios` - Valuation metrics, risk ratios
  - `comparison` - Benchmark comparisons
  - `alerts` - Events, warnings, changes
  - `general` - Portfolio overviews
- [x] Low confidence fallback to `general` type
- [x] Entity extraction (securities, timeframes, metrics)

### 4. Type-Specific Data Retrieval ✅
- [x] `_get_allocation_data()` - Sectors, asset classes, weights
- [x] `_get_performance_data()` - Returns, P&L, comparisons
- [x] `_get_holdings_data()` - Positions with unrealized gains
- [x] `_get_ratios_data()` - Valuation metrics
- [x] `_get_comparison_data()` - Benchmark analysis
- [x] `_get_alerts_data()` - Recent events, warnings
- [x] `_get_portfolio_summary()` - General overview

### 5. Answer Generation ✅
- [x] LLM-based natural language answer generation
- [x] Confidence scoring (0.0-1.0) with bounds validation
- [x] Data points extraction for transparency
- [x] Follow-up suggestions for conversational flow
- [x] Low-confidence caveats when confidence < threshold

### 6. Query Logging & Analytics ✅
- [x] `QueryLogEntry` dataclass for comprehensive logging
- [x] Configurable max log size (default 1000)
- [x] Analytics calculation:
  - Total/successful queries
  - Success rate
  - Query type distribution
  - Average classification confidence
  - Average processing time

---

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/arc/agents/portfolio_query.py` | Created | Full agent implementation |
| `src/arc/agents/__init__.py` | Modified | Added exports for all query agent components |
| `tests/unit/agents/test_portfolio_query.py` | Created | 50 comprehensive unit tests |
| `src/arc/docs/developers/14-portfolio-query-agent.md` | Created | Developer documentation |

---

## Configuration

```python
@dataclass
class PortfolioQueryConfig(ARCAgentConfig):
    model: str = "gpt-4o-mini"
    temperature: float = 0.1
    classification_model: str = "gpt-4o-mini"
    classification_temperature: float = 0.0  # Deterministic
    min_confidence_threshold: float = 0.5
    max_holdings: int = 50
    enable_query_logging: bool = True
    max_query_log_size: int = 1000
```

---

## Testing

### Unit Tests: 50 tests passing
- Configuration tests
- QueryType enumeration tests
- Signature field verification
- Agent initialization tests
- Query classification (LLM-based, JSON parsing, error handling)
- Data retrieval per query type
- Answer generation with confidence scoring
- Query analytics tests
- Edge cases (missing data, errors, limits)

### Verification Command
```bash
uv run pytest tests/unit/agents/test_portfolio_query.py -v
# 50 passed in 0.75s
```

---

## Response Structure

```json
{
    "answer": "Your portfolio has 45% allocated to Technology...",
    "query_type": "allocation",
    "confidence": 0.92,
    "data_points": [
        "Technology: 45% ($225,000)",
        "Healthcare: 25% ($125,000)"
    ],
    "follow_up_suggestions": [
        "How does this compare to my target allocation?",
        "What's the performance of my tech holdings?"
    ],
    "classification": {
        "query_type": "allocation",
        "confidence": 0.95,
        "reasoning": "User asking about sector breakdown",
        "entities": {"securities": [], "timeframe": null, "metrics": ["sector"]}
    },
    "_metadata": {
        "processing_time_ms": 450,
        "agent_id": "portfolio_query"
    }
}
```

---

## Key Design Decisions

1. **LLM Classification over Keywords**: Semantic understanding of queries, not brittle pattern matching
2. **Dual-Agent Architecture**: Separate classifier (deterministic temp=0) and responder (temp=0.1)
3. **RAG Pattern**: Classify → Retrieve → Generate ensures relevant data in context
4. **Confidence Transparency**: All responses include confidence with reasoning
5. **Query Analytics**: Logging enables FAQ detection and optimization

---

## Documentation

- Developer Guide: `src/arc/docs/developers/14-portfolio-query-agent.md`
- Covers architecture, configuration, usage examples, analytics, best practices

---

## Acceptance Criteria Met ✅

- [x] Answers portfolio questions accurately via LLM classification
- [x] Confidence scores reflect answer quality
- [x] Structured data backs answers
- [x] Follow-up suggestions relevant
- [x] Query logging works
- [x] Handles unknown queries gracefully (general fallback)
- [x] Unit test: Query classification
- [x] Unit test: Answer generation
- [x] Unit tests: Full coverage (50 tests)
