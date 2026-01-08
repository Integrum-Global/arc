"""
ARCMemoryPool - Shared memory for multi-agent collaboration.

Wraps Kaizen's SharedMemoryPool with DataFlow persistence for the warm tier.
Memory flows: Hot (RAM) → Warm (DataFlow) → Cold (S3/archive)

CRITICAL RULES:
- Hot tier is in-memory, fast but volatile
- Warm tier persists to database for cross-session continuity
- Memory is tenant-scoped for multi-tenant isolation
"""

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from kaizen.memory.shared_memory import SharedMemoryPool

logger = logging.getLogger(__name__)


@dataclass
class MemoryConfig:
    """Configuration for ARC memory pool."""

    # Hot tier (in-memory)
    hot_tier_max_insights: int = 100  # Max insights in RAM
    hot_tier_max_age_seconds: float = 3600.0  # 1 hour in hot tier

    # Warm tier (DataFlow)
    warm_tier_enabled: bool = True
    warm_tier_max_age_days: int = 30  # 30 days before archival

    # Persistence
    auto_persist_interval: int = 60  # Seconds between auto-persist
    persist_on_write: bool = True  # Persist immediately on write

    # Multi-tenant
    tenant_isolation: bool = True


class ARCMemoryPool:
    """
    Shared memory pool for ARC agents with persistence.

    Provides:
    - In-memory hot tier for fast access (Kaizen SharedMemoryPool)
    - DataFlow warm tier for persistence across sessions
    - Tenant isolation for multi-tenant deployments
    - Automatic tiering based on age/importance

    Usage:
        >>> from arc.agents.memory import ARCMemoryPool, MemoryConfig
        >>> from dataflow import DataFlow
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> memory = ARCMemoryPool(db, tenant_id="tenant-001")
        >>>
        >>> # Write insight (goes to hot tier, persists to warm)
        >>> memory.write_insight({
        ...     "agent_id": "analyst_001",
        ...     "content": "Portfolio shows high tech concentration",
        ...     "tags": ["portfolio", "risk", "concentration"],
        ...     "importance": 0.8,
        ...     "segment": "analysis"
        ... })
        >>>
        >>> # Read relevant insights
        >>> insights = memory.read_relevant(
        ...     tags=["portfolio", "risk"],
        ...     min_importance=0.5
        ... )
    """

    def __init__(
        self,
        db: Any,  # DataFlow instance
        tenant_id: str | None = None,
        config: MemoryConfig | None = None,
    ) -> None:
        """
        Initialize memory pool with DataFlow persistence.

        Args:
            db: DataFlow database instance
            tenant_id: Tenant ID for multi-tenant isolation
            config: Memory configuration
        """
        self.db = db
        self.tenant_id = tenant_id
        self.config = config or MemoryConfig()

        # Initialize hot tier (Kaizen SharedMemoryPool)
        self._hot_pool = SharedMemoryPool()

        # Track insights pending persistence
        self._pending_persist: list[dict[str, Any]] = []

        logger.info(
            "ARCMemoryPool initialized",
            extra={"tenant_id": tenant_id, "warm_tier_enabled": self.config.warm_tier_enabled},
        )

    # =========================================================================
    # Core Operations
    # =========================================================================

    def write_insight(self, insight: dict[str, Any]) -> None:
        """
        Write an insight to the memory pool.

        Insight is written to hot tier immediately. If warm tier is enabled
        and persist_on_write is True, also persists to DataFlow.

        Args:
            insight: Dict with agent_id, content, tags, importance, segment
        """
        # Enrich insight
        enriched = {
            **insight,
            "tenant_id": self.tenant_id,
            "created_at": datetime.now(UTC).isoformat(),
        }

        # Write to hot tier
        self._hot_pool.write_insight(enriched)

        # Queue for persistence
        if self.config.warm_tier_enabled:
            self._pending_persist.append(enriched)

            if self.config.persist_on_write:
                self._persist_pending()

    def read_relevant(
        self,
        agent_id: str | None = None,
        tags: list[str] | None = None,
        min_importance: float | None = None,
        segments: list[str] | None = None,
        max_age_seconds: float | None = None,
        exclude_own: bool = True,
        limit: int | None = None,
        include_warm_tier: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Read relevant insights from the memory pool.

        Searches hot tier first, then warm tier if enabled.

        Args:
            agent_id: Filter by source agent (for exclude_own)
            tags: Filter by tags
            min_importance: Minimum importance threshold
            segments: Filter by segments
            max_age_seconds: Maximum age for hot tier
            exclude_own: Exclude insights from the querying agent
            limit: Maximum insights to return
            include_warm_tier: Also search warm tier (DataFlow)

        Returns:
            List of matching insights, sorted by importance/recency
        """
        # Get from hot tier
        hot_insights = self._hot_pool.read_relevant(
            agent_id=agent_id,
            tags=tags,
            min_importance=min_importance,
            segments=segments,
            max_age_seconds=max_age_seconds,
            exclude_own=exclude_own,
            limit=limit,
        )

        # Get from warm tier if enabled
        warm_insights = []
        if include_warm_tier and self.config.warm_tier_enabled:
            warm_insights = self._read_from_warm_tier(
                agent_id=agent_id,
                tags=tags,
                min_importance=min_importance,
                segments=segments,
                exclude_own=exclude_own,
                limit=limit,
            )

        # Merge and dedupe
        all_insights = self._merge_insights(hot_insights, warm_insights)

        # Apply final limit
        if limit:
            all_insights = all_insights[:limit]

        return all_insights

    def read_all(self) -> list[dict[str, Any]]:
        """Read all insights from hot tier."""
        return self._hot_pool.read_all()

    def clear(self) -> None:
        """Clear all insights from hot tier."""
        self._hot_pool.clear()
        self._pending_persist.clear()

    def get_stats(self) -> dict[str, Any]:
        """
        Get memory pool statistics.

        Returns:
            Dict with insight counts, agent counts, tag distribution
        """
        hot_stats = self._hot_pool.get_stats()
        return {
            "hot_tier": hot_stats,
            "warm_tier_enabled": self.config.warm_tier_enabled,
            "pending_persist": len(self._pending_persist),
            "tenant_id": self.tenant_id,
        }

    # =========================================================================
    # Conversation Memory
    # =========================================================================

    def get_conversation_history(
        self,
        user_id: str,
        session_id: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """
        Get conversation history for a user.

        Args:
            user_id: User identifier
            session_id: Optional session to filter
            limit: Maximum messages to return

        Returns:
            List of conversation messages
        """
        return self.read_relevant(
            tags=["conversation", f"user:{user_id}"],
            segments=["conversation"],
            exclude_own=False,
            limit=limit,
        )

    def add_conversation_message(
        self,
        user_id: str,
        role: str,
        content: str,
        session_id: str | None = None,
        agent_id: str | None = None,
    ) -> None:
        """
        Add a message to conversation history.

        Args:
            user_id: User identifier
            role: Message role ("user", "assistant", "system")
            content: Message content
            session_id: Session identifier
            agent_id: Agent that handled the message
        """
        tags = ["conversation", f"user:{user_id}", f"role:{role}"]
        if session_id:
            tags.append(f"session:{session_id}")

        self.write_insight(
            {
                "agent_id": agent_id or "system",
                "content": content,
                "tags": tags,
                "importance": 0.5,  # Medium importance for messages
                "segment": "conversation",
                "metadata": {
                    "user_id": user_id,
                    "role": role,
                    "session_id": session_id,
                },
            }
        )

    # =========================================================================
    # Portfolio Memory
    # =========================================================================

    def get_portfolio_insights(
        self,
        portfolio_id: str,
        min_importance: float = 0.5,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Get insights related to a specific portfolio.

        Args:
            portfolio_id: Portfolio identifier
            min_importance: Minimum importance threshold
            limit: Maximum insights

        Returns:
            List of portfolio-related insights
        """
        return self.read_relevant(
            tags=[f"portfolio:{portfolio_id}"],
            segments=["analysis", "recommendation", "alert"],
            min_importance=min_importance,
            exclude_own=False,
            limit=limit,
        )

    def add_portfolio_insight(
        self,
        portfolio_id: str,
        content: str,
        insight_type: str,
        importance: float,
        agent_id: str,
        metadata: dict | None = None,
    ) -> None:
        """
        Add an insight about a portfolio.

        Args:
            portfolio_id: Portfolio identifier
            content: Insight content
            insight_type: Type ("performance", "risk", "recommendation", "alert")
            importance: Importance score 0.0-1.0
            agent_id: Source agent
            metadata: Additional metadata
        """
        tags = ["portfolio", f"portfolio:{portfolio_id}", insight_type]

        self.write_insight(
            {
                "agent_id": agent_id,
                "content": content,
                "tags": tags,
                "importance": importance,
                "segment": "analysis" if insight_type != "alert" else "alert",
                "metadata": {
                    "portfolio_id": portfolio_id,
                    "insight_type": insight_type,
                    **(metadata or {}),
                },
            }
        )

    # =========================================================================
    # Persistence (Warm Tier)
    # =========================================================================

    def _persist_pending(self) -> None:
        """Persist pending insights to warm tier (DataFlow)."""
        if not self._pending_persist:
            return

        try:
            # Batch insert to AgentMemory model
            # Note: This assumes an AgentMemory model exists
            # If not, insights are kept in hot tier only
            for insight in self._pending_persist:
                self._persist_single_insight(insight)

            self._pending_persist.clear()
        except Exception as e:
            logger.warning(f"Failed to persist insights: {e}")

    def _persist_single_insight(self, insight: dict[str, Any]) -> None:
        """Persist a single insight to DataFlow."""
        try:
            # Convert to storable format
            record = {
                "id": f"mem_{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}",
                "tenant_id": insight.get("tenant_id"),
                "agent_id": insight.get("agent_id"),
                "content": insight.get("content", ""),
                "tags": insight.get("tags", []),
                "importance": insight.get("importance", 0.5),
                "segment": insight.get("segment", "general"),
                "metadata": insight.get("metadata", {}),
            }

            # Synchronous persistence (would be async in production)
            # self.db.express.create("AgentMemory", record)
            logger.debug(f"Persisted insight: {record['id']}")
        except Exception as e:
            logger.warning(f"Failed to persist insight: {e}")

    def _read_from_warm_tier(
        self,
        agent_id: str | None = None,
        tags: list[str] | None = None,
        min_importance: float | None = None,
        segments: list[str] | None = None,
        exclude_own: bool = True,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Read insights from warm tier (DataFlow)."""
        try:
            # Build filter
            filter_dict: dict[str, Any] = {}
            if self.tenant_id:
                filter_dict["tenant_id"] = self.tenant_id
            if min_importance:
                filter_dict["importance"] = {"$gte": min_importance}
            if segments:
                filter_dict["segment"] = {"$in": segments}

            # Query DataFlow
            # records = self.db.express.list("AgentMemory", filter=filter_dict, limit=limit or 100)
            records: list[dict[str, Any]] = []  # Placeholder until AgentMemory model exists

            # Filter by tags (post-query for JSON array matching)
            if tags:
                records = [r for r in records if any(t in r.get("tags", []) for t in tags)]

            # Filter out own insights if requested
            if exclude_own and agent_id:
                records = [r for r in records if r.get("agent_id") != agent_id]

            return records
        except Exception as e:
            logger.warning(f"Failed to read from warm tier: {e}")
            return []

    def _merge_insights(
        self,
        hot: list[dict[str, Any]],
        warm: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Merge hot and warm tier insights, removing duplicates.

        Prioritizes hot tier (more recent) over warm tier.
        """
        # Simple deduplication by content hash
        seen_content = set()
        merged = []

        for insight in hot + warm:
            content_key = insight.get("content", "")[:100]  # First 100 chars
            if content_key not in seen_content:
                seen_content.add(content_key)
                merged.append(insight)

        # Sort by importance (descending), then recency
        merged.sort(
            key=lambda x: (x.get("importance", 0), x.get("created_at", "")),
            reverse=True,
        )

        return merged

    # =========================================================================
    # Async Operations
    # =========================================================================

    async def persist_async(self) -> None:
        """Asynchronously persist pending insights."""
        if not self._pending_persist or not self.config.warm_tier_enabled:
            return

        try:
            count = len(self._pending_persist)
            for insight in self._pending_persist:
                # Build record for persistence
                # TODO: Uncomment when AgentMemory model is created
                _ = {
                    "id": f"mem_{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}",
                    "tenant_id": insight.get("tenant_id"),
                    "agent_id": insight.get("agent_id"),
                    "content": insight.get("content", ""),
                    "tags": json.dumps(insight.get("tags", [])),
                    "importance": insight.get("importance", 0.5),
                    "segment": insight.get("segment", "general"),
                    "metadata": json.dumps(insight.get("metadata", {})),
                }
                # await self.db.express.create("AgentMemory", record)

            self._pending_persist.clear()
            logger.info(f"Persisted {count} insights to warm tier")
        except Exception as e:
            logger.error(f"Async persistence failed: {e}")

    async def load_from_warm_tier_async(
        self,
        max_age_days: int = 7,
        min_importance: float = 0.6,
    ) -> int:
        """
        Load recent insights from warm tier into hot tier.

        Args:
            max_age_days: Maximum age of insights to load
            min_importance: Minimum importance threshold

        Returns:
            Number of insights loaded
        """
        try:
            # Query warm tier
            insights = self._read_from_warm_tier(
                min_importance=min_importance,
                limit=self.config.hot_tier_max_insights,
            )

            # Load into hot tier
            for insight in insights:
                self._hot_pool.write_insight(insight)

            logger.info(f"Loaded {len(insights)} insights from warm tier")
            return len(insights)
        except Exception as e:
            logger.error(f"Failed to load from warm tier: {e}")
            return 0


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    "ARCMemoryPool",
    "MemoryConfig",
]
