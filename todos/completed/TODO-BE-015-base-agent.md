# TODO-BE-015: Base Agent and Memory Setup

**Priority**: MEDIUM
**Status**: COMPLETED
**Completed Date**: 2026-01-07
**Actual Effort**: ~6h
**Dependencies**: TODO-BE-009

---

## Objective

Implement the base Kaizen agent class and shared memory pool for all ARC AI agents.

---

## Completed Tasks

### 1. ARCBaseAgent Class ✅
- [x] Created `src/arc/agents/base.py`
- [x] Implemented `ARCBaseAgent` extending Kaizen `BaseAgent`
- [x] Added DataFlow integration for database operations
- [x] Implemented common helper methods:
  - `get_portfolio_context()` - Load portfolio data with holdings, transactions, valuations
  - `get_security_context()` - Load security data with prices, fundamentals, ratios
  - `get_multi_security_context()` - Load multiple securities
  - `get_market_context()` - Load market overview
  - `format_currency()` - Format monetary values ($1,234.56)
  - `format_percentage()` - Format percentages (5.25%)
  - `format_ratio()` - Format ratios (1.50x)
  - `format_large_number()` - Format large numbers (1.5B, 250M)

### 2. Agent Configuration ✅
- [x] Created `src/arc/agents/config.py`
- [x] Implemented `ARCAgentConfig` with sensible defaults for financial analysis
- [x] Implemented specialized configs:
  - `MarketAgentConfig` - Higher temp, 6K tokens, multi_cycle
  - `QueryAgentConfig` - gpt-4o-mini, low temp, 2K tokens
  - `AnalystAgentConfig` - 8K tokens, multi_cycle, 10 max_cycles
  - `CommitteeAgentConfig` - 10K tokens, $25 budget, 15 max_cycles
- [x] Added `to_kaizen_config()` for Kaizen compatibility

### 3. Investment Signatures ✅
- [x] `PortfolioAnalysisSignature` - Portfolio analysis with metrics, recommendations, risk warnings
- [x] `SecurityAnalysisSignature` - Security analysis with rating, price target, risks
- [x] `MarketQuerySignature` - Natural language queries with confidence levels
- [x] `InvestmentRecommendationSignature` - Investment recommendations with rationale

### 4. Shared Memory Pool ✅
- [x] Created `src/arc/agents/memory.py`
- [x] Implemented `ARCMemoryPool` wrapping Kaizen's SharedMemoryPool
- [x] Implemented `MemoryConfig` for configuration
- [x] Added memory operations:
  - `write_insight()` - Write insights to hot tier with metadata
  - `read_relevant()` - Read insights filtered by tags, importance, segments
  - `read_all()` - Read all insights from hot tier
  - `clear()` - Clear all insights
  - `get_stats()` - Get memory statistics
- [x] Added conversation memory:
  - `add_conversation_message()` - Add chat messages
  - `get_conversation_history()` - Get conversation history
- [x] Added portfolio memory:
  - `add_portfolio_insight()` - Add portfolio-specific insights
  - `get_portfolio_insights()` - Get portfolio insights
- [x] Added async persistence methods for warm tier

### 5. Agent Registry ✅
- [x] Created `src/arc/agents/registry.py`
- [x] Implemented `ARCAgentRegistry` with:
  - Lazy agent creation and caching
  - Factory pattern for agent types
  - `get_agent()` - Get or create agent instance
  - `list_agents()` - List available agent types
  - `has_agent()` - Check if agent exists
  - `remove_agent()` - Remove agent from cache
  - `clear_agents()` - Clear all cached agents
- [x] Implemented `AgentType` enum (MARKET, QUERY, ANALYST, COMMITTEE)
- [x] Implemented `AgentStats` dataclass for tracking

### 6. Cost Tracking ✅
- [x] Integrated Kaizen's CostTrackingHook when hooks_enabled=True
- [x] Added `get_total_cost()` - Total cost for agent session
- [x] Added `get_cost_breakdown()` - Detailed cost breakdown
- [x] Added `reset_costs()` - Reset cost tracking
- [x] Registry-level cost aggregation:
  - `get_total_cost()` - Total across all agents
  - `get_cost_by_type()` - Cost by agent type
  - `get_cost_by_agent()` - Cost by agent instance

---

## Verification

### Files Created
- `src/arc/agents/config.py` - Agent configurations
- `src/arc/agents/base.py` - ARCBaseAgent and signatures
- `src/arc/agents/memory.py` - ARCMemoryPool
- `src/arc/agents/registry.py` - ARCAgentRegistry
- `src/arc/agents/__init__.py` - Package exports

### Tests
- `tests/unit/agents/test_agents.py` - 64 tests passing

### Documentation
- `src/arc/docs/developers/12-agent-infrastructure.md`

### Verification Commands
```bash
# Run agent tests
uv run pytest tests/unit/agents/ -v

# Run all unit tests (754 passing)
uv run pytest tests/unit/ --tb=short

# Run linting
uv run ruff check src/arc/agents/
```

---

## Technical Notes

- Uses Kaizen's BaseAgent with signature-based programming
- Low temperature (0.1-0.3) for consistent financial analysis
- Automatic risk warning validation in outputs
- Memory tiers: Hot (RAM via SharedMemoryPool) → Warm (DataFlow ready)
- Multi-tenant support via tenant_id in registry and memory
