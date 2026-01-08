"""
PortfolioQueryAgent - Natural language query interface for portfolios.

Uses LLM-based classification (NOT regex/keyword matching), RAG pattern
for data retrieval, and confidence-scored answer generation.

Architecture:
1. ClassifyQuery: LLM classifies query type semantically
2. RetrieveData: Fetch relevant portfolio data based on classification
3. GenerateAnswer: LLM generates answer with confidence score

CRITICAL RULES:
- ALL classification done by LLM, NOT regex/keyword matching
- Use low temperature (0.1) for consistent classification
- Always include confidence scores and caveats
- Generate contextually relevant follow-up questions
"""

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from kaizen.core.base_agent import BaseAgent
from kaizen.core.config import BaseAgentConfig
from kaizen.signatures import InputField, OutputField, Signature

from arc.agents.base import ARCBaseAgent
from arc.agents.config import ARCAgentConfig

# =============================================================================
# Query Type Enumeration
# =============================================================================


class QueryType(str, Enum):
    """Classification categories for portfolio queries."""

    ALLOCATION = "allocation"  # Asset allocation, sector weights, diversification
    PERFORMANCE = "performance"  # Returns, gains/losses, benchmark comparison
    HOLDINGS = "holdings"  # Position details, specific securities
    RATIOS = "ratios"  # Financial ratios, valuation metrics
    COMPARISON = "comparison"  # Compare portfolios, securities, time periods
    ALERTS = "alerts"  # Active alerts, threshold breaches
    GENERAL = "general"  # General questions, catch-all


# =============================================================================
# Step 1: Classification Signature (LLM-Based - NO Regex/Keywords)
# =============================================================================


class ClassifyQuerySignature(Signature):
    """
    LLM-based query classification signature.

    The LLM analyzes the query SEMANTICALLY to determine its type.
    NO keyword matching, NO regex - purely semantic understanding.

    This allows handling of:
    - Synonyms: "tech exposure" vs "technology allocation"
    - Context: "how did AAPL do" (performance) vs "how much AAPL" (holdings)
    - Multi-intent: Queries touching multiple categories
    """

    query: str = InputField(description="The natural language query about a portfolio to classify")
    portfolio_context: str = InputField(
        description="Brief context about the portfolio (name, type, holdings count). "
        "Can be empty if not yet known.",
        default="",
    )

    # Structured JSON output
    classification: str = OutputField(
        description="""Classify the query into exactly ONE category. Return as JSON:
{
    "query_type": "allocation|performance|holdings|ratios|comparison|alerts|general",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this classification was chosen",
    "entities": {
        "securities": ["AAPL", "MSFT"],
        "time_period": "1d|1w|1m|3m|6m|1y|ytd|inception|null",
        "metrics": ["return", "sharpe", "pe_ratio"],
        "sectors": ["Technology", "Healthcare"],
        "comparison_targets": []
    },
    "sub_intent": "specific sub-intent if relevant"
}

Classification definitions (choose the BEST match):
- allocation: Questions about asset allocation, sector weights, diversification, concentration, exposure to sectors/regions/asset classes
- performance: Questions about returns, gains/losses, P&L, how portfolio performed, benchmark comparison, performance attribution, volatility, drawdown
- holdings: Questions about specific positions, securities held, quantities, cost basis, what stocks/bonds are owned, position sizes
- ratios: Questions about financial ratios (P/E, P/B, ROE, ROA), valuation metrics, efficiency metrics, leverage ratios for holdings
- comparison: Explicitly comparing two or more things (portfolios, securities, time periods, vs benchmark)
- alerts: Questions about alerts, notifications, threshold breaches, warnings, concerns, issues
- general: General questions that don't fit above categories, or ambiguous queries

IMPORTANT: Use semantic understanding, not keyword matching. Consider the user's actual intent."""
    )


# =============================================================================
# Step 2: Answer Generation Signature (RAG Pattern)
# =============================================================================


class PortfolioAnswerSignature(Signature):
    """
    Generate answer from retrieved portfolio data.

    This is the RAG answer generation step - context is pre-retrieved
    data relevant to the classified query type.
    """

    query: str = InputField(description="Original user query")
    query_type: str = InputField(
        description="Classified query type (allocation, performance, holdings, etc.)"
    )
    portfolio_data: str = InputField(
        description="Retrieved portfolio data as JSON, relevant to the query type"
    )
    additional_context: str = InputField(
        description="Any additional context (market data, user preferences, etc.)",
        default="",
    )

    # Structured JSON output with confidence scoring
    response: str = OutputField(
        description="""Generate a comprehensive response. Return as JSON:
{
    "answer": "Clear, direct answer to the user's question. Include specific numbers and data points. Be conversational but precise.",
    "confidence": 0.0-1.0,
    "confidence_reasoning": "Explain what factors affect confidence (data completeness, data recency, certainty of interpretation)",
    "data_points": [
        {"metric": "metric name", "value": "formatted value", "context": "brief explanation"}
    ],
    "sources": ["holdings", "valuations", "security_ratios"],
    "caveats": ["Any important limitations, assumptions, or qualifications"],
    "follow_up_questions": [
        "Contextually relevant follow-up question 1",
        "Contextually relevant follow-up question 2",
        "Contextually relevant follow-up question 3"
    ],
    "risk_warnings": "Required risk disclosures if the answer involves recommendations"
}

Confidence scoring guidelines:
- 0.9-1.0: Complete data available, clear answer, high certainty
- 0.7-0.89: Good data, solid answer, minor gaps or assumptions
- 0.5-0.69: Partial data, reasonable answer, notable limitations
- 0.3-0.49: Limited data, qualified answer, significant uncertainty
- 0.0-0.29: Insufficient data, speculative answer, low reliability

Follow-up questions MUST be:
1. Directly related to the current query context
2. Help the user explore deeper or broader
3. Actionable and specific to this portfolio
4. NOT generic questions

If data is insufficient, honestly say so with confidence < 0.5."""
    )


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class PortfolioQueryConfig(ARCAgentConfig):
    """
    Configuration for PortfolioQueryAgent.

    Optimized for fast, consistent query responses with low temperature
    for deterministic classification.
    """

    # Override defaults for query agent
    model: str = "gpt-4o-mini"  # Fast for queries
    temperature: float = 0.1  # Very low for consistent answers
    max_tokens: int = 2000  # Shorter, focused responses
    strategy_type: str = "single_shot"  # No multi-cycle needed

    # Classification settings
    classification_model: str = "gpt-4o-mini"  # Fast classifier
    classification_temperature: float = 0.0  # Deterministic

    # Data retrieval limits
    max_holdings: int = 100
    max_transactions: int = 50
    max_alerts: int = 20
    max_valuations: int = 30

    # Confidence thresholds
    min_confidence_threshold: float = 0.5  # Below this, add disclaimers
    reclassify_threshold: float = 0.4  # Below this, try general category

    # Query logging
    enable_query_logging: bool = True


# =============================================================================
# Query Log Entry
# =============================================================================


@dataclass
class QueryLogEntry:
    """Log entry for query analytics."""

    query_id: str
    portfolio_id: str
    query: str
    query_type: str
    classification_confidence: float
    answer_confidence: float
    processing_time_ms: float
    timestamp: str
    entities: dict
    success: bool
    error: str | None = None


# =============================================================================
# PortfolioQueryAgent Implementation
# =============================================================================


class PortfolioQueryAgent(ARCBaseAgent):
    """
    Natural language query agent for portfolio data.

    Uses a 3-step RAG pattern:
    1. LLM-based query classification (ClassifyQuerySignature)
    2. Type-specific data retrieval (get_*_data methods)
    3. LLM-based answer generation with confidence (PortfolioAnswerSignature)

    Key Features:
    - Semantic query classification (NO regex/keyword matching)
    - Type-specific data retrieval for efficiency
    - Confidence scoring with clear reasoning
    - Contextual follow-up question generation
    - Query logging for analytics

    Example:
        >>> from dataflow import DataFlow
        >>> from arc.agents.portfolio_query import PortfolioQueryAgent, PortfolioQueryConfig
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> agent = PortfolioQueryAgent(config=PortfolioQueryConfig(), db=db)
        >>>
        >>> result = await agent.query(
        ...     portfolio_id="port-001",
        ...     question="What is my allocation to technology stocks?"
        ... )
        >>> print(result["answer"])
        >>> print(f"Confidence: {result['confidence']:.0%}")
        >>> for q in result["follow_up_questions"]:
        ...     print(f"  - {q}")
    """

    def __init__(
        self,
        config: PortfolioQueryConfig | None = None,
        db: Any = None,
        shared_memory: Any | None = None,
        agent_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize PortfolioQueryAgent.

        Args:
            config: Agent configuration (uses defaults if None)
            db: DataFlow database instance
            shared_memory: Optional SharedMemoryPool for multi-agent collaboration
            agent_id: Unique identifier for this agent instance
            **kwargs: Additional BaseAgent arguments
        """
        if config is None:
            config = PortfolioQueryConfig()

        self._query_config = config

        # Initialize with PortfolioAnswerSignature (main output signature)
        super().__init__(
            config=config,
            signature=PortfolioAnswerSignature(),
            db=db,
            shared_memory=shared_memory,
            agent_id=agent_id or "portfolio_query",
            **kwargs,
        )

        # Create a separate classifier agent
        self._classifier = self._create_classifier_agent(config)

        # Query log for analytics
        self._query_log: list[QueryLogEntry] = []

    def _create_classifier_agent(self, config: PortfolioQueryConfig) -> BaseAgent:
        """Create a lightweight classifier agent for query classification."""
        classifier_config = BaseAgentConfig(
            llm_provider=config.llm_provider,
            model=config.classification_model,
            temperature=config.classification_temperature,
            max_tokens=500,  # Classification is small
        )
        return BaseAgent(config=classifier_config, signature=ClassifyQuerySignature())

    def _generate_system_prompt(self) -> str:
        """Investment-specific system prompt for answer generation."""
        return """You are an expert investment analyst assistant for the ARC platform.

Your role is to answer questions about investment portfolios with:
1. Precision: Use exact numbers from the provided data
2. Context: Explain what the numbers mean for the investor
3. Completeness: Address all aspects of the question
4. Honesty: Clearly state limitations and confidence level

Guidelines:
- Always cite specific data points in your answer
- Format numbers appropriately (currency: $1,234.56, percentages: 12.5%, ratios: 1.5x)
- Include relevant comparisons when available (benchmarks, peers, time periods)
- Generate follow-up questions that help the user explore further
- NEVER make up data - only use what's provided in portfolio_data
- If data is incomplete or unavailable, explicitly state what's missing
- Keep answers concise but complete - aim for 2-4 sentences for simple queries

Risk warnings are REQUIRED when:
- Discussing specific investment recommendations
- Comparing against benchmarks
- Analyzing individual securities

Standard risk disclosure:
"Past performance does not guarantee future results. All investments carry risk of loss."
"""

    # =========================================================================
    # Main Query Interface
    # =========================================================================

    async def query(
        self,
        portfolio_id: str,
        question: str,
        context: str = "",
    ) -> dict[str, Any]:
        """
        Answer a natural language question about a portfolio.

        This is the main entry point implementing the RAG pattern:
        1. Classify the query using LLM (semantic, not keyword)
        2. Retrieve relevant data based on classification
        3. Generate answer with confidence score

        Args:
            portfolio_id: Portfolio identifier
            question: Natural language question
            context: Optional additional context

        Returns:
            Dict with:
            - answer: Natural language answer
            - confidence: 0.0-1.0 confidence score
            - confidence_reasoning: Why this confidence level
            - data_points: Structured data backing the answer
            - sources: Data sources used
            - caveats: Limitations and qualifications
            - follow_up_questions: Contextual follow-ups
            - query_type: Classified query type
            - classification_confidence: Classification confidence
            - entities_detected: Detected entities (securities, time periods)
            - processing_time_ms: Time to process
        """
        start_time = datetime.now(UTC)
        query_id = f"query_{start_time.strftime('%Y%m%d%H%M%S%f')}"

        try:
            # Step 1: Get basic portfolio context for classification
            portfolio_context = await self._get_portfolio_brief(portfolio_id)
            if "error" in portfolio_context:
                return self._error_response(portfolio_context["error"], question, query_id)

            # Step 2: Classify the query using LLM (NOT keyword matching)
            classification = await self._classify_query(question, portfolio_context)

            # Step 3: Retrieve data based on classification
            query_type = classification.get("query_type", QueryType.GENERAL.value)
            entities = classification.get("entities", {})
            retrieved_data = await self._retrieve_data(
                portfolio_id=portfolio_id,
                query_type=query_type,
                entities=entities,
            )

            # Step 4: Generate answer using LLM
            response = await self._generate_answer(
                question=question,
                query_type=query_type,
                portfolio_data=retrieved_data,
                additional_context=context,
            )

            # Step 5: Calculate processing time and build result
            elapsed_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000

            result = {
                # Answer content
                "answer": response.get("answer", ""),
                "confidence": response.get("confidence", 0.0),
                "confidence_reasoning": response.get("confidence_reasoning", ""),
                "data_points": response.get("data_points", []),
                "sources": response.get("sources", []),
                "caveats": response.get("caveats", []),
                "follow_up_questions": response.get("follow_up_questions", []),
                "risk_warnings": response.get("risk_warnings", ""),
                # Classification metadata
                "query_type": query_type,
                "classification_confidence": classification.get("confidence", 0.0),
                "classification_reasoning": classification.get("reasoning", ""),
                "entities_detected": entities,
                # Request metadata
                "query_id": query_id,
                "portfolio_id": portfolio_id,
                "original_query": question,
                "processing_time_ms": elapsed_ms,
            }

            # Log query for analytics
            self._log_query(
                query_id=query_id,
                portfolio_id=portfolio_id,
                query=question,
                query_type=query_type,
                classification_confidence=classification.get("confidence", 0.0),
                answer_confidence=response.get("confidence", 0.0),
                processing_time_ms=elapsed_ms,
                entities=entities,
                success=True,
            )

            return result

        except Exception as e:
            elapsed_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000
            self._log_query(
                query_id=query_id,
                portfolio_id=portfolio_id,
                query=question,
                query_type=QueryType.GENERAL.value,
                classification_confidence=0.0,
                answer_confidence=0.0,
                processing_time_ms=elapsed_ms,
                entities={},
                success=False,
                error=str(e),
            )
            return self._error_response(str(e), question, query_id)

    async def suggest_queries(
        self,
        portfolio_id: str,
        recent_queries: list[str] | None = None,
        limit: int = 5,
    ) -> list[str]:
        """
        Suggest relevant queries based on portfolio and recent history.

        Args:
            portfolio_id: Portfolio identifier
            recent_queries: Optional list of recent queries
            limit: Maximum number of suggestions

        Returns:
            List of suggested query strings
        """
        # Get portfolio context
        portfolio_context = await self._get_portfolio_brief(portfolio_id)
        if "error" in portfolio_context:
            return []

        # Base suggestions by portfolio type
        suggestions = [
            "What is my current allocation by sector?",
            "How has my portfolio performed this month?",
            "Which holdings have the highest returns?",
            "Are there any active alerts or concerns?",
            f"What is my exposure to {portfolio_context.get('top_sector', 'technology')}?",
        ]

        # Avoid duplicating recent queries
        if recent_queries:
            recent_lower = [q.lower() for q in recent_queries]
            suggestions = [s for s in suggestions if s.lower() not in recent_lower]

        return suggestions[:limit]

    # =========================================================================
    # Step 1: LLM-Based Classification (NO Regex/Keywords)
    # =========================================================================

    async def _classify_query(
        self,
        query: str,
        portfolio_context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Classify query using LLM semantic understanding.

        CRITICAL: This uses the LLM to understand intent, NOT keyword matching.
        The LLM analyzes the semantic meaning of the query.

        Args:
            query: User's natural language query
            portfolio_context: Brief portfolio context

        Returns:
            Dict with query_type, confidence, reasoning, entities
        """
        # Format portfolio context for classifier
        context_str = self._format_portfolio_context(portfolio_context)

        # Run classifier agent
        result = self._classifier.run(
            query=query,
            portfolio_context=context_str,
        )

        # Parse JSON response
        try:
            classification_str = result.get("classification", "{}")
            classification = json.loads(classification_str)

            # Validate query_type
            valid_types = [qt.value for qt in QueryType]
            if classification.get("query_type") not in valid_types:
                classification["query_type"] = QueryType.GENERAL.value

            # Ensure confidence is valid
            confidence = classification.get("confidence", 0.5)
            classification["confidence"] = max(0.0, min(1.0, float(confidence)))

            # If confidence is too low, default to general
            if classification["confidence"] < self._query_config.reclassify_threshold:
                classification["query_type"] = QueryType.GENERAL.value

            return classification

        except (json.JSONDecodeError, ValueError, TypeError):
            # Fallback to general if parsing fails
            return {
                "query_type": QueryType.GENERAL.value,
                "confidence": 0.3,
                "reasoning": "Failed to parse classification, using general category",
                "entities": {
                    "securities": [],
                    "time_period": None,
                    "metrics": [],
                    "sectors": [],
                    "comparison_targets": [],
                },
            }

    def _format_portfolio_context(self, context: dict[str, Any]) -> str:
        """Format portfolio context string for the classifier."""
        if not context or "error" in context:
            return ""

        return f"""Portfolio: {context.get('name', 'Unknown')}
Type: {context.get('portfolio_type', 'Unknown')}
Strategy: {context.get('strategy', 'Not specified')}
Holdings Count: {context.get('holdings_count', 0)}
Total Value: {self.format_currency(context.get('total_value', 0))}
Top Sectors: {', '.join(context.get('top_sectors', [])[:3])}"""

    # =========================================================================
    # Step 2: Data Retrieval by Query Type
    # =========================================================================

    async def _retrieve_data(
        self,
        portfolio_id: str,
        query_type: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Retrieve data relevant to the classified query type.

        This is the 'R' in RAG - retrieve before generation.
        Each query type has optimized data retrieval.

        Args:
            portfolio_id: Portfolio identifier
            query_type: Classified query type
            entities: Detected entities (securities, time periods, etc.)

        Returns:
            Dict with retrieved data relevant to query type
        """
        retrieval_methods = {
            QueryType.ALLOCATION.value: self._get_allocation_data,
            QueryType.PERFORMANCE.value: self._get_performance_data,
            QueryType.HOLDINGS.value: self._get_holdings_data,
            QueryType.RATIOS.value: self._get_ratios_data,
            QueryType.COMPARISON.value: self._get_comparison_data,
            QueryType.ALERTS.value: self._get_alerts_data,
            QueryType.GENERAL.value: self._get_general_data,
        }

        retrieval_fn = retrieval_methods.get(query_type, self._get_general_data)
        return await retrieval_fn(portfolio_id, entities)

    async def _get_allocation_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve allocation-specific data (sectors, asset classes, weights)."""
        # Get holdings
        holdings = await self.db.express.list(
            "Holding",
            filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            limit=self._query_config.max_holdings,
        )

        # Get security details for sector information
        security_ids = [h.get("security_id") for h in holdings if h.get("security_id")]
        securities = {}
        for sec_id in security_ids:
            sec = await self.db.express.read("Security", sec_id)
            if sec:
                securities[sec_id] = sec

        # Calculate allocations
        total_value = sum(Decimal(str(h.get("market_value", 0) or 0)) for h in holdings)
        sector_allocation: dict[str, dict[str, float]] = {}
        asset_class_allocation: dict[str, dict[str, float]] = {}

        for holding in holdings:
            sec_id = holding.get("security_id")
            security = securities.get(sec_id, {})
            market_value = Decimal(str(holding.get("market_value", 0) or 0))

            if total_value > 0:
                weight = float(market_value / total_value * 100)

                # Sector allocation
                sector = security.get("sector") or "Unknown"
                if sector not in sector_allocation:
                    sector_allocation[sector] = {"weight": 0.0, "value": 0.0, "count": 0}
                sector_allocation[sector]["weight"] += weight
                sector_allocation[sector]["value"] += float(market_value)
                sector_allocation[sector]["count"] += 1

                # Asset class allocation
                asset_class = security.get("asset_class") or "equity"
                if asset_class not in asset_class_allocation:
                    asset_class_allocation[asset_class] = {"weight": 0.0, "value": 0.0}
                asset_class_allocation[asset_class]["weight"] += weight
                asset_class_allocation[asset_class]["value"] += float(market_value)

        # Sort top holdings by market value
        sorted_holdings = sorted(
            holdings,
            key=lambda x: Decimal(str(x.get("market_value", 0) or 0)),
            reverse=True,
        )

        return {
            "type": "allocation",
            "total_value": float(total_value),
            "holdings_count": len(holdings),
            "sector_allocation": dict(
                sorted(
                    sector_allocation.items(),
                    key=lambda x: x[1]["weight"],
                    reverse=True,
                )
            ),
            "asset_class_allocation": asset_class_allocation,
            "top_holdings": [
                {
                    "symbol": securities.get(h.get("security_id"), {}).get("ticker", "N/A"),
                    "name": securities.get(h.get("security_id"), {}).get("name", "Unknown"),
                    "sector": securities.get(h.get("security_id"), {}).get("sector", "Unknown"),
                    "weight": round(
                        (
                            float(Decimal(str(h.get("market_value", 0) or 0)) / total_value * 100)
                            if total_value > 0
                            else 0
                        ),
                        2,
                    ),
                    "market_value": float(h.get("market_value", 0) or 0),
                }
                for h in sorted_holdings[:10]
            ],
            "concentration": {
                "top_5_weight": sum(
                    (
                        float(Decimal(str(h.get("market_value", 0) or 0)) / total_value * 100)
                        if total_value > 0
                        else 0
                    )
                    for h in sorted_holdings[:5]
                ),
                "top_10_weight": sum(
                    (
                        float(Decimal(str(h.get("market_value", 0) or 0)) / total_value * 100)
                        if total_value > 0
                        else 0
                    )
                    for h in sorted_holdings[:10]
                ),
            },
        }

    async def _get_performance_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve performance-specific data (returns, risk metrics)."""
        # Get valuations
        valuations = await self.db.express.list(
            "PortfolioValuation",
            filter={"portfolio_id": portfolio_id},
            limit=self._query_config.max_valuations,
        )

        # Get portfolio for benchmark info
        portfolio = await self.db.express.read("Portfolio", portfolio_id)

        latest = valuations[0] if valuations else {}

        # Get benchmark comparison if available
        benchmark_data = None
        if portfolio and portfolio.get("benchmark_id"):
            benchmark_vals = await self.db.express.list(
                "PortfolioValuation",
                filter={"portfolio_id": portfolio.get("benchmark_id")},
                limit=1,
            )
            if benchmark_vals:
                benchmark_data = {
                    "name": portfolio.get("benchmark_name", "Benchmark"),
                    "ytd_return": float(benchmark_vals[0].get("ytd_return", 0) or 0),
                    "mtd_return": float(benchmark_vals[0].get("mtd_return", 0) or 0),
                }

        return {
            "type": "performance",
            "latest_valuation": {
                "date": latest.get("valuation_date"),
                "total_value": float(latest.get("total_value", 0) or 0),
                "daily_return": float(latest.get("daily_return", 0) or 0),
                "wtd_return": float(latest.get("wtd_return", 0) or 0),
                "mtd_return": float(latest.get("mtd_return", 0) or 0),
                "qtd_return": float(latest.get("qtd_return", 0) or 0),
                "ytd_return": float(latest.get("ytd_return", 0) or 0),
                "inception_return": float(latest.get("inception_return", 0) or 0),
            },
            "risk_metrics": {
                "volatility_30d": float(latest.get("volatility_30d", 0) or 0),
                "sharpe_ratio": float(latest.get("sharpe_ratio", 0) or 0),
                "max_drawdown_ytd": float(latest.get("max_drawdown_ytd", 0) or 0),
                "beta": float(latest.get("beta", 0) or 0),
            },
            "benchmark_comparison": benchmark_data,
            "valuation_trend": [
                {
                    "date": v.get("valuation_date"),
                    "value": float(v.get("total_value", 0) or 0),
                    "return": float(v.get("daily_return", 0) or 0),
                }
                for v in valuations[:10]
            ],
        }

    async def _get_holdings_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve holdings-specific data."""
        # Check if specific securities were mentioned
        mentioned_symbols = entities.get("securities", [])

        # Get holdings
        holdings = await self.db.express.list(
            "Holding",
            filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            limit=self._query_config.max_holdings,
        )

        # Get security details
        securities = {}
        for h in holdings:
            sec_id = h.get("security_id")
            if sec_id:
                sec = await self.db.express.read("Security", sec_id)
                if sec:
                    securities[sec_id] = sec

        # Filter to mentioned securities if any
        if mentioned_symbols:
            mentioned_upper = [s.upper() for s in mentioned_symbols]
            holdings = [
                h
                for h in holdings
                if securities.get(h.get("security_id"), {}).get("ticker", "").upper()
                in mentioned_upper
            ]

        # Format holdings
        formatted_holdings = []
        for h in holdings:
            sec = securities.get(h.get("security_id"), {})
            cost_basis = Decimal(str(h.get("cost_basis", 0) or 0))
            quantity = Decimal(str(h.get("quantity", 0) or 0))
            total_cost = cost_basis * quantity if quantity else Decimal("0")
            market_value = Decimal(str(h.get("market_value", 0) or 0))
            unrealized_pnl = market_value - total_cost
            unrealized_pnl_pct = float(unrealized_pnl / total_cost * 100) if total_cost > 0 else 0

            formatted_holdings.append(
                {
                    "symbol": sec.get("ticker", "N/A"),
                    "name": sec.get("name", "Unknown"),
                    "sector": sec.get("sector", "Unknown"),
                    "quantity": float(quantity),
                    "cost_basis": float(cost_basis),
                    "total_cost": float(total_cost),
                    "current_price": float(h.get("current_price", 0) or 0),
                    "market_value": float(market_value),
                    "unrealized_pnl": float(unrealized_pnl),
                    "unrealized_pnl_pct": round(unrealized_pnl_pct, 2),
                    "weight": float(h.get("weight", 0) or 0),
                }
            )

        # Sort by market value
        formatted_holdings.sort(key=lambda x: x["market_value"], reverse=True)

        return {
            "type": "holdings",
            "holdings_count": len(formatted_holdings),
            "mentioned_securities": mentioned_symbols,
            "holdings": formatted_holdings,
            "summary": {
                "total_market_value": sum(h["market_value"] for h in formatted_holdings),
                "total_cost": sum(h["total_cost"] for h in formatted_holdings),
                "total_unrealized_pnl": sum(h["unrealized_pnl"] for h in formatted_holdings),
            },
        }

    async def _get_ratios_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve ratio-specific data for holdings."""
        # Get holdings
        holdings = await self.db.express.list(
            "Holding",
            filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            limit=self._query_config.max_holdings,
        )

        # Get security ratios for each holding
        security_ratios = []
        for h in holdings:
            sec_id = h.get("security_id")
            if not sec_id:
                continue

            # Get security details
            security = await self.db.express.read("Security", sec_id)
            if not security:
                continue

            # Get latest ratios
            ratios = await self.db.express.list(
                "SecurityRatio",
                filter={"security_id": sec_id},
                limit=1,
            )

            if ratios:
                ratio = ratios[0]
                security_ratios.append(
                    {
                        "symbol": security.get("ticker"),
                        "name": security.get("name"),
                        "weight": float(h.get("weight", 0) or 0),
                        "ratios": {
                            # Valuation
                            "pe_ratio": (
                                self._safe_float(ratio.get("ratio_value"))
                                if ratio.get("ratio_name") == "pe_ratio"
                                else None
                            ),
                            "pb_ratio": self._safe_float(ratio.get("pb_ratio")),
                            "ps_ratio": self._safe_float(ratio.get("ps_ratio")),
                            "ev_ebitda": self._safe_float(ratio.get("ev_ebitda")),
                            # Profitability
                            "roe": self._safe_float(ratio.get("roe")),
                            "roa": self._safe_float(ratio.get("roa")),
                            "gross_margin": self._safe_float(ratio.get("gross_margin")),
                            "net_margin": self._safe_float(ratio.get("net_margin")),
                            # Liquidity
                            "current_ratio": self._safe_float(ratio.get("current_ratio")),
                            "quick_ratio": self._safe_float(ratio.get("quick_ratio")),
                            # Leverage
                            "debt_to_equity": self._safe_float(ratio.get("debt_to_equity")),
                        },
                    }
                )

        # Sort by weight
        security_ratios.sort(key=lambda x: x["weight"], reverse=True)

        return {
            "type": "ratios",
            "security_count": len(security_ratios),
            "security_ratios": security_ratios,
            "mentioned_metrics": entities.get("metrics", []),
        }

    async def _get_comparison_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve data for comparison queries."""
        # Get portfolio
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        if not portfolio:
            return {"type": "comparison", "error": "Portfolio not found"}

        # Get portfolio performance
        portfolio_perf = await self._get_performance_data(portfolio_id, entities)

        # Get benchmark performance if available
        benchmark_perf = None
        if portfolio.get("benchmark_id"):
            benchmark_perf = await self._get_performance_data(
                portfolio.get("benchmark_id"), entities
            )

        return {
            "type": "comparison",
            "portfolio": {
                "id": portfolio_id,
                "name": portfolio.get("name"),
                "performance": portfolio_perf,
            },
            "benchmark": benchmark_perf,
            "comparison_targets": entities.get("comparison_targets", []),
        }

    async def _get_alerts_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve alert-specific data."""
        # Get active alerts
        alerts = await self.db.express.list(
            "Alert",
            filter={
                "portfolio_id": portfolio_id,
                "status": "active",
            },
            limit=self._query_config.max_alerts,
        )

        formatted_alerts = [
            {
                "id": a.get("id"),
                "type": a.get("alert_type"),
                "severity": a.get("severity"),
                "title": a.get("title"),
                "message": a.get("message"),
                "triggered_at": a.get("triggered_at"),
                "security_symbol": a.get("security_symbol"),
            }
            for a in alerts
        ]

        # Group by severity
        by_severity = {
            "critical": [a for a in formatted_alerts if a["severity"] == "critical"],
            "warning": [a for a in formatted_alerts if a["severity"] == "warning"],
            "info": [a for a in formatted_alerts if a["severity"] == "info"],
        }

        return {
            "type": "alerts",
            "active_alerts_count": len(formatted_alerts),
            "alerts": formatted_alerts,
            "by_severity": by_severity,
            "has_critical": len(by_severity["critical"]) > 0,
        }

    async def _get_general_data(
        self,
        portfolio_id: str,
        entities: dict[str, Any],
    ) -> dict[str, Any]:
        """Retrieve general portfolio data for catch-all queries."""
        # Combine multiple data types
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        allocation_data = await self._get_allocation_data(portfolio_id, entities)
        performance_data = await self._get_performance_data(portfolio_id, entities)

        return {
            "type": "general",
            "portfolio": {
                "id": portfolio_id,
                "name": portfolio.get("name") if portfolio else "Unknown",
                "type": portfolio.get("portfolio_type") if portfolio else "Unknown",
                "strategy": portfolio.get("strategy") if portfolio else "N/A",
                "inception_date": portfolio.get("inception_date") if portfolio else None,
            },
            "allocation_summary": {
                "total_value": allocation_data.get("total_value"),
                "holdings_count": allocation_data.get("holdings_count"),
                "top_sectors": list(allocation_data.get("sector_allocation", {}).keys())[:3],
            },
            "performance_summary": performance_data.get("latest_valuation", {}),
        }

    # =========================================================================
    # Step 3: Answer Generation with Confidence
    # =========================================================================

    async def _generate_answer(
        self,
        question: str,
        query_type: str,
        portfolio_data: dict[str, Any],
        additional_context: str,
    ) -> dict[str, Any]:
        """
        Generate answer using LLM with confidence scoring.

        This is the 'G' in RAG - generate with retrieved context.

        Args:
            question: Original user question
            query_type: Classified query type
            portfolio_data: Retrieved portfolio data
            additional_context: Optional additional context

        Returns:
            Dict with answer, confidence, data_points, follow_ups, etc.
        """
        # Run the main agent with answer signature
        result = self.run(
            query=question,
            query_type=query_type,
            portfolio_data=json.dumps(portfolio_data, indent=2, default=str),
            additional_context=additional_context,
        )

        # Parse JSON response
        try:
            response_str = result.get("response", "{}")
            response = json.loads(response_str)

            # Validate and bound confidence
            confidence = response.get("confidence", 0.5)
            response["confidence"] = max(0.0, min(1.0, float(confidence)))

            # Add low confidence warning if needed
            if response["confidence"] < self._query_config.min_confidence_threshold:
                if "caveats" not in response:
                    response["caveats"] = []
                response["caveats"].append(
                    "This answer has lower confidence due to limited data availability."
                )

            return response

        except (json.JSONDecodeError, ValueError, TypeError):
            # Return structured response if JSON parsing fails
            return {
                "answer": result.get("response", "Unable to generate answer"),
                "confidence": 0.3,
                "confidence_reasoning": "Response parsing encountered issues",
                "data_points": [],
                "sources": [],
                "caveats": ["Response format was unexpected"],
                "follow_up_questions": [],
                "risk_warnings": "",
            }

    # =========================================================================
    # Helper Methods
    # =========================================================================

    async def _get_portfolio_brief(self, portfolio_id: str) -> dict[str, Any]:
        """Get brief portfolio context for classification."""
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        if not portfolio:
            return {"error": f"Portfolio {portfolio_id} not found"}

        # Get holdings count
        holdings_count = await self.db.express.count(
            "Holding",
            filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
        )

        # Get latest valuation
        valuations = await self.db.express.list(
            "PortfolioValuation",
            filter={"portfolio_id": portfolio_id},
            limit=1,
        )

        # Get top sectors
        holdings = await self.db.express.list(
            "Holding",
            filter={"portfolio_id": portfolio_id, "deleted_at": {"$null": True}},
            limit=20,
        )

        sectors = []
        for h in holdings:
            sec = await self.db.express.read("Security", h.get("security_id"))
            if sec and sec.get("sector"):
                sectors.append(sec.get("sector"))

        # Count sectors
        sector_counts: dict[str, int] = {}
        for s in sectors:
            sector_counts[s] = sector_counts.get(s, 0) + 1
        top_sectors = sorted(sector_counts.keys(), key=lambda x: sector_counts[x], reverse=True)[:3]

        return {
            "name": portfolio.get("name"),
            "portfolio_type": portfolio.get("portfolio_type"),
            "strategy": portfolio.get("strategy"),
            "holdings_count": holdings_count,
            "total_value": float(valuations[0].get("total_value", 0) or 0) if valuations else 0,
            "top_sectors": top_sectors,
            "top_sector": top_sectors[0] if top_sectors else "technology",
        }

    def _error_response(self, error: str, query: str, query_id: str) -> dict[str, Any]:
        """Generate error response."""
        return {
            "answer": f"I couldn't answer your question due to an error: {error}",
            "confidence": 0.0,
            "confidence_reasoning": "Error occurred during processing",
            "data_points": [],
            "sources": [],
            "caveats": [error],
            "follow_up_questions": [],
            "risk_warnings": "",
            "query_type": QueryType.GENERAL.value,
            "classification_confidence": 0.0,
            "query_id": query_id,
            "original_query": query,
            "error": error,
        }

    def _safe_float(self, value: Any) -> float | None:
        """Safely convert value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    # =========================================================================
    # Query Logging
    # =========================================================================

    def _log_query(
        self,
        query_id: str,
        portfolio_id: str,
        query: str,
        query_type: str,
        classification_confidence: float,
        answer_confidence: float,
        processing_time_ms: float,
        entities: dict[str, Any],
        success: bool,
        error: str | None = None,
    ) -> None:
        """Log query for analytics."""
        if not self._query_config.enable_query_logging:
            return

        entry = QueryLogEntry(
            query_id=query_id,
            portfolio_id=portfolio_id,
            query=query,
            query_type=query_type,
            classification_confidence=classification_confidence,
            answer_confidence=answer_confidence,
            processing_time_ms=processing_time_ms,
            timestamp=datetime.now(UTC).isoformat(),
            entities=entities,
            success=success,
            error=error,
        )

        self._query_log.append(entry)

        # Keep only last 1000 entries
        if len(self._query_log) > 1000:
            self._query_log = self._query_log[-1000:]

    def get_query_log(self) -> list[QueryLogEntry]:
        """Get query log entries."""
        return self._query_log.copy()

    def get_query_analytics(self) -> dict[str, Any]:
        """Get analytics from query log."""
        if not self._query_log:
            return {"total_queries": 0}

        total = len(self._query_log)
        successful = sum(1 for e in self._query_log if e.success)

        # Query type distribution
        type_counts: dict[str, int] = {}
        for e in self._query_log:
            type_counts[e.query_type] = type_counts.get(e.query_type, 0) + 1

        # Average metrics
        avg_classification_conf = sum(e.classification_confidence for e in self._query_log) / total
        avg_answer_conf = sum(e.answer_confidence for e in self._query_log) / total
        avg_processing_time = sum(e.processing_time_ms for e in self._query_log) / total

        return {
            "total_queries": total,
            "successful_queries": successful,
            "success_rate": successful / total if total > 0 else 0,
            "query_type_distribution": type_counts,
            "average_classification_confidence": avg_classification_conf,
            "average_answer_confidence": avg_answer_conf,
            "average_processing_time_ms": avg_processing_time,
        }


# =============================================================================
# Convenience Functions
# =============================================================================


async def query_portfolio(
    db: Any,
    portfolio_id: str,
    question: str,
    config: PortfolioQueryConfig | None = None,
) -> dict[str, Any]:
    """
    Quick one-liner for querying a portfolio.

    Args:
        db: DataFlow database instance
        portfolio_id: Portfolio identifier
        question: Natural language question
        config: Optional configuration

    Returns:
        Query result with answer and metadata

    Example:
        >>> result = await query_portfolio(db, "port-001", "What's my tech exposure?")
        >>> print(result["answer"])
    """
    agent = PortfolioQueryAgent(config=config, db=db)
    return await agent.query(portfolio_id, question)


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Agent
    "PortfolioQueryAgent",
    # Config
    "PortfolioQueryConfig",
    # Signatures
    "ClassifyQuerySignature",
    "PortfolioAnswerSignature",
    # Types
    "QueryType",
    "QueryLogEntry",
    # Convenience
    "query_portfolio",
]
