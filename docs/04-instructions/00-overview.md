# ARC Platform - Implementation Instructions Overview

## Worktree Structure

The ARC platform is organized into three worktrees, each focusing on a specific part of the stack:

| Worktree | Path | Stack | Description |
|----------|------|-------|-------------|
| **arc-backend** | `src/arc/` | Python + Kailash SDK | API, Services, Agents, Workflows |
| **arc-web** | `apps/web/` | React + TypeScript | Web dashboard |
| **arc-mobile** | `apps/mobile/` | Flutter + Dart | iOS/Android app |

---

## Instruction Files

| File | Worktree | Purpose |
|------|----------|---------|
| `01-backend-instructions.md` | arc-backend | Backend implementation |
| `02-web-instructions.md` | arc-web | Web frontend implementation |
| `03-mobile-instructions.md` | arc-mobile | Mobile app implementation |

---

## Implementation Order

### Phase 1: Backend Foundation (Required First)
```
arc-backend worktree → TODO-BE-001 through TODO-BE-014
```
The backend must be implemented first as both frontends depend on the API.

### Phase 2: Frontends (Parallel)
```
arc-web worktree → TODO-WEB-001 through TODO-WEB-011
arc-mobile worktree → TODO-MOB-001 through TODO-MOB-010
```
Can be developed in parallel once backend API is available.

### Phase 3: AI Features (Backend)
```
arc-backend worktree → TODO-BE-015 through TODO-BE-020
```
Kaizen agents and intelligence features.

### Phase 4: Integration & Testing
```
All worktrees → TODO-TEST-001 through TODO-TEST-004
DevOps → TODO-OPS-001 through TODO-OPS-003
```

---

## Integration Points

### Backend → Frontend API Contract

**Base URL**: `http://localhost:8000/api` (dev) or `https://api.arc-platform.com` (prod)

**Authentication**: JWT Bearer tokens
```
Authorization: Bearer <token>
```

**Key Endpoints** (from TODO-BE-014):
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/auth/refresh` | POST | Token refresh |
| `/portfolios` | GET/POST | Portfolio CRUD |
| `/portfolios/{id}` | GET/PATCH/DELETE | Single portfolio |
| `/portfolios/{id}/holdings` | GET | Portfolio holdings |
| `/portfolios/{id}/transactions` | GET/POST | Transactions |
| `/analytics/securities/{id}/ratios` | GET | Security ratios |
| `/analytics/alerts` | GET | User alerts |
| `/intelligence/query` | POST | AI query |
| `/intelligence/brief` | GET/POST | Daily brief |

### Shared Design System

Both frontends share the same design tokens (from `docs/03-design/`):
- Color palette (Primary: #1E40AF, Success: #059669, etc.)
- Typography scale (Headings, Body, Captions)
- Spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px)
- Component patterns (Cards, Buttons, Inputs, Charts)

### API Response Format

All API responses follow consistent structure:
```json
{
  "items": [...],           // For list endpoints
  "total": 100,             // Total count
  "page": 1,                // Current page
  "page_size": 20           // Items per page
}
```

Single item responses return the object directly.

---

## Development Workflow

### Starting Development

1. **Clone and setup worktrees**:
```bash
git clone <repo>
cd arc
git worktree add ../arc-backend -b backend
git worktree add ../arc-web -b web
git worktree add ../arc-mobile -b mobile
```

2. **Open each worktree in separate terminal**
3. **Paste the appropriate instruction file** for that worktree

### Syncing Changes

After completing work in any worktree:
```bash
# In any worktree
git add .
git commit -m "Description of changes"
git push

# In other worktrees
git pull
```

### Running Full Stack

Terminal 1 (Backend):
```bash
cd arc-backend
poetry run uvicorn arc.api.app:app --reload --port 8000
```

Terminal 2 (Web):
```bash
cd arc-web/apps/web
npm run dev
```

Terminal 3 (Mobile):
```bash
cd arc-mobile/apps/mobile
flutter run
```

---

## Key References

- **Master TODO List**: `todos/000-master.md`
- **Detailed TODOs**: `todos/active/TODO-*.md`
- **Design System**: `docs/03-design/`
- **Architecture Plans**: `docs/02-plans/`
- **API Specifications**: `docs/02-plans/04-api/`
