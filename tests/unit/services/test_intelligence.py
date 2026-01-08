"""
Unit tests for IntelligenceService.

Tests cover:
- Configuration and initialization
- Lazy agent loading
- Market brief generation and streaming
- Natural language portfolio queries
- Security and portfolio analysis
- Anomaly detection
- Research topics
- Investment committee recommendations
- Usage tracking and limits
- Caching behavior
- Error handling
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from arc.services import IntelligenceService, ServiceError
from arc.services.intelligence import IntelligenceConfig, UsageRecord


# ============================================
# Fixtures
# ============================================


@pytest.fixture
def mock_db():
    """Create a mock DataFlow database."""
    db = MagicMock()
    db.express = MagicMock()
    db.express.create = AsyncMock()
    db.express.read = AsyncMock()
    db.express.update = AsyncMock()
    db.express.delete = AsyncMock()
    db.express.list = AsyncMock()
    return db


@pytest.fixture
def mock_market_agent():
    """Create a mock market intelligence agent."""
    agent = MagicMock()
    agent.generate_brief = AsyncMock()
    agent.stream_brief = AsyncMock()
    agent.research_topic = AsyncMock()
    return agent


@pytest.fixture
def mock_query_agent():
    """Create a mock portfolio query agent."""
    agent = MagicMock()
    agent.query = AsyncMock()
    agent.suggest_queries = AsyncMock()
    return agent


@pytest.fixture
def mock_analyst_agent():
    """Create a mock financial analyst agent."""
    agent = MagicMock()
    agent.analyze_security = AsyncMock()
    agent.analyze_portfolio = AsyncMock()
    agent.detect_anomalies = AsyncMock()
    return agent


@pytest.fixture
def mock_committee_agent():
    """Create a mock investment committee agent."""
    agent = MagicMock()
    agent.recommend = AsyncMock()
    return agent


@pytest.fixture
def service(mock_db):
    """Create an IntelligenceService with mocked database."""
    return IntelligenceService(
        db=mock_db,
        tenant_id="tenant-001",
        user_id="user-001",
    )


@pytest.fixture
def service_with_agents(
    mock_db, mock_market_agent, mock_query_agent, mock_analyst_agent, mock_committee_agent
):
    """Create an IntelligenceService with mocked agents."""
    svc = IntelligenceService(
        db=mock_db,
        tenant_id="tenant-001",
        user_id="user-001",
    )
    # Set the private backing fields directly
    svc._market_agent = mock_market_agent
    svc._query_agent = mock_query_agent
    svc._analyst_agent = mock_analyst_agent
    svc._committee_agent = mock_committee_agent
    return svc


@pytest.fixture
def service_no_tenant(mock_db):
    """Create an IntelligenceService without tenant context."""
    return IntelligenceService(db=mock_db)


@pytest.fixture
def custom_config():
    """Custom configuration for testing."""
    return IntelligenceConfig(
        monthly_token_limit=500_000,
        monthly_cost_limit_usd=50.0,
        cache_ttl_seconds=120,
        enable_caching=True,
        default_brief_type="weekly",
        agent_timeout_seconds=60.0,
    )


@pytest.fixture
def sample_portfolio():
    """Sample portfolio data."""
    return {
        "id": "port-001",
        "manager_id": "user-001",
        "name": "Growth Portfolio",
        "active": True,
        "deleted_at": None,
    }


@pytest.fixture
def sample_holdings():
    """Sample holdings data."""
    return [
        {
            "id": "hold-001",
            "portfolio_id": "port-001",
            "security_id": "sec-AAPL",
            "active": True,
        },
        {
            "id": "hold-002",
            "portfolio_id": "port-001",
            "security_id": "sec-MSFT",
            "active": True,
        },
    ]


@pytest.fixture
def sample_brief():
    """Sample market brief response."""
    return {
        "brief_id": "brief-001",
        "brief_type": "daily",
        "executive_summary": "Markets rose today on strong earnings reports.",
        "key_themes": ["Tech earnings", "Fed policy"],
        "market_summary": {
            "sentiment": "bullish",
            "confidence": 0.8,
        },
        "recommendations": [
            {"action": "hold", "rationale": "Market stable"},
        ],
        "_metadata": {
            "tokens_used": 1500,
            "cost_usd": 0.05,
        },
    }


@pytest.fixture
def sample_query_result():
    """Sample portfolio query result."""
    return {
        "query": "What is my tech allocation?",
        "answer": "Your technology sector allocation is 35% of the portfolio.",
        "confidence": 0.92,
        "query_type": "allocation",
        "data_points": [
            {"metric": "tech_allocation", "value": "35%"},
        ],
    }


@pytest.fixture
def sample_security_analysis():
    """Sample security analysis result."""
    return {
        "security_id": "sec-AAPL",
        "ticker": "AAPL",
        "financial_health": {
            "score": 85,
            "grade": "A",
        },
        "strengths": ["Strong liquidity", "Low debt"],
        "concerns": [],
        "recommendation": "Hold",
        "_metadata": {
            "tokens_used": 2000,
            "cost_usd": 0.08,
        },
    }


@pytest.fixture
def sample_portfolio_analysis():
    """Sample portfolio analysis result."""
    return {
        "portfolio_id": "port-001",
        "portfolio_health": {
            "score": 78,
            "grade": "B+",
        },
        "quality_distribution": {
            "A": 5,
            "B": 3,
            "C": 2,
        },
        "recommendations": ["Reduce concentration in tech"],
        "_metadata": {
            "tokens_used": 3000,
            "cost_usd": 0.12,
        },
    }


@pytest.fixture
def sample_anomalies():
    """Sample anomaly detection results."""
    return [
        {
            "security_id": "sec-AAPL",
            "ticker": "AAPL",
            "anomaly_type": "ratio_spike",
            "severity": "high",
            "description": "Sudden increase in debt-to-equity ratio",
            "metric": "debt_to_equity",
            "recommended_action": "Review recent debt issuance",
        },
        {
            "security_id": "sec-MSFT",
            "ticker": "MSFT",
            "anomaly_type": "trend_break",
            "severity": "medium",
            "description": "Revenue growth trend reversal",
            "metric": "revenue_growth",
            "recommended_action": "Monitor next quarter",
        },
    ]


@pytest.fixture
def sample_research():
    """Sample research result."""
    return {
        "topic": "Impact of rising interest rates on tech stocks",
        "synthesis": "Rising interest rates typically negatively impact tech stocks...",
        "key_points": [
            "Higher discount rates reduce valuation",
            "Growth stocks more sensitive",
        ],
        "sources": ["Market analysis", "Historical data"],
        "_metadata": {
            "tokens_used": 2500,
            "cost_usd": 0.10,
        },
    }


@pytest.fixture
def sample_committee_decision():
    """Sample investment committee decision."""
    return {
        "decision_id": "dec-001",
        "portfolio_id": "port-001",
        "request_type": "rebalance",
        "recommendation": "Maintain current allocation with minor adjustments",
        "conviction": "medium",
        "confidence": 0.85,
        "action_items": [
            {"action": "reduce", "security": "AAPL", "amount": "2%"},
        ],
        "consensus_analysis": {
            "agreement_level": "partial",
            "points_of_agreement": ["Tech overweight"],
        },
        "audit_trail": {
            "decision_id": "dec-001",
            "agents_consulted": ["market", "portfolio", "analyst"],
            "compliance_flags": [],
        },
        "_metadata": {
            "total_tokens_used": 8000,
            "total_cost_usd": 0.35,
        },
    }


# ============================================
# Configuration Tests
# ============================================


class TestIntelligenceConfig:
    """Tests for IntelligenceConfig dataclass."""

    def test_default_config(self):
        """Test default configuration values."""
        config = IntelligenceConfig()

        assert config.monthly_token_limit == 1_000_000
        assert config.monthly_cost_limit_usd == 100.0
        assert config.cache_ttl_seconds == 300
        assert config.enable_caching is True
        assert config.default_brief_type == "daily"
        assert config.default_analysis_type == "standard"
        assert config.default_research_depth == "standard"
        assert config.agent_timeout_seconds == 120.0

    def test_custom_config(self):
        """Test custom configuration values."""
        config = IntelligenceConfig(
            monthly_token_limit=500_000,
            monthly_cost_limit_usd=50.0,
            cache_ttl_seconds=60,
            enable_caching=False,
        )

        assert config.monthly_token_limit == 500_000
        assert config.monthly_cost_limit_usd == 50.0
        assert config.cache_ttl_seconds == 60
        assert config.enable_caching is False


class TestUsageRecord:
    """Tests for UsageRecord dataclass."""

    def test_usage_record_creation(self):
        """Test creating a usage record."""
        record = UsageRecord(
            id="usage-001",
            tenant_id="tenant-001",
            user_id="user-001",
            agent="market_intelligence",
            method="generate_brief",
            input_tokens=500,
            output_tokens=1500,
            total_tokens=2000,
            cost_usd=0.05,
            latency_ms=3500.0,
            timestamp="2026-01-08T10:00:00Z",
        )

        assert record.id == "usage-001"
        assert record.agent == "market_intelligence"
        assert record.total_tokens == 2000
        assert record.cost_usd == 0.05
        assert record.metadata == {}

    def test_usage_record_with_metadata(self):
        """Test usage record with metadata."""
        record = UsageRecord(
            id="usage-002",
            tenant_id="tenant-001",
            user_id="user-001",
            agent="portfolio_query",
            method="query",
            input_tokens=300,
            output_tokens=800,
            total_tokens=1100,
            cost_usd=0.02,
            latency_ms=1500.0,
            timestamp="2026-01-08T10:00:00Z",
            metadata={"query": "What is my allocation?"},
        )

        assert record.metadata["query"] == "What is my allocation?"


# ============================================
# Initialization Tests
# ============================================


class TestIntelligenceServiceInit:
    """Tests for IntelligenceService initialization."""

    def test_init_with_all_params(self, mock_db, custom_config):
        """Test initialization with all parameters."""
        service = IntelligenceService(
            db=mock_db,
            tenant_id="tenant-001",
            user_id="user-001",
            config=custom_config,
        )

        assert service.db == mock_db
        assert service.tenant_id == "tenant-001"
        assert service.user_id == "user-001"
        assert service.config == custom_config

    def test_init_with_defaults(self, mock_db):
        """Test initialization with default config."""
        service = IntelligenceService(db=mock_db)

        assert service.tenant_id is None
        assert service.user_id is None
        assert service.config is not None
        assert service.config.monthly_token_limit == 1_000_000

    def test_lazy_agent_initialization(self, service):
        """Test that agents are not initialized at service creation."""
        assert service._market_agent is None
        assert service._query_agent is None
        assert service._analyst_agent is None
        assert service._committee_agent is None

    def test_empty_usage_log(self, service):
        """Test that usage log is empty at start."""
        assert service._usage_log == []

    def test_empty_cache(self, service):
        """Test that cache is empty at start."""
        assert service._cache == {}


# ============================================
# Agent Access Tests
# ============================================


class TestAgentAccess:
    """Tests for lazy agent loading."""

    def test_market_agent_cached(self, mock_db, mock_market_agent):
        """Test that market agent is cached after first access."""
        service = IntelligenceService(db=mock_db)
        service._market_agent = mock_market_agent

        # First access returns cached agent
        agent1 = service.market_agent
        agent2 = service.market_agent

        assert agent1 is agent2
        assert agent1 is mock_market_agent

    def test_query_agent_cached(self, mock_db, mock_query_agent):
        """Test that query agent is cached after first access."""
        service = IntelligenceService(db=mock_db)
        service._query_agent = mock_query_agent

        agent1 = service.query_agent
        agent2 = service.query_agent

        assert agent1 is agent2

    def test_analyst_agent_cached(self, mock_db, mock_analyst_agent):
        """Test that analyst agent is cached after first access."""
        service = IntelligenceService(db=mock_db)
        service._analyst_agent = mock_analyst_agent

        agent1 = service.analyst_agent
        agent2 = service.analyst_agent

        assert agent1 is agent2

    def test_committee_agent_cached(self, mock_db, mock_committee_agent):
        """Test that committee agent is cached after first access."""
        service = IntelligenceService(db=mock_db)
        service._committee_agent = mock_committee_agent

        agent1 = service.committee_agent
        agent2 = service.committee_agent

        assert agent1 is agent2


# ============================================
# Market Brief Tests
# ============================================


class TestGenerateMarketBrief:
    """Tests for generate_market_brief method."""

    @pytest.mark.asyncio
    async def test_generate_brief_success(
        self, service_with_agents, mock_market_agent, sample_brief
    ):
        """Test successful brief generation."""
        mock_market_agent.generate_brief.return_value = sample_brief
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.generate_market_brief(
            brief_type="daily",
            portfolio_id="port-001",
        )

        assert result["brief_type"] == "daily"
        assert result["executive_summary"] is not None
        mock_market_agent.generate_brief.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_brief_with_topics(
        self, service_with_agents, mock_market_agent, sample_brief
    ):
        """Test brief generation with specific topics."""
        mock_market_agent.generate_brief.return_value = sample_brief
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.generate_market_brief(
            topics=["Earnings", "Fed policy"],
        )

        call_args = mock_market_agent.generate_brief.call_args
        assert call_args[1]["topics"] == ["Earnings", "Fed policy"]

    @pytest.mark.asyncio
    async def test_generate_brief_caching(
        self, service_with_agents, mock_market_agent, sample_brief
    ):
        """Test that briefs are cached."""
        mock_market_agent.generate_brief.return_value = sample_brief
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        # First call - should call agent
        await service_with_agents.generate_market_brief(brief_type="daily")
        assert mock_market_agent.generate_brief.call_count == 1

        # Second call - should use cache
        mock_market_agent.generate_brief.reset_mock()
        result = await service_with_agents.generate_market_brief(brief_type="daily")
        assert mock_market_agent.generate_brief.call_count == 0
        assert result["executive_summary"] is not None

    @pytest.mark.asyncio
    async def test_generate_brief_stores_history(
        self, service_with_agents, mock_db, mock_market_agent, sample_brief
    ):
        """Test that briefs are stored in history."""
        mock_market_agent.generate_brief.return_value = sample_brief
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.generate_market_brief(brief_type="daily")

        # Should attempt to store in MarketBrief
        mock_db.express.create.assert_called()

    @pytest.mark.asyncio
    async def test_generate_brief_error(self, service_with_agents, mock_market_agent):
        """Test error handling in brief generation."""
        mock_market_agent.generate_brief.side_effect = Exception("API error")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.generate_market_brief()

        assert "Market brief generation failed" in str(exc_info.value)


class TestGetBriefHistory:
    """Tests for get_brief_history method."""

    @pytest.mark.asyncio
    async def test_get_brief_history_success(self, service, mock_db):
        """Test successful history retrieval."""
        history = [
            {"id": "brief-001", "brief_type": "daily", "created_at": "2026-01-08"},
            {"id": "brief-002", "brief_type": "daily", "created_at": "2026-01-07"},
        ]
        mock_db.express.list.return_value = history

        result = await service.get_brief_history(brief_type="daily", limit=10)

        assert len(result) == 2
        assert result[0]["brief_type"] == "daily"

    @pytest.mark.asyncio
    async def test_get_brief_history_empty(self, service, mock_db):
        """Test history when none exists."""
        mock_db.express.list.side_effect = Exception("Model not found")

        result = await service.get_brief_history()

        assert result == []

    @pytest.mark.asyncio
    async def test_get_brief_history_with_date_filter(self, service, mock_db):
        """Test history with date filtering."""
        mock_db.express.list.return_value = []

        await service.get_brief_history(
            start_date="2026-01-01",
            end_date="2026-01-31",
        )

        call_args = mock_db.express.list.call_args
        filter_dict = call_args[1]["filter"]
        assert "$gte" in filter_dict["created_at"]
        assert "$lte" in filter_dict["created_at"]


# ============================================
# Natural Language Query Tests
# ============================================


class TestQueryPortfolio:
    """Tests for query_portfolio method."""

    @pytest.mark.asyncio
    async def test_query_success(
        self, service_with_agents, mock_db, mock_query_agent, sample_portfolio, sample_query_result
    ):
        """Test successful portfolio query."""
        mock_db.express.list.return_value = [sample_portfolio]
        mock_query_agent.query.return_value = sample_query_result
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.query_portfolio(
            user_id="user-001",
            query="What is my tech allocation?",
        )

        assert result["confidence"] == 0.92
        assert "allocation" in result["answer"].lower()

    @pytest.mark.asyncio
    async def test_query_no_portfolio(self, service_with_agents, mock_db):
        """Test query when user has no portfolio."""
        mock_db.express.list.return_value = []
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.query_portfolio(
            user_id="user-001",
            query="What is my allocation?",
        )

        assert result["confidence"] == 0.0
        assert "No portfolio found" in result["answer"]

    @pytest.mark.asyncio
    async def test_query_with_specific_portfolio(
        self, service_with_agents, mock_query_agent, sample_query_result
    ):
        """Test query with specific portfolio ID."""
        mock_query_agent.query.return_value = sample_query_result
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.query_portfolio(
            user_id="user-001",
            query="What is my tech allocation?",
            portfolio_id="port-001",
        )

        call_args = mock_query_agent.query.call_args
        assert call_args[1]["portfolio_id"] == "port-001"

    @pytest.mark.asyncio
    async def test_query_error(
        self, service_with_agents, mock_db, mock_query_agent, sample_portfolio
    ):
        """Test error handling in portfolio query."""
        mock_db.express.list.return_value = [sample_portfolio]
        mock_query_agent.query.side_effect = Exception("LLM error")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.query_portfolio(
                user_id="user-001",
                query="What is my allocation?",
            )

        assert "Portfolio query failed" in str(exc_info.value)


class TestSuggestQueries:
    """Tests for suggest_queries method."""

    @pytest.mark.asyncio
    async def test_suggest_queries_success(
        self, service_with_agents, mock_db, mock_query_agent, sample_portfolio
    ):
        """Test successful query suggestions."""
        mock_db.express.list.return_value = [sample_portfolio]
        mock_query_agent.suggest_queries.return_value = [
            "What is my top holding?",
            "How has my portfolio performed?",
            "What is my sector allocation?",
        ]

        result = await service_with_agents.suggest_queries(user_id="user-001", limit=3)

        assert len(result) == 3
        assert "allocation" in result[2].lower()

    @pytest.mark.asyncio
    async def test_suggest_queries_no_portfolio(self, service_with_agents, mock_db):
        """Test suggestions when user has no portfolio."""
        mock_db.express.list.return_value = []

        result = await service_with_agents.suggest_queries(user_id="user-001")

        assert len(result) == 2
        assert "create" in result[0].lower()

    @pytest.mark.asyncio
    async def test_suggest_queries_error_fallback(
        self, service_with_agents, mock_db, mock_query_agent, sample_portfolio
    ):
        """Test fallback suggestions on error."""
        mock_db.express.list.return_value = [sample_portfolio]
        mock_query_agent.suggest_queries.side_effect = Exception("Error")

        result = await service_with_agents.suggest_queries(user_id="user-001", limit=3)

        # Should return generic suggestions
        assert len(result) == 3
        assert any("portfolio" in s.lower() for s in result)


# ============================================
# Security Analysis Tests
# ============================================


class TestAnalyzeSecurity:
    """Tests for analyze_security method."""

    @pytest.mark.asyncio
    async def test_analyze_security_success(
        self, service_with_agents, mock_analyst_agent, sample_security_analysis
    ):
        """Test successful security analysis."""
        mock_analyst_agent.analyze_security.return_value = sample_security_analysis
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.analyze_security("sec-AAPL")

        assert result["financial_health"]["grade"] == "A"
        assert result["financial_health"]["score"] == 85

    @pytest.mark.asyncio
    async def test_analyze_security_with_type(
        self, service_with_agents, mock_analyst_agent, sample_security_analysis
    ):
        """Test analysis with specific type."""
        mock_analyst_agent.analyze_security.return_value = sample_security_analysis
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.analyze_security(
            "sec-AAPL",
            analysis_type="comprehensive",
        )

        call_args = mock_analyst_agent.analyze_security.call_args
        assert call_args[1]["analysis_type"] == "comprehensive"

    @pytest.mark.asyncio
    async def test_analyze_security_quick_caching(
        self, service_with_agents, mock_analyst_agent, sample_security_analysis
    ):
        """Test that quick analyses are cached."""
        mock_analyst_agent.analyze_security.return_value = sample_security_analysis
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        # First call
        await service_with_agents.analyze_security("sec-AAPL", analysis_type="quick")
        assert mock_analyst_agent.analyze_security.call_count == 1

        # Second call should use cache
        mock_analyst_agent.analyze_security.reset_mock()
        result = await service_with_agents.analyze_security("sec-AAPL", analysis_type="quick")
        assert mock_analyst_agent.analyze_security.call_count == 0
        assert result["financial_health"]["grade"] == "A"

    @pytest.mark.asyncio
    async def test_analyze_security_error(self, service_with_agents, mock_analyst_agent):
        """Test error handling in security analysis."""
        mock_analyst_agent.analyze_security.side_effect = Exception("API error")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.analyze_security("sec-AAPL")

        assert "Security analysis failed" in str(exc_info.value)


class TestAnalyzePortfolio:
    """Tests for analyze_portfolio method."""

    @pytest.mark.asyncio
    async def test_analyze_portfolio_success(
        self, service_with_agents, mock_analyst_agent, sample_portfolio_analysis
    ):
        """Test successful portfolio analysis."""
        mock_analyst_agent.analyze_portfolio.return_value = sample_portfolio_analysis
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.analyze_portfolio("port-001")

        assert result["portfolio_health"]["grade"] == "B+"
        mock_analyst_agent.analyze_portfolio.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_portfolio_with_holdings(
        self, service_with_agents, mock_analyst_agent, sample_portfolio_analysis
    ):
        """Test portfolio analysis including holdings analysis."""
        mock_analyst_agent.analyze_portfolio.return_value = sample_portfolio_analysis
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.analyze_portfolio(
            "port-001",
            include_holdings_analysis=True,
        )

        call_args = mock_analyst_agent.analyze_portfolio.call_args
        assert call_args[1]["include_holdings_analysis"] is True


class TestDetectAnomalies:
    """Tests for detect_anomalies method."""

    @pytest.mark.asyncio
    async def test_detect_anomalies_success(
        self, service_with_agents, mock_db, mock_analyst_agent, sample_holdings, sample_anomalies
    ):
        """Test successful anomaly detection."""
        mock_db.express.list.return_value = sample_holdings
        mock_analyst_agent.detect_anomalies.return_value = sample_anomalies
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.detect_anomalies(portfolio_id="port-001")

        assert len(result) == 2
        assert result[0]["severity"] == "high"

    @pytest.mark.asyncio
    async def test_detect_anomalies_creates_alerts(
        self, service_with_agents, mock_db, mock_analyst_agent, sample_holdings, sample_anomalies
    ):
        """Test that high severity anomalies create alerts."""
        mock_db.express.list.return_value = sample_holdings
        mock_analyst_agent.detect_anomalies.return_value = sample_anomalies
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.detect_anomalies(
            portfolio_id="port-001",
            create_alerts=True,
        )

        # Should create alert for high severity anomaly
        create_calls = mock_db.express.create.call_args_list
        alert_calls = [c for c in create_calls if c[0][0] == "Alert"]
        assert len(alert_calls) >= 1

    @pytest.mark.asyncio
    async def test_detect_anomalies_with_security_ids(
        self, service_with_agents, mock_analyst_agent, sample_anomalies
    ):
        """Test anomaly detection with specific securities."""
        mock_analyst_agent.detect_anomalies.return_value = sample_anomalies
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.detect_anomalies(
            security_ids=["sec-AAPL", "sec-MSFT"],
        )

        call_args = mock_analyst_agent.detect_anomalies.call_args
        assert "sec-AAPL" in call_args[1]["security_ids"]

    @pytest.mark.asyncio
    async def test_detect_anomalies_no_securities(self, service_with_agents, mock_db):
        """Test anomaly detection with no securities."""
        mock_db.express.list.return_value = []
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.detect_anomalies(portfolio_id="port-001")

        assert result == []


# ============================================
# Research Tests
# ============================================


class TestResearchTopic:
    """Tests for research_topic method."""

    @pytest.mark.asyncio
    async def test_research_topic_success(
        self, service_with_agents, mock_market_agent, sample_research
    ):
        """Test successful research."""
        mock_market_agent.research_topic.return_value = sample_research
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.research_topic(
            "Impact of rising interest rates on tech stocks"
        )

        assert "interest rates" in result["synthesis"].lower()
        assert len(result["key_points"]) > 0

    @pytest.mark.asyncio
    async def test_research_topic_with_depth(
        self, service_with_agents, mock_market_agent, sample_research
    ):
        """Test research with specific depth."""
        mock_market_agent.research_topic.return_value = sample_research
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.research_topic(
            "Sector rotation strategies",
            depth="comprehensive",
        )

        call_args = mock_market_agent.research_topic.call_args
        assert call_args[1]["depth"] == "comprehensive"

    @pytest.mark.asyncio
    async def test_research_topic_error(self, service_with_agents, mock_market_agent):
        """Test error handling in research."""
        mock_market_agent.research_topic.side_effect = Exception("API error")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.research_topic("Test topic")

        assert "Research failed" in str(exc_info.value)


# ============================================
# Committee Recommendation Tests
# ============================================


class TestGetCommitteeRecommendation:
    """Tests for get_committee_recommendation method."""

    @pytest.mark.asyncio
    async def test_committee_recommendation_success(
        self, service_with_agents, mock_committee_agent, sample_committee_decision
    ):
        """Test successful committee recommendation."""
        mock_committee_agent.recommend.return_value = sample_committee_decision
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        result = await service_with_agents.get_committee_recommendation(
            portfolio_id="port-001",
            request_type="rebalance",
        )

        assert result["conviction"] == "medium"
        assert result["confidence"] == 0.85
        assert len(result["audit_trail"]["agents_consulted"]) == 3

    @pytest.mark.asyncio
    async def test_committee_recommendation_with_constraints(
        self, service_with_agents, mock_committee_agent, sample_committee_decision
    ):
        """Test committee recommendation with constraints."""
        mock_committee_agent.recommend.return_value = sample_committee_decision
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        constraints = {
            "max_position_size_pct": 10,
            "risk_tolerance": "moderate",
        }

        await service_with_agents.get_committee_recommendation(
            portfolio_id="port-001",
            request_type="buy",
            constraints=constraints,
        )

        call_args = mock_committee_agent.recommend.call_args
        assert call_args[1]["constraints"] == constraints

    @pytest.mark.asyncio
    async def test_committee_recommendation_with_securities(
        self, service_with_agents, mock_committee_agent, sample_committee_decision
    ):
        """Test committee recommendation with target securities."""
        mock_committee_agent.recommend.return_value = sample_committee_decision
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        await service_with_agents.get_committee_recommendation(
            portfolio_id="port-001",
            request_type="sell",
            target_securities=["AAPL", "MSFT"],
        )

        call_args = mock_committee_agent.recommend.call_args
        assert call_args[1]["target_securities"] == ["AAPL", "MSFT"]

    @pytest.mark.asyncio
    async def test_committee_recommendation_error(
        self, service_with_agents, mock_committee_agent
    ):
        """Test error handling in committee recommendation."""
        mock_committee_agent.recommend.side_effect = Exception("Timeout")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.get_committee_recommendation(
                portfolio_id="port-001",
                request_type="rebalance",
            )

        assert "Committee recommendation failed" in str(exc_info.value)


# ============================================
# Usage Tracking Tests
# ============================================


class TestUsageTracking:
    """Tests for usage tracking functionality."""

    @pytest.mark.asyncio
    async def test_track_usage(self, service, mock_db):
        """Test that usage is tracked."""
        await service._track_usage(
            agent="market_intelligence",
            method="generate_brief",
            result={"test": "result"},
            start_time=datetime.now(UTC) - timedelta(seconds=2),
        )

        assert len(service._usage_log) == 1
        record = service._usage_log[0]
        assert record.agent == "market_intelligence"
        assert record.method == "generate_brief"
        assert record.latency_ms > 0

    @pytest.mark.asyncio
    async def test_track_usage_with_override(self, service, mock_db):
        """Test usage tracking with cost override."""
        await service._track_usage(
            agent="investment_committee",
            method="recommend",
            result={"test": "result"},
            start_time=datetime.now(UTC),
            cost_override=0.50,
        )

        record = service._usage_log[0]
        assert record.cost_usd == 0.50

    @pytest.mark.asyncio
    async def test_get_usage_summary(self, service, mock_db):
        """Test usage summary retrieval."""
        mock_db.express.list.return_value = [
            {"agent": "market_intelligence", "total_tokens": 1000, "cost_usd": "0.05"},
            {"agent": "portfolio_query", "total_tokens": 500, "cost_usd": "0.02"},
        ]

        result = await service.get_usage_summary()

        assert result["total_calls"] == 2
        assert result["total_tokens"] == 1500
        assert result["total_cost_usd"] == 0.07

    @pytest.mark.asyncio
    async def test_get_monthly_usage(self, service, mock_db):
        """Test monthly usage calculation."""
        mock_db.express.list.return_value = []

        result = await service.get_monthly_usage()

        assert "total_tokens" in result
        assert "total_cost_usd" in result


class TestUsageLimits:
    """Tests for usage limit checking."""

    @pytest.mark.asyncio
    async def test_check_limits_within_bounds(self, service):
        """Test that operations proceed when within limits."""
        service.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 100_000, "total_cost_usd": 10.0}
        )

        # Should not raise
        await service._check_usage_limits()

    @pytest.mark.asyncio
    async def test_check_limits_token_exceeded(self, service):
        """Test that token limit exceeded raises error."""
        service.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 1_500_000, "total_cost_usd": 10.0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service._check_usage_limits()

        assert "token limit exceeded" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_check_limits_cost_exceeded(self, service):
        """Test that cost limit exceeded raises error."""
        service.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 100_000, "total_cost_usd": 150.0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service._check_usage_limits()

        assert "cost limit exceeded" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_check_limits_no_tenant(self, service_no_tenant):
        """Test that limits not checked without tenant."""
        # Should not raise - no tenant means no limits
        await service_no_tenant._check_usage_limits()


# ============================================
# Caching Tests
# ============================================


class TestCaching:
    """Tests for caching functionality."""

    def test_get_cached_miss(self, service):
        """Test cache miss returns None."""
        result = service._get_cached("nonexistent-key")
        assert result is None

    def test_set_and_get_cached(self, service):
        """Test setting and getting cached value."""
        service._set_cached("test-key", {"data": "value"})

        result = service._get_cached("test-key")
        assert result["data"] == "value"

    def test_cache_expiration(self, service):
        """Test that expired cache entries are not returned."""
        # Set a value in cache with backdated timestamp
        past_time = datetime.now(UTC) - timedelta(seconds=600)  # 10 min ago
        service._cache["expired-key"] = (past_time, {"old": "data"})

        result = service._get_cached("expired-key")
        assert result is None
        assert "expired-key" not in service._cache  # Should be cleaned up

    def test_caching_disabled(self, mock_db):
        """Test that caching can be disabled."""
        config = IntelligenceConfig(enable_caching=False)
        service = IntelligenceService(db=mock_db, config=config)

        service._set_cached("test-key", {"data": "value"})
        result = service._get_cached("test-key")

        assert result is None
        assert "test-key" not in service._cache


# ============================================
# Service Registry Integration Tests
# ============================================


class TestServiceRegistryIntegration:
    """Tests for IntelligenceService integration with ServiceRegistry."""

    def test_intelligence_service_in_registry(self, mock_db):
        """Test that IntelligenceService is accessible from ServiceRegistry."""
        from arc.services import ServiceRegistry

        registry = ServiceRegistry(
            db=mock_db,
            tenant_id="tenant-001",
            user_id="user-001",
        )

        # Access intelligence service - should lazy load
        intelligence = registry.intelligence

        assert intelligence is not None
        assert isinstance(intelligence, IntelligenceService)
        assert intelligence.tenant_id == "tenant-001"
        assert intelligence.user_id == "user-001"

    def test_intelligence_service_export(self):
        """Test that IntelligenceService is exported from arc.services."""
        from arc.services import IntelligenceService as ExportedService

        assert ExportedService is IntelligenceService

    def test_intelligence_config_export(self):
        """Test that IntelligenceConfig is exported from arc.services."""
        from arc.services import IntelligenceConfig as ExportedConfig

        assert ExportedConfig is IntelligenceConfig

    def test_usage_record_export(self):
        """Test that UsageRecord is exported from arc.services."""
        from arc.services import UsageRecord as ExportedRecord

        assert ExportedRecord is UsageRecord


# ============================================
# Error Response Tests
# ============================================


class TestErrorResponses:
    """Tests for error response structure."""

    @pytest.mark.asyncio
    async def test_service_error_details(
        self, service_with_agents, mock_db, mock_query_agent, sample_portfolio
    ):
        """Test that service errors include details."""
        mock_db.express.list.return_value = [sample_portfolio]
        mock_query_agent.query.side_effect = Exception("Test error")
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        with pytest.raises(ServiceError) as exc_info:
            await service_with_agents.query_portfolio(
                user_id="user-001",
                query="Test query",
                portfolio_id="port-001",
            )

        error = exc_info.value
        assert error.service == "IntelligenceService"
        assert error.operation == "query_portfolio"
        assert "query" in error.details


# ============================================
# Streaming Tests
# ============================================


class TestStreamMarketBrief:
    """Tests for streaming market brief."""

    @pytest.mark.asyncio
    async def test_stream_brief_success(self, service_with_agents, mock_market_agent):
        """Test successful brief streaming."""
        async def mock_stream(*args, **kwargs):
            yield "Markets "
            yield "are "
            yield "rising."

        mock_market_agent.stream_brief = mock_stream
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        chunks = []
        async for chunk in service_with_agents.stream_market_brief(brief_type="daily"):
            chunks.append(chunk)

        assert len(chunks) == 3
        assert "".join(chunks) == "Markets are rising."

    @pytest.mark.asyncio
    async def test_stream_brief_error(self, service_with_agents, mock_market_agent):
        """Test error handling in streaming."""
        async def mock_stream(*args, **kwargs):
            yield "Starting..."
            raise Exception("Stream error")

        mock_market_agent.stream_brief = mock_stream
        service_with_agents.get_monthly_usage = AsyncMock(
            return_value={"total_tokens": 0, "total_cost_usd": 0}
        )

        chunks = []
        async for chunk in service_with_agents.stream_market_brief():
            chunks.append(chunk)

        # Should have initial chunk plus error message
        assert len(chunks) == 2
        assert "Error" in chunks[-1]
