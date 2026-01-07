# TODO-WEB-003: Layout Components

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-WEB-002

---

## Objective

Implement the layout components for the ARC web application including page container, sidebar navigation, header, and responsive grid system.

---

## Tasks

### 1. Page Container Component
- [ ] Create `src/components/layout/PageContainer.tsx`:
  ```typescript
  interface PageContainerProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    error?: Error;
  }
  ```
- [ ] Implement layout structure:
  - Header area with title and actions
  - Scrollable content area
  - Loading skeleton support
  - Error boundary display

### 2. Sidebar Navigation
- [ ] Create `src/components/layout/Sidebar.tsx`:
  ```typescript
  interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
  }
  ```
- [ ] Implement navigation items:
  - Dashboard
  - Portfolios
  - Analytics
  - Intelligence
  - Settings
- [ ] Active state indication
- [ ] Collapsible support (icons only)
- [ ] Mobile drawer variant

### 3. Header Component
- [ ] Create `src/components/layout/Header.tsx`:
  ```typescript
  interface HeaderProps {
    onMenuToggle?: () => void;
    showSearch?: boolean;
  }
  ```
- [ ] Implement features:
  - Logo/brand
  - Global search
  - Notifications dropdown
  - User profile menu
  - Theme toggle

### 4. App Shell
- [ ] Create `src/components/layout/AppShell.tsx`:
  - Combines Sidebar + Header + Content
  - Handles responsive behavior
  - Manages sidebar state
- [ ] Create route layout wrapper

### 5. Grid System
- [ ] Create `src/components/layout/Grid.tsx`:
  ```typescript
  interface GridProps {
    cols?: 1 | 2 | 3 | 4 | 6 | 12;
    gap?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
  }

  interface GridItemProps {
    span?: number;
    children: React.ReactNode;
  }
  ```
- [ ] Responsive breakpoints:
  - Mobile: 1 column
  - Tablet: 2-3 columns
  - Desktop: 4-6 columns

### 6. Section Component
- [ ] Create `src/components/layout/Section.tsx`:
  ```typescript
  interface SectionProps {
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
  }
  ```

### 7. Responsive Utilities
- [ ] Create responsive hook:
  ```typescript
  function useBreakpoint(): 'mobile' | 'tablet' | 'desktop';
  function useIsMobile(): boolean;
  ```
- [ ] Create `<Show when="desktop">` component

### 8. Breadcrumb Component
- [ ] Create `src/components/layout/Breadcrumb.tsx`
- [ ] Auto-generate from route

---

## Acceptance Criteria

- [ ] PageContainer with title, actions, loading states
- [ ] Sidebar with navigation items and collapse
- [ ] Header with search, notifications, user menu
- [ ] AppShell combining all layouts
- [ ] Responsive grid system
- [ ] Collapsible sections
- [ ] Mobile-friendly responsive behavior
- [ ] Unit test: Layout rendering
- [ ] Integration test: Navigation

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                          [🔔] [👤]  │
├────────┬────────────────────────────────────────────────────┤
│        │  PageContainer                                     │
│  Side  │  ┌─────────────────────────────────────────────┐  │
│  bar   │  │ Title                          [Actions]    │  │
│        │  ├─────────────────────────────────────────────┤  │
│  [🏠]  │  │                                             │  │
│  [📊]  │  │  Content Area                               │  │
│  [📈]  │  │                                             │  │
│  [🤖]  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │
│  [⚙️]  │  │  │ Card 1  │ │ Card 2  │ │ Card 3  │       │  │
│        │  │  └─────────┘ └─────────┘ └─────────┘       │  │
│        │  │                                             │  │
│        │  └─────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Sidebar | Columns |
|------------|-------|---------|---------|
| Mobile | < 640px | Hidden (drawer) | 1 |
| Tablet | 640-1024px | Collapsed | 2 |
| Desktop | > 1024px | Expanded | 3-4 |

---

## Technical Notes

- Use Tailwind responsive prefixes (sm:, md:, lg:)
- Sidebar state persisted in localStorage
- Mobile uses slide-out drawer
- Header stays fixed on scroll
- Content area handles overflow scroll
