"""
Unit tests for FinancialAnalystAgent.

Tests cover:
- Configuration
- Enums and types
- Signatures
- Agent initialization
- Security analysis (LLM-based)
- Anomaly detection
- Portfolio analysis
- Helper methods
- Edge cases
"""

import json
from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.agents.financial_analyst import (
    AnalysisResult,
    AnalysisType,
    AnomalyDetectionSignature,
    AnomalyResult,
    AnomalySeverity,
    AnomalyType,
    FinancialAnalystAgent,
    FinancialAnalystConfig,
    HealthGrade,
    PortfolioHealthSignature,
    SecurityAnalysisSignature,
    analyze_portfolio_health,
    analyze_security,
    detect_anomalies,
)


# =============================================================================
# Configuration Tests
# =============================================================================


class TestFinancialAnalystConfig:
    """Tests for FinancialAnalystConfig."""

    def test_default_config_values(self):
        """Test default configuration values."""
        config = FinancialAnalystConfig()

        assert config.model == "gpt-4o"
        assert config.temperature == 0.2
        assert config.max_tokens == 8000
        assert config.strategy_type == "multi_cycle"
        assert config.max_cycles == 10
        assert config.analysis_depth == "standard"
        assert config.include_peer_comparison is True
        assert config.min_confidence_threshold == 0.6
        assert config.anomaly_std_threshold == 2.0

    def test_custom_config_values(self):
        """Test custom configuration values."""
        config = FinancialAnalystConfig(
            model="gpt-4o-mini",
            temperature=0.1,
            analysis_depth="comprehensive",
            min_confidence_threshold=0.7,
        )

        assert config.model == "gpt-4o-mini"
        assert config.temperature == 0.1
        assert config.analysis_depth == "comprehensive"
        assert config.min_confidence_threshold == 0.7

    def test_health_score_weights_default(self):
        """Test default health score weights."""
        config = FinancialAnalystConfig()

        weights = config.health_score_weights
        assert weights["liquidity"] == 0.20
        assert weights["profitability"] == 0.25
        assert weights["leverage"] == 0.20
        assert weights["valuation"] == 0.15
        assert weights["growth"] == 0.20

        # Weights should sum to 1.0
        assert sum(weights.values()) == pytest.approx(1.0)

    def test_to_kaizen_config(self):
        """Test conversion to Kaizen config."""
        config = FinancialAnalystConfig()
        kaizen = config.to_kaizen_config()

        assert kaizen["model"] == "gpt-4o"
        assert kaizen["temperature"] == 0.2
        assert kaizen["max_tokens"] == 8000
        assert kaizen["strategy_type"] == "multi_cycle"


# =============================================================================
# Enum Tests
# =============================================================================


class TestEnums:
    """Tests for enums."""

    def test_analysis_type_values(self):
        """Test AnalysisType enum values."""
        assert AnalysisType.QUICK.value == "quick"
        assert AnalysisType.STANDARD.value == "standard"
        assert AnalysisType.COMPREHENSIVE.value == "comprehensive"

    def test_health_grade_values(self):
        """Test HealthGrade enum values."""
        assert HealthGrade.A.value == "A"
        assert HealthGrade.B.value == "B"
        assert HealthGrade.C.value == "C"
        assert HealthGrade.D.value == "D"
        assert HealthGrade.F.value == "F"

    def test_anomaly_severity_values(self):
        """Test AnomalySeverity enum values."""
        assert AnomalySeverity.LOW.value == "low"
        assert AnomalySeverity.MEDIUM.value == "medium"
        assert AnomalySeverity.HIGH.value == "high"
        assert AnomalySeverity.CRITICAL.value == "critical"

    def test_anomaly_type_values(self):
        """Test AnomalyType enum values."""
        assert AnomalyType.SUDDEN_RATIO_CHANGE.value == "sudden_ratio_change"
        assert AnomalyType.TREND_REVERSAL.value == "trend_reversal"
        assert AnomalyType.PEER_OUTLIER.value == "peer_outlier"
        assert AnomalyType.THRESHOLD_BREACH.value == "threshold_breach"
        assert AnomalyType.DATA_QUALITY.value == "data_quality"


# =============================================================================
# Signature Tests
# =============================================================================


class TestSecurityAnalysisSignature:
    """Tests for SecurityAnalysisSignature."""

    def test_input_fields_exist(self):
        """Test that input fields are defined."""
        sig = SecurityAnalysisSignature()

        assert hasattr(sig, "company_name")
        assert hasattr(sig, "ticker")
        assert hasattr(sig, "financial_data")
        assert hasattr(sig, "peer_data")
        assert hasattr(sig, "analysis_type")

    def test_output_fields_exist(self):
        """Test that output fields are defined."""
        sig = SecurityAnalysisSignature()

        assert hasattr(sig, "analysis")


class TestAnomalyDetectionSignature:
    """Tests for AnomalyDetectionSignature."""

    def test_input_fields_exist(self):
        """Test that input fields are defined."""
        sig = AnomalyDetectionSignature()

        assert hasattr(sig, "company_name")
        assert hasattr(sig, "ticker")
        assert hasattr(sig, "historical_data")
        assert hasattr(sig, "peer_data")
        assert hasattr(sig, "thresholds")

    def test_output_fields_exist(self):
        """Test that output fields are defined."""
        sig = AnomalyDetectionSignature()

        assert hasattr(sig, "anomalies")


class TestPortfolioHealthSignature:
    """Tests for PortfolioHealthSignature."""

    def test_input_fields_exist(self):
        """Test that input fields are defined."""
        sig = PortfolioHealthSignature()

        assert hasattr(sig, "portfolio_name")
        assert hasattr(sig, "holdings_data")
        assert hasattr(sig, "allocation_data")
        assert hasattr(sig, "benchmark_data")

    def test_output_fields_exist(self):
        """Test that output fields are defined."""
        sig = PortfolioHealthSignature()

        assert hasattr(sig, "analysis")


# =============================================================================
# Agent Initialization Tests
# =============================================================================


class TestFinancialAnalystAgentInit:
    """Tests for FinancialAnalystAgent initialization."""

    def test_init_with_default_config(self):
        """Test initialization with default config."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        assert agent.db == mock_db
        assert agent.agent_id == "financial_analyst"
        assert agent._min_confidence == 0.6
        assert agent._anomaly_std == 2.0

    def test_init_with_custom_config(self):
        """Test initialization with custom config."""
        mock_db = MagicMock()
        config = FinancialAnalystConfig(
            min_confidence_threshold=0.7,
            anomaly_std_threshold=3.0,
        )
        agent = FinancialAnalystAgent(db=mock_db, config=config)

        assert agent._min_confidence == 0.7
        assert agent._anomaly_std == 3.0

    def test_init_with_custom_agent_id(self):
        """Test initialization with custom agent ID."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db, agent_id="my_analyst")

        assert agent.agent_id == "my_analyst"

    def test_health_score_weights_set(self):
        """Test that health score weights are set from config."""
        mock_db = MagicMock()
        config = FinancialAnalystConfig()
        agent = FinancialAnalystAgent(db=mock_db, config=config)

        assert agent._health_weights["liquidity"] == 0.20
        assert agent._health_weights["profitability"] == 0.25


# =============================================================================
# System Prompt Tests
# =============================================================================


class TestSystemPrompt:
    """Tests for system prompt generation."""

    def test_system_prompt_contains_analysis_methodology(self):
        """Test that system prompt includes analysis methodology."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)
        prompt = agent._generate_system_prompt()

        assert "LIQUIDITY ANALYSIS" in prompt
        assert "PROFITABILITY ANALYSIS" in prompt
        assert "LEVERAGE ANALYSIS" in prompt
        assert "VALUATION ANALYSIS" in prompt
        assert "GROWTH ANALYSIS" in prompt

    def test_system_prompt_contains_guidelines(self):
        """Test that system prompt includes guidelines."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)
        prompt = agent._generate_system_prompt()

        assert "chain-of-thought" in prompt.lower()
        assert "confidence" in prompt.lower()

    def test_system_prompt_contains_anomaly_detection(self):
        """Test that system prompt includes anomaly detection."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)
        prompt = agent._generate_system_prompt()

        assert "ANOMALY DETECTION" in prompt
        assert "sudden changes" in prompt.lower()


# =============================================================================
# Score to Grade Tests
# =============================================================================


class TestScoreToGrade:
    """Tests for score to grade conversion."""

    def test_grade_a_scores(self):
        """Test A grade for scores 90+."""
        assert FinancialAnalystAgent._score_to_grade(90) == "A"
        assert FinancialAnalystAgent._score_to_grade(95) == "A"
        assert FinancialAnalystAgent._score_to_grade(100) == "A"

    def test_grade_b_scores(self):
        """Test B grade for scores 80-89."""
        assert FinancialAnalystAgent._score_to_grade(80) == "B"
        assert FinancialAnalystAgent._score_to_grade(85) == "B"
        assert FinancialAnalystAgent._score_to_grade(89) == "B"

    def test_grade_c_scores(self):
        """Test C grade for scores 70-79."""
        assert FinancialAnalystAgent._score_to_grade(70) == "C"
        assert FinancialAnalystAgent._score_to_grade(75) == "C"
        assert FinancialAnalystAgent._score_to_grade(79) == "C"

    def test_grade_d_scores(self):
        """Test D grade for scores 60-69."""
        assert FinancialAnalystAgent._score_to_grade(60) == "D"
        assert FinancialAnalystAgent._score_to_grade(65) == "D"
        assert FinancialAnalystAgent._score_to_grade(69) == "D"

    def test_grade_f_scores(self):
        """Test F grade for scores below 60."""
        assert FinancialAnalystAgent._score_to_grade(59) == "F"
        assert FinancialAnalystAgent._score_to_grade(50) == "F"
        assert FinancialAnalystAgent._score_to_grade(0) == "F"


# =============================================================================
# Security Analysis Tests
# =============================================================================


class TestSecurityAnalysis:
    """Tests for security analysis."""

    @pytest.mark.asyncio
    async def test_analyze_security_returns_result(self):
        """Test that analyze_security returns a result."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        # Mock get_security_context
        agent.get_security_context = AsyncMock(
            return_value={
                "security": {
                    "id": "sec-001",
                    "ticker": "AAPL",
                    "name": "Apple Inc.",
                    "sector": "Technology",
                },
                "prices": [{"close_price": 150.0}],
                "fundamentals": [
                    {
                        "revenue": 100000000,
                        "net_income": 20000000,
                        "fiscal_period": "Q4 2025",
                    }
                ],
                "ratios": {
                    "pe_ratio": 25.0,
                    "current_ratio": 1.5,
                    "roe": 0.25,
                },
            }
        )

        # Mock run_async to return valid analysis
        analysis_json = json.dumps(
            {
                "reasoning_steps": ["Step 1: Analyzed liquidity"],
                "summary": "Strong financial health",
                "financial_health": {"score": 85, "grade": "B", "trend": "stable"},
                "liquidity_analysis": {"assessment": "Strong"},
                "profitability_analysis": {"assessment": "Strong"},
                "leverage_analysis": {"assessment": "Conservative"},
                "valuation_analysis": {"assessment": "Fairly Valued"},
                "growth_analysis": {"assessment": "Moderate Growth"},
                "strengths": ["Strong margins"],
                "concerns": ["High valuation"],
                "peer_comparison": {},
                "recommendation": "Hold",
                "confidence": 0.85,
                "confidence_reasoning": "Complete data available",
            }
        )
        agent.run_async = AsyncMock(return_value={"analysis": analysis_json})

        result = await agent.analyze_security("AAPL")

        assert result["financial_health"]["score"] == 85
        assert result["financial_health"]["grade"] == "B"
        assert result["confidence"] == 0.85
        assert "_metadata" in result

    @pytest.mark.asyncio
    async def test_analyze_security_handles_error(self):
        """Test that analyze_security handles errors."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_security_context = AsyncMock(
            return_value={"error": "Security not found"}
        )

        result = await agent.analyze_security("INVALID")

        assert "error" in result
        assert result["financial_health"]["grade"] == "F"
        assert result["confidence"] == 0.0

    @pytest.mark.asyncio
    async def test_analyze_security_validates_grade(self):
        """Test that grade is validated against score."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_security_context = AsyncMock(
            return_value={
                "security": {"id": "sec-001", "ticker": "TEST", "name": "Test Co"},
                "prices": [],
                "fundamentals": [],
                "ratios": {},
            }
        )

        # Return inconsistent grade (score 85 but grade A)
        analysis_json = json.dumps(
            {
                "summary": "Test analysis",
                "financial_health": {
                    "score": 85,
                    "grade": "A",  # Should be B
                    "trend": "stable",
                },
                "confidence": 0.8,
            }
        )
        agent.run_async = AsyncMock(return_value={"analysis": analysis_json})

        result = await agent.analyze_security("TEST")

        # Grade should be corrected to B
        assert result["financial_health"]["grade"] == "B"
        assert "warnings" in result


# =============================================================================
# Build Financial Data Tests
# =============================================================================


class TestBuildFinancialData:
    """Tests for building financial data."""

    def test_build_financial_data_complete(self):
        """Test building financial data with complete data."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        security_context = {
            "security": {
                "ticker": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology",
                "market_cap": 2500000000000,
            },
            "prices": [{"close_price": 150.0}, {"close_price": 148.0}],
            "fundamentals": [
                {
                    "revenue": 100000000000,
                    "net_income": 25000000000,
                    "fiscal_period": "Q4 2025",
                }
            ],
            "ratios": {
                "pe_ratio": 25.0,
                "current_ratio": 1.5,
                "roe": 0.25,
            },
        }

        result = agent._build_financial_data(security_context)

        assert result["security"]["ticker"] == "AAPL"
        assert result["current_price"] == 150.0
        assert "1d" in result["price_changes"]
        assert result["fundamentals"]["revenue"] == 100000000000
        assert result["ratios"]["pe_ratio"] == 25.0

    def test_build_financial_data_empty(self):
        """Test building financial data with empty data."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        security_context = {
            "security": {},
            "prices": [],
            "fundamentals": [],
            "ratios": {},
        }

        result = agent._build_financial_data(security_context)

        assert result["current_price"] == 0
        assert result["price_changes"] == {}


# =============================================================================
# Anomaly Detection Tests
# =============================================================================


class TestAnomalyDetection:
    """Tests for anomaly detection."""

    @pytest.mark.asyncio
    async def test_detect_anomalies_returns_list(self):
        """Test that detect_anomalies returns a list."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent._detect_security_anomalies = AsyncMock(
            return_value=[
                {
                    "anomaly_type": "sudden_ratio_change",
                    "severity": "high",
                    "severity_score": 0.8,
                    "metric": "current_ratio",
                    "description": "Current ratio dropped 40%",
                    "recommended_action": "Investigate",
                }
            ]
        )

        result = await agent.detect_anomalies(["AAPL"])

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["severity"] == "high"

    @pytest.mark.asyncio
    async def test_detect_anomalies_multiple_securities(self):
        """Test anomaly detection for multiple securities."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        # Return different anomalies for each security
        async def mock_detect(sec_id, periods):
            if sec_id == "AAPL":
                return [{"anomaly_type": "sudden_ratio_change", "security_id": sec_id}]
            else:
                return [{"anomaly_type": "peer_outlier", "security_id": sec_id}]

        agent._detect_security_anomalies = mock_detect

        result = await agent.detect_anomalies(["AAPL", "MSFT"])

        assert len(result) == 2
        assert result[0]["security_id"] == "AAPL"
        assert result[1]["security_id"] == "MSFT"

    @pytest.mark.asyncio
    async def test_detect_anomalies_handles_error(self):
        """Test that anomaly detection handles errors gracefully."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent._detect_security_anomalies = AsyncMock(
            side_effect=Exception("Analysis failed")
        )

        result = await agent.detect_anomalies(["INVALID"])

        assert len(result) == 1
        assert result[0]["anomaly_type"] == "data_quality"
        assert result[0]["severity"] == "low"


class TestAnomalyThresholds:
    """Tests for anomaly thresholds."""

    def test_get_anomaly_thresholds(self):
        """Test that thresholds are properly defined."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        thresholds = agent._get_anomaly_thresholds()

        assert "current_ratio" in thresholds
        assert "warning" in thresholds["current_ratio"]
        assert "critical" in thresholds["current_ratio"]
        assert thresholds["current_ratio"]["warning"] == 1.0
        assert thresholds["current_ratio"]["critical"] == 0.5

    def test_std_deviation_threshold_from_config(self):
        """Test that std deviation threshold comes from config."""
        mock_db = MagicMock()
        config = FinancialAnalystConfig(anomaly_std_threshold=3.0)
        agent = FinancialAnalystAgent(db=mock_db, config=config)

        thresholds = agent._get_anomaly_thresholds()

        assert thresholds["std_deviation_threshold"] == 3.0


# =============================================================================
# Portfolio Analysis Tests
# =============================================================================


class TestPortfolioAnalysis:
    """Tests for portfolio analysis."""

    @pytest.mark.asyncio
    async def test_analyze_portfolio_returns_result(self):
        """Test that analyze_portfolio returns a result."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_portfolio_context = AsyncMock(
            return_value={
                "portfolio": {"id": "port-001", "name": "Growth Portfolio"},
                "holdings": [
                    {
                        "security_id": "sec-001",
                        "ticker": "AAPL",
                        "market_value": 10000,
                        "sector": "Technology",
                    }
                ],
            }
        )

        agent.analyze_security = AsyncMock(
            return_value={
                "financial_health": {"score": 85, "grade": "B"},
                "strengths": ["Good margins"],
                "concerns": [],
            }
        )

        # Mock run_async for portfolio signature
        analysis_json = json.dumps(
            {
                "reasoning_steps": ["Analyzed holdings"],
                "summary": "Portfolio in good health",
                "portfolio_health": {"score": 82, "grade": "B", "trend": "stable"},
                "recommendations": ["Consider diversification"],
                "confidence": 0.85,
            }
        )
        agent.run_async = AsyncMock(return_value={"analysis": analysis_json})

        result = await agent.analyze_portfolio("port-001")

        assert result["portfolio_health"]["grade"] == "B"
        assert "_metadata" in result

    @pytest.mark.asyncio
    async def test_analyze_portfolio_handles_empty(self):
        """Test portfolio analysis with no holdings."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_portfolio_context = AsyncMock(
            return_value={
                "portfolio": {"id": "port-001", "name": "Empty Portfolio"},
                "holdings": [],
            }
        )

        result = await agent.analyze_portfolio("port-001")

        assert result["portfolio_health"]["grade"] == "F"
        assert "No holdings" in result["summary"]

    @pytest.mark.asyncio
    async def test_analyze_portfolio_handles_error(self):
        """Test portfolio analysis error handling."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_portfolio_context = AsyncMock(
            return_value={"error": "Portfolio not found"}
        )

        result = await agent.analyze_portfolio("invalid")

        assert "error" in result
        assert result["confidence"] == 0.0


# =============================================================================
# Allocation Data Tests
# =============================================================================


class TestBuildAllocationData:
    """Tests for building allocation data."""

    def test_build_allocation_data_calculates_weights(self):
        """Test that allocation data calculates sector weights."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        holdings = [
            {"sector": "Technology", "market_value": 6000},
            {"sector": "Healthcare", "market_value": 4000},
        ]

        result = agent._build_allocation_data(holdings)

        assert result["by_sector"]["Technology"] == pytest.approx(0.6)
        assert result["by_sector"]["Healthcare"] == pytest.approx(0.4)
        assert result["total_value"] == 10000

    def test_build_allocation_data_empty(self):
        """Test allocation data with no holdings."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        result = agent._build_allocation_data([])

        assert result["by_sector"] == {}
        assert result["total_value"] == 0


# =============================================================================
# Peer Statistics Tests
# =============================================================================


class TestPeerStatistics:
    """Tests for peer statistics calculation."""

    def test_calculate_peer_statistics(self):
        """Test peer statistics calculation."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        peer_ratios = [
            {"pe_ratio": 20, "roe": 0.15},
            {"pe_ratio": 25, "roe": 0.20},
            {"pe_ratio": 30, "roe": 0.25},
        ]

        result = agent._calculate_peer_statistics(peer_ratios)

        assert "pe_ratio" in result
        assert result["pe_ratio"]["min"] == 20
        assert result["pe_ratio"]["max"] == 30
        assert result["pe_ratio"]["median"] == 25

    def test_calculate_peer_statistics_handles_none(self):
        """Test statistics with None values."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        peer_ratios = [
            {"pe_ratio": 20, "roe": None},
            {"pe_ratio": None, "roe": 0.20},
        ]

        result = agent._calculate_peer_statistics(peer_ratios)

        # Should only include non-None values
        assert result["pe_ratio"]["count"] == 1
        assert result["roe"]["count"] == 1


# =============================================================================
# Response Parsing Tests
# =============================================================================


class TestResponseParsing:
    """Tests for response parsing."""

    def test_parse_analysis_response_valid_json(self):
        """Test parsing valid JSON response."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        result = {"analysis": '{"summary": "Test", "confidence": 0.9}'}
        parsed = agent._parse_analysis_response(result)

        assert parsed["summary"] == "Test"
        assert parsed["confidence"] == 0.9

    def test_parse_analysis_response_json_in_markdown(self):
        """Test parsing JSON wrapped in markdown code block."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        result = {
            "analysis": '```json\n{"summary": "Test", "confidence": 0.8}\n```'
        }
        parsed = agent._parse_analysis_response(result)

        assert parsed["summary"] == "Test"
        assert parsed["confidence"] == 0.8

    def test_parse_analysis_response_invalid_json(self):
        """Test parsing invalid JSON returns error structure."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        result = {"analysis": "not valid json"}
        parsed = agent._parse_analysis_response(result)

        assert "error" in parsed
        assert parsed["confidence"] == 0.0


# =============================================================================
# Helper Method Tests
# =============================================================================


class TestHelperMethods:
    """Tests for helper methods."""

    def test_safe_float_valid_values(self):
        """Test safe_float with valid values."""
        assert FinancialAnalystAgent._safe_float(10.5) == 10.5
        assert FinancialAnalystAgent._safe_float("10.5") == 10.5
        assert FinancialAnalystAgent._safe_float(Decimal("10.5")) == 10.5

    def test_safe_float_none_and_invalid(self):
        """Test safe_float with None and invalid values."""
        assert FinancialAnalystAgent._safe_float(None) is None
        assert FinancialAnalystAgent._safe_float("invalid") is None
        assert FinancialAnalystAgent._safe_float({}) is None

    def test_error_response_structure(self):
        """Test error response has correct structure."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        start_time = datetime.now(UTC)
        result = agent._error_response("Test error", start_time)

        assert result["error"] == "Test error"
        assert result["confidence"] == 0.0
        assert result["financial_health"]["grade"] == "F"
        assert "_metadata" in result

    def test_add_low_confidence_caveat(self):
        """Test adding low confidence caveat."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        analysis = {"summary": "Original summary", "confidence": 0.4}
        result = agent._add_low_confidence_caveat(analysis)

        assert "lower confidence" in result["summary"]
        assert "verify" in result["summary"].lower()


# =============================================================================
# Convenience Function Tests
# =============================================================================


class TestConvenienceFunctions:
    """Tests for convenience functions."""

    @pytest.mark.asyncio
    async def test_analyze_security_function(self):
        """Test analyze_security convenience function."""
        mock_db = MagicMock()

        with patch(
            "arc.agents.financial_analyst.FinancialAnalystAgent"
        ) as MockAgent:
            mock_instance = MagicMock()
            mock_instance.analyze_security = AsyncMock(
                return_value={"financial_health": {"grade": "A"}}
            )
            MockAgent.return_value = mock_instance

            result = await analyze_security(mock_db, "AAPL")

            assert result["financial_health"]["grade"] == "A"
            MockAgent.assert_called_once()

    @pytest.mark.asyncio
    async def test_detect_anomalies_function(self):
        """Test detect_anomalies convenience function."""
        mock_db = MagicMock()

        with patch(
            "arc.agents.financial_analyst.FinancialAnalystAgent"
        ) as MockAgent:
            mock_instance = MagicMock()
            mock_instance.detect_anomalies = AsyncMock(
                return_value=[{"severity": "high"}]
            )
            MockAgent.return_value = mock_instance

            result = await detect_anomalies(mock_db, ["AAPL"])

            assert len(result) == 1
            assert result[0]["severity"] == "high"

    @pytest.mark.asyncio
    async def test_analyze_portfolio_health_function(self):
        """Test analyze_portfolio_health convenience function."""
        mock_db = MagicMock()

        with patch(
            "arc.agents.financial_analyst.FinancialAnalystAgent"
        ) as MockAgent:
            mock_instance = MagicMock()
            mock_instance.analyze_portfolio = AsyncMock(
                return_value={"portfolio_health": {"grade": "B"}}
            )
            MockAgent.return_value = mock_instance

            result = await analyze_portfolio_health(mock_db, "port-001")

            assert result["portfolio_health"]["grade"] == "B"


# =============================================================================
# Edge Case Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_agent_without_db(self):
        """Test agent can be created without db."""
        agent = FinancialAnalystAgent(db=None)

        assert agent.db is None
        assert agent.agent_id == "financial_analyst"

    @pytest.mark.asyncio
    async def test_analyze_security_json_parsing_error(self):
        """Test handling of JSON parsing errors in analysis."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        agent.get_security_context = AsyncMock(
            return_value={
                "security": {"id": "sec-001", "ticker": "TEST"},
                "prices": [],
                "fundamentals": [],
                "ratios": {},
            }
        )

        # Return malformed JSON
        agent.run_async = AsyncMock(return_value={"analysis": "{invalid json"})

        result = await agent.analyze_security("TEST")

        assert result["confidence"] == 0.0
        assert "error" in result or result["financial_health"]["grade"] == "F"

    @pytest.mark.asyncio
    async def test_peer_data_handles_db_error(self):
        """Test peer data retrieval handles database errors."""
        mock_db = MagicMock()
        mock_db.express.list = AsyncMock(side_effect=Exception("DB Error"))

        agent = FinancialAnalystAgent(db=mock_db)

        result = await agent._get_peer_data({"sector": "Technology"})

        # Should return empty dict on error
        assert result == {}

    def test_validate_health_analysis_bounds_confidence(self):
        """Test that confidence is bounded to 0-1."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        analysis = {
            "financial_health": {"score": 85, "grade": "B"},
            "confidence": 1.5,  # Over 1.0
        }

        result = agent._validate_health_analysis(analysis)

        assert result["confidence"] == 1.0

    def test_validate_health_analysis_negative_confidence(self):
        """Test that negative confidence is bounded to 0."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        analysis = {
            "financial_health": {"score": 85, "grade": "B"},
            "confidence": -0.5,
        }

        result = agent._validate_health_analysis(analysis)

        assert result["confidence"] == 0.0

    @pytest.mark.asyncio
    async def test_build_historical_data_no_db(self):
        """Test historical data building without database."""
        agent = FinancialAnalystAgent(db=None)

        result = await agent._build_historical_data("sec-001", 4)

        assert result == {}

    @pytest.mark.asyncio
    async def test_get_benchmark_data_no_benchmark(self):
        """Test benchmark data when no benchmark set."""
        mock_db = MagicMock()
        agent = FinancialAnalystAgent(db=mock_db)

        result = await agent._get_benchmark_data({"name": "Test Portfolio"})

        assert result == {}
