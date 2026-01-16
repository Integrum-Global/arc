# System Architecture

## Overview
The Arc Invest Platform is built on a unified "Nexus" architecture, deploying workflows as API, CLI, and MCP simultaneously.

## Monorepo Structure
We use a git-worktree based monorepo simulation:

```
/
├── src/                # Backend (Nexus Platform) - [arc-backend worktree]
│   ├── app.py          # Entry point
│   ├── models/         # DataFlow models
│   ├── agents/         # Kaizen agents
│   └── workflows/      # Core SDK workflows
├── apps/
│   ├── web/            # Next.js 15 Frontend - [arc-web worktree]
│   └── mobile/         # Flutter App - [arc-mobile worktree]
└── docs/               # Documentation
```

## Backend Architecture (Nexus)
- **Framework**: Kailash Nexus
- **Runtime**: AsyncLocalRuntime (Production/Docker)
- **Deployment**:
    - **API**: HTTP JSON endpoints (auto-generated from workflows)
    - **CLI**: Management commands
    - **MCP**: Integration for AI agents

### Key Components
1.  **Gateway**: Nexus instance acting as the unified gateway.
2.  **Database**: Kailash DataFlow (PostgreSQL) for zero-config CRUD.
3.  **Agents**: Kailash Kaizen agents for intelligent operations.

## Integration Patterns
- **Frontend -> Backend**: Http JSON API (Nexus auto-generated routes).
- **Mobile -> Backend**: Http JSON API.
- **Agent -> Agent**: Google A2A Protocol.
