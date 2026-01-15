# ARC Web Frontend - Developer Guide

This guide provides comprehensive documentation for developers working on the ARC Investment Platform web frontend.

## Table of Contents

1. [Getting Started](./01-getting-started.md)
2. [Project Structure](./02-project-structure.md)
3. [Component Library](./03-components.md)
4. [State Management](./04-state-management.md)
5. [API Integration](./05-api-integration.md)
6. [Styling Guide](./06-styling.md)
7. [Testing](./07-testing.md)
8. [Alert System](./08-alert-system/README.md) - Real-time notification infrastructure

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Run tests
npm run test
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS 4.x |
| Components | Shadcn/ui |
| State (Server) | TanStack React Query v5 |
| State (Client) | Zustand |
| Charts | Recharts |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |

## Key Conventions

1. **File Naming**: kebab-case for files, PascalCase for components
2. **Imports**: Use absolute imports with `@/` prefix
3. **Components**: "use client" directive for interactive components
4. **Types**: Define in adjacent `.types.ts` files or inline

## Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```
