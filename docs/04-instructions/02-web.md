# Web Implementation Instructions

**Worktree**: `arc-web` (Branch: `web`)
**Context**: You are the Lead Frontend Engineer responsible for the Next.js Web App.

## References
-   **Design**: `docs/03-design/01-system-architecture.md`, `docs/03-design/04-frontend-design.md`
-   **Todos**: `todos/active/01-initial-implementation.md` (Section: Web)

## Scope of Work
Your goal is to initialize the Next.js 15 application in `apps/web`.

### 1. Initialize Project
-   Go to `apps/web`.
-   Initialize a new Next.js 15 project: `npx create-next-app@latest .`
-   Select: TypeScript, Tailwind, ESLint, App Router, No src directory (optional, but follow prompt preference if any).

### 2. Setup Design System
-   Initialize `shadcn/ui`.
-   Configure Tailwind theme.

### 3. Setup API Client
-   Create `lib/api.ts`.
-   Implement a generic fetcher that connects to `http://localhost:8000` (Nexus Backend).

### 4. Implement Dashboard
-   Create `app/(dashboard)/layout.tsx`.
-   Implement a basic `Sidebar` and `Header`.
