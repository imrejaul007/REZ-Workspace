# REZ Consumer App - Audit Execution Plan

**Generated:** April 25, 2026
**Audit Scope:** TypeScript/Build, Security, Performance, API/Data Flow, UI/Components, Architecture
**Technical Debt:** ~185-275 hours

---

## Phase 1: Critical Fixes (Week 1-2)

### 1.1 Type Safety - Eliminate `as any` casts

**Priority:** CRITICAL
**Estimate:** 40-60 hours
**Files:** 250+

**Actions:**
- [ ] Create TypeScript interfaces for all API responses
- [ ] Replace `as any` casts with proper typed responses
- [ ] Add response type validation utilities

**Key Files:**
| File | Casts | Priority |
|------|-------|----------|
| `hooks/useStoreDiscovery.ts` | 12 | P1 |
| `hooks/useRecommendations.ts` | 8 | P1 |
| `services/productApi.ts` | 6 | P1 |
| `hooks/usePaymentFlow.ts` | 5 | P1 |
| `app/PostDetailScreen.tsx` | 4 | P2 |

---

### 1.2 Console.log Elimination

**Priority:** CRITICAL
**Estimate:** 20-30 hours
**Files:** 250+

**Actions:**
- [ ] Replace all `console.log/error/warn/debug` with centralized logger
- [ ] Add ESLint rule to fail on console.* usage
- [ ] Audit scripts for debugging statements

**Key Offenders:**
| File | Statements | Priority |
|------|-------------|----------|
| `scripts/test-bill-upload-integration.ts` | 87 | P2 |
| `scripts/test-api-connection.ts` | 56 | P2 |
| `utils/priceFormatter.ts` | 39 | P1 |
| `utils/ratingFormatter.ts` | 38 | P1 |

---

### 1.3 Client-Side Payment Security Fix

**Priority:** CRITICAL (Financial Risk)
**File:** `hooks/usePaymentFlow.ts`

**Actions:**
- [ ] Mark TODO(F01-FINANCIAL) as critical backlog
- [ ] Ensure server-side payment amount validation
- [ ] Add amount verification endpoint

```typescript
// Line 166-174: Client-side calculation must be server-verified
// TODO(F01-FINANCIAL): amountToPay is computed client-side
```

---

## Phase 2: High Priority Fixes (Week 2-4)

### 2.1 Performance - Pagination & Lists

**Priority:** HIGH
**Estimate:** 30-40 hours
**Files:** 51+

**Actions:**
- [ ] Add `onEndReached` to all FlatList/FlashList components
- [ ] Add `getItemLayout` for fixed-height rows (49+ files)
- [ ] Implement `windowSize={5}` for large lists
- [ ] Add `removeClippedSubviews={true}`

**Files Missing Pagination:**
| Screen | List Type | Priority |
|--------|-----------|----------|
| `app/orders/index.tsx` | FlatList | P1 |
| `app/wallet-history.tsx` | FlatList | P1 |
| `app/feed/index.tsx` | FlatList | P1 |
| Travel screens (7 files) | FlatList | P1 |

---

### 2.2 Performance - Memory Leaks

**Priority:** HIGH
**Estimate:** 15-25 hours
**Files:** 10+

**Actions:**
- [ ] Add cleanup for `setInterval` in billUploadQueueService
- [ ] Add cleanup for `setInterval` in performanceMetricsService
- [ ] Fix Network listener cleanup in enhancedApiClient
- [ ] Implement destroy() methods for services

**Files with setInterval:**
```typescript
// services/billUploadQueueService.ts:790
this.syncInterval = setInterval(...); // Missing cleanup

// services/performanceMetricsService.ts:390
this.memoryMonitoringInterval = setInterval(...); // Missing cleanup
```

---

### 2.3 API - Error Handling

**Priority:** HIGH
**Estimate:** 15-20 hours
**Files:** 5+

**Actions:**
- [ ] Change `Promise.all()` to `Promise.allSettled()` in usePaymentFlow
- [ ] Add error feedback in autoOptimize catch block
- [ ] Fix race conditions in useStoreDiscovery effects
- [ ] Add loading state per fetch in useRecommendations

**Critical Fix - usePaymentFlow.ts:**
```typescript
// Line 217-229: Change Promise.all to Promise.allSettled
const results = await Promise.allSettled([
  storePaymentApi.getCoinsForStore(storeId),
  storePaymentApi.getEnhancedPaymentMethods(storeId, billAmount),
  // ...
]);

// Handle partial failures gracefully
```

---

### 2.4 Architecture - Duplicate Utilities

**Priority:** HIGH
**Estimate:** 8-12 hours

**Actions:**
- [ ] Consolidate 4 retry utilities into single `/utils/retry.ts`
- [ ] Deprecate: `retryStrategy.ts`, `retryLogic.ts`, `retryPolicy.ts`, `requestRetry.ts`
- [ ] Create unified retry interface with all features

**Current State:**
| File | Lines | Features |
|------|-------|----------|
| `retryLogic.ts` | 415 | Exponential backoff, jitter |
| `requestRetry.ts` | 554 | Comprehensive retry logic |
| `retryPolicy.ts` | 95 | RETRY_* constants |
| `retryStrategy.ts` | 100+ | Retry strategies |

---

### 2.5 Architecture - Large Files

**Priority:** HIGH
**Estimate:** 80-120 hours
**Files:** 688 over 500 lines (29 over 1000 lines)

**Actions:**
- [ ] Split files over 2000 lines (10 files - Phase 2)
- [ ] Split files over 1000 lines (30 files - Phase 3)
- [ ] Split files over 500 lines (688 files - Phase 4+)

**Top 10 Critical Files:**
| File | Lines | Suggested Split |
|------|-------|----------------|
| `DynamicCategoryPage.tsx` | 2,732 | CategorySections, CategoryFilters, CategoryGrid |
| `categoryData.ts` | 2,648 | Move to API or data package |
| `wishlistApi.ts` | 2,290 | Split by endpoint groups |
| `realOffersApi.ts` | 2,094 | Split by feature |
| `(tabs)/index.tsx` | 2,007 | Extract sections to components |
| `social-impact/[id].tsx` | 1,947 | Split by content sections |
| `earn-from-social-media.tsx` | 1,910 | Extract post types |
| `EventPage.tsx` | 1,901 | Split by event types |
| `booking.tsx` | 1,865 | Split by booking flow steps |
| `wallet-screen.tsx` | 1,827 | Split by wallet features |

---

## Phase 3: Medium Priority (Week 4-8)

### 3.1 UI - Toast Migration

**Priority:** MEDIUM
**Estimate:** 10-15 hours
**Files:** 30+

**Actions:**
- [ ] Replace all `Alert.alert()` with `showToast()`
- [ ] Create Toast migration script
- [ ] Add Toast for async operation feedback

**Files Using Alert.alert:**
```typescript
// app/help/index.tsx (lines 206, 221, 224, 232)
// app/travel/hotels/checkout.tsx (lines 130, 175, 193, 195)
// app/sign-in.tsx (lines 224, 238, 268)
// ... 30+ more
```

---

### 3.2 UI - Accessibility

**Priority:** MEDIUM
**Estimate:** 20-30 hours
**Files:** 12+

**Actions:**
- [ ] Add `accessibilityRole="button"` to TouchableOpacity components
- [ ] Add `accessibilityLabel` for all interactive elements
- [ ] Ensure 44x44 touch targets
- [ ] Add accessibility to Quick Actions

**Files Needing Accessibility:**
```typescript
// components/payments/TipSelector.tsx
// app/(tabs)/finance.tsx
// app/coins.tsx
// app/qr-checkin.tsx
// ... 12+ more
```

---

### 3.3 UI - Loading States

**Priority:** MEDIUM
**Estimate:** 15-20 hours
**Files:** 7+

**Actions:**
- [ ] Add SkeletonLoader to travel/booking screens
- [ ] Add EmptyState components where missing
- [ ] Add ErrorBoundary to unwrapped screens

**Files Missing Skeletons:**
```typescript
// app/cab/[id].tsx
// app/bus/[id].tsx
// app/train/[id].tsx
// app/hotel/[id].tsx
// app/flight/[id].tsx
// app/package/[id].tsx
// app/bookings/index.tsx
```

---

### 3.4 API - Query Keys Standardization

**Priority:** MEDIUM
**Estimate:** 15-20 hours
**Files:** 15+

**Actions:**
- [ ] Standardize all query keys to use `queryKeys` factory
- [ ] Update mutations to invalidate properly
- [ ] Add type-safe query key helpers

**Inconsistent Pattern:**
```typescript
// Bad - inline key
queryKey: ['products', 'related', productId]

// Good - centralized
queryKey: queryKeys.products.related(productId)
```

---

### 3.5 Architecture - Hardcoded Data

**Priority:** MEDIUM
**Estimate:** 10-15 hours

**Actions:**
- [ ] Remove `categoryDummyData.ts` (61.4 KB)
- [ ] Remove `offersPageDummyData.ts` (33.3 KB)
- [ ] Move hardcoded data to API or config package
- [ ] Add lint rule to prevent large data files

---

## Phase 4: Low Priority (Week 8-12)

### 4.1 Code Quality - Unused Imports

**Priority:** LOW (Auto-fixable)
**Estimate:** 2-4 hours (with ESLint auto-fix)

**Actions:**
- [ ] Run ESLint with `--fix` for unused imports
- [ ] Review remaining unused variables manually
- [ ] Add pre-commit hook to catch unused imports

---

### 4.2 Code Quality - Raw Colors

**Priority:** LOW
**Estimate:** 30-50 hours
**Files:** 100+

**Actions:**
- [ ] Replace raw hex colors with design tokens
- [ ] Update Colors constants with missing colors
- [ ] Add ESLint rule to enforce design tokens

---

### 4.3 Architecture - Context Splitting

**Priority:** LOW
**Estimate:** 30-40 hours

**Actions:**
- [ ] Split CartContext by concerns (state, analytics, offline)
- [ ] Split AuthContext if over 500 lines
- [ ] Document context ownership

---

### 4.4 Test Coverage

**Priority:** LOW
**Estimate:** 40-60 hours

**Actions:**
- [ ] Add E2E tests for critical flows (cart, checkout, payment)
- [ ] Add unit tests for untested services
- [ ] Increase coverage for retry utilities

---

## Execution Summary

| Phase | Priority | Estimate | Focus |
|-------|----------|----------|-------|
| 1 | Critical | 60-90h | Type safety, console.log, payment security |
| 2 | High | 120-160h | Performance, error handling, architecture |
| 3 | Medium | 70-95h | UI/UX, accessibility, query keys |
| 4 | Low | 100-150h | Code quality, tests, context splitting |
| **Total** | | **350-495h** | |

---

## Quick Wins (First Week)

1. **Fix Promise.all in usePaymentFlow** - 2 hours
2. **Add Toast to top 10 screens** - 3 hours
3. **Fix autoOptimize error swallowing** - 1 hour
4. **Add cleanup to billUploadQueueService** - 2 hours
5. **Consolidate retry utilities** - 4 hours

**Quick Win Total:** ~12 hours, high impact

---

## Risks & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes in API types | High | Add migration guide |
| Large file refactoring conflicts | Medium | Incremental PRs |
| Test coverage gaps | Medium | Add tests in parallel |
| Performance regressions | High | Benchmark before/after |

---

## Definition of Done

- [ ] 0 critical issues remaining
- [ ] TypeScript: 0 `as any` casts
- [ ] Logging: 0 console.log statements
- [ ] Performance: All lists have pagination
- [ ] Memory: 0 unclosed intervals/listeners
- [ ] Security: Payment amounts server-verified
- [ ] Architecture: Top 10 files under 1000 lines
