# TODO-WEB-001: React Project Initialization

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 4h
**Dependencies**: None

---

## Objective

Initialize the React web frontend project with proper structure, dependencies, and configuration for the ARC investment platform.

---

## Tasks

### 1. Project Setup
- [ ] Initialize project with Vite + React + TypeScript
  ```bash
  npm create vite@latest arc-web -- --template react-ts
  ```
- [ ] Configure `vite.config.ts`:
  - Path aliases (@/ for src)
  - Environment variable handling
  - Build optimization

### 2. Dependencies Installation
- [ ] Add core dependencies:
  ```bash
  npm install @tanstack/react-query axios react-router-dom zustand
  ```
- [ ] Add UI dependencies:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Add chart dependencies:
  ```bash
  npm install recharts
  ```
- [ ] Add utility dependencies:
  ```bash
  npm install date-fns decimal.js clsx tailwind-merge
  ```
- [ ] Add dev dependencies:
  ```bash
  npm install -D @types/node vitest @testing-library/react
  ```

### 3. Directory Structure
- [ ] Create directory structure:
  ```
  src/
  ├── main.tsx
  ├── App.tsx
  ├── lib/
  │   ├── api/
  │   ├── hooks/
  │   └── utils/
  ├── components/
  │   ├── ui/
  │   ├── layout/
  │   ├── data/
  │   ├── charts/
  │   └── intelligence/
  ├── pages/
  │   ├── dashboard/
  │   ├── portfolios/
  │   ├── analytics/
  │   ├── intelligence/
  │   ├── settings/
  │   └── auth/
  ├── stores/
  └── types/
  ```

### 4. Tailwind Configuration
- [ ] Configure `tailwind.config.js` with design tokens:
  - Color palette from design system
  - Typography scale
  - Spacing scale
  - Shadow definitions
- [ ] Set up CSS variables for theming
- [ ] Configure dark mode (class strategy)

### 5. TypeScript Configuration
- [ ] Configure `tsconfig.json`:
  - Strict mode enabled
  - Path aliases
  - ESNext target
- [ ] Create base type definitions in `types/`

### 6. React Router Setup
- [ ] Configure `react-router-dom`:
  - Route definitions
  - Layout routes
  - Protected route wrapper
  - Error boundary routes

### 7. TanStack Query Setup
- [ ] Configure `QueryClient`:
  - Default stale time
  - Retry configuration
  - Error handling
- [ ] Create `QueryClientProvider` wrapper

### 8. Environment Configuration
- [ ] Create `.env.example`:
  ```
  VITE_API_URL=http://localhost:8000
  VITE_APP_NAME=ARC
  ```
- [ ] Set up environment type definitions

---

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] TypeScript compiles without errors
- [ ] Tailwind CSS working with design tokens
- [ ] Shadcn UI components installable
- [ ] React Router navigation working
- [ ] TanStack Query provider configured
- [ ] Path aliases resolving correctly
- [ ] Unit test: Component renders

---

## File Structure After Completion

```
arc-web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── cn.ts
│   ├── components/
│   │   └── ui/           # Shadcn components
│   ├── pages/
│   │   └── index.tsx
│   ├── stores/
│   │   └── auth.ts
│   └── types/
│       └── index.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

---

## Technical Notes

- Use Vite for fast development builds
- Shadcn UI for consistent component library
- TanStack Query for server state management
- Zustand for client state (auth, preferences)
- Follow design system tokens strictly
