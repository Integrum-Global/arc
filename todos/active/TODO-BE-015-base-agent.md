# TODO-BE-015: Base Agent and Memory Setup

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-009

---

## Objective

Implement the base Kaizen agent class and shared memory pool for all ARC AI agents.

---

## Tasks

### 1. ARCBaseAgent Class
- [ ] Create `src/arc/agents/base.py`
- [ ] Implement `ARCBaseAgent` extending Kaizen `BaseAgent`:
  ```python
  from kaizen.core.base_agent import BaseAgent
  from kaizen.signatures import Signature

  class ARCBaseAgent(BaseAgent):
      def __init__(self, db: DataFlow, config: AgentConfig):
          self.db = db
          super().__init__(config=config, signature=self.get_signature())

      @abstractmethod
      def get_signature(self) -> Signature:
          """Return agent's signature definition."""
          pass

      async def get_portfolio_context(self, portfolio_id: str) -> dict:
          """Get portfolio data for context."""
          pass

      async def get_security_context(self, security_id: str) -> dict:
          """Get security data for context."""
          pass
  ```
- [ ] Add common helper methods:
  - `get_portfolio_context()` - Load portfolio data
  - `get_security_context()` - Load security data
  - `format_currency()` - Format monetary values
  - `format_ratio()` - Format ratio values

### 2. Agent Configuration
- [ ] Create `src/arc/agents/config.py`
- [ ] Define configuration dataclasses:
  ```python
  @dataclass
  class AgentConfig:
      llm_provider: str = "openai"
      model: str = "gpt-4"
      temperature: float = 0.7
      max_tokens: int = 2000
      timeout_seconds: int = 60
  ```
- [ ] Define specialized configs:
  - `MarketAgentConfig`
  - `QueryAgentConfig`
  - `AnalystAgentConfig`
  - `CommitteeAgentConfig`

### 3. Shared Memory Pool
- [ ] Create `src/arc/agents/memory.py`
- [ ] Implement shared memory using Kaizen's memory system:
  ```python
  from kaizen.memory import SharedMemoryPool

  class ARCMemoryPool:
      def __init__(self, db: DataFlow):
          self.db = db
          self.pool = SharedMemoryPool(
              hot_tier_size=100,  # Last 100 messages in memory
              warm_tier_backend="dataflow",
              cold_tier_backend="s3"
          )
  ```
- [ ] Implement memory types:
  - Conversation memory - Recent chat history
  - Portfolio memory - User's portfolio preferences
  - Market memory - Cached market insights
  - Query memory - Previous queries and answers
- [ ] Add memory persistence to DataFlow

### 4. Agent Registry
- [ ] Create `src/arc/agents/__init__.py`
- [ ] Implement agent registration:
  ```python
  class AgentRegistry:
      def __init__(self, db: DataFlow, memory_pool: ARCMemoryPool):
          self._agents = {}
          self.db = db
          self.memory = memory_pool

      def get_agent(self, agent_type: str) -> ARCBaseAgent:
          """Get or create agent instance."""
          pass

      def list_agents(self) -> List[str]:
          """List available agent types."""
          pass
  ```

### 5. Cost Tracking Setup
- [ ] Configure cost tracking per agent
- [ ] Implement cost aggregation for tenant
- [ ] Add cost alerts/limits

---

## Acceptance Criteria

- [ ] ARCBaseAgent extends Kaizen BaseAgent correctly
- [ ] Shared memory persists across sessions
- [ ] Memory tiers work (hot → warm → cold)
- [ ] Cost tracking records all API calls
- [ ] Agent registry manages instances
- [ ] Unit test: Agent initialization
- [ ] Unit test: Memory storage/retrieval
- [ ] Unit test: Cost tracking
- [ ] Integration test: Agent execution

---

## Agent Architecture

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

---

## Technical Notes

- Use Kaizen signature-based programming for type safety
- Enable hooks for observability
- Configure streaming for long responses
- Memory should support cross-session continuity
