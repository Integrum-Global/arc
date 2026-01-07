# ARC AI Agent Specifications

## Overview

This document defines all Kaizen AI agents for the ARC investment management platform. Each agent uses signature-based programming with specific capabilities for investment analysis and decision support.

---

## 1. Agent Architecture

### 1.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARC AI Agent Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Market       │  │   Portfolio    │  │   Financial    │    │
│  │   Intelligence │  │   Query        │  │   Analyst      │    │
│  │   Agent        │  │   Agent        │  │   Agent        │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Research     │  │   Investment   │  │   Compliance   │    │
│  │   Agent        │  │   Committee    │  │   Agent        │    │
│  │                │  │   (Supervisor) │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                 Kaizen Framework Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ BaseAgent   │  │ Signatures  │  │ Memory      │             │
│  │ Architecture│  │ Framework   │  │ Management  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    LLM Providers                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Claude      │  │ GPT-4       │  │ Ollama      │             │
│  │ (Primary)   │  │ (Fallback)  │  │ (Local)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Base Agent Configuration

**File**: `src/arc/agents/base.py`

```python
from kaizen.base import BaseAgent
from kaizen.memory import VectorMemory, SharedMemoryPool
from kaizen.signatures import Signature, Field
from dataflow import DataFlow
from typing import Optional, List, Dict, Any
import os

class ARCBaseAgent(BaseAgent):
    """Base agent for all ARC AI agents with shared configuration."""

    def __init__(
        self,
        db: Optional[DataFlow] = None,
        memory_pool: Optional[SharedMemoryPool] = None,
        model: str = "claude-sonnet-4-20250514",
        temperature: float = 0.7,
        max_tokens: int = 4096
    ):
        super().__init__(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )

        self.db = db
        self.memory_pool = memory_pool or SharedMemoryPool(
            namespace="arc",
            vector_store="pgvector",
            connection_string=os.getenv("DATABASE_URL")
        )

        # Initialize vector memory for this agent
        self.memory = VectorMemory(
            pool=self.memory_pool,
            collection=self.__class__.__name__.lower()
        )

    async def remember(self, content: str, metadata: Optional[Dict] = None) -> str:
        """Store information in agent memory."""
        return await self.memory.store(
            content=content,
            metadata=metadata or {}
        )

    async def recall(
        self,
        query: str,
        limit: int = 5,
        min_score: float = 0.7
    ) -> List[Dict]:
        """Retrieve relevant memories."""
        return await self.memory.search(
            query=query,
            limit=limit,
            min_score=min_score
        )

    async def share_insight(self, insight: str, category: str) -> None:
        """Share insight to shared memory pool for other agents."""
        await self.memory_pool.share(
            content=insight,
            category=category,
            source=self.__class__.__name__
        )

    async def get_shared_insights(
        self,
        category: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get insights shared by other agents."""
        return await self.memory_pool.query(
            category=category,
            limit=limit
        )
```

---

## 2. Market Intelligence Agent

### 2.1 Agent Definition

**Purpose**: Generate AI-powered market briefs synthesizing multiple data sources.

**File**: `src/arc/agents/market_intelligence.py`

```python
from arc.agents.base import ARCBaseAgent
from kaizen.signatures import Signature, Field
from kaizen.patterns import ChainOfThought
from typing import Optional, List, Dict, AsyncIterator
from datetime import datetime
import asyncio

# ========== Signatures ==========

class MarketDataGathering(Signature):
    """Gather relevant market data for analysis."""

    topics: List[str] = Field(description="Topics to research")
    portfolio_context: Optional[Dict] = Field(
        default=None,
        description="Portfolio holdings for context"
    )

    market_data: Dict = Field(description="Gathered market data")
    key_events: List[str] = Field(description="Key market events identified")
    relevant_securities: List[str] = Field(description="Securities relevant to topics")


class MarketAnalysis(Signature):
    """Analyze market conditions and trends."""

    market_data: Dict = Field(description="Market data to analyze")
    key_events: List[str] = Field(description="Key events")
    analysis_depth: str = Field(default="standard", description="quick|standard|comprehensive")

    market_outlook: str = Field(description="Overall market outlook")
    sector_analysis: Dict = Field(description="Sector-by-sector analysis")
    risk_factors: List[str] = Field(description="Key risk factors identified")
    opportunities: List[str] = Field(description="Opportunities identified")


class BriefGeneration(Signature):
    """Generate market brief from analysis."""

    market_outlook: str = Field(description="Market outlook")
    sector_analysis: Dict = Field(description="Sector analysis")
    risk_factors: List[str] = Field(description="Risk factors")
    opportunities: List[str] = Field(description="Opportunities")
    format: str = Field(default="summary", description="summary|detailed|executive")
    portfolio_context: Optional[Dict] = Field(default=None, description="Portfolio for personalization")

    brief: Dict = Field(description="Generated market brief with sections")


# ========== Agent Implementation ==========

class MarketIntelligenceAgent(ARCBaseAgent):
    """
    Market Intelligence Agent for generating AI-powered market briefs.

    Capabilities:
    - Daily and weekly market brief generation
    - Sector-specific analysis
    - Portfolio-contextualized insights
    - Streaming brief generation
    """

    SYSTEM_PROMPT = """You are a senior market analyst at a top-tier investment firm.
Your role is to synthesize market information into actionable intelligence for
investment managers and family offices.

Key principles:
1. Focus on actionable insights, not just news summaries
2. Quantify impacts where possible (e.g., "5% sector decline")
3. Connect macro trends to specific portfolio implications
4. Highlight both risks and opportunities
5. Use professional investment language
6. Be concise but comprehensive

Format guidelines:
- Use clear section headers
- Include bullet points for key takeaways
- Provide confidence levels for predictions
- Cite data sources where applicable"""

    def __init__(self, db=None, memory_pool=None):
        super().__init__(db=db, memory_pool=memory_pool, temperature=0.5)

        # Initialize chain of thought for complex analysis
        self.analyzer = ChainOfThought(
            signature=MarketAnalysis,
            system_prompt=self.SYSTEM_PROMPT
        )

    async def generate_brief(
        self,
        brief_type: str = "daily",
        topics: Optional[List[str]] = None,
        portfolio_context: Optional[Dict] = None,
        format: str = "summary"
    ) -> Dict:
        """
        Generate a complete market brief.

        Args:
            brief_type: "daily" | "weekly" | "custom"
            topics: Specific topics to cover
            portfolio_context: Portfolio for personalization
            format: "summary" | "detailed" | "executive"

        Returns:
            {
                "type": str,
                "generated_at": str,
                "sections": [
                    {
                        "title": str,
                        "content": str,
                        "sentiment": "positive" | "neutral" | "negative",
                        "relevance_score": float,
                        "sources": [str]
                    }
                ],
                "key_takeaways": [str],
                "action_items": [str],
                "market_outlook": {
                    "short_term": str,
                    "medium_term": str,
                    "confidence": float
                }
            }
        """
        # Default topics based on brief type
        if not topics:
            topics = self._get_default_topics(brief_type)

        # Step 1: Gather market data
        gathering_result = await self.execute(
            MarketDataGathering(
                topics=topics,
                portfolio_context=portfolio_context
            )
        )

        # Step 2: Analyze with chain of thought
        analysis_result = await self.analyzer.execute(
            market_data=gathering_result.market_data,
            key_events=gathering_result.key_events,
            analysis_depth="comprehensive" if brief_type == "weekly" else "standard"
        )

        # Step 3: Generate brief
        brief_result = await self.execute(
            BriefGeneration(
                market_outlook=analysis_result.market_outlook,
                sector_analysis=analysis_result.sector_analysis,
                risk_factors=analysis_result.risk_factors,
                opportunities=analysis_result.opportunities,
                format=format,
                portfolio_context=portfolio_context
            )
        )

        # Store in memory for future context
        await self.remember(
            content=f"Market brief {brief_type}: {analysis_result.market_outlook}",
            metadata={
                "type": brief_type,
                "date": datetime.utcnow().isoformat(),
                "topics": topics
            }
        )

        # Share key insights with other agents
        for insight in analysis_result.risk_factors[:3]:
            await self.share_insight(insight, category="risk_factors")

        return {
            "type": brief_type,
            "generated_at": datetime.utcnow().isoformat(),
            **brief_result.brief
        }

    async def stream_brief(
        self,
        brief_type: str = "daily",
        topics: Optional[List[str]] = None
    ) -> AsyncIterator[str]:
        """Stream brief generation for real-time UI updates."""
        if not topics:
            topics = self._get_default_topics(brief_type)

        prompt = self._build_streaming_prompt(topics, brief_type)

        async for chunk in self.stream(prompt):
            yield chunk

    async def research(
        self,
        topic: str,
        depth: str = "standard",
        sources: Optional[List[str]] = None
    ) -> Dict:
        """Research and synthesize information on a topic."""
        # Check memory for relevant past research
        past_research = await self.recall(topic, limit=3)

        research_prompt = f"""
Research the following topic for an investment manager:

Topic: {topic}
Depth: {depth}
{"Previous research context: " + str(past_research) if past_research else ""}

Provide:
1. Executive summary (2-3 sentences)
2. Key data points with sources
3. Investment implications
4. Related topics to explore
"""

        result = await self.execute_prompt(research_prompt)

        return {
            "topic": topic,
            "summary": result.get("summary", ""),
            "key_points": result.get("key_points", []),
            "data": result.get("data", {}),
            "sources": result.get("sources", []),
            "related_topics": result.get("related_topics", [])
        }

    def _get_default_topics(self, brief_type: str) -> List[str]:
        """Get default topics based on brief type."""
        base_topics = [
            "equity_markets",
            "fixed_income",
            "macro_economics",
            "sector_performance"
        ]

        if brief_type == "weekly":
            base_topics.extend([
                "earnings_highlights",
                "central_bank_policy",
                "geopolitical_risks",
                "technical_analysis"
            ])

        return base_topics

    def _build_streaming_prompt(self, topics: List[str], brief_type: str) -> str:
        """Build prompt for streaming generation."""
        return f"""Generate a {brief_type} market brief covering:
{chr(10).join(f'- {topic}' for topic in topics)}

Structure your response as:
## Market Overview
[Overall market conditions]

## Key Developments
[Important events and their implications]

## Sector Highlights
[Sector-by-sector analysis]

## Risks & Opportunities
[Key risks and opportunities identified]

## Action Items
[Specific recommendations]

Begin generating the brief:"""
```

### 2.2 Acceptance Criteria

- [ ] Generate daily briefs covering 4+ topics in < 30 seconds
- [ ] Generate weekly comprehensive briefs in < 60 seconds
- [ ] Stream brief generation for real-time UI
- [ ] Personalize briefs based on portfolio context
- [ ] Store briefs in memory for context
- [ ] Share key insights to shared memory pool
- [ ] Support 3 output formats (summary, detailed, executive)

---

## 3. Portfolio Query Agent

### 3.1 Agent Definition

**Purpose**: Answer natural language questions about portfolios using RAG.

**File**: `src/arc/agents/portfolio_query.py`

```python
from arc.agents.base import ARCBaseAgent
from kaizen.signatures import Signature, Field
from kaizen.rag import RAGAgent
from dataflow import DataFlow
from typing import Optional, List, Dict
from datetime import datetime

# ========== Signatures ==========

class QueryUnderstanding(Signature):
    """Understand user query intent and required data."""

    query: str = Field(description="User's natural language query")
    portfolio_ids: List[str] = Field(description="Available portfolio IDs")

    intent: str = Field(description="Query intent classification")
    required_data: List[str] = Field(description="Data types needed to answer")
    entities: Dict = Field(description="Extracted entities (securities, dates, etc.)")
    clarification_needed: bool = Field(description="Whether clarification is needed")


class DataRetrieval(Signature):
    """Retrieve relevant data for the query."""

    intent: str = Field(description="Query intent")
    required_data: List[str] = Field(description="Required data types")
    entities: Dict = Field(description="Extracted entities")
    portfolio_ids: List[str] = Field(description="Portfolio IDs to query")

    retrieved_data: Dict = Field(description="Retrieved portfolio data")
    data_quality: str = Field(description="Data quality assessment")


class AnswerGeneration(Signature):
    """Generate natural language answer from data."""

    query: str = Field(description="Original query")
    retrieved_data: Dict = Field(description="Retrieved data")
    intent: str = Field(description="Query intent")

    answer: str = Field(description="Natural language answer")
    confidence: float = Field(description="Answer confidence 0-1")
    supporting_data: Dict = Field(description="Data supporting the answer")
    follow_up_questions: List[str] = Field(description="Suggested follow-ups")


# ========== Agent Implementation ==========

class PortfolioQueryAgent(ARCBaseAgent):
    """
    Portfolio Query Agent for natural language portfolio questions.

    Capabilities:
    - Understand complex portfolio queries
    - Retrieve relevant data from DataFlow
    - Generate accurate answers with confidence scores
    - Suggest follow-up questions
    - Learn from user interactions
    """

    SYSTEM_PROMPT = """You are an expert portfolio analyst assistant.
Your role is to answer questions about investment portfolios accurately and helpfully.

Key principles:
1. Be precise with numbers - use exact values from data
2. Acknowledge uncertainty - provide confidence levels
3. Be comprehensive but concise
4. Suggest related questions the user might want to ask
5. Use professional investment terminology
6. When data is insufficient, explain what's missing

Query types you handle:
- Holdings queries: "What's my exposure to tech?"
- Performance queries: "How did my portfolio perform last month?"
- Comparison queries: "Compare my top 5 holdings"
- Risk queries: "What's my concentration risk?"
- Ratio queries: "Which holdings have low P/E ratios?"
- Trend queries: "Show me holdings with declining profitability"
"""

    QUERY_INTENTS = [
        "holdings_analysis",      # Questions about current holdings
        "performance_analysis",   # Performance-related questions
        "sector_exposure",        # Sector allocation questions
        "risk_analysis",          # Risk-related questions
        "comparison",             # Comparative questions
        "ratio_analysis",         # Financial ratio questions
        "trend_analysis",         # Trend and historical questions
        "recommendation",         # Action recommendations
        "general_info"            # General portfolio info
    ]

    def __init__(self, db: DataFlow, memory_pool=None):
        super().__init__(db=db, memory_pool=memory_pool, temperature=0.3)

        # Lower temperature for more precise answers
        self.rag = RAGAgent(
            vector_memory=self.memory,
            retrieval_strategy="hybrid",  # Combine vector + keyword search
            top_k=10
        )

    async def answer(
        self,
        query: str,
        portfolios: List[Dict],
        include_sources: bool = True
    ) -> Dict:
        """
        Answer a natural language question about portfolios.

        Args:
            query: User's question in natural language
            portfolios: List of portfolio dicts user has access to
            include_sources: Whether to include data sources in response

        Returns:
            {
                "query": str,
                "answer": str,
                "confidence": float,
                "data": {...},
                "sources": [str],
                "follow_up_questions": [str]
            }
        """
        portfolio_ids = [p["id"] for p in portfolios]

        # Step 1: Understand the query
        understanding = await self.execute(
            QueryUnderstanding(
                query=query,
                portfolio_ids=portfolio_ids
            )
        )

        # Handle clarification needed
        if understanding.clarification_needed:
            return {
                "query": query,
                "answer": "I need more information to answer your question.",
                "confidence": 0.0,
                "clarification_needed": True,
                "suggested_refinements": understanding.entities.get("refinements", [])
            }

        # Step 2: Retrieve relevant data
        retrieval = await self._retrieve_data(
            intent=understanding.intent,
            required_data=understanding.required_data,
            entities=understanding.entities,
            portfolio_ids=portfolio_ids
        )

        # Step 3: Generate answer
        answer_result = await self.execute(
            AnswerGeneration(
                query=query,
                retrieved_data=retrieval,
                intent=understanding.intent
            )
        )

        # Learn from this interaction
        await self.remember(
            content=f"Q: {query}\nA: {answer_result.answer}",
            metadata={
                "intent": understanding.intent,
                "confidence": answer_result.confidence,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return {
            "query": query,
            "answer": answer_result.answer,
            "confidence": answer_result.confidence,
            "data": answer_result.supporting_data if include_sources else {},
            "sources": list(retrieval.keys()) if include_sources else [],
            "follow_up_questions": answer_result.follow_up_questions
        }

    async def suggest_queries(
        self,
        recent_queries: List[str],
        recent_alerts: List[Dict],
        context: Optional[str] = None
    ) -> List[str]:
        """Generate contextual query suggestions."""
        suggestion_prompt = f"""
Based on the user's context, suggest 5 relevant portfolio questions they might ask.

Recent queries: {recent_queries}
Active alerts: {[a.get('title') for a in recent_alerts]}
Additional context: {context or 'None'}

Generate questions that:
1. Build on their recent activity
2. Address any active alerts
3. Provide valuable portfolio insights
4. Are specific and actionable

Return as a JSON list of strings.
"""

        result = await self.execute_prompt(suggestion_prompt)
        return result.get("suggestions", [
            "What's my current sector allocation?",
            "Which holdings have the best performance this month?",
            "Are there any concentration risks in my portfolio?",
            "What's my exposure to emerging markets?",
            "Show me holdings with improving profitability trends"
        ])

    async def _retrieve_data(
        self,
        intent: str,
        required_data: List[str],
        entities: Dict,
        portfolio_ids: List[str]
    ) -> Dict:
        """Retrieve relevant data from DataFlow."""
        data = {}

        # Get portfolio holdings
        if "holdings" in required_data or intent in ["holdings_analysis", "sector_exposure"]:
            for pid in portfolio_ids:
                holdings = await self.db.express.list(
                    "Holding",
                    filter={"portfolio_id": pid, "quantity": {"$gt": 0}},
                    limit=500
                )
                data[f"holdings_{pid}"] = holdings

        # Get security details
        if "securities" in required_data:
            security_ids = entities.get("security_ids", [])
            if security_ids:
                securities = await self.db.express.list(
                    "Security",
                    filter={"id": {"$in": security_ids}},
                    limit=100
                )
                data["securities"] = securities

        # Get ratios
        if "ratios" in required_data or intent == "ratio_analysis":
            security_ids = entities.get("security_ids", [])
            if security_ids:
                ratios = await self.db.express.list(
                    "SecurityRatio",
                    filter={"security_id": {"$in": security_ids}},
                    order_by=[("-calculation_date", "desc")],
                    limit=100
                )
                data["ratios"] = ratios

        # Get valuations for performance
        if "valuations" in required_data or intent == "performance_analysis":
            for pid in portfolio_ids:
                valuations = await self.db.express.list(
                    "PortfolioValuation",
                    filter={"portfolio_id": pid},
                    order_by=[("-valuation_date", "desc")],
                    limit=30
                )
                data[f"valuations_{pid}"] = valuations

        # Get alerts
        if "alerts" in required_data:
            alerts = await self.db.express.list(
                "Alert",
                filter={"portfolio_id": {"$in": portfolio_ids}, "status": "new"},
                limit=20
            )
            data["alerts"] = alerts

        return data
```

### 3.2 Example Queries

| Query | Intent | Required Data |
|-------|--------|---------------|
| "What's my exposure to technology sector?" | sector_exposure | holdings, securities |
| "Which holdings have the lowest P/E ratios?" | ratio_analysis | holdings, ratios |
| "How did my portfolio perform vs S&P 500?" | performance_analysis | valuations, benchmarks |
| "Show me holdings with declining profitability" | trend_analysis | holdings, ratios (historical) |
| "What's my largest position?" | holdings_analysis | holdings |

### 3.3 Acceptance Criteria

- [ ] Classify 9 query intent types accurately (>90%)
- [ ] Retrieve relevant data based on intent
- [ ] Generate accurate answers with confidence scores
- [ ] Suggest relevant follow-up questions
- [ ] Handle clarification requests gracefully
- [ ] Response time < 3 seconds for standard queries
- [ ] Store interactions in memory for learning

---

## 4. Financial Analyst Agent

### 4.1 Agent Definition

**Purpose**: Perform financial analysis with anomaly detection using PEV pattern.

**File**: `src/arc/agents/financial_analyst.py`

```python
from arc.agents.base import ARCBaseAgent
from kaizen.signatures import Signature, Field
from kaizen.patterns import PEVAgent  # Plan-Execute-Verify
from typing import Optional, List, Dict
from datetime import datetime, timedelta

# ========== Signatures ==========

class AnalysisPlan(Signature):
    """Plan the analysis approach for a security."""

    security: Dict = Field(description="Security data")
    fundamentals: List[Dict] = Field(description="Historical fundamentals")
    ratios: List[Dict] = Field(description="Historical ratios")
    analysis_type: str = Field(description="Type of analysis requested")

    analysis_steps: List[str] = Field(description="Planned analysis steps")
    metrics_to_evaluate: List[str] = Field(description="Metrics to evaluate")
    comparison_benchmarks: List[str] = Field(description="Benchmarks for comparison")


class AnalysisExecution(Signature):
    """Execute the analysis plan."""

    analysis_steps: List[str] = Field(description="Steps to execute")
    security: Dict = Field(description="Security data")
    fundamentals: List[Dict] = Field(description="Fundamentals data")
    ratios: List[Dict] = Field(description="Ratios data")

    findings: List[Dict] = Field(description="Analysis findings")
    metrics_calculated: Dict = Field(description="Calculated metrics")
    trends_identified: List[Dict] = Field(description="Identified trends")


class AnalysisVerification(Signature):
    """Verify and synthesize analysis results."""

    findings: List[Dict] = Field(description="Raw findings")
    metrics_calculated: Dict = Field(description="Calculated metrics")
    trends_identified: List[Dict] = Field(description="Identified trends")

    verified_findings: List[Dict] = Field(description="Verified findings")
    confidence_scores: Dict = Field(description="Confidence per finding")
    final_assessment: Dict = Field(description="Final assessment")


class AnomalyDetection(Signature):
    """Detect anomalies in financial data."""

    security_ids: List[str] = Field(description="Securities to analyze")
    lookback_days: int = Field(description="Days to look back")
    current_ratios: List[Dict] = Field(description="Current ratio data")
    historical_ratios: List[Dict] = Field(description="Historical ratio data")

    anomalies: List[Dict] = Field(description="Detected anomalies")
    severity_scores: Dict = Field(description="Severity per anomaly")


# ========== Agent Implementation ==========

class FinancialAnalystAgent(ARCBaseAgent):
    """
    Financial Analyst Agent using Plan-Execute-Verify pattern.

    Capabilities:
    - Comprehensive security analysis
    - Financial health scoring
    - Anomaly detection
    - Trend analysis with forecasting
    - Peer comparison
    """

    SYSTEM_PROMPT = """You are a CFA-certified financial analyst with expertise in:
- Fundamental analysis and valuation
- Financial ratio interpretation
- Trend identification and forecasting
- Anomaly detection in financial data
- Risk assessment

Analysis principles:
1. Always verify calculations before presenting
2. Identify both positive and negative signals
3. Compare against industry benchmarks
4. Consider cyclical and secular trends
5. Quantify findings where possible
6. Assign confidence levels to conclusions

Grading scale for financial health:
- A (90-100): Exceptional financial position
- B (80-89): Strong financial position
- C (70-79): Adequate financial position
- D (60-69): Weak financial position
- F (<60): Critical financial concerns
"""

    def __init__(self, db=None, memory_pool=None):
        super().__init__(db=db, memory_pool=memory_pool, temperature=0.4)

        # Initialize PEV agent for rigorous analysis
        self.pev = PEVAgent(
            plan_signature=AnalysisPlan,
            execute_signature=AnalysisExecution,
            verify_signature=AnalysisVerification,
            system_prompt=self.SYSTEM_PROMPT
        )

    async def analyze(
        self,
        security: Dict,
        fundamentals: List[Dict],
        ratios: List[Dict],
        analysis_type: str = "comprehensive"
    ) -> Dict:
        """
        Perform comprehensive financial analysis.

        Args:
            security: Security master data
            fundamentals: Historical fundamental data
            ratios: Historical ratio data
            analysis_type: "quick" | "comprehensive" | "deep_dive"

        Returns:
            {
                "summary": str,
                "financial_health": {
                    "score": float (0-100),
                    "grade": "A" - "F",
                    "trend": "improving" | "stable" | "declining"
                },
                "key_metrics": {...},
                "strengths": [str],
                "concerns": [str],
                "peer_comparison": {...},
                "recommendation": str,
                "confidence": float
            }
        """
        # Use PEV pattern for rigorous analysis
        result = await self.pev.execute(
            security=security,
            fundamentals=fundamentals,
            ratios=ratios,
            analysis_type=analysis_type
        )

        # Calculate financial health score
        health_score = self._calculate_health_score(result.verified_findings)

        # Determine trend
        trend = self._determine_trend(ratios)

        # Share significant findings with other agents
        if health_score < 60:
            await self.share_insight(
                f"Financial concern: {security.get('ticker')} health score {health_score}",
                category="risk_factors"
            )

        return {
            "summary": result.final_assessment.get("summary", ""),
            "financial_health": {
                "score": health_score,
                "grade": self._score_to_grade(health_score),
                "trend": trend
            },
            "key_metrics": result.metrics_calculated,
            "strengths": result.final_assessment.get("strengths", []),
            "concerns": result.final_assessment.get("concerns", []),
            "peer_comparison": result.final_assessment.get("peer_comparison", {}),
            "recommendation": result.final_assessment.get("recommendation", ""),
            "confidence": result.confidence_scores.get("overall", 0.8)
        }

    async def detect_anomalies(
        self,
        security_ids: List[str],
        lookback_days: int = 90
    ) -> List[Dict]:
        """
        Detect anomalies in financial data.

        Returns:
            [
                {
                    "security_id": str,
                    "anomaly_type": str,
                    "severity": "high" | "medium" | "low",
                    "description": str,
                    "detected_at": str,
                    "metrics": {...}
                }
            ]
        """
        # Get historical data
        cutoff_date = (datetime.utcnow() - timedelta(days=lookback_days)).isoformat()

        current_ratios = await self.db.express.list(
            "SecurityRatio",
            filter={
                "security_id": {"$in": security_ids},
                "calculation_date": {"$gte": cutoff_date}
            },
            limit=5000
        )

        # Get historical baseline (prior period)
        baseline_start = (datetime.utcnow() - timedelta(days=lookback_days * 2)).isoformat()
        historical_ratios = await self.db.express.list(
            "SecurityRatio",
            filter={
                "security_id": {"$in": security_ids},
                "calculation_date": {"$gte": baseline_start, "$lt": cutoff_date}
            },
            limit=5000
        )

        # Detect anomalies using signature
        result = await self.execute(
            AnomalyDetection(
                security_ids=security_ids,
                lookback_days=lookback_days,
                current_ratios=current_ratios,
                historical_ratios=historical_ratios
            )
        )

        # Enrich with severity scores
        anomalies = []
        for anomaly in result.anomalies:
            severity = result.severity_scores.get(anomaly.get("id"), "medium")
            anomalies.append({
                **anomaly,
                "severity": severity,
                "detected_at": datetime.utcnow().isoformat()
            })

        return anomalies

    def _calculate_health_score(self, findings: List[Dict]) -> float:
        """Calculate overall financial health score (0-100)."""
        # Weight categories
        weights = {
            "liquidity": 0.15,
            "profitability": 0.25,
            "leverage": 0.20,
            "efficiency": 0.15,
            "valuation": 0.15,
            "growth": 0.10
        }

        category_scores = {}
        for finding in findings:
            category = finding.get("category", "other")
            score = finding.get("score", 50)
            if category in weights:
                if category not in category_scores:
                    category_scores[category] = []
                category_scores[category].append(score)

        total_score = 0
        total_weight = 0

        for category, weight in weights.items():
            if category in category_scores:
                avg_score = sum(category_scores[category]) / len(category_scores[category])
                total_score += avg_score * weight
                total_weight += weight

        if total_weight > 0:
            return round(total_score / total_weight, 1)
        return 50.0  # Default neutral score

    def _score_to_grade(self, score: float) -> str:
        """Convert score to letter grade."""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"

    def _determine_trend(self, ratios: List[Dict]) -> str:
        """Determine overall trend from historical ratios."""
        if len(ratios) < 2:
            return "stable"

        # Sort by date
        sorted_ratios = sorted(ratios, key=lambda x: x.get("calculation_date", ""))

        # Compare key metrics: ROE, profit margin, debt ratio
        key_metrics = ["roe", "net_margin", "debt_to_equity"]
        improving_count = 0
        declining_count = 0

        for metric in key_metrics:
            first_val = sorted_ratios[0].get(metric)
            last_val = sorted_ratios[-1].get(metric)

            if first_val and last_val:
                if metric == "debt_to_equity":
                    # Lower is better for debt
                    if last_val < first_val * 0.95:
                        improving_count += 1
                    elif last_val > first_val * 1.05:
                        declining_count += 1
                else:
                    # Higher is better
                    if last_val > first_val * 1.05:
                        improving_count += 1
                    elif last_val < first_val * 0.95:
                        declining_count += 1

        if improving_count > declining_count:
            return "improving"
        elif declining_count > improving_count:
            return "declining"
        else:
            return "stable"
```

### 4.2 Acceptance Criteria

- [ ] Comprehensive analysis using PEV pattern
- [ ] Calculate financial health score (0-100)
- [ ] Assign letter grades (A-F)
- [ ] Detect trends (improving/stable/declining)
- [ ] Identify anomalies with severity levels
- [ ] Share significant findings to memory pool
- [ ] Analysis time < 10 seconds for single security

---

## 5. Investment Committee Agent

### 5.1 Agent Definition

**Purpose**: Multi-agent decision synthesis using Supervisor-Worker pattern.

**File**: `src/arc/agents/investment_committee.py`

```python
from arc.agents.base import ARCBaseAgent
from arc.agents.market_intelligence import MarketIntelligenceAgent
from arc.agents.portfolio_query import PortfolioQueryAgent
from arc.agents.financial_analyst import FinancialAnalystAgent
from kaizen.patterns import SupervisorWorker, WorkerAgent
from kaizen.signatures import Signature, Field
from typing import Optional, List, Dict
from datetime import datetime
import asyncio

# ========== Signatures ==========

class DecisionRequest(Signature):
    """Request for investment decision."""

    decision_type: str = Field(description="buy|sell|hold|rebalance")
    security_id: Optional[str] = Field(default=None, description="Security if applicable")
    portfolio_id: str = Field(description="Target portfolio")
    context: Optional[str] = Field(default=None, description="Additional context")

    decision_scope: str = Field(description="Scope of decision")
    required_analyses: List[str] = Field(description="Analyses needed")


class PerspectiveGathering(Signature):
    """Gather perspectives from specialist agents."""

    decision_scope: str = Field(description="Decision scope")
    security_id: Optional[str] = Field(description="Security ID")
    portfolio_id: str = Field(description="Portfolio ID")

    technical_perspective: Dict = Field(description="Technical analysis view")
    fundamental_perspective: Dict = Field(description="Fundamental analysis view")
    risk_perspective: Dict = Field(description="Risk assessment view")
    market_perspective: Dict = Field(description="Market context view")


class DecisionSynthesis(Signature):
    """Synthesize perspectives into final decision."""

    perspectives: Dict = Field(description="All gathered perspectives")
    decision_type: str = Field(description="Type of decision")
    constraints: Optional[Dict] = Field(default=None, description="Investment constraints")

    recommendation: str = Field(description="Final recommendation")
    confidence: float = Field(description="Decision confidence 0-1")
    supporting_rationale: List[str] = Field(description="Rationale points")
    dissenting_views: List[str] = Field(description="Contrary perspectives")
    risk_warnings: List[str] = Field(description="Risk warnings")
    action_items: List[str] = Field(description="Specific actions to take")


# ========== Agent Implementation ==========

class InvestmentCommitteeAgent(ARCBaseAgent):
    """
    Investment Committee Agent using Supervisor-Worker pattern.

    Capabilities:
    - Coordinate multiple specialist agents
    - Synthesize diverse perspectives
    - Generate consensus decisions
    - Track decision history
    - Provide audit trail
    """

    SYSTEM_PROMPT = """You are the Chair of an Investment Committee.
Your role is to:
1. Coordinate input from specialist analysts
2. Synthesize diverse perspectives into coherent recommendations
3. Ensure all viewpoints are considered
4. Make balanced, well-reasoned decisions
5. Document rationale for compliance and audit

Decision-making principles:
- Consider both bull and bear cases
- Quantify risks and opportunities
- Align with investment mandate and constraints
- Document dissenting views
- Be decisive but acknowledge uncertainty

Committee structure:
- Technical Analyst: Price trends, momentum, support/resistance
- Fundamental Analyst: Valuations, financials, earnings quality
- Risk Analyst: Volatility, concentration, correlation
- Market Strategist: Macro context, sector trends
"""

    def __init__(self, db, memory_pool=None):
        super().__init__(db=db, memory_pool=memory_pool, temperature=0.5)

        # Initialize specialist agents as workers
        self.market_agent = MarketIntelligenceAgent(db=db, memory_pool=memory_pool)
        self.query_agent = PortfolioQueryAgent(db=db, memory_pool=memory_pool)
        self.analyst_agent = FinancialAnalystAgent(db=db, memory_pool=memory_pool)

        # Initialize supervisor pattern
        self.supervisor = SupervisorWorker(
            supervisor_prompt=self.SYSTEM_PROMPT,
            workers=[
                WorkerAgent(name="technical", agent=self._get_technical_perspective),
                WorkerAgent(name="fundamental", agent=self._get_fundamental_perspective),
                WorkerAgent(name="risk", agent=self._get_risk_perspective),
                WorkerAgent(name="market", agent=self._get_market_perspective),
            ],
            synthesis_signature=DecisionSynthesis
        )

    async def make_decision(
        self,
        decision_type: str,
        portfolio_id: str,
        security_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict:
        """
        Make an investment decision with multi-agent input.

        Args:
            decision_type: "buy" | "sell" | "hold" | "rebalance"
            portfolio_id: Target portfolio
            security_id: Specific security (for buy/sell/hold)
            context: Additional context

        Returns:
            {
                "decision_id": str,
                "decision_type": str,
                "recommendation": str,
                "confidence": float,
                "rationale": [str],
                "dissenting_views": [str],
                "risk_warnings": [str],
                "action_items": [str],
                "perspectives": {
                    "technical": {...},
                    "fundamental": {...},
                    "risk": {...},
                    "market": {...}
                },
                "generated_at": str
            }
        """
        decision_id = f"decision-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # Get portfolio constraints
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        constraints = portfolio.get("constraints", {}) if portfolio else {}

        # Run supervisor-worker pattern
        result = await self.supervisor.execute(
            decision_type=decision_type,
            security_id=security_id,
            portfolio_id=portfolio_id,
            context=context,
            constraints=constraints
        )

        # Build decision record
        decision = {
            "decision_id": decision_id,
            "decision_type": decision_type,
            "security_id": security_id,
            "portfolio_id": portfolio_id,
            "recommendation": result.recommendation,
            "confidence": result.confidence,
            "rationale": result.supporting_rationale,
            "dissenting_views": result.dissenting_views,
            "risk_warnings": result.risk_warnings,
            "action_items": result.action_items,
            "perspectives": {
                "technical": result.perspectives.get("technical", {}),
                "fundamental": result.perspectives.get("fundamental", {}),
                "risk": result.perspectives.get("risk", {}),
                "market": result.perspectives.get("market", {})
            },
            "generated_at": datetime.utcnow().isoformat()
        }

        # Store decision for audit trail
        await self.db.express.create("InvestmentDecision", {
            "id": decision_id,
            **decision
        })

        # Store in memory for future context
        await self.remember(
            content=f"Decision {decision_type} for {security_id or portfolio_id}: {result.recommendation}",
            metadata=decision
        )

        return decision

    async def review_decision(
        self,
        decision_id: str,
        outcome: Dict
    ) -> Dict:
        """Review a past decision against actual outcome for learning."""
        decision = await self.db.express.read("InvestmentDecision", decision_id)

        if not decision:
            return {"error": "Decision not found"}

        review_prompt = f"""
Review this investment decision against its outcome:

Decision: {decision.get('recommendation')}
Confidence: {decision.get('confidence')}
Rationale: {decision.get('rationale')}

Actual Outcome:
{outcome}

Provide:
1. Was the decision correct?
2. What worked well in the analysis?
3. What was missed or misjudged?
4. Lessons for future decisions
"""

        review = await self.execute_prompt(review_prompt)

        # Update decision with review
        await self.db.express.update("InvestmentDecision", decision_id, {
            "review": review,
            "reviewed_at": datetime.utcnow().isoformat()
        })

        return review

    async def _get_technical_perspective(
        self,
        security_id: str,
        portfolio_id: str,
        **kwargs
    ) -> Dict:
        """Get technical analysis perspective."""
        if not security_id:
            return {"view": "N/A - no specific security"}

        # Get price history
        prices = await self.db.express.list(
            "PriceHistory",
            filter={"security_id": security_id},
            order_by=[("-price_date", "desc")],
            limit=90
        )

        prompt = f"""
Provide a technical analysis perspective for investment decision.

Price Data (last 90 days): {len(prices)} data points
Latest Price: {prices[0].get('close') if prices else 'N/A'}

Analyze:
1. Price trend (bullish/bearish/neutral)
2. Key support and resistance levels
3. Momentum indicators
4. Volume patterns
5. Overall technical outlook

Return structured analysis.
"""

        return await self.execute_prompt(prompt)

    async def _get_fundamental_perspective(
        self,
        security_id: str,
        portfolio_id: str,
        **kwargs
    ) -> Dict:
        """Get fundamental analysis perspective."""
        if not security_id:
            return {"view": "N/A - no specific security"}

        security = await self.db.express.read("Security", security_id)
        fundamentals = await self.db.express.list(
            "CompanyFundamentals",
            filter={"security_id": security_id},
            order_by=[("-period_end_date", "desc")],
            limit=4
        )
        ratios = await self.db.express.list(
            "SecurityRatio",
            filter={"security_id": security_id},
            order_by=[("-calculation_date", "desc")],
            limit=1
        )

        analysis = await self.analyst_agent.analyze(
            security=security,
            fundamentals=fundamentals,
            ratios=ratios,
            analysis_type="quick"
        )

        return analysis

    async def _get_risk_perspective(
        self,
        security_id: str,
        portfolio_id: str,
        **kwargs
    ) -> Dict:
        """Get risk analysis perspective."""
        portfolio = await self.db.express.read("Portfolio", portfolio_id)
        holdings = await self.db.express.list(
            "Holding",
            filter={"portfolio_id": portfolio_id, "quantity": {"$gt": 0}},
            limit=100
        )

        prompt = f"""
Provide a risk analysis perspective for investment decision.

Portfolio: {portfolio.get('name') if portfolio else 'Unknown'}
Current Holdings: {len(holdings)}
Risk Profile: {portfolio.get('risk_profile', 'moderate') if portfolio else 'moderate'}
{"Security under consideration: " + security_id if security_id else ""}

Analyze:
1. Concentration risk impact
2. Sector exposure changes
3. Correlation with existing holdings
4. Volatility considerations
5. Downside risk scenarios

Return structured risk assessment.
"""

        return await self.execute_prompt(prompt)

    async def _get_market_perspective(
        self,
        security_id: str,
        portfolio_id: str,
        **kwargs
    ) -> Dict:
        """Get market context perspective."""
        # Get shared market insights from memory pool
        market_insights = await self.get_shared_insights("market_outlook", limit=5)
        risk_factors = await self.get_shared_insights("risk_factors", limit=5)

        brief = await self.market_agent.generate_brief(
            brief_type="custom",
            topics=["macro_economics", "sector_performance"],
            format="summary"
        )

        return {
            "market_brief": brief,
            "shared_insights": market_insights,
            "risk_factors": risk_factors
        }
```

### 5.2 Acceptance Criteria

- [ ] Coordinate 4 specialist perspectives (technical, fundamental, risk, market)
- [ ] Synthesize perspectives into single recommendation
- [ ] Provide confidence score for decisions
- [ ] Document dissenting views for audit
- [ ] Store decisions for audit trail
- [ ] Support decision review against outcomes
- [ ] Decision time < 30 seconds

---

## 6. Agent Memory Architecture

### 6.1 Shared Memory Pool

```python
# src/arc/agents/memory.py
from kaizen.memory import SharedMemoryPool, VectorMemory
from typing import Optional
import os

def create_memory_pool() -> SharedMemoryPool:
    """Create shared memory pool for all ARC agents."""
    return SharedMemoryPool(
        namespace="arc",
        vector_store="pgvector",
        connection_string=os.getenv("DATABASE_URL"),
        embedding_model="text-embedding-3-small",
        embedding_dimensions=1536,
        categories=[
            "market_outlook",
            "risk_factors",
            "opportunities",
            "anomalies",
            "decisions",
            "research"
        ]
    )

def create_agent_memory(
    pool: SharedMemoryPool,
    agent_name: str
) -> VectorMemory:
    """Create agent-specific memory within shared pool."""
    return VectorMemory(
        pool=pool,
        collection=agent_name,
        auto_index=True
    )
```

### 6.2 Memory Categories

| Category | Purpose | Retention |
|----------|---------|-----------|
| market_outlook | Market analysis insights | 30 days |
| risk_factors | Identified risks | 90 days |
| opportunities | Identified opportunities | 90 days |
| anomalies | Detected anomalies | 180 days |
| decisions | Investment decisions | Permanent |
| research | Research findings | 365 days |

---

## 7. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up `ARCBaseAgent` with memory integration
- [ ] Configure pgvector for SharedMemoryPool
- [ ] Implement memory categories and retention
- [ ] Test agent memory storage and retrieval

### Phase 2: Individual Agents
- [ ] Implement `MarketIntelligenceAgent` with briefs
- [ ] Implement `PortfolioQueryAgent` with RAG
- [ ] Implement `FinancialAnalystAgent` with PEV
- [ ] Unit test each agent independently

### Phase 3: Multi-Agent Coordination
- [ ] Implement `InvestmentCommitteeAgent` supervisor
- [ ] Configure worker agent coordination
- [ ] Test multi-agent decision flow
- [ ] Implement decision audit trail

### Phase 4: Integration
- [ ] Integrate agents with `IntelligenceService`
- [ ] Connect to Nexus API endpoints
- [ ] Implement streaming for briefs
- [ ] Performance optimization (caching, batching)

---

## 8. Testing Strategy

### Unit Tests
```python
# tests/unit/agents/test_market_intelligence.py
import pytest
from arc.agents.market_intelligence import MarketIntelligenceAgent

@pytest.mark.asyncio
async def test_generate_brief():
    agent = MarketIntelligenceAgent()
    brief = await agent.generate_brief(
        brief_type="daily",
        topics=["equity_markets"]
    )

    assert "sections" in brief
    assert "key_takeaways" in brief
    assert brief["type"] == "daily"
```

### Integration Tests
```python
# tests/integration/agents/test_investment_committee.py
import pytest
from arc.agents.investment_committee import InvestmentCommitteeAgent

@pytest.mark.asyncio
async def test_make_decision(real_db):
    agent = InvestmentCommitteeAgent(db=real_db)
    decision = await agent.make_decision(
        decision_type="buy",
        portfolio_id="test-portfolio",
        security_id="test-security"
    )

    assert "recommendation" in decision
    assert "confidence" in decision
    assert 0 <= decision["confidence"] <= 1
```
