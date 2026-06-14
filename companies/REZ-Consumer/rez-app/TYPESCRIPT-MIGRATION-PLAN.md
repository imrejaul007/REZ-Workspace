# TypeScript Migration Plan

## Overview
5 large screen files have `@ts-nocheck` disabling TypeScript type checking on250,000+ lines of code.

## Files Requiring TypeScript Fixes

| File | Lines | @ts-nocheck Line | Priority |
|------|-------|------------------|----------|
| [EventPage.tsx](app/EventPage.tsx) | 65,972 | Line 1 | HIGH |
| [BookingsPage.tsx](app/BookingsPage.tsx) | 52,785 | Line 1 | HIGH |
| [StoreListPage.tsx](app/StoreListPage.tsx) | 42,790 | Line 1 | MEDIUM |
| [CardOffersPage.tsx](app/CardOffersPage.tsx) | 39,529 | Line 1 | MEDIUM |
| [Store.tsx](app/Store.tsx) | 29,644 | Line 1 | LOW |

## Recommended Approach

### Phase 1: Incremental Fixes (Recommended)
Instead of removing @ts-nocheck all at once, refactor files incrementally:

1. **Extract typed components** from each file
2. **Create type definitions** for the main interfaces
3. **Gradually enable TypeScript** section by section
4. **Add to CI/CD** type checking pipeline

### Phase 2: Automated Analysis
Run TypeScript compiler to identify errors:
```bash
cd rez-app
npx tsc --noEmit --skipLibCheck app/EventPage.tsx 2>&1 | head -100
```

### Phase 3: Fix Strategy
For each file:
1. Remove @ts-nocheck
2. Run `npx tsc --noEmit` to see errors
3. Fix errors in batches
4. Test thoroughly

## Estimated Effort
- EventPage.tsx: 2-3 days
- BookingsPage.tsx: 2 days
- StoreListPage.tsx: 1-2 days
- CardOffersPage.tsx: 1-2 days
- Store.tsx: 1 day

**Total: 7-11 days of focused work**

## Quick Wins (Can Do Now)

### 1. Add Strict TypeScript Config
Create `tsconfig.strict.json` for gradual migration:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. Add Type Coverage to CI
```yaml
# .github/workflows/type-check.yml
- name: Type Check
  run: npx tsc --noEmit --skipLibCheck
```

### 3. Create Type Definition Files
Start by extracting types from each file into separate `.types.ts` files.

## Files Extracted Types
The following type files should be created to support migration:

### EventPage.tsx types
- `types/event.types.ts` - EventItem, EventCategory, etc.
- `types/booking.types.ts` - BookingSlot, EventBooking, etc.

### BookingsPage.tsx types
- `types/booking.types.ts` - Booking, BookingStatus, etc.
- `types/store.types.ts` - StoreBooking, TableBooking, etc.

### StoreListPage.tsx types
- `types/store.types.ts` - Store, StoreCategory, etc.
- `types/search.types.ts` - SearchFilters, SortOptions, etc.

## Status
⚠️ Pending - Requires dedicated sprint to complete
