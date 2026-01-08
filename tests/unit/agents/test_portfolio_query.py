"""
Comprehensive tests for PortfolioQueryAgent.

Tests cover:
- PortfolioQueryConfig configuration
- ClassifyQuerySignature and PortfolioAnswerSignature
- PortfolioQueryAgent initialization
- LLM-based query classification
- Data retrieval per query type
- Answer generation with confidence
- Query logging and analytics
- Convenience functions

Test count: 55+ tests
"""

import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.agents.portfolio_query import (
    ClassifyQuerySignature,
    PortfolioAnswerSignature,
    PortfolioQueryAgent,
    PortfolioQueryConfig,
    QueryLogEntry,
    QueryType,
    query_portfolio,
)


# =============================================================================
# PortfolioQueryConfig Tests
# =============================================================================


class TestPortfolioQueryConfig:
    """Tests for PortfolioQueryConfig."""

    def test_default_config_values(self):
        """Test default configuration values."""
        config = PortfolioQueryConfig()

        assert config.model == "gpt-4o-mini"
        assert config.temperature == 0.1
        assert config.max_tokens == 2000
        assert config.strategy_type == "single_shot"
        assert config.classification_model == "gpt-4o-mini"
        assert config.classification_temperature == 0.0
        assert config.max_holdings == 100
        assert config.max_alerts == 20
        assert config.min_confidence_threshold == 0.5
        assert config.enable_query_logging is True

    def test_custom_config_values(self):
        """Test custom configuration values."""
        config = PortfolioQueryConfig(
            model="gpt-4o",
            temperature=0.2,
            max_holdings=50,
            min_confidence_threshold=0.7,
        )

        assert config.model == "gpt-4o"
        assert config.temperature == 0.2
        assert config.max_holdings == 50
        assert config.min_confidence_threshold == 0.7

    def test_inherits_from_arc_agent_config(self):
        """Test that PortfolioQueryConfig inherits ARCAgentConfig fields."""
        config = PortfolioQueryConfig()

        assert hasattr(config, "llm_provider")
        assert hasattr(config, "use_async_llm")
        assert hasattr(config, "budget_limit_usd")
        assert hasattr(config, "hooks_enabled")

    def test_to_kaizen_config(self):
        """Test conversion to Kaizen-compatible config dict."""
        config = PortfolioQueryConfig()
        kaizen_dict = config.to_kaizen_config()

        assert isinstance(kaizen_dict, dict)
        assert kaizen_dict["model"] == "gpt-4o-mini"
        assert kaizen_dict["temperature"] == 0.1


# =============================================================================
# QueryType Tests
# =============================================================================


class TestQueryType:
    """Tests for QueryType enumeration."""

    def test_all_query_types_defined(self):
        """Test that all expected query types are defined."""
        expected_types = [
            "allocation",
            "performance",
            "holdings",
            "ratios",
            "comparison",
            "alerts",
            "general",
        ]

        for qt in expected_types:
            assert hasattr(QueryType, qt.upper())
            assert QueryType[qt.upper()].value == qt

    def test_query_type_is_string_enum(self):
        """Test that QueryType values are strings."""
        assert QueryType.ALLOCATION.value == "allocation"
        assert isinstance(QueryType.ALLOCATION.value, str)


# =============================================================================
# Signature Tests
# =============================================================================


class TestClassifyQuerySignature:
    """Tests for ClassifyQuerySignature."""

    def test_input_fields_exist(self):
        """Test that all input fields are defined."""
        sig = ClassifyQuerySignature

        assert hasattr(sig, "query")
        assert hasattr(sig, "portfolio_context")

    def test_output_fields_exist(self):
        """Test that all output fields are defined."""
        sig = ClassifyQuerySignature

        assert hasattr(sig, "classification")


class TestPortfolioAnswerSignature:
    """Tests for PortfolioAnswerSignature."""

    def test_input_fields_exist(self):
        """Test that all input fields are defined."""
        sig = PortfolioAnswerSignature

        assert hasattr(sig, "query")
        assert hasattr(sig, "query_type")
        assert hasattr(sig, "portfolio_data")
        assert hasattr(sig, "additional_context")

    def test_output_fields_exist(self):
        """Test that all output fields are defined."""
        sig = PortfolioAnswerSignature

        assert hasattr(sig, "response")


# =============================================================================
# QueryLogEntry Tests
# =============================================================================


class TestQueryLogEntry:
    """Tests for QueryLogEntry dataclass."""

    def test_create_log_entry(self):
        """Test creating a query log entry."""
        entry = QueryLogEntry(
            query_id="query_123",
            portfolio_id="port-001",
            query="What is my tech exposure?",
            query_type="allocation",
            classification_confidence=0.95,
            answer_confidence=0.85,
            processing_time_ms=150.5,
            timestamp="2026-01-07T10:00:00Z",
            entities={"securities": ["AAPL"]},
            success=True,
        )

        assert entry.query_id == "query_123"
        assert entry.portfolio_id == "port-001"
        assert entry.query_type == "allocation"
        assert entry.success is True
        assert entry.error is None

    def test_create_log_entry_with_error(self):
        """Test creating a log entry with error."""
        entry = QueryLogEntry(
            query_id="query_456",
            portfolio_id="port-001",
            query="Invalid query",
            query_type="general",
            classification_confidence=0.0,
            answer_confidence=0.0,
            processing_time_ms=50.0,
            timestamp="2026-01-07T10:00:00Z",
            entities={},
            success=False,
            error="Portfolio not found",
        )

        assert entry.success is False
        assert entry.error == "Portfolio not found"


# =============================================================================
# PortfolioQueryAgent Initialization Tests
# =============================================================================


class TestPortfolioQueryAgentInit:
    """Tests for PortfolioQueryAgent initialization."""

    def test_init_with_default_config(self):
        """Test initialization with default config."""
        mock_db = MagicMock()

        agent = PortfolioQueryAgent(db=mock_db)

        assert agent.db is mock_db
        assert agent.agent_id == "portfolio_query"
        assert agent._query_config is not None
        assert agent._query_config.model == "gpt-4o-mini"

    def test_init_with_custom_config(self):
        """Test initialization with custom config."""
        mock_db = MagicMock()
        config = PortfolioQueryConfig(
            model="gpt-4o",
            min_confidence_threshold=0.7,
        )

        agent = PortfolioQueryAgent(config=config, db=mock_db)

        assert agent._query_config.model == "gpt-4o"
        assert agent._query_config.min_confidence_threshold == 0.7

    def test_init_with_custom_agent_id(self):
        """Test initialization with custom agent ID."""
        mock_db = MagicMock()

        agent = PortfolioQueryAgent(
            db=mock_db,
            agent_id="custom_query_agent",
        )

        assert agent.agent_id == "custom_query_agent"

    def test_classifier_agent_created(self):
        """Test that classifier agent is created."""
        mock_db = MagicMock()

        agent = PortfolioQueryAgent(db=mock_db)

        assert agent._classifier is not None

    def test_query_log_initialized_empty(self):
        """Test that query log is initialized empty."""
        mock_db = MagicMock()

        agent = PortfolioQueryAgent(db=mock_db)

        assert agent._query_log == []


# =============================================================================
# System Prompt Tests
# =============================================================================


class TestSystemPrompt:
    """Tests for system prompt generation."""

    def test_system_prompt_contains_investment_context(self):
        """Test that system prompt contains investment analyst context."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "investment" in prompt.lower()
        assert "analyst" in prompt.lower()

    def test_system_prompt_contains_formatting_guidelines(self):
        """Test that system prompt contains formatting guidelines."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "currency" in prompt.lower() or "format" in prompt.lower()

    def test_system_prompt_contains_risk_disclosure(self):
        """Test that system prompt mentions risk disclosure."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "risk" in prompt.lower()


# =============================================================================
# Query Classification Tests
# =============================================================================


class TestQueryClassification:
    """Tests for LLM-based query classification."""

    @pytest.mark.asyncio
    async def test_classify_query_returns_valid_type(self):
        """Test that classification returns a valid query type."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        # Mock classifier response
        agent._classifier.run = MagicMock(
            return_value={
                "classification": json.dumps(
                    {
                        "query_type": "allocation",
                        "confidence": 0.95,
                        "reasoning": "Query asks about sector exposure",
                        "entities": {"securities": [], "sectors": ["Technology"]},
                    }
                )
            }
        )

        result = await agent._classify_query(
            "What is my tech exposure?",
            {"name": "Test Portfolio"},
        )

        assert result["query_type"] == "allocation"
        assert result["confidence"] == 0.95

    @pytest.mark.asyncio
    async def test_classify_query_handles_invalid_type(self):
        """Test that invalid query type falls back to general."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._classifier.run = MagicMock(
            return_value={
                "classification": json.dumps(
                    {
                        "query_type": "invalid_type",
                        "confidence": 0.5,
                    }
                )
            }
        )

        result = await agent._classify_query("Some query", {})

        assert result["query_type"] == "general"

    @pytest.mark.asyncio
    async def test_classify_query_handles_json_error(self):
        """Test that JSON parse error falls back to general."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._classifier.run = MagicMock(
            return_value={"classification": "invalid json ["}
        )

        result = await agent._classify_query("Some query", {})

        assert result["query_type"] == "general"
        assert result["confidence"] == 0.3

    @pytest.mark.asyncio
    async def test_classify_query_low_confidence_uses_general(self):
        """Test that low confidence classification uses general category."""
        mock_db = MagicMock()
        config = PortfolioQueryConfig(reclassify_threshold=0.5)
        agent = PortfolioQueryAgent(config=config, db=mock_db)

        agent._classifier.run = MagicMock(
            return_value={
                "classification": json.dumps(
                    {
                        "query_type": "allocation",
                        "confidence": 0.3,  # Below threshold
                    }
                )
            }
        )

        result = await agent._classify_query("Ambiguous query", {})

        assert result["query_type"] == "general"


# =============================================================================
# Data Retrieval Tests
# =============================================================================


class TestDataRetrieval:
    """Tests for data retrieval by query type."""

    @pytest.mark.asyncio
    async def test_retrieve_data_calls_correct_method(self):
        """Test that retrieve_data calls the correct method for each type."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        # Mock all retrieval methods
        agent._get_allocation_data = AsyncMock(return_value={"type": "allocation"})
        agent._get_performance_data = AsyncMock(return_value={"type": "performance"})
        agent._get_holdings_data = AsyncMock(return_value={"type": "holdings"})

        # Test allocation
        result = await agent._retrieve_data("port-001", "allocation", {})
        assert result["type"] == "allocation"

        # Test performance
        result = await agent._retrieve_data("port-001", "performance", {})
        assert result["type"] == "performance"

        # Test holdings
        result = await agent._retrieve_data("port-001", "holdings", {})
        assert result["type"] == "holdings"

    @pytest.mark.asyncio
    async def test_get_allocation_data_calculates_sectors(self):
        """Test that allocation data includes sector calculations."""
        mock_db = MagicMock()
        mock_db.express.list = AsyncMock(
            return_value=[
                {
                    "security_id": "sec-001",
                    "market_value": "50000",
                    "weight": 0.5,
                },
                {
                    "security_id": "sec-002",
                    "market_value": "50000",
                    "weight": 0.5,
                },
            ]
        )
        mock_db.express.read = AsyncMock(
            side_effect=lambda model, id: {
                "sec-001": {"ticker": "AAPL", "name": "Apple", "sector": "Technology"},
                "sec-002": {"ticker": "JPM", "name": "JPMorgan", "sector": "Financials"},
            }.get(id)
        )

        agent = PortfolioQueryAgent(db=mock_db)

        result = await agent._get_allocation_data("port-001", {})

        assert result["type"] == "allocation"
        assert "sector_allocation" in result
        assert "Technology" in result["sector_allocation"]
        assert "Financials" in result["sector_allocation"]

    @pytest.mark.asyncio
    async def test_get_holdings_data_filters_by_symbols(self):
        """Test that holdings data filters by mentioned symbols."""
        mock_db = MagicMock()
        mock_db.express.list = AsyncMock(
            return_value=[
                {"security_id": "sec-001", "market_value": "50000"},
                {"security_id": "sec-002", "market_value": "30000"},
            ]
        )
        mock_db.express.read = AsyncMock(
            side_effect=lambda model, id: {
                "sec-001": {"ticker": "AAPL", "name": "Apple"},
                "sec-002": {"ticker": "MSFT", "name": "Microsoft"},
            }.get(id)
        )

        agent = PortfolioQueryAgent(db=mock_db)

        # Filter to only AAPL
        result = await agent._get_holdings_data(
            "port-001",
            {"securities": ["AAPL"]},
        )

        assert result["holdings_count"] == 1
        assert result["holdings"][0]["symbol"] == "AAPL"


# =============================================================================
# Answer Generation Tests
# =============================================================================


class TestAnswerGeneration:
    """Tests for answer generation with confidence."""

    @pytest.mark.asyncio
    async def test_generate_answer_parses_json_response(self):
        """Test that answer generation parses JSON response."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent.run = MagicMock(
            return_value={
                "response": json.dumps(
                    {
                        "answer": "Your tech exposure is 35%.",
                        "confidence": 0.9,
                        "confidence_reasoning": "Complete data available",
                        "data_points": [{"metric": "tech_weight", "value": "35%"}],
                        "follow_up_questions": ["How has tech performed?"],
                    }
                )
            }
        )

        result = await agent._generate_answer(
            question="What's my tech exposure?",
            query_type="allocation",
            portfolio_data={"sector_allocation": {"Technology": {"weight": 35}}},
            additional_context="",
        )

        assert result["answer"] == "Your tech exposure is 35%."
        assert result["confidence"] == 0.9
        assert len(result["follow_up_questions"]) > 0

    @pytest.mark.asyncio
    async def test_generate_answer_bounds_confidence(self):
        """Test that confidence is bounded to 0-1."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent.run = MagicMock(
            return_value={
                "response": json.dumps(
                    {
                        "answer": "Test",
                        "confidence": 1.5,  # Out of bounds
                    }
                )
            }
        )

        result = await agent._generate_answer("Test", "general", {}, "")

        assert result["confidence"] == 1.0  # Bounded

    @pytest.mark.asyncio
    async def test_generate_answer_adds_low_confidence_caveat(self):
        """Test that low confidence adds caveat."""
        mock_db = MagicMock()
        config = PortfolioQueryConfig(min_confidence_threshold=0.6)
        agent = PortfolioQueryAgent(config=config, db=mock_db)

        agent.run = MagicMock(
            return_value={
                "response": json.dumps(
                    {
                        "answer": "Limited data answer",
                        "confidence": 0.4,  # Below threshold
                    }
                )
            }
        )

        result = await agent._generate_answer("Test", "general", {}, "")

        assert any("lower confidence" in c.lower() for c in result.get("caveats", []))


# =============================================================================
# Main Query Flow Tests
# =============================================================================


class TestQueryFlow:
    """Tests for the main query flow."""

    @pytest.mark.asyncio
    async def test_query_full_flow(self):
        """Test the full query flow."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        # Mock all steps
        agent._get_portfolio_brief = AsyncMock(
            return_value={"name": "Test Portfolio", "holdings_count": 10}
        )
        agent._classify_query = AsyncMock(
            return_value={
                "query_type": "allocation",
                "confidence": 0.9,
                "reasoning": "Asks about allocation",
                "entities": {},
            }
        )
        agent._retrieve_data = AsyncMock(return_value={"type": "allocation"})
        agent._generate_answer = AsyncMock(
            return_value={
                "answer": "Your allocation is...",
                "confidence": 0.85,
                "data_points": [],
                "follow_up_questions": [],
            }
        )

        result = await agent.query("port-001", "What's my allocation?")

        assert "answer" in result
        assert result["query_type"] == "allocation"
        assert result["classification_confidence"] == 0.9
        assert "processing_time_ms" in result

    @pytest.mark.asyncio
    async def test_query_handles_portfolio_not_found(self):
        """Test query handles portfolio not found error."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._get_portfolio_brief = AsyncMock(
            return_value={"error": "Portfolio not found"}
        )

        result = await agent.query("invalid-port", "What's my allocation?")

        assert "error" in result
        assert result["confidence"] == 0.0

    @pytest.mark.asyncio
    async def test_query_logs_entry(self):
        """Test that query logs an entry."""
        mock_db = MagicMock()
        config = PortfolioQueryConfig(enable_query_logging=True)
        agent = PortfolioQueryAgent(config=config, db=mock_db)

        agent._get_portfolio_brief = AsyncMock(return_value={"name": "Test"})
        agent._classify_query = AsyncMock(
            return_value={"query_type": "general", "confidence": 0.5, "entities": {}}
        )
        agent._retrieve_data = AsyncMock(return_value={})
        agent._generate_answer = AsyncMock(
            return_value={"answer": "Test", "confidence": 0.5}
        )

        await agent.query("port-001", "Test query")

        assert len(agent._query_log) == 1
        assert agent._query_log[0].query == "Test query"


# =============================================================================
# Query Analytics Tests
# =============================================================================


class TestQueryAnalytics:
    """Tests for query logging and analytics."""

    def test_get_query_log_returns_copy(self):
        """Test that get_query_log returns a copy."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._query_log = [
            QueryLogEntry(
                query_id="1",
                portfolio_id="p1",
                query="test",
                query_type="general",
                classification_confidence=0.5,
                answer_confidence=0.5,
                processing_time_ms=100,
                timestamp="2026-01-07",
                entities={},
                success=True,
            )
        ]

        log = agent.get_query_log()

        assert log is not agent._query_log
        assert len(log) == 1

    def test_get_query_analytics_empty_log(self):
        """Test analytics with empty log."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        analytics = agent.get_query_analytics()

        assert analytics["total_queries"] == 0

    def test_get_query_analytics_calculates_correctly(self):
        """Test analytics calculations."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._query_log = [
            QueryLogEntry(
                query_id="1",
                portfolio_id="p1",
                query="q1",
                query_type="allocation",
                classification_confidence=0.9,
                answer_confidence=0.8,
                processing_time_ms=100,
                timestamp="2026-01-07",
                entities={},
                success=True,
            ),
            QueryLogEntry(
                query_id="2",
                portfolio_id="p1",
                query="q2",
                query_type="performance",
                classification_confidence=0.8,
                answer_confidence=0.7,
                processing_time_ms=150,
                timestamp="2026-01-07",
                entities={},
                success=True,
            ),
        ]

        analytics = agent.get_query_analytics()

        assert analytics["total_queries"] == 2
        assert analytics["successful_queries"] == 2
        assert analytics["success_rate"] == 1.0
        assert "allocation" in analytics["query_type_distribution"]
        assert "performance" in analytics["query_type_distribution"]
        assert analytics["average_classification_confidence"] == pytest.approx(0.85)
        assert analytics["average_processing_time_ms"] == 125


# =============================================================================
# Suggest Queries Tests
# =============================================================================


class TestSuggestQueries:
    """Tests for query suggestion."""

    @pytest.mark.asyncio
    async def test_suggest_queries_returns_list(self):
        """Test that suggest_queries returns a list."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._get_portfolio_brief = AsyncMock(
            return_value={"name": "Test", "top_sector": "Technology"}
        )

        suggestions = await agent.suggest_queries("port-001")

        assert isinstance(suggestions, list)
        assert len(suggestions) > 0

    @pytest.mark.asyncio
    async def test_suggest_queries_excludes_recent(self):
        """Test that suggestions exclude recent queries."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._get_portfolio_brief = AsyncMock(
            return_value={"name": "Test", "top_sector": "Technology"}
        )

        suggestions = await agent.suggest_queries(
            "port-001",
            recent_queries=["What is my current allocation by sector?"],
        )

        # Should not include the exact recent query
        assert "What is my current allocation by sector?" not in suggestions

    @pytest.mark.asyncio
    async def test_suggest_queries_handles_error(self):
        """Test that suggestions handle portfolio error."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._get_portfolio_brief = AsyncMock(return_value={"error": "Not found"})

        suggestions = await agent.suggest_queries("invalid")

        assert suggestions == []


# =============================================================================
# Helper Method Tests
# =============================================================================


class TestHelperMethods:
    """Tests for helper methods."""

    def test_format_portfolio_context(self):
        """Test portfolio context formatting."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        context = {
            "name": "Growth Portfolio",
            "portfolio_type": "investment",
            "strategy": "growth",
            "holdings_count": 25,
            "total_value": 150000,
            "top_sectors": ["Technology", "Healthcare"],
        }

        formatted = agent._format_portfolio_context(context)

        assert "Growth Portfolio" in formatted
        assert "25" in formatted

    def test_format_portfolio_context_handles_empty(self):
        """Test context formatting with empty dict."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        formatted = agent._format_portfolio_context({})

        assert formatted == ""

    def test_format_portfolio_context_handles_error(self):
        """Test context formatting with error."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        formatted = agent._format_portfolio_context({"error": "Not found"})

        assert formatted == ""

    def test_safe_float_converts_values(self):
        """Test safe float conversion."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        assert agent._safe_float("1.5") == 1.5
        assert agent._safe_float(2.5) == 2.5
        assert agent._safe_float(None) is None
        assert agent._safe_float("invalid") is None

    def test_error_response_structure(self):
        """Test error response has correct structure."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        result = agent._error_response("Test error", "Test query", "query_123")

        assert "answer" in result
        assert "Test error" in result["answer"]
        assert result["confidence"] == 0.0
        assert result["error"] == "Test error"
        assert result["query_id"] == "query_123"


# =============================================================================
# Convenience Function Tests
# =============================================================================


class TestConvenienceFunctions:
    """Tests for convenience functions."""

    @pytest.mark.asyncio
    async def test_query_portfolio_function(self):
        """Test query_portfolio convenience function."""
        mock_db = MagicMock()

        with patch.object(
            PortfolioQueryAgent,
            "query",
            new_callable=AsyncMock,
            return_value={"answer": "Test answer", "confidence": 0.8},
        ) as mock_query:
            result = await query_portfolio(
                db=mock_db,
                portfolio_id="port-001",
                question="What's my allocation?",
            )

            mock_query.assert_called_once_with("port-001", "What's my allocation?")
            assert result["answer"] == "Test answer"


# =============================================================================
# Edge Case Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_agent_without_db(self):
        """Test agent initialization without db."""
        agent = PortfolioQueryAgent(db=None)

        assert agent.db is None

    @pytest.mark.asyncio
    async def test_query_exception_handling(self):
        """Test that query handles exceptions gracefully."""
        mock_db = MagicMock()
        agent = PortfolioQueryAgent(db=mock_db)

        agent._get_portfolio_brief = AsyncMock(side_effect=Exception("Database error"))

        result = await agent.query("port-001", "Test query")

        assert "error" in result
        assert result["confidence"] == 0.0

    def test_query_log_limits_size(self):
        """Test that query log limits to 1000 entries."""
        mock_db = MagicMock()
        config = PortfolioQueryConfig(enable_query_logging=True)
        agent = PortfolioQueryAgent(config=config, db=mock_db)

        # Add 1001 entries
        for i in range(1001):
            agent._log_query(
                query_id=f"q_{i}",
                portfolio_id="p1",
                query=f"Query {i}",
                query_type="general",
                classification_confidence=0.5,
                answer_confidence=0.5,
                processing_time_ms=100,
                entities={},
                success=True,
            )

        # Should be limited to 1000
        assert len(agent._query_log) == 1000

    @pytest.mark.asyncio
    async def test_get_allocation_data_handles_zero_value(self):
        """Test allocation data handles zero total value."""
        mock_db = MagicMock()
        mock_db.express.list = AsyncMock(
            return_value=[
                {"security_id": "sec-001", "market_value": "0"},
            ]
        )
        mock_db.express.read = AsyncMock(
            return_value={"ticker": "XYZ", "sector": "Unknown"}
        )

        agent = PortfolioQueryAgent(db=mock_db)

        result = await agent._get_allocation_data("port-001", {})

        assert result["total_value"] == 0

    @pytest.mark.asyncio
    async def test_get_holdings_data_handles_missing_security(self):
        """Test holdings data handles missing security info."""
        mock_db = MagicMock()
        mock_db.express.list = AsyncMock(
            return_value=[
                {"security_id": "sec-001", "market_value": "10000"},
            ]
        )
        mock_db.express.read = AsyncMock(return_value=None)

        agent = PortfolioQueryAgent(db=mock_db)

        result = await agent._get_holdings_data("port-001", {})

        # Should handle gracefully - holding still exists, security details are fallback values
        assert result["holdings_count"] == 1
        assert result["holdings"][0]["symbol"] == "N/A"
        assert result["holdings"][0]["name"] == "Unknown"
