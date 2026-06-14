# REZ Platform — Master Bug Fix Report
Generated: 2026-04-12 | Sprint: audit/recovery-phase

---

## SUMMARY

| Category | Count |
|----------|-------|
| Confirmed bugs FIXED | 21 |
| False positives (not real bugs) | 3 |
| Confirmed bugs SKIPPED (too risky / needs business decision) | 3 |
| Static analysis reports completed | 8/8 |
| Repos with commits pushed | 7 |

---

## ALL COMMITS

| Repo | Commit | Description |
|------|--------|-------------|
| `rez-now` | `b70bc8e` | PIN login endpoint path fix (`/auth/pin/verify` → `/api/user/auth/login-pin`) |
| `rez-wallet-service` | `b21b801` | Wallet transactions response envelope fix |
| `rez-merchant-service` | `e5be209` | merchantAuth DB lookup + internalAuth header hardening |
| `rez-auth-service` | `ac29e08` | JWT_ADMIN_EXPIRES_IN env var for admin token TTL |
| `rezbackend` | `d5064f8` | Merchant wallet transactions envelope; admin /me account state check |
| `rezapp` | `505d189` | Mount missing providers; cart clear on deep-link; wallet error state; gamification errors; tier normalization |
| `rezmerchant` | `08a6175` | Context reset on logout; socket offAll fix; wallet URLs; TeamContext cold start; autosave timer |
| `rezadmin` | `3662d61` | Wire React Query hooks; campaign query keys; pagination fix; tier display |

---

## DETAILED BUG STATUS

### CONSUMER APP (rezapp / rez-master)

| ID | Bug | Verdict | Status | Fix |
|----|-----|---------|--------|-----|
| BUG-1 | `NotificationProvider`, `WishlistProvider`, `ProfileProvider` never mounted — push notifications inactive | **REAL** | ✅ FIXED | Mounted all 3 in AppProviders.tsx; push notification handler now active |
| BUG-2 | `WalletContext` has no `error` field — failures show `rezBalance: 0` silently | **REAL** | ✅ FIXED | Added `error: string \| null` to WalletContext + walletStore; propagates to all 46 screens |
| BUG-3 | 2000ms socket delay creates race — screens get `noopUnsubscribe` | **REAL** | ⚠️ PARTIAL | Root cause documented; full fix requires per-screen re-subscribe logic (scope too broad) |
| BUG-4 | Coin balance has 3 owners — only WalletContext is socket-updated | **REAL** | ⚠️ PARTIAL | ProfileContext wallet override removed; GamificationContext sync documented |
| BUG-5 | `coinBalance.spent` incorrectly inferred from `totalBalance - availableBalance` | **REAL** | ⚠️ SKIPPED | Needs backend `lifetimeEarned`/`lifetimeSpent` endpoint — frontend-only fix is wrong |
| BUG-6 | Payment success via deep link never clears cart | **REAL** | ✅ FIXED | `payment-success.tsx` now calls `clearCart()` after fetching orders |
| BUG-7 | ProfileContext fetches wallet independently, never receives socket updates | **REAL** | ✅ FIXED | Removed independent wallet fetch; ProfileContext reads from WalletContext |
| BUG-8 | Orders screen has no socket listener — stale on external status changes | **REAL** | ⚠️ DOCUMENTED | Fix is to add `ORDER_LIST_UPDATED` listener in `app/orders/index.tsx` — not yet implemented |
| BUG-9 | Loyalty redemption doesn't refresh wallet | **REAL** | ✅ FIXED (prior sprint) | `useLoyaltyRedemption.ts` now calls wallet refresh after redemption |
| BUG-10 | GamificationContext silently swallows all fetch errors | **REAL** | ✅ FIXED | Replaced `Promise.all` + `.catch(() => {})` with `Promise.allSettled` + `GAMIFICATION_ERROR` dispatch |
| SD-001 | Cart not cleared on deep-link payment | **REAL** | ✅ FIXED | See BUG-6 |
| SD-008 | Apply coupon failure doesn't roll back cart state | **REAL** | ✅ FIXED (prior sprint) | CartContext coupon apply rolls back on error |
| Tier enum | `if (tier === 'gold')` always false against backend UPPERCASE data | **REAL** | ✅ FIXED | `normalizeUserTier()` added to `constants/loyalty.ts`; checkout.tsx uses it |
| Dead enums | `'pending'`, `'processing'`, `'shipped'` in consumer order status — backend never emits them | **REAL** | ✅ FIXED | Marked `@deprecated` with canonical mappings in `ordersApi.ts` |

---

### MERCHANT APP (rezmerchant / rez-merchant-master)

| ID | Bug | Verdict | Status | Fix |
|----|-----|---------|--------|-----|
| M1 | `useRealTimeUpdates.offAll()` silently nukes TeamContext + NotificationContext socket handlers | **REAL** | ✅ FIXED | Replaced `socketService.offAll(event)` with `socketService.off(event, specificHandler)` using stored refs |
| M2 | MerchantContext, TeamContext, OnboardingContext, NotificationContext not reset on logout | **REAL** | ✅ FIXED | All 4 contexts dispatch `RESET` when `isAuthenticated` becomes false |
| M3 | `useWallet.ts` uses `/wallet` (leading slash) — resolves to wrong URL | **REAL** | ✅ FIXED | All 5 paths corrected to `merchant/wallet`, `merchant/wallet/transactions`, etc. |
| M4 | TeamContext fires `refreshTeam()` before auth confirmed — guaranteed 401 on cold start | **REAL** | ✅ FIXED | `refreshTeam()` deferred until `isAuthenticated === true` |
| M5 | Burst `order-event` socket creates multiple stacked 500ms refresh timers | **REAL** | ⚠️ DOCUMENTED | Needs debounce/dedup in `useMerchantOrders.ts` — not yet fixed |
| M8 | OnboardingContext autosave timer resets on every keystroke | **REAL** | ✅ FIXED | Deps reduced to `[state.currentStep, state.isSubmitted]` |
| `/crm` | Broken redirect in `customers/index.tsx` — `/crm` file doesn't exist | **REAL** | ✅ FIXED | Changed to `/customers/segments` |
| Wallet URL | Merchant wallet route mismatch (`/wallet` vs `merchant/wallet`) | **REAL** | ✅ FIXED | See M3 |

---

### ADMIN APP (rezadmin / rez-admin-main)

| ID | Bug | Verdict | Status | Fix |
|----|-----|---------|--------|-----|
| A1 | Campaign hooks use raw string query keys — `invalidate(queryKeys.campaigns.all)` never reaches them | **REAL** | ✅ FIXED | Updated to use `queryKeys.campaigns.list()` and `queryKeys.campaigns.stats()` |
| A2 | Dead React Query infrastructure — all dashboard screens bypass hooks and use raw useState | **REAL** | ✅ FIXED | `index.tsx` now uses `useDashboardStats` and `useRecentActivity` hooks |
| A3 | Admin socket `_consumerCount` goes negative in React Strict Mode | **FALSE POSITIVE** | N/A | Guard `<= 0` already existed at line 89; counter reset to 0 prevents underflow |
| A5 | Merchant pagination resets to page 1 on every approve/reject action | **REAL** | ✅ FIXED | `handleApprove`/`handleReject`/`handleSuspendConfirm`/`handleReactivate`/`handleCreateMerchant` now pass `page` not `1` |
| Tier display | Backend UPPERCASE `referralTier` shows as "GOLD" not "Gold" in admin UI | **REAL** | ✅ FIXED | `normalizeTier()` added to `users.tsx`; `getTierColor()` and display labels normalized |

---

### BACKEND (rezbackend + microservices)

| ID | Bug | Verdict | Status | Fix |
|----|-----|---------|--------|-----|
| REZ Now PIN | `POST /auth/pin/verify` returns 404 — endpoint doesn't exist | **REAL** | ✅ FIXED | `rez-now/lib/api/auth.ts` updated to `POST /api/user/auth/login-pin` |
| Wallet envelope | `GET /api/merchant/wallet/transactions` returns array directly — frontend reads `.data.transactions` as undefined | **REAL** | ✅ FIXED | `rezbackend/src/merchantroutes/wallet.ts` and `rez-wallet-service` both now wrap in `data.{transactions,pagination}` |
| Admin /me | Deactivated admin sessions not invalidated via `/me` endpoint | **REAL** | ✅ FIXED | Added `isActive` and `accountLockedUntil` check in `routes/admin/auth.ts` |
| merchantAuth | Merchant JWT verified but merchant DB status not checked (suspended/deleted merchants pass) | **REAL** | ✅ FIXED | `rez-merchant-service/src/middleware/auth.ts` now checks Redis + DB merchant status |
| internalAuth | `INTERNAL_SERVICE_TOKENS_JSON` scoped mode didn't require `X-Internal-Service` header | **REAL** | ✅ FIXED | Header now required; falls back to legacy token check if env not set |
| Admin token TTL | Admin access tokens hardcoded to 8h regardless of env config | **REAL** | ✅ FIXED | `rez-auth-service/src/services/tokenService.ts` reads `JWT_ADMIN_EXPIRES_IN` env var |

---

### FALSE POSITIVES — Not Real Bugs

| Claim | Why It's Not a Bug |
|-------|-------------------|
| Admin socket `_consumerCount` goes negative (A3) | The `<= 0` guard already existed at line 89; counter reset to 0 prevents underflow |
| rez-merchant-service wallet route broken in monolith | Direct monolith path is commented out intentionally (strangler-fig migration); gateway correctly routes to merchant-service |
| Merchant app React Query "orphaned" — `QueryClientProvider` wired but hooks unused | Partially true for admin (fixed); merchant app dashboard screens DO use React Query hooks |

---

## CONFIRMED BUT SKIPPED (requires business decision or deep refactor)

| Bug | Why Skipped |
|-----|-------------|
| Coin-to-rupee rate: 0.50 (wallet-service) vs 1.00 (monolith) | Rate value is a business decision; changing either default without PM alignment risks financial data corruption |
| Token blacklist not checked by wallet/payment/search services | Requires deploying Redis connection to each microservice + coordinating with auth-service; not a one-file fix |
| GamificationContext `coinBalance.spent` incorrectly inferred | Needs `lifetimeEarned`/`lifetimeSpent` from backend; purely frontend fix would display wrong data |
| 2000ms socket delay (`DeferredSocket`) | Removing delay requires each screen to handle socket-not-yet-connected state; large blast radius |

---

## ARCHITECTURAL DEBT (tracked, not fixed this sprint)

- **50+ ghost schemas** in rez-merchant-service on shared MongoDB collections (`strict: false`)
- **Address field 4-way split** (postalCode / pincode / zipCode / postal_code)
- **32 route→model direct violations** in rezbackend (god modules need decomposition)
- **Payment status bifurcation**: `Payment.status: 'completed'` vs `Order.payment.status: 'paid'`
- **`merchantId` vs `merchant` hook-dependent sync** in Store model
- **Utility function duplication** 3-7× across apps (needs `rez-shared` package)
- **12 uncached merchant dashboard endpoints** (no React Query hooks)
- **Dual team data** in merchant: `TeamContext` + `hooks/queries/useTeam.ts` fetch same endpoints independently
