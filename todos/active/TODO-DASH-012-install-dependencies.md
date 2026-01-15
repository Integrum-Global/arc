# TODO-DASH-012: Install dnd-kit Dependencies

**Status**: ACTIVE
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 0.5 hours

## Description

Install required npm packages for drag-and-drop functionality.

## Reference Documentation

- **Plan**: `/docs/02-plans/11-dashboard-customization/01-architecture.md` (Dependencies section)

## Acceptance Criteria

- [ ] Install @dnd-kit/core
- [ ] Install @dnd-kit/sortable
- [ ] Install @dnd-kit/utilities
- [ ] Verify packages in package.json
- [ ] Verify packages in package-lock.json
- [ ] Run npm install successfully
- [ ] Verify TypeScript types available

## Dependencies

- None (foundation task)

## Commands to Run

```bash
cd apps/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Testing Requirements

### Manual Verification
- [ ] Check package.json has entries
- [ ] Check package-lock.json updated
- [ ] Import statement works: `import { DndContext } from '@dnd-kit/core'`
- [ ] No TypeScript errors on import

## Files to Modify

- `/apps/web/package.json`
- `/apps/web/package-lock.json`

## Version Requirements

- @dnd-kit/core: ^6.1.0 or later
- @dnd-kit/sortable: ^8.0.0 or later
- @dnd-kit/utilities: ^3.2.2 or later

## Definition of Done

- [ ] All packages installed
- [ ] No npm errors
- [ ] TypeScript recognizes imports
- [ ] Package versions compatible
