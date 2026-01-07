# TODO-BE-019: Investment Committee Agent

**Priority**: LOW
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-BE-016, TODO-BE-017, TODO-BE-018

---

## Objective

Implement the Investment Committee Agent that orchestrates multiple specialized agents using the Supervisor-Worker pattern to provide comprehensive investment recommendations.

---

## Tasks

### 1. Agent Signature Definition
- [ ] Create `src/arc/agents/investment_committee.py`
- [ ] Define `InvestmentRecommendationSignature`:
  ```python
  class InvestmentRecommendationSignature(Signature):
      portfolio_id: str = InputField(description="Target portfolio")
      request_type: str = InputField(description="Recommendation type")
      constraints: Optional[dict] = InputField(description="Investment constraints")

      recommendation: str = OutputField(description="Overall recommendation")
      analysis_summary: dict = OutputField(description="Multi-perspective analysis")
      action_items: List[dict] = OutputField(description="Specific actions")
      risk_considerations: List[str] = OutputField(description="Risk factors")
      dissenting_views: List[str] = OutputField(description="Alternative perspectives")
      confidence: float = OutputField(description="Committee confidence")
  ```

### 2. Supervisor Agent Implementation
- [ ] Implement `InvestmentCommitteeAgent` as supervisor:
  ```python
  from kaizen.orchestration.pipeline import Pipeline

  class InvestmentCommitteeAgent(ARCBaseAgent):
      def __init__(self, db: DataFlow, registry: AgentRegistry):
          self.market_agent = registry.get_agent("market")
          self.query_agent = registry.get_agent("query")
          self.analyst_agent = registry.get_agent("analyst")

          # Set up supervisor-worker pipeline
          self.pipeline = Pipeline.supervisor_worker(
              supervisor=self,
              workers=[
                  self.market_agent,
                  self.query_agent,
                  self.analyst_agent
              ]
          )

      async def recommend(self, portfolio_id: str, request_type: str, ...) -> dict:
          """Generate committee recommendation."""
          pass
  ```

### 3. Request Types
- [ ] Implement recommendation types:
  - `rebalance` - Portfolio rebalancing suggestion
  - `buy` - Security buy recommendation
  - `sell` - Security sell recommendation
  - `hold` - Hold vs action analysis
  - `risk_assessment` - Risk evaluation
  - `opportunity` - Opportunity identification

### 4. Multi-Agent Orchestration
- [ ] Implement task delegation:
  ```
  Committee Supervisor
       │
       ├─→ Market Agent: "Analyze market conditions"
       │
       ├─→ Query Agent: "Get portfolio current state"
       │
       └─→ Analyst Agent: "Analyze relevant securities"

  Synthesis: Combine perspectives into recommendation
  ```
- [ ] Collect and synthesize worker outputs
- [ ] Handle conflicting opinions
- [ ] Document dissenting views

### 5. Recommendation Logic
- [ ] Implement decision framework:
  - Aggregate worker analyses
  - Weight by relevance and confidence
  - Identify consensus and conflicts
  - Generate actionable items
  - Calculate overall confidence
- [ ] Risk consideration integration
- [ ] Constraint validation

### 6. Dissent Handling
- [ ] Track when agents disagree
- [ ] Document alternative perspectives
- [ ] Present balanced view to user

### 7. Audit Trail
- [ ] Log all agent interactions
- [ ] Track decision rationale
- [ ] Store for compliance review

---

## Acceptance Criteria

- [ ] Multi-agent orchestration works
- [ ] All request types supported
- [ ] Synthesized recommendations coherent
- [ ] Dissenting views captured
- [ ] Constraints respected
- [ ] Audit trail complete
- [ ] Unit test: Task delegation
- [ ] Unit test: Synthesis logic
- [ ] Integration test: Full committee flow

---

## Recommendation Output Structure

```json
{
    "portfolio_id": "pf-growth-001",
    "request_type": "rebalance",
    "generated_at": "2026-01-07T10:00:00Z",
    "recommendation": "Recommend modest rebalancing to reduce technology concentration from 35% to 30% and increase healthcare exposure",
    "analysis_summary": {
        "market_perspective": {
            "agent": "market_intelligence",
            "summary": "Tech sector facing headwinds from rate environment",
            "confidence": 0.85
        },
        "portfolio_perspective": {
            "agent": "portfolio_query",
            "summary": "Current tech overweight vs target allocation",
            "confidence": 0.95
        },
        "security_perspective": {
            "agent": "financial_analyst",
            "summary": "MSFT and GOOGL showing strongest fundamentals in tech holdings",
            "confidence": 0.88
        }
    },
    "action_items": [
        {
            "action": "sell",
            "security": "AAPL",
            "amount": "5% of position",
            "rationale": "Reduce concentration, near fair value"
        },
        {
            "action": "buy",
            "security": "JNJ",
            "amount": "$50,000",
            "rationale": "Increase healthcare, defensive positioning"
        }
    ],
    "risk_considerations": [
        "Tech reduction may underperform if sector rallies",
        "Healthcare faces regulatory uncertainty",
        "Transaction costs estimated at $500"
    ],
    "dissenting_views": [
        "Market agent notes tech often outperforms in year following rate pause"
    ],
    "confidence": 0.82,
    "audit_trail": {
        "agents_consulted": ["market", "query", "analyst"],
        "deliberation_rounds": 2,
        "total_tokens": 5400,
        "cost_usd": 0.32
    }
}
```

---

## Orchestration Flow

```
1. Receive Request
   └─→ Validate constraints
   └─→ Determine required perspectives

2. Delegate to Workers (Parallel)
   ├─→ Market Agent: Market analysis
   ├─→ Query Agent: Portfolio state
   └─→ Analyst Agent: Security analysis

3. Collect Responses
   └─→ Wait for all workers
   └─→ Handle timeouts/failures

4. Synthesize
   └─→ Identify consensus
   └─→ Resolve conflicts
   └─→ Weight by confidence

5. Generate Recommendation
   └─→ Action items
   └─→ Risk considerations
   └─→ Dissenting views

6. Audit
   └─→ Log decision trail
   └─→ Record costs
```

---

## Technical Notes

- Use Kaizen Supervisor-Worker pattern
- Enable parallel worker execution
- Set reasonable timeouts (30s per worker)
- Track costs across all workers
- Store recommendations for compliance
