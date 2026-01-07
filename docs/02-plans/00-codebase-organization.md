# ARC Codebase Organization

## Overview

This document defines the codebase organization for the ARC investment management platform, designed for 3 parallel git worktrees.

---

## 1. Worktree Structure

### 1.1 Three Parallel Worktrees

| Worktree | Local Directory | Branch | Purpose |
|----------|-----------------|--------|---------|
| **arc-backend** | `arc-backend/` | `backend` | Python: DataFlow + Workflows + Services + Nexus + Kaizen |
| **arc-web** | `arc-web/` | `web` | React: Web frontend consuming Nexus API |
| **arc-mobile** | `arc-mobile/` | `mobile` | Flutter: Mobile app consuming Nexus API |

### 1.2 Setup Commands

```bash
# Create worktrees from main repo
git worktree add ../arc-backend backend
git worktree add ../arc-web web
git worktree add ../arc-mobile mobile
```

---

## 2. Backend Worktree Structure

**Branch**: `backend`
**Technology**: Python 3.11+, Kailash SDK (DataFlow, Nexus, Kaizen)

```
arc-backend/
├── src/
│   └── arc/                      # Main Python package
│       ├── __init__.py
│       │
│       ├── models/               # DataFlow models (database layer)
│       │   ├── __init__.py
│       │   ├── database.py       # DataFlow initialization
│       │   ├── user.py           # Tenant, User, Preferences
│       │   ├── portfolio.py      # Portfolio, Holding, Transaction
│       │   ├── security.py       # Security, PriceHistory, Fundamentals
│       │   ├── analytics.py      # SecurityRatio, Alert, Threshold
│       │   ├── integration.py    # DataProviderConnection, SyncJob
│       │   └── collaboration.py  # Workspace, Annotation, Approval
│       │
│       ├── workflows/            # Kailash SDK workflows
│       │   ├── __init__.py
│       │   ├── sync/             # Data sync workflows
│       │   │   ├── eodhd.py      # EODHD price sync
│       │   │   ├── capital_iq.py # Capital IQ fundamentals
│       │   │   └── pitchbook.py  # Pitchbook private companies
│       │   ├── analytics/        # Analytics workflows
│       │   │   ├── ratios.py     # Financial ratio calculation
│       │   │   ├── alerts.py     # Threshold alerting
│       │   │   └── benchmark.py  # Peer benchmarking
│       │   └── portfolio/        # Portfolio workflows
│       │       ├── nav.py        # NAV calculation
│       │       └── health.py     # Portfolio health scan
│       │
│       ├── services/             # Business services
│       │   ├── __init__.py
│       │   ├── base.py           # BaseService
│       │   ├── portfolio.py      # PortfolioService
│       │   ├── analytics.py      # AnalyticsService
│       │   ├── intelligence.py   # IntelligenceService
│       │   ├── integration.py    # IntegrationService
│       │   └── user.py           # UserService
│       │
│       ├── agents/               # Kaizen AI agents
│       │   ├── __init__.py
│       │   ├── base.py           # ARCBaseAgent
│       │   ├── memory.py         # SharedMemoryPool setup
│       │   ├── market_intelligence.py
│       │   ├── portfolio_query.py
│       │   ├── financial_analyst.py
│       │   └── investment_committee.py
│       │
│       ├── api/                  # Nexus gateway
│       │   ├── __init__.py
│       │   ├── app.py            # Main Nexus application
│       │   ├── auth/             # Authentication
│       │   │   ├── __init__.py
│       │   │   ├── oauth.py
│       │   │   ├── jwt.py
│       │   │   └── rbac.py
│       │   ├── middleware/       # Custom middleware
│       │   │   ├── __init__.py
│       │   │   ├── tenant.py
│       │   │   └── audit.py
│       │   └── routes/           # Custom routes (beyond Nexus auto)
│       │       ├── __init__.py
│       │       ├── auth.py
│       │       └── webhooks.py
│       │
│       ├── integrations/         # External provider clients
│       │   ├── __init__.py
│       │   ├── eodhd/
│       │   │   ├── __init__.py
│       │   │   └── client.py
│       │   ├── capital_iq/
│       │   │   ├── __init__.py
│       │   │   └── client.py
│       │   ├── pitchbook/
│       │   │   ├── __init__.py
│       │   │   └── client.py
│       │   └── notifications/
│       │       ├── __init__.py
│       │       ├── email.py
│       │       ├── push.py
│       │       └── slack.py
│       │
│       ├── workers/              # Background workers
│       │   ├── __init__.py
│       │   ├── main.py           # Worker entrypoint
│       │   ├── scheduler.py      # Task scheduler
│       │   └── tasks.py          # Background tasks
│       │
│       └── core/                 # Shared utilities
│           ├── __init__.py
│           ├── config.py         # Settings/configuration
│           ├── exceptions.py     # Custom exceptions
│           └── constants.py      # Application constants
│
├── tests/                        # Test suite (3-tier)
│   ├── conftest.py
│   ├── unit/                     # Tier 1: Mocking allowed
│   │   ├── services/
│   │   ├── utils/
│   │   └── agents/
│   ├── integration/              # Tier 2: NO MOCKING
│   │   ├── conftest.py           # Real DB fixtures
│   │   ├── models/
│   │   ├── workflows/
│   │   └── api/
│   └── e2e/                      # Tier 3: NO MOCKING
│       └── workflows/
│
├── scripts/
│   ├── seed_data.py
│   └── migrate.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── docker-compose.yml
│
├── k8s/
│   ├── base/
│   └── overlays/
│
├── pyproject.toml
├── poetry.lock
├── .env.example
└── README.md
```

---

## 3. Web Worktree Structure

**Branch**: `web`
**Technology**: React 18+, TypeScript, Vite, TanStack Query, Shadcn UI

```
arc-web/
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component
│   │
│   ├── lib/                      # Utilities
│   │   ├── api/                  # API client
│   │   │   ├── client.ts         # Axios/fetch wrapper
│   │   │   ├── types.ts          # API types
│   │   │   └── endpoints.ts      # Endpoint definitions
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── usePortfolios.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useIntelligence.ts
│   │   ├── utils/                # Helper functions
│   │   │   ├── formatters.ts
│   │   │   ├── calculations.ts
│   │   │   └── validators.ts
│   │   └── theme.ts              # Theme configuration
│   │
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── PageContainer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Grid.tsx
│   │   ├── data/                 # Data display components
│   │   │   ├── StatCard.tsx
│   │   │   ├── RatioCard.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── HoldingRow.tsx
│   │   ├── charts/               # Chart components
│   │   │   ├── AllocationChart.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── RatioTrendChart.tsx
│   │   └── intelligence/         # AI components
│   │       ├── ChatMessage.tsx
│   │       ├── QueryInput.tsx
│   │       └── MarketBriefCard.tsx
│   │
│   ├── pages/                    # Page components
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   ├── portfolios/
│   │   │   ├── index.tsx
│   │   │   ├── [id]/
│   │   │   └── components/
│   │   ├── analytics/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   ├── intelligence/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   ├── settings/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   └── auth/
│   │       ├── login.tsx
│   │       └── callback.tsx
│   │
│   ├── stores/                   # State management
│   │   ├── auth.ts
│   │   └── preferences.ts
│   │
│   └── types/                    # TypeScript types
│       ├── portfolio.ts
│       ├── security.ts
│       ├── analytics.ts
│       └── api.ts
│
├── public/
│   └── assets/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 4. Mobile Worktree Structure

**Branch**: `mobile`
**Technology**: Flutter 3.27+, Dart, Riverpod, Go Router

```
arc-mobile/
├── lib/
│   ├── main.dart                 # Entry point
│   │
│   ├── core/                     # Core utilities
│   │   ├── config/
│   │   │   ├── app_config.dart
│   │   │   └── environment.dart
│   │   ├── design/               # Design system
│   │   │   ├── colors.dart
│   │   │   ├── typography.dart
│   │   │   ├── spacing.dart
│   │   │   └── shadows.dart
│   │   ├── routing/
│   │   │   ├── router.dart
│   │   │   └── routes.dart
│   │   └── utils/
│   │       ├── formatters.dart
│   │       └── validators.dart
│   │
│   ├── data/                     # Data layer
│   │   ├── api/
│   │   │   ├── api_client.dart
│   │   │   ├── endpoints.dart
│   │   │   └── interceptors/
│   │   ├── models/
│   │   │   ├── portfolio.dart
│   │   │   ├── security.dart
│   │   │   ├── analytics.dart
│   │   │   └── user.dart
│   │   ├── repositories/
│   │   │   ├── portfolio_repository.dart
│   │   │   ├── analytics_repository.dart
│   │   │   └── intelligence_repository.dart
│   │   └── providers/
│   │       ├── portfolio_providers.dart
│   │       ├── analytics_providers.dart
│   │       └── auth_providers.dart
│   │
│   ├── presentation/             # UI layer
│   │   ├── widgets/              # Reusable widgets
│   │   │   ├── common/
│   │   │   │   ├── app_button.dart
│   │   │   │   ├── app_card.dart
│   │   │   │   └── app_input.dart
│   │   │   ├── data/
│   │   │   │   ├── stat_card.dart
│   │   │   │   ├── ratio_card.dart
│   │   │   │   └── alert_tile.dart
│   │   │   ├── charts/
│   │   │   │   ├── allocation_pie_chart.dart
│   │   │   │   └── trend_sparkline.dart
│   │   │   └── intelligence/
│   │   │       ├── chat_bubble.dart
│   │   │       └── voice_input_button.dart
│   │   │
│   │   └── pages/                # Screen pages
│   │       ├── dashboard/
│   │       │   ├── dashboard_page.dart
│   │       │   └── widgets/
│   │       ├── portfolio/
│   │       │   ├── portfolio_list_page.dart
│   │       │   ├── portfolio_detail_page.dart
│   │       │   └── widgets/
│   │       ├── analytics/
│   │       │   ├── analytics_page.dart
│   │       │   └── widgets/
│   │       ├── intelligence/
│   │       │   ├── intelligence_page.dart
│   │       │   └── widgets/
│   │       └── settings/
│   │           ├── settings_page.dart
│   │           └── widgets/
│   │
│   └── services/                 # Business services
│       ├── auth_service.dart
│       └── notification_service.dart
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── ios/
├── android/
│
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## 5. Shared Resources

### 5.1 Design System

The design system in `docs/03-design/` is the canonical reference for both frontends:

| Document | Purpose |
|----------|---------|
| `00-unified-design-system.md` | Full specification |
| `01-design-tokens-quick-reference.md` | Developer quick reference |
| `02-financial-data-patterns.md` | Financial-specific patterns |

### 5.2 API Contract

The backend's Nexus gateway defines the API contract consumed by both frontends:

- OpenAPI spec generated at `/openapi.json`
- TypeScript types can be generated from OpenAPI
- Dart types can be generated from OpenAPI

### 5.3 Documentation

| Location | Content |
|----------|---------|
| `docs/01-analysis/` | Business analysis, USPs, AAA framework |
| `docs/02-plans/` | Implementation plans |
| `docs/03-design/` | Design system |

---

## 6. Development Workflow

### 6.1 Independent Development

Each worktree can be developed independently:

```bash
# Backend development
cd arc-backend
poetry install
poetry run uvicorn arc.api.app:app --reload

# Web development
cd arc-web
npm install
npm run dev

# Mobile development
cd arc-mobile
flutter pub get
flutter run
```

### 6.2 Integration Points

| Integration | Method |
|-------------|--------|
| Frontend → Backend | REST API via Nexus |
| Mobile → Backend | REST API via Nexus |
| AI Assistants → Backend | MCP via Nexus |

### 6.3 Deployment

| Component | Deployment Target |
|-----------|-------------------|
| Backend | Docker/Kubernetes |
| Web | Static hosting (Vercel, Cloudflare) |
| Mobile | App Stores (iOS, Android) |

---

## 7. Key Decisions

### 7.1 Nexus Gateway Location

**Decision**: Nexus lives in `src/arc/api/` within the backend worktree.

**Rationale**:
- Nexus requires direct access to DataFlow models and workflows
- It's a thin orchestration layer, not a separate service
- Single deployment unit for all backend code

### 7.2 Design System Ownership

**Decision**: Single design system in `docs/03-design/`, implemented separately in each frontend.

**Rationale**:
- Consistent visual language across platforms
- Platform-native implementation (React patterns, Flutter patterns)
- Single source of truth for design decisions

### 7.3 API-First Development

**Decision**: Backend API is developed first, frontends consume the API.

**Rationale**:
- Clear contract between teams
- Parallel development enabled
- API can be tested independently
