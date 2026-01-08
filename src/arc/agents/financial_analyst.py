"""
Financial Analyst Agent - Comprehensive security and portfolio analysis.

Provides LLM-based financial analysis using chain-of-thought reasoning:
- Multi-faceted security analysis (liquidity, profitability, leverage, valuation, growth)
- Anomaly detection with severity scoring
- Health score calculation (0-100) with grade (A-F)
- Peer comparison and benchmarking
- Portfolio-level analysis with recommendations

CRITICAL RULES:
- Use LLM for synthesis and insights, NOT mechanical ratio calculations
- Chain-of-thought reasoning for complex analysis
- Always include confidence scoring with reasoning
- Include risk warnings in all recommendations
"""

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from kaizen.signatures import InputField, OutputField, Signature

from arc.agents.base import ARCBaseAgent
from arc.agents.config import AnalystAgentConfig, ARCAgentConfig

# =============================================================================
# Enums
# =============================================================================


class AnalysisType(str, Enum):
    """Types of financial analysis."""

    QUICK = "quick"
    STANDARD = "standard"
    COMPREHENSIVE = "comprehensive"


class HealthGrade(str, Enum):
    """Financial health grades."""

    A = "A"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


class AnomalySeverity(str, Enum):
    """Anomaly severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyType(str, Enum):
    """Types of financial anomalies."""

    SUDDEN_RATIO_CHANGE = "sudden_ratio_change"
    TREND_REVERSAL = "trend_reversal"
    PEER_OUTLIER = "peer_outlier"
    THRESHOLD_BREACH = "threshold_breach"
    DATA_QUALITY = "data_quality"


# =============================================================================
# Signatures
# =============================================================================


class SecurityAnalysisSignature(Signature):
    """
    Signature for comprehensive security analysis.

    Uses LLM chain-of-thought reasoning to synthesize insights from
    financial data, NOT just mechanical ratio calculations.
    """

    # Inputs
    company_name: str = InputField(description="Company name being analyzed")
    ticker: str = InputField(description="Stock ticker symbol")
    financial_data: str = InputField(
        description="JSON with security info, prices, fundamentals, and ratios"
    )
    peer_data: str = InputField(
        description="JSON with peer group comparison data",
        default="{}",
    )
    analysis_type: str = InputField(
        description="Analysis depth: 'quick', 'standard', 'comprehensive'",
        default="standard",
    )

    # Chain-of-thought output
    analysis: str = OutputField(
        description="""Comprehensive financial analysis as JSON:
{
    "reasoning_steps": [
        "Step 1: ...",
        "Step 2: ..."
    ],
    "summary": "Executive summary of the analysis",
    "financial_health": {
        "score": 0-100,
        "grade": "A/B/C/D/F",
        "trend": "improving/stable/declining",
        "score_breakdown": {
            "liquidity_score": 0-100,
            "profitability_score": 0-100,
            "leverage_score": 0-100,
            "valuation_score": 0-100,
            "growth_score": 0-100
        }
    },
    "liquidity_analysis": {
        "assessment": "Strong/Adequate/Weak",
        "current_ratio": number,
        "quick_ratio": number,
        "cash_ratio": number,
        "insights": ["insight1", "insight2"],
        "risk_level": "low/medium/high"
    },
    "profitability_analysis": {
        "assessment": "Strong/Adequate/Weak",
        "gross_margin": number,
        "operating_margin": number,
        "net_margin": number,
        "roe": number,
        "roa": number,
        "insights": ["insight1", "insight2"],
        "trend": "improving/stable/declining"
    },
    "leverage_analysis": {
        "assessment": "Conservative/Moderate/Aggressive",
        "debt_to_equity": number,
        "debt_to_assets": number,
        "interest_coverage": number,
        "insights": ["insight1", "insight2"],
        "risk_level": "low/medium/high"
    },
    "valuation_analysis": {
        "assessment": "Undervalued/Fairly Valued/Overvalued",
        "pe_ratio": number,
        "pb_ratio": number,
        "ev_ebitda": number,
        "insights": ["insight1", "insight2"],
        "vs_peers": "discount/premium/inline"
    },
    "growth_analysis": {
        "assessment": "High Growth/Moderate Growth/Low Growth/Declining",
        "revenue_growth": number,
        "earnings_growth": number,
        "insights": ["insight1", "insight2"],
        "outlook": "positive/neutral/negative"
    },
    "strengths": ["strength1", "strength2", "strength3"],
    "concerns": ["concern1", "concern2"],
    "peer_comparison": {
        "peer_group": "group name",
        "profitability_percentile": 0-100,
        "valuation_percentile": 0-100,
        "leverage_percentile": 0-100,
        "growth_percentile": 0-100,
        "relative_strengths": ["strength1"],
        "relative_weaknesses": ["weakness1"]
    },
    "recommendation": "Overall investment thesis and recommendation",
    "confidence": 0.0-1.0,
    "confidence_reasoning": "Why this confidence level"
}"""
    )


class AnomalyDetectionSignature(Signature):
    """
    Signature for detecting financial anomalies.

    Uses LLM to identify unusual patterns that may indicate
    financial stress, data quality issues, or investment opportunities.
    """

    # Inputs
    company_name: str = InputField(description="Company name")
    ticker: str = InputField(description="Stock ticker symbol")
    historical_data: str = InputField(
        description="JSON with historical financial metrics (multiple periods)"
    )
    peer_data: str = InputField(
        description="JSON with peer group statistics for comparison",
        default="{}",
    )
    thresholds: str = InputField(
        description="JSON with threshold values for alerts",
        default="{}",
    )

    # Output
    anomalies: str = OutputField(
        description="""Detected anomalies as JSON:
{
    "anomalies": [
        {
            "anomaly_type": "sudden_ratio_change|trend_reversal|peer_outlier|threshold_breach|data_quality",
            "severity": "low|medium|high|critical",
            "severity_score": 0.0-1.0,
            "metric": "metric name affected",
            "description": "Human-readable description",
            "current_value": number,
            "previous_value": number or null,
            "expected_range": {"min": number, "max": number} or null,
            "std_deviations": number or null,
            "recommended_action": "What to do about it",
            "detected_at": "ISO timestamp"
        }
    ],
    "summary": "Overall anomaly summary",
    "risk_assessment": "low|medium|high|critical",
    "confidence": 0.0-1.0
}"""
    )


class PortfolioHealthSignature(Signature):
    """
    Signature for portfolio-level financial health analysis.

    Synthesizes individual security analyses into portfolio-level insights.
    """

    # Inputs
    portfolio_name: str = InputField(description="Portfolio name")
    holdings_data: str = InputField(description="JSON with holdings and their security analyses")
    allocation_data: str = InputField(
        description="JSON with current allocation by sector/asset class"
    )
    benchmark_data: str = InputField(
        description="JSON with benchmark comparison data",
        default="{}",
    )

    # Output
    analysis: str = OutputField(
        description="""Portfolio health analysis as JSON:
{
    "reasoning_steps": ["Step 1: ...", "Step 2: ..."],
    "summary": "Executive summary",
    "portfolio_health": {
        "score": 0-100,
        "grade": "A/B/C/D/F",
        "trend": "improving/stable/declining"
    },
    "sector_analysis": [
        {
            "sector": "sector name",
            "weight": 0.0-1.0,
            "avg_health_score": 0-100,
            "insights": ["insight1"]
        }
    ],
    "concentration_risk": {
        "assessment": "Low/Moderate/High",
        "top_holdings_weight": 0.0-1.0,
        "sector_concentration": 0.0-1.0,
        "insights": ["insight1"]
    },
    "quality_distribution": {
        "grade_a_weight": 0.0-1.0,
        "grade_b_weight": 0.0-1.0,
        "grade_c_weight": 0.0-1.0,
        "grade_d_weight": 0.0-1.0,
        "grade_f_weight": 0.0-1.0
    },
    "top_performers": [{"ticker": "XXX", "health_score": 0-100, "weight": 0.0-1.0}],
    "concerns": [{"ticker": "XXX", "health_score": 0-100, "issues": ["issue1"]}],
    "recommendations": ["recommendation1", "recommendation2"],
    "risk_warnings": "Important risk disclosures",
    "confidence": 0.0-1.0
}"""
    )


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class FinancialAnalystConfig(ARCAgentConfig):
    """
    Configuration for Financial Analyst Agent.

    Extends ARCAgentConfig with analyst-specific settings.
    """

    # Override defaults
    model: str = "gpt-4o"
    temperature: float = 0.2  # Low for consistent analysis
    max_tokens: int = 8000  # Long for detailed analysis
    strategy_type: str = "multi_cycle"
    max_cycles: int = 10

    # Analysis settings
    analysis_depth: str = "standard"  # quick, standard, comprehensive
    include_peer_comparison: bool = True
    include_historical_trends: bool = True

    # Thresholds
    min_confidence_threshold: float = 0.6
    low_confidence_caveat: bool = True

    # Anomaly detection
    anomaly_std_threshold: float = 2.0  # Standard deviations for anomaly
    enable_anomaly_detection: bool = True

    # Health score weights
    health_score_weights: dict[str, float] = field(
        default_factory=lambda: {
            "liquidity": 0.20,
            "profitability": 0.25,
            "leverage": 0.20,
            "valuation": 0.15,
            "growth": 0.20,
        }
    )


# =============================================================================
# Analysis Result Classes
# =============================================================================


@dataclass
class AnalysisResult:
    """Result from security analysis."""

    security_id: str
    ticker: str
    company_name: str
    analysis_type: str
    generated_at: str
    summary: str
    financial_health: dict[str, Any]
    liquidity_analysis: dict[str, Any]
    profitability_analysis: dict[str, Any]
    leverage_analysis: dict[str, Any]
    valuation_analysis: dict[str, Any]
    growth_analysis: dict[str, Any]
    strengths: list[str]
    concerns: list[str]
    peer_comparison: dict[str, Any]
    recommendation: str
    confidence: float
    confidence_reasoning: str
    reasoning_steps: list[str]
    _metadata: dict[str, Any]


@dataclass
class AnomalyResult:
    """Result from anomaly detection."""

    security_id: str
    ticker: str
    anomaly_type: str
    severity: str
    severity_score: float
    metric: str
    description: str
    current_value: float | None
    previous_value: float | None
    expected_range: dict[str, float] | None
    std_deviations: float | None
    recommended_action: str
    detected_at: str


# =============================================================================
# Financial Analyst Agent
# =============================================================================


class FinancialAnalystAgent(ARCBaseAgent):
    """
    Financial Analyst Agent for comprehensive security and portfolio analysis.

    Uses LLM chain-of-thought reasoning to synthesize financial insights:
    - Multi-faceted security analysis (5 dimensions)
    - Anomaly detection with severity scoring
    - Health score calculation with grade
    - Peer comparison and benchmarking
    - Portfolio-level aggregation

    The agent uses LLM for synthesis and insights, NOT mechanical calculations.
    Financial ratios are calculated by the data layer; the LLM interprets them.

    Example:
        >>> from dataflow import DataFlow
        >>> from arc.agents import FinancialAnalystAgent
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> agent = FinancialAnalystAgent(db=db)
        >>>
        >>> # Analyze a security
        >>> result = await agent.analyze_security("AAPL")
        >>> print(f"Health Score: {result['financial_health']['score']}")
        >>> print(f"Grade: {result['financial_health']['grade']}")
        >>>
        >>> # Detect anomalies
        >>> anomalies = await agent.detect_anomalies(["AAPL", "MSFT"])
        >>> for a in anomalies:
        ...     print(f"{a['ticker']}: {a['description']}")
    """

    def __init__(
        self,
        db: Any = None,
        config: FinancialAnalystConfig | AnalystAgentConfig | None = None,
        shared_memory: Any | None = None,
        agent_id: str | None = None,
    ) -> None:
        """
        Initialize Financial Analyst Agent.

        Args:
            db: DataFlow database instance
            config: Agent configuration (uses FinancialAnalystConfig defaults if None)
            shared_memory: Optional shared memory pool for multi-agent collaboration
            agent_id: Unique identifier for this agent instance
        """
        self._analyst_config = config or FinancialAnalystConfig()

        # Ensure we have FinancialAnalystConfig for analyst-specific settings
        if isinstance(self._analyst_config, FinancialAnalystConfig):
            self._health_weights = self._analyst_config.health_score_weights
            self._min_confidence = self._analyst_config.min_confidence_threshold
            self._anomaly_std = self._analyst_config.anomaly_std_threshold
        else:
            self._health_weights = {
                "liquidity": 0.20,
                "profitability": 0.25,
                "leverage": 0.20,
                "valuation": 0.15,
                "growth": 0.20,
            }
            self._min_confidence = 0.6
            self._anomaly_std = 2.0

        super().__init__(
            config=self._analyst_config,
            signature=SecurityAnalysisSignature(),
            db=db,
            shared_memory=shared_memory,
            agent_id=agent_id or "financial_analyst",
        )

        # Create specialized agents for different signatures
        self._anomaly_signature = AnomalyDetectionSignature()
        self._portfolio_signature = PortfolioHealthSignature()

    def _generate_system_prompt(self) -> str:
        """Generate financial analyst system prompt."""
        return """You are an expert financial analyst for the ARC investment platform.

Your role is to provide comprehensive financial analysis using chain-of-thought reasoning:

ANALYSIS METHODOLOGY:
1. LIQUIDITY ANALYSIS: Assess short-term financial health
   - Current ratio, quick ratio, cash ratio
   - Working capital trends
   - Ability to meet short-term obligations

2. PROFITABILITY ANALYSIS: Evaluate earnings quality
   - Margin analysis (gross, operating, net)
   - Return metrics (ROE, ROA, ROIC)
   - Trend analysis and sustainability

3. LEVERAGE ANALYSIS: Assess capital structure
   - Debt levels and composition
   - Interest coverage
   - Financial flexibility

4. VALUATION ANALYSIS: Determine relative value
   - Compare to historical averages
   - Compare to peer group
   - Consider growth-adjusted metrics

5. GROWTH ANALYSIS: Evaluate growth trajectory
   - Revenue and earnings growth
   - Organic vs acquired growth
   - Sustainability of growth rates

GUIDELINES:
- Use chain-of-thought reasoning: show your analytical process step by step
- Be specific with numbers and cite the data you're analyzing
- Distinguish between facts and interpretations
- Consider industry context for all metrics
- Provide confidence scores that reflect data quality and analysis certainty
- Include both strengths and concerns for balanced analysis
- Health scores should be justified by component scores
- Grades should be consistent: A (90+), B (80-89), C (70-79), D (60-69), F (<60)

ANOMALY DETECTION:
- Look for sudden changes (>2 std dev from historical mean)
- Identify trend reversals (direction change after 3+ periods)
- Flag peer outliers (>2 std dev from peer group)
- Note threshold breaches (critical levels like debt covenants)
- Report data quality issues (missing/inconsistent data)

RISK WARNINGS:
Always include appropriate risk disclosures. Past performance does not guarantee future results."""

    # =========================================================================
    # Security Analysis
    # =========================================================================

    async def analyze_security(
        self,
        security_id: str,
        analysis_type: str = "standard",
        include_peer_comparison: bool = True,
    ) -> dict[str, Any]:
        """
        Perform comprehensive financial analysis of a security.

        Uses LLM chain-of-thought reasoning to synthesize insights from
        financial data across 5 dimensions: liquidity, profitability,
        leverage, valuation, and growth.

        Args:
            security_id: Security ID or ticker symbol
            analysis_type: Depth of analysis ('quick', 'standard', 'comprehensive')
            include_peer_comparison: Include peer group comparison

        Returns:
            Dict with comprehensive analysis including health score and grade

        Example:
            >>> result = await agent.analyze_security("AAPL")
            >>> print(f"Grade: {result['financial_health']['grade']}")
            >>> for strength in result['strengths']:
            ...     print(f"+ {strength}")
        """
        start_time = datetime.now(UTC)

        try:
            # Get security context
            security_context = await self.get_security_context(security_id)
            if "error" in security_context:
                return self._error_response(security_context["error"], start_time)

            security = security_context.get("security", {})
            ticker = security.get("ticker", security_id)
            company_name = security.get("name", ticker)

            # Build financial data package
            financial_data = self._build_financial_data(security_context)

            # Get peer comparison data if requested
            peer_data = {}
            if include_peer_comparison:
                peer_data = await self._get_peer_data(security)

            # Call LLM for analysis
            result = await self.run_async(
                company_name=company_name,
                ticker=ticker,
                financial_data=json.dumps(financial_data),
                peer_data=json.dumps(peer_data),
                analysis_type=analysis_type,
            )

            # Parse and validate response
            analysis = self._parse_analysis_response(result)

            # Post-process: validate health score and grade consistency
            analysis = self._validate_health_analysis(analysis)

            # Add metadata
            analysis["_metadata"] = {
                "security_id": security.get("id", security_id),
                "ticker": ticker,
                "analysis_type": analysis_type,
                "generated_at": datetime.now(UTC).isoformat(),
                "processing_time_ms": int((datetime.now(UTC) - start_time).total_seconds() * 1000),
                "agent_id": self.agent_id,
                "model": self._analyst_config.model,
            }

            # Add low confidence caveat if needed
            if analysis.get("confidence", 1.0) < self._min_confidence:
                analysis = self._add_low_confidence_caveat(analysis)

            return analysis

        except Exception as e:
            return self._error_response(str(e), start_time)

    def _build_financial_data(self, security_context: dict[str, Any]) -> dict[str, Any]:
        """Build financial data package from security context."""
        security = security_context.get("security", {})
        fundamentals = security_context.get("fundamentals", [])
        ratios = security_context.get("ratios", {})
        prices = security_context.get("prices", [])

        # Get latest fundamentals
        latest_fundamentals = fundamentals[0] if fundamentals else {}

        # Calculate price changes
        current_price = float(prices[0].get("close_price", 0)) if prices else 0
        price_changes = {}
        if len(prices) > 1:
            prev_price = float(prices[1].get("close_price", 0))
            if prev_price > 0:
                price_changes["1d"] = (current_price - prev_price) / prev_price * 100

        return {
            "security": {
                "ticker": security.get("ticker"),
                "name": security.get("name"),
                "sector": security.get("sector"),
                "industry": security.get("industry"),
                "market_cap": security.get("market_cap"),
            },
            "current_price": current_price,
            "price_changes": price_changes,
            "fundamentals": {
                "revenue": self._safe_float(latest_fundamentals.get("revenue")),
                "net_income": self._safe_float(latest_fundamentals.get("net_income")),
                "total_assets": self._safe_float(latest_fundamentals.get("total_assets")),
                "total_liabilities": self._safe_float(latest_fundamentals.get("total_liabilities")),
                "total_equity": self._safe_float(latest_fundamentals.get("total_equity")),
                "current_assets": self._safe_float(latest_fundamentals.get("current_assets")),
                "current_liabilities": self._safe_float(
                    latest_fundamentals.get("current_liabilities")
                ),
                "cash_and_equivalents": self._safe_float(
                    latest_fundamentals.get("cash_and_equivalents")
                ),
                "total_debt": self._safe_float(latest_fundamentals.get("total_debt")),
                "ebitda": self._safe_float(latest_fundamentals.get("ebitda")),
                "operating_income": self._safe_float(latest_fundamentals.get("operating_income")),
                "gross_profit": self._safe_float(latest_fundamentals.get("gross_profit")),
                "fiscal_period": latest_fundamentals.get("fiscal_period"),
            },
            "ratios": {
                "pe_ratio": self._safe_float(ratios.get("pe_ratio")),
                "pb_ratio": self._safe_float(ratios.get("pb_ratio")),
                "ps_ratio": self._safe_float(ratios.get("ps_ratio")),
                "ev_ebitda": self._safe_float(ratios.get("ev_ebitda")),
                "current_ratio": self._safe_float(ratios.get("current_ratio")),
                "quick_ratio": self._safe_float(ratios.get("quick_ratio")),
                "debt_to_equity": self._safe_float(ratios.get("debt_to_equity")),
                "debt_to_assets": self._safe_float(ratios.get("debt_to_assets")),
                "interest_coverage": self._safe_float(ratios.get("interest_coverage")),
                "gross_margin": self._safe_float(ratios.get("gross_margin")),
                "operating_margin": self._safe_float(ratios.get("operating_margin")),
                "net_margin": self._safe_float(ratios.get("net_margin")),
                "roe": self._safe_float(ratios.get("roe")),
                "roa": self._safe_float(ratios.get("roa")),
                "roic": self._safe_float(ratios.get("roic")),
                "asset_turnover": self._safe_float(ratios.get("asset_turnover")),
                "inventory_turnover": self._safe_float(ratios.get("inventory_turnover")),
                "receivables_turnover": self._safe_float(ratios.get("receivables_turnover")),
            },
            "historical_fundamentals": [
                {
                    "fiscal_period": f.get("fiscal_period"),
                    "revenue": self._safe_float(f.get("revenue")),
                    "net_income": self._safe_float(f.get("net_income")),
                }
                for f in fundamentals[:4]  # Last 4 periods
            ],
        }

    async def _get_peer_data(self, security: dict[str, Any]) -> dict[str, Any]:
        """Get peer comparison data for a security."""
        if not self.db:
            return {}

        try:
            sector = security.get("sector")
            if not sector:
                return {}

            # Get peer securities in same sector
            peers = await self.db.express.list(
                "Security",
                filter={
                    "sector": sector,
                    "id": {"$ne": security.get("id")},
                },
                limit=10,
            )

            if not peers:
                return {}

            # Get ratios for peers
            peer_ratios = []
            for peer in peers:
                ratios = await self.db.express.list(
                    "SecurityRatio",
                    filter={"security_id": peer.get("id")},
                    limit=1,
                )
                if ratios:
                    peer_ratios.append(
                        {
                            "ticker": peer.get("ticker"),
                            "pe_ratio": self._safe_float(ratios[0].get("pe_ratio")),
                            "pb_ratio": self._safe_float(ratios[0].get("pb_ratio")),
                            "roe": self._safe_float(ratios[0].get("roe")),
                            "debt_to_equity": self._safe_float(ratios[0].get("debt_to_equity")),
                            "gross_margin": self._safe_float(ratios[0].get("gross_margin")),
                            "revenue_growth": self._safe_float(ratios[0].get("revenue_growth")),
                        }
                    )

            # Calculate peer statistics
            if peer_ratios:
                return {
                    "peer_group": f"{sector} Peers",
                    "peer_count": len(peer_ratios),
                    "peers": peer_ratios,
                    "statistics": self._calculate_peer_statistics(peer_ratios),
                }

            return {}
        except Exception:
            return {}

    def _calculate_peer_statistics(self, peer_ratios: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate statistics from peer ratios."""
        stats = {}
        metrics = ["pe_ratio", "pb_ratio", "roe", "debt_to_equity", "gross_margin"]

        for metric in metrics:
            values = [p.get(metric) for p in peer_ratios if p.get(metric) is not None]
            if values:
                values.sort()
                n = len(values)
                stats[metric] = {
                    "median": values[n // 2],
                    "min": values[0],
                    "max": values[-1],
                    "count": n,
                }

        return stats

    def _parse_analysis_response(self, result: dict[str, Any]) -> dict[str, Any]:
        """Parse and validate LLM analysis response."""
        analysis_str = result.get("analysis", "{}")

        try:
            # Try to parse JSON
            if isinstance(analysis_str, str):
                # Handle potential markdown code blocks
                if "```json" in analysis_str:
                    analysis_str = analysis_str.split("```json")[1].split("```")[0]
                elif "```" in analysis_str:
                    analysis_str = analysis_str.split("```")[1].split("```")[0]

                analysis = json.loads(analysis_str)
            else:
                analysis = analysis_str

            return analysis

        except json.JSONDecodeError:
            # Return structured error response
            return {
                "summary": "Analysis could not be parsed",
                "financial_health": {"score": 0, "grade": "F", "trend": "unknown"},
                "confidence": 0.0,
                "confidence_reasoning": "Failed to parse LLM response",
                "error": "JSON parsing failed",
            }

    def _validate_health_analysis(self, analysis: dict[str, Any]) -> dict[str, Any]:
        """Validate and fix health score/grade consistency."""
        health = analysis.get("financial_health", {})
        score = health.get("score", 0)
        grade = health.get("grade", "F")

        # Calculate expected grade from score
        expected_grade = self._score_to_grade(score)

        if grade != expected_grade:
            health["grade"] = expected_grade
            if "warnings" not in analysis:
                analysis["warnings"] = []
            analysis["warnings"].append(
                f"Grade adjusted from {grade} to {expected_grade} for consistency with score {score}"
            )

        # Ensure confidence is bounded
        confidence = analysis.get("confidence", 0.5)
        analysis["confidence"] = max(0.0, min(1.0, confidence))

        return analysis

    @staticmethod
    def _score_to_grade(score: float) -> str:
        """Convert health score to letter grade."""
        if score >= 90:
            return "A"
        if score >= 80:
            return "B"
        if score >= 70:
            return "C"
        if score >= 60:
            return "D"
        return "F"

    def _add_low_confidence_caveat(self, analysis: dict[str, Any]) -> dict[str, Any]:
        """Add caveat for low confidence analysis."""
        caveat = (
            " Note: This analysis has lower confidence due to limited or uncertain data. "
            "Please verify key findings independently."
        )
        if "summary" in analysis:
            analysis["summary"] = analysis["summary"] + caveat
        return analysis

    # =========================================================================
    # Anomaly Detection
    # =========================================================================

    async def detect_anomalies(
        self,
        security_ids: list[str],
        lookback_periods: int = 4,
    ) -> list[dict[str, Any]]:
        """
        Detect financial anomalies across multiple securities.

        Uses LLM to identify unusual patterns:
        - Sudden ratio changes (>2 std dev)
        - Trend reversals
        - Peer outliers
        - Threshold breaches
        - Data quality issues

        Args:
            security_ids: List of security IDs or tickers to analyze
            lookback_periods: Number of periods for historical comparison

        Returns:
            List of detected anomalies with severity scoring

        Example:
            >>> anomalies = await agent.detect_anomalies(["AAPL", "MSFT"])
            >>> for a in anomalies:
            ...     if a['severity'] == 'high':
            ...         print(f"HIGH: {a['ticker']} - {a['description']}")
        """
        all_anomalies = []

        for security_id in security_ids:
            try:
                anomalies = await self._detect_security_anomalies(security_id, lookback_periods)
                all_anomalies.extend(anomalies)
            except Exception as e:
                all_anomalies.append(
                    {
                        "security_id": security_id,
                        "anomaly_type": "data_quality",
                        "severity": "low",
                        "severity_score": 0.3,
                        "metric": "analysis",
                        "description": f"Could not analyze: {e!s}",
                        "recommended_action": "Verify data availability",
                        "detected_at": datetime.now(UTC).isoformat(),
                    }
                )

        return all_anomalies

    async def _detect_security_anomalies(
        self,
        security_id: str,
        lookback_periods: int,
    ) -> list[dict[str, Any]]:
        """Detect anomalies for a single security."""
        # Get security context
        security_context = await self.get_security_context(security_id)
        if "error" in security_context:
            return []

        security = security_context.get("security", {})
        ticker = security.get("ticker", security_id)
        company_name = security.get("name", ticker)

        # Build historical data
        historical_data = await self._build_historical_data(
            security.get("id", security_id), lookback_periods
        )

        if not historical_data.get("periods"):
            return []

        # Get peer data for comparison
        peer_data = await self._get_peer_data(security)

        # Build thresholds
        thresholds = self._get_anomaly_thresholds()

        # Create anomaly detection agent call
        # We temporarily switch signature for this call
        original_signature = self.signature
        self.signature = self._anomaly_signature

        try:
            result = await self.run_async(
                company_name=company_name,
                ticker=ticker,
                historical_data=json.dumps(historical_data),
                peer_data=json.dumps(peer_data),
                thresholds=json.dumps(thresholds),
            )

            # Parse response
            anomalies = self._parse_anomaly_response(result, security_id, ticker)
            return anomalies

        finally:
            self.signature = original_signature

    async def _build_historical_data(
        self,
        security_id: str,
        lookback_periods: int,
    ) -> dict[str, Any]:
        """Build historical financial data for anomaly detection."""
        if not self.db:
            return {}

        try:
            # Get historical fundamentals
            fundamentals = await self.db.express.list(
                "CompanyFundamentals",
                filter={"security_id": security_id},
                limit=lookback_periods + 1,
            )

            if not fundamentals:
                return {}

            # Get historical ratios
            ratios = await self.db.express.list(
                "SecurityRatio",
                filter={"security_id": security_id},
                limit=lookback_periods + 1,
            )

            periods = []
            for i, f in enumerate(fundamentals):
                r = ratios[i] if i < len(ratios) else {}
                periods.append(
                    {
                        "period": f.get("fiscal_period"),
                        "revenue": self._safe_float(f.get("revenue")),
                        "net_income": self._safe_float(f.get("net_income")),
                        "current_ratio": self._safe_float(r.get("current_ratio")),
                        "quick_ratio": self._safe_float(r.get("quick_ratio")),
                        "debt_to_equity": self._safe_float(r.get("debt_to_equity")),
                        "gross_margin": self._safe_float(r.get("gross_margin")),
                        "operating_margin": self._safe_float(r.get("operating_margin")),
                        "net_margin": self._safe_float(r.get("net_margin")),
                        "roe": self._safe_float(r.get("roe")),
                        "roa": self._safe_float(r.get("roa")),
                    }
                )

            return {
                "periods": periods,
                "period_count": len(periods),
            }

        except Exception:
            return {}

    def _get_anomaly_thresholds(self) -> dict[str, Any]:
        """Get threshold values for anomaly detection."""
        return {
            "current_ratio": {"warning": 1.0, "critical": 0.5},
            "quick_ratio": {"warning": 0.8, "critical": 0.3},
            "debt_to_equity": {"warning": 2.0, "critical": 4.0},
            "interest_coverage": {"warning": 2.0, "critical": 1.0},
            "net_margin": {"warning": 0.0, "critical": -0.1},
            "roe": {"warning": 0.0, "critical": -0.1},
            "std_deviation_threshold": self._anomaly_std,
        }

    def _parse_anomaly_response(
        self,
        result: dict[str, Any],
        security_id: str,
        ticker: str,
    ) -> list[dict[str, Any]]:
        """Parse anomaly detection response."""
        anomalies_str = result.get("anomalies", "{}")

        try:
            if isinstance(anomalies_str, str):
                if "```json" in anomalies_str:
                    anomalies_str = anomalies_str.split("```json")[1].split("```")[0]
                elif "```" in anomalies_str:
                    anomalies_str = anomalies_str.split("```")[1].split("```")[0]

                parsed = json.loads(anomalies_str)
            else:
                parsed = anomalies_str

            anomalies = parsed.get("anomalies", [])

            # Add security_id and ticker to each anomaly
            for a in anomalies:
                a["security_id"] = security_id
                a["ticker"] = ticker
                if "detected_at" not in a:
                    a["detected_at"] = datetime.now(UTC).isoformat()

            return anomalies

        except json.JSONDecodeError:
            return []

    # =========================================================================
    # Portfolio Analysis
    # =========================================================================

    async def analyze_portfolio(
        self,
        portfolio_id: str,
        include_holdings_analysis: bool = True,
    ) -> dict[str, Any]:
        """
        Perform portfolio-level financial health analysis.

        Aggregates individual security analyses into portfolio insights.

        Args:
            portfolio_id: Portfolio identifier
            include_holdings_analysis: Whether to analyze individual holdings

        Returns:
            Dict with portfolio health score, sector analysis, and recommendations

        Example:
            >>> result = await agent.analyze_portfolio("port-001")
            >>> print(f"Portfolio Health: {result['portfolio_health']['grade']}")
            >>> for rec in result['recommendations']:
            ...     print(f"- {rec}")
        """
        start_time = datetime.now(UTC)

        try:
            # Get portfolio context
            portfolio_context = await self.get_portfolio_context(portfolio_id)
            if "error" in portfolio_context:
                return self._error_response(portfolio_context["error"], start_time)

            portfolio = portfolio_context.get("portfolio", {})
            holdings = portfolio_context.get("holdings", [])

            if not holdings:
                return {
                    "portfolio_health": {"score": 0, "grade": "F", "trend": "unknown"},
                    "summary": "No holdings found in portfolio",
                    "confidence": 0.0,
                }

            # Analyze individual holdings if requested
            holdings_analyses = {}
            if include_holdings_analysis:
                for holding in holdings[:20]:  # Limit to top 20 holdings
                    security_id = holding.get("security_id")
                    if security_id:
                        analysis = await self.analyze_security(security_id, analysis_type="quick")
                        if "error" not in analysis:
                            holdings_analyses[security_id] = analysis

            # Build holdings data with analyses
            holdings_data = self._build_holdings_data(holdings, holdings_analyses)

            # Build allocation data
            allocation_data = self._build_allocation_data(holdings)

            # Get benchmark data
            benchmark_data = await self._get_benchmark_data(portfolio)

            # Switch to portfolio signature
            original_signature = self.signature
            self.signature = self._portfolio_signature

            try:
                result = await self.run_async(
                    portfolio_name=portfolio.get("name", portfolio_id),
                    holdings_data=json.dumps(holdings_data),
                    allocation_data=json.dumps(allocation_data),
                    benchmark_data=json.dumps(benchmark_data),
                )

                analysis = self._parse_portfolio_response(result)

                # Add metadata
                analysis["_metadata"] = {
                    "portfolio_id": portfolio_id,
                    "generated_at": datetime.now(UTC).isoformat(),
                    "processing_time_ms": int(
                        (datetime.now(UTC) - start_time).total_seconds() * 1000
                    ),
                    "holdings_analyzed": len(holdings_analyses),
                    "agent_id": self.agent_id,
                }

                return analysis

            finally:
                self.signature = original_signature

        except Exception as e:
            return self._error_response(str(e), start_time)

    def _build_holdings_data(
        self,
        holdings: list[dict[str, Any]],
        analyses: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        """Build holdings data with analyses."""
        holdings_list = []

        for h in holdings:
            security_id = h.get("security_id")
            analysis = analyses.get(security_id, {})

            holdings_list.append(
                {
                    "security_id": security_id,
                    "ticker": h.get("ticker", "N/A"),
                    "weight": self._safe_float(h.get("weight", 0)),
                    "market_value": self._safe_float(h.get("market_value", 0)),
                    "health_score": analysis.get("financial_health", {}).get("score"),
                    "health_grade": analysis.get("financial_health", {}).get("grade"),
                    "strengths": analysis.get("strengths", []),
                    "concerns": analysis.get("concerns", []),
                }
            )

        return {
            "holdings": holdings_list,
            "total_holdings": len(holdings_list),
            "analyzed_count": sum(1 for h in holdings_list if h.get("health_score") is not None),
        }

    def _build_allocation_data(self, holdings: list[dict[str, Any]]) -> dict[str, Any]:
        """Build allocation data from holdings."""
        sector_allocation = {}
        total_value = Decimal("0")

        for h in holdings:
            sector = h.get("sector", "Unknown")
            value = Decimal(str(h.get("market_value", 0) or 0))
            total_value += value

            if sector not in sector_allocation:
                sector_allocation[sector] = Decimal("0")
            sector_allocation[sector] += value

        # Convert to percentages
        allocation = {}
        if total_value > 0:
            for sector, value in sector_allocation.items():
                allocation[sector] = float(value / total_value)

        return {
            "by_sector": allocation,
            "total_value": float(total_value),
        }

    async def _get_benchmark_data(self, portfolio: dict[str, Any]) -> dict[str, Any]:
        """Get benchmark comparison data."""
        benchmark_id = portfolio.get("benchmark_id")
        if not benchmark_id or not self.db:
            return {}

        try:
            benchmark = await self.db.express.read("Benchmark", benchmark_id)
            if not benchmark:
                return {}

            return {
                "name": benchmark.get("name"),
                "return_ytd": self._safe_float(benchmark.get("return_ytd")),
                "return_1y": self._safe_float(benchmark.get("return_1y")),
            }
        except Exception:
            return {}

    def _parse_portfolio_response(self, result: dict[str, Any]) -> dict[str, Any]:
        """Parse portfolio analysis response."""
        analysis_str = result.get("analysis", "{}")

        try:
            if isinstance(analysis_str, str):
                if "```json" in analysis_str:
                    analysis_str = analysis_str.split("```json")[1].split("```")[0]
                elif "```" in analysis_str:
                    analysis_str = analysis_str.split("```")[1].split("```")[0]

                analysis = json.loads(analysis_str)
            else:
                analysis = analysis_str

            return analysis

        except json.JSONDecodeError:
            return {
                "summary": "Portfolio analysis could not be parsed",
                "portfolio_health": {"score": 0, "grade": "F", "trend": "unknown"},
                "confidence": 0.0,
            }

    # =========================================================================
    # Helper Methods
    # =========================================================================

    @staticmethod
    def _safe_float(value: Any) -> float | None:
        """Safely convert value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def _error_response(self, error: str, start_time: datetime) -> dict[str, Any]:
        """Create error response."""
        return {
            "summary": f"Analysis failed: {error}",
            "financial_health": {"score": 0, "grade": "F", "trend": "unknown"},
            "confidence": 0.0,
            "error": error,
            "_metadata": {
                "generated_at": datetime.now(UTC).isoformat(),
                "processing_time_ms": int((datetime.now(UTC) - start_time).total_seconds() * 1000),
                "agent_id": self.agent_id,
            },
        }


# =============================================================================
# Convenience Functions
# =============================================================================


async def analyze_security(
    db: Any,
    security_id: str,
    analysis_type: str = "standard",
    config: FinancialAnalystConfig | None = None,
) -> dict[str, Any]:
    """
    Convenience function to analyze a security.

    Args:
        db: DataFlow database instance
        security_id: Security ID or ticker symbol
        analysis_type: Analysis depth ('quick', 'standard', 'comprehensive')
        config: Optional agent configuration

    Returns:
        Security analysis result

    Example:
        >>> result = await analyze_security(db, "AAPL")
        >>> print(f"Health: {result['financial_health']['grade']}")
    """
    agent = FinancialAnalystAgent(db=db, config=config)
    return await agent.analyze_security(security_id, analysis_type=analysis_type)


async def detect_anomalies(
    db: Any,
    security_ids: list[str],
    config: FinancialAnalystConfig | None = None,
) -> list[dict[str, Any]]:
    """
    Convenience function to detect anomalies.

    Args:
        db: DataFlow database instance
        security_ids: List of security IDs or tickers
        config: Optional agent configuration

    Returns:
        List of detected anomalies

    Example:
        >>> anomalies = await detect_anomalies(db, ["AAPL", "MSFT"])
        >>> high_severity = [a for a in anomalies if a['severity'] == 'high']
    """
    agent = FinancialAnalystAgent(db=db, config=config)
    return await agent.detect_anomalies(security_ids)


async def analyze_portfolio_health(
    db: Any,
    portfolio_id: str,
    config: FinancialAnalystConfig | None = None,
) -> dict[str, Any]:
    """
    Convenience function to analyze portfolio health.

    Args:
        db: DataFlow database instance
        portfolio_id: Portfolio identifier
        config: Optional agent configuration

    Returns:
        Portfolio health analysis

    Example:
        >>> result = await analyze_portfolio_health(db, "port-001")
        >>> print(f"Portfolio Grade: {result['portfolio_health']['grade']}")
    """
    agent = FinancialAnalystAgent(db=db, config=config)
    return await agent.analyze_portfolio(portfolio_id)
