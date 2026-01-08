"""
Investment Committee Agent - Multi-agent orchestration for investment decisions.

Orchestrates specialized agents using Supervisor-Worker pattern to provide
comprehensive investment recommendations with consensus handling, dissent
tracking, and audit trails for compliance.

Architecture:
    Committee Supervisor (this agent)
        │
        ├─→ MarketIntelligenceAgent: Market conditions and sentiment
        │
        ├─→ PortfolioQueryAgent: Current portfolio state and context
        │
        └─→ FinancialAnalystAgent: Security analysis and health scores

CRITICAL RULES:
- All worker agents execute in parallel for efficiency
- Track consensus and dissenting views transparently
- Include complete audit trail for compliance (SOC2, GDPR)
- Always include risk warnings in recommendations
- Use LLM for synthesis, NOT mechanical aggregation
"""

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from kaizen.signatures import InputField, OutputField, Signature

from arc.agents.base import ARCBaseAgent
from arc.agents.config import CommitteeAgentConfig
from arc.agents.financial_analyst import FinancialAnalystAgent, FinancialAnalystConfig
from arc.agents.market_intelligence import MarketIntelligenceAgent, MarketIntelligenceConfig
from arc.agents.portfolio_query import PortfolioQueryAgent, PortfolioQueryConfig

# =============================================================================
# Enums
# =============================================================================


class RequestType(str, Enum):
    """Investment committee request types."""

    REBALANCE = "rebalance"  # Portfolio rebalancing suggestion
    BUY = "buy"  # Security buy recommendation
    SELL = "sell"  # Security sell recommendation
    HOLD = "hold"  # Hold vs action analysis
    RISK_ASSESSMENT = "risk_assessment"  # Risk evaluation
    OPPORTUNITY = "opportunity"  # Opportunity identification


class AgentRole(str, Enum):
    """Roles for worker agents in the committee."""

    MARKET = "market"  # Market Intelligence Agent
    PORTFOLIO = "portfolio"  # Portfolio Query Agent
    ANALYST = "analyst"  # Financial Analyst Agent


class VoteType(str, Enum):
    """Vote types for consensus tracking."""

    AGREE = "agree"
    PARTIALLY_AGREE = "partially_agree"
    DISAGREE = "disagree"
    ABSTAIN = "abstain"


# =============================================================================
# Signatures
# =============================================================================


class CommitteeSynthesisSignature(Signature):
    """
    Signature for synthesizing multi-agent perspectives into recommendation.

    The LLM acts as the committee chair, weighing different perspectives
    and forming a coherent recommendation with proper handling of disagreements.
    """

    # Inputs
    portfolio_id: str = InputField(description="Portfolio identifier")
    request_type: str = InputField(
        description="Request type: rebalance, buy, sell, hold, risk_assessment, opportunity"
    )
    constraints: str = InputField(
        description="JSON with investment constraints (risk limits, sector caps, etc.)",
        default="{}",
    )
    market_perspective: str = InputField(
        description="JSON with market intelligence analysis and sentiment"
    )
    portfolio_perspective: str = InputField(
        description="JSON with current portfolio state and context"
    )
    analyst_perspective: str = InputField(
        description="JSON with security analysis and health scores"
    )
    target_securities: str = InputField(
        description="JSON list of securities to focus on (for buy/sell requests)",
        default="[]",
    )

    # Chain-of-thought synthesis
    synthesis: str = OutputField(
        description="""Investment committee recommendation as JSON:
{
    "reasoning_steps": [
        "Step 1: Assess market conditions - [analysis]",
        "Step 2: Evaluate portfolio state - [analysis]",
        "Step 3: Consider security fundamentals - [analysis]",
        "Step 4: Identify consensus and disagreements - [analysis]",
        "Step 5: Weigh perspectives and form recommendation - [analysis]"
    ],
    "recommendation": "Clear, actionable recommendation statement",
    "conviction": "high|medium|low",
    "analysis_summary": {
        "market_perspective": {
            "summary": "Key market insights",
            "sentiment": "bullish|neutral|bearish",
            "confidence": 0.0-1.0,
            "key_factors": ["factor1", "factor2"]
        },
        "portfolio_perspective": {
            "summary": "Key portfolio insights",
            "alignment": "aligned|neutral|misaligned",
            "confidence": 0.0-1.0,
            "concerns": ["concern1"]
        },
        "analyst_perspective": {
            "summary": "Key security insights",
            "quality_assessment": "strong|moderate|weak",
            "confidence": 0.0-1.0,
            "top_picks": ["ticker1", "ticker2"]
        }
    },
    "action_items": [
        {
            "action": "buy|sell|hold|rebalance",
            "security": "ticker or 'portfolio'",
            "amount": "specific amount or percentage",
            "rationale": "Why this action is recommended",
            "priority": "high|medium|low",
            "timeframe": "immediate|short_term|medium_term"
        }
    ],
    "risk_considerations": [
        {
            "risk": "Description of risk",
            "severity": "high|medium|low",
            "mitigation": "How to mitigate"
        }
    ],
    "consensus_analysis": {
        "agreement_level": "full|partial|split",
        "points_of_agreement": ["point1", "point2"],
        "points_of_disagreement": ["point1"]
    },
    "dissenting_views": [
        {
            "agent": "market|portfolio|analyst",
            "view": "Description of dissenting view",
            "rationale": "Why this view differs",
            "merit": "Why this view has merit"
        }
    ],
    "constraints_validation": {
        "all_constraints_met": true|false,
        "violated_constraints": [],
        "constraint_notes": "Notes about constraint handling"
    },
    "confidence": 0.0-1.0,
    "confidence_reasoning": "Why this confidence level",
    "risk_warnings": "Mandatory risk disclosures"
}

IMPORTANT:
- Weigh all perspectives based on relevance to the request type
- Acknowledge uncertainty and disagreements transparently
- Provide specific, actionable recommendations
- Always validate against constraints
- Include risk warnings in all recommendations"""
    )


class AuditEntrySignature(Signature):
    """Signature for generating audit trail entries."""

    decision_context: str = InputField(description="JSON with decision context")
    recommendation: str = InputField(description="JSON with recommendation")

    audit_entry: str = OutputField(
        description="""Compliance-ready audit entry as JSON:
{
    "decision_id": "uuid",
    "timestamp": "ISO8601",
    "decision_type": "recommendation type",
    "portfolio_id": "portfolio identifier",
    "agents_consulted": ["market", "portfolio", "analyst"],
    "consensus_level": "full|partial|split",
    "recommendation_summary": "Brief summary",
    "key_factors": ["factor1", "factor2"],
    "risk_factors_considered": ["risk1", "risk2"],
    "constraints_validated": true|false,
    "confidence_level": 0.0-1.0,
    "dissenting_views_count": 0,
    "total_tokens_used": 0,
    "total_cost_usd": 0.0,
    "compliance_flags": []
}"""
    )


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class WorkerResult:
    """Result from a worker agent execution."""

    agent_role: str
    success: bool
    result: dict[str, Any]
    error: str | None = None
    execution_time_ms: float = 0.0
    tokens_used: int = 0
    cost_usd: float = 0.0


@dataclass
class CommitteeDecision:
    """Complete committee decision with all perspectives."""

    decision_id: str
    portfolio_id: str
    request_type: str
    timestamp: str
    recommendation: str
    conviction: str
    analysis_summary: dict[str, Any]
    action_items: list[dict[str, Any]]
    risk_considerations: list[dict[str, Any]]
    consensus_analysis: dict[str, Any]
    dissenting_views: list[dict[str, Any]]
    constraints_validation: dict[str, Any]
    confidence: float
    confidence_reasoning: str
    risk_warnings: str
    audit_trail: dict[str, Any]
    worker_results: dict[str, WorkerResult]
    total_execution_time_ms: float
    total_tokens_used: int
    total_cost_usd: float


@dataclass
class InvestmentConstraints:
    """Investment constraints for committee recommendations."""

    max_position_size_pct: float = 10.0  # Max single position
    max_sector_concentration_pct: float = 30.0  # Max sector weight
    min_liquidity_ratio: float = 1.0  # Minimum current ratio
    max_debt_to_equity: float = 2.0  # Maximum leverage
    min_health_score: int = 50  # Minimum health score for buy
    excluded_sectors: list[str] = field(default_factory=list)
    excluded_securities: list[str] = field(default_factory=list)
    risk_tolerance: str = "moderate"  # conservative, moderate, aggressive


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class InvestmentCommitteeConfig(CommitteeAgentConfig):
    """
    Configuration for Investment Committee Agent.

    Extends CommitteeAgentConfig with orchestration-specific settings.
    """

    # Override defaults for committee synthesis
    model: str = "gpt-4o"
    temperature: float = 0.3  # Higher for creative synthesis
    max_tokens: int = 10000  # Long for comprehensive recommendations
    strategy_type: str = "single_shot"  # Synthesis in one pass
    budget_limit_usd: float = 25.0  # Higher for multi-agent

    # Orchestration settings
    worker_timeout_seconds: float = 60.0  # Timeout per worker
    parallel_execution: bool = True  # Execute workers in parallel
    max_retries: int = 2  # Retries for failed workers

    # Consensus settings
    require_unanimous: bool = False
    min_confidence: float = 0.6
    min_agreement_ratio: float = 0.5  # At least 50% agreement for action

    # Audit settings
    enable_audit_trail: bool = True
    audit_retention_days: int = 365  # Keep audit logs for 1 year


# =============================================================================
# Investment Committee Agent
# =============================================================================


class InvestmentCommitteeAgent(ARCBaseAgent):
    """
    Investment Committee Agent orchestrating multi-agent investment decisions.

    This agent acts as a supervisor coordinating specialized worker agents:
    - MarketIntelligenceAgent: Analyzes market conditions and sentiment
    - PortfolioQueryAgent: Queries current portfolio state
    - FinancialAnalystAgent: Analyzes security fundamentals

    The committee synthesizes perspectives using LLM chain-of-thought reasoning,
    tracks consensus/dissent, and provides compliance-ready audit trails.

    Orchestration Flow:
        1. Receive Request → Validate constraints
        2. Delegate to Workers (Parallel) → Collect perspectives
        3. Synthesize → Form recommendation with LLM
        4. Audit → Generate compliance trail

    Example:
        >>> from dataflow import DataFlow
        >>> from arc.agents import InvestmentCommitteeAgent
        >>>
        >>> db = DataFlow("postgresql://...")
        >>> committee = InvestmentCommitteeAgent(db=db)
        >>>
        >>> # Request rebalancing recommendation
        >>> decision = await committee.recommend(
        ...     portfolio_id="port-001",
        ...     request_type="rebalance",
        ...     constraints={"max_position_size_pct": 10}
        ... )
        >>> print(decision["recommendation"])
        >>> for action in decision["action_items"]:
        ...     print(f"  {action['action']} {action['security']}: {action['rationale']}")
    """

    def __init__(
        self,
        db: Any = None,
        config: InvestmentCommitteeConfig | CommitteeAgentConfig | None = None,
        shared_memory: Any | None = None,
        agent_id: str | None = None,
    ) -> None:
        """
        Initialize Investment Committee Agent.

        Args:
            db: DataFlow database instance
            config: Committee configuration (uses defaults if None)
            shared_memory: Optional SharedMemoryPool for agent collaboration
            agent_id: Unique identifier for this agent instance
        """
        self._committee_config = config or InvestmentCommitteeConfig()

        # Initialize parent with synthesis signature
        super().__init__(
            config=self._committee_config,
            signature=CommitteeSynthesisSignature(),
            db=db,
            shared_memory=shared_memory,
            agent_id=agent_id or "investment_committee",
        )

        # Initialize worker agents (lazy - created on first use)
        self._market_agent: MarketIntelligenceAgent | None = None
        self._portfolio_agent: PortfolioQueryAgent | None = None
        self._analyst_agent: FinancialAnalystAgent | None = None

        # Audit trail storage
        self._audit_log: list[dict[str, Any]] = []

        # Cost tracking across workers
        self._session_costs: dict[str, float] = {
            "market": 0.0,
            "portfolio": 0.0,
            "analyst": 0.0,
            "synthesis": 0.0,
        }

    def _generate_system_prompt(self) -> str:
        """Generate committee chair system prompt."""
        return """You are the Investment Committee Chair for the ARC investment platform.

Your role is to synthesize multiple expert perspectives into actionable investment recommendations.

COMMITTEE PROCESS:
1. MARKET ANALYSIS: Review market conditions, sentiment, and macro factors
2. PORTFOLIO REVIEW: Understand current state, constraints, and objectives
3. SECURITY ANALYSIS: Evaluate fundamental quality and valuations
4. CONSENSUS BUILDING: Identify agreement and disagreement
5. RECOMMENDATION: Form clear, actionable guidance

SYNTHESIS GUIDELINES:
- Weight perspectives based on relevance to the request type
- For rebalancing: emphasize portfolio and market perspectives
- For buy/sell: emphasize analyst and market perspectives
- For risk assessment: weight all perspectives equally
- For opportunity identification: emphasize market and analyst

HANDLING DISAGREEMENT:
- Acknowledge dissenting views transparently
- Explain why the majority view prevails
- Note when dissent has merit worth monitoring
- Never dismiss valid concerns

CONSTRAINTS VALIDATION:
- Always check recommendations against investment constraints
- Flag any constraint violations clearly
- Suggest alternatives if constraints block the primary recommendation

CONFIDENCE SCORING:
- High (0.8-1.0): Strong consensus, complete data, clear action
- Medium (0.6-0.79): Partial consensus or some data gaps
- Low (0.4-0.59): Significant disagreement or data limitations
- Very Low (<0.4): Insufficient basis for recommendation

RISK WARNINGS (ALWAYS INCLUDE):
- Past performance does not guarantee future results
- All investments carry risk of loss
- Consider your investment objectives and risk tolerance
- Consult a qualified financial advisor for personalized advice

OUTPUT QUALITY:
- Be specific: mention tickers, amounts, timeframes
- Be balanced: include both opportunities and risks
- Be actionable: recommendations should be implementable
- Be compliant: include all required risk disclosures"""

    # =========================================================================
    # Worker Agent Management
    # =========================================================================

    def _get_market_agent(self) -> MarketIntelligenceAgent:
        """Get or create market intelligence agent."""
        if self._market_agent is None:
            self._market_agent = MarketIntelligenceAgent(
                config=MarketIntelligenceConfig(
                    model=self._committee_config.model,
                    temperature=0.25,
                    max_tokens=4000,
                ),
                db=self.db,
                shared_memory=self.shared_memory,
                agent_id=f"{self.agent_id}_market",
            )
        return self._market_agent

    def _get_portfolio_agent(self) -> PortfolioQueryAgent:
        """Get or create portfolio query agent."""
        if self._portfolio_agent is None:
            self._portfolio_agent = PortfolioQueryAgent(
                config=PortfolioQueryConfig(
                    model="gpt-4o-mini",  # Fast for queries
                    temperature=0.1,
                    max_tokens=2000,
                ),
                db=self.db,
                shared_memory=self.shared_memory,
                agent_id=f"{self.agent_id}_portfolio",
            )
        return self._portfolio_agent

    def _get_analyst_agent(self) -> FinancialAnalystAgent:
        """Get or create financial analyst agent."""
        if self._analyst_agent is None:
            self._analyst_agent = FinancialAnalystAgent(
                config=FinancialAnalystConfig(
                    model=self._committee_config.model,
                    temperature=0.2,
                    max_tokens=6000,
                    analysis_depth="standard",
                ),
                db=self.db,
                shared_memory=self.shared_memory,
                agent_id=f"{self.agent_id}_analyst",
            )
        return self._analyst_agent

    # =========================================================================
    # Main Recommendation Interface
    # =========================================================================

    async def recommend(
        self,
        portfolio_id: str,
        request_type: str,
        constraints: dict[str, Any] | None = None,
        target_securities: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Generate investment committee recommendation.

        Orchestrates multiple specialized agents to provide comprehensive
        investment guidance with consensus tracking and audit trails.

        Args:
            portfolio_id: Portfolio identifier
            request_type: Type of recommendation (rebalance, buy, sell, hold,
                         risk_assessment, opportunity)
            constraints: Optional investment constraints
            target_securities: Optional list of securities to focus on

        Returns:
            Complete committee decision with:
            - recommendation: Clear action statement
            - conviction: high/medium/low
            - action_items: Specific actions to take
            - risk_considerations: Identified risks
            - dissenting_views: Alternative perspectives
            - confidence: 0.0-1.0
            - audit_trail: Compliance-ready audit data

        Example:
            >>> decision = await committee.recommend(
            ...     portfolio_id="port-001",
            ...     request_type="rebalance",
            ...     constraints={"max_sector_concentration_pct": 25}
            ... )
            >>> print(f"Recommendation: {decision['recommendation']}")
            >>> print(f"Conviction: {decision['conviction']}")
        """
        decision_id = str(uuid.uuid4())
        start_time = datetime.now(UTC)

        try:
            # Validate request type
            if not self._validate_request_type(request_type):
                return self._error_response(
                    f"Invalid request type: {request_type}. "
                    f"Valid types: {[rt.value for rt in RequestType]}",
                    decision_id,
                    start_time,
                )

            # Parse constraints
            parsed_constraints = self._parse_constraints(constraints or {})

            # Step 1: Execute worker agents in parallel
            worker_results = await self._execute_workers(
                portfolio_id=portfolio_id,
                request_type=request_type,
                target_securities=target_securities or [],
            )

            # Check if we have minimum viable results
            if not self._has_viable_results(worker_results):
                return self._error_response(
                    "Insufficient data from worker agents for recommendation",
                    decision_id,
                    start_time,
                    worker_results=worker_results,
                )

            # Step 2: Synthesize perspectives with LLM
            synthesis = await self._synthesize_perspectives(
                portfolio_id=portfolio_id,
                request_type=request_type,
                constraints=parsed_constraints,
                worker_results=worker_results,
                target_securities=target_securities or [],
            )

            # Step 3: Validate against constraints
            synthesis = self._validate_constraints(synthesis, parsed_constraints)

            # Step 4: Build audit trail
            audit_trail = self._build_audit_trail(
                decision_id=decision_id,
                portfolio_id=portfolio_id,
                request_type=request_type,
                synthesis=synthesis,
                worker_results=worker_results,
                start_time=start_time,
            )

            # Calculate totals
            total_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            total_tokens = sum(wr.tokens_used for wr in worker_results.values())
            total_cost = sum(wr.cost_usd for wr in worker_results.values())

            # Build final response
            return {
                "decision_id": decision_id,
                "portfolio_id": portfolio_id,
                "request_type": request_type,
                "generated_at": datetime.now(UTC).isoformat(),
                "recommendation": synthesis.get("recommendation", ""),
                "conviction": synthesis.get("conviction", "medium"),
                "analysis_summary": synthesis.get("analysis_summary", {}),
                "action_items": synthesis.get("action_items", []),
                "risk_considerations": synthesis.get("risk_considerations", []),
                "consensus_analysis": synthesis.get("consensus_analysis", {}),
                "dissenting_views": synthesis.get("dissenting_views", []),
                "constraints_validation": synthesis.get("constraints_validation", {}),
                "confidence": synthesis.get("confidence", 0.0),
                "confidence_reasoning": synthesis.get("confidence_reasoning", ""),
                "risk_warnings": synthesis.get(
                    "risk_warnings",
                    "Past performance does not guarantee future results. "
                    "All investments carry risk of loss.",
                ),
                "audit_trail": audit_trail,
                "_metadata": {
                    "total_execution_time_ms": total_time,
                    "total_tokens_used": total_tokens,
                    "total_cost_usd": total_cost,
                    "workers_consulted": list(worker_results.keys()),
                    "agent_id": self.agent_id,
                    "model": self._committee_config.model,
                },
            }

        except Exception as e:
            return self._error_response(str(e), decision_id, start_time)

    # =========================================================================
    # Worker Execution
    # =========================================================================

    async def _execute_workers(
        self,
        portfolio_id: str,
        request_type: str,
        target_securities: list[str],
    ) -> dict[str, WorkerResult]:
        """
        Execute worker agents in parallel.

        Args:
            portfolio_id: Portfolio identifier
            request_type: Type of recommendation request
            target_securities: Securities to focus on

        Returns:
            Dict mapping agent role to WorkerResult
        """
        timeout = self._committee_config.worker_timeout_seconds

        # Create tasks for parallel execution
        tasks = {
            AgentRole.MARKET.value: self._execute_market_worker(portfolio_id),
            AgentRole.PORTFOLIO.value: self._execute_portfolio_worker(portfolio_id, request_type),
            AgentRole.ANALYST.value: self._execute_analyst_worker(portfolio_id, target_securities),
        }

        # Execute in parallel with timeout
        results: dict[str, WorkerResult] = {}

        if self._committee_config.parallel_execution:
            # Parallel execution
            gathered = await asyncio.gather(
                *[asyncio.wait_for(task, timeout=timeout) for task in tasks.values()],
                return_exceptions=True,
            )

            for role, result in zip(tasks.keys(), gathered, strict=True):
                if isinstance(result, Exception):
                    results[role] = WorkerResult(
                        agent_role=role,
                        success=False,
                        result={},
                        error=str(result),
                    )
                else:
                    results[role] = result
        else:
            # Sequential execution (for debugging)
            for role, task in tasks.items():
                try:
                    results[role] = await asyncio.wait_for(task, timeout=timeout)
                except TimeoutError:
                    results[role] = WorkerResult(
                        agent_role=role,
                        success=False,
                        result={},
                        error=f"Timeout after {timeout}s",
                    )
                except Exception as e:
                    results[role] = WorkerResult(
                        agent_role=role,
                        success=False,
                        result={},
                        error=str(e),
                    )

        return results

    async def _execute_market_worker(self, portfolio_id: str) -> WorkerResult:
        """Execute market intelligence worker."""
        start_time = datetime.now(UTC)
        agent = self._get_market_agent()

        try:
            # Generate market brief for the portfolio
            result = await agent.generate_brief(
                portfolio_id=portfolio_id,
                brief_type="daily",
                output_format="detailed",
            )

            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            cost = agent.get_total_cost()
            self._session_costs["market"] += cost

            return WorkerResult(
                agent_role=AgentRole.MARKET.value,
                success="error" not in result,
                result=result,
                error=result.get("error"),
                execution_time_ms=execution_time,
                cost_usd=cost,
            )
        except Exception as e:
            return WorkerResult(
                agent_role=AgentRole.MARKET.value,
                success=False,
                result={},
                error=str(e),
            )

    async def _execute_portfolio_worker(
        self,
        portfolio_id: str,
        request_type: str,
    ) -> WorkerResult:
        """Execute portfolio query worker."""
        start_time = datetime.now(UTC)
        agent = self._get_portfolio_agent()

        try:
            # Query portfolio context based on request type
            query = self._build_portfolio_query(request_type)
            result = await agent.query(portfolio_id, query)

            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            cost = agent.get_total_cost()
            self._session_costs["portfolio"] += cost

            return WorkerResult(
                agent_role=AgentRole.PORTFOLIO.value,
                success="error" not in result,
                result=result,
                error=result.get("error"),
                execution_time_ms=execution_time,
                cost_usd=cost,
            )
        except Exception as e:
            return WorkerResult(
                agent_role=AgentRole.PORTFOLIO.value,
                success=False,
                result={},
                error=str(e),
            )

    async def _execute_analyst_worker(
        self,
        portfolio_id: str,
        target_securities: list[str],
    ) -> WorkerResult:
        """Execute financial analyst worker."""
        start_time = datetime.now(UTC)
        agent = self._get_analyst_agent()

        try:
            # If specific securities targeted, analyze them
            if target_securities:
                analyses = {}
                for sec_id in target_securities[:5]:  # Limit to 5 for efficiency
                    analysis = await agent.analyze_security(sec_id, analysis_type="quick")
                    analyses[sec_id] = analysis
                result = {
                    "type": "targeted_analysis",
                    "securities_analyzed": len(analyses),
                    "analyses": analyses,
                }
            else:
                # Portfolio-level analysis
                result = await agent.analyze_portfolio(
                    portfolio_id=portfolio_id,
                    include_holdings_analysis=True,
                )
                result["type"] = "portfolio_analysis"

            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            cost = agent.get_total_cost()
            self._session_costs["analyst"] += cost

            return WorkerResult(
                agent_role=AgentRole.ANALYST.value,
                success="error" not in result,
                result=result,
                error=result.get("error"),
                execution_time_ms=execution_time,
                cost_usd=cost,
            )
        except Exception as e:
            return WorkerResult(
                agent_role=AgentRole.ANALYST.value,
                success=False,
                result={},
                error=str(e),
            )

    def _build_portfolio_query(self, request_type: str) -> str:
        """Build portfolio query based on request type."""
        queries = {
            RequestType.REBALANCE.value: (
                "What is the current allocation by sector and asset class? "
                "What is the concentration in top holdings? "
                "Are there any significant deviations from target allocation?"
            ),
            RequestType.BUY.value: (
                "What is the current cash position and buying power? "
                "What sectors are underweight? "
                "What is the portfolio's risk profile?"
            ),
            RequestType.SELL.value: (
                "Which positions have the largest gains? "
                "Which positions are underperforming? "
                "What is the current sector concentration?"
            ),
            RequestType.HOLD.value: (
                "What is the overall portfolio performance? "
                "Are there any positions with significant unrealized gains or losses? "
                "What is the current volatility?"
            ),
            RequestType.RISK_ASSESSMENT.value: (
                "What is the portfolio's risk exposure by sector? "
                "What is the concentration risk? "
                "Are there any alerts or threshold breaches?"
            ),
            RequestType.OPPORTUNITY.value: (
                "What sectors have room for additional investment? "
                "What is the cash available for new positions? "
                "What is the current risk capacity?"
            ),
        }
        return queries.get(
            request_type,
            "Provide a comprehensive overview of the portfolio's current state.",
        )

    # =========================================================================
    # Synthesis
    # =========================================================================

    async def _synthesize_perspectives(
        self,
        portfolio_id: str,
        request_type: str,
        constraints: InvestmentConstraints,
        worker_results: dict[str, WorkerResult],
        target_securities: list[str],
    ) -> dict[str, Any]:
        """
        Synthesize worker perspectives into recommendation using LLM.

        Args:
            portfolio_id: Portfolio identifier
            request_type: Type of recommendation
            constraints: Parsed investment constraints
            worker_results: Results from worker agents
            target_securities: Target securities for focused requests

        Returns:
            Synthesized recommendation
        """
        # Prepare perspectives
        market_perspective = self._format_market_perspective(
            worker_results.get(AgentRole.MARKET.value)
        )
        portfolio_perspective = self._format_portfolio_perspective(
            worker_results.get(AgentRole.PORTFOLIO.value)
        )
        analyst_perspective = self._format_analyst_perspective(
            worker_results.get(AgentRole.ANALYST.value)
        )

        # Call LLM for synthesis
        result = await self.run_async(
            portfolio_id=portfolio_id,
            request_type=request_type,
            constraints=json.dumps(self._constraints_to_dict(constraints)),
            market_perspective=json.dumps(market_perspective),
            portfolio_perspective=json.dumps(portfolio_perspective),
            analyst_perspective=json.dumps(analyst_perspective),
            target_securities=json.dumps(target_securities),
        )

        # Parse synthesis response
        synthesis = self._parse_synthesis_response(result)

        # Track synthesis cost
        self._session_costs["synthesis"] = self.get_total_cost()

        return synthesis

    def _format_market_perspective(
        self,
        worker_result: WorkerResult | None,
    ) -> dict[str, Any]:
        """Format market worker result for synthesis."""
        if not worker_result or not worker_result.success:
            return {
                "available": False,
                "error": worker_result.error if worker_result else "Agent not executed",
            }

        result = worker_result.result
        return {
            "available": True,
            "executive_summary": result.get("executive_summary", ""),
            "market_assessment": result.get("step1_market_assessment", ""),
            "sentiment_analysis": result.get("step3_sentiment_analysis", ""),
            "opportunities_risks": result.get("step4_opportunity_risk", ""),
            "actionable_takeaways": result.get("actionable_takeaways", []),
            "confidence": result.get("confidence", 0.0),
        }

    def _format_portfolio_perspective(
        self,
        worker_result: WorkerResult | None,
    ) -> dict[str, Any]:
        """Format portfolio worker result for synthesis."""
        if not worker_result or not worker_result.success:
            return {
                "available": False,
                "error": worker_result.error if worker_result else "Agent not executed",
            }

        result = worker_result.result
        return {
            "available": True,
            "answer": result.get("answer", ""),
            "query_type": result.get("query_type", ""),
            "data_points": result.get("data_points", []),
            "confidence": result.get("confidence", 0.0),
            "caveats": result.get("caveats", []),
        }

    def _format_analyst_perspective(
        self,
        worker_result: WorkerResult | None,
    ) -> dict[str, Any]:
        """Format analyst worker result for synthesis."""
        if not worker_result or not worker_result.success:
            return {
                "available": False,
                "error": worker_result.error if worker_result else "Agent not executed",
            }

        result = worker_result.result
        analysis_type = result.get("type", "unknown")

        if analysis_type == "targeted_analysis":
            # Targeted security analysis
            analyses = result.get("analyses", {})
            securities_summary = []
            for sec_id, analysis in analyses.items():
                health = analysis.get("financial_health", {})
                securities_summary.append(
                    {
                        "security_id": sec_id,
                        "health_score": health.get("score", 0),
                        "health_grade": health.get("grade", "N/A"),
                        "strengths": analysis.get("strengths", [])[:3],
                        "concerns": analysis.get("concerns", [])[:3],
                        "recommendation": analysis.get("recommendation", ""),
                    }
                )
            return {
                "available": True,
                "type": "targeted",
                "securities_analyzed": len(securities_summary),
                "securities": securities_summary,
            }
        else:
            # Portfolio analysis
            health = result.get("portfolio_health", {})
            return {
                "available": True,
                "type": "portfolio",
                "portfolio_health": {
                    "score": health.get("score", 0),
                    "grade": health.get("grade", "N/A"),
                    "trend": health.get("trend", "unknown"),
                },
                "summary": result.get("summary", ""),
                "top_performers": result.get("top_performers", []),
                "concerns": result.get("concerns", []),
                "recommendations": result.get("recommendations", []),
                "confidence": result.get("confidence", 0.0),
            }

    def _parse_synthesis_response(self, result: dict[str, Any]) -> dict[str, Any]:
        """Parse synthesis LLM response."""
        synthesis_str = result.get("synthesis", "{}")

        try:
            if isinstance(synthesis_str, str):
                # Handle markdown code blocks
                if "```json" in synthesis_str:
                    synthesis_str = synthesis_str.split("```json")[1].split("```")[0]
                elif "```" in synthesis_str:
                    synthesis_str = synthesis_str.split("```")[1].split("```")[0]

                synthesis = json.loads(synthesis_str)
            else:
                synthesis = synthesis_str

            # Validate and bound confidence
            confidence = synthesis.get("confidence", 0.5)
            synthesis["confidence"] = max(0.0, min(1.0, float(confidence)))

            return synthesis

        except json.JSONDecodeError:
            return {
                "recommendation": "Unable to synthesize recommendation",
                "conviction": "low",
                "confidence": 0.0,
                "confidence_reasoning": "Failed to parse synthesis response",
                "error": "JSON parsing failed",
            }

    # =========================================================================
    # Validation
    # =========================================================================

    def _validate_request_type(self, request_type: str) -> bool:
        """Validate request type is supported."""
        valid_types = [rt.value for rt in RequestType]
        return request_type in valid_types

    def _parse_constraints(self, constraints: dict[str, Any]) -> InvestmentConstraints:
        """Parse constraint dict into InvestmentConstraints."""
        return InvestmentConstraints(
            max_position_size_pct=constraints.get("max_position_size_pct", 10.0),
            max_sector_concentration_pct=constraints.get("max_sector_concentration_pct", 30.0),
            min_liquidity_ratio=constraints.get("min_liquidity_ratio", 1.0),
            max_debt_to_equity=constraints.get("max_debt_to_equity", 2.0),
            min_health_score=constraints.get("min_health_score", 50),
            excluded_sectors=constraints.get("excluded_sectors", []),
            excluded_securities=constraints.get("excluded_securities", []),
            risk_tolerance=constraints.get("risk_tolerance", "moderate"),
        )

    def _constraints_to_dict(self, constraints: InvestmentConstraints) -> dict[str, Any]:
        """Convert constraints to dict for JSON serialization."""
        return {
            "max_position_size_pct": constraints.max_position_size_pct,
            "max_sector_concentration_pct": constraints.max_sector_concentration_pct,
            "min_liquidity_ratio": constraints.min_liquidity_ratio,
            "max_debt_to_equity": constraints.max_debt_to_equity,
            "min_health_score": constraints.min_health_score,
            "excluded_sectors": constraints.excluded_sectors,
            "excluded_securities": constraints.excluded_securities,
            "risk_tolerance": constraints.risk_tolerance,
        }

    def _validate_constraints(
        self,
        synthesis: dict[str, Any],
        constraints: InvestmentConstraints,
    ) -> dict[str, Any]:
        """Validate synthesis against constraints."""
        validation = synthesis.get("constraints_validation", {})

        # Check action items against excluded securities
        action_items = synthesis.get("action_items", [])
        violated = []

        for action in action_items:
            security = action.get("security", "")
            if security in constraints.excluded_securities:
                violated.append(f"Excluded security: {security}")

        if violated:
            validation["all_constraints_met"] = False
            validation["violated_constraints"] = violated
            synthesis["constraints_validation"] = validation

        return synthesis

    def _has_viable_results(self, worker_results: dict[str, WorkerResult]) -> bool:
        """Check if we have minimum viable worker results."""
        # Need at least 2 successful workers for meaningful synthesis
        successful = sum(1 for wr in worker_results.values() if wr.success)
        return successful >= 2

    # =========================================================================
    # Audit Trail
    # =========================================================================

    def _build_audit_trail(
        self,
        decision_id: str,
        portfolio_id: str,
        request_type: str,
        synthesis: dict[str, Any],
        worker_results: dict[str, WorkerResult],
        start_time: datetime,
    ) -> dict[str, Any]:
        """Build compliance-ready audit trail."""
        end_time = datetime.now(UTC)

        # Calculate totals
        total_tokens = sum(wr.tokens_used for wr in worker_results.values())
        total_cost = sum(wr.cost_usd for wr in worker_results.values())
        total_cost += self._session_costs.get("synthesis", 0.0)

        # Build audit entry
        audit_entry = {
            "decision_id": decision_id,
            "timestamp": end_time.isoformat(),
            "decision_type": request_type,
            "portfolio_id": portfolio_id,
            "agents_consulted": [role for role, wr in worker_results.items() if wr.success],
            "consensus_level": synthesis.get("consensus_analysis", {}).get(
                "agreement_level", "unknown"
            ),
            "recommendation_summary": synthesis.get("recommendation", "")[:200],
            "key_factors": synthesis.get("reasoning_steps", [])[:3],
            "risk_factors_considered": [
                r.get("risk", "") for r in synthesis.get("risk_considerations", [])
            ],
            "constraints_validated": synthesis.get("constraints_validation", {}).get(
                "all_constraints_met", True
            ),
            "confidence_level": synthesis.get("confidence", 0.0),
            "dissenting_views_count": len(synthesis.get("dissenting_views", [])),
            "total_tokens_used": total_tokens,
            "total_cost_usd": total_cost,
            "execution_time_ms": (end_time - start_time).total_seconds() * 1000,
            "compliance_flags": self._get_compliance_flags(synthesis),
            "worker_details": {
                role: {
                    "success": wr.success,
                    "execution_time_ms": wr.execution_time_ms,
                    "cost_usd": wr.cost_usd,
                    "error": wr.error,
                }
                for role, wr in worker_results.items()
            },
        }

        # Store in audit log
        if self._committee_config.enable_audit_trail:
            self._audit_log.append(audit_entry)

        return audit_entry

    def _get_compliance_flags(self, synthesis: dict[str, Any]) -> list[str]:
        """Get compliance flags for audit."""
        flags = []

        # Check confidence threshold
        confidence = synthesis.get("confidence", 0.0)
        if confidence < self._committee_config.min_confidence:
            flags.append(
                f"LOW_CONFIDENCE: {confidence:.2f} < {self._committee_config.min_confidence}"
            )

        # Check constraint violations
        constraints_valid = synthesis.get("constraints_validation", {})
        if not constraints_valid.get("all_constraints_met", True):
            flags.append("CONSTRAINT_VIOLATION")

        # Check for dissent
        dissenting_views = synthesis.get("dissenting_views", [])
        if len(dissenting_views) > 1:
            flags.append(f"SIGNIFICANT_DISSENT: {len(dissenting_views)} views")

        # Check for missing risk warnings
        if not synthesis.get("risk_warnings"):
            flags.append("MISSING_RISK_WARNINGS")

        return flags

    # =========================================================================
    # Convenience Methods
    # =========================================================================

    async def recommend_rebalance(
        self,
        portfolio_id: str,
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate rebalancing recommendation.

        Args:
            portfolio_id: Portfolio identifier
            constraints: Optional investment constraints

        Returns:
            Rebalancing recommendation
        """
        return await self.recommend(
            portfolio_id=portfolio_id,
            request_type=RequestType.REBALANCE.value,
            constraints=constraints,
        )

    async def recommend_buy(
        self,
        portfolio_id: str,
        target_securities: list[str],
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate buy recommendation for specific securities.

        Args:
            portfolio_id: Portfolio identifier
            target_securities: Securities to evaluate for purchase
            constraints: Optional investment constraints

        Returns:
            Buy recommendation
        """
        return await self.recommend(
            portfolio_id=portfolio_id,
            request_type=RequestType.BUY.value,
            constraints=constraints,
            target_securities=target_securities,
        )

    async def recommend_sell(
        self,
        portfolio_id: str,
        target_securities: list[str] | None = None,
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate sell recommendation.

        Args:
            portfolio_id: Portfolio identifier
            target_securities: Optional securities to evaluate for sale
            constraints: Optional investment constraints

        Returns:
            Sell recommendation
        """
        return await self.recommend(
            portfolio_id=portfolio_id,
            request_type=RequestType.SELL.value,
            constraints=constraints,
            target_securities=target_securities,
        )

    async def assess_risk(
        self,
        portfolio_id: str,
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate risk assessment.

        Args:
            portfolio_id: Portfolio identifier
            constraints: Optional investment constraints

        Returns:
            Risk assessment
        """
        return await self.recommend(
            portfolio_id=portfolio_id,
            request_type=RequestType.RISK_ASSESSMENT.value,
            constraints=constraints,
        )

    async def identify_opportunities(
        self,
        portfolio_id: str,
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Identify investment opportunities.

        Args:
            portfolio_id: Portfolio identifier
            constraints: Optional investment constraints

        Returns:
            Opportunity identification
        """
        return await self.recommend(
            portfolio_id=portfolio_id,
            request_type=RequestType.OPPORTUNITY.value,
            constraints=constraints,
        )

    # =========================================================================
    # Audit Log Access
    # =========================================================================

    def get_audit_log(self) -> list[dict[str, Any]]:
        """Get complete audit log."""
        return self._audit_log.copy()

    def get_session_costs(self) -> dict[str, float]:
        """Get cost breakdown by agent."""
        return self._session_costs.copy()

    def get_total_session_cost(self) -> float:
        """Get total cost for this session."""
        return sum(self._session_costs.values())

    # =========================================================================
    # Error Handling
    # =========================================================================

    def _error_response(
        self,
        error: str,
        decision_id: str,
        start_time: datetime,
        worker_results: dict[str, WorkerResult] | None = None,
    ) -> dict[str, Any]:
        """Create error response."""
        return {
            "decision_id": decision_id,
            "generated_at": datetime.now(UTC).isoformat(),
            "recommendation": f"Unable to generate recommendation: {error}",
            "conviction": "low",
            "confidence": 0.0,
            "error": error,
            "action_items": [],
            "risk_considerations": [],
            "dissenting_views": [],
            "risk_warnings": (
                "This recommendation could not be generated. "
                "Please consult a qualified financial advisor."
            ),
            "audit_trail": {
                "decision_id": decision_id,
                "timestamp": datetime.now(UTC).isoformat(),
                "error": error,
                "compliance_flags": ["ERROR_OCCURRED"],
            },
            "_metadata": {
                "total_execution_time_ms": (datetime.now(UTC) - start_time).total_seconds() * 1000,
                "agent_id": self.agent_id,
                "worker_results": {
                    role: {"success": wr.success, "error": wr.error}
                    for role, wr in (worker_results or {}).items()
                },
            },
        }


# =============================================================================
# Convenience Functions
# =============================================================================


async def get_committee_recommendation(
    db: Any,
    portfolio_id: str,
    request_type: str = "rebalance",
    constraints: dict[str, Any] | None = None,
    config: InvestmentCommitteeConfig | None = None,
) -> dict[str, Any]:
    """
    Convenience function to get committee recommendation.

    Args:
        db: DataFlow database instance
        portfolio_id: Portfolio identifier
        request_type: Type of recommendation
        constraints: Optional investment constraints
        config: Optional committee configuration

    Returns:
        Committee recommendation

    Example:
        >>> decision = await get_committee_recommendation(db, "port-001")
        >>> print(decision["recommendation"])
    """
    committee = InvestmentCommitteeAgent(db=db, config=config)
    return await committee.recommend(
        portfolio_id=portfolio_id,
        request_type=request_type,
        constraints=constraints,
    )


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Agent
    "InvestmentCommitteeAgent",
    # Config
    "InvestmentCommitteeConfig",
    # Signatures
    "CommitteeSynthesisSignature",
    "AuditEntrySignature",
    # Enums
    "RequestType",
    "AgentRole",
    "VoteType",
    # Data Classes
    "WorkerResult",
    "CommitteeDecision",
    "InvestmentConstraints",
    # Convenience
    "get_committee_recommendation",
]
