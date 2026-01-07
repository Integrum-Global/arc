# TODO-BE-020: Intelligence Service Implementation

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-BE-016, TODO-BE-017

---

## Objective

Implement the IntelligenceService that provides a unified interface to all Kaizen AI agents.

---

## Tasks

### 1. Service Definition
- [ ] Create `src/arc/services/intelligence_service.py`
- [ ] Implement `IntelligenceService`:
  ```python
  class IntelligenceService(BaseService):
      def __init__(self, db: DataFlow, tenant_id: Optional[str] = None):
          super().__init__(db, tenant_id)
          self.market_agent = MarketIntelligenceAgent(db)
          self.query_agent = PortfolioQueryAgent(db)
          self.analyst_agent = FinancialAnalystAgent(db)
  ```

### 2. Market Brief Methods
- [ ] Implement `generate_market_brief()`:
  - Get portfolio context if provided
  - Call market agent
  - Store brief for history
  - Return formatted brief
- [ ] Implement `stream_market_brief()`:
  - Streaming SSE for real-time UI
  - Yield chunks as generated
- [ ] Implement `get_brief_history()`:
  - List previous briefs
  - Filter by type and date

### 3. Natural Language Query Methods
- [ ] Implement `query_portfolio()`:
  - Get user's portfolios
  - Call query agent
  - Log query for learning
  - Return answer with sources
- [ ] Implement `suggest_queries()`:
  - Get recent user activity
  - Generate contextual suggestions

### 4. Security Analysis Methods
- [ ] Implement `analyze_security()`:
  - Fetch security data
  - Fetch fundamentals history
  - Fetch ratio history
  - Call analyst agent
  - Return comprehensive analysis
- [ ] Implement `detect_anomalies()`:
  - Get securities (from portfolio or all)
  - Call analyst agent
  - Create alerts for high severity
  - Return anomaly list

### 5. Research Methods
- [ ] Implement `research_topic()`:
  - Call market agent research
  - Return synthesis with sources

### 6. Usage Tracking
- [ ] Track all AI usage:
  - Tokens used
  - Cost per call
  - Response latency
- [ ] Implement monthly limits per tenant

---

## Acceptance Criteria

- [ ] All agent capabilities accessible via service
- [ ] Brief generation with portfolio context
- [ ] Streaming for real-time UI
- [ ] Query with confidence scores
- [ ] Analysis with health scores
- [ ] Anomaly detection with alerts
- [ ] Usage tracking complete
- [ ] Unit test: Brief generation
- [ ] Unit test: Query handling
- [ ] Unit test: Analysis flow
- [ ] Integration test: Full service usage

---

## API Signatures

```python
class IntelligenceService(BaseService):
    # Market Briefs
    async def generate_market_brief(
        self,
        brief_type: str = "daily",
        topics: Optional[List[str]] = None,
        portfolio_id: Optional[str] = None,
        format: str = "summary"
    ) -> dict

    async def stream_market_brief(
        self,
        brief_type: str = "daily",
        topics: Optional[List[str]] = None
    ) -> AsyncIterator[str]

    # Natural Language Queries
    async def query_portfolio(
        self,
        user_id: str,
        query: str,
        portfolio_id: Optional[str] = None,
        include_sources: bool = True
    ) -> dict

    async def suggest_queries(
        self,
        user_id: str,
        context: Optional[str] = None
    ) -> List[str]

    # Security Analysis
    async def analyze_security(
        self,
        security_id: str,
        analysis_type: str = "comprehensive"
    ) -> dict

    async def detect_anomalies(
        self,
        portfolio_id: Optional[str] = None,
        lookback_days: int = 90
    ) -> List[dict]

    # Research
    async def research_topic(
        self,
        topic: str,
        depth: str = "standard",
        sources: Optional[List[str]] = None
    ) -> dict
```

---

## Usage Tracking Schema

```python
# Usage record per call
{
    "id": "usage-20260107-001",
    "tenant_id": "tenant-001",
    "user_id": "user-001",
    "agent": "market_intelligence",
    "method": "generate_brief",
    "input_tokens": 500,
    "output_tokens": 2000,
    "total_tokens": 2500,
    "cost_usd": 0.15,
    "latency_ms": 3500,
    "timestamp": "2026-01-07T10:00:00Z"
}

# Monthly aggregation
{
    "tenant_id": "tenant-001",
    "month": "2026-01",
    "total_tokens": 500000,
    "total_cost": 30.00,
    "limit_tokens": 1000000,
    "limit_cost": 100.00
}
```

---

## Technical Notes

- Cache frequent queries (5 min TTL)
- Stream long-running operations
- Track costs for billing
- Apply tenant limits
- Log all queries for model improvement
