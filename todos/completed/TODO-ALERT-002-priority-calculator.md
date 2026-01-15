# TODO-ALERT-002: Implement Alert Priority Calculation Utility

**Status**: COMPLETED
**Priority**: HIGH (Phase 1 - Foundation)
**Est. Effort**: 2 hours

## Description

Implement the alert priority calculation algorithm that determines alert tier (1/2/3), score (0-100), and display channels based on severity, type, age, and other factors.

## Reference Documentation

- **Plan**: `/docs/02-plans/09-alert-strategy/01-architecture.md` (Section 3: Priority Calculation Algorithm)
- **Formula**: Severity (base) + Time Decay + Impact Boost + Portfolio Value Factor - Acknowledgement Penalty

## Acceptance Criteria

- [x] Create `/apps/web/src/lib/alertPriority.ts` utility
- [x] Implement `calculateAlertPriority()` function
- [x] Base score from severity: critical=90, high=70, medium=50, low=20
- [x] Time decay: -0.5 points per hour (max -20)
- [x] Impact boost: +2 points per % impact (max +15)
- [x] Portfolio value factor: +5 for portfolios >$10M
- [x] Acknowledgement penalty: -30 points
- [x] Tier determination: ≥80 = Tier 1, ≥40 = Tier 2, <40 = Tier 3
- [x] Display channel mapping based on tier

## Dependencies

- None (pure function)

## Files to Create

- `/apps/web/src/lib/alertPriority.ts`

## Testing Requirements

### Unit Tests (`src/lib/__tests__/alertPriority.test.ts`)

- [x] Test critical severity returns Tier 1
- [x] Test high severity returns Tier 2
- [x] Test medium severity returns Tier 2
- [x] Test low severity returns Tier 3
- [x] Test time decay reduces score correctly
- [x] Test 3-hour-old critical alert still Tier 1
- [x] Test 12-hour-old high alert drops to Tier 3
- [x] Test impact percentage boosts score
- [x] Test portfolio value boost works
- [x] Test acknowledged alert reduces priority
- [x] Test acknowledged critical alert drops to Tier 2
- [x] Test score clamping (0-100 bounds)
- [x] Test display channels match tier

## Implementation Notes

```typescript
// Expected behavior examples:
// - New critical alert: score ~90, Tier 1, channels: banner+toast+sound+badge+widget+center
// - 2h old high alert: score ~69, Tier 2, channels: badge+widget+center
// - 5h old medium alert: score ~47, Tier 2, channels: badge+widget+center
// - Acknowledged critical: score ~60, Tier 2, channels: badge+widget+center
// - 8h old low alert: score ~16, Tier 3, channels: center only
```

## Risk Assessment

- **LOW**: Pure function, well-defined algorithm
- **MEDIUM**: Edge cases around tier boundaries (score = 40 or 80)

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests passing with 100% coverage (45 tests, all passing)
- [x] Edge cases tested (boundary scores at 40 and 80)
- [x] Function documented with JSDoc
- [x] TypeScript types exported (AlertPriorityInput, AlertPriorityOutput)
- [x] Performance: <1ms per calculation (verified in tests)
