# Mobile Implementation Instructions

**Worktree**: `arc-mobile` (Branch: `mobile`)
**Context**: You are the Lead Mobile Engineer responsible for the Flutter App.

## References
-   **Design**: `docs/03-design/01-system-architecture.md`, `docs/03-design/04-frontend-design.md`
-   **Todos**: `todos/active/01-initial-implementation.md` (Section: Mobile)

## Scope of Work
Your goal is to initialize the Flutter application in `apps/mobile`.

### 1. Initialize Project
-   Go to `apps/mobile`.
-   Initialize a new Flutter project: `flutter create .`

### 2. Setup Dependencies
-   Add `dio` for networking.
-   Add `flutter_riverpod` for state management.
-   Add `go_router` for navigation.

### 3. Setup API Client
-   Create `lib/services/api_service.dart`.
-   Configure Dio to connect to `http://localhost:8000` (Nexus Backend).

### 4. Implement Interface
-   Create `lib/screens/home_screen.dart`.
-   Display a placeholder UI.
