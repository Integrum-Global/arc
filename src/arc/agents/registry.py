"""
ARCAgentRegistry - Registry for managing ARC investment agents.

Wraps Kaizen's AgentRegistry with ARC-specific agent types and
configuration management.

CRITICAL RULES:
- Agents are created lazily on first request
- All agents share the same DataFlow and memory pool
- Cost tracking is aggregated across agents
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from arc.agents.base import ARCBaseAgent
from arc.agents.config import (
    AnalystAgentConfig,
    ARCAgentConfig,
    CommitteeAgentConfig,
    MarketAgentConfig,
    QueryAgentConfig,
)
from arc.agents.memory import ARCMemoryPool

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    """Available agent types in ARC platform."""

    MARKET = "market"  # Market intelligence agent
    QUERY = "query"  # Portfolio query agent
    ANALYST = "analyst"  # Financial analyst agent
    COMMITTEE = "committee"  # Investment committee agent


@dataclass
class AgentStats:
    """Statistics for an agent instance."""

    agent_id: str
    agent_type: AgentType
    created_at: str
    invocation_count: int = 0
    total_cost_usd: float = 0.0
    last_invoked_at: str | None = None
    errors: int = 0


class ARCAgentRegistry:
    """
    Registry for managing ARC investment agents.

    Provides:
    - Lazy agent creation and caching
    - Shared DataFlow and memory pool
    - Cost tracking aggregation
    - Agent lifecycle management

    Usage:
        >>> from dataflow import DataFlow
        >>> from arc.agents.registry import ARCAgentRegistry, AgentType
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> registry = ARCAgentRegistry(db, tenant_id="tenant-001")
        >>>
        >>> # Get agent (creates if not exists)
        >>> analyst = registry.get_agent(AgentType.ANALYST)
        >>>
        >>> # Run agent
        >>> result = await analyst.run_async(portfolio_id="port-001")
        >>>
        >>> # Get aggregate stats
        >>> stats = registry.get_stats()
    """

    def __init__(
        self,
        db: Any,  # DataFlow instance
        tenant_id: str | None = None,
        memory_pool: ARCMemoryPool | None = None,
        default_config: ARCAgentConfig | None = None,
    ) -> None:
        """
        Initialize agent registry.

        Args:
            db: DataFlow database instance
            tenant_id: Tenant ID for multi-tenant isolation
            memory_pool: Shared memory pool (created if not provided)
            default_config: Default configuration for agents
        """
        self.db = db
        self.tenant_id = tenant_id
        self.default_config = default_config or ARCAgentConfig()

        # Create or use provided memory pool
        self.memory_pool = memory_pool or ARCMemoryPool(db, tenant_id=tenant_id)

        # Agent instance cache
        self._agents: dict[str, ARCBaseAgent] = {}
        self._agent_stats: dict[str, AgentStats] = {}

        # Agent factory registry
        self._factories: dict[AgentType, Callable[[], ARCBaseAgent]] = {}

        # Register default factories
        self._register_default_factories()

        logger.info(
            "ARCAgentRegistry initialized",
            extra={"tenant_id": tenant_id},
        )

    def _register_default_factories(self) -> None:
        """Register default agent factories."""
        # These will be replaced when specialized agents are implemented
        # For now, they create base agents with appropriate configs

        def create_market_agent() -> ARCBaseAgent:
            from arc.agents.base import MarketQuerySignature

            config = MarketAgentConfig()
            return ARCBaseAgent(
                config=config,
                signature=MarketQuerySignature(),
                db=self.db,
                shared_memory=self.memory_pool._hot_pool,
                agent_id=f"market_{self.tenant_id}_{datetime.now(UTC).strftime('%H%M%S')}",
            )

        def create_query_agent() -> ARCBaseAgent:
            from arc.agents.base import MarketQuerySignature

            config = QueryAgentConfig()
            return ARCBaseAgent(
                config=config,
                signature=MarketQuerySignature(),
                db=self.db,
                shared_memory=self.memory_pool._hot_pool,
                agent_id=f"query_{self.tenant_id}_{datetime.now(UTC).strftime('%H%M%S')}",
            )

        def create_analyst_agent() -> ARCBaseAgent:
            from arc.agents.base import PortfolioAnalysisSignature

            config = AnalystAgentConfig()
            return ARCBaseAgent(
                config=config,
                signature=PortfolioAnalysisSignature(),
                db=self.db,
                shared_memory=self.memory_pool._hot_pool,
                agent_id=f"analyst_{self.tenant_id}_{datetime.now(UTC).strftime('%H%M%S')}",
            )

        def create_committee_agent() -> ARCBaseAgent:
            from arc.agents.base import InvestmentRecommendationSignature

            config = CommitteeAgentConfig()
            return ARCBaseAgent(
                config=config,
                signature=InvestmentRecommendationSignature(),
                db=self.db,
                shared_memory=self.memory_pool._hot_pool,
                agent_id=f"committee_{self.tenant_id}_{datetime.now(UTC).strftime('%H%M%S')}",
            )

        self._factories[AgentType.MARKET] = create_market_agent
        self._factories[AgentType.QUERY] = create_query_agent
        self._factories[AgentType.ANALYST] = create_analyst_agent
        self._factories[AgentType.COMMITTEE] = create_committee_agent

    # =========================================================================
    # Agent Management
    # =========================================================================

    def get_agent(
        self,
        agent_type: AgentType,
        create_new: bool = False,
    ) -> ARCBaseAgent:
        """
        Get or create an agent of the specified type.

        Args:
            agent_type: Type of agent to get
            create_new: Force creation of new instance

        Returns:
            Agent instance

        Raises:
            ValueError: If agent type is not registered
        """
        cache_key = f"{agent_type.value}_{self.tenant_id}"

        if not create_new and cache_key in self._agents:
            return self._agents[cache_key]

        if agent_type not in self._factories:
            raise ValueError(f"Unknown agent type: {agent_type}")

        # Create new agent
        agent = self._factories[agent_type]()

        # Cache and track
        self._agents[cache_key] = agent
        self._agent_stats[cache_key] = AgentStats(
            agent_id=agent.agent_id,
            agent_type=agent_type,
            created_at=datetime.now(UTC).isoformat(),
        )

        logger.info(
            f"Created agent: {agent.agent_id}",
            extra={"agent_type": agent_type.value, "tenant_id": self.tenant_id},
        )

        return agent

    def register_factory(
        self,
        agent_type: AgentType,
        factory: Callable[[], ARCBaseAgent],
    ) -> None:
        """
        Register a custom agent factory.

        Args:
            agent_type: Type of agent
            factory: Factory function that creates the agent
        """
        self._factories[agent_type] = factory
        logger.info(f"Registered factory for: {agent_type.value}")

    def list_agents(self) -> list[str]:
        """List all registered agent types."""
        return [t.value for t in AgentType]

    def list_active_agents(self) -> list[str]:
        """List agent IDs of currently active (cached) agents."""
        return list(self._agents.keys())

    def has_agent(self, agent_type: AgentType) -> bool:
        """Check if an agent of the given type is cached."""
        cache_key = f"{agent_type.value}_{self.tenant_id}"
        return cache_key in self._agents

    def remove_agent(self, agent_type: AgentType) -> bool:
        """
        Remove an agent from the cache.

        Args:
            agent_type: Type of agent to remove

        Returns:
            True if agent was removed, False if not found
        """
        cache_key = f"{agent_type.value}_{self.tenant_id}"
        if cache_key in self._agents:
            del self._agents[cache_key]
            logger.info(f"Removed agent: {cache_key}")
            return True
        return False

    def clear_agents(self) -> None:
        """Clear all cached agents."""
        self._agents.clear()
        logger.info("Cleared all cached agents")

    # =========================================================================
    # Cost Tracking
    # =========================================================================

    def get_total_cost(self) -> float:
        """Get total cost across all agents."""
        total = 0.0
        for agent in self._agents.values():
            total += agent.get_total_cost()
        return total

    def get_cost_by_agent(self) -> dict[str, float]:
        """Get cost breakdown by agent."""
        return {key: agent.get_total_cost() for key, agent in self._agents.items()}

    def get_cost_by_type(self) -> dict[str, float]:
        """Get cost breakdown by agent type."""
        costs: dict[str, float] = {}
        for key, agent in self._agents.items():
            agent_type = key.split("_")[0]
            if agent_type not in costs:
                costs[agent_type] = 0.0
            costs[agent_type] += agent.get_total_cost()
        return costs

    def reset_costs(self) -> None:
        """Reset cost tracking for all agents."""
        for agent in self._agents.values():
            agent.reset_costs()

    # =========================================================================
    # Statistics
    # =========================================================================

    def get_stats(self) -> dict[str, Any]:
        """
        Get aggregate statistics for the registry.

        Returns:
            Dict with agent counts, costs, and memory stats
        """
        return {
            "tenant_id": self.tenant_id,
            "registered_types": len(self._factories),
            "active_agents": len(self._agents),
            "total_cost_usd": self.get_total_cost(),
            "cost_by_type": self.get_cost_by_type(),
            "memory_stats": self.memory_pool.get_stats(),
            "agents": {
                key: {
                    "agent_id": self._agent_stats[key].agent_id,
                    "type": self._agent_stats[key].agent_type.value,
                    "created_at": self._agent_stats[key].created_at,
                    "invocations": self._agent_stats[key].invocation_count,
                    "cost_usd": agent.get_total_cost(),
                }
                for key, agent in self._agents.items()
                if key in self._agent_stats
            },
        }

    def get_agent_stats(self, agent_type: AgentType) -> AgentStats | None:
        """Get statistics for a specific agent type."""
        cache_key = f"{agent_type.value}_{self.tenant_id}"
        return self._agent_stats.get(cache_key)

    # =========================================================================
    # Lifecycle
    # =========================================================================

    async def start(self) -> None:
        """
        Start the registry (load warm tier memory, etc.).

        Call this during application startup.
        """
        # Load recent insights from warm tier
        if self.memory_pool.config.warm_tier_enabled:
            await self.memory_pool.load_from_warm_tier_async()

        logger.info("ARCAgentRegistry started")

    async def shutdown(self) -> None:
        """
        Shutdown the registry (persist memory, cleanup).

        Call this during application shutdown.
        """
        # Persist any pending insights
        await self.memory_pool.persist_async()

        # Clear agent cache
        self.clear_agents()

        logger.info("ARCAgentRegistry shutdown complete")


# =============================================================================
# Convenience Functions
# =============================================================================


def create_registry(
    db: Any,
    tenant_id: str | None = None,
) -> ARCAgentRegistry:
    """
    Create a new agent registry with default configuration.

    Args:
        db: DataFlow database instance
        tenant_id: Optional tenant ID

    Returns:
        Configured ARCAgentRegistry
    """
    return ARCAgentRegistry(db, tenant_id=tenant_id)


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    "ARCAgentRegistry",
    "AgentType",
    "AgentStats",
    "create_registry",
]
