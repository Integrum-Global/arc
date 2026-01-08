"""
Agent configuration for ARC investment platform.

Extends Kaizen's BaseAgentConfig with investment-specific defaults
and specialized configurations for each agent type.

CRITICAL RULES:
- Always use low temperature (0.1-0.3) for financial analysis
- Enable hooks for cost tracking in production
- Use async LLM for Docker/FastAPI deployments
"""

from dataclasses import dataclass


@dataclass
class ARCAgentConfig:
    """
    Base configuration for ARC investment agents.

    This configuration provides sensible defaults for financial analysis
    agents while maintaining compatibility with Kaizen's BaseAgentConfig.

    Attributes:
        llm_provider: LLM provider ("openai", "anthropic", "azure")
        model: Model name (e.g., "gpt-4o", "claude-3-opus-20240229")
        temperature: Lower = more consistent, higher = more creative
        max_tokens: Maximum tokens in response
        use_async_llm: True for Docker/FastAPI, False for CLI scripts
        budget_limit_usd: Maximum spend per session (None = unlimited)
        hooks_enabled: Enable cost tracking and observability hooks
        memory_enabled: Enable conversation memory
        optimization_enabled: Enable Kaizen signature optimization

    Example:
        >>> config = ARCAgentConfig(
        ...     model="gpt-4o",
        ...     temperature=0.2,
        ...     budget_limit_usd=5.0
        ... )
    """

    # LLM Provider Configuration
    llm_provider: str = "openai"
    model: str = "gpt-4o"
    temperature: float = 0.2  # Low for consistent financial analysis
    max_tokens: int = 4096

    # Async Configuration (for Docker/FastAPI)
    use_async_llm: bool = True

    # Budget Control
    budget_limit_usd: float | None = 10.0  # $10 default per session

    # Feature Flags
    hooks_enabled: bool = True  # Enable for cost tracking
    memory_enabled: bool = True  # Enable conversation memory
    optimization_enabled: bool = True  # Kaizen signature optimization
    logging_enabled: bool = True
    performance_enabled: bool = True
    error_handling_enabled: bool = True

    # Strategy Configuration
    # Kaizen accepts: "single_shot" | "multi_cycle"
    strategy_type: str = "single_shot"
    max_cycles: int = 5  # For multi_cycle strategy

    def to_kaizen_config(self) -> dict:
        """
        Convert to Kaizen BaseAgentConfig compatible dict.

        Returns:
            Dict that can be unpacked into BaseAgentConfig.
        """
        return {
            "llm_provider": self.llm_provider,
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "use_async_llm": self.use_async_llm,
            "budget_limit_usd": self.budget_limit_usd,
            "hooks_enabled": self.hooks_enabled,
            "memory_enabled": self.memory_enabled,
            "optimization_enabled": self.optimization_enabled,
            "logging_enabled": self.logging_enabled,
            "performance_enabled": self.performance_enabled,
            "error_handling_enabled": self.error_handling_enabled,
            "strategy_type": self.strategy_type,
            "max_cycles": self.max_cycles,
        }


@dataclass
class MarketAgentConfig(ARCAgentConfig):
    """
    Configuration for Market Intelligence Agent.

    Optimized for real-time market analysis and news interpretation.
    Uses higher max_tokens for comprehensive market summaries.
    """

    model: str = "gpt-4o"
    temperature: float = 0.3  # Slightly higher for news interpretation
    max_tokens: int = 6000  # Longer for market reports
    strategy_type: str = "multi_cycle"  # Multi-cycle for tool use
    max_cycles: int = 5

    # Market-specific settings
    news_lookback_days: int = 7
    include_technicals: bool = True
    include_sentiment: bool = True


@dataclass
class QueryAgentConfig(ARCAgentConfig):
    """
    Configuration for Portfolio Query Agent.

    Optimized for natural language queries about portfolios.
    Uses lower temperature for precise data retrieval.
    """

    model: str = "gpt-4o-mini"  # Faster for simple queries
    temperature: float = 0.1  # Very low for precise answers
    max_tokens: int = 2000  # Shorter, focused responses
    strategy_type: str = "single_shot"

    # Query-specific settings
    max_results: int = 100
    include_explanations: bool = True


@dataclass
class AnalystAgentConfig(ARCAgentConfig):
    """
    Configuration for Financial Analyst Agent.

    Optimized for deep financial analysis and ratio calculations.
    Uses higher max_tokens for detailed reports.
    """

    model: str = "gpt-4o"
    temperature: float = 0.2
    max_tokens: int = 8000  # Long for detailed analysis
    strategy_type: str = "multi_cycle"  # Multi-cycle for multi-step analysis
    max_cycles: int = 10

    # Analyst-specific settings
    analysis_depth: str = "comprehensive"  # "quick" | "standard" | "comprehensive"
    include_peer_comparison: bool = True
    include_historical_trends: bool = True


@dataclass
class CommitteeAgentConfig(ARCAgentConfig):
    """
    Configuration for Investment Committee Agent.

    Orchestrates multiple specialized agents for investment decisions.
    Uses higher budget for multi-agent coordination.
    """

    model: str = "gpt-4o"
    temperature: float = 0.3  # Higher for creative synthesis
    max_tokens: int = 10000  # Very long for committee reports
    strategy_type: str = "multi_cycle"  # Multi-cycle for coordination
    max_cycles: int = 15
    budget_limit_usd: float = 25.0  # Higher budget for multi-agent

    # Committee-specific settings
    require_unanimous: bool = False  # Consensus threshold
    min_confidence: float = 0.7  # Minimum confidence for recommendations
    include_dissenting_views: bool = True


# Type alias for any ARC agent config
AgentConfigType = (
    ARCAgentConfig
    | MarketAgentConfig
    | QueryAgentConfig
    | AnalystAgentConfig
    | CommitteeAgentConfig
)
