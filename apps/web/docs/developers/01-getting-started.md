# Getting Started

## Prerequisites

- Node.js 18+
- npm or pnpm
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arc-web/apps/web
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_PROVIDER=local  # or 'oauth'
```

5. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |

## Project Requirements

### TypeScript Configuration

The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

This means:
- All variables must be typed
- Array access can return `undefined` - always add null checks
- Functions must have explicit return types in complex cases

### Handling Strict Types

```typescript
// Array access - always check for undefined
const items = ['a', 'b', 'c'];
const first = items[0]; // Type: string | undefined
if (first) {
  console.log(first); // Type: string
}

// Object property access
const data = payload[0];
if (!data) return null; // Guard against undefined
```

## IDE Setup

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Troubleshooting

### Build Errors

1. **TypeScript errors with array access**: Add null checks
```typescript
// Before (error)
const color = colors[index];

// After (fixed)
const color = colors[index] ?? defaultColor;
```

2. **Module not found**: Check import paths use `@/` prefix
```typescript
// Correct
import { Button } from "@/components/ui/button";

// Incorrect
import { Button } from "../../components/ui/button";
```

3. **Hydration errors**: Ensure client components have "use client" directive
```typescript
"use client";

export function InteractiveComponent() {
  // Component with hooks or event handlers
}
```
