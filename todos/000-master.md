# ARC Investment Platform - Master Todo List

## Overview

This master list tracks all implementation tasks for the ARC investment management platform across three worktrees:
- **Backend** (arc-backend): Python/Kailash SDK
- **Web** (arc-web): React/TypeScript
- **Mobile** (arc-mobile): Flutter/Dart

---

## Phase 1: Foundation (Backend)

### 1.1 Project Setup
- [ ] TODO-BE-001: Backend project initialization (Priority: HIGH)
  - Status: ACTIVE
  - Estimated Effort: 4h
  - File: `todos/active/TODO-BE-001-project-setup.md`

### 1.2 DataFlow Models
- [ ] TODO-BE-002: Core domain models (User, Tenant) (Priority: HIGH)
  - Status: ACTIVE
  - Estimated Effort: 4h
  - File: `todos/active/TODO-BE-002-core-models.md`

- [ ] TODO-BE-003: Portfolio domain models (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-002
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-003-portfolio-models.md`

- [ ] TODO-BE-004: Security domain models (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-002
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-004-security-models.md`

- [ ] TODO-BE-005: Analytics domain models (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-003, TODO-BE-004
  - Estimated Effort: 4h
  - File: `todos/active/TODO-BE-005-analytics-models.md`

### 1.3 Kailash Workflows
- [ ] TODO-BE-006: Data sync workflows (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-004
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-006-sync-workflows.md`

- [ ] TODO-BE-007: Analytics workflows (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-005
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-007-analytics-workflows.md`

- [ ] TODO-BE-008: Portfolio workflows (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-003
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-008-portfolio-workflows.md`

### 1.4 Services Layer
- [ ] TODO-BE-009: Base service and registry (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-002
  - Estimated Effort: 4h
  - File: `todos/active/TODO-BE-009-base-service.md`

- [ ] TODO-BE-010: Portfolio service (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-009, TODO-BE-003
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-010-portfolio-service.md`

- [ ] TODO-BE-011: Analytics service (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-009, TODO-BE-007
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-011-analytics-service.md`

### 1.5 Nexus Gateway
- [ ] TODO-BE-012: Nexus application setup (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-009
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-012-nexus-setup.md`

- [ ] TODO-BE-013: Authentication & authorization (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-012
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-013-auth.md`

- [ ] TODO-BE-014: API endpoints implementation (Priority: HIGH)
  - Status: ACTIVE
  - Dependencies: TODO-BE-012, TODO-BE-010, TODO-BE-011
  - Estimated Effort: 12h
  - File: `todos/active/TODO-BE-014-api-endpoints.md`

---

## Phase 2: AI & Intelligence (Backend)

### 2.1 Kaizen Agents
- [ ] TODO-BE-015: Base agent and memory setup (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-009
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-015-base-agent.md`

- [ ] TODO-BE-016: Market Intelligence Agent (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-015
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-016-market-agent.md`

- [ ] TODO-BE-017: Portfolio Query Agent (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-015
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-017-query-agent.md`

- [ ] TODO-BE-018: Financial Analyst Agent (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-015
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-018-analyst-agent.md`

- [ ] TODO-BE-019: Investment Committee Agent (Priority: LOW)
  - Status: ACTIVE
  - Dependencies: TODO-BE-016, TODO-BE-017, TODO-BE-018
  - Estimated Effort: 10h
  - File: `todos/active/TODO-BE-019-committee-agent.md`

### 2.2 Intelligence Service
- [ ] TODO-BE-020: Intelligence service implementation (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-016, TODO-BE-017
  - Estimated Effort: 8h
  - File: `todos/active/TODO-BE-020-intelligence-service.md`

---

## Phase 3: Integrations (Backend)

### 3.1 Data Provider Clients
- [ ] TODO-BE-021: EODHD client implementation (Priority: HIGH)
  - Status: ACTIVE
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-021-eodhd-client.md`

- [ ] TODO-BE-022: Capital IQ client implementation (Priority: MEDIUM)
  - Status: ACTIVE
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-022-capitaliq-client.md`

- [ ] TODO-BE-023: Pitchbook client implementation (Priority: LOW)
  - Status: ACTIVE
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-023-pitchbook-client.md`

### 3.2 Notifications
- [ ] TODO-BE-024: Notification service (Priority: MEDIUM)
  - Status: ACTIVE
  - Dependencies: TODO-BE-002
  - Estimated Effort: 6h
  - File: `todos/active/TODO-BE-024-notifications.md`

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

| Phase | Component | Todo Count | Priority HIGH |
|-------|-----------|------------|---------------|
| 1 | Backend Foundation | 14 | 11 |
| 2 | AI & Intelligence | 6 | 0 |
| 3 | Integrations | 4 | 1 |
| 4 | Web Frontend | 11 | 8 |
| 5 | Mobile Frontend | 10 | 6 |
| 6 | DevOps & Testing | 7 | 4 |
| **Total** | | **52** | **30** |

---

## Critical Path

The critical path for MVP delivery:

```
TODO-BE-001 → TODO-BE-002 → TODO-BE-003/004 → TODO-BE-009 → TODO-BE-012 → TODO-BE-014
                                                                              ↓
                                                            TODO-WEB-001 → TODO-WEB-007 (Dashboard)
                                                            TODO-MOB-001 → TODO-MOB-007 (Dashboard)
```

**Minimum for demo**: BE-001 through BE-014, WEB-001 through WEB-007, MOB-001 through MOB-007
