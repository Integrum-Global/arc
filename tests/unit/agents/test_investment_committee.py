"""
Unit tests for Investment Committee Agent.

Tests the multi-agent orchestration, consensus handling, and recommendation
synthesis capabilities of the InvestmentCommitteeAgent.

These tests use mocked worker agents to test orchestration logic without
making actual LLM calls or database queries.
"""

import asyncio
import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.agents.investment_committee import (
    AgentRole,
    AuditEntrySignature,
    CommitteeDecision,
    CommitteeSynthesisSignature,
    InvestmentCommitteeAgent,
    InvestmentCommitteeConfig,
    InvestmentConstraints,
    RequestType,
    VoteType,
    WorkerResult,
    get_committee_recommendation,
)


# =============================================================================
# Test Configuration
# =============================================================================


class TestInvestmentCommitteeConfig:
    """Tests for InvestmentCommitteeConfig."""

    def test_default_config(self) -> None:
        """Test default configuration values."""
        config = InvestmentCommitteeConfig()

        assert config.model == "gpt-4o"
        assert config.temperature == 0.3
        assert config.max_tokens == 10000
        assert config.strategy_type == "single_shot"
        assert config.budget_limit_usd == 25.0
        assert config.worker_timeout_seconds == 60.0
        assert config.parallel_execution is True
        assert config.max_retries == 2
        assert config.require_unanimous is False
        assert config.min_confidence == 0.6
        assert config.min_agreement_ratio == 0.5
        assert config.enable_audit_trail is True
        assert config.audit_retention_days == 365

    def test_custom_config(self) -> None:
        """Test custom configuration values."""
        config = InvestmentCommitteeConfig(
            model="gpt-4o-mini",
            temperature=0.5,
            worker_timeout_seconds=30.0,
            parallel_execution=False,
            require_unanimous=True,
            min_confidence=0.8,
        )

        assert config.model == "gpt-4o-mini"
        assert config.temperature == 0.5
        assert config.worker_timeout_seconds == 30.0
        assert config.parallel_execution is False
        assert config.require_unanimous is True
        assert config.min_confidence == 0.8

    def test_config_to_kaizen(self) -> None:
        """Test conversion to Kaizen config."""
        config = InvestmentCommitteeConfig()
        kaizen_config = config.to_kaizen_config()

        assert "llm_provider" in kaizen_config
        assert "model" in kaizen_config
        assert "temperature" in kaizen_config
        assert kaizen_config["model"] == "gpt-4o"


# =============================================================================
# Test Enums
# =============================================================================


class TestEnums:
    """Tests for enumeration types."""

    def test_request_type_values(self) -> None:
        """Test RequestType enum values."""
        assert RequestType.REBALANCE.value == "rebalance"
        assert RequestType.BUY.value == "buy"
        assert RequestType.SELL.value == "sell"
        assert RequestType.HOLD.value == "hold"
        assert RequestType.RISK_ASSESSMENT.value == "risk_assessment"
        assert RequestType.OPPORTUNITY.value == "opportunity"

    def test_request_type_all_values(self) -> None:
        """Test all request types are defined."""
        expected = {"rebalance", "buy", "sell", "hold", "risk_assessment", "opportunity"}
        actual = {rt.value for rt in RequestType}
        assert actual == expected

    def test_agent_role_values(self) -> None:
        """Test AgentRole enum values."""
        assert AgentRole.MARKET.value == "market"
        assert AgentRole.PORTFOLIO.value == "portfolio"
        assert AgentRole.ANALYST.value == "analyst"

    def test_vote_type_values(self) -> None:
        """Test VoteType enum values."""
        assert VoteType.AGREE.value == "agree"
        assert VoteType.PARTIALLY_AGREE.value == "partially_agree"
        assert VoteType.DISAGREE.value == "disagree"
        assert VoteType.ABSTAIN.value == "abstain"


# =============================================================================
# Test Data Classes
# =============================================================================


class TestWorkerResult:
    """Tests for WorkerResult data class."""

    def test_worker_result_success(self) -> None:
        """Test successful worker result."""
        result = WorkerResult(
            agent_role="market",
            success=True,
            result={"executive_summary": "Market looks bullish"},
            execution_time_ms=1500.0,
            tokens_used=500,
            cost_usd=0.05,
        )

        assert result.agent_role == "market"
        assert result.success is True
        assert result.result["executive_summary"] == "Market looks bullish"
        assert result.error is None
        assert result.execution_time_ms == 1500.0
        assert result.tokens_used == 500
        assert result.cost_usd == 0.05

    def test_worker_result_failure(self) -> None:
        """Test failed worker result."""
        result = WorkerResult(
            agent_role="analyst",
            success=False,
            result={},
            error="Database connection failed",
        )

        assert result.agent_role == "analyst"
        assert result.success is False
        assert result.result == {}
        assert result.error == "Database connection failed"

    def test_worker_result_defaults(self) -> None:
        """Test default values."""
        result = WorkerResult(
            agent_role="portfolio",
            success=True,
            result={"answer": "test"},
        )

        assert result.error is None
        assert result.execution_time_ms == 0.0
        assert result.tokens_used == 0
        assert result.cost_usd == 0.0


class TestInvestmentConstraints:
    """Tests for InvestmentConstraints data class."""

    def test_default_constraints(self) -> None:
        """Test default constraint values."""
        constraints = InvestmentConstraints()

        assert constraints.max_position_size_pct == 10.0
        assert constraints.max_sector_concentration_pct == 30.0
        assert constraints.min_liquidity_ratio == 1.0
        assert constraints.max_debt_to_equity == 2.0
        assert constraints.min_health_score == 50
        assert constraints.excluded_sectors == []
        assert constraints.excluded_securities == []
        assert constraints.risk_tolerance == "moderate"

    def test_custom_constraints(self) -> None:
        """Test custom constraint values."""
        constraints = InvestmentConstraints(
            max_position_size_pct=5.0,
            max_sector_concentration_pct=20.0,
            excluded_sectors=["Energy", "Utilities"],
            excluded_securities=["COIN", "GME"],
            risk_tolerance="conservative",
        )

        assert constraints.max_position_size_pct == 5.0
        assert constraints.max_sector_concentration_pct == 20.0
        assert "Energy" in constraints.excluded_sectors
        assert "GME" in constraints.excluded_securities
        assert constraints.risk_tolerance == "conservative"


# =============================================================================
# Test Signatures
# =============================================================================


class TestSignatures:
    """Tests for signature definitions."""

    def test_committee_synthesis_signature_fields(self) -> None:
        """Test CommitteeSynthesisSignature has all required fields."""
        sig = CommitteeSynthesisSignature()

        # Input fields
        assert hasattr(sig, "portfolio_id")
        assert hasattr(sig, "request_type")
        assert hasattr(sig, "constraints")
        assert hasattr(sig, "market_perspective")
        assert hasattr(sig, "portfolio_perspective")
        assert hasattr(sig, "analyst_perspective")
        assert hasattr(sig, "target_securities")

        # Output fields
        assert hasattr(sig, "synthesis")

    def test_audit_entry_signature_fields(self) -> None:
        """Test AuditEntrySignature has all required fields."""
        sig = AuditEntrySignature()

        # Input fields
        assert hasattr(sig, "decision_context")
        assert hasattr(sig, "recommendation")

        # Output fields
        assert hasattr(sig, "audit_entry")


# =============================================================================
# Test Agent Initialization
# =============================================================================


class TestAgentInitialization:
    """Tests for InvestmentCommitteeAgent initialization."""

    def test_init_with_defaults(self) -> None:
        """Test initialization with default config."""
        agent = InvestmentCommitteeAgent()

        assert agent.agent_id == "investment_committee"
        assert agent.db is None
        assert agent.shared_memory is None
        assert agent._market_agent is None
        assert agent._portfolio_agent is None
        assert agent._analyst_agent is None

    def test_init_with_custom_config(self) -> None:
        """Test initialization with custom config."""
        config = InvestmentCommitteeConfig(
            model="gpt-4o-mini",
            worker_timeout_seconds=30.0,
        )
        agent = InvestmentCommitteeAgent(config=config, agent_id="custom_committee")

        assert agent.agent_id == "custom_committee"
        assert agent._committee_config.model == "gpt-4o-mini"
        assert agent._committee_config.worker_timeout_seconds == 30.0

    def test_init_with_db(self) -> None:
        """Test initialization with database."""
        mock_db = MagicMock()
        agent = InvestmentCommitteeAgent(db=mock_db)

        assert agent.db is mock_db

    def test_init_audit_log_empty(self) -> None:
        """Test audit log starts empty."""
        agent = InvestmentCommitteeAgent()

        assert agent._audit_log == []
        assert agent.get_audit_log() == []

    def test_init_session_costs(self) -> None:
        """Test session costs initialized."""
        agent = InvestmentCommitteeAgent()

        costs = agent._session_costs
        assert "market" in costs
        assert "portfolio" in costs
        assert "analyst" in costs
        assert "synthesis" in costs
        assert all(v == 0.0 for v in costs.values())


# =============================================================================
# Test Request Type Validation
# =============================================================================


class TestRequestTypeValidation:
    """Tests for request type validation."""

    def test_validate_valid_request_types(self) -> None:
        """Test all valid request types pass validation."""
        agent = InvestmentCommitteeAgent()

        for rt in RequestType:
            assert agent._validate_request_type(rt.value) is True

    def test_validate_invalid_request_type(self) -> None:
        """Test invalid request types fail validation."""
        agent = InvestmentCommitteeAgent()

        assert agent._validate_request_type("invalid") is False
        assert agent._validate_request_type("") is False
        assert agent._validate_request_type("REBALANCE") is False  # Case sensitive


# =============================================================================
# Test Constraint Parsing
# =============================================================================


class TestConstraintParsing:
    """Tests for constraint parsing."""

    def test_parse_empty_constraints(self) -> None:
        """Test parsing empty constraints uses defaults."""
        agent = InvestmentCommitteeAgent()
        constraints = agent._parse_constraints({})

        assert constraints.max_position_size_pct == 10.0
        assert constraints.risk_tolerance == "moderate"

    def test_parse_partial_constraints(self) -> None:
        """Test parsing partial constraints."""
        agent = InvestmentCommitteeAgent()
        constraints = agent._parse_constraints({
            "max_position_size_pct": 5.0,
            "risk_tolerance": "conservative",
        })

        assert constraints.max_position_size_pct == 5.0
        assert constraints.risk_tolerance == "conservative"
        # Defaults for unspecified
        assert constraints.max_sector_concentration_pct == 30.0

    def test_parse_full_constraints(self) -> None:
        """Test parsing full constraints."""
        agent = InvestmentCommitteeAgent()
        constraints = agent._parse_constraints({
            "max_position_size_pct": 8.0,
            "max_sector_concentration_pct": 25.0,
            "min_liquidity_ratio": 1.5,
            "max_debt_to_equity": 1.5,
            "min_health_score": 60,
            "excluded_sectors": ["Crypto"],
            "excluded_securities": ["COIN"],
            "risk_tolerance": "aggressive",
        })

        assert constraints.max_position_size_pct == 8.0
        assert constraints.max_sector_concentration_pct == 25.0
        assert constraints.min_liquidity_ratio == 1.5
        assert constraints.max_debt_to_equity == 1.5
        assert constraints.min_health_score == 60
        assert "Crypto" in constraints.excluded_sectors
        assert "COIN" in constraints.excluded_securities
        assert constraints.risk_tolerance == "aggressive"

    def test_constraints_to_dict(self) -> None:
        """Test converting constraints to dict."""
        agent = InvestmentCommitteeAgent()
        constraints = InvestmentConstraints(
            max_position_size_pct=5.0,
            excluded_securities=["GME"],
        )

        result = agent._constraints_to_dict(constraints)

        assert result["max_position_size_pct"] == 5.0
        assert "GME" in result["excluded_securities"]
        assert isinstance(result, dict)


# =============================================================================
# Test Portfolio Query Building
# =============================================================================


class TestPortfolioQueryBuilding:
    """Tests for portfolio query generation."""

    def test_build_rebalance_query(self) -> None:
        """Test query for rebalance request."""
        agent = InvestmentCommitteeAgent()
        query = agent._build_portfolio_query("rebalance")

        assert "allocation" in query.lower()
        assert "sector" in query.lower()

    def test_build_buy_query(self) -> None:
        """Test query for buy request."""
        agent = InvestmentCommitteeAgent()
        query = agent._build_portfolio_query("buy")

        assert "cash" in query.lower() or "buying power" in query.lower()

    def test_build_sell_query(self) -> None:
        """Test query for sell request."""
        agent = InvestmentCommitteeAgent()
        query = agent._build_portfolio_query("sell")

        assert "gain" in query.lower() or "underperform" in query.lower()

    def test_build_risk_assessment_query(self) -> None:
        """Test query for risk assessment request."""
        agent = InvestmentCommitteeAgent()
        query = agent._build_portfolio_query("risk_assessment")

        assert "risk" in query.lower()

    def test_build_unknown_request_query(self) -> None:
        """Test query for unknown request type."""
        agent = InvestmentCommitteeAgent()
        query = agent._build_portfolio_query("unknown")

        assert "comprehensive" in query.lower() or "overview" in query.lower()


# =============================================================================
# Test Worker Result Viability
# =============================================================================


class TestWorkerResultViability:
    """Tests for checking worker result viability."""

    def test_viable_with_all_success(self) -> None:
        """Test viability with all workers successful."""
        agent = InvestmentCommitteeAgent()
        results = {
            "market": WorkerResult("market", True, {"data": "test"}),
            "portfolio": WorkerResult("portfolio", True, {"data": "test"}),
            "analyst": WorkerResult("analyst", True, {"data": "test"}),
        }

        assert agent._has_viable_results(results) is True

    def test_viable_with_two_success(self) -> None:
        """Test viability with two workers successful."""
        agent = InvestmentCommitteeAgent()
        results = {
            "market": WorkerResult("market", True, {"data": "test"}),
            "portfolio": WorkerResult("portfolio", True, {"data": "test"}),
            "analyst": WorkerResult("analyst", False, {}, error="Failed"),
        }

        assert agent._has_viable_results(results) is True

    def test_not_viable_with_one_success(self) -> None:
        """Test not viable with only one worker successful."""
        agent = InvestmentCommitteeAgent()
        results = {
            "market": WorkerResult("market", True, {"data": "test"}),
            "portfolio": WorkerResult("portfolio", False, {}, error="Failed"),
            "analyst": WorkerResult("analyst", False, {}, error="Failed"),
        }

        assert agent._has_viable_results(results) is False

    def test_not_viable_with_no_success(self) -> None:
        """Test not viable with no workers successful."""
        agent = InvestmentCommitteeAgent()
        results = {
            "market": WorkerResult("market", False, {}, error="Failed"),
            "portfolio": WorkerResult("portfolio", False, {}, error="Failed"),
            "analyst": WorkerResult("analyst", False, {}, error="Failed"),
        }

        assert agent._has_viable_results(results) is False


# =============================================================================
# Test Perspective Formatting
# =============================================================================


class TestPerspectiveFormatting:
    """Tests for formatting worker results as perspectives."""

    def test_format_market_perspective_success(self) -> None:
        """Test formatting successful market worker result."""
        agent = InvestmentCommitteeAgent()
        worker_result = WorkerResult(
            agent_role="market",
            success=True,
            result={
                "executive_summary": "Markets are bullish",
                "step1_market_assessment": "S&P up 2%",
                "step3_sentiment_analysis": "Positive sentiment",
                "step4_opportunity_risk": "Tech showing strength",
                "actionable_takeaways": [{"action": "buy tech"}],
                "confidence": 0.85,
            },
        )

        perspective = agent._format_market_perspective(worker_result)

        assert perspective["available"] is True
        assert perspective["executive_summary"] == "Markets are bullish"
        assert perspective["confidence"] == 0.85

    def test_format_market_perspective_failure(self) -> None:
        """Test formatting failed market worker result."""
        agent = InvestmentCommitteeAgent()
        worker_result = WorkerResult(
            agent_role="market",
            success=False,
            result={},
            error="API timeout",
        )

        perspective = agent._format_market_perspective(worker_result)

        assert perspective["available"] is False
        assert perspective["error"] == "API timeout"

    def test_format_market_perspective_none(self) -> None:
        """Test formatting None market worker result."""
        agent = InvestmentCommitteeAgent()

        perspective = agent._format_market_perspective(None)

        assert perspective["available"] is False
        assert "not executed" in perspective["error"].lower()

    def test_format_portfolio_perspective_success(self) -> None:
        """Test formatting successful portfolio worker result."""
        agent = InvestmentCommitteeAgent()
        worker_result = WorkerResult(
            agent_role="portfolio",
            success=True,
            result={
                "answer": "Tech allocation at 35%",
                "query_type": "allocation",
                "data_points": [{"metric": "tech_weight", "value": "35%"}],
                "confidence": 0.9,
                "caveats": ["Data as of yesterday"],
            },
        )

        perspective = agent._format_portfolio_perspective(worker_result)

        assert perspective["available"] is True
        assert perspective["answer"] == "Tech allocation at 35%"
        assert perspective["confidence"] == 0.9

    def test_format_analyst_perspective_portfolio_analysis(self) -> None:
        """Test formatting analyst perspective for portfolio analysis."""
        agent = InvestmentCommitteeAgent()
        worker_result = WorkerResult(
            agent_role="analyst",
            success=True,
            result={
                "type": "portfolio_analysis",
                "portfolio_health": {"score": 75, "grade": "B", "trend": "stable"},
                "summary": "Portfolio is healthy",
                "top_performers": [{"ticker": "AAPL"}],
                "concerns": [{"ticker": "META", "issues": ["Overvalued"]}],
                "recommendations": ["Reduce META"],
                "confidence": 0.8,
            },
        )

        perspective = agent._format_analyst_perspective(worker_result)

        assert perspective["available"] is True
        assert perspective["type"] == "portfolio"
        assert perspective["portfolio_health"]["score"] == 75
        assert perspective["portfolio_health"]["grade"] == "B"

    def test_format_analyst_perspective_targeted_analysis(self) -> None:
        """Test formatting analyst perspective for targeted analysis."""
        agent = InvestmentCommitteeAgent()
        worker_result = WorkerResult(
            agent_role="analyst",
            success=True,
            result={
                "type": "targeted_analysis",
                "analyses": {
                    "AAPL": {
                        "financial_health": {"score": 85, "grade": "A"},
                        "strengths": ["Strong margins", "Cash flow"],
                        "concerns": ["Valuation stretched"],
                        "recommendation": "Hold",
                    },
                },
            },
        )

        perspective = agent._format_analyst_perspective(worker_result)

        assert perspective["available"] is True
        assert perspective["type"] == "targeted"
        assert perspective["securities_analyzed"] == 1
        assert perspective["securities"][0]["health_score"] == 85


# =============================================================================
# Test Synthesis Response Parsing
# =============================================================================


class TestSynthesisResponseParsing:
    """Tests for parsing synthesis LLM responses."""

    def test_parse_valid_json(self) -> None:
        """Test parsing valid JSON response."""
        agent = InvestmentCommitteeAgent()
        result = {
            "synthesis": json.dumps({
                "recommendation": "Rebalance portfolio",
                "conviction": "high",
                "confidence": 0.85,
            })
        }

        synthesis = agent._parse_synthesis_response(result)

        assert synthesis["recommendation"] == "Rebalance portfolio"
        assert synthesis["conviction"] == "high"
        assert synthesis["confidence"] == 0.85

    def test_parse_json_in_markdown_block(self) -> None:
        """Test parsing JSON wrapped in markdown code block."""
        agent = InvestmentCommitteeAgent()
        result = {
            "synthesis": '```json\n{"recommendation": "Buy AAPL", "confidence": 0.9}\n```'
        }

        synthesis = agent._parse_synthesis_response(result)

        assert synthesis["recommendation"] == "Buy AAPL"
        assert synthesis["confidence"] == 0.9

    def test_parse_invalid_json(self) -> None:
        """Test parsing invalid JSON returns error structure."""
        agent = InvestmentCommitteeAgent()
        result = {"synthesis": "This is not valid JSON"}

        synthesis = agent._parse_synthesis_response(result)

        assert synthesis["confidence"] == 0.0
        assert "error" in synthesis

    def test_parse_bounds_confidence(self) -> None:
        """Test confidence is bounded to 0.0-1.0."""
        agent = InvestmentCommitteeAgent()

        # Test > 1.0
        result = {"synthesis": json.dumps({"confidence": 1.5})}
        synthesis = agent._parse_synthesis_response(result)
        assert synthesis["confidence"] == 1.0

        # Test < 0.0
        result = {"synthesis": json.dumps({"confidence": -0.5})}
        synthesis = agent._parse_synthesis_response(result)
        assert synthesis["confidence"] == 0.0


# =============================================================================
# Test Constraint Validation
# =============================================================================


class TestConstraintValidation:
    """Tests for constraint validation on synthesis."""

    def test_validate_no_violations(self) -> None:
        """Test validation with no constraint violations."""
        agent = InvestmentCommitteeAgent()
        synthesis = {
            "action_items": [{"security": "AAPL", "action": "buy"}],
            "constraints_validation": {"all_constraints_met": True},
        }
        constraints = InvestmentConstraints()

        result = agent._validate_constraints(synthesis, constraints)

        assert result["constraints_validation"]["all_constraints_met"] is True

    def test_validate_excluded_security(self) -> None:
        """Test validation catches excluded securities."""
        agent = InvestmentCommitteeAgent()
        synthesis = {
            "action_items": [{"security": "GME", "action": "buy"}],
            "constraints_validation": {"all_constraints_met": True},
        }
        constraints = InvestmentConstraints(excluded_securities=["GME", "COIN"])

        result = agent._validate_constraints(synthesis, constraints)

        assert result["constraints_validation"]["all_constraints_met"] is False
        assert len(result["constraints_validation"]["violated_constraints"]) > 0


# =============================================================================
# Test Compliance Flags
# =============================================================================


class TestComplianceFlags:
    """Tests for compliance flag generation."""

    def test_no_flags_for_good_synthesis(self) -> None:
        """Test no flags for well-formed synthesis."""
        config = InvestmentCommitteeConfig(min_confidence=0.6)
        agent = InvestmentCommitteeAgent(config=config)
        synthesis = {
            "confidence": 0.85,
            "constraints_validation": {"all_constraints_met": True},
            "dissenting_views": [],
            "risk_warnings": "Standard risk warning",
        }

        flags = agent._get_compliance_flags(synthesis)

        assert len(flags) == 0

    def test_low_confidence_flag(self) -> None:
        """Test flag for low confidence."""
        config = InvestmentCommitteeConfig(min_confidence=0.7)
        agent = InvestmentCommitteeAgent(config=config)
        synthesis = {
            "confidence": 0.5,
            "constraints_validation": {"all_constraints_met": True},
            "dissenting_views": [],
            "risk_warnings": "Warning",
        }

        flags = agent._get_compliance_flags(synthesis)

        assert any("LOW_CONFIDENCE" in f for f in flags)

    def test_constraint_violation_flag(self) -> None:
        """Test flag for constraint violation."""
        agent = InvestmentCommitteeAgent()
        synthesis = {
            "confidence": 0.8,
            "constraints_validation": {"all_constraints_met": False},
            "dissenting_views": [],
            "risk_warnings": "Warning",
        }

        flags = agent._get_compliance_flags(synthesis)

        assert "CONSTRAINT_VIOLATION" in flags

    def test_significant_dissent_flag(self) -> None:
        """Test flag for significant dissent."""
        agent = InvestmentCommitteeAgent()
        synthesis = {
            "confidence": 0.8,
            "constraints_validation": {"all_constraints_met": True},
            "dissenting_views": [{"agent": "market"}, {"agent": "analyst"}],
            "risk_warnings": "Warning",
        }

        flags = agent._get_compliance_flags(synthesis)

        assert any("SIGNIFICANT_DISSENT" in f for f in flags)

    def test_missing_risk_warnings_flag(self) -> None:
        """Test flag for missing risk warnings."""
        agent = InvestmentCommitteeAgent()
        synthesis = {
            "confidence": 0.8,
            "constraints_validation": {"all_constraints_met": True},
            "dissenting_views": [],
            "risk_warnings": "",
        }

        flags = agent._get_compliance_flags(synthesis)

        assert "MISSING_RISK_WARNINGS" in flags


# =============================================================================
# Test Audit Trail
# =============================================================================


class TestAuditTrail:
    """Tests for audit trail generation."""

    def test_build_audit_trail(self) -> None:
        """Test building audit trail entry."""
        agent = InvestmentCommitteeAgent()
        start_time = datetime.now(UTC)

        worker_results = {
            "market": WorkerResult(
                "market", True, {}, execution_time_ms=1000, tokens_used=500, cost_usd=0.05
            ),
            "portfolio": WorkerResult(
                "portfolio", True, {}, execution_time_ms=800, tokens_used=300, cost_usd=0.03
            ),
        }

        synthesis = {
            "recommendation": "Rebalance",
            "consensus_analysis": {"agreement_level": "full"},
            "reasoning_steps": ["Step 1", "Step 2"],
            "risk_considerations": [{"risk": "Market risk"}],
            "constraints_validation": {"all_constraints_met": True},
            "confidence": 0.85,
            "dissenting_views": [],
        }

        audit = agent._build_audit_trail(
            decision_id="test-123",
            portfolio_id="port-001",
            request_type="rebalance",
            synthesis=synthesis,
            worker_results=worker_results,
            start_time=start_time,
        )

        assert audit["decision_id"] == "test-123"
        assert audit["portfolio_id"] == "port-001"
        assert audit["decision_type"] == "rebalance"
        assert audit["consensus_level"] == "full"
        assert audit["confidence_level"] == 0.85
        assert "market" in audit["agents_consulted"]
        assert "portfolio" in audit["agents_consulted"]

    def test_audit_log_stored(self) -> None:
        """Test audit trail is stored in log."""
        config = InvestmentCommitteeConfig(enable_audit_trail=True)
        agent = InvestmentCommitteeAgent(config=config)

        worker_results = {"market": WorkerResult("market", True, {})}
        synthesis = {"recommendation": "Test", "confidence": 0.8}

        agent._build_audit_trail(
            decision_id="test-456",
            portfolio_id="port-001",
            request_type="rebalance",
            synthesis=synthesis,
            worker_results=worker_results,
            start_time=datetime.now(UTC),
        )

        log = agent.get_audit_log()
        assert len(log) == 1
        assert log[0]["decision_id"] == "test-456"


# =============================================================================
# Test Session Costs
# =============================================================================


class TestSessionCosts:
    """Tests for session cost tracking."""

    def test_get_session_costs(self) -> None:
        """Test getting session costs."""
        agent = InvestmentCommitteeAgent()
        agent._session_costs["market"] = 0.05
        agent._session_costs["portfolio"] = 0.03

        costs = agent.get_session_costs()

        assert costs["market"] == 0.05
        assert costs["portfolio"] == 0.03
        # Verify it's a copy
        costs["market"] = 999
        assert agent._session_costs["market"] == 0.05

    def test_get_total_session_cost(self) -> None:
        """Test getting total session cost."""
        agent = InvestmentCommitteeAgent()
        agent._session_costs = {
            "market": 0.05,
            "portfolio": 0.03,
            "analyst": 0.10,
            "synthesis": 0.02,
        }

        total = agent.get_total_session_cost()

        assert total == pytest.approx(0.20)


# =============================================================================
# Test Error Response
# =============================================================================


class TestErrorResponse:
    """Tests for error response generation."""

    def test_error_response_structure(self) -> None:
        """Test error response has required fields."""
        agent = InvestmentCommitteeAgent()
        start_time = datetime.now(UTC)

        response = agent._error_response(
            error="Test error",
            decision_id="test-error-123",
            start_time=start_time,
        )

        assert response["decision_id"] == "test-error-123"
        assert "Test error" in response["recommendation"]
        assert response["conviction"] == "low"
        assert response["confidence"] == 0.0
        assert response["error"] == "Test error"
        assert response["action_items"] == []
        assert "ERROR_OCCURRED" in response["audit_trail"]["compliance_flags"]

    def test_error_response_with_worker_results(self) -> None:
        """Test error response includes worker results."""
        agent = InvestmentCommitteeAgent()
        start_time = datetime.now(UTC)
        worker_results = {
            "market": WorkerResult("market", False, {}, error="Timeout"),
        }

        response = agent._error_response(
            error="Workers failed",
            decision_id="test-error-456",
            start_time=start_time,
            worker_results=worker_results,
        )

        assert "market" in response["_metadata"]["worker_results"]
        assert response["_metadata"]["worker_results"]["market"]["success"] is False


# =============================================================================
# Test System Prompt
# =============================================================================


class TestSystemPrompt:
    """Tests for system prompt generation."""

    def test_system_prompt_contains_key_elements(self) -> None:
        """Test system prompt contains key guidance."""
        agent = InvestmentCommitteeAgent()
        prompt = agent._generate_system_prompt()

        assert "Investment Committee Chair" in prompt
        assert "MARKET ANALYSIS" in prompt or "market" in prompt.lower()
        assert "PORTFOLIO REVIEW" in prompt or "portfolio" in prompt.lower()
        assert "SYNTHESIS" in prompt or "synthesis" in prompt.lower()
        assert "RISK WARNINGS" in prompt or "risk" in prompt.lower()


# =============================================================================
# Test Convenience Methods
# =============================================================================


class TestConvenienceMethods:
    """Tests for convenience methods."""

    @pytest.mark.asyncio
    async def test_recommend_rebalance_calls_recommend(self) -> None:
        """Test recommend_rebalance delegates to recommend."""
        agent = InvestmentCommitteeAgent()
        agent.recommend = AsyncMock(return_value={"recommendation": "test"})

        result = await agent.recommend_rebalance("port-001", {"max_position_size_pct": 5})

        agent.recommend.assert_called_once_with(
            portfolio_id="port-001",
            request_type="rebalance",
            constraints={"max_position_size_pct": 5},
        )

    @pytest.mark.asyncio
    async def test_recommend_buy_calls_recommend(self) -> None:
        """Test recommend_buy delegates to recommend."""
        agent = InvestmentCommitteeAgent()
        agent.recommend = AsyncMock(return_value={"recommendation": "test"})

        result = await agent.recommend_buy("port-001", ["AAPL", "MSFT"], None)

        agent.recommend.assert_called_once_with(
            portfolio_id="port-001",
            request_type="buy",
            constraints=None,
            target_securities=["AAPL", "MSFT"],
        )

    @pytest.mark.asyncio
    async def test_assess_risk_calls_recommend(self) -> None:
        """Test assess_risk delegates to recommend."""
        agent = InvestmentCommitteeAgent()
        agent.recommend = AsyncMock(return_value={"recommendation": "test"})

        result = await agent.assess_risk("port-001")

        agent.recommend.assert_called_once_with(
            portfolio_id="port-001",
            request_type="risk_assessment",
            constraints=None,
        )

    @pytest.mark.asyncio
    async def test_identify_opportunities_calls_recommend(self) -> None:
        """Test identify_opportunities delegates to recommend."""
        agent = InvestmentCommitteeAgent()
        agent.recommend = AsyncMock(return_value={"recommendation": "test"})

        result = await agent.identify_opportunities("port-001")

        agent.recommend.assert_called_once_with(
            portfolio_id="port-001",
            request_type="opportunity",
            constraints=None,
        )


# =============================================================================
# Test Full Recommend Flow (with mocked workers)
# =============================================================================


class TestRecommendFlow:
    """Tests for full recommendation flow."""

    @pytest.mark.asyncio
    async def test_recommend_invalid_request_type(self) -> None:
        """Test recommend with invalid request type returns error."""
        agent = InvestmentCommitteeAgent()

        result = await agent.recommend(
            portfolio_id="port-001",
            request_type="invalid_type",
        )

        assert "error" in result
        assert "Invalid request type" in result["recommendation"]

    @pytest.mark.asyncio
    async def test_recommend_no_viable_results(self) -> None:
        """Test recommend handles no viable results."""
        agent = InvestmentCommitteeAgent()

        # Mock worker execution to return all failures
        async def mock_execute_workers(*args, **kwargs):
            return {
                "market": WorkerResult("market", False, {}, error="Failed"),
                "portfolio": WorkerResult("portfolio", False, {}, error="Failed"),
                "analyst": WorkerResult("analyst", False, {}, error="Failed"),
            }

        agent._execute_workers = mock_execute_workers

        result = await agent.recommend(
            portfolio_id="port-001",
            request_type="rebalance",
        )

        assert "error" in result
        assert "Insufficient data" in result["recommendation"]

    @pytest.mark.asyncio
    async def test_recommend_success_flow(self) -> None:
        """Test successful recommendation flow."""
        agent = InvestmentCommitteeAgent()

        # Mock worker execution
        async def mock_execute_workers(*args, **kwargs):
            return {
                "market": WorkerResult(
                    "market", True, {"executive_summary": "Bullish"}, execution_time_ms=1000
                ),
                "portfolio": WorkerResult(
                    "portfolio", True, {"answer": "35% tech"}, execution_time_ms=800
                ),
                "analyst": WorkerResult(
                    "analyst",
                    True,
                    {"type": "portfolio_analysis", "portfolio_health": {"score": 80}},
                    execution_time_ms=1200,
                ),
            }

        agent._execute_workers = mock_execute_workers

        # Mock synthesis
        async def mock_run_async(**kwargs):
            return {
                "synthesis": json.dumps({
                    "recommendation": "Maintain current allocation",
                    "conviction": "medium",
                    "confidence": 0.75,
                    "action_items": [],
                    "risk_considerations": [],
                    "consensus_analysis": {"agreement_level": "partial"},
                    "dissenting_views": [],
                    "constraints_validation": {"all_constraints_met": True},
                    "risk_warnings": "Standard warnings apply",
                })
            }

        agent.run_async = mock_run_async

        result = await agent.recommend(
            portfolio_id="port-001",
            request_type="rebalance",
        )

        assert result["portfolio_id"] == "port-001"
        assert result["request_type"] == "rebalance"
        assert result["recommendation"] == "Maintain current allocation"
        assert result["conviction"] == "medium"
        assert result["confidence"] == 0.75
        assert "audit_trail" in result
        assert "_metadata" in result


# =============================================================================
# Test Worker Agent Creation
# =============================================================================


class TestWorkerAgentCreation:
    """Tests for lazy worker agent creation."""

    def test_get_market_agent_creates_once(self) -> None:
        """Test market agent is created once and reused."""
        agent = InvestmentCommitteeAgent(db=MagicMock())

        market1 = agent._get_market_agent()
        market2 = agent._get_market_agent()

        assert market1 is market2
        assert agent._market_agent is market1

    def test_get_portfolio_agent_creates_once(self) -> None:
        """Test portfolio agent is created once and reused."""
        agent = InvestmentCommitteeAgent(db=MagicMock())

        portfolio1 = agent._get_portfolio_agent()
        portfolio2 = agent._get_portfolio_agent()

        assert portfolio1 is portfolio2
        assert agent._portfolio_agent is portfolio1

    def test_get_analyst_agent_creates_once(self) -> None:
        """Test analyst agent is created once and reused."""
        agent = InvestmentCommitteeAgent(db=MagicMock())

        analyst1 = agent._get_analyst_agent()
        analyst2 = agent._get_analyst_agent()

        assert analyst1 is analyst2
        assert agent._analyst_agent is analyst1
