# ARC Technical Architecture

## Overview

ARC is built on the Kailash SDK ecosystem, leveraging three complementary frameworks:

| Framework | Purpose | Role in ARC |
|-----------|---------|-------------|
| **DataFlow** | Zero-config database | Portfolio data, time-series, multi-tenant |
| **Nexus** | Multi-channel platform | API, CLI, MCP deployment |
| **Kaizen** | AI agent framework | Intelligence, NL queries, decision support |

---

## 1. System Architecture

```
                            ┌──────────────────────────────────────────────────┐
                            │                  CLIENTS                          │
                            │                                                   │
                            │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
                            │  │ Web App  │  │Mobile App│  │AI Agents │       │
                            │  │ (React)  │  │(Flutter) │  │(Claude)  │       │
                            │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
                            │       │             │             │              │
                            └───────┴─────────────┴─────────────┴──────────────┘
                                    │             │             │
                                    │   HTTPS     │   HTTPS     │   MCP
                                    ▼             ▼             ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              NEXUS GATEWAY                                         │
│                                                                                    │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   REST API  │   │     CLI     │   │ MCP Server  │   │  WebSocket  │          │
│   │  (FastAPI)  │   │  Interface  │   │  (Tools)    │   │ (Real-time) │          │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│          │                 │                 │                 │                  │
│   ┌──────┴─────────────────┴─────────────────┴─────────────────┴───────┐         │
│   │                    Enterprise Gateway                               │         │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │         │
│   │  │  Auth   │  │  RBAC   │  │  Rate   │  │ Circuit │  │  Audit  │  │         │
│   │  │(OAuth2) │  │ Manager │  │ Limiter │  │ Breaker │  │  Log    │  │         │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │         │
│   └────────────────────────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              WORKFLOW ENGINE                                       │
│                                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────┐ │
│   │                         Kailash Core SDK                                     │ │
│   │                                                                              │ │
│   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                  │ │
│   │   │ WorkflowBuilder│ │AsyncLocalRuntime│ │  Node Library │                  │ │
│   │   │               │  │               │  │  (110+ nodes) │                  │ │
│   │   └───────────────┘  └───────────────┘  └───────────────┘                  │ │
│   └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │
│   │   DATAFLOW     │  │    KAIZEN      │  │   WORKFLOWS    │                     │
│   │                │  │                │  │                │                     │
│   │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │                     │
│   │ │  Models    │ │  │ │ Agents     │ │  │ │ Analytics  │ │                     │
│   │ │ Portfolio  │ │  │ │ Market     │ │  │ │ Ratios     │ │                     │
│   │ │ Holding    │ │  │ │ Query      │ │  │ │ Benchmarks │ │                     │
│   │ │ Security   │ │  │ │ Analysis   │ │  │ │ Alerts     │ │                     │
│   │ │ Price      │ │  │ │ Committee  │ │  │ │ Reports    │ │                     │
│   │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │                     │
│   │                │  │                │  │                │                     │
│   │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │                     │
│   │ │ Express    │ │  │ │ Signatures │ │  │ │ Compliance │ │                     │
│   │ │ (Fast CRUD)│ │  │ │ Memory     │ │  │ │ Optimization│                     │
│   │ │           │ │  │ │ Shared Pool│ │  │ │ Attribution│ │                     │
│   │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │                     │
│   └────────────────┘  └────────────────┘  └────────────────┘                     │
└───────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                            │
│                                                                                    │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│   │   PostgreSQL     │  │      Redis       │  │   Vector Store   │               │
│   │   (Primary DB)   │  │   (Cache/Queue)  │  │   (Embeddings)   │               │
│   │                  │  │                  │  │                  │               │
│   │ - Portfolios     │  │ - Session cache  │  │ - Document embeds│               │
│   │ - Holdings       │  │ - Rate limiting  │  │ - Query embeddings│               │
│   │ - Transactions   │  │ - Real-time pub  │  │ - Semantic search│               │
│   │ - Audit logs     │  │ - Job queue      │  │                  │               │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘               │
│                                                                                    │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                         External Data Providers                           │   │
│   │                                                                           │   │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                 │   │
│   │   │ EODHD   │   │Capital  │   │Pitchbook│   │ OpenAI  │                 │   │
│   │   │(Prices) │   │   IQ    │   │(Private)│   │(Claude) │                 │   │
│   │   └─────────┘   └─────────┘   └─────────┘   └─────────┘                 │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture (src/arc)

### 2.1 Directory Structure

```
src/arc/
├── __init__.py
├── main.py                      # Application entry point
├── config.py                    # Configuration management
│
├── models/                      # DataFlow models
│   ├── __init__.py
│   ├── portfolio.py            # Portfolio, Holding, Transaction
│   ├── security.py             # Security, Price, Fundamentals
│   ├── analytics.py            # Valuation, Ratio, Alert
│   ├── user.py                 # User, Tenant, Permission
│   └── collaboration.py        # Workspace, Annotation, Approval
│
├── workflows/                   # Kailash workflows
│   ├── __init__.py
│   ├── analytics/
│   │   ├── ratios.py           # Financial ratio calculations
│   │   ├── benchmarks.py       # Peer comparison workflows
│   │   └── attribution.py      # Performance attribution
│   ├── portfolio/
│   │   ├── valuation.py        # NAV calculation
│   │   ├── optimization.py     # Portfolio optimization
│   │   └── rebalancing.py      # Rebalancing suggestions
│   ├── compliance/
│   │   ├── pre_trade.py        # Pre-trade checks
│   │   └── monitoring.py       # Continuous monitoring
│   ├── data_sync/
│   │   ├── eodhd.py            # EODHD price sync
│   │   ├── capitaliq.py        # Capital IQ fundamentals
│   │   └── pitchbook.py        # Private company data
│   └── reports/
│       ├── portfolio_report.py # Standard reports
│       └── custom_report.py    # Custom templates
│
├── agents/                      # Kaizen AI agents
│   ├── __init__.py
│   ├── intelligence/
│   │   ├── market_brief.py     # Market intelligence generator
│   │   ├── news_analyzer.py    # News sentiment analysis
│   │   └── research.py         # RAG research agent
│   ├── query/
│   │   ├── portfolio_qa.py     # Natural language queries
│   │   └── compliance_qa.py    # Compliance question answering
│   ├── analysis/
│   │   ├── financial.py        # Financial ratio analysis (PEV)
│   │   ├── anomaly.py          # Anomaly detection
│   │   └── valuation.py        # Valuation analysis
│   └── decision/
│       ├── committee.py        # Investment committee (multi-agent)
│       ├── research_analyst.py
│       ├── technical_analyst.py
│       ├── fundamental_analyst.py
│       └── risk_analyst.py
│
├── api/                         # Nexus API layer
│   ├── __init__.py
│   ├── app.py                  # Nexus application
│   ├── routes/
│   │   ├── portfolios.py       # Portfolio endpoints
│   │   ├── analytics.py        # Analytics endpoints
│   │   ├── intelligence.py     # AI intelligence endpoints
│   │   ├── reports.py          # Report generation
│   │   └── admin.py            # Admin endpoints
│   ├── middleware/
│   │   ├── auth.py             # Authentication middleware
│   │   ├── tenant.py           # Multi-tenant context
│   │   └── rate_limit.py       # Rate limiting
│   └── mcp/
│       └── tools.py            # MCP tool definitions
│
├── services/                    # Business logic services
│   ├── __init__.py
│   ├── portfolio_service.py    # Portfolio operations
│   ├── analytics_service.py    # Analytics calculations
│   ├── alert_service.py        # Alert management
│   ├── report_service.py       # Report generation
│   └── notification_service.py # Notifications
│
├── integrations/                # External integrations
│   ├── __init__.py
│   ├── data_providers/
│   │   ├── base.py             # Base provider interface
│   │   ├── eodhd.py            # EODHD client
│   │   ├── capitaliq.py        # Capital IQ client
│   │   └── pitchbook.py        # Pitchbook client
│   ├── ai_providers/
│   │   ├── openai.py           # OpenAI integration
│   │   └── anthropic.py        # Claude integration
│   └── notifications/
│       ├── email.py            # Email notifications
│       └── sms.py              # SMS notifications
│
├── utils/                       # Utility functions
│   ├── __init__.py
│   ├── calculations.py         # Financial calculations
│   ├── formatting.py           # Data formatting
│   └── validators.py           # Input validation
│
└── docs/                        # Documentation
    └── user-flows/             # User flow diagrams
```

### 2.2 Core Models (DataFlow)

```python
# src/arc/models/portfolio.py
from dataflow import DataFlow
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime

db = DataFlow(
    "postgresql://localhost:5432/arc",
    auto_migrate=False,  # Docker-safe
    multi_tenant_strategy="row_level"
)

@db.model
class Portfolio:
    """Investment portfolio."""
    id: str
    name: str
    portfolio_type: str  # managed, model, benchmark
    inception_date: date
    base_currency: str = "USD"
    manager_id: str
    benchmark_id: Optional[str] = None
    risk_profile: str = "moderate"
    active: bool = True

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True,
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["manager_id"]},
        {"fields": ["portfolio_type", "active"]}
    ]


@db.model
class Holding:
    """Position in a portfolio."""
    id: str
    portfolio_id: str
    security_id: str
    quantity: Decimal
    cost_basis: Decimal
    acquisition_date: date
    lot_id: Optional[str] = None

    __dataflow__ = {
        'multi_tenant': True,
        'versioned': True,
        'audit_log': True
    }

    __indexes__ = [
        {"fields": ["portfolio_id", "security_id"]},
        {"fields": ["security_id"]}
    ]


@db.model
class Transaction:
    """Portfolio transaction."""
    id: str
    portfolio_id: str
    security_id: str
    transaction_date: date
    settlement_date: date
    transaction_type: str  # buy, sell, dividend, split
    quantity: Decimal
    price: Decimal
    gross_amount: Decimal
    commission: Decimal = Decimal("0")
    net_amount: Decimal

    __dataflow__ = {
        'multi_tenant': True,
        'audit_log': True
    }


# src/arc/models/security.py
@db.model
class Security:
    """Security master data."""
    id: str  # ISIN or internal ID
    ticker: str
    name: str
    security_type: str  # equity, fixed_income, etc.
    currency: str
    exchange: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    active: bool = True

    __dataflow__ = {
        'multi_tenant': False,  # Shared across tenants
        'soft_delete': True
    }

    __indexes__ = [
        {"fields": ["ticker"], "unique": True},
        {"fields": ["sector", "industry"]}
    ]


@db.model
class PriceHistory:
    """Historical price data."""
    id: str
    security_id: str
    price_date: date
    open_price: Optional[Decimal] = None
    high_price: Optional[Decimal] = None
    low_price: Optional[Decimal] = None
    close_price: Decimal
    adjusted_close: Decimal
    volume: int = 0
    source: str = "eodhd"

    __dataflow__ = {
        'multi_tenant': False
    }

    __indexes__ = [
        {"fields": ["security_id", "price_date"], "unique": True},
        {"fields": ["price_date"]}
    ]


@db.model
class CompanyFundamentals:
    """Company financial data."""
    id: str
    security_id: str
    fiscal_year: int
    fiscal_quarter: Optional[int] = None
    revenue: Optional[Decimal] = None
    net_income: Optional[Decimal] = None
    total_assets: Optional[Decimal] = None
    total_equity: Optional[Decimal] = None
    current_assets: Optional[Decimal] = None
    current_liabilities: Optional[Decimal] = None
    total_debt: Optional[Decimal] = None
    source: str

    __dataflow__ = {
        'multi_tenant': False
    }

    __indexes__ = [
        {"fields": ["security_id", "fiscal_year", "fiscal_quarter"], "unique": True}
    ]
```

### 2.3 Nexus API Application

```python
# src/arc/api/app.py
from nexus import Nexus
from contextlib import asynccontextmanager
from fastapi import FastAPI
import os

from arc.models.portfolio import db
from arc.workflows.analytics import ratios, benchmarks
from arc.workflows.portfolio import valuation, optimization
from arc.agents.intelligence import market_brief
from arc.agents.query import portfolio_qa


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup: Create tables
    await db.create_tables_async()

    # Initialize AI agents
    await initialize_agents()

    yield

    # Shutdown: Close connections
    await db.close_async()


# Initialize Nexus
app = Nexus(
    api_port=int(os.getenv("API_PORT", "8000")),
    mcp_port=int(os.getenv("MCP_PORT", "3001")),
    auto_discovery=False,  # Required for DataFlow
    enable_auth=True,
    enable_rate_limiting=True,
    rate_limit=5000,
    lifespan=lifespan
)

# Configure authentication
app.auth.strategy = "oauth2"
app.auth.rbac_enabled = True
app.auth.roles = {
    "investment_manager": [
        "portfolios:read", "portfolios:write",
        "analytics:read", "reports:generate"
    ],
    "family_office": [
        "portfolios:read", "analytics:read", "reports:view"
    ],
    "admin": ["*"]
}

# Register workflows
app.register("calculate_ratios", ratios.create_ratio_workflow())
app.register("peer_benchmark", benchmarks.create_benchmark_workflow())
app.register("portfolio_valuation", valuation.create_valuation_workflow())
app.register("portfolio_optimization", optimization.create_optimization_workflow())


# Custom endpoints
@app.endpoint("/api/portfolios/{portfolio_id}/analytics")
async def get_portfolio_analytics(portfolio_id: str):
    """Get comprehensive portfolio analytics."""
    return await app._execute_workflow("calculate_ratios", {
        "portfolio_id": portfolio_id
    })


@app.endpoint("/api/intelligence/brief")
async def get_market_brief(topics: str = None):
    """Get AI-generated market brief."""
    agent = market_brief.MarketIntelligenceAgent()
    return await agent.generate_brief(topics=topics)


@app.endpoint("/api/query")
async def query_portfolio(question: str, portfolio_id: str):
    """Natural language portfolio query."""
    agent = portfolio_qa.PortfolioQueryAgent()
    return await agent.query(question, portfolio_id)


# MCP Tools
@app.mcp_tool(
    name="arc_portfolio_analytics",
    description="Get portfolio analytics including ratios and benchmarks"
)
async def mcp_portfolio_analytics(portfolio_id: str):
    return await get_portfolio_analytics(portfolio_id)


@app.mcp_tool(
    name="arc_query",
    description="Ask a natural language question about a portfolio"
)
async def mcp_query(question: str, portfolio_id: str):
    return await query_portfolio(question, portfolio_id)
```

---

## 3. Frontend Architecture

### 3.1 Web Application (apps/web - React)

```
apps/web/
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Root component
│   ├── index.css               # Global styles
│   │
│   ├── api/                    # API client
│   │   ├── client.ts           # Axios/fetch client
│   │   ├── portfolios.ts       # Portfolio API
│   │   ├── analytics.ts        # Analytics API
│   │   └── intelligence.ts     # AI API
│   │
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── charts/             # Recharts components
│   │   ├── tables/             # Data tables
│   │   └── forms/              # Form components
│   │
│   ├── features/               # Feature modules
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PortfolioSummary.tsx
│   │   │   └── AlertsWidget.tsx
│   │   ├── portfolio/
│   │   │   ├── PortfolioList.tsx
│   │   │   ├── PortfolioDetail.tsx
│   │   │   └── HoldingsTable.tsx
│   │   ├── analytics/
│   │   │   ├── RatioAnalysis.tsx
│   │   │   ├── PeerBenchmark.tsx
│   │   │   └── PerformanceChart.tsx
│   │   ├── intelligence/
│   │   │   ├── MarketBrief.tsx
│   │   │   ├── QueryInterface.tsx
│   │   │   └── InsightsFeed.tsx
│   │   └── reports/
│   │       ├── ReportBuilder.tsx
│   │       └── ReportViewer.tsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── usePortfolio.ts
│   │   ├── useAnalytics.ts
│   │   └── useIntelligence.ts
│   │
│   ├── stores/                 # State management
│   │   ├── authStore.ts
│   │   ├── portfolioStore.ts
│   │   └── preferencesStore.ts
│   │
│   ├── utils/                  # Utilities
│   │   ├── formatting.ts
│   │   └── calculations.ts
│   │
│   └── types/                  # TypeScript types
│       ├── portfolio.ts
│       ├── analytics.ts
│       └── api.ts
│
└── public/
    └── assets/
```

### 3.2 Mobile Application (apps/mobile - Flutter)

```
apps/mobile/
├── pubspec.yaml
├── analysis_options.yaml
│
├── lib/
│   ├── main.dart               # Entry point
│   │
│   ├── core/                   # Core utilities
│   │   ├── api/
│   │   │   ├── api_client.dart
│   │   │   └── endpoints.dart
│   │   ├── theme/
│   │   │   └── app_theme.dart
│   │   └── utils/
│   │       └── formatters.dart
│   │
│   ├── features/               # Feature modules
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   └── widgets/
│   │   ├── portfolio/
│   │   │   ├── portfolio_list_screen.dart
│   │   │   ├── portfolio_detail_screen.dart
│   │   │   └── widgets/
│   │   ├── analytics/
│   │   │   ├── analytics_screen.dart
│   │   │   └── widgets/
│   │   ├── intelligence/
│   │   │   ├── brief_screen.dart
│   │   │   ├── query_screen.dart
│   │   │   └── widgets/
│   │   └── settings/
│   │       └── settings_screen.dart
│   │
│   ├── models/                 # Data models
│   │   ├── portfolio.dart
│   │   ├── holding.dart
│   │   └── analytics.dart
│   │
│   ├── providers/              # State management (Riverpod)
│   │   ├── auth_provider.dart
│   │   ├── portfolio_provider.dart
│   │   └── analytics_provider.dart
│   │
│   └── widgets/                # Shared widgets
│       ├── charts/
│       ├── cards/
│       └── forms/
│
└── test/
```

---

## 4. Data Flow Architecture

### 4.1 External Data Sync Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SYNC PIPELINE                            │
└─────────────────────────────────────────────────────────────────────┘

1. SCHEDULED SYNC (Daily @ 6am UTC)
   ┌─────────────────────────────────────────────────────────────────┐
   │  EODHD → Fetch Prices → Validate → BulkUpsert → PriceHistory   │
   └─────────────────────────────────────────────────────────────────┘

2. ON-DEMAND SYNC (User triggered)
   ┌─────────────────────────────────────────────────────────────────┐
   │  Capital IQ → Fetch Fundamentals → Transform → CompanyFundamentals│
   └─────────────────────────────────────────────────────────────────┘

3. VALUATION WORKFLOW (After price sync)
   ┌─────────────────────────────────────────────────────────────────┐
   │  PriceHistory + Holdings → Calculate NAV → PortfolioValuation   │
   │                                                                  │
   │  Holdings × Latest Prices = Market Values                       │
   │  Sum Market Values + Cash = Total Value                         │
   │  (Today - Yesterday) / Yesterday = Daily Return                 │
   └─────────────────────────────────────────────────────────────────┘

4. RATIO CALCULATION (After valuation)
   ┌─────────────────────────────────────────────────────────────────┐
   │  Fundamentals → Calculate 25+ Ratios → SecurityRatios          │
   │                                                                  │
   │  Check vs Thresholds → Generate Alerts → Notifications         │
   └─────────────────────────────────────────────────────────────────┘
```

### 4.2 Real-Time Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME DATA FLOW (SSE)                         │
└─────────────────────────────────────────────────────────────────────┘

Client                    Nexus                      DataFlow
  │                         │                            │
  │ GET /stream/portfolio   │                            │
  │─────────────────────────>                            │
  │                         │                            │
  │    SSE Connection       │  Subscribe to changes     │
  │<─────────────────────────────────────────────────────>
  │                         │                            │
  │    {event: "update"}    │     Price update           │
  │<─────────────────────────────────────────────────────│
  │                         │                            │
  │    {event: "alert"}     │     Threshold breach      │
  │<─────────────────────────────────────────────────────│
  │                         │                            │
```

---

## 5. AI Agent Architecture (Kaizen)

### 5.1 Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI AGENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │  Investment Committee   │ ← Supervisor
                    │      (Synthesizer)      │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │   Research    │   │   Technical   │   │     Risk      │
    │   Analyst     │   │   Analyst     │   │   Analyst     │
    └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
            │                   │                   │
            └───────────────────┴───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   SharedMemoryPool    │
                    │                       │
                    │ - Research findings   │
                    │ - Technical signals   │
                    │ - Risk assessments    │
                    │ - Cross-agent context │
                    └───────────────────────┘

                                │
                                ▼
                    ┌─────────────────────────┐
                    │       DataFlow          │
                    │   (Persistent Memory)   │
                    └─────────────────────────┘
```

### 5.2 Agent Signatures

```python
# src/arc/agents/intelligence/market_brief.py
from kaizen.signatures import Signature, InputField, OutputField
from typing import List, Optional

class MarketBriefSignature(Signature):
    """Generate market intelligence brief."""

    topics: Optional[List[str]] = InputField(
        desc="Specific topics to cover (optional)"
    )
    portfolio_context: Optional[dict] = InputField(
        desc="User's portfolio for personalization"
    )

    summary: str = OutputField(
        desc="Executive summary of market conditions"
    )
    key_insights: List[str] = OutputField(
        desc="Top 5 actionable insights"
    )
    portfolio_implications: List[str] = OutputField(
        desc="Specific implications for user's holdings"
    )
    sources: List[dict] = OutputField(
        desc="Source citations with URLs"
    )
    confidence: float = OutputField(
        desc="Confidence score 0.0-1.0"
    )
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SECURITY ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │     Identity Provider   │
                    │    (Auth0 / Okta)       │
                    └───────────┬─────────────┘
                                │ OAuth2 / OIDC
                                ▼
                    ┌─────────────────────────┐
                    │     Nexus Gateway       │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │  JWT Validation   │  │
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │  RBAC Engine      │  │
                    │  │                   │  │
                    │  │  Roles:           │  │
                    │  │  - admin          │  │
                    │  │  - inv_manager    │  │
                    │  │  - family_office  │  │
                    │  │  - compliance     │  │
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │  Tenant Context   │  │
                    │  │  (Row-Level)      │  │
                    │  └───────────────────┘  │
                    └─────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   DataFlow (Multi-Tenant)│
                    │                          │
                    │  All queries filtered by │
                    │  tenant_id automatically │
                    └─────────────────────────┘
```

### 6.2 Data Encryption

| Layer | Encryption | Key Management |
|-------|------------|----------------|
| **In Transit** | TLS 1.3 | AWS ACM / Let's Encrypt |
| **At Rest** | AES-256 | AWS KMS / Vault |
| **API Keys** | AES-256-GCM | DataFlow encryption feature |
| **Secrets** | Environment variables | Docker secrets / K8s secrets |

---

## 7. Deployment Architecture

### 7.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://arc:arc@db:5432/arc
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./src/arc:/app/src/arc

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=arc
      - POSTGRES_PASSWORD=arc
      - POSTGRES_DB=arc
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000

volumes:
  postgres_data:
  redis_data:
```

### 7.2 Kubernetes (Production)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arc-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arc-api
  template:
    metadata:
      labels:
        app: arc-api
    spec:
      containers:
      - name: api
        image: arc/api:latest
        ports:
        - containerPort: 8000
        - containerPort: 3001
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
          requests:
            memory: "512Mi"
            cpu: "250m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arc-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 8. Development Workflow

### 8.1 Branch Strategy

```
main                    Production-ready code
  │
  ├── staging           Pre-production testing
  │
  ├── develop           Integration branch
  │     │
  │     ├── feature/analytics-ratios
  │     ├── feature/ai-market-brief
  │     └── feature/mobile-dashboard
  │
  └── hotfix/           Emergency fixes
```

### 8.2 Environment Configuration

```python
# src/arc/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str
    redis_url: str

    # API
    api_port: int = 8000
    mcp_port: int = 3001

    # Data Providers
    eodhd_api_key: str
    capitaliq_api_key: Optional[str] = None
    pitchbook_api_key: Optional[str] = None

    # AI
    openai_api_key: str
    anthropic_api_key: Optional[str] = None

    # Auth
    auth_provider: str = "oauth2"
    jwt_secret: str
    oauth_client_id: str
    oauth_client_secret: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

---

## 9. Phase Implementation

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1** | Months 1-3 | Core models, EODHD sync, basic dashboard |
| **Phase 2** | Months 4-6 | Ratio analysis, alerts, benchmarking |
| **Phase 3** | Months 7-9 | AI intelligence, NL queries, optimization |
| **Phase 4** | Months 10-12 | Private companies, mobile app, collaboration |

---

## 10. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL | Multi-tenant, JSON support, mature |
| **API Framework** | Nexus (FastAPI) | Multi-channel, async-first |
| **AI Framework** | Kaizen | Signature-based, multi-agent |
| **Frontend** | React + Flutter | Web reach + mobile native |
| **Cache** | Redis | Session, rate limiting, pub/sub |
| **Vector DB** | pgvector | Simplicity (extension of PostgreSQL) |
| **Container** | Docker + Kubernetes | Standard, scalable |
