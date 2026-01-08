# ARC Investment Platform - Master Todo List

## Overview

This master list tracks all implementation tasks for the ARC investment management platform across three worktrees:
- **Backend** (arc-backend): Python/Kailash SDK
- **Web** (arc-web): React/TypeScript
- **Mobile** (arc-mobile): Flutter/Dart

---

## Phase 1: Foundation (Backend)

### 1.1 Project Setup
- [x] TODO-BE-001: Backend project initialization (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-001-project-setup.md`
  - **Subtasks** (all completed):
    - [x] TODO-BE-001-01: Project Structure Setup - src/arc/ with 8 subpackages
    - [x] TODO-BE-001-02: Poetry Configuration - pyproject.toml with black, ruff, mypy, pytest
    - [x] TODO-BE-001-03: Core Configuration Module - DatabaseConfig, RedisConfig, APIConfig, ProviderConfig, KaizenConfig, LoggingConfig
    - [x] TODO-BE-001-04: Exception Handling Module - 12 exception classes
    - [x] TODO-BE-001-05: Constants and Enums Module - 15 enums and constants
    - [x] TODO-BE-001-06: Development Setup Scripts - dev_setup.py, migrate.py, seed_data.py
    - [x] TODO-BE-001-07: Core Module Unit Tests - 77 tests passing
  - **Verification**:
    - `uv run pytest tests/unit/core/` - 77 tests pass
    - `uv run ruff check src/arc/ tests/` - All checks pass
    - `uv run black --check src/arc/ tests/` - All formatted

### 1.2 DataFlow Models
- [x] TODO-BE-002: Core domain models (User, Tenant) (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-002-core-models.md`
  - **Models Implemented**: Tenant (tenant_root), User (multi_tenant), UserPreference, NotificationPreference, AuditLog
  - **Tests**: 32 unit tests passing
  - **Verification**: `uv run pytest tests/unit/` - 109 tests pass

- [x] TODO-BE-003: Portfolio domain models (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-002
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-003-portfolio-models.md`
  - **Models Implemented**: Portfolio, Holding, Transaction, PortfolioValuation, CashAccount, Benchmark
  - **Tests**: 41 unit tests passing

- [x] TODO-BE-004: Security domain models (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-002
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-004-security-models.md`
  - **Models Implemented**: Security, PriceHistory, CompanyFundamentals, SecurityRatio, CorporateAction, Dividend
  - **Tests**: 56 unit tests passing

- [x] TODO-BE-005: Analytics domain models (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-003, TODO-BE-004
  - Actual Effort: ~3h
  - File: `todos/completed/TODO-BE-005-analytics-models.md`
  - **Models Implemented**: Alert, AlertThreshold, PeerGroup, Report, Watchlist, WatchlistItem
  - **Tests**: 51 unit tests passing

### 1.3 Kailash Workflows
- [x] TODO-BE-006: Data sync workflows (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-004
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-006-sync-workflows.md`
  - **Components**: EODHD price sync, bulk price sync, fundamentals sync, ratio recalculation workflows
  - **Features**: httpx-based API calls, BulkUpsert with conflict resolution, multi-output nodes
  - **Tests**: 60 unit tests passing
  - **Docs**: `src/arc/docs/developers/09-sync-workflows.md`

- [x] TODO-BE-007: Analytics workflows (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-005
  - Actual Effort: ~8h
  - File: `todos/completed/TODO-BE-007-analytics-workflows.md`
  - **9 workflows**: ratio calculation, valuation/fundamental ratios, threshold alerts, batch alerts, alert cleanup, peer benchmarks, batch peer benchmarks, sector benchmarks
  - **Tests**: 53 unit tests passing
  - **Docs**: `src/arc/docs/developers/10-analytics-workflows.md`

- [x] TODO-BE-008: Portfolio workflows (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-003
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-008-portfolio-workflows.md`
  - **Components**: NAV Calculation, Portfolio Health Scan, Rebalance Analysis workflows
  - **Features**: Multi-currency support, return period calculations, health scoring algorithm, drift analysis
  - **Tests**: 52 unit tests passing
  - **Docs**: `src/arc/docs/developers/11-portfolio-workflows.md`

### 1.4 Services Layer
- [x] TODO-BE-009: Base service and registry (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-002
  - Actual Effort: ~2h
  - File: `todos/completed/TODO-BE-009-base-service.md`
  - **Components**: BaseService, ServiceRegistry, create_services, ServiceError exceptions
  - **Tests**: 28 unit tests passing

- [x] TODO-BE-010: Portfolio service (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-009, TODO-BE-003
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-010-portfolio-service.md`
  - **Components**: Portfolio CRUD, holdings management, transactions, NAV calculation, health scan, analytics
  - **Tests**: 33 unit tests passing

- [x] TODO-BE-011: Analytics service (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-009, TODO-BE-007
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-011-analytics-service.md`
  - **Components**: Ratio calculations (30+ ratios), threshold alerting, alert management, peer groups, benchmarking, trend analysis
  - **Tests**: 60 unit tests passing

### 1.5 Nexus Gateway
- [x] TODO-BE-012: Nexus application setup (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-009
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-012-nexus-setup.md`
  - **Components**: Nexus app, health endpoints, model registry, database functions
  - **Tests**: 43 unit tests passing

- [x] TODO-BE-013: Authentication & authorization (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-012
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-013-auth.md`
  - **Components**: JWT tokens (access/refresh), bcrypt password hashing, RBAC (5 roles, 11 permissions), FastAPI dependencies
  - **Tests**: 65 unit tests passing

- [x] TODO-BE-014: API endpoints implementation (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-012, TODO-BE-010, TODO-BE-011
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-014-api-endpoints.md`
  - **Components**: 47+ endpoints across portfolios, analytics, users, admin
  - **Endpoints**: Portfolio (15), Analytics (20), User (8), Admin (4)
  - **Docs**: `src/arc/docs/developers/07-api-endpoints.md`

---

## Phase 2: AI & Intelligence (Backend)

### 2.1 Kaizen Agents
- [x] TODO-BE-015: Base agent and memory setup (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-009
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-015-base-agent.md`
  - **Components**: ARCBaseAgent, ARCAgentConfig, ARCMemoryPool, ARCAgentRegistry
  - **Features**: Kaizen integration, DataFlow context helpers, multi-tier memory, cost tracking
  - **Tests**: 64 unit tests passing
  - **Docs**: `src/arc/docs/developers/12-agent-infrastructure.md`

- [x] TODO-BE-016: Market Intelligence Agent (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-015
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-016-market-agent.md`
  - **Components**: MarketIntelligenceAgent, MarketBriefSignature, ResearchSignature, streaming support
  - **Features**: Chain-of-thought reasoning, portfolio-aware analysis, SSE streaming, cost tracking
  - **Tests**: 51 unit tests passing
  - **Docs**: `src/arc/docs/developers/13-market-intelligence-agent.md`

- [x] TODO-BE-017: Portfolio Query Agent (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-015
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-017-query-agent.md`
  - **Components**: PortfolioQueryAgent, ClassifyQuerySignature, PortfolioAnswerSignature, QueryType enum
  - **Features**: LLM-based semantic classification (NOT keywords), RAG pattern, confidence scoring, query analytics
  - **Tests**: 50 unit tests passing
  - **Docs**: `src/arc/docs/developers/14-portfolio-query-agent.md`

- [x] TODO-BE-018: Financial Analyst Agent (Priority: MEDIUM) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Dependencies: TODO-BE-015
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-018-analyst-agent.md`
  - **Components**: FinancialAnalystAgent, SecurityAnalysisSignature, AnomalyDetectionSignature, PortfolioHealthSignature
  - **Features**: LLM chain-of-thought analysis, 5-dimension analysis, health score (0-100) with grade (A-F), anomaly detection, peer comparison
  - **Tests**: 60 unit tests passing
  - **Docs**: `src/arc/docs/developers/15-financial-analyst-agent.md`

- [x] TODO-BE-019: Investment Committee Agent (Priority: LOW) **COMPLETED 2026-01-08**
  - Status: COMPLETED
  - Dependencies: TODO-BE-016, TODO-BE-017, TODO-BE-018
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-019-committee-agent.md`
  - **Components**: InvestmentCommitteeAgent, CommitteeSynthesisSignature, Supervisor-Worker orchestration
  - **Features**: Parallel worker execution, LLM chain-of-thought synthesis, consensus/dissent tracking, compliance audit trails
  - **Tests**: 68 unit tests passing
  - **Docs**: `src/arc/docs/developers/16-investment-committee-agent.md`

### 2.2 Intelligence Service
- [x] TODO-BE-020: Intelligence service implementation (Priority: MEDIUM) **COMPLETED 2026-01-08**
  - Status: COMPLETED
  - Dependencies: TODO-BE-016, TODO-BE-017
  - Actual Effort: ~6h
  - File: `todos/completed/TODO-BE-020-intelligence-service.md`
  - **Components**: IntelligenceService, IntelligenceConfig, UsageRecord
  - **Features**: Unified AI interface, usage tracking, tenant limits, caching, streaming
  - **Tests**: 64 unit tests passing
  - **Docs**: `src/arc/docs/developers/17-intelligence-service.md`

---

## Phase 3: Integrations (Backend)

### 3.1 Data Provider Clients
- [x] TODO-BE-021: EODHD client implementation (Priority: HIGH) **COMPLETED 2026-01-07**
  - Status: COMPLETED
  - Actual Effort: ~3h
  - File: `todos/completed/TODO-BE-021-eodhd-client.md`
  - **Components**: EODHDClient, RateLimiter with async support
  - **Features**: Historical prices, real-time quotes, fundamentals, bulk operations, dividends, splits, search
  - **Tests**: 39 unit tests passing
  - **Docs**: `src/arc/docs/developers/08-eodhd-client.md`

- [x] TODO-BE-022: Capital IQ client implementation (Priority: MEDIUM) **COMPLETED 2026-01-08**
  - Status: COMPLETED
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-022-capitaliq-client.md`
  - **Components**: CapitalIQClient, OAuth 2.0 authentication, company profiles, financial statements
  - **Features**: Field mapping to ARC schema, bulk operations, caching, retry logic
  - **Tests**: 62 unit tests passing
  - **Docs**: `src/arc/docs/developers/18-capital-iq-client.md`

- [x] TODO-BE-023: Pitchbook client implementation (Priority: LOW) **COMPLETED 2026-01-08**
  - Status: COMPLETED
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-023-pitchbook-client.md`
  - **Components**: PitchbookClient, PitchbookConfig, SearchFilters, CompanyProfile, FundingRound, Valuation, OwnershipStructure
  - **Features**: Company search, profiles, valuations, funding rounds, ownership, bulk operations, 7-day caching, retry logic
  - **Tests**: 100 unit tests passing
  - **Docs**: `src/arc/docs/developers/20-pitchbook-client.md`

### 3.2 Notifications
- [x] TODO-BE-024: Notification service (Priority: MEDIUM) **COMPLETED 2026-01-08**
  - Status: COMPLETED
  - Dependencies: TODO-BE-002
  - Actual Effort: ~4h
  - File: `todos/completed/TODO-BE-024-notifications.md`
  - **Components**: Notification model, EmailHandler, PushHandler, SlackHandler, InAppHandler, NotificationService
  - **Features**: Multi-channel delivery, user preferences, quiet hours, severity filtering, bulk notifications
  - **Tests**: 173 unit tests passing
  - **Docs**: `src/arc/docs/developers/19-notification-service.md`

---

## Phase 4: Web Frontend

### 4.1 Project Setup
- [ ] TODO-WEB-001: React project initialization (Priority: HIGH)
  - Status: ACTIVE
  - Estimated Effort: 4h
  - File: `todos/active/TODO-WEB-001-project-setup.md`

- [ ] TODO-WEB-002: Design system implementation (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-001
  - Estimated Effort: 8h
  - File: `todos/active/TODO-WEB-002-design-system.md`

### 4.2 Core Components
- [ ] TODO-WEB-003: Layout components (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-002
  - Estimated Effort: 6h
  - File: `todos/active/TODO-WEB-003-layout-components.md`

- [ ] TODO-WEB-004: Data display components (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-002
  - Estimated Effort: 8h
  - File: `todos/active/TODO-WEB-004-data-components.md`

- [ ] TODO-WEB-005: Chart components (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-002
  - Estimated Effort: 8h
  - File: `todos/active/TODO-WEB-005-chart-components.md`

### 4.3 API Integration
- [ ] TODO-WEB-006: API client and hooks (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-001, TODO-BE-014
  - Estimated Effort: 8h
  - File: `todos/active/TODO-WEB-006-api-client.md`

### 4.4 Pages
- [ ] TODO-WEB-007: Dashboard page (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-003, TODO-WEB-004, TODO-WEB-006
  - Estimated Effort: 8h
  - File: `todos/active/TODO-WEB-007-dashboard-page.md`

- [ ] TODO-WEB-008: Portfolio pages (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-003, TODO-WEB-004, TODO-WEB-006
  - Estimated Effort: 12h
  - File: `todos/active/TODO-WEB-008-portfolio-pages.md`

- [ ] TODO-WEB-009: Analytics pages (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-005, TODO-WEB-006
  - Estimated Effort: 10h
  - File: `todos/active/TODO-WEB-009-analytics-pages.md`

- [ ] TODO-WEB-010: Intelligence pages (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-006, TODO-BE-020
  - Estimated Effort: 10h
  - File: `todos/active/TODO-WEB-010-intelligence-pages.md`

- [ ] TODO-WEB-011: Settings pages (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-003, TODO-WEB-006
  - Estimated Effort: 6h
  - File: `todos/active/TODO-WEB-011-settings-pages.md`

---

## Phase 5: Mobile Frontend

### 5.1 Project Setup
- [ ] TODO-MOB-001: Flutter project initialization (Priority: HIGH)
  - Status: ACTIVE
  - Estimated Effort: 4h
  - File: `todos/active/TODO-MOB-001-project-setup.md`

- [ ] TODO-MOB-002: Design system implementation (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-001
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-002-design-system.md`

### 5.2 Core Widgets
- [ ] TODO-MOB-003: Common widgets (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-002
  - Estimated Effort: 6h
  - File: `todos/active/TODO-MOB-003-common-widgets.md`

- [ ] TODO-MOB-004: Data display widgets (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-002
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-004-data-widgets.md`

- [ ] TODO-MOB-005: Chart widgets (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-002
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-005-chart-widgets.md`

### 5.3 API Integration
- [ ] TODO-MOB-006: API client and providers (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-001, TODO-BE-014
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-006-api-client.md`

### 5.4 Pages
- [ ] TODO-MOB-007: Dashboard page (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-003, TODO-MOB-004, TODO-MOB-006
  - Estimated Effort: 6h
  - File: `todos/active/TODO-MOB-007-dashboard-page.md`

- [ ] TODO-MOB-008: Portfolio pages (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-003, TODO-MOB-004, TODO-MOB-006
  - Estimated Effort: 10h
  - File: `todos/active/TODO-MOB-008-portfolio-pages.md`

- [ ] TODO-MOB-009: Analytics page (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-005, TODO-MOB-006
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-009-analytics-page.md`

- [ ] TODO-MOB-010: Intelligence page (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-006, TODO-BE-020
  - Estimated Effort: 8h
  - File: `todos/active/TODO-MOB-010-intelligence-page.md`

---

## Phase 6: DevOps & Testing

### 6.1 DevOps
- [ ] TODO-OPS-001: Docker configuration (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-012
  - Estimated Effort: 6h
  - File: `todos/active/TODO-OPS-001-docker.md`

- [ ] TODO-OPS-002: Kubernetes configuration (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-OPS-001
  - Estimated Effort: 8h
  - File: `todos/active/TODO-OPS-002-kubernetes.md`

- [ ] TODO-OPS-003: CI/CD pipelines (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-OPS-001
  - Estimated Effort: 8h
  - File: `todos/active/TODO-OPS-003-cicd.md`

### 6.2 Testing
- [ ] TODO-TEST-001: Backend unit tests (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-009
  - Estimated Effort: 12h
  - File: `todos/active/TODO-TEST-001-backend-unit.md`

- [ ] TODO-TEST-002: Backend integration tests (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-012
  - Estimated Effort: 16h
  - File: `todos/active/TODO-TEST-002-backend-integration.md`

- [ ] TODO-TEST-003: Web frontend tests (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-WEB-007
  - Estimated Effort: 12h
  - File: `todos/active/TODO-TEST-003-web-tests.md`

- [ ] TODO-TEST-004: Mobile frontend tests (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-MOB-007
  - Estimated Effort: 12h
  - File: `todos/active/TODO-TEST-004-mobile-tests.md`

---

## Summary

| Phase | Component | Todo Count | Completed | Remaining | Priority HIGH |
|-------|-----------|------------|-----------|-----------|---------------|
| 1 | Backend Foundation | 14 | 14 (BE-001 through BE-014) ✅ | 0 | 0 |
| 2 | AI & Intelligence | 6 | 6 (BE-015 through BE-020) ✅ | 0 | 0 |
| 3 | Integrations | 4 | 4 (BE-021 through BE-024) ✅ | 0 | 0 |
| 4 | Web Frontend | 11 | 0 | 11 | 8 |
| 5 | Mobile Frontend | 10 | 0 | 10 | 6 |
| 6 | DevOps & Testing | 7 | 0 | 7 | 4 |
| **Total** | | **52** | **24** | **28** | **18** |

---

## Critical Path

The critical path for MVP delivery:

```
[DONE] TODO-BE-001 → [DONE] TODO-BE-002 → [DONE] TODO-BE-003/004/005 → [DONE] TODO-BE-009 → [DONE] TODO-BE-010 → [DONE] TODO-BE-014
                                                                                    ↓                                    ↓
                                                                             [DONE] TODO-BE-011 ─────────────────────────┘
                                                                             [DONE] TODO-BE-012 → [DONE] TODO-BE-013 ────┘
                                                                                                                          ↓
                                                                                  TODO-WEB-001 → TODO-WEB-007 (Dashboard)
                                                                                  TODO-MOB-001 → TODO-MOB-007 (Dashboard)
```

**Phase 1 Backend Foundation COMPLETE!** ✅ All 14 foundation tasks done (BE-001 through BE-014)

**Phase 2 AI & Intelligence COMPLETE!** ✅ All 6 AI tasks done (BE-015 through BE-020)

**Phase 3 Integrations COMPLETE!** ✅ All 4 integration tasks done (BE-021 through BE-024)

**Next options**:
- TODO-WEB-001 (React project) - Frontend can start now with API ready
- TODO-MOB-001 (Flutter project) - Mobile can start now with API ready

**Minimum for demo**: BE-001 through BE-024 ✅, WEB-001 through WEB-007, MOB-001 through MOB-007

---

## Verification Commands

```bash
# Run all unit tests (1380 passing)
uv run pytest tests/unit/ --tb=short

# Run linting
uv run ruff check src/arc/ tests/

# Run formatting check
uv run black --check src/arc/ tests/
```
