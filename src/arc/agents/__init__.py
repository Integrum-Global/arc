"""
Kaizen AI agents for ARC intelligence.

This package contains AI agent implementations built using Kailash Kaizen.
Agents provide intelligent analysis, natural language querying, and
automated insights for investment management.

Components:
    - base: ARCBaseAgent foundation class with DataFlow integration
    - config: Agent configurations (ARCAgentConfig, specialized configs)
    - memory: ARCMemoryPool for shared agent memory with persistence
    - registry: ARCAgentRegistry for agent lifecycle management
    - market_intelligence: MarketIntelligenceAgent for market briefs and research

Usage:
    >>> from dataflow import DataFlow
    >>> from arc.agents import (
    ...     ARCAgentRegistry,
    ...     AgentType,
    ...     ARCAgentConfig,
    ...     MarketIntelligenceAgent,
    ... )
    >>>
    >>> db = DataFlow("postgresql://...")
    >>> registry = ARCAgentRegistry(db, tenant_id="tenant-001")
    >>>
    >>> # Get an analyst agent
    >>> analyst = registry.get_agent(AgentType.ANALYST)
    >>>
    >>> # Run analysis
    >>> result = await analyst.run_async(
    ...     portfolio_id="port-001",
    ...     analysis_type="all"
    ... )
    >>>
    >>> # Generate market brief
    >>> market_agent = MarketIntelligenceAgent(db=db)
    >>> brief = await market_agent.generate_brief("port-001")
"""

# Configuration
# Base Agent
from arc.agents.base import (
    ARCBaseAgent,
    InvestmentRecommendationSignature,
    MarketQuerySignature,
    PortfolioAnalysisSignature,
    SecurityAnalysisSignature,
)
from arc.agents.config import (
    AnalystAgentConfig,
    ARCAgentConfig,
    CommitteeAgentConfig,
    MarketAgentConfig,
    QueryAgentConfig,
)

# Market Intelligence Agent
from arc.agents.market_intelligence import (
    MarketBriefSignature,
    MarketIntelligenceAgent,
    MarketIntelligenceConfig,
    ResearchSignature,
    generate_market_brief,
    research_topic,
)

# Portfolio Query Agent
from arc.agents.portfolio_query import (
    ClassifyQuerySignature,
    PortfolioAnswerSignature,
    PortfolioQueryAgent,
    PortfolioQueryConfig,
    QueryLogEntry,
    QueryType,
    query_portfolio,
)

# Financial Analyst Agent
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
    SecurityAnalysisSignature as DetailedSecurityAnalysisSignature,
    analyze_portfolio_health,
    analyze_security,
    detect_anomalies,
)

# Investment Committee Agent
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

# Memory
from arc.agents.memory import (
    ARCMemoryPool,
    MemoryConfig,
)

# Registry
from arc.agents.registry import (
    AgentStats,
    AgentType,
    ARCAgentRegistry,
    create_registry,
)

__all__ = [
    # Configuration
    "ARCAgentConfig",
    "MarketAgentConfig",
    "QueryAgentConfig",
    "AnalystAgentConfig",
    "CommitteeAgentConfig",
    # Base Agent
    "ARCBaseAgent",
    "PortfolioAnalysisSignature",
    "SecurityAnalysisSignature",
    "MarketQuerySignature",
    "InvestmentRecommendationSignature",
    # Market Intelligence Agent
    "MarketIntelligenceAgent",
    "MarketIntelligenceConfig",
    "MarketBriefSignature",
    "ResearchSignature",
    "generate_market_brief",
    "research_topic",
    # Portfolio Query Agent
    "PortfolioQueryAgent",
    "PortfolioQueryConfig",
    "ClassifyQuerySignature",
    "PortfolioAnswerSignature",
    "QueryType",
    "QueryLogEntry",
    "query_portfolio",
    # Financial Analyst Agent
    "FinancialAnalystAgent",
    "FinancialAnalystConfig",
    "DetailedSecurityAnalysisSignature",
    "AnomalyDetectionSignature",
    "PortfolioHealthSignature",
    "AnalysisType",
    "HealthGrade",
    "AnomalySeverity",
    "AnomalyType",
    "AnalysisResult",
    "AnomalyResult",
    "analyze_security",
    "detect_anomalies",
    "analyze_portfolio_health",
    # Investment Committee Agent
    "InvestmentCommitteeAgent",
    "InvestmentCommitteeConfig",
    "CommitteeSynthesisSignature",
    "AuditEntrySignature",
    "RequestType",
    "AgentRole",
    "VoteType",
    "WorkerResult",
    "CommitteeDecision",
    "InvestmentConstraints",
    "get_committee_recommendation",
    # Memory
    "ARCMemoryPool",
    "MemoryConfig",
    # Registry
    "ARCAgentRegistry",
    "AgentType",
    "AgentStats",
    "create_registry",
]
