# Setup & Implementation Plan

> [!NOTE]
> This plan has been revised based on Specialist Personas (Nexus, DataFlow, Kaizen, React) and Design Documents in `docs/03-design/`.

## 1. Project Structure (Worktrees)
We are executing in parallel worktrees:
-   **Backend**: `../arc-backend` (Branch: `backend`) -> Focus: Nexus Platform (src/)
-   **Web**: `../arc-web` (Branch: `web`) -> Focus: Next.js Frontend (apps/web/)
-   **Mobile**: `../arc-mobile` (Branch: `mobile`) -> Focus: Flutter App (apps/mobile/)

## 2. Design References
Detailed specifications are now available:
-   [System Architecture](../03-design/01-system-architecture.md)
-   [Database Schema](../03-design/02-database-design.md)
-   [Agent Design](../03-design/03-agent-design.md)
-   [Frontend Design](../03-design/04-frontend-design.md)

## 3. Implementation Phases

### Phase 1: Foundation (Backend)
-   Initialize Nexus Platform in `src/`.
-   Setup DataFlow models (`User`, `Portfolio`) in `src/models/`.
-   Verify API generation.

### Phase 2: Frontend Implementation (Parallel)
-   **Web**: Initialize Next.js 15 app. Setup Nexus Client. Build Auth & Dashboard.
-   **Mobile**: Initialize Flutter app. Setup API Client. Build Home Screen.

### Phase 3: Agent Integration
-   Implement Kaizen agents in `src/agents/`.
-   Expose Agent capabilities via Nexus MCP.
