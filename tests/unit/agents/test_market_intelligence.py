"""
Comprehensive tests for MarketIntelligenceAgent.

Tests cover:
- MarketIntelligenceConfig configuration
- MarketBriefSignature and ResearchSignature
- MarketIntelligenceAgent initialization
- Brief generation with chain-of-thought
- Research synthesis
- Streaming responses
- Cost tracking
- Post-processing and validation
- Convenience functions

Test count: 50+ tests
"""

import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from arc.agents.market_intelligence import (
    MarketBriefSignature,
    MarketIntelligenceAgent,
    MarketIntelligenceConfig,
    ResearchSignature,
    generate_market_brief,
    research_topic,
)


# =============================================================================
# MarketIntelligenceConfig Tests
# =============================================================================


class TestMarketIntelligenceConfig:
    """Tests for MarketIntelligenceConfig."""

    def test_default_config_values(self):
        """Test default configuration values."""
        config = MarketIntelligenceConfig()

        assert config.model == "gpt-4o"
        assert config.temperature == 0.25
        assert config.max_tokens == 8000
        assert config.strategy_type == "single_shot"
        assert config.include_sentiment is True
        assert config.include_technicals is True
        assert config.news_lookback_days == 3
        assert config.confidence_threshold == 0.6
        assert config.enable_streaming is True
        assert config.chunk_size == 5

    def test_custom_config_values(self):
        """Test custom configuration values."""
        config = MarketIntelligenceConfig(
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=4000,
            include_sentiment=False,
            confidence_threshold=0.8,
        )

        assert config.model == "gpt-4o-mini"
        assert config.temperature == 0.3
        assert config.max_tokens == 4000
        assert config.include_sentiment is False
        assert config.confidence_threshold == 0.8

    def test_inherits_from_arc_agent_config(self):
        """Test that MarketIntelligenceConfig inherits ARCAgentConfig fields."""
        config = MarketIntelligenceConfig()

        # Base ARCAgentConfig fields should be available
        assert hasattr(config, "llm_provider")
        assert hasattr(config, "use_async_llm")
        assert hasattr(config, "budget_limit_usd")
        assert hasattr(config, "hooks_enabled")
        assert hasattr(config, "memory_enabled")

    def test_to_kaizen_config(self):
        """Test conversion to Kaizen-compatible config dict."""
        config = MarketIntelligenceConfig()
        kaizen_dict = config.to_kaizen_config()

        assert isinstance(kaizen_dict, dict)
        assert kaizen_dict["model"] == "gpt-4o"
        assert kaizen_dict["temperature"] == 0.25
        assert kaizen_dict["max_tokens"] == 8000
        assert kaizen_dict["strategy_type"] == "single_shot"


# =============================================================================
# Signature Tests
# =============================================================================


class TestMarketBriefSignature:
    """Tests for MarketBriefSignature."""

    def test_input_fields_exist(self):
        """Test that all input fields are defined."""
        sig = MarketBriefSignature

        # Check input fields
        assert hasattr(sig, "portfolio_context")
        assert hasattr(sig, "market_data")
        assert hasattr(sig, "news_context")
        assert hasattr(sig, "user_preferences")
        assert hasattr(sig, "brief_type")
        assert hasattr(sig, "output_format")

    def test_chain_of_thought_fields_exist(self):
        """Test that all CoT step fields are defined."""
        sig = MarketBriefSignature

        # Chain-of-thought steps
        assert hasattr(sig, "step1_market_assessment")
        assert hasattr(sig, "step2_portfolio_analysis")
        assert hasattr(sig, "step3_sentiment_analysis")
        assert hasattr(sig, "step4_opportunity_risk")
        assert hasattr(sig, "step5_actionable_synthesis")

    def test_output_fields_exist(self):
        """Test that all output fields are defined."""
        sig = MarketBriefSignature

        # Final outputs
        assert hasattr(sig, "executive_summary")
        assert hasattr(sig, "sections")
        assert hasattr(sig, "actionable_takeaways")
        assert hasattr(sig, "risk_warnings")
        assert hasattr(sig, "confidence")


class TestResearchSignature:
    """Tests for ResearchSignature."""

    def test_input_fields_exist(self):
        """Test that all input fields are defined."""
        sig = ResearchSignature

        assert hasattr(sig, "topic")
        assert hasattr(sig, "depth")
        assert hasattr(sig, "portfolio_context")

    def test_chain_of_thought_fields_exist(self):
        """Test that all CoT step fields are defined."""
        sig = ResearchSignature

        assert hasattr(sig, "step1_topic_framing")
        assert hasattr(sig, "step2_evidence_gathering")
        assert hasattr(sig, "step3_analysis")

    def test_output_fields_exist(self):
        """Test that all output fields are defined."""
        sig = ResearchSignature

        assert hasattr(sig, "summary")
        assert hasattr(sig, "key_points")
        assert hasattr(sig, "implications")
        assert hasattr(sig, "sources")
        assert hasattr(sig, "confidence")


# =============================================================================
# MarketIntelligenceAgent Initialization Tests
# =============================================================================


class TestMarketIntelligenceAgentInit:
    """Tests for MarketIntelligenceAgent initialization."""

    def test_init_with_default_config(self):
        """Test initialization with default config."""
        mock_db = MagicMock()

        agent = MarketIntelligenceAgent(db=mock_db)

        assert agent.db is mock_db
        assert agent.agent_id == "market_intelligence"
        assert agent._market_config is not None
        assert agent._market_config.model == "gpt-4o"

    def test_init_with_custom_config(self):
        """Test initialization with custom config."""
        mock_db = MagicMock()
        config = MarketIntelligenceConfig(
            model="gpt-4o-mini",
            confidence_threshold=0.8,
        )

        agent = MarketIntelligenceAgent(config=config, db=mock_db)

        assert agent._market_config.model == "gpt-4o-mini"
        assert agent._market_config.confidence_threshold == 0.8

    def test_init_with_custom_agent_id(self):
        """Test initialization with custom agent ID."""
        mock_db = MagicMock()

        agent = MarketIntelligenceAgent(
            db=mock_db,
            agent_id="custom_market_agent",
        )

        assert agent.agent_id == "custom_market_agent"

    def test_init_with_shared_memory(self):
        """Test initialization with shared memory."""
        mock_db = MagicMock()
        mock_memory = MagicMock()

        agent = MarketIntelligenceAgent(
            db=mock_db,
            shared_memory=mock_memory,
        )

        assert agent.shared_memory is mock_memory

    def test_call_costs_initialized_empty(self):
        """Test that call costs list is initialized empty."""
        mock_db = MagicMock()

        agent = MarketIntelligenceAgent(db=mock_db)

        assert agent._call_costs == []


# =============================================================================
# System Prompt Tests
# =============================================================================


class TestSystemPrompt:
    """Tests for system prompt generation."""

    def test_system_prompt_contains_cot_instructions(self):
        """Test that system prompt contains CoT instructions."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "Step 1" in prompt
        assert "Step 2" in prompt
        assert "Step 3" in prompt
        assert "Step 4" in prompt
        assert "Step 5" in prompt

    def test_system_prompt_contains_market_analysis_role(self):
        """Test that system prompt contains market analyst role."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "market intelligence analyst" in prompt.lower()
        assert "investment" in prompt.lower()

    def test_system_prompt_contains_risk_warnings(self):
        """Test that system prompt mentions risk warnings."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        prompt = agent._generate_system_prompt()

        assert "risk" in prompt.lower()
        assert "warning" in prompt.lower()


# =============================================================================
# Post-Processing Tests
# =============================================================================


class TestPostProcessing:
    """Tests for brief post-processing."""

    def test_post_process_parses_json_sections(self):
        """Test that JSON sections are parsed."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {
            "sections": '[{"title": "Overview", "content": "Test"}]',
            "actionable_takeaways": '[{"action": "Buy", "priority": "high"}]',
            "confidence": 0.8,
        }

        processed = agent._post_process_brief(result)

        assert isinstance(processed["sections"], list)
        assert processed["sections"][0]["title"] == "Overview"
        assert isinstance(processed["actionable_takeaways"], list)
        assert processed["actionable_takeaways"][0]["action"] == "Buy"

    def test_post_process_handles_invalid_json(self):
        """Test that invalid JSON is handled gracefully."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {
            "sections": "invalid json [",
            "confidence": 0.8,
        }

        processed = agent._post_process_brief(result)

        # Should keep as string when parsing fails
        assert processed["sections"] == "invalid json ["
        assert processed.get("_sections_parse_error") is True

    def test_post_process_adds_low_confidence_warning(self):
        """Test that low confidence warning is added."""
        mock_db = MagicMock()
        config = MarketIntelligenceConfig(confidence_threshold=0.7)
        agent = MarketIntelligenceAgent(config=config, db=mock_db)

        result = {"confidence": 0.5}  # Below threshold

        processed = agent._post_process_brief(result)

        assert "_warning" in processed
        assert "Low confidence" in processed["_warning"]

    def test_post_process_converts_string_confidence(self):
        """Test that string confidence is converted to float."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {"confidence": "0.85"}

        processed = agent._post_process_brief(result)

        assert processed["confidence"] == 0.85
        assert isinstance(processed["confidence"], float)

    def test_post_process_adds_default_risk_warnings(self):
        """Test that default risk warnings are added if missing."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {"confidence": 0.8, "risk_warnings": ""}

        processed = agent._post_process_brief(result)

        assert "Past performance" in processed["risk_warnings"]
        assert "risk of loss" in processed["risk_warnings"]

    def test_post_process_adds_metadata(self):
        """Test that metadata is added."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {"confidence": 0.8}

        processed = agent._post_process_brief(result)

        assert "_metadata" in processed
        assert "generated_at" in processed["_metadata"]
        assert processed["_metadata"]["agent_id"] == "market_intelligence"
        assert processed["_metadata"]["model"] == "gpt-4o"


# =============================================================================
# Brief Generation Tests
# =============================================================================


class TestBriefGeneration:
    """Tests for brief generation."""

    @pytest.mark.asyncio
    async def test_generate_brief_calls_get_market_context(self):
        """Test that generate_brief calls get_market_context."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        # Mock the context methods
        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={"holdings": []})
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Test",
            "confidence": 0.8,
        })

        await agent.generate_brief()

        agent.get_market_context.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_brief_with_portfolio_id(self):
        """Test brief generation with portfolio ID."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={
            "holdings": [{"symbol": "AAPL"}],
            "summary": {"total_value": 100000},
        })
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Test",
            "confidence": 0.8,
        })

        await agent.generate_brief(portfolio_id="port-001")

        agent.get_portfolio_context.assert_called_once_with("port-001")

    @pytest.mark.asyncio
    async def test_generate_brief_returns_error_on_market_context_failure(self):
        """Test error handling when market context fails."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={
            "error": "Failed to fetch market data"
        })

        result = await agent.generate_brief()

        assert "error" in result
        assert result["step"] == "market_context"

    @pytest.mark.asyncio
    async def test_generate_brief_returns_error_on_portfolio_context_failure(self):
        """Test error handling when portfolio context fails."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={
            "error": "Portfolio not found"
        })

        result = await agent.generate_brief(portfolio_id="invalid")

        assert "error" in result
        assert result["step"] == "portfolio_context"

    @pytest.mark.asyncio
    async def test_generate_brief_with_all_parameters(self):
        """Test brief generation with all parameters."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={"holdings": []})
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Test",
            "confidence": 0.8,
        })

        await agent.generate_brief(
            portfolio_id="port-001",
            brief_type="weekly",
            output_format="detailed",
            user_preferences="Focus on tech sector",
        )

        # Verify run_async was called with correct parameters
        call_kwargs = agent.run_async.call_args.kwargs
        assert call_kwargs["brief_type"] == "weekly"
        assert call_kwargs["output_format"] == "detailed"
        assert call_kwargs["user_preferences"] == "Focus on tech sector"


# =============================================================================
# News Fetching Tests
# =============================================================================


class TestNewsFetching:
    """Tests for news context fetching."""

    @pytest.mark.asyncio
    async def test_fetch_news_for_holdings_extracts_symbols(self):
        """Test that symbols are extracted from holdings."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        holdings = [
            {"symbol": "AAPL", "sector": "Technology"},
            {"symbol": "MSFT", "sector": "Technology"},
            {"symbol": "JPM", "sector": "Financials"},
        ]

        news_context = await agent._fetch_news_for_holdings(holdings)

        assert "AAPL" in news_context
        assert "MSFT" in news_context
        assert "JPM" in news_context

    @pytest.mark.asyncio
    async def test_fetch_news_for_holdings_includes_sectors(self):
        """Test that sectors are included in news context."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        holdings = [
            {"symbol": "AAPL", "sector": "Technology"},
            {"symbol": "XOM", "sector": "Energy"},
        ]

        news_context = await agent._fetch_news_for_holdings(holdings)

        assert "Technology" in news_context
        assert "Energy" in news_context

    @pytest.mark.asyncio
    async def test_fetch_news_for_empty_holdings(self):
        """Test handling of empty holdings."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        news_context = await agent._fetch_news_for_holdings([])

        assert news_context == ""


# =============================================================================
# Research Synthesis Tests
# =============================================================================


class TestResearchSynthesis:
    """Tests for research synthesis."""

    @pytest.mark.asyncio
    async def test_research_creates_research_agent(self):
        """Test that research creates a new agent with ResearchSignature."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        # Mock the research agent's run_async
        with patch.object(
            agent.__class__.__bases__[0],  # ARCBaseAgent
            "run_async",
            new_callable=AsyncMock,
            return_value={
                "summary": "Test summary",
                "confidence": 0.8,
            },
        ):
            result = await agent.research("AI chip demand")

            assert "summary" in result or "_metadata" in result

    @pytest.mark.asyncio
    async def test_research_with_portfolio_context(self):
        """Test research with portfolio context."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_portfolio_context = AsyncMock(return_value={
            "holdings": [{"symbol": "NVDA"}],
            "summary": {"total_value": 50000},
        })

        with patch.object(
            agent.__class__.__bases__[0],
            "run_async",
            new_callable=AsyncMock,
            return_value={"summary": "Test", "confidence": 0.8},
        ):
            await agent.research(
                topic="AI chip demand",
                portfolio_id="port-001",
            )

            agent.get_portfolio_context.assert_called_once_with("port-001")


class TestResearchPostProcessing:
    """Tests for research post-processing."""

    def test_post_process_research_parses_json(self):
        """Test that JSON fields are parsed in research results."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {
            "key_points": '[{"point": "Test", "confidence": 0.9}]',
            "sources": '[{"source": "Reuters", "type": "news"}]',
        }

        processed = agent._post_process_research(result)

        assert isinstance(processed["key_points"], list)
        assert isinstance(processed["sources"], list)

    def test_post_process_research_adds_metadata(self):
        """Test that metadata is added to research results."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {"summary": "Test"}

        processed = agent._post_process_research(result)

        assert "_metadata" in processed
        assert processed["_metadata"]["research_type"] == "synthesis"


# =============================================================================
# Streaming Tests
# =============================================================================


class TestStreaming:
    """Tests for streaming responses."""

    @pytest.mark.asyncio
    async def test_stream_brief_yields_progress_updates(self):
        """Test that stream_brief yields progress updates."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={"holdings": []})
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Market is up.",
            "sections": [],
            "actionable_takeaways": [],
            "risk_warnings": "Past performance...",
            "confidence": 0.8,
        })

        chunks = []
        async for chunk in agent.stream_brief():
            chunks.append(json.loads(chunk))

        # Should have progress updates
        progress_updates = [c for c in chunks if c.get("status") == "gathering_context"]
        assert len(progress_updates) > 0

    @pytest.mark.asyncio
    async def test_stream_brief_yields_executive_summary(self):
        """Test that stream_brief yields executive summary."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.get_portfolio_context = AsyncMock(return_value={"holdings": []})
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Markets opened higher.",
            "sections": [],
            "actionable_takeaways": [],
            "risk_warnings": "Past performance...",
            "confidence": 0.8,
        })

        chunks = []
        async for chunk in agent.stream_brief():
            chunks.append(json.loads(chunk))

        summaries = [c for c in chunks if c.get("type") == "executive_summary"]
        assert len(summaries) == 1
        assert "Markets opened higher" in summaries[0]["content"]

    @pytest.mark.asyncio
    async def test_stream_brief_yields_complete_status(self):
        """Test that stream_brief yields complete status at end."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={"indices": {}})
        agent.run_async = AsyncMock(return_value={
            "executive_summary": "Test",
            "sections": [],
            "actionable_takeaways": [],
            "risk_warnings": "Test",
            "confidence": 0.85,
        })

        chunks = []
        async for chunk in agent.stream_brief():
            chunks.append(json.loads(chunk))

        # Last chunk should be complete status
        complete_chunks = [c for c in chunks if c.get("status") == "complete"]
        assert len(complete_chunks) == 1
        assert complete_chunks[0]["progress"] == 1.0

    @pytest.mark.asyncio
    async def test_stream_brief_handles_error(self):
        """Test that stream_brief handles errors gracefully."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent.get_market_context = AsyncMock(return_value={
            "error": "API timeout"
        })

        chunks = []
        async for chunk in agent.stream_brief():
            chunks.append(json.loads(chunk))

        assert any("error" in c for c in chunks)


# =============================================================================
# Cost Tracking Tests
# =============================================================================


class TestCostTracking:
    """Tests for cost tracking."""

    def test_record_call_cost_adds_entry(self):
        """Test that _record_call_cost adds entry."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        # Mock get_total_cost to return a value
        with patch.object(agent, "get_total_cost", return_value=0.05):
            agent._record_call_cost("generate_brief", "port-001")

        assert len(agent._call_costs) == 1
        assert agent._call_costs[0]["operation"] == "generate_brief"
        assert agent._call_costs[0]["context"] == "port-001"
        assert agent._call_costs[0]["cost_usd"] == 0.05

    def test_get_call_costs_returns_copy(self):
        """Test that get_call_costs returns a copy."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        agent._call_costs = [{"operation": "test", "cost_usd": 0.01}]

        costs = agent.get_call_costs()

        # Should be a copy, not the same list
        assert costs is not agent._call_costs
        assert costs == agent._call_costs

    def test_get_session_cost_summary(self):
        """Test session cost summary calculation."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        # Add some call costs
        agent._call_costs = [
            {"operation": "brief", "cost_usd": 0.05},
            {"operation": "brief", "cost_usd": 0.03},
        ]

        with patch.object(agent, "get_total_cost", return_value=0.08):
            with patch.object(agent, "get_cost_breakdown", return_value={}):
                summary = agent.get_session_cost_summary()

        assert summary["total_cost_usd"] == 0.08
        assert summary["call_count"] == 2
        assert summary["average_cost_per_call"] == 0.04


# =============================================================================
# Convenience Function Tests
# =============================================================================


class TestConvenienceFunctions:
    """Tests for convenience functions."""

    @pytest.mark.asyncio
    async def test_generate_market_brief_function(self):
        """Test generate_market_brief convenience function."""
        mock_db = MagicMock()

        with patch.object(
            MarketIntelligenceAgent,
            "generate_brief",
            new_callable=AsyncMock,
            return_value={"executive_summary": "Test", "confidence": 0.8},
        ) as mock_generate:
            result = await generate_market_brief(
                db=mock_db,
                portfolio_id="port-001",
                brief_type="weekly",
            )

            mock_generate.assert_called_once_with("port-001", brief_type="weekly")
            assert "executive_summary" in result

    @pytest.mark.asyncio
    async def test_research_topic_function(self):
        """Test research_topic convenience function."""
        mock_db = MagicMock()

        with patch.object(
            MarketIntelligenceAgent,
            "research",
            new_callable=AsyncMock,
            return_value={"summary": "Test", "confidence": 0.8},
        ) as mock_research:
            result = await research_topic(
                db=mock_db,
                topic="AI chip demand",
                depth="comprehensive",
            )

            mock_research.assert_called_once_with(
                "AI chip demand",
                depth="comprehensive",
                portfolio_id=None,
            )
            assert "summary" in result


# =============================================================================
# Caching Tests (Placeholder)
# =============================================================================


class TestCaching:
    """Tests for brief caching (placeholder implementation)."""

    @pytest.mark.asyncio
    async def test_get_cached_brief_returns_none(self):
        """Test that get_cached_brief returns None (not implemented)."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = await agent.get_cached_brief("port-001")

        assert result is None

    @pytest.mark.asyncio
    async def test_cache_brief_does_not_error(self):
        """Test that cache_brief does not raise error."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        # Should not raise
        await agent.cache_brief("port-001", "daily", {"test": "data"})


# =============================================================================
# Edge Case Tests
# =============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_agent_without_db(self):
        """Test agent initialization without db."""
        agent = MarketIntelligenceAgent(db=None)

        assert agent.db is None

    def test_post_process_with_empty_result(self):
        """Test post-processing with empty result."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {}

        processed = agent._post_process_brief(result)

        # Should add metadata and risk warnings
        assert "_metadata" in processed
        assert "risk_warnings" in processed

    def test_post_process_preserves_existing_risk_warnings(self):
        """Test that existing risk warnings are preserved."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        result = {
            "risk_warnings": "Custom risk warning for this brief.",
            "confidence": 0.8,
        }

        processed = agent._post_process_brief(result)

        assert processed["risk_warnings"] == "Custom risk warning for this brief."

    @pytest.mark.asyncio
    async def test_fetch_news_handles_ticker_vs_symbol(self):
        """Test that both 'ticker' and 'symbol' keys are handled."""
        mock_db = MagicMock()
        agent = MarketIntelligenceAgent(db=mock_db)

        holdings = [
            {"symbol": "AAPL"},
            {"ticker": "GOOGL"},
        ]

        news_context = await agent._fetch_news_for_holdings(holdings)

        assert "AAPL" in news_context
        assert "GOOGL" in news_context
