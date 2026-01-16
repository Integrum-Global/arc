# Frontend Design (React/Next.js)

> [!IMPORTANT]
> **React Specialist Directive**: Strict adherence to Next.js 15 App Router and React 19 patterns.

## Architecture (`apps/web`)
- **Framework**: Next.js 15
- **Router**: App Router (`app/` directory)
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**:
    - Server State: TanStack Query (@tanstack/react-query)
    - Global State: Zustand (if needed)

## Folder Structure
```
apps/web/
├── app/
│   ├── (auth)/         # Route group for authentication
│   ├── (dashboard)/    # Protected dashboard routes
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # shadcn primitives
│   └── elements/       # Business-logic components [SPECIALIST RULE]
├── lib/
│   └── api.ts          # Nexus API Client
```

## Key Directives
1.  **One API Call Per Component**: Do not aggregate fetches in parent unless strictly necessary.
2.  **Loading States**: Use Suspense or Skeleton components for all data fetching.
3.  **Nexus Integration**: Use a generated client or simple `fetch` wrapper pointing to the Nexus API URL.

## Mobile Strategy (`apps/mobile`)
- **Framework**: Flutter
- **Architecture**: Feature-first structure.
- **State**: Riverpod.
