"""
Intelligence Service for ARC investment platform.

Provides a unified interface to all Kaizen AI agents for:
- Market briefs and research
- Natural language portfolio queries
- Security and portfolio analysis
- Anomaly detection
- Investment committee recommendations

CRITICAL RULES:
- Track all AI usage for cost management and billing
- Apply tenant-level usage limits
- Cache frequent queries to reduce costs
- Stream long-running operations for UX
"""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from arc.services.base import BaseService, ServiceError, service_operation

if TYPE_CHECKING:
    from dataflow import DataFlow


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class IntelligenceConfig:
    """Configuration for Intelligence Service."""

    # Usage limits per tenant
    monthly_token_limit: int = 1_000_000
    monthly_cost_limit_usd: float = 100.0

    # Caching
    cache_ttl_seconds: int = 300  # 5 minutes
    enable_caching: bool = True

    # Defaults
    default_brief_type: str = "daily"
    default_analysis_type: str = "standard"
    default_research_depth: str = "standard"

    # Timeouts
    agent_timeout_seconds: float = 120.0


@dataclass
class UsageRecord:
    """Record of AI usage for tracking and billing."""

    id: str
    tenant_id: str
    user_id: str
    agent: str
    method: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: float
    timestamp: str
    metadata: dict[str, Any] = field(default_factory=dict)


# =============================================================================
# Intelligence Service
# =============================================================================


class IntelligenceService(BaseService):
    """
    Unified service for AI-powered intelligence features.

    Provides access to all Kaizen AI agents through a single interface:
    - MarketIntelligenceAgent for market briefs and research
    - PortfolioQueryAgent for natural language queries
    - FinancialAnalystAgent for security analysis
    - InvestmentCommitteeAgent for orchestrated recommendations

    Includes usage tracking, caching, and tenant-level limits.

    Example:
        >>> from arc.services import create_services
        >>> services = create_services(db, tenant_id="tenant-001")
        >>> intelligence = services.intelligence
        >>>
        >>> # Generate market brief
        >>> brief = await intelligence.generate_market_brief(
        ...     portfolio_id="port-001",
        ...     brief_type="daily"
        ... )
        >>>
        >>> # Query portfolio
        >>> answer = await intelligence.query_portfolio(
        ...     user_id="user-001",
        ...     query="What is my tech allocation?"
        ... )
    """

    def __init__(
        self,
        db: "DataFlow",
        tenant_id: str | None = None,
        user_id: str | None = None,
        config: IntelligenceConfig | None = None,
    ):
        """
        Initialize Intelligence Service.

        Args:
            db: DataFlow database instance
            tenant_id: Tenant context for multi-tenant operations
            user_id: User context for audit logging
            config: Optional service configuration
        """
        super().__init__(db, tenant_id, user_id)
        self.config = config or IntelligenceConfig()
        self.logger = logging.getLogger("arc.services.IntelligenceService")

        # Lazy-loaded agents
        self._market_agent = None
        self._query_agent = None
        self._analyst_agent = None
        self._committee_agent = None

        # Usage tracking
        self._usage_log: list[UsageRecord] = []

        # Simple in-memory cache (replace with Redis in production)
        self._cache: dict[str, tuple[datetime, Any]] = {}

    # =========================================================================
    # Agent Access
    # =========================================================================

    @property
    def market_agent(self):
        """Get or create market intelligence agent."""
        if self._market_agent is None:
            from arc.agents import MarketIntelligenceAgent, MarketIntelligenceConfig

            self._market_agent = MarketIntelligenceAgent(
                config=MarketIntelligenceConfig(),
                db=self.db,
                agent_id=f"market_agent_{self.tenant_id or 'default'}",
            )
        return self._market_agent

    @property
    def query_agent(self):
        """Get or create portfolio query agent."""
        if self._query_agent is None:
            from arc.agents import PortfolioQueryAgent, PortfolioQueryConfig

            self._query_agent = PortfolioQueryAgent(
                config=PortfolioQueryConfig(),
                db=self.db,
                agent_id=f"query_agent_{self.tenant_id or 'default'}",
            )
        return self._query_agent

    @property
    def analyst_agent(self):
        """Get or create financial analyst agent."""
        if self._analyst_agent is None:
            from arc.agents import FinancialAnalystAgent, FinancialAnalystConfig

            self._analyst_agent = FinancialAnalystAgent(
                config=FinancialAnalystConfig(),
                db=self.db,
                agent_id=f"analyst_agent_{self.tenant_id or 'default'}",
            )
        return self._analyst_agent

    @property
    def committee_agent(self):
        """Get or create investment committee agent."""
        if self._committee_agent is None:
            from arc.agents import InvestmentCommitteeAgent, InvestmentCommitteeConfig

            self._committee_agent = InvestmentCommitteeAgent(
                config=InvestmentCommitteeConfig(),
                db=self.db,
                agent_id=f"committee_agent_{self.tenant_id or 'default'}",
            )
        return self._committee_agent

    # =========================================================================
    # Market Brief Methods
    # =========================================================================

    @service_operation("generate_market_brief")
    async def generate_market_brief(
        self,
        brief_type: str = "daily",
        topics: list[str] | None = None,
        portfolio_id: str | None = None,
        output_format: str = "summary",
    ) -> dict[str, Any]:
        """
        Generate a market intelligence brief.

        Creates a comprehensive market analysis optionally tailored to
        a specific portfolio's holdings and strategy.

        Args:
            brief_type: Type of brief ("daily", "weekly", "event", "portfolio")
            topics: Optional specific topics to cover
            portfolio_id: Optional portfolio for context
            output_format: Output format ("summary", "detailed", "executive")

        Returns:
            Market brief with analysis, insights, and recommendations

        Example:
            >>> brief = await intelligence.generate_market_brief(
            ...     portfolio_id="port-001",
            ...     brief_type="daily"
            ... )
            >>> print(brief["executive_summary"])
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        # Check cache
        cache_key = f"brief_{brief_type}_{portfolio_id}_{output_format}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        try:
            # Generate brief using market agent
            result = await self.market_agent.generate_brief(
                portfolio_id=portfolio_id,
                brief_type=brief_type,
                topics=topics,
                output_format=output_format,
            )

            # Track usage
            await self._track_usage(
                agent="market_intelligence",
                method="generate_brief",
                result=result,
                start_time=start_time,
            )

            # Store brief in history
            if self.tenant_id:
                await self._store_brief_history(
                    brief_type=brief_type,
                    brief=result,
                    portfolio_id=portfolio_id,
                )

            # Cache result
            self._set_cached(cache_key, result)

            return result

        except Exception as e:
            self.logger.exception("Failed to generate market brief")
            raise ServiceError(
                f"Market brief generation failed: {e}",
                service="IntelligenceService",
                operation="generate_market_brief",
                details={"brief_type": brief_type, "portfolio_id": portfolio_id},
            ) from e

    async def stream_market_brief(
        self,
        brief_type: str = "daily",
        topics: list[str] | None = None,
        portfolio_id: str | None = None,
    ) -> AsyncIterator[str]:
        """
        Stream a market brief for real-time UI updates.

        Yields chunks of the brief as they are generated, enabling
        progressive display in the UI.

        Args:
            brief_type: Type of brief
            topics: Optional topics to cover
            portfolio_id: Optional portfolio for context

        Yields:
            String chunks of the brief as generated

        Example:
            >>> async for chunk in intelligence.stream_market_brief("daily"):
            ...     print(chunk, end="", flush=True)
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        try:
            # Stream using market agent
            async for chunk in self.market_agent.stream_brief(
                portfolio_id=portfolio_id,
                brief_type=brief_type,
                topics=topics,
            ):
                yield chunk

            # Track usage after completion
            await self._track_usage(
                agent="market_intelligence",
                method="stream_brief",
                result={"streamed": True},
                start_time=start_time,
            )

        except Exception as e:
            self.logger.exception("Failed to stream market brief")
            yield f"\n\nError: {e}"

    @service_operation("get_brief_history")
    async def get_brief_history(
        self,
        brief_type: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Get history of generated market briefs.

        Args:
            brief_type: Filter by brief type
            start_date: Filter by start date (ISO)
            end_date: Filter by end date (ISO)
            limit: Maximum records to return

        Returns:
            List of historical briefs
        """
        filter_dict: dict[str, Any] = {}

        if self.tenant_id:
            filter_dict["tenant_id"] = self.tenant_id

        if brief_type:
            filter_dict["brief_type"] = brief_type

        if start_date:
            filter_dict["created_at"] = {"$gte": start_date}

        if end_date:
            if "created_at" in filter_dict:
                filter_dict["created_at"]["$lte"] = end_date
            else:
                filter_dict["created_at"] = {"$lte": end_date}

        try:
            briefs = await self.db.express.list(
                "MarketBrief",
                filter=filter_dict,
                limit=limit,
            )
            return briefs
        except Exception:
            # Model may not exist yet
            return []

    # =========================================================================
    # Natural Language Query Methods
    # =========================================================================

    @service_operation("query_portfolio")
    async def query_portfolio(
        self,
        user_id: str,
        query: str,
        portfolio_id: str | None = None,
        include_sources: bool = True,
    ) -> dict[str, Any]:
        """
        Answer natural language questions about portfolios.

        Uses LLM-based semantic understanding to interpret queries and
        retrieve relevant portfolio data.

        Args:
            user_id: User making the query
            query: Natural language question
            portfolio_id: Optional specific portfolio to query
            include_sources: Include data sources in response

        Returns:
            Answer with confidence, sources, and data points

        Example:
            >>> result = await intelligence.query_portfolio(
            ...     user_id="user-001",
            ...     query="What is my total exposure to tech stocks?"
            ... )
            >>> print(result["answer"])
            >>> print(f"Confidence: {result['confidence']}")
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        # If no portfolio specified, get user's default/first portfolio
        if not portfolio_id:
            portfolios = await self.db.express.list(
                "Portfolio",
                filter={"manager_id": user_id, "deleted_at": {"$null": True}, "active": True},
                limit=1,
            )
            if portfolios:
                portfolio_id = portfolios[0]["id"]

        if not portfolio_id:
            return {
                "query": query,
                "answer": "No portfolio found. Please create a portfolio first.",
                "confidence": 0.0,
                "query_type": "error",
                "data_points": [],
            }

        try:
            # Query using portfolio query agent
            result = await self.query_agent.query(
                portfolio_id=portfolio_id,
                query=query,
            )

            # Track usage
            await self._track_usage(
                agent="portfolio_query",
                method="query",
                result=result,
                start_time=start_time,
                metadata={"query": query},
            )

            # Log query for learning
            await self._log_query(
                user_id=user_id,
                query=query,
                query_type=result.get("query_type", "unknown"),
                confidence=result.get("confidence", 0.0),
            )

            return result

        except Exception as e:
            self.logger.exception("Failed to query portfolio")
            raise ServiceError(
                f"Portfolio query failed: {e}",
                service="IntelligenceService",
                operation="query_portfolio",
                details={"query": query, "portfolio_id": portfolio_id},
            ) from e

    @service_operation("suggest_queries")
    async def suggest_queries(
        self,
        user_id: str,
        context: str | None = None,
        limit: int = 5,
    ) -> list[str]:
        """
        Suggest relevant queries based on user context.

        Generates contextual query suggestions based on recent activity,
        current portfolio state, and market conditions.

        Args:
            user_id: User to suggest for
            context: Optional context hint
            limit: Maximum suggestions

        Returns:
            List of suggested queries

        Example:
            >>> suggestions = await intelligence.suggest_queries("user-001")
            >>> for suggestion in suggestions:
            ...     print(f"  - {suggestion}")
        """
        try:
            # Get user's portfolios
            portfolios = await self.db.express.list(
                "Portfolio",
                filter={"manager_id": user_id, "deleted_at": {"$null": True}},
                limit=1,
            )

            if not portfolios:
                return [
                    "How do I create my first portfolio?",
                    "What information do you need to get started?",
                ]

            portfolio_id = portfolios[0]["id"]

            # Get suggestions from query agent
            suggestions = await self.query_agent.suggest_queries(
                portfolio_id=portfolio_id,
                context=context,
            )

            return suggestions[:limit]

        except Exception:
            self.logger.exception("Failed to suggest queries")
            # Return generic suggestions on error
            return [
                "What is my portfolio's current value?",
                "What is my sector allocation?",
                "What are my top holdings?",
                "How has my portfolio performed this month?",
                "What is my cash position?",
            ][:limit]

    # =========================================================================
    # Security Analysis Methods
    # =========================================================================

    @service_operation("analyze_security")
    async def analyze_security(
        self,
        security_id: str,
        analysis_type: str = "standard",
        include_peer_comparison: bool = True,
    ) -> dict[str, Any]:
        """
        Perform comprehensive security analysis.

        Uses LLM chain-of-thought reasoning to analyze a security across
        five dimensions: liquidity, profitability, leverage, valuation, growth.

        Args:
            security_id: Security ID or ticker symbol
            analysis_type: Depth of analysis ("quick", "standard", "comprehensive")
            include_peer_comparison: Include peer group comparison

        Returns:
            Analysis with health score, grade, strengths, concerns

        Example:
            >>> analysis = await intelligence.analyze_security("AAPL")
            >>> print(f"Health Score: {analysis['financial_health']['score']}")
            >>> print(f"Grade: {analysis['financial_health']['grade']}")
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        # Check cache for quick analyses
        if analysis_type == "quick":
            cache_key = f"security_analysis_{security_id}"
            cached = self._get_cached(cache_key)
            if cached:
                return cached

        try:
            # Analyze using analyst agent
            result = await self.analyst_agent.analyze_security(
                security_id=security_id,
                analysis_type=analysis_type,
                include_peer_comparison=include_peer_comparison,
            )

            # Track usage
            await self._track_usage(
                agent="financial_analyst",
                method="analyze_security",
                result=result,
                start_time=start_time,
            )

            # Cache quick analyses
            if analysis_type == "quick":
                cache_key = f"security_analysis_{security_id}"
                self._set_cached(cache_key, result)

            return result

        except Exception as e:
            self.logger.exception("Failed to analyze security")
            raise ServiceError(
                f"Security analysis failed: {e}",
                service="IntelligenceService",
                operation="analyze_security",
                details={"security_id": security_id},
            ) from e

    @service_operation("analyze_portfolio")
    async def analyze_portfolio(
        self,
        portfolio_id: str,
        include_holdings_analysis: bool = True,
    ) -> dict[str, Any]:
        """
        Perform portfolio-level financial health analysis.

        Aggregates individual security analyses into portfolio-level
        insights including quality distribution and recommendations.

        Args:
            portfolio_id: Portfolio identifier
            include_holdings_analysis: Analyze individual holdings

        Returns:
            Portfolio analysis with health score and recommendations

        Example:
            >>> analysis = await intelligence.analyze_portfolio("port-001")
            >>> print(f"Portfolio Grade: {analysis['portfolio_health']['grade']}")
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        try:
            # Analyze using analyst agent
            result = await self.analyst_agent.analyze_portfolio(
                portfolio_id=portfolio_id,
                include_holdings_analysis=include_holdings_analysis,
            )

            # Track usage
            await self._track_usage(
                agent="financial_analyst",
                method="analyze_portfolio",
                result=result,
                start_time=start_time,
            )

            return result

        except Exception as e:
            self.logger.exception("Failed to analyze portfolio")
            raise ServiceError(
                f"Portfolio analysis failed: {e}",
                service="IntelligenceService",
                operation="analyze_portfolio",
                details={"portfolio_id": portfolio_id},
            ) from e

    @service_operation("detect_anomalies")
    async def detect_anomalies(
        self,
        portfolio_id: str | None = None,
        security_ids: list[str] | None = None,
        lookback_periods: int = 4,
        create_alerts: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Detect financial anomalies in securities.

        Identifies unusual patterns that may indicate financial stress,
        data quality issues, or investment opportunities.

        Args:
            portfolio_id: Optional portfolio to scan
            security_ids: Optional specific securities to analyze
            lookback_periods: Historical periods to analyze
            create_alerts: Create alerts for high-severity anomalies

        Returns:
            List of detected anomalies with severity scoring

        Example:
            >>> anomalies = await intelligence.detect_anomalies(
            ...     portfolio_id="port-001"
            ... )
            >>> for a in anomalies:
            ...     if a['severity'] == 'high':
            ...         print(f"HIGH: {a['ticker']} - {a['description']}")
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        # Get security IDs from portfolio if not provided
        if not security_ids and portfolio_id:
            holdings = await self.db.express.list(
                "Holding",
                filter={"portfolio_id": portfolio_id, "active": True},
                limit=100,
            )
            security_ids = [h["security_id"] for h in holdings if h.get("security_id")]

        if not security_ids:
            return []

        try:
            # Detect anomalies using analyst agent
            anomalies = await self.analyst_agent.detect_anomalies(
                security_ids=security_ids,
                lookback_periods=lookback_periods,
            )

            # Track usage
            await self._track_usage(
                agent="financial_analyst",
                method="detect_anomalies",
                result={"count": len(anomalies)},
                start_time=start_time,
            )

            # Create alerts for high-severity anomalies
            if create_alerts and self.tenant_id:
                await self._create_anomaly_alerts(anomalies, portfolio_id)

            return anomalies

        except Exception as e:
            self.logger.exception("Failed to detect anomalies")
            raise ServiceError(
                f"Anomaly detection failed: {e}",
                service="IntelligenceService",
                operation="detect_anomalies",
            ) from e

    # =========================================================================
    # Research Methods
    # =========================================================================

    @service_operation("research_topic")
    async def research_topic(
        self,
        topic: str,
        depth: str = "standard",
        sources: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Research a financial topic.

        Synthesizes information about a topic using available data
        and LLM reasoning.

        Args:
            topic: Research topic
            depth: Research depth ("quick", "standard", "comprehensive")
            sources: Optional specific sources to use

        Returns:
            Research synthesis with key points and sources

        Example:
            >>> research = await intelligence.research_topic(
            ...     "Impact of rising interest rates on tech stocks"
            ... )
            >>> print(research["synthesis"])
        """
        start_time = datetime.now(UTC)

        # Check usage limits
        await self._check_usage_limits()

        try:
            # Research using market agent
            result = await self.market_agent.research_topic(
                topic=topic,
                depth=depth,
            )

            # Track usage
            await self._track_usage(
                agent="market_intelligence",
                method="research_topic",
                result=result,
                start_time=start_time,
                metadata={"topic": topic},
            )

            return result

        except Exception as e:
            self.logger.exception("Failed to research topic")
            raise ServiceError(
                f"Research failed: {e}",
                service="IntelligenceService",
                operation="research_topic",
                details={"topic": topic},
            ) from e

    # =========================================================================
    # Committee Recommendations
    # =========================================================================

    @service_operation("get_committee_recommendation")
    async def get_committee_recommendation(
        self,
        portfolio_id: str,
        request_type: str = "rebalance",
        constraints: dict[str, Any] | None = None,
        target_securities: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Get investment committee recommendation.

        Orchestrates multiple specialized agents to provide comprehensive
        investment guidance with consensus tracking and audit trails.

        Args:
            portfolio_id: Portfolio identifier
            request_type: Type of recommendation (rebalance, buy, sell, hold,
                         risk_assessment, opportunity)
            constraints: Optional investment constraints
            target_securities: Optional securities to focus on

        Returns:
            Committee decision with recommendation and audit trail

        Example:
            >>> decision = await intelligence.get_committee_recommendation(
            ...     portfolio_id="port-001",
            ...     request_type="rebalance"
            ... )
            >>> print(decision["recommendation"])
        """
        start_time = datetime.now(UTC)

        # Check usage limits (committee uses multiple agents)
        await self._check_usage_limits(multiplier=3)

        try:
            # Get recommendation using committee agent
            result = await self.committee_agent.recommend(
                portfolio_id=portfolio_id,
                request_type=request_type,
                constraints=constraints,
                target_securities=target_securities,
            )

            # Track usage (committee has its own cost tracking)
            total_cost = result.get("_metadata", {}).get("total_cost_usd", 0.0)
            total_tokens = result.get("_metadata", {}).get("total_tokens_used", 0)

            await self._track_usage(
                agent="investment_committee",
                method="recommend",
                result=result,
                start_time=start_time,
                input_tokens=total_tokens // 2,
                output_tokens=total_tokens // 2,
                cost_override=total_cost,
            )

            return result

        except Exception as e:
            self.logger.exception("Failed to get committee recommendation")
            raise ServiceError(
                f"Committee recommendation failed: {e}",
                service="IntelligenceService",
                operation="get_committee_recommendation",
                details={"portfolio_id": portfolio_id, "request_type": request_type},
            ) from e

    # =========================================================================
    # Usage Tracking
    # =========================================================================

    async def _check_usage_limits(self, multiplier: float = 1.0) -> None:
        """
        Check if tenant has exceeded usage limits.

        Args:
            multiplier: Factor for multi-agent operations

        Raises:
            ServiceError: If limits exceeded
        """
        if not self.tenant_id:
            return

        # Get current month's usage
        monthly_usage = await self.get_monthly_usage()

        # Check token limit
        if monthly_usage["total_tokens"] >= self.config.monthly_token_limit:
            raise ServiceError(
                "Monthly token limit exceeded",
                service="IntelligenceService",
                operation="check_usage_limits",
                details={
                    "used": monthly_usage["total_tokens"],
                    "limit": self.config.monthly_token_limit,
                },
            )

        # Check cost limit
        if monthly_usage["total_cost_usd"] >= self.config.monthly_cost_limit_usd:
            raise ServiceError(
                "Monthly cost limit exceeded",
                service="IntelligenceService",
                operation="check_usage_limits",
                details={
                    "used": monthly_usage["total_cost_usd"],
                    "limit": self.config.monthly_cost_limit_usd,
                },
            )

    async def _track_usage(
        self,
        agent: str,
        method: str,
        result: dict[str, Any],
        start_time: datetime,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost_override: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Track AI usage for billing and analytics.

        Args:
            agent: Agent name
            method: Method called
            result: Result from agent
            start_time: When operation started
            input_tokens: Input token count
            output_tokens: Output token count
            cost_override: Override calculated cost
            metadata: Additional metadata
        """
        end_time = datetime.now(UTC)
        latency_ms = (end_time - start_time).total_seconds() * 1000

        # Estimate tokens if not provided
        if input_tokens == 0:
            input_tokens = 500  # Typical input
        if output_tokens == 0:
            # Estimate from result size
            output_tokens = len(json.dumps(result, default=str)) // 4

        total_tokens = input_tokens + output_tokens

        # Calculate cost (rough estimate based on GPT-4 pricing)
        if cost_override is not None:
            cost_usd = cost_override
        else:
            # $0.01 per 1k tokens (rough estimate)
            cost_usd = total_tokens * 0.00001

        record = UsageRecord(
            id=f"usage-{uuid.uuid4().hex[:12]}",
            tenant_id=self.tenant_id or "default",
            user_id=self.user_id or "unknown",
            agent=agent,
            method=method,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            timestamp=end_time.isoformat(),
            metadata=metadata or {},
        )

        self._usage_log.append(record)

        # Persist to database
        try:
            await self.db.express.create(
                "AIUsage",
                {
                    "id": record.id,
                    "tenant_id": record.tenant_id,
                    "user_id": record.user_id,
                    "agent": record.agent,
                    "method": record.method,
                    "input_tokens": record.input_tokens,
                    "output_tokens": record.output_tokens,
                    "total_tokens": record.total_tokens,
                    "cost_usd": str(record.cost_usd),
                    "latency_ms": record.latency_ms,
                    "metadata": record.metadata,
                },
            )
        except Exception:
            # Model may not exist yet - log locally only
            pass

    @service_operation("get_usage_summary")
    async def get_usage_summary(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> dict[str, Any]:
        """
        Get usage summary for current tenant.

        Args:
            start_date: Start date filter (ISO)
            end_date: End date filter (ISO)

        Returns:
            Usage summary with totals and breakdown by agent
        """
        filter_dict: dict[str, Any] = {}

        if self.tenant_id:
            filter_dict["tenant_id"] = self.tenant_id

        if start_date:
            filter_dict["created_at"] = {"$gte": start_date}

        if end_date:
            if "created_at" in filter_dict:
                filter_dict["created_at"]["$lte"] = end_date
            else:
                filter_dict["created_at"] = {"$lte": end_date}

        try:
            records = await self.db.express.list(
                "AIUsage",
                filter=filter_dict,
                limit=1000,
            )
        except Exception:
            # Model may not exist - use in-memory log
            records = [
                {
                    "agent": r.agent,
                    "method": r.method,
                    "total_tokens": r.total_tokens,
                    "cost_usd": str(r.cost_usd),
                    "latency_ms": r.latency_ms,
                }
                for r in self._usage_log
            ]

        # Aggregate
        total_tokens = 0
        total_cost = Decimal("0")
        total_calls = len(records)
        by_agent: dict[str, dict] = {}

        for record in records:
            total_tokens += record.get("total_tokens", 0)
            total_cost += Decimal(str(record.get("cost_usd", "0")))

            agent = record.get("agent", "unknown")
            if agent not in by_agent:
                by_agent[agent] = {"calls": 0, "tokens": 0, "cost_usd": Decimal("0")}

            by_agent[agent]["calls"] += 1
            by_agent[agent]["tokens"] += record.get("total_tokens", 0)
            by_agent[agent]["cost_usd"] += Decimal(str(record.get("cost_usd", "0")))

        return {
            "total_calls": total_calls,
            "total_tokens": total_tokens,
            "total_cost_usd": float(total_cost),
            "by_agent": {
                agent: {
                    "calls": data["calls"],
                    "tokens": data["tokens"],
                    "cost_usd": float(data["cost_usd"]),
                }
                for agent, data in by_agent.items()
            },
        }

    async def get_monthly_usage(self) -> dict[str, Any]:
        """
        Get current month's usage for limit checking.

        Returns:
            Monthly usage totals
        """
        now = datetime.now(UTC)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return await self.get_usage_summary(
            start_date=start_of_month.isoformat(),
        )

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _get_cached(self, key: str) -> Any | None:
        """Get value from cache if not expired."""
        if not self.config.enable_caching:
            return None

        if key in self._cache:
            timestamp, value = self._cache[key]
            age = (datetime.now(UTC) - timestamp).total_seconds()
            if age < self.config.cache_ttl_seconds:
                return value
            else:
                del self._cache[key]

        return None

    def _set_cached(self, key: str, value: Any) -> None:
        """Set value in cache."""
        if self.config.enable_caching:
            self._cache[key] = (datetime.now(UTC), value)

    async def _store_brief_history(
        self,
        brief_type: str,
        brief: dict[str, Any],
        portfolio_id: str | None = None,
    ) -> None:
        """Store brief in history for later retrieval."""
        try:
            await self.db.express.create(
                "MarketBrief",
                {
                    "id": f"brief-{uuid.uuid4().hex[:12]}",
                    "tenant_id": self.tenant_id,
                    "brief_type": brief_type,
                    "portfolio_id": portfolio_id,
                    "executive_summary": brief.get("executive_summary", ""),
                    "content": json.dumps(brief),
                },
            )
        except Exception:
            # Model may not exist yet
            pass

    async def _log_query(
        self,
        user_id: str,
        query: str,
        query_type: str,
        confidence: float,
    ) -> None:
        """Log query for learning and analytics."""
        try:
            await self.db.express.create(
                "QueryLog",
                {
                    "id": f"query-{uuid.uuid4().hex[:12]}",
                    "tenant_id": self.tenant_id,
                    "user_id": user_id,
                    "query": query,
                    "query_type": query_type,
                    "confidence": str(confidence),
                },
            )
        except Exception:
            # Model may not exist yet
            pass

    async def _create_anomaly_alerts(
        self,
        anomalies: list[dict[str, Any]],
        portfolio_id: str | None,
    ) -> None:
        """Create alerts for high-severity anomalies."""
        for anomaly in anomalies:
            if anomaly.get("severity") in ("high", "critical"):
                try:
                    await self.db.express.create(
                        "Alert",
                        {
                            "id": f"alert-{uuid.uuid4().hex[:12]}",
                            "tenant_id": self.tenant_id,
                            "alert_type": "anomaly",
                            "severity": anomaly.get("severity", "medium"),
                            "title": f"Anomaly detected: {anomaly.get('ticker', 'Unknown')}",
                            "message": anomaly.get("description", ""),
                            "portfolio_id": portfolio_id,
                            "security_id": anomaly.get("security_id"),
                            "metadata": {
                                "anomaly_type": anomaly.get("anomaly_type"),
                                "metric": anomaly.get("metric"),
                                "recommended_action": anomaly.get("recommended_action"),
                            },
                            "status": "active",
                        },
                    )
                except Exception:
                    # Alert model may not exist
                    pass


# =============================================================================
# Convenience Export
# =============================================================================

__all__ = [
    "IntelligenceService",
    "IntelligenceConfig",
    "UsageRecord",
]
