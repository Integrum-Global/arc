# User Flow: Intelligence & Natural Language Queries

## Overview

This document describes user flows for AI-powered intelligence features including market briefs and natural language portfolio queries.

---

## Flow 1: Morning Market Brief

### Trigger
- Daily scheduled delivery (7am user timezone)
- On-demand "Generate Brief" button
- Mobile push notification → open brief

### User Journey

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         MARKET INTELLIGENCE BRIEF                                     │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  DAILY MARKET BRIEF                          January 7, 2026 | 7:00 AM  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  EXECUTIVE SUMMARY                                                │   │
│  │                                                                   │   │
│  │  Markets opened mixed following Friday's jobs report beat.       │   │
│  │  Tech sector under pressure (-1.2%) on renewed rate concerns.    │   │
│  │  Your portfolio is down 0.8% pre-market, outperforming the      │   │
│  │  S&P 500 (-1.1%).                                                │   │
│  │                                                                   │   │
│  │  Confidence: 87%                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  KEY INSIGHTS FOR YOUR PORTFOLIO                                  │   │
│  │                                                                   │   │
│  │  1. 🔴 NVDA (-3.2%): China export restrictions expanded         │   │
│  │     Impact: ~15% revenue exposure, monitor guidance              │   │
│  │     [View Holding Detail]                                        │   │
│  │                                                                   │   │
│  │  2. 🟢 MSFT (+1.1%): Azure growth beat consensus estimates      │   │
│  │     Your position: 8.5% of portfolio, up $12,400 today          │   │
│  │     [View Holding Detail]                                        │   │
│  │                                                                   │   │
│  │  3. 🟡 Healthcare sector: Defensive rotation expected            │   │
│  │     Consider: Increasing JNJ position (currently 3.2%)          │   │
│  │     [Run Optimization]                                           │   │
│  │                                                                   │   │
│  │  4. ⚠️ Rate Watch: 10Y yield at 4.8%, highest since October     │   │
│  │     Duration risk flagged for bond holdings                      │   │
│  │     [View Fixed Income Analysis]                                 │   │
│  │                                                                   │   │
│  │  5. 📊 Earnings This Week: 3 of your holdings report            │   │
│  │     AAPL (Wed), META (Thu), AMZN (Thu)                          │   │
│  │     [Set Earnings Alerts]                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  SOURCES                                                          │   │
│  │                                                                   │   │
│  │  • [WSJ: Jobs Report Analysis] • [Reuters: China Trade]          │   │
│  │  • [Bloomberg: Fed Watch] • [Company 8-K Filings]                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [📤 Share]  [📋 Copy]  [📊 View Full Analysis]  [⚙️ Brief Settings]    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Brief Settings Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BRIEF SETTINGS                                                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DELIVERY                                                         │   │
│  │                                                                   │   │
│  │  Schedule:    ☑️ Daily  ☐ Weekly  ☐ On-demand only              │   │
│  │  Time:        [7:00 AM ▼]  Timezone: [US/Eastern ▼]             │   │
│  │  Channel:     ☑️ Email  ☑️ In-app  ☐ SMS                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  CONTENT PREFERENCES                                              │   │
│  │                                                                   │   │
│  │  Detail Level:   [Executive Summary ▼]                           │   │
│  │                  • Executive Summary (5 insights)                 │   │
│  │                  • Standard (10 insights)                        │   │
│  │                  • Comprehensive (full analysis)                 │   │
│  │                                                                   │   │
│  │  Focus Areas:                                                     │   │
│  │    ☑️ Holdings-specific news                                     │   │
│  │    ☑️ Sector/macro trends                                        │   │
│  │    ☑️ Earnings and events                                        │   │
│  │    ☐ Technical signals                                           │   │
│  │    ☑️ Risk alerts                                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  CUSTOM TOPICS                                                    │   │
│  │                                                                   │   │
│  │  Track these additional topics:                                   │   │
│  │  [+ Add Topic]                                                    │   │
│  │                                                                   │   │
│  │  • AI/Machine Learning developments        [✕]                   │   │
│  │  • ESG and sustainability news             [✕]                   │   │
│  │  • Federal Reserve policy                  [✕]                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Cancel]                                              [Save Preferences]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Natural Language Portfolio Query

### Trigger
- Query bar on dashboard
- Dedicated "Ask ARC" interface
- Voice input (mobile)

### User Journey

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         NATURAL LANGUAGE QUERY INTERFACE                              │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🔍 Ask about your portfolio...                                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  What's my exposure to China supply chain risk?                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Suggested questions:                                                    │
│  • How has my tech sector performed this quarter?                       │
│  • Which holdings have the highest P/E ratios?                          │
│  • What's my dividend yield across the portfolio?                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              │
                              │ Submit query
                              ▼

┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR QUESTION                                                           │
│  What's my exposure to China supply chain risk?                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ARC ANALYSIS                                    Confidence: 92%  │   │
│  │                                                                   │   │
│  │  Your portfolio has **$847,000 (23.5%) direct and indirect      │   │
│  │  exposure to China supply chain risks**.                         │   │
│  │                                                                   │   │
│  │  **Direct Revenue Exposure (>20% China revenue):**               │   │
│  │                                                                   │   │
│  │  | Holding | Weight | China Rev % | At-Risk Value |             │   │
│  │  |---------|--------|-------------|---------------|             │   │
│  │  | AAPL    | 12.5%  | 19%         | $85,500       |             │   │
│  │  | NVDA    | 8.2%   | 22%         | $64,900       |             │   │
│  │  | QCOM    | 5.1%   | 48%         | $88,100       |             │   │
│  │  | Total   | 25.8%  |             | $238,500      |             │   │
│  │                                                                   │   │
│  │  **Indirect Supply Chain Exposure:**                             │   │
│  │                                                                   │   │
│  │  15 holdings have Tier 1 or Tier 2 suppliers in China,           │   │
│  │  representing an additional ~$608,500 in potential disruption    │   │
│  │  risk.                                                            │   │
│  │                                                                   │   │
│  │  **Risk Assessment:**                                             │   │
│  │  Your China exposure is **above the benchmark (S&P 500: 18%)**   │   │
│  │  primarily due to overweight in semiconductors.                  │   │
│  │                                                                   │   │
│  │  **Recommendations:**                                             │   │
│  │  1. Consider reducing QCOM position (highest concentration)      │   │
│  │  2. Add domestic semiconductor exposure (e.g., INTC, ON)         │   │
│  │  3. Set alert for China-related news on high-exposure names      │   │
│  │                                                                   │   │
│  │  [Sources: Company 10-K filings, FactSet Supply Chain data]      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DATA USED                                                        │   │
│  │                                                                   │   │
│  │  • Portfolio holdings (47 securities)                            │   │
│  │  • Revenue geographic segments (10-K filings)                    │   │
│  │  • Supply chain database (FactSet)                               │   │
│  │  • S&P 500 benchmark composition                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Follow-up questions:                                                    │
│  • [Show me the full list of exposed holdings]                          │
│  • [Run an optimization to reduce this exposure]                        │
│  • [What would happen if I sold QCOM entirely?]                         │
│                                                                          │
│  [📋 Copy Response]  [📤 Export to Report]  [🔄 New Query]              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Query Processing Pipeline

```
User Query
    │
    ▼
┌─────────────────────────────────────────┐
│  1. INTENT CLASSIFICATION               │
│                                         │
│  • Exposure query                       │
│  • Performance query                    │
│  • Risk query                           │
│  • Comparison query                     │
│  • Recommendation query                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. ENTITY EXTRACTION                   │
│                                         │
│  • Geographic: China                    │
│  • Risk type: Supply chain              │
│  • Scope: Full portfolio                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. DATA RETRIEVAL (RAG)                │
│                                         │
│  • Query DataFlow for holdings          │
│  • Vector search for relevant docs      │
│  • Fetch external data (supply chain)   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. ANALYSIS GENERATION                 │
│                                         │
│  • Calculate exposures                  │
│  • Compare to benchmarks                │
│  • Generate recommendations             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  5. RESPONSE FORMATTING                 │
│                                         │
│  • Structured markdown                  │
│  • Tables for data                      │
│  • Confidence scoring                   │
│  • Source attribution                   │
└─────────────────────────────────────────┘
```

---

## Flow 3: Proactive Insight Notification

### Trigger
- AI detects significant portfolio event
- Threshold breach
- Market event affecting holdings

### User Journey

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         PROACTIVE INSIGHT NOTIFICATION                                │
└──────────────────────────────────────────────────────────────────────────────────────┘

MOBILE PUSH NOTIFICATION
┌─────────────────────────────────────────────────────────────────────────┐
│  ARC Intelligence                                              2:45 PM  │
│  ⚠️ NVDA position update: Export restrictions expanded to               │
│  additional chip types. Your position ($295K) may be affected.         │
│  Tap to view analysis.                                                  │
└─────────────────────────────────────────────────────────────────────────┘

                              │
                              │ Tap notification
                              ▼

IN-APP INSIGHT DETAIL
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️ BREAKING: NVIDIA Export Restriction Update                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  WHAT HAPPENED                                                    │   │
│  │                                                                   │   │
│  │  The U.S. Commerce Department announced expanded export           │   │
│  │  restrictions on AI chips to China, now including NVIDIA's       │   │
│  │  H100 and A100 variants previously exempt.                       │   │
│  │                                                                   │   │
│  │  Time: 2:30 PM ET | Source: Reuters, Commerce Dept               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  YOUR EXPOSURE                                                    │   │
│  │                                                                   │   │
│  │  NVDA Position:        $295,400 (8.2% of portfolio)              │   │
│  │  Est. Revenue Impact:  ~$4-6B (15-20% of data center)            │   │
│  │  Stock Movement:       -4.2% since announcement                  │   │
│  │  Your P&L Impact:      -$12,400 (unrealized)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI ASSESSMENT                                                    │   │
│  │                                                                   │   │
│  │  Impact Severity: MODERATE-HIGH                                   │   │
│  │                                                                   │   │
│  │  "While the near-term revenue impact is significant, NVIDIA's    │   │
│  │   strong position in AI infrastructure and diversified customer  │   │
│  │   base outside China provides resilience. Consensus estimates    │   │
│  │   expect a 5-10% EPS revision. Your cost basis ($145) provides   │   │
│  │   significant cushion from current levels ($178)."               │   │
│  │                                                                   │   │
│  │  Recommendation: HOLD - Monitor Q4 guidance closely              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  SUGGESTED ACTIONS:                                                      │
│                                                                          │
│  [Set Price Alert]  [Run Scenario Analysis]  [View Similar Holdings]    │
│                                                                          │
│  [Dismiss]  [Snooze 1hr]  [Mark as Read]                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Implementation

```python
# src/arc/agents/intelligence/market_brief.py
from kaizen.agents import RAGResearchAgent
from kaizen.memory.vector import VectorMemory
from kaizen.signatures import Signature, InputField, OutputField
from typing import List, Optional

class MarketBriefSignature(Signature):
    """Generate personalized market brief."""

    portfolio_holdings: List[dict] = InputField(
        desc="User's portfolio holdings with positions"
    )
    user_preferences: dict = InputField(
        desc="User's brief preferences (detail level, topics)"
    )
    custom_topics: Optional[List[str]] = InputField(
        desc="Additional topics to track"
    )

    summary: str = OutputField(
        desc="Executive summary paragraph"
    )
    insights: List[dict] = OutputField(
        desc="List of personalized insights with holding references"
    )
    events: List[dict] = OutputField(
        desc="Upcoming events affecting holdings"
    )
    sources: List[dict] = OutputField(
        desc="Sources with URLs"
    )
    confidence: float = OutputField(
        desc="Overall confidence 0.0-1.0"
    )


class MarketIntelligenceAgent(RAGResearchAgent):
    """AI agent for generating market intelligence briefs."""

    def __init__(self, config):
        self.vector_memory = VectorMemory(
            embedding_fn=self._get_embeddings,
            top_k=20
        )

        super().__init__(
            config=config,
            signature=MarketBriefSignature(),
            memory=self.vector_memory
        )

    async def generate_brief(
        self,
        portfolio_id: str,
        user_id: str
    ) -> dict:
        """Generate personalized market brief."""
        # Get portfolio holdings
        holdings = await self._fetch_holdings(portfolio_id)

        # Get user preferences
        preferences = await self._fetch_preferences(user_id)

        # Fetch latest market data and news
        await self._refresh_knowledge_base(holdings)

        # Generate brief
        result = self.run(
            portfolio_holdings=holdings,
            user_preferences=preferences,
            custom_topics=preferences.get('custom_topics', [])
        )

        return result


# src/arc/agents/query/portfolio_qa.py
class PortfolioQuerySignature(Signature):
    """Natural language portfolio query."""

    question: str = InputField(desc="User's natural language question")
    portfolio_id: str = InputField(desc="Portfolio to query")

    answer: str = OutputField(desc="Natural language answer")
    data_tables: List[dict] = OutputField(desc="Supporting data tables")
    recommendations: List[str] = OutputField(desc="Actionable recommendations")
    sources: List[str] = OutputField(desc="Data sources used")
    follow_ups: List[str] = OutputField(desc="Suggested follow-up questions")
    confidence: float = OutputField(desc="Confidence 0.0-1.0")


class PortfolioQueryAgent(BaseAgent):
    """Answer natural language questions about portfolios."""

    def __init__(self, config, db: DataFlow):
        self.db = db
        self.vector_memory = VectorMemory(
            embedding_fn=self._get_embeddings,
            top_k=10
        )

        super().__init__(
            config=config,
            signature=PortfolioQuerySignature(),
            memory=self.vector_memory
        )

    async def query(self, question: str, portfolio_id: str) -> dict:
        """Process natural language query."""
        # Classify intent
        intent = await self._classify_intent(question)

        # Extract entities
        entities = await self._extract_entities(question)

        # Fetch relevant data based on intent
        context = await self._fetch_context(
            portfolio_id, intent, entities
        )

        # Generate answer
        result = self.run(
            question=question,
            portfolio_id=portfolio_id,
            context=context
        )

        return result

    async def _classify_intent(self, question: str) -> str:
        """Classify query intent."""
        intents = [
            "exposure",       # What's my exposure to X?
            "performance",    # How has X performed?
            "risk",           # What's my risk from X?
            "comparison",     # How does X compare to Y?
            "recommendation", # What should I do about X?
            "general"         # General information
        ]
        # Use LLM for classification
        return "exposure"  # Placeholder
```

---

## API Endpoints

```python
# src/arc/api/routes/intelligence.py
from fastapi import APIRouter, Depends
from arc.agents.intelligence import market_brief, portfolio_qa

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])


@router.get("/brief")
async def get_market_brief(
    portfolio_id: str,
    user: User = Depends(get_current_user)
):
    """Get personalized market brief."""
    agent = market_brief.MarketIntelligenceAgent(config)
    return await agent.generate_brief(portfolio_id, user.id)


@router.post("/query")
async def query_portfolio(
    question: str,
    portfolio_id: str,
    user: User = Depends(get_current_user)
):
    """Natural language portfolio query."""
    agent = portfolio_qa.PortfolioQueryAgent(config, db)
    return await agent.query(question, portfolio_id)


@router.post("/brief/settings")
async def update_brief_settings(
    settings: BriefSettings,
    user: User = Depends(get_current_user)
):
    """Update market brief preferences."""
    return await db.express.update(
        "UserPreference",
        user.id,
        {"brief_settings": settings.dict()}
    )
```
