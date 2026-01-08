# TODO-BE-019: Investment Committee Agent

**Priority**: LOW
**Status**: COMPLETED
**Actual Effort**: ~6h
**Dependencies**: TODO-BE-016, TODO-BE-017, TODO-BE-018
**Completed**: 2026-01-08

---

## Objective

Implement the Investment Committee Agent that orchestrates multiple specialized agents using the Supervisor-Worker pattern to provide comprehensive investment recommendations.

---

## Implementation Summary

### Key Decision: Supervisor-Worker with Parallel Execution

The agent uses Kaizen orchestration patterns:
- **Parallel Worker Execution**: Workers run concurrently with configurable timeout
- **LLM-Based Synthesis**: Chain-of-thought reasoning for multi-perspective synthesis
- **Consensus Tracking**: Agreement levels (full, partial, split) with dissent documentation
- **Compliance Audit Trail**: SOC2-ready audit logging with compliance flags

### Architecture: Multi-Agent Orchestration

```
Committee Supervisor (InvestmentCommitteeAgent)
        │
        ├─→ MarketIntelligenceAgent: Market conditions and sentiment
        │
        ├─→ PortfolioQueryAgent: Current portfolio state and context
        │
        └─→ FinancialAnalystAgent: Security analysis and health scores
                    │
                    ▼
            LLM Synthesis → Recommendation + Audit Trail
```

---

## Completed Tasks

### 1. Agent Signatures ✅
- [x] Created `src/arc/agents/investment_committee.py`
- [x] Defined `CommitteeSynthesisSignature` with chain-of-thought outputs
- [x] Defined `AuditEntrySignature` for compliance logging

### 2. Investment Committee Agent Implementation ✅
- [x] Implemented `InvestmentCommitteeAgent(ARCBaseAgent)`:
  - Supervisor-Worker pattern with parallel execution
  - Lazy worker agent creation (on-demand)
  - Inherits DataFlow integration from ARCBaseAgent
  - Cost tracking across all workers

### 3. Request Types ✅
- [x] `rebalance` - Portfolio rebalancing suggestions
- [x] `buy` - Security purchase recommendations
- [x] `sell` - Security sale recommendations
- [x] `hold` - Hold vs action analysis
- [x] `risk_assessment` - Risk evaluation
- [x] `opportunity` - Opportunity identification

### 4. Multi-Agent Orchestration ✅
- [x] Parallel worker execution with `asyncio.gather()`
- [x] Configurable timeout per worker (default 60s)
- [x] Graceful failure handling (needs 2+ workers for viable result)
- [x] Sequential execution mode for debugging

### 5. Worker Agents ✅
- [x] MarketIntelligenceAgent: Market briefs and sentiment
- [x] PortfolioQueryAgent: Portfolio state queries
- [x] FinancialAnalystAgent: Security and portfolio analysis
- [x] All workers share DataFlow and SharedMemory

### 6. Consensus & Dissent Handling ✅
- [x] Three agreement levels: full, partial, split
- [x] Points of agreement/disagreement tracking
- [x] Dissenting views with rationale and merit
- [x] Transparent documentation of all perspectives

### 7. Constraint Validation ✅
- [x] Position size limits
- [x] Sector concentration limits
- [x] Quality thresholds (liquidity, leverage, health score)
- [x] Excluded sectors and securities
- [x] Risk tolerance profiles

### 8. Audit Trail ✅
- [x] Complete audit entry per decision
- [x] Agents consulted tracking
- [x] Token usage and cost tracking
- [x] Compliance flags (LOW_CONFIDENCE, CONSTRAINT_VIOLATION, etc.)
- [x] Execution time tracking

---

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/arc/agents/investment_committee.py` | Created | Full agent implementation (~1,100 lines) |
| `src/arc/agents/__init__.py` | Modified | Added 11 new exports |
| `tests/unit/agents/test_investment_committee.py` | Created | 68 comprehensive unit tests |
| `src/arc/docs/developers/16-investment-committee-agent.md` | Created | Developer documentation |

---

## Configuration

```python
@dataclass
class InvestmentCommitteeConfig(CommitteeAgentConfig):
    model: str = "gpt-4o"
    temperature: float = 0.3
    max_tokens: int = 10000
    strategy_type: str = "single_shot"
    budget_limit_usd: float = 25.0

    # Orchestration settings
    worker_timeout_seconds: float = 60.0
    parallel_execution: bool = True
    max_retries: int = 2

    # Consensus settings
    require_unanimous: bool = False
    min_confidence: float = 0.6
    min_agreement_ratio: float = 0.5

    # Audit settings
    enable_audit_trail: bool = True
    audit_retention_days: int = 365
```

---

## Testing

### Unit Tests: 68 tests passing
- Configuration tests (defaults, custom, Kaizen conversion)
- Enum verification (RequestType, AgentRole, VoteType)
- Data class tests (WorkerResult, InvestmentConstraints)
- Signature field verification
- Agent initialization tests
- Request type validation
- Constraint parsing and validation
- Portfolio query building
- Worker result viability checking
- Perspective formatting (market, portfolio, analyst)
- Synthesis response parsing (JSON, markdown-wrapped)
- Compliance flag generation
- Audit trail building
- Session cost tracking
- Error response structure
- Convenience method delegation
- Full recommendation flow (with mocked workers)
- Worker agent creation (lazy, singleton)

### Verification Command
```bash
uv run pytest tests/unit/agents/test_investment_committee.py -v
# 68 passed in 1.23s
```

---

## Recommendation Output Structure

```json
{
    "decision_id": "uuid",
    "portfolio_id": "port-001",
    "request_type": "rebalance",
    "generated_at": "2026-01-08T10:00:00Z",
    "recommendation": "Maintain current allocation with minor adjustments",
    "conviction": "medium",
    "analysis_summary": {
        "market_perspective": {...},
        "portfolio_perspective": {...},
        "analyst_perspective": {...}
    },
    "action_items": [...],
    "risk_considerations": [...],
    "consensus_analysis": {
        "agreement_level": "partial",
        "points_of_agreement": [...],
        "points_of_disagreement": [...]
    },
    "dissenting_views": [...],
    "constraints_validation": {...},
    "confidence": 0.85,
    "risk_warnings": "Standard risk disclosures",
    "audit_trail": {...},
    "_metadata": {...}
}
```

---

## Key Design Decisions

1. **Lazy Worker Creation**: Workers created on first use, not at init
2. **Parallel Execution by Default**: Workers run concurrently for speed
3. **Minimum 2 Workers Required**: Recommendations need at least 2 perspectives
4. **LLM Synthesis**: Chain-of-thought for synthesis, not mechanical aggregation
5. **Compliance-First Audit**: All decisions logged with flags for review
6. **Configurable Timeouts**: Per-worker and overall timeouts

---

## Documentation

- Developer Guide: `src/arc/docs/developers/16-investment-committee-agent.md`
- Covers architecture, configuration, request types, consensus handling, audit trails

---

## Acceptance Criteria Met ✅

- [x] Multi-agent orchestration works (Supervisor-Worker pattern)
- [x] All 6 request types supported
- [x] Synthesized recommendations coherent (LLM chain-of-thought)
- [x] Dissenting views captured with rationale and merit
- [x] Constraints respected (validation and flagging)
- [x] Audit trail complete (SOC2-ready)
- [x] Unit test: Task delegation (mocked workers)
- [x] Unit test: Synthesis logic (JSON parsing, confidence bounding)
- [x] Unit test: Full committee flow (68 tests passing)
