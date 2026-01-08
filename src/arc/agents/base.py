"""
ARCBaseAgent - Foundation for all ARC investment agents.

Extends Kaizen's BaseAgent with DataFlow integration, portfolio/security
context helpers, and investment-specific validation.

CRITICAL RULES:
- Use async methods for all database operations
- Always validate investment recommendations
- Include risk warnings in all outputs
- Track costs for all LLM calls
"""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from kaizen.core.base_agent import BaseAgent
from kaizen.core.config import BaseAgentConfig
from kaizen.signatures import InputField, OutputField, Signature

from arc.agents.config import ARCAgentConfig

# =============================================================================
# Investment Domain Signatures
# =============================================================================


class PortfolioAnalysisSignature(Signature):
    """Signature for portfolio analysis tasks."""

    portfolio_id: str = InputField(description="Portfolio identifier to analyze")
    analysis_type: str = InputField(
        description="Type: 'performance', 'risk', 'allocation', 'health', 'all'",
        default="all",
    )
    time_period: str = InputField(
        description="Period: '1d', '1w', '1m', '3m', '1y', 'ytd', 'inception'",
        default="1m",
    )

    summary: str = OutputField(description="Executive summary of analysis")
    metrics: str = OutputField(description="JSON with calculated metrics")
    recommendations: str = OutputField(description="Actionable recommendations")
    risk_warnings: str = OutputField(description="Important risk factors and warnings")


class SecurityAnalysisSignature(Signature):
    """Signature for security/stock analysis tasks."""

    symbol: str = InputField(description="Ticker symbol to analyze")
    analysis_type: str = InputField(
        description="Type: 'fundamental', 'technical', 'valuation', 'all'",
        default="all",
    )

    summary: str = OutputField(description="Investment thesis summary")
    metrics: str = OutputField(description="JSON with key metrics")
    rating: str = OutputField(
        description="Rating: 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'"
    )
    price_target: str = OutputField(description="Price target with rationale")
    risks: str = OutputField(description="Key risk factors")


class MarketQuerySignature(Signature):
    """Signature for natural language market queries."""

    query: str = InputField(description="Natural language query about markets or securities")
    context: str = InputField(description="Optional additional context", default="")

    answer: str = OutputField(description="Direct answer to the query")
    data_sources: str = OutputField(description="Data sources used for the answer")
    confidence: str = OutputField(description="Confidence level: 'high', 'medium', 'low'")


class InvestmentRecommendationSignature(Signature):
    """Signature for generating investment recommendations."""

    portfolio_context: str = InputField(description="Current portfolio summary and constraints")
    investment_goals: str = InputField(description="User's objectives and risk tolerance")
    market_context: str = InputField(description="Current market conditions", default="")

    recommendations: str = OutputField(description="Specific investment recommendations")
    rationale: str = OutputField(description="Detailed reasoning for each recommendation")
    risk_warnings: str = OutputField(description="Important risks and caveats")
    action_items: str = OutputField(description="Concrete steps to implement")


# =============================================================================
# ARCBaseAgent
# =============================================================================


class ARCBaseAgent(BaseAgent):
    """
    Base agent for ARC investment platform.

    Extends Kaizen's BaseAgent with:
    - DataFlow database integration for portfolio/security data
    - Investment-specific context helpers
    - Financial formatting utilities
    - Cost tracking for LLM usage
    - Investment validation (risk warnings, etc.)

    All specialized agents (Market, Query, Analyst, Committee) extend this.

    Example:
        >>> from dataflow import DataFlow
        >>> from arc.agents.base import ARCBaseAgent, PortfolioAnalysisSignature
        >>> from arc.agents.config import ARCAgentConfig
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> agent = ARCBaseAgent(
        ...     config=ARCAgentConfig(),
        ...     signature=PortfolioAnalysisSignature(),
        ...     db=db,
        ...     agent_id="portfolio_analyst"
        ... )
        >>> result = await agent.run_async(portfolio_id="port-001")
    """

    def __init__(
        self,
        config: ARCAgentConfig,
        signature: Signature,
        db: Any,  # DataFlow instance
        shared_memory: Any | None = None,  # SharedMemoryPool
        agent_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize ARC agent with DataFlow integration.

        Args:
            config: Agent configuration (ARCAgentConfig or subclass)
            signature: Kaizen signature defining inputs/outputs
            db: DataFlow database instance
            shared_memory: Optional SharedMemoryPool for multi-agent collaboration
            agent_id: Unique identifier for this agent instance
            **kwargs: Additional BaseAgent arguments
        """
        # Store DataFlow reference before parent init
        self.db = db
        self._arc_config = config

        # Convert ARCAgentConfig to BaseAgentConfig
        kaizen_config = BaseAgentConfig(**config.to_kaizen_config())

        # Call parent init
        super().__init__(
            config=kaizen_config,
            signature=signature,
            shared_memory=shared_memory,
            agent_id=agent_id or self._generate_agent_id(),
            **kwargs,
        )

        # Setup cost tracking if hooks enabled
        if config.hooks_enabled:
            self._setup_cost_tracking()

    def _generate_agent_id(self) -> str:
        """Generate unique agent ID based on class and timestamp."""
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        return f"{self.__class__.__name__.lower()}_{timestamp}"

    def _setup_cost_tracking(self) -> None:
        """Setup cost tracking hook for LLM usage monitoring."""
        try:
            from kaizen.core.autonomy.hooks.builtin.cost_tracking_hook import CostTrackingHook
            from kaizen.core.autonomy.hooks.types import HookPriority

            if self.hook_manager:
                self.cost_tracker = CostTrackingHook()
                self.hook_manager.register_hook(self.cost_tracker, HookPriority.NORMAL)
        except ImportError:
            # Cost tracking hook not available
            self.cost_tracker = None

    # =========================================================================
    # Extension Points (Override in Subclasses)
    # =========================================================================

    def _generate_system_prompt(self) -> str:
        """
        Generate investment-specific system prompt.

        Override in subclasses for specialized agent behavior.
        """
        return """You are an expert investment analyst for the ARC investment platform.

Your role is to:
1. Analyze portfolio performance and composition with precision
2. Provide data-driven investment recommendations
3. Assess and communicate risks clearly
4. Follow fiduciary standards in all advice

Guidelines:
- Always cite specific data when making claims
- Distinguish clearly between facts and opinions
- Include relevant risk warnings in all recommendations
- Use clear, professional financial language
- Never guarantee or promise specific returns
- Consider fees, taxes, and transaction costs

When analyzing portfolios:
- Evaluate diversification, correlation, and concentration
- Compare performance against appropriate benchmarks
- Account for the investor's time horizon and risk tolerance
- Identify both opportunities and concerns"""

    def _validate_signature_output(self, output: dict[str, Any]) -> bool:
        """
        Validate investment-specific output requirements.

        Ensures risk warnings are present in recommendations.
        """
        # Call parent validation
        super()._validate_signature_output(output)

        # Investment-specific: Ensure risk warnings exist
        if "recommendations" in output and output.get("recommendations"):
            if "risk_warnings" in output:
                warnings = output.get("risk_warnings", "")
                if not warnings or not warnings.strip():
                    # Add default risk warning
                    output["risk_warnings"] = (
                        "Past performance does not guarantee future results. "
                        "All investments carry risk of loss. "
                        "Consult a qualified financial advisor before making investment decisions."
                    )

        return True

    # =========================================================================
    # Portfolio Context Helpers
    # =========================================================================

    async def get_portfolio_context(self, portfolio_id: str) -> dict[str, Any]:
        """
        Fetch comprehensive portfolio context from DataFlow.

        Args:
            portfolio_id: Portfolio identifier

        Returns:
            Dict with portfolio, holdings, transactions, and summary metrics
        """
        try:
            # Get portfolio
            portfolio = await self.db.express.read("Portfolio", portfolio_id)
            if not portfolio:
                return {"error": f"Portfolio {portfolio_id} not found"}

            # Get holdings
            holdings = await self.db.express.list(
                "Holding",
                filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
                limit=1000,
            )

            # Get recent transactions
            transactions = await self.db.express.list(
                "Transaction",
                filter={"portfolio_id": portfolio_id},
                limit=50,
            )

            # Get latest valuation
            valuations = await self.db.express.list(
                "PortfolioValuation",
                filter={"portfolio_id": portfolio_id},
                limit=1,
            )
            latest_valuation = valuations[0] if valuations else None

            # Calculate summary
            total_value = sum(Decimal(str(h.get("current_value", 0))) for h in holdings)
            total_cost = sum(Decimal(str(h.get("cost_basis", 0))) for h in holdings)

            return {
                "portfolio": portfolio,
                "holdings": holdings,
                "recent_transactions": transactions,
                "latest_valuation": latest_valuation,
                "summary": {
                    "total_value": float(total_value),
                    "total_cost": float(total_cost),
                    "total_gain_loss": float(total_value - total_cost),
                    "total_gain_loss_pct": (
                        float((total_value - total_cost) / total_cost * 100)
                        if total_cost > 0
                        else 0.0
                    ),
                    "holdings_count": len(holdings),
                    "active_positions": sum(1 for h in holdings if float(h.get("quantity", 0)) > 0),
                },
            }
        except Exception as e:
            return {"error": f"Failed to get portfolio context: {e!s}"}

    async def get_security_context(self, security_id: str) -> dict[str, Any]:
        """
        Fetch security context from DataFlow.

        Args:
            security_id: Security identifier or symbol

        Returns:
            Dict with security info, prices, fundamentals, and ratios
        """
        try:
            # Try to find security by ID or symbol
            security = await self.db.express.read("Security", security_id)
            if not security:
                # Try by symbol
                securities = await self.db.express.list(
                    "Security",
                    filter={"symbol": security_id.upper()},
                    limit=1,
                )
                security = securities[0] if securities else None

            if not security:
                return {"error": f"Security {security_id} not found"}

            sec_id = security.get("id")

            # Get recent prices
            prices = await self.db.express.list(
                "PriceHistory",
                filter={"security_id": sec_id},
                limit=30,
            )

            # Get fundamentals
            fundamentals = await self.db.express.list(
                "CompanyFundamentals",
                filter={"security_id": sec_id},
                limit=4,  # Last 4 quarters
            )

            # Get ratios
            ratios = await self.db.express.list(
                "SecurityRatio",
                filter={"security_id": sec_id},
                limit=1,
            )

            return {
                "security": security,
                "prices": prices,
                "current_price": prices[0] if prices else None,
                "fundamentals": fundamentals,
                "latest_fundamentals": fundamentals[0] if fundamentals else None,
                "ratios": ratios[0] if ratios else None,
            }
        except Exception as e:
            return {"error": f"Failed to get security context: {e!s}"}

    async def get_multi_security_context(
        self, security_ids: list[str]
    ) -> dict[str, dict[str, Any]]:
        """
        Fetch context for multiple securities.

        Args:
            security_ids: List of security identifiers or symbols

        Returns:
            Dict mapping security_id to context
        """
        results = {}
        for sec_id in security_ids:
            results[sec_id] = await self.get_security_context(sec_id)
        return results

    async def get_market_context(self) -> dict[str, Any]:
        """
        Get general market context (indices, sectors, etc.).

        Returns:
            Dict with market overview data
        """
        try:
            # Get major indices
            indices = await self.db.express.list(
                "Security",
                filter={"security_type": "index"},
                limit=10,
            )

            # Get index prices
            index_data = {}
            for idx in indices:
                prices = await self.db.express.list(
                    "PriceHistory",
                    filter={"security_id": idx.get("id")},
                    limit=2,
                )
                if prices:
                    current = Decimal(str(prices[0].get("close_price", 0)))
                    previous = (
                        Decimal(str(prices[1].get("close_price", 0)))
                        if len(prices) > 1
                        else current
                    )
                    change_pct = float((current - previous) / previous * 100) if previous > 0 else 0
                    index_data[idx.get("symbol")] = {
                        "price": float(current),
                        "change_pct": change_pct,
                    }

            return {
                "indices": index_data,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        except Exception as e:
            return {"error": f"Failed to get market context: {e!s}"}

    # =========================================================================
    # Formatting Helpers
    # =========================================================================

    @staticmethod
    def format_currency(value: float | Decimal, currency: str = "USD") -> str:
        """
        Format monetary value with currency symbol.

        Args:
            value: Numeric value
            currency: Currency code (default USD)

        Returns:
            Formatted string like "$1,234.56"
        """
        symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
        symbol = symbols.get(currency, currency + " ")
        return f"{symbol}{value:,.2f}"

    @staticmethod
    def format_percentage(value: float | Decimal, decimals: int = 2) -> str:
        """
        Format percentage value.

        Args:
            value: Percentage value (e.g., 5.25 for 5.25%)
            decimals: Decimal places

        Returns:
            Formatted string like "5.25%"
        """
        return f"{value:.{decimals}f}%"

    @staticmethod
    def format_ratio(value: float | Decimal, decimals: int = 2) -> str:
        """
        Format ratio value.

        Args:
            value: Ratio value
            decimals: Decimal places

        Returns:
            Formatted string like "1.25x"
        """
        return f"{value:.{decimals}f}x"

    @staticmethod
    def format_large_number(value: float | Decimal) -> str:
        """
        Format large numbers with K/M/B suffixes.

        Args:
            value: Numeric value

        Returns:
            Formatted string like "1.5B" or "250M"
        """
        value = float(value)
        if abs(value) >= 1_000_000_000:
            return f"{value / 1_000_000_000:.1f}B"
        elif abs(value) >= 1_000_000:
            return f"{value / 1_000_000:.1f}M"
        elif abs(value) >= 1_000:
            return f"{value / 1_000:.1f}K"
        else:
            return f"{value:.2f}"

    # =========================================================================
    # Shared Memory Helpers
    # =========================================================================

    def share_insight(
        self,
        content: str,
        tags: list[str],
        importance: float = 0.7,
        segment: str = "analysis",
    ) -> None:
        """
        Share an insight with other agents via SharedMemoryPool.

        Args:
            content: Insight content
            tags: Categorization tags (e.g., ["portfolio", "risk"])
            importance: Relevance score 0.0-1.0
            segment: Memory segment ("analysis", "recommendation", "alert")
        """
        if not self.shared_memory:
            return

        self.shared_memory.write_insight(
            {
                "agent_id": self.agent_id,
                "content": content,
                "tags": tags,
                "importance": importance,
                "segment": segment,
                "timestamp": datetime.now(UTC).isoformat(),
                "agent_type": self.__class__.__name__,
            }
        )

    def get_relevant_insights(
        self,
        tags: list[str] | None = None,
        min_importance: float = 0.5,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Get relevant insights from other agents.

        Args:
            tags: Filter by tags
            min_importance: Minimum importance threshold
            limit: Maximum insights to return

        Returns:
            List of relevant insights
        """
        if not self.shared_memory:
            return []

        return self.shared_memory.read_relevant(
            agent_id=self.agent_id,
            tags=tags,
            min_importance=min_importance,
            exclude_own=True,
            limit=limit,
        )

    # =========================================================================
    # Cost Tracking
    # =========================================================================

    def get_cost_breakdown(self) -> dict[str, Any]:
        """
        Get cost breakdown for this agent's LLM usage.

        Returns:
            Dict with total cost and per-call breakdown
        """
        if hasattr(self, "cost_tracker") and self.cost_tracker:
            return self.cost_tracker.get_cost_breakdown()
        return {"total_cost_usd": 0.0, "message": "Cost tracking not enabled"}

    def get_total_cost(self) -> float:
        """Get total cost in USD for this agent session."""
        if hasattr(self, "cost_tracker") and self.cost_tracker:
            return self.cost_tracker.get_total_cost()
        return 0.0

    def reset_costs(self) -> None:
        """Reset cost tracking for this agent."""
        if hasattr(self, "cost_tracker") and self.cost_tracker:
            self.cost_tracker.reset_costs()


# =============================================================================
# Convenience Type Aliases
# =============================================================================

# Available signatures for import
__all__ = [
    "ARCBaseAgent",
    "PortfolioAnalysisSignature",
    "SecurityAnalysisSignature",
    "MarketQuerySignature",
    "InvestmentRecommendationSignature",
]
