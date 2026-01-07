# TODO-WEB-002: Design System Implementation

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-WEB-001

---

## Objective

Implement the unified design system in React, establishing design tokens, theme support, and base component styling.

---

## Tasks

### 1. Design Token Configuration
- [ ] Create `src/lib/theme.ts`:
  ```typescript
  export const colors = {
    primary: {
      50: '#E6F0FF',
      100: '#B3D1FF',
      500: '#3B82F6',  // Main
      600: '#2563EB',
      700: '#1D4ED8',
    },
    success: {
      500: '#10B981',
      600: '#059669',
    },
    warning: {
      500: '#F59E0B',
      600: '#D97706',
    },
    danger: {
      500: '#EF4444',
      600: '#DC2626',
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      500: '#6B7280',
      800: '#1F2937',
      900: '#111827',
    },
  };
  ```

### 2. Tailwind Theme Extension
- [ ] Update `tailwind.config.js`:
  ```javascript
  theme: {
    extend: {
      colors: {
        primary: {...},
        success: {...},
        // Financial-specific
        positive: '#10B981',
        negative: '#EF4444',
        'positive-bg': '#ECFDF5',
        'negative-bg': '#FEF2F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  }
  ```

### 3. CSS Custom Properties
- [ ] Create `src/styles/variables.css`:
  ```css
  :root {
    --color-primary: #3B82F6;
    --color-text: #111827;
    --color-bg: #FFFFFF;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
  }

  .dark {
    --color-text: #F9FAFB;
    --color-bg: #111827;
  }
  ```

### 4. Typography System
- [ ] Create `src/components/ui/typography.tsx`:
  ```typescript
  export const H1 = ({ children }) => (
    <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>
  );
  export const H2 = ({ children }) => (
    <h2 className="text-2xl font-semibold">{children}</h2>
  );
  // Body, Small, Label variants
  ```

### 5. Financial Data Styling
- [ ] Create `src/lib/utils/formatters.ts`:
  ```typescript
  export function formatCurrency(value: number, currency = 'USD'): string;
  export function formatPercent(value: number, decimals = 2): string;
  export function formatRatio(value: number): string;
  export function getValueColor(value: number): 'positive' | 'negative' | 'neutral';
  ```
- [ ] Create `src/components/ui/value-display.tsx`:
  - ColoredValue component with trend indicators
  - Currency display with proper formatting
  - Percentage display with +/- signs

### 6. Shadcn UI Customization
- [ ] Install base Shadcn components:
  ```bash
  npx shadcn-ui@latest add button card input select
  npx shadcn-ui@latest add table badge avatar dropdown-menu
  npx shadcn-ui@latest add dialog sheet tabs toast
  ```
- [ ] Customize component styles to match design system

### 7. Dark Mode Support
- [ ] Create `src/stores/preferences.ts`:
  ```typescript
  interface PreferencesState {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: string) => void;
  }
  ```
- [ ] Implement theme toggle component
- [ ] Add system preference detection

### 8. Icon System
- [ ] Install Lucide React icons
- [ ] Create icon wrapper component
- [ ] Define financial-specific icon mapping

---

## Acceptance Criteria

- [ ] All design tokens defined in Tailwind config
- [ ] Typography components match design system
- [ ] Color system with semantic names
- [ ] Dark mode toggle working
- [ ] Financial value formatting correct
- [ ] Shadcn components customized
- [ ] Unit test: Value formatting
- [ ] Unit test: Theme switching

---

## Color Usage Guide

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Primary action | primary-500 | primary-400 |
| Positive value | success-600 | success-400 |
| Negative value | danger-600 | danger-400 |
| Background | white | neutral-900 |
| Text primary | neutral-900 | neutral-50 |
| Text secondary | neutral-600 | neutral-400 |
| Border | neutral-200 | neutral-700 |

---

## Typography Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 36px | 600 | 1.2 | Page titles |
| H1 | 30px | 600 | 1.3 | Section headers |
| H2 | 24px | 600 | 1.4 | Card titles |
| H3 | 20px | 500 | 1.4 | Subsections |
| Body | 16px | 400 | 1.5 | Default text |
| Small | 14px | 400 | 1.5 | Secondary text |
| Caption | 12px | 400 | 1.4 | Labels, hints |
| Mono | 14px | 400 | 1.4 | Numbers, code |

---

## Technical Notes

- Use CSS custom properties for runtime theming
- Tailwind for utility classes
- Shadcn for component primitives
- Keep design tokens in sync with Flutter (mobile)
