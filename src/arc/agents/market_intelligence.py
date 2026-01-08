"""
MarketIntelligenceAgent - AI-powered market briefs and research synthesis.

This agent generates comprehensive market intelligence using chain-of-thought
reasoning, with support for streaming responses and portfolio-aware analysis.

Features:
- Chain-of-thought reasoning via explicit step fields in signatures
- Streaming responses for real-time brief generation (SSE pattern)
- Cost tracking per agent call
- Multi-step execution: gather context -> analyze -> synthesize -> deliver
- Research synthesis with source attribution

CRITICAL RULES:
- Use async methods for all database operations
- Always include risk warnings in outputs
- Track costs for all LLM calls
- Validate confidence scores before returning results
"""

import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from kaizen.signatures import InputField, OutputField, Signature

from arc.agents.base import ARCBaseAgent
from arc.agents.config import ARCAgentConfig

# =============================================================================
# Chain-of-Thought Signatures
# =============================================================================


class MarketBriefSignature(Signature):
    """
    Chain-of-Thought signature for market intelligence analysis.

    Each step field forces the LLM to reason through the analysis systematically.
    This improves accuracy and provides transparent reasoning for auditing.

    The signature captures:
    - Portfolio context for personalized insights
    - Market data for current conditions
    - News context for sentiment analysis
    - User preferences for tailored recommendations
    """

    # Inputs
    portfolio_context: str = InputField(
        description="JSON with portfolio holdings, allocations, sector exposure, and recent performance"
    )
    market_data: str = InputField(
        description="JSON with current market indices, sector performance, and key metrics"
    )
    news_context: str = InputField(
        description="Recent financial news and events relevant to the portfolio",
        default="",
    )
    user_preferences: str = InputField(
        description="User's risk tolerance, investment goals, and focus areas",
        default="",
    )
    brief_type: str = InputField(
        description="Brief type: 'daily', 'weekly', 'monthly', 'custom'",
        default="daily",
    )
    output_format: str = InputField(
        description="Output format: 'summary', 'detailed', 'executive'",
        default="summary",
    )

    # Chain-of-Thought reasoning steps (CRITICAL for comprehensive analysis)
    step1_market_assessment: str = OutputField(
        description="Step 1: Current market environment assessment - analyze overall market "
        "conditions, key indices performance (S&P 500, NASDAQ, Dow), market sentiment "
        "(bullish/bearish/neutral), VIX level, sector rotation, and major economic factors. "
        "Include specific numbers and percentages."
    )
    step2_portfolio_analysis: str = OutputField(
        description="Step 2: Portfolio position analysis - evaluate how the user's specific "
        "holdings are positioned relative to current market conditions. Analyze sector "
        "exposure, concentration risks, correlation to market moves, and which positions "
        "are outperforming or underperforming. Reference specific holdings."
    )
    step3_sentiment_analysis: str = OutputField(
        description="Step 3: Sentiment analysis - evaluate news sentiment for held securities, "
        "overall sector sentiment, analyst sentiment indicators, and institutional flows. "
        'Return sentiment scores as embedded JSON: {"overall": float (-1 to 1), '
        '"sectors": {sector_name: float}, "holdings": {symbol: float}}'
    )
    step4_opportunity_risk: str = OutputField(
        description="Step 4: Opportunity and risk identification - identify specific opportunities "
        "given current market conditions (entry points, undervalued positions, momentum plays), "
        "key risks to monitor (market risks, position-specific risks, macro risks), "
        "and potential catalysts both positive (earnings, events) and negative."
    )
    step5_actionable_synthesis: str = OutputField(
        description="Step 5: Synthesis and recommendations - synthesize all insights into "
        "2-3 highest-priority actionable takeaways. Each must include: (1) specific action, "
        "(2) rationale tied to analysis, (3) relevant tickers if applicable, (4) timeframe. "
        "Prioritize by potential impact and urgency."
    )

    # Final outputs
    executive_summary: str = OutputField(
        description="Executive summary: 3-5 sentence market brief suitable for quick morning "
        "briefing. Lead with the most important market development, mention portfolio "
        "impact, and end with key action item."
    )
    sections: str = OutputField(
        description='JSON array of brief sections: [{"title": str, "content": str, '
        '"sentiment": "positive"|"neutral"|"negative", "importance": float (0-1), '
        '"holdings_mentioned": [str]}]. Include: Market Overview, Sector Analysis, '
        "Portfolio Impact, Economic Calendar. Each section 2-3 paragraphs."
    )
    actionable_takeaways: str = OutputField(
        description='JSON array of actionable items: [{"action": str, "rationale": str, '
        '"priority": "high"|"medium"|"low", "tickers": [str], "timeframe": str}]. '
        "Maximum 4 items, sorted by priority."
    )
    risk_warnings: str = OutputField(
        description="Key risk warnings and caveats for this market environment. Include "
        "market risk, position-specific risks, and the standard disclaimer."
    )
    confidence: float = OutputField(
        description="Confidence score 0.0-1.0 for the overall analysis quality. Lower if "
        "data is stale, market conditions unusual, or limited portfolio context."
    )


class ResearchSignature(Signature):
    """
    Signature for deep research synthesis on specific topics.

    Used for ad-hoc research requests when users want to understand
    a specific market topic, sector, or investment thesis in depth.
    """

    # Inputs
    topic: str = InputField(
        description="Research topic (e.g., 'AI chip demand outlook', 'Fed rate path Q1 2026')"
    )
    depth: str = InputField(
        description="Research depth: 'quick' (1-2 paragraphs), 'standard' (3-5 paragraphs), "
        "'comprehensive' (full analysis)",
        default="standard",
    )
    portfolio_context: str = InputField(
        description="Optional portfolio context for relevance scoring",
        default="",
    )

    # Chain-of-thought for research
    step1_topic_framing: str = OutputField(
        description="Step 1: Frame the research question - what is the core question, "
        "what are the key sub-questions, what data points matter most"
    )
    step2_evidence_gathering: str = OutputField(
        description="Step 2: Key evidence and data points - current state, historical context, "
        "expert opinions, quantitative data"
    )
    step3_analysis: str = OutputField(
        description="Step 3: Analysis and implications - synthesize evidence, identify patterns, "
        "draw conclusions, consider contrarian views"
    )

    # Outputs
    summary: str = OutputField(description="Research summary answering the core question directly")
    key_points: str = OutputField(
        description='JSON array of key points: [{"point": str, "evidence": str, '
        '"confidence": float}]'
    )
    implications: str = OutputField(description="Investment implications for the user's portfolio")
    sources: str = OutputField(
        description='JSON array of source attributions: [{"source": str, "type": str, '
        '"relevance": str}]'
    )
    confidence: float = OutputField(description="Confidence score 0.0-1.0 for the research quality")


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class MarketIntelligenceConfig(ARCAgentConfig):
    """
    Configuration for Market Intelligence Agent.

    Extends ARCAgentConfig with market-specific settings optimized for
    comprehensive market analysis with chain-of-thought reasoning.

    Attributes:
        model: LLM model for market analysis (default gpt-4o)
        temperature: Low for consistent analysis (0.25)
        max_tokens: High for comprehensive briefs (8000)
        include_sentiment: Enable sentiment analysis in briefs
        include_technicals: Include technical indicators
        news_lookback_days: Days of news to consider
        confidence_threshold: Minimum confidence for valid results
        enable_streaming: Enable streaming responses
        chunk_size: Tokens per streaming chunk
    """

    # Override defaults for market analysis
    model: str = "gpt-4o"
    temperature: float = 0.25  # Low for consistent analysis, slightly higher for synthesis
    max_tokens: int = 8000  # Long for comprehensive briefs
    strategy_type: str = "single_shot"  # CoT via explicit steps, not multi-cycle

    # Market-specific settings
    include_sentiment: bool = True
    include_technicals: bool = True
    news_lookback_days: int = 3
    confidence_threshold: float = 0.6

    # Streaming configuration
    enable_streaming: bool = True
    chunk_size: int = 5  # Tokens per chunk for smooth streaming


# =============================================================================
# MarketIntelligenceAgent
# =============================================================================


class MarketIntelligenceAgent(ARCBaseAgent):
    """
    Market Intelligence Agent with chain-of-thought reasoning and streaming.

    This agent generates AI-powered market briefs with:
    - Chain-of-thought reasoning via explicit step fields in signature
    - Portfolio-aware analysis using DataFlow context helpers
    - Streaming responses for real-time brief generation (SSE pattern)
    - Cost tracking via CostTrackingHook
    - Research synthesis with source attribution

    Execution Flow:
    1. Gather market context (indices, sectors)
    2. Gather portfolio context (holdings, performance)
    3. Fetch relevant news (optional)
    4. Execute CoT analysis via run_async
    5. Post-process and validate results

    Example:
        >>> from dataflow import DataFlow
        >>> from arc.agents.market_intelligence import MarketIntelligenceAgent
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> agent = MarketIntelligenceAgent(config=MarketIntelligenceConfig(), db=db)
        >>>
        >>> # Generate full brief
        >>> brief = await agent.generate_brief("port-001")
        >>> print(brief["executive_summary"])
        >>>
        >>> # Stream brief (for SSE)
        >>> async for chunk in agent.stream_brief("port-001"):
        ...     print(chunk, end="", flush=True)

    SSE Integration (FastAPI):
        @app.get("/api/intelligence/brief/{portfolio_id}/stream")
        async def stream_brief(portfolio_id: str):
            agent = MarketIntelligenceAgent(config=config, db=db)

            async def event_generator():
                async for chunk in agent.stream_brief(portfolio_id):
                    yield f"data: {json.dumps({'content': chunk})}\\n\\n"
                yield "data: [DONE]\\n\\n"

            return StreamingResponse(event_generator(), media_type="text/event-stream")
    """

    def __init__(
        self,
        config: MarketIntelligenceConfig | None = None,
        db: Any = None,
        shared_memory: Any | None = None,
        agent_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize Market Intelligence Agent.

        Args:
            config: Agent configuration (uses MarketIntelligenceConfig defaults if None)
            db: DataFlow database instance for portfolio/security context
            shared_memory: Optional SharedMemoryPool for multi-agent collaboration
            agent_id: Unique identifier for this agent instance
            **kwargs: Additional BaseAgent arguments
        """
        if config is None:
            config = MarketIntelligenceConfig()

        self._market_config = config

        # Call parent init with MarketBrief signature
        super().__init__(
            config=config,
            signature=MarketBriefSignature(),
            db=db,
            shared_memory=shared_memory,
            agent_id=agent_id or "market_intelligence",
            **kwargs,
        )

        # Track call-level costs for reporting
        self._call_costs: list[dict[str, Any]] = []

    def _generate_system_prompt(self) -> str:
        """
        Generate market intelligence-specific system prompt.

        This prompt enforces chain-of-thought reasoning by explicitly
        requiring each step to be completed thoroughly.
        """
        return """You are an expert market intelligence analyst for the ARC investment platform.

CRITICAL: You MUST complete each reasoning step thoroughly before moving to the next.
Each step builds on the previous - do not skip or rush any step.

## Your Role
- Provide institutional-quality market analysis
- Generate actionable insights for portfolio management
- Assess market sentiment and identify opportunities/risks
- Communicate clearly and concisely for busy investors

## Reasoning Process (FOLLOW EXACTLY)
Step 1 (Market Assessment): Analyze current market conditions comprehensively.
- Include specific index levels and percentage changes
- Note any unusual activity or divergences
- Assess overall market sentiment

Step 2 (Portfolio Analysis): Connect market conditions to the specific portfolio.
- Reference actual holdings by ticker
- Identify which positions benefit or suffer
- Calculate approximate impact where possible

Step 3 (Sentiment Analysis): Evaluate sentiment across multiple dimensions.
- Return sentiment scores as embedded JSON
- Include both quantitative and qualitative assessment
- Note any sentiment divergences

Step 4 (Opportunities/Risks): Identify specific actionable opportunities and risks.
- Be concrete - mention specific tickers or sectors
- Include timeframes where applicable
- Balance opportunities with associated risks

Step 5 (Synthesis): Distill into 2-3 highest-priority actionable takeaways.
- Prioritize by impact and urgency
- Make recommendations specific and implementable
- Include clear rationale tied to analysis

## Output Guidelines
- Always cite specific data when making claims
- Include sentiment scores as JSON in step 3
- Format sections and takeaways as valid JSON arrays
- Include risk warnings for ALL recommendations
- Never guarantee returns or make definitive predictions
- Consider portfolio's existing positions when recommending actions

## Risk Warnings (ALWAYS INCLUDE)
Every brief must include:
- Past performance does not guarantee future results
- All investments carry risk of loss
- Consider consulting a qualified financial advisor

## Quality Checklist
□ Executive summary captures key insight in first sentence
□ Each section has valid sentiment and importance score
□ Takeaways are specific (tickers, amounts, timeframes)
□ Risk warnings are comprehensive
□ Confidence score reflects data quality and certainty"""

    # =========================================================================
    # Multi-Step Brief Generation
    # =========================================================================

    async def generate_brief(
        self,
        portfolio_id: str | None = None,
        brief_type: str = "daily",
        output_format: str = "summary",
        user_preferences: str = "",
    ) -> dict[str, Any]:
        """
        Generate comprehensive market brief with multi-step execution.

        Execution flow:
        1. Gather market context (indices, sectors)
        2. Gather portfolio context (holdings, performance) - if portfolio_id provided
        3. Fetch relevant news - if sentiment enabled
        4. Execute CoT analysis via run_async
        5. Post-process and validate

        Args:
            portfolio_id: Optional portfolio ID for personalized analysis
            brief_type: Brief type ("daily", "weekly", "monthly", "custom")
            output_format: Output format ("summary", "detailed", "executive")
            user_preferences: Optional user preferences for tailored analysis

        Returns:
            Complete market brief with:
            - step1_market_assessment through step5_actionable_synthesis (CoT)
            - executive_summary: Quick overview
            - sections: List of detailed sections
            - actionable_takeaways: Prioritized action items
            - risk_warnings: Important caveats
            - confidence: Quality score
            - _metadata: Generation info

        Raises:
            ValueError: If portfolio_id provided but portfolio not found
        """
        # Step 1: Gather market context
        market_context = await self.get_market_context()
        if "error" in market_context:
            return {
                "error": market_context["error"],
                "step": "market_context",
            }

        # Step 2: Gather portfolio context (if provided)
        portfolio_context: dict[str, Any] = {}
        if portfolio_id:
            portfolio_context = await self.get_portfolio_context(portfolio_id)
            if "error" in portfolio_context:
                return {
                    "error": portfolio_context["error"],
                    "step": "portfolio_context",
                }

        # Step 3: Fetch relevant news (if sentiment enabled)
        news_context = ""
        if self._market_config.include_sentiment and portfolio_context:
            holdings = portfolio_context.get("holdings", [])
            news_context = await self._fetch_news_for_holdings(holdings)

        # Step 4: Execute CoT analysis via run_async
        result = await self.run_async(
            portfolio_context=(
                json.dumps(portfolio_context, default=str) if portfolio_context else "{}"
            ),
            market_data=json.dumps(market_context, default=str),
            news_context=news_context,
            user_preferences=user_preferences,
            brief_type=brief_type,
            output_format=output_format,
        )

        # Step 5: Post-process and validate
        result = self._post_process_brief(result)

        # Track this call's cost
        self._record_call_cost("generate_brief", portfolio_id or "market_only")

        return result

    async def _fetch_news_for_holdings(
        self,
        holdings: list[dict[str, Any]],
    ) -> str:
        """
        Fetch relevant news for portfolio holdings.

        Currently returns a summary - integrate with news API for production.

        Args:
            holdings: List of portfolio holdings with symbols

        Returns:
            News context string for the LLM
        """
        # Extract symbols from holdings
        symbols = []
        for h in holdings:
            symbol = h.get("symbol") or h.get("ticker")
            if symbol:
                symbols.append(symbol)

        if not symbols:
            return ""

        # Get unique sectors from holdings
        sectors = set()
        for h in holdings:
            if h.get("sector"):
                sectors.add(h.get("sector"))

        # Build news context summary
        # TODO: Integrate with news API (EODHD, Alpha Vantage, etc.)
        return (
            f"Portfolio holdings include: {', '.join(symbols[:10])}. "
            f"Key sectors: {', '.join(sectors) if sectors else 'N/A'}. "
            f"Consider recent news affecting these securities and sectors."
        )

    def _post_process_brief(self, result: dict[str, Any]) -> dict[str, Any]:
        """
        Post-process and validate the market brief.

        Actions:
        - Parse JSON string fields into Python objects
        - Validate confidence threshold
        - Add metadata
        - Ensure risk warnings present

        Args:
            result: Raw result from run_async

        Returns:
            Processed result with parsed JSON and metadata
        """
        # Parse JSON fields
        for json_field in ["sections", "actionable_takeaways"]:
            if json_field in result and isinstance(result[json_field], str):
                try:
                    result[json_field] = json.loads(result[json_field])
                except json.JSONDecodeError:
                    # Keep as string if parsing fails, log warning
                    result[f"_{json_field}_parse_error"] = True

        # Validate confidence
        confidence = result.get("confidence", 0.0)
        if isinstance(confidence, str):
            try:
                confidence = float(confidence)
                result["confidence"] = confidence
            except ValueError:
                confidence = 0.5
                result["confidence"] = confidence

        if confidence < self._market_config.confidence_threshold:
            result["_warning"] = (
                f"Low confidence ({confidence:.2f} < {self._market_config.confidence_threshold}). "
                "Consider this analysis preliminary."
            )

        # Ensure risk warnings present
        if not result.get("risk_warnings") or not result.get("risk_warnings", "").strip():
            result["risk_warnings"] = (
                "Past performance does not guarantee future results. "
                "All investments carry risk of loss. "
                "Consider consulting a qualified financial advisor before making investment decisions."
            )

        # Add metadata
        result["_metadata"] = {
            "generated_at": datetime.now(UTC).isoformat(),
            "agent_id": self.agent_id,
            "model": self._market_config.model,
            "brief_type": result.get("brief_type", "daily"),
        }

        return result

    def _record_call_cost(self, operation: str, context: str) -> None:
        """
        Record cost for a specific call.

        Args:
            operation: Operation name (e.g., "generate_brief")
            context: Context identifier (e.g., portfolio_id)
        """
        cost = self.get_total_cost()
        self._call_costs.append(
            {
                "operation": operation,
                "context": context,
                "timestamp": datetime.now(UTC).isoformat(),
                "cost_usd": cost,
            }
        )

    # =========================================================================
    # Streaming Responses (SSE Pattern)
    # =========================================================================

    async def stream_brief(
        self,
        portfolio_id: str | None = None,
        brief_type: str = "daily",
        user_preferences: str = "",
    ) -> AsyncIterator[str]:
        """
        Stream market brief generation for SSE endpoints.

        This async generator yields content chunks for Server-Sent Events (SSE).
        Useful for real-time UI updates during brief generation.

        Args:
            portfolio_id: Optional portfolio ID for personalized analysis
            brief_type: Brief type ("daily", "weekly", etc.)
            user_preferences: Optional user preferences

        Yields:
            Content chunks as strings for SSE events

        Example (FastAPI):
            @app.get("/api/intelligence/brief/{portfolio_id}/stream")
            async def stream_brief_endpoint(portfolio_id: str):
                agent = MarketIntelligenceAgent(config=config, db=db)

                async def event_generator():
                    async for chunk in agent.stream_brief(portfolio_id):
                        yield f"data: {json.dumps({'content': chunk})}\\n\\n"
                    yield "data: [DONE]\\n\\n"

                return StreamingResponse(
                    event_generator(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )

        Example (JavaScript client):
            const eventSource = new EventSource('/api/intelligence/brief/port-001/stream');
            eventSource.onmessage = (event) => {
                if (event.data === '[DONE]') {
                    eventSource.close();
                    return;
                }
                const data = JSON.parse(event.data);
                appendToUI(data.content);
            };
        """
        # Note: True streaming requires Kaizen's StreamingStrategy
        # For now, yield the full brief in chunks to demonstrate the pattern
        # In production, integrate with Kaizen's streaming infrastructure

        # Gather context first (not streamed)
        market_context = await self.get_market_context()
        if "error" in market_context:
            yield json.dumps({"error": market_context["error"]})
            return

        portfolio_context: dict[str, Any] = {}
        if portfolio_id:
            portfolio_context = await self.get_portfolio_context(portfolio_id)
            if "error" in portfolio_context:
                yield json.dumps({"error": portfolio_context["error"]})
                return

        # Yield progress updates
        yield json.dumps({"status": "gathering_context", "progress": 0.2})

        news_context = ""
        if self._market_config.include_sentiment and portfolio_context:
            holdings = portfolio_context.get("holdings", [])
            news_context = await self._fetch_news_for_holdings(holdings)

        yield json.dumps({"status": "analyzing", "progress": 0.4})

        # Generate the full brief
        result = await self.run_async(
            portfolio_context=(
                json.dumps(portfolio_context, default=str) if portfolio_context else "{}"
            ),
            market_data=json.dumps(market_context, default=str),
            news_context=news_context,
            user_preferences=user_preferences,
            brief_type=brief_type,
            output_format="summary",
        )

        yield json.dumps({"status": "synthesizing", "progress": 0.8})

        # Post-process
        result = self._post_process_brief(result)

        # Yield the executive summary first
        if "executive_summary" in result:
            yield json.dumps(
                {
                    "type": "executive_summary",
                    "content": result["executive_summary"],
                }
            )

        # Yield sections
        sections = result.get("sections", [])
        if isinstance(sections, list):
            for section in sections:
                yield json.dumps(
                    {
                        "type": "section",
                        "content": section,
                    }
                )

        # Yield takeaways
        takeaways = result.get("actionable_takeaways", [])
        if isinstance(takeaways, list):
            for takeaway in takeaways:
                yield json.dumps(
                    {
                        "type": "takeaway",
                        "content": takeaway,
                    }
                )

        # Yield risk warnings
        if "risk_warnings" in result:
            yield json.dumps(
                {
                    "type": "risk_warnings",
                    "content": result["risk_warnings"],
                }
            )

        # Final complete result
        yield json.dumps(
            {
                "status": "complete",
                "progress": 1.0,
                "confidence": result.get("confidence", 0.0),
            }
        )

    # =========================================================================
    # Research Synthesis
    # =========================================================================

    async def research(
        self,
        topic: str,
        depth: str = "standard",
        portfolio_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Research and synthesize a specific market topic.

        Uses chain-of-thought reasoning to:
        1. Frame the research question
        2. Gather evidence and data points
        3. Analyze implications
        4. Synthesize findings with source attribution

        Args:
            topic: Research topic (e.g., "AI chip demand outlook", "Fed rate path Q1 2026")
            depth: Research depth ("quick", "standard", "comprehensive")
            portfolio_id: Optional portfolio ID for relevance scoring

        Returns:
            Research synthesis with:
            - summary: Direct answer to the research question
            - key_points: List of key findings with evidence
            - implications: Investment implications
            - sources: Source attributions
            - confidence: Quality score

        Example:
            >>> result = await agent.research(
            ...     topic="Impact of rising rates on tech valuations",
            ...     depth="comprehensive",
            ...     portfolio_id="port-001"
            ... )
            >>> print(result["summary"])
            >>> for point in result["key_points"]:
            ...     print(f"- {point['point']}")
        """
        # Get portfolio context for relevance scoring
        portfolio_context = ""
        if portfolio_id:
            context = await self.get_portfolio_context(portfolio_id)
            if "error" not in context:
                portfolio_context = json.dumps(context, default=str)

        # Create research agent with research signature
        research_agent = ARCBaseAgent(
            config=self._arc_config,
            signature=ResearchSignature(),
            db=self.db,
            shared_memory=self.shared_memory,
            agent_id=f"{self.agent_id}_research",
        )

        # Execute research
        result = await research_agent.run_async(
            topic=topic,
            depth=depth,
            portfolio_context=portfolio_context,
        )

        # Post-process research results
        result = self._post_process_research(result)

        # Track cost
        self._record_call_cost("research", topic[:50])

        return result

    def _post_process_research(self, result: dict[str, Any]) -> dict[str, Any]:
        """
        Post-process research results.

        Args:
            result: Raw result from research agent

        Returns:
            Processed result with parsed JSON
        """
        # Parse JSON fields
        for json_field in ["key_points", "sources"]:
            if json_field in result and isinstance(result[json_field], str):
                try:
                    result[json_field] = json.loads(result[json_field])
                except json.JSONDecodeError:
                    result[f"_{json_field}_parse_error"] = True

        # Add metadata
        result["_metadata"] = {
            "generated_at": datetime.now(UTC).isoformat(),
            "agent_id": self.agent_id,
            "research_type": "synthesis",
        }

        return result

    # =========================================================================
    # Cost Tracking
    # =========================================================================

    def get_call_costs(self) -> list[dict[str, Any]]:
        """
        Get cost breakdown per call.

        Returns:
            List of call cost records with operation, context, timestamp, cost
        """
        return self._call_costs.copy()

    def get_session_cost_summary(self) -> dict[str, Any]:
        """
        Get comprehensive cost summary for this session.

        Returns:
            Dict with total cost, per-call breakdown, and statistics
        """
        total = self.get_total_cost()
        calls = self.get_call_costs()

        return {
            "total_cost_usd": total,
            "call_count": len(calls),
            "average_cost_per_call": total / len(calls) if calls else 0,
            "calls": calls,
            "breakdown": self.get_cost_breakdown(),
        }

    # =========================================================================
    # Brief Caching (Optional)
    # =========================================================================

    async def get_cached_brief(
        self,
        portfolio_id: str,
        brief_type: str = "daily",
        max_age_minutes: int = 60,
    ) -> dict[str, Any] | None:
        """
        Get cached brief if available and fresh.

        For production, integrate with Redis or database caching.

        Args:
            portfolio_id: Portfolio ID
            brief_type: Brief type
            max_age_minutes: Maximum age in minutes for valid cache

        Returns:
            Cached brief if valid, None otherwise
        """
        # TODO: Implement caching with DataFlow or Redis
        # For now, always return None (no cache)
        return None

    async def cache_brief(
        self,
        portfolio_id: str,
        brief_type: str,
        brief: dict[str, Any],
    ) -> None:
        """
        Cache a generated brief.

        For production, integrate with Redis or database caching.

        Args:
            portfolio_id: Portfolio ID
            brief_type: Brief type
            brief: Brief to cache
        """
        # TODO: Implement caching with DataFlow or Redis
        pass


# =============================================================================
# Convenience Functions
# =============================================================================


async def generate_market_brief(
    db: Any,
    portfolio_id: str | None = None,
    brief_type: str = "daily",
    config: MarketIntelligenceConfig | None = None,
) -> dict[str, Any]:
    """
    Quick one-liner for generating a market brief.

    Args:
        db: DataFlow database instance
        portfolio_id: Optional portfolio ID for personalized analysis
        brief_type: Brief type ("daily", "weekly", etc.)
        config: Optional configuration

    Returns:
        Complete market brief

    Example:
        >>> brief = await generate_market_brief(db, "port-001")
        >>> print(brief["executive_summary"])
    """
    agent = MarketIntelligenceAgent(config=config, db=db)
    return await agent.generate_brief(portfolio_id, brief_type=brief_type)


async def research_topic(
    db: Any,
    topic: str,
    depth: str = "standard",
    portfolio_id: str | None = None,
    config: MarketIntelligenceConfig | None = None,
) -> dict[str, Any]:
    """
    Quick one-liner for researching a topic.

    Args:
        db: DataFlow database instance
        topic: Research topic
        depth: Research depth
        portfolio_id: Optional portfolio ID for relevance
        config: Optional configuration

    Returns:
        Research synthesis

    Example:
        >>> result = await research_topic(db, "Fed rate impact on bonds")
        >>> print(result["summary"])
    """
    agent = MarketIntelligenceAgent(config=config, db=db)
    return await agent.research(topic, depth=depth, portfolio_id=portfolio_id)


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Agent
    "MarketIntelligenceAgent",
    # Config
    "MarketIntelligenceConfig",
    # Signatures
    "MarketBriefSignature",
    "ResearchSignature",
    # Convenience functions
    "generate_market_brief",
    "research_topic",
]
