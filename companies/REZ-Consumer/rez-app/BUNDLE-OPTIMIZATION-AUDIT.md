# ReZ App - Bundle Optimization & Test Coverage Audit

**Date:** 2026-05-15  
**Status:** ACTION REQUIRED

---

## 1. Bundle Size Analysis

### Problem: 704 Screens, Most Over 1000 Lines

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Total Screens | 704 | 200-300 | ❌ TOO MANY |
| Largest Screen | 2,007 lines | <500 lines | ❌ TOO LARGE |
| Avg Screen Size | ~500 lines | <300 lines | ⚠️ HIGH |
| Screens >1000 lines | 30+ | 0 | ❌ TOO MANY |

### Top 10 Largest Screens (CRITICAL)

| Screen | Lines | Issue |
|--------|-------|-------|
| `(tabs)/index.tsx` | 2,007 | Home feed - needs splitting |
| `social-impact/[id].tsx` | 1,947 | Social impact |
| `earn-from-social-media.tsx` | 1,903 | Social earning |
| `EventPage.tsx` | 1,901 | Events page |
| `wallet-screen.tsx` | 1,894 | Wallet - needs splitting |
| `deals/[campaignId]/[dealIndex].tsx` | 1,882 | Deals page |
| `booking.tsx` | 1,865 | Booking |
| `store-visit.tsx` | 1,783 | Store visit |
| `online-voucher.tsx` | 1,744 | Voucher |
| `store/[id].tsx` | 1,633 | Store details |

---

## 2. Screen Bloat Issues

### Root Causes

1. **Monolithic screens** - All logic in single file
2. **No component extraction** - UI + business logic mixed
3. **Massive hooks** - Custom hooks not extracted
4. **No lazy loading** - All components loaded upfront
5. **Huge data files** - `categoryData.ts` (2,648 lines!)

### Files >1000 Lines

```
app/(tabs)/index.tsx                    2,007
app/social-impact/[id].tsx              1,947
app/earn-from-social-media.tsx           1,903
app/EventPage.tsx                       1,901
app/wallet-screen.tsx                   1,894
app/deals/[campaignId]/[dealIndex].tsx  1,882
app/booking.tsx                         1,865
app/store-visit.tsx                     1,783
app/online-voucher.tsx                  1,744
app/store/[id].tsx                      1,633
app/account/cashback.tsx                1,623
app/account/coupons.tsx                 1,613
app/profile/partner.tsx                 1,595
app/booking/appointment.tsx             1,562
app/offers/[id].tsx                    1,554
app/wishlist.tsx                       1,544
app/explore.tsx                         1,544
app/product-page.tsx                    1,532
```

---

## 3. Bundle Optimization Plan

### Phase 1: Critical Fixes (Week 1)

#### 3.1 Split Largest Screens

**Priority 1: Home Tab (index.tsx - 2,007 lines)**

```typescript
// BEFORE: Single file with everything
// app/(tabs)/index.tsx

// AFTER: Modular structure
app/(tabs)/index.tsx                           // Main container
app/(tabs)/index/components/
├── HomeHeader.tsx                            // Header component
├── FeaturedCarousel.tsx                       // Featured deals
├── CategoryQuickLinks.tsx                    // Category grid
├── FlashDealsSection.tsx                    // Flash deals
├── NearbyStoresSection.tsx                   // Nearby stores
├── TrendingProductsSection.tsx               // Trending
├── SponsoredBanner.tsx                        // Ads banner
└── BottomLoader.tsx                          // Lazy loading
```

**Priority 2: Wallet Screen (1,894 lines)**

```typescript
app/wallet-screen.tsx                         // Container
app/wallet/components/
├── BalanceCard.tsx                          // Balance display
├── QuickActions.tsx                          // Pay, Send, etc.
├── TransactionList.tsx                       // Transactions
├── ReferralCard.tsx                         // Referrals
├── SavingsGoals.tsx                          // Savings
└── CoinHistory.tsx                          // Coin system
```

#### 3.2 Extract Large Data Files

```typescript
// BEFORE: data/categoryData.ts (2,648 lines!)
// AFTER:
data/categories/
├── constants.ts                             // Static constants
├── mappings.ts                             // Type mappings
└── seeds/                                   // Seed data
    ├── electronics.ts
    ├── fashion.ts
    └── food.ts
```

#### 3.3 Lazy Load Routes

```typescript
// app/_layout.tsx
const SocialImpact = dynamic(() => import('./app/social-impact/[id]'), {
  loading: () => <Skeleton />,
});
```

---

## 4. Test Coverage Analysis

### Current State

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Files | 116 | 300+ | ❌ LOW |
| Services | 255 | - | - |
| Services with Tests | ~20 | 200+ | ❌ LOW |
| Coverage | ~15% | 60%+ | ❌ CRITICAL |

### Missing Tests (Critical Services)

| Service | Status |
|--------|--------|
| `cartApi.ts` | ❌ No test |
| `orderApi.ts` | ❌ No test |
| `paymentService.ts` | ❌ No test |
| `walletApi.ts` | ❌ No test |
| `authApi.ts` | ❌ No test |
| `searchApi.ts` | ❌ No test |

### Test Structure Recommendation

```
__tests__/
├── unit/
│   ├── services/
│   │   ├── cartApi.test.ts
│   │   ├── orderApi.test.ts
│   │   └── paymentService.test.ts
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useCart.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── checkout.test.ts
│   └── auth.test.ts
└── mocks/
    └── apiMock.ts
```

---

## 5. Action Items

### Bundle Optimization Checklist

- [ ] Split `app/(tabs)/index.tsx` into components
- [ ] Split `app/wallet-screen.tsx` into components
- [ ] Split `app/EventPage.tsx` into components
- [ ] Split `app/booking.tsx` into components
- [ ] Extract `data/categoryData.ts` into modular structure
- [ ] Implement lazy loading for heavy routes
- [ ] Add dynamic imports for modals
- [ ] Tree-shake unused icon imports
- [ ] Optimize image loading with lazy components

### Test Coverage Checklist

- [ ] Add tests for `cartApi.ts`
- [ ] Add tests for `orderApi.ts`
- [ ] Add tests for `paymentService.ts`
- [ ] Add tests for `walletApi.ts`
- [ ] Add tests for `authApi.ts`
- [ ] Add tests for `searchApi.ts`
- [ ] Add integration tests for checkout flow
- [ ] Add integration tests for auth flow
- [ ] Add hook tests for `useAuth`, `useCart`
- [ ] Set up CI/CD test pipeline

---

## 6. Quick Wins

### Bundle Size

1. **Icon optimization** - Only import used icons
```typescript
// BEFORE
import { Ionicons } from '@expo/vector-icons';

// AFTER
import HomeIcon from '@expo/vector-icons/build/Ionicons';

2. **Image optimization**
```typescript
// Lazy load images
const HeavyImage = React.lazy(() => import('./HeavyImage'));
```

3. **Route-based splitting** (Expo Router does this automatically)

### Tests

1. **API mocking**
```typescript
// __tests__/mocks/apiMock.ts
export const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
};
```

2. **Factory functions**
```typescript
// __tests__/factories/order.ts
export const createMockOrder = (overrides = {}) => ({
  id: 'order-1',
  status: 'pending',
  total: 100,
  ...overrides,
});
```

---

## 7. Estimated Impact

| Optimization | Bundle Reduction | Effort |
|--------------|-----------------|--------|
| Split top 10 screens | 30-40% | High |
| Lazy load routes | 15-20% | Medium |
| Tree-shake icons | 5-10% | Low |
| Extract data files | 10-15% | Medium |
| **Total** | **50-60%** | - |

---

## 8. Next Steps

1. **Create screen-splitting PR** - Focus on top 5 largest screens
2. **Add critical tests** - 10 most-used services
3. **Set up coverage reporting** - Add to CI/CD
4. **Monitor bundle size** - Track in each PR

---

**Owner:** Development Team  
**Target:** Q2 2026 (June 30, 2026)
