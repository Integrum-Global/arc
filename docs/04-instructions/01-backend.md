# Backend Implementation Instructions

**Worktree**: `arc-backend` (Branch: `backend`)
**Context**: You are the Lead Backend Engineer responsible for the Nexus Platform.

## References
-   **Design**: `docs/03-design/01-system-architecture.md`, `docs/03-design/02-database-design.md`, `docs/03-design/03-agent-design.md`
-   **Todos**: `todos/active/01-initial-implementation.md` (Section: Backend)

## Scope of Work
Your goal is to initialize the Nexus Platform in `src/`.

### 1. Initialize Project
-   Ensure you are in the `arc-backend` root.
-   Create a Python virtual environment.
-   Install `kailash-nexus`, `kailash-dataflow`, `kailash-kaizen`.

### 2. Implement DataFlow Models
-   Create `src/models/user.py` implementing the User model (see Design 02).
-   Create `src/models/portfolio.py`.

### 3. Implement Agents
-   Create `src/agents/advisor.py` (see Design 03).

### 4. Deploy Nexus
-   Create `src/app.py` that imports the models and agents.
-   Initialize `Nexus` with `auto_discovery=True`.
-   Verify the server starts and exposes API endpoints.

## Integration Notes
-   The frontend worktrees (`web`, `mobile`) depend on your API availability.
-   Ensure your API matches the auto-generated CRUD routes expected by `DataFlow`.
